# Qualiacology.com + No Moon v45 — Full AI/Developer Handoff

**Canonical package:** Qualiacology full site v3.2 + No Moon v45  
**Game build tag:** `qual.future-consequence.2026-05-01.v45`  
**Game service-worker cache:** `no-moon-future-consequence-v45`  
**Current base lineage:** v44 Breathing Village + v45 Secret Door Sanity Pass  
**BGM asset:** `/no-moon/no-moon-bg-v35.mp3`  
**Generated for:** Alex / future AI developer handoff  
**Most important rule:** if this document ever disagrees with `no-moon/index.html`, trust the source and update the document.

---

## 0. Quick-start prompt for a new AI/dev

Paste this first when handing the project to another AI:

```text
You are working on Alex's Qualiacology.com static website and the browser game No Moon.

Current canonical build is Qualiacology full site v3.2 + No Moon v45.
Use the latest v45 deploy files as source of truth:
- qualiacology-full-site-v3-2-with-game-v45.zip
- qualiacology-no-moon-v45-game-only.zip

Game build tag must currently be:
qual.future-consequence.2026-05-01.v45

Game service-worker cache must currently be:
no-moon-future-consequence-v45

Before suggesting or changing code, open the actual current no-moon/index.html and inspect the relevant functions. Do not infer from old patch notes alone. This game is a one-file Canvas/WebAudio/vanilla-JS roguelite with a large additive IIFE patch tower. For most new features or fixes, add a guarded IIFE near the bottom of no-moon/index.html, before the final hard build-tag assignment. Direct edits are okay for strings, data tables, version/cache names, obvious typo fixes, and targeted obvious bugs.

Every release must:
1. bump the final state.buildTag,
2. bump /no-moon/no-moon-sw.js CACHE_NAME,
3. preserve root no-moon-sw.js cleanup worker,
4. preserve _redirects,
5. produce full-site and game-only zips unless Alex asks otherwise,
6. include patch notes and deploy notes,
7. provide SHA256 hashes,
8. run node --check on extracted inline game JS and both service workers,
9. run unzip -t on output zips,
10. be honest about anything not manually browser-playtested.

Do not add frameworks, build systems, analytics, CMS, external engines, or new asset pipelines unless Alex explicitly approves. Do not use image generation for code/game/site requests. Keep the website static and the game one-file unless Alex explicitly approves a real refactor.
```

---

## 1. Current deployable files and fingerprints

### 1.1 Canonical deploy files

Use this for a full Netlify/site deploy:

```text
qualiacology-full-site-v3-2-with-game-v45.zip
```

Use this if replacing only `/no-moon/`:

```text
qualiacology-no-moon-v45-game-only.zip
```

The current full-site archive has this shape:

```text
index.html
book.html
_redirects
no-moon.html
no-moon-sw.js
assets/favicon.svg
assets/icon-192.png
assets/icon-512.png
assets/qualiacology-og.png
assets/site.webmanifest
no-moon/index.html
no-moon/no-moon-bg-v35.mp3
no-moon/no-moon-sw.js
DEPLOY_NOTES_V45.md
NO_MOON_FUTURE_CONSEQUENCE_V45_PATCH_NOTES.md
```

The current game-only archive has this shape:

```text
no-moon/index.html
no-moon/no-moon-bg-v35.mp3
no-moon/no-moon-sw.js
```

### 1.2 File sizes and line counts from the v45 full-site archive

```text
index.html                         84,880 bytes       2,794 lines
book.html                          66,583 bytes         912 lines
no-moon/index.html              1,334,728 bytes      30,558 lines
no-moon/no-moon-sw.js               1,904 bytes          60 lines
no-moon-sw.js                         686 bytes          17 lines
_redirects                            200 bytes
no-moon/no-moon-bg-v35.mp3      2,796,333 bytes
```

### 1.3 SHA256 checksums for current v45 artifacts

```text
Full-site zip:
783c0e540cedb5f50a440414709cbbc0cc40da2cb95051364bfe8182303dd567

Game-only zip:
9e311fd5f2bd2ba0ab880e1765ed6bc5ef276ef135c18052ecea028b0c8cc079

Patch notes:
8fb22d9fb57a3aa468c9dc5da1ef97b62cad67f84c3ef17fe46875df26f43d3d

Deploy notes:
f51499f6ffb7c1b18bc3a6cbb977af373bcf7b2ebfa49a1146cb7ad204cff4a8

Background MP3:
430766cdc5938c0d3e711c663a47815ab7ecc6c3071b95981b7ce9d0d9b035e1
```

---

## 2. Website overview

### 2.1 What the site is

`qualiacology.com` is Alex's static personal/project hub. It currently presents:

- psychopharmacology/community work,
- the Psychopharmacology Discord server,
- the browser game **No Moon**,
- Doopliss music/projects,
- the book **This Helped Someone**,
- Alex's public-facing framework and contact links.

The site must remain static unless Alex explicitly approves a structural change. There is:

- no build process,
- no framework,
- no server-side code,
- no CMS,
- no analytics/tracking,
- no bundler,
- no package manager requirement.

Everything deploys as plain files to Netlify or an equivalent static host.

### 2.2 Website files

```text
index.html             Main Qualiacology landing page.
book.html              Standalone HTML version of This Helped Someone.
_redirects             Netlify redirects for /no-moon, /rift-wake, /game, /play.
no-moon.html           Meta-refresh/JS redirect to /no-moon/index.html.
no-moon-sw.js          Root cleanup service worker. Keep it.
assets/                Favicon, icons, OG image, manifest.
no-moon/               Game directory.
```

### 2.3 Main page structure

The public sections in `index.html` are:

```text
#home        Hero
#community   Psychopharmacology Discord/community
#game        No Moon showcase
#music       Doopliss music cards
#book        This Helped Someone book card
#about       About / framework block
#connect     Contact links
```

Header navigation links mirror these sections. There is a mobile menu. The page also has a scroll-progress bar and reveal animations via IntersectionObserver.

### 2.4 Current hero

The hero introduces Qualiacology and links to:

- Discord community,
- No Moon,
- book section.

Do not add glossy SaaS-style hero status pills. Older hero status blocks were intentionally removed. The tone should stay personal, sharp, and direct, not corporate.

### 2.5 Community section

The Psychopharmacology Server section links to:

```text
https://discord.gg/psychopharmacology
```

It describes the community as 3,000+ members and frames it around medication, support, and friendship. Keep the human/community framing. Do not turn this into clinical marketing sludge.

### 2.6 Game section

The No Moon section links to:

```text
/no-moon/
```

The main button text is currently:

```text
Enter the Narthex
```

It also has a copy-link button using `data-copy-link="/no-moon/"`.

### 2.7 Music section

Current top/new music card is **Immortalized**, with YouTube embed:

```text
https://www.youtube.com/embed/CY1al0jKaxY
```

The music section includes past Doopliss projects such as:

- Hate Fuck Hotline,
- Bite Marks & Bubblegum,
- Death Threats & Makeup Sex,
- Cherry Lipstick.

Do not sanitize the music/art language unless Alex explicitly asks.

### 2.8 Book section

The book card links to:

```text
book.html
```

Not `/book/`. Preserve this unless explicitly changing site routing.

Important preserved copy:

```text
Psychiatric treatment can feel like dumping a thousand mismatched puzzle pieces onto a table and being told the picture should already make sense. This book offers a practical way to sort the pieces — mechanism, history, tradeoffs, side effects, context, and lived experience — so people can stop treating themselves like failed experiments and start recognizing what actually fits.
```

Do not academic-pretty this unless Alex requests that.

### 2.9 About section

Important preserved framework sentence:

```text
Mechanism explains what should happen. Trials show what can happen under controlled conditions. Experts recognize patterns. Prescribers see what survives real life. Patients reveal whether the result is actually livable. The truth is the fit.
```

Do not shorten it by default.

### 2.10 Connect section

Contact links include:

- email,
- Instagram,
- Discord,
- ChatGPT group,
- TikTok,
- Suno,
- YouTube.

