# No Moon v45 — Secret Door Sanity Pass

**Build tag:** `qual.future-consequence.2026-05-01.v45`  
**Service worker cache:** `no-moon-future-consequence-v45`  
**Base:** v44 Breathing Village

## Why this pass exists

v43 added small random hidden wall seams. In practice they could look like the existing colorful breakable secret-door plugs while not opening a real annex/breach behind them. That made some door-like glows appear to lead nowhere and blurred the difference between legitimate secret doors and decorative/bonus seams.

v45 removes that ambiguity.

## Changes

- Disables v43 random hidden seams at runtime:
  - `state.v43SunkeyDifficultyClaritySystem.config.HIDDEN_SEAMS = false`
  - `state.v43SunkeyDifficultyClaritySystem.config.HIDDEN_SEAMS_PER_LEVEL = 0`
- Purges any existing `_v43HiddenSeam` obstacles from current/generated rooms.
- Purges orphan breakable capsule obstacles that have hidden rewards/enemies but no annex, no real breach, and no valid secret-door geometry.
- Purges broken `isSecretDoor` obstacles only if they lack valid annex geometry.
- Preserves real secret annex doors.
- Preserves real breach doors.
- Leaves Sunkey, Moonkey, Moon Path, v44 Breathing Village, v43 difficulty curve, music, and combat logic intact.

## Player-facing effect

The small random seams that looked like fake tiny breakable doors are gone. The obvious colorful breakable wall/door plugs should now correspond to real annexes or real breaches again.

## New debug helpers

```js
state.v45Debug()
state.v45SecretDoorAudit()
```

Healthy values after starting a run should include:

```js
state.v45Debug().v43HiddenSeamsEnabled === false
state.v45Debug().scan.hiddenSeams === 0
state.v45Debug().scan.orphanDoorCapsules === 0
state.v45Debug().scan.brokenSecretDoors === 0
```

Legitimate secret systems can still show:

```js
state.v45Debug().scan.annexSecretDoors >= 0
state.v45Debug().scan.realBreachDoors >= 0
```

## Validation

- `node --check` extracted inline game JS passed.
- `node --check /no-moon/no-moon-sw.js` passed.
- `node --check root no-moon-sw.js` passed.
- v45 build marker audit passed.
- v45 service-worker cache audit passed.
- v44/v43 preservation marker audit passed.
- VM secret-door sanity smoke test passed:
  - injected fake v43 hidden seam was removed
  - injected orphan breakable capsule was removed
  - injected valid annex secret door was preserved
  - injected valid real breach door was preserved
- Full-site/game-only parity checks passed.
- `unzip -t` passed for both output zips.

## Manual playtest still needed

Play several floors and shoot/break any visible colorful wall plugs. Expected behavior:

- True annex secret doors open / pay out normally.
- Real breach doors still open hidden rooms.
- No tiny random seam should pop up and pretend to be a door.
- No colorful breakable door should appear without a real wall/annex/breach purpose.
