# No Moon v53 — Floor-condition badge mobile layout fix

**Build tag:** `qual.future-consequence.2026-05-01.v53`
**Service worker cache:** `no-moon-future-consequence-v53`
**Base:** v52 Shrine player visibility + Boon Moots capture safety

## The bug

On mobile (compact viewports, W < 720), the V43 floor-condition badge ("FLOOR CONDITION: THE FLOOR HAS TEETH") was positioned at y=74 — exactly the same vertical band the side HUD chips occupy:

- Top-left chip ("B2/10 · R1/8 · Narthex / Verdigris Court / Mire 4/7 HP") spans y=10-74
- Sunkey chip (left side, below top chip) spans y=82-108
- Moon Debt chip (right side, below minimap) spans y=74-104

The badge at y=74 with width 360px on a 414px-wide phone covered both side chips. Text was unreadable because of the overlap.

## The fix

Inline edit to `drawConditionBadge43` (inside V43's IIFE). On compact viewports, the badge now positions itself **below** all the side chips by mirroring the Sunkey HUD's offset logic:

```js
if (compact) {
  const layout = gameplayUiLayout();
  if (layout) {
    const topChipBottom = layout.topChip.y + layout.topChip.h;        // 74
    const starOffset = (player.moonSplinters > 0) ? 32 : 0;
    const moonkeyOffset = moonkeyCount43() > 0 ? 34 : 0;
    const sunkeyChipBottom = topChipBottom + 8 + starOffset + moonkeyOffset + 26;
    const moonChipBottom = layout.moonChip.y + layout.moonChip.h;     // 104
    y = Math.max(sunkeyChipBottom, moonChipBottom) + 8;
  }
}
```

This adapts to the player's progress:
- New floor, no Stars, no Moonkeys → Sunkey at y=82, ends at 108. moonChip ends at 104. Badge at max(108, 104)+8 = **y=116**.
- Has Stars but no Moonkeys → Sunkey at y=114, ends at 140. Badge at **y=148**.
- Has Stars + Moonkeys → Sunkey at y=148, ends at 174. Badge at **y=182**.

Always clear of side chips, regardless of progression state.

Desktop layout (W ≥ 720) is unchanged — there's plenty of horizontal space at y=82, no overlap to fix.

## What v53 doesn't change

- Desktop badge position (y=82) — unchanged.
- Badge content, colors, fonts, fade-in/out timing.
- Floor-condition text or any V27 floor identity logic.
- Combat, narrative, visuals, save format.
- All v46-v52 fixes preserved.

## Validation

- `node --check` extracted inline game JS: PASS
- `node --check /no-moon/no-moon-sw.js`: PASS
- `node --check root no-moon-sw.js`: PASS
- v53 build tag at V53 IIFE constant + final assignment.
- v53 SW cache name correct.
- Inline edit to drawConditionBadge43 in V43's IIFE preserves all surrounding code.

## Manual playtest

1. Title build tag reads `qual.future-consequence.2026-05-01.v53`.
2. On mobile (or browser devtools mobile-emulation, e.g., 414×896 iPhone XR), start a run.
3. Reach floor 2 — a floor with a condition (e.g., "THE FLOOR HAS TEETH").
4. The floor condition badge should appear **below** the Sunkey and Moon Debt chips, not overlapping them. All three should be readable.
5. As you collect Stars and Moonkeys mid-run, side chips push down. The badge on the next floor should also push down accordingly.
6. On desktop, the badge appearance is unchanged.

## Rollback

To revert: change the inline `if (compact) { … }` block in `drawConditionBadge43` back to `let y = compact ? 74 : 82;` and delete the V53 IIFE. Other v46-v52 fixes are untouched.
