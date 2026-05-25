# The Passenger Who Noticed Back — Tactile Edition

Mobile-first top-down 2D arcade. This is the second-pass build focused on the user's requested corrections: No Moon-style two-thumb-anywhere controls, tactile movement tuning, less button clutter, plainer text, tighter emotional coherence, and endless scaling.

## Run

Open `index.html` from this folder, or open the standalone one-file build:

`the_passenger_who_noticed_back_tactile.html`

## Mobile controls

- Put the left thumb down anywhere: move.
- Flick the left thumb outward: dash.
- Put the right thumb down anywhere: aim and fire.
- Tap the right thumb quickly: pulse, when charged.

No fixed on-screen attack buttons.

## PC controls

- WASD / arrows: move
- Mouse hold: aim/fire
- Shift: dash
- E or right-click: pulse
- Tab: codex
- U: sound

## Tactile pass details

- Starting, stopping, and direction reversal now use deliberately different coefficients.
- Direction reversals get extra response instead of syrupy drift.
- Stopping emits short brake particles when you release from speed.
- Dash is shorter, harder, and cleaner, with a stronger velocity burst and shorter trail timing.
- Player bullets get mild aim assist toward enemies in the aim cone, so mobile right-thumb play feels fair without becoming autopilot.
- Hits, kills, dash, pulse, and hurt all have tuned hit pause, shake, haptics, and particle timing.

## Validation performed

- `node --check game.js`
- Headless Chromium `set_content` smoke tests on:
  - 320×568 mobile
  - 360×780 mobile
  - 390×844 mobile
  - 430×932 mobile
  - 844×390 landscape
  - 1280×820 desktop
- All tested viewports returned:
  - no page errors
  - no horizontal overflow
  - no visible touch target under 44px
  - playable state starts correctly
  - two-thumb input smoke test runs without runtime errors
- Additional mobile playthrough smoke:
  - first room cleared by right-thumb aim/fire
  - portal entered with left-thumb movement
  - upgrade screen opened with no overflow or undersized touch targets

## QA helpers

```js
passengerTactileSelfTest()
passengerTactileDebug()
passengerTactileStart()
passengerTactileUnlockAll()
passengerTactileReset()
```

Legacy aliases beginning with `passengerThumbprint...` still work.
