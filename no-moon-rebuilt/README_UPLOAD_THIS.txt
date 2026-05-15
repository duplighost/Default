# No Moon — Rebuilt (clean consolidated patch on v99 base)

Build tag: `qual.rebuilt.2026-05-15`
Service worker cache: `no-moon-rebuilt`

## What this is

The user asked for "fix it right, not quickly patch." This build does
that. It throws out the v100-v224 wrapper stack entirely and applies
ONE clean, consolidated, named-module patch on top of the original
v99 base.

Architecture: one IIFE at the bottom of the file. Named modules
(SunRoute, DrownedSun, Hazards, Damage, Combat, Debug). One wrapper
per engine function. Every wrapper checks an `__nmRebuilt` flag so
re-running is a no-op.

## What this fixes

- **Movement glitch / nausea** — no per-frame hazard re-priming.
  The v210 bug that re-primed timed hazards every frame is gone
  because we never call that from updateGame.
- **Final boss says "Graven Warden"** — wrapped bossDefeatLine,
  bossProperName, bossHonorific to return correct Drowned Sun names.
- **Final boss dies in one second** — Drowned Sun HP floor 720
  (was 220) plus per-1/8-second damage bucket cap so shotgun blasts
  can't one-shot.
- **Post-Drowned-Sun routing wrong** — `enterExit` blocked from
  Drowned Sky boss rooms so the win flow can fire properly.
- **Sun heat meter and damage disagree** — simple, clean rule:
  OPEN LIGHT builds heat, SHADE cools it, victory scene cools it,
  full heat damages.
- **Sun-route design (per user spec)**:
  - First clear: sun dies into crater. Crater is sealed (covered).
    Return Sigil is the win object. Touching sigil triggers the
    crater to visually UNCOVER as a teaser (player sees it open up,
    knows it's something they'll be able to use next time).
    Cannot enter Drowned Sky on first clear.
  - Later clear: sun dies into crater. Crater is OPEN and glowing.
    Sigil stays for the regular ending. Player has a real choice.
    Crater placed where it's easy to NOT touch accidentally.
- **Spore/snare hazards follow forever** — drift speed capped at
  20 px/sec, with repulsion when too close to the player so they
  can't glue.
- **Environmental damage shake/flash too aggressive** — caps on
  shake and flash for spore/snare/lane/pulse/ritual/sunlight while
  keeping full feedback for boss hits.
- **Fake Moon / Spiggot mini-bosses are solo duels** — they now
  spawn waves of enemies first. Wave 1 (3 enemies) → wave 2 (2 more
  enemies + boss wakes up). Killing the mini-boss drops a heart
  container.

## Console checks

```js
state.nmSelfTest()
state.nmDebug()
```

## How it differs from prior builds

- Built on **clean v99**, not on the v218 wrapper stack
- ONE patch instead of 18+ layered patches
- 46+ `updateGame` wrappers → 1 wrapper from us (engine still has
  its own pre-v99 wrappers but that's the engine itself, not us)
- Named modules instead of versioned layers
- Each fix has WHY/WHAT comments in the code
- The dropdown of "first clear sealed, later clear open" matches
  the user's exact stated design

## Important caveat

This was validated with static checks + node runtime simulation,
NOT a real mobile device. The user's last unverified concerns
(physical nausea from movement on real phone, exact sun-shadow
matching, etc.) need real device feedback to confirm.

## Upload

Drop the contents of the zip into the Netlify site root, preserving
folders. Hard refresh after deploy.