Email is assembled in JS at runtime from:

```js
var u = 'alexdguitar';
var d = 'gmail.com';
```

This avoids leaving the raw email directly in static HTML.

### 2.11 Website JavaScript behavior

Main `index.html` JS handles:

- mobile menu open/close,
- click outside nav to close menu,
- Escape key to close menu,
- scroll-progress bar,
- reveal animations via IntersectionObserver,
- copy-link button for game URL,
- headshot placeholder fallback check,
- email assembly.

### 2.12 `book.html`

`book.html` is a standalone rendered HTML book page with:

- a back link to the home site,
- book hero,
- reading progress bar,
- quick table of contents,
- long article content,
- reader-tools Top link,
- tiny JS progress updater.

Major headings include:

```text
The Assembly
Introduction: The Question That Started Everything
The Framework: How We Know What Works
The Five Sources of Evidence
The Philosophical Foundation: Why No Single Source Holds Truth
Assembling the Picture: Convergence, Confidence, and Humility
The Multi-Axial Framework: A Visual Guide to Sources of Truth
Levels of Understanding: Three Ways to View Medication Effects
Real-World Application: Three Medications That Work
The Recognition
Supporting Others: A Guide for Family and Friends
Some Medications I Think Actually Work
Some Treatments You Probably Shouldn't Bother With
Q&A
Appendix A: Quick Reference - The Five-Axis Framework
Appendix B: A Brief Guide to Reading Research Papers
Appendix C: Thinking Critically: A Guide to Scientific Skepticism in Psychiatric Medicine
About the Psychopharmacology Community
```

### 2.13 Redirects

Current `_redirects`:

```text
/no-moon /no-moon/index.html 301!
/no-moon.html /no-moon/index.html 301!

/rift-wake /no-moon/ 301!
/rift-wake.html /no-moon/ 301!
/rift-wake/* /no-moon/ 301!

/game /no-moon/ 302
/play /no-moon/ 302
```

Rift Wake was the old/internal name. It redirects to No Moon.

### 2.14 Root cleanup service worker

Root `no-moon-sw.js` is **not** the game worker. It unregisters itself and deletes old caches whose names start with `no-moon-`. Keep it unless intentionally redesigning service-worker strategy. It exists to prevent older root-scope No Moon caches from haunting returning users.

---

## 3. No Moon: current gameplay and design overview

### 3.1 High-level game identity

**No Moon** is a top-down twin-stick browser roguelite / dungeon shooter. It is heavily inspired by run-based room combat games while having its own mythology, Safe Haven framing, Moon Debt, Moonkeys, Spiggot/Sunkey route gating, and a post-final Sun Route.

It is all contained in:

```text
no-moon/index.html
```

It uses:

- Canvas 2D rendering,
- WebAudio oscillator/noise SFX,
- one external MP3 background music loop,
- vanilla JavaScript,
- localStorage for saves/counters,
- scoped service worker for offline caching,
- no external game engine,
- no bundler or build step.

### 3.2 Current narrative frame

The player is an outcast from an underground tribe. The tribe lives in **Safe Haven** and teaches that the Moon is evil. The player leaves anyway, climbing through dangerous rooms and increasingly suspect mythology.

The base climb suggests:

```text
Safe Haven says the Moon is forbidden.
The player crosses the threshold anyway.
False Moons, Moonkeys, Moon Debt, and painted-over lore imply the story is incomplete.
The Null Archon/Throne is not the final truth.
The Moon was locked.
The Sun was the real enemy.
```

The current full route is:

```text
Safe Haven
→ base climb through ten floors
→ Moonkey Trials / False Moons / Spiggot / Sunkey
→ Graven Warden midpoint boss
→ Null Archon final boss
→ Moon Shrine / Boon Moots
→ if 3 Moonkeys + 1 Sunkey: Moon Path / Sun Route
→ The False Dawn
→ The Argument
→ The Sun's Throne
→ The Sun boss
→ THE SKY IS QUIET
→ hostile/changed Safe Haven with Cold Sister sky
```

Alex has playtested and beat the Sun Route. The reported current subjective state is that the last floor and boss are “so fucking cool” and amazing. Preserve that route's emotional payoff.

### 3.3 Core design principles that matter for future changes

These principles have emerged through iteration:

1. **Combat first.** Hazards and floor conditions should pressure movement, not replace enemy fighting.
2. **Player control should not be stolen.** Avoid cutscenes, forced camera drags, and noninteractive lectures.
3. **Teach by play.** Avoid intrusive tutorial text. Communicate through affordances, enemy behavior, pickups, room design, and short messages.
4. **Keep the power fantasy.** The build should become visually ridiculous and strong. Do not bluntly nerf stack chaos unless there is a very good reason.
5. **Raise difficulty mostly through enemy HP, behavior, phase gates, and mechanics that survive AoE spam.** v43 deliberately increased late HP scaling rather than taking away power.
6. **Safe Haven should feel alive, warm, and safe at the beginning.** It should be emotionally hard to leave.
7. **The Sun route should stay bright, wrong, hostile, and challenging.** The Sun should not become talkative or goofy.
8. **The codebase is a patch tower.** Add guarded IIFEs unless doing a deliberate refactor.

---

## 4. Game source layout in v45

`no-moon/index.html` has these major sections:

```text
<style>       lines 11–642
<body>        lines 644–720
<script>      lines 721–30556
</body>       line 30557
</html>       line 30558
```

Body structure:

```html
<canvas id="game"></canvas>

<div id="overlay">...</div>
<div id="draftUI" class="hidden">...</div>
<div id="codexOverlay" class="codexOverlay hidden">...</div>
<button id="audioToggle">SFX ON</button>
<button id="musicToggle">BGM OFF</button>
```

The canvas is the entire game world. DOM overlays handle title/death/win, draft choices, codex, and audio buttons.

### 4.1 Important current line anchors in v45

Line numbers move after edits, but these are accurate for the current v45 file:

```text
943      const CHARACTERS
1002     const BIOMES
1435     const BIOME_ROUTE_BANDS
1620     const ENEMY_TYPES
1633     const REWARD_TYPES
1696     const ITEM_POOL
2003     const state
2588     makeDefaultSave()
3082     updateOverlay()
3106     showOverlay(mode)
3338     pushMessage(...)
3348     createPlayer(...)
3380     recomputePlayerStats(...)
4706     createEnemy(...)
4795     startGame(...)
5297     damageEnemy(...)
5316     killEnemy(...)
5435     firePlayerWeapon(...)
5641     enterExit()
5669     updateBullets(dt)
5803     updatePickups(dt)
5982     updateGame(dt)
7579     renderWorld()
7676     currentRoom()
8009     populateRoomEnemies(...)
8077     buildDungeonRoom(...)
8192     syncActiveRoom(...)
8249     setRoomCleared(...)
8375     generateLevel(index)
8673     updateEnemies(dt)
9309     drawHudTopChip(...)
9509     drawHUD()
24018    v35 external BGM IIFE
24373    v36 Safe Haven tribal village IIFE
24975    v37 playtest fixes IIFE
25625    v38 endgame coordination IIFE
26214    v39 Moon Path / Sun Route IIFE
27815    v40 opening darkness guard IIFE
28119    v42 canvas-state leak hardening IIFE
28275    v43 Sunkey/difficulty/clarity IIFE
29294    v43 Spiggot guarantee supplement
29351    v43 Sunkey visibility supplement
29590    v44 Breathing Village IIFE
30291    v45 Secret Door Sanity IIFE
30551    final hard state.buildTag = v45
```

### 4.2 Current patch tower shape

The game began as a single core file and grew through many guarded IIFE passes. This is intentional given the workflow. It is fast and reversible but fragile.

Major current patch layers:

```text
7654     Dungeon room graph patch
9235     UI polish / smaller-room hybrid patch
9632     Long-floor biome mechanics / cache shrines / boss identity / better BGM patch
10386    April 23 polish pass
10913    Boss battle ceremony pass
11415    Projectile budget / browser-soup prevention
11680    Deluxe website build integration pass
11709    Visual ravishment / richer biome atmosphere
11804    Real breach rooms + biome architecture
12486    Atmosphere-first message pass
12649    Perch sniper / Warden stability / moving atmosphere
13312    PC stability / deterministic weather / audio unlock
13738    HUD / perch reliability / local-test polish
13914    Stability-first patch / watchdog / instant doors
14257    Future consequence systems: oaths, Moon Debt, object species, scars, captains, reports
15375    HUD polish v2
15663    Moon Shrine endgame / boss telegraphs
16633    v22 snappers + lane electric overlay
16953    v23 Fake/False Moon mini-boss
17303    v24.2 final v24 synthesis
18036    v24.3 post-v24 cleanup
18199    v25 room variety
18410    v25.2 secret pickup audio / exit draft gate
18491    v26 Felt Debt + The Lien
19308    v27 Floor Identity Pass
20649    v28 difficulty curve + draft feel
21042    v29 control feel + kinematics
21183    v29.1 stability watchdog / placement / HUD reveal polish
21639    v30 Moonkey Trial rooms + alternate ending seed
22479    v31 Safe Haven narrative framing
23093    v32 ultimate narrative synthesis / item names and flavor
23646    v33 Safe Haven hub polish + return wall
23942    v34 Safe Haven cleanup + enemy density repair + audit fixes
24018    v35 external background music asset pass
24373    v36 Safe Haven tribal village pass
24975    v37 playtest fixes: mobile SFX, room persistence, hidden moons
25625    v38 endgame shrine coordination and Moonkey payoff
26214    v39 Moon Path / Sun route expansion
27815    v40 opening darkness / first-threshold readability guard
28119    v42 Safe Haven darkness / canvas-state leak hardening
28275    v43 Sunkey route gate, difficulty curve, clarity pass
29294    v43 supplement: guaranteed Sunkey route host
29351    v43 supplement: Sunkey visibility + Spiggot guarantee
29590    v44 Breathing Village Safe Haven live-tableau pass
30291    v45 Secret Door Sanity / remove orphan wall seams
```

There is no current v41 block in the final v45 source. The earlier v41 darkness attempt was superseded by v42. The breathing-village spec was implemented as v44.

---

## 5. Current game data tables

### 5.1 Playable characters

`CHARACTERS` defines four player hulls.

| ID | Name | Title | HP | Speed | Damage | Fire delay | Weapon | Special |
|---|---|---|---:|---:|---:|---:|---|---|
| `rook` | Rook | Bulwark Diver | 9 | 210 | 1.00 | 0.36 | shotgun | tanky close burst |
| `nyx` | Nyx | Razor Pilgrim | 5 | 300 | 0.72 | 0.10 | needle | fast, piercing, fragile |
| `sol` | Sol | Relay Saint | 7 | 250 | 0.93 | 0.22 | twin | starts with shieldMax 1 |
| `mire` | Mire | Thorn Cantor | 6 | 235 | 0.88 | 0.28 | spore | homing spores, secretSense 150 |

Character choice persists in save.

### 5.2 Biomes

The base route is ten floors selected from biome tier bands:

```js
BIOME_ROUTE_BANDS = ['early', 'early', 'mid', 'mid', 'late', 'late', 'abyss', 'abyss', 'zenith', 'final'];
MID_BOSS_LEVEL = 4;
FINAL_BOSS_LEVEL = 9;
```

Current base biome families:

| ID | Tier | Name |
|---|---|---|
| `verdigris` | early | Verdigris Court |
| `fen` | early | Drownlight Fen |
| `mirror` | early | Mirror Orchard |
| `rosewire` | early | Rosewire Atrium |
| `ember` | mid | Cinder Span |
| `mycelium` | mid | Lumen Mycelia |
| `shardreef` | mid | Shardreef Causeway |
| `coilroot` | mid | Coilroot Vault |
| `archive` | late | Obsidian Archive |
| `basilica` | late | Null Basilica |
| `forge` | late | Sable Forge |
| `ossuary` | late | Auric Ossuary |
| `noctlith` | abyss | Noctlith Gallery |
| `frostreliquary` | abyss | Frost Reliquary |
| `stormloom` | abyss | Stormloom Array |
| `umbraharvest` | abyss | Umbra Harvest |
| `auricspire` | zenith | Auric Spire |
| `blacksungarden` | zenith | Blacksun Garden |
| `solarium` | zenith | Sable Solarium |
| `crownworks` | zenith | Crownworks Engine |
| `empyrean` | final | Empyrean Vestibule |
| `nullthrone` | final | Null Throne |

v39 adds three Moon Path/Sun Route biome families outside the base bands:

| Path floor | ID | Name | Mood/mechanics |
|---:|---|---|---|
| 11 / index 10 | `v39_false_dawn` | The False Dawn | violent light, scarce shade, Sun-touched enemies |
| 12 / index 11 | `v39_argument` | The Argument | propaganda murals, Hierophant quote-strikes |
| 13 / index 12 | `v39_sun_throne` | The Sun's Throne | silent authority, witness seals, Sun boss |

### 5.3 Base enemy types

Base `ENEMY_TYPES`:

| ID | Display | Cost | HP | Speed | Behavior |
|---|---|---:|---:|---:|---|
| `skitter` | Pewling | 1 | 2.2 | 92 | `skitter` |
| `gunner` | Censer | 2 | 3.6 | 76 | `gunner` |
| `charger` | Ramwraith | 2 | 4.4 | 90 | `charger` |
| `turret` | Lectern | 2 | 4.9 | 26 | `turret` |
| `brute` | Ox-Warden | 3 | 8.1 | 62 | `brute` |
| `sniper` | Long Candle | 3 | 4.8 | 84 | `sniper` |
| `hexer` | Antiphon | 3 | 5.4 | 84 | `hexer` |
| `myrmidon` | Crown-Sworn | 4 | 7.4 | 88 | `myrmidon` |
| `warden` | Graven Warden | boss | 52 | 82 | `warden` |
| `archon` | Null Archon | boss | 118 | 88 | `archon` |

Later patches add/handle additional presences:

```text
Snapper
False Moon / Fake Moon
Spiggot
The Lien
Moonkey Trial False Moon body
Sun-touched
Witness
Hierophant
The Sun
perch snipers / special-room enemies
```

### 5.4 v39 Sun Route enemies

v39 adds:

```js
ENEMY_TYPES.sunTouched = { display: 'Sun-touched', behavior: 'v39SunTouched', hp: 7.4, speed: 104 }
ENEMY_TYPES.sunWitness = { display: 'Witness', behavior: 'v39Witness', hp: 5.6, speed: 44 }
ENEMY_TYPES.sunHierophant = { display: 'Hierophant', behavior: 'v39Hierophant', hp: 13.4, speed: 58 }
ENEMY_TYPES.sunCore = { display: 'The Sun', behavior: 'v39Sun', boss: true, hp: 248, speed: 72 }
```

The actual effective HP is further affected by v28 and v43 scaling.

### 5.5 Rewards / pickups

Base `REWARD_TYPES`:

| ID | Label | Effect |
|---|---|---|
| `repair` | Repair Bloom | +2 integrity |
| `heart` | Hull Weave | +1 max integrity or repair fallback |
| `marrow` | Moon Marrow | +1 max integrity, +2 repair |
| `amp` | Amber Sigil | +15% damage perk |
| `rapid` | Cadence Coil | +10% fire rate perk |
| `frame` | Lope Lattice | +8% speed perk |

Other later pickup types include Stars/Splinters, Moonkeys, Sunkey, Boon Moots, secret pickups, repair blooms from graft effects, and special drops.

### 5.6 Draft item pool / grafts

Base `ITEM_POOL` has around 27 modules. Important: later patches retune names/descriptions, so do not trust only the original base table for final player-facing copy.

Important current/final player-facing items:

