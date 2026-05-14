# No Moon v212 — Mobile-Safe (on top of v211 run-completion fixes)

Build tag: `qual.mobile-safe.2026-05-15.v212`
Service worker cache: `no-moon-mobile-safe-v212`

This is v211 with a mobile-safe "lite mode" added. Every gameplay fix
from v210 and v211 stays. The HEAVIEST per-frame visual additions
auto-disable when the device looks like a phone or tablet.

## Why this exists

The user reported on mobile: heavy screen flashing, slowdown after
an explosion, floor decals flashing rapidly. v211's modules added
several draw-time effects (hazard color glyphs, active-cast ring
flourish, boss-cleanse motes, enemy intent telegraph) that compound
poorly with the engine's existing particle system on slower hardware.

v212 auto-detects mobile and disables those heavier additions while
keeping all gameplay fixes intact.

## What's gated off on mobile (auto)

| Feature                          | Mobile        | Desktop       |
|----------------------------------|---------------|---------------|
| Hazard color glyph overlay       | off           | on            |
| Active-cast ring + spark burst   | off (slow-mo still fires) | on |
| Boss cleanse motes per kill      | 8 max         | 32 max        |
| Enemy intent dashed-line draw    | off           | on            |
| All gameplay logic               | on            | on            |
| Damage numbers / HUD chips       | on            | on            |
| Hit pause / low-HP pulse         | on            | on            |
| Sun heat meter / pickup labels   | on            | on            |
| All v211 progression fixes       | on            | on            |

## How auto-detection works

```js
NM.detectMobile = function(){
  const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const smallScreen = window.innerWidth < 900;
  const uaMobile = /Mobi|Android|iPhone|iPad|iPod|Mobile Safari/i.test(navigator.userAgent);
  return !!(hasTouch && (smallScreen || uaMobile));
};
```

The check requires touch AND (small viewport OR mobile UA). If you're
on a desktop with a touchscreen, lite mode won't trigger. If you're on
a tablet in landscape with 1024px width, it will trigger.

## Manual override

If auto-detect gets it wrong, override in console:

```js
noMoonSetLiteMode(true)    // force lite mode on
noMoonSetLiteMode(false)   // force lite mode off
noMoonIsLite()             // current state
```

These take effect on the next frame.

## Inherited from v211

- Progress module restores moonkey/sunkey unlocks from save on startGame
- Per-run flag reset clears `_v79InDrownedSky`, `_v80InDrownedSky`,
  `_v39DeferredMoonPathFromShrine`, sun-route handoff flags, v59
  sky-branch flags
- SunRoute.markSunBossDefeated writes to all save mirrors on sun-boss
  kill (state.save.defeatedBosses.sunCore + numeric counters)
- SunRoute.readCount has boolean fallback that always runs
- QA module with noMoonQA* skip-to-end helpers
- All v210 modules unchanged

## About ChatGPT's mobile patch that broke the teleporter

I haven't seen that patch and can't fix what I can't see. v212 is
based on v99 + my modular patch, NOT on ChatGPT's recent mobile-fix
attempts. So the teleporter break should not be in v212. If you
deploy v212 over whatever Netlify currently has, that bug should
disappear with it.

If the teleporter is STILL broken after v212 deploys, paste me the
console output from these commands at the moment it breaks:

```js
state.nmDebug()
noMoonQADumpState()
```

## Console checks (paste after hard refresh)

```js
state.nmSelfTest()
state.nmDebug()
noMoonIsLite()
noMoonQARunSmokeTest()
```

Expected:
- `state.nmSelfTest().ok === true`
- `noMoonIsLite()` is `true` on phone, `false` on desktop
- `noMoonQARunSmokeTest().ok === true`

## Upload

Drop the contents of the zip into the Netlify site root, preserving
folders. Hard refresh after deploy.
