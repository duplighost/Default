# No Moon — handoff to the next model (Claude → GPT-5.5 Pro, v82)

This is what Claude built between v76 and v82, where the bodies are buried, and what to do (and not do) next. Read this once. It will save you an hour of reverse-engineering 80 IIFEs.

## TL;DR

- Live build: **v82** — build tag `qual.nadir-black-anchor-active.2026-05-14.v82`. Service worker cache `no-moon-nadir-black-anchor-active-v82`.
- Source on disk: `/home/user/Default/ADG-5-1/no-moon/{index.html, game_inline.js, no-moon-sw.js}`.
- Drop-in zip: `/home/user/Default/releases/no-moon-v82-website.zip` (3.7 MB, 39 files).
- Direct download URL (worked for Alex on v81 and v82): `https://github.com/duplighost/Default/raw/claude/investigate-code-functionality-gP8aM/releases/no-moon-v82-website.zip`
- Branch: `claude/investigate-code-functionality-gP8aM` on `duplighost/Default`. Older zips for rollback live in `/releases/` next to the current one.
- `node --check` passes on `game_inline.js` and `no-moon-sw.js`. `index.html`'s embedded `<script>` is byte-identical to `game_inline.js` (verified sha256 match on every build).

## Architecture in 60 seconds

The whole game is one IIFE in `game_inline.js`. Inside that closure, 80 nested IIFEs stack on top of each other (a "patch tower"). Each release adds one IIFE near the bottom that wraps the prior functions.

Wrap order rule: **outermost = newest = fires first.**

```
new wrapper(args)
  → calls base (= previous wrapper)
    → calls its base
      → ...
        → real function
      ← returns
    ← post-code runs
  ← post-code runs
← post-code runs
```

This means a wrapper that wants to **intercept** behavior puts its code in the **pre-base** position (before `baseFn.apply(this, arguments)`). A wrapper that wants to **react** to the result puts it in **post-base** (after the return).

Inside the closure, helpers like `currentRoom()`, `state.player`, `state.enemies`, `state.bullets`, `damageEnemy()`, `spawnRing()`, `spawnSpark()`, `pushMessage()`, `clearHostileProjectiles()`, `playToneBurst()`, `playViewCenterX()`, `playViewCenterY()`, `triggerTransition()`, `syncActiveRoom()`, `moveEntity()`, `IS_MOBILE()`, `drawHudGlassPanel()`, `createPlayerBullet()`, `fireEnemyBurst()`, `fireEnemyRing()`, `roundRectPath()`, and `TAU` are all in scope. Use them — don't reinvent.

