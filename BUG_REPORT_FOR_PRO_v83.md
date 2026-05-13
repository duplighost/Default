# No Moon — bug report on top of v83 (for Pro)

Audit of `/tmp/v83_website/v83_release/no-moon/game_inline.js` (v83 pro-hardened build). Pro is already aware of the reroll button + the "boss deaths clear too many things" issue — this report **confirms the exact root cause** of those two, plus adds **5 additional bugs** I found that Pro hasn't flagged.

All line numbers are against `game_inline.js` in `94c06611-nomoonv83prohardenedwebsite.zip`.

---

## CRITICAL (softlocks / progression-breaking)

### 1. Boss-death over-clear → exit door never activates → softlock + missing starless approach

**Confirmed root cause (this is the user-reported one).**

`makeMajorBossRoomSafe77` at **line 43235** sets `room.cleared = true` and `state.level.cleared = true` **directly** at line 43242–43243, bypassing the global `setRoomCleared(level, room)` function at line 8287.

Then back in killEnemy at **line 9013-9015**:

```js
if (!room.cleared && state.enemies.length === 0) {
  setRoomCleared(level, room);
}
```

The `!room.cleared` guard now fails because v77 already set it. So `setRoomCleared` **never runs**.

`setRoomCleared` is the function that does ALL of these in one place (lines 8287-8295):
- `room.exit.active = true` — without this, the breach door doesn't open and the player is **softlocked in the room**.
- Triggers `playBellwaySound()` + `pushMessage('BELLWAY CLEAR' / 'THRONE SHATTERED')` — neither happens.
- Triggers v71's `setRoomCleared` wrap at line 41643 which calls `installStarlessApproachFromWarden71(level, room)`. **THIS is where the secret wall door + the Ferry Dock teleporter get installed.** Skipped entirely when Warden dies via v77's path.
- Triggers v68's `setRoomCleared` wrap at line 40471 which calls `chargeBoon(room.hasBoss ? 3 : 1)`. **Moots' Boon Moots active gets no charge for boss-room clears.**

**Affected bosses**: any boss whose typeId hits `isMajorBoss77()` — `warden`, `archon`, `sunCore`, `v59NightFerry`, `v80DrownedSun`. So this softlock-potential exists at every major boss room.

**Why the user noticed it on Warden specifically**: Warden room is the gateway to the v71 Starless route. With the v71 wrap not firing, the secret wall door and Ferry teleporter never spawn. From the user's perspective the room "got cleared too hard."

**Suggested fix shape (for Pro)**:

Inside `makeMajorBossRoomSafe77`, instead of setting `room.cleared = true` directly, call:

```js
if (!room.cleared && typeof setRoomCleared === 'function') {
  setRoomCleared(state.level || level, room);
}
```

before the rest of the cleanup. Then the standard cleared-room cascade fires (exit activates, v71/v68 wraps run), and v77's additional hazard/trap cleanup runs on top. Watch out: `setRoomCleared` pushes the "BELLWAY CLEAR" message, which is loud but correct. v77's existing message-suppression on the next frame should hide it if undesired.

---

### 2. Reroll button doesn't fire click — `preventDefault` on `pointerdown` cancels the click cascade

**Confirmed root cause (the other user-reported one).**

`redrawStarTradeWidget78` at **line 43933** binds two handlers on the reroll button at **line 43952–43959**:

```js
btn.onclick = function (e) {
  try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
  if (btn.disabled) return;
  v78Reroll();
};
btn.onpointerdown = function (e) {
  try { e.preventDefault(); e.stopPropagation(); } catch (_) {}    // ← this kills the click
};
```

Calling `preventDefault()` inside a `pointerdown` handler on a `<button>` **cancels the synthetic click event from firing** on iOS Safari and most modern desktop browsers. Result: pointerdown gets handled, click never fires, `v78Reroll()` is never called. Stars never spend, cards never change.

This is why "I had more than 5 stars and it didn't do anything" — the click never reached the button.

**Suggested fix**: delete the `btn.onpointerdown` handler entirely. The id-based separation from v76's old delegated handler (`#v78RerollBtn` vs `[data-v76-star-action="reroll"]`) already prevents the old broken v76 handler from triggering. The pointerdown preventDefault is doing zero useful work and actively breaking the click.

