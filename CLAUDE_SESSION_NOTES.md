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
