# No Moon — Handoff Guide for the Next AI/Developer

You've inherited a single-file HTML5 roguelite (`no-moon/game_inline.js`,
~57k lines, ~3-4 MB) that has been getting patched in additive IIFE
layers since v100. This document is the orientation manual — read it
end-to-end before touching anything. Aim: ~15 minutes to understand
the architecture, traps, and build pipeline.

---

## TL;DR (read this if nothing else)

1. **The whole game lives inside one IIFE** that starts at the top of
   `game_inline.js` with `(() => { 'use strict'; ...` and ends near
   the bottom with `})();`. Almost every internal function is
   **closure-scoped** and cannot be wrapped from outside. Externally
   reachable things: a handful of globals (see "What's reachable"
   below) and any property on the `state` object.

2. **Patches are additive IIFEs appended at the END of the file**,
   right before the closing `renderCodexStats(); })();` marker. Each
   patch wraps the things it needs and sets `__v<N>Installed = true`
   to be idempotent. Newer patches go AFTER older ones.

3. **`game_inline.js` is mirrored verbatim inside `index.html`** in
   a `<script>` tag. Every edit MUST be made to BOTH files or the
   deployed site will run the version inside `index.html`, not the
   external file. Always verify with a regex extract that the two
   are identical.

4. **Service worker cache name MUST be bumped** in
   `no-moon/no-moon-sw.js` (`CACHE_NAME`) on every release or phones
   serve stale assets.

5. **The user uploads zips and downloads zips.** They have Netlify
   upload limits, so don't burn extra deploys. Build everything in
   one zip per fix.

---

## Project layout

```
/home/user/Default/
├── no-moon-rebuilt/                  # base rebuilt v99 + IIFE history
│   └── no-moon/
│       ├── game_inline.js            # all game code (closure-IIFE)
│       ├── index.html                # embeds <script>game_inline.js</script>
│       └── no-moon-sw.js             # service worker, bump CACHE_NAME each release
├── no-moon-rebuilt-v243.zip          # historical user-uploaded baselines
├── no-moon-rebuilt-v246.zip
├── no-moon-rebuilt-v247.zip
└── NO_MOON_AI_HANDOFF.md             # this file

/tmp/                                  # ephemeral build workspace
├── v244_gpt/                         # ChatGPT's v244 baseline (unzipped)
├── v246_build/                       # latest in-flight build dir
├── v247_build/
└── v247_iife.js                      # the IIFE text appended this round
```

The user works with **zips**, not git pushes. The git branch
(`claude/fix-game-bugs-QUqFK`) stores zips as binary artifacts plus
commit messages describing each version. The "real" baseline at any
moment is whatever the user last uploaded.

---

## Architecture: how the game is structured

`game_inline.js` is ONE big IIFE:

```js
(() => {
  'use strict';
  const canvas = document.getElementById('game');
  // ... ~50,000 lines of engine ...
  renderCodexStats();
})();
```

Inside that IIFE, the engine declares thousands of `function foo() {...}`
declarations and `const X = ...` constants. These are LEXICALLY SCOPED
to the outer arrow function. **You cannot reach them by name from
outside the script.**

What IS reachable from a new IIFE appended INSIDE the same outer scope:

- Most engine functions that don't start with `__` (because they're
  declared at the top of the file's IIFE scope, your IIFE sees them).
- `state` — a globally-shared object that holds runtime state and
  exposed functions/helpers.
- A few engine globals: `damageObstacle`, `damagePlayer`, `killEnemy`,
  `playToneBurst`, `playNoiseBurst`, `spawnRing`, `spawnSpark`,
  `shake`, `addRoomScar`, `drawRoomScars`, `updateGame`, `currentRoom`,
  etc. (Find them with `grep -n 'function NAME\b'`.)

What is NOT reachable:

- Anything declared inside a sub-IIFE that already returned. For
  example, v77 has `(function installV77...){ ... })()` and its
  internal helpers are gone after install. Only the things v77
  attached to `state.*` are reachable.
- Local `let`/`const` inside helper functions.
- Closure variables of the rebuilt-layer's `SunRoute` object etc.
  (Find them by their `state.X` exports if any.)

The mental model: it's like Python's `globals()` — only what's
declared at the module-IIFE's top scope, or attached to `state`, is
accessible to your patch.

