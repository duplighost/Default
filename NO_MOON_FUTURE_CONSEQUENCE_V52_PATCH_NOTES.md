# No Moon v52 — Shrine player visibility + Boon Moots capture safety

**Build tag:** `qual.future-consequence.2026-05-01.v52`
**Service worker cache:** `no-moon-future-consequence-v52`
**Base:** v51 Boss / mini-boss message staggering

## Two long-standing bugs in the Moon Shrine room

### Bug 1: Player invisible during shrine

The shrine renders a deep-space backdrop at ~94% alpha over the world. The base render already drew the player, so the backdrop covers them. The existing shrine render adds a "subtle player glow" at the player's position (alpha 0.18 white softGlow), but the player sprite itself is buried under the dark wash. Players consistently report "I can't see my character" in the shrine room.

### Bug 2: Boon Moots collection unreliable

After the moon shatters, Boon Moots spawn at the moon's last position. Multiple magnet systems pull the reward toward the player every frame:

- Core magnet (line 16183): pulls reward up to 6 px/frame at d < 240
- V38 long-range magnet: disabled by V43
- V43 main `tickBoonMootsAssist43`: 55%-toward-player snap at d < 73
- V43 supplement `assistBoonMoots43s`: pulls up to 16 px/frame, sticky-snap at d < 120

The core collection check (`if (d < (p.r||17) + reward.r + 6)` → 45 pixels) uses pre-magnet d. When the player is moving and the reward is being yanked around in conflicting directions, the d-at-check moment can stay above the 45-pixel capture radius even though reward and player are visually overlapping. The user reports "I walk through them or bounce, then a few seconds later it teleports me anyway".

The eventual catch-up is the **ascend** stage: V19's logic sets `p.vy = -lift` and the player floats upward. That's the "teleport in the right way" — but by then several seconds have passed and the V43 confirmation message ("BOON MOOTS TAKEN") was buried in the boss-death message storm.

## What v52 does

### Fix 1: PLAYER_VISIBLE_DURING_SHRINE

Wraps `render` as outermost. After the base render returns (which includes V19's shrine backdrop, moon, and reward draws), V52 re-renders the player sprite with proper camera transform on top of everything:

```js
ctx.save();
ctx.translate(-cam.x + playViewCenterX(), -cam.y + playViewCenterY());
drawPlayer(state.player);
ctx.restore();
```

Player is now fully visible during fight, breaking, reward, victory, and ascend stages. They can see what they're doing.

### Fix 2: AGGRESSIVE_CAPTURE

Wraps `updateGame` as outermost. After all other updates (including all magnets and the core's collection check), V52 does its own collection check with a **larger radius** (default 80 pixels, configurable):

```js
if (d < AGGRESSIVE_CAPTURE_RADIUS) {
  r.captured = true;
  r.x = p.x; r.y = p.y;
  s.stage = 'victory';
  s.timer = 0;
  s.ascend = 0;
  pushMessage('BOON MOOTS', ...);
  pushMessage('the moon is yours', ...);
  spawnRing(...) x3;
  shake(8);
  startSlowMo(1.6, 0.20);
}
```

This replicates `__captureBoonMoots`'s effects (rings, sparks, slow-mo, messages) since that function is IIFE-scoped and can't be called from outside V19's closure. The visible result is the same — big "BOON MOOTS" nameplate, victory-hold animation, then the natural ascend → done flow takes over.

V43's "BOON MOOTS TAKEN" confirmation still fires because it watches for the stage transition `reward → victory` (V52 triggers exactly that transition).

The 80-pixel radius is intentionally generous. The shrine moment is an emotional payoff, not a precision test. If the player is anywhere near the reward, they get it.

## Config knobs

```js
state.v52ShrineFixSystem.config.ENABLED                    // default true
state.v52ShrineFixSystem.config.PLAYER_VISIBLE_DURING_SHRINE // default true
state.v52ShrineFixSystem.config.AGGRESSIVE_CAPTURE          // default true
state.v52ShrineFixSystem.config.AGGRESSIVE_CAPTURE_RADIUS   // default 80 (pixels)
```

Disabling individually:
- `PLAYER_VISIBLE_DURING_SHRINE = false` → revert to invisible-player-with-glow
- `AGGRESSIVE_CAPTURE = false` → rely on core's 45-pixel check (the original bug behavior)

## Wrap depth

V52 adds wraps to:
- `render` (now 11 wraps total — V52 is outermost)
- `updateGame` (now 18 wraps — V52 is outermost)

Both run AFTER the base. So:
- Render: V19 shrine draws first → V52 redraws player on top.
- Update: all other systems update first → V52 final-checks capture.

## What v52 doesn't change

- Combat balance, item tuning, weapons, narrative.
- Sun Route, Safe Haven / Breathing Village, V42 hardening, V40 darkness guard.
- The shrine fight itself, the moon's behavior, breaking-stage duration.
- Existing capture path (core + V43 main + V43 supplement) still runs. V52 is a fallback layered on top.
- `__captureBoonMoots` (IIFE-scoped) still works for normal captures.
- All v46-v51 fixes preserved.

## Validation

- `node --check` extracted inline game JS: PASS
- `node --check /no-moon/no-moon-sw.js`: PASS
- `node --check root no-moon-sw.js`: PASS
- v52 build tag at V52 IIFE constant + final assignment.
- v52 SW cache name correct.
- render wrap count: 11 (was 10).
- updateGame wrap count: 18 (was 17).

## Manual playtest priorities

1. Title build tag reads `qual.future-consequence.2026-05-01.v52`.
2. Fight the Moon Shrine moon. **You should see your player clearly** during the entire fight, not just a faint glow.
3. After moon shatters and Boon Moots spawn, walk toward them. Even if the reward is being yanked around, **getting within ~80 pixels should snap-capture and show "BOON MOOTS"** with the big nameplate, slow-mo, and rings.
4. The ascend stage should happen on schedule, not delayed by 5 seconds.
5. Console check:
   ```js
   state.v52Debug();
   // After a successful Boon Moots capture:
   //   stats.aggressiveCaptures: 1+
   //   stats.playerRedraws: high (every shrine frame)
   //   shrineStage: 'victory' or later
   //   rewardCaptured: true
   ```

## Tuning at runtime

If 80 pixels feels too generous (auto-grabbing from far away):
```js
state.v52ShrineFixSystem.config.AGGRESSIVE_CAPTURE_RADIUS = 60;
```

If it still feels finicky:
```js
state.v52ShrineFixSystem.config.AGGRESSIVE_CAPTURE_RADIUS = 110;
```

## Rollback

To revert v52:
- Disable at runtime: `state.v52ShrineFixSystem.config.ENABLED = false;`
- Or delete the V52 IIFE and revert build tag + SW cache to v51. v46-v51 fixes stay intact.
