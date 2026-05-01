# No Moon v46 — Targeted Bug-Fix Pass

**Build tag:** `qual.future-consequence.2026-05-01.v46`
**Service worker cache:** `no-moon-future-consequence-v46`
**Base:** v45 Secret Door Sanity Pass

## Why this pass exists

A focused pass to address bugs identified in a code audit. Five targeted fixes, no design or balance changes, no narrative changes, no visual changes. The Sun Route, Safe Haven / Breathing Village, V42 canvas hardening, V40 darkness guard, and combat tuning are all untouched.

## Changes

### 1. Lifetime `secrets` count was double-counting

`pickupSecret()` already calls `addLifetimeStat('secrets', 1, true)` per pickup, which increments `state.save.lifetime.secrets`. `commitRunSummary()` was *also* aggregating `state.stats.secrets` into `state.save.lifetime.secrets` at run end, so each secret pickup was counted twice in the lifetime tally.

**Effect:** the "Cache Fiend" achievement (goal: 10 lifetime secrets) was unlocking after 5 actual pickups instead of 10.

**Fix:** removed the run-end aggregation line in `commitRunSummary()`. Per-pickup increment via `addLifetimeStat` is preserved, so achievement progress still updates live during a run.

**Side-effect for returning players:** existing inflated `lifetime.secrets` values stay in saves; no inflation continues from this point. Cache Fiend stays unlocked for anyone who already had it.

### 2. V31 win-overlay append guard regex was checking the wrong phrase

V31's `applyNarrativeOverlayCopy()` had a fallback branch that does `overlayText.innerHTML += ' You climbed beyond the tribe\'s last door...'` if the win overlay didn't already contain "Safe Haven". But the appended sentence doesn't contain "Safe Haven" itself, so the guard was checking for the wrong text and the append wasn't actually idempotent.

Today this is harmless because V32's `applyUltimateOverlayCopy()` runs after V31 and does an `overlayText.innerHTML = '...'` assignment, wiping V31's append before it would matter.

If V32's apply ever fails (its body is wrapped in `try/catch` that swallows errors), V31's append would start running unguarded on every overlay refresh, growing the text indefinitely.

**Fix:** changed the guard regex from `!/Safe Haven/i.test(...)` to `!/last door/i.test(...)` so it now matches the appended sentence's distinctive phrase. The branch is now genuinely idempotent.

### 3. V45 was sanitizing the level on every game frame

V45's `installV45SecretDoorSanity` IIFE wrapped `updateGame` to call `sanitizeLevel45(state.level, ...)` twice per frame (before and after the base updateGame). Each call allocates a fresh `Set` and a scan-result object, then walks every room × every obstacle.

The other V45 wraps (`generateLevel`, `syncActiveRoom`, `startGame`, `damageObstacle`) already cover the actual sanitization needs. The per-frame wrap was redundant belt-and-suspenders that contributed unnecessary GC pressure on every frame.

**Fix:** removed the `updateGame` wrap inside the V45 IIFE. The other four wraps are preserved. `state.v45SecretDoorAudit()` and `state.v45Debug()` still work; the manual audit calls `sanitizeLevel45` directly.

**Effect:** cleaner per-frame budget, especially noticeable on slower mobile devices.

### 4. New: recovery shell exception counter

The existing recovery shell (`recoverFromGameException` in the v10 stability pass) catches per-frame exceptions, logs to console, and shows a throttled "Stabilized" message at most once per 2.4 seconds. If a real bug throws on every frame, the player sees one quick "Stabilized" flash and the game pretends to keep running while every frame silently fails — no way to tell something is actually wrong.

v46 adds a small additive IIFE that:

- counts consecutive exceptions in the same phase,
- after `ALERT_AFTER_CONSECUTIVE` (default 30 ≈ 0.5 seconds at 60 fps) failures in a row, surfaces a visible "Run interrupted — please refresh." message and a `console.warn`,
- has an `ALERT_COOLDOWN_SECONDS` (default 8) so the alert doesn't spam,
- resets the counter on any clean `updateGame` frame.

This doesn't change any existing behavior in normal play — it just makes persistent bugs visible instead of gaslighting the player.

Runtime knobs:

```js
state.v46RecoveryShellSystem.config.ENABLED = true;
state.v46RecoveryShellSystem.config.ALERT_AFTER_CONSECUTIVE = 30;
state.v46RecoveryShellSystem.config.ALERT_COOLDOWN_SECONDS = 8;
state.v46RecoveryShellSystem.config.LOG_TO_CONSOLE = true;
```

Debug:

```js
state.v46Debug();
```

### 5. Build tag and service-worker cache bumped to v46

- `state.buildTag` is now `qual.future-consequence.2026-05-01.v46`.
- `/no-moon/no-moon-sw.js` `CACHE_NAME` is now `no-moon-future-consequence-v46`.

The activate handler will delete the older `no-moon-*` caches as designed.

## What's preserved

Untouched by this pass:

- v44 Breathing Village Safe Haven
- v43 Sunkey/difficulty/clarity
- v42 canvas-state leak hardening
- v40 opening darkness guard
- v39 Moon Path / Sun Route
- v38 endgame coordination
- v37 playtest fixes
- v36 tribal village
- v35 external BGM
- v34 polish
- v33 Safe Haven hub
- v22–v32 systems
- combat balance, item tuning, Black Lotus, Lunar Caliber
- the full message-coalescing window and boss-allow list
- the Sun boss, Sun Throne, Cold Sister return, all narrative
- character templates (Rook / Nyx / Sol / Mire)
- save format (`SAVE_VERSION = 4`, `noMoonSave_v1`)

## Validation

- `node --check` extracted inline game JS: PASS
- `node --check /no-moon/no-moon-sw.js`: PASS
- `node --check root no-moon-sw.js`: PASS
- v46 build marker audit: PASS (V46 string appears in V46 IIFE constant and final assignment; V45 string remains only as the V45 IIFE's own internal constant)
- v46 service-worker cache audit: PASS (CACHE_NAME updated; no stale `…v45` reference)
- v45 / v44 preservation marker audit: PASS (their IIFEs untouched)

No real-browser playtest claimed for this pass. The fixes are mechanical and surgical; the manual playtest checklist in `DEPLOY_NOTES_V46.md` covers what to look for.

## Manual playtest priorities

1. Pick up a secret reliquary in a run; check the run report — it should count secrets correctly (no 2x inflation).
2. Beat the run on Moon Path / Sun Route; the win overlay text should be stable on repeated overlay refreshes (no growing wall of "you climbed beyond the tribe's last door…" sentences).
3. Shoot/break colorful secret door plugs — V45 sanitize behavior unchanged; real annexes still pay out.
4. (Optional) Open browser devtools → Console → run `state.v46Debug()` to confirm the recovery shell counter is wired up (`config.ENABLED: true`, `stats.consecutivePhaseFailures: 0` during normal play).

## Rollback

If any individual fix needs to be reverted:

- **Fix 1**: re-add `state.save.lifetime.secrets += state.stats.secrets || 0;` to `commitRunSummary` (around line 2706 in v46 source).
- **Fix 2**: revert the regex from `/last door/i` back to `/Safe Haven/i` in V31's `applyNarrativeOverlayCopy`.
- **Fix 3**: re-add the V45 `updateGame` wrap inside `installV45SecretDoorSanity`.
- **Fix 4**: delete the `installV46RecoveryShellCounter` IIFE (it's the last IIFE before the final hard build-tag assign).
- **Fix 5**: revert `state.buildTag` and the SW `CACHE_NAME` to v45.

Each fix is independent. Reverting one doesn't break the others.
