# How to grab the work I do

You said you don't really use GitHub except when we work on it, and you upload everything to your website by hand. So here's how I'll lay things out from now on to make that simple.

## The one file you actually need

Every time I finish a build pass, I'll put a complete drop-in website zip at:

```
/releases/no-moon-vXX-website.zip
```

The current one is:

```
/releases/no-moon-v93-website.zip   (~3.6 MB)
```

Older releases (v76 through v92) stay in the same folder if you ever need to roll back. **Pro's v86 / v87 / v88 are skipped on purpose** — they shipped a hot DOM-mutation loop in the Codex repair that froze the page. v89 was the recovery build (Pro's v85 + version bump). Pro then built v90 → v91 → v92 forward from v89, properly avoiding the loop pattern. v93 is mine on top of Pro's v92 — adds the Captain Fang upgrade (mini-boss visuals + telegraphed entry + themed rewards + adjacent-room ghost cameo) and the Sun finale polish (first-clear crater reveal + re-run sigil hierarchy). v93 does not install any MutationObserver and does not touch the Codex DOM — the v92 codex layer stays canonical.

Direct raw URL (this is the one that downloaded easily for you):

```
https://github.com/duplighost/Default/raw/claude/investigate-code-functionality-gP8aM/releases/no-moon-v93-website.zip
```

That zip has the **entire website folder structure** inside, ready to unzip onto your host. It's a literal drop-in replacement — no figuring out which file goes where. The zip uses an internal folder named `no-moon-v93-fang-and-finale/`.

Inside the zip:

```
no-moon-v93-fang-and-finale/
├── README_UPLOAD_THIS.txt    ← read this first, it explains everything in the build
├── index.html                ← your site landing
├── book.html
├── no-moon.html
├── _redirects
├── no-moon-sw.js             ← root cleanup service worker
├── no-moon/
│   ├── index.html            ← the actual game
│   ├── game_inline.js        ← maintenance mirror (same as the script in index.html)
│   └── no-moon-sw.js         ← game service worker
└── assets/
    ├── favicon.svg           ← site branding
    ├── icon-192.png          ← PWA icon (small)
    ├── icon-512.png          ← PWA icon (big)
    ├── qualiacology-og.png   ← social-preview image
    ├── site.webmanifest      ← PWA manifest
    └── no-moon/
        ├── characters/       ← portraits, including new Moots + Vesper
        ├── bosses/           ← boss cards
        └── title/            ← title art
```

**Important:** The 5 root `/assets/` files (favicon, icons, manifest, OG image) are
branding assets that the website needs to keep working correctly — favicon in the
browser tab, app icon on phone home screens, social preview when you share the link.
I missed them in the v76 zip; v77 has them. If you ever see them go missing from a
future zip, ping me.

## How to grab the zip from this session

Open the file at `/releases/no-moon-v76-website.zip` and download it through whatever button your Claude interface shows for files. If you can't see it, just say "send me the v76 zip" and I'll put it somewhere else you can reach.

## What I changed in the repo

These two commits exist on the `claude/investigate-code-functionality-gP8aM` branch (no need to use GitHub if you don't want — the zip already has everything):

1. **`b8…`** Upgrade to v75 build (took your zip, dropped it into the repo)
2. **`493ab73`** v76: route integrity, useful stars, passenger polish

If you ever want to see exactly what changed in v76 vs v75, the v76 commit has the full diff.

## Asking future Claude sessions to do this same packaging

If you start a fresh session and want it to do the same thing, just paste:

> Also build a complete drop-in website zip at `/releases/no-moon-vXX-website.zip` so I can upload it without thinking. Mirror the v75 zip folder structure exactly. Include a `README_UPLOAD_THIS.txt` inside that explains what changed.

That single line is enough to get the same package format.

## A few extra things that help

- **Tell me what version you're on.** When you start a session, drop in the latest zip and say "this is what's live now." Then I have a reliable baseline. If you don't, I'm working from whatever was in the repo last time, which may be out of date with your website.

- **Playtest notes are gold.** The TODO file you gave me ("stars in the store don't work / doors move with the player / boss says wrong name") was way more useful than a generic "find bugs" request. Specific symptoms → specific fixes.

- **You can ignore GitHub entirely if you want.** The merge button you clicked earlier just moved my fixes from the working branch to `main`. It's not connected to your website. The zip is what matters. GitHub is just my scratchpad.

- **Hard refresh after upload.** The service worker cache name is part of the build tag (e.g. `no-moon-route-stars-passengers-v76`). When you upload v76 over v75, players' browsers will pull the new cache automatically. But your own browser may want a Ctrl/Cmd+Shift+R the first time to see the changes.

## If something looks wrong after upload

Open the browser console on the live game and run:

```js
state.v93Debug()
state.v93SelfTest()
```

Paste me the JSON. That tells me which build tag is actually live, what captain is in the current room (if any), how many ghost cameos are active, the crater-reveal state — usually enough to diagnose without guessing. (`noMoonCurrentDebug()` and `noMoonCurrentSelfTest()` also work; they always point at the latest build.)

If the codex looks weird or has duplicate Drowned Sun cards:

```js
noMoonV92RepairCodex()
```

---

That's it. The zip is the source of truth. Everything else is optional.
