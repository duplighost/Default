# No Moon — Codebase Handoff

_Last updated: 2026-06-01, current build `qual.v307-clean-shrine-root-fix.2026-06-01.v307`._

This is the practical, "everything you need to not break it" handoff for the **No Moon**
browser game (part of the Qualiacology site). Read the **Golden Rules** and **The Stacked-Patch
Architecture** sections before touching a single line. The rest is reference.

---

## 0. TL;DR / orientation

- **No Moon** is a single-file, ~71,600-line, ~3.5 MB JavaScript browser game (twin-stick
  roguelite, HTML5 canvas, Web Audio). No build step, no framework, no modules.
- It is **one giant IIFE** (the "base game", roughly lines 1–18,700) followed by **~144
  `installV<N>...()` wrapper patches** that monkey-patch the base by capturing and re-assigning
  functions. Newer patches wrap older ones. Nothing is ever deleted; behavior is layered.
- The same JavaScript exists in **three places that must stay byte-identical** (the "three-copy
  invariant"). Breaking that is the #1 way to ship a build where "the label says vX but the code
  is vY."
- The **ending/route system is the most fragile, most-patched, most-dangerous part** of the
  codebase. Most of this session's bugs lived there. Treat it like live wiring.
- There is **no automated CI**. Verification is done by hand with **Playwright headless Chromium**
  driving the real game (see Testing). Static reading of this file is unreliable — runtime
  behavior repeatedly contradicted careful static traces. **Test against the running game.**

---

## 1. Golden Rules (the stuff that bites)

1. **Edit `no-moon/game_inline.js`, then sync all three copies.** See §3. If you skip this, the
   deployed game (which runs the inline `<script>` in `no-moon/index.html`) won't have your change,
   or the reference copies will lie about what's shipping.
2. **The displayed build tag is set by whichever install block writes it LAST.** In-place edits to
   existing functions do **not** bump the tag. If you want the version to be verifiable, add/adjust
   the trailing version-bump block (currently the v307 install block). v304+ uses
   `Object.defineProperty` on `state.buildTag` so the latest version always wins the read.
3. **Runtime > static analysis in this file.** 144 wrappers interact in ways that defeat reading.
   Reproduce behavior in Playwright before believing a diagnosis, and again after a fix.
4. **The ending is a minefield.** `state.mode = 'win'` is a tripwire: setting it (even briefly)
   wakes a dozen "is the game won?" systems (v250/v251/v257/v260/v274). If you're routing around
   the win, **don't flash `mode='win'`** — see §6 (the v305/v306 root fix).
5. **Don't trust other AIs' (or my) confident diagnoses.** Verify against the code and the running
   game. This was the user's standing instruction all along, and it was right every time.
6. **Commit + push the zip artifact, not just loose files.** The repo tracks the built `.zip` +
   `.sha256.txt` + notes; the loose game source lives in the working dir (`/tmp/...`), which is
   ephemeral. The zip is the durable copy. (See §3.)

---

## 2. Repo / file structure

The deployable site lives in the build/working directory (this session used `/tmp/v298-work/`).
Its contents are what you upload to the site root:

```
/                         (site root)
├── index.html            Qualiacology homepage (NOT the game)
├── index_script.js       COPY #1 of the game JS (byte-identical to no-moon/game_inline.js)
├── book.html, no-moon.html, clear.html
├── _headers, _redirects  (Netlify config)
├── no-moon-sw.js         (service worker)
├── assets/               (images, audio, OG cards, character art, title video)
├── no-moon/
│   ├── index.html        ← THE GAME. JS is an inline <script> starting at line 1046 (COPY #3)
│   ├── game_inline.js     ← COPY #2 / the canonical source you edit
│   └── no-moon-sw.js
├── doopliss/, psychopharmacology/, this-helped-someone/   (other site sections)
└── README_UPLOAD_THIS.txt (stale; describes an old version)
```

**The git repo** (`/home/user/Default`) tracks: the built `qualiacology-no-moon-vNNN-*.zip`
artifacts, their `.sha256.txt` sidecars, `CLAUDE_SESSION_NOTES.md` (running log), and various
`.md` docs. It does **not** track the unzipped loose source as the source of truth (the
`ADG-5-1/` dir is a stale v200-era snapshot — ignore it). The **zip is the durable build**.

---

## 3. The three-copy invariant (CRITICAL)

The game's JavaScript exists in **three byte-identical-in-logic copies**:

| # | File | Form |
|---|------|------|
| 1 | `index_script.js` (site root) | full file, byte-identical to copy #2 |
| 2 | `no-moon/game_inline.js` | full file — **edit this one** |
| 3 | `no-moon/index.html` inline `<script>` (starts ~line 1046) | copy #2 content with trailing `\n` stripped, wrapped in `<script>\n…\n</script>` |

**The deployed game runs copy #3** (the inline script). Copies #1 and #2 are reference/standalone.
`no-moon/index.html` loads **no external JS** — it's all inline.

**Sync recipe** (after editing `game_inline.js`):

```python
import re
gi = open('no-moon/game_inline.js', encoding='utf-8').read()
# Copy #1: byte-identical
open('index_script.js', 'w', encoding='utf-8').write(gi)
# Copy #3: inline <script> body = gi with trailing newline stripped
html = open('no-moon/index.html', encoding='utf-8').read()
new = re.sub(r'(<script>\n).*?(\n</script>)', lambda m: m.group(1) + gi.rstrip('\n') + m.group(2),
             html, count=1, flags=re.S)
open('no-moon/index.html', 'w', encoding='utf-8').write(new)
```

**Verify sync:**
```bash
cmp -s index_script.js no-moon/game_inline.js && echo "copy1 OK"
python3 -c "import re;h=open('no-moon/index.html').read();m=re.search(r'<script>\n(.*?)\n</script>',h,re.S);print('copy3 OK' if m.group(1)==open('no-moon/game_inline.js').read().rstrip(chr(10)) else 'DIFFER')"
node --check no-moon/game_inline.js   # syntax gate
```

**Safer than full-file rewrites:** for small edits, do the *same* anchored string replacement in
all three files (the old/new strings exist verbatim in each). That avoids any whitespace drift.

---

## 4. The stacked-patch architecture

```
(function(){                     // ← the base game IIFE (~lines 1–18,700)
   const TAU = ...; const TOTAL_BIOMES = 10; ...
   function updateGame(dt){...}  // base definitions
   function damagePlayer(...){...}
   function showOverlay(mode){...}
   ...
   renderCharacterCards(); showOverlay('title');   // boot

   // then ~144 of these, in version order:
   (function installV26FeltDebtFoundation(){
       const base = damagePlayer;
       damagePlayer = function(...){ /* extra */ return base.apply(this, arguments); };
   })();
   ...
   (function installV307FinishedRelease(){ ... })();   // last writer

   renderCodexStats();
})();
```

Key facts:
- **Wrapping:** a patch captures the current value of a closure variable (e.g.
  `const base = showOverlay`) and reassigns it. Because they're closure variables, all later
  callers see the newest version. **Install order = wrap order; later = outer.** For a call like
  `showOverlay('win')`, the outermost (latest) wrapper runs first, calls inward, and may run
  post-logic after the inner returns.
- **Guards:** each block early-returns if already installed (`if (state.__vNNN...Installed) return;`)
  and tags itself (`xyz.__vNNNFlag = true`).
- **`state`** is the central mutable object, exposed as `window.state` (many `try { window.state =
  state } catch {}` lines), which is why Playwright can read/poke it. **`audioState`, `input`, and
  most functions are closure-locked** (not on `window`) — you cannot call them from `page.evaluate`,
  only observe their effects through `state` and the DOM.
- **Build tag:** `state.buildTag` is the version string. Several blocks set it; v304+ makes it an
  accessor that always returns the newest version (see §6/v304).

### Scale & landmarks (line numbers in `game_inline.js`, will drift as you edit)

| Thing | ~Line |
|---|---|
| `TOTAL_BIOMES = 10` | 35 |
| `MID_BOSS_LEVEL = 4` (Warden floor), `FINAL_BOSS_LEVEL = 9` (Archon floor) | 840–841 |
| `showOverlay` (base) | 2657 |
| `startGame` (base) | 4399 |
| `damageEnemy` / `killEnemy` / `damagePlayer` (base) | 4901 / 4920 / 4951 |
| `updateBullets` (base, **not wrapped** — single source of truth) | 5287 |
| `enterExit` (base) | 5259 |
| `generateLevel` (base) | 8527 |
| Moon Shrine: `enterMoonShrine`, shrine update/handoff | 15967, ~16240–16460 |
| `installV30MoonkeyTrials` (moonkeys) | 21854 |
| `installV39MoonPathSunRoute` (the sun route) | 26425 |
| `enterMoonPathFloor39` (sun-route entry) | 26983 |
| `installV43SunkeyDifficultyClarityPass` (sunkeys) | 28703 |
| `installV59...SkyBranch` (Drowned Sky alt path) | 36418 |
| `installV71StarlessDoor...` (Warden→Drowned door) | 41140 |
| `installV234SunBattleQA` (the QA system) | 55026 |
| `installV250FinalWinTitleGate` (`finalWinEvidence`, per-frame enforce) | 59618 |
| `installV251FinalMoonReveal` (the moon zoom-out reveal) | 59923 |
| `installV257HollyShitFeatures` (auto-reveal trigger) | 62539 |
| `installV260...QaContract` (`maybeAutoStartReveal`, 220ms timer) | 64189 |
| `installV274EndingReentry...` | 68260 |
| `installV275FreshRunRevealHardGuard` (`neutralizeShrine275`) | 68664 |
| `installV307FinishedRelease` (last block; QA strip + tag) | 71500 |

---

## 5. The game flow (routes & endings) — read this carefully

This is where every bug this session lived. There are **multiple routes** to multiple endings.

### Floors / bosses
- 10 biomes (floors), indices 0–9. `MID_BOSS_LEVEL = 4` (5th floor) hosts the **Warden**.
  `FINAL_BOSS_LEVEL = 9` (10th floor) hosts **Null Archon**.
- **Null Archon is NOT the final ending boss.** Beating it is a gateway, not the end.

### The Moon Shrine (post-Archon)
- After clearing the Archon's exit room, `enterExit` (wrapped by the v16/v19-era shrine system)
  calls **`enterMoonShrine()`** → a dark room with a 32-HP **moon**. You shoot it.
- Moon cracks → spawns **Boon Moots** ("the moon is yours") → you collect it → `'victory'` →
  ascension (~5.6 s) → `shrine.stage = 'done'` → after a 1.4 s hold, the **handoff** fires
  (shrine update, ~line 16418).

### The handoff = the fork
At `shrine.stage === 'done'`, the game decides between two outcomes based on **keys**:

- **Have keys (3 moonkeys + 1 sunkey)** → route to the **Sun path** (the "sunny biome", floors
  10–12 via `v39StartMoonPath()` → `enterMoonPathFloor39`). Beat the Sun there → the real ending.
- **No keys** → the **Moon ending** (the v251 "zoom-out" reveal, ~18 s cutscene) → restart.
  **This no-keys ending is intentional.**

### Keys
- **Moonkeys** (need 3): drop from **False Moon** mini-bosses. System: `installV30MoonkeyTrials`
  (line 21854). `ensureMoonkeyPlan` seeds ~4 False-Moon "trial" rooms across floors 2–8, so a run
  reliably yields 3. Count read/written via `state.moonkeys` (+ `player.moonkeys`, `stats.moonkeys`);
  `setMoonkeyCount` (21966), `moonkeyCount` (21960). At 3, sets `state.moonkeyEndingUnlocked`.
- **Sunkey** (need 1): drops from **Spiggot** mini-bosses (fast pink chasers, floors 4–8). System:
  `installV43...` (line 28703). `setSunkeyCount43` (28797) / `sunkeyCount43` (28806) over
  `state.sunkeys` (+ player/stats/runStats). The route gate is **`routeReady43()` (28814):
  `moonkeyCount43() >= 3 && sunkeyCount43() >= 1`**.
- There's also `installV43SpiggotGuaranteeSupplement` (29768) that force-plants a Spiggot on
  floors 4–8 until you have a sunkey.

### The Drowned Sky alt path (separate, after the FIRST boss)
- After clearing the **Warden** (floor 5), a **physical "Starless" door** opens in that room
  ("Something opens behind the bellway"). System: `installV71StarlessDoor...` (41140),
  `installStarlessApproachFromWarden71`. It leads through 3 starless rooms → a dock → a "commit"
  door → the **Drowned Sky** route (First Walker / Drowned Sun ending). This **replaced** an older
  popup (`#v59SkyBranchChoice`, which is force-hidden by later CSS). It is a *separate* feature from
  the moon/sun route and works fine. Debug: `state.v71ForceWardenApproach()`.

### The ending-detection systems (the dangerous part)
Multiple independent systems poll "is the game won?" every frame and react:
- **v250** `installV250FinalWinTitleGate` (59618): `finalWinEvidence()` (59668) +
  `repairFinalWinOverlay()` + a **per-frame `enforce()` wrapped onto `updateGame`**. If it thinks
  the game is won but the overlay drifted to a title surface, it forces `mode='win'`,
  `_v250FinalWinLocked=true`.
- **v251** `installV251FinalMoonReveal` (59923): owns the moon zoom-out. `armRevealPrompt()` sets a
  **cascade**: `reveal.armed`, `_v251RevealPromptArmed`, `mode='win'`, `overlayMode='win'`,
  `_v250FinalWinLocked`. `beginReveal()` (60091) starts the ~18 s reveal. A per-frame update tick
  calls `armRevealPrompt` when `finalWinState()` is true.
- **v257** (62539) and **v260** (64189): **auto-triggers** that call `beginReveal` directly when
  reveal is armed + win-like — v260 after **220 ms**, v257 after 4 s. v260's `maybeAutoStartReveal`
  is called every frame from `updateGame`.
- **v274** (68260): ending re-entry / "back to title after reveal".
- **v275** (68664): `neutralizeShrine275()` resets an inactive shrine's `stage` from
  done/ascend/victory back to `'fight'` — **but only on a `title`-surface frame**. This is the
  cleanup that *races* the bug below.

### The bug that ate this whole session (now fixed)
With keys, the OLD shrine handoff still did `state.mode='win'; showOverlay('win')` and let v39
intercept *inside* `showOverlay`. That brief `mode='win'` flash woke the systems above:
`armRevealPrompt` armed the reveal cascade, v39 then routed you to the sun biome, but the armed
flags **persisted**, and v260's 220 ms timer fired the moon zoom-out on top of the live sun biome
— "showed the next biome for a second, then the zoom-out, then restart." `neutralizeShrine275`
was supposed to clean the shrine flag but only runs on `title` frames, so it loses the race on
some devices.

**The fix (v305/v306, see §6):** at the handoff, if v39 *will* intercept (keys present, route
enabled), call `state.v39StartMoonPath()` **directly and skip the `mode='win'`/`showOverlay('win')`
flash entirely**. No ending system ever sees a win signal → no cascade → no 220 ms reveal. Plus
defense-in-depth flag-clears at route-start (v303/v304) and win-evidence guards (v302).

---

## 6. This session's fixes (v299 → v307) — what changed and why

All are stacked on top of the shipped **v298** baseline. Markers in parentheses are greppable.

| Ver | Area | What | Marker |
|---|---|---|---|
| v299 | UI | `#draftUI.hidden .draftPanel { pointer-events: none }` — a hidden draft panel left an invisible click-eating band at screen bottom (could block the restart button on landscape). CSS-only, in `no-moon/index.html`. | `#draftUI.hidden .draftPanel` |
| v301 | Keys | Removed the once-per-run `_v43SunkeyDroppedThisRun` lockout in `spawnSunkey43` (28xxx). It silently blocked every Spiggot after the first from dropping a sunkey; one missed pickup doomed the run. Restored visible pickup + a silent count-grant on Spiggot death as a safety net. | `once-per-run lockout` |
| v302 | Ending | Guarded `finalWinEvidence()` (59668) and `anyFinalWinEvidence()` so a finished shrine (`stage==='done'`) is **not** treated as final-win evidence while `_v39MoonPathActive` (sun route live). | `moonRouteLive`, `stale residue of the route HANDOFF` |
| v303 | Ending | At `enterMoonPathFloor39` route-start, synchronously reset the shrine (`stage='fight'`, etc.) so the residue can't linger past v275's title-frame race. | `Clear the finished-shrine residue SYNCHRONOUSLY` |
| v304 | Ending + Tooling | Also clear the **reveal-arming cascade** at route-start (`_v251RevealPromptArmed`, `_v250FinalWinLocked`, `_v260EndingAutoArmedAt/Started`, `_v257AutoArmedAt`, `__v252WinSeen`, `reveal.armed/active`). **Made `state.buildTag` an accessor** (`Object.defineProperty`) so the latest version always wins the read, + MutationObserver on `#buildTagDisplay`. | `v304: clear EVERY reveal/auto-trigger flag` |
| **v305** | **Ending (ROOT)** | **The real fix.** Shrine handoff bypasses the `mode='win'`/`showOverlay('win')` flash entirely when v39 will intercept — calls `v39StartMoonPath()` directly. Plus a gated `?testmoon=1` test shortcut. | `ROOT-CAUSE FIX`, `?testmoon=1` |
| v306 | Cleanup | v305 minus the test shortcut. | `installV306...` |
| **v307** | **Release** | **Current.** Strips the visible **QA button** (`#nmQASunBattleBtn`) and ~40 dev/cheat `window.noMoon*` hooks (QA-mode entries, spawn/force/unlock/grant cheats). Keeps read-only `*Debug`/`*SelfTest`, recovery hooks, and player-facing toggles. | `installV307FinishedRelease` |

**Verified at v307:** shrine handoff with keys → sun biome and holds; QA button + cheats gone;
`?testmoon=1` inert; Debug/recovery hooks present; regression 11/13 (tests 9 & 11 are
informational, not pass/fail). `state.buildTag === 'qual.v307-clean-shrine-root-fix.2026-06-01.v307'`.

---

## 7. Combat core (audited clean this session)

- **`updateBullets` (5287) is the single source of truth** — it is **not** wrapped. It sub-steps by
  speed (`steps = ceil(speed·dt/18)`) = continuous collision detection (no tunneling).
- **Player→enemy:** hit test `hypot(e.x-b.x,e.y-b.y) < e.r+b.r` → `damageEnemy` (full bullet
  damage) → `killEnemy` (kills++/remove). Pierce/bounce handled inline.
- **Enemy→player:** `damagePlayer` (live version is the v-polish reimpl at ~10773, not the base at
  4951). i-frames: `hitInvuln` 0.36 s absorbed / 0.52 s hit. Shield absorbs first.
- **The v64 "boss first-breath" cap** (`damageEnemyV64`, ~39487): for `isBossLike64()` enemies
  (regex matches `…|sun|moon|…|boss`, so `moonBear` is boss-like), per-hit damage is capped at
  `maxHp*0.028` for a 1.75 s intro window. **Normal enemies skip this entirely.** This is the
  cause of "my 50-damage bullet only did 28" — it's intended anti-burst, not a bug.
- Perf: bullet update ≈ 0.01 ms/bullet; not a mobile concern. Old mobile lag was **Moon Debt**
  (removed v285–v297), not combat.

---

## 8. Audio (audited clean)

- **BGM and SFX are separate gain chains** — BGM: osc→BGM limiter→`ctx.destination`; SFX:
  osc→`audioState.master`→destination. Muting SFX can't kill BGM.
- `startProceduralBgm` calls `stopProceduralBgm` first (no double-start leak).
- Mute persists to `localStorage` key `noMoonSfxMute_v1`.
- `audioState` is **closure-locked** (not on `window`) — test via DOM toggle labels + localStorage.

---

## 9. Debug / recovery hooks (kept in v307)

On `window` (open browser console):
- **Verify build:** `noMoonCurrentBuild()` → version string; `noMoonV307Debug()`.
- **Inspect (read-only):** `noMoonV<N>Debug()` / `noMoonV<N>SelfTest()` for most N. Useful ones:
  `noMoonV43Debug()` (keys/route state: `moonkeys`, `sunkeys`, `routeReady`, `moonPathActive`),
  `noMoonV251Debug()` (reveal state), `noMoonV39Debug` via v43's `.v39`.
- **Recovery (get unstuck):** `noMoonHardRestart()`, `noMoonV85RepairBossRoom()`,
  `noMoonV84RestoreBossBellway()`, `noMoonV90RepairCodex()`, `noMoonV261ReturnToTitle()`,
  `noMoonV259CleanupServiceWorkers()`.
- **Player-facing:** `noMoonOpenFieldGuide()`, `noMoonSetLowFx()`.

**Stripped in v307** (do not expect these in production): `noMoonQAToSunBattle`, `noMoonSpawnBear`,
`noMoonUnlockCharacters`, `noMoonV*ForceKillBoss`, `noMoonV270ForceWalkerTrophy`,
`noMoonV76GrantStars`, the `#nmQASunBattleBtn` button, etc. (If you need them for dev, work from a
pre-v307 build or temporarily re-add.) Note: `clear.html` still resets save + cache for QA.

---

## 10. Testing (how to verify anything)

There is **no CI**. Use **Playwright headless Chromium**, already installed in the dev container.

```bash
# Serve the build:
cd /tmp/v298-work && python3 -m http.server 8888   # game at http://localhost:8888/no-moon/

# Run a test (Playwright is global):
NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
  node /tmp/<test>.js
```

- **`state` is reachable** in `page.evaluate(() => state.xxx)` (it's on `window`). This is how every
  test pokes/reads the game. Closure-locked things (functions, `input`, `audioState`) are not.
- **Spawn a real enemy** to drive combat: `window.noMoonSpawnBear(x,y)` (pre-v307 builds only).
- **Reach the moon fast:** pre-v307 had `?testmoon=1`. In v307 it's gone — to test the route
  end-to-end you either (a) play a real run, or (b) in `page.evaluate` set
  `state.moonkeys=3; state.sunkeys=1; state.moonkeyEndingUnlocked=true`, then
  `state.shrine.active=true; state.shrine.stage='done'; state.shrine.timer=2`, and let a few frames
  pass — the handoff fires and should route to floor 10 with `_v39MoonPathActive=true`.
- **Useful harnesses left in `/tmp`** (this session): `v296-regression.js` (13-check regression),
  `repro-stomp.js` (the ending-stomp reproduction), `v307-tests.js`, `realflow-test.js`,
  `clickeater-sweep.js`. They show the patterns: start a run via `#startBtn` → `.card[data-char]` →
  `#startBtn`, then poke `state`.
- **Caveat learned the hard way:** headless timing differs from real devices. The ending-stomp
  reproduced only with *forced* state, never in a natural headless run, because headless won the
  `neutralizeShrine275` race that real devices lose. **A passing headless test is necessary but not
  sufficient** for ending/route changes — confirm on a real device when you can.

---

## 11. Build / ship recipe

```bash
# 1. Edit no-moon/game_inline.js
# 2. node --check no-moon/game_inline.js
# 3. Sync the three copies (§3) and verify cmp/inline identical
# 4. Run regression + targeted tests (§10)
# 5. Bump the trailing version block if you want the buildTag to reflect it (§Golden Rule 2)
# 6. Build the zip from the site root:
cd /tmp/v298-work && zip -r -q -X /home/user/Default/qualiacology-no-moon-vNNN-<desc>.zip . -x '*.DS_Store'
# 7. SHA + commit + push:
cd /home/user/Default
sha256sum qualiacology-no-moon-vNNN-<desc>.zip > qualiacology-no-moon-vNNN-<desc>.sha256.txt   # (format: "<sha>  <file>")
git add <zip> <sha> CLAUDE_SESSION_NOTES.md
git commit -m "..."   # branch: claude/intelligent-cerf-EoTWl
git push -u origin claude/intelligent-cerf-EoTWl
```
Deploy = upload the **contents** of the build dir to the site root (Netlify-style). The user then
verifies live with `noMoonCurrentBuild()`.

---

## 12. Fragile areas & known gotchas

- **The ending/route system (§5).** Anything touching `mode='win'`, `showOverlay('win')`, the
  shrine handoff, `finalWinEvidence`, the reveal, or `enterMoonPathFloor39` can resurrect the
  stomp. The safe principle: **never flash `mode='win'` when you intend to route to the sun.**
- **`v297` has a `setInterval(forceNoDebt297, 350ms)`** that re-asserts `state.buildTag` and zeroes
  Moon-Debt state forever. That's why naive one-shot tag writes get overwritten (see v304's
  accessor approach). It's also why Moon Debt is *aggressively* dead — don't try to revive debt
  features without dealing with v297.
- **Moon Debt is removed (v285–v297) on purpose** — it caused 3.5× mobile frame time. Don't
  reintroduce per-frame debt visual systems.
- **`isBossLike64` regex** treats anything with `sun`/`moon` in its typeId as a boss (so `moonBear`
  gets the intro damage cap but `crescentBear`/`lunarCub` don't). Minor inconsistency; left as-is
  because the regex also protects the real Sun/Moon bosses.
- **Two `TAU`/`const` redefinitions** exist in later IIFEs (e.g. line 53513) — they're scoped to
  their own blocks, harmless, but don't assume a `const` at the top is the only one.
- **`ADG-5-1/` in the repo is a stale v200 snapshot.** Not the source of truth.
- **Line numbers in this doc drift** as you edit. Re-grep the markers.

---

## 13. Open / not-done (honest list)

- **The v307 ending fix is verified in headless + on the user's device via the (now-removed)
  `?testmoon=1` shortcut**, where the sun biome loaded and held. A full natural run (collect 3
  moonkeys + a sunkey, beat Archon, kill the moon) is the final confidence check and had not been
  fully reconfirmed on-device at v307 (the architectural change is in the same code path, so it
  should hold).
- **Sun-route content past the handoff** (the sunny biome floors, the Sun boss fight, the true
  ending after it) was exercised mostly via QA jumps historically, not by me end-to-end. If
  something's wrong *inside* the sun route, that's unexplored territory.
- **Minor:** the `moonBear` vs `crescentBear`/`lunarCub` intro-cap asymmetry (§12).
- **No automated test runner / CI.** Everything is manual Playwright. Worth building a single
  `run-all-tests.sh` if this continues.
- `README_UPLOAD_THIS.txt` and `ADG-5-1/` are stale and could confuse a future maintainer.

---

## 14. The one-paragraph mental model

No Moon is a base canvas game wrapped 144 times. You edit `no-moon/game_inline.js`, sync it into
two other copies, test by driving the real game in headless Chromium (poking `window.state`), and
ship a zip. The ending is a tangle of independent "is it won yet?" systems that all watch
`mode==='win'`; the keys (3 moonkeys from False Moons + 1 sunkey from Spiggot) decide whether the
post-Archon moon shrine routes you to the sun biome or plays the moon ending; the long-standing bug
was the shrine *flashing* `mode='win'` on its way to the sun route and waking those systems, now
fixed by bypassing the flash entirely. Trust the running game over this file, and over any AI.
