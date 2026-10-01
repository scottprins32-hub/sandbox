// Builds a race track from a list of control points: road, curbs, walls, glider gap,
// scenery, and the lookup tables the physics uses (one sample per ~1 unit of road).
import * as THREE from 'three';
import { canvasTex, mat } from './models.js';
import { DECO } from './data.js';
import { fitted, instanced, has } from './assets.js';

export function buildTrack(def) {
  const group = new THREE.Group();
  const th = def.theme;
  const hw = def.width / 2;

  const pts = def.points.map(([x, z, y]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  const length = curve.getLength();
  const N = Math.round(length);
  const spaced = curve.getSpacedPoints(N); // N+1, last == first

  const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);
  const rx = new Float32Array(N), rz = new Float32Array(N), hd = new Float32Array(N);
  for (let i = 0; i < N; i++) { px[i] = spaced[i].x; py[i] = spaced[i].y; pz[i] = spaced[i].z; }
  for (let i = 0; i < N; i++) {
    const a = (i - 2 + N) % N, b = (i + 2) % N;
    let tx = px[b] - px[a], tz = pz[b] - pz[a];
    const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    rx[i] = -tz; rz[i] = tx;           // right-hand side of travel direction
    hd[i] = Math.atan2(tx, tz);        // heading that faces down the track
  }

  // point-index units -> sample index
  const D = 2000, lens = curve.getLengths(D);
  const idxOf = (u) => Math.round((lens[Math.round((u / pts.length) * D)] / lens[D]) * N) % N;
  let gapA = -1, gapB = -1;
  if (def.glide) { gapA = idxOf(def.glide[0]); gapB = idxOf(def.glide[1]); }
  const inGap = (i) => gapA >= 0 && i >= gapA && i <= gapB;
  const nearGap = (i, m) => gapA >= 0 && i >= gapA - m && i <= gapB + m;

  // ---------- road ----------
  const roadTex = canvasTex((x, w, h) => {
    x.fillStyle = '#' + th.road.toString(16).padStart(6, '0'); x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      x.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.06})`;
      x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    x.fillStyle = 'rgba(255,255,255,0.55)';
    x.fillRect(w / 2 - 2, 0, 4, h / 2);
  }, 128, 128);
  roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.anisotropy = 4;
  const curbTex = canvasTex((x, w, h) => {
    const a = '#' + th.edgeA.toString(16).padStart(6, '0'), b = '#' + th.edgeB.toString(16).padStart(6, '0');
    x.fillStyle = a; x.fillRect(0, 0, w, h / 2); x.fillStyle = b; x.fillRect(0, h / 2, w, h / 2);
  }, 8, 64);
  curbTex.wrapS = curbTex.wrapT = THREE.RepeatWrapping;

  function strip(offA, offB, yA, yB, tex, vScale, color, skipGap = true) {
    const pos = [], uv = [], idx = [];
    let v = 0;
    for (let i = 0; i <= N; i++) {
      const j = i % N;
      const l = [px[j] + rx[j] * offA, py[j] + yA, pz[j] + rz[j] * offA];
      const r = [px[j] + rx[j] * offB, py[j] + yB, pz[j] + rz[j] * offB];
      pos.push(...l, ...r);
      uv.push(0, v, 1, v);
      v += 1 / vScale;
      if (i < N && !(skipGap && (inGap(j) || inGap((j + 1) % N)))) {
        const k = i * 2;
        idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.MeshLambertMaterial(tex ? { map: tex, side: THREE.DoubleSide } : { color, side: THREE.DoubleSide });
    if (th.night && !tex) { m.emissive = new THREE.Color(color); m.emissiveIntensity = 0.5; }
    if (th.night && tex === curbTex) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = tex; }
    return new THREE.Mesh(g, m);
  }
  // road is drawn from right edge to left edge: -hw..hw across
  group.add(strip(-hw, hw, 0.05, 0.05, roadTex, 16));
  group.add(strip(-hw - 1.4, -hw, 0.07, 0.07, curbTex, 6));
  group.add(strip(hw, hw + 1.4, 0.07, 0.07, curbTex, 6));
  // walls double as cliff sides for raised road
  const wallLow = -40;
  for (const s of [-1, 1]) {
    const off = s * (hw + 1.6);
    const w = strip(off, off, wallLow, 1.3, null, 1, th.wall);
    group.add(w);
    // grass/ground skirt under curbs so raised road doesn't look hollow
  }
  // flat top of the wall (cliff cap) so raised road reads as a solid plateau
  for (const s of [-1, 1]) group.add(strip(s * (hw + 1.4), s * (hw + 1.8), 1.3, 1.3, null, 1, th.wall));

  // under-road fill for raised sections: a dark ribbon at -0.5 so you never see sky through gaps
  const under = strip(-hw - 1.6, hw + 1.6, -0.4, -0.4, null, 1, 0x3b3b44);
  under.material.side = THREE.DoubleSide;
  group.add(under);

  // ---------- start line ----------
  const checker = canvasTex((x, w, h) => {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) { x.fillStyle = (r + c) % 2 ? '#111' : '#fff'; x.fillRect(c * w / 8, r * h / 2, w / 8, h / 2); }
  }, 128, 32);
  const start = new THREE.Mesh(new THREE.PlaneGeometry(def.width, 2.5), new THREE.MeshLambertMaterial({ map: checker }));
  start.rotation.order = 'YXZ';
  start.rotation.set(-Math.PI / 2, hd[0], 0);
  start.position.set(px[0], py[0] + 0.08, pz[0]);
  group.add(start);
  // start area: finish gate, grandstands, flags (Kenney Racing + Toy Car kits)
  const place = (obj, i, lateral, rot = 0, y = 0) => {
    const j = ((i % N) + N) % N;
    obj.position.set(px[j] + rx[j] * lateral, py[j] + y, pz[j] + rz[j] * lateral);
    obj.rotation.y = hd[j] + rot;
    group.add(obj);
    return obj;
  };
  if (has('cars/gate-finish.glb')) {
    place(fitted('cars/gate-finish.glb', def.width + 5, 'w'), 0, 0, 0);
    // grandstands just past the line, seats facing the road
    for (const [i, side] of [[34, 1], [34, -1], [62, 1], [62, -1]]) {
      place(fitted(i === 34 ? 'race/grandStandCovered.glb' : 'race/grandStand.glb', 15, 'w'), i, side * (hw + 9), side > 0 ? Math.PI / 2 : -Math.PI / 2);
    }
    for (const side of [-1, 1]) {
      place(fitted('race/bannerTowerRed.glb', 9), 22, side * (hw + 3.2), 0);
      place(fitted('race/bannerTowerGreen.glb', 9), -90, side * (hw + 3.2), 0);
      place(fitted('race/flagCheckers.glb', 5), 6, side * (hw + 3.4), side > 0 ? -Math.PI / 2 : Math.PI / 2);
      place(fitted('race/tent.glb', 6, 'w'), 90, side * (hw + 9), side > 0 ? Math.PI / 2 : -Math.PI / 2);
    }
    // light posts and cones around the lap
    for (let i = 40, k = 0; i < N - 40; i += 55, k++) {
      if (nearGap(i, 12)) continue;
      const side = k % 2 ? 1 : -1;
      place(fitted('race/lightPostModern.glb', 9), i, side * (hw + 2.6), side > 0 ? Math.PI : 0);
      for (let c = 0; c < 3; c++) place(fitted('cars/item-cone.glb', 1.1), i + 8 + c * 3, -side * (hw + 2.4), 0);
    }
  } else {
    // start arch
    const arch = new THREE.Group();
    for (const s of [-1, 1]) arch.add(placed(new THREE.Mesh(new THREE.BoxGeometry(0.8, 9, 0.8), mat(th.edgeB)), s * (hw + 2), 4.5, 0));
    const banner = canvasTex((x, w, h) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#e8423f'; x.font = 'bold 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('KART PARTY', w / 2, h / 2 + 2);
    }, 512, 64);
    const ban = new THREE.Mesh(new THREE.BoxGeometry(def.width + 4.8, 2, 0.6), new THREE.MeshLambertMaterial({ map: banner }));
    ban.position.y = 9; arch.add(ban);
    arch.position.set(px[0], py[0], pz[0]); arch.rotation.y = hd[0];
    group.add(arch);

  }

  // ---------- glider ramp + gap water ----------
  const pads = [];
  const addPad = (i, lateral, len, color, kind) => {
    const tex = canvasTex((x, w, h) => {
      x.fillStyle = color; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,0.85)';
      for (let k = 0; k < 3; k++) { x.beginPath(); const y0 = h - k * h / 3 - 8; x.moveTo(8, y0); x.lineTo(w / 2, y0 - h / 5); x.lineTo(w - 8, y0); x.lineTo(w - 8, y0 - 14); x.lineTo(w / 2, y0 - h / 5 - 14); x.lineTo(8, y0 - 14); x.fill(); }
    }, 64, 128);
    const w = kind === 'ramp' ? def.width : 5;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), new THREE.MeshBasicMaterial({ map: tex }));
    const j = (i + Math.round(len / 2)) % N;
    m.rotation.order = 'YXZ';
    m.rotation.set(-Math.PI / 2, hd[j] + Math.PI, 0);
    m.position.set(px[j] + rx[j] * lateral, py[j] + 0.1, pz[j] + rz[j] * lateral);
    group.add(m);
    pads.push({ a: i, b: (i + len) % N, lateral, half: w / 2, kind });
  };
  if (gapA >= 0) {
    addPad((gapA - 14 + N) % N, 0, 13, '#2f8cff', 'ramp');
    const mid = Math.round((gapA + gapB) / 2);
    const r = (gapB - gapA) * 0.75 + 20;
    const water = new THREE.Mesh(new THREE.CircleGeometry(r, 40), mat(th.water ?? 0x2fb7e8, { params: th.night ? { emissive: 0x221a66 } : {} }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(px[mid], 0.15, pz[mid]);
    group.add(water);
  }
  // two speed pads per lap, kept away from the gap
  for (const [f, side] of [[0.36, -1], [0.82, 1]]) {
    let i = Math.round(f * N);
    if (nearGap(i, 30)) i = (gapB + 40) % N;
    addPad(i, side * hw * 0.45, 7, '#ff8a1e', 'boost');
  }

  // ---------- ground + scenery ----------
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < N; i++) { minX = Math.min(minX, px[i]); maxX = Math.max(maxX, px[i]); minZ = Math.min(minZ, pz[i]); maxZ = Math.max(maxZ, pz[i]); }
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1400, 48), mat(th.ground));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, 0, cz);
  group.add(ground);

  const distToTrack = (x, z) => {
    let best = Infinity;
    for (let i = 0; i < N; i += 3) { const d = (px[i] - x) ** 2 + (pz[i] - z) ** 2; if (d < best) best = d; }
    return Math.sqrt(best);
  };
  const rand = mulberry(def.id.length * 977 + def.points.length);
  const decoSpots = [];
  for (let tries = 0; tries < 1400 && decoSpots.length < 250; tries++) {
    const x = minX - 90 + rand() * (maxX - minX + 180), z = minZ - 90 + rand() * (maxZ - minZ + 180);
    const d = distToTrack(x, z);
    const nearStart = (x - px[48]) ** 2 + (z - pz[48]) ** 2 < 55 * 55;
    if (d > hw + 9 && d < 120 && !nearStart) decoSpots.push([x, z, 0.7 + rand() * 0.8, rand() * Math.PI * 2]);
  }
  group.add(buildDeco(th, decoSpots, rand));
  // distant hills ring
  const hillCol = new THREE.Color(th.ground).multiplyScalar(th.night ? 1.4 : 0.82);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2, R = Math.max(maxX - minX, maxZ - minZ) * 0.5 + 260 + rand() * 120;
    const h = th.deco === 'pines' ? 90 + rand() * 90 : 30 + rand() * 50;
    const hill = new THREE.Mesh(th.deco === 'pines' || th.deco === 'cactus' ? new THREE.ConeGeometry(70 + rand() * 50, h, 6) : new THREE.SphereGeometry(80 + rand() * 50, 10, 6), new THREE.MeshLambertMaterial({ color: hillCol, flatShading: true }));
    hill.position.set(cx + Math.cos(a) * R, th.deco === 'pines' || th.deco === 'cactus' ? h / 2 - 5 : -30, cz + Math.sin(a) * R);
    if (th.deco === 'pines') { const cap = new THREE.Mesh(new THREE.ConeGeometry(30, h * 0.35, 6), mat(0xffffff)); cap.position.y = h * 0.33; hill.add(cap); }
    group.add(hill);
  }
  if (th.night) {
    const sg = new THREE.BufferGeometry(), sp = [];
    for (let i = 0; i < 700; i++) {
      const a = rand() * Math.PI * 2, e = 0.08 + rand() * 1.3, R = 900;
      sp.push(cx + Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, cz + Math.sin(a) * Math.cos(e) * R);
    }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    group.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, fog: false })));
  }

  // ---------- lookups ----------
  function nearest(x, z, hint) {
    let best = hint, bd = Infinity;
    for (let k = -40; k <= 40; k++) {
      const i = (hint + k + N) % N;
      const d = (px[i] - x) ** 2 + (pz[i] - z) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    if (bd > 900) { // lost (e.g. after a long glide) - full search
      for (let i = 0; i < N; i++) { const d = (px[i] - x) ** 2 + (pz[i] - z) ** 2; if (d < bd) { bd = d; best = i; } }
    }
    return best;
  }
  const lateral = (i, x, z) => (x - px[i]) * rx[i] + (z - pz[i]) * rz[i];
  const at = (frac) => ((Math.round(frac * N) % N) + N) % N;
  const skipGap = (i) => (nearGap(i, 18) ? (gapB + 24) % N : i);

  return { group, N, hw, px, py, pz, rx, rz, hd, gapA, gapB, inGap, nearGap, nearest, lateral, at, skipGap, pads, length, bounds: { minX, maxX, minZ, maxZ } };
}

function buildDeco(th, spots, rand) {
  const kit = DECO[th.deco];
  if (kit && kit.every(([p]) => has(p)) && th.deco !== 'stars') return buildKitDeco(kit, spots, rand);
  const g = new THREE.Group();
  if (th.deco === 'stars' && kit && has(kit[0][0])) g.add(buildKitDeco(kit, spots.filter((_, i) => i % 4 === 0), rand));
  const kinds = {
    trees: () => { const t = new THREE.Group(); t.add(cyl(0x8a5a33, 0.5, 3, 0, 1.5)); t.add(ball(0x3fae49, 2.6, 0, 4.6)); t.add(ball(0x56c25d, 1.8, 1.2, 5.6)); return t; },
    palms: () => { const t = new THREE.Group(); const tr = cyl(0xa0784a, 0.4, 8, 0, 4); tr.rotation.z = 0.15; t.add(tr); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.15, 1.1), mat(0x2fae4a)); l.position.set(Math.cos(i) * 2 + 1.2, 8, Math.sin(i) * 2); l.rotation.y = -i; l.rotation.z = -0.4; t.add(l); } return t; },
    cactus: () => { const t = new THREE.Group(); t.add(cyl(0x4f9a3c, 0.7, 6, 0, 3)); const a = cyl(0x4f9a3c, 0.45, 2.5, 1.3, 3.8); t.add(a); t.add(cyl(0x4f9a3c, 0.45, 1.4, 0.7, 2.8, true)); return t; },
    pines: () => { const t = new THREE.Group(); t.add(cyl(0x6b4a2b, 0.4, 2, 0, 1)); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(2.6 - i * 0.6, 3, 8), mat(i === 2 ? 0xffffff : 0x2d7a4a)); c.position.y = 3 + i * 1.8; t.add(c); } return t; },
    candy: () => { const t = new THREE.Group(); t.add(cyl(0xffffff, 0.25, 5, 0, 2.5)); const top = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.5, 20), mat([0xff5fa2, 0x6bd6ff, 0xffe36e, 0x9b6bff][Math.floor(rand() * 4)])); top.position.y = 5.3; top.rotation.x = Math.PI / 2; t.add(top); return t; },
    stars: () => { const t = new THREE.Group(); const c = new THREE.Mesh(new THREE.OctahedronGeometry(1.6), mat([0xff6bd6, 0x6bf3ff, 0xfff36b][Math.floor(rand() * 3)], { basic: true })); c.position.y = 4 + rand() * 6; t.add(c); t.userData.spin = true; return t; },
  };
  const make = kinds[th.deco] || kinds.trees;
  for (const [x, z, s, r] of spots) {
    const d = make(); d.position.set(x, 0, z); d.scale.setScalar(s); d.rotation.y = r; g.add(d);
  }
  return g;
}
function buildKitDeco(kit, spots, rand) {
  const g = new THREE.Group();
  const total = kit.reduce((a, k) => a + k[2], 0);
  const byModel = new Map();
  for (const [x, z, sc, r] of spots) {
    let pick = rand() * total, m = kit[0];
    for (const k of kit) { pick -= k[2]; if (pick <= 0) { m = k; break; } }
    if (!byModel.has(m)) byModel.set(m, []);
    byModel.get(m).push([x, 0, z, r, sc]);
  }
  for (const [[path, h], list] of byModel) g.add(instanced(path, list, h));
  return g;
}
function cyl(color, r, h, x, y, horizontal) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), mat(color)); m.position.set(x, y, 0); if (horizontal) m.rotation.z = Math.PI / 2; return m; }
function ball(color, r, x, y) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), new THREE.MeshLambertMaterial({ color, flatShading: true })); m.position.set(x, y, 0); return m; }
export function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function placed(m, x, y, z) { m.position.set(x, y, z); return m; }
