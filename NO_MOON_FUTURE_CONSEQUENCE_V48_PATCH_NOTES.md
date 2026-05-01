# No Moon v48 — Particle decay frame-rate normalization

**Build tag:** `qual.future-consequence.2026-05-01.v48`
**Service worker cache:** `no-moon-future-consequence-v48`
**Base:** v47 Stale Run-Flag Reset Pass

## What v48 does

Tiny visual-only fix. Applies the same dt-correct decay pattern V34 used for pickup velocity to the visual particle decay inside `updateParticles`.

Before v48 (per-frame multiplier, frame-rate dependent):

```js
p.vx *= p.kind === 'streak' ? 0.93 : 0.96;   // dot/streak particles
p.vy *= p.kind === 'streak' ? 0.93 : 0.96;
…
p.vx *= 0.90;                                  // glow particles
p.vy *= 0.90;
```

After v48 (per-second-equivalent multiplier, frame-rate independent):

```js
const decay = Math.pow(p.kind === 'streak' ? 0.93 : 0.96, Math.max(0, dt || 0) * 60);
p.vx *= decay;
p.vy *= decay;
…
const decay = Math.pow(0.90, Math.max(0, dt || 0) * 60);
p.vx *= decay;
p.vy *= decay;
```

At 60 fps the behavior is identical to before. At 30 fps (slow phones) the per-second decay rate now matches 60 fps, so sparks and trails drift the same distance regardless of device.

This is purely visual. Particles don't affect gameplay, hitboxes, or collision. The 60-fps behavior is unchanged. Slow-device behavior now matches it.

## What v48 doesn't change

- Combat balance, item tuning, weapons.
- Sun Route, Safe Haven / Breathing Village, V42 hardening, V40 darkness guard.
- Any gameplay-affecting movement decay (charger dash, snapper, shrine bounce, V20 instant doors). Those use the same per-frame pattern but with gameplay implications, so I'm leaving them as-is — players' muscle memory was built on the existing feel and changing it could surprise them. They're independently fixable later if you want consistency at the cost of feel-shift.

## Validation

- `node --check` extracted inline game JS: PASS
- `node --check /no-moon/no-moon-sw.js`: PASS
- `node --check root no-moon-sw.js`: PASS
- v48 build tag appears at V48 IIFE constant + final assignment.
- v48 SW cache name: `no-moon-future-consequence-v48`.

## Debug

```js
state.v48Debug();
```

Returns:

```js
{
  version: 'qual.future-consequence.2026-05-01.v48',
  buildTag: 'qual.future-consequence.2026-05-01.v48',
  config: { ENABLED: true, NOTE: '...' },
  stats: { lastError: null },
  v47: { ... }
}
```

## Quick playtest check

Compare the game running at 60 fps (desktop) vs ~30 fps (an older phone or with throttling on). Sparks and trail particles after kills/hits should now drift the same distance per second. Before v48 they drifted further on slow phones.

## Rollback

To revert:
1. Restore the original per-frame `p.vx *= 0.96` etc. inside `updateParticles` (around line 5874).
2. Delete the `installV48ParticleDecayNormalization` IIFE.
3. Revert build tag and SW cache to v47.