| ID | Final/current name | Purpose |
|---|---|---|
| `ricochet` | Prism Teeth | shots bounce |
| `splitWake` | Hollow Brood | killing shots split |
| `orbitalHalo` | Vigil Wreath | orbiting damage/defense wards |
| `rearArray` | Trailing Stingers | rear shots |
| `graveCharge` | Grave Charge | enemy death explosions |
| `hunterMycelia` | Hunter Mycelia | homing shots |
| `phaseDrill` | Bone Auger | pierce |
| `sidecarLances` | Outrider Lances | side shots |
| `staticLink` | Arc Rosary | chain lightning/arc damage |
| `cryoRime` | Gravemire Liturgy | every hit slows enemies |
| `scavengerDrone` | Lantern Pup | drone companion autofire |
| `emberMine` | Sown Cinders | mines while moving |
| `spiteCore` | Spite Core | retaliatory burst when hit |
| `shrapnelChamber` | Splinter Hymn | impact fragments |
| `echoChamber` | Hollow Aftersong | delayed repeat volleys |
| `cacheCompass` | Hush Compass | secret sense / hidden room detection |
| `gravityWell` | Covetmark | pickup magnet |
| `hullScripture` | Hull Scripture | max HP cap-limited item |
| `bloodTithe` | Blood Tithe | repair after kills |
| `sutureEngine` | Hull Suture | repair on room clear while wounded |
| `lunarCaliber` | Lunar Caliber | bigger/harder shots, no old range penalty |
| `blackLotus` | Black Lotus | v43 buff: kill blooms + clear blooms slowing enemies |
| `aegisLattice` | Warding Lattice | extra guard layers |
| `siphonVane` | Glean Vane | repair bloom chance on kills |
| `executionBloom` | Last Bloom | finishing damage |
| `moonShard` | Moon Shard | crit flare chance |
| `riftCapacitor` | Threadbare Reliquary | integrity recharge after room clears |

v32 appends acquisition lore to many item descriptions. v43 rewrites Black Lotus and Gravemire descriptions for clarity and usefulness.

---

## 6. Runtime state, saves, and persistence

### 6.1 Core `state`

Core state begins as:

```js
const state = {
  mode: 'title',
  overlayMode: 'title',
  selectedCharId: CHARACTERS[0].id,
  save: null,
  levelIndex: 0,
  level: null,
  routeBiomes: [],
  player: null,
  enemies: [],
  bullets: [],
  particles: [],
  pickups: [],
  traps: [],
  drones: [],
  echoes: [],
  messages: [],
  camera: { x: 0, y: 0, shake: 0 },
  transition: { active: false, alpha: 0, dir: 0, switched: false, nextFn: null },
  draft: { active: false, cards: [], resolved: false, biomeIndex: -1, renderKey: '' },
  slowMo: { timer: 0, duration: 0, scale: 1 },
  pwa: { manifestReady: false, swReady: false, swError: '' },
  time: 0,
  runTime: 0,
  flash: 0,
  stats: { kills: 0, secrets: 0, deepest: 0, items: 0, foundItems: 0, breakables: 0 }
};
```

Later patches add many additional keys and systems, including:

```text
state.moonDebt
state.feltDebt
state.feltDebtEffective
state.runStats
state.moonkeys
state.sunkeys
state.moonkeyEndingUnlocked
state.sunkeyEndingUnlocked
state.shrine
state.v26FeltDebtSystem
state.v27FloorIdentitySystem
state.v28DifficultyDraftSystem
state.v29GameFeelSystem
state.v30MoonkeySystem
state.v31NarrativeSystem
state.v32NarrativeSystem
state.v33HavenHubSystem
state.v34PolishSystem
state.v35BackgroundMusicSystem
state.v36SafeHavenVillageSystem
state.v37PlaytestFixSystem
state.v38EndgameFixSystem
state.v39MoonPathSunRouteSystem
state.v40OpeningDarknessGuardSystem
state.v42CanvasStateLeakHardeningSystem
state.v43SunkeyDifficultyClaritySystem
state.v43SpiggotGuaranteeSystem
state.v43SunkeyRouteSupplementSystem
state.v44BreathingVillageSystem
state.v45SecretDoorSanitySystem
```

### 6.2 Save keys

Persistent save:

```text
SAVE_KEY = 'noMoonSave_v1'
LEGACY_SAVE_KEYS = ['riftWakeSave_v4', 'noMoonSave_v4']
SAVE_VERSION = 4
```

Audio mute:

```text
AUDIO_MUTE_KEY = 'noMoonSfxMute_v1'
LEGACY_AUDIO_MUTE_KEYS = ['riftWakeMute_v1', 'noMoonMute_v1']
```

Narrative / route counters:

```text
noMoon.v32.runCount
noMoon.v33.victoryCount
noMoon.v33.moonkeyReturnCount
noMoon.v39.sunPathClearCount
```

### 6.3 Save object shape

`makeDefaultSave()` returns:

```js
{
  version: SAVE_VERSION,
  selectedCharId: CHARACTERS[0].id,
  unlockedCharacters: { rook: true, nyx: true, sol: true, mire: true },
  highestBiomeReached: 0,
  lifetime: {
    kills: 0,
    deaths: 0,
    wins: 0,
    runs: 0,
    secrets: 0,
    biomesCleared: 0,
    itemsChosen: 0,
    itemsFound: 0,
    breakablesBroken: 0,
    timePlayed: 0
  },
  achievements: { ... }
}
```

Save loading merges stored data into defaults. This is forgiving but not a real migration system. If you add durable save fields, add explicit migration logic instead of assuming merge will always be enough.

### 6.4 Achievements

Current base achievements:

```text
blooded         Blooded                runs >= 1
deep_2          Twice-Torn             highestBiomeReached >= 2
deep_5          Wakebreaker            highestBiomeReached >= 5
secrets_10      Cache Fiend            lifetime.secrets >= 10
kills_100       Hundred Teeth          lifetime.kills >= 100
modules_20      Graft Fever            itemsChosen + itemsFound >= 20
break_8         Rubble Whisperer       breakablesBroken >= 8
wins_1          Route Burnt Open       wins >= 1
```

---

## 7. Controls and input

### 7.1 Desktop

```text
WASD / arrows       Move
Mouse               Aim
Hold left click     Fire
M                   Toggle SFX
B                   Toggle BGM
Number keys         Pick draft cards
Escape              Used for some overlays / shrine panic exit
```

### 7.2 Mobile/touch

```text
Left half drag      Movement joystick
Right half drag     Aim/fire joystick
```

Touch state is stored in:

```js
input.moveTouch
input.aimTouch
```

The overlay deliberately allows normal touch scrolling so title/codex/draft UI do not hijack page gestures.

### 7.3 Current movement feel

v29 is the current feel layer. It adds:

- faster useful acceleration,
- stronger stop deceleration,
- reversal acceleration bonus,
- lateral drift cleanup,
- speed clamp near stat speed,
- better obstacle sliding,
- tighter camera tracking,
- camera/muzzle feedback on firing without physical recoil.

Do not add actual player knockback from shooting unless Alex explicitly requests it. It was considered and rejected because it worsens high-fire builds.

---

## 8. Audio and music

### 8.1 Current audio architecture

SFX are WebAudio oscillator/noise based. BGM is now an external MP3 asset added in v35, connected into WebAudio for gain/filter/routing.

Core audio state:

```js
const audioState = {
  ctx,
  master,
  noiseBuffer,
  muted,
  lowHpTimer,
  lastShot,
  lastHit,
  lastBreak,
  lastPickup,
  lastDeath,
  lastBellway
};
```

Core BGM state:

```js
const bgmState = {
  enabled,
  gain,
  filter,
  nodes,
  interval,
  step,
  nextStepTime,
  resumeOnVisible
};
```

### 8.2 v35 background music

v35 added:

```text
/no-moon/no-moon-bg-v35.mp3
```

Current service worker caches this asset.

