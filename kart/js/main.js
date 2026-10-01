// Menus, garage, gift box, saving, input, and the race flow.
import * as THREE from 'three';
import { CHARACTERS, CLASS_STATS, KARTS, GLIDERS, TRACKS, CUPS, DIFFICULTY, POINTS, PLACE_COINS, GIFT_COST, ITEMS } from './data.js';
import { buildRacer, buildDriver, buildKart, buildGlider } from './models.js';
import { Race, pickOpponents } from './race.js';
import { unlock, sfx, setMusic, setSfx, musicStart, musicStop } from './audio.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------- save ----------------
const SAVE_KEY = 'kartparty.v1';
const fresh = () => ({
  coins: 0,
  unlocked: { chars: CHARACTERS.filter((c) => c.start).map((c) => c.id), karts: KARTS.filter((k) => k.start).map((k) => k.id), gliders: GLIDERS.filter((g) => g.start).map((g) => g.id) },
  fresh: [], sel: { char: 'pip', kart: 'classic', glider: 'wing' }, cups: {}, races: 0,
  settings: { difficulty: 'easy', assist: true, tilt: false, music: true, sfx: true },
});
let save;
try { save = { ...fresh(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch { save = fresh(); }
save.settings = { ...fresh().settings, ...save.settings };
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* private mode: progress lasts this visit only */ } };
const byId = (list, id) => list.find((x) => x.id === id) || list[0];
const sel = () => ({ char: byId(CHARACTERS, save.sel.char), kart: byId(KARTS, save.sel.kart), glider: byId(GLIDERS, save.sel.glider) });

// ---------------- renderer ----------------
const canvas = $('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));

// menu scene: the selected racer on a turntable
const menu = { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(40, 1, 0.1, 500), racers: [] };
menu.scene.background = new THREE.Color(0x8fd3ff);
menu.scene.fog = new THREE.Fog(0x8fd3ff, 40, 140);
menu.scene.add(new THREE.HemisphereLight(0xffffff, 0x7a8a6a, 1.7));
{ const d = new THREE.DirectionalLight(0xffffff, 1.5); d.position.set(3, 6, 4); menu.scene.add(d); }
{
  const g = new THREE.Mesh(new THREE.CircleGeometry(200, 40), new THREE.MeshLambertMaterial({ color: 0x6ccf5a })); g.rotation.x = -Math.PI / 2; menu.scene.add(g);
  const tt = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.4, 40), new THREE.MeshLambertMaterial({ color: 0xffffff })); tt.position.y = 0.2; menu.scene.add(tt); menu.table = tt;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.12, 8, 48), new THREE.MeshLambertMaterial({ color: 0xe8423f })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.4; menu.scene.add(ring); menu.ring = ring;
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2, R = 26 + (i % 3) * 9;
    const t = new THREE.Group();
    t.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 8), new THREE.MeshLambertMaterial({ color: 0x8a5a33 })), 0, 1.5, 0));
    t.add(at(new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 0), new THREE.MeshLambertMaterial({ color: 0x3fae49, flatShading: true })), 0, 4.4, 0));
    t.position.set(Math.cos(a) * R, 0, Math.sin(a) * R - 10); menu.scene.add(t);
  }
}
function showMenuRacer(mode = 'turntable', podium) {
  for (const r of menu.racers) menu.scene.remove(r);
  menu.racers = [];
  menu.mode = mode;
  menu.table.visible = menu.ring.visible = mode === 'turntable';
  if (mode === 'turntable') {
    const s = sel();
    const r = buildRacer(s.char, s.kart, s.glider);
    const showGlider = current === 'garage' && tab === 'gliders';
    r.glider.visible = showGlider; r.glider.scale.setScalar(0.9);
    r.root.position.y = 0.4;
    menu.scene.add(r.root); menu.racers.push(r.root); menu.spin = r.root;
  } else {
    // podium: [1st, 2nd, 3rd]
    const spots = [[0, 2.4], [-3.4, 1.6], [3.4, 1.0]];
    const cols = [0xffd23a, 0xc9d1dc, 0xe0995a];
    podium.forEach((p, i) => {
      const block = new THREE.Mesh(new THREE.BoxGeometry(3.2, spots[i][1], 3.2), new THREE.MeshLambertMaterial({ color: cols[i] }));
      block.position.set(spots[i][0], spots[i][1] / 2, 0); menu.scene.add(block); menu.racers.push(block);
      const r = buildRacer(p.char, byId(KARTS, p.kart || 'classic'), GLIDERS[0]);
      r.root.position.set(spots[i][0], spots[i][1], 0); r.root.rotation.y = 0.2 * (i ? -Math.sign(spots[i][0]) : 0);
      menu.scene.add(r.root); menu.racers.push(r.root);
    });
    menu.spin = null;
  }
}
function renderMenu(dt) {
  const portrait = innerWidth < innerHeight;
  menu.camera.aspect = innerWidth / innerHeight;
  if (menu.mode === 'podium') {
    menu.camera.clearViewOffset();
    menu.camera.fov = portrait ? 62 : 40;
    // racers sit in the top half, above the results panel
    menu.camera.position.set(0, 6, portrait ? 19 : 15); menu.camera.lookAt(0, portrait ? -3.2 : -1.5, 0);
  } else {
    menu.camera.fov = portrait ? 50 : 34;
    // landscape phones: buttons sit on the right, so shift the racer left
    menu.camera.setViewOffset(innerWidth, innerHeight, !portrait && innerHeight < 540 ? innerWidth * 0.24 : 0, 0, innerWidth, innerHeight);
    // racer sits in the top part of the screen, above the panels
    const garage = $('#garage').classList.contains('on');
    const gl = garage && tab === 'gliders';
    menu.camera.position.set(0, garage ? 4.6 : 4, (portrait ? 13 : 11) + (gl ? 4 : 0));
    menu.camera.lookAt(0, garage ? (portrait ? (gl ? 0.2 : -0.6) : 0.9) : (portrait ? 0.2 : 1.1), 0);
  }
  menu.camera.updateProjectionMatrix();
  if (menu.spin) menu.spin.rotation.y += dt * 0.6;
  renderer.render(menu.scene, menu.camera);
}

