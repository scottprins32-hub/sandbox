// Low-poly models built from primitives so the game needs no downloaded art.
// Every racer faces +Z. Units: a kart is about 2.4 long.
import * as THREE from 'three';
import { fitted, has } from './assets.js';

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, opts.basic
      ? new THREE.MeshBasicMaterial({ color, ...opts.params })
      : new THREE.MeshLambertMaterial({ color, ...opts.params }));
  }
  return matCache.get(key);
}

const geo = {
  sphere: new THREE.SphereGeometry(1, 16, 12),
  sphereLo: new THREE.SphereGeometry(1, 10, 8),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
  cone: new THREE.ConeGeometry(1, 1, 12),
  torus: new THREE.TorusGeometry(1, 0.25, 8, 20),
};

function part(g, color, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx, opts) {
  const m = new THREE.Mesh(g, mat(color, opts));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
const BLACK = 0x1b1b22, WHITE = 0xffffff, ORANGE = 0xff9a1e, PINK = 0xff8fb0, GOLD = 0xffcf3a;

// ---------- drivers + karts (Kenney models, see assets.js) ----------
export function buildDriver(c, height = 1.2) {
  const g = new THREE.Group();
  const pet = fitted(`pets/animal-${c.model}.glb`, height);
  g.add(pet);
  g.userData.head = pet; // whole cube-pet leans into turns
  return g;
}

export function buildKart(k) {
  const car = fitted(`cars/vehicle-${k.model}.glb`, 2.7, 'l');
  car.rotation.y = Math.PI; // Kenney cars face -Z, the game faces +Z
  const g = new THREE.Group();
  g.add(car);
  const wheels = [];
  car.traverse((o) => { if (o.name && o.name.startsWith('wheel')) wheels.push(o); });
  return { group: g, wheels, seatY: k.seat[0], seatZ: k.seat[1], spinSign: -1 };
}

// ---------- gliders ----------
function flatShape(shape, color) {
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat(color, { params: { side: THREE.DoubleSide } }));
  m.rotation.x = -Math.PI / 2;
  return m;
}
export function buildGlider(gl) {
  const g = new THREE.Group();
  const c = gl.color;
  switch (gl.style) {
    case 'wing': {
      const s = new THREE.Shape(); s.moveTo(-2.2, -0.5); s.lineTo(0, 1.2); s.lineTo(2.2, -0.5); s.lineTo(0, 0); s.closePath();
      g.add(flatShape(s, c));
      const s2 = new THREE.Shape(); s2.moveTo(-1.2, 0.05); s2.lineTo(0, 0.95); s2.lineTo(1.2, 0.05); s2.lineTo(0, 0.5); s2.closePath();
      const stripe = flatShape(s2, 0xe8423f); stripe.position.y = 0.01; g.add(stripe);
      break;
    }
    case 'parasol': {
      const top = new THREE.Mesh(new THREE.ConeGeometry(2, 0.8, 12, 1, true), mat(c, { params: { side: THREE.DoubleSide } }));
      top.position.y = 0.3; g.add(top);
      g.add(part(geo.cyl, 0x8a5a33, 0, -0.2, 0, 0.04, 1.2, 0.04));
      break;
    }
    case 'leaf': {
      const s = new THREE.Shape(); s.moveTo(0, -1.4); s.quadraticCurveTo(2.4, 0, 0, 1.6); s.quadraticCurveTo(-2.4, 0, 0, -1.4);
      const leaf = flatShape(s, c); leaf.rotation.z = Math.PI / 2; g.add(leaf);
      g.add(part(geo.box, 0x2f8a2a, 0, 0.02, 0, 2.8, 0.02, 0.06));
      break;
    }
    case 'kite': {
      const s = new THREE.Shape(); s.moveTo(0, 1.6); s.lineTo(1.5, 0.2); s.lineTo(0, -1); s.lineTo(-1.5, 0.2); s.closePath();
      g.add(flatShape(s, c));
      g.add(part(geo.box, 0xe8423f, 0, 0.01, 0.3, 3.0, 0.02, 0.06));
      break;
    }
    case 'butterfly':
      for (const sx of [-1, 1]) for (const [z, r] of [[0.5, 1.1], [-0.6, 0.8]]) {
        const w = part(geo.sphere, sx > 0 ? c : 0xff8fe0, sx * (r * 0.9), 0, z, r, 0.04, r * 0.75);
        g.add(w);
      }
      g.add(part(geo.sphere, BLACK, 0, 0, 0, 0.12, 0.12, 1.0));
      break;
    case 'cloud':
      for (const [x, z, r] of [[0, 0, 0.9], [-1, 0.1, 0.7], [1, 0.1, 0.7], [-0.5, -0.4, 0.6], [0.5, -0.4, 0.6], [0, 0.5, 0.6]]) g.add(part(geo.sphereLo, c, x, 0, z, r, r * 0.6, r));
      break;
  }
  // strings to the kart
  for (const s of [-1, 1]) {
    const str = part(geo.cyl, 0x444444, s * 0.6, -0.9, 0, 0.015, 1.8, 0.015);
    str.rotation.z = s * 0.3;
    g.add(str);
  }
  return g;
}

