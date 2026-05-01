# No Moon v50 — Disable V35 external MP3, restore procedural BGM

**Build tag:** `qual.future-consequence.2026-05-01.v50`
**Service worker cache:** `no-moon-future-consequence-v50`
**Base:** v49 Gameplay friction normalization

## Why this pass exists

V35 added an external MP3 background track and routed all music through it by default. The original procedural synth-based BGM stayed intact in the file as a fallback. After playtesting V49, Alex prefers the procedural synth — it's responsive to gameplay state (intensity / boss-active hits change the music subtly), and the MP3 is a static loop.

V50 makes the procedural music the default again and removes the MP3 entirely.

## Changes

### 1. New V50 IIFE that flips V35's external-track flag at install time

```js
state.v35BackgroundMusicSystem.config.USE_EXTERNAL_TRACK = false;
```

V35's `startProceduralBgm`, `stopProceduralBgm`, and `runBgmScheduler` wraps already check this flag. With `USE_EXTERNAL_TRACK: false`, they all route to the legacy procedural path (`legacyStartProceduralBgm` etc.) that V35 captured. The synth plays.

V35's other audio plumbing (highpass/lowpass filters, dynamics compressor, gain ramps, music-toggle text sync) stays in place — it's still useful infrastructure.

### 2. Service worker: removed MP3 from cache and fetch routing

`ADG-5-1/no-moon/no-moon-sw.js`:

- `CACHE_NAME` bumped from `no-moon-future-consequence-v49` → `no-moon-future-consequence-v50`.
- `ASSETS` array dropped `'./no-moon-bg-v35.mp3'` (now `['./', './index.html']`).
- The `isBgmAsset` cache-first fetch branch removed entirely.
- Fetch handler now early-returns for any non-document request.

The activate handler will delete the older `…v49` cache (which still held the MP3 blob), so users on a returning visit get a smaller, cleaner cache.

### 3. MP3 file deleted

`ADG-5-1/no-moon/no-moon-bg-v35.mp3` is gone from the repo. Frees ~2.8 MB.

### 4. Build tag bumped

Final `state.buildTag = 'qual.future-consequence.2026-05-01.v50';` and SW `CACHE_NAME` bumped.

## What's preserved

- All procedural BGM plumbing: `BGM_TEMPO`, `BGM_BASS`, `BGM_ARP`, `BGM_LEAD`, `BGM_CHORDS`, `runBgmScheduler`, `startProceduralBgm`, `stopProceduralBgm`. These were always in the file; V35 wrapped them, V50 routes back to them.
- V35's IIFE itself stays. The audio graph (highpass, lowpass, compressor) is still set up. With `USE_EXTERNAL_TRACK: false`, the external `<audio>` element is never created and the graph just connects the procedural BGM through the legacy path.
- All SFX (`playToneBurst`, `playNoiseBurst`, threshold bell, victory chord, etc.) untouched. Those are independent of BGM choice.
- All other v46-v49 fixes intact.
- Combat balance, narrative, visuals, save format: no changes.

## Validation

- `node --check` extracted inline game JS: PASS
- `node --check /no-moon/no-moon-sw.js`: PASS
- `node --check root no-moon-sw.js`: PASS
- v50 build tag appears at V50 IIFE constant + final assignment.
- v50 SW cache name correct.
- No `no-moon-bg-v35` references in SW.
- MP3 file removed from repo.

## Manual playtest priorities

1. Title build tag reads `qual.future-consequence.2026-05-01.v50`.
2. Click **BGM ON**. Music should be the procedural synth, not the MP3 loop.
3. The music should subtly intensify in combat (the original "stress" parameter was wired to room danger / enemy presence) and add extra hits during boss fights.
4. Open browser devtools → Network tab → reload the page → confirm **no `no-moon-bg-v35.mp3` request** is made (would 404 anyway — the file is gone).
5. Open console:
   ```js
   state.v50Debug();
   ```
   Expected:
   ```js
   {
     version: 'qual.future-consequence.2026-05-01.v50',
     buildTag: 'qual.future-consequence.2026-05-01.v50',
     stats: { disabled: true, lastError: null },
     v35External: false
   }
   ```

## Rollback

To restore the MP3:

1. Restore the file: `git show HEAD~1:ADG-5-1/no-moon/no-moon-bg-v35.mp3 > ADG-5-1/no-moon/no-moon-bg-v35.mp3` (replace `HEAD~1` with any pre-v50 commit hash).
2. Restore the SW changes: bring back the MP3 in `ASSETS` and the `isBgmAsset` fetch branch.
3. Delete the V50 IIFE.
4. Revert build tag and SW cache to v49.

Or runtime-only revert (no code change): in devtools console, `state.v35BackgroundMusicSystem.config.USE_EXTERNAL_TRACK = true;` then BGM OFF/ON. (The MP3 file would need to be present for the external track to actually play; with the file deleted it would fail and fall back to procedural anyway.)

## Note on transitional cache states

When a returning player loads v50:

- **First visit on v50**: their service worker is still v49. SW serves the cached v49 `index.html` (which has `…v49` build tag). On the next reload, SW activates v50, claims clients, deletes old caches.
- **Second visit on v50**: SW is now v50. Serves v50 `index.html`. New cache has no MP3 entry.

If a player has the v50 `index.html` but the v49 SW still cached the MP3, that's harmless — V50 never requests the MP3, so the cached blob just sits there until v50's activate handler runs and deletes the old cache.

## Sequence dependency

V50 depends on V35 having installed properly (the `state.v35BackgroundMusicSystem` object must exist). Since IIFEs install in source-order at script load and V35 is far above V50 in the file, V35 installs before V50 every time. The V50 IIFE also has a defensive check (`if (...state.v35BackgroundMusicSystem && state.v35BackgroundMusicSystem.config)`) so it no-ops gracefully if V35 isn't there.