---

## The patch layering pattern

Every patch since v100 follows the same template:

```js
  // ──────────────────────────────────────────────────────────────
  // No Moon vN — short description
  //
  // Long-form explanation of root cause and fix. Reference engine
  // lines you investigated. Future you needs this.
  // ──────────────────────────────────────────────────────────────
  (function installVN(){
    const VN_VERSION = 'qual.v<N>-short-name.YYYY-MM-DD.v<N>';
    const VN_CACHE   = 'no-moon-v<N>-short-name-v<N>';

    if (typeof state === 'undefined' || !state) return;
    if (state.__vNInstalled) return;          // idempotent
    state.__vNInstalled = true;

    const sys = state.vN = {
      installed: true, version: VN_VERSION, cacheExpected: VN_CACHE,
      stats: { tags: 0, /* per-feature counters */, lastError: null }
    };

    function record(where, e){ try { sys.stats.lastError = where + ': ' + ...; } catch (_) {} }
    function n(v, fb){ const x = Number(v); return Number.isFinite(x) ? x : (fb || 0); }
    function roomNow(){ try { return currentRoom(); } catch (_) { return null; } }

    // ----- the actual fix(es) -----
    if (typeof TARGET === 'function' && !TARGET.__vN) {
      const base = TARGET;
      TARGET = function vN_TARGET(args){
        try {
          // pre-call
          return base.apply(this, arguments);
        } catch (e) { record('TARGET', e); }
        // wraps to preserve upstream flags so older selftests stay green:
      };
      TARGET.__vN = true;
      try { if (base.__vN_minus_1) TARGET.__vN_minus_1 = true; } catch (_) {}
      try { if (base.__v244SomeFlag) TARGET.__v244SomeFlag = true; } catch (_) {}
    }

    function tagBuild(){
      try {
        state.buildTag = VN_VERSION;
        state.cacheExpected = VN_CACHE;
        sys.stats.tags += 1;
        const el = document.getElementById('buildTagDisplay');
        if (el) el.textContent = 'build: ' + VN_VERSION;
      } catch (_) {}
    }

    // updateGame wrap is the standard hook for per-tick logic.
    if (typeof updateGame === 'function' && !updateGame.__vN) {
      const baseUg = updateGame;
      updateGame = function vN_UpdateGame(dt){
        tagBuild();
        const out = baseUg.apply(this, arguments);
        try { /* your per-tick code */ } catch (e) { record('post', e); }
        tagBuild();
        return out;
      };
      updateGame.__vN = true;
      // Preserve ALL prior flags so noMoonV<...>SelfTest() functions remain
      // truthful about which layers are installed.
      try { if (baseUg.__v246) updateGame.__v246 = true; } catch (_) {}
      try { if (baseUg.__v244) updateGame.__v244 = true; } catch (_) {}
      // ... etc, copy every prior flag you can see.
    }

    tagBuild();
    setTimeout(tagBuild, 0);
    setTimeout(tagBuild, 500);

    state.vNDebug = function(){ /* return rich debug object */ };
    state.vNSelfTest = function(){
      tagBuild();
      const d = state.vNDebug();
      const ok = d.buildTag === VN_VERSION && d.cacheExpected === VN_CACHE && /* wrap flags */;
      return Object.assign({}, d, { ok });
    };
    try {
      window.__NO_MOON_VN__ = sys;
      window.noMoonVNDebug = function(){ return state.vNDebug(); };
      window.noMoonVNSelfTest = function(){ return state.vNSelfTest(); };
      window.noMoonCurrentDebug = window.noMoonVNDebug;
      window.noMoonCurrentSelfTest = window.noMoonVNSelfTest;
    } catch (_) {}
  })();
```

Key rules:

- **Idempotent**: `if (state.__vNInstalled) return;` at the top.
- **Per-target idempotent**: every wrap checks `if (target.__vN)`
  before installing.
- **Flag preservation**: when you re-wrap something already wrapped
  by earlier layers, copy ALL the upstream `__v*` flags onto the new
  wrapper. Otherwise older `noMoonV<n>SelfTest()` calls return ok:false
  even though the LOGIC is still there.
- **Build tagging**: set `state.buildTag` and update the
  `buildTagDisplay` DOM element so the user can SEE which version is
  running.
