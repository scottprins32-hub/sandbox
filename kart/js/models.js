// Low-poly models built from primitives so the game needs no downloaded art.
// Every racer faces +Z. Units: a kart is about 2.4 long.
import * as THREE from 'three';

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

// ---------- drivers ----------
export function buildDriver(c) {
  const g = new THREE.Group();
  const col = c.color, acc = c.accent;
  const sp = c.species;
  const torsoCol = sp === 'panda' ? BLACK : col;
  g.add(part(geo.sphere, torsoCol, 0, 0.5, 0, 0.5, 0.55, 0.45));
  // hands on the wheel
  g.add(part(geo.sphereLo, sp === 'robot' ? acc : col, -0.32, 0.72, 0.55, 0.13));
  g.add(part(geo.sphereLo, sp === 'robot' ? acc : col, 0.32, 0.72, 0.55, 0.13));

  const head = new THREE.Group();
  head.position.y = 1.25;
  g.add(head);
  g.userData.head = head;

  if (sp === 'robot') {
    head.add(part(geo.box, col, 0, 0, 0, 1.0, 0.85, 0.9));
    head.add(part(geo.cyl, BLACK, 0, 0.52, 0, 0.04, 0.3, 0.04));
    head.add(part(geo.sphereLo, acc, 0, 0.72, 0, 0.11, 0.11, 0.11, { basic: true }));
    head.add(part(geo.box, BLACK, 0, 0.05, 0.45, 0.75, 0.32, 0.04));
    head.add(part(geo.sphereLo, acc, -0.18, 0.05, 0.47, 0.09, 0.09, 0.04, { basic: true }));
    head.add(part(geo.sphereLo, acc, 0.18, 0.05, 0.47, 0.09, 0.09, 0.04, { basic: true }));
    return g;
  }

  const headCol = col;
  const flat = sp === 'frog' ? 0.8 : 1;
  head.add(part(geo.sphere, headCol, 0, 0, 0, 0.55, 0.52 * flat, 0.52));

  // eyes
  const eyeY = sp === 'frog' ? 0.38 : 0.08, eyeZ = sp === 'frog' ? 0.22 : 0.44, eyeX = sp === 'frog' ? 0.24 : 0.19;
  const eyeR = sp === 'owl' ? 0.17 : 0.13;
  for (const s of [-1, 1]) {
    if (sp === 'frog') head.add(part(geo.sphere, headCol, s * eyeX, eyeY - 0.04, eyeZ - 0.05, 0.2));
    if (sp === 'panda') head.add(part(geo.sphere, BLACK, s * 0.2, 0.06, 0.4, 0.17, 0.2, 0.1));
    if (sp === 'owl') head.add(part(geo.sphere, acc, s * 0.2, 0.08, 0.38, 0.24, 0.24, 0.12));
    head.add(part(geo.sphere, WHITE, s * eyeX, eyeY, eyeZ, eyeR, eyeR * 1.15, eyeR * 0.7));
    head.add(part(geo.sphereLo, BLACK, s * eyeX, eyeY - 0.01, eyeZ + eyeR * 0.55, eyeR * 0.55, eyeR * 0.7, eyeR * 0.3));
    head.add(part(geo.sphereLo, WHITE, s * eyeX + 0.03, eyeY + 0.04, eyeZ + eyeR * 0.8, 0.03, 0.03, 0.02, { basic: true }));
  }

  const ear = (geom, color, x, y, z, sx, sy, sz, rz = 0, rx = 0) => {
    const m = part(geom, color, x, y, z, sx, sy, sz);
    m.rotation.z = rz; m.rotation.x = rx;
    head.add(m);
    return m;
  };

  switch (sp) {
    case 'penguin':
      head.add(part(geo.cone, ORANGE, 0, -0.06, 0.58, 0.1, 0.25, 0.1));
      head.children[head.children.length - 1].rotation.x = Math.PI / 2;
      head.add(part(geo.sphere, acc, 0, -0.15, 0.25, 0.38, 0.32, 0.3));
      g.add(part(geo.sphere, acc, 0, 0.45, 0.2, 0.36, 0.42, 0.3));
      break;
    case 'bunny':
      for (const s of [-1, 1]) {
        ear(geo.sphere, headCol, s * 0.2, 0.62, -0.05, 0.12, 0.42, 0.08, -s * 0.15);
        ear(geo.sphere, PINK, s * 0.2, 0.62, -0.0, 0.07, 0.32, 0.05, -s * 0.15);
      }
      head.add(part(geo.sphereLo, PINK, 0, -0.08, 0.52, 0.07));
      head.add(part(geo.sphere, acc, 0, -0.18, 0.42, 0.2, 0.14, 0.12));
      break;
    case 'bear': case 'koala': case 'panda': case 'monkey': case 'lion': {
      const earCol = sp === 'panda' ? BLACK : sp === 'koala' ? headCol : sp === 'monkey' ? acc : headCol;
      const big = sp === 'koala' ? 0.27 : sp === 'monkey' ? 0.2 : 0.17;
      const ex = sp === 'monkey' ? 0.55 : 0.4, ey = sp === 'monkey' ? 0.05 : 0.42;
      for (const s of [-1, 1]) {
        ear(geo.sphere, earCol, s * ex, ey, 0, big, big, big * 0.6);
        if (sp === 'koala') ear(geo.sphere, acc, s * ex, ey, 0.06, big * 0.65, big * 0.65, big * 0.4);
      }
      if (sp === 'lion') {
        const mane = part(geo.torus, acc, 0, 0, -0.08, 0.58, 0.58, 0.9);
        head.add(mane);
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          head.add(part(geo.sphereLo, acc, Math.cos(a) * 0.6, Math.sin(a) * 0.6, -0.12, 0.2));
        }
      }
      if (sp === 'monkey') head.add(part(geo.sphere, acc, 0, -0.08, 0.3, 0.42, 0.36, 0.28));
      if (sp === 'koala') head.add(part(geo.sphere, BLACK, 0, -0.1, 0.52, 0.12, 0.16, 0.09));
      else {
        if (sp !== 'monkey') head.add(part(geo.sphere, sp === 'panda' ? WHITE : acc, 0, -0.17, 0.42, 0.22, 0.16, 0.14));
        head.add(part(geo.sphereLo, BLACK, 0, -0.1, 0.56, 0.07, 0.05, 0.05));
      }
      break;
    }
    case 'cat': case 'fox':
      for (const s of [-1, 1]) {
        ear(geo.cone, headCol, s * 0.3, 0.5, 0, sp === 'fox' ? 0.17 : 0.14, sp === 'fox' ? 0.36 : 0.26, 0.1, -s * 0.35);
        ear(geo.cone, sp === 'fox' ? BLACK : PINK, s * 0.3, 0.5, 0.04, 0.08, 0.18, 0.05, -s * 0.35);
      }
      if (sp === 'fox') {
        const snout = part(geo.cone, acc, 0, -0.15, 0.55, 0.18, 0.3, 0.14);
        snout.rotation.x = Math.PI / 2; head.add(snout);
        head.add(part(geo.sphereLo, BLACK, 0, -0.15, 0.72, 0.05));
      } else {
        head.add(part(geo.sphere, acc, 0, -0.17, 0.43, 0.2, 0.13, 0.12));
        head.add(part(geo.sphereLo, PINK, 0, -0.1, 0.53, 0.05, 0.04, 0.04));
      }
      break;
    case 'frog':
      head.add(part(geo.box, BLACK, 0, -0.18, 0.47, 0.42, 0.03, 0.05));
      head.add(part(geo.sphere, acc, 0, -0.2, 0.2, 0.45, 0.25, 0.35));
      break;
    case 'owl':
      for (const s of [-1, 1]) ear(geo.cone, col, s * 0.32, 0.48, 0, 0.1, 0.25, 0.08, -s * 0.4);
      { const b = part(geo.cone, ORANGE, 0, -0.1, 0.52, 0.07, 0.18, 0.07); b.rotation.x = Math.PI * 0.6; head.add(b); }
      g.add(part(geo.sphere, acc, 0, 0.45, 0.2, 0.34, 0.4, 0.28));
      break;
    case 'dino':
      head.add(part(geo.sphere, headCol, 0, -0.1, 0.38, 0.38, 0.3, 0.38));
      head.add(part(geo.sphereLo, BLACK, -0.12, -0.02, 0.74, 0.03));
      head.add(part(geo.sphereLo, BLACK, 0.12, -0.02, 0.74, 0.03));
      for (let i = 0; i < 4; i++) head.add(part(geo.cone, acc, 0, 0.5 - i * 0.12, -0.15 - i * 0.14, 0.09, 0.2, 0.09));
      break;
    case 'duck': {
      const bill = part(geo.sphere, acc, 0, -0.1, 0.55, 0.22, 0.08, 0.2);
      head.add(bill);
      head.add(part(geo.cone, col, 0, 0.6, 0, 0.06, 0.18, 0.06));
      break;
    }
    case 'pig':
      head.add(part(geo.cyl, acc, 0, -0.1, 0.52, 0.17, 0.1, 0.13));
      head.children[head.children.length - 1].rotation.x = Math.PI / 2;
      head.add(part(geo.sphereLo, BLACK, -0.06, -0.1, 0.58, 0.03));
      head.add(part(geo.sphereLo, BLACK, 0.06, -0.1, 0.58, 0.03));
      for (const s of [-1, 1]) ear(geo.cone, acc, s * 0.32, 0.45, 0, 0.13, 0.2, 0.06, -s * 0.6);
      break;
    case 'unicorn': {
      const horn = part(geo.cone, GOLD, 0, 0.55, 0.25, 0.08, 0.42, 0.08);
      horn.rotation.x = 0.4; head.add(horn);
      for (const s of [-1, 1]) ear(geo.cone, headCol, s * 0.3, 0.48, -0.05, 0.1, 0.22, 0.07, -s * 0.3);
      for (let i = 0; i < 6; i++) head.add(part(geo.sphereLo, acc, 0, 0.45 - i * 0.16, -0.3 - Math.sin(i / 2) * 0.15, 0.15));
      head.add(part(geo.sphere, 0xffd6ec, 0, -0.18, 0.4, 0.22, 0.15, 0.14));
      break;
    }
  }
  return g;
}

