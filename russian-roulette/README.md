# Last Chamber — 3D Russian Roulette

A tense, turn-based 3D Russian roulette duel against an AI dealer, built with
[three.js](https://threejs.org/). Runs entirely in the browser with **no build
step and no runtime downloads** — three.js is vendored locally and all audio is
synthesized with the Web Audio API.

## Play

Open `index.html` in any modern browser (or serve the folder over HTTP), then
sit down at the table.

## Rules

- The cylinder holds **6 chambers**, loaded with a hidden mix of **live rounds**
  and **blanks**. The counts are shown; the order is not.
- Chambers are **not re-spun between pulls** — every trigger pull advances to the
  next chamber, so counting rounds tells you the odds.
- On your turn, call your shot:
  - **Shoot Yourself** — survive a blank and you keep the turn; a live round
    costs you a life and passes the turn.
  - **Shoot the Dealer** — a live round costs the dealer a life; either way your
    turn ends.
- When the cylinder empties, it reloads with a fresh, hidden arrangement.
- Lose all your lives and you lose the duel. Drop the dealer first to walk away.

Keyboard: `1` / `S` shoot yourself, `2` / `D` shoot the dealer.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup, HUD, menus |
| `style.css` | Presentation, atmosphere |
| `game.js` | Scene, revolver model, audio, game state machine, dealer AI |
| `three.min.js` | Vendored three.js r128 (MIT) |

It's a game of nerve and probability. Fiction — nothing more.