- **Debug + Selftest**: every patch exposes
  `state.vNDebug()` and `state.vNSelfTest()` and corresponding
  `window.noMoonVNDebug()` / `window.noMoonVNSelfTest()` aliases.
  Also alias to `noMoonCurrentDebug` / `noMoonCurrentSelfTest` so the
  user can just paste those.

---

## When wrapping isn't enough: engine edits

Some bugs require modifying closure-scoped engine functions. Pattern
established by ChatGPT v244 and used in v246/v247:

1. Identify the line in `game_inline.js` to edit.
2. Insert a small guard right at the top of the function body. Read
   from a `state.__v<N>FlagName` so the edit is dormant until the
   IIFE turns it on.
3. **Mirror the same edit in `index.html`'s inline `<script>` block.**
4. Set the flag inside your IIFE at install time.

Example (`updateLightBurn39` at game_inline.js:26982):

```js
function updateLightBurn39(dt) {
  if (state.__v246SunBrightnessIgnoring) return;   // ← inserted by v246
  if (!sys.config.SUN_LIGHT_HAZARD || state.mode !== 'play') return;
  // ...original body unchanged...
}
```

And in the IIFE:
```js
state.__v246SunBrightnessIgnoring = true;
```

Use stable flag names that don't tie to a version (e.g.
`__v246SunBrightnessIgnoring` survives v247+ since the contract is
"this flag means the sun system is in brightness-ignoring mode"). Once
inserted, future patches just toggle the flag.

---

## Build pipeline (the actual steps)

When you ship a new version N:

```bash
# 1. Pick the baseline (usually whatever the user last uploaded)
BASE=/tmp/v247_gpt          # or /tmp/v243_user, etc.

# 2. Copy base to a new build dir
rm -rf /tmp/vN_build && cp -r $BASE /tmp/vN_build

# 3. (Optional) apply engine edits in-place via python or sed
#    Make sure to update BOTH game_inline.js AND index.html with the
#    same edits.

# 4. Append your new IIFE before the trailing marker
#    The marker is: '\n  renderCodexStats();\n\n})();\n'
#    In game_inline.js: read file, split on marker, insert IIFE, rejoin.
#    In index.html: same logic but the IIFE goes inside the <script> body.

# 5. Verify both files are identical (script body in HTML matches gi)
python3 -c "
import re
ih = open('/tmp/vN_build/no-moon/index.html').read()
gi = open('/tmp/vN_build/no-moon/game_inline.js').read()
body = re.search(r'<script>([\s\S]*?)</script>\s*</body>', ih).group(1)
print('IDENTICAL' if body == gi else 'DIFFERS')
"

# 6. Bump SW cache name
sed -i "s|no-moon-v(N-1)-.*|no-moon-vN-...-vN|g" /tmp/vN_build/no-moon/no-moon-sw.js

# 7. Add a build note
cat > /tmp/vN_build/NO_MOON_VN_<DESC>.md <<EOF
# No Moon vN — <short desc>
Build tag: ...
SW cache:  ...
What changed: ...
Verification: ...
EOF

# 8. Run a headless verify in node (see "Verification" section)

# 9. Zip
cd /tmp/vN_build && zip -rq /home/user/Default/no-moon-rebuilt-vN.zip .

# 10. Use SendUserFile to deliver, with a caption summarizing changes
# 11. git add + commit + push to claude/fix-game-bugs-QUqFK with a
#     long commit message describing root cause and fix
```

---

## Verification (headless node test)

You can load the built `index.html` in a node harness with mocked DOM
and run the selftest before shipping. Template:

```js
node -e "
const fs = require('fs');
// Stub window/document/canvas/localStorage/AudioContext/etc minimally.
// (See any prior build's verify command — copy from there.)
const html = fs.readFileSync('/tmp/vN_build/no-moon/index.html', 'utf-8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];
(new Function(src)).call({});
console.log(global.window.noMoonVNSelfTest());
console.log(global.window.noMoonV<earlier>SelfTest());  // verify upstream
"
```

A passing selftest:
- `ok: true`
- `buildTag` matches the constant
- every wrap flag (`updateGameWrapped`, `damageObstacleWrapped`, etc.)
  is true
- earlier selftests (v244, v243, etc.) ALSO return `ok: true`,
  proving the wrap-chain flag preservation worked.

