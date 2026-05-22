# No Moon — v266c revert overlay (on top of v266 clean title/reveal audit)

Build tag: `qual.v266c-revert-overlay.2026-05-22.v266c`
Zip: `no-moon-rebuilt-v266-clean-title-reveal-audit.zip`
SHA256: `d437a0794b6c42de30cf167a594826a1c7393126d3b122a97182d6982e4f9539`

## Why v266c

Two CSS-only attempts (ChatGPT's v266 + my v266b) to make the title screen "minimal full-screen art + single button at the bottom" both broke on mobile. The container I'm working in has no Chromium / Playwright / Puppeteer, so each attempt was an unverified hypothesis about how the v65TitleArt image background, the v246 title video layer, and the v66 panel stack interact on a real phone. With no way to visually verify, I'm reverting to the layout that was working before the overlay attempts.

## What v266c does

Reduces the `installV266CleanTitlePresentation` block to its essentials:

- `tag()` keeps writing the build tag to `state.buildTag`, `state.cacheExpected`, `state.nmSystem`, and the `#buildTagDisplay` element.
- `inject()` injects exactly one CSS rule: restoring `#audioToggle` / `#musicToggle` visibility on splash (v66's `body.v66SplashActive` hide rule would otherwise hide them).
- `pulse()` = `inject()` + `tag()`. No more `cleanSplashLabel()`. No more panel/button position overrides.

## What is removed (vs v266 and v266b)

- The entire splash CSS overlay that:
  - made `.panel` `position:fixed; width:100vw; height:100vh; transparent`
  - hid `.eyebrow`, `h1`, `#overlayText`, `#codexBtn`, `#overlayMeta`, `#buildTagDisplay`, `#characterGrid`, `.cards`, `.footerInfo` on splash
  - floated `.actions` at `top:74%` (v266) or `bottom:max(...)` (v266b)
  - sized `#startBtn` with custom min-heights, letter-spacing, border-radius
- The select-state title-art override (v266b only).
- The `cleanSplashLabel()` text mutator. v66's `applyTitleFlow66()` already writes the same minimal labels on splash:
  - eyebrow: empty
  - h1: `NO MOON`
  - overlayText: empty
  - `#startBtn`: `START`
  - `#codexBtn`: `Field Guide`
  - overlayMeta: empty

## What is preserved

All engine fixes from v265 and v266 stay intact:

- Core `startBtn` click + Enter/Space handler is the clean three-function state machine (`basePassengerSelectOpen265` / `openPassengerSelectCore265` / `handleCoreStartButton265`). Splash click opens passenger select; select click starts the run.
- `state._v251BeginReveal` / `state._v251ArmRevealPrompt` exposed; reveal can be invoked directly. Reveal no longer fakes `startBtn.click()`.
- `v257` auto-reveal calls `state._v251BeginReveal('v257-auto-trigger')` with stale flag clearing.
- `v260 maybeAutoStartReveal` early-exits + clears stale flags when on title with no final-win evidence.
- `v260 finalWinLike()` no longer counts an armed reveal prompt as "in win flow".
- `v261 forceStartReveal` gated off the title screen.
- The bad v265 canonical title controller, `Passenger List`, "front door remembers", and the nine guard sites are absent.
- v262 First Walker block (habitat, attacks, persistence) preserved.
- v261 endgame: Sun draft, Drowned Sky, skiff homing minions, constellation HUD.
- SFX/BGM splash visibility fix kept (now the only CSS in the v266 layer).

## Files changed (vs v266b)

- `README_UPLOAD_THIS.txt`
- `no-moon/index.html`
- `no-moon/game_inline.js`
- `index_script.js`
- `CHANGELOG_v266.md`

In each of the three JS-bearing files: the `inject()` body inside `installV266CleanTitlePresentation` was reduced to one CSS rule, `cleanSplashLabel()` deleted, `pulse()` no longer calls it, build-tag / cache-key strings bumped to `qual.v266c-revert-overlay.2026-05-22.v266c` / `no-moon-v266c-revert-overlay-v266c`.

## What this means for the user

The mobile splash now looks like v66's native splash — a centered dark panel with "NO MOON" headline and a "START" button, with the title art behind. Not the full-bleed art-and-button-only design that ChatGPT and I were trying to ship. That design may be achievable, but doing it safely needs either a real mobile browser to iterate against or screenshots to debug from.

If the user wants to try the full-bleed design again, the cleanest next step is to send a screenshot of v266c on mobile so I can see exactly what's rendering, and from there either ship a more conservative CSS layer or rebuild the splash with a structural change (real `<img>` element instead of CSS backgrounds).

## Validation

Done in this session:

- `node --check` passes for `no-moon/game_inline.js`, `index_script.js`, `no-moon/no-moon-sw.js`, `no-moon-sw.js`.
- Inline script in `no-moon/index.html` matches `no-moon/game_inline.js` (modulo the trailing newline inside the `<script>` wrapper).
- `no-moon/game_inline.js` matches `index_script.js` exactly.
- `unzip -t` on the deploy zip — no errors.
- Grep confirms presence of `v266c: minimal CSS` exactly once in each of the three JS-bearing files.
- Grep confirms absence of `v66TitleSplash.v65TitleArt .panel` (the removed overlay selector) in all three JS-bearing files.
- v265 / v262 / v261 / v66 install blocks still present.

Not done in this session:

- Live mobile browser test. No browser available in the container.
