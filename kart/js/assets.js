// Loads the Kenney 3D models (CC0, www.kenney.nl) once, then hands out copies.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const cache = new Map();
const loader = new GLTFLoader();

export async function preload(paths, onProgress = () => {}) {
  let done = 0;
  await Promise.all([...new Set(paths)].map((p) => loader.loadAsync('assets/' + p).then((g) => {
    // Lambert is cheaper on phones and matches the rest of the game's lighting
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      const old = o.material;
      o.material = new THREE.MeshLambertMaterial({ map: old.map || null, color: old.map ? 0xffffff : old.color, vertexColors: !!o.geometry.attributes.color });
      old.dispose();
    });
    const box = new THREE.Box3().setFromObject(g.scene);
    cache.set(p, { scene: g.scene, box, size: box.getSize(new THREE.Vector3()) });
    onProgress(++done / paths.length);
  }).catch((e) => { console.warn('model failed', p, e); onProgress(++done / paths.length); })));
}

export const has = (p) => cache.has(p);

// A copy of the model scaled so one dimension matches `size`, sitting on y=0, centered in x/z.
// fit: 'h' height, 'w' width (x), 'l' length (z), 'max' largest side.
export function fitted(p, size, fit = 'h') {
  const c = cache.get(p);
  const wrap = new THREE.Group();
  if (!c) return wrap;
  const inner = c.scene.clone(true);
  const s = c.size;
  const ref = fit === 'w' ? s.x : fit === 'l' ? s.z : fit === 'max' ? Math.max(s.x, s.y, s.z) : s.y;
  const k = size / (ref || 1);
  inner.scale.setScalar(k);
  inner.position.set(-(c.box.min.x + s.x / 2) * k, -c.box.min.y * k, -(c.box.min.z + s.z / 2) * k);
  wrap.add(inner);
  wrap.userData.size = s.clone().multiplyScalar(k);
  return wrap;
}

// Many copies of one model drawn as instanced meshes (one draw call per sub-mesh).
// spots: [[x, y, z, rotY, scaleMul], ...]
export function instanced(p, spots, size, fit = 'h') {
  const g = new THREE.Group();
  const c = cache.get(p);
  if (!c || !spots.length) return g;
  const proto = fitted(p, size, fit);
  proto.updateMatrixWorld(true);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  proto.traverse((o) => {
    if (!o.isMesh) return;
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
    const im = new THREE.InstancedMesh(geo, o.material, spots.length);
    spots.forEach(([x, y, z, r, s = 1], i) => {
      q.setFromAxisAngle(up, r);
      m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s, s));
      im.setMatrixAt(i, m);
    });
    im.computeBoundingSphere();
    g.add(im);
  });
  return g;
}
