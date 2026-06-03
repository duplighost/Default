# No Moon v310 — full playtest-fix pass

_Build: `qual.v310-full-playtest-fixes.2026-06-03.v310`, stacked on the shipped v307
finished-release build._

Drop-in zip: `qualiacology-no-moon-v310-full-playtest-fixes.zip` (+ `.sha256.txt`).
Unzip its contents to the site root; verify live with `noMoonCurrentBuild()`.

v310 combines the genuinely-working fixes from two earlier passes and adds real
fixes for the two bugs that were still open. It does **not** carry the phantom
claims from the standalone v309 zip (see below).

## The six fixes

| # | Issue | What v310 does | How |
|---|-------|----------------|-----|
| 2 | Boss ground circles | Removed the dead anti-kite marker attack | `__maybeBossMarker` early-returns (base edit, from v308) |
| 5 | Sun/shade health | Continuous sunlight: open sun builds heat, shade is safe (no day/night cycle) | `roomBrightAmount39` returns a constant for open path rooms (base edit, from v308) |
| 3 | "+max HP" item | Reduced the hidden pressure penalty (none until floor 8; -1 fl 8-9; -2 fl 10) | `pressurePenaltyForIndex` (base edit, from v308) |
| 1a | Map looks different across runs | One stable minimap renderer (no run-dependent overlays) | replaces `drawDungeonMinimap` (install block, ported from the v309 audit) |
| 1b | Door "coating" after clear | Forecast glyphs hidden once a room is cleared | `drawDoorForecasts` early-returns when `room.cleared` (base edit, new) |
| 4 | Map vanishes after a boss | Map suppression now needs a LIVE boss or a genuinely-open draft | strict `bossActive`/draft checks in `drawHUD` (base edit, new) |

## Why this exists (vs. the standalone v309 zip)
The separately-uploaded `v309` zip advertised five fixes but only implemented two
(boss-marker suppression + the stable minimap). Verified in headless:
- its `liveBoss308`/`draftOpen308` helpers were **dead code** (the map-after-boss
  fix was never wired in),
- it had **no** sun-meter, door-forecast, or `drawHUD` changes, and
- being built on v307, it **dropped** the v308 sun (#5) and max-HP (#3) fixes
  (sun cycle and full penalty were back).

v310 keeps v309's one genuine new contribution (the stable minimap) and implements
the rest for real.

## Verified (headless Chromium, dev build for hooks)
- Boots clean, **0 console/page errors**; build tag consistent (`state.buildTag`,
  `noMoonCurrentBuild()`, `noMoonV310Debug()`, on-screen tag, `<html>` attr).
- Three-copy invariant holds; `node --check` passes; shipped zip has the v307 hook
  strip intact (no dev tools shipped).
- #3: live max-HP formula matches the reduced penalty (fl 6/7 = full, 8 = -1, 10 = -2).
- #5: in a real sun path room, brightness is constant 0.85 (no cycle); open light
  builds the heat meter and shade drains it (confirmed live on v308 code, unchanged here).
- #2: boss marker hazards no longer spawn.
- #1a: the stable minimap renders every frame with no errors.
- #4: **logic proven** — a dead-but-not-removed boss releases the map under the new
  gate (`deadBoss_newGate_hides:false`) while a live boss still hides it
  (`liveBoss_newGate_hides:true`); the old gate kept it hidden (`true`).
- Ending/route intact: shrine handoff -> sun path, `_v39MoonPathActive:true`, no
  win-flash / no ending-stomp.

## Honest caveats
- #4 and #1b are fixed by construction + the logic test above; the *original*
  in-game symptoms couldn't be reproduced headlessly (a real floor-boss death and a
  saved-wins combat-room clear are hard to drive without playing), so a quick
  on-device confirmation is worth doing.
- #1b assumes the "coating" is the door forecast glyphs (both prior analyses agreed);
  if it's a different visual, send a screenshot and I'll retarget it.
- Sun pace is deliberately gentle; easy to tune up on request.
