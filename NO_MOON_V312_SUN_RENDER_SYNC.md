# No Moon v312 — sun meter/overlay render sync (triple-check follow-up)

_Build: `qual.v312-sun-meter-render-sync.2026-06-03.v312`. v311 plus one fix found by a
triple-check of the sun system._

## The bug (a real render mismatch)
The sun **heat/damage** (`updateLightBurn39`) is applied whenever
`state._v39MoonPathActive` **OR** the current room has sun flags
(`_v39MoonPathRoom` / `_v39SunThrone` / `_v39PathFloor` / `_v77SunCrater`).

But the sun **overlay + heat meter** were drawn from the v39 render wrapper, and that
call site was gated on **`state._v39MoonPathActive` ONLY**:

```js
// before (render wrapper)
if (state._v39MoonPathActive && state.mode === 'play') {
  drawWorldOverlays39();
  drawScreenOverlays39();   // <- draws the sun bleach + calls v77DrawSunHeatMeter
}
```

So in a sun-flagged room where the global route flag was stale/off, **heat still
burned the player while the meter never drew** — silent damage.

**Confirmed at runtime** (sun combat room, open light):
| `_v39MoonPathActive` | heat built | meter draw calls (2.5s) |
|---|---|---|
| true  | 0.8 | 108 |
| false | 0.8 (same) | **0** |

## The fix
Gate the overlay render on the **same condition** the heat uses:

```js
if (state.mode === 'play') {
  var r = currentRoom39();
  var sunish = !!(r && (r._v39MoonPathRoom || r._v39SunThrone || Number.isFinite(Number(r._v39PathFloor)) || r._v77SunCrater));
  if (state._v39MoonPathActive || sunish) { drawWorldOverlays39(); drawScreenOverlays39(); }
}
```

`drawWorldOverlays39` already self-gates on `room._v39MoonPathRoom`, and
`drawScreenOverlays39` / `v77DrawSunHeatMeter` self-gate on room flags + exposure, so
this only *adds* drawing in the previously-missed case.

**Verified after the fix:** with `_v39MoonPathActive=false`, the meter now draws 106×
over 2.5s (was 0) — matching the heat. Boots clean (0 console/page errors), ending/
route intact, three-copy invariant + `node --check` pass, shipped zip keeps the v307
hook strip.

## Note on v311 (for the record)
v311's "open sunlight burns in cleared rooms" is a deliberate **gameplay design
change** (you chose it), not a bug fix — flagged as such. The second/Rebuilt sun-heat
system remains correctly muzzled (`__v244SunSingleHeatOwner=true`); v312 does not touch
heat logic, only when the overlay/meter is drawn.
