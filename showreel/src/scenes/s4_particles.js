// 04 — PARTICLES: the core detonates. 14k particles, every one a closed-form
// function of time (so sub-frames and scrubbing are exact): drag-damped
// explosion → tilted spiral galaxy with differential rotation → a Fibonacci
// sphere that condenses into the glass of scene 05.
import { W, H, b, bp, E, C, clamp, lerp, prog, TAU, rng, noise2, rgba } from "../core.js";

const cx = W / 2, cy = H / 2;
const N = 14000;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const D = 1500; // perspective distance
const COLORS = [C.ember, C.sun, C.paper, "#7C86FF"];

const P = {
  r0: new Float32Array(N), a0: new Float32Array(N), v: new Float32Array(N), kd: new Float32Array(N),
  spin: new Float32Array(N), arm: new Float32Array(N), R: new Float32Array(N), spread: new Float32Array(N),
  zg: new Float32Array(N), sx: new Float32Array(N), sy: new Float32Array(N), sz: new Float32Array(N),
  dB: new Float32Array(N), dC: new Float32Array(N), size: new Float32Array(N), col: new Uint8Array(N),
};
{
  const r = rng(4242);
  const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(TAU * r());
  for (let i = 0; i < N; i++) {
    P.r0[i] = 124 * Math.sqrt(r());
    P.a0[i] = TAU * r();
    P.v[i] = 380 + 2500 * Math.pow(r(), 1.6);
    P.kd[i] = 3.0 + 2.2 * r();
    P.spin[i] = (r() - 0.5) * 2.4;
    P.arm[i] = Math.floor(r() * 3);
    P.R[i] = 36 + 600 * Math.pow(r(), 0.85);
    P.spread[i] = gauss() * 0.3;
    P.zg[i] = gauss() * 16 * (1 - P.R[i] / 700);
    const y = 1 - (2 * (i + 0.5)) / N, rr = Math.sqrt(1 - y * y), ph = i * GOLDEN;
    P.sx[i] = Math.cos(ph) * rr;
    P.sy[i] = y;
    P.sz[i] = Math.sin(ph) * rr;
    P.dB[i] = r() * 0.28;
    P.dC[i] = ((y + 1) / 2) * 0.32 + r() * 0.05;
    P.size[i] = 1.3 + 2.2 * Math.pow(r(), 3);
    const c = r();
    P.col[i] = c < 0.68 ? 0 : c < 0.86 ? 1 : c < 0.95 ? 2 : 3;
  }
}

const stars = [];
{
  const r = rng(99);
  for (let i = 0; i < 260; i++) stars.push([r() * W, r() * H, 0.4 + r() * 1.3, r() * TAU, r()]);
}

// scratch buffers (screen x, y, size, alpha) per sub-frame
const X = new Float32Array(N), Y = new Float32Array(N), S = new Float32Array(N), A = new Float32Array(N);

function simulate(t) {
  const tau = t - b(12);
  const incl = 1.12, ci = Math.cos(incl), si = Math.sin(incl);
  const roll = -0.38, cr = Math.cos(roll), sr = Math.sin(roll);
  const tauS = t - b(14);
  const yaw = 0.95 * Math.max(0, t - b(13.6)) + 0.4, cyw = Math.cos(yaw), syw = Math.sin(yaw);
  const tilt = 0.32, ct = Math.cos(tilt), st = Math.sin(tilt);
  const Rs = lerp(300, 272, E.inOutCubic(bp(t, 15.3, 16.0)));
  const pulse = 1 + 0.035 * Math.exp(-9 * Math.max(0, t - b(15))) * (t >= b(15) ? 1 : 0);
  for (let i = 0; i < N; i++) {
    // A — explosion
    const k = P.kd[i];
    const ra = P.r0[i] + (P.v[i] * (1 - Math.exp(-k * tau))) / k;
    const aa = P.a0[i] + P.spin[i] * tau + 0.9 * (1 - Math.exp(-2.5 * tau));
    let x = Math.cos(aa) * ra, y = Math.sin(aa) * ra, sc = 1, alpha = 1;

    // B — galaxy (3D, tilted, differential rotation)
    const wB = E.inOutCubic(prog(tau, 0.18 + P.dB[i], 0.72 + P.dB[i]));
    if (wB > 0) {
      const R = P.R[i];
      const omega = 2.3 * Math.pow(140 / (R + 70), 0.85);
      const phi = (P.arm[i] * TAU) / 3 + R * 0.0078 + P.spread[i] + omega * tau;
      const gx = Math.cos(phi) * R, gz = Math.sin(phi) * R, gy = P.zg[i];
      const y1 = gy * ci - gz * si, z1 = gy * si + gz * ci;
      const x2 = gx * cr - y1 * sr, y2 = gx * sr + y1 * cr;
      const s = D / (D + z1);
      x = lerp(x, x2 * s, wB);
      y = lerp(y, y2 * s, wB);
      sc = lerp(1, s, wB);
      alpha = lerp(1, 0.55 + 0.45 * s, wB);
    }

    // C — sphere
    const wC = tauS > -0.5 ? E.inOutCubic(prog(t, b(14.0) + P.dC[i], b(14.0) + P.dC[i] + 0.42)) : 0;
    if (wC > 0) {
      const px = P.sx[i] * Rs * pulse, py = P.sy[i] * Rs * pulse, pz = P.sz[i] * Rs * pulse;
      const x1 = px * cyw + pz * syw, z1 = -px * syw + pz * cyw;
      const y1 = py * ct - z1 * st, z2 = py * st + z1 * ct;
      const s = D / (D + z2);
      const depth = clamp((z2 + Rs) / (2 * Rs));
      x = lerp(x, x1 * s, wC);
      y = lerp(y, y1 * s, wC);
      sc = lerp(sc, s * 1.05, wC);
      alpha = lerp(alpha, 0.2 + 0.8 * (1 - depth), wC);
    }
    X[i] = cx + x;
    Y[i] = cy + y;
    S[i] = P.size[i] * sc;
    A[i] = alpha;
  }
}

