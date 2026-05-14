# No Moon v215 — Mobile Particle Load (on top of v214)

Build tag: `qual.mobile-particle-load.2026-05-15.v215`
Service worker cache: `no-moon-mobile-particle-load-v215`

## Why this exists

User reported: after one explosion on mobile, framerate drops and
"floor stuff" flashes rapidly. Damage by itself doesn't trigger it.

That's the signature of a particle-load problem, not a discrete
visual effect:
  - An explosion in this engine spawns 18-30 sparks, a ring, and
    sometimes a chain detonation
  - On a phone, each frame draws every live particle — particle count
    spikes after explosion
  - Framerate drops below 30 fps
  - Animations that look smooth at 60 fps (engine hazard pulse cycles,
    particle fade-outs) look like rapid flashes at low fps
  - That's the "floor stuff flashed really fast" effect

The fix is not to disable a single visual — it's to keep mobile fps
high enough that existing animations stay smooth.

## What v215 changes

Three things, all on lite mode (auto-detected on touch + small screen
OR mobile UA). Desktop is unaffected.

### 1. spawnSpark count scaled to half

Every call to `spawnSpark(x, y, color, count, speed)` halves the
count on lite mode. Min 1. So a boss death that asks for 30 sparks
now creates 15 on mobile. Visually still reads as an explosion, just
less particle density.

### 2. spawnRing radius scaled to 0.7x

Each ring is a single particle, but its size is what costs draw time
on a phone. Smaller rings → faster draw. Still visible.

### 3. Particle pool capped at 80 on lite

In `updateGame`'s post-tick, if `state.particles.length > 80` on
lite mode, we sort by remaining life (oldest first) and cull the
overflow. Chain detonations can't blow up the array any more.

### 4. state.flash capped at 0.45 on lite

Engine boss kills can push `state.flash` to 1.05+ which is a near-
full-screen strobe on a phone. We cap at 0.45 on lite. Still visible,
no more strobe.

## What this DOES NOT touch

- Gameplay logic is unchanged
- Desktop visuals are unchanged
- All HUD chips, damage numbers, etc. still render (lite mode rules
  for those are unchanged from v214)
- ALL the v210+ progression fixes (sun crater, doors, etc.) are
  intact

## How to test

1. Hard refresh after deploy.
2. Play normally on phone.
3. Trigger an explosion (volatile shard, boss kill, etc.).
4. Watch for the "floor flashes really fast" effect.

If still flashing: open console, run `noMoonSetMinVisuals(true)`.
  - If THAT stops it: it's a draw I added on top, not the engine's
    own particles. Send me which.
  - If it doesn't: there's something else in the engine. Paste me
    `state.nmDebug().stats` so I can see particle counts.

`state.nmDebug().stats` now includes:
  - `particlesCulled` — total particles culled to enforce cap
  - `sparksScaled` — times spawnSpark was scaled down
  - `ringsScaled` — times spawnRing was scaled down
  - `flashSpikes` — times my hit-feedback fired (capped at 5/sec via v214 cooldown)

## Manual override

```js
noMoonSetLiteMode(true)     // force lite mode on
noMoonSetLiteMode(false)    // force off
noMoonSetMinVisuals(true)   // disable ALL my draws (A/B test)
noMoonQAEnable()            // unlock destructive QA functions
```

## Upload

Drop into Netlify site root preserving folders. Hard refresh after
deploy.
