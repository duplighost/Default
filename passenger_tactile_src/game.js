(() => {
  'use strict';

  const VERSION = '3.3.0-boon-moots-ultimate';
  const SAVE_KEY = 'boon.moots.ultimate.v33';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

  const ui = {
    overlay: document.getElementById('overlay'),
    overlayTitle: document.getElementById('overlayTitle'),
    overlayCopy: document.getElementById('overlayCopy'),
    overlayButtons: document.getElementById('overlayButtons'),
    upgrade: document.getElementById('upgrade'),
    upgradeTitle: document.getElementById('upgradeTitle'),
    upgradeCards: document.getElementById('upgradeCards'),
    codex: document.getElementById('codex'),
    codexBody: document.getElementById('codexBody'),
    closeCodex: document.getElementById('closeCodex'),
    hud: document.getElementById('hud'),
    zone: document.getElementById('zone'),
    hp: document.getElementById('hp'),
    score: document.getElementById('score'),
    room: document.getElementById('room'),
    combo: document.getElementById('combo'),
    pulseFill: document.getElementById('pulseFill'),
    whisper: document.getElementById('whisper'),
    sound: document.getElementById('soundBtn'),
    codexBtn: document.getElementById('codexBtn'),
    pause: document.getElementById('pause'),
    resumeBtn: document.getElementById('resumeBtn'),
    pauseCodexBtn: document.getElementById('pauseCodexBtn'),
    pauseSoundBtn: document.getElementById('pauseSoundBtn'),
    shrine: document.getElementById('shrine'),
    shrineCards: document.getElementById('shrineCards'),
    closeShrine: document.getElementById('closeShrine')
  };

  const sprite = new Image();
  let spriteReady = false;
  sprite.onload = () => { spriteReady = true; };
  sprite.src = window.BOON_MOOTS_SRC || './boon_moots_v2.webp';

  const TAU = Math.PI * 2;
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const damp = (a,b,lambda,dt) => lerp(a,b,1-Math.exp(-lambda*dt));
  const dist = (a,b,c,d) => Math.hypot(a-c,b-d);
  const norm = (x,y) => { const m = Math.hypot(x,y) || 1; return {x:x/m,y:y/m,m}; };
  const angleDiff = (a,b) => Math.atan2(Math.sin(a-b), Math.cos(a-b));
  const rand = (a,b) => a + Math.random()*(b-a);
  function hashString(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function mulberry32(seed){ return function(){ let t = seed += 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function pick(arr, rng=Math.random){ return arr[Math.floor(rng()*arr.length)]; }
  function html(s){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function todaySeed(){ const d = new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
  function coarse(){ return matchMedia('(hover:none), (pointer:coarse)').matches; }
  function reduced(){ return matchMedia('(prefers-reduced-motion: reduce)').matches; }

  let W=1,H=1,DPR=1,mobile=false,portrait=true,viewScale=1;
  let camX=0, camY=0, shake=0, flash=0, slowMo=0, hitPause=0;
  let enemyId = 1;

  function resize(){
    mobile = coarse() || innerWidth < 760 || innerHeight < 560;
    portrait = innerHeight >= innerWidth;
    DPR = Math.min(mobile ? 1.35 : 2, Math.max(1, devicePixelRatio || 1));
    viewScale = mobile ? (portrait ? .52 : .70) : 1;
    W = Math.max(320, Math.floor(innerWidth));
    H = Math.max(320, Math.floor(innerHeight));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  addEventListener('resize', resize, {passive:true});
  resize();

  const themes = [
    {id:'causeway', name:'Passenger Causeway', bg:'#090612', floor:'#171021', a:'#7dfdff', b:'#ff4fd8', c:'#ffd36e', bad:'#ff6b6b', icon:'◁'},
    {id:'arcade', name:'October Arcade', bg:'#10051d', floor:'#210b35', a:'#ff4fd8', b:'#7dfdff', c:'#ff9c40', bad:'#ff6b6b', icon:'▣'},
    {id:'market', name:'Signal Market', bg:'#071319', floor:'#0d2631', a:'#b5ff7e', b:'#7dfdff', c:'#ffd36e', bad:'#ff6b6b', icon:'◇'},
    {id:'lake', name:'Missing-Moon Lake', bg:'#070c22', floor:'#111d3b', a:'#f6f0ff', b:'#84e9ff', c:'#ffb6f0', bad:'#ff6b6b', icon:'☾'},
    {id:'orchard', name:'Neon Orchard', bg:'#06140e', floor:'#112919', a:'#b5ff7e', b:'#ff4fd8', c:'#ffd36e', bad:'#ff6b6b', icon:'✦'},
    {id:'shelf', name:'Listening Shelf', bg:'#090515', floor:'#211534', a:'#bd93ff', b:'#ff7bd5', c:'#7dfdff', bad:'#ff6b6b', icon:'♪'},
    {id:'sludge', name:'Sludge Courts', bg:'#17070e', floor:'#281019', a:'#ff6b6b', b:'#ffd36e', c:'#b5ff7e', bad:'#ff385d', icon:'!'},
    {id:'kindness', name:'Dead City Trying', bg:'#071215', floor:'#13262b', a:'#9bffd1', b:'#ffd36e', c:'#f6f0ff', bad:'#ff6b6b', icon:'♡'},
    {id:'observatory', name:'Backseat Observatory', bg:'#070411', floor:'#17102b', a:'#ffd36e', b:'#f6f0ff', c:'#7dfdff', bad:'#ff6b6b', icon:'★'}
  ];

  const clearLines = [
    'The receipt wanted your ankles. No.',
    'The porchlight tried to file a complaint. You became ungovernable.',
    'The cabinet pays out one quarter and one bad idea.',
    'The bench heals you like a dad holding a flashlight.',
    'The sludge says “actually.” Boot.',
    'The cart squeaked once, which legally counts as a death threat.',
    'A cassette refuses shuffle. Correct.',
    'The cat has promoted you to suspicious contractor.',
    'A door opens when you stop staring it down.',
    'The moon was hiding behind a worse moon.',
    'A pie waits on the sill. Useless. Perfect.',
    'The book does not solve you. Good.',
    'The passenger seat is empty. It saved your place.'
  ];

  const behaviorNotices = {
    lowhp: 'You limp. The room quietly moves one blade away.',
    still: 'You stop moving. The room stops lying.',
    dash: 'Left thumb learned to spin instead of doing haunted gymnastics.',
    aim: 'Right thumb learned where fear points.',
    nohit: 'Clean room. Nothing brags.',
    care: 'Some objects help without glowing first.',
    room13: 'The road was watching your hands, not your score.',
    endless: 'No ceiling now.'
  };

  let transition = {active:false, timer:0, duration:1.4, text:'', callback:null};
  const streakNames = ['','','DOUBLE BOOT','TRIPLE STAMP','','RAMPAGE RECEIPT','','','UNSTOPPABLE PASSENGER'];

  const bestiaryInfo = {
    moth:    {icon:'🦋', name:'Porchlight Moth', desc:'Reacts to gunfire. Dances under streetlights it never asked for.'},
    receipt: {icon:'🧾', name:'Unread Receipt', desc:'Keeps its distance. Fires a 3-shot spread.'},
    sludge:  {icon:'🟢', name:'Sludge Clerk', desc:'Slow, tanky. Drops ink puddles on the floor.'},
    charger: {icon:'🔶', name:'Wrong-Way Cone', desc:'Telegraphs a LANE charge then rockets forward.'},
    cart:    {icon:'🛒', name:'Shopping Cartlet', desc:'Bounces off walls. Has opinions and side-shots.'},
    mirror:  {icon:'🪞', name:'Mirror Passenger', desc:'Shoots where you are aiming. Orbits like regret.'},
    moon:    {icon:'🌙', name:'Porchlight Warden', desc:'Slow orbit, fan-fires arcs of bullets.'},
    wraith:  {icon:'👻', name:'Phase Wraith', desc:'Phases in and out. Invisible wraiths rush; visible ones lunge.'},
    boss:    {icon:'💀', name:'Backseat Driver', desc:'Radial barrages, summons minions. The decorative liability.'}
  };

  const shrineDefs = [
    {id:'shrine_hp',    name:'Stubborn Heart',    desc:'+1 max HP per run.',    cost:80,  apply(p){ p.maxHp+=1; p.hp=Math.min(p.maxHp,p.hp+1); }},
    {id:'shrine_speed', name:'Restless Soles',    desc:'+18 base speed.',       cost:100, apply(p){ p.speed+=18; }},
    {id:'shrine_pulse', name:'Louder Quiet',      desc:'+30 pulse radius.',     cost:120, apply(p){ p.pulseRadius+=30; }},
    {id:'shrine_spark', name:'Spark Magnet',       desc:'+40 pickup range.',    cost:90,  apply(p){ p.pickup+=40; }},
    {id:'shrine_head',  name:'Headstart',          desc:'Start each run at room 2.', cost:200, apply:null}
  ];

  const enemyDefs = {
    moth:    {hp:20, r:21, speed:126, score:50, color:'#ff4fd8', label:'Porchlight Moth'},
    receipt: {hp:24, r:20, speed:92, score:72, color:'#ffd36e', label:'Unread Receipt'},
    sludge:  {hp:46, r:28, speed:58, score:96, color:'#b5ff7e', label:'Sludge Clerk'},
    charger: {hp:34, r:24, speed:98, score:112, color:'#ff7a2f', label:'Wrong-Way Cone'},
    cart:    {hp:56, r:31, speed:138, score:136, color:'#7dfdff', label:'Shopping Cartlet'},
    mirror:  {hp:42, r:24, speed:104, score:122, color:'#bd93ff', label:'Mirror Passenger'},
    moon:    {hp:44, r:26, speed:54, score:120, color:'#f6f0ff', label:'Porchlight Warden'},
    wraith:  {hp:28, r:16, speed:135, score:110, color:'#8866cc', label:'Phase Wraith'},
    boss:    {hp:340, r:54, speed:74, score:980, color:'#ffffff', label:'Backseat Driver'}
  };

  const upgradeDefs = [
    {id:'clean', icon:'↯', name:'Snap Start', sub:'Start cleaner. Stop on purpose.', apply(p){ p.speed += 24; p.accel += 2.4; p.stop += 2.8; p.turn += 1.6; }},
    {id:'rate', icon:'♪', name:'Mixtape Motor', sub:'Fire faster while the hook loops.', apply(p){ p.fireDelay *= .86; p.song += 1; }},
    {id:'bite', icon:'✶', name:'Bubblegum Bite', sub:'Shots hit harder.', apply(p){ p.damage *= 1.18; }},
    {id:'split', icon:'≋', name:'Sidecar Sparks', sub:'Aim throws side sparks.', apply(p){ p.split += 1; }},
    {id:'dash', icon:'👢', name:'Boon Boot Flick', sub:'Dash farther. Come back sooner.', apply(p){ p.dashCdBase *= .82; p.dashTrail += 1; }},
    {id:'magnet', icon:'●', name:'Ness Magnet Nerve', sub:'Good things lean closer.', apply(p){ p.pickup += 42; p.magnet += 1; }},
    {id:'tipper', icon:'◇', name:'Marth Tipper Clause', sub:'Far shots cut cleaner.', apply(p){ p.tipper += 1; p.crit += .04; }},
    {id:'pika', icon:'ϟ', name:'Tiny Thunder', sub:'Hits jump when bored.', apply(p){ p.chain += 1; }},
    {id:'gigi', icon:'🐾', name:'Gigi Management', sub:'The cat makes calls.', apply(p){ p.cat += 1; }},
    {id:'care', icon:'♡', name:'Helpful Furniture', sub:'Good objects glow harder.', apply(p){ p.care += 1; p.maxHp += 1; p.hp = Math.min(p.maxHp, p.hp+1); }},
    {id:'pulse', icon:'☉', name:'No-Moon Pulse', sub:'Right-tap hits wider.', apply(p){ p.pulseRadius += 45; p.pulseGain += .35; }},
    {id:'paper', icon:'▰', name:'Pocket Heart', sub:'A heart now. Sparks lean closer.', apply(p){ p.maxHp += 1; p.hp = Math.min(p.maxHp, p.hp+2); p.pickup += 34; }},
    {id:'knife', icon:'◆', name:'Glass Valentine', sub:'Hit harder. Bleed easier.', apply(p){ p.damage *= 1.34; p.maxHp = Math.max(2, p.maxHp-1); p.hp = Math.min(p.hp,p.maxHp); }},
    {id:'echo', icon:'↩', name:'Echo Wall', sub:'Walls remember your name.', apply(p){ p.bounce = (p.bounce||0) + 1; }},
    {id:'halo', icon:'◎', name:'Halo Drain', sub:'Closer kills feed the quiet.', apply(p){ p.haloDrain = (p.haloDrain||0) + 1; }}
  ];

  function defaultSave(){ return {version:VERSION, bestScore:0, bestRoom:0, runs:0, sparks:0, notices:[], codex:['thumbs'], sound:true, bestiary:{}, totalKills:0, totalRooms:0, shrine:{}, upgradePicks:{}}; }
  function loadSave(){ try{ return Object.assign(defaultSave(), JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')); }catch(e){ return defaultSave(); } }
  function saveNow(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state.save)); }catch(e){} }

  const state = {
    mode:'title', save:loadSave(), rng:Math.random, run:null, room:null,
    keys:Object.create(null), mouse:{x:0,y:0,down:false,seen:false},
    input:{moveTouch:{id:null,startX:0,startY:0,x:0,y:0,dx:0,dy:0,len:0,maxLen:0,startT:0,dashLatch:false,prevLen:0,prevT:0,speed:0,dashed:false,lastAngle:null}, aimTouch:{id:null,startX:0,startY:0,x:0,y:0,dx:0,dy:0,len:0,maxLen:0,startT:0,prevLen:0,prevT:0,speed:0,dashed:false,dashLatch:false,lastAngle:null}, suppressUntil:0},
    muted:false, lastWhisper:'', oldMode:'title'
  };
  state.muted = !state.save.sound;

  function makePlayer(){ return {
    x:750,y:650,vx:0,vy:0,r:20,aimX:1,aimY:0,face:0,
    hp:5,maxHp:5,shield:0,inv:0,hurt:0,
    speed:304,accel:24.5,stop:37.5,turn:30,lateral:13.5,
    fireDelay:.172,fireCd:0,damage:15,pulse:24,pulseGain:1,pulseRadius:305,
    dashCdBase:.43,dashCd:0,dashT:0,dashDur:.295,dashSpinDir:1,dashTrail:0,lastDashAngle:null,lastDashAt:0,
    pickup:104,magnet:0,split:0,tipper:0,crit:.03,chain:0,cat:0,care:0,badges:0,song:0,
    bounce:0,haloDrain:0,
    shots:0,dashes:0,stillT:0,aimT:0,roomHit:false,wasMoving:false,brakeT:0,lastSpeed:0,after:[]
  }; }

  function startRun(seedText=todaySeed()){
    const seed = hashString(String(seedText)+'|thumbprint|'+(state.save.runs||0));
    state.rng = mulberry32(seed);
    state.run = {seed, level:0, score:0, combo:1, comboT:0, kills:0, roomKills:0, upgrades:[], overdrive:false, observed:false, truth:false, streak:0, streakT:0};
    state.run.player = makePlayer();
    // Apply shrine bonuses
    const sh = state.save.shrine || {};
    for(const sd of shrineDefs){
      if(sh[sd.id] && sd.apply) sd.apply(state.run.player);
    }
    state.save.runs = (state.save.runs||0)+1;
    state.mode = 'play'; hideOverlay(); hideUpgrade(); hideShrine();
    // Headstart shrine
    if(sh['shrine_head']){
      nextRoom(); // room 1
      nextRoom(); // room 2 (headstart)
    } else {
      nextRoom();
    }
    whisper('two thumbs anywhere'); audio.ensure(); updateHUD(); saveNow();
  }

  function nextRoom(){
    const run=state.run; run.level += 1; run.roomKills = 0;
    const theme = themes[(run.level-1) % themes.length];
    state.room = makeRoom(run.level, theme);
    const p=run.player; p.x=state.room.w*.5; p.y=state.room.h*.66; p.vx=p.vy=0; p.inv=.9; p.roomHit=false; p.stillT=0; p.dashT=0; p.wasMoving=false; p.brakeT=0; p.after.length=0;
    hardClearTouchPads(); state.input.suppressUntil=performance.now()+160;
    camX=p.x-(W/viewScale)*.5; camY=p.y-(H/viewScale)*.5;
    if(run.level === 8 && !run.observed){ run.observed=true; addNotice(behaviorNotices.care); whisper('the room starts leaving useful things'); }
    if(run.level === 14 && !run.overdrive){ run.overdrive=true; addNotice(behaviorNotices.endless); whisper('no ceiling now'); }
  }

  function makeRoom(level, theme){
    const rng=state.rng;
    const room = {level,theme,w:1500,h:(mobile&&portrait?1480:1050),enemies:[],bullets:[],pickups:[],particles:[],floats:[],obstacles:[],decor:[],care:[],portals:[],cleared:false,clearT:0,time:0,spawnT:0};
    const decorCount = mobile ? 16 : 28;
    for(let i=0;i<decorCount;i++) room.decor.push({x:randR(70,room.w-70,rng),y:randR(70,room.h-70,rng),r:randR(4,18,rng),a:rng()*TAU,kind:pick(['spark','paper','cassette','leaf','stone'],rng)});
    const obsCount = mobile ? 3 : 5;
    for(let i=0;i<obsCount;i++){
      const x=randR(170,room.w-230,rng), y=randR(170,room.h-260,rng);
      if(dist(x,y,room.w*.5,room.h*.66)<260) continue;
      room.obstacles.push(rng()<.55?{type:'rect',x:x-55,y:y-40,w:110+rng()*110,h:80+rng()*50,r:18}:{type:'circle',x,y,rad:42+rng()*38});
    }
    if(level>=8 || theme.id==='kindness'){
      const n = Math.min(1 + Math.floor((state.run.player.care||0)/2), 3);
      for(let i=0;i<n;i++) room.care.push({x:randR(160,room.w-160,rng),y:randR(130,room.h-190,rng),r:34,used:false,kind:pick(['lamp','bench','umbrella','pie'],rng),phase:rng()*TAU});
    }
    if(level === 1){
      spawnEnemy(room,'moth', room.w*.5-190, room.h*.38, true);
      spawnEnemy(room,'receipt', room.w*.5+190, room.h*.38, true);
    } else if(level === 2){
      spawnEnemy(room,'charger', room.w*.5-240, room.h*.32, true);
      spawnEnemy(room,'receipt', room.w*.5, room.h*.30, true);
      spawnEnemy(room,'sludge', room.w*.5+240, room.h*.34, true);
    } else if(level === 3){
      spawnEnemy(room,'cart', room.w*.5-270, room.h*.34, true);
      spawnEnemy(room,'moth', room.w*.5, room.h*.30, true);
      spawnEnemy(room,'charger', room.w*.5+270, room.h*.34, true);
    } else if(level % 5 === 0){
      spawnEnemy(room,'boss', room.w*.5, 180, true);
      if(level>=10) spawnEnemy(room,'cart', room.w*.5-280, room.h*.36, true);
    } else {
      const pool=['moth','moth','receipt','charger'];
      if(level>2) pool.push('sludge','sludge');
      if(level>4) pool.push('cart');
      if(level>6) pool.push('mirror');
      if(level>7) pool.push('wraith');
      if(level>9) pool.push('moon');
      const n = clamp(5 + Math.floor(level*1.05) + Math.floor(rng()*3), 5, mobile?21:30);
      for(let i=0;i<n;i++) spawnEnemy(room,pick(pool,rng));
    }
    return room;
  }

  function randR(a,b,rng=state.rng){ return a + rng()*(b-a); }
  function edgeSpawn(room){
    const rng=state.rng, side=Math.floor(rng()*4);
    if(side===0) return {x:randR(70,room.w-70,rng),y:70};
    if(side===1) return {x:room.w-70,y:randR(70,room.h-70,rng)};
    if(side===2) return {x:randR(70,room.w-70,rng),y:room.h-70};
    return {x:70,y:randR(70,room.h-70,rng)};
  }
  function spawnEnemy(room,type,x=null,y=null,tame=false){
    const def=enemyDefs[type], pos=x==null?edgeSpawn(room):{x,y};
    const lv=room.level; const scale=(type==='boss'?1.6:1)*(1+lv*.075);
    const e={id:enemyId++,type,label:def.label||type,x:pos.x,y:pos.y,vx:0,vy:0,r:def.r,hp:def.hp*scale,maxHp:def.hp*scale,speed:def.speed*(1+Math.min(lv,20)*.018),score:def.score,color:def.color,phase:state.rng()*TAU,cd:.4+state.rng()*1.6,hit:0,tele:0,stun:0,tame,spin:state.rng()*TAU,ink:0};
    if(type==='boss'){ e.name = pick(['Backseat Driver','The Decorative Liability','The Refund Saint With Wheels','First Walker With Shoes'], state.rng); e.r=56; e.hp += lv*32; e.maxHp=e.hp; }
    if(!tame && type!=='boss' && state.rng()<Math.min(.04+lv*.01,.22)){ e.elite=true; e.hp*=1.55; e.maxHp=e.hp; e.r*=1.12; e.score=Math.floor(e.score*1.7); }
    room.enemies.push(e);
  }


  // ---------- input: No Moon-style two thumbs anywhere ----------
  function setPad(pad, touch){
    const now=performance.now(); pad.id=touch.identifier; pad.startX=touch.clientX; pad.startY=touch.clientY; pad.x=touch.clientX; pad.y=touch.clientY;
    pad.dx=pad.dy=0; pad.len=pad.maxLen=0; pad.prevLen=0; pad.startT=now; pad.prevT=now; pad.speed=0; pad.dashLatch=false; pad.dashed=false; pad.lastAngle=null;
  }
  function updatePad(pad, touch){
    const now=performance.now(), oldX=pad.x, oldY=pad.y, oldLen=pad.len||0;
    pad.x=touch.clientX; pad.y=touch.clientY;
    const dt=Math.max(1, now-(pad.prevT||now)); pad.speed=Math.hypot(pad.x-oldX,pad.y-oldY)/dt*1000; pad.prevT=now; pad.prevLen=oldLen;
    const dx=(pad.x-pad.startX)/70, dy=(pad.y-pad.startY)/70, l=Math.hypot(dx,dy);
    pad.len=Math.min(1,l); pad.maxLen=Math.max(pad.maxLen,pad.len);
    if(l>1){ pad.dx=dx/l; pad.dy=dy/l; } else { pad.dx=dx; pad.dy=dy; }
    if(pad.len>.08) pad.lastAngle=Math.atan2(pad.dy,pad.dx);
  }
  function clearPad(pad){ pad.id=null; pad.dx=pad.dy=pad.len=0; pad.maxLen=0; pad.speed=0; pad.dashed=false; }
  function hardClearPad(pad){ pad.id=null; pad.startX=pad.startY=pad.x=pad.y=0; pad.dx=pad.dy=pad.len=pad.maxLen=pad.prevLen=pad.speed=0; pad.dashLatch=false; pad.dashed=false; pad.lastAngle=null; }
  function hardClearTouchPads(){ hardClearPad(state.input.moveTouch); hardClearPad(state.input.aimTouch); }
  function assignTouch(touch){
    const left = touch.clientX < W*.5;
    if(left){
      if(state.input.moveTouch.id===null) setPad(state.input.moveTouch,touch);
      else if(state.input.aimTouch.id===null) setPad(state.input.aimTouch,touch);
    } else {
      if(state.input.aimTouch.id===null) setPad(state.input.aimTouch,touch);
      else if(state.input.moveTouch.id===null) setPad(state.input.moveTouch,touch);
    }
  }
  canvas.addEventListener('touchstart', e => {
    if(state.mode !== 'play') return;
    e.preventDefault(); audio.ensure();
    for(const t of e.changedTouches) assignTouch(t);
  }, {passive:false});
  canvas.addEventListener('touchmove', e => {
    if(state.mode !== 'play') return;
    e.preventDefault();
    for(const t of e.changedTouches){
      if(t.identifier===state.input.moveTouch.id) updatePad(state.input.moveTouch,t);
      if(t.identifier===state.input.aimTouch.id) updatePad(state.input.aimTouch,t);
    }
  }, {passive:false});
  function releaseTouches(list){
    for(const t of list){
      if(t.identifier===state.input.aimTouch.id){
        const pad=state.input.aimTouch, age=performance.now()-pad.startT;
        const tap = age < 260 && pad.maxLen < .22;
        const flick = age < 230 && pad.maxLen > .82 && (pad.speed > 620 || pad.len > .86) && !pad.dashed;
        if(flick) tryDash(pad.dx,pad.dy);
        else if(tap) tryPulse();
        clearPad(pad);
      }
      if(t.identifier===state.input.moveTouch.id){
        const pad=state.input.moveTouch, quick=performance.now()-pad.startT<230, flick=pad.maxLen>.80 && pad.speed>560;
        if(quick && flick && state.run?.player?.dashCd<=0) tryDash(pad.dx,pad.dy);
        clearPad(pad);
      }
    }
  }
  canvas.addEventListener('touchend', e => { if(state.mode!=='play') return; e.preventDefault(); releaseTouches(e.changedTouches); }, {passive:false});
  canvas.addEventListener('touchcancel', e => { if(state.mode!=='play') return; e.preventDefault(); releaseTouches(e.changedTouches); }, {passive:false});

  addEventListener('keydown', e => {
    const k=e.key.toLowerCase(); state.keys[k]=true;
    if(['arrowup','arrowdown','arrowleft','arrowright',' ','tab'].includes(k)) e.preventDefault();
    if(k==='enter' && state.mode==='title') startRun(todaySeed());
    if(k==='shift') tryDash();
    if(k==='e' || k==='x') tryPulse();
    if(k==='tab') toggleCodex();
    if(k==='u') toggleSound();
    if(k==='escape' || k==='p') togglePause();
  }, {passive:false});
  addEventListener('keyup', e => { state.keys[e.key.toLowerCase()]=false; }, {passive:true});
  canvas.addEventListener('pointermove', e => { if(coarse()) return; state.mouse.x=e.clientX; state.mouse.y=e.clientY; state.mouse.seen=true; }, {passive:true});
  canvas.addEventListener('pointerdown', e => { if(state.mode==='title'){ startRun(todaySeed()); return; } if(state.mode!=='play') return; audio.ensure(); if(!coarse()){ state.mouse.down=true; state.mouse.x=e.clientX; state.mouse.y=e.clientY; state.mouse.seen=true; if(e.button===2) tryPulse(); } }, {passive:false});
  addEventListener('pointerup', e => { if(e.button===0) state.mouse.down=false; }, {passive:true});
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  function getMoveInput(){
    let x=0,y=0; const k=state.keys;
    if(k.w||k.arrowup) y-=1; if(k.s||k.arrowdown) y+=1; if(k.a||k.arrowleft) x-=1; if(k.d||k.arrowright) x+=1;
    x += state.input.moveTouch.dx || 0; y += state.input.moveTouch.dy || 0;
    const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
    if(gp){ const gx=Math.abs(gp.axes[0])>.16?gp.axes[0]:0, gy=Math.abs(gp.axes[1])>.16?gp.axes[1]:0; x+=gx; y+=gy; if(gp.buttons[1]?.pressed) tryDash(); if(gp.buttons[3]?.pressed) tryPulse(); }
    const l=Math.hypot(x,y); if(l>1){ x/=l; y/=l; }
    return {x,y,active:l>.06,l:Math.min(1,l)};
  }
  function getAimInput(){
    const p=state.run?.player; if(!p) return {x:1,y:0,active:false,aiming:false};
    function nearest(){
      let best=null, bd=Infinity;
      if(state.room) for(const e of state.room.enemies){ const d=dist(p.x,p.y,e.x,e.y); if(e.hp>0 && d<bd && d<620){ best=e; bd=d; } }
      if(best){ const n=norm(best.x-p.x,best.y-p.y); return {x:n.x,y:n.y,hit:true}; }
      return {x:p.aimX,y:p.aimY,hit:false};
    }
    let ax=p.aimX, ay=p.aimY, firing=false, aiming=false;
    const pad=state.input.aimTouch, tl=Math.hypot(pad.dx,pad.dy);
    if(pad.id!==null){
      const age=performance.now()-pad.startT;
      if(tl>.18){ ax=pad.dx/(tl||1); ay=pad.dy/(tl||1); firing=true; aiming=true; }
      else if(age>115){ const n=nearest(); ax=n.x; ay=n.y; firing=true; aiming=n.hit; }
    }
    else if(state.mouse.seen){
      const wx=camX+state.mouse.x, wy=camY+state.mouse.y; const n=norm(wx-p.x,wy-p.y); if(n.m>8){ ax=n.x; ay=n.y; aiming=true; } firing=!!state.mouse.down;
    }
    if(state.keys[' '] || state.keys.z){ firing=true; if(!aiming){ const n=nearest(); ax=n.x; ay=n.y; aiming=n.hit; } }
    return {x:ax,y:ay,active:firing,aiming};
  }

  // ---------- audio ----------
  const audio = (() => {
    let ac=null, master=null, step=0, timer=0;
    function ensure(){ if(state.muted) return; if(!ac){ ac=new (window.AudioContext||window.webkitAudioContext)(); master=ac.createGain(); master.gain.value=.05; master.connect(ac.destination); timer=setInterval(tick,110); } if(ac.state==='suspended') ac.resume(); }
    function note(freq,dur=.06,type='sine',gain=.06,delay=0){ if(!ac||state.muted) return; const t=ac.currentTime+delay; const o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(freq,t); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(gain,t+.012); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+.05); }
    function noise(dur=.04,gain=.05){ if(!ac||state.muted) return; const len=Math.max(1,Math.floor(ac.sampleRate*dur)); const buf=ac.createBuffer(1,len,ac.sampleRate); const d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.6); const s=ac.createBufferSource(), g=ac.createGain(); s.buffer=buf; g.gain.value=gain; s.connect(g); g.connect(master); s.start(); }
    function tick(){ if(!ac||state.muted||state.mode!=='play'||!state.room) return; const th=state.room.theme; const root=th.id==='sludge'?110:th.id==='lake'?174.61:th.id==='arcade'?196:146.83; const scale=[0,3,5,7,10,12]; if(step%2===0) note(root*Math.pow(2,scale[(step/2)%scale.length]/12),.05,step%8?'sine':'triangle',.025); if(step%8===0) note(root/2,.16,'triangle',.022); step++; }
    function hit(kind){ ensure(); if(kind==='shot') note(520,.035,'triangle',.025); if(kind==='dash'){ noise(.035,.055); note(250,.04,'triangle',.05); } if(kind==='kill'){ note(600,.045,'sine',.05); note(900,.06,'sine',.035,.03); } if(kind==='hurt'){ noise(.09,.08); note(95,.13,'sawtooth',.045); } if(kind==='pulse'){ noise(.12,.08); note(110,.2,'triangle',.07); note(880,.18,'sine',.04,.05); } if(kind==='clear'){ note(392,.07,'sine',.055); note(588,.08,'sine',.045,.06); note(784,.1,'sine',.035,.12); } if(kind==='care'){ note(330,.12,'sine',.05); note(495,.16,'sine',.04,.08); } }
    function mute(m){ state.muted=m; if(master) master.gain.value=m?0:.05; }
    return {ensure,hit,mute};
  })();
  function haptic(ms=18){ try{ if(navigator.vibrate && coarse()) navigator.vibrate(ms); }catch(e){} }
  function tactilePause(ms){ if(!reduced()) hitPause = Math.max(hitPause, ms / 1000); }

  // ---------- gameplay ----------
  function update(dtRaw){
    const raw = Math.min(.05, dtRaw);
    slowMo=Math.max(0,slowMo-raw); hitPause=Math.max(0,hitPause-raw); shake=Math.max(0,shake-raw*2.25); flash=Math.max(0,flash-raw*1.7);
    if(!state.run || !state.room || state.mode==='title') return;
    if(state.mode==='upgrade' || state.mode==='codex' || state.mode==='dead' || state.mode==='pause' || state.mode==='shrine'){ updateParticles(state.room,raw); return; }
    if(hitPause>0){ updateParticles(state.room, raw*.55); updateHUD(); return; }
    const dt = Math.min(.033, raw) * (slowMo>0 ? .55 : 1);
    const room=state.room, p=state.run.player; room.time += raw;
    const move=getMoveInput(), aim=getAimInput();
    p.aimX=aim.x; p.aimY=aim.y; p.face=Math.atan2(p.aimY,p.aimX);
    if(aim.aiming) p.aimT += raw;
    if(aim.active && p.fireCd<=0) firePlayer(p, p.aimX, p.aimY);
    const mpad=state.input.moveTouch, apad=state.input.aimTouch;
    if(performance.now()>=(state.input.suppressUntil||0) && mpad.id!==null && mpad.len>.80 && p.dashCd<=0 && move.active){
      const a=Math.atan2(move.y,move.x);
      const changed=p.lastDashAngle==null||Math.abs(angleDiff(a,p.lastDashAngle))>.38;
      const newFromNeutral=(mpad.prevLen||0)<.55 && mpad.len>.82;
      const newShove=mpad.speed>860||(mpad.speed>520 && mpad.len>(mpad.prevLen||0)+.11);
      if((!mpad.dashLatch && (newFromNeutral||newShove))||changed||newShove){ tryDash(move.x,move.y); mpad.dashLatch=true; }
    }
    if(mpad.len<.56) mpad.dashLatch=false;
    if(performance.now()>=(state.input.suppressUntil||0) && apad.id!==null && apad.len>.82 && p.dashCd<=0 && !apad.dashLatch){
      const age=performance.now()-apad.startT;
      if(age<230 && apad.speed>920){ tryDash(apad.dx,apad.dy); apad.dashLatch=true; apad.dashed=true; }
    }
    if(apad.len<.48) apad.dashLatch=false;
    updatePlayer(p,move,room,dt);
    updateEnemies(room,p,dt);
    updateBullets(room,p,dt);
    updatePickups(room,p,dt);
    updateCare(room,p,dt);
    updateParticles(room,raw);
    updatePortals(room,p,raw);
    updateBehavior(room,p,move,aim,raw);
    state.run.comboT=Math.max(0,state.run.comboT-raw); if(state.run.comboT<=0) state.run.combo=damp(state.run.combo,1,3,raw);
    if(state.run.streakT>0){ state.run.streakT=Math.max(0,state.run.streakT-raw); if(state.run.streakT<=0) state.run.streak=0; }
    if(!room.cleared && room.enemies.every(e=>e.hp<=0)) clearRoom();
    updateHUD();
  }

  function dashSpinPhase(p){
    if(!p || p.dashT<=0) return 0;
    return (1-clamp(p.dashT/(p.dashDur||.001),0,1))*TAU*(p.dashSpinDir||1);
  }

  function updatePlayer(p,move,room,dt){
    p.inv=Math.max(0,p.inv-dt); p.hurt=Math.max(0,p.hurt-dt); p.fireCd=Math.max(0,p.fireCd-dt); p.dashCd=Math.max(0,p.dashCd-dt); p.dashT=Math.max(0,p.dashT-dt); p.brakeT=Math.max(0,p.brakeT-dt); p.pulse=Math.min(100,p.pulse+dt*(4.8+p.pulseGain*1.15));
    const beforeSpeed=Math.hypot(p.vx,p.vy);
    const analog = clamp(move.l,0,1);
    const desiredX=move.x*p.speed*(.58+.42*analog), desiredY=move.y*p.speed*(.58+.42*analog);
    if(move.active){
      const inLen=Math.hypot(move.x,move.y)||1, ix=move.x/inLen, iy=move.y/inLen;
      const alignment=beforeSpeed>1?(p.vx*ix+p.vy*iy)/beforeSpeed:1;
      const reverse=clamp(-alignment,0,1);
      const turnPressure=clamp((1-alignment)*.55,0,1);
      const response=p.accel + p.turn*turnPressure + 7.5*reverse;
      p.vx=damp(p.vx,desiredX,response,dt); p.vy=damp(p.vy,desiredY,response,dt);
      const px=-iy, py=ix; const lateral=p.vx*px+p.vy*py;
      const lf=1-Math.exp(-p.lateral*(.42+turnPressure*.7)*dt); p.vx-=px*lateral*lf; p.vy-=py*lateral*lf;
      if(!p.wasMoving && beforeSpeed<35 && room.particles.length<budget()){
        for(let i=0;i<5;i++) particle(room,p.x,p.y,room.theme.a,rand(-70,70),rand(-70,70),.18,2+Math.random()*2);
      }
    } else {
      if(p.wasMoving && beforeSpeed>118 && p.brakeT<=0 && !reduced()){
        p.brakeT=.12;
        const back=norm(-p.vx,-p.vy);
        for(let i=0;i<8 && room.particles.length<budget();i++) particle(room,p.x-back.x*8,p.y-back.y*8,room.theme.c,back.x*rand(80,190)+rand(-40,40),back.y*rand(80,190)+rand(-40,40),.20,2+Math.random()*2.5);
      }
      const brake=p.stop + Math.min(13,beforeSpeed/65);
      p.vx=damp(p.vx,0,brake,dt); p.vy=damp(p.vy,0,brake,dt); if(Math.hypot(p.vx,p.vy)<7){p.vx=0;p.vy=0;}
    }
    const maxV=p.speed*(p.dashT>0?4.65:1.055); let sp=Math.hypot(p.vx,p.vy); if(sp>maxV){ p.vx=p.vx/sp*maxV; p.vy=p.vy/sp*maxV; sp=maxV; }
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.x=clamp(p.x,38,room.w-38); p.y=clamp(p.y,38,room.h-38); for(const o of room.obstacles) resolveCircleObstacle(p,o);
    if(sp>44 && !reduced() && room.particles.length<budget()) room.particles.push({kind:'trail',x:p.x-p.vx*.03,y:p.y-p.vy*.03,vx:-p.vx*.055,vy:-p.vy*.055,r:9+sp*.026,life:p.dashT>0?.13:.16,max:p.dashT>0?.13:.16,color:p.dashT>0?room.theme.c:room.theme.a});
    p.after.unshift({x:p.x,y:p.y,face:p.face,spin:dashSpinPhase(p),life:p.dashT>0?.13:.16}); if(p.after.length>(mobile?6:9)) p.after.pop(); for(let i=p.after.length-1;i>=0;i--){p.after[i].life-=dt; if(p.after[i].life<=0) p.after.splice(i,1);}
    p.wasMoving=move.active; p.lastSpeed=sp;
  }

  function tryDash(dx=null,dy=null){
    if(state.mode!=='play'||!state.run) return; const p=state.run.player; if(p.dashCd>0) return;
    if(dx==null){ const m=getMoveInput(); if(m.active){dx=m.x;dy=m.y;} else {dx=p.aimX;dy=p.aimY;} }
    const n=norm(dx,dy); if(n.m<.08) return;
    const a=Math.atan2(n.y,n.x); p.lastDashAngle=a; p.lastDashAt=performance.now();
    p.vx=n.x*1325; p.vy=n.y*1325; p.dashDur=.295; p.dashT=p.dashDur; p.dashSpinDir=(n.x*p.aimY-n.y*p.aimX)>=0?1:-1; p.inv=Math.max(p.inv,.36); p.dashCd=p.dashCdBase; p.dashes++;
    audio.hit('dash'); haptic(14); tactilePause(5); shake=Math.max(shake,.075);
    const room=state.room; for(let i=0;i<28;i++) particle(room,p.x-n.x*10,p.y-n.y*10,room.theme.c,rand(-n.x*420-90,-n.x*150+90),rand(-n.y*420-90,-n.y*150+90),.32,2+Math.random()*3.8);
    for(const e of room.enemies){ const d=dist(p.x,p.y,e.x,e.y); if(d<124+e.r+p.dashTrail*20){ const k=norm(e.x-p.x,e.y-p.y); damageEnemy(e,p.damage*(.55+.18*Math.max(1,p.dashTrail)),k.x*390,k.y*390,'dash'); } }
  }

  function firePlayer(p,ax,ay){
    const room=state.room; p.fireCd=p.fireDelay; p.shots++; audio.hit('shot'); if(room.particles.length<budget()) for(let i=0;i<3;i++) particle(room,p.x+ax*26,p.y+ay*26,room.theme.a,ax*rand(90,180)+rand(-25,25),ay*rand(90,180)+rand(-25,25),.16,1.8+Math.random()*1.5);
    const damage=p.damage*(Math.random()<p.crit+p.tipper*.025?1.8:1);
    spawnBullet(room,'player',p.x+ax*24,p.y+ay*24,ax*620,ay*620,5.2,damage,1.4,room.theme.a);
    if(p.split){ for(let s=-1;s<=1;s+=2){ const a=Math.atan2(ay,ax)+s*(.18+.04*Math.min(p.split,4)); spawnBullet(room,'player',p.x+ax*21,p.y+ay*21,Math.cos(a)*560,Math.sin(a)*560,4.3,damage*(.42+.05*p.split),1.15,room.theme.b); } }
    if(p.chain && p.shots%(5-Math.min(3,p.chain))===0) chainFrom(p.x,p.y,p.damage*.58);
  }

  function chainFrom(x,y,damage){
    const room=state.room; let best=null,bd=Infinity; for(const e of room.enemies){ const d=dist(x,y,e.x,e.y); if(d<bd && d<390){best=e; bd=d;} }
    if(best){ damageEnemy(best,damage,rand(-80,80),rand(-80,80),'chain'); room.floats.push({x:best.x,y:best.y-26,text:'ϟ',life:.5,color:room.theme.c}); for(let i=0;i<8;i++) particle(room,x,y,room.theme.c,(best.x-x)*rand(1,3),(best.y-y)*rand(1,3),.25,2); }
  }

  function tryPulse(){
    if(state.mode!=='play'||!state.run) return; const p=state.run.player;
    if(p.pulse<100){ haptic(8); whisper('pulse hungry'); return; }
    const room=state.room; p.pulse=0; flash=.75; slowMo=.42; shake=.42; tactilePause(38); audio.hit('pulse'); haptic(42);
    for(const b of room.bullets) if(b.owner==='enemy') b.life=Math.min(b.life,.08);
    for(const e of room.enemies.slice()){ const d=dist(p.x,p.y,e.x,e.y); if(d<p.pulseRadius+e.r){ const k=norm(e.x-p.x,e.y-p.y); damageEnemy(e,p.damage*(2.2+p.pulseGain*.5),k.x*420,k.y*420,'pulse'); } }
    for(let i=0;i<70 && room.particles.length<budget();i++){ const a=Math.random()*TAU, r=Math.random()*p.pulseRadius; particle(room,p.x,p.y,room.theme.c,Math.cos(a)*r*3,Math.sin(a)*r*3,.65,2+Math.random()*4); }
  }

  function resolveCircleObstacle(ent,o){
    if(o.type==='circle'){ const n=norm(ent.x-o.x,ent.y-o.y), min=ent.r+o.rad; if(n.m<min){ const push=min-n.m; ent.x+=n.x*push; ent.y+=n.y*push; ent.vx+=n.x*push*5; ent.vy+=n.y*push*5; } return; }
    const nx=clamp(ent.x,o.x,o.x+o.w), ny=clamp(ent.y,o.y,o.y+o.h); const n=norm(ent.x-nx,ent.y-ny); if(n.m<ent.r){ const push=ent.r-n.m; ent.x+=n.x*push; ent.y+=n.y*push; ent.vx+=n.x*push*5; ent.vy+=n.y*push*5; }
  }

  function updateEnemies(room,p,dt){
    const danger=Math.min(8,Math.floor(room.level/2));
    for(let i=room.enemies.length-1;i>=0;i--){
      const e=room.enemies[i]; if(e.hp<=0){ room.enemies.splice(i,1); continue; }
      e.phase+=dt; e.spin+=dt*(e.type==='cart'?3.2:.8); e.cd-=dt; e.hit=Math.max(0,e.hit-dt); e.stun=Math.max(0,e.stun-dt); e.tele=Math.max(0,e.tele-dt); e.ink=Math.max(0,(e.ink||0)-dt);
      const to=norm(p.x-e.x,p.y-e.y); let ax=0,ay=0;
      if(e.stun<=0){
        if(e.type==='moth'){
          const fired = p.fireCd>p.fireDelay*.55 ? 1.22 : 1;
          const patient = p.stillT>.55 ? -.42 : 1;
          ax=to.x*e.speed*fired*patient+Math.cos(e.phase*4.0)*54;
          ay=to.y*e.speed*fired*patient+Math.sin(e.phase*3.3)*54;
        }
        else if(e.type==='receipt'){
          const want=to.m<245?-1:to.m>455?1:0;
          ax=to.x*e.speed*want+Math.cos(e.phase*1.8)*66;
          ay=to.y*e.speed*want+Math.sin(e.phase*2.2)*54;
          if(e.cd<=0&&to.m<790){
            e.cd=1.02+state.rng()*.48;
            const base=Math.atan2(to.y,to.x);
            for(let k=-1;k<=1;k++) if(k===0 || room.level>4){ const a=base+k*.12; shootEnemy(room,e,Math.cos(a),Math.sin(a),250+room.level*7,5.6,2.55,e.color); }
          }
        }
        else if(e.type==='sludge'){
          ax=to.x*e.speed+Math.sin(e.phase*.9)*38; ay=to.y*e.speed+Math.cos(e.phase*.7)*38;
          if(e.cd<=0&&to.m<580){ e.cd=1.55+state.rng()*.75; e.ink=.38; spawnBullet(room,'enemy',e.x,e.y,0,0,38,1,2.55,e.color,true); }
        }
        else if(e.type==='charger'){
          if(e.tele>0){ ax=ay=0; }
          else if(e.cd<=0&&to.m<720){ e.tele=.52; e.cd=1.85+state.rng()*.85; e.chargeX=to.x; e.chargeY=to.y; room.floats.push({x:e.x,y:e.y-e.r-12,text:'LANE',life:.42,color:room.theme.bad}); }
          else if(e.chargeX && e.tele<=.02){ e.vx+=e.chargeX*910; e.vy+=e.chargeY*910; e.chargeX=e.chargeY=0; }
          ax+=to.x*e.speed*.42; ay+=to.y*e.speed*.42;
        }
        else if(e.type==='cart'){
          if(!e.awake){ e.awake=true; const a=Math.atan2(to.y,to.x)+rand(-.4,.4); e.vx=Math.cos(a)*e.speed*2.25; e.vy=Math.sin(a)*e.speed*2.25; }
          ax=to.x*e.speed*.34+Math.cos(e.phase*3.7)*74;
          ay=to.y*e.speed*.34+Math.sin(e.phase*4.4)*74;
          if(e.cd<=0&&to.m<650){ e.cd=1.35+state.rng()*.65; const base=Math.atan2(to.y,to.x); for(let k=-1;k<=1;k+=2){ const a=base+k*.28; shootEnemy(room,e,Math.cos(a),Math.sin(a),210+room.level*4,5.2,2.25,'#7dfdff'); } }
        }
        else if(e.type==='moon'){
          const orbit=Math.atan2(e.y-p.y,e.x-p.x)+Math.PI/2; const want=to.m<330?-1:to.m>540?1:.05; ax=to.x*e.speed*want+Math.cos(orbit)*92; ay=to.y*e.speed*want+Math.sin(orbit)*92;
          if(e.cd<=0&&to.m<840){ e.cd=Math.max(.88,1.65-room.level*.03); const count=room.level>12?6:4; for(let k=0;k<count;k++){ const a=Math.atan2(to.y,to.x)+(k-(count-1)/2)*.24; shootEnemy(room,e,Math.cos(a),Math.sin(a),215+room.level*6,6.4,2.9); } }
        }
        else if(e.type==='mirror'){
          const orbit=Math.atan2(e.y-p.y,e.x-p.x)-Math.PI/2; ax=to.x*e.speed*.78+Math.cos(orbit)*78; ay=to.y*e.speed*.78+Math.sin(orbit)*78;
          if(e.cd<=0&&to.m<650){ e.cd=1.08+state.rng()*.46; const a=Math.atan2(p.aimY,p.aimX)+Math.PI; shootEnemy(room,e,Math.cos(a),Math.sin(a),340,5.8,2.45,'#bd93ff'); }
        } else if(e.type==='wraith'){
          const vis = Math.sin(e.phase*1.6);
          e.wrVis = vis > 0.3 ? 1 : 0;
          if(e.wrVis){
            // Visible: slow orbit, lunge when close
            const orbit=Math.atan2(e.y-p.y,e.x-p.x)+Math.PI/2;
            ax=Math.cos(orbit)*e.speed*.6+to.x*e.speed*.35;
            ay=Math.sin(orbit)*e.speed*.6+to.y*e.speed*.35;
            if(to.m<180){ ax+=to.x*e.speed*1.4; ay+=to.y*e.speed*1.4; }
          } else {
            // Invisible: fast rush + trail particles
            ax=to.x*e.speed*1.7; ay=to.y*e.speed*1.7;
            if(room.particles.length<budget() && Math.random()<.35) particle(room,e.x+rand(-8,8),e.y+rand(-8,8),'#8866cc55',rand(-30,30),rand(-30,30),.22,2+Math.random()*2);
          }
        } else if(e.type==='boss'){
          ax=to.x*e.speed+Math.cos(e.phase*.9)*68; ay=to.y*e.speed+Math.sin(e.phase*.75)*68;
          if(e.cd<=0){
            e.cd=Math.max(.72,1.75-room.level*.04); const count=8+(danger>4?4:0); const offset=e.phase*.45;
            for(let k=0;k<count;k++){ const a=k*TAU/count+offset; shootEnemy(room,e,Math.cos(a),Math.sin(a),190+room.level*6,6.4,3.2,e.color); }
            if(room.level>5 && room.enemies.length<(mobile?24:34)) spawnEnemy(room,pick(['moth','receipt','sludge','charger','cart'],state.rng));
          }
        }
        e.vx=damp(e.vx,ax,e.type==='cart'?1.25:2.8,dt); e.vy=damp(e.vy,ay,e.type==='cart'?1.25:2.8,dt);
      }
      e.x+=e.vx*dt; e.y+=e.vy*dt;
      if(e.type==='cart'){
        if(e.x<44 || e.x>room.w-44){ e.vx*=-.92; e.x=clamp(e.x,44,room.w-44); e.cd=Math.min(e.cd,.34); }
        if(e.y<44 || e.y>room.h-44){ e.vy*=-.92; e.y=clamp(e.y,44,room.h-44); e.cd=Math.min(e.cd,.34); }
      } else { e.x=clamp(e.x,34,room.w-34); e.y=clamp(e.y,34,room.h-34); }
      e.vx*=Math.pow(e.type==='cart'?.93:.86,dt*60); e.vy*=Math.pow(e.type==='cart'?.93:.86,dt*60);
      for(const o of room.obstacles) resolveCircleObstacle(e,o);
      if(p.inv<=0 && dist(e.x,e.y,p.x,p.y)<e.r+p.r && !(e.type==='wraith' && !e.wrVis)){ hurtPlayer(p,e.type==='boss'?2:1,e.x,e.y); }
    }
  }

  function spawnBullet(room,owner,x,y,vx,vy,r,damage,life,color,puddle=false){
    const cap=owner==='enemy'?(mobile?110:170):(mobile?90:160); let count=0; for(const b of room.bullets) if(b.owner===owner) count++; if(count>cap) return;
    const bounces = owner==='player' && state.run?.player?.bounce ? state.run.player.bounce : 0;
    room.bullets.push({owner,x,y,vx,vy,r,damage,life,max:life,color,puddle,bounces});
  }
  function shootEnemy(room,e,dx,dy,spd,r,life,color=e.color){ spawnBullet(room,'enemy',e.x+dx*e.r,e.y+dy*e.r,dx*spd,dy*spd,r,1,life,color,false); }

  function updateBullets(room,p,dt){
    for(let i=room.bullets.length-1;i>=0;i--){
      const b=room.bullets[i]; b.life-=dt;
      if(b.owner==='player' && !b.puddle){
        let best=null,bd=Infinity, sp=Math.hypot(b.vx,b.vy)||1;
        for(const e of room.enemies){
          if(e.hp<=0) continue; const d=dist(b.x,b.y,e.x,e.y);
          if(d<bd && d<420){ const dot=((e.x-b.x)*b.vx+(e.y-b.y)*b.vy)/(Math.max(1,d)*sp); if(dot>.18){ best=e; bd=d; } }
        }
        if(best){ const n=norm(best.x-b.x,best.y-b.y); b.vx=damp(b.vx,n.x*sp,8.5,dt); b.vy=damp(b.vy,n.y*sp,8.5,dt); }
      }
      if(!b.puddle){ b.x+=b.vx*dt; b.y+=b.vy*dt; }
      if(b.owner==='enemy' && p.magnet && b.r<=7 && dist(b.x,b.y,p.x,p.y)<70+p.magnet*18){ b.life=0; p.pulse=Math.min(100,p.pulse+2.6); particle(room,b.x,b.y,room.theme.a,rand(-60,60),rand(-60,60),.25,3); }
      if(b.owner==='player' && b.bounces>0 && !b.puddle){
        if(b.x<0 || b.x>room.w){ b.vx*=-1; b.x=clamp(b.x,0,room.w); b.bounces--; }
        if(b.y<0 || b.y>room.h){ b.vy*=-1; b.y=clamp(b.y,0,room.h); b.bounces--; }
      }
      if(b.life<=0 || b.x<-80 || b.y<-80 || b.x>room.w+80 || b.y>room.h+80){ room.bullets.splice(i,1); continue; }
      if(b.owner==='player'){
        for(const e of room.enemies){ if(e.hp>0 && dist(b.x,b.y,e.x,e.y)<b.r+e.r){ const k=norm(e.x-b.x,e.y-b.y); damageEnemy(e,b.damage,k.x*120,k.y*120,'shot'); b.life=0; break; } }
      } else if(p.inv<=0 && dist(b.x,b.y,p.x,p.y)<b.r+p.r){ room.bullets.splice(i,1); hurtPlayer(p,b.damage,b.x,b.y); continue; }
      if(b.life<=0){ room.bullets.splice(i,1); continue; }
    }
  }

  function damageEnemy(e,dmg,kx=0,ky=0,kind='hit'){
    if(e.hp<=0) return; e.hp-=dmg; e.vx+=kx; e.vy+=ky; e.hit=.11; e.stun=Math.max(e.stun,.032);
    const room=state.room; const pause = kind==='pulse'?30:kind==='dash'?18:kind==='chain'?16:10; tactilePause(pause); shake=Math.max(shake, kind==='pulse'?.16:kind==='dash'?.09:.035);
    if(kind==='pulse' && room.floats.length<28) room.floats.push({x:e.x+rand(-6,6),y:e.y-e.r-8,text:'PULSE',life:.34,color:room.theme.c});
    for(let i=0;i<4 && room.particles.length<budget();i++) particle(room,e.x,e.y,kind==='pulse'?room.theme.c:e.color,rand(-90,90)+kx*.08,rand(-90,90)+ky*.08,.22,2+Math.random()*2.4);
    if(e.hp<=0) killEnemy(e);
  }

  function killEnemy(e){
    const room=state.room, run=state.run, p=run.player; e.hp=0; run.kills++; run.roomKills++; run.combo=Math.min(12,run.combo+(e.type==='boss'?.9:.14)); run.comboT=2.6; const score=Math.floor(e.score*run.combo*(run.overdrive?1.35:1)); run.score+=score; p.pulse=Math.min(100,p.pulse+(e.type==='boss'?18:5.2)*p.pulseGain);
    // Halo Drain: close kills feed extra pulse
    if(p.haloDrain>0){ const d=dist(p.x,p.y,e.x,e.y); if(d<180) p.pulse=Math.min(100,p.pulse+12+p.haloDrain*6); }
    const n=e.type==='boss'?24:(e.elite?8:3+Math.floor(Math.random()*3)); for(let i=0;i<n;i++) room.pickups.push({type:'spark',x:e.x+rand(-12,12),y:e.y+rand(-12,12),vx:rand(-120,120),vy:rand(-120,120),r:6,life:8,value:4});
    if((e.type==='boss'||Math.random()<.035) && p.hp<p.maxHp) room.pickups.push({type:'heart',x:e.x,y:e.y,vx:rand(-80,80),vy:rand(-80,80),r:11,life:8});
    for(let i=0;i<(e.type==='boss'?42:13) && room.particles.length<budget();i++) particle(room,e.x,e.y,e.color,rand(-170,170),rand(-170,170),.5,2+Math.random()*4);
    if(Math.random()<.16) room.floats.push({x:e.x,y:e.y-40,text:pick(['NOPE','BONK','REFUND','LANE CLOSED','CART TAX','BAD IDEA'],state.rng),life:.46,color:room.theme.c});
    // Kill streak
    run.streak++; run.streakT=0.8;
    if(run.streak<streakNames.length && streakNames[run.streak]) room.floats.push({x:e.x,y:e.y-58,text:streakNames[run.streak],life:.72,color:room.theme.c,big:true});
    // Bestiary tracking
    if(!state.save.bestiary[e.type]) state.save.bestiary[e.type]=0;
    state.save.bestiary[e.type]++;
    state.save.totalKills=(state.save.totalKills||0)+1;
    tactilePause(e.type==='boss'?58:24); shake=Math.max(shake,e.type==='boss'?.26:.10); audio.hit('kill');
  }

  function hurtPlayer(p,amount,sx,sy){
    if(p.inv>0 || state.mode!=='play') return; if(p.shield>0){ p.shield--; amount=0; }
    p.hp-=amount; p.roomHit=true; p.inv=.92; p.hurt=.34; shake=.46; flash=.32; tactilePause(72); audio.hit('hurt'); haptic(48); const k=norm(p.x-sx,p.y-sy); p.vx+=k.x*370; p.vy+=k.y*370; for(let i=0;i<20;i++) particle(state.room,p.x,p.y,state.room.theme.bad,rand(-140,140),rand(-140,140),.45,2+Math.random()*4);
    if(p.hp<=0) die();
  }

  function updatePickups(room,p,dt){
    for(let i=room.pickups.length-1;i>=0;i--){
      const q=room.pickups[i]; q.life-=dt; const d=dist(q.x,q.y,p.x,p.y); if(d<p.pickup+q.r){ const k=norm(p.x-q.x,p.y-q.y); q.vx+=k.x*780*dt; q.vy+=k.y*780*dt; }
      q.x+=q.vx*dt; q.y+=q.vy*dt; q.vx*=Math.pow(.18,dt); q.vy*=Math.pow(.18,dt);
      if(d<p.r+q.r+6){ if(q.type==='spark'){ state.run.score+=Math.floor(18*state.run.combo); state.run.player.pulse=Math.min(100,p.pulse+2.1*p.pulseGain); state.save.sparks=(state.save.sparks||0)+(q.value||4); } else { p.hp=Math.min(p.maxHp,p.hp+1); audio.hit('care'); } room.pickups.splice(i,1); continue; }
      if(q.life<=0) room.pickups.splice(i,1);
    }
  }

  function updateCare(room,p,dt){
    for(const c of room.care){ c.phase+=dt; if(!c.used && dist(c.x,c.y,p.x,p.y)<c.r+p.r+10){ c.used=true; p.hp=Math.min(p.maxHp,p.hp+(c.kind==='pie'?2:1)); p.shield=Math.min(3,p.shield+1); p.pulse=Math.min(100,p.pulse+22); audio.hit('care'); haptic(25); addNotice(behaviorNotices.care); whisper(c.kind==='pie'?'pie on the sill':'something helped'); for(let i=0;i<34;i++) particle(room,c.x,c.y,room.theme.c,rand(-160,160),rand(-160,160),.65,2+Math.random()*4); } }
  }

  function updatePortals(room,p,dt){
    if(!room.portals.length) return; room.clearT=Math.max(0,room.clearT-dt); for(const po of room.portals){ po.t+=dt; if(room.clearT<=0 && dist(po.x,po.y,p.x,p.y)<po.r+p.r){ chooseUpgrade(); return; } }
  }

  function updateBehavior(room,p,move,aim,dt){
    if(p.hp<=1 && !state.run.lowhp){ state.run.lowhp=true; addNotice(behaviorNotices.lowhp); whisper('the sharp furniture moves'); }
    if(!move.active && !aim.active && room.enemies.length>0) p.stillT+=dt; else p.stillT=0;
    if(p.stillT>2.5 && !state.run.still){ state.run.still=true; addNotice(behaviorNotices.still); p.pulse=Math.min(100,p.pulse+18); whisper('quiet counted'); }
    if(p.dashes>=10 && !state.run.dashNotice){ state.run.dashNotice=true; addNotice(behaviorNotices.dash); }
    if(p.aimT>16 && !state.run.aimNotice){ state.run.aimNotice=true; addNotice(behaviorNotices.aim); }
  }

  function clearRoom(){
    const room=state.room, run=state.run, p=run.player; room.cleared=true; room.clearT=.5; room.bullets.length=0;
    state.save.totalRooms=(state.save.totalRooms||0)+1;
    const line = room.level===13 && !run.truth ? behaviorNotices.room13 : clearLines[(room.level-1)%clearLines.length];
    if(room.level===13 && !run.truth){ run.truth=true; addNotice(line); whisper('the road was watching your hands'); }
    else { addNotice(line); whisper(line); }
    if(!p.roomHit){ run.score += Math.floor(400*run.combo); if(!run.nohitNotice){ run.nohitNotice=true; addNotice(behaviorNotices.nohit); } }
    run.score += Math.floor((300+room.level*82)*run.combo); audio.hit('clear'); haptic(35); room.portals.push({x:room.w*.5,y:room.h*.20,r:55,t:0});
    for(let i=0;i<40 && room.particles.length<budget();i++){ const a=i/40*TAU, rr=rand(40,190); particle(room,room.w*.5,room.h*.20,room.theme.c,Math.cos(a)*rr*2,Math.sin(a)*rr*2,.75,2+Math.random()*4); }
  }

  function startTransition(){
    const nextTheme = themes[(state.run.level) % themes.length];
    state.mode='transition'; transition.active=true; transition.timer=0; transition.text=nextTheme.name;
    transition.callback=()=>{ nextRoom(); state.mode='play'; };
  }

  function drawTransition(){
    const p=transition.timer/transition.duration;
    if(p<0.28){
      // Fade out
      const a=p/0.28;
      ctx.fillStyle=`rgba(5,3,10,${a})`;
      ctx.fillRect(0,0,W,H);
    } else if(p<0.72){
      // Show text on black
      ctx.fillStyle='#05030a'; ctx.fillRect(0,0,W,H);
      const textA=Math.min(1,(p-0.28)/0.1)*Math.min(1,(0.72-p)/0.1);
      ctx.save(); ctx.globalAlpha=textA; ctx.textAlign='center'; ctx.fillStyle='#fff7ff';
      ctx.font='900 clamp(24px,5vw,52px) system-ui,sans-serif';
      ctx.font='900 42px system-ui,sans-serif';
      ctx.fillText(transition.text,W*.5,H*.5);
      ctx.font='800 16px system-ui,sans-serif'; ctx.fillStyle='#cabee0';
      ctx.fillText('room '+(state.run.level+1),W*.5,H*.5+36);
      ctx.restore();
    } else {
      // Fade in
      const a=1-(p-0.72)/0.28;
      ctx.fillStyle=`rgba(5,3,10,${a})`;
      ctx.fillRect(0,0,W,H);
    }
  }

  function chooseUpgrade(){
    state.mode='upgrade'; const p=state.run.player, rng=state.rng; const count=p.badges>=2?4:3; const pool=upgradeDefs.slice(); const choices=[]; while(choices.length<count && pool.length){ choices.push(pool.splice(Math.floor(rng()*pool.length),1)[0]); }
    ui.upgradeTitle.textContent = state.run.level===13 ? 'Pick what survives.' : 'Pick what changes.';
    ui.upgradeCards.innerHTML='';
    for(const u of choices){ const b=document.createElement('button'); b.className='upgradeCard'; b.innerHTML=`<div class="uIcon">${html(u.icon)}</div><b>${html(u.name)}</b><p>${html(u.sub)}</p>`; b.onclick=()=>{ u.apply(p); state.run.upgrades.push(u.id); if(!state.save.upgradePicks) state.save.upgradePicks={}; state.save.upgradePicks[u.id]=(state.save.upgradePicks[u.id]||0)+1; hideUpgrade(); state.mode='play'; nextRoom(); saveNow(); }; ui.upgradeCards.appendChild(b); }
    ui.upgrade.classList.add('show');
  }

  function die(){
    const run=state.run; state.mode='dead'; state.save.bestScore=Math.max(state.save.bestScore||0,Math.floor(run.score)); state.save.bestRoom=Math.max(state.save.bestRoom||0,run.level); saveNow();
    showOverlay('The boon boots remain.', `Score ${Math.floor(run.score).toLocaleString()} · Room ${run.level}.\n${pick(['A shopping cart wrote your obituary in magenta crayon. The wheel squeaked during the eulogy.','You were killed by a sentence with too much confidence.','The road writes TRY AGAIN on a receipt and refuses to itemize the grief.'])}`, [['Run it back',()=>startRun(todaySeed())],['Random run',()=>startRun(Date.now())],['Codex',()=>toggleCodex(true)],['Shrine',()=>showShrine()]]);
  }

  function particle(room,x,y,color,vx,vy,life=.45,r=3){ if(!room || room.particles.length>budget()) return; room.particles.push({x,y,vx,vy,life,max:life,r,color}); }
  function budget(){ return mobile?150:260; }

  function addNotice(text){ if(!text) return; if(!state.save.notices.includes(text)) state.save.notices.push(text); state.save.notices=state.save.notices.slice(-100); saveNow(); }
  function whisper(text){ state.lastWhisper=text; ui.whisper.textContent=text; ui.whisper.classList.add('show'); clearTimeout(whisper._t); whisper._t=setTimeout(()=>ui.whisper.classList.remove('show'),2600); }

  // ---------- rendering ----------
  function draw(){
    ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,W,H); ctx.fillStyle='#05030a'; ctx.fillRect(0,0,W,H);
    if(!state.room || !state.run){ drawTitleBg(); return; }
    const room=state.room, p=state.run.player; const vw=W/viewScale, vh=H/viewScale; const tx=clamp(p.x-vw*.5,0,Math.max(0,room.w-vw)), ty=clamp(p.y-vh*.54,0,Math.max(0,room.h-vh)); camX=damp(camX,tx,7,1/60); camY=damp(camY,ty,7,1/60); let sx=0,sy=0; if(shake>0&&!reduced()){ sx=(Math.random()-.5)*shake*28/viewScale; sy=(Math.random()-.5)*shake*28/viewScale; }
    ctx.save(); ctx.scale(viewScale,viewScale); ctx.translate(-camX+sx,-camY+sy);
    drawRoom(room); drawCare(room); drawPickups(room); drawBullets(room); drawEnemies(room); drawPlayer(p,room); drawPortals(room); drawParticles(room); drawFloats(room);
    ctx.restore();
    if(state.mode==='play') drawDangerIndicators(room,p);
    drawTouchPads(); drawVignette(room.theme); if(flash>0){ ctx.fillStyle=`rgba(255,255,255,${Math.min(.18,flash*.16)})`; ctx.fillRect(0,0,W,H); }
  }

  function drawTitleBg(){
    const t=performance.now()/1000;
    const bg=ctx.createRadialGradient(W*.5,H*.34,20,W*.5,H*.55,Math.max(W,H)*.9);
    bg.addColorStop(0,'#4a1365'); bg.addColorStop(.42,'#140527'); bg.addColorStop(1,'#020106');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    const sunX=W*.5, sunY=H*.34, sunR=Math.min(W,H)*.22;
    const sun=ctx.createRadialGradient(sunX,sunY,6,sunX,sunY,sunR);
    sun.addColorStop(0,'rgba(255,230,109,.95)'); sun.addColorStop(.45,'rgba(255,43,214,.55)'); sun.addColorStop(1,'rgba(0,245,255,0)');
    ctx.fillStyle=sun; ctx.beginPath(); ctx.arc(sunX,sunY,sunR,0,TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation='destination-out'; for(let y=sunY-sunR*.75;y<sunY+sunR*.82;y+=sunR*.18){ ctx.fillRect(sunX-sunR,y,sunR*2,Math.max(2,sunR*.045)); } ctx.restore();
    ctx.save(); ctx.strokeStyle='rgba(0,245,255,.25)'; ctx.lineWidth=1; const horizon=H*.62; ctx.beginPath(); ctx.moveTo(0,horizon); ctx.lineTo(W,horizon); ctx.stroke();
    for(let i=-12;i<=12;i++){ const x=W*.5+i*W*.06; ctx.beginPath(); ctx.moveTo(x,horizon); ctx.lineTo(W*.5+i*W*.18,H); ctx.stroke(); }
    for(let j=0;j<18;j++){ const y=horizon + Math.pow(j/17,1.7)*(H-horizon); ctx.globalAlpha=.15+j*.025; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.restore();
    for(let i=0;i<130;i++){ const x=(Math.sin(i*999.1)*.5+.5)*W, y=(Math.sin(i*311.7)*.5+.5)*H; ctx.globalAlpha=.14+.26*Math.sin(t+i); ctx.fillStyle=i%4?'#00f5ff':(i%2?'#ff2bd6':'#ffe66d'); ctx.beginPath(); ctx.arc(x,y,1+(i%5)*.42,0,TAU); ctx.fill(); }
    ctx.globalAlpha=.08; ctx.fillStyle='#fff'; for(let y=0;y<H;y+=4) ctx.fillRect(0,y,W,1); ctx.globalAlpha=1;
  }

  function drawRoom(room){
    const th=room.theme, t=performance.now()/1000;
    const g=ctx.createRadialGradient(room.w*.52,room.h*.42,40,room.w*.5,room.h*.5,Math.max(room.w,room.h)*.82);
    g.addColorStop(0,th.floor); g.addColorStop(.58,th.bg); g.addColorStop(1,'#020106'); ctx.fillStyle=g; ctx.fillRect(0,0,room.w,room.h);
    ctx.save(); ctx.lineWidth=1; for(let x=0;x<room.w;x+=78){ ctx.globalAlpha=(x%234===0)?.20:.095; ctx.strokeStyle=(x%234===0?th.b:th.a); ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,room.h); ctx.stroke(); } for(let y=0;y<room.h;y+=78){ ctx.globalAlpha=(y%234===0)?.18:.085; ctx.strokeStyle=(y%234===0?th.c:th.a); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(room.w,y); ctx.stroke(); }
    ctx.globalAlpha=.09; ctx.strokeStyle=th.b; ctx.lineWidth=5; for(let i=-room.h;i<room.w;i+=310){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i+room.h,room.h); ctx.stroke(); }
    ctx.restore();
    if(room.level===1){ drawTutorialGlyph(room); }
    for(const d of room.decor) drawDecor(d,th);
    for(const o of room.obstacles) drawObstacle(o,th);
    ctx.strokeStyle=room.cleared?th.c:th.a+'88'; ctx.lineWidth=7; roundRect(ctx,18,18,room.w-36,room.h-36,28); ctx.stroke();
    ctx.font='900 28px system-ui,sans-serif'; ctx.fillStyle=th.a+'22'; ctx.fillText(th.icon,48,75);
  }
  function drawTutorialGlyph(room){
    const th=room.theme, t=performance.now()/1000; ctx.save(); ctx.globalAlpha=.38; ctx.strokeStyle=th.a; ctx.fillStyle=th.c; ctx.lineWidth=3;
    const y=room.h*.77, x1=room.w*.32, x2=room.w*.68;
    for(const [x,phase,col] of [[x1,0,th.a],[x2,Math.PI,th.c]]){
      ctx.strokeStyle=col; ctx.beginPath(); ctx.arc(x,y,58+Math.sin(t*2+phase)*4,0,TAU); ctx.stroke();
      ctx.globalAlpha=.18; ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,31,0,TAU); ctx.fill(); ctx.globalAlpha=.38;
      for(let i=0;i<9;i++){ const a=i/9*TAU+t*(x===x1?.9:-1.1); ctx.beginPath(); ctx.arc(x+Math.cos(a)*44,y+Math.sin(a)*44,2.3,0,TAU); ctx.fill(); }
    }
    ctx.strokeStyle=th.b; ctx.globalAlpha=.42; ctx.beginPath(); ctx.moveTo(x1+72,y); ctx.bezierCurveTo(room.w*.45,y-70,room.w*.55,y+70,x2-72,y); ctx.stroke();
    ctx.restore(); ctx.globalAlpha=1;
  }
  function drawDecor(d,th){ ctx.save(); ctx.translate(d.x,d.y); ctx.rotate(d.a+performance.now()/5000); ctx.globalAlpha=.28; if(d.kind==='cassette'){ roundRect(ctx,-18,-11,36,22,5); ctx.fillStyle=th.b; ctx.fill(); ctx.fillStyle='#05030a'; ctx.beginPath(); ctx.arc(-8,0,3.5,0,TAU); ctx.arc(8,0,3.5,0,TAU); ctx.fill(); } else if(d.kind==='paper'){ ctx.fillStyle=th.c; ctx.fillRect(-9,-12,18,24); } else if(d.kind==='leaf'){ ctx.fillStyle=th.a; ctx.beginPath(); ctx.ellipse(0,0,d.r*.75,d.r*.32,0,0,TAU); ctx.fill(); } else { ctx.fillStyle=d.kind==='stone'?th.b:th.c; starPath(0,0,d.r,d.r*.45,5); ctx.fill(); } ctx.restore(); ctx.globalAlpha=1; }
  function drawObstacle(o,th){ ctx.save(); ctx.shadowColor=th.a+'44'; ctx.shadowBlur=14; if(o.type==='circle'){ const g=ctx.createRadialGradient(o.x-o.rad*.3,o.y-o.rad*.25,4,o.x,o.y,o.rad*1.15); g.addColorStop(0,th.a+'88'); g.addColorStop(1,'#07040c'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(o.x,o.y,o.rad,0,TAU); ctx.fill(); ctx.strokeStyle=th.b+'77'; ctx.lineWidth=2; ctx.stroke(); } else { ctx.fillStyle='#0a0710'; ctx.strokeStyle=th.b+'77'; ctx.lineWidth=2; roundRect(ctx,o.x,o.y,o.w,o.h,o.r); ctx.fill(); ctx.stroke(); ctx.fillStyle=th.a+'22'; roundRect(ctx,o.x+8,o.y+8,o.w-16,Math.max(6,o.h*.18),8); ctx.fill(); } ctx.restore(); }

  function drawCare(room){
    const th=room.theme, t=performance.now()/1000; for(const c of room.care){ ctx.save(); ctx.translate(c.x,c.y+Math.sin(t*2+c.phase)*4); ctx.globalAlpha=c.used?.28:1; ctx.shadowColor=th.c; ctx.shadowBlur=c.used?0:18; if(c.kind==='lamp'){ ctx.fillStyle=th.c; ctx.beginPath(); ctx.arc(0,-12,16,0,TAU); ctx.fill(); ctx.strokeStyle='#fff8'; ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(0,28); ctx.stroke(); } else if(c.kind==='bench'){ ctx.fillStyle='#2a1a20'; roundRect(ctx,-34,-8,68,18,6); ctx.fill(); ctx.fillStyle=th.c; ctx.fillRect(-29,10,7,28); ctx.fillRect(22,10,7,28); } else if(c.kind==='umbrella'){ ctx.fillStyle=th.c; ctx.beginPath(); ctx.arc(0,0,34,Math.PI,TAU); ctx.lineTo(34,0); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#fff8'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,34); ctx.stroke(); } else { ctx.fillStyle='#f7d18b'; ctx.beginPath(); ctx.ellipse(0,0,34,18,0,0,TAU); ctx.fill(); ctx.fillStyle='#7b2f4a'; ctx.beginPath(); ctx.arc(-9,-2,5,0,TAU); ctx.arc(10,1,5,0,TAU); ctx.fill(); } ctx.restore(); }
  }

  function drawPickups(room){ const t=performance.now()/1000; for(const q of room.pickups){ ctx.save(); ctx.translate(q.x,q.y+Math.sin(t*5+q.x*.01)*3); if(q.type==='heart'){ ctx.fillStyle='#ff6b9b'; heartPath(0,0,12); ctx.fill(); } else { ctx.fillStyle=room.theme.c; ctx.shadowColor=room.theme.c; ctx.shadowBlur=12; starPath(0,0,8,3.5,5); ctx.fill(); } ctx.restore(); } }
  function drawBullets(room){ for(const b of room.bullets){ ctx.save(); ctx.globalAlpha=clamp(b.life/(b.max||b.life),.22,1); ctx.shadowColor=b.color; ctx.shadowBlur=b.puddle?20:10; ctx.fillStyle=b.puddle?b.color+'44':b.color; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*(b.puddle?1+.07*Math.sin(performance.now()/120):1),0,TAU); ctx.fill(); if(b.puddle){ ctx.strokeStyle=b.color+'aa'; ctx.stroke(); } ctx.restore(); } }

  function drawEnemies(room){
    const t=performance.now()/1000;
    for(const e of room.enemies){
      ctx.save(); ctx.translate(e.x,e.y);
      const pulse=1+Math.sin(t*5+e.phase)*.035+(e.hit>0?.16:0);
      ctx.scale(pulse,pulse); ctx.shadowColor=e.color; ctx.shadowBlur=e.hit>0?28:14;
      if(e.type==='moth') drawMoth(e,room.theme);
      else if(e.type==='receipt') drawReceipt(e,room.theme);
      else if(e.type==='sludge') drawSludge(e,room.theme);
      else if(e.type==='charger') drawCharger(e,room.theme);
      else if(e.type==='cart') drawCart(e,room.theme);
      else if(e.type==='moon') drawMoon(e,room.theme);
      else if(e.type==='mirror') drawMirror(e,room.theme);
      else if(e.type==='wraith') drawWraith(e,room.theme);
      else drawBoss(e,room.theme);
      if(e.elite){ ctx.strokeStyle=room.theme.c; ctx.lineWidth=3; ctx.setLineDash([7,5]); ctx.beginPath(); ctx.arc(0,0,e.r+8,0,TAU); ctx.stroke(); ctx.setLineDash([]); }
      if(e.hp<e.maxHp){ ctx.rotate(-Math.PI/2); ctx.strokeStyle='#0009'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,e.r+12,0,TAU); ctx.stroke(); ctx.strokeStyle=room.theme.c; ctx.beginPath(); ctx.arc(0,0,e.r+12,0,TAU*clamp(e.hp/e.maxHp,0,1)); ctx.stroke(); }
      ctx.restore();
      if(e.tele>0){
        ctx.save(); ctx.strokeStyle=room.theme.bad+'cc'; ctx.lineWidth=4; ctx.setLineDash([16,10]); ctx.beginPath(); ctx.moveTo(e.x,e.y); ctx.lineTo(e.x+(e.chargeX||0)*260,e.y+(e.chargeY||0)*260); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      }
    }
  }

  function drawMoth(e,th){
    const flap=Math.sin(e.phase*14)*.18;
    ctx.rotate(Math.sin(e.phase*1.7)*.12);
    shadow(0,21,24,8,.24);
    ctx.save(); ctx.rotate(-.42+flap); ctx.fillStyle='#ffd6ff'; ctx.strokeStyle=e.color; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(-18,-2,17,31,-.22,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#090612'; for(let y=-18;y<15;y+=8) ctx.fillRect(-26,y,18,2); ctx.restore();
    ctx.save(); ctx.rotate(.42-flap); ctx.fillStyle='#f2d7ff'; ctx.strokeStyle=e.color; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(18,-2,17,31,.22,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#090612'; for(let y=-18;y<15;y+=8) ctx.fillRect(7,y,18,2); ctx.restore();
    ctx.fillStyle='#101827'; ctx.beginPath(); ctx.ellipse(0,2,10,19,0,0,TAU); ctx.fill(); ctx.strokeStyle=th.a; ctx.lineWidth=2; ctx.stroke();
    ctx.strokeStyle=e.color; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-5,-16); ctx.quadraticCurveTo(-19,-29,-24,-34); ctx.moveTo(5,-16); ctx.quadraticCurveTo(19,-29,24,-34); ctx.stroke();
    drawEnemyEyes(-4,-5,4,4,e.color);
  }

  function drawReceipt(e,th){
    ctx.rotate(Math.sin(e.phase)*.16);
    shadow(0,25,22,7,.20);
    ctx.fillStyle='#fff4d6'; ctx.strokeStyle='#ff4fd8'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(-19,-30); ctx.lineTo(18,-27); ctx.lineTo(18,20); ctx.lineTo(12,26); ctx.lineTo(6,20); ctx.lineTo(0,27); ctx.lineTo(-6,20); ctx.lineTo(-13,26); ctx.lineTo(-18,19); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#120612'; for(let y=-18;y<8;y+=7){ ctx.fillRect(-11,y,22,1.7); }
    for(let x=-12;x<12;x+=4){ ctx.fillRect(x,11,2,12); }
    ctx.fillStyle=e.color; ctx.beginPath(); ctx.moveTo(-10,-7); ctx.lineTo(-2,-3); ctx.lineTo(-10,2); ctx.closePath(); ctx.moveTo(10,-7); ctx.lineTo(2,-3); ctx.lineTo(10,2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#120612'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-8,8); ctx.lineTo(8,8); ctx.stroke();
    ctx.strokeStyle=th.b+'aa'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-19,-16); ctx.bezierCurveTo(-38,-24,-38,8,-24,10); ctx.moveTo(19,-14); ctx.bezierCurveTo(38,-24,39,9,24,11); ctx.stroke();
  }

  function drawSludge(e,th){
    shadow(0,25,34,9,.32);
    const wob=Math.sin(e.phase*2.4)*3;
    ctx.fillStyle='#07140f'; ctx.beginPath(); ctx.ellipse(0,10,e.r*1.35,e.r*.75,Math.sin(e.phase)*.12,0,TAU); ctx.fill();
    const g=ctx.createRadialGradient(-9,-10,3,0,2,e.r*1.25); g.addColorStop(0,th.c); g.addColorStop(.35,e.color); g.addColorStop(1,'#12351f'); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(0,1+wob*.15,e.r*1.08,e.r*.93,Math.sin(e.phase)*.16,0,TAU); ctx.fill();
    ctx.fillStyle='#1c2340'; roundRect(ctx,-17,-33,34,9,3); ctx.fill(); ctx.fillStyle='#0a0b12'; roundRect(ctx,-12,-42,24,10,3); ctx.fill(); ctx.strokeStyle=e.color; ctx.lineWidth=2; ctx.stroke();
    drawEnemyEyes(-8,-7,6,5,'#ff4fd8');
    ctx.fillStyle='#fff4d6'; ctx.globalAlpha=.82; ctx.fillRect(-25,8,14,18); ctx.fillRect(14,4,16,20); ctx.globalAlpha=1;
    ctx.strokeStyle='#ff4fd8'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,7,e.r*.47,0,TAU); ctx.stroke(); ctx.font='900 9px system-ui'; ctx.textAlign='center'; ctx.fillStyle='#ff4fd8'; ctx.fillText('PAID',0,10);
  }

  function drawCharger(e,th){
    const a=Math.hypot(e.vx,e.vy)>30?Math.atan2(e.vy,e.vx)+Math.PI/2:Math.sin(e.phase)*.12; ctx.rotate(a);
    for(let i=0;i<3;i++){ ctx.globalAlpha=.18; ctx.fillStyle=e.color; ctx.beginPath(); ctx.moveTo(-14,-20-i*11); ctx.lineTo(14,-20-i*11); ctx.lineTo(0,-48-i*16); ctx.closePath(); ctx.fill(); } ctx.globalAlpha=1;
    shadow(0,23,23,7,.25);
    ctx.fillStyle='#ff7a2f'; ctx.strokeStyle='#ffffffcc'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,-34); ctx.lineTo(24,19); ctx.lineTo(-24,19); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#fff4e8'; ctx.fillRect(-14,-7,28,8); ctx.fillRect(-19,9,38,7);
    ctx.fillStyle='#1a0712'; roundRect(ctx,-17,4,34,17,5); ctx.fill(); drawEnemyEyes(-7,11,5,4,'#ff4fd8');
    ctx.fillStyle='#2a0e12'; roundRect(ctx,-29,19,58,12,5); ctx.fill(); ctx.strokeStyle=e.color; ctx.stroke();
  }

  function drawCart(e,th){
    const lean=clamp(e.vx/520,-.28,.28); ctx.rotate(lean);
    shadow(0,31,38,9,.28);
    ctx.strokeStyle='#7dfdff'; ctx.lineWidth=3; ctx.fillStyle='#0b0712'; roundRect(ctx,-34,-17,61,38,7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='#ffffff99'; ctx.lineWidth=1.4; for(let x=-25;x<23;x+=10){ ctx.beginPath(); ctx.moveTo(x,-15); ctx.lineTo(x,18); ctx.stroke(); } for(let y=-8;y<15;y+=10){ ctx.beginPath(); ctx.moveTo(-31,y); ctx.lineTo(24,y); ctx.stroke(); }
    ctx.strokeStyle='#ff4fd8'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(26,-14); ctx.lineTo(43,-23); ctx.stroke();
    ctx.fillStyle='#182236'; ctx.fillRect(-18,-35,17,16); ctx.fillStyle='#2c3150'; ctx.fillRect(2,-38,18,19); ctx.fillStyle=th.c; ctx.beginPath(); ctx.moveTo(-28,-20); ctx.lineTo(-17,-43); ctx.lineTo(-3,-20); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(-20,31,6,0,TAU); ctx.arc(20,31,6,0,TAU); ctx.fill(); ctx.strokeStyle='#7dfdff'; ctx.stroke();
    ctx.fillStyle='#120612'; roundRect(ctx,-20,-2,34,18,5); ctx.fill(); drawEnemyEyes(-9,7,5,5,'#ff4fd8');
    ctx.strokeStyle='#ff4fd8aa'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-34,4); ctx.bezierCurveTo(-50,8,-48,28,-62,30); ctx.moveTo(28,8); ctx.bezierCurveTo(48,14,45,30,62,31); ctx.stroke();
  }

  function drawMoon(e,th){
    // Porchlight warden: still uses the legacy type name for old saves, but visually it is no longer the old moon ball.
    shadow(0,27,24,7,.22); ctx.strokeStyle='#ffd36e'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,-33); ctx.lineTo(0,26); ctx.stroke();
    const g=ctx.createRadialGradient(-6,-17,2,0,-17,25); g.addColorStop(0,'#fff8cc'); g.addColorStop(.42,'#ffd36e'); g.addColorStop(1,'#3b1d10'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,-17,22,0,TAU); ctx.fill(); ctx.strokeStyle=th.a; ctx.stroke();
    ctx.fillStyle='#120612'; roundRect(ctx,-13,-22,26,15,5); ctx.fill(); drawEnemyEyes(-6,-15,4,3,'#ff4fd8');
    ctx.globalAlpha=.18; ctx.fillStyle='#ffd36e'; ctx.beginPath(); ctx.moveTo(0,-17); ctx.lineTo(-60,52); ctx.lineTo(60,52); ctx.closePath(); ctx.fill(); ctx.globalAlpha=1;
  }

  function drawMirror(e,th){
    shadow(0,26,31,8,.24);
    ctx.fillStyle='#070411'; ctx.strokeStyle=e.color; ctx.lineWidth=4; roundRect(ctx,-33,-21,66,34,13); ctx.fill(); ctx.stroke();
    const g=ctx.createLinearGradient(-27,-17,27,11); g.addColorStop(0,'#0d1835'); g.addColorStop(.5,'#2b0c4a'); g.addColorStop(1,'#090612'); ctx.fillStyle=g; roundRect(ctx,-27,-15,54,22,8); ctx.fill();
    ctx.strokeStyle='#ffffff66'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-17,-10); ctx.lineTo(14,5); ctx.moveTo(6,-12); ctx.lineTo(23,-4); ctx.stroke();
    drawEnemyEyes(-9,-4,5,4,'#ff4fd8');
    ctx.strokeStyle='#bd93ff99'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-8,13); ctx.lineTo(-8,31); ctx.moveTo(8,13); ctx.lineTo(8,31); ctx.stroke(); ctx.fillStyle='#2c2758'; ctx.fillRect(-15,31,12,12); ctx.fillRect(4,31,12,12);
  }

  function drawWraith(e,th){
    const vis=e.wrVis||0; const alpha=0.28+vis*0.72;
    ctx.globalAlpha=alpha;
    shadow(0,20,18,6,.18*alpha);
    // Ghostly ellipse body
    const g=ctx.createRadialGradient(-3,-6,2,0,0,e.r*1.2);
    g.addColorStop(0,'#c4a8ff'); g.addColorStop(.5,e.color); g.addColorStop(1,'#1a0c38');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.ellipse(0,-2,e.r*1.1,e.r*1.4,0,0,TAU);
    ctx.fill();
    // Wispy tails
    ctx.strokeStyle='#8866cc'; ctx.lineWidth=2;
    for(let k=-1;k<=1;k++){
      const ox=k*8, wob=Math.sin(e.phase*3+k*2)*6;
      ctx.beginPath(); ctx.moveTo(ox,e.r*.8); ctx.quadraticCurveTo(ox+wob,e.r*1.8+Math.abs(k)*4,ox+wob*1.5,e.r*2.4); ctx.stroke();
    }
    // Glowing eyes
    ctx.globalAlpha=alpha; drawEnemyEyes(-5,-8,4,3,'#ff88ff');
    ctx.globalAlpha=1;
  }

  function drawBoss(e,th){
    const spin=e.phase*.55; shadow(0,45,66,14,.32);
    ctx.save(); ctx.rotate(spin); ctx.strokeStyle='#ffd36e'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(0,0,e.r*.84,0,TAU); ctx.stroke(); for(let k=0;k<8;k++){ const a=k*TAU/8; ctx.beginPath(); ctx.moveTo(Math.cos(a)*e.r*.48,Math.sin(a)*e.r*.48); ctx.lineTo(Math.cos(a)*e.r*.95,Math.sin(a)*e.r*.95); ctx.stroke(); } ctx.restore();
    ctx.fillStyle='#090612'; ctx.strokeStyle='#7dfdff'; ctx.lineWidth=4; roundRect(ctx,-46,-24,92,48,18); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#150720'; roundRect(ctx,-31,-12,62,25,8); ctx.fill(); drawEnemyEyes(-13,0,8,6,'#ff4fd8');
    ctx.strokeStyle='#ff4fd8'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-25,-34); ctx.quadraticCurveTo(0,-54,25,-34); ctx.moveTo(0,24); ctx.lineTo(0,55); ctx.stroke();
    ctx.fillStyle='#ffd36e'; ctx.beginPath(); ctx.moveTo(0,58); ctx.lineTo(-10,42); ctx.lineTo(10,42); ctx.closePath(); ctx.fill();
  }

  function drawEnemyEyes(x,y,r=5,sy=4,color='#ff4fd8'){
    ctx.save(); ctx.shadowColor=color; ctx.shadowBlur=12; ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y,r,sy,-.18,0,TAU); ctx.ellipse(-x,y,r,sy,.18,0,TAU); ctx.fill(); ctx.restore();
  }

  function drawPlayer(p,room){
    const th=room.theme, spin=dashSpinPhase(p);
    for(let i=p.after.length-1;i>=0;i--){ const a=p.after[i]; drawPlayerBody(a.x,a.y,a.face,th,clamp(a.life/.16,0,1)*.18,true,a.spin||0); }
    if(p.cat) for(let c=0;c<p.cat;c++){ const a=performance.now()/540+c*TAU/p.cat; drawCat(p.x+Math.cos(a)*76,p.y+Math.sin(a)*50,.58,th); }
    if(p.dashT>0 && !reduced()){
      const k=clamp(p.dashT/(p.dashDur||.001),0,1), ring=1-k;
      ctx.save(); ctx.translate(p.x,p.y-20); ctx.globalAlpha=.30+.34*Math.sin(ring*Math.PI); ctx.strokeStyle=th.c; ctx.shadowColor=th.c; ctx.shadowBlur=20; ctx.lineWidth=3;
      ctx.beginPath(); ctx.ellipse(0,0,42+ring*10,12+Math.sin(spin*2)*3,Math.sin(spin)*.10,0,TAU); ctx.stroke();
      ctx.strokeStyle=th.b; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,7,32+ring*8,8,0,0,TAU); ctx.stroke(); ctx.restore();
    }
    drawPlayerBody(p.x,p.y,p.face,th,1,false,spin);
    if(p.hurt>0){ ctx.strokeStyle=room.theme.bad+'cc'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(p.x,p.y,42+(1-p.hurt/.42)*28,0,TAU); ctx.stroke(); }
    if(p.inv>0 && p.hurt<=0){ ctx.strokeStyle=th.c+'aa'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(p.x,p.y,31+Math.sin(performance.now()/80)*3,0,TAU); ctx.stroke(); }
    if(p.shield>0){ ctx.strokeStyle=th.a+'99'; ctx.lineWidth=2; for(let i=0;i<p.shield;i++){ ctx.beginPath(); ctx.arc(p.x,p.y,38+i*5,0,TAU); ctx.stroke(); } }
  }
  function drawPlayerBody(x,y,face,th,alpha=1,ghost=false,spinPhase=0){
    ctx.save(); ctx.globalAlpha=alpha; shadow(x,y+25,28,9,ghost?.1:.30); ctx.translate(x,y);
    const spinning=!ghost && Math.abs(spinPhase)>.001;
    if(spriteReady && !ghost){
      const yaw=Math.cos(spinPhase), sx=spinning?(.28+.72*Math.abs(yaw)):1, flip=spinning?(yaw<0?-1:1):1;
      ctx.save(); ctx.scale(sx*flip,1+.035*Math.sin(spinPhase*2)); ctx.drawImage(sprite,-36,-72,72,106); ctx.restore();
      if(spinning){ ctx.save(); ctx.globalAlpha=.55; ctx.strokeStyle=th.c; ctx.shadowColor=th.c; ctx.shadowBlur=14; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,-23,37*sx,10,0,0,TAU); ctx.stroke(); ctx.restore(); }
      ctx.strokeStyle=th.a; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(Math.cos(face)*16,Math.sin(face)*16); ctx.lineTo(Math.cos(face)*40,Math.sin(face)*40); ctx.stroke();
    } else {
      if(spinning){ const yaw=Math.cos(spinPhase); ctx.scale((.35+.65*Math.abs(yaw))*(yaw<0?-1:1),1+.035*Math.sin(spinPhase*2)); }
      ctx.fillStyle=ghost?th.a:'#fff5f8'; ctx.strokeStyle='#05030a'; ctx.lineWidth=5; ctx.beginPath(); ctx.ellipse(0,-8,21,27,0,0,TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle='#05030a'; ctx.beginPath(); ctx.arc(-8,-12,4,0,TAU); ctx.arc(8,-12,4,0,TAU); ctx.fill(); ctx.strokeStyle='#05030a'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,-5,8,.1,Math.PI-.1); ctx.stroke(); ctx.fillStyle=th.b; ctx.fillRect(-17,19,14,16); ctx.fillRect(4,19,14,16);
    }
    ctx.restore(); ctx.globalAlpha=1;
  }
  function drawCat(x,y,s,th){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s); shadow(0,14,20,6,.25); ctx.fillStyle='#11131b'; ctx.beginPath(); ctx.ellipse(0,0,26,18,0,0,TAU); ctx.fill(); ctx.fillStyle='#f9f6ee'; ctx.beginPath(); ctx.ellipse(-8,1,12,16,0,0,TAU); ctx.fill(); ctx.fillStyle='#11131b'; ctx.beginPath(); ctx.moveTo(-18,-10); ctx.lineTo(-10,-30); ctx.lineTo(-2,-9); ctx.moveTo(8,-9); ctx.lineTo(16,-30); ctx.lineTo(22,-8); ctx.fill(); ctx.fillStyle=th.c; ctx.beginPath(); ctx.arc(-7,-3,2.8,0,TAU); ctx.arc(9,-3,2.8,0,TAU); ctx.fill(); ctx.restore(); }

  function drawPortals(room){ const t=performance.now()/1000; for(const po of room.portals){ const r=po.r+Math.sin(t*5)*4; const g=ctx.createRadialGradient(po.x,po.y,8,po.x,po.y,r*1.8); g.addColorStop(0,room.theme.c+'cc'); g.addColorStop(.45,room.theme.a+'66'); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(po.x,po.y,r*1.8,0,TAU); ctx.fill(); ctx.strokeStyle=room.theme.c; ctx.lineWidth=4; starPath(po.x,po.y,r,r*.45,6); ctx.stroke(); } }
  function drawParticles(room){ for(const p of room.particles){ const a=clamp(p.life/p.max,0,1); ctx.globalAlpha=a; ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=10; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*a,0,TAU); ctx.fill(); } ctx.globalAlpha=1; ctx.shadowBlur=0; }
  function drawFloats(room){ ctx.textAlign='center'; for(const f of room.floats){ ctx.globalAlpha=clamp(f.life/.5,0,1); if(f.big){ ctx.font='900 28px system-ui,sans-serif'; ctx.shadowColor=f.color; ctx.shadowBlur=16; ctx.fillStyle='#fff'; ctx.fillText(f.text,f.x,f.y); ctx.shadowBlur=0; } else { ctx.font='900 18px system-ui,sans-serif'; ctx.fillStyle=f.color; ctx.fillText(f.text,f.x,f.y); } } ctx.globalAlpha=1; ctx.textAlign='left'; }
  function drawDangerIndicators(room,p){
    const margin=28, triSize=12; let count=0;
    for(const e of room.enemies){
      if(e.hp<=0 || count>=8) break;
      const sx=e.x-camX, sy=e.y-camY;
      if(sx>margin && sx<W-margin && sy>margin && sy<H-margin) continue; // on screen
      count++;
      const cx=clamp(sx,margin,W-margin), cy=clamp(sy,margin,H-margin);
      const angle=Math.atan2(sy-H*.5,sx-W*.5);
      const isTele=e.type==='charger'&&e.tele>0;
      const s=isTele?triSize*1.6:triSize;
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(angle);
      ctx.globalAlpha=isTele?.95:.55;
      ctx.fillStyle=isTele?'#ff3333':e.color;
      ctx.beginPath(); ctx.moveTo(s,0); ctx.lineTo(-s*.5,-s*.6); ctx.lineTo(-s*.5,s*.6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  function drawTouchPads(){ if(state.mode!=='play') return; drawPad(state.input.moveTouch,'#7dfdff'); drawPad(state.input.aimTouch,'#ffd36e'); }
  function drawPad(pad,color){ if(pad.id===null) return; ctx.save(); ctx.globalAlpha=.46; ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(pad.startX,pad.startY,70,0,TAU); ctx.stroke(); ctx.globalAlpha=.82; ctx.fillStyle=color+'44'; ctx.beginPath(); ctx.arc(pad.startX+pad.dx*70,pad.startY+pad.dy*70,26,0,TAU); ctx.fill(); if(pad.len>.80){ ctx.globalAlpha=.5; ctx.beginPath(); ctx.arc(pad.startX,pad.startY,82,0,TAU); ctx.stroke(); } ctx.restore(); }
  function drawVignette(th){ const g=ctx.createRadialGradient(W*.5,H*.48,Math.min(W,H)*.22,W*.5,H*.5,Math.max(W,H)*.75); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.38)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }

  function updateParticles(room,dt){ for(let i=room.particles.length-1;i>=0;i--){ const p=room.particles[i]; p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=Math.pow(.16,dt); p.vy*=Math.pow(.16,dt); if(p.life<=0) room.particles.splice(i,1); } for(let i=room.floats.length-1;i>=0;i--){ const f=room.floats[i]; f.life-=dt; f.y-=34*dt; if(f.life<=0) room.floats.splice(i,1); } }

  function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath(); }
  function starPath(x,y,r1,r2,n){ ctx.beginPath(); for(let i=0;i<n*2;i++){ const a=-Math.PI/2+i*Math.PI/n; const r=i%2?r2:r1; ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); } ctx.closePath(); }
  function heartPath(x,y,s){ ctx.beginPath(); ctx.moveTo(x,y+s*.42); ctx.bezierCurveTo(x-s*1.25,y-s*.24,x-s*.72,y-s*.95,x,y-s*.45); ctx.bezierCurveTo(x+s*.72,y-s*.95,x+s*1.25,y-s*.24,x,y+s*.42); }
  function shadow(x,y,w,h,a){ ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(x,y,w,h,0,0,TAU); ctx.fill(); ctx.restore(); }

  // ---------- UI ----------
  function updateHUD(){
    if(!state.run){ ui.zone.textContent='Boon Moots'; ui.hp.textContent='♥♥♥♥♥'; ui.score.textContent='0'; ui.room.textContent='room 0'; ui.combo.textContent='two thumbs'; ui.pulseFill.style.width='0%'; return; }
    const p=state.run.player, r=state.run; ui.zone.textContent=state.room.theme.name; ui.hp.textContent='♥'.repeat(Math.max(0,p.hp))+'♡'.repeat(Math.max(0,p.maxHp-p.hp))+(p.shield?` +${p.shield}`:''); ui.score.textContent=Math.floor(r.score).toLocaleString(); ui.room.textContent=`room ${r.level}${r.overdrive?'∞':''}`; ui.combo.textContent=`x${r.combo.toFixed(1)}`; ui.pulseFill.style.width=`${clamp(p.pulse,0,100)}%`; ui.sound.textContent=state.muted?'sound off':'sound on'; }
  function showOverlay(title,copy,buttons){ ui.overlayTitle.textContent=title; ui.overlayCopy.textContent=copy; ui.overlayButtons.innerHTML=''; for(const [label,fn] of buttons){ const b=document.createElement('button'); b.className='bigBtn'; b.textContent=label; b.onclick=fn; ui.overlayButtons.appendChild(b); } ui.overlay.classList.add('show'); }
  function hideOverlay(){ ui.overlay.classList.remove('show'); }
  function hideUpgrade(){ ui.upgrade.classList.remove('show'); }
  function showTitle(){ state.mode='title'; showOverlay('Boon Moots', 'The road grins. The boots answer.', [['Start daily run',()=>startRun(todaySeed())],['Random run',()=>startRun(Date.now())],['Codex',()=>toggleCodex(true)],['Shrine',()=>showShrine()]]); updateHUD(); }
  function toggleSound(){ state.muted=!state.muted; state.save.sound=!state.muted; audio.mute(state.muted); if(!state.muted) audio.ensure(); saveNow(); updateHUD(); }
  function togglePause(){
    if(state.mode==='pause'){ ui.pause.classList.remove('show'); state.mode=state.oldMode||'play'; }
    else if(state.mode==='play'){ state.oldMode=state.mode; state.mode='pause'; ui.pause.classList.add('show'); ui.pauseSoundBtn.textContent=state.muted?'sound off':'sound on'; }
  }
  function toggleCodex(force=false){
    if(force || state.mode!=='codex'){ state.oldMode=state.mode; state.mode='codex'; renderCodex(); ui.codex.classList.add('show'); }
    else { ui.codex.classList.remove('show'); state.mode=state.oldMode||'play'; }
  }
  function showShrine(){
    state.oldMode=state.mode; state.mode='shrine';
    const sh=state.save.shrine||{}; const sparks=state.save.sparks||0;
    document.getElementById('shrineSparks').textContent='✦ '+sparks.toLocaleString()+' sparks';
    ui.shrineCards.innerHTML='';
    for(const sd of shrineDefs){
      const owned=!!sh[sd.id]; const canBuy=!owned&&sparks>=sd.cost;
      const card=document.createElement('button');
      card.className='shrineCard'+(owned?' owned':'');
      card.innerHTML=`<b>${html(sd.name)}</b><p>${html(sd.desc)}</p><div class="sCost">${owned?'Owned':(canBuy?'Buy · '+sd.cost+' sparks':'Need '+sd.cost+' sparks (have '+sparks+')')}</div>`;
      if(canBuy) card.onclick=()=>{ state.save.sparks-=sd.cost; if(!state.save.shrine) state.save.shrine={}; state.save.shrine[sd.id]=true; saveNow(); showShrine(); };
      ui.shrineCards.appendChild(card);
    }
    ui.shrine.classList.add('show');
  }
  function hideShrine(){ ui.shrine.classList.remove('show'); if(state.mode==='shrine') state.mode=state.oldMode||'title'; }
  function renderCodex(){
    const notices=(state.save.notices||[]).slice(-18).reverse();
    const bestiary=state.save.bestiary||{};
    const picks=state.save.upgradePicks||{};
    // Bestiary grid
    let bestiaryHtml='';
    for(const [key,info] of Object.entries(bestiaryInfo)){
      const kills=bestiary[key]||0;
      bestiaryHtml+=`<div class="codexCard"><b>${info.icon} ${html(info.name)}</b><p>${html(info.desc)}</p><p style="color:#ffd36e;font-size:12px;margin-top:4px">Kills: ${kills}</p></div>`;
    }
    // Favorite upgrade
    let favUp='none yet';
    if(Object.keys(picks).length){
      const top=Object.entries(picks).sort((a,b)=>b[1]-a[1])[0];
      const def=upgradeDefs.find(u=>u.id===top[0]);
      if(def) favUp=def.icon+' '+def.name+' ('+top[1]+'x)';
    }
    ui.codexBody.innerHTML=`<h3>Bestiary</h3><div class="codexGrid">${bestiaryHtml}</div><h3>Basics</h3><div class="codexGrid"><div class="codexCard"><b>Thumbs</b><p>Left moves. Right aims. Flick left. Tap right. No button farm.</p></div><div class="codexCard"><b>Rooms</b><p>Clear. Choose. Scale. Room 13 tells the truth. Then it keeps going.</p></div><div class="codexCard"><b>Care</b><p>Lamps, benches, umbrellas, and pie help before they explain.</p></div></div><h3>Lifetime Stats</h3><p>Runs: ${(state.save.runs||0).toLocaleString()} · Best score: ${Math.floor(state.save.bestScore||0).toLocaleString()} · Best room: ${state.save.bestRoom||0}<br>Total kills: ${(state.save.totalKills||0).toLocaleString()} · Total rooms: ${(state.save.totalRooms||0).toLocaleString()} · Sparks: ${(state.save.sparks||0).toLocaleString()}<br>Favorite upgrade: ${favUp}</p><h3>Notices</h3><ol>${notices.length?notices.map(n=>`<li>${html(n)}</li>`).join(''):'<li>No notices yet. Go make the road nervous.</li>'}</ol>`;
  }
  ui.sound.addEventListener('click', toggleSound); ui.codexBtn.addEventListener('click', () => toggleCodex(true)); ui.closeCodex.addEventListener('click', () => toggleCodex());
  ui.resumeBtn.addEventListener('click', () => togglePause());
  ui.pauseCodexBtn.addEventListener('click', () => { togglePause(); toggleCodex(true); });
  ui.pauseSoundBtn.addEventListener('click', () => { toggleSound(); ui.pauseSoundBtn.textContent=state.muted?'sound off':'sound on'; });
  ui.closeShrine.addEventListener('click', () => hideShrine());

  let last=performance.now(); function frame(t){ const dt=Math.min(.05,(t-last)/1000); last=t; update(dt); draw(); requestAnimationFrame(frame); }
  function finalSave(){ if(state.run){ state.save.bestScore=Math.max(state.save.bestScore||0,Math.floor(state.run.score)); state.save.bestRoom=Math.max(state.save.bestRoom||0,state.run.level); } saveNow(); }
  addEventListener('pagehide',finalSave); addEventListener('beforeunload',finalSave);

  window.passengerTactileSelfTest = window.passengerThumbprintSelfTest = () => {
    const nodes=[...document.querySelectorAll('button,.touchTarget')].map(n=>{ const r=n.getBoundingClientRect(); return {text:(n.textContent||'').trim().slice(0,40), cls:n.className, w:Math.round(r.width), h:Math.round(r.height), visible:r.width>0&&r.height>0}; });
    const small=nodes.filter(n=>n.visible&&(n.w<44||n.h<44));
    return {ok:small.length===0 && document.documentElement.scrollWidth<=innerWidth+1, version:VERSION, viewport:{w:innerWidth,h:innerHeight,dpr:DPR,mobile,portrait}, horizontalOverflow:document.documentElement.scrollWidth-innerWidth, smallTargets:small, state:window.passengerThumbprintDebug()};
  };
  window.passengerTactileDebug = window.passengerThumbprintDebug = () => ({version:VERSION,mode:state.mode,room:state.room?{level:state.room.level,enemies:state.room.enemies.length,bullets:state.room.bullets.length,particles:state.room.particles.length,cleared:state.room.cleared}:null,run:state.run?{score:Math.floor(state.run.score),level:state.run.level,hp:state.run.player.hp,pulse:Math.floor(state.run.player.pulse),upgrades:state.run.upgrades}:null,save:state.save});
  window.passengerTactileStart = window.passengerThumbprintStart = () => startRun(todaySeed());
  window.passengerTactileUnlockAll = window.passengerThumbprintUnlockAll = () => { state.save.notices=[...clearLines,...Object.values(behaviorNotices)]; saveNow(); renderCodex(); return state.save; };
  window.passengerTactileReset = window.passengerThumbprintReset = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };

  showTitle(); requestAnimationFrame(frame);
})();
