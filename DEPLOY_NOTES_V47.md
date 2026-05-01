# Deploy Notes — No Moon v47

## Build

- Game build tag: `qual.future-consequence.2026-05-01.v47`
- Game service-worker cache: `no-moon-future-consequence-v47`
- Base: v46 Bug-Fix Pass
- BGM asset unchanged: `/no-moon/no-moon-bg-v35.mp3`

## What v47 is

Stale Run-Flag Reset Pass. One additive IIFE that resets three persistent state flags on every `startGame()` call, fixing once-per-event behavior that had degraded into once-per-browser-session. See `NO_MOON_FUTURE_CONSEQUENCE_V47_PATCH_NOTES.md` for full details.

Summary:

1. `state._v30FinalWhispered` — V30's final-floor whisper flag now resets per run.
2. `state._v31FinalMoonkeyWhispered` — V31's parallel whisper flag now resets per run.
3. `state._v43BossMessageQuiet` — V43's boss-message-coalescer state now resets per run (was silently muting non-allowlisted messages for the first ~200 seconds of run 2+).
4. Bumped build tag and service-worker cache to v47.

## Cache note

The service-worker cache was bumped to `no-moon-future-consequence-v47`. After deploy, confirm the title screen reads:

```text
build: qual.future-consequence.2026-05-01.v47
```

The activate handler will delete the older `…v46` and earlier `no-moon-*` caches.

## Quick live checks

1. Title build tag reads `…v47`.
2. Start a run; play through normally. Should be visually identical to v46 / v45 / v44.
3. Verify `state.v47Debug()` returns a sane object with `currentFlagState` showing all three reset flags as `false` / `null` at run start.

## Two-run regression checks (the actual purpose of v47)

These are the scenarios v47 fixes. Test on a fresh browser session (or after a hard refresh) so previous session state is cleared:

### Test A — V30/V31 whisper reset

1. Run 1: get 3 Moonkeys. Reach the final exit. The "MOONKEYS TURN" / "MOONKEYS REMEMBER" whispers should appear (or be replaced by V38's shrine sequence if you also have a Sunkey).
2. Die or finish run 1.
3. Run 2: same setup, get 3 Moonkeys, reach the final exit. **Whispers should fire again** (or shrine should still take over). Before v47, the whispers were silently muted on run 2.

### Test B — V43 boss-message-quiet reset

1. Run 1: kill any boss/mini-boss (False Moon, Spiggot, Lien, Warden, Archon, etc.).
2. Die or finish run 1.
3. Run 2: in the **first 1-3 minutes** of run 2 (before any boss dies), play normally and watch for routine messages: "Doors unsealed", "Moon Debt wakes the floor.", "Repair waits at the end.", "Reliquary chamber — the pretty relic is probably lying.", etc. **They should appear.** Before v47, most of them would be silently dropped because the boss-message-quiet window from run 1 was still active.

## Debug checks (in browser devtools console)

```js
state.v47Debug()
state.v46Debug()
state.v45Debug()
```

Healthy v47 values right after a fresh `startGame()`:

```js
state.v47Debug().config.ENABLED === true
state.v47Debug().stats.runStarts >= 1
state.v47Debug().currentFlagState._v30FinalWhispered === false
state.v47Debug().currentFlagState._v31FinalMoonkeyWhispered === false
state.v47Debug().currentFlagState._v43BossMessageQuiet === null
```

## Rollback

This v47 release is additive. Each of the three resets is independently toggleable at runtime:

```js
state.v47StaleRunFlagResetSystem.config.RESET_V30_FINAL_WHISPERED = false;
state.v47StaleRunFlagResetSystem.config.RESET_V31_FINAL_MOONKEY_WHISPERED = false;
state.v47StaleRunFlagResetSystem.config.RESET_V43_BOSS_MESSAGE_QUIET = false;
```

To revert all of v47: delete the `installV47StaleRunFlagReset` IIFE and revert the build tag / cache name to v46. Other v46 systems (recovery shell counter, etc.) are untouched.
