# Deploy Notes — No Moon v55

## Build

- Game build tag: `qual.future-consequence.2026-05-01.v55`
- Game service-worker cache: `no-moon-future-consequence-v55`
- Base: v54 Tribal whisper layer

## What v55 is

First real build transformation. The existing "Little Saint Engine" build identity (Lantern Pup + Siphon Vane + Aegis Lattice) now does something:

- **Mechanical**: when guard reknits to full, each Lantern Pup fires a small saint-burst (3 bullets in a ring, modest damage).
- **Visual**: thin orbiting crown of 5 saint-amber dots above the player's head while transformation is active.

Proof of concept. Future passes can add more transformations using the same scaffolding.

See `NO_MOON_FUTURE_CONSEQUENCE_V55_PATCH_NOTES.md` for full details.

## Cache note

Service-worker cache bumped to `no-moon-future-consequence-v55`. Activate handler will delete prior caches.

## Quick live checks

1. Title build tag reads `…v55`.
2. Equip Lantern Pup + Siphon Vane + Aegis Lattice.
3. Crown should appear above player's head.
4. Take damage, wait 10s for reknit, watch for the saint-burst from each pup.
5. Console: `state.v55Debug()` shows `littleSaintEngineActive: true` and `stats.saintBursts: 1+` after a reknit.

## Tuning at runtime (devtools)

```js
// Stronger burst
state.v55BuildTransformations.config.SAINT_BURST_DAMAGE_MULT = 0.65;

// More bullets per pup
state.v55BuildTransformations.config.SAINT_BURST_PER_PUP = 5;

// Faster bullets
state.v55BuildTransformations.config.SAINT_BURST_BULLET_SPEED = 720;

// Less visible crown
state.v55BuildTransformations.config.CROWN_ALPHA = 0.30;
```

## Rollback

Independent of other passes. To revert:
1. `state.v55BuildTransformations.config.ENABLED = false;` for full-system runtime test.
2. Or `state.v55BuildTransformations.config.LITTLE_SAINT_ENGINE = false;` to keep the system loaded but skip this specific transformation.
3. Or delete V55 IIFE and revert build tag + cache to v54.
