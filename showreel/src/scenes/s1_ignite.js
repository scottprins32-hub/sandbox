// 01 — IGNITION: one dot builds a precision instrument, inhales, and detonates
// into an iris wipe on the downbeat of bar 2.
import { W, H, b, bp, E, C, rgba, mixc, clamp, lerp, prog, spring, hit, TAU } from "../core.js";
import { layout, glyph } from "../type.js";

const cx = W / 2, cy = H / 2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const PHY_K = 460, PHY_N = 900, PHY_C = 14;

function label(ctx, face, str, x, y, size, alpha) {
  const L = layout(face, str, { size, vars: { wght: 500 }, track: 40 });
  ctx.globalAlpha = alpha;
  for (const it of L.items) glyph(ctx, face, it.ch, L.w, x - L.width / 2 + it.x, y + size * 0.36, size);
  ctx.globalAlpha = 1;
}

export default {
  id: "s1",
  label: "IGNITION",
  t0: b(0),
  t1: b(4),
  samples: 10,
  shutter: 0.6,
  hud: "paper",
  post: (t) => ({ bloom: 0.32, bloomThr: 0.55, vignette: 0.5 }),

  render(env, t) {
    const { ctx, faces } = env;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1150);
    g.addColorStop(0, "#1c1a17");
    g.addColorStop(1, "#080706");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const collapse = bp(t, 3.0, 3.5);
    const k = 1 - E.inBack(collapse, 2.4); // ring scale, with a tiny swell first

    // ── faint layout grid, sweeping outward from centre ──
    const gp = E.outCubic(bp(t, 0.35, 1.5)) * (1 - E.inQuad(collapse));
    if (gp > 0) {
      ctx.fillStyle = C.paper;
      for (let i = -8; i <= 8; i++) {
        const a = clamp(gp * 9 - Math.abs(i)) * 0.055;
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        ctx.fillRect(Math.round(cx + i * 120), 0, 1, H);
        if (Math.abs(i) <= 4) ctx.fillRect(0, Math.round(cy + i * 120), W, 1);
      }
      ctx.globalAlpha = 1;
    }

    // ── crosshair rulers ──
    const ext = E.outExpo(bp(t, 0.5, 1.3)) * (1 - E.inExpo(bp(t, 3.0, 3.42)));
    if (ext > 0) {
      const Lh = 940 * ext, Lv = 520 * ext, gap = 34;
      ctx.fillStyle = C.paper;
      ctx.globalAlpha = 0.34;
      ctx.fillRect(cx + gap, cy - 0.5, Math.max(0, Lh - gap), 1);
      ctx.fillRect(cx - Lh, cy - 0.5, Math.max(0, Lh - gap), 1);
      ctx.fillRect(cx - 0.5, cy + gap, 1, Math.max(0, Lv - gap));
      ctx.fillRect(cx - 0.5, cy - Lv, 1, Math.max(0, Lv - gap));
      for (let d = 48; d < Lh; d += 24) {
        const major = d % 120 === 0;
        const h = major ? 12 : 5;
        const fade = clamp((Lh - d) / 80);
        ctx.globalAlpha = 0.34 * fade;
        ctx.fillRect(cx + d, cy - h / 2, 1, h);
        ctx.fillRect(cx - d, cy - h / 2, 1, h);
        if (d < Lv) {
          const fv = clamp((Lv - d) / 80);
          ctx.globalAlpha = 0.34 * fv;
          ctx.fillRect(cx - h / 2, cy + d, h, 1);
          ctx.fillRect(cx - h / 2, cy - d, h, 1);
        }
      }
      ctx.globalAlpha = 1;
    }

    // ── ring C: degree dial ──
    const cIn = bp(t, 2.0, 2.55);
    if (cIn > 0 && k > 0.01) {
      const rotC = -0.28 * Math.max(0, t - b(2)) + collapse * 2.2;
      const r = 232 * k;
      ctx.strokeStyle = C.paper;
      ctx.globalAlpha = 0.32 * E.outCubic(cIn);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 72; i++) {
        const ti = b(2.0) + (i / 72) * b(0.55);
        const p = E.outBack(prog(t, ti, ti + 0.16), 2.2);
        if (p <= 0) continue;
        const major = i % 9 === 0, mid = i % 3 === 0;
        const len = (major ? 18 : mid ? 10 : 5) * p * k;
        const a = rotC + (i / 72) * TAU - Math.PI / 2;
        ctx.globalAlpha = major ? 0.85 : 0.45;
        ctx.lineWidth = major ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (r + 3), cy + Math.sin(a) * (r + 3));
        ctx.lineTo(cx + Math.cos(a) * (r + 3 + len), cy + Math.sin(a) * (r + 3 + len));
        ctx.stroke();
      }
      ctx.fillStyle = C.paper;
      const labels = ["000°", "090°", "180°", "270°"];
      for (let q = 0; q < 4; q++) {
        const p = E.outCubic(bp(t, 2.1 + q * 0.12, 2.45 + q * 0.12));
        if (p <= 0) continue;
        const a = rotC + (q / 4) * TAU - Math.PI / 2;
        const rr = (r + 44) * k;
        label(ctx, faces.mono, labels[q], cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 13, 0.55 * p);
      }
      ctx.globalAlpha = 1;
    }

    // ── phyllotaxis bloom (golden-angle sunflower annulus) ──
    const bloomStart = b(2.05);
    if (t > bloomStart) {
      const rot = 0.16 * (t - bloomStart);
      for (let j = 0; j < PHY_N; j++) {
        const tj = bloomStart + (j / PHY_N) * b(0.78);
        const s = spring(t - tj, 3.6, 0.42);
        if (s <= 0.001) continue;
        const i = PHY_K + j;
        let r = PHY_C * Math.sqrt(i);
        let a = i * GOLDEN + rot;
        const cp = E.inCubic(prog(t, b(3.0) + (j / PHY_N) * b(0.12), b(3.47)));
        r *= 1 - cp;
        a += cp * 3.4;
        const f = j / PHY_N;
        const size = (1.3 + 3.2 * f) * s * (1 - cp * 0.6);
        ctx.fillStyle = f < 0.55 ? mixc(C.ember, C.sun, f / 0.55) : mixc(C.sun, C.paper, (f - 0.55) / 0.45);
        ctx.globalAlpha = (0.95 - 0.45 * f) * (1 - cp * 0.3);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, size, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // ── ring B: dashed, drawn counter-clockwise ──
    const bIn = E.inOutCubic(bp(t, 1.5, 2.05));
    if (bIn > 0 && k > 0.01) {
      ctx.strokeStyle = C.paper;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 9]);
      ctx.lineDashOffset = -Math.max(0, t - b(2)) * 46;
      const rotB = 0.5 * Math.max(0, t - b(2.05)) - collapse * 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 150 * k, -Math.PI / 2 + rotB, -Math.PI / 2 + rotB - bIn * TAU, true);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // ── ring A: solid ember, drawn clockwise with a leading bead ──
    const aIn = E.inOutCubic(bp(t, 1.0, 1.55));
    if (aIn > 0 && k > 0.01) {
      const rotA = 0.9 * Math.max(0, t - b(1.55)) + collapse * 4;
      const r = 88 * k;
      ctx.strokeStyle = C.ember;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2 + rotA, -Math.PI / 2 + rotA + aIn * TAU);
      ctx.stroke();
      ctx.lineCap = "butt";
      const head = -Math.PI / 2 + rotA + aIn * TAU;
      ctx.fillStyle = C.paper;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(head) * r, cy + Math.sin(head) * r, 4.5 * Math.min(1, k * 1.2), 0, TAU);
      ctx.fill();
    }

    // ── satellites ──
    if (k > 0.02) {
      const sats = [
        [150, 1.8, 2.05, C.ember, 3.5],
        [232, -0.9, 2.5, C.paper, 3],
        [232, 1.3, 2.6, C.ember, 2.5],
      ];
      for (const [r, w, t0, col, size] of sats) {
        const p = E.outBack(bp(t, t0, t0 + 0.4));
        if (p <= 0) continue;
        const a = w * (t - b(t0)) + r + collapse * 5;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k, size * p, 0, TAU);
        ctx.fill();
      }
    }

    // ── the dot, then the iris ──
    let rd = 11 * spring(t - 0.02, 3.4, 0.3);
    rd += 5 * hit(t - b(1), 12) + 5 * hit(t - b(2), 12) + 4 * hit(t - b(1.5), 14) + 4 * hit(t - b(2.5), 14);
    rd = lerp(rd, 24, E.inCubic(bp(t, 3.0, 3.5)));
    const iris = bp(t, 3.5, 4.0);
    if (iris > 0) rd = lerp(24, 1130, E.inExpo(iris));

    if (iris < 0.6) {
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, rd * 5);
      halo.addColorStop(0, rgba(C.ember, 0.3));
      halo.addColorStop(1, rgba(C.ember, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(cx - rd * 5, cy - rd * 5, rd * 10, rd * 10);
    }
    ctx.fillStyle = C.ember;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0, rd), 0, TAU);
    ctx.fill();
    if (iris > 0) {
      ctx.strokeStyle = C.paper;
      ctx.globalAlpha = 0.85 * (1 - iris * 0.4);
      ctx.lineWidth = 2 + 6 * iris;
      ctx.beginPath();
      ctx.arc(cx, cy, rd + 2, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  },
};
