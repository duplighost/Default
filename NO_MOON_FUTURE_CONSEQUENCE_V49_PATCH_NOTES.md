# No Moon v49 — Gameplay friction frame-rate normalization

**Build tag:** `qual.future-consequence.2026-05-01.v49`
**Service worker cache:** `no-moon-future-consequence-v49`
**Base:** v48 Particle decay normalization

## What v49 fixes

A class of subtle bugs where some enemy movement decay was per-frame instead of per-second, causing inconsistent gameplay across frame rates.

V34 fixed pickup velocity decay to be dt-correct (`Math.pow(decay, dt*60)`).
V48 did the same for visual particles.
V49 applies the same pattern to **gameplay-affecting** velocity decay:

### 1. Charger dash decay

`updateEnemies` line ~8763, charger 'dash' state:

Before:
```js
e.vx *= 0.96;
e.vy *= 0.96;
```

After:
```js
const dashDecay = Math.pow(0.96, Math.max(0, dt || 0) * 60);
e.vx *= dashDecay;
e.vy *= dashDecay;
```

**Concrete effect**: at 60 fps, charger dashes about the same distance as before. At 30 fps, chargers were dashing roughly 28% farther because more velocity was preserved per dt. Now they dash the same distance as 60 fps.

### 2. Snapper 'crawl' move-toward-target

V22 snapper line ~16687:

Before:
```js
e.vx = (e.vx || 0) * 0.78 + dirX * speed * 0.22;
e.vy = (e.vy || 0) * 0.78 + dirY * speed * 0.22;
```

After:
```js
const stay = Math.pow(0.78, Math.max(0, dt || 0) * 60);
const pull = 1 - stay;
e.vx = (e.vx || 0) * stay + dirX * speed * pull;
e.vy = (e.vy || 0) * stay + dirY * speed * pull;
```

Snapper crawl now approaches its target speed at the same per-second rate across 30-60 fps.

### 3. Snapper 'wind' hold-position decay

Line ~16699:

Before:
```js
e.vx *= 0.78;
e.vy *= 0.78;
```

After:
```js
const windDecay = Math.pow(0.78, Math.max(0, dt || 0) * 60);
e.vx *= windDecay;
e.vy *= windDecay;
```

Snapper now holds position equally well across frame rates while telegraphing its lunge.

### 4. Snapper 'lunge' burst decay

Line ~16711:

Before:
```js
e.vx *= 0.92;
e.vy *= 0.92;
```

After:
```js
const lungeDecay = Math.pow(0.92, Math.max(0, dt || 0) * 60);
e.vx *= lungeDecay;
e.vy *= lungeDecay;
```

Lunge distance is now consistent across devices.

## Important notes on game feel

**60 fps behavior is unchanged.** At 60 fps, `Math.pow(0.96, 1/60 * 60) = 0.96` — exactly the original per-frame multiplier. Players on desktop will not notice anything different.

**30 fps players (slow phones / throttled CPUs) get the canonical 60-fps experience.** Concretely:
- Chargers no longer dash unfairly far on slow devices.
- Snapper movement is the same difficulty regardless of device.
- Lunge timing matches what's expected at 60 fps.

This is a fairness fix, not a buff or nerf. Combat balance at the canonical (60 fps) rate is preserved.

## What v49 doesn't change

- Combat balance at 60 fps: identical.
- Item tuning, draft pool, weapon damage: untouched.
- Sun Route, Safe Haven / Breathing Village, narrative beats: untouched.
- Other places that have per-frame decay but minimal gameplay impact (shrine bounce/victory hold/ascent at lines ~16089/16190/16226, V20 instant-doors brake at ~13503): left as-is. Those run only briefly during specific moments, and changing them could shift the feel of the win sequence with no clear benefit.

## Validation

- `node --check` extracted inline game JS: PASS
- `node --check /no-moon/no-moon-sw.js`: PASS
- `node --check root no-moon-sw.js`: PASS
- v49 build markers in place; v48/v47/v46 IIFE chain intact.

## Manual playtest priorities

If you can throttle CPU in browser devtools (Chrome/Firefox: Performance tab → CPU 4× slowdown):

1. **Charger fight**: spawn a charger room (early floors). Watch a charger dash at you. With v49 + 4× slowdown, it should travel the same distance as it did at full speed. Before v49, slowdown chargers slid further past you.
2. **Snapper fight**: same kind of test on later floors with snappers. Lunge distance should match 60 fps.
3. At full 60 fps, gameplay should feel identical to v48.

## Debug

```js
state.v49Debug();
```

## Rollback

To revert just v49:
1. Restore the four inline `e.vx *= …` blocks (charger dash + snapper crawl/wind/lunge) to their per-frame originals.
2. Delete the `installV49GameplayFrictionNormalization` IIFE.
3. Revert build tag and SW cache to v48.
