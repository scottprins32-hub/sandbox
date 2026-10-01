// One race: physics, AI, items, laps, camera. main.js owns the renderer and the menus.
import * as THREE from 'three';
import { CHARACTERS, CLASS_STATS, ITEMS } from './data.js';
import { buildRacer, buildItemBox, buildCoin, buildPeel, buildShell, buildStarMesh } from './models.js';
import { buildTrack, mulberry } from './track.js';
import { sfx, engineStart, engineSet, engineStop, musicStart, musicStop } from './audio.js';

const TAU = Math.PI * 2;
const wrapAng = (a) => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Race {
  constructor({ renderer, track, player, others, difficulty, settings, hud, input, onFinish }) {
    this.renderer = renderer; this.def = track; this.diff = difficulty; this.settings = settings;
    this.hud = hud; this.input = input; this.onFinish = onFinish;
    this.scene = new THREE.Scene();
    const th = track.theme;
    this.scene.background = new THREE.Color(th.sky);
    this.scene.fog = new THREE.Fog(th.fog, 120, th.night ? 520 : 650);
    this.scene.add(new THREE.HemisphereLight(th.night ? 0x8888ff : 0xffffff, th.night ? 0x221144 : 0x7a8a6a, th.night ? 1.2 : 1.6));
    const sun = new THREE.DirectionalLight(th.night ? 0xb0a0ff : 0xffffff, th.night ? 0.8 : 1.6);
    sun.position.set(0.5, 1, 0.3); this.scene.add(sun);
    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.5, 2200);

    this.t = buildTrack(track);
    this.scene.add(this.t.group);
    this.rand = mulberry(Date.now() & 0xffff);

    // racers
    this.racers = [];
    const slots = 8, playerSlot = 7; // start at the back: more karts to pass, nothing blocking the camera
    const rest = [...others];
    for (let s = 0; s < slots; s++) {
      const isPlayer = s === playerSlot;
      const setup = isPlayer ? player : rest.shift();
      this.racers.push(this.makeRacer(setup, isPlayer, s));
    }
    this.player = this.racers[playerSlot];

    this.boxes = []; this.coins = []; this.hazards = []; this.shots = [];
    this.placePickups();

    this.state = 'countdown'; this.clock = 0; this.raceTime = 0; this.finishOrder = [];
    this.paused = false; this.startHeld = 0;
    this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3(); this.camHeading = this.player.heading;
    this.snapCamera();
    this.hud.setup({ track: this.t, laps: track.laps });
    engineStart();
    musicStart(track.id.length * 7 + track.points.length, track.theme.night ? 160 : 148);
  }

  makeRacer(setup, isPlayer, slot) {
    const { char, kart, glider } = setup;
    const base = CLASS_STATS[char.cls];
    const st = { speed: base.speed + kart.mod.speed, accel: base.accel + kart.mod.accel, handling: base.handling + kart.mod.handling, weight: base.weight };
    const top = this.diff.speed * (0.92 + 0.025 * st.speed);
    const r = buildRacer(char, kart, glider);
    this.scene.add(r.root);
    const back = 8 + Math.floor(slot / 2) * 6;
    const idx = this.t.N - back;
    const lat = (slot % 2 ? 1 : -1) * this.t.hw * 0.4;
    const racer = {
      char, kart, glider, isPlayer, mesh: r,
      top, accel: 9 + st.accel * 2.6, turn: 1.45 + st.handling * 0.16, weight: st.weight,
      x: this.t.px[idx] + this.t.rx[idx] * lat, z: this.t.pz[idx] + this.t.rz[idx] * lat, y: this.t.py[idx],
      heading: this.t.hd[idx], speed: 0, vy: 0, idx, prevIdx: idx, lat,
      lap: 0, checkpoint: false, finished: false, finishTime: 0, place: slot + 1, coins: 0, collected: 0,
      drift: 0, driftCharge: 0, driftLevel: 0, hardSteer: 0, boost: 0, star: 0, spin: 0, shrink: 0,
      item: null, itemCount: 0, rolling: 0, gliding: false, wallCd: 0, bodyYaw: 0, wheelSpin: 0, steer: 0,
      ai: isPlayer ? null : { offset: lat, nextOffset: 2 + Math.random() * 3, skill: this.diff.ai * (0.96 + Math.random() * 0.06) * (slot < 3 ? 1.02 : 1), itemWait: 0 },
    };
    // star aura
    const aura = new THREE.Mesh(new THREE.SphereGeometry(1.9, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.35, depthWrite: false }));
    aura.position.y = 1; aura.visible = false; r.body.add(aura); r.aura = aura;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 8), new THREE.MeshBasicMaterial({ color: 0xff8a1e, transparent: true, opacity: 0.9 }));
    flame.rotation.x = -Math.PI / 2; flame.position.set(0, 0.55, -1.9); flame.visible = false; r.body.add(flame); r.flame = flame;
    this.placeMesh(racer);
    return racer;
  }

  placePickups() {
    const t = this.t;
    for (const f of this.def.boxes) {
      const i = t.skipGap(t.at(f));
      for (const l of [-0.6, -0.2, 0.2, 0.6]) {
        const lat = l * t.hw;
        const m = buildItemBox(); this.scene.add(m);
        const b = { x: t.px[i] + t.rx[i] * lat, z: t.pz[i] + t.rz[i] * lat, y: t.py[i] + 1.4, mesh: m, wait: 0 };
        m.position.set(b.x, b.y, b.z); this.boxes.push(b);
      }
    }
    for (const [n, f] of this.def.coins.entries()) {
      const lat = [0, -0.45, 0.45][n % 3] * t.hw;
      const i0 = t.skipGap(t.at(f));
      for (let k = 0; k < 5; k++) {
        const i = (i0 + k * 4) % t.N;
        if (t.inGap(i)) continue;
        const m = buildCoin(); this.scene.add(m);
        const c = { x: t.px[i] + t.rx[i] * lat, z: t.pz[i] + t.rz[i] * lat, y: t.py[i] + 1.1, mesh: m, wait: 0 };
        m.position.set(c.x, c.y, c.z); this.coins.push(c);
      }
    }
  }

  // ---------------- main loop ----------------
  update(dt) {
    if (this.paused) return;
    dt = Math.min(dt, 1 / 20);
    this.clock += dt;
    const inp = this.input;

    if (this.state === 'countdown') {
      const c = 3.6 - this.clock;
      const n = Math.ceil(c - 0.6);
      if (n !== this.lastCount && n >= 1 && n <= 3) { this.hud.countdown(n); sfx.beep(); this.lastCount = n; }
      // rocket start: be holding the screen during the last second
      if (c < 1.5 && c > 0.6) this.startHeld = inp.holding ? this.startHeld + dt : 0;
      if (c <= 0.6) {
        this.state = 'racing'; this.hud.countdown('GO!'); sfx.go();
        for (const r of this.racers) { r.speed = r.top * 0.3; if (r.ai && Math.random() < 0.5) r.boost = 0.8; }
        if (this.startHeld > 0.4) { this.player.boost = 1.4; this.player.speed = this.player.top; sfx.boost(); this.hud.toast('Rocket start!'); }
      }
      this.updateCamera(dt, true);
      this.animate(dt);
      return;
    }

    this.raceTime += this.state === 'racing' ? dt : 0;
    const P = this.player;

    // player input
    if (!P.finished) {
      P.steer = clamp(inp.steer, -1, 1);
      if (inp.consumeItem()) this.useItem(P);
    } else {
      this.aiDrive(P, dt); // autopilot after the finish line
    }
    for (const r of this.racers) if (!r.isPlayer) this.aiDrive(r, dt);
    for (const r of this.racers) this.physics(r, dt);
    this.collide();
    this.updatePickups(dt);
    this.updateShots(dt);
    this.rank();
    this.animate(dt);
    this.updateCamera(dt, false);

    engineSet(clamp(P.speed / P.top, 0, 1.3), P.boost > 0 || P.star > 0);
    this.hud.update({ place: P.place, lap: clamp(P.lap, 1, this.def.laps), coins: P.coins, time: this.raceTime, racers: this.racers, player: P });

    if (this.state === 'finished') {
      this.finishClock += dt;
      if (this.finishClock > 4 && !this.reported) { this.reported = true; this.report(); }
    }
  }

  // ---------------- driving ----------------
  physics(r, dt) {
    const t = this.t;
    r.wallCd -= dt; r.boost -= dt; r.star -= dt; r.shrink -= dt;
    if (r.rolling > 0) {
      r.rolling -= dt;
      if (r.isPlayer && Math.random() < 0.5) sfx.roulette();
      if (r.rolling <= 0) { this.giveItem(r); }
    }

    let steer = r.steer;
    if (r.spin > 0) { r.spin -= dt; steer = 0; r.drift = 0; r.driftCharge = 0; }

    // smart steering keeps you off the walls and pointed the right way
    if (r.isPlayer && this.settings.assist && !r.finished) {
      const lat = r.lat, edge = t.hw * 0.62;
      if (Math.abs(lat) > edge) steer += -Math.sign(lat) * clamp((Math.abs(lat) - edge) / (t.hw * 0.5), 0, 1) * 0.9 * (Math.sign(lat) === Math.sign(-steer) ? 0.3 : 1);
      const off = wrapAng(t.hd[r.idx] - r.heading);
      if (Math.abs(off) > 0.7) steer -= Math.sign(off) * 0.8;
      steer = clamp(steer, -1, 1);
    }

    // auto drift: hold a hard turn at speed
    const fast = r.speed > r.top * 0.55;
    if (!r.drift) {
      r.hardSteer = Math.abs(steer) > 0.6 && fast && !r.gliding ? r.hardSteer + dt : 0;
      if (r.hardSteer > 0.22 && r.spin <= 0) { r.drift = Math.sign(steer); r.driftCharge = 0; r.driftLevel = 0; }
    } else {
      const letGo = Math.abs(steer) < 0.15 || Math.sign(steer) === -r.drift || !fast || r.gliding;
      r.driftCharge += dt * (0.7 + Math.abs(steer) * 0.5);
      const lvl = r.driftCharge > 2.6 ? 3 : r.driftCharge > 1.6 ? 2 : r.driftCharge > 0.8 ? 1 : 0;
      if (lvl > r.driftLevel) { r.driftLevel = lvl; if (r.isPlayer) sfx['drift' + lvl](); }
      if (letGo) {
        if (r.driftLevel > 0) { r.boost = Math.max(r.boost, [0, 0.7, 1.2, 1.8][r.driftLevel]); if (r.isPlayer) sfx.boost(); }
        r.drift = 0; r.driftCharge = 0; r.driftLevel = 0;
      }
    }

    // speed
    const coinBonus = 1 + Math.min(r.coins, 10) * 0.006;
    let target = r.top * coinBonus * (r.ai ? r.ai.rubber ?? 1 : 1);
    if (r.boost > 0) target *= 1.38;
    if (r.star > 0) target *= 1.22;
    if (r.shrink > 0) target *= 0.72;
    if (this.state !== 'racing' && !r.finished) target = 0;
    if (r.spin > 0) target = 0;
    if (r.boost > 0 && r.speed < target) r.speed = Math.max(r.speed, target * 0.98);
    else if (r.speed < target) r.speed = Math.min(target, r.speed + r.accel * dt * (r.speed < target * 0.5 ? 1.6 : 1));
    else r.speed = Math.max(target, r.speed - (r.spin > 0 ? 38 : 9) * dt);

    // steering
    const grip = clamp(r.speed / 10, 0, 1);
    let rate = r.drift ? r.turn * (r.drift * 0.7 + steer * 0.5) * 1.05 : r.turn * steer;
    if (r.gliding) rate *= 0.6;
    r.heading -= rate * grip * dt;
    if (r.spin > 0) r.bodyYaw += dt * 14; else r.bodyYaw *= Math.exp(-10 * dt);

    const fx = Math.sin(r.heading), fz = Math.cos(r.heading);
    r.x += fx * r.speed * dt; r.z += fz * r.speed * dt;

    // where are we on the track
    r.prevIdx = r.idx;
    r.idx = t.nearest(r.x, r.z, r.idx);
    r.lat = t.lateral(r.idx, r.x, r.z);
    const roadY = t.py[r.idx];

    // walls
    const lim = t.hw + 0.4;
    if (Math.abs(r.lat) > lim) {
      const push = r.lat - Math.sign(r.lat) * lim;
      r.x -= t.rx[r.idx] * push; r.z -= t.rz[r.idx] * push;
      r.lat = Math.sign(r.lat) * lim;
      if (r.wallCd <= 0) { r.speed *= 0.82; r.wallCd = 0.4; if (r.isPlayer) sfx.bump(); }
      const off = wrapAng(t.hd[r.idx] - r.heading);
      r.heading += off * Math.min(1, dt * 6);
    }

    // gliding over the gap
    if (t.gapA >= 0) {
      const onRamp = r.idx >= t.gapA - 3 && r.idx <= t.gapA + 2;
      if (!r.gliding && onRamp) {
        r.gliding = true; r.vy = 10; r.mesh.glider.visible = true; r.mesh.glider.scale.setScalar(0.01);
        r.drift = 0;
        if (r.isPlayer) { sfx.glide(); this.hud.toast('Glide!'); }
      }
    }
    // boost pads
    for (const p of t.pads) {
      if (p.kind !== 'boost') continue;
      const inside = p.a < p.b ? r.idx >= p.a && r.idx <= p.b : r.idx >= p.a || r.idx <= p.b;
      if (inside && Math.abs(r.lat - p.lateral) < p.half + 0.6 && r.boost < 0.6) { r.boost = 1.1; if (r.isPlayer) sfx.boost(); }
    }

    if (r.gliding) {
      r.vy -= 7 * dt;
      r.y += r.vy * dt;
      const floor = t.inGap(r.idx) ? roadY + 1.5 : roadY;
      if (r.y < floor) { r.y = floor; r.vy = Math.max(r.vy, 0); }
      if (!t.inGap(r.idx) && r.idx > t.gapB - 1 && r.idx < t.gapB + 60 && r.y <= roadY + 0.01) {
        r.gliding = false; r.y = roadY; r.vy = 0;
        if (r.isPlayer) sfx.bump();
      }
      // safety: if somehow far from the gap, land
      if (!t.nearGap(r.idx, 80)) { r.gliding = false; r.y = roadY; }
    } else {
      r.y += (roadY - r.y) * Math.min(1, dt * 12);
    }

    // laps
    const N = t.N;
    if (r.prevIdx > N * 0.75 && r.idx < N * 0.25) {
      if (r.lap === 0 || r.checkpoint) {
        r.lap++; r.checkpoint = false;
        if (r.lap > this.def.laps && !r.finished) this.finishRacer(r);
        else if (r.isPlayer && r.lap > 1) {
          if (r.lap === this.def.laps) { sfx.finalLap(); this.hud.banner('Final lap!'); }
          else { sfx.lap(); this.hud.banner(`Lap ${r.lap}`); }
        }
      }
    } else if (r.prevIdx < N * 0.25 && r.idx > N * 0.75 && r.lap > 0) {
      r.lap--; r.checkpoint = true;
    }
    if (r.idx > N * 0.45 && r.idx < N * 0.55) r.checkpoint = true;
    r.progress = r.lap === 0 ? r.idx - N : (r.lap - 1) * N + r.idx;
  }

  aiDrive(r, dt) {
    const t = this.t, a = r.ai || (r.ai = { offset: 0, nextOffset: 1, skill: 0.95, itemWait: 0 });
    a.nextOffset -= dt;
    if (a.nextOffset <= 0) { a.offset = (Math.random() * 2 - 1) * t.hw * 0.55; a.nextOffset = 2 + Math.random() * 4; }
    // dodge peels ahead
    for (const h of this.hazards) {
      const ahead = (h.idx - r.idx + t.N) % t.N;
      if (ahead > 2 && ahead < 25 && Math.abs(h.lat - a.offset) < 3) a.offset = h.lat > 0 ? h.lat - 5 : h.lat + 5;
    }
    const look = Math.round(8 + r.speed * 0.35);
    const i = (r.idx + look) % t.N;
    const tx = t.px[i] + t.rx[i] * a.offset, tz = t.pz[i] + t.rz[i] * a.offset;
    const want = Math.atan2(tx - r.x, tz - r.z);
    const diff = wrapAng(want - r.heading);
    r.steer = clamp(-diff * 2.6, -1, 1);
    if (r.drift) r.steer = clamp(r.steer, -0.9, 0.9);

    // rubber band so races stay close and fun
    const P = this.player;
    const gap = (r.progress ?? 0) - (P.progress ?? 0);
    a.rubber = a.skill * (r.finished ? 0.8 : gap > 90 ? 0.9 : gap > 40 ? 0.96 : gap < -90 ? 1.1 : gap < -40 ? 1.05 : 1);

    // items
    if (r.item && !r.rolling && !r.finished) {
      a.itemWait -= dt;
      if (a.itemWait <= 0) {
        let use = true;
        if (r.item === 'peel') use = this.racers.some((o) => o !== r && behind(r, o, t) < 25) || Math.random() < 0.02;
        if (r.item === 'shell') use = this.racers.some((o) => o !== r && behind(o, r, t) < 40 && Math.abs(o.lat - r.lat) < 4) || Math.random() < 0.01;
        if (use) this.useItem(r);
      }
    }
  }

  finishRacer(r) {
    r.finished = true; r.finishTime = this.raceTime;
    this.finishOrder.push(r);
    if (r.isPlayer) {
      this.state = 'finished'; this.finishClock = 0;
      sfx.finish(); this.hud.finish(this.finishOrder.length);
    }
  }

  rank() {
    const sorted = [...this.racers].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1; if (b.finished) return 1;
      return b.progress - a.progress;
    });
    sorted.forEach((r, i) => (r.place = i + 1));
  }

  collide() {
    const R = this.racers;
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
      const a = R[i], b = R[j];
      if (a.gliding !== b.gliding) continue;
      const dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz;
      if (d2 > 4.8 || d2 < 1e-6) continue;
      const d = Math.sqrt(d2), over = 2.2 - d, nx = dx / d, nz = dz / d;
      if (a.star > 0 && b.star <= 0) { this.hit(b); continue; }
      if (b.star > 0 && a.star <= 0) { this.hit(a); continue; }
      const wa = b.weight / (a.weight + b.weight), wb = 1 - wa;
      a.x -= nx * over * wa; a.z -= nz * over * wa;
      b.x += nx * over * wb; b.z += nz * over * wb;
      if ((a.isPlayer || b.isPlayer) && (a.wallCd <= 0 && b.wallCd <= 0)) { sfx.bump(); a.wallCd = b.wallCd = 0.3; }
    }
  }

  hit(r) {
    if (r.star > 0 || r.spin > 0) return;
    r.spin = 1.1; r.speed *= 0.5; r.boost = 0;
    r.coins = Math.max(0, r.coins - 2);
    if (r.isPlayer) { sfx.hit(); this.hud.shake(); }
  }

  // ---------------- items ----------------
  rollItem(r) {
    if (r.item || r.rolling) return;
    r.rolling = r.isPlayer ? 1.4 : 0.8;
    if (r.isPlayer) { sfx.box(); this.hud.item({ rolling: true }); }
  }
  giveItem(r) {
    const grp = r.place <= 2 ? 0 : r.place <= 5 ? 1 : 2;
    const names = Object.keys(ITEMS);
    const total = names.reduce((s, n) => s + ITEMS[n].w[grp], 0);
    let x = Math.random() * total, pick = names[0];
    for (const n of names) { x -= ITEMS[n].w[grp]; if (x <= 0) { pick = n; break; } }
    r.item = pick; r.itemCount = pick === 'triple' ? 3 : 1;
    if (r.ai) r.ai.itemWait = 1 + Math.random() * 3;
    if (r.isPlayer) { sfx.got(); this.hud.item({ item: pick, count: r.itemCount }); }
  }
  useItem(r) {
    if (!r.item || r.rolling > 0) return;
    const t = this.t, kind = r.item;
    const done = () => { r.itemCount--; if (r.itemCount <= 0) r.item = null; if (r.isPlayer) this.hud.item(r.item ? { item: r.item, count: r.itemCount } : null); };
    switch (kind) {
      case 'peel': {
        const m = buildPeel(); this.scene.add(m);
        const x = r.x - Math.sin(r.heading) * 3, z = r.z - Math.cos(r.heading) * 3;
        const idx = t.nearest(x, z, r.idx);
        this.hazards.push({ x, z, idx, lat: t.lateral(idx, x, z), mesh: m, y: t.py[idx] });
        m.position.set(x, t.py[idx], z);
        if (r.isPlayer) sfx.drop();
        break;
      }
      case 'shell': case 'seeker': {
        const m = buildShell(kind === 'shell' ? 0x3fcf4a : 0xe8423f); this.scene.add(m);
        let target = null;
        if (kind === 'seeker') target = this.racers.find((o) => o.place === r.place - 1) || null;
        this.shots.push({ kind, owner: r, idx: (r.idx + 3) % t.N, pos: r.idx + 3, lat: clamp(r.lat, -t.hw + 1, t.hw - 1), speed: r.top * (kind === 'shell' ? 1.7 : 1.9), life: kind === 'shell' ? 5 : 9, target, mesh: m, x: r.x, z: r.z, y: r.y, safe: 0.3 });
        if (r.isPlayer) sfx.throw();
        break;
      }
      case 'boost': case 'triple': r.boost = Math.max(r.boost, 1.3); r.speed = Math.max(r.speed, r.top); if (r.isPlayer) sfx.boost(); break;
      case 'star': r.star = 7; r.spin = 0; if (r.isPlayer) sfx.star(); break;
      case 'zap':
        for (const o of this.racers) if (o !== r && o.star <= 0) { this.hit(o); o.shrink = 3.5; }
        sfx.zap(); this.hud.flash();
        break;
      case 'coin': r.coins = Math.min(r.coins + 3, 10); r.collected += 3; if (r.isPlayer) sfx.coin(); break;
    }
    done();
  }

  updatePickups(dt) {
    for (const b of this.boxes) {
      if (b.wait > 0) { b.wait -= dt; b.mesh.visible = b.wait <= 0; continue; }
      b.mesh.rotation.y += dt * 1.5; b.mesh.rotation.x += dt * 0.7;
      for (const r of this.racers) {
        if ((r.x - b.x) ** 2 + (r.z - b.z) ** 2 < 6.5 && Math.abs(r.y + 1 - b.y) < 3) {
          b.wait = 2; b.mesh.visible = false; this.rollItem(r); break;
        }
      }
    }
    for (const c of this.coins) {
      if (c.wait > 0) { c.wait -= dt; c.mesh.visible = c.wait <= 0; continue; }
      c.mesh.rotation.y += dt * 3;
      for (const r of this.racers) {
        if ((r.x - c.x) ** 2 + (r.z - c.z) ** 2 < 4 && Math.abs(r.y + 1 - c.y) < 3) {
          c.wait = 8; c.mesh.visible = false; r.coins = Math.min(r.coins + 1, 10); r.collected++;
          if (r.isPlayer) sfx.coin();
          break;
        }
      }
    }
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      for (const r of this.racers) {
        if (!r.gliding && (r.x - h.x) ** 2 + (r.z - h.z) ** 2 < 3.2) {
          this.hit(r); this.scene.remove(h.mesh); this.hazards.splice(i, 1); break;
        }
      }
    }
  }

  updateShots(dt) {
    const t = this.t;
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.life -= dt; s.safe -= dt;
      const tg = s.target;
      if (tg && !tg.finished && Math.hypot(tg.x - s.x, tg.z - s.z) < 30) {
        // home in
        const dx = tg.x - s.x, dz = tg.z - s.z, d = Math.hypot(dx, dz) || 1;
        s.x += (dx / d) * s.speed * dt; s.z += (dz / d) * s.speed * dt; s.y += (tg.y - s.y) * dt * 5;
        s.idx = t.nearest(s.x, s.z, s.idx); s.pos = s.idx; s.lat = t.lateral(s.idx, s.x, s.z);
      } else {
        s.pos += s.speed * dt;
        s.idx = Math.floor(s.pos) % t.N;
        if (tg) s.lat += (tg.lat - s.lat) * Math.min(1, dt * 2);
        s.x = t.px[s.idx] + t.rx[s.idx] * s.lat; s.z = t.pz[s.idx] + t.rz[s.idx] * s.lat;
        s.y = t.inGap(s.idx) ? s.y : t.py[s.idx];
      }
      s.mesh.position.set(s.x, s.y, s.z); s.mesh.rotation.y += dt * 12;
      let gone = s.life <= 0;
      for (const r of this.racers) {
        if (r === s.owner && s.safe > 0) continue;
        if ((r.x - s.x) ** 2 + (r.z - s.z) ** 2 < 4 && Math.abs(r.y - s.y) < 3) { this.hit(r); gone = true; break; }
      }
      for (let j = this.hazards.length - 1; j >= 0 && !gone; j--) {
        const h = this.hazards[j];
        if ((h.x - s.x) ** 2 + (h.z - s.z) ** 2 < 3) { this.scene.remove(h.mesh); this.hazards.splice(j, 1); gone = true; }
      }
      if (gone) { this.scene.remove(s.mesh); this.shots.splice(i, 1); }
    }
    for (const h of this.hazards) h.mesh.rotation.y += dt;
  }

  // ---------------- visuals ----------------
  placeMesh(r) {
    const m = r.mesh;
    m.root.position.set(r.x, r.y, r.z);
    m.root.rotation.y = r.heading;
  }
  animate(dt) {
    for (const r of this.racers) {
      const m = r.mesh;
      this.placeMesh(r);
      const driftYaw = r.drift ? r.drift * -0.45 : 0;
      m.body.rotation.y += (driftYaw + r.bodyYaw - m.body.rotation.y) * Math.min(1, dt * 10);
      if (r.spin <= 0 && Math.abs(r.bodyYaw) < 0.01) r.bodyYaw = 0;
      m.body.rotation.z = -r.steer * 0.08 * clamp(r.speed / r.top, 0, 1);
      m.body.position.y = r.drift ? Math.abs(Math.sin(this.clock * 30)) * 0.05 : 0;
      r.wheelSpin += r.speed * dt / 0.4;
      for (const w of m.wheels) w.rotation.x = r.wheelSpin;
      if (m.driver.userData.head) m.driver.userData.head.rotation.y = -r.steer * 0.3;
      const s = r.shrink > 0 ? 0.6 : 1;
      m.root.scale.setScalar(m.root.scale.x + (s - m.root.scale.x) * Math.min(1, dt * 8));
      // glider
      if (m.glider.visible) {
        const want = r.gliding ? 1 : 0;
        const sc = m.glider.scale.x + (want - m.glider.scale.x) * Math.min(1, dt * 6);
        m.glider.scale.setScalar(sc);
        if (!r.gliding && sc < 0.05) m.glider.visible = false;
        m.body.rotation.x = r.gliding ? -0.12 : 0;
      }
      m.shadow.position.y = (this.t.py[r.idx] - r.y) + 0.06;
      m.shadow.material.opacity = r.gliding ? 0.12 : 0.25;
      // sparks
      const lvl = r.drift ? r.driftLevel : 0;
      m.sparks.forEach((sp) => { sp.visible = r.drift !== 0 && lvl > 0; sp.scale.setScalar(0.18 + Math.random() * 0.15 * lvl); });
      if (lvl) m.sparkMat.color.setHex([0, 0x66ccff, 0xffa53a, 0xff6bd6][lvl]);
      m.flame.visible = r.boost > 0;
      if (r.boost > 0) m.flame.scale.set(1, 0.8 + Math.random() * 0.5, 1);
      m.aura.visible = r.star > 0;
      if (r.star > 0) m.aura.material.color.setHSL((this.clock * 2) % 1, 1, 0.6);
    }
  }

  snapCamera() {
    const P = this.player, fx = Math.sin(P.heading), fz = Math.cos(P.heading);
    this.camPos.set(P.x + fx * 8, P.y + 2.5, P.z + fz * 8);
    this.camLook.set(P.x, P.y + 1.2, P.z);
  }
  updateCamera(dt, intro) {
    const P = this.player;
    this.camHeading += wrapAng(P.heading - this.camHeading) * Math.min(1, dt * (P.drift ? 4 : 6));
    const fx = Math.sin(this.camHeading), fz = Math.cos(this.camHeading);
    const portrait = innerWidth < innerHeight;
    let back = portrait ? 8 : 7.5, up = portrait ? 3.6 : 3.1;
    if (P.gliding) { back = 9; up = 4.2; }
    if (intro) {
      // swing from the front of the kart to behind it during the countdown
      const k = clamp(this.clock / 3, 0, 1), ang = (1 - k) * Math.PI;
      const ex = Math.sin(this.camHeading + ang), ez = Math.cos(this.camHeading + ang);
      this.camPos.set(P.x - ex * back, P.y + up + (1 - k) * 0.5, P.z - ez * back);
      this.camLook.set(P.x, P.y + 1.2, P.z);
    } else if (this.state === 'finished') {
      const a = this.finishClock * 0.6;
      const want = new THREE.Vector3(P.x + Math.sin(a) * 9, P.y + 3.5, P.z + Math.cos(a) * 9);
      this.camPos.lerp(want, Math.min(1, dt * 3));
      this.camLook.set(P.x, P.y + 1.2, P.z);
    } else {
      const want = new THREE.Vector3(P.x - fx * back, P.y + up, P.z - fz * back);
      this.camPos.lerp(want, Math.min(1, dt * 10));
      this.camLook.set(P.x + fx * 6, P.y + 1.2, P.z + fz * 6);
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    const fov = (innerWidth < innerHeight ? 80 : 68) + (P.boost > 0 || P.star > 0 ? 10 : 0);
    this.camera.fov += (fov - this.camera.fov) * Math.min(1, dt * 4);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  render() { this.renderer.render(this.scene, this.camera); }

  report() {
    this.rank();
    const results = [...this.racers].sort((a, b) => a.place - b.place).map((r) => ({
      name: r.char.name, char: r.char, isPlayer: r.isPlayer, place: r.place, time: r.finished ? r.finishTime : null,
    }));
    this.onFinish({ results, place: this.player.place, coins: this.player.collected, time: this.player.finishTime });
  }

  dispose() {
    engineStop(); musicStop();
    // racers share cached geometry, so only free what the track built
    this.t.group.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); });
  }
}

// how far o is behind r, in track samples (big number if ahead)
function behind(r, o, t) { return ((r.idx - o.idx) % t.N + t.N) % t.N; }

export function pickOpponents(playerCharId, kartsAll, glidersAll, count = 7) {
  const pool = CHARACTERS.filter((c) => c.id !== playerCharId).sort(() => Math.random() - 0.5).slice(0, count);
  return pool.map((char) => ({ char, kart: kartsAll[Math.floor(Math.random() * kartsAll.length)], glider: glidersAll[Math.floor(Math.random() * glidersAll.length)] }));
}
export { buildStarMesh };