---

### 3. Black Anchor trivializes boss fights — no boss bullets actually set the flags v82 checks

`tickBlackAnchors82` at **line 47419-47426** tries to skip "boss-class" bullets:

```js
for (const b of state.bullets) {
  if (!b || b.owner !== 'enemy') continue;
  if (b.bossBeam || b.sunRay || b.majorHazard) continue;  // ← never true
  if (b.r && b.r > 12) continue;                          // ← rarely true
  // ... slow the bullet
}
```

**No code in the game sets `b.bossBeam`, `b.sunRay`, or `b.majorHazard`.** Confirmed via `grep`. These flags were aspirational — never wired in.

The `r > 12` fallback also doesn't help: Drowned Sun phase 3 sweep rays at **lines 44539 / 45760 / 45797** are pushed with `r: 4.6` and `r: 4.4`. The Sun route's quote-strike rays are wider but use a separate hazard path, not `state.bullets`.

Net effect: **Black Anchor slows all enemy projectiles inside its radius without exception**, including boss bullet patterns and sweep rays from the Drowned Sun. Trivializes the v80 boss fight, especially phase 3.

**Suggested fix**: either tag boss bullets with one of those flags when they're spawned (search for the 3 `state.bullets.push` sites in v80's `tickV80DrownedSun` and add `bossSource: true`) AND update the v82 check, or skip slowing entirely if `state.enemies.some(e => e.boss && !e.remove)` — i.e., make the active "control vs. mooks", never "control vs. bosses".

---

## HIGH (gameplay-affecting, not softlocks)

### 4. Black Anchor placement broken on touch — `input.mouse` never updates on mobile

`aimTargetWorld82` at **line 47322** computes the anchor target from `input.mouse.x` and `input.mouse.y`.

`input.mouse` is only updated by `mousemove` (line 2763) and `mousedown` (line 2768) on the canvas. Touchscreens don't fire mouse events. `input.mouse` is initialized to `{ x: W * 0.5, y: H * 0.5, seen: false, ... }` at line 1403 and stays at the canvas center on mobile.

My fallback at line 47336-47340 catches `(mx === 0 && my === 0)` but **not** the case where mouse defaults to `(W/2, H/2)`. So on mobile, **the Black Anchor always places at screen center**, regardless of where the player is aiming.

The player's touch-driven aim lives at `state.player.aimAngle` (driven by `input.aimTouch` in the touch handlers at lines 2820-2845). v82 should fall back to that on touchscreens.

**Suggested fix**: in `aimTargetWorld82`, detect "no mouse seen" via `!input.mouse.seen` OR `typeof input.aimTouch !== 'undefined' && input.aimTouch.id !== null` (touch active). If either, use `p.aimAngle` + a fixed offset (e.g., 200 px ahead of the player) instead of mouse position.

---

### 5. Codex boss card count text desyncs when the deck re-renders

`renderBossGuide71` at **line 41113** rebuilds the entire deck HTML, computing `count}/${BOSS_CARDS71.length} revealed` from the closure-local array (still 6 cards).

`appendDrownedSunBossCard81` at **line 46776** DOM-appends a 7th card and parses+rewrites the count text via regex `(\d+)\s*\/\s*(\d+)\s+revealed`.

The order works only IF v81's wrap fires AFTER v71's render. v81's wrap of `openCodex` / `renderCodexStats` is outer of v71's, so it does run after. **But** if v71's `renderBossGuide71` is called from elsewhere (it's called internally on some unlock events without going through `openCodex`/`renderCodexStats`), v71 re-renders the 6-card grid with "X/6 revealed", and v81's append + count-rewrite doesn't fire. Result: deck briefly shows "6/6 revealed" with 6 cards until next codex open.

**Suggested fix**: instead of relying on the wrap firing after each render, use a `MutationObserver` on the codex panel that re-appends + re-writes whenever `.v71BossGrid` mutates. Or expose a function on `state` that v81 wraps + v71 can call from its render internals.

---

### 6. v75 `evidence75('moots')` still has the deepest-floor false-unlock path