// ---------------- portraits (small pictures for the cards) ----------------
const portraits = {};
function makePortraits() {
  const pr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  pr.setSize(160, 160); pr.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xffffff, 0x99aabb, 2));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(2, 3, 4); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const shot = (obj, pos, look) => {
    sc.add(obj); cam.position.set(...pos); cam.lookAt(...look);
    pr.render(sc, cam); const url = pr.domElement.toDataURL(); sc.remove(obj); return url;
  };
  for (const c of CHARACTERS) { const d = buildDriver(c); d.rotation.y = -0.35; portraits['c_' + c.id] = shot(d, [0, 1.2, 4.2], [0, 1.0, 0]); }
  const s = sel();
  const tint = s.char.color === 0xf7f7f7 || s.char.color === 0xfaf4ff ? s.char.accent : s.char.color;
  for (const k of KARTS) { const g = buildKart(k, tint).group; g.rotation.y = -0.7; portraits['k_' + k.id] = shot(g, [0, 3.2, 6.2], [0, 0.6, 0]); }
  for (const gl of GLIDERS) { const g = buildGlider(gl); g.rotation.x = 0.9; portraits['g_' + gl.id] = shot(g, [0, 1.5, 6.5], [0, 0, 0]); }
  pr.dispose(); pr.forceContextLoss?.();
}

