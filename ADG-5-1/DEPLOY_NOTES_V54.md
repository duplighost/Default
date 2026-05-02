# Deploy Notes — No Moon v54

## Build

- Game build tag: `qual.future-consequence.2026-05-01.v54`
- Game service-worker cache: `no-moon-future-consequence-v54`
- Base: v53 Floor-condition badge mobile layout fix

## What v54 is

Tribal whisper flavor layer. On death/win/return overlays, appends a single line ("what the tribe whispers about you") based on run stats. No mechanical change.

See `NO_MOON_FUTURE_CONSEQUENCE_V54_PATCH_NOTES.md`.

## Cache note

Service-worker cache bumped to `no-moon-future-consequence-v54`. Activate handler will delete prior caches.

## Quick live checks

1. Title build tag reads `…v54`.
2. Die on floor 1-2 quickly: overlay should show *"The wall remembers you as **The Threshold-Crosser**."*
3. Console: `state.v54Debug()` returns whisper config + current candidate.

## Rollback

Independent of other passes. To revert:
1. `state.v54TribalWhisperSystem.config.ENABLED = false;` for runtime test.
2. Or delete V54 IIFE and revert build tag + cache to v53.
