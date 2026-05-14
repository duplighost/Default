# No Moon v211 — Run-Completion Fixes (on top of v210)

Build tag: `qual.run-completion-fixes.2026-05-15.v211`
Service worker cache: `no-moon-run-completion-fixes-v211`

This is v210's modular consolidation plus three targeted bookkeeping
fixes that almost certainly explain why you've been unable to reach
the final biome through normal play, plus a set of console-callable
QA tools so you can verify the ending pipeline without playing through.

## Why this exists

You reported that on your second playthrough, you beat the Sun boss,
the crater was still SEALED ("hole still not open"), the Return Sigil
looked different, you touched it, and you got the standard win flow
instead of entering the secret biome.

A code audit found three bookkeeping bugs that match this exactly:

1. The "moonkey ending unlocked" flag was never restored from save.
   When you collect 3 moonkeys, the game flips
   `state.moonkeyEndingUnlocked` in memory. That flag is what the
   floor-5 shrine checks before opening the Sun Route. Because the
   flag only lived in memory and `startGame()` never restored it from
   save, every run after the first started with the flag cleared.
   **You were locked out of the alt path on every run after the first.**

2. The Sun-clear count lived in only one fragile localStorage key.
   When you defeated the Sun boss, the game incremented
   `localStorage['noMoon.v39.sunPathClearCount']`. It did NOT write to
   `state.save.victories.sunClears` or
   `state.save.defeatedBosses.sunCore`. If that one key got evicted
   (cache clear, incognito, storage pressure), the next run thought
   you'd never beaten it. **The crater spawned sealed even though
   you'd earned the open state.**

3. The "I'm currently in the secret biome" flags never reset.
   `state._v79InDrownedSky` and `state._v80InDrownedSky` were set when
   you entered Drowned Sky and never cleared on new runs. On run 2,
   when you touched the crater, the entry check refused because
   "you're already in it." **Same gate, second time, locked.**

## What changed

v211 keeps v210's clean modular architecture and adds:

### New module: Progress

Owns the save/restore of unlock flags and the reset of per-run flags.
Called from the `startGame` wrapper on every run start.

- `Progress.restoreUnlocksFromSave()` walks every save mirror
  (`state.save.victories`, `state.save.defeatedBosses`, the v39
  localStorage counter, the v68 progress JSON blob) and sets
  `state.sunkeyEndingUnlocked = true` / `state.moonkeyEndingUnlocked = true`
  if ANY mirror says you've earned it.
- `Progress.resetPerRunFlags()` clears
  `state._v79InDrownedSky`, `state._v80InDrownedSky`,
  `state._v77SunAwaitingReturnTouch`, `state._v39SunVictoryHandoff`,
  `state._v39SunPathCompletedThisWin`, `state._v39MoonPathActive`.

### Enhanced module: SunRoute

- `SunRoute.markSunBossDefeated()` writes the sun victory to ALL save
  mirrors: `state.save.defeatedBosses.sunCore = true`,
  `state.save.victories.sunClears`, `state.save.victories.sunPathClears`,
  the v39 localStorage counter, and the v68 progress blob. This is
  what the v210 build was missing.
- `SunRoute.readCount()` now also reads
  `state.save.defeatedBosses.sunCore` as a BOOLEAN fallback. If every
  numeric counter is wiped but the boolean survives in even one
  mirror, the crater spawns OPEN.

### New module: QA

Console-callable jump-to functions, modeled after ChatGPT's v105 QA
spine. If a new progression bug appears that v211 didn't catch, you
can use these to skip past it and confirm the ending pipeline still
works:

```js
noMoonQAStartRun('rook')
noMoonQAKillRoom()
noMoonQAGotoDrownedSky()
noMoonQAGotoDrownedSun()
noMoonQAKillDrownedSun()
noMoonQATouchColdLantern()
noMoonQARunSmokeTest()    // runs all of the above end-to-end
noMoonQADumpState()
```

`noMoonQARunSmokeTest()` should return `{ ok: true, ... }` and the
final state should show `mode: 'win'`, `drownedSunDefeated: true`,
`nadirUnlocked: true`.

## Hooks added to existing wrappers

- The `startGame` wrapper now calls `Progress.resetPerRunFlags()` and
  `Progress.restoreUnlocksFromSave()` before any other v211 work.
- The `killEnemy` wrapper now calls `SunRoute.markSunBossDefeated()`
  when the dying enemy is the sun boss (`typeId === 'sunCore'`).

## Everything else from v210 is unchanged

- RoomContract, RespawnBrake, Doors, Pickups, Combat, Hazards,
  Bosses, Balance, Feel, HUD modules are all the same.
- Same 15 engine wrappers.
- Same shared helpers.

## Console checks (paste after hard refresh)

```js
state.nmSelfTest()
state.nmDebug()
noMoonQARunSmokeTest()
noMoonQADumpState()
```

Expected:
- `state.nmSelfTest().ok === true`
- `noMoonQARunSmokeTest().ok === true`
- `noMoonQADumpState().save.sunCoreDefeated` is true after your first
  sun-boss kill (and stays true across runs).

## How to test the actual fix

1. Hard refresh after deploy.
2. Start a run. Get to the Sun Throne and defeat the sun boss. The
   crater will be sealed (first clear) — touch the sigil, win.
3. Start a new run (or just `noMoonQAStartRun('rook')`).
4. Run `noMoonQADumpState().save.sunCoreDefeated` — should be `true`.
5. Get back to the Sun Throne (or `noMoonQAGotoDrownedSky()` to skip
   straight to the secret biome).
6. The crater should now spawn OPEN. Walking onto it should enter
   Drowned Sky.

## Upload

Drop the contents of the zip into the Netlify site root, preserving
folders. Hard refresh after deploy.
