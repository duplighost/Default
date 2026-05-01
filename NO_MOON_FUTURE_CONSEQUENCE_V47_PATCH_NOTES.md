# No Moon v47 — Stale Run-Flag Reset Pass

**Build tag:** `qual.future-consequence.2026-05-01.v47`
**Service worker cache:** `no-moon-future-consequence-v47`
**Base:** v46 Bug-Fix Pass

## Why this pass exists

A second focused fix pass after audit revealed three persistent state flags that were set to `true` (or to a stale object) per-run but never reset between runs. The result: their once-per-event behavior degraded into once-per-browser-session, with one of them silently muting most flavor messages for the first several minutes of any non-first run.

Like v46, this is surgical and additive. No design or balance changes. Sun Route, Safe Haven / Breathing Village, V42 hardening, V40 darkness guard, and combat tuning all untouched.

## What v47 fixes

A single new IIFE wraps `startGame` to reset three persistent flags at the start of every run:

### 1. `state._v30FinalWhispered`

V30's `enterExit` wrap whispers **THE MOONKEYS TURN UNDER THE THRONE** the first time the player reaches the final exit with 3+ Moonkeys. It sets `state._v30FinalWhispered = true` so it doesn't fire twice in the same run. V38's shrine sequence also force-sets the flag to `true` to deliberately suppress redundant whispers when the shrine takes over.

But V30's `startGame` wrap (which calls `resetRunMoonkeys()`) doesn't reset this flag. **Once true, it stays true for the rest of the browser session.** So on every subsequent run that reaches the final exit, the V30 whisper is silent.

### 2. `state._v31FinalMoonkeyWhispered`

Same exact pattern, V31's parallel whisper **THE THREE MOONKEYS REMEMBER THE FORBIDDEN DOOR**.

### 3. `state._v43BossMessageQuiet`

V43's boss-message-coalescer (v43 boss-message-coalesce window) sets:

```js
state._v43BossMessageQuiet = {
  until: state.time + BOSS_MESSAGE_WINDOW_SECONDS,
  shown: false,
  type: enemy.typeId,
  label: bossLabel43(enemy)
};
```

every time a boss/miniboss starts dying. Once a message has fired during the quiet window, `q.shown` becomes `true`. Subsequent non-allowlisted messages are suppressed without showing the boss line.

`state.time` resets to 0 in `startGame`, but `state._v43BossMessageQuiet` itself does not. So at the start of run 2:

- `q.until` still holds the run-1 value (e.g., `200.5`)
- `state.time` is `0`
- `bossQuietActive43()` checks `state.time <= q.until` → `0 <= 200.5` → **true**
- `q.shown` is `true` from run 1
- The wrap's `if (!q.shown) { … fire boss line … } else { suppress; return; }` falls into the suppress branch
- For ~200 seconds of game time at the start of run 2, normal flavor messages are silently dropped

**Effect**: any second-or-later run in a browser session feels weirdly quiet for the first several minutes.

## What v47 does

Adds an IIFE near the bottom of the patch tower (just after V46) that wraps `startGame` to:

```js
state._v30FinalWhispered = false;
state._v31FinalMoonkeyWhispered = false;
state._v43BossMessageQuiet = null;
```

Each reset is config-toggleable (`RESET_V30_FINAL_WHISPERED`, `RESET_V31_FINAL_MOONKEY_WHISPERED`, `RESET_V43_BOSS_MESSAGE_QUIET`) so any one can be disabled at runtime if needed.

This wrap is now the OUTERMOST `startGame` wrap (it goes after V30/V31/V32/V33/V37/V38/V39/V40/V42/V43/V44/V45's existing wraps), so it runs first when `startGame` is called and the resets happen before any other startGame logic that might depend on these flags. After the resets, V47 calls the inner chain.

V38's runtime suppression still works the same way: at the moment V38's `enterExit` wrap runs and sets `_v30FinalWhispered = true` / `_v31FinalMoonkeyWhispered = true`, subsequent V31 → V30 wraps (called in the chain after V38) see the flags as true and skip their whispers. Suppression within a single `enterExit` call is preserved.

## Runtime knobs

```js
state.v47StaleRunFlagResetSystem.config.ENABLED = true;
state.v47StaleRunFlagResetSystem.config.RESET_V30_FINAL_WHISPERED = true;
state.v47StaleRunFlagResetSystem.config.RESET_V31_FINAL_MOONKEY_WHISPERED = true;
state.v47StaleRunFlagResetSystem.config.RESET_V43_BOSS_MESSAGE_QUIET = true;
```

## Debug

```js
state.v47Debug();
```

After a fresh `startGame()` call, returns:

```js
{
  version: 'qual.future-consequence.2026-05-01.v47',
  buildTag: 'qual.future-consequence.2026-05-01.v47',
  config: { ENABLED: true, RESET_V30_FINAL_WHISPERED: true, ... },
  stats: { runStarts: 1, lastError: null },
  currentFlagState: {
    _v30FinalWhispered: false,
    _v31FinalMoonkeyWhispered: false,
    _v43BossMessageQuiet: null
  },
  v46: { ... }
}
```

## What's preserved

Unchanged by v47:

- v46 recovery shell exception counter
- v45 secret door sanity
- v44 Breathing Village
- v43 Sunkey/difficulty/clarity (its message-coalescer logic is untouched; only the stale-state-leak between runs is fixed)
- v42 canvas hardening
- v40 darkness guard
- v39 Sun Route
- v38 endgame coordination (its in-run V30/V31 suppression still works)
- v37 playtest fixes
- v30 Moonkey trials (its `resetRunMoonkeys` is unchanged; v47 just adds three more resets that V30 should arguably have done itself)
- v22-v36 systems
- combat balance, item tuning, narrative, visuals
- save format

## Validation

- `node --check` extracted inline game JS: PASS
- `node --check /no-moon/no-moon-sw.js`: PASS
- `node --check root no-moon-sw.js`: PASS
- v47 build marker audit: PASS (V47 string appears in V47 IIFE constant + final assignment; v46 string remains only as V46's internal constant)
- v47 service-worker cache audit: PASS

No real-browser playtest claimed for this pass.

## Manual playtest priorities

Specifically what to look for:

1. **Two-run final-whisper test:**
   - Run 1: get 3+ Moonkeys, reach the final exit (or beat the Archon). The whispers should fire normally.
   - Restart and do the same in run 2. **The whispers should fire again on run 2.** Before v47, run 2 was silent.

2. **Two-run boss-message test:**
   - Run 1: kill a mini-boss (False Moon, Spiggot, Lien, etc.) — boss line shows, then run continues.
   - Restart. In run 2's first few minutes, normal flavor messages (like "Doors unsealed", "Repair waits at the end.", "Moon Debt wakes the floor.") should appear. Before v47, they would be silently dropped.

3. **Title build tag** reads `qual.future-consequence.2026-05-01.v47`.

## Rollback

If a fix needs to be reverted in isolation, the v47 IIFE has per-flag toggles:

```js
state.v47StaleRunFlagResetSystem.config.RESET_V30_FINAL_WHISPERED = false;
state.v47StaleRunFlagResetSystem.config.RESET_V31_FINAL_MOONKEY_WHISPERED = false;
state.v47StaleRunFlagResetSystem.config.RESET_V43_BOSS_MESSAGE_QUIET = false;
```

To revert all of v47: delete the `installV47StaleRunFlagReset` IIFE (it's the last IIFE before the final hard build-tag assign) and revert build tag + cache name to v46.
