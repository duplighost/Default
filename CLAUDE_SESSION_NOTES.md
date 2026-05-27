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
