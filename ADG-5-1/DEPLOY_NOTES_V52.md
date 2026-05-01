# Deploy Notes — No Moon v52

## Build

- Game build tag: `qual.future-consequence.2026-05-01.v52`
- Game service-worker cache: `no-moon-future-consequence-v52`
- Base: v51 Boss / mini-boss message staggering

## What v52 is

Two long-standing bugs in the Moon Shrine room ("Boon Moots" stage):

1. **Player invisible during shrine** — backdrop covers the player; only a faint glow showed through. v52 redraws the player sprite on top of the backdrop.

2. **Boon Moots collection unreliable** — multiple magnet systems pull the reward in conflicting orders, and the core 45-pixel collection check uses pre-magnet d. Players walk through the reward without it triggering, then the ascend stage takes over after a delay. v52 adds an aggressive 80-pixel capture check that runs at the end of every frame, after all other systems.

See `NO_MOON_FUTURE_CONSEQUENCE_V52_PATCH_NOTES.md` for full details.

## Cache note

Service-worker cache bumped to `no-moon-future-consequence-v52`. Activate handler will delete prior caches.

## Quick live checks

1. Title build tag reads `…v52`.
2. Reach the Moon Shrine (after Null Archon, on a 3-Moonkey route).
3. **You can see your character clearly** during the moon fight, not just a glow.
4. After the moon shatters, walk toward the Boon Moots. Getting within ~80 pixels should reliably trigger the big "BOON MOOTS" capture with rings, slow-mo, and the message — no more "walking through them and bouncing for 3 seconds before something happens".

## Tuning at runtime

```js
// More precise (smaller capture radius, closer to original)
state.v52ShrineFixSystem.config.AGGRESSIVE_CAPTURE_RADIUS = 50;

// More forgiving (larger radius)
state.v52ShrineFixSystem.config.AGGRESSIVE_CAPTURE_RADIUS = 110;

// Disable v52 entirely (revert to original behavior)
state.v52ShrineFixSystem.config.ENABLED = false;
```

## Debug

```js
state.v52Debug();
// stats.playerRedraws: high during shrine (every render frame)
// stats.aggressiveCaptures: 1+ if v52's fallback fired
// shrineActive / shrineStage / rewardCaptured: state inspection
```

## Rollback

Independent of other passes. To revert:
1. Set `state.v52ShrineFixSystem.config.ENABLED = false;` for runtime test.
2. Or delete the V52 IIFE and revert build tag + SW cache to v51.

Other v46-v51 fixes are untouched.
