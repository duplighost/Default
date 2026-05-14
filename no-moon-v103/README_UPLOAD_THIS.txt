# No Moon v103 — Eclipse Reborn Aurora Polish

Build tag: `qual.eclipse-reborn-aurora.2026-05-14.v103`
Service worker cache: `no-moon-eclipse-reborn-aurora-v103`

Layered on top of v102 Final Polish. v103 is the game-feel pass —
smooth-as-butter and beautiful. Every effect is additive juice with hard
caps to keep it from tanking framerate on mobile.

## v103 polish layer

- **Floating damage numbers.** When an enemy takes damage, a small
  number floats up in the enemy color (white-gold on crit / big hits).
  Capped at 18 concurrent.
- **Enemy hit flash.** White screen-blend pulse on every hit, on top
  of the existing hurt tween.
- **Hit pause.** Tiny ~130ms freeze at 0.18x speed when the player
  takes damage. The hit reads as a beat, not noise.
- **Active-use slow-mo.** Brief 220ms 0.45x slow-mo + double ring
  flourish + spark burst whenever an active relic fires. Detected via
  `useFlash` rising. The cast moment feels meaningful.
- **Pickup celebration.** Tracks pickups via WeakMap; when one is
  consumed (`it.remove = true`), spawns a ring + spark at its position.
- **Low-HP screen pulse.** Red radial gradient pulses at the screen
  edges when HP <= 25% (breathing animation) and amplifies briefly on
  every player-damage event.
- **Ambient atmosphere motes.** 18-20 floating particles per room,
  tinted to the biome (sun = warm gold, drowned-sky = cool blue,
  default = soft violet). Capped at 24.
- **Soft global vignette.** Subtle radial darkening at screen edges.
  Keeps focus on the action.
- **Player motion trail.** Up to 10 fading dots behind the player,
  colored by the character's accent.

## Inherited from v102

- Active item EFFECT power buffs (timer scan, 35-50% longer durations)
- Floor decal cleanup on Drowned Sky floors 0/1
- Cleanse FX on regular boss kills (Warden, Archon)

## Inherited from v101 Addendum

- Named "running enemies" (Fake Moon, Spiggot) spawn alongside normal
  enemies; heart container on death; +45% HP / +15% damage.
- Star economy throttle (~70% rate + per-room cap of 5).
- Spore hazards drift toward player ~90 px/sec.
- Hazard color glyphs per kind.
- Boon Moots active swap guard.

## Inherited from v100 base (ChatGPT consolidation)

- Sun-clear count from save + mirror + localStorage.
- Open crater calls v80 Drowned Sky entry; Return Sigil guarded.
- Starless door leave-and-reenter guard (fixes Warden auto-warp).
- Empty combat rooms repopulated.
- Pickups hazard-sanitized + auto-magnetized.
- Captains hardened with heart/marrow drop.
- Sun heat meter always visible (shade-aware).
- Sun phase-2 invuln clamp.
- Boss-room major-safe ghost rings.
- Character buffs for rook/nyx/mire/moots/vesper/nadir.
- Moots E-key fallback.

## Console checks after upload (hard refresh)

```js
state.v103SelfTest()
state.v103Debug()
state.v102SelfTest()
state.v101SelfTest()
state.v100SelfTest()
```

Expected:
- `state.v103SelfTest().ok === true`
- `state.v103SelfTest().priorLayers.ok === true`
- After combat: `state.v103Debug().stats.damageNumbers > 0`
- After taking damage: `state.v103Debug().stats.hitPauses > 0`
- After firing an active: `state.v103Debug().stats.activeSlowMos > 0`

## Manual feel-check

1. Shoot an enemy — number floats up in their color.
2. Take a hit — brief freeze + red pulse.
3. Fire an active — slow-mo beat + sparkle ring.
4. Grab a pickup — small celebration burst.
5. Walk around a sun-biome room — gold motes drift past.
6. Drop to 1-2 HP — screen edges pulse red rhythmically.
7. Move quickly — soft trail behind the player.
8. Edges of screen feel darker / focused.

## Upload

Upload the contents of this zip to the Netlify site root, preserving
folders. Hard refresh after deploy.
