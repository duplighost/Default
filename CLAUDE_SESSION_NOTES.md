# Claude Session Notes — No Moon v286+

## What was accomplished this session:

### Mobile performance bug found and fixed
- **Root cause**: Moon Debt visual systems (debt ring at line 24169, v248 player foreshadowing ellipses at line 59008, hallucinations, undertow audio) caused 3.5x frame time increase on mobile when moonDebt transitioned from 0 to 1
- **User confirmed** on phone: 6/6 Moon Debt species obstacles lagged, 1/7 non-debt obstacles didn't
- **v284 nuclear test** (moonDebt forced to 0): eliminated all mobile lag — confirmed
- **v285**: Comprehensive Moon Debt removal — no-ops all debt addition functions, disables all visual systems, zeros debt every frame
- **v286**: Added constellation visual enhancements on top of v285

### Current state of the game (v286):
- Moon Debt is completely removed (zeroed every frame, all systems disabled)
- Species obstacles still break, drop items, trigger side effects (enemy wake, shrapnel, fog, ambush)
- Constellation has subtle enhancement (background stars, moon glow/rim during reveal, larger radius)
- Bloom pass runs on all platforms (v281 bloom skip was reverted in favor of debt removal)
- Game is stable in Playwright testing

### What still needs to be done:

1. **Species obstacles need a replacement "consequence"**
   - Currently: free loot + free chaos (no debt penalty)
   - Biome-specific weighting already exists (wet→rootCyst, glass→blackGlass, etc.)
   - Need: something that makes breaking them feel risky without per-frame performance cost

2. **Difficulty scaling replacement**
   - Moon Debt gates removed: room gen (debt≥3), enemy awakening (debt≥4), debt collectors
   - Current: purely floor-based linear scaling via routeDangerStage()
   - Need: something more dynamic than floor index but not per-frame expensive

3. **Constellation dramatic overhaul**
   - Gameplay constellation is subtle (by design — 'screen' composite on warm backgrounds)
   - Reveal constellation needs to be stunning (full alpha, dark background, this is doable)
   - User wants it to "fit the screen" and look beautiful
   - CAREFUL: ending trigger/timing must not be touched (v251/v274/v275)

4. **Breakable obstacles per biome**
   - Obstacle STYLES already vary per biome (rootStone, cloisterNode, etc.)
   - Species TYPES are weighted per biome
   - User wants them to look distinctly styled for each biome

5. **New item/enemy/difficulty properties**
   - Replace the "accumulating pressure" feel that Moon Debt provided
   - Don't use per-frame expensive visual systems
   - Ideas: escalating enemy variants per floor, biome-specific hazard types, boss-kill-triggered room modifiers

### Key code locations:
- Species obstacle defs: line 14420 (OBJECT_SPECIES)
- Species conversion: line 14605-14625 (convertObstacleToSpecies)
- Biome-specific species weights: line 14574-14581
- Constellation SLOTS: line 68165
- Constellation draw: line 68224 (drawUnifiedMoonConstellation274)
- Moon reveal frame: line 68193 (moonFrame274)
- Difficulty scaling: line 973-980 (routeDangerStage)
- Enemy budget: line 4368-4376
- v285 debt removal patch: ~line 69937
- v286 constellation patch: near end of file before renderCodexStats()

### Testing infrastructure:
- Playwright Chromium available in this container
- Smoke test harness at /tmp/smoke-test.js
- HTTP server for local testing: `cd /tmp/chatgpt-v280 && python3 -m http.server 8888`
- Screenshots saved to /tmp/screenshots/

### v287 (this session continued):
- Unmuzzled species obstacle gameplay effects on mobile
- v243's cosmetic muzzle (sparks/rings/shake/scars) stays active
- Gameplay effects (pulse hazards, fog zones, lane hazards, shrapnel) now replay after v243's muzzle
- Mobile frame timing: 32ms avg (no regression from unmuzzle)
- Species obstacles now have teeth on mobile instead of being empty loot containers

### Next up:
- Biome-specific obstacle visual styling
- Constellation dramatic enhancement for ending reveal
- Consider floor-based difficulty properties to replace debt's "accumulating pressure"

### v288 + v289 (continued):
- v288: Floor-scaled species effects (calm/rising/deep/abyss tiers)
  - Species obstacle HP scales with floor (+0.5 per floor)
  - BlackGlass shrapnel count increases on deeper floors
  - Ambush enemies spawn pre-awakened on floor 6+
  - FalseIdol gets double ambush chance on floor 9
