// Menus, profile, tour, garage, gifts, challenges, saving, input, and the race flow.
import * as THREE from 'three';
import { CHARACTERS, CLASS_STATS, KARTS, GLIDERS, TRACKS, CUPS, MODES, STARS, CHALLENGES, DAILY, xpForLevel, DIFFICULTY, PLACE_COINS, GIFT_COST, ITEMS, allModelPaths } from './data.js';
import { preload } from './assets.js';
import { buildRacer, buildDriver, buildKart, buildGlider } from './models.js';
import { Race, pickOpponents } from './race.js';
import { unlock, sfx, setMusic, setSfx, musicStart, musicStop } from './audio.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// ---------------- save ----------------
const SAVE_KEY = 'kartparty.v1';
const fresh = () => ({
  coins: 0, xp: 0, level: 1, profile: null,
  unlocked: { chars: CHARACTERS.filter((c) => c.start).map((c) => c.id), karts: KARTS.filter((k) => k.start).map((k) => k.id), gliders: GLIDERS.filter((g) => g.start).map((g) => g.id) },
  fresh: [], sel: { char: 'pip', kart: 'racer', glider: 'wing' }, races: 0,
  stars: {}, best: {}, stats: {}, tiers: {}, daily: { last: '', streak: 0 },
  settings: { difficulty: 'easy', assist: true, tilt: false, music: true, sfx: true },
});
let save;
try { save = { ...fresh(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch { save = fresh(); }
save.settings = { ...fresh().settings, ...save.settings };
for (const k of ['stars', 'best', 'stats', 'tiers']) save[k] = save[k] || {};
save.daily = save.daily || { last: '', streak: 0 };
// drop drivers/karts that no longer exist and keep the starters
{
  const f = fresh(), keep = (key, list) => [...new Set([...f.unlocked[key], ...(save.unlocked?.[key] || []).filter((id) => list.some((x) => x.id === id))])];
  save.unlocked = { chars: keep('chars', CHARACTERS), karts: keep('karts', KARTS), gliders: keep('gliders', GLIDERS) };
  if (!CHARACTERS.some((c) => c.id === save.sel.char)) save.sel.char = 'pip';
  if (!KARTS.some((k) => k.id === save.sel.kart)) save.sel.kart = 'racer';
  save.fresh = (save.fresh || []).filter((x) => [...CHARACTERS.map((c) => 'c_' + c.id), ...KARTS.map((k) => 'k_' + k.id), ...GLIDERS.map((g) => 'g_' + g.id)].includes(x));
}
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* private mode: progress lasts this visit only */ } };
const byId = (list, id) => list.find((x) => x.id === id) || list[0];
const sel = () => ({ char: byId(CHARACTERS, save.sel.char), kart: byId(KARTS, save.sel.kart), glider: byId(GLIDERS, save.sel.glider) });
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
const eventKey = (track, mode) => `${track}:${mode}`;
const bump = (k, n = 1) => { save.stats[k] = (save.stats[k] || 0) + n; };

// ---------------- renderer + menu scene ----------------
const canvas = $('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));

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
    r.glider.visible = current === 'garage' && tab === 'gliders'; r.glider.scale.setScalar(0.9);
    r.root.position.y = 0.4;
    menu.scene.add(r.root); menu.racers.push(r.root); menu.spin = r.root;
  } else {
    const spots = [[0, 2.4], [-3.4, 1.6], [3.4, 1.0]];
    const cols = [0xffd23a, 0xc9d1dc, 0xe0995a];
    podium.forEach((p, i) => {
      const block = new THREE.Mesh(new THREE.BoxGeometry(3.2, spots[i][1], 3.2), new THREE.MeshLambertMaterial({ color: cols[i] }));
      block.position.set(spots[i][0], spots[i][1] / 2, 0); menu.scene.add(block); menu.racers.push(block);
      const r = buildRacer(p.char, byId(KARTS, p.kart || 'racer'), GLIDERS[0]);
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
    menu.camera.position.set(0, 6, portrait ? 19 : 15); menu.camera.lookAt(0, portrait ? -3.2 : -1.5, 0);
  } else {
    menu.camera.fov = portrait ? 50 : 34;
    menu.camera.setViewOffset(innerWidth, innerHeight, !portrait && innerHeight < 540 ? innerWidth * 0.24 : 0, 0, innerWidth, innerHeight);
    const garage = current === 'garage', gl = garage && tab === 'gliders';
    menu.camera.position.set(0, garage ? 4.6 : 4, (portrait ? 13 : 11) + (gl ? 4 : 0));
    menu.camera.lookAt(0, garage ? (portrait ? (gl ? -1.2 : -2.4) : 0.9) : (portrait ? -0.4 : 1.1), 0);
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
  const shot = (obj, pos, look) => { sc.add(obj); cam.position.set(...pos); cam.lookAt(...look); pr.render(sc, cam); const url = pr.domElement.toDataURL(); sc.remove(obj); return url; };
  for (const c of CHARACTERS) { const d = buildDriver(c); d.rotation.y = -0.45; portraits['c_' + c.id] = shot(d, [0, 0.8, 2.7], [0, 0.48, 0]); }
  for (const k of KARTS) { const g = buildKart(k).group; g.rotation.y = -0.7; portraits['k_' + k.id] = shot(g, [0, 3.4, 6.6], [0, 0.6, 0]); }
  for (const gl of GLIDERS) { const g = buildGlider(gl); g.rotation.x = 0.9; portraits['g_' + gl.id] = shot(g, [0, 1.5, 6.5], [0, 0, 0]); }
  pr.dispose(); pr.forceContextLoss?.();
}

// ---------------- screens ----------------
const TAB_SCREENS = ['menu', 'cups', 'cup', 'gift', 'garage', 'challenges', 'settings'];
let current = 'title', previous = 'menu', openCup = null;
function go(id) {
  if (id === 'settings' && current !== 'settings') previous = current;
  $$('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
  current = id;
  const tabbed = TAB_SCREENS.includes(id) && !(id === 'settings' && previous === 'pause');
  $('#tabs').classList.toggle('on', tabbed);
  $$('#tabs [data-go]').forEach((b) => b.classList.toggle('on', b.dataset.go === id || (id === 'cup' && b.dataset.go === 'cups')));
  refreshTop();
  if (id !== 'results' && menu.mode === 'podium') showMenuRacer();
  if (id === 'menu') { showMenuRacer(); renderHome(); }
  if (id === 'garage') { showMenuRacer(); renderGarage(); }
  if (id === 'cups') renderCups();
  if (id === 'cup') renderCup();
  if (id === 'tracks') renderTracks();
  if (id === 'gift') renderGift();
  if (id === 'challenges') renderChallenges();
  if (id === 'settings') renderSettings();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (b) { sfx.tap(); go(b.dataset.go); }
  if (e.target.closest('[data-back]')) { sfx.tap(); go(previous); }
});
function refreshTop() {
  $$('[data-coins]').forEach((e) => (e.textContent = fmt(save.coins)));
  $$('[data-stars]').forEach((e) => (e.textContent = totalStars()));
  const need = xpForLevel(save.level);
  $$('[data-level]').forEach((e) => (e.textContent = save.level));
  $$('[data-pname]').forEach((e) => (e.textContent = save.profile?.name || 'Racer'));
  $$('[data-xpbar]').forEach((e) => (e.style.width = `${clamp(save.xp / need, 0, 1) * 100}%`));
  const ready = claimableChallenges();
  $('#chBadge').textContent = ready || '';
  $('#chBadge').style.display = ready ? '' : 'none';
  $('#giftDot').style.display = save.coins >= GIFT_COST && lockedPool().length ? '' : 'none';
  const av = $('#avatar'); if (av && portraits['c_' + save.sel.char]) av.src = portraits['c_' + save.sel.char];
}

// ---------------- welcome (first launch) ----------------
let pickStart = 'pip';
function renderWelcome() {
  const starters = CHARACTERS.filter((c) => c.start);
  $('#starterGrid').innerHTML = starters.map((c) => `<button class="card ${c.id === pickStart ? 'on' : ''}" data-starter="${c.id}"><img src="${portraits['c_' + c.id]}" alt=""><span>${c.name}</span></button>`).join('');
  $$('[data-starter]').forEach((b) => b.addEventListener('click', () => { pickStart = b.dataset.starter; sfx.tap(); renderWelcome(); }));
}
$('#welcomeGo').addEventListener('click', () => {
  const name = $('#nameIn').value.trim().slice(0, 14) || 'Racer';
  save.profile = { name, since: new Date().toISOString().slice(0, 10) };
  save.sel.char = pickStart; persist(); sfx.unlock();
  go('menu');
  setTimeout(checkDaily, 500);
});

// ---------------- home ----------------
function renderHome() {
  const s = sel();
  $('#selName').textContent = s.char.name;
  const next = CUPS.find((c, i) => cupOpen(i) && cupStars(c) < c.events.length * 5) || CUPS[0];
  $('#homeTour').innerHTML = `<span class="ico">${next.icon}</span><span>${next.name}<small>⭐ ${cupStars(next)} / ${next.events.length * 5}</small></span><span class="go">▶</span>`;
  $('#homeTour').onclick = () => { sfx.tap(); openCup = next.id; go('cup'); };
}

// ---------------- daily login reward ----------------
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function checkDaily() {
  const t = today();
  if (save.daily.last === t) return;
  const y = new Date(Date.now() - 864e5);
  const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  const streak = save.daily.last === yesterday ? save.daily.streak + 1 : 1;
  const day = (streak - 1) % 7;
  $('#dailyGrid').innerHTML = DAILY.map((r, i) => `<div class="day ${i < day ? 'got' : ''} ${i === day ? 'now' : ''}"><small>Day ${i + 1}</small><b>${r.gift ? '🎁' : '🪙'}</b><span>${r.gift ? 'Gift' : r.coins}</span></div>`).join('');
  $('#dailyStreak').textContent = streak > 1 ? `${streak} days in a row!` : 'Welcome back!';
  $('#daily').classList.add('on');
  $('#dailyClaim').onclick = () => {
    const r = DAILY[day];
    save.daily = { last: t, streak };
    if (r.coins) save.coins += r.coins;
    persist(); sfx.unlock();
    $('#daily').classList.remove('on');
    refreshTop();
    if (r.gift && lockedPool().length) { go('gift'); setTimeout(() => openGift(true), 300); }
    else flashMsg(`+${r.coins || 100} coins!`);
    if (r.gift && !lockedPool().length) { save.coins += 100; persist(); refreshTop(); }
  };
}

// ---------------- tour (cups + events) ----------------
const cupStars = (c) => c.events.reduce((a, [t, m]) => a + (save.stars[eventKey(t, m)] || 0), 0);
const cupOpen = (i) => totalStars() >= CUPS[i].need;
const starRow = (n, size = '') => `<span class="stars ${size}">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < n ? 'on' : ''}">★</i>`).join('')}</span>`;
function renderCups() {
  $('#cupList').innerHTML = CUPS.map((c, i) => {
    const open = cupOpen(i), st = cupStars(c), max = c.events.length * 5;
    const trophy = st === max ? '🏆' : st >= max * 0.6 ? '🥈' : '';
    return `<button class="cupcard ${open ? '' : 'locked'}" data-cup="${c.id}" style="--i:${i}"><span class="ico">${open ? c.icon : '🔒'}</span><span class="txt"><b>${c.name}</b><small>${open ? `⭐ ${st} / ${max}` : `Collect ${c.need} ⭐ to open (you have ${totalStars()})`}</small></span><span class="trophy">${trophy}</span></button>`;
  }).join('');
  $$('[data-cup]').forEach((b) => b.addEventListener('click', () => {
    const i = CUPS.findIndex((c) => c.id === b.dataset.cup);
    if (!cupOpen(i)) { flashMsg(`Collect ${CUPS[i].need} stars to open this cup`); return; }
    sfx.tap(); openCup = b.dataset.cup; go('cup');
  }));
}
function renderCup() {
  const c = byId(CUPS, openCup);
  $('#cupTitle').textContent = `${c.icon} ${c.name}`;
  $('#cupStars').textContent = `⭐ ${cupStars(c)} / ${c.events.length * 5}`;
  $('#eventList').innerHTML = c.events.map(([tid, mode], i) => {
    const t = byId(TRACKS, tid), k = eventKey(tid, mode), m = MODES[mode];
    return `<button class="event theme-${t.theme.deco}" data-ev="${i}"><span class="num">${i + 1}</span><span class="txt"><b>${t.name}</b><small>${m.icon} ${m.label}${save.best[k] ? ` · best ${mode === 'race' ? fmt(save.best[k]) : save.best[k] + (mode === 'rings' ? '%' : ' coins')}` : ''}</small>${starRow(save.stars[k] || 0)}</span></button>`;
  }).join('');
  $$('[data-ev]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); showEventInfo(c, +b.dataset.ev); }));
}
function showEventInfo(cup, i) {
  const [tid, mode] = cup.events[i], t = byId(TRACKS, tid), m = MODES[mode];
  const unit = mode === 'race' ? ' pts' : mode === 'rings' ? '%' : ' coins';
  $('#evTitle').textContent = t.name;
  $('#evMode').textContent = `${m.icon} ${m.label}`;
  $('#evGoal').textContent = m.goal;
  $('#evStars').innerHTML = STARS[mode].map((v, s) => `<div><span class="stars small">${'★'.repeat(s + 1)}</span><b>${fmt(v)}${unit}</b></div>`).join('');
  $('#evInfo').classList.add('on');
  $('#evStart').onclick = () => { $('#evInfo').classList.remove('on'); sfx.go(); tour = { cup, i }; startRace(t, mode); };
}
$('#evClose').addEventListener('click', () => $('#evInfo').classList.remove('on'));

function renderTracks() {
  const open = new Set(CUPS.filter((_, i) => cupOpen(i)).flatMap((c) => c.events.map((e) => e[0])));
  $('#trackList').innerHTML = TRACKS.map((t) => `<button class="btn ${open.has(t.id) ? '' : 'white'}" data-track="${t.id}" ${open.has(t.id) ? '' : 'disabled'}>${open.has(t.id) ? '' : '🔒 '}${t.name}</button>`).join('');
  $$('[data-track]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); tour = null; startRace(byId(TRACKS, b.dataset.track), 'race'); }));
}

// ---------------- garage ----------------
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
    return `<button class="card ${open ? '' : 'locked'} ${save.sel[selKey] === x.id ? 'on' : ''} ${save.fresh.includes(pre + x.id) ? 'new' : ''}" data-id="${x.id}"><img src="${portraits[pre + x.id]}" alt=""><span>${open ? x.name : '???'}</span></button>`;
  }).join('');
  $$('#grid .card').forEach((c) => c.addEventListener('click', () => {
    const id = c.dataset.id;
    if (!save.unlocked[key].includes(id)) { flashMsg('Open the Gift Box to unlock!'); return; }
    sfx.tap();
    save.sel[selKey] = id;
    save.fresh = save.fresh.filter((f) => f !== pre + id);
    persist(); refreshTop();
    showMenuRacer(); renderGarage();
  }));
}
let msgTimer;
function flashMsg(text) {
  let el = $('#msg');
  if (!el) { el = document.createElement('div'); el.id = 'msg'; el.className = 'h-toast'; el.style.position = 'fixed'; el.style.zIndex = 30; el.style.top = 'calc(70px + var(--safe-t))'; el.style.bottom = 'auto'; document.body.append(el); }
  el.textContent = text; el.classList.add('on');
  clearTimeout(msgTimer); msgTimer = setTimeout(() => el.classList.remove('on'), 1800);
}

// ---------------- gift box ----------------
function lockedPool() {
  return [
    ...CHARACTERS.filter((c) => !save.unlocked.chars.includes(c.id)).map((x) => ({ key: 'chars', pre: 'c_', x, kind: 'New driver!' })),
    ...KARTS.filter((c) => !save.unlocked.karts.includes(c.id)).map((x) => ({ key: 'karts', pre: 'k_', x, kind: 'New kart!' })),
    ...GLIDERS.filter((c) => !save.unlocked.gliders.includes(c.id)).map((x) => ({ key: 'gliders', pre: 'g_', x, kind: 'New glider!' })),
  ];
}
function renderGift() {
  $('#reveal').classList.remove('on'); $('#giftBox').style.display = '';
  const pool = lockedPool(), btn = $('#openGift');
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
  refreshTop();
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
    refreshTop();
  }, 1600);
}

// ---------------- challenges ----------------
function challengeState(c) {
  const tier = save.tiers[c.key] || 0;
  const goal = Math.round(c.goal * Math.pow(2.2, tier)), reward = Math.round(c.reward * Math.pow(1.4, tier));
  const have = c.key === 'stars' ? totalStars() : save.stats[c.key] || 0;
  return { tier, goal, reward, have, done: have >= goal };
}
const claimableChallenges = () => CHALLENGES.filter((c) => challengeState(c).done).length;
function renderChallenges() {
  // finished ones first so the claim buttons are easy to find
  $('#chList').innerHTML = [...CHALLENGES].sort((a, b) => challengeState(b).done - challengeState(a).done).map((c) => {
    const s = challengeState(c);
    return `<div class="chal ${s.done ? 'done' : ''}"><span class="ico">${c.icon}</span><span class="txt"><b>${c.name.replace('{n}', fmt(s.goal))}</b><span class="bar"><i style="width:${clamp(s.have / s.goal, 0, 1) * 100}%"></i></span><small>${fmt(Math.min(s.have, s.goal))} / ${fmt(s.goal)} · Level ${s.tier + 1}</small></span>${s.done ? `<button class="btn small yellow" data-claim="${c.key}">+${s.reward} 🪙</button>` : `<span class="rw">🪙 ${s.reward}</span>`}</div>`;
  }).join('');
  $$('[data-claim]').forEach((b) => b.addEventListener('click', () => {
    const c = CHALLENGES.find((x) => x.key === b.dataset.claim), s = challengeState(c);
    if (!s.done) return;
    save.coins += s.reward; save.tiers[c.key] = s.tier + 1; persist(); sfx.unlock();
    flashMsg(`+${s.reward} coins!`); refreshTop(); renderChallenges();
  }));
}

// ---------------- settings ----------------
function renderSettings() {
  $$('#diffSeg button').forEach((b) => b.classList.toggle('on', b.dataset.d === save.settings.difficulty));
  $$('[data-set]').forEach((b) => b.classList.toggle('on', !!save.settings[b.dataset.set]));
  $('#setName').textContent = save.profile?.name || 'Racer';
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
$('#renameBtn').addEventListener('click', () => {
  const n = prompt('Your racer name', save.profile?.name || '');
  if (n === null) return;
  save.profile = { ...(save.profile || {}), name: n.trim().slice(0, 14) || 'Racer' }; persist(); renderSettings(); refreshTop();
});
$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Start over? This clears coins, stars and everything you unlocked.')) return;
  save = fresh(); persist(); window.__kp.save = save; go('welcome'); renderWelcome();
});

// ---------------- input ----------------
const input = { steer: 0, holding: false, item: false, drag: 0, tilt: 0, keys: 0, consumeItem() { const v = this.item; this.item = false; return v; } };
let dragId = null, dragX = 0;
addEventListener('pointerdown', (e) => {
  if (current !== 'hud' || e.target.closest('button')) return;
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
  if (e.target.tagName === 'INPUT') return;
  keys[e.key] = true;
  if (current === 'hud' && (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w')) { input.item = true; e.preventDefault(); }
  if (current === 'hud') input.holding = true;
  if (e.key === 'Escape' && race) pauseRace();
});
addEventListener('keyup', (e) => { keys[e.key] = false; if (!Object.values(keys).some(Boolean) && dragId === null) input.holding = false; });
addEventListener('deviceorientation', (e) => {
  if (!save.settings.tilt) return;
  const ang = (screen.orientation?.angle ?? window.orientation ?? 0);
  const v = ang === 90 ? e.beta : ang === -90 || ang === 270 ? -e.beta : e.gamma;
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
const fmtTime = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const hud = {
  last: {},
  setup({ track, laps, mode }) {
    this.laps = laps; this.track = track; this.last = {}; this.mode = mode;
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
    this.item(null); this.combo(0);
    $('#hPops').innerHTML = '';
    $('#hCenter').className = 'h-center'; $('#hBanner').className = 'h-banner';
    $('#hHint').style.opacity = save.races < 3 ? 1 : 0;
    $('#hud').dataset.mode = mode;
    $('#hGoal').textContent = mode === 'coinrush' ? '🪙 0' : mode === 'rings' ? '⭕ 0' : '';
  },
  update(s) {
    if (s.place !== this.last.place) { $('#hPlace').innerHTML = `${s.place}<sup>${suffix(s.place)}</sup>`; this.last.place = s.place; }
    const lapTxt = this.mode === 'coinrush' ? 'Time left' : `Lap ${s.lap}/${this.laps}`;
    if (lapTxt !== this.last.lap) { $('#hLap').textContent = lapTxt; this.last.lap = lapTxt; }
    if (s.coins !== this.last.coins) { $('#hCoins').textContent = s.coins; this.last.coins = s.coins; }
    const tt = fmtTime(s.time);
    if (tt !== this.last.time) { $('#hTime').textContent = tt; this.last.time = tt; }
    if (s.score !== this.last.score) { $('#hScore').textContent = fmt(s.score); this.last.score = s.score; }
    const goal = this.mode === 'coinrush' ? `🪙 ${s.collected}` : this.mode === 'rings' ? `⭕ ${s.rings} / ${s.ringsTotal}` : '';
    if (goal !== this.last.goal) { $('#hGoal').textContent = goal; this.last.goal = goal; }
    if (s.slip !== this.last.slip) { $('#hWind').classList.toggle('on', s.slip); this.last.slip = s.slip; }
    if (s.time > 4 && !this.hintGone) { this.hintGone = true; $('#hHint').style.opacity = 0; }
    const c = $('#hMap').getContext('2d'); c.clearRect(0, 0, 220, 220); c.drawImage(this.mapBg, 0, 0);
    for (const r of [...s.racers].sort((a, b) => (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0))) {
      const X = r.x * this.map.sc + this.map.ox, Y = r.z * this.map.sc + this.map.oz;
      c.beginPath(); c.arc(X, Y, r.isPlayer ? 11 : 7, 0, Math.PI * 2);
      c.fillStyle = '#' + r.char.color.toString(16).padStart(6, '0'); c.fill();
      c.lineWidth = r.isPlayer ? 4 : 2; c.strokeStyle = r.isPlayer ? '#ffd23a' : '#222'; c.stroke();
    }
    if (this.rolling) { const icons = Object.values(ITEMS).map((i) => i.icon); $('#hItem').firstChild.textContent = icons[Math.floor(performance.now() / 70) % icons.length]; }
  },
  countdown(n) { const e = $('#hCenter'); e.textContent = n; e.className = 'h-center'; void e.offsetWidth; e.className = 'h-center go'; },
  banner(t) { const e = $('#hBanner'); e.textContent = t; e.className = 'h-banner'; void e.offsetWidth; e.className = 'h-banner go'; },
  toast(t) { const e = $('#hToast'); e.textContent = t; e.classList.add('on'); clearTimeout(this.tt); this.tt = setTimeout(() => e.classList.remove('on'), 1200); },
  points(label, n) {
    const box = $('#hPops');
    const el = document.createElement('div'); el.className = 'pop'; el.innerHTML = `${esc(label)} <b>+${n}</b>`;
    box.prepend(el);
    while (box.children.length > 3) box.lastChild.remove();
    setTimeout(() => el.remove(), 1400);
  },
  combo(n) { const e = $('#hCombo'); e.textContent = n > 1 ? `${n} Combo!` : ''; e.classList.toggle('on', n > 1); if (n > 1) { e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); } },
  item(s) {
    const e = $('#hItem');
    this.rolling = !!(s && s.rolling);
    e.innerHTML = '<span></span>';
    e.classList.toggle('ready', !!(s && s.item));
    e.classList.toggle('frenzy', !!(s && s.count === Infinity));
    if (s && s.item) {
      e.firstChild.textContent = ITEMS[s.item].icon;
      if (s.count === Infinity) e.insertAdjacentHTML('beforeend', '<span class="cnt">∞</span>');
      else if (s.count > 1) e.insertAdjacentHTML('beforeend', `<span class="cnt">×${s.count}</span>`);
    }
  },
  finish(place) { this.banner(this.mode !== 'race' ? (this.mode === 'coinrush' ? 'Time up!' : 'Finish!') : place <= 3 ? 'Finish! 🎉' : 'Finish!'); },
  shake() { const h = $('#hud'); h.classList.remove('shake'); void h.offsetWidth; h.classList.add('shake'); navigator.vibrate?.(120); },
  flash() { const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); },
};

// ---------------- race flow ----------------
let race = null, tour = null, lastTrack = null, lastMode = 'race';

function startRace(trackDef, mode = 'race') {
  if (race) { race.dispose(); race = null; }
  lastTrack = trackDef; lastMode = mode;
  const s = sel();
  go('hud');
  hud.hintGone = false;
  input.item = false; input.drag = 0; dragId = null;
  race = new Race({ renderer, track: trackDef, player: s, others: pickOpponents(s.char.id, KARTS, GLIDERS), difficulty: DIFFICULTY[save.settings.difficulty], settings: save.settings, hud, input, onFinish: finishRace, mode });
}

function starsFor(mode, value) { return STARS[mode].filter((v) => value >= v).length; }

function finishRace(r) {
  musicStop();
  const { mode, place, stats } = r;
  const value = mode === 'race' ? r.score : mode === 'coinrush' ? r.coins : Math.round((stats.rings / Math.max(1, stats.ringsTotal)) * 100);
  const stars = starsFor(mode, value);
  const key = eventKey(lastTrack.id, mode);
  const prevStars = save.stars[key] || 0, prevBest = save.best[key] || 0;
  if (stars > prevStars) save.stars[key] = stars;
  const newBest = value > prevBest;
  if (newBest) save.best[key] = value;
  const coins = r.coins + (mode === 'race' ? PLACE_COINS[place - 1] : stars * 10);
  save.coins += coins;
  save.races++;
  bump('races'); if (mode === 'race' && place === 1) bump('wins');
  for (const k of ['drifts', 'hits', 'tricks', 'glides', 'passes', 'coins', 'slips', 'frenzies', 'rings']) bump(k, stats[k] || 0);
  const xp = Math.round(r.score / 8) + 40;
  const lvBefore = save.level, xpBefore = save.xp;
  save.xp += xp;
  while (save.xp >= xpForLevel(save.level)) { save.xp -= xpForLevel(save.level); save.level++; save.coins += 100; }
  persist();
  const summary = { ...r, value, stars, prevStars, newBest, coins, xp, lvBefore, xpBefore };
  if (mode === 'race') showPlacings(summary); else showTally(summary);
}

function row(p, char, me, right) {
  return `<li class="${me ? 'me' : ''}" style="--d:${p}"><span class="p">${p}</span><img src="${portraits['c_' + char.id]}" alt=""><span>${esc(char.name)}${me ? ` (${esc(save.profile?.name || 'you')})` : ''}</span><span class="pts">${right}</span></li>`;
}
function setButtons(btns) {
  const box = $('#resBtns'); box.innerHTML = '';
  for (const [t, c, fn] of btns) { const b = document.createElement('button'); b.className = 'btn ' + c; b.textContent = t; b.onclick = () => { sfx.tap(); fn(); }; box.append(b); }
}
// step 1: who finished where
function showPlacings(s) {
  $('#results').dataset.step = 'places';
  $('#resTitle').textContent = s.place === 1 ? 'You won! 🏆' : `${s.place}${suffix(s.place)} place${s.place <= 3 ? '! 🎉' : ''}`;
  $('#resList').innerHTML = s.results.map((x) => row(x.place, x.char, x.isPlayer, x.time ? fmtTime(x.time) : '')).join('');
  $('#tally').innerHTML = ''; $('#earned').innerHTML = '';
  setButtons([['Continue ▶', 'green', () => showTally(s)]]);
  go('results');
}
// step 2: score tally, stars, coins, XP (counts up like the phone game)
function showTally(s) {
  $('#results').dataset.step = 'tally';
  const m = MODES[s.mode];
  $('#resTitle').textContent = `${m.icon} ${lastTrack.name}`;
  $('#resList').innerHTML = '';
  const rows = s.mode === 'race'
    ? [['Action points', s.actionScore], [`Finish bonus (${s.place}${suffix(s.place)})`, s.placeBonus]]
    : s.mode === 'coinrush' ? [['Coins collected', s.coins]] : [['Rings', `${s.stats.rings} / ${s.stats.ringsTotal}`]];
  const totalLabel = s.mode === 'race' ? 'Total' : s.mode === 'coinrush' ? 'Coins' : 'Rings %';
  $('#tally').innerHTML = `
    ${rows.map(([a, b], i) => `<div class="trow" style="--d:${i}"><span>${a}</span><b>${typeof b === 'number' ? fmt(b) : b}</b></div>`).join('')}
    <div class="trow total"><span>${totalLabel}</span><b id="tTotal">0</b></div>
    <div class="bigstars" id="tStars">${[0, 1, 2, 3, 4].map(() => '<i>★</i>').join('')}</div>
    <div class="newbest" id="tBest">${s.newBest && (s.prevStars || save.races > 1) ? 'NEW BEST!' : ''}</div>
    <div class="xprow"><span class="lv">Lv <b id="tLv">${s.lvBefore}</b></span><span class="bar"><i id="tXp"></i></span><span>+${s.xp} XP</span></div>`;
  $('#earned').innerHTML = `<i class="coin-i"></i> +${s.coins} coins`;
  const btns = [['Retry', 'white', () => startRace(lastTrack, lastMode)]];
  if (tour) {
    const nextI = tour.i + 1;
    if (nextI < tour.cup.events.length) btns.push(['Next ▶', 'green', () => { const [tid, md] = tour.cup.events[nextI]; tour = { cup: tour.cup, i: nextI }; startRace(byId(TRACKS, tid), md); }]);
    btns.push(['Cup', 'yellow', () => { openCup = tour.cup.id; toMenu('cup'); }]);
  } else btns.push(['Home', 'green', () => toMenu()]);
  setButtons(btns);
  go('results');
  // count up the total, then light the stars one by one, then fill XP
  const end = s.value, t0 = performance.now(), dur = 1200;
  const tick = (now) => {
    const k = clamp((now - t0) / dur, 0, 1);
    $('#tTotal').textContent = fmt(end * (1 - Math.pow(1 - k, 3))) + (s.mode === 'rings' ? '%' : '');
    if (k < 1 && current === 'results') { if (Math.random() < 0.3) sfx.roulette(); requestAnimationFrame(tick); }
    else {
      $('#tTotal').textContent = fmt(end) + (s.mode === 'rings' ? '%' : '');
      const st = $$('#tStars i');
      for (let i = 0; i < s.stars; i++) setTimeout(() => { st[i].classList.add('on'); sfx.drift2(); }, 250 * (i + 1));
      setTimeout(() => {
        if ($('#tBest').textContent) { $('#tBest').classList.add('on'); sfx.finalLap(); }
        animateXp(s);
      }, 250 * (s.stars + 1) + 200);
    }
  };
  requestAnimationFrame(tick);
}
function animateXp(s) {
  const bar = $('#tXp'); if (!bar) return;
  let lv = s.lvBefore, xp = s.xpBefore, left = s.xp;
  const step = () => {
    const need = xpForLevel(lv), add = Math.min(left, need - xp);
    bar.style.transition = 'none'; bar.style.width = `${(xp / need) * 100}%`; void bar.offsetWidth;
    bar.style.transition = 'width .7s ease-out'; bar.style.width = `${((xp + add) / need) * 100}%`;
    left -= add; xp += add;
    setTimeout(() => {
      if (xp >= need) {
        lv++; xp = 0; $('#tLv').textContent = lv; sfx.unlock();
        $('#lvNum').textContent = lv; $('#levelup').classList.add('on');
        setTimeout(() => $('#levelup').classList.remove('on'), 1800);
      }
      if (left > 0) step();
    }, 750);
  };
  step();
}
function toMenu(screen = 'menu') {
  if (race) { race.dispose(); race = null; }
  tour = screen === 'cup' ? tour : null;
  musicStart(3, 120);
  go(screen);
}
function pauseRace() {
  if (!race || race.state === 'finished') return;
  race.paused = true; musicStop(); go('pause');
}
$('#hPause').addEventListener('click', pauseRace);
$('#resume').addEventListener('click', () => { if (!race) return; race.paused = false; go('hud'); musicStart(lastTrack.id.length * 7 + lastTrack.points.length, 150); });
$('#restart').addEventListener('click', () => startRace(lastTrack, lastMode));
$('#quit').addEventListener('click', () => toMenu(tour ? 'cup' : 'menu'));
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseRace(); });

// ---------------- boot ----------------
setMusic(save.settings.music); setSfx(save.settings.sfx);
let ready = false;
$('#tapStart').textContent = 'Loading… 0%';
preload(allModelPaths(), (f) => { $('#tapStart').textContent = `Loading… ${Math.round(f * 100)}%`; $('#loadBar').style.width = `${f * 100}%`; }).then(() => {
  makePortraits();
  showMenuRacer();
  ready = true;
  $('#tapStart').textContent = 'Tap to start';
  $('#loadWrap').style.opacity = 0;
});
$('#title').addEventListener('pointerup', function start() {
  if (!ready) return;
  $('#title').removeEventListener('pointerup', start);
  unlock(); sfx.go(); musicStart(3, 120);
  if (!save.profile) { go('welcome'); renderWelcome(); return; }
  go('menu');
  setTimeout(checkDaily, 600);
});

let lastT = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (race && (current === 'hud' || current === 'pause' || current === 'results' || (current === 'settings' && previous === 'pause'))) {
    readSteer(dt);
    race.update(dt);
    race.render();
  } else renderMenu(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.__kp = { save, get race() { return race; }, startRace: (id, mode = 'race') => { tour = null; startRace(byId(TRACKS, id), mode); }, input, go, checkDaily, get current() { return current; } };
function at(m, x, y, z) { m.position.set(x, y, z); return m; }