Things exposed on `state.X` are reachable from *outside* the closure (so a tail patch can call them). Things declared with `function` or `const` inside an inner IIFE are **closure-local** and can only be reached by wrapping the global symbol the IIFE binds them to (e.g. wrap `renderWorld`, can't reach `drawStarlessDoors71` directly).

## Build manifest v76 → v82 (newest first)

Each commit on the branch corresponds to one build. The commit messages have full detail. Summary:

| Build | Tag | Key surfaces it wraps | Save / state keys it writes |
|---|---|---|---|
| **v82** | `qual.nadir-black-anchor-active.2026-05-14.v82` | `updateGame`, `drawHUD`, `renderWorld`, `setRoomCleared`, `startGame`, `canvas` pointerdown, `window` keydown ('e'), `spawnSpark`, `spawnRing`, `drawAmbientWorld` | `state.v82BlackAnchor`, `room._v82BlackAnchors[]` |
| **v81** | `qual.drowned-sun-nadir-final-passenger.2026-05-14.v81` | `renderCharacterCards`, `updateOverlay`, `safeWriteSave`, `startGame`, `killEnemy`, `openCodex`, `renderCodexStats`, `drawPlayer`, `firePlayerWeapon`, `updateGame`, `weaponLabel`, document-capture click | `save.unlockedCharacters.nadir`, `save.defeatedBosses.drownedSun`, `save.victories.drownedSunClears`, `noMoonProgress_v68` mirror, `CHARACTERS.push({id:'nadir'})` |
| **v80** | `qual.drowned-sky-stage-eclipse-trophy.2026-05-14.v80` | `updateGame` PRE-base (crater intercept), `updateEnemies`, `drawEnemy`, `drawBossBar`, `renderWorld`, `killEnemy`, plus `ENEMY_TYPES.{v80EclipseManta,v80GravityStone,v80DrownedSun}` | `room._v80Doors`, `room._v80Beacons`, `room._v80ColdLantern`, `save.victories.drownedSkyClears`, `save.defeatedBosses.drownedSun`, `state._v80InDrownedSky`, `state._v80SunPhaseFlash`, `state._v80EclipsePulse` |
| **v79** | `qual.drowned-sky-collapsed-sun.2026-05-13.v79` | Superseded by v80 (sets `state._v79InDrownedSky = true` first if crater touched). Still installs `ENEMY_TYPES.{v79Orbiter,v79WakeComet,v79DrownedSun}` which v80 reuses. | `room._v79*`, same save fields v80 uses |
| **v78** | `qual.moots-lock-reroll-polish.2026-05-13.v78` | `renderCharacterCards`, `safeWriteSave`, `startGame`, document-capture click guard, `renderDraftUI`, universal `.card.v68Locked` CSS | Scrubs `save.unlockedCharacters.moots` if not strictly unlocked; resets `state.draft._v76StarRerolls` on new draft |
| **v77** | `qual.sunfall-safety-readability.2026-05-13.v77` | `damagePlayer` (post-boss damage block), `killEnemy` (major-boss safety), direct edits to v39 (`shadowPatchesForRoom39`, `makeSunSeals39`, `updateSunSeals39`, `beginSunDefeat39`, `updateLightBurn39`, `drawWorldOverlays39`, `drawScreenOverlays39`, boss-bar wrap) | `room._v77MajorBossDefeated`, `room._v77SunCrater`, `room._v77SunReturnSigil`, `state._v77LastDamageSource`, `state._v77SunHeat` |
| **v76** | `qual.route-integrity-stars-passengers.2026-05-13.v76` | `bossDefeatLine`, `bossProperName`, `bossHonorific`, `renderWorld` (starless door world-space fix), `renderDraftUI`, `renderCharacterCards`, `updateOverlay`, CSS for `.card.selected::after` suppression | `state.draft._v76StarRerolls`, Moots/Vesper `visual.art` paths, scrubs `save.unlockedCharacters.moots/vesper` via v78 (after) |

Older v46-v75 IIFEs are still in the file. Don't touch them unless you know what you're breaking.

## Save schema (what each field is for)

The game uses **two** localStorage keys that must stay in sync:

- **`noMoonSave_v1`** — the canonical save. Same shape as `state.save`.
- **`noMoonProgress_v68`** — a mirror written by v68/v71/v75/v78/v81. Some unlock guards read both as a defense-in-depth check.

Fields:

```
save.unlockedCharacters.{rook, nyx, sol, mire, moots, vesper, nadir}   // booleans
save.defeatedBosses.{warden, archon, sun, nightFerry, drownedSun, ...}
save.victories.routeClears          // regular-route wins
save.victories.sunClears            // Sun-route wins (set on Return Sigil OR crater touch)
save.victories.skyBranchClears      // sky branch / Night Ferry clears
save.victories.drownedSkyClears     // v79/v80 Drowned Sky stage clears
save.victories.drownedSunClears     // v81/v82 — same boss, alternate counter
save.victories.{firstRouteAt, lastRouteAt, lastWinCharacter, lastOutcome}
save.lifetime.{kills, deaths, wins, runs, secrets, biomesCleared, ...}
save.highestBiomeReached            // 0..TOTAL_BIOMES (10)
save.achievements.<id>.{goal, progress, unlocked}
save.careerAudit.{lastBossDefeated, lastUnlock, lastUnlockReason, lastUnlockBuild, ...}
save.selectedCharId                 // 'rook' | 'nyx' | 'sol' | 'mire' | 'moots' | 'vesper' | 'nadir'
state.draft._v76StarRerolls         // v78 resets per draft
```

**The unlock pattern is unusual** and worth understanding: v78 (for Moots) and v81 (for Nadir) wrap `safeWriteSave` with a **PRE-hook** that does two things every save write:

1. **Auto-promote**: if `defeatedBosses.X === true` but `unlockedCharacters.Y === false`, set Y to true.
2. **Scrub**: if `unlockedCharacters.Y === true` but the strict condition isn't met (real win), set Y back to false.

Both happen on `state.save` AND on the mirror. This makes the unlock guard idempotent and resistant to other wraps that might write garbage.

If you add a new unlockable character, mirror this pattern — don't trust `state.save.unlockedCharacters.X = true` to stay true.

## Closure-local foot-guns (cannot be wrapped from outside)

Every time GPT proposes "edit function `X`" — if `X` lives inside an inner IIFE, the proposal won't compile when you try to call `X` from a new tail patch. These are the ones to watch:

| Function | Lives in | What to do instead |
|---|---|---|
| `useBoonMoots`, `boonActive`, `boonReady`, `chargeBoon`, `drawBoonSlot`, `rerollDraft`, `rerollLooseCores`, `mutateOwnedGraft` | v68 IIFE | Wrap the same global wrap points v68 wraps (`updateGame`, `drawHUD`, `setRoomCleared`, `startGame`, `canvas` pointerdown, `window` keydown). v82's Black Anchor mirrors this pattern. |
| `drawBiomeSignature70`, `decorateMootsCards70`, `simplifyDraft70`, `cleanTitleOverlay70` | v70 IIFE | Hook the global wrap (`drawAmbientWorld`, `renderCharacterCards`, etc.) v70 wraps |
| `BOSS_CARDS71`, `renderBossGuide71`, `markBossDefeated71`, `bossIdFromEnemy71`, `installVesperCharacter71`, `installStarlessApproachFromWarden71` | v71 IIFE | DOM-append after v71 renders (v81 does this for the Drowned Sun field-guide card). Or push directly to `CHARACTERS` array (v71's installVesperCharacter71 demonstrates this works post-install). |
| `installDrownedSky79`, `tickV79DrownedSun`, `drawV79Enemy` | v79 IIFE | Don't try to extend v79's 3-room sketch. v80 supersedes it via `state._v79InDrownedSky` gate. |
| `installDrownedSkyStage80`, `tickV80DrownedSun`, `drawV80World` | v80 IIFE | The stage is owned by v80. New stage features should wrap `updateGame` + `renderWorld` + `killEnemy` outermost and gate by `room._v80DrownedSky`. |
| `installNadirCharacter81`, `isNadirStrictUnlocked81`, `drawNadirLive81`, `fireNadirOrbit81` | v81 IIFE | Nadir extension code: hook `drawPlayer` outermost (your wrap fires first, calls v81's wrap), or hook `firePlayerWeapon` outermost. |

The general rule: **state on `state.X` can be reached from outside. Functions defined with `const`/`function` inside an inner IIFE cannot.** Use the global wrap point.

## Newest content: Nadir + Drowned Sun + Black Anchor (full chain)

Likely target of next-session work. Here's the data flow:

1. **Player clears the regular Sun route** (`v39 completeSunVictory39` writes `save.victories.sunClears`).
2. **First Sun clear** seals the throne room crater (`room._v77SunCrater.sealed = true`).
3. **Second or later Sun clear** leaves the crater open (`crater.open = true, crater.active = true`).
4. **Player walks into open crater**. v80's `updateGame` PRE-base wrap fires first in the frame, beats v77/v79's checks. Calls `installDrownedSkyStage80()` which:
   - Pushes 8 rooms onto `state.level.rooms` (entry → spine → open → fork → ring|spine → preboss → boss).
   - Records `save.victories.sunClears += 1` if not already counted this run.
   - Sets `state._v79InDrownedSky = true` so v79's stub stays inert.
   - `triggerTransition` fades in and teleports the player into the entry room.
5. **Player kills all enemies in a room** (v80's `tickV80RoomCleared` auto-marks `room.cleared = true`, opens side doors without firing the base `setRoomCleared` which would push "BELLWAY CLEAR" messages).
6. **Player reaches boss room**, fights v80 `Drowned Sun` (typeId `v80DrownedSun`, HP 220, 3 phases at full/55%/20% HP).
7. **Boss dies**. v80 `killEnemy` wrap:
   - Calls `state.v77MakeMajorBossRoomSafe(room, 'v80DrownedSun', { invuln: 999 })` — clears hostile bullets, traps, hazards, gives 999s invuln.
   - Spawns `room._v80ColdLantern = { x, y, r: 64, touched: false }`.
   - Slow-mo + bloom particles + "THE WELL FALLS QUIET" message.
8. **v81 `killEnemy` wrap also fires** (it's outer of v80's wrap). On `typeId === 'v80DrownedSun'`:
   - Writes `save.defeatedBosses.drownedSun = true`, `save.unlockedCharacters.nadir = true`, `save.victories.drownedSunClears = max(1, ...)`.
   - Mirrors to `noMoonProgress_v68`.
   - Pushes "NADIR SURFACES".
9. **Player touches Cold Lantern**. v80 `tickV80ColdLantern` calls `completeDrownedSkyVictory80` → records `save.victories.drownedSkyClears` → shows the "THE LIGHT STAYS DEAD" overlay.
10. **v81's `safeWriteSave` PRE-hook** is a backstop. If anything wrote `defeatedBosses.drownedSun = true` without setting Nadir's unlock, the next safeWriteSave fixes it.
11. **Returning to title** → character select shows Nadir as unlocked (v81's `renderCharacterCards` wrap removes the lock class + badge).
12. **Selecting Nadir** → `startGame('nadir')` → v81 sets up `_nadirStars[0..2]` array → orbit weapon is active. v82's `startGame` wrap also fires and calls `resetBlackAnchor82(true)`, giving Nadir 1 charge of Black Anchor.
13. **Press E** (or tap the HUD slot) while playing as Nadir → v82's `useBlackAnchor82()` places a gravity well at the mouse-cursor world position (clamped to 320px from player). 3.5s life. Slows enemy bullets in radius, pulls non-boss enemies, collapse pulse on expiry.
14. **Active recharges by clearing rooms** (v82's `setRoomCleared` wrap calls `chargeAnchor82(room.hasBoss ? 3 : 1)`). 3 cleared rooms = full charge.

## Deferred work (next-session opportunities, in rough priority order)

1. **Hidden secret room off v80's fork** — the Forked Tide currently has two doors (A and B). Add a third door to a small treasure chamber (1 enemy, a graft pickup, an exit back to the fork or directly to preboss). v80's stage generator at line ~45200 has the door definitions; add a `forkC` kind. Should be ~150 lines.
2. **Mobile gearDock fix** — v67 `gearDock` at line 40362 writes 16 inline DOM styles every frame. `Object.defineProperty` on `CSSStyleDeclaration` is fragile across browsers, so we deferred it. A safe alternative: wrap v67's `render` wrap at v83 outermost, throttle the call rate when on mobile (e.g. every 4 frames). Caveat: also throttles `syncTitleAudioButtons` and `sunFlash` — verify those tolerate 15fps.
3. **Per-room music in the Drowned Sky** — currently uses the global synth fallback. v35 disabled external mp3s. An audio pass could swap in a stage-specific motif (already structured via `motifForBiome` at line 40286 in v68's adaptive-music block).
4. **Ground-text → symbols replacement** — listed in ChatGPT's original v76 handoff. The Sun route still has `fillText('SAFE BELOW', ...)`, `fillText('THE ROOM PRETENDS IT IS HOME', ...)`, etc. baked into level backgrounds. Direct source edit, not a tail wrapper — too much surface for one IIFE.
5. **v80 sub-biome split** — Cold Tide vs Eclipse Hollow flavors of the Drowned Sky. Worth doing after stage pacing is locked.
6. **Nadir orbit weapon balancing** — currently fires 3 stars with 0.72s individual cooldown. Damage `0.78 × player.damage`. Adjustable via `state.v81NadirDrownedSun` if you expose it (currently not). May need playtest tuning.

## Debug surface map

Every Claude-built version v76-v82 exposes a debug function on `window`. Call them in browser console. They return JSON snapshots that show all relevant state without you having to grep.

```js
noMoonV82Debug()    // anchor state, room anchors, mobile flags + counters, chain back through v81
noMoonV82ChargeAnchor()  // force-charge Black Anchor (testing)
noMoonV82UseAnchor()     // manually fire from console (testing)

noMoonV81Debug()    // Nadir installed/unlocked/in-save/in-mirror, Drowned Sun flag, drownedSky clears, nadir star state
noMoonV81UnlockNadir()   // bypass the Drowned Sun requirement (testing)
noMoonV81LockNadir()     // re-lock for testing the lock UI

noMoonV80Debug()    // Drowned Sky stage state — room label/kind, beacons, doors, Cold Lantern, clears
noMoonV80ForceEnter()    // install Drowned Sky stage on current level (skip 2nd-Sun-clear gate)
noMoonV80ForceKillBoss() // instakill Drowned Sun if alive in current room

noMoonV79Debug()    // legacy 3-room sketch state — mostly inert in v80+
noMoonV79ForceEnter()
noMoonV79ForceKillBoss()

noMoonV78Debug()    // Moots strict-unlock state, reroll widget state, draft.cards
noMoonV78Reroll()        // manually trigger a reroll

noMoonV77Debug()    // major-boss-safety state, Sun heat, last damage source
noMoonV77MakeMajorBossRoomSafe(room, bossId, opts)  // expose helper

noMoonV76Debug()    // overall snapshot — buildTag, selected char, player template, last 12 messages, level contract, draft state, stars
noMoonV76GrantStars(20)  // give yourself stars for testing the reroll

// Older debug fns exist back to v71 — see grep -oE "window.noMoonV[0-9]+" game_inline.js
```

For *anything weird* in a playtest report, the first move is to ask Alex to paste the output of the relevant debug function. Resolves 80% of "is this a real bug or expected behavior" questions.

## Asset inventory

Game canonical at `/no-moon/index.html`. Game-mirror copy at `/no-moon/game_inline.js` (byte-identical to the inline script). SW at `/no-moon/no-moon-sw.js`. Root cleanup SW at `/no-moon-sw.js`.

```
/assets/favicon.svg                                  (root, branding — DO NOT FORGET in deploy zips)
/assets/icon-{192,512}.png                           (PWA icons)
/assets/qualiacology-og.png                          (social preview)
/assets/site.webmanifest                             (PWA)
/assets/no-moon/characters/{rook,nyx,sol,mire,moots,vesper,nadir}-portrait.webp   (520×740)
/assets/no-moon/title/no-moon-title-{desktop,mobile,poster}.webp
/assets/no-moon/bosses/{card-back,false-moon,warden,night-ferry,archon,spiggot,sun,drowned-sun}-card.webp   (640×860 source)
```

External audio (`./no-moon-bg-v35.mp3`) referenced at line ~24062 but **not shipped** — v50 forces `USE_EXTERNAL_TRACK = false` so the synth fallback plays. Don't toggle it back on without uploading the asset.

## Build + upload workflow

1. Edit `game_inline.js`.
2. Sync into `index.html` via:
   ```python
   from pathlib import Path
   import re
   game = Path('no-moon/game_inline.js').read_text()
   html_path = Path('no-moon/index.html')
   html = html_path.read_text()
   m = re.search(r'(?s)<script>\n.*?\n</script>', html)
   html_path.write_text(html[:m.start()] + '<script>\n' + game + '\n</script>' + html[m.end():])
   ```
   (Note: don't use `re.sub` for this — `\` chars in the game source get interpreted as regex escapes. Use slice-and-concat.)
3. `node --check no-moon/game_inline.js && node --check no-moon/no-moon-sw.js`.
4. Bump `CACHE_NAME` in `no-moon/no-moon-sw.js`.
5. Add any new asset to the SW `ASSETS` array.
6. Build the drop-in zip via:
   ```bash
   mkdir -p /tmp/vXX_release/no-moon /tmp/vXX_release/assets/no-moon
   # copy assets in
   # copy game files in
   # write README_UPLOAD_THIS.txt
   cd /tmp && zip -r vXX-website.zip vXX_release/
   ```
7. Commit + push.

Alex uploads the zip to their host (Netlify per ChatGPT's previous notes). The branch and GitHub are scratchpad — not connected to the live site.

## Pre-handoff smoke test (run these in browser console after fresh load)

```js
state.v82Debug()                      // expect buildTag .v82, anchor.charges 0 on title
state.buildTag                         // === 'qual.nadir-black-anchor-active.2026-05-14.v82'

// Walk Nadir unlock chain without grinding the route:
noMoonV81UnlockNadir()                 // sets save.defeatedBosses.drownedSun + unlockedCharacters.nadir
state.v81Debug().nadirStrictUnlocked   // true

// Now select Nadir from character grid, start a run.
// Confirm: HUD slot lower-left ("BLACK ANCHOR / LACING 0/3" or "/ READY")
state.v82Debug().anchor.charges        // 1 (startGame gives Nadir a starting charge)

// Test Black Anchor end-to-end:
state.v82ChargeAnchor()                // force-ready
// move mouse over the arena, press E (or tap HUD slot)
state.v82Debug().roomAnchors           // should show 1 anchor with x, y, r=110, life≈3.5

// Test Drowned Sky stage entry without grinding:
noMoonV80ForceEnter()                  // skip the 2nd-Sun-clear gate
// player should teleport to Cold Threshold

// Test Drowned Sun fight + Nadir unlock end-to-end:
noMoonV80ForceKillBoss()               // if Drowned Sun is in current room
// confirm Cold Lantern appears, walking into it triggers THE LIGHT STAYS DEAD overlay
// confirm character select now shows Nadir unlocked
```

## What to avoid

- **Don't modify v46–v75 IIFEs unless absolutely necessary.** They're shipped and proven; risks regression.
- **Don't add new code outside the outer game IIFE.** It won't see helpers, state, or the canvas context.
- **Don't trust ChatGPT-proposed code that references closure-local functions by name** from a new tail patch. See the foot-gun table.
- **Don't write to localStorage directly without also writing to `state.save`.** Use `safeWriteSave` (or its v68 wrap). Other wraps may scrub fields they don't recognize.
- **Don't `setRoomCleared` for Drowned Sky rooms** — it pushes "BELLWAY CLEAR" messages. v80 auto-clears via tick instead.
- **Don't add boss-card entries by editing v71's `BOSS_CARDS71`** from a new tail patch — it's closure-local. DOM-append the way v81 does for the Drowned Sun card.
- **Don't ship a deploy zip without the 5 root assets** (`favicon.svg`, `icon-192.png`, `icon-512.png`, `qualiacology-og.png`, `site.webmanifest`). Claude made this mistake on v76 — ChatGPT caught it.

## Stats from the integrity sweep on v82

- 80 IIFEs total in the file
- 12 `noMoonVXXDebug` window functions exposed (v71–v82)
- 24 manual/force helpers exposed (Unlock/Lock/Force/Test/Reroll)
- 13 save fields actively maintained across save + mirror
- `node --check`: PASS on both `game_inline.js` and `no-moon-sw.js`
- inline `<script>` sha256 byte-matches `game_inline.js` sha256
- SW asset list includes all 8 boss cards + all 7 character portraits + 3 title arts + card-back

The build is stable. Hand it over.