---

## What's reachable from a new IIFE (cheat sheet)

These are the verified handles you can wrap or read:

### Top-level functions (wrappable)
| Symbol | File:Line | Notes |
|---|---|---|
| `updateGame(dt)` | many wraps applied | Main per-tick. Standard place to add per-frame logic. |
| `damageObstacle(o, n)` | :4447 | Wrapping it lets you intercept obstacle breaks. |
| `damagePlayer(amount, source)` | engine | Wraps applied by v244 for attribution. |
| `killEnemy(enemy, bullet)` | :4815 | Wrap to filter death FX (e.g. v243 ambush quiet). |
| `playToneBurst(opts)` | :1813 | Wrap to drop audio cues by signature. |
| `playNoiseBurst(opts)` | :1839 | Same. |
| `spawnRing(x, y, color, r)` | :4381 | |
| `spawnSpark(x, y, color, count, speed)` | :4350 | |
| `shake(intensity)` | engine | Camera shake. |
| `addRoomHazard(room, hazard)` | :9706 | Closure-scoped — NOT wrappable from outside. |
| `addPulseHazard(room, x, y, opts)` | :9716 | Same — wrap if needed via base engine edit. |
| `currentRoom()` | engine | Returns the active room object. |
| `renderWorld()`, `render()` | :7605, :7653 | Camera/world draw functions; wrap for HUD overlays. |
| `drawRoomScars` | :14630 | CLOSURE-SCOPED. Not wrappable. To disable, edit engine. |
| `updateLightBurn39` | :26974 | CLOSURE-SCOPED. Patched via engine edit + state flag. |