// ---------------- screens ----------------
let current = 'title', previous = 'menu';
function go(id) {
  if (id === 'settings') previous = current;
  $$('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
  current = id;
  $$('[data-coins]').forEach((e) => (e.textContent = save.coins));
  if (id !== 'results' && menu.mode === 'podium') showMenuRacer();
  if (id === 'menu') { showMenuRacer(); renderMenuInfo(); }
  if (id === 'garage') { showMenuRacer(); renderGarage(); }
  if (id === 'cups') renderCups();
  if (id === 'tracks') renderTracks();
  if (id === 'gift') renderGift();
  if (id === 'settings') renderSettings();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (b) { sfx.tap(); go(b.dataset.go); }
  if (e.target.closest('[data-back]')) { sfx.tap(); go(previous); }
});

function renderMenuInfo() {
  const s = sel();
  $('#selName').textContent = s.char.name;
  const pool = lockedPool().length;
  $('#giftBadge').textContent = save.coins >= GIFT_COST && pool ? '✨' : '';
}

// garage
let tab = 'chars';
$$('.tab').forEach((t) => t.addEventListener('click', () => { tab = t.dataset.tab; sfx.tap(); showMenuRacer(); renderGarage(); }));
function statsFor() {
  const s = sel(), b = CLASS_STATS[s.char.cls];
  return { Speed: b.speed + s.kart.mod.speed, Acceleration: b.accel + s.kart.mod.accel, Handling: b.handling + s.kart.mod.handling, Weight: b.weight };
}
function renderGarage() {
  $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === tab));
  const s = sel();
  $('#garName').textContent = `${s.char.name} · ${s.kart.name} · ${s.glider.name}`;
  $('#stats').innerHTML = Object.entries(statsFor()).map(([k, v]) => `<span>${k}</span><div class="bar"><i style="width:${clamp(v, 1, 7) / 7 * 100}%"></i></div>`).join('');
  const [list, key, pre] = tab === 'chars' ? [CHARACTERS, 'chars', 'c_'] : tab === 'karts' ? [KARTS, 'karts', 'k_'] : [GLIDERS, 'gliders', 'g_'];
  const selKey = { chars: 'char', karts: 'kart', gliders: 'glider' }[key];
  $('#grid').innerHTML = list.map((x) => {
    const open = save.unlocked[key].includes(x.id);
    const isNew = save.fresh.includes(pre + x.id);
    return `<button class="card ${open ? '' : 'locked'} ${save.sel[selKey] === x.id ? 'on' : ''} ${isNew ? 'new' : ''}" data-id="${x.id}"><img src="${portraits[pre + x.id]}" alt=""><span>${open ? x.name : '???'}</span></button>`;
  }).join('');
  $$('#grid .card').forEach((c) => c.addEventListener('click', () => {
    const id = c.dataset.id;
    if (!save.unlocked[key].includes(id)) { sfx.bump?.(); flashMsg('Open the Gift Box to unlock!'); return; }
    sfx.tap();
    save.sel[selKey] = id;
    save.fresh = save.fresh.filter((f) => f !== pre + id);
    persist();
    if (key === 'chars') refreshKartPortraits();
    showMenuRacer(); renderGarage();
  }));
}
function refreshKartPortraits() {
  // karts are painted in the driver's color
  const pr = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  pr.setSize(160, 160); pr.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x99aabb, 2));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(2, 3, 4); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 3.2, 6.2); cam.lookAt(0, 0.6, 0);
  const s = sel(), tint = s.char.color === 0xf7f7f7 || s.char.color === 0xfaf4ff ? s.char.accent : s.char.color;
  for (const k of KARTS) { const g = buildKart(k, tint).group; g.rotation.y = -0.7; sc.add(g); pr.render(sc, cam); portraits['k_' + k.id] = pr.domElement.toDataURL(); sc.remove(g); }
  pr.dispose(); pr.forceContextLoss?.();
}
let msgTimer;
function flashMsg(text) {
  let el = $('#msg');
  if (!el) { el = document.createElement('div'); el.id = 'msg'; el.className = 'h-toast'; el.style.position = 'fixed'; el.style.zIndex = 10; el.style.top = 'calc(12px + var(--safe-t))'; el.style.bottom = 'auto'; document.body.append(el); }
  el.textContent = text; el.classList.add('on');
  clearTimeout(msgTimer); msgTimer = setTimeout(() => el.classList.remove('on'), 1800);
}

