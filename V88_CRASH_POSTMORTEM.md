# v88 boot-crash post-mortem (for Pro / next session)

## STATUS: ROOT CAUSE FOUND BY PRO (mid-investigation)

Pro identified the bug while I was still narrowing it down:

> "the Drowned Sun Codex repair was triggering its own DOM mutation loop"

That matches the `repairCodexBossDeck86` (v86 line 48685) and `repairCodex87` (v87 line 49100) functions. Each:

1. Observes `codexOverlay` with `MutationObserver { childList: true, subtree: true, characterData: true }`
2. On any mutation, calls its repair function
3. The repair function then writes inside the observed subtree: `card.innerHTML = …`, `countEl.textContent = …`, `grid.appendChild(card)`, `card.dataset.* = …`, `card.className = …`, `card.setAttribute(…)`
4. Each write fires the observer → repair runs again → more writes → observer fires → infinite hot DOM-mutation loop → frozen tab

The `repairingCodex86` re-entrance flag does not save it because MutationObserver callbacks are **microtask-deferred**: the flag is already `false` by the time the observer fires for the writes the function just made.

**v87 made it worse**: same observer pattern installed a second time on the same `codexOverlay`. Both observers fire on each mutation. Both call their repair functions. Mutations cascade across observers.

**Fix when re-adding**: any in-overlay DOM writer that's also being observed needs to `mo.disconnect()` before writing and `mo.observe(target, opts)` after, OR set a stable re-entrance flag that survives microtasks (clear it with `setTimeout(..., 0)`), OR skip the observer entirely and trigger from the relevant render entrypoints only (v81's pattern, which works).

## Symptom

Alex's report on `no-moon-v88-totality-final-netlify-hardening`:

- Game page loads but title screen never appears
- Descend button does nothing when clicked
- "The website crashes on the game"

## What was tried, what was inconclusive

### Static analysis (no smoking gun)

- `node --check` on both `game_inline.js` and `index.html`'s embedded `<script>`: both PASS. Not a syntax error.
- Inline-vs-external script: byte-near-identical (off by 2 leading newline bytes, which is the v75-era cosmetic drift; functionally unchanged).
- All required DOM IDs present in `index.html` (game, overlay, overlayTitle, startBtn, etc.).
- Service worker parses, asset list intact.
- File ordering and `<script>` placement: same as v83 (script after `<canvas id="game">`, before `</body>`).

### Headless execution (could not reproduce)

- vm.runInContext with Proxy mocks: ran clean, 0 errors. Proxy mocks mask all DOM-style null-deref because they return safe values for everything.
- jsdom (29.1.1) `runScripts: 'dangerously'`: **hung indefinitely.** Suspect: one of v84-v88's `setInterval` re-stamp timers + `MutationObserver` + canvas calls is producing an infinite loop or never-resolving promise in jsdom's environment. jsdom is a fragile target for canvas-heavy code.

So I can describe the surfaces that look suspicious but cannot point to the line that's failing in a real browser without a real browser repro.

## Surfaces in v85-v88 that are suspicious enough to investigate first

Listed in priority order — most likely to be the culprit first.

### 1. Triple-wrapped `state.bullets.push` via `Object.defineProperty`

v86 (line 48650), v87 (line 49061), and v88 (line 49426) each do:

```js
const basePush = arr.push;
Object.defineProperty(arr, '__v86BulletGuard', { value: true, configurable: true });
Object.defineProperty(arr, '__v86BasePush', { value: basePush, configurable: true });
arr.push = function pushV86() { … return basePush.apply(this, arguments); };
```

Three nested wraps. Each calls `normalizeBullet8X(b)` per push. Each of those calls a regex test + iterates string properties. **For a bullet-heavy frame (boss phase 3 sweep ray fires 18 bullets at once), every push runs 3 nested normalize calls.**

Also: each `Object.defineProperty(arr, '__vXBulletGuard', { ... })` on a native array can throw in some engines if the array has been frozen, sealed, or has a prototype that disallows symbol/property additions. Should be fine on a fresh `[]`, but if `state.bullets` is mutated to a sealed/non-extensible array somewhere, `defineProperty` throws TypeError.

**Hypothesis to test**: comment out v87 and v88's `guardBulletArray` calls (keep v86 only) and see if the game boots. If yes, the triple-wrap is the bug.

### 2. v87 `setRoomCleared` bypass guard

v87 line 48961 wraps `setRoomCleared`:

```js
setRoomCleared = function setRoomClearedV87(level, room) {
  try {
    if (room && room._v77MajorBossDefeated && isCustomVictoryRoom87(room) && !room._v87AllowStandardClear) {
      … // BYPASS path: skips base setRoomCleared entirely for Sun/Drowned rooms
      return room;
    }
  } catch (e) { log87(e, 'custom setRoomCleared guard'); }
  return baseSetRoomCleared87.apply(this, arguments);
};
```

The bypass path mutates `room.cleared = true`, `level.cleared = true`, `state.enemies = level.enemies`, etc. If `level` is null on entry (called too early?), the `if (level) level.cleared = true` guard handles it but `level.currentRoom === room` check later doesn't (it's still guarded by `if (level && …)`). So it's defensive.