The track is external, not embedded in the HTML. This keeps the HTML from ballooning. It loops. It is routed through WebAudio gain/filter nodes so existing fade/duck systems can still affect it.

Important v35 config:

```js
state.v35BackgroundMusicSystem.config = {
  USE_EXTERNAL_TRACK: true,
  TRACK_URL: './no-moon-bg-v35.mp3',
  TARGET_GAIN: 0.18,
  FADE_IN_SECONDS: 0.26,
  FADE_OUT_SECONDS: 0.12,
  PRELOAD_ON_AUDIO_WAKE: true,
  FALLBACK_TO_SYNTH_ON_ERROR: true,
  THRESHOLD_DUCK_RESTORE: true,
  THRESHOLD_DUCK_RESTORE_SECONDS: 3.4
}
```

### 8.3 Procedural fallback

The old procedural BGM constants still exist:

```text
BGM_TEMPO = 86
BGM_STEP_SECONDS = 60 / BGM_TEMPO / 2
BGM_LOOKAHEAD_SECONDS = 0.28
BGM_SCHEDULER_MS = 82
BGM_BASS / BGM_ARP / BGM_LEAD / BGM_CHORDS
```

v35 can fall back to synth if the external MP3 fails.

### 8.4 Sun Route audio

v39 processes the existing v35 track during the Moon Path/Sun Route, using runtime WebAudio state rather than adding another file. On The Sun's Throne, music cuts and a procedural drone enters for later Sun phases.

---

## 9. Rendering, camera, HUD, and canvas-state risks

### 9.1 Render stack

Core stack:

```text
requestAnimationFrame(frame)
  → updateGame(dt)
  → render()
    → renderWorld()
      → world background / ambient / hazards / obstacles / pickups / enemies / bullets / player
    → draw HUD / minimap / chips
```

DOM overlays are separate from canvas render.

### 9.2 Camera transform

World-space render commonly uses:

```js
ctx.translate(-state.camera.x + playViewCenterX(), -state.camera.y + playViewCenterY());
```

Important helpers:

```text
playViewCenterX()
playViewCenterY()
currentRoom()
```

### 9.3 HUD

HUD is mostly canvas-rendered and includes:

- biome/room chip,
- HP/integrity,
- Moon Debt,
- Stars,
- Moonkeys,
- Sunkey chip from v43,
- minimap/fog-of-war,
- audio hints/buttons,
- floor condition badge from v43.

There is HUD occlusion fade logic so important interactables do not get hidden behind HUD on mobile.

### 9.4 Canvas-state leak hardening

v42 exists because a previous bug let an older Safe Haven HUD wrapper throw after changing `ctx.globalAlpha`, leaving the whole game canvas dark. v42 provides:

- outer-scope `textFit39()` compatibility,
- `window.textFit39`,
- canvas-state reset before/after render,
- reset of `globalAlpha`, `globalCompositeOperation`, `filter`, shadows, text alignment, and line dashes.

Future render wrappers must use `ctx.save()` / `ctx.restore()` carefully and should catch errors after restoring canvas state where possible.

---

## 10. Level, room, and encounter generation

### 10.1 Base route

The base route is ten floors, indices 0–9. UI may present them 1-indexed.

```text
index 0     Safe Haven + first biome floor
index 4     Graven Warden midpoint boss
index 9     Null Archon final boss / Null Throne
```

v39 adds indices 10–12 for Moon Path / Sun Route.

### 10.2 Room lifecycle

Typical lifecycle:

```text
startGame()
  → createPlayer()
  → buildBiomeRoute()
  → generateLevel(0)
    → buildDungeonRoom()
    → populateRoomEnemies()
    → assign room graph / doors / special rooms / exits
  → syncActiveRoom()

During play:
  → updateGame()
  → updateEnemies(), updateBullets(), updatePickups()
  → setRoomCleared() when hostile room cleared
  → enterExit() to move floors / start shrine / Moon Path / win
```

Room arrays are sometimes shared by reference with state arrays. Be careful.

### 10.3 Active room convention

The code has a crucial historical convention:

```text
state.level = current floor data
currentRoom() = active room object
room.width / room.height = actual room dimensions
state.level.width / state.level.height = often repointed to active room dimensions after syncActiveRoom()
```

When writing new code, prefer `currentRoom().width` and `currentRoom().height` when possible.

### 10.4 Room kinds and fields

Typical room fields include:

```text
id
kind                 entry / normal / cache / shrine / exit
width, height
wall
depth
enemies
pickups
traps
hazards
obstacles
exit
cleared
hasBoss
hasFalseMoon
hasSpiggot
_v30MoonkeyRoom
_v26LienHost
_v27Recipe
_v27Special
_v34DensityRepaired
_v39MoonPathRoom
_v39SunThrone
_v43SunkeyCarrier
```

Do not assume arrays exist. Defensive wrappers often initialize arrays.

### 10.5 Floor conditions

v27 introduced floor identity / contracts, such as:

```text
THE ROOM REMEMBERS YOUR SHAPE
THE FLOOR WANTS SPEED
THE ROOM HEARS GUNFIRE
THE FLOOR IS HUNGRY ENOUGH TO HELP
THE LIGHT BREATHES WRONG
THE FLOOR HAS TEETH
THE MAP IS OVERCONFIDENT
THE BELL IS NOT IN THE ROOM YET
THE FLOOR DOES NOT HOLD STILL
```

v37 clarified confusing wall-language. v40 blocks early blackouts/readability regressions. v43 adds a floor-condition badge so these conditions are actually visible to the player.

### 10.6 Secret rooms / breach doors / v45 sanity

There are legitimate secret annex doors and real breach doors. Older colorful breakable door plugs should correspond to real secrets/breaches.

v43 briefly added small random hidden seams that could look like tiny secret doors without actual annex geometry. v45 disables and purges those:

```js
state.v43SunkeyDifficultyClaritySystem.config.HIDDEN_SEAMS = false;
state.v43SunkeyDifficultyClaritySystem.config.HIDDEN_SEAMS_PER_LEVEL = 0;
```

v45 removes:

- `_v43HiddenSeam` obstacles,
- orphan breakable capsule objects with hidden rewards/enemies but no annex/breach,
- broken `isSecretDoor` objects lacking valid annex geometry.

v45 preserves:

- valid annex secret doors,
- real breach doors,
- Sunkey/Moonkey logic,
- v44 Breathing Village,
- v43 difficulty curve,
- combat.

Current debug:

```js
state.v45Debug()
state.v45SecretDoorAudit()
```

Healthy values:

```js
v43HiddenSeamsEnabled: false
scan.hiddenSeams: 0
scan.orphanDoorCapsules: 0
scan.brokenSecretDoors: 0
```

---

## 11. Combat systems

### 11.1 Player stats

`createPlayer()` and `recomputePlayerStats()` build player stats from:

- selected character template,
- perks from rewards,
- graft/module stacks,
- shield/guard layers,
- temporary systems.

Do not assume visible item name equals internal ID. Saves and modules use internal IDs.

### 11.2 Weapons

Base weapon types:

```text
shotgun      Rook
needle       Nyx
twin         Sol
spore        Mire
```

Modules add:

- ricochet,
- split/forking shots,
- orbitals,
- rear shots,
- side shots,
- homing,
- pierce,
- shrapnel,
- echoes,
- chain lightning,
- mines,
- drones,
- crit/finisher effects.

### 11.3 Enemy scaling and difficulty

Difficulty has been tuned repeatedly. The current philosophy:

```text
Do not remove the player's cool stacked-power spectacle.
Raise late enemy HP and add behavior/phase gates so rooms and bosses survive long enough to matter.
```

v28 adds earlier HP/draft curve fixes. v43 adds stronger late HP scaling:

```js
STRONGER_LATE_HP_CURVE: true,
NORMAL_EXTRA_HP_MAX: 3.15,
MOON_PATH_EXTRA_HP: 2.85,
BOSS_EXTRA_HP_MAX: 1.70
```

If future playtests say the game is too easy, first tune these values or add durable enemy behavior. Do not gut the build fantasy.

