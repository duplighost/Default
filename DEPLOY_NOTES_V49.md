# Deploy Notes — No Moon v49

## Build

- Game build tag: `qual.future-consequence.2026-05-01.v49`
- Game service-worker cache: `no-moon-future-consequence-v49`
- Base: v48 Particle decay normalization

## What v49 is

Gameplay friction frame-rate normalization. Charger dash and snapper crawl/wind/lunge decay are now dt-correct, matching the V34 pickup pattern and V48 particle pattern.

**60 fps players see no change.** Slow-fps players (phones, throttled) get the canonical 60-fps gameplay feel for these enemies. See `NO_MOON_FUTURE_CONSEQUENCE_V49_PATCH_NOTES.md` for details.

## Cache note

Service-worker cache bumped to `no-moon-future-consequence-v49`. Activate handler will delete prior `no-moon-*` caches.

## Quick live checks

1. Title build tag reads `…v49`.
2. At full speed, gameplay should feel identical to v48.
3. With CPU throttling in devtools (4×): chargers should no longer slide unfairly past you, and snapper lunges should match 60-fps timing.

## Debug

```js
state.v49Debug();
```

## Rollback

Independent of other passes. To revert v49:
- Restore four `e.vx *= 0.XX; e.vy *= 0.XX;` blocks (charger dash, snapper crawl/wind/lunge).
- Delete the `installV49GameplayFrictionNormalization` IIFE.
- Build tag and SW cache go back to `…v48`.
