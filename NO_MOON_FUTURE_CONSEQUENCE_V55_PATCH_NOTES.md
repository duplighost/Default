# No Moon v55 — First build transformation: Little Saint Engine

**Build tag:** `qual.future-consequence.2026-05-01.v55`
**Service worker cache:** `no-moon-future-consequence-v55`
**Base:** v54 Tribal whisper layer

## What v55 is

The existing build identity at line ~14808 detects "Little Saint Engine" when the player has `Lantern Pup + Siphon Vane + Aegis Lattice`. Until now, the label was just text in the run report. v55 makes the transformation actually *do* something.

This is a **proof of concept**. If it lands well, future passes can add more transformations (Murder Weather, Glass Lightning Heresy, Quiet Cathedral Engine, etc.) using the same scaffolding.

## What "Little Saint Engine" now does

### Mechanical bonus: Saint-burst on guard reknit

When the player's guard reknits to full (the existing 10-second shield-restore timer in core code), each active Lantern Pup fires a **saint-burst**: 3 player-bullets in a tight ring around the pup, modest damage scaled off `player.damage`.

Default config:
- 3 bullets per pup per burst
- 0.45× player damage per bullet
- 540 px/sec speed, 0.55s life
- Saint-amber color (`#fff3c4`)

Bullets go through `createPlayerBullet`, so they respect projectile-budget caps and don't explode the budget at high stacks.

A small ring effect + a sine-tone chord plays on burst. Subtle but present.

### Visual: thin orbiting crown

When the transformation is active, a thin crown of 5 small dots orbits above the player's head. Faint (alpha 0.55), saint-amber, slow rotation. Visible during fight; not intrusive enough to interfere with hit-reading.

The crown disappears the moment any of the 3 trigger items is removed (e.g., player's stack count drops). Pickup brings it back.

## Trigger

```js
player.modules.scavengerDrone >= 1
&& player.modules.siphonVane >= 1
&& player.modules.aegisLattice >= 1
```

All three at stack 1+. Aegis Lattice has a max of 2 (so the player can have up to 2 guard layers, increasing the number of reknits per run).

## Config knobs

```js
state.v55BuildTransformations.config.ENABLED                  // default true
state.v55BuildTransformations.config.LITTLE_SAINT_ENGINE      // default true
state.v55BuildTransformations.config.SAINT_BURST_PER_PUP      // default 3
state.v55BuildTransformations.config.SAINT_BURST_DAMAGE_MULT  // default 0.45
state.v55BuildTransformations.config.SAINT_BURST_BULLET_LIFE  // default 0.55
state.v55BuildTransformations.config.SAINT_BURST_BULLET_SPEED // default 540
state.v55BuildTransformations.config.CROWN_ALPHA              // default 0.55
state.v55BuildTransformations.config.CROWN_DOTS               // default 5
```

Tunable at runtime. The ring's per-pup bullet count and damage are the main balance levers.

## Implementation

V55 IIFE wraps three globals:

- **`updateGame`** outermost: every frame, detect transformation state, set `player._v55LittleSaintEngine` flag, watch for shield reknit moment (shield went from < shieldMax to = shieldMax), fire saint-burst if transformation active.
- **`drawPlayer`** outermost: after base player draw, if flag set, render the crown above the player's head.
- **`startGame`**: reset reknit-tracking variables (`lastShield55`, `lastShieldMax55`) so a death mid-reknit doesn't double-fire on the next run.

Reknit detection is the key trick. The existing code at line 8530 area regenerates shield to full when `shieldTimer >= 10.0`. v55 doesn't wrap that code — it just observes the resulting `p.shield` change. Each frame we compare the previous frame's shield to this frame's shield. If we crossed from below max to at-max, that's a reknit moment, fire burst.

This means the mechanism is robust to any future change in how shields restore. v55 just listens for the result.

## Risk assessment

| Risk | Mitigation |
|---|---|
| Saint-burst too strong, dominates DPS | 0.45× damage, only 3 bullets per pup, only fires every 10s on reknit. With 3 pups (Lantern Pup max stack), max ~9 bullets per reknit cycle. Modest. |
| Visual crown intrusive | Alpha 0.55, only 5 small dots, slow orbit. Tunable. |
| Saint-burst counts toward bullet budget at max stack | Yes — that's the intended behavior. The balance layer trims if necessary. |
| False reknit detection (frame-edge false positive) | Reknit fires only when `lastShield < lastShieldMax` AND `cur >= max` AND `max > 0`. Filtering for max > 0 prevents firing when shieldMax is 0. |
| Saint-burst when no pups exist | If `state.drones.length` is 0, fall back to firing from player position. Bullet count is still correct. |
| Player loses Aegis Lattice mid-run | `isLittleSaintEngineActive` re-evaluates every frame. Flag flips off, crown disappears, no future bursts. |

## Validation

- `node --check` extracted inline game JS: PASS
- `node --check` game SW + root SW: PASS
- v55 build tag at IIFE constant + final assignment.
- v55 SW cache name correct.
- 2 references to `isLittleSaintEngineActive`, 2 to `fireSaintBurst55`, 1 V55 IIFE.

## Manual playtest

1. Title build tag reads `qual.future-consequence.2026-05-01.v55`.
2. Pick up Lantern Pup (scavengerDrone), Siphon Vane, and Aegis Lattice (any order, any stack ≥ 1 each).
3. **Watch the player's head**: a thin crown of 5 dots should start orbiting after the third item lands.
4. Take damage to break your guard.
5. Wait ~10 seconds for guard to reknit (you'll see "Guard reknits" message).
6. **Saint-burst**: each pup should fire 3 bullets in a ring. Small ring effect + chord plays.
7. Console:
   ```js
   state.v55Debug();
   // littleSaintEngineActive: true
   // stats.transformActiveFrames: high (every frame transformation is active)
   // stats.saintBursts: 1+ after a reknit
   ```

## Rollback

- Runtime disable: `state.v55BuildTransformations.config.ENABLED = false;` (kills both bonus and visual)
- Or keep visual but disable bonus: `state.v55BuildTransformations.config.LITTLE_SAINT_ENGINE = false;`
- Or hard revert: delete V55 IIFE, revert build tag and SW cache to v54. v46-v54 stays intact.

## What's next (future passes, not v55)

If Little Saint Engine feels right, the same pattern can extend to other build identities:

- **Murder Weather** (Grave Charge + Ember Mine + Spite Core): enemy death explosions arm nearby mines + tiny visible storm-flicker around the hull.
- **Glass Lightning Heresy** (Arc Rosary + Prism Teeth + Moon Shard): crit shots chain once + faint cracked-glass halo.
- **Choir of Backwards Teeth** (Rear Array + Sidecar Lances + Shrapnel Chamber): all directions visibly fire dust trails.
- **Quiet Cathedral Engine** (Echo Chamber + Rift Capacitor + Lunar Caliber): echo volleys leave brief afterimages.

Each is a separate IIFE on the V55 scaffolding. None require new state-tracking infrastructure beyond what V55 establishes.