### 11.4 Bosses and minibosses

Major bosses:

```text
Graven Warden      midpoint boss, floor index 4
Null Archon        base final boss, floor index 9
The Sun            Sun Route final boss, floor index 12
```

Miniboss/special presences:

```text
False Moon / Fake Moon
Spiggot
The Lien
Moonkey Trial final moon body
Snapper / perch-special threats
```

v43 coalesces boss/miniboss death messages because overlapping death text was too noisy.

---

## 12. Safe Haven and beginning room

### 12.1 Current role

Safe Haven is the starting room and emotional home base. It must be safe:

```text
0 enemies
0 hazards
0 traps
0 dangerous breakables
warm/inhabited village look
clear anti-moon threshold
no cluttered overlapping banners
```

### 12.2 v36 tribal village

v36 converted Safe Haven into a small underground village with:

- huts,
- warm hearth,
- tribe/kin figures,
- threshold plaque,
- Moonkey reliquary,
- erased/crossed moon sigil,
- anti-moon markings.

### 12.3 v44 Breathing Village

v44 adds a live atmospheric layer on top of the Safe Haven baked background. It disables the baked v36 hearth/tribe figures and replaces them with live animated details:

```text
flickering hearth
hearth haze
embers
smoke wisps
breathing/swaying kin figures
hearth-tender figure
sleeping figure
loom worker
hanging lantern
window-light spill cones
pennant ropes
threshold offerings/candles
childlike crossed-moon marks
dust motes
ceiling/cave hints
```

It detects post-Sun return and shifts colder so the hostile/changed Safe Haven still feels wrong.

Important v44 config:

```js
state.v44BreathingVillageSystem.config.ENABLED = true;
state.v44BreathingVillageSystem.config.HEARTH_LIVE = true;
state.v44BreathingVillageSystem.config.SMOKE_WISPS = true;
state.v44BreathingVillageSystem.config.KIN_BREATHING = true;
state.v44BreathingVillageSystem.config.WINDOW_SPILL = true;
state.v44BreathingVillageSystem.config.HANGING_LANTERN = true;
state.v44BreathingVillageSystem.config.PENNANTS = true;
state.v44BreathingVillageSystem.config.SLEEPING_FIGURE = true;
state.v44BreathingVillageSystem.config.LOOM_WORKER = true;
state.v44BreathingVillageSystem.config.SUN_RETURN_COOL_TINT = true;
```

Future changes to Safe Haven should be visually careful. It should be alive but not a noisy cartoon NPC town.

### 12.4 Safe Haven darkness fixes

v40 and v42 exist because run-start / Safe Haven darkness regressions appeared after v39/v44-style render changes. Do not delete these without carefully testing:

- v40 opening darkness / threshold readability guard,
- v42 canvas-state leak hardening.

---

## 13. Moon Debt, Felt Debt, oaths, and consequences

### 13.1 Moon Debt

Moon Debt is the game's forbidden-action pressure system. It rises from breaking/using forbidden objects and other transgressive systems.

Canonical function:

```js
addMoonDebt(amount, reason, x, y)
```

There is also `addDebtLite(...)` from later floor/object systems.

### 13.2 Felt Debt

v26 makes debt visible/audible/felt:

- smooths debt into `state.feltDebt`,
- drains player color/saturation,
- adds break weight/audio pressure,
- adds undertow audio,
- shrine catharsis release,
- The Lien amplifies pressure,
- v34 adds a dashed debt ring for non-color/colorblind readability.

### 13.3 The Lien

The Lien is a debt-collector captain, not just another shooter:

- eligible later in run,
- should not stack on top of other mini-presences,
- stalks slowly,
- no projectiles,
- cannot be staggered,
- amplifies felt debt,
- killing it releases pressure.

### 13.4 Oaths

The old Future Consequence pass added start-of-run oaths. Alex decided they do not add enough and the game already has enough systems. v43 disables start oaths.

Important:

```js
state.v43SunkeyDifficultyClaritySystem.config.DISABLE_START_OATHS = true;
```

Do not reintroduce start-of-run oaths unless Alex explicitly asks.

---

## 14. Moonkeys, Sunkey, Shrine, and the final route

### 14.1 Moonkey Trial rooms

v30 added Moonkey Trial rooms. Shape:

```text
moon apparition appears
spawns enemy wave
wave dies
moon returns
spawns more waves
after 2–3 waves, becomes False Moon body
False Moon dies
Moonkey drops
```

v37 reinforced hidden moon / False Moon preludes so moons spawn enemies before the body/boss phase.

Current helper:

```js
state.v34MoonkeyCount()
state.v34MoonkeyReady()
```

### 14.2 Spiggot and Sunkey

Spiggot is a fast pink chaser/lunger miniboss. v43 makes it route-critical:

```text
Spiggot drops Sunkey.
Final path requires 3 Moonkeys + 1 Sunkey.
```

v43 ensures a Spiggot/Sunkey carrier if needed, avoiding pure RNG failure. It adds Sunkey sprite, magnet, pickup logic, HUD chip, debug helpers.

Important helpers:

```js
state.v43SunkeyCount()
state.v43RouteReady()
state.v43DropSunkey()
state.v43EnsureSunkeySpiggot()
state.v43Debug()
state.v43SupplementDebug()
```

Healthy final-route requirement:

```js
state.v43RouteReady() === true
// requires moonkeys >= 3 and sunkeys >= 1
```

### 14.3 Moon Shrine / Boon Moots

After the Null Archon, the player enters the Moon Shrine sequence:

```text
enter stage
fight cracked moon
break moon
Boon Moots reward spawns
reward capture
victory hold
ascension
handoff
```

v38 made the three-Moonkey shrine visually distinct and fixed overlay/character-grid issues. v43 makes Boon Moots stickier and clearer with capture confirmation. The intended flow now, if route-ready:

```text
Archon death → Shrine → Boon Moots → directly into False Dawn
```

No menu between the shrine and final path when requirements are met.

### 14.4 v39 Moon Path / Sun Route

v39 implements a three-floor post-Archon route:

1. **The False Dawn** — the first light is hostile; violent light and scarce shade.
2. **The Argument** — propaganda murals; Hierophants carry the Sun's worldview through attacks.
3. **The Sun's Throne** — final boss arena; the Sun is silent.

Important v39 config:

```js
state.v39MoonPathSunRouteSystem.config = {
  ENABLED: true,
  REQUIRE_THREE_MOONKEYS: true,
  PATH_START_INDEX: 10,
  FLOOR_COUNT: 3,
  RESTORE_PRE_SHRINE_HP: true,
  RESTORE_PRE_SHRINE_SHIELD: true,
  KEEP_GRAFTS_AND_STATS: true,
  SUN_LIGHT_HAZARD: true,
  LIGHT_CYCLE_SECONDS: 6.2,
  LIGHT_BRIGHT_SECONDS: 2.35,
  SUN_INTRO_SECONDS: 4.8,
  SUN_SEAL_SECONDS: 2.35,
  SUN_PHASE_GATE: true,
  SUN_PHASE_TWO_THRESHOLD: 0.48,
  SUN_ROUTE_AUDIO_PROCESSING: true,
  SUN_THRONE_MUSIC_CUT: true,
  SUN_DRONE: true,
  RETURN_HUB_HOSTILE: true,
  COLD_SISTER_SKY: true,
  MOON_PATH_DRAFTS: true
}
```

v43 supplements this with Sunkey requirement and a stronger snapshot restore to ensure the player's build/stats carry into the route.

### 14.5 The Sun boss

The Sun is the real antagonist. It is silent. It should not become chatty.

Fight structure:

```text
Phase 1: witness seals. Damage alone cannot skip the phase.
Phase 2: overwhelming bright light; faster attacks, active damage race.
Phase 3: smaller, more afraid-looking bright core; mechanically nastier.
```

Light is the threat. Moon Path rooms cycle bright/dim, and shade matters. Higher Moon Debt/Felt Debt makes light burn more punishing. This reframes debt as evidence the Sun wants to bleach away.