export default {
  id: "s4",
  label: "PARTICLES",
  t0: b(12),
  t1: b(16),
  samples: 12,
  shutter: 0.7,
  hud: "paper",
  post: (t) => ({ bloom: 0.5, bloomThr: lerp(0.9, 0.4, bp(t, 12.1, 12.8)), vignette: 0.5, grain: 0.038 }),

  render(env, t) {
    const { ctx } = env;
    const tau = t - b(12);
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, W, H);

    // slow push for life
    const zoom = 1 + 0.06 * E.outCubic(bp(t, 12, 16));
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    ctx.globalCompositeOperation = "lighter";
    // nebula
    const neb = E.outCubic(prog(tau, 0.1, 1.2)) * (1 - 0.5 * bp(t, 14, 16));
    if (neb > 0) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 760);
      g.addColorStop(0, rgba(C.cobalt, 0.2 * neb));
      g.addColorStop(0.45, rgba(C.cobalt, 0.07 * neb));
      g.addColorStop(1, rgba(C.cobalt, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 360);
      g2.addColorStop(0, rgba(C.ember, 0.22 * neb));
      g2.addColorStop(1, rgba(C.ember, 0));
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    }
    // stars
    const sa = E.outCubic(prog(tau, 0.2, 0.9));
    if (sa > 0) {
      ctx.fillStyle = C.paper;
      for (const [x, y, s, ph, k] of stars) {
        ctx.globalAlpha = sa * (0.18 + 0.3 * k) * (0.6 + 0.4 * Math.sin(ph + t * (2 + 3 * k)));
        ctx.fillRect(x, y, s, s);
      }
      ctx.globalAlpha = 1;
    }

    // particles
    simulate(t);
    for (let c = 0; c < 4; c++) {
      ctx.fillStyle = COLORS[c];
      for (let i = 0; i < N; i++) {
        if (P.col[i] !== c) continue;
        const s = S[i];
        ctx.globalAlpha = A[i] * 0.9;
        ctx.fillRect(X[i] - s / 2, Y[i] - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;

    // detonation: shockwaves + anamorphic streak
    if (tau < 0.6) {
      for (const [spd, w, col, a] of [[2600, 18, C.paper, 0.55], [1500, 8, C.ember, 0.8], [900, 3, C.sun, 0.7]]) {
        const r = 124 + spd * E.outCubic(prog(tau, 0, 0.55)) * 0.55;
        const f = 1 - prog(tau, 0, 0.5);
        if (f <= 0) continue;
        ctx.strokeStyle = col;
        ctx.globalAlpha = a * f * f;
        ctx.lineWidth = w * f;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.stroke();
      }
      const f = Math.exp(-6 * tau);
      ctx.globalAlpha = 0.8 * f;
      const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 900);
      sg.addColorStop(0, rgba(C.sun, 1));
      sg.addColorStop(0.2, rgba(C.ember, 0.5));
      sg.addColorStop(1, rgba(C.ember, 0));
      ctx.fillStyle = sg;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.018 + 0.03 * f);
      ctx.translate(-cx, -cy);
      ctx.fillRect(0, cy - 900, W, 1800);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over";
  },
};
