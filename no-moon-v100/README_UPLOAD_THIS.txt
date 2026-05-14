# No Moon v100 — Eclipse Reborn (comprehensive QA fix pass)

Build tag: `qual.eclipse-reborn.2026-05-14.v100`
Service worker cache: `no-moon-eclipse-reborn-v100`

Layered on top of the v99 Moots active-contract build. Every fix is an
idempotent wrapper that checks `__v100Wrapped` flags so re-running the
script never double-applies.

## Fix clusters

### Gameplay
- **Mini-bosses no longer auto-clear the room.** "Fake Moon" and "Spiggot"
  now fight alongside the normal enemy pool. The room only clears when
  every enemy is dead, and the named boss drops a heart container.
- **Mini-bosses are harder.** +45% HP, +15% damage.
- **Grave Warden auto-warp fixed.** Stale sun-victory handoff flags can
  no longer fire on non-sun bosses. The handoff only runs when the actual
  sun core dies or the room is the sun throne.
- **Boon Moots active charge is more reliable.** An extra credit guard
  on top of the v99 contract tracks whether the active was Moots when the
  room was entered, so swaps mid-room no longer drop the room's credit.
- **Floor-transition spawn safety extended for Tidefall beams.** Beams
  get a wider clearance margin and a longer grace window (1.6 s).

### Run state
- **Sun crater opens on second+ runs.** Always passes the proper
  `priorSunClears` count to the v77 installer, including localStorage and
  v100 run history. The crater displays as open and glowing on subsequent
  runs.
- **Top-left secret beacon.** When the crater is open, a glowing
  TOP-LEFT landmark spawns. Touching it routes into the existing Drowned
  Sky / Starless Well installer when present.
- Resets stale `_v77SunAwaitingReturnTouch` / `_v39SunVictoryHandoff`
  flags at the start of every run.

### Visuals / UX
- **Sun heat meter always visible** in the sun biome with a sun glyph
  and "SUN" / "BURNING" label so the player can see the threat building.
- **Boss-cleanse FX** — when the room is cleansed after a boss kill,
  enemies dissolve into a 1.4 s shockwave + rising motes instead of just
  vanishing with sparks.
- **Hazard glyph overlay.** Each hazard kind reads differently:
  spore = orange chase ring + comet tail, snare = green dashed,
  lotus = purple petal glyph, pulse/ritual = red double ring.
- **Spore hazards actually chase.** Drift biased toward the player at
  ~90 px/sec so "chasing" hazards pressure rather than dawdle.

### Balance
- **Non-Sol characters buffed** (~10-15%): rook hp 9->10 / speed 210->235 /
  dmg 1.0->1.1; nyx hp 5->6 / speed 300->320 / dmg 0.72->0.85 / fireDelay
  0.10->0.092; mire hp 6->7 / speed 235->260 / dmg 0.88->1.02; moots hp 6->7 /
  dmg 0.88->1.02 / fireDelay 0.20->0.185. Sol untouched.
- **Active items more powerful.** +1 maxCharges, +1 roomRecharge, and
  the engine reads new multipliers (1.35x damage, 1.25x radius,
  1.30x duration) so each use feels meaningful.
- **Star economy.** Drops thinned to ~70% of v99 rate with a per-room
  cap of 5 stars.
- **Non-gravitating pickups nudged off hazards** on a 0.5 s scan.

## Console checks (paste after hard refresh)

```js
state.v100SelfTest()
state.v100Debug()
localStorage.getItem('noMoon.v100.runHistory')
noMoonV99MootsSelfTest()
state.v68Debug()
```

Expected:
- `state.v100SelfTest().ok === true`
- `state.v100Debug().characters.rook.maxHp === 10`
- `state.v100Debug().actives.buffed > 0`
- `state.v100Debug().wraps.populateRoomEnemies === true`
- `state.v39FinishSunVictory.__v100Wrapped === true`

## Manual checklist

1. Fresh save -> enter sun biome -> heat meter visible immediately.
2. Find a Fake Moon room -> kill it -> room is NOT cleared, normal
   enemies still alive -> defeat all -> heart container drops.
3. Kill Grave Warden -> standard cinematic, no auto-warp into secret door.
4. Defeat sun boss -> touch the Return Sigil -> win flow plays normally.
5. Reload -> new run -> sun throne shows a glowing TOP-LEFT beacon (2nd run
   teaser) -> touch it -> routes into Drowned Sky.
6. Spawn into a Tidefall room repeatedly -> never start standing on a beam.
7. Walk over hazards -> fog vs spore vs snare vs lotus vs pulse read
   visually distinct.
8. Stars feel less spammy; shop value matters more.
9. Non-Sol characters feel ~10-15% stronger; actives noticeably bigger
   and longer.
10. Boon Moots active relaces every room clear including after swaps.

## Upload

Upload the contents of this zip to the Netlify site root, preserving
folders. Hard refresh after deploy.
