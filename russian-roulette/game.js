/* =========================================================================
   LAST CHAMBER — 3D Russian Roulette
   A tense turn-based duel against an AI dealer, rendered with three.js.
   No external assets: geometry is procedural, audio is synthesized.
   ========================================================================= */
(function () {
  "use strict";

  if (typeof THREE === "undefined") {
    document.getElementById("loading").innerHTML =
      '<div class="menu-inner"><p class="tagline">Could not load the 3D engine.<br>Check your connection and reload.</p></div>';
    return;
  }

  /* ---------------------------------------------------------------------
     DOM references
     --------------------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);
  const el = {
    canvas: $("scene"),
    hud: $("hud"),
    menu: $("menu"),
    how: $("how"),
    banner: $("banner"),
    loading: $("loading"),
    flash: $("flash"),
    message: $("message"),
    actions: $("actions"),
    btnSelf: $("btnSelf"),
    btnDealer: $("btnDealer"),
    btnStart: $("btnStart"),
    btnHow: $("btnHow"),
    btnHowBack: $("btnHowBack"),
    btnBannerAction: $("btnBannerAction"),
    bannerTitle: $("bannerTitle"),
    bannerText: $("bannerText"),
    playerHearts: $("playerHearts"),
    dealerHearts: $("dealerHearts"),
    ciLive: $("ciLive"),
    ciBlank: $("ciBlank"),
  };

  /* ---------------------------------------------------------------------
     Tiny async utilities: promise-based tweens + sleep
     --------------------------------------------------------------------- */
  const tweens = [];
  const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;

  function tween(duration, onUpdate, ease = easeInOut) {
    return new Promise((resolve) => {
      tweens.push({ t: 0, duration, ease, onUpdate, resolve });
    });
  }
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  const lerp = (a, b, t) => a + (b - a) * t;

  function updateTweens(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt;
      const p = clamp01(tw.t / tw.duration);
      tw.onUpdate(tw.ease(p), p);
      if (p >= 1) {
        tweens.splice(i, 1);
        tw.resolve();
      }
    }
  }

  /* ---------------------------------------------------------------------
     Procedural audio (Web Audio API) — no sound files needed
     --------------------------------------------------------------------- */
  const Audio = (function () {
    let ctx = null;
    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function noiseBuffer(dur) {
      const c = ensure();
      const len = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }
    // Metallic tick — hammer cock, cylinder detent
    function tick(freq = 1800, gain = 0.25, dur = 0.05) {
      const c = ensure();
      if (!c) return;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.setValueAtTime(gain, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    }
    // Dry click on an empty/blank chamber
    function click() {
      tick(2200, 0.3, 0.04);
      setTimeout(() => tick(900, 0.18, 0.05), 18);
    }
    // Cylinder spin — rapid descending ticks
    function spin() {
      const c = ensure();
      if (!c) return;
      let n = 14;
      for (let i = 0; i < n; i++) {
        setTimeout(() => tick(1400 + Math.random() * 800, 0.12, 0.03), i * (28 + i * 5));
      }
    }
    // Gunshot — noise burst + low body + snap
    function gunshot() {
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime;
      // Body: filtered noise
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(0.5);
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(6000, t0);
      lp.frequency.exponentialRampToValueAtTime(300, t0 + 0.35);
      const g = c.createGain();
      g.gain.setValueAtTime(0.9, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
      src.connect(lp).connect(g).connect(c.destination);
      src.start(t0);
      src.stop(t0 + 0.5);
      // Low thump
      const o = c.createOscillator();
      const og = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(160, t0);
      o.frequency.exponentialRampToValueAtTime(45, t0 + 0.3);
      og.gain.setValueAtTime(0.8, t0);
      og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      o.connect(og).connect(c.destination);
      o.start(t0);
      o.stop(t0 + 0.35);
    }
    function unlock() {
      ensure();
    }
    return { tick, click, spin, gunshot, unlock };
  })();

  /* ---------------------------------------------------------------------
     THREE.js scene
     --------------------------------------------------------------------- */
  const renderer = new THREE.WebGLRenderer({
    canvas: el.canvas,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x05040a, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05040a, 0.11);

  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.05,
    100
  );
  const camBase = new THREE.Vector3(0, 0, 0);
  camera.position.copy(camBase);
  camera.lookAt(0, -0.15, -4);

  function resize() {
    const w = window.innerWidth,
      h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  /* ---------- Lighting ---------- */
  scene.add(new THREE.AmbientLight(0x2a2230, 0.55));

  // Hanging bulb over the table
  const bulb = new THREE.PointLight(0xffd9a0, 1.5, 14, 2);
  bulb.position.set(0, 2.4, -3.2);
  bulb.castShadow = true;
  bulb.shadow.mapSize.set(1024, 1024);
  bulb.shadow.radius = 4;
  scene.add(bulb);

  const bulbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff0d0 })
  );
  bulbMesh.position.copy(bulb.position);
  scene.add(bulbMesh);
  const bulbGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffcf8c, transparent: true, opacity: 0.28 })
  );
  bulbGlow.position.copy(bulb.position);
  scene.add(bulbGlow);
  // cord
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 1.6, 6),
    new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
  );
  cord.position.set(0, 3.2, -3.2);
  scene.add(cord);

  // Cool rim light from behind the dealer
  const rim = new THREE.SpotLight(0x4466aa, 0.7, 18, 0.9, 0.5);
  rim.position.set(-2.5, 2, -7);
  rim.target.position.set(0, 0, -3);
  scene.add(rim);
  scene.add(rim.target);

  const muzzleLight = new THREE.PointLight(0xffaa44, 0, 6, 2);
  scene.add(muzzleLight);

  /* ---------- Table + floor ---------- */
  function makeWoodTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#3a2417";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = `rgba(${20 + Math.random() * 40},${12 + Math.random() * 24},${6 + Math.random() * 14},${0.3 + Math.random() * 0.4})`;
      g.lineWidth = 0.5 + Math.random() * 2;
      g.beginPath();
      const y = Math.random() * 256;
      g.moveTo(0, y);
      g.bezierCurveTo(85, y + (Math.random() - 0.5) * 20, 170, y + (Math.random() - 0.5) * 20, 256, y + (Math.random() - 0.5) * 20);
      g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }
  const woodTex = makeWoodTexture();

  const tableTop = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.18, 5),
    new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85, metalness: 0.05 })
  );
  tableTop.position.set(0, -0.55, -3.2);
  tableTop.receiveShadow = true;
  scene.add(tableTop);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x0b0908, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.6;
  floor.receiveShadow = true;
  scene.add(floor);

  // Back wall for depth
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 16),
    new THREE.MeshStandardMaterial({ color: 0x14100f, roughness: 1 })
  );
  wall.position.set(0, 2, -11);
  scene.add(wall);

  /* ---------- The Dealer (stylized silhouette across the table) ---------- */
  const dealer = new THREE.Group();
  const dealerMat = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.9, metalness: 0.1 });
  const dealerSkin = new THREE.MeshStandardMaterial({ color: 0x6a5545, roughness: 0.8 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.6, 1.15, 16), dealerMat);
  torso.position.y = 0.55;
  torso.castShadow = true;
  dealer.add(torso);

  const shoulders = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.35, 16), dealerMat);
  shoulders.position.y = 1.15;
  dealer.add(shoulders);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.16, 12), dealerSkin);
  neck.position.y = 1.35;
  dealer.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), dealerSkin);
  head.position.y = 1.62;
  head.castShadow = true;
  dealer.add(head);

  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 24), dealerMat);
  hatBrim.position.y = 1.76;
  dealer.add(hatBrim);
  const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.34, 24), dealerMat);
  hatTop.position.y = 1.93;
  dealer.add(hatTop);

  // faint eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffcf6a });
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
    eye.position.set(0.09 * sx, 1.64, 0.23);
    dealer.add(eye);
  }

  dealer.position.set(0, -0.46, -5.4);
  dealer.rotation.y = Math.PI; // face the player
  scene.add(dealer);

  /* ---------------------------------------------------------------------
     The Revolver — built from primitives, held first-person
     --------------------------------------------------------------------- */
  const gun = new THREE.Group();

  const steel = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.35, metalness: 0.95 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.5, metalness: 0.9 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x3d2415, roughness: 0.75, metalness: 0.1 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xcaa24a, roughness: 0.4, metalness: 0.8 });

  // Barrel — points along local -Z (forward)
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 20), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.03, -0.55);
  barrel.castShadow = true;
  gun.add(barrel);
  // barrel top rib
  const rib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.95), darkSteel);
  rib.position.set(0, 0.09, -0.55);
  gun.add(rib);
  // muzzle ring
  const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 18), darkSteel);
  muzzle.position.set(0, 0.03, -1.02);
  gun.add(muzzle);
  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.03, -1.06);
  gun.add(muzzlePoint);

  // Frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.42), steel);
  frame.position.set(0, 0, -0.02);
  frame.castShadow = true;
  gun.add(frame);

  // Cylinder (rotates) — 6 visible chambers
  const cylinder = new THREE.Group();
  const cylBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 24), steel);
  cylBody.rotation.x = Math.PI / 2;
  cylBody.castShadow = true;
  cylinder.add(cylBody);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.26, 12),
      darkSteel
    );
    hole.rotation.x = Math.PI / 2;
    hole.position.set(Math.cos(a) * 0.088, Math.sin(a) * 0.088, 0);
    cylinder.add(hole);
    // flute grooves
    const flute = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.02, 0.2),
      darkSteel
    );
    flute.position.set(Math.cos(a + Math.PI / 6) * 0.13, Math.sin(a + Math.PI / 6) * 0.13, 0);
    cylinder.add(flute);
  }
  cylinder.position.set(0, 0, -0.12);
  gun.add(cylinder);

  // Hammer (pivots back when cocked)
  const hammer = new THREE.Group();
  const hammerBody = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), darkSteel);
  hammerBody.position.y = 0.06;
  hammer.add(hammerBody);
  const hammerSpur = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.08), darkSteel);
  hammerSpur.position.set(0, 0.11, 0.03);
  hammer.add(hammerSpur);
  hammer.position.set(0, 0.06, 0.16);
  gun.add(hammer);

  // Trigger + guard
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16, Math.PI), steel);
  guard.rotation.x = Math.PI / 2;
  guard.rotation.z = Math.PI;
  guard.position.set(0, -0.13, 0.05);
  gun.add(guard);
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.02), darkSteel);
  trigger.position.set(0, -0.1, 0.05);
  gun.add(trigger);

  // Grip (angled back-down)
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.34, 0.16), gripMat);
  grip.position.set(0, -0.2, 0.2);
  grip.rotation.x = -0.35;
  grip.castShadow = true;
  gun.add(grip);
  const gripCap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.17), darkSteel);
  gripCap.position.set(0, -0.36, 0.26);
  gripCap.rotation.x = -0.35;
  gun.add(gripCap);

  scene.add(gun);

  // Poses for the gun (position + euler rotation).
  //  - rest / self / atDealer are the player's first-person poses.
  //  - dealerSelf / dealerYou place the gun on the dealer's side of the table
  //    for the dealer's turn (the revolver slides across between turns).
  const POSE = {
    rest:      { p: new THREE.Vector3(0.5, -0.62, -1.15), r: new THREE.Euler(0.15, -0.5, -0.15) },
    self:      { p: new THREE.Vector3(0.28, -0.18, -0.72), r: new THREE.Euler(0.1, 1.35, 0.35) },
    atDealer:  { p: new THREE.Vector3(0.08, -0.28, -1.0),  r: new THREE.Euler(0.0, 0.02, 0.0) },
    dealerSelf:{ p: new THREE.Vector3(0.16, 0.02, -4.55),  r: new THREE.Euler(Math.PI / 2 + 0.15, 0.0, 0.2) },
    dealerYou: { p: new THREE.Vector3(0.0, -0.05, -4.4),   r: new THREE.Euler(-0.12, Math.PI, 0.0) },
  };
  function applyPose(pose) {
    gun.position.copy(pose.p);
    gun.rotation.copy(pose.r);
  }
  function lerpPose(a, b, t) {
    gun.position.set(lerp(a.p.x, b.p.x, t), lerp(a.p.y, b.p.y, t), lerp(a.p.z, b.p.z, t));
    gun.rotation.set(lerp(a.r.x, b.r.x, t), lerp(a.r.y, b.r.y, t), lerp(a.r.z, b.r.z, t));
  }
  applyPose(POSE.rest);

  /* ---------------------------------------------------------------------
     Game state
     --------------------------------------------------------------------- */
  const State = {
    playerLives: 0,
    dealerLives: 0,
    maxLives: 4,
    chambers: [],      // array of true(live)/false(blank), order hidden
    pointer: 0,        // index of next chamber to fire
    loadedLive: 0,
    loadedBlank: 0,
    turn: "player",    // "player" | "dealer"
    busy: false,       // input lock during animations
    running: false,
  };

  function remaining() {
    let live = 0, blank = 0;
    for (let i = State.pointer; i < State.chambers.length; i++) {
      if (State.chambers[i]) live++; else blank++;
    }
    return { live, blank, total: live + blank };
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function loadCylinder() {
    // 2..6 rounds; at least 1 live and at least 1 blank for tension
    const total = 2 + Math.floor(Math.random() * 5); // 2..6
    let live = 1 + Math.floor(Math.random() * (total - 1)); // 1..total-1
    const blank = total - live;
    const arr = [];
    for (let i = 0; i < live; i++) arr.push(true);
    for (let i = 0; i < blank; i++) arr.push(false);
    shuffle(arr);
    State.chambers = arr;
    State.pointer = 0;
    State.loadedLive = live;
    State.loadedBlank = blank;
  }

  /* ---------------------------------------------------------------------
     HUD rendering
     --------------------------------------------------------------------- */
  function renderHearts(container, lives, max) {
    let html = "";
    for (let i = 0; i < max; i++) {
      html += `<span class="heart${i < lives ? "" : " dead"}">&#9829;</span>`;
    }
    container.innerHTML = html;
  }
  function renderHUD() {
    renderHearts(el.playerHearts, State.playerLives, State.maxLives);
    renderHearts(el.dealerHearts, State.dealerLives, State.maxLives);
    const r = remaining();
    el.ciLive.textContent = r.live;
    el.ciBlank.textContent = r.blank;
  }

  let msgTimer = null;
  function showMessage(text, cls = "", hold = 0) {
    el.message.className = "message show " + cls;
    el.message.innerHTML = text;
    if (msgTimer) clearTimeout(msgTimer);
    if (hold > 0) {
      msgTimer = setTimeout(() => el.message.classList.remove("show"), hold);
    }
  }
  function hideMessage() {
    el.message.classList.remove("show");
  }

  function setActions(visible) {
    el.actions.classList.toggle("hidden", !visible);
  }

  function screenFlash(strength = 0.9) {
    el.flash.style.transition = "none";
    el.flash.style.opacity = strength;
    requestAnimationFrame(() => {
      el.flash.style.transition = "opacity 0.5s ease";
      el.flash.style.opacity = 0;
    });
  }

  /* ---------------------------------------------------------------------
     Animated sequences
     --------------------------------------------------------------------- */
  async function raiseGun(target) {
    const from = { p: gun.position.clone(), r: gun.rotation.clone() };
    const to = POSE[target];
    await tween(0.5, (t) => {
      gun.position.set(lerp(from.p.x, to.p.x, t), lerp(from.p.y, to.p.y, t), lerp(from.p.z, to.p.z, t));
      gun.rotation.set(lerp(from.r.x, to.r.x, t), lerp(from.r.y, to.r.y, t), lerp(from.r.z, to.r.z, t));
    }, easeOut);
  }
  async function lowerGun() {
    const from = { p: gun.position.clone(), r: gun.rotation.clone() };
    const to = POSE.rest;
    await tween(0.45, (t) => {
      gun.position.set(lerp(from.p.x, to.p.x, t), lerp(from.p.y, to.p.y, t), lerp(from.p.z, to.p.z, t));
      gun.rotation.set(lerp(from.r.x, to.r.x, t), lerp(from.r.y, to.r.y, t), lerp(from.r.z, to.r.z, t));
    }, easeInOut);
  }

  async function cockHammer() {
    Audio.tick(1600, 0.25, 0.06);
    await tween(0.18, (t) => {
      hammer.rotation.x = lerp(0, -0.9, t);
    }, easeOut);
    Audio.tick(2400, 0.2, 0.04);
  }
  async function releaseHammer() {
    await tween(0.05, (t) => {
      hammer.rotation.x = lerp(-0.9, 0, t);
    }, easeIn);
  }

  async function spinCylinder() {
    Audio.spin();
    const start = cylinder.rotation.z;
    await tween(0.7, (t) => {
      cylinder.rotation.z = start + t * Math.PI * 6;
    }, easeOut);
  }
  async function advanceCylinder() {
    const start = cylinder.rotation.z;
    Audio.tick(1500, 0.12, 0.03);
    await tween(0.16, (t) => {
      cylinder.rotation.z = start + (t * Math.PI * 2) / 6;
    }, easeOut);
  }

  async function recoil(intensity) {
    const from = { p: gun.position.clone(), r: gun.rotation.clone() };
    await tween(0.09, (t) => {
      gun.position.z = from.p.z + t * 0.28 * intensity;
      gun.position.y = from.p.y + t * 0.18 * intensity;
      gun.rotation.x = from.r.x - t * 0.5 * intensity;
    }, easeOut);
    await tween(0.28, (t) => {
      gun.position.z = lerp(from.p.z + 0.28 * intensity, from.p.z, t);
      gun.position.y = lerp(from.p.y + 0.18 * intensity, from.p.y, t);
      gun.rotation.x = lerp(from.r.x - 0.5 * intensity, from.r.x, t);
    }, easeInOut);
  }

  function muzzleFlash() {
    muzzleLight.color.set(0xffbb55);
    muzzleLight.intensity = 8;
    const world = new THREE.Vector3();
    muzzlePoint.getWorldPosition(world);
    muzzleLight.position.copy(world);
    setTimeout(() => (muzzleLight.intensity = 3), 40);
    setTimeout(() => (muzzleLight.intensity = 0), 110);
  }

  // Camera shake
  let shakeAmt = 0;
  function shake(a) {
    shakeAmt = a;
  }

  async function dealerReact(hit) {
    // knock the dealer back a touch on a hit; small flinch on a click aimed at them
    const startZ = dealer.position.z;
    const startRot = dealer.rotation.x;
    if (hit) {
      await tween(0.12, (t) => {
        dealer.position.z = startZ - t * 0.35;
        dealer.rotation.x = startRot + t * 0.4;
      }, easeOut);
      await tween(0.5, (t) => {
        dealer.position.z = lerp(startZ - 0.35, startZ, t);
        dealer.rotation.x = lerp(startRot + 0.4, startRot, t);
      }, easeInOut);
    } else {
      await tween(0.1, (t) => {
        dealer.position.z = startZ - t * 0.08;
      }, easeOut);
      await tween(0.2, (t) => {
        dealer.position.z = lerp(startZ - 0.08, startZ, t);
      }, easeInOut);
    }
  }

  /* ---------------------------------------------------------------------
     Firing a chamber.
     poseName    — which aim pose to raise the gun into.
     reactDealer — true when the muzzle is pointed at the dealer's body
                   (so a hit knocks him back and a blank makes him flinch).
     recoilInt   — recoil strength.
     Returns true if the round was LIVE.
     --------------------------------------------------------------------- */
  async function fire(poseName, { reactDealer = false, recoilInt = 1.0 } = {}) {
    const live = State.chambers[State.pointer];
    State.pointer++;

    await raiseGun(poseName);
    await sleep(120);
    await cockHammer();
    await sleep(360); // the pause before the pull — the tense beat
    await advanceCylinder();
    await releaseHammer();
    Audio.tick(2600, 0.2, 0.03); // trigger break

    if (live) {
      Audio.gunshot();
      muzzleFlash();
      screenFlash(0.92);
      shake(0.5);
      await recoil(recoilInt);
      if (reactDealer) await dealerReact(true);
      showMessage("BANG.", "bang", 1400);
    } else {
      Audio.click();
      showMessage("<i>click.</i>", "click", 1100);
      if (reactDealer) await dealerReact(false);
      await sleep(500);
    }

    await sleep(live ? 900 : 300);
    await lowerGun();
    renderHUD();
    return live;
  }

  /* ---------------------------------------------------------------------
     Reload when cylinder empties
     --------------------------------------------------------------------- */
  async function maybeReload() {
    if (State.pointer < State.chambers.length) return;
    showMessage("The dealer reloads&hellip;", "", 0);
    setActions(false);
    await lowerGun();
    loadCylinder();
    await spinCylinder();
    renderHUD();
    await sleep(600);
    hideMessage();
    await sleep(200);
  }

  /* ---------------------------------------------------------------------
     Turn flow
     --------------------------------------------------------------------- */
  async function endShotBookkeeping() {
    renderHUD();
    if (State.playerLives <= 0 || State.dealerLives <= 0) {
      return endGame();
    }
    await maybeReload();
    // if reload emptied naturally, continue
    if (State.turn === "player") beginPlayerTurn();
    else beginDealerTurn();
  }

  function beginPlayerTurn() {
    State.turn = "player";
    State.busy = false;
    renderHUD();
    showMessage("Your move.", "turn-you", 1600);
    setActions(true);
  }

  async function playerChoose(target) {
    if (State.busy || State.turn !== "player") return;
    State.busy = true;
    setActions(false);
    hideMessage();

    const live =
      target === "self"
        ? await fire("self", { recoilInt: 1.3 })
        : await fire("atDealer", { reactDealer: true, recoilInt: 1.0 });

    if (target === "self") {
      if (live) {
        State.playerLives--;
        renderHUD();
        await sleep(400);
        State.turn = "dealer";
      } else {
        // survived a blank — keep the turn
        renderHUD();
        if (State.pointer >= State.chambers.length) {
          await maybeReload();
        }
        if (State.playerLives > 0 && State.dealerLives > 0) {
          State.busy = false;
          setActions(true);
          showMessage("Blank. Go again.", "turn-you", 1400);
          return;
        }
      }
    } else {
      // shot the dealer — turn ends regardless
      if (live) {
        State.dealerLives--;
        renderHUD();
        await sleep(400);
      }
      State.turn = "dealer";
    }

    await endShotBookkeeping();
  }

  /* ---------- Dealer AI ---------- */
  function dealerDecision() {
    const r = remaining();
    if (r.total === 0) return "self"; // will reload; harmless
    const pLive = r.live / r.total;

    // Guaranteed knowledge
    if (r.live === 0) return "self";       // all blanks left: safe to keep turn
    if (r.blank === 0) return "dealer";    // all live: shoot the player

    // If shooting itself is very likely safe, gamble to keep the turn
    if (pLive < 0.34) return "self";
    // If it's a coin-flip-ish or worse, take the shot at the player
    if (pLive > 0.62) return "dealer";
    // Middle ground: weighted random, slightly favouring aggression when ahead
    const aggression = 0.5 + (State.playerLives - State.dealerLives) * 0.08;
    return Math.random() < clamp01(aggression) ? "dealer" : "self";
  }

  async function beginDealerTurn() {
    State.turn = "dealer";
    State.busy = true;
    setActions(false);
    renderHUD();
    showMessage("The dealer's turn.", "turn-dealer", 1500);
    await sleep(1500);

    let keepGoing = true;
    while (keepGoing) {
      keepGoing = false;
      const choice = dealerDecision();
      const targetIsPlayer = choice === "dealer";
      showMessage(
        targetIsPlayer ? "The dealer aims at <b>you</b>&hellip;" : "The dealer aims at <b>himself</b>&hellip;",
        "turn-dealer",
        0
      );
      await sleep(900);
      hideMessage();

      // Visual poses for the dealer's side of the table:
      //   dealer shoots himself -> gun under his chin (dealerSelf pose, reacts on hit)
      //   dealer shoots you      -> gun points across at the camera (dealerYou pose)
      const live = targetIsPlayer
        ? await fire("dealerYou", { recoilInt: 0.6 })
        : await fire("dealerSelf", { reactDealer: true, recoilInt: 0.5 });

      if (choice === "self") {
        if (live) {
          State.dealerLives--;
          renderHUD();
          await sleep(400);
          State.turn = "player";
        } else {
          renderHUD();
          if (State.pointer >= State.chambers.length) await maybeReload();
          if (State.dealerLives > 0 && State.playerLives > 0) {
            showMessage("Blank. The dealer goes again.", "turn-dealer", 1300);
            await sleep(1300);
            keepGoing = true;
            continue;
          }
        }
      } else {
        if (live) {
          State.playerLives--;
          renderHUD();
          await sleep(400);
        }
        State.turn = "player";
      }
    }

    await endShotBookkeeping();
  }

  /* ---------------------------------------------------------------------
     Round / game start + end
     --------------------------------------------------------------------- */
  function startGame() {
    State.playerLives = State.maxLives;
    State.dealerLives = State.maxLives;
    State.running = true;
    State.turn = "player";
    dealer.position.set(0, -0.46, -5.4);
    dealer.rotation.set(0, Math.PI, 0);
    applyPose(POSE.rest);
    loadCylinder();
    renderHUD();
    el.hud.classList.remove("hidden");
    beginRoundIntro();
  }

  async function beginRoundIntro() {
    State.busy = true;
    setActions(false);
    showMessage("Loading the cylinder&hellip;", "", 0);
    await sleep(700);
    await spinCylinder();
    renderHUD();
    await sleep(500);
    showMessage("You go first.", "turn-you", 1600);
    await sleep(1200);
    hideMessage();
    beginPlayerTurn();
  }

  function endGame() {
    State.running = false;
    State.busy = true;
    setActions(false);
    hideMessage();
    const win = State.dealerLives <= 0 && State.playerLives > 0;
    el.bannerTitle.textContent = win ? "YOU WALK AWAY" : "THE HOUSE WINS";
    el.bannerTitle.className = "banner-title " + (win ? "win" : "lose");
    el.bannerText.textContent = win
      ? "The dealer slumps. The table is yours. Nerve beat the odds tonight."
      : "The dealer collects the cylinder without a word. Care to try again?";
    el.btnBannerAction.textContent = win ? "Play Again" : "Sit Down Again";
    el.banner.classList.remove("hidden");
  }

  /* ---------------------------------------------------------------------
     UI wiring
     --------------------------------------------------------------------- */
  el.btnSelf.addEventListener("click", () => {
    Audio.unlock();
    playerChoose("self");
  });
  el.btnDealer.addEventListener("click", () => {
    Audio.unlock();
    playerChoose("dealer");
  });
  el.btnStart.addEventListener("click", () => {
    Audio.unlock();
    el.menu.classList.add("hidden");
    startGame();
  });
  el.btnHow.addEventListener("click", () => {
    el.how.classList.remove("hidden");
  });
  el.btnHowBack.addEventListener("click", () => {
    el.how.classList.add("hidden");
  });
  el.btnBannerAction.addEventListener("click", () => {
    Audio.unlock();
    el.banner.classList.add("hidden");
    startGame();
  });

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if (!State.running || State.busy || State.turn !== "player") return;
    if (e.key === "1" || e.key.toLowerCase() === "s") playerChoose("self");
    if (e.key === "2" || e.key.toLowerCase() === "d") playerChoose("dealer");
  });

  /* ---------------------------------------------------------------------
     Render loop
     --------------------------------------------------------------------- */
  let last = performance.now();
  const tmp = new THREE.Vector3();
  function animate(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    updateTweens(dt);

    // subtle bulb flicker
    bulb.intensity = 1.5 + Math.sin(now * 0.004) * 0.06 + (Math.random() - 0.5) * 0.03;

    // idle breathing on the gun when at rest
    if (!State.busy && State.running) {
      gun.position.y = POSE.rest.p.y + Math.sin(now * 0.0015) * 0.008;
    }

    // dealer idle sway
    dealer.rotation.y = Math.PI + Math.sin(now * 0.0008) * 0.03;

    // camera shake decay
    if (shakeAmt > 0.001) {
      camera.position.set(
        camBase.x + (Math.random() - 0.5) * shakeAmt * 0.14,
        camBase.y + (Math.random() - 0.5) * shakeAmt * 0.14,
        camBase.z + (Math.random() - 0.5) * shakeAmt * 0.06
      );
      shakeAmt *= 0.86;
    } else {
      camera.position.lerp(camBase, 0.2);
    }
    camera.lookAt(0, -0.15, -4);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // Kick things off once the scene is ready
  el.loading.classList.add("hidden");
  requestAnimationFrame(animate);
})();
