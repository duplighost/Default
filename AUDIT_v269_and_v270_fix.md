# No Moon v269 audit + v270 First Walker trophy fix

User upload audited: `3ca56632-nomoonrebuiltv269mobilepicturerestore.zip`
Build chain present in v269: v265 → v266 → v268 (mobile-title-scroll-start) → v269 (mobile-picture-restore)

## Confirmed bugs in v269

### 1. The First Walker (the new boss) does not drop a boss trophy — fixed in v270

Every other major boss triggers a boss-trophy draft when its room is cleared, via this hook (`no-moon/index.html:36965`):

```js
if (room && room.kind === 'exit' && room.hasBoss && level && level.index !== FINAL_BOSS_LEVEL && sys.config.BOSS_TROPHIES) {
  sys.pendingBossTrophy = chooseBossTrophy();
  ...
}
```

It requires `room.kind === 'exit'`. The First Walker's room is created with `kind: 'normal'` (`no-moon/index.html:66918`), so the hook never fires. Result: defeating the First Walker drops nothing.

**v270 fix:** A new install block wraps `killEnemy` AFTER v262's own wrap. When a First Walker dies, it calls the existing exposed boss-trophy API `state.v58ForceBossDraft()` after a 420ms delay (so v262's ring/spark/shake from `markFirstWalkerKilled` plays first). The 420ms delay is a small grace period so the kill-effects play uninterrupted before the draft UI opens.

The patch is data-only — it does not change `ENEMY_TYPES`, `MAJOR_BOSS_IDS`, `BOSS_SLOTS_261`, `TROPHY_ITEMS`, or any closure-local arrays. It uses only the exposed `state.v58ForceBossDraft` API, which itself reuses the existing `chooseBossTrophy` pool.

Verify in console: `noMoonV270SelfTest()` → `ok: true`. Then beat the First Walker and a 4-card draft with a boss trophy will appear ~420ms after the death.

### 2. First Walker is not in `MAJOR_BOSS_IDS` (line 44403) or `MAJOR_BOSS_RE90` (line 50160) — not fixed in v270, low impact

The closure-local arrays in v77 / v90 don't include `v262FirstWalker`. Most callers also short-circuit on `enemy.boss === true`, which First Walker has, so the practical impact is limited to:

- Line 49764: enemy bullets are tagged `b.bossSource = true; b.majorHazard = true` based on a regex over `b.sourceEnemyType`. First Walker's bullets aren't in that regex, so the player's bullet-feedback / boss-aware mercy windows don't treat its bullets as boss-class. Cosmetic / damage-feel issue, not a soft lock.

Fixing this from outside requires either rewriting the v77/v90 closures or patching every bullet First Walker fires. Skipped for now to keep v270 minimal.

### 3. First Walker is not in `BOSS_SLOTS_261` constellation — already partially compensated

The main constellation HUD (`BOSS_SLOTS_261` at line 65845) doesn't include First Walker. But v262 ships its own `drawV262ConstellationAddon` (line 67446) which paints a separate WALKER mark on the canvas after the kill. Cosmetically the kill is visible. Not perfect integration with the moon-outline, but not broken.

### 4. First Walker is not in `BOSS_CARDS71` Field Guide deck — minor

The Field Guide boss deck (line 42086) shows defeated bosses as cards. First Walker isn't in this list, and there's no `first-walker-card.webp` asset in `/assets/no-moon/bosses/`. Other recently-added bosses like Drowned Sun use a v81 DOM-append pattern (`appendDrownedSunBossCard81` at line 47980) to add themselves to the deck after the v71 render. Same pattern could be applied for First Walker once an art asset exists.

## Flow audits

### Title → splash → passenger select → first descent

- v66 owns title flow (`applyTitleFlow66` at line 41174). Splash writes empty eyebrow + "NO MOON" h1 + empty text + "START" button + empty meta. Select writes "choose a moon-headed passenger" eyebrow + "Choose a moon-headed Passenger..." text + "Descend as X" button.
- v265's `handleCoreStartButton265` (line 3786) gates correctly: title+title state opens passenger select on first click, then starts run on second click.
- v268's `cleanSplash` adds `body.v267TitleSplashActive` class, which v268 + v269 CSS uses to lock the splash to `100dvh` / `--nm-vh` (avoiding the iOS 100vh URL-bar bug) and force the title art as the overlay background. v269 then forces character-card portraits with absolute-path fallback. Sound architecture.
- Sound: `audioToggle` and `musicToggle` are hidden by `body.v267TitleSplashActive` (line 67743) which differs from earlier behavior where they were restored. Trade-off ChatGPT made for a "cleaner" mobile splash.

### Drowned Sky path with First Walker insertion

Sequence after v261 + v262 augmentation:
```
preboss → shipyard → maw → walker (First Walker) → boss (Drowned Sun)
```

