// 08 — IDENT: the drop. The dot that opened the reel bursts into the name,
// then hops across the letters — squash, stretch, letters dipping under its
// weight — and lands as the full stop. Bookends: dot, rulers, grid.
import { W, H, b, bp, E, C, clamp, lerp, prog, TAU, rng, wobble, hit, rgba, spring } from "../core.js";
import { layout, glyph, fitSize } from "../type.js";
import { scramble } from "../hud.js";

const cx = W / 2, cy = H / 2;
const WORD = "CLAUDE";
const VARS = { wght: 900, wdth: 112 };
let F, SI, M;
const K = {};

const sparks = [];
{
  const r = rng(808);
  for (let i = 0; i < 90; i++) {
    sparks.push({ a: r() * TAU, v: 700 + 2200 * r() * r(), k: 3 + 3 * r(), s: 1.5 + 2.5 * r(), c: r() < 0.6 ? C.ember : r() < 0.7 ? C.sun : C.paper });
  }
}
const embers = [];
{
  const r = rng(515);
  for (let i = 0; i < 46; i++) embers.push({ x: r() * W, y: r() * H, sp: 18 + 40 * r(), s: 1 + 2.2 * r(), ph: r() * TAU, w: 0.4 + r() });
}

// dot flight: launch from the burst, hop C → A → D, land as the period
function dotState(t) {
  const L = K.hops;
  if (t < L[0].t) return null;
  for (let i = 0; i < L.length - 1; i++) {
    const A = L[i], B = L[i + 1];
    const t1 = A.t + A.rest, t2 = B.t;
    if (t < t1) return { x: A.x, y: A.y, contact: t - A.t, idx: A.idx, vx: 0, vy: 0 };
    if (t < t2) {
      const u = (t - t1) / (t2 - t1);
      const x = lerp(A.x, B.x, u);
      const y = lerp(A.y, B.y, u) - B.h * 4 * u * (1 - u);
      const dt = 1e-3;
      const u2 = Math.min(1, u + dt / (t2 - t1));
      const x2 = lerp(A.x, B.x, u2), y2 = lerp(A.y, B.y, u2) - B.h * 4 * u2 * (1 - u2);
      return { x, y, vx: (x2 - x) / dt, vy: (y2 - y) / dt, contact: -1, idx: -1 };
    }
  }
  const Z = L[L.length - 1];
  return { x: Z.x, y: Z.y, contact: t - Z.t, idx: Z.idx, vx: 0, vy: 0, final: true };
}