Victory text:

```text
THE SKY IS QUIET
```

Post-Sun hub:

```text
Safe Haven returns hostile/withdrawn.
Cold Sister is silently visible in the sky.
Figures/room should feel colder.
The haven is not grateful; it resists the truth.
```

Persistent Sun clear counter:

```text
noMoon.v39.sunPathClearCount
```

---

## 15. Overlays, win/death flow, and message stack

### 15.1 Overlay DOM

`#overlay` contains:

```html
<h1 id="overlayTitle"></h1>
<p id="overlayText"></p>
<div id="characterGrid" class="cards"></div>
<div class="footerInfo">...</div>
<div class="actions">...</div>
```

Historically, character cards appeared under win overlays because `showOverlay()` always rebuilt the character grid. v38 fixed/guarded that for win flow.

### 15.2 Message spam problem

Boss and miniboss deaths were producing too many overlapping push messages. v43 adds a message-coalescing window for boss/miniboss death beats, allowing key progression messages (Moonkey, Sunkey, Boon Moots, route beats) but suppressing redundant chatter.

Future message work should respect:

- `pushMessage` is wrapped many times,
- atmosphere throttling has allowlists,
- v30/v31/v32/v33/v38/v43 all touch final/boss messaging,
- breaking this can make the most important moments unreadable.

---

## 16. Service workers and offline/cache behavior

### 16.1 Game worker

Current `/no-moon/no-moon-sw.js`:

```js
const CACHE_NAME = 'no-moon-future-consequence-v45';
const ASSETS = ['./', './index.html', './no-moon-bg-v35.mp3'];
```

Behavior:

- on install: cache assets and skip waiting,
- on activate: delete older `no-moon-*` caches and claim clients,
- on fetch:
  - only handles same-origin GET requests,
  - handles game document and BGM asset,
  - BGM is cache-first-ish with cache update on fetch,
  - document uses network-first with `cache: 'no-store'`, falling back to cached `index.html`.

### 16.2 Root cleanup worker

Root `no-moon-sw.js`:

- skips waiting,
- on activate deletes all `no-moon-*` caches,
- unregisters itself,
- navigates clients to refresh.

Keep it unless deliberately changing SW strategy.

### 16.3 Cache-busting rule

Every game release must update all of:

```text
no-moon/index.html final state.buildTag
no-moon/no-moon-sw.js CACHE_NAME
zip filenames
patch notes filename/content
deploy notes filename/content
reported SHA256s
```

If a user sees an old build, have them confirm the title screen build tag and then close/reopen/hard-refresh. Incognito should usually bypass older local state, but service-worker behavior can still be confusing depending on deploy timing.

---

## 17. Debug helpers in current v45

Important available console calls:

```js
state.buildTag
state.v45Debug()
state.v45SecretDoorAudit()
state.v44Debug()
state.v43Debug()
state.v43SupplementDebug()
state.v43SunkeyCount()
state.v43RouteReady()
state.v43DropSunkey()
state.v43EnsureSunkeySpiggot()
state.v42Debug()
state.v40Debug()
state.v39Debug()
state.v39StartMoonPath()
state.v39GoSun()
state.v39CompleteSun()
state.v38Debug()
state.v37Debug()
state.v36Debug()
state.v35Debug()
state.v34Debug()
state.v34MoonkeyCount()
state.v34MoonkeyReady()
state.v33Debug()
state.v32Debug()
state.v30Debug()
state.v29Debug()
state.v28Debug()
state.v27Debug()
state.v26Debug()
```

Useful direct config objects:

```js
state.v26FeltDebtSystem.config
state.v27FloorIdentitySystem.config
state.v28DifficultyDraftSystem.config
state.v29GameFeelSystem.config
state.v34PolishSystem.config
state.v35BackgroundMusicSystem.config
state.v37PlaytestFixSystem.config
state.v38EndgameFixSystem.config
state.v39MoonPathSunRouteSystem.config
state.v43SunkeyDifficultyClaritySystem.config
state.v44BreathingVillageSystem.config
state.v45SecretDoorSanitySystem.config
```

### 17.1 v45 secret door debug

```js
state.v45Debug()
state.v45SecretDoorAudit()
```

Expected healthy values:

```js
state.v45Debug().v43HiddenSeamsEnabled === false
state.v45Debug().scan.hiddenSeams === 0
state.v45Debug().scan.orphanDoorCapsules === 0
state.v45Debug().scan.brokenSecretDoors === 0
```

### 17.2 Route debug

```js
state.v34MoonkeyCount()
state.v43SunkeyCount()
state.v43RouteReady()
```

Final path opens when:

```text
Moonkeys >= 3
Sunkeys >= 1
```

### 17.3 Direct Sun debug shortcuts

For testing without full run:

```js
state.v39StartMoonPath()
state.v39GoSun()
state.v39CompleteSun()
```

Use cautiously: debug shortcuts can skip natural state that a full playthrough creates.

---

## 18. How to modify safely

### 18.1 Default pattern: guarded additive IIFE

Use this for most changes:

```js
// ===================================================================
// === v46 — Short descriptive pass name =============================
// ===================================================================
(function installV46ShortDescriptivePass() {
  const V46_VERSION = 'qual.future-consequence.2026-05-01.v46';
  if (typeof state === 'undefined' || !state) return;

  const sys = state.v46SomeSystem = state.v46SomeSystem || {};
  sys.version = V46_VERSION;
  sys.config = Object.assign({
    ENABLED: true
  }, sys.config || {});
  sys.stats = Object.assign({
    lastError: null
  }, sys.stats || {});

  function recordError(e) {
    sys.stats.lastError = e && (e.message || String(e)) || null;
  }

  if (typeof someFunction === 'function' && !someFunction.__v46SomeSystem) {
    const baseSomeFunction46 = someFunction;
    someFunction = function(...args) {
      const out = baseSomeFunction46.apply(this, args);
      try {
        if (sys.config.ENABLED) {
          // additive behavior
        }
      } catch (e) { recordError(e); }
      return out;
    };
    someFunction.__v46SomeSystem = true;
  }

  state.v46Debug = function() {
    return {
      version: V46_VERSION,
      buildTag: state.buildTag,
      config: Object.assign({}, sys.config),
      stats: Object.assign({}, sys.stats),
      v45: typeof state.v45Debug === 'function' ? state.v45Debug() : null
    };
  };

  state.buildTag = V46_VERSION;
})();

state.buildTag = 'qual.future-consequence.2026-05-01.v46';
```

Then update service worker:

```js
const CACHE_NAME = 'no-moon-future-consequence-v46';
```

### 18.2 Direct edits are okay for

- final build tag,
- service-worker cache name,
- obvious typo/copy fixes,
- small data-table tuning if inspected,
- hardcoded strings,
- patch/deploy notes,
- exact known one-line bug fixes.

### 18.3 Direct edits are risky for

- `updateGame`,
- `render` / `renderWorld`,
- `drawHUD`,
- `pushMessage`,
- `generateLevel`,
- `syncActiveRoom`,
- `updateEnemies`,
- `damageEnemy` / `killEnemy`,
- save/load structure,
- service-worker scope,
- the Shrine / final path handoff.

Wrap or inspect carefully.

### 18.4 Wrapper etiquette

- Always guard wrappers with `!fn.__vXXName`.
- Store base function once.
- Return base result unless deliberately replacing behavior.
- Catch optional/polish errors and write `sys.stats.lastError`.
- Do not throw from a render wrapper if you can avoid it.
- Restore canvas state after custom drawing.
- If wrapping `pushMessage`, preserve important messages and allowlists.
- If wrapping `showOverlay`/`updateOverlay`, test title, death, normal win, Moonkey/Sunkey gate, Sun win.
- If wrapping `generateLevel`, test Safe Haven, ordinary rooms, boss rooms, Moonkey rooms, Spiggot/Sunkey rooms, and Moon Path rooms.

