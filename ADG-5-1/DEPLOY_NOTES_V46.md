# Deploy Notes — No Moon v46

## Build

- Game build tag: `qual.future-consequence.2026-05-01.v46`
- Game service-worker cache: `no-moon-future-consequence-v46`
- Base: v45 Secret Door Sanity Pass
- BGM asset unchanged: `/no-moon/no-moon-bg-v35.mp3`

## What v46 is

Targeted bug-fix pass. Five surgical changes, no design or balance work, no narrative changes, no visual changes. See `NO_MOON_FUTURE_CONSEQUENCE_V46_PATCH_NOTES.md` for full details.

Summary of changes:

1. Fixed `lifetime.secrets` double-count in `commitRunSummary()`.
2. Fixed V31 win-overlay append guard regex (`!/last door/i` instead of `!/Safe Haven/i`).
3. Removed V45's per-frame `updateGame` sanitize wrap (perf).
4. Added v46 recovery-shell exception counter for observability.
5. Bumped build tag and service-worker cache to v46.

## Deploy options

### Full-site deploy

If you build a full-site zip from this source tree, it should look like:

```text
qualiacology-full-site-v3-2-with-game-v46.zip
```

### Game-only deploy

```text
qualiacology-no-moon-v46-game-only.zip
```

(Zips are not produced by this commit. Build them locally if you need them for Netlify.)

## Cache note

The service-worker cache was bumped to `no-moon-future-consequence-v46`. After deploy, confirm the title screen reads:

```text
build: qual.future-consequence.2026-05-01.v46
```

If an old build appears, close/reopen the tab or hard-refresh so the service worker claims the new cache. The activate handler will delete the older `no-moon-future-consequence-v45` cache.

## Quick live checks

1. Start a new run. Title build tag reads `…v46`.
2. Confirm Safe Haven still shows the v44 Breathing Village (no visual change from v45).
3. Move through several normal rooms.
4. Break colorful breakable wall/door plugs — V45 sanitize behavior unchanged. Real annexes pay out, real breaches open.
5. No tiny random fake seam should appear (V45 still in force).
6. Pick up a hidden secret reliquary somewhere; the run report's secret count should be correct (per pickup, not 2x).
7. If you can complete a Sun Route win, the win overlay text should be stable. No accumulating "you climbed beyond the tribe's last door…" wall on overlay redraws.

## Debug checks (in browser devtools console)

```js
state.v46Debug()
state.v45Debug()
state.v45SecretDoorAudit()
```

Expected v46 healthy values during normal play:

```js
state.v46Debug().config.ENABLED === true
state.v46Debug().stats.consecutivePhaseFailures === 0
state.v46Debug().stats.alertCount === 0
```

Expected v45 healthy values (preserved from v45):

```js
state.v45Debug().v43HiddenSeamsEnabled === false
state.v45Debug().scan.hiddenSeams === 0
state.v45Debug().scan.orphanDoorCapsules === 0
state.v45Debug().scan.brokenSecretDoors === 0
```

## Rollback

This v46 release is additive and surgical. Each fix is independent.

- To revert all of v46: replace the `ADG-5-1/no-moon/index.html` and `ADG-5-1/no-moon/no-moon-sw.js` with their v45 versions and revert the build tag / cache name. The other v45 systems are untouched.
- To revert just one fix: see `NO_MOON_FUTURE_CONSEQUENCE_V46_PATCH_NOTES.md` Section "Rollback".