BUT — `isCustomVictoryRoom87` reads `room._v77MajorBossId`, `room._v39SunDefeated`, etc. If any of those produce truthy on a NON-custom room (e.g., a fresh starless approach room with `_v79DrownedSky` set to true at init), the bypass fires when it shouldn't. Bellway exit never activates.

**Hypothesis to test**: log every `isCustomVictoryRoom87` call's return value during a fresh game start. If the title-screen path indirectly calls setRoomCleared and the bypass fires unexpectedly, that's the bug.

### 3. v86 document-capture handlers for reroll

v86 line 48616-48618:

```js
document.addEventListener('pointerdown', handleReroll86, { capture: true, passive: false });
document.addEventListener('click', handleReroll86, { capture: true, passive: false });
```

`handleReroll86` calls `ev.target.closest(...)` with a long selector. If `ev.target` is somehow not an Element (Text node? Document?), `closest` throws. v86 wraps that lookup in try/catch (in `rerollButton86`), so it returns null and handleReroll86 returns. Looks safe.

But: clicks on `#startBtn` go through `document` first → handleReroll86 fires → `rerollButton86` returns null → returns without preventing. Then the click bubbles to startBtn. Should fire normally.

**Hypothesis to test**: temporarily disable v86's document handlers and see if descend works.

### 4. `repairTouchAim87` runs on every frame

v87 line 49072-49087. Called from updateGame pre-base. Each frame it reads `input.aimTouch`, computes `Math.atan2(touch.dy, touch.dx)`, and writes `state.player.aimAngle`. Inside try/catch.

If `state.player` is null on title screen (game not started yet), `state.player.aimAngle = …` throws → caught by the surrounding try/catch on `try { repairTouchAim87(); guardBulletArray87(); } catch (_) {}`. Safe.

But: this fires every frame even when not in play mode. Wasted work; not a crash.

### 5. v85 `setRoomCleared` re-fire approach

v85 finalizes by setting `room.cleared = false` then calling `setRoomCleared` (line 48329-48344). For boss rooms only. Once `state.mode !== 'play'`, the audit loop in v85's updateGame wrap doesn't fire (line 48401 gates by `state.mode === 'play'`). So this doesn't run on title.

### 6. Endless `setTimeout(tag, 350)` chains

v84-v88 each register 3-5 `setTimeout(tagXX, …)` calls plus v84 has a `setInterval` for 24 ticks. Combined: ~25+ scheduled callbacks all stamping the build tag. Innocuous but noisy.

## Verification path Pro should take

1. Open the v88 build in a real browser with DevTools open.
2. Watch the Console tab for the **first uncaught exception** during page load — that's the smoking gun.
3. Watch the Network tab for any 404s on assets that might be referenced at boot.
4. If the title screen never appears, try `state` in the console:
   - `typeof state` — if `undefined`, the outer game IIFE crashed; check line 1 of stack trace.
   - `state.buildTag` — if missing the `.v88` suffix, an install IIFE crashed before assigning its tag.
   - `noMoonV88Debug()` — if not a function, v88's install crashed.
5. If `state.buildTag` is e.g. `.v86` but not `.v87`, the crash is in v87's install.

If Pro narrows it to a single IIFE, the next move is to comment out that IIFE's install block and confirm boot.

## v89 recovery shipped

While Pro debugs v88, I shipped v89 as a known-working baseline:

- **Stack**: v76 → v82 (Claude) → v83 (Pro hardening) → v84 (Claude follow-up fixes) → v89 (version bump only)
- **Skipped intentionally**: Pro's v85, v86, v87, v88
- **Build tag**: `qual.recovery-from-v88-crash.2026-05-14.v89`
- **SW cache**: `no-moon-recovery-from-v88-crash-v89` (forces fresh cache on Alex's browser, drops the broken v88 cache)
- **Zip**: `/releases/no-moon-v89-website.zip`

v89 boots cleanly (verified `node --check` and the v82-era surfaces).

## What Pro's v85-v88 had that v89 is missing

These are real improvements that should be re-added once the crash is found:

1. **v85 "set cleared=false then call setRoomCleared" approach** for boss-room fixing. Cleaner than my v84's "if exit.active is false after kill, run cascade" because it lets the cascade itself handle ordering. (Functionally equivalent in practice — my v84 works.)
2. **v86 reroll fallback** via document-capture handler. Catches rerolls regardless of which version of the button is rendered. My v84 just nulls the v78 `onpointerdown` — narrower fix.
3. **v86 / v87 `chooseDifferent` improvements** that reach into `ITEM_POOL` to force a different card set on small pools (my v8 audit listed this as edge case #8).
4. **v87 `closeCustomVictoryExit` + `chargeCustomDrownedClear`** — gives Nadir / Moots a Boon-Anchor / Boon-Moots charge for clearing Drowned Sky rooms (which bypass setRoomCleared by design).
5. **v87 / v88 bullet `radius` ↔ `r` normalization** — handles bullets that v82's Black Anchor checks for `r > 12` but were pushed with `radius` instead. Defensive.
6. **v88 self-test infrastructure** (`state.v88SelfTest()`) — runs synthetic bullets / fake rooms through the wraps to confirm they still work.

When Pro returns, these are worth porting **one IIFE at a time** with `state.vXXDebug()` confirmation that each IIFE's install ran to completion before adding the next.