---

## 19. Validation procedure for any new build

From extracted full-site folder:

```bash
# Extract inline JS
awk '/<script>/{flag=1;next}/<\/script>/{flag=0}flag' no-moon/index.html > /tmp/no-moon-inline.js

# Syntax check
node --check /tmp/no-moon-inline.js
node --check no-moon/no-moon-sw.js
node --check no-moon-sw.js

# Marker audit
grep -n "qual.future-consequence.2026-05-01.vXX" no-moon/index.html
grep -n "no-moon-future-consequence-vXX" no-moon/no-moon-sw.js
grep -n "state.vXXDebug" no-moon/index.html

# Site structural checks
grep -n 'src="\[HEADSHOT_URL\]"' index.html || true
grep -n '/cdn-cgi/' index.html || true
grep -n 'href="book.html"' index.html
grep -n '/no-moon/' index.html

# Zip integrity
unzip -t qualiacology-full-site-v3-2-with-game-vXX.zip
unzip -t qualiacology-no-moon-vXX-game-only.zip

# Checksums
sha256sum qualiacology-full-site-v3-2-with-game-vXX.zip
sha256sum qualiacology-no-moon-vXX-game-only.zip
sha256sum NO_MOON_FUTURE_CONSEQUENCE_VXX_PATCH_NOTES.md
sha256sum DEPLOY_NOTES_VXX.md
```

### 19.1 Manual playtest checklist

At minimum:

```text
[ ] Title screen loads and shows correct build tag.
[ ] SFX button works.
[ ] BGM button starts/stops v35 MP3.
[ ] Start run.
[ ] Safe Haven appears bright/readable with v44 Breathing Village.
[ ] Wait in Safe Haven for 10–30 seconds: no darkness bug; village motion feels subtle.
[ ] Cross threshold.
[ ] First combat room readable; no leftover Safe Haven darkness/transition bug.
[ ] Normal room clears.
[ ] Backtracking does not respawn enemies forever.
[ ] Draft appears after appropriate clears; item cards work.
[ ] Black Lotus feels useful if selected.
[ ] Floor-condition badge appears when floor has a condition.
[ ] Break forbidden object: Moon Debt and debt ring respond.
[ ] Find/break real colorful secret door plug: it actually opens/pays out.
[ ] No tiny random fake seam appears.
[ ] Find Moonkey Trial; verify waves before moon body.
[ ] Fight Spiggot; verify Sunkey drop and pickup/HUD.
[ ] Verify route blocked with 3 Moonkeys but no Sunkey.
[ ] Verify route opens with 3 Moonkeys + 1 Sunkey.
[ ] Beat Warden.
[ ] Beat Null Archon.
[ ] Shrine / Boon Moots collection feels sticky and clear.
[ ] Route-ready run goes directly to False Dawn, no menu.
[ ] Player keeps items/stats into Moon Path.
[ ] Sun Route playable; Sun boss phases/seals work.
[ ] Sun victory shows THE SKY IS QUIET.
[ ] Post-Sun Safe Haven has Cold Sister sky and hostile/cold mood.
[ ] Death overlay still works.
[ ] Regular/no-route win still works.
[ ] Test on mobile for touch controls/audio unlock/HUD occlusion.
```

---

## 20. Packaging outputs

### 20.1 Full-site zip

From staging folder containing root files:

```bash
zip -r qualiacology-full-site-v3-2-with-game-vXX.zip \
  index.html \
  book.html \
  _redirects \
  no-moon.html \
  no-moon-sw.js \
  no-moon \
  assets \
  DEPLOY_NOTES_VXX.md \
  NO_MOON_FUTURE_CONSEQUENCE_VXX_PATCH_NOTES.md
```

### 20.2 Game-only zip

From staging folder containing only `no-moon/`:

```bash
zip -r qualiacology-no-moon-vXX-game-only.zip no-moon
```

### 20.3 Report format back to Alex

Always include:

```text
- build tag
- service-worker cache name
- full-site zip link
- game-only zip link
- patch notes link
- deploy notes link
- SHA256 hashes
- what changed
- what validation passed
- what was not manually playtested
- key live checks
- debug helpers/runtime knobs
```

---

## 21. Current known caveats / watchpoints

### 21.1 Patch tower fragility

The source is functional but layered. Many major functions are wrapped multiple times. Bugs often come from wrapper interactions, not one obvious core bug.

High-risk surfaces:

```text
generateLevel
syncActiveRoom
render / renderWorld
drawHUD / drawHudTopChip
pushMessage
updateOverlay / showOverlay
killEnemy / damageEnemy
enterExit
Moon Shrine handoff
Sun Route handoff
service worker cache
```

### 21.2 Recovery shell can hide bugs

Some systems catch and store errors rather than crashing. Check debug helpers' `lastError` fields.

### 21.3 Manual playtest matters

Syntax checks are necessary but insufficient. Most important regressions so far were feel/readability/playtest issues:

- Safe Haven darkness,
- mobile SFX unlock,
- rooms repopulating on backtrack,
- hidden moon prelude missing,
- endgame overlay text pileup,
- Boon Moots bounce/collection confusion,
- final path stripping stats,
- fake secret seams.

### 21.4 Safe Haven is emotionally important

Do not clutter it with more banners. It should feel inhabited and comfy but ominous. v44 is the current high-water mark.

### 21.5 Sun Route is a major success

Do not casually rewrite The False Dawn / The Argument / Sun's Throne. The final floor and boss landed well. Future tuning should preserve the bright-hostile cosmic-horror feel and silent Sun.

### 21.6 Difficulty tuning

The current game was previously too easy because powerups stacked hard. v43 increased late HP and preserved power spectacle. If tuning again, adjust late HP / boss phase resilience / enemy behavior. Do not make early game miserable or remove the visual chaos of strong builds.

### 21.7 Start oaths removed

Do not re-add start oaths by accident.

### 21.8 Secret doors after v45

If colorful secret plugs lead nowhere again, inspect:

```js
state.v45SecretDoorAudit()
```

Also inspect obstacle fields:

```text
isSecretDoor
annexId
annexRect
annexCenter
isRealBreachDoor
breachFlavor
breachLabel
_v43HiddenSeam
hiddenItemId
hiddenEnemyTypes
```

---

## 22. Source-of-truth checklist before handing off

A new AI/developer should receive:

```text
[ ] This handoff document.
[ ] qualiacology-full-site-v3-2-with-game-v45.zip.
[ ] qualiacology-no-moon-v45-game-only.zip.
[ ] NO_MOON_FUTURE_CONSEQUENCE_V45_PATCH_NOTES.md.
[ ] DEPLOY_NOTES_V45.md.
[ ] Optional but useful: NO_MOON_QUALIACOLOGY_V34_FULL_HANDOFF.md for old architecture history.
[ ] Optional but useful: NO_MOON_V37_ENDGAME_INVESTIGATION_HANDOFF.md for endgame-wrapper failure history.
[ ] Optional but useful: NO_MOON_V41_BREATHING_VILLAGE_SPEC.md for Safe Haven design intent.
```

When working, always open the actual `no-moon/index.html` from the current zip first. This document is a map, not the territory.

---

## 23. Final mental model

The website is a static personal hub. The game is a one-file browser roguelite with a living patch-stack architecture. It is not clean in a modular-engine sense, but it is highly editable if you respect the wrapper tower.

The current game loop is:

```text
A warm underground tribe says the Moon is evil.
You leave Safe Haven anyway.
The climb makes the warning feel embodied.
Forbidden power makes you stronger and more marked.
Moonkeys and False Moons show the story is incomplete.
Spiggot holds the Sunkey.
The Archon/Throne breaks.
The Shrine reveals the Moon was locked.
Three Moonkeys plus one Sunkey open the final path.
The Sun, not the Moon, was the true oppressor.
You kill the Sun.
The sky becomes quiet.
Safe Haven sees the Cold Sister and does not know how to forgive the truth.
```

Protect that arc. Then make the rooms hit harder.