- v289: Replaced "Moon Debt 0" HUD chip with floor tier indicator
  - Shows "Floor N • TIER" with color-coded icon
  - Blue circle (CALM), Gold triangle (RISING), Pink diamond (DEEP), Purple crescent (ABYSS)
  - Uses same glass panel style as the old debt chip

### v290 (this session continued):
- Dramatic constellation reveal: nebula glow, dense star field, enhanced craters
- Screenshots captured at 30/50/65/80/95% reveal progress — looks like a real night sky
- Full regression test: 8/8 PASS
  - Game boots, starts, plays correctly
  - All 5 patches (v285-v289) installed
  - Moon Debt stays 0
  - No auto-reveal on fresh game (v275 hard-guard intact)
  - Reveal renders correctly when triggered
  - Game resets cleanly after reveal
  - Mobile: 29ms avg frame timing
- spawnDebtAmbush confirmed independent of moonDebt (uses level.index)
- No remaining Moon Debt dependencies that could break gameplay

### Current build: v290 (v285+v286+v287+v288+v289+v290)
### All patches verified working together with zero regressions

### v292-v293 (continued):
- v292: Debt remnant cleanup (ChatGPT's catch)
  - DEBT_COLLECTORS config disabled
  - Debt collector enemies remapped to starThief
  - "Moon Debt" / "DEBT KIOSK" / "Little Auditor" text cleaned from messages
- v293: Boss kill constellation flash
  - Screen dims briefly, star pulses at center-top
  - "A STAR REMEMBERS" text fades over 2.2 seconds
  - Connects boss kills to the ending constellation reveal
  - One-time per kill, no persistent cost

### Total patches this session: v285-v293 (9 patches)
### All verified in Playwright, all committed and pushed
### No regressions in the ending system (v275 hard-guard intact)

### v294-v295 (continued):
- v294: Deep debt source hardening (ChatGPT's v293 findings merged)
  - v26 felt debt tickers killed (were computing per-frame for nothing)
  - Lien spawn chance zeroed, undertow audio silenced
  - Hallucination arrays emptied
- v295: Boss kill flash positioned at constellation slot
  - Each boss maps to its SLOTS position in the constellation
  - Warden flash appears upper-left, Sun appears right, etc.
  - Falls back to center if typeId isn't in the lookup table

### Total patches: v285-v295 (11 patches)
### Both Claude + ChatGPT findings merged
### Game is stable, debt fully dead, constellation connects boss kills to ending

### Deep dive on v296 + v298 fix (this session):
Audited the full v285-v296 patch stack. Findings:
- REAL BUG (fixed in v298): v289 drawHUD wrapped ctx.save()/restore() with restore
  INSIDE the try block. A thrown draw call would skip restore and leak a canvas
  save-stack entry every frame. Fixed by moving restore into a finally.
- ALREADY FIXED in v297 (ChatGPT): LIEN_SPAWN_CHANCE was set to 0, but code used
  `chance || 0.35` so 0 (falsy) fell through to 0.35 — liens still spawned. v297
  sets it to -1 (truthy) so Math.random() >= -1 always exits. Verified lien=-1.
- AGENT WAS WRONG: claimed ENEMY_TYPES might be out of scope for v292's remap.
  Verified ENEMY_TYPES is const at line 1024 inside the outer IIFE, reachable
  by all install blocks. The starThief remap works.
- MINOR (not fixed, balance only): v288 double floor-scales species HP because
  the base convertObstacleToSpecies already scales with level.index*0.28. Net
  effect: species obstacles slightly tankier on deep floors. Not breakage.
- KNOWN/ACCEPTED: forward flag-propagation gaps in v286/v289/v293 wraps. Not a
  current bug (each install block has a state.__vNNNInstalled top guard). Matters
  only if a FUTURE patch wraps the same function and checks another patch's flag.
  Documented for future patch authors.
- COSMETIC: in-game build banner reads v297 because v297 re-asserts its tag every
  frame. v298's actual fix is confirmed via noMoonV298Debug().

### v298 = v297 (ChatGPT lien fix + all v285-v296) + drawHUD canvas-safety fix
### 13/13 regression tests pass. Live baseline.

### Deep hunt round 2 (v298 expanded):
Hunted the pre-v285 stack + the ending system. Findings:
- REAL SOFT-LOCK (fixed): finishReentryStart274 (the "Re-enter at Floor 1" button)
  calls startGame(id) then sets mode='play'. If startGame throws anywhere in its
  54-wrapper chain before setting play mode, the catch just logged+returned —
  player frozen in 'endingReturn' with overlay up, no recovery but page reload.
  This is the historical "can't restart after ending" class. Fixed: catch block
  now routes to title/passenger-select (known-clean state) so a failed re-entry
  never strands the player. Error-path only — happy path untouched.
- REAL (minor, fixed): v287/v288 blackGlass shrapnel pushed bullets without the
  enemy-bullet-cap check the base game uses. Added countBulletsByOwner guards
  (116 for v287 replay, 120 for v288 floor-scale) so a break near a full screen
  can't overshoot the cap on mobile.
- INVESTIGATED, LEFT ALONE: addLifetimeStat does synchronous localStorage writes
  on every breakable break. MEASURED the save object = 1548 bytes, JSON.stringify
  = 0.01ms. The per-break write cost is a few ms on a phone, not the headline
  hitch (Moon Debt's debt ring was). Not worth debouncing the load-bearing save
  system for sub-5ms. Measurement beat assumption.
- CLEAN: memory (bullets/particles/enemies reset between rooms+runs, particles
  hard-capped 150 mobile/220 desktop), event listeners (all base-IIFE one-time,
  no per-run accumulation), wrap-chain depth (81 updateGame wraps ≈ sub-microsecond,
  negligible vs 16ms frame budget — aesthetic debt only).

### v298 final = v297 + drawHUD finally-restore + shrapnel cap + re-entry soft-lock recovery
### 13/13 regression. The restart path is now bulletproof even if startGame throws.

### Deep hunt round 3 (v298 + landscape HUD overlap):
- REAL BUG FIXED: "UI pops up over the top-left" (user-reported). The LIVE message
  renderer is drawMessages59 (v59 replaced base drawMessages with an empty stub —
  my earlier base-drawMessages clamp was on a DEAD function). drawMessages59 keys
  its top-safe zone off `W < 720` as a proxy for "mobile/short," but a LANDSCAPE
  phone is wide (W>=720) yet short (H~414), so it got the desktop offset
  (majorStartY=78) while the desktop chip reaches ~88px → messages overlapped the
  top-left chip. Fixed: majorStartY now floors at the REAL chip bottom
  (gameplayUiLayout().topChip.y+h) + 10, independent of width. Verified via
  landscape (760x414) screenshot — chip is now clear.
- FALSE ALARM (agent #1, NOT fixed): "ensureCareer doesn't init defeatedBosses →
  Vesper/Nadir re-lock." Traced: vesperUnlockSource71 default-args call
  readSave71()/readMirror71() which run `defeatedBosses = obj71(...)` before any
  read (lines 41123/41132). Every reader/writer inits it locally. Not a bug.
- ALREADY-MITIGATED (agent #4, NOT fixed): "First Walker trophy draft no final-
  level guard → blocks ending." offerTrophyDraft checks `mode !== 'play'`, so once
  the ending sets mode='win' the draft is blocked. First Walker isn't the final
  boss (Drowned Sun is, dies after). Adding the levelIndex guard would risk
  removing a legit Broken Tether trophy. Left alone.
- LOW-PRI noted, not fixed: draft invuln asymmetry (game frozen during draft),
  reroll-empty soft-lock (28-item pool, ~never empty), null charId (falls back to
  CHARACTERS[0]). Not worth the churn/risk.

### v298 final = v297 + drawHUD finally-restore + re-entry soft-lock recovery
###   + shrapnel bullet-cap + landscape message-overlap fix. 13/13 regression.

### Deep hunt round 4 (in-game gear / sound toggles) — USER-REPORTED:
- REAL BUG FIXED: in-game SFX/BGM toggles gone on PC. The ⚙ gear button
  (hudMenuBtn) opens the audio menu during play. v273's syncTitleControls sets
  hudMenuBtn.style.display='none' on the TITLE (shows toggles directly there
  instead) — but NOTHING ever restored display when entering gameplay. The
  gameplay sync only set opacity/pointerEvents, which CANNOT override
  display:none. So after seeing the title once, the gear stayed display:none
  for the whole session → no in-game sound toggles. Fixed: live
  syncGameplayDomButtons now sets hudMenuBtn.style.display='' in the play branch
  (and 'none' in the overlay branch, matching v273). Verified: title gear
  display:none/opacity:0 (hidden), play gear display:block/opacity:0.94
  (visible), gear-click reveals SFX+BGM toggles at opacity:0.96.

### v298 final fixes (all verified): drawHUD finally-restore, re-entry soft-lock
###   recovery, shrapnel bullet-cap, landscape message overlap, in-game gear restore.
### 13/13 regression. Build: qualiacology-no-moon-v298-ingame-gear-and-hud-fixes.zip

### AUDIO SYSTEM AUDIT (read-only, no edits) — VERDICT: HEALTHY
- BGM and SFX have SEPARATE output chains: BGM osc→BGM limiter→ctx.destination
  (~1715); SFX osc→audioState.master→ctx.destination (~1833/1855/1792). They
  never share a gain node, so muting SFX cannot kill BGM (no shared-gain bug).
- startProceduralBgm calls stopProceduralBgm() first (~1690) → no double-start
  oscillator-stack leak on rapid toggles / re-entry.
- Live Chromium toggle test: SFX label ON↔OFF, localStorage noMoonSfxMute_v1
  round-trips "1"/"0" and survives reload; BGM label ON↔OFF. All correct.
- Only real audio-related issue was the in-game gear visibility — already fixed
  in v298 above. Audio system needs no code changes.

### COMBAT / COLLISION CORE AUDIT (read-only, no edits) — VERDICT: CORRECT
Live runtime tests via Playwright (state on window; noMoonSpawnBear spawns real
enemies through createEnemy; real RAF loop runs the real updateBullets).
- updateBullets (line 5287, NOT wrapped — single source of truth) sub-steps by
  speed (steps = ceil(speed*dt/18)) = continuous collision detection → no
  tunneling of fast bullets through thin enemies/obstacles. VERIFIED.
- Player→enemy: collision (hypot < e.r+b.r) detected; damageEnemy applies FULL
  bullet damage; killEnemy increments stats.kills and sets enemy.remove.
  Window-closed test: dmg-50 bullet → exactly 50 hp lost; dmg-200 → kill+kills++.
  VERIFIED.
- Enemy→player: collision detected; damagePlayer (live = v-polish reimpl at
  10773) applies i-frames (hitInvuln 0.36 absorbed / 0.52 hit). Two overlapping
  enemy bullets in one invuln window = exactly ONE hit (2nd blocked). VERIFIED.
- Wall: bullet outside world removed (or reflected if bounces>0). VERIFIED.
- Obstacle: bulletHitsObstacle stops player bullets before the enemy check
  (obstacle correctly shields an enemy behind it). VERIFIED.
- damagePlayer wrap chain (10773 full reimpl → 15318/15572/33549/34538/36133/
  38708/43513/52991 wraps via __futureBase etc.) preserves shield→hp→death and
  i-frames. No behavior lost. damageEnemy/killEnemy wraps pass `amount` through
  (no wrap reassigns amount).
- RED HERRING EXPLAINED: a dmg-50 bullet appeared to do only 28 (and 0.32032 with
  natural maxHp 11.44). Cause = v64 "boss first-breath" anti-burst cap
  (damageEnemyV64 @ 39487): for isBossLike64 enemies, during a 1.75s game-time
  intro window, per-hit damage is capped at max(0.12, maxHp*0.028) with a total
  budget maxHp*0.18. 1000*0.028=28; 11.44*0.028=0.32032 (exact). Gated entirely
  behind `if (enemy && isBossLike64(enemy))` — NORMAL enemies skip the block and
  always take full damage. Working as designed. (state.time runs ~half real-time
  in headless due to dt-clamping, so the window is hard to wait out in tests; set
  introDamageUntil=0 to confirm full damage lands — it does.)
- PERFORMANCE (mobile 390x844): baseline p50 33.4ms is pure headless software-GL
  render overhead; 80 realistic flying enemy bullets add only ~0.92ms/frame
  (p50 identical). Collision/bullet update is ~0.01ms/bullet — NOT a mobile
  concern. (The earlier scary 44ms was a self-inflicted 120-bouncing-bullet
  spawnSpark storm — bounces is a player-bullet trait; enemy bullets don't bounce
  in real play.)
- MINOR INCONSISTENCY noted, NOT fixed (needs user call — fragile boss code):
  isBossLike64 regex /…|sun|moon|…|boss/ matches the "moon" substring, so
  moonBear gets the 1.75s intro cap but crescentBear and lunarCub do NOT (their
  names lack "moon"/"sun"). Cosmetic/balance only; touching the regex risks the
  real sun/moon BOSSES. Left for user decision.