- v261 (`augmentDrownedSkyStage` at line 66217) inserts shipyard + maw, rewrites doors: `preboss → shipyard → maw → boss`. Old `preboss → boss` door is filtered out (line 66238).
- v262 (`installFirstWalkerRoom` at line 66956) inserts walker between maw and boss. Source = `maw || pre`. Rewrites doors: source side-door now goes to walker (needsCleared), walker has back→source + forward→boss (needsCleared), boss back→walker.

Both run in `updateGame` post-hook, v261 then v262, so the order is right. The `_v261DrownedSkyExtraRoomsAdded` and `_v262FirstWalkerRoomAdded` flags prevent double-insertion. Path is sound.

### Final boss → moon reveal → return to title → next run

1. Player defeats Null Archon at floor 10.
2. `v260` arms reveal prompt via the win overlay.
3. User clicks "Descend" → `state._v251BeginReveal` → reveal animation plays for 18.2s.
4. `finishReveal` (line 61033) sets `state.mode = 'win'`, `overlayMode = 'win'`, shows "Back under as X" overlay.
5. ~1 frame later, v262's `updateGame` post-hook detects `revealCompletedLike()` and calls `returnToPassengerSelect` (line 67410).
6. `clearFinalFlags` (line 67396) resets all win/reveal flags, sets mode='title', overlayMode='title', and calls `showOverlay('title')`.
7. v66's `showOverlay` wrap routes to `setTitleStage66('select', 'title-open')` because `bootSplashShown` is already true.
8. Passenger select shows. User picks character, clicks Descend → `startGame` → mode='play' → new run.

**Potential issue:** The 1-frame "Back under as X" overlay is briefly visible before v262 pulls back to title. On a 60fps device this is ~16ms; on a slow phone with 30fps render, ~33ms. Could appear as a brief flash. Not a soft-lock.

**Soft-lock safety:** v262's `_v262SuppressRevealUntil = now() + 9000` prevents the reveal from immediately re-arming during the 9-second cooldown after return. v260's `startGame` wrap (line 65686) resets `_v260PostRevealTitleDone`, `_v260EndingAutoStarted`, etc. v262's startGame wrap (line 67464) resets `_v262EndingConsumed` and `_v262SuppressRevealUntil`. No flag survives that would block a future reveal.

## Files in v270

- `README_UPLOAD_THIS.txt` — updated to mention v270 walker trophy
- `no-moon/index.html` — added v270 install block before `renderCodexStats()` call
- `no-moon/game_inline.js` — same
- `index_script.js` — same

Build tag: `qual.v270-first-walker-trophy.2026-05-22.v270` (only used by the v270 install block; v269's pulse loop still owns `state.buildTag` so the HUD shows v269 — by design, this patch is purely additive on top of v269 and does not fight v269 for ownership of the buildtag display).

Zip: `no-moon-rebuilt-v270-first-walker-trophy.zip`
SHA256: `3c51793d16333ab44e5122482082d78db3c784c127e8a7211cff3486ab32a844`

## Validation done in this session

- `node --check` passes for all four script files.
- Inline script inside `no-moon/index.html` matches the `no-moon/game_inline.js` sidecar.
- Sidecar matches root `index_script.js` exactly.
- `unzip -t` clean.
- Grep confirms `installV270FirstWalkerTrophy` present exactly once in each JS-bearing file.

## Validation NOT done

- Live mobile browser test. No Chromium / Playwright / Puppeteer in this container.
- Confirmation that `state.v58ForceBossDraft` works as expected on real gameplay. It's exposed at line 37284, calls `chooseBossTrophy()` to pick a trophy, then `offerDraft()`. The v58 wrap of `offerDraft` (line 36941) injects the trophy into the 4 draft cards. This is the same mechanism used for Warden/Archon/Night Ferry/Sun/Drowned Sun bosses, so it should work for First Walker too — but it requires real play to confirm.

## What was deliberately NOT changed

- Mobile splash CSS (v268/v269 own this; touching it would resurrect the earlier crop / scroll / button issues).
- Title state machine (v265/v266 own this; rewriting would be risky).
- v246 title video (works in v269, no reported issues).
- Any closure-local data array (`MAJOR_BOSS_IDS`, `BOSS_SLOTS_261`, `TROPHY_ITEMS`, `BOSS_CARDS71`). Adding to these would require re-running their parent install blocks, which is risky. Instead I used existing exposed APIs.

## What to check after upload

1. Open `/no-moon/?fresh=1` on the device. Open console (or use Safari Web Inspector / Chrome remote debug for mobile).
2. Run `noMoonV270SelfTest()`. Expect `{ ok: true, installed: true, v58ApiPresent: true, v262Installed: true, ... }`.
3. Play through to the Drowned Sky branch (after Warden, take the night-sky route). Find the buried habitat room.
4. Kill the First Walker. ~420ms after the kill, a draft UI should pop up with 4 cards — one of them tagged as a boss trophy.
5. If the draft does not appear, check console for `[No Moon v270]` errors and run `noMoonV270Debug()` to see `walkerKills`, `trophiesOffered`, `skipped`, `lastReason`.
6. To force a test without killing the boss: `noMoonV270ForceWalkerTrophy()` from the console while in play mode.
