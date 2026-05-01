# Deploy Notes — No Moon v53

## Build

- Game build tag: `qual.future-consequence.2026-05-01.v53`
- Game service-worker cache: `no-moon-future-consequence-v53`
- Base: v52 Shrine player visibility + Boon Moots capture safety

## What v53 is

Mobile layout fix: the V43 floor-condition badge ("FLOOR CONDITION: THE FLOOR HAS TEETH") was overlapping with the Sunkey and Moon Debt side chips at the start of every floor on phones (compact viewports, W < 720).

v53 repositions the badge below all side chips on compact, computing safe y by mirroring Sunkey HUD's offset logic. Adapts to whether player has Stars / Moonkeys collected.

Desktop unchanged.

See `NO_MOON_FUTURE_CONSEQUENCE_V53_PATCH_NOTES.md` for details.

## Cache note

Service-worker cache bumped to `no-moon-future-consequence-v53`. Activate handler will delete prior caches.

## Quick live checks

1. Title build tag reads `…v53`.
2. On mobile, enter floor 2+. The floor-condition badge no longer overlaps the Sunkey / Moon Debt chips — it sits below them.

## Rollback

Inline edit to drawConditionBadge43; revert that block + remove V53 IIFE to restore previous behavior. v46-v52 fixes intact.
