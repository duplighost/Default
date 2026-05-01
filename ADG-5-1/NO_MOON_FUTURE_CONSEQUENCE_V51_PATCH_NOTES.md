# No Moon v51 — Boss / mini-boss message staggering

**Build tag:** `qual.future-consequence.2026-05-01.v51`
**Service worker cache:** `no-moon-future-consequence-v51`
**Base:** v50 Disable external MP3, restore procedural BGM

## The bug

When bosses and mini-bosses die, several messages fire in a 3-5 second window:

- Kill text ("The Warden breaks apart")
- Boss-defeat ceremony stage 1 (~2 s after kill)
- "Bellway open — enter when ready" (~5 s after kill)
- Item proc messages (Black Lotus blooms, Threadbare Reliquary recharges, etc.)
- Achievement unlocks
- Moonkey / Sunkey drop messages
- V30 / V31 final whispers if applicable

The drawMessages lane system stacks them vertically, but a 4-message stack appearing in the same 1.5 seconds before they fade is unreadable. V43 already coalesces messages that match its bossText regex during a 3.2-second window, but the allowlist (SUNKEY, MOONKEY, BOON MOOTS, etc.) and various non-bossText messages still pass through.

## The fix

V51 adds **temporal staggering** to large messages. Messages with `size >= 18` (the threshold pushMessage already uses for "readable") are queued if another large message was dispatched within `MIN_LARGE_SPACING` seconds. The queue is drained one message per frame, gated by the same spacing.

Small messages (HUD chips, item-proc tiny text, "+1 integrity" etc. — `size < 18`) bypass the queue and pass through immediately. They never piled up to begin with.

### How it works

```js
if (!isLarge) return basePushMessage(...);   // small → pass through

if (queue.length === 0 && (now - lastDispatchAt) >= MIN_LARGE_SPACING) {
  lastDispatchAt = now;
  return basePushMessage(...);                // first large after gap → pass through
}

// Otherwise queue
queue.push({ text, color, size, duration, y });

// updateMessages drains one per frame, gated by same spacing
```

Boss kill flow now:

```
t=0.0s   "THE WARDEN FALLS"     ← V43 coalesced label, V51 passes through
t=0.55s  (next queued large)
t=1.10s  (next queued large)
…
```

instead of:

```
t=0.0s   "THE WARDEN FALLS"
t=0.0s   "Black Lotus blooms in the cleared room"
t=0.5s   "Achievement: Hundred Teeth"
t=2.0s   "The Warden drops the keys"     ← V43 might suppress
t=5.0s   "Bellway open — enter when ready"
```

## Config

```js
state.v51MessageStaggerSystem.config.ENABLED              // default true
state.v51MessageStaggerSystem.config.MIN_LARGE_SPACING    // default 0.55 (seconds)
state.v51MessageStaggerSystem.config.LARGE_SIZE_THRESHOLD // default 18
state.v51MessageStaggerSystem.config.MAX_QUEUE_LENGTH     // default 8
state.v51MessageStaggerSystem.config.USE_GAMETIME         // default true (state.time, not wall)
```

`USE_GAMETIME = true` means the queue uses `state.time`, which is paused during draft / shrine / overlays. So if you're staring at a draft card, queued messages don't tick by. They drain once gameplay resumes.

## Wrap chain

V51 wraps three globals:

- **`pushMessage`**: outermost wrap (now 9 deep). Decides queue vs pass-through.
- **`updateMessages`**: only one wrap before V51, so this is wrap #2. Drains queue one-per-frame.
- **`startGame`**: clears the queue at run start so a mid-kill death doesn't bleed messages into the next run.

V51's wraps are positioned outermost (latest) so they decide first. The queue dispatches via `basePushMessage51` which is the chain of all earlier wraps (V43 coalescer, V32 tribal vocab, V37 wall clarity, etc.) — so queued messages still get the same processing as immediate ones.

## What stays the same

- Small messages (size < 18) like "+1 integrity", "Guard cracked", "Moon Debt 2: trespass" pass through immediately. No delay.
- V43's boss-text coalescer still runs. It's now downstream of V51 — when V51 dispatches, V43 sees the message normally.
- Order of messages is preserved (FIFO queue).
- All existing message text and styling are unchanged.
- Combat balance, item tuning, narrative, visuals, save format: unchanged.

## Edge cases

| Scenario | Behavior |
|---|---|
| Player dies during boss kill | startGame wrap clears the queue at next run start |
| Tab is hidden during boss kill | `USE_GAMETIME` means the queue doesn't drain while hidden; messages dispatch when player returns. |
| 9+ messages fire at once (rare) | Queue caps at 8; oldest queued message is dropped (logged in `stats.droppedFull`). |
| Large message has duration 1.0s, gets queued for 2s | It still displays for its full 1.0s after dispatch — the time field starts at 0 when it lands in `state.messages`. |

## Validation

- `node --check` extracted inline game JS: PASS
- `node --check /no-moon/no-moon-sw.js`: PASS
- `node --check root no-moon-sw.js`: PASS
- v51 build tag at V51 IIFE constant + final assignment.
- `pushMessage` wrap count: 9 (was 8 before V51).
- `updateMessages` wrap count: 1 (was 0 wraps, just the original definition).

## Manual playtest priorities

1. Title build tag reads `qual.future-consequence.2026-05-01.v51`.
2. Find any mini-boss (False Moon, Spiggot, Lien) and kill it. Watch the kill messages — they should appear sequentially, ~half a second apart, instead of all at once.
3. Beat the Graven Warden mid-boss (floor 4). Same expected behavior.
4. Beat the Null Archon final boss. Same.
5. The "Bellway open — enter when ready" message should still appear after the boss-defeat ceremony, just spaced out from earlier messages.
6. (Console check)

```js
state.v51Debug();
// expect:
//   stats: { passedThrough: <small msgs>, queued: <count>, dispatched: <total>, droppedFull: 0 }
//   queueLength: 0  (during normal play, briefly higher during boss death)
```

If messages still pile up after V51:
- Try lowering `MIN_LARGE_SPACING` (e.g., to 0.4) — faster pace but may overlap again.
- Try lowering `LARGE_SIZE_THRESHOLD` to 16 — catches more messages.
- Or raise `MIN_LARGE_SPACING` to 0.7 — slower pace, more readable.

You can tweak these at runtime in devtools without a code change:
```js
state.v51MessageStaggerSystem.config.MIN_LARGE_SPACING = 0.7;
```

## Rollback

If V51 makes the message flow feel sluggish or breaks something:

- Disable at runtime: `state.v51MessageStaggerSystem.config.ENABLED = false;` then BGM OFF/ON or restart.
- Hard revert: delete the `installV51MessageStagger` IIFE, revert build tag and SW cache to v50. Other v46-v50 fixes stay.
