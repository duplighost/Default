# No Moon v214 — Verified + Min-Visuals (on top of v213)

Build tag: `qual.verified-min-visuals.2026-05-15.v214`
Service worker cache: `no-moon-verified-min-visuals-v214`

This is v213 plus five fixes from a deep pre-deploy verification pass,
including TWO independent shots at killing the mobile flashing you've
been seeing.

## Why this exists

You told me to fix more things before you deploy again. I ran a hard
verification pass on v213 and found three real bugs and two minor
gaps. Also added two new diagnostic / A-B-test tools so we can
isolate the flashing if it persists.

## What v214 changes

### 1. Hit-feedback cooldown (probable flashing fix)

`Feel.onPlayerHit()` previously fired on every single `damagePlayer()`
call. If a hazard ticks multiple times per frame, or you take damage
from multiple sources at once, the function fires multiple times per
frame. Each call bumps `state.flash = 0.55`. The engine decays flash
slowly. Multiple bumps faster than decay = persistent flash that
visually pulses. **That's the flashing.**

v214 caps the hit feedback to at most once per 0.20s. The first hit
of a damage burst fires the slow-mo + red flash + shake; the next
N calls within 200ms are no-ops. Damage still applies; the FX just
stops compounding.

### 2. Min-visuals A/B test mode

If v214's cooldown still doesn't fix the flashing, you can toggle ALL
of my draw additions off in one shot:

```js
noMoonSetMinVisuals(true)
```

When on, nothing v210+ added renders: no damage numbers, no HUD
chips, no hazard color glyphs, no low-HP pulse, no pickup labels, no
active banner, no room state chip, no boss cleanse FX, no active-cast
ring flourish. **Gameplay logic is unchanged.**

If you toggle this on and the flashing STOPS, it was one of mine.
Send me which effect you re-enable that brings it back and I'll fix
that one specifically. If flashing CONTINUES with min-visuals on,
it's the base v99 engine's own particle system and the fix has to be
elsewhere.

```js
noMoonSetMinVisuals(false)    // back to normal
noMoonIsMinVisuals()          // current state
```

### 3. startGame ordering fix

v213 reset per-run flags AFTER the base startGame ran. If the engine
read a stale `_v80InDrownedSky` during its own init, decisions could
get locked in. v214 resets BEFORE base startGame runs.

### 4. Module state leaks plugged

`Feel.damageNumbers`, `Feel.lowHpPulse`, `Feel.activeFlashSeen`,
`Feel.pickupTracker`, `Bosses.fxList` are all explicitly cleared on
every `startGame`. v213 let them persist across runs.

### 5. QA destructive functions now require explicit opt-in

In v213, calling `noMoonQAKillDrownedSun()` permanently wrote
`drownedSun = true` to your save and unlocked Nadir. If you (or
anyone with console access) called it by mistake, your save was
silently invalidated.

In v214, those destructive QA functions return an error unless you
first call:

```js
noMoonQAEnable()
```

The non-destructive helpers (`noMoonQAGotoDrownedSky`,
`noMoonQAKillRoom`, etc.) still work without it. Only the ones that
write to save (`noMoonQAKillDrownedSun`, `noMoonQATouchColdLantern`,
`noMoonQARunSmokeTest`) require the opt-in.

```js
noMoonQADisable()         // turn it back off
noMoonQAIsEnabled()       // check
```

### 6. HUD.drawPickupLabels lite gate

Minor consistency fix. The pickup name labels weren't gated on lite
mode like the other HUD draws. Now they are.

## Console summary

```js
state.nmSelfTest()        // top-level pass/fail
state.nmDebug()           // counters + flashSpikes counter
noMoonIsLite()            // is mobile auto-detect on?
noMoonIsMinVisuals()      // is min-visuals A/B mode on?
noMoonSetMinVisuals(true) // turn off ALL my visual additions
noMoonQAEnable()          // unlock destructive QA functions
```

## If you want to test the flashing fix

1. Hard refresh after deploy.
2. Play normally. Notice if flashing happens.
3. If it still flashes, in console: `noMoonSetMinVisuals(true)`.
4. Keep playing. If flashing stops, it was mine. Tell me which one to
   keep on. If it continues, the cause is in the base engine.

## Everything else from v213 stays

- Mobile auto-detect + lite mode
- All v211 progression fixes (Progress, SunRoute multi-mirror, etc.)
- RespawnBrake, RoomContract, etc.
- Doors.armNormalGuards still a no-op (fixed the teleporter break in
  v213)
- Same modular architecture, same wrappers

## Upload

Drop the contents of the zip into the Netlify site root, preserving
folders. Hard refresh after deploy.