// cups + tracks
const cupOpen = (i) => i === 0 || (save.cups[CUPS[i - 1].id] ?? 9) <= 3;
function renderCups() {
  $('#cupList').innerHTML = CUPS.map((c, i) => {
    const open = cupOpen(i), best = save.cups[c.id];
    const trophy = best === 1 ? '🥇' : best === 2 ? '🥈' : best === 3 ? '🥉' : '';
    const names = c.tracks.map((t) => byId(TRACKS, t).name).join(' · ');
    return `<button class="btn cup ${i ? '' : 'red'}" data-cup="${c.id}" ${open ? '' : 'disabled'}><span class="ico">${open ? c.icon : '🔒'}</span><span>${c.name}<small>${open ? names : 'Finish the ' + CUPS[i - 1].name + ' in the top 3'}</small></span><span class="trophy">${trophy}</span></button>`;
  }).join('');
  $$('[data-cup]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); startCup(b.dataset.cup); }));
}
function renderTracks() {
  const open = new Set(CUPS.filter((_, i) => cupOpen(i)).flatMap((c) => c.tracks));
  $('#trackList').innerHTML = TRACKS.map((t) => `<button class="btn ${open.has(t.id) ? '' : ''}" data-track="${t.id}" ${open.has(t.id) ? '' : 'disabled'}>${open.has(t.id) ? '' : '🔒 '}${t.name}</button>`).join('');
  $$('[data-track]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); gp = null; startRace(byId(TRACKS, b.dataset.track)); }));
}

// gift box
function lockedPool() {
  return [
    ...CHARACTERS.filter((c) => !save.unlocked.chars.includes(c.id)).map((x) => ({ key: 'chars', pre: 'c_', x, kind: 'New driver!' })),
    ...KARTS.filter((c) => !save.unlocked.karts.includes(c.id)).map((x) => ({ key: 'karts', pre: 'k_', x, kind: 'New kart!' })),
    ...GLIDERS.filter((c) => !save.unlocked.gliders.includes(c.id)).map((x) => ({ key: 'gliders', pre: 'g_', x, kind: 'New glider!' })),
  ];
}
function renderGift() {
  $('#reveal').classList.remove('on'); $('#giftBox').style.display = '';
  const pool = lockedPool();
  const btn = $('#openGift');
  if (!pool.length) { btn.disabled = true; btn.textContent = 'Everything unlocked! 🎉'; $('#giftText').textContent = 'You have every driver, kart and glider.'; return; }
  btn.disabled = save.coins < GIFT_COST;
  btn.innerHTML = `Open for <i class="coin-i"></i> ${GIFT_COST}`;
  $('#giftText').textContent = save.coins < GIFT_COST ? `Collect ${GIFT_COST - save.coins} more coins in races to open it.` : `${pool.length} surprises left inside!`;
}
let opening = false;
$('#openGift').addEventListener('click', () => openGift(false));
function openGift(free) {
  const pool = lockedPool();
  if (opening || !pool.length || (!free && save.coins < GIFT_COST)) return;
  opening = true;
  if (!free) save.coins -= GIFT_COST;
  $$('[data-coins]').forEach((e) => (e.textContent = save.coins));
  const prize = pool[Math.floor(Math.random() * pool.length)];
  save.unlocked[prize.key].push(prize.x.id); save.fresh.push(prize.pre + prize.x.id); persist();
  $('#reveal').classList.remove('on');
  const box = $('#giftBox'); box.style.display = ''; box.classList.add('shake'); sfx.box();
  $('#openGift').disabled = true;
  setTimeout(() => {
    box.classList.remove('shake'); box.style.display = 'none';
    $('#revealImg').src = portraits[prize.pre + prize.x.id];
    $('#revealName').textContent = prize.x.name; $('#revealKind').textContent = prize.kind;
    $('#reveal').classList.add('on'); sfx.unlock();
    opening = false;
    const left = lockedPool().length;
    $('#openGift').disabled = !left || save.coins < GIFT_COST;
    $('#giftText').textContent = left ? (save.coins >= GIFT_COST ? 'Open another?' : `Collect ${GIFT_COST - save.coins} more coins for the next one.`) : 'That was the last one. You have everything!';
  }, 1600);
}

// settings
function renderSettings() {
  $$('#diffSeg button').forEach((b) => b.classList.toggle('on', b.dataset.d === save.settings.difficulty));
  $$('[data-set]').forEach((b) => b.classList.toggle('on', !!save.settings[b.dataset.set]));
}
$$('#diffSeg button').forEach((b) => b.addEventListener('click', () => { save.settings.difficulty = b.dataset.d; persist(); sfx.tap(); renderSettings(); }));
$$('[data-set]').forEach((b) => b.addEventListener('click', async () => {
  const k = b.dataset.set, on = !save.settings[k];
  if (k === 'tilt' && on && typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
    try { if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') { flashMsg('Tilt needs motion permission'); return; } } catch { flashMsg('Tilt is not available'); return; }
  }
  save.settings[k] = on; persist(); sfx.tap();
  setMusic(save.settings.music); setSfx(save.settings.sfx);
  if (race) race.settings = save.settings;
  renderSettings();
}));
$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Start over? This clears coins and everything you unlocked.')) return;
  save = fresh(); persist(); makePortraits(); go('menu');
});

// ---------------- input ----------------
const input = {
  steer: 0, holding: false, item: false, drag: 0, tilt: 0, keys: 0,
  consumeItem() { const v = this.item; this.item = false; return v; },
};
let dragId = null, dragX = 0;
addEventListener('pointerdown', (e) => {
  if (current !== 'hud') return;
  if (e.target.closest('button')) return;
  dragId = e.pointerId; dragX = e.clientX; input.holding = true; input.drag = 0;
});
addEventListener('pointermove', (e) => {
  if (e.pointerId !== dragId) return;
  const range = Math.min(innerWidth, 520) * 0.2;
  let d = (e.clientX - dragX) / range;
  if (Math.abs(d) > 1) { dragX = e.clientX - Math.sign(d) * range; d = Math.sign(d); }
  input.drag = d;
});
const endDrag = (e) => { if (e.pointerId === dragId) { dragId = null; input.drag = 0; input.holding = false; } };
addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
const keys = {};
addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (current === 'hud' && (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w')) { input.item = true; e.preventDefault(); }
  if (current === 'hud') input.holding = true;
  if (e.key === 'Escape' && race) pauseRace();
});
addEventListener('keyup', (e) => { keys[e.key] = false; if (!Object.values(keys).some(Boolean) && dragId === null) input.holding = false; });
addEventListener('deviceorientation', (e) => {
  if (!save.settings.tilt) return;
  const ang = (screen.orientation?.angle ?? window.orientation ?? 0);
  let v = ang === 90 ? e.beta : ang === -90 || ang === 270 ? -e.beta : e.gamma;
  input.tilt = clamp((v || 0) / 22, -1, 1);
});
function readSteer(dt) {
  const k = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
  input.keys += (k - input.keys) * Math.min(1, dt * 10);
  let s = dragId !== null ? input.drag : save.settings.tilt ? input.tilt : 0;
  if (Math.abs(input.keys) > 0.01) s = input.keys;
  input.steer = s;
}
$('#hItem').addEventListener('pointerdown', (e) => { e.preventDefault(); input.item = true; });

// ---------------- HUD ----------------
const suffix = (n) => (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
const hud = {
  last: {},
  setup({ track, laps }) {
    this.laps = laps; this.track = track; this.last = {};
    // draw the minimap path once
    const b = track.bounds, size = 220, pad = 18;
    const sc = (size - pad * 2) / Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    this.map = { sc, ox: pad + ((size - pad * 2) - (b.maxX - b.minX) * sc) / 2 - b.minX * sc, oz: pad + ((size - pad * 2) - (b.maxZ - b.minZ) * sc) / 2 - b.minZ * sc };
    const off = document.createElement('canvas'); off.width = off.height = size;
    const x = off.getContext('2d');
    x.lineJoin = x.lineCap = 'round';
    const path = () => { x.beginPath(); for (let i = 0; i <= track.N; i += 4) { const j = i % track.N; const X = track.px[j] * sc + this.map.ox, Y = track.pz[j] * sc + this.map.oz; i ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.closePath(); };
    path(); x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 16; x.stroke();
    path(); x.strokeStyle = '#fff'; x.lineWidth = 9; x.stroke();
    this.mapBg = off;
    this.item(null);
    $('#hCenter').className = 'h-center'; $('#hBanner').className = 'h-banner';
    $('#hHint').style.opacity = save.races < 3 ? 1 : 0;
  },
  update(s) {
    if (s.place !== this.last.place) { $('#hPlace').innerHTML = `${s.place}<sup>${suffix(s.place)}</sup>`; this.last.place = s.place; }
    if (s.lap !== this.last.lap) { $('#hLap').textContent = `Lap ${s.lap}/${this.laps}`; this.last.lap = s.lap; }
    if (s.coins !== this.last.coins) { $('#hCoins').textContent = s.coins; this.last.coins = s.coins; }
    const tt = fmtTime(s.time);
    if (tt !== this.last.time) { $('#hTime').textContent = tt; this.last.time = tt; }
    if (s.time > 4 && !this.hintGone) { this.hintGone = true; $('#hHint').style.opacity = 0; }
    // minimap
    const c = $('#hMap').getContext('2d'); c.clearRect(0, 0, 220, 220); c.drawImage(this.mapBg, 0, 0);
    for (const r of [...s.racers].sort((a, b) => (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0))) {
      const X = r.x * this.map.sc + this.map.ox, Y = r.z * this.map.sc + this.map.oz;
      c.beginPath(); c.arc(X, Y, r.isPlayer ? 11 : 7, 0, Math.PI * 2);
      c.fillStyle = '#' + r.char.color.toString(16).padStart(6, '0'); c.fill();
      c.lineWidth = r.isPlayer ? 4 : 2; c.strokeStyle = r.isPlayer ? '#ffd23a' : '#222'; c.stroke();
    }
    // roulette
    if (this.rolling) { const icons = Object.values(ITEMS).map((i) => i.icon); $('#hItem').firstChild.textContent = icons[Math.floor(performance.now() / 70) % icons.length]; }
  },
  countdown(n) { const e = $('#hCenter'); e.textContent = n; e.className = 'h-center'; void e.offsetWidth; e.className = 'h-center go'; },
  banner(t) { const e = $('#hBanner'); e.textContent = t; e.className = 'h-banner'; void e.offsetWidth; e.className = 'h-banner go'; },
  toast(t) { const e = $('#hToast'); e.textContent = t; e.classList.add('on'); clearTimeout(this.tt); this.tt = setTimeout(() => e.classList.remove('on'), 1200); },
  item(s) {
    const e = $('#hItem');
    this.rolling = !!(s && s.rolling);
    e.innerHTML = '<span></span>';
    e.classList.toggle('ready', !!(s && s.item));
    if (s && s.item) { e.firstChild.textContent = ITEMS[s.item].icon; if (s.count > 1) e.insertAdjacentHTML('beforeend', `<span class="cnt">×${s.count}</span>`); }
  },
  finish(place) { this.banner(place <= 3 ? 'Finish! 🎉' : 'Finish!'); },
  shake() { const h = $('#hud'); h.classList.remove('shake'); void h.offsetWidth; h.classList.add('shake'); navigator.vibrate?.(120); },
  flash() { const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); },
};
const fmtTime = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

// ---------------- race flow ----------------
let race = null, gp = null, lastTrack = null;

function startCup(cupId) {
  const cup = byId(CUPS, cupId);
  const s = sel();
  const others = pickOpponents(s.char.id, KARTS, GLIDERS);
  gp = { cup, i: 0, others, points: new Map([[s.char.id, 0], ...others.map((o) => [o.char.id, 0])]) };
  startRace(byId(TRACKS, cup.tracks[0]));
}

function startRace(trackDef) {
  if (race) { race.dispose(); race = null; }
  lastTrack = trackDef;
  const s = sel();
  const others = gp ? gp.others : pickOpponents(s.char.id, KARTS, GLIDERS);
  go('hud');
  hud.hintGone = false;
  input.item = false; input.drag = 0; dragId = null;
  race = new Race({ renderer, track: trackDef, player: s, others, difficulty: DIFFICULTY[save.settings.difficulty], settings: save.settings, hud, input, onFinish: finishRace });
}

function finishRace({ results, place, coins }) {
  save.races++;
  const earned = coins + PLACE_COINS[place - 1];
  save.coins += earned;
  persist();
  musicStop();
  const list = $('#resList');
  let title = place === 1 ? 'You won! 🏆' : place <= 3 ? `${place}${suffix(place)} place! 🎉` : `${place}${suffix(place)} place`;
  let buttons = [];
  if (gp) {
    results.forEach((r) => gp.points.set(r.char.id, (gp.points.get(r.char.id) || 0) + POINTS[r.place - 1]));
    gp.last = results;
    const standings = standingsList();
    list.innerHTML = results.map((r) => row(r.place, r.char, r.isPlayer, `+${POINTS[r.place - 1]}`)).join('');
    const lastRace = gp.i >= gp.cup.tracks.length - 1;
    title = `Race ${gp.i + 1} of ${gp.cup.tracks.length}: ${title}`;
    buttons = lastRace ? [['See trophy', 'yellow', () => cupFinal(standings)]] : [['Next race ▶', 'green', () => { gp.i++; startRace(byId(TRACKS, gp.cup.tracks[gp.i])); }]];
    buttons.unshift(['Standings', 'white', () => showStandings(standings, lastRace)]);
  } else {
    list.innerHTML = results.map((r) => row(r.place, r.char, r.isPlayer, r.time ? fmtTime(r.time) : '')).join('');
    buttons = [['Race again', 'green', () => startRace(lastTrack)], ['Menu', 'white', () => toMenu()]];
  }
  $('#resTitle').textContent = title;
  $('#earned').innerHTML = `<i class="coin-i"></i> +${earned} coins <span style="color:var(--mute);font-size:15px">(total ${save.coins})</span>`;
  setButtons(buttons);
  go('results');
  if (save.coins >= GIFT_COST && lockedPool().length) flashMsg('You can open a Gift Box! 🎁');
}
function row(p, char, me, right) {
  return `<li class="${me ? 'me' : ''}"><span class="p">${p}</span><img src="${portraits['c_' + char.id]}" alt=""><span>${char.name}${me ? ' (you)' : ''}</span><span class="pts">${right}</span></li>`;
}
function setButtons(btns) {
  const box = $('#resBtns'); box.innerHTML = '';
  for (const [t, c, fn] of btns) { const b = document.createElement('button'); b.className = 'btn ' + c; b.textContent = t; b.onclick = () => { sfx.tap(); fn(); }; box.append(b); }
}
function standingsList() {
  const all = [{ char: sel().char, isPlayer: true }, ...gp.others.map((o) => ({ char: o.char, kart: o.kart.id, isPlayer: false }))];
  all.forEach((a) => (a.pts = gp.points.get(a.char.id) || 0));
  all.sort((a, b) => b.pts - a.pts || (a.isPlayer ? -1 : 1));
  all.forEach((a, i) => (a.place = i + 1));
  return all;
}
function showStandings(standings, lastRace) {
  $('#resTitle').textContent = `${gp.cup.name} standings`;
  $('#resList').innerHTML = standings.map((a) => row(a.place, a.char, a.isPlayer, `${a.pts} pts`)).join('');
  setButtons(lastRace ? [['See trophy', 'yellow', () => cupFinal(standings)]] : [['Next race ▶', 'green', () => { gp.i++; startRace(byId(TRACKS, gp.cup.tracks[gp.i])); }]]);
}
function cupFinal(standings) {
  if (race) { race.dispose(); race = null; }
  const me = standings.find((a) => a.isPlayer);
  const prevBest = save.cups[gp.cup.id] ?? 9;
  save.cups[gp.cup.id] = Math.min(prevBest, me.place);
  const bonus = me.place === 1 ? 100 : me.place === 2 ? 60 : me.place === 3 ? 40 : 10;
  save.coins += bonus; persist();
  showMenuRacer('podium', standings.slice(0, 3).map((a) => ({ char: a.char, kart: a.isPlayer ? sel().kart.id : a.kart })));
  const medal = ['🥇 Gold trophy!', '🥈 Silver trophy!', '🥉 Bronze trophy!'][me.place - 1] || `${me.place}${suffix(me.place)} overall`;
  $('#resTitle').textContent = `${gp.cup.name}: ${medal}`;
  $('#resList').innerHTML = standings.slice(0, 3).map((a) => row(a.place, a.char, a.isPlayer, `${a.pts} pts`)).join('');
  let extra = '';
  const idx = CUPS.indexOf(gp.cup);
  if (me.place <= 3 && prevBest > 3 && CUPS[idx + 1]) extra += `<div>🔓 ${CUPS[idx + 1].name} unlocked!</div>`;
  $('#earned').innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><div><i class="coin-i" style="vertical-align:middle"></i> +${bonus} cup bonus</div>${extra}</div>`;
  const btns = [['Menu', 'white', () => toMenu()]];
  if (me.place === 1 && lockedPool().length) btns.unshift(['Free gift! 🎁', 'yellow', () => { go('gift'); setTimeout(() => openGift(true), 300); }]);
  setButtons(btns);
  sfx.unlock();
  $('#results').style.justifyContent = 'flex-end';
  go('results');
  gp = null;
}
function toMenu() {
  if (race) { race.dispose(); race = null; }
  gp = null; $('#results').style.justifyContent = '';
  musicStart(3, 120);
  go('menu');
}
function pauseRace() {
  if (!race || race.state === 'finished') return;
  race.paused = true; musicStop(); go('pause');
}
$('#hPause').addEventListener('click', pauseRace);
$('#resume').addEventListener('click', () => { if (!race) return; race.paused = false; go('hud'); musicStart(lastTrack.id.length * 7 + lastTrack.points.length, 150); });
$('#restart').addEventListener('click', () => startRace(lastTrack));
$('#quit').addEventListener('click', () => toMenu());
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseRace(); });

// ---------------- boot ----------------
makePortraits();
showMenuRacer();
setMusic(save.settings.music); setSfx(save.settings.sfx);
$('#title').addEventListener('pointerup', () => {
  unlock(); sfx.go(); musicStart(3, 120);
  go('menu');
}, { once: true });

let lastT = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (race && (current === 'hud' || current === 'pause' || current === 'results' && menu.mode !== 'podium' || current === 'settings' && previous === 'pause')) {
    readSteer(dt);
    race.update(dt);
    race.render();
  } else renderMenu(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.__kp = { save, get race() { return race; }, startRace: (id) => { gp = null; startRace(byId(TRACKS, id)); }, input, go };
function at(m, x, y, z) { m.position.set(x, y, z); return m; }
