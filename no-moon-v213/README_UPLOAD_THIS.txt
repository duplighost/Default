# No Moon v213 — Mobile-Safe + Teleporter Fix (on top of v212)

Build tag: `qual.mobile-safe-teleporter-fix.2026-05-15.v213`
Service worker cache: `no-moon-mobile-safe-teleporter-fix-v213`

This is v212 with two real bugs fixed that a verification pass on v212
surfaced.

## What v213 fixes

### Bug 1: drawLowHpPulse running expensive gradient on mobile

Where: `Feel.drawLowHpPulse` in the v212 patch.

Symptom: on mobile, when the player's HP drops (e.g. after taking an
explosion hit), the screen flashes heavily. This is what the user
reported.

Cause: the function calls `ctx.createRadialGradient()` every single
frame while HP is at or below 25% (or while a recent damage pulse is
active). Radial gradients are significantly more expensive than
simple fills on mobile GPUs. The render cost compounded with whatever
particle work was already happening, leading to perceived flashing
and slowdown.

Fix: gate the function on `NM.lite`. On mobile lite mode it returns
immediately — the engine's existing `state.flash` red damage flash is
still visible, we just stop adding our radial-gradient pulse on top.

### Bug 2: First teleporter (normal door) refused to fire after a clear

Where: `Doors.armNormalGuards` and `Doors.blockTransition` in v212.

Symptom: the user reported "the first teleporter disappeared and
didn't work." The door was visually there, but walking into it did
nothing.

Cause: v210/v211/v212 included a guard meant to prevent the engine
from auto-transitioning you if a door opened directly under you. The
guard fired on every `setRoomCleared` event and checked whether the
player was overlapping any door. If yes, it armed a guard on that
door that refused the next `tryDoorTransition` until the player
stepped off and came back.

The actual gameplay: players routinely fire the killing shot from
near the exit door. The room clears, the door becomes active, the
player walks into the door — and v212 silently refused the
transition. The door looked broken.

Fix: `armNormalGuards` is now a no-op. `blockTransition` always
returns false. Any pre-existing guards in save state are cleared on
the first transition attempt. The guard for the Starless secret-biome
doors (a separate function, `guardStarless`) is unaffected — those
DO have an auto-warp-when-spawned-on-player problem and still need
the guard.

### Bug 3: Hazards.tickHoming was ungated on lite mode

Where: `Hazards.tickHoming` in v212.

Symptom: minor inconsistency, not user-visible.

Fix: added a `NM.lite` early return. Cheap fix for consistency.

## Everything else from v212 is unchanged

- Auto-detect mobile via touch + small viewport or mobile UA
- Lite mode gates on Hazards.drawGlyphs, Feel.tickActiveSlowMo
  rings, Bosses.captureCleanse mote cap, Bosses.draw motes loop,
  HUD.drawEnemyIntent
- All v211 progression fixes (Progress module, SunRoute multi-mirror
  save, RespawnBrake, etc.)
- All QA helpers (noMoonQA*)

## Manual override

```js
noMoonSetLiteMode(true)    // force lite mode on
noMoonSetLiteMode(false)   // force lite mode off
noMoonIsLite()             // current state
```

## Console checks (paste after hard refresh)

```js
state.nmSelfTest()
state.nmDebug()
noMoonIsLite()
noMoonQARunSmokeTest()
```

Expected:
- `state.nmSelfTest().ok === true`
- `noMoonIsLite()` is `true` on phone, `false` on desktop
- `noMoonQARunSmokeTest().ok === true`

## Manual test for the teleporter fix

1. Hard refresh after deploy.
2. Start a run. Enter the first combat room.
3. Stand near the exit door.
4. Kill the last enemy from that position.
5. **Immediately walk into the door without stepping away first.**
6. The door should transition you to the next room. (Before v213, it
   would silently refuse.)

## Upload

Drop the contents of the zip into the Netlify site root, preserving
folders. Hard refresh after deploy.
