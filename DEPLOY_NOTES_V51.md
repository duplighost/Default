# Deploy Notes — No Moon v51

## Build

- Game build tag: `qual.future-consequence.2026-05-01.v51`
- Game service-worker cache: `no-moon-future-consequence-v51`
- Base: v50 Disable external MP3, restore procedural BGM

## What v51 is

Boss / mini-boss message staggering. When bosses die, multiple messages fire in a 3-5 second window and pile up unreadably. V51 queues large messages (size >= 18) and drains them one at a time with ~0.55 s spacing, so the player sees them sequentially.

Small messages (HUD chips, "+1 integrity", "Guard cracked", item tooltips) pass through immediately — they never piled up.

See `NO_MOON_FUTURE_CONSEQUENCE_V51_PATCH_NOTES.md` for full details.

## Cache note

Service-worker cache bumped to `no-moon-future-consequence-v51`. Activate handler will delete prior `no-moon-*` caches.

## Quick live checks

1. Title build tag reads `…v51`.
2. Kill a mini-boss (False Moon, Spiggot, Lien) — boss messages should appear one at a time, not all at once.
3. Beat the Warden mid-boss — same.
4. Beat the Null Archon — same.
5. "Bellway open — enter when ready" still appears after the ceremony, just no longer competing with earlier messages.

## Tuning at runtime (devtools console)

```js
// Tighter pace (messages appear faster, but may overlap again)
state.v51MessageStaggerSystem.config.MIN_LARGE_SPACING = 0.4;

// Looser pace (more readable, but boss death feels longer)
state.v51MessageStaggerSystem.config.MIN_LARGE_SPACING = 0.75;

// Catch more messages (size >= 16 instead of 18)
state.v51MessageStaggerSystem.config.LARGE_SIZE_THRESHOLD = 16;

// Disable entirely (revert to original behavior)
state.v51MessageStaggerSystem.config.ENABLED = false;
```

These don't persist across reloads — refresh and they're back to defaults.

## Debug

```js
state.v51Debug();
// stats.passedThrough = small msgs that bypassed queue
// stats.queued = total queued
// stats.dispatched = total shown (immediate + dequeued)
// stats.droppedFull = times queue overflowed (8+ pending)
// queueLength = current backlog
```

## Rollback

To revert v51:
1. Set `state.v51MessageStaggerSystem.config.ENABLED = false;` for runtime test.
2. Or delete the V51 IIFE and revert build tag + SW cache to v50.

Each pass is independently revertable. Other v46-v50 fixes are untouched.

## What didn't change

- All v46-v50 fixes preserved.
- Message text content, colors, sizes, durations: unchanged.
- V43's boss-text coalescer still runs (downstream of V51).
- Combat, narrative, visuals, save: unchanged.
