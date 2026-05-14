# No Moon v101 — Eclipse Reborn Addendum

Build tag: `qual.eclipse-reborn-addendum.2026-05-14.v101`
Service worker cache: `no-moon-eclipse-reborn-addendum-v101`

This build is the ChatGPT v100 "Route / Sun / Readability / Balance
Consolidation" base with a targeted addendum layer on top covering bugs
the v100 pass did not address.

## v101 addendum fixes (on top of v100)

- **Named "running" enemies fight in a real room.** Fake Moon and
  Spiggot no longer occupy duel-style rooms; they now spawn alongside
  3-4 regular enemies pulled from the floor's normal pool. The room
  only clears when everything is dead. The named enemy is harder
  (+45% HP, +15% damage) and drops a heart container on kill.
- **Star economy throttle.** Star drops thinned to ~70% of v99 rate
  with a per-room cap of 5 so shop value still matters.
- **Spore hazards actually chase.** Drift is now biased toward the
  player at roughly 90 px/sec so the "homing slow" rings put real
  pressure on the player.
- **Hazard color glyphs.** Each hazard kind gets a distinct overlay:
  spore (orange ring + comet tail), snare (green dashed),
  lotus (purple petal glyph), pulse/ritual (red double ring). Layered
  on top of v100's icon pass so kinds are readable at a glance.
- **Boon Moots active swap guard.** Belt-and-suspenders on top of
  v100's roomNeed=2 fix: if the active was Moots when the room was
  entered, the room-clear still credits even if the slot was swapped
  mid-room.

## Inherited from v100 (ChatGPT base)

- Sun-clear count read from save + mirror + localStorage.
- Open crater calls v80 Drowned Sky entry path; Return Sigil
  repositioned + guarded so it doesn't steal the secret route.
- Starless door leave-and-reenter guard.
- Empty combat rooms repopulated or safely marked cleared.
- Pickups moved out of hazards + magnetized faster.
- Named v93/v98 captains hardened and drop heart/marrow.
- Sun heat meter always visible in Sun rooms (shade-aware).
- Sun phase-2 invulnerability clamped after seals.
- Boss-room safety leaves fading ghost rings.
- Non-Sol characters (rook/nyx/mire/moots/vesper/nadir) buffed.
- Moots E-key keyboard fallback.

## Console checks after upload

```js
state.v101SelfTest()
state.v101Debug()
state.v100SelfTest()
state.v100Debug()
noMoonV99MootsSelfTest()
```

Expected:
- `state.v101SelfTest().ok === true`
- `state.v101SelfTest().v100Present.ok === true`
- `state.v101Debug().wraps.populateRoomEnemies === true`
- `state.v101Debug().wraps.pushPickup === true`

## Manual checklist

1. Enter a Fake Moon or Spiggot room -> regular enemies also present;
   room is NOT cleared until all of them are dead; heart drops on
   named-enemy kill.
2. Stars feel less spammy; shops actually require saving.
3. Spore hazards in moonpath floors visibly drift toward you.
4. Hazards read at a glance: spore = orange, snare = green dashed,
   lotus = purple petal, pulse = red double ring.
5. Play as Moots, swap active mid-room, swap back, clear the room.
   The Boon should still relace.
6. All v100 inherited fixes still work (crater opens on second clear,
   Warden leaves you alone, empty rooms have enemies, etc.).

## Upload

Upload the contents of this zip to the Netlify site root, preserving
folders. Hard refresh after deploy.
