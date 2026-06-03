# No Moon v308 — boss-circle / sun-light / max-HP fixes

_Build: `qual.v308-boss-marker-off-sun-continuous-hp-ease.2026-06-03.v308`, stacked on the
shipped v307 finished-release build._

Drop-in website zip: `qualiacology-no-moon-v308-boss-marker-sun-hp-fixes.zip`
(+ `.sha256.txt`). Unzip its contents to the site root. Verify live in the browser
console with `noMoonCurrentBuild()`.

## What changed (3 fixes, all from player-reported issues)

### 1. Boss "marker-drop" circles removed
- **Symptom:** large rings appeared on the ground during boss fights (when you
  stood back from the boss) that never hurt you and piled up.
- **Cause:** the boss marker attack (`__maybeBossMarker`) created a one-shot pulse
  hazard with `interval:999, delay:0.65, activeTime:0.32`. The damage/active test is
  `(age + delay) % interval < activeTime` → `(age + 0.65) < 0.32`, which is never
  true, so the ring rendered but never entered its damage window. They also never
  expired (capped at 16), so they accumulated.
- **Fix:** `__maybeBossMarker` early-returns (attack disabled), per the request to
  remove them rather than make them bite.
- **Not touched:** the sun-boss phase-1 *seal* circles you stand in to advance the
  fight are a separate system (`_v39SunSeals` / `updateSunSeals39`).
- **Verified:** A/B in headless Chromium — old v307 spawns the marker hazard
  (`peakMarkers:1`); v308 spawns none (`peakMarkers:0`), no errors, boss loop intact.

### 2. Sun light is continuous (no day/night cycle)
- **Symptom:** in the sunny biome the "stay out of the sun" health drain barely
  worked / felt like it only happened "the first time."
- **Cause:** `roomBrightAmount39` ran a ~6.2s light cycle (~2s bright, ~3s dark).
  The heat meter drained during the dark gaps faster than it filled during the bright
  window, so outside the (constant-light) throne room it almost never reached the
  damage threshold.
- **Fix:** the open path rooms are now continuously lit (`return 0.85`), so standing
  in open sun steadily fills the meter (~1 HP every ~2-3s) and shade drains it (safe).
  The sun-throne keeps its own phase-based brightness; entry rooms stay safe.
- **Side effects examined:** `roomBrightAmount39` also feeds sun-touched enemy speed
  (faster in light / slower in shade) and the screen overlay — both stay consistent
  with "sun = dangerous, shade = safe." Non-sun biomes are unaffected (the function
  still returns 0 for them).
- **Verification note:** this is a deterministic 1-line constant; the throne room is
  the existing proof that constant light reliably damages. The live combat-room heat
  could not be driven in headless (the room-transition + safe-haven systems keep
  resetting a forced non-entry room), so on-device confirmation is recommended.

### 3. Hidden max-integrity "pressure" penalty reduced
- **Symptom:** the "+1 max HP" graft (Hull Weave) looked like it did nothing on the
  deeper floors.
- **Cause:** `pressurePenaltyForIndex` silently subtracted max integrity (−1/−2/−3 on
  floors 6/8/10). A +1 graft on those floors just cancelled the hidden −1, with no
  on-screen message.
- **Fix:** reduced to **no penalty until floor 8**, then −1 on floors 8-9 and −2 on
  floor 10. The graft now visibly works on floors 6-7.
- **Verified:** live max-HP formula matches the new values (floors 6/7 = full, 8 = −1,
  10 = −2).

## Verified at v308 (headless Chromium)
- Boots clean, no console/page errors; build tag consistent across `state.buildTag`,
  `noMoonCurrentBuild()`, `noMoonV308Debug()`, the on-screen tag, and the `<html>` attr.
- Three-copy invariant holds (`index_script.js` == `no-moon/game_inline.js`; inline
  `<script>` in `no-moon/index.html` matches). `node --check` passes on all copies.

## Still open (reported, not yet fixed — need a real-run repro)
- **Map vanishes after defeating a boss** (user confirms: all bosses). The boss is
  removed correctly; likely the post-boss reward-draft flag or the minimap once the
  floor is flagged cleared. Needs a driven boss fight to pin.
- **Door "coating" that only appears on later runs** (not the first playthrough).
  The every-run door-forecast glyphs and floor scars are confirmed present on run 1,
  so this is a separate, win-gated layer that couldn't be reproduced headlessly.

## How it was built
Edited `no-moon/game_inline.js`, synced the three copies (the §3 recipe), `node --check`,
ran the headless verifications above, then zipped the site root.