// ---------- full racer ----------
export function buildRacer(char, kart, glider) {
  const root = new THREE.Group();     // positioned + yawed by physics
  const body = new THREE.Group();     // drift yaw, hop, spin
  root.add(body);
  const k = buildKart(kart);
  body.add(k.group);
  const driver = buildDriver(char);
  driver.position.set(0, k.seatY, k.seatZ);
  body.add(driver);
  const gl = buildGlider(glider);
  gl.position.set(0, 3.2, -0.3);
  gl.visible = false;
  body.add(gl);
  // drift sparks, one per rear wheel
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.9 });
  const sparks = [];
  for (const s of [-1, 1]) {
    const sp = new THREE.Mesh(geo.sphereLo, sparkMat);
    sp.scale.setScalar(0.22);
    sp.position.set(s * 0.85, 0.2, -1.1);
    sp.visible = false;
    body.add(sp); sparks.push(sp);
  }
  // shadow blob
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(0.9, 1.3, 1);
  shadow.position.y = 0.04;
  root.add(shadow);
  return { root, body, driver, wheels: k.wheels, spinSign: k.spinSign, glider: gl, sparks, sparkMat, shadow };
}

// ---------- pickups and items ----------
function canvasTex(draw, w = 128, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let boxMat;
export function buildItemBox() {
  if (has('cars/item-box.glb')) { const g = new THREE.Group(); const m = fitted('cars/item-box.glb', 1.7, 'max'); m.position.y = -0.85; g.add(m); return g; }
  if (!boxMat) {
    const tex = canvasTex((x, w, h) => {
      const gr = x.createLinearGradient(0, 0, w, h);
      ['#ff6b6b', '#ffd93b', '#6bff8f', '#6bd6ff', '#c06bff'].forEach((c, i) => gr.addColorStop(i / 4, c));
      x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(8, 8, w - 16, h - 16);
      x.fillStyle = '#fff'; x.font = 'bold 90px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 6; x.strokeText('?', w / 2, h / 2 + 6); x.fillText('?', w / 2, h / 2 + 6);
    });
    boxMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.88 });
  }
  const m = new THREE.Mesh(geo.box, boxMat);
  m.scale.setScalar(1.5);
  return m;
}
let coinGeo;
export function buildCoin() {
  if (has('cars/item-coin-gold.glb')) { const g = new THREE.Group(); const m = fitted('cars/item-coin-gold.glb', 1.3, 'max'); m.position.y = -0.65; g.add(m); return g; }
  coinGeo ??= new THREE.CylinderGeometry(0.6, 0.6, 0.15, 18);
  const m = new THREE.Mesh(coinGeo, mat(0xffc93a, { params: { emissive: 0x6a4a00 } }));
  m.rotation.x = Math.PI / 2;
  const g = new THREE.Group(); g.add(m);
  return g;
}
export function buildPeel() {
  if (has('cars/item-banana.glb')) return fitted('cars/item-banana.glb', 1.3, 'max');
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const p = part(geo.sphere, 0xffe14a, 0, 0.25, 0, 0.18, 0.5, 0.18);
    p.rotation.z = 0.9; p.rotation.y = (i / 3) * Math.PI * 2;
    const pg = new THREE.Group(); pg.add(p); pg.rotation.y = (i / 3) * Math.PI * 2; g.add(pg);
  }
  g.add(part(geo.sphere, 0xfff3a0, 0, 0.3, 0, 0.2, 0.3, 0.2));
  return g;
}
export function buildShell(color) {
  const g = new THREE.Group();
  g.add(part(geo.sphere, color, 0, 0.5, 0, 0.55, 0.42, 0.55));
  g.add(part(geo.cyl, 0xffffff, 0, 0.3, 0, 0.6, 0.12, 0.6));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(part(geo.sphereLo, 0xffffff, Math.cos(a) * 0.35, 0.72, Math.sin(a) * 0.35, 0.12, 0.06, 0.12));
  }
  return g;
}
export function buildStarMesh() {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.45 : 1, a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false }), mat(0xffd93b, { basic: true }));
  return m;
}
export { canvasTex };
