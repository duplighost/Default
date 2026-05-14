# No Moon v200 — Consolidated Fixes (single readable patch)

Build tag: `qual.consolidated.2026-05-15.v200`
Service worker cache: `no-moon-consolidated-v200`

This build replaces the previous v100 -> v104 stack of layered IIFE
wrappers with ONE consolidated patch appended to the v99 base. Same
gameplay fixes, ~1735 lines of readable code organized in clearly
labeled sections.

## Sections (each in the patch with WHAT / BUG / CAUSE / FIX comments)

 1. **Respawn brake** — latches a flag the first time we see enemies
    in a room so the engine's empty-room repair refuses to fire
    during a legitimate clear.
 2. **Sun crater 2nd-run unlock** — reads three save mirrors,
    normalizes the crater state, and routes touch-to-Drowned-Sky via
    the existing `v80ForceEnter()` engine entry.
 3. **Starless door auto-warp guard** — newly spawned secret doors
    require the player to leave their radius once before they fire.
 4. **Pickup hazard safety + magnet** — nudges modules / rewards /
    splinters off hazards and shortens their magnet delay.
 5. **Sun biome UX** — always-visible heat meter (shade-aware) and a
    clamp on the sun boss's phase-2 invuln window.
 6. **Mini-boss rooms** — Fake Moon / Spiggot fight alongside 3-4
    regular enemies, +45% HP / +15% damage, drop a heart container.
 7. **Kill hook** — heart-drop on tagged mini-boss death, plus a
    gate that prevents non-sun bosses from firing the sun-victory
    handoff.
 8. **Star economy** — 70% drop rate + per-room cap of 5.
 9. **Hazards** — spore drift biased toward the player, distinct
    color glyph overlay per hazard kind.
10. **Boss cleanse FX** — 1.4 s shockwave + rising motes when adds
    are collapsed at boss death.
11. **Character + active-item balance** — non-Sol character buffs,
    one-charge actives with auto-refill on clear, and a per-active
    timer multiplier for power (1.35x - 1.50x).
12. **Game-feel** — capped damage numbers, hit pause on player
    damage, active-use slow-mo + ring flourish, pickup celebration,
    low-HP screen pulse.
13. **Legibility HUD** — active relic status banner, pickup name
    labels, room state chip (FIGHT / EXIT OPEN / EXIT LOCKED),
    enemy intent telegraph (aim line + "!" on boss windups).
14. **Update + render hooks** — one update wrapper and one render
    wrapper driving everything; clear ordering: sun/door guards
    before base update, FX + magnetization after.
15. **Moots keyboard fallback** — global "E" handler.
16. **Debug + self test** — `state.nmDebug()` and `state.nmSelfTest()`.

## What we did NOT fix (honest)

- The ORIGINAL "rooms with 0 enemies on second run" complaint. We
  patched the SYMPTOM (added auto-repair, then a brake on the
  repair). The actual root cause is somewhere in the level
  generation / level wrappers and would need a dedicated audit.
- Some of v103's ambient polish (mote field, player trail, global
  vignette) is intentionally NOT carried forward — it added visual
  noise without clarifying anything. v200 keeps only the FEEDBACK
  juice (damage numbers, hit pause, slow-mo on cast, low-HP pulse).

## Console checks after hard refresh

```js
state.nmSelfTest()    // <- top-level pass/fail
state.nmDebug()       // <- counts of every system
```

Expected:
- `state.nmSelfTest().ok === true`
- `state.nmSelfTest().wraps.ok === true`
- `state.nmDebug().wraps` shows every wrap = true after first play
- After combat: `state.nmDebug().stats.damageNumbers > 0`
- After a clear: `state.nmDebug().stats.respawnLatches > 0` (rooms
  that have been latched against respawn)

## Manual sanity

1. First combat room — enemies don't respawn during cleanup.
2. Beat the sun boss once; reload. Sun throne now shows an OPEN
   glowing crater. Walking onto it enters Drowned Sky.
3. Beat Grave Warden — no auto-warp.
4. Fake Moon / Spiggot rooms have other enemies; heart drops on kill.
5. Sun biome shows the heat meter immediately with the sun glyph.
6. Take damage — brief hit-pause + red pulse.
7. Use an active — slow-mo + ring flourish.
8. HUD shows: active timer (top-right), pickup name (above
   nearest item), room state (bottom-center), "!" on boss windups.
9. Hazards look different per kind (orange spore, green snare,
   purple lotus, red pulse).
10. Sol still feels Sol-strong; rook/nyx/mire/moots feel a tier up.

## Upload

Unzip the contents into the Netlify site root, preserving folders.
Hard refresh after deploy.
