# No Moon v54 — Tribal whisper layer

**Build tag:** `qual.future-consequence.2026-05-01.v54`
**Service worker cache:** `no-moon-future-consequence-v54`
**Base:** v53 Floor-condition badge mobile layout fix

## What v54 is

A pure flavor layer. At death/win/return overlays, v54 appends a single line drawn from the run's stats: *what the tribe whispers about you when you walk back through the threshold*.

Names follow the inside-the-world pattern (the tribe has a word for what you became, and the word is not praise):

| Whisper | Trigger |
|---|---|
| **The Sun-Owed** | Beat the Sun route (`state._v39SunPathCompletedThisWin`) |
| **The Debt-Taken** | Peak Moon Debt ≥ 8 (`runStats.moonDebtPeak`) |
| **The False-Lit** | ≥ 3 cursed bargains taken (`runStats.cursedBargainsTaken`) |
| **The Star-Eaten** | ≥ 12 Moon Splinters total this run (`player.moonSplinterTotal`) |
| **The Wall-Listener** | ≥ 4 reliquaries found (`runStats.reliquariesFound`) |
| **The Lantern-Bound** | Won carrying a Lantern Pup (`player.modules.scavengerDrone > 0`) |
| **The Moonless Witness** | Won base route without 3 Moonkeys (`!moonkeyEndingUnlocked`) |
| **The Breach-Walker** | Opened ≥ 3 breach rooms (`runStats.breachRoomsOpened`) |
| **The Threshold-Crosser** | Default fallback |

Priority order — the first matching name wins. So a Sun-route winner with 9 debt is *The Sun-Owed*, not *The Debt-Taken*.

The line wording adapts to context:

- Death overlay: *"The wall remembers you as **[name]**."*
- Base win: *"Safe Haven calls you **[name]**."*
- Sun route win: *"The Cold Sister knows you as **[name]**."*

All triggers map to existing run-stats fields. No new tracking required. No combat balance changes. No save format changes.

## Implementation

V54 IIFE at the patch-tower bottom wraps:

- **`updateOverlay`** outermost — appends whisper after V31 / V32 / V33 / V39 have set their overlay copy
- **`showOverlay`** outermost — appends whisper after V33's `applyReturnOverlayCopy` runs (V33 sets text inside its showOverlay wrap, which would otherwise wipe an updateOverlay-only append)
- **`startGame`** — resets per-run append counter

Idempotency check (`indexOf(whisper) >= 0`) prevents double-append within the same content. This is the same pattern v46 used to fix v31's runaway-append.

## Config knobs

```js
state.v54TribalWhisperSystem.config.ENABLED               // default true
state.v54TribalWhisperSystem.config.DEBT_THRESHOLD        // default 8
state.v54TribalWhisperSystem.config.CURSED_THRESHOLD      // default 3
state.v54TribalWhisperSystem.config.SPLINTER_THRESHOLD    // default 12
state.v54TribalWhisperSystem.config.RELIQUARY_THRESHOLD   // default 4
state.v54TribalWhisperSystem.config.BREACH_THRESHOLD      // default 3
```

## Validation

- `node --check` extracted inline game JS: PASS
- `node --check` game SW + root SW: PASS
- v54 build tag at IIFE constant + final assignment.
- v54 SW cache name correct.

## Manual playtest

1. Title build tag reads `qual.future-consequence.2026-05-01.v54`.
2. Die early: overlay should read *"The wall remembers you as **The Threshold-Crosser**."*
3. Run with high Moon Debt and finish: should read *"Safe Haven calls you **The Debt-Taken**."*
4. Beat Sun route: should read *"The Cold Sister knows you as **The Sun-Owed**."*
5. Win without 3 Moonkeys (base route): *"Safe Haven calls you **The Moonless Witness**."*
6. Console: `state.v54Debug()` shows `wouldWhisper: '...'`.

## Rollback

- Runtime disable: `state.v54TribalWhisperSystem.config.ENABLED = false;`
- Hard revert: delete the V54 IIFE; revert build tag + SW cache to v53. v46-v53 fixes intact.
