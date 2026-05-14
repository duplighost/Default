# No Moon v102 — Eclipse Reborn Final Polish

Build tag: `qual.eclipse-reborn-final-polish.2026-05-14.v102`
Service worker cache: `no-moon-eclipse-reborn-final-polish-v102`

Layered on top of v101 Addendum (which is on top of the v100
Route/Sun/Readability/Balance base). v102 targets the three areas the
prior passes still left soft.

## v102 final-polish fixes (on top of v101 + v100)

- **Active items: effect POWER buffs.** Prior versions only bumped
  cadence (maxCharges, recharge). v102 scans the active state every
  frame and bumps freshly-activated timer fields by 35-50% (capped):
  Borrowed Eclipse, Dead Lantern, Moonhook, Velvet Choir, Mirror Psalm,
  Black Umbrella, Star Leash, Ruin Spotlight, Passenger Bell.
  The bump applies once per activation cycle (re-arms when the timer
  drops back to zero) so values don't compound across frames.
- **Floor decals quieted.** Drowned Sky floors 0 and 1 had noisy
  X-with-circles decals that read as hazards. v102 wraps the floor-
  background generator to overlay a soft neutral tint + clean radial
  vignette so the decals fade visually without losing the murals or
  vault gradient.
- **Cleanse FX on regular boss deaths.** v100's ghost-ring effect was
  only hooked to v77MakeMajorBossRoomSafe (major bosses). Warden,
  Archon, and other regular bosses now also get a 1.4 s shockwave +
  rising motes effect on the `collapseBossAdds` path so their death
  doesn't look like everything was deleted by a stagehand.

## Inherited from v101 Addendum

- Named "running enemies" (Fake Moon, Spiggot) spawn alongside normal
  enemies; heart container on death; +45% HP / +15% damage.
- Star economy throttle (~70% rate + per-room cap of 5).
- Spore hazards drift toward player ~90 px/sec.
- Hazard color glyph overlay per kind.
- Boon Moots active swap guard.

## Inherited from v100 base

- Sun-clear count from save + mirror + localStorage.
- Open crater calls v80 Drowned Sky entry; Return Sigil guarded.
- Starless door leave-and-reenter guard (fixes Warden auto-warp).
- Empty combat rooms repopulated.
- Pickups hazard-sanitized + auto-magnetized.
- Captains hardened with heart/marrow drop.
- Sun heat meter always visible (shade-aware).
- Sun phase-2 invuln clamp.
- Boss-room major-safe ghost rings.
- Character buffs for rook/nyx/mire/moots/vesper/nadir.
- Moots E-key fallback.

## Console checks after upload (hard refresh)

```js
state.v102SelfTest()
state.v102Debug()
state.v101SelfTest()
state.v100SelfTest()
```

Expected:
- `state.v102SelfTest().ok === true`
- `state.v102SelfTest().priorLayers.ok === true`
- `state.v102Debug().wraps.collapseBossAdds === true`
- After using an active, `state.v102Debug().stats.activeTimersBoosted > 0`

## Manual checklist

1. Sun-biome floors 0 and 1 read cleaner; floor pattern no longer
   competes with hazard circles.
2. Use an active item (Borrowed Eclipse, Moonhook, etc.) — the effect
   duration is visibly longer than before.
3. Kill Warden or Archon — the cleanup leaves a brief shockwave +
   rising motes rather than just vanishing sparks.
4. Everything from v100 + v101 still works.

## Upload

Upload the contents of this zip to the Netlify site root, preserving
folders. Hard refresh after deploy.
