# Deploy Notes — No Moon v48

## Build

- Game build tag: `qual.future-consequence.2026-05-01.v48`
- Game service-worker cache: `no-moon-future-consequence-v48`
- Base: v47 Stale Run-Flag Reset Pass
- BGM asset unchanged: `/no-moon/no-moon-bg-v35.mp3`

## What v48 is

Tiny visual-only fix: dt-correct decay for visual particles (dot/streak/glow) inside `updateParticles`. Particles now drift the same distance per second across 30-60 fps. See `NO_MOON_FUTURE_CONSEQUENCE_V48_PATCH_NOTES.md`.

No gameplay changes. No design changes.

## Cache note

Service-worker cache bumped to `no-moon-future-consequence-v48`. Activate handler will delete prior `no-moon-*` caches.

## Quick live checks

1. Title build tag reads `…v48`.
2. Game looks/feels identical at 60 fps (desktop).
3. On a slow phone or with throttled CPU: sparks and trails after kills/hits should now drift the same distance per second as desktop. Before v48 they drifted slightly farther.

## Debug

```js
state.v48Debug();
```

## Rollback

Each fix in v46/v47/v48 is independent. To revert just v48: revert the inline `Math.pow(...)` change in `updateParticles` (line ~5874) and delete the `installV48ParticleDecayNormalization` IIFE. Build tag and SW cache go back to `…v47`.
