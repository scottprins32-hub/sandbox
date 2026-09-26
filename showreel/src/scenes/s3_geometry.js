// 03 — GEOMETRY: a Bauhaus quarter-disc system. Four rotation waves re-tile
// the pattern on the beat, a 3D flip recolours it, and every disc is then
// reeled into the single circle that detonates bar 4.
import { W, H, b, bp, E, C, clamp, lerp, prog, TAU, snap, mixc } from "../core.js";
import { zoomState, ZOOM } from "./s2_type.js";

const cx = W / 2, cy = H / 2;
const T = 192, COLS = 10, ROWS = 6, OY = -36;
const HALF = Math.PI / 2;

const PAL_A = [
  [C.ember, C.paper, C.sun, C.paper, C.ember],
  [C.ink, C.sun, C.ember, C.sun, C.ink],
  [C.ember, C.paper, C.sun, C.paper, C.ember],
];
const SHIFT = { [C.ember]: C.sun, [C.sun]: C.paper, [C.paper]: C.ember, [C.ink]: C.ember };

const tiles = [];
for (let j = 0; j < ROWS; j++) {
  for (let i = 0; i < COLS; i++) {
    const right = i % 2 === 0, bottom = j % 2 === 0;
    const o = right ? (bottom ? 2 : 1) : bottom ? 3 : 0;
    const ci = ((right ? i + 1 : i) - 1) / 2, cj = ((bottom ? j + 1 : j) - 1) / 2;
    const x = i * T, y = OY + j * T;
    const mx = x + T / 2, my = y + T / 2;
    const dist = Math.hypot(mx - cx, my - cy);
    const disc = PAL_A[cj][ci];
    tiles.push({
      i, j, x, y, mx, my, o, dist,
      discA: disc,
      discB: SHIFT[disc],
      bgA: C.cobalt,
      bgB: (ci + cj) % 2 === 0 ? C.ink : C.cobalt,
      dn: Math.min(1, dist / 1100),
    });
  }
}
const N = tiles.length;

function rotation(tile, t) {
  const { i, j, dist } = tile;
  let a = 0;
  const w = (t0, delay, dur, delta, ease = snap) => {
    a += delta * ease(prog(t, t0 + delay, t0 + delay + dur));
  };
  w(b(9.0), (i + j) * 0.014, 0.26, HALF);
  w(b(9.5), dist * 0.00021, 0.24, Math.PI, E.inOutCubic);
  w(b(10.5), dist * 0.00018, 0.2, (i + j) % 2 === 0 ? HALF : -HALF);
  return a;
}

function discPath(ctx, m, rs) {
  // quarter disc anchored at local top-left corner  →  small centred circle
  const h = T / 2;
  const x = lerp(-h, -rs, m), y = lerp(-h, -rs, m);
  const s = lerp(T, rs * 2, m);
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, [lerp(0, rs, m), lerp(0, rs, m), lerp(T, rs, m), lerp(0, rs, m)]);
}

// gather: centre tiles collapse first; everything lands before the downbeat
const G0 = b(11.0);
const morphT = (tile) => G0 + tile.dn * 0.14;
const arriveT = (tile) => morphT(tile) + 0.1 + 0.18;

export default {
  id: "s3",
  label: "GEOMETRY",
  t0: b(8),
  t1: b(12),
  samples: 10,
  shutter: 0.6,
  hud: "paper",
  post: (t) => ({ vignette: 0.22 }),

  zoomMatrix(t) {
    if (t >= ZOOM.t1) return { tx: cx, ty: cy, s: 1 };
    const z = zoomState(t);
    return { tx: z.px, ty: z.py, s: z.Z / z.zmax };
  },

  render(env, t) {
    this.draw(env, t, this.zoomMatrix(t));
  },

  draw(env, t, cam) {
    const { ctx } = env;
    ctx.save();
    ctx.fillStyle = t < b(10.9) ? C.cobalt : C.ink;
    ctx.fillRect(0, 0, W, H);
    ctx.transform(cam.s, 0, 0, cam.s, cam.tx - cx * cam.s, cam.ty - cy * cam.s);

    const rs = 30;
    for (const tile of tiles) {
      const m0 = morphT(tile), arrive = arriveT(tile);
      const morph = snap(prog(t, m0, m0 + 0.1));
      const fly = E.inCubic(prog(t, arrive - 0.18, arrive));
      if (fly >= 1) continue;

      const flipP = prog(t, b(10.0) + tile.i * 0.021, b(10.0) + tile.i * 0.021 + 0.24);
      const flipped = flipP >= 0.5;
      const sx = flipP > 0 && flipP < 1 ? Math.max(0.02, Math.abs(Math.cos(Math.PI * E.inOutSine(flipP)))) : 1;
      const bg = flipped ? tile.bgB : tile.bgA;
      let disc = flipped ? tile.discB : tile.discA;

      const theta = rotation(tile, t) + tile.o * HALF;

      // background square (shrinks away during the gather)
      ctx.save();
      ctx.translate(tile.mx, tile.my);
      ctx.scale(sx, 1);
      const bs = 1 - E.inCubic(prog(t, m0 + 0.02, m0 + 0.13));
      if (bs > 0.001) {
        ctx.fillStyle = bg;
        const hb = (T / 2) * bs + 0.6;
        ctx.fillRect(-hb, -hb, hb * 2, hb * 2);
      }
      if (fly <= 0) {
        if (morph < 1) {
          ctx.beginPath();
          const hc = (T / 2) * Math.max(bs, 0.001) + 0.6 + morph * 40;
          ctx.rect(-hc, -hc, hc * 2, hc * 2);
          ctx.clip();
        }
        ctx.rotate(theta);
        ctx.fillStyle = disc;
        discPath(ctx, morph, rs);
        ctx.fill();
      }
      ctx.restore();

      if (fly > 0) {
        const phi = 1.8 * fly;
        const dx = (tile.mx - cx) * (1 - fly), dy = (tile.my - cy) * (1 - fly);
        const px = cx + dx * Math.cos(phi) - dy * Math.sin(phi);
        const py = cy + dx * Math.sin(phi) + dy * Math.cos(phi);
        ctx.fillStyle = mixc(disc, C.ember, E.inCubic(fly));
        ctx.beginPath();
        ctx.arc(px, py, rs * (1 - 0.45 * fly), 0, TAU);
        ctx.fill();
      }
    }

    // hairline tile grid — the system made visible
    const gl = E.outCubic(bp(t, 8.7, 9.2)) * (1 - E.inCubic(bp(t, 10.9, 11.2)));
    if (gl > 0 && cam.s > 0.5) {
      ctx.fillStyle = C.paper;
      ctx.globalAlpha = 0.16 * gl;
      const lw = 1.2 / cam.s;
      for (let i = 1; i < COLS; i++) ctx.fillRect(i * T - lw / 2, OY, lw, ROWS * T);
      for (let j = 1; j < ROWS; j++) ctx.fillRect(0, OY + j * T - lw / 2, COLS * T, lw);
      ctx.globalAlpha = 1;
    }

    // the gathered core
    let got = 0;
    for (const tile of tiles) got += clamp((t - arriveT(tile)) / 0.05);
    if (got > 0) {
      const breathe = 1 - 0.14 * E.inOutSine(bp(t, 11.86, 12.0));
      const r = 128 * Math.sqrt(got / N) * breathe;
      ctx.fillStyle = C.ember;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fill();
      const ring = bp(t, 11.45, 12.0);
      ctx.strokeStyle = C.paper;
      ctx.globalAlpha = 0.5 * Math.sin(Math.PI * ring);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 14 + 30 * (1 - ring), 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
};
