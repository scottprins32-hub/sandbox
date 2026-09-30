// Frame loop: every output frame integrates N sub-frames across a virtual
// shutter, so all motion blur is real temporal blur, not a filter.
import { W, H, FPS, FRAMES, DURATION, clamp } from "./core.js";
import { Face } from "./type.js";
import { Compositor } from "./gl.js";
import { drawHud } from "./hud.js";
import { SCENES } from "./scenes/index.js";
import { postAt, cameraAt } from "./fx.js";

const out = document.getElementById("out");
out.width = W;
out.height = H;
const comp = new Compositor(out);

function makeCanvas() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  return c;
}
const c2d = makeCanvas();
const ctx = c2d.getContext("2d", { willReadFrequently: true });
const hudCanvas = makeCanvas();
const hud = hudCanvas.getContext("2d", { willReadFrequently: true });

const faces = {
  display: new Face("archivo"),
  mono: new Face("mono"),
  serif: new Face("serif"),
  italic: new Face("serifItalic"),
};

const env = {
  ctx,
  comp,
  faces,
  canvas: c2d,
  hasGL: false,
  has2D: true,
  /** run a registered GL scene shader into the scene layer */
  gl(name, uniforms) {
    comp.runScene(name, uniforms);
    env.hasGL = true;
  },
  /** move everything drawn so far into the shader backdrop texture */
  flush2D() {
    comp.upload(comp.texBack, c2d);
    env.reset();
    ctx.clearRect(0, 0, W, H);
  },
  reset() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.setLineDash([]);
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
  },
  scene: (id) => SCENES.find((s) => s.id === id),
};

SCENES.forEach((s, i) => {
  s.index = i;
  s.init?.(env);
});

export function sceneAt(t) {
  for (const s of SCENES) if (t >= s.t0 && t < s.t1) return s;
  return SCENES[SCENES.length - 1];
}

function renderSub(sc, ts) {
  env.reset();
  ctx.clearRect(0, 0, W, H);
  env.hasGL = false;
  env.has2D = true;
  sc.render(env, ts);
  if (env.has2D) comp.upload(comp.tex2D, c2d);
}

export function renderFrame(f, opts = {}) {
  const t = f / FPS;
  const sc = sceneAt(t);
  env.frameT = t;
  const n = opts.samples ?? sc.samples ?? 8;
  const shutter = sc.shutter ?? 0.55;
  comp.beginFrame();
  for (let i = 0; i < n; i++) {
    let ts = n === 1 ? t : t + ((i + 0.5) / n - 0.5) * (shutter / FPS);
    ts = clamp(ts, 0, DURATION - 1e-6);
    let s2 = sceneAt(ts);
    if (s2 !== sc) {
      // a hard cut is never blurred across; continuous moves are
      const later = s2.t0 > sc.t0 ? s2 : sc;
      if (later.hardIn) {
        ts = clamp(ts, sc.t0, sc.t1 - 1e-6);
        s2 = sc;
      }
    }
    renderSub(s2, ts);
    comp.accumulate({ weight: 1 / n, hasGL: env.hasGL, has2D: env.has2D, xf: cameraAt(ts, s2) });
  }
  drawHud(hud, t, sc, SCENES, faces);
  comp.endFrame({ ...postAt(t, sc), time: t, seed: f * 0.618 }, hudCanvas);
}

const pixels = new Uint8Array(W * H * 4);
window.reel = {
  W,
  H,
  FPS,
  frames: FRAMES,
  scenes: SCENES.map((s) => ({ id: s.id, label: s.label, t0: s.t0, t1: s.t1 })),
  render: (f, opts) => renderFrame(f, opts),
  async send(f, url = "/frame") {
    comp.read(pixels);
    const r = await fetch(`${url}?i=${f}`, { method: "POST", body: new Blob([pixels]) });
    return r.ok;
  },
  ready: true,
};
