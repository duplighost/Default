# No Moon — v266 clean title/reveal audit (+ SFX/BGM splash fix)

Build tag: `qual.v266-clean-title-reveal-audit.2026-05-21.v266`
Zip: `no-moon-rebuilt-v266-clean-title-reveal-audit.zip`
SHA256: `cc43cb661410db923c5f65228fcaf40237b6cf108f0cffef454bca8cf68a1a94`

## What changed vs the bad v265 (`canonical-title-first-walker`)

- Deleted the v265 canonical title controller, including:
  - the "Passenger List" front-door button label
  - the "the front door remembers" eyebrow + explanatory copy
  - the `v265-canonical-title-css` style block
  - the `__v265CanonicalTitleControllerInstalled` runtime flag and all nine guard sites in v66/v70/v72/v73/v92/v251/v258/v259 that referenced it
  - the `window.noMoonStartButtonDispatch` shim and its capture listeners on `#startBtn` / `#codexBtn` / `#characterGrid`
- Replaced the core `startBtn` click handler and the keyboard Enter/Space handler in `no-moon/index.html:3672` with a plain core state machine:
  - `basePassengerSelectOpen265()` reports whether passenger select is currently visible.
  - `openPassengerSelectCore265()` performs the splash → select transition.
  - `handleCoreStartButton265(ev, reason)` is the single dispatcher: a splash click opens passenger select; a select click starts the run.
- Exposed `state._v251BeginReveal` / `state._v251ArmRevealPrompt` so reveal can be invoked directly. Reveal no longer fakes a `startBtn.click()`.
- `v257` auto-reveal: stale flag clear + direct `state._v251BeginReveal('v257-auto-trigger')` instead of synthesised button clicks.
- `v260` `maybeAutoStartReveal`: early-exit + clear `_v251RevealPromptArmed`, `_v260EndingAutoArmedAt`, `_v260EndingAutoStarted` when we are on the title screen with no real final-win evidence. Prevents the moon-reveal loop on title return.
- `v260` `finalWinLike()`: removed `_v251RevealPromptArmed` and `_v251Reveal.armed` from the evidence list so an armed prompt alone no longer marks the engine as "in win flow".
- `v261` `forceStartReveal` gated on `!(state.mode === 'title' && state.overlayMode === 'title')`.

## What changed vs ChatGPT's v266 (this build)

Single targeted fix on top of ChatGPT's v266:

- Added one CSS override inside the existing `v266-clean-title-css` block to restore SFX/BGM toggle visibility on the splash:

```css
body.v66SplashActive #audioToggle,
body.v66SplashActive #musicToggle {
  display: inline-flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
```

  This counteracts v66's `body.v66SplashActive #audioToggle, #musicToggle, #hudMenuBtn { display:none }` rule. `#hudMenuBtn` (settings cog) is intentionally left hidden on splash to keep the title clean. SFX and BGM remain reachable.
- Updated `README_UPLOAD_THIS.txt` to mention the fix.

## Files changed (vs ChatGPT's v266)

- `README_UPLOAD_THIS.txt`
- `no-moon/index.html`
- `no-moon/game_inline.js`
- `index_script.js`

Each of the three JS-bearing files gained exactly two lines (one comment + one CSS rule) inside the existing `installV266CleanTitlePresentation` block.

## Preserved content

- v262 First Walker block (`installV262FirstWalkerHabitat`) is byte-identical to v265: enemy registration, buried-habitat room, astronaut remains decorations, 9 attack hazards, phase transitions, corpse drawing, persistence.
- v261 endgame: Sun draft gate, Drowned Sky expansion, Moon Skiff homing minions, constellation HUD.
- Drowned Sun, Nadir unlock, Vesper unlock, Moots unlock, the Field Guide deck.
- Service-worker disabled / cleanup stub only.

## Validation

Done in this session:

- `node --check no-moon/index.html` (extracted inline) — parses.
- `node --check no-moon/game_inline.js` — parses.
- `node --check index_script.js` — parses.
- `node --check no-moon/no-moon-sw.js` — parses.
- `node --check no-moon-sw.js` — parses.
- Inline script inside `no-moon/index.html` matches `no-moon/game_inline.js` exactly.
- `no-moon/game_inline.js` matches `index_script.js` exactly.
- `unzip -t` on the deploy zip — no errors.
- Greps confirm absent: `Passenger List`, `front door remembers`, `THE FRONT DOOR REMEMBERS`, `v265-canonical-title-css`, `__v265CanonicalTitleControllerInstalled`, `noMoonStartButtonDispatch`, `installV265Canonical`.
- Greps confirm preserved: `installV262FirstWalkerHabitat`, `v262FirstWalker`, `persistFirstWalkerDefeat`, `installV261EndgameSunDraftDrownedSkySkiffs`.
- Greps confirm fix is in all three JS-bearing files (1 occurrence each).
- `serviceWorker.register` absent.

Not done in this session:

- Live browser test. Chromium in this container blocks `file://` and `localhost` with `ERR_BLOCKED_BY_ADMINISTRATOR`, same constraint ChatGPT reported. Visual confirmation of the title screen, click flow, death overlay, Sun draft, moon reveal, First Walker arena, etc. needs an external browser.

## Known residual notes

- v66 still owns title strings under the hood: `applyTitleFlow66()` continues to write "Choose Passenger" / "Descend as X" to `startBtn` and prose to `overlayText`. The v266 layer hides those strings on the splash via CSS and the `pulse()` loop overwrites `startBtn.textContent` back to `START` every frame. The result is visually correct, but the v66 owner is still alive under the veneer. A future cleanup pass could physically delete those rewrite lines in `applyTitleFlow66()` and remove `installV266CleanTitlePresentation`'s `pulse()` loop.
- `#hudMenuBtn` (settings cog) is hidden on splash by design — splash is intentionally minimal: title art + START + SFX + BGM.
