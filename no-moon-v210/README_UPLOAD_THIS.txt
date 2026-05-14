# No Moon v210 — Modular Consolidation

Build tag: `qual.modular-consolidation.2026-05-15.v210`
Service worker cache: `no-moon-modular-consolidation-v210`

A single readable patch on top of the v99 base. Replaces the messy
v100 -> v104 layered-wrapper stack with one ~2000-line file organized
into named modules instead of versioned layers.

## How the code is organized

The patch is ONE IIFE that defines, in this order:

1. **Shared helpers** — `num()`, `clamp()`, `arr()`, `findSafePoint()`,
   `pointHitsHazard()`, etc. Used by every module. Defined ONCE.
2. **Modules** — plain objects with named methods:

   | Module        | Responsibility                                          |
   |---------------|---------------------------------------------------------|
   | RoomContract  | Per-room state machine (role, stage, everHadLiving...)  |
   | RespawnBrake  | Blocks empty-room repair during update + post-combat    |
   | SunRoute      | Crater 2nd-run unlock + sigil guard + v80 entry         |
   | Doors         | Starless + normal door leave-and-reenter guards         |
   | Pickups       | Module integrity, hazard nudge, magnet                  |
   | Combat        | Mini-boss rooms, heart drops, afterguards               |
   | Hazards       | Spore homing, color glyphs, entry prime                 |
   | Bosses        | Cleanse FX on regular boss adds                         |
   | Balance       | Character buffs, active power + cadence, star throttle  |
   | Feel          | Damage numbers, hit pause, slow-mo, low-HP pulse        |
   | HUD           | Active banner, pickup labels, room chip, intent, meter  |

3. **Engine wrappers** — one wrapper per engine function (`updateGame`,
   `syncActiveRoom`, `generateLevel`, `startGame`,
   `populateRoomEnemies`, `setRoomCleared`, `killEnemy`, `damageEnemy`,
   `damagePlayer`, `collapseBossAdds`, `tryDoorTransition`,
   `pushPickup`, `updatePickups`, `drawAmbientWorld`, `renderWorld`).
   Each wrapper calls the relevant module hooks in documented order.

4. **Debug** — `state.nmDebug()` and `state.nmSelfTest()` exposed
   plus `window.noMoonV210*` and `window.noMoonCurrent*` aliases.

## What this build does

Same gameplay fixes as the v100+v101+v102+v104 stack combined:

- Respawn brake (no infinite respawns during legitimate clears)
- Sun crater opens on 2nd+ run and routes into Drowned Sky via v80
- Starless + normal door leave-and-reenter guards
- Module pickup integrity (drift after save loads)
- Pickup hazard safety + magnet
- Mini-boss rooms fight alongside regular enemies; heart container
  drop; afterguards if killing the mini-boss would empty the room
- Spore hazards drift toward the player; per-kind color glyphs
- Hazard prime on room entry
- Sun heat meter always visible (shade-aware); sun phase-2 invuln
  clamp
- Boss cleanse FX (shockwave + rising motes)
- Character buffs (rook/nyx/mire/moots/vesper/nadir; Sol untouched)
- Active items: one-charge cadence + auto-refill + per-activation
  power timer multiplier (1.35x-1.50x)
- Star economy: 70% rate + per-room cap of 5
- Damage numbers, hit pause, active-cast slow-mo + ring flourish,
  pickup celebration, low-HP red pulse
- HUD chips: active relic status (top-right), pickup labels (above
  nearest pickup), room state (FIGHT / EXIT OPEN / EXIT LOCKED),
  enemy intent telegraph (! + aim line on boss windups)
- Moots E-key keyboard fallback

## What we still haven't root-caused

The ORIGINAL "rooms with 0 enemies on a second run" bug — the thing
that started the entire v100-v104 patch spiral — is still not
diagnosed. v210 keeps the symptomatic fix (born-empty repair allowed
once per room at sync/generate/start, never from the update loop) but
the underlying race condition in the level wrappers (v23 false-moon,
v242 spiggot, etc. that do `room.enemies = []` and then add a boss)
has never been audited.

The RoomContract module makes future diagnosis easier — every room
now has a stage and you can see in debug exactly when a room "lost"
its enemies.

## Console checks (paste after hard refresh)

```js
state.nmSelfTest()
state.nmDebug()
```

Expected:

- `state.nmSelfTest().ok === true`
- `state.nmSelfTest().wraps.missing` is empty array
- `state.nmSelfTest().respawnBrake.ok === true` (legitimate clear
  does not get repopulated)
- `state.nmSelfTest().bornEmptyRepair.ok === true` (truly empty rooms
  still get repaired at sync time)
- `state.nmDebug().room.contract` shows the current room's state
  machine

## Upload

Drop the contents of the zip into the Netlify site root, preserving
folders. Hard refresh after deploy.