export default {
  id: "s8",
  label: "IDENT",
  t0: b(28),
  t1: b(32),
  samples: 10,
  shutter: 0.6,
  hardIn: true,
  hud: "paper",
  hudAlpha: (t) => 0.75,
  post: (t) => ({ bloom: 0.2, bloomThr: 0.82, vignette: 0.5 }),
  zoom: (t) => 1 + 0.035 * E.inOutSine(bp(t, 29.4, 32)),

  init(env) {
    F = env.faces.display;
    SI = env.faces.italic;
    M = env.faces.mono;
    K.size = fitSize(F, WORD, 1240, { vars: VARS });
    K.L = layout(F, WORD, { size: K.size, vars: VARS });
    K.capH = F.capH * (K.size / F.upm);
    K.yb = cy + K.capH / 2 - 78;
    K.x0 = cx - K.L.width / 2 - K.capH * 0.12;
    K.r = K.capH * 0.105;
    const top = K.yb - K.capH - K.r;
    const mid = (i) => K.x0 + K.L.items[i].x + K.L.items[i].adv / 2;
    const endX = K.x0 + K.L.width + K.r * 1.55;
    K.periodX = endX;
    K.hops = [
      { t: b(28.0), x: cx, y: cy, rest: 0.0, h: 0, idx: -1 },
      { t: b(28.75), x: mid(0), y: top, rest: 0.035, h: 330, idx: 0 },
      { t: b(29.0), x: mid(2), y: top, rest: 0.035, h: 150, idx: 2 },
      { t: b(29.25), x: mid(4), y: top, rest: 0.035, h: 150, idx: 4 },
      { t: b(29.625), x: endX, y: K.yb - K.r, rest: 0, h: 210, idx: 6 },
    ];
  },

  render(env, t) {
    const { ctx } = env;
    const T0 = b(28);
    const tau = t - T0;

    // ground
    const g = ctx.createRadialGradient(cx, cy - 40, 0, cx, cy, 1150);
    g.addColorStop(0, "#1d1a17");
    g.addColorStop(1, "#070606");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // bookend: the rulers from the opening, very faint
    const rl = E.outCubic(bp(t, 28.6, 29.6));
    if (rl > 0) {
      ctx.fillStyle = C.paper;
      ctx.globalAlpha = 0.045 * rl;
      for (let i = -8; i <= 8; i++) ctx.fillRect(Math.round(cx + i * 120), 0, 1, H);
      for (let i = -4; i <= 4; i++) ctx.fillRect(0, Math.round(cy + i * 120), W, 1);
      ctx.globalAlpha = 1;
    }

    // drifting embers
    ctx.globalCompositeOperation = "lighter";
    const ea = E.outCubic(bp(t, 28.3, 29.5));
    for (const e of embers) {
      const y = ((e.y - e.sp * tau) % H + H) % H;
      const x = e.x + Math.sin(e.ph + tau * e.w * 2) * 14;
      ctx.globalAlpha = ea * (0.25 + 0.35 * Math.sin(e.ph + tau * 5 * e.w) ** 2);
      ctx.fillStyle = C.ember;
      ctx.fillRect(x, y, e.s, e.s);
    }
    ctx.globalAlpha = 1;

    // burst: sparks + shockwave
    if (tau < 0.8) {
      for (const s of sparks) {
        const d = (s.v * (1 - Math.exp(-s.k * tau))) / s.k;
        const f = 1 - prog(tau, 0.1, 0.75);
        if (f <= 0) continue;
        ctx.globalAlpha = f;
        ctx.fillStyle = s.c;
        ctx.fillRect(cx + Math.cos(s.a) * d - s.s / 2, cy + Math.sin(s.a) * d - s.s / 2, s.s, s.s);
      }
      const rp = prog(tau, 0, 0.6);
      ctx.strokeStyle = C.paper;
      ctx.globalAlpha = 0.6 * (1 - rp) ** 2;
      ctx.lineWidth = 14 * (1 - rp);
      ctx.beginPath();
      ctx.arc(cx, cy, 30 + 1300 * E.outCubic(rp), 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over";

    // the name
    const order = [2, 3, 1, 4, 0, 5];
    const dot = dotState(t);
    for (const it of K.L.items) {
      const rank = order.indexOf(it.i);
      const d0 = T0 + rank * 0.035;
      const p = E.outExpo(prog(t, d0, d0 + 0.62));
      if (p <= 0) continue;
      // the dot's weight: letters dip when it lands on them
      let dip = 0;
      for (const hp of K.hops) if (hp.idx === it.i) dip += 20 * wobble(t - hp.t, 3.2, 7);
      // final-beat ripple through the weight axis
      const rip = Math.sin(Math.PI * prog(t, b(31) + it.i * 0.045, b(31) + it.i * 0.045 + 0.34));
      const wght = lerp(140, 900, E.outCubic(prog(t, d0, d0 + 0.5))) - 330 * rip;
      const wdth = lerp(125, 112, p);
      const Li = layout(F, it.ch, { size: K.size, vars: { wght, wdth } });
      const fx = K.x0 + it.x + it.adv / 2, fy = K.yb - K.capH / 2;
      const x = lerp(cx, fx, p), y = lerp(cy, fy, p) + dip;
      const s = lerp(0.1, 1, p);
      const rot = (1 - p) * (it.i < 3 ? -0.7 : 0.7);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(s, s);
      ctx.fillStyle = C.paper;
      glyph(ctx, F, it.ch, Li.w, -Li.width / 2, K.capH / 2, K.size);
      ctx.restore();
    }

    // the dot
    if (dot) {
      let sx = 1, sy = 1, ang = 0;
      const sp = Math.hypot(dot.vx, dot.vy);
      if (dot.contact < 0 && sp > 1) {
        const st = clamp(sp / 5200, 0, 0.45);
        sx = 1 + st;
        sy = 1 / (1 + st);
        ang = Math.atan2(dot.vy, dot.vx);
      }
      let squash = 0;
      if (dot.contact >= 0 && dot.idx >= 0) squash = (dot.final ? 0.5 : 0.42) * Math.exp(-(dot.final ? 9 : 16) * dot.contact) * Math.cos(TAU * (dot.final ? 3.2 : 5) * dot.contact);
      const beat = t > b(30) ? 0.14 * hit(((t / b(1)) % 1) * b(1), 9) : 0;
      const r = K.r * (dot.idx === -1 && dot.contact >= 0 ? spring(dot.contact + 0.05, 4, 0.4) : 1) * (1 + beat);
      ctx.save();
      ctx.translate(dot.x, dot.y + r);
      if (squash !== 0) ctx.scale(1 + squash, 1 - squash);
      ctx.translate(0, -r);
      ctx.rotate(ang);
      ctx.scale(sx, sy);
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 4);
      halo.addColorStop(0, rgba(C.ember, 0.35));
      halo.addColorStop(1, rgba(C.ember, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(-r * 4, -r * 4, r * 8, r * 8);
      ctx.fillStyle = C.ember;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      ctx.restore();
      // landing ripple for the full stop
      if (dot.final) {
        const rp = prog(dot.contact, 0, 0.5);
        if (rp < 1) {
          ctx.strokeStyle = C.ember;
          ctx.globalAlpha = 0.7 * (1 - rp);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(dot.x, K.yb + 4, K.r + 90 * E.outCubic(rp), (K.r + 90 * E.outCubic(rp)) * 0.22, 0, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    // rule + subtitle + credit line
    const ry = K.yb + 58;
    const rw = 1280 * E.outExpo(bp(t, 29.5, 30.05));
    if (rw > 1) {
      ctx.fillStyle = C.paper;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(cx - rw / 2, ry, rw, 1.5);
      ctx.globalAlpha = 1;
    }
    const sub = ["Motion", "Designer"];
    const subSize = 104;
    const sy0 = ry + 118;
    const Ls = layout(SI, sub.join(" "), { size: subSize, track: 0 });
    let wx = cx - Ls.width / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, ry + 6, W, sy0 + 34 - ry);
    ctx.clip();
    let k = 0;
    for (const w of sub) {
      const Lw = layout(SI, w, { size: subSize });
      const p = E.outExpo(prog(t, b(29.625) + k * 0.07, b(29.625) + k * 0.07 + 0.5));
      const dy = (1 - p) * subSize * 1.3;
      ctx.fillStyle = C.paper;
      for (const it of Lw.items) glyph(ctx, SI, it.ch, Lw.w, wx + it.x, sy0 + dy, subSize);
      wx += Lw.width + subSize * 0.26;
      k++;
    }
    ctx.restore();
    const cp = prog(t, b(30.0), b(30.0) + 0.32);
    if (cp > 0) {
      const str = scramble("SHOWREEL 2026  —  EVERY FRAME WRITTEN IN CODE", cp, Math.floor(t * 60));
      const Lm = layout(M, str, { size: 16, vars: { wght: 500 }, track: 150 });
      ctx.fillStyle = C.paper;
      ctx.globalAlpha = 0.6;
      for (const it of Lm.items) if (it.ch !== " ") glyph(ctx, M, it.ch, Lm.w, cx - Lm.width / 2 + it.x, sy0 + 88, 16);
      ctx.globalAlpha = 1;
    }
  },
};
