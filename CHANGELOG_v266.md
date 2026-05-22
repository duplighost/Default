# No Moon — v266b mobile splash fix (on top of v266 clean title/reveal audit)

Build tag: `qual.v266b-mobile-splash-fix.2026-05-22.v266b`
Zip: `no-moon-rebuilt-v266-clean-title-reveal-audit.zip`
SHA256: `95167f7f7256d81ce7b0ac095578bc5d278f80386e5f989e1597c1999cd1a2ab`

## Why v266b

Mobile testing of v266 reported: the title screen "doesn't fit", the START button is hard to hit, and scrolling on/after the screen reveals "another image". Three root causes identified in ChatGPT's v266 CSS:

1. `.panel { position: fixed; width: 100vw; height: 100vh }` on the splash — `100vh` on mobile includes the URL bar, so the panel was taller than the visible viewport. Combined with the overlay's `overflow-y: auto`, this made the splash scrollable when it shouldn't have been.
2. `.actions { top: 74% }` — percent-of-viewport positioning of the START button drifts as the URL bar shows/hides on mobile. Tapping where the button used to be sometimes lands on the background, not the button.
3. On the passenger-select screen, the title-art is still painted as the `#overlay` background (`v65TitleArt`). The panel scrolls inside the overlay with `align-items: flex-start`, and when content exceeds viewport, scrolling reveals the title-art image below the panel — the "another image" the tester saw.

## v266b fixes (CSS-only, inside the existing `installV266CleanTitlePresentation` block)

### Splash

- `.panel`: switched from `position: fixed; height: 100vh` to `position: absolute; height: 100%`. Absolute positions relative to `#overlay` (which is already viewport-pinned via `position: fixed; inset: 0`), so the panel always matches the *actual* visible viewport, never the inflated `100vh`.
- `#overlay.v66TitleSplash.v65TitleArt { overflow: hidden; overscroll-behavior: none; touch-action: manipulation }` — no scrolling on the splash, period.
- `.actions`: bottom-anchored — `bottom: max(48px, env(safe-area-inset-bottom, 24px))` (mobile: `max(36px, env(safe-area-inset-bottom, 20px))`). No more `top: 74%`.
- `#startBtn`: `min-height: 60px` desktop / `58px` mobile, `touch-action: manipulation`, larger hit target.
- Also explicitly hides `#characterGrid`, `.cards`, `.footerInfo` on splash (was already hidden by v66 but belt-and-braces).

### Select

- `#overlay.v66TitleSelect.v65TitleArt` background overridden with a dark gradient — title-art image no longer bleeds through behind/below the cards when scrolled.
- `#nmTitleMediaLayer` hidden on select — the v246 title video also no longer plays under the cards.

### SFX/BGM (unchanged from earlier v266 fix)

- `body.v66SplashActive #audioToggle, #musicToggle { display: inline-flex }` — counteracts v66's hide rule, so SFX/BGM stay reachable on splash. `#hudMenuBtn` (settings cog) intentionally left hidden on splash for a clean title.

## What was kept from ChatGPT's v266 audit base

- Core `startBtn` click + Enter/Space handler rewritten in the main script body to a clean three-function state machine (`basePassengerSelectOpen265` / `openPassengerSelectCore265` / `handleCoreStartButton265`). Splash click → opens passenger select. Select click → starts the run.
- `state._v251BeginReveal` / `state._v251ArmRevealPrompt` exposed; reveal can be invoked directly. Reveal no longer fakes `startBtn.click()`.
- `v257` auto-reveal calls `state._v251BeginReveal('v257-auto-trigger')` directly with stale flag clearing.
- `v260 maybeAutoStartReveal` early-exits + clears stale flags when on the title with no final-win evidence.
- `v260 finalWinLike()` no longer counts an armed reveal prompt as "in win flow".
- `v261 forceStartReveal` gated off the title screen.
- The bad v265 canonical title controller, `Passenger List`, "front door remembers", and the nine `__v265CanonicalTitleControllerInstalled` guard sites are absent.
- v262 First Walker block preserved byte-identical to the v265 source.

## Files changed (vs the previous v266 zip)

- `README_UPLOAD_THIS.txt`
- `no-moon/index.html`
- `no-moon/game_inline.js`
- `index_script.js`

In each of the three JS-bearing files: the v266 CSS block inside `installV266CleanTitlePresentation` was rewritten (about a dozen lines), and the build-tag/cache-key strings (`V265_VERSION` / `V266_VERSION` / `V265_CACHE` / `V266_CACHE`) were bumped to `qual.v266b-mobile-splash-fix.2026-05-22.v266b` and `no-moon-v266b-mobile-splash-fix-v266b`.

## Validation

Done in this session:

- `node --check` passes for `no-moon/game_inline.js`, `index_script.js`, `no-moon/no-moon-sw.js`, `no-moon-sw.js`.
- Inline script inside `no-moon/index.html` matches `no-moon/game_inline.js` (modulo trailing newline from the `<script>` wrapper, which is the same shape as ChatGPT's original v266).
- `no-moon/game_inline.js` matches `index_script.js` exactly.
- `unzip -t` on the deploy zip — no errors.
- Greps confirm presence of the new CSS: `v266b: SPLASH` and `v266b: SELECT` in all three JS-bearing files.
- Greps confirm absence of: `100vh!important`, `top:74%`, `Passenger List`, `front door remembers`, `v265-canonical-title-css`, `__v265CanonicalTitleControllerInstalled`, `noMoonStartButtonDispatch`.
- Greps confirm preservation: `installV262FirstWalkerHabitat`, `installV261EndgameSunDraftDrownedSkySkiffs`, `installV266CleanTitlePresentation`, `installV265ConsolidatedTitleRevealAudit`.

Not done in this session:

- Live mobile browser test. Container has no Chromium / Playwright / Puppeteer installed; even ChatGPT had Chromium but it was blocked from `file://` and `localhost`. The CSS reasoning above is grounded in the v66 / v246 / v65TitleArt source rules I read in the file, plus a look at the actual mobile title art (`no-moon-title-mobile.webp`) which has "NO MOON" at the bottom and the eclipse at the top.

## What this build cannot promise without a real mobile browser

- I cannot guarantee the title art crop is what the user calls "full". `background-size: cover` fills both dimensions and crops the longer axis; for the 941×1672 mobile.webp on a typical 360×800 portrait phone, the crop is ~45px each side horizontally with the vertical extent of the image fitting the viewport. If the user wants the entire image visible with letterbox bars, that requires `background-size: contain` and a deliberate art direction change — flag this and we can flip it.

## Known residual

- v66's `applyTitleFlow66()` still writes title strings under the hood; the v266 layer's `pulse()` overwrites `startBtn.textContent` back to `START` every frame. Visually correct but it's a veneer over an older owner. Future v267 could physically delete those rewrite lines and remove the pulse loop.
- `#hudMenuBtn` (settings cog) stays hidden on splash by design.