### State properties (read/write)
| Property | Notes |
|---|---|
| `state.player` | `{x,y,r,hp,maxHp,vx,vy,hitInvuln,...}` |
| `state.level` | `{rooms[], currentRoom, currentRoomId, ...}` |
| `state.enemies` | array of live enemies |
| `state.bullets` | array of live bullets |
| `state.mode` | `'play'`, `'title'`, `'win'`, `'over'`, `'draft'`, etc. |
| `state.time` | accumulated game time in seconds |
| `state.buildTag` | display tag (set by your IIFE) |
| `state.camera` | `{x,y}` |
| `state.runStats` | per-run counters |
| `state.save` | persisted save data |
| `state._v77SunHeat` | shared sun heat value (multiple writers!) |
| `state._nmSunDamageCd` | shared sun damage lockout (rebuilt's) |
| `state.__v<N>FlagName` | feature flags read by engine-edit guards |

### Helpers attached to `state` (callable)
| Symbol | Purpose |
|---|---|
| `state.v77InstallSunVictoryObjects(room, enemy, prior)` | Drops crater + sigil. Wrap to alter post-boss flow. |
| `state.v77DrawSunHeatMeter()` | HUD piece for sun heat. Wrap to change appearance. |
| `state.v77TagSunDamage(source, x, y, amt)` | Mark a damage hit as sun-sourced. |
| `state.v39FinishSunVictory()` | End-of-run sun-path completion. |
| `state.v82BlackAnchor` | Nadir's Black Anchor system root. |
| `state.v68BoonMootsCareerAudio` | Moots' Boon Moots system root. |

These are STABLE handles — they survive across patch versions.

---

## The "split brain" trap

Multiple engine systems sometimes write to the SAME state property
with DIFFERENT rules, causing wobble. Diagnosed example:

- `state._v77SunHeat` is written by **both** the v39
  `updateLightBurn39` (:26974, brightness-gated) AND
  `SunRoute.tickHeat` (:53499, brightness-ignoring) inside the rebuilt
  layer. Result: heat value oscillates as the two systems fight.

When you touch shared state, **grep for all writers**:

```bash
grep -n "state\._v77SunHeat" no-moon/game_inline.js
```

If multiple closures write to the same property, you have two
options:

1. **Engine edit one or both to early-return** based on a flag your
   IIFE sets. (Pattern from v246/v247.)
2. **Overwrite the value in your IIFE's `updateGame` post-hook** so
   the engines' writes are clobbered each frame.

Approach (1) is cleaner. Approach (2) is uglier but doesn't require
touching the engine.

---

## Mobile vs desktop divergence

The codebase routinely checks `W < 720` (canvas width) as the
mobile threshold. Mobile-specific paths:

- `drawRoomScars` is gated off on mobile (v244 engine edit at :14633).
- Obstacle break FX are muzzled extra-hard on mobile (v243 and v240).
- Heat meter draws bigger rings on mobile (v244 :43604).

**When debugging mobile-only bugs**, ALWAYS check whether code paths
have a `W < 720` branch you might be missing.

---

## QA test mode

The user often jumps directly to the sun boss via
`noMoonQAToSunBattle()` (installed by v234). This sets state flags
that REPRODUCE the conditions of a 2nd-run player, which can make
DIFFERENT code paths fire than a normal first-time playthrough. When
the user reports a bug, ASK whether they used QA mode — it changes:

- `state.save.victories.sunClears > 0` (skip the first-clear gate)
- crater appears OPEN immediately
- character selection may be pre-set

This is why my v246 sun-room detection was too narrow — QA-mode rooms
have `_v39PathFloor` set but not `_v39MoonPathRoom`. ChatGPT's v244
sun-room check was broader, and v247 brought mine in line.

---

## Version history (compact)

Each entry: version, what it tackled, primary mechanism.

- **v99** rebuilt — baseline you'll find inside any zip. The
  layer is a sub-IIFE that exposes `SunRoute`, `NM`, `Hazards`, etc.
- **v230** — rebuilt cleanup
- **v233** — mobile=PC mode (single-renderer)
- **v234** — QA tap zone (the QA button bottom-right). Adds
  `state.noMoonQAToSunBattle()`.
- **v235** — Sun route surgery (sigil, crater)
- **v236** — Root-cause cleanup: obstacle-break wave suppressed via
  spawnRing/spawnSpark wraps; sun phase-1 pulse-deny hazard removed.
- **v239** — sun-route + obstacle crumble + marker cleanup. Layered
  small dot crumble.
- **v240** — mobile-obstacle-safety + drowned-sun pass. Broad
  obstacle break suppression. Drowned Sun visual + attack tuning.
- **v242** — Tidefall off in non-boss Drowned Sky + sigil-null.
- **v243** — Heartbeat HP=1 (via audio wrap), ambush enemy quiet
  death (via killEnemy wrap), mobile sterile obstacles, stale
  active cleanup.
- **v244** (ChatGPT) — Engine-source-modifying. Heartbeat at
  base (`hp <= 1`), boss phase 2/3 nerf, SunRoute.tickHeat muzzled,
  mobile drawRoomScars early-return, damagePlayer source attribution
  wrap, near-player heat ring.
- **v246** (me) — Brightness-ignoring sun on top of v244.
- **v247** (me + ChatGPT) — Sun exposure hardening: heat-ghost
  drain on safe states, broader sun-room detection, no burn blink.
  ChatGPT's v247 included boss-room-specific sun tuning that mine
  missed; user is using ChatGPT's.

When investigating a bug that involves one of these systems, READ
the IIFE for the relevant version FIRST. It tells you what mechanism
is currently active and what state flags it reads/writes.

---

## Known closure-scoped systems (won't be wrappable from outside)

If you need to change behavior in any of these, you'll need an
**engine edit + state flag** pattern (see "Engine edits" above).

- v39 Moon Path / Sun Route (`installV39MoonPathSunRoute` around :26262)
- v77 sun-victory installer machinery
- v79/v80 Drowned Sky / Drowned Sun
- v94 Tidefall beams
- rebuilt-layer's `SunRoute`, `Hazards`, `NM` namespaces
- `installFutureConsequencePass` at :14295 (contains addRoomScar,
  drawRoomScars, futureDamageObstacle)
- v82 Black Anchor
- v68 Boon Moots
- v99 Moots active recharge contract

You CAN wrap things they expose on `state`. You CAN'T wrap their
internal helpers.

---

## Debugging convention

When the user hits an issue, paste these in console:

```js
state.buildTag                  // what version they're actually running
noMoonCurrentSelfTest()         // latest layer's ok-flag
noMoonCurrentDebug()            // latest layer's full debug
noMoonV<earlier>SelfTest()      // verify upstream layers still installed
state.v<N>.stats                // runtime counters from latest layer
state._v77SunHeat               // shared values for split-brain checks
state.__v246SunBrightnessIgnoring  // feature flags read by engine edits
```

Common patterns in `stats`:
- counters (`ambushDeathsQuieted`, `mobileBreakFxMuzzled`, `burns`)
- timestamps (`bornAt`)
- `lastError` (string with the last caught exception inside any
  wrap-helper)

If `lastError` is non-null, that's your starting point.

---

## Things that have broken in the past (learn from them)

1. **Forgetting to mirror the engine edit in `index.html`.** The
   deployed site runs `index.html`'s inline script. Always mirror.

2. **Not bumping SW `CACHE_NAME`.** Phones serve stale assets and the
   user thinks the patch didn't work. Always bump.

3. **Wrap-chain flag amnesia.** New `updateGame` wrapper without
   `try { if (baseUg.__v243) updateGame.__v243 = true; } catch (_) {}`
   makes `noMoonV243SelfTest()` return ok:false even though v243's
   logic still runs. Always preserve.

4. **Touching shared state without checking writers.**
   `state._v77SunHeat` had three writers (v39, SunRoute, my v246).
   Search the file before writing to a shared property.

5. **Closure-scope confusion.** Trying to wrap `addRoomScar` from a
   v244 IIFE — won't work, it's closure-scoped. The fix is an engine
   edit OR clearing the underlying data (`room.scars.length = 0`).

6. **QA mode silent bypasses.** Narrow room-flag checks miss QA
   rooms. When a feature is "sometimes not working", check whether
   the room-flag detection covers all paths a real run AND QA mode
   would set.

7. **Mobile width detection.** Use `W < 720` consistently. Some old
   patches also check `navigator.userAgent` — both are needed when
   the user is on a small desktop window.

8. **Stale README/cache name combos.** When ChatGPT or I bump a
   version, the README sometimes still references the prior version.
   Update both.

---

## What the user usually wants

Pattern of typical asks:
- "I see X happening (slowdown / damage / visual). Why?" → investigate
  first, present root cause, ASK before fixing.
- "Compare ChatGPT's v<N> to mine" → diff the IIFEs, table the
  differences, recommend.
- "Make sure this works with everything" → run selftests for ALL
  upstream layers, verify nothing broke.
- "Don't fix yet, just analyze" → produce a written plan, no edits.

The user appreciates:
- Concise summaries before code (what / why)
- Verification with selftests and grep-confirmed claims
- Acknowledging trade-offs explicitly
- Not silently fixing things they didn't ask about

The user dislikes:
- Burning Netlify uploads on incremental fixes (combine patches when
  practical)
- Assumptions about intent without checking ("just fix it" usually
  has a specific bug in mind)
- Comments/emojis/marketing language in code

---

## Quick start for a new task

1. Read the most recent build's README (look in `/tmp/v<N>_build/NO_MOON_V<N>_*.md`).
2. `grep -n "installV"` in `game_inline.js` to see what layers are loaded.
3. `state.buildTag` (after load) to confirm what version the user is on.
4. Pick the baseline (latest user-uploaded zip in `/home/user/Default/`).
5. Plan in the plan file first if the task is non-trivial.
6. Build a new layer following the IIFE template above.
7. Verify with the headless node harness.
8. Ship the zip via SendUserFile + commit + push.

---

## Useful one-liners

```bash
# What's installed in a zip?
grep -nE "installV[0-9]+|V[0-9]+_VERSION" no-moon/game_inline.js | head -30

# All writers of a shared state property
grep -n "state\._v77SunHeat" no-moon/game_inline.js

# What's wrapped on a function
grep -n "damageObstacle\.__v" no-moon/game_inline.js

# Engine edits inside a closure-scoped function
grep -n "if (state\.__v.*) return" no-moon/game_inline.js

# Headless selftest after build
node /tmp/verify_vN.js
```

---

## Final notes

- This codebase is layered, additive, and well-instrumented. Most
  bugs are diagnosable by grepping for the relevant function and
  reading the call chain.
- ChatGPT and I have been operating in parallel; when in doubt,
  compare both layers' approach to the same bug. Two perspectives
  catch more than one.
- The user has good instincts about gameplay feel. Trust their
  reports; investigate before assuming they're wrong.
- Don't make changes outside what's asked. The user is testing in
  small increments. Scope creep wastes their Netlify deploys.

Good luck.
