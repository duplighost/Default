# No Moon v216 — Pickup Magnet Fix (on top of v215)

Build tag: `qual.pickup-magnet-fix.2026-05-15.v216`
Service worker cache: `no-moon-pickup-magnet-fix-v216`

## Why this exists

User reported a bug that's been in every one of my builds since v210:
"I killed an enemy. A health pickup just followed me around. I
couldn't get it. It would just land right with me if I stopped. And
it followed me into the next room."

That's a real bug. The cause: my `Pickups.magnetize` was adding
velocity toward the player every single frame, with no minimum
distance. When the pickup got within the engine's collision range
(roughly 22 px), my magnet kept pulling. Either:
  - the added velocity overshot the player (pickup zipped past), or
  - the pickup oscillated around the player position

Either way, the engine's pickup-collision check couldn't reliably
fire, and the pickup got "stuck" trailing the player without ever
being collected.

The "followed me into the next room" part was the same magnet still
pulling on stale references in `state.pickups` after a room
transition.

## What v216 changes

Targeted fix to `Pickups.magnetize`:

  1. Don't pull when the pickup is within 40 px. The engine's
     collision handles them from that distance. We get out of the
     way so collection can actually fire.
  2. Cap the per-component velocity contribution at ±240 px/sec so
     we can't accumulate over frames into "overshoots the player
     every tick" territory.
  3. Prefer the current room's `room.pickups` array. If a pickup
     is in `state.pickups` but not in the current room, don't
     magnet-pull it.

All v215 changes are still in effect.

## Note about the flashing

v215 (and earlier) had attempts at the flashing problem:
  - v214: hit-feedback cooldown (200 ms between flashes)
  - v215: spawnSpark count halved on lite mode, spawnRing radius
    scaled down, state.particles capped at 80, state.flash capped
    at 0.45

User clarified that damage by itself doesn't trigger the flashing,
which rules out the v214 hit-feedback theory. v215's particle-load
fixes are still the best guess: explosions on mobile drop fps,
which makes existing animations look like rapid flashes.

The min-visuals A/B test is still available:
```js
noMoonSetMinVisuals(true)
```

That disables every draw addition I made on top of v99. If flashing
stops there: it's mine. If it doesn't: it's the engine's own
particle system.

## Console summary

```js
state.nmSelfTest()
state.nmDebug()            // includes particlesCulled, sparksScaled,
                           //   ringsScaled, flashSpikes
noMoonIsLite()
noMoonSetMinVisuals(true)  // disable my visual additions for A/B
noMoonQAEnable()           // unlock destructive QA functions
```

## Upload

Drop into Netlify site root preserving folders. Hard refresh.