**Line 42475** (and similar in v75's evidence chain): `num(s.highestBiomeReached) >= 10` is treated as evidence Moots is unlocked. But `state.stats.deepest = max(prev, levelIndex + 1)`, so just *entering* the final boss room (levelIndex 9) bumps `highestBiomeReached` to 10 — even if the player dies immediately.

v78's `scrubMootsUnlock78` cleans up after v75 each save write (it requires `lifetime.wins > 0 || victories.routeClears > 0 || achievements.wins_1.unlocked`). So the false unlock doesn't persist visually — the card stays locked.

**But**: in the brief window between v75 normalize and v78 scrub, `save.unlockedCharacters.moots` is `true` in memory. Any code that reads it during that window sees the wrong state. Pro's v83 `normalizeDefaultUnlocks83` doesn't touch moots (it only scrubs non-moots/non-vesper/non-nadir), so this remains an open contract violation.

Low risk. Worth fixing for symmetry by deleting the `highestBiomeReached` check inside `evidence75('moots')`.

---

### 7. Major-boss rooms never grant a Boon Moots charge (downstream of bug #1)

v68's `setRoomCleared` wrap at **line 40471** calls `chargeBoon(room.hasBoss ? 3 : 1)` only when its wrap fires. Because bug #1 prevents `setRoomCleared` from firing on major boss kills, **clearing a major boss room as Moots gives zero charge progress**.

Fix is automatic once bug #1 is fixed.

---

## MEDIUM (real but minor)

### 8. v78 chain still risks "stars deducted, cards visually unchanged" on tiny item pools

`v78ChooseDifferent` at **line 43859** tries 8 times to roll a distinct card set. If `chooseRandomItems(count)` keeps returning the same set (very small item pool or skewed weights), the function falls back to ONE MORE call to `chooseRandomItems(count)` and returns it — which can also be the same set.

Result on small pools: stars deduct, `state.draft.cards` is reassigned to a new array but with identical contents, cards render visually identical. Player thinks reroll did nothing.

The pool is probably large enough in practice that this is rare. But once bug #2 (reroll click) is fixed, watch for this edge case in playtest.

**Suggested fix**: if the 8-try loop fails, force the new set to differ by at least one item — swap one card with a guaranteed-different pick (`chooseRandomItems(count + 1).find(id => !oldKey.includes(id))`).

---

### 9. v83's `normalizeDefaultUnlocks83` is over-eager about future characters

**Line 47930-47935** scrubs any character that isn't rook/nyx/sol/mire/moots/vesper/nadir back to `false`. The intent is to prevent unknown future characters from being granted by accident.

But if Pro (or a future build) ever adds an 8th character — say an 'echo' Passenger — v83 would silently lock it forever after install, regardless of any unlock condition that build wires up. Will look like a regression bug "8th character is broken."

Fix when an 8th character lands: either expand `STARTERS83` / explicit-allow set, or move the scrub into a more nuanced "if no known unlock condition exists for this id" check.

---

## Verification commands (after Pro's next build)

```js
// Boss-death over-clear smoke test:
noMoonV71ForceWardenApproach()    // jump to Warden room
noMoonV71TestClearRoom()           // kill warden
// After: state.level.rooms[currentRoomId].exit.active  -> should be true
//        state.level.rooms[currentRoomId]._v71StarlessDoors  -> should be installed

// Reroll smoke test (after the onpointerdown fix):
noMoonV80ForceEnter()              // get into Drowned Sky
// pick up a draft (clear a room)
noMoonV76GrantStars(20)
// click the reroll button — cards should change, stars should drop by 5

// Black Anchor non-trivializing boss check:
noMoonV81UnlockNadir()             // unlock nadir
// start a new run as Nadir
noMoonV80ForceEnter()
noMoonV82ChargeAnchor()
// fight Drowned Sun phase 2/3 with anchor placed in front
// Confirm: rays/rings should NOT slow inside the anchor radius
```

---

## Priority for Pro's next pass

1. **Bug #1** (boss-death over-clear) — softlock potential, fix first
2. **Bug #2** (reroll preventDefault) — one-line fix, immediate UX win
3. **Bug #4** (mobile Black Anchor placement) — mobile users get a broken active
4. **Bug #3** (anchor vs. boss bullets) — balance fix; may need playtest before committing to a direction
5. **Bug #5** (codex count desync) — cosmetic but visible
6. **Bug #6, #8, #9** — defer, address when convenient