// ---------- karts ----------
function wheel(r, w, hub) {
  const g = new THREE.Group();
  const tire = part(geo.cyl, 0x22222a, 0, 0, 0, r, w, r);
  tire.rotation.z = Math.PI / 2;
  const cap = part(geo.cyl, hub, 0, 0, 0, r * 0.5, w * 1.05, r * 0.5);
  cap.rotation.z = Math.PI / 2;
  g.add(tire, cap);
  return g;
}

export function buildKart(k, color) {
  const g = new THREE.Group();
  const wheels = [];
  let seatY = 0.55, seatZ = -0.25;
  const add = (...m) => m.forEach((x) => g.add(x));
  const putWheels = (r, w, fx, fz, rx, rz, y, hub = 0xdddddd) => {
    for (const [x, z, rr] of [[-fx, fz, r], [fx, fz, r], [-rx, rz, r * 1.1], [rx, rz, r * 1.1]]) {
      const wh = wheel(rr, w, hub);
      wh.position.set(x, y ?? rr, z);
      g.add(wh); wheels.push(wh);
    }
  };
  switch (k.style) {
    case 'classic':
      add(part(geo.box, color, 0, 0.45, 0, 1.4, 0.35, 2.3));
      add(part(geo.box, color, 0, 0.6, 0.85, 1.1, 0.3, 0.8));
      add(part(geo.box, 0xffffff, 0, 0.5, 1.2, 1.3, 0.2, 0.15));
      add(part(geo.box, BLACK, 0, 0.85, -0.75, 0.9, 0.6, 0.15));
      add(part(geo.cyl, 0x999999, -0.35, 0.55, -1.25, 0.09, 0.4, 0.09), part(geo.cyl, 0x999999, 0.35, 0.55, -1.25, 0.09, 0.4, 0.09));
      g.children.at(-1).rotation.x = Math.PI / 2; g.children.at(-2).rotation.x = Math.PI / 2;
      putWheels(0.38, 0.32, 0.8, 0.8, 0.82, -0.8);
      break;
    case 'buggy':
      add(part(geo.box, color, 0, 0.55, 0, 1.0, 0.18, 2.2));
      for (const s of [-1, 1]) add(part(geo.box, 0x333333, s * 0.45, 1.0, -0.3, 0.08, 0.9, 0.08));
      add(part(geo.box, 0x333333, 0, 1.45, -0.3, 1.0, 0.08, 0.08));
      add(part(geo.box, color, 0, 0.75, 0.9, 0.8, 0.3, 0.5));
      putWheels(0.36, 0.3, 0.75, 0.85, 0.85, -0.8);
      wheels.slice(2).forEach((w) => w.scale.setScalar(1.35));
      wheels.slice(2).forEach((w) => (w.position.y = 0.5));
      seatY = 0.62;
      break;
    case 'bubble':
      add(part(geo.sphere, color, 0, 0.6, 0.05, 0.85, 0.5, 1.25));
      add(part(geo.box, 0xffffff, 0, 0.55, 1.2, 0.8, 0.15, 0.2));
      putWheels(0.34, 0.3, 0.72, 0.75, 0.72, -0.75);
      seatY = 0.75;
      break;
    case 'rocket': {
      add(part(geo.box, color, 0, 0.45, -0.2, 1.1, 0.35, 2.0));
      const nose = part(geo.cone, color, 0, 0.5, 1.3, 0.55, 1.2, 0.3);
      nose.rotation.x = Math.PI / 2; add(nose);
      for (const s of [-1, 1]) {
        const fin = part(geo.box, 0xffffff, s * 0.6, 0.9, -1.0, 0.08, 0.6, 0.5);
        add(fin);
      }
      add(part(geo.cyl, 0x666666, 0, 0.55, -1.3, 0.25, 0.3, 0.25));
      g.children.at(-1).rotation.x = Math.PI / 2;
      putWheels(0.34, 0.3, 0.75, 0.9, 0.75, -0.8);
      break;
    }
    case 'teacup': {
      const cup = part(geo.cyl, 0xffffff, 0, 0.75, -0.1, 0.85, 0.8, 0.85);
      add(cup);
      add(part(geo.cyl, color, 0, 0.95, -0.1, 0.87, 0.2, 0.87));
      const handle = part(geo.torus, 0xffffff, 0.9, 0.8, -0.1, 0.3);
      handle.rotation.y = Math.PI / 2; add(handle);
      add(part(geo.cyl, color, 0, 0.32, -0.1, 0.95, 0.08, 0.95));
      putWheels(0.26, 0.24, 0.7, 0.7, 0.7, -0.75);
      seatY = 0.75; seatZ = -0.15;
      break;
    }
    case 'monster':
      add(part(geo.box, color, 0, 0.95, 0, 1.4, 0.4, 2.2));
      add(part(geo.box, 0x333333, 0, 0.7, 0, 0.5, 0.3, 1.8));
      add(part(geo.box, color, 0, 1.15, 0.85, 1.1, 0.25, 0.6));
      putWheels(0.6, 0.45, 0.95, 0.85, 0.95, -0.85);
      seatY = 1.05;
      break;
  }
  // steering wheel
  const sw = part(geo.torus, BLACK, 0, seatY + 0.55, 0.5, 0.2);
  sw.rotation.x = -0.9;
  add(sw);
  return { group: g, wheels, seatY, seatZ };
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
  const k = buildKart(kart, char.color === 0xf7f7f7 || char.color === 0xfaf4ff ? char.accent : char.color);
  body.add(k.group);
  const driver = buildDriver(char);
  driver.position.set(0, k.seatY - 0.15, k.seatZ);
  driver.scale.setScalar(0.85);
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
  return { root, body, driver, wheels: k.wheels, glider: gl, sparks, sparkMat, shadow };
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
  coinGeo ??= new THREE.CylinderGeometry(0.6, 0.6, 0.15, 18);
  const m = new THREE.Mesh(coinGeo, mat(0xffc93a, { params: { emissive: 0x6a4a00 } }));
  m.rotation.x = Math.PI / 2;
  const g = new THREE.Group(); g.add(m);
  return g;
}
export function buildPeel() {
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
