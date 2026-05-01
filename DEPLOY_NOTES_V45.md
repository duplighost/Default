# Deploy Notes — No Moon v45

## Build

- Game build tag: `qual.future-consequence.2026-05-01.v45`
- Game service-worker cache: `no-moon-future-consequence-v45`
- Base: v44 Breathing Village
- BGM asset unchanged: `/no-moon/no-moon-bg-v35.mp3`

## Deploy options

### Full-site deploy

Use:

```text
qualiacology-full-site-v3-2-with-game-v45.zip
```

Deploy this archive if replacing the whole Qualiacology site on Netlify.

### Game-only deploy

Use:

```text
qualiacology-no-moon-v45-game-only.zip
```

Deploy this archive if replacing only the `/no-moon/` folder.

## Cache note

The service-worker cache was bumped to `no-moon-future-consequence-v45`. After deploy, confirm the title screen says:

```text
build: qual.future-consequence.2026-05-01.v45
```

If an old build appears, close/reopen the tab or hard-refresh so the service worker claims the new cache.

## Quick live checks

1. Start a new run.
2. Confirm Safe Haven still shows the v44 Breathing Village.
3. Move through several normal rooms.
4. Look for colorful breakable wall/door plugs.
5. Break them.
6. Confirm legitimate secret doors/breaches work.
7. Confirm no small random seam appears with no breakable wall/room behind it.

## Debug checks

```js
state.v45Debug()
state.v45SecretDoorAudit()
```

Expected:

```js
v43HiddenSeamsEnabled: false
scan.hiddenSeams: 0
scan.orphanDoorCapsules: 0
scan.brokenSecretDoors: 0
```

