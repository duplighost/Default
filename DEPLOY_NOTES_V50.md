# Deploy Notes — No Moon v50

## Build

- Game build tag: `qual.future-consequence.2026-05-01.v50`
- Game service-worker cache: `no-moon-future-consequence-v50`
- Base: v49 Gameplay friction frame-rate normalization
- BGM: **procedural synth (V35 external MP3 disabled, MP3 file removed)**

## What v50 is

Disables the V35 external MP3 background track and restores the original procedural synth BGM as the default. The MP3 file is also removed from the repo. See `NO_MOON_FUTURE_CONSEQUENCE_V50_PATCH_NOTES.md` for full details.

## Cache note

Service-worker cache bumped to `no-moon-future-consequence-v50`. Activate handler will delete prior `no-moon-*` caches (including the v49 cache that still held the MP3 blob).

## File-size impact

Removing the MP3 frees ~2.8 MB from the deploy. Useful if you build a deploy zip from this source.

## Quick live checks

1. Title build tag reads `…v50`.
2. Click **BGM ON** — music should be the procedural synth, not the MP3 loop. Tempo around 86 BPM. Subtle intensity changes in combat.
3. **Network tab in devtools → reload page → no `no-moon-bg-v35.mp3` request** is made. (The file is gone from the repo so the request would 404 anyway, but with v50 the request is never sent in the first place.)
4. Console:
   ```js
   state.v50Debug();
   // expect:
   //   stats: { disabled: true, lastError: null }
   //   v35External: false
   ```

## Rollback

If you decide the MP3 was actually the right call:

1. Restore the MP3 file from any pre-v50 commit: `git show HEAD~1:ADG-5-1/no-moon/no-moon-bg-v35.mp3 > ADG-5-1/no-moon/no-moon-bg-v35.mp3`.
2. Revert the SW changes (bring back the MP3 in `ASSETS` and the `isBgmAsset` fetch branch).
3. Delete the V50 IIFE.
4. Revert build tag + cache name to v49.

Or fast runtime test with the file restored: `state.v35BackgroundMusicSystem.config.USE_EXTERNAL_TRACK = true;` in console, then BGM OFF/ON.

## What didn't change

- All v46-v49 fixes preserved.
- All SFX, message audio, threshold bell, victory chord, etc.: unchanged.
- Sun Route, Safe Haven / Breathing Village, narrative, visuals: unchanged.
- Save format: unchanged.
