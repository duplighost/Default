# No Moon v311 — sun system audit + cleared-room burn

_Build: `qual.v311-full-fixes-sun-cleared-burn.2026-06-03.v311`. Same as v310 plus one
tuning change to the sun, after a full audit of everything that touches sun heat._

## Full audit of the sun-heat mechanic
Traced every read/write of `_v77SunHeat` and every `'sunlight'` damage path:

| System | Role | Status |
|---|---|---|
| `roomBrightAmount39` | open-floor brightness | constant since v308 (was a 6.2s on/off cycle) |
| `updateLightBurn39` (System A) | the live meter: open fills, shade drains, full = 1 dmg | **active owner** |
| `SunRoute.tickHeat` (System B) | a second, separate heat implementation | **muzzled** — `__v244SunSingleHeatOwner=true` verified at runtime; does nothing on sun rooms, so it is NOT fighting System A |
| safety gates | entry rooms / cleared rooms / non-sun rooms → "SAFE" | see change below |
| `feltDebt` in the fill | legacy Moon-Debt scaler | 0 now (debt removed) — no effect |
| meter UI `v77DrawSunHeatMeter` | the ring/bar | draws in open light / when heat is built — consistent with System A |

**Measured live** (real sun combat room): open light fills ~0.11 heat/sec → about
**9s of unbroken open exposure per point of health** (the fill integrates with a small
effective timestep, ~1/3 of the nominal rate). Shade drains to 0. Cleared room → was
SAFE (heat to 0). So the two reasons it felt like "only the first time": the gentle
fill, and **clearing a room turned the sun off.**

## Change in v311 (per your calls)
- **Bite rate: kept gentle** (you chose ~9s; no change to the fill).
- **Cleared rooms now BURN in the open**: removed `room.cleared` from the sun's
  "safe" condition in `updateLightBurn39`. Open sunlight now costs health whether or
  not the room is cleared — shade is the only safe spot. Entry rooms and
  post-sun-victory scenes (sun boss defeated / crater / return sigil) still go safe.

## Verified (dev build)
- `buildTag = qual.v311-…`; boots clean, ending/route intact, three-copy invariant +
  `node --check` pass; shipped zip keeps the v307 hook strip (no dev tools shipped).
- In a **cleared** sun room, open light now reads `OPEN LIGHT` and heat builds
  (0.02 → 0.53 over ~6s); before v311 the same spot read `SAFE` with heat at 0.
- System B confirmed muzzled (not interfering); shade still safe.

## Still tunable
The pace is gentle by your choice. If after playing it the sun should bite faster,
it's a one-number change (the fill coefficient in `updateLightBurn39`).
