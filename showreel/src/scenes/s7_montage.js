// 07 — RHYTHM: the edit is the instrument. "MAKE / IT / MOVE" on the beats,
// split-screens on the off-beats, then cuts accelerate from quarters to
// sixteenths — every shot re-rendered live from the earlier scenes — into a
// half-beat of silence with only the dot left on screen.
import { W, H, b, bp, E, C, clamp, lerp, prog, TAU, spring, hit } from "../core.js";
import { layout, glyph, fitSize } from "../type.js";
import S1 from "./s1_ignite.js";
import S2 from "./s2_type.js";
import S3 from "./s3_geometry.js";
import S4 from "./s4_particles.js";
import S5 from "./s5_glass.js";
import S6 from "./s6_fluid.js";

const cx = W / 2, cy = H / 2;
const SC = { s1: S1, s2: S2, s3: S3, s4: S4, s5: S5, s6: S6 };

const CUTS = [
  { at: 24.0, kind: "word", word: "MAKE", hud: "ink" },
  { at: 24.5, kind: "split3", hud: "paper" },
  { at: 25.0, kind: "word", word: "IT", hud: "paper" },
  { at: 25.5, kind: "quad", hud: "paper" },
  { at: 26.0, kind: "word", word: "MOVE", hud: "paper" },
  { at: 26.5, kind: "scene", id: "s5", from: 17.1, hud: "ink" },
  { at: 26.75, kind: "scene", id: "s3", from: 9.55, hud: "paper" },
  { at: 27.0, kind: "scene", id: "s4", from: 12.04, hud: "paper" },
  { at: 27.125, kind: "scene", id: "s2", from: 6.2, hud: "ink" },
  { at: 27.25, kind: "scene", id: "s6", from: 20.3, hud: "paper" },
  { at: 27.375, kind: "scene", id: "s1", from: 2.85, hud: "paper" },
  { at: 27.5, kind: "gap", hud: "paper" },
];

let F;
const K = {};

function cutAt(t) {
  let c = CUTS[0];
  for (const k of CUTS) if (t >= b(k.at)) c = k;
  return c;
}
function cutEnd(c) {
  const i = CUTS.indexOf(c);
  return i < CUTS.length - 1 ? b(CUTS[i + 1].at) : b(28);
}

function panel(ctx, rect, fn) {
  const [x, y, w, h] = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const s = Math.max(w / W, h / H);
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(s, s);
  ctx.translate(-W / 2, -H / 2);
  fn();
  ctx.restore();
}

function word(ctx, cut, lt) {
  if (cut.word === "MAKE") {
    ctx.fillStyle = C.sun;
    ctx.fillRect(0, 0, W, H);
    const wd = lerp(62, 125, E.outExpo(prog(lt, 0, 0.3)));
    const L = layout(F, "MAKE", { size: K.makeSize, vars: { wght: 900, wdth: wd } });
    const capH = F.capH * (K.makeSize / F.upm);
    const step = capH * 1.12;
    const scroll = (1 - E.outExpo(prog(lt, 0, 0.32))) * step * 3;
    const x0 = cx - L.width / 2;
    ctx.fillStyle = C.ink;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    for (let r = -3; r <= 3; r++) {
      const yb = cy + capH / 2 + r * step + scroll;
      if (yb < -20 || yb - capH > H + 20) continue;
      for (const it of L.items) glyph(ctx, F, it.ch, L.w, x0 + it.x, yb, K.makeSize, r === 0 ? "fill" : "stroke");
    }
  } else if (cut.word === "IT") {
    ctx.fillStyle = C.cobalt;
    ctx.fillRect(0, 0, W, H);
    const p = E.outExpo(prog(lt, 0, 0.3));
    const wd = lerp(62, 125, p);
    const L = layout(F, "IT", { size: K.itSize, vars: { wght: 900, wdth: wd } });
    const capH = F.capH * (K.itSize / F.upm);
    const s = lerp(1.35, 1, p);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.fillStyle = C.paper;
    for (const it of L.items) glyph(ctx, F, it.ch, L.w, -L.width / 2 + it.x, capH / 2, K.itSize);
    ctx.restore();
  } else {
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, W, H);
    const L = K.moveL;
    const capH = F.capH * (K.moveSize / F.upm);
    const yb = cy + capH / 2;
    const x0 = cx - L.width / 2;
    L.items.forEach((it, i) => {
      const p = E.outExpo(prog(lt, i * 0.028, i * 0.028 + 0.26));
      const dir = i % 2 === 0 ? -1 : 1;
      const dy = dir * (1 - p) * H * 0.9;
      // echo trail
      ctx.strokeStyle = C.ember;
      ctx.lineWidth = 2.5;
      for (let e = 3; e >= 1; e--) {
        const ee = dir * e * capH * 0.2 * (1 - E.outCubic(prog(lt, 0.12 + i * 0.028, 0.4 + i * 0.028)));
        if (Math.abs(ee) < 1) continue;
        ctx.globalAlpha = 0.5 / e;
        glyph(ctx, F, it.ch, L.w, x0 + it.x, yb + dy + ee, K.moveSize, "stroke");
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.ember;
      glyph(ctx, F, it.ch, L.w, x0 + it.x, yb + dy, K.moveSize);
    });
  }
}

export default {
  id: "s7",
  label: "RHYTHM",
  t0: b(24),
  t1: b(28),
  samples: 8,
  shutter: 0.6,
  hardIn: true,
  hudAt: (t) => cutAt(t).hud,
  post: (t) => {
    const c = cutAt(t);
    const glow = c.id === "s4" || c.kind === "gap" ? 0.35 : 0;
    return { vignette: 0.3, bloom: glow, bloomThr: 0.6 };
  },
  zoom: (t) => {
    const c = cutAt(t);
    if (c.kind === "gap") return 1;
    const dur = Math.min(0.22, cutEnd(c) - b(c.at));
    return 1 + 0.07 * (1 - E.outCubic(prog(t - b(c.at), 0, dur)));
  },

  init(env) {
    F = env.faces.display;
    K.makeSize = fitSize(F, "MAKE", 1640, { vars: { wght: 900, wdth: 125 } });
    K.itSize = (820 / F.capH) * F.upm;
    K.moveSize = fitSize(F, "MOVE", 1600, { vars: { wght: 900, wdth: 125 } });
    K.moveL = layout(F, "MOVE", { size: K.moveSize, vars: { wght: 900, wdth: 125 } });
  },

  render(env, t) {
    const { ctx } = env;
    // hard cuts inside the montage: never blur across one
    const cut = cutAt(env.frameT ?? t);
    t = clamp(t, b(cut.at), cutEnd(cut) - 1e-6);
    const lt = t - b(cut.at);

    if (cut.kind === "word") return word(ctx, cut, lt);

    if (cut.kind === "scene") {
      const sc = SC[cut.id];
      return sc.render(env, b(cut.from) + lt, { caption: false });
    }

    if (cut.kind === "split3") {
      // middle window looks into the live shader layer
      S6.render(env, b(22.35) + lt, { caption: false });
      const pw = (W - 20) / 3;
      const rects = [[0, 0, pw, H], [pw + 10, 0, pw, H], [2 * pw + 20, 0, pw, H]];
      ctx.fillStyle = C.ink;
      ctx.fillRect(0, 0, pw, H);
      ctx.fillRect(2 * pw + 20, 0, pw, H);
      rects.forEach((r, i) => {
        const p = E.outExpo(prog(lt, i * 0.035, i * 0.035 + 0.24));
        const off = (i % 2 === 0 ? -1 : 1) * (1 - p) * H;
        const rr = [r[0], r[1] + off, r[2], r[3]];
        if (i === 1) {
          // mask the GL window until its panel arrives
          ctx.fillStyle = C.ink;
          if (off > 0) ctx.fillRect(r[0], 0, r[2], off);
          else ctx.fillRect(r[0], H + off, r[2], -off);
          return;
        }
        panel(ctx, rr, () => (i === 0 ? S3.render(env, b(9.7) + lt) : S4.render(env, b(13.7) + lt)));
      });
      ctx.fillStyle = C.ink;
      ctx.fillRect(pw, 0, 10, H);
      ctx.fillRect(2 * pw + 10, 0, 10, H);
      return;
    }

    if (cut.kind === "quad") {
      S6.render(env, b(21.45) + lt, { caption: false });
      const g = 10, pw = (W - g) / 2, ph = (H - g) / 2;
      const rects = [[0, 0, pw, ph], [pw + g, 0, pw, ph], [0, ph + g, pw, ph], [pw + g, ph + g, pw, ph]];
      const fns = [
        () => S1.render(env, b(2.75) + lt),
        () => S2.render(env, b(4.35) + lt),
        null,
        () => S4.render(env, b(15.1) + lt),
      ];
      rects.forEach((r, i) => {
        const p = E.outExpo(prog(lt, i * 0.03, i * 0.03 + 0.22));
        if (!fns[i]) {
          const s = 1 - p;
          if (s > 0) {
            ctx.fillStyle = C.ink;
            ctx.fillRect(r[0], r[1], r[2], r[3] * s);
          }
          return;
        }
        const s = lerp(0.6, 1, p);
        const rr = [r[0] + (r[2] * (1 - s)) / 2, r[1] + (r[3] * (1 - s)) / 2, r[2] * s, r[3] * s];
        ctx.fillStyle = C.ink;
        ctx.fillRect(r[0], r[1], r[2], r[3]);
        panel(ctx, rr, fns[i]);
      });
      ctx.fillStyle = C.ink;
      ctx.fillRect(pw, 0, g, H);
      ctx.fillRect(0, ph, W, g);
      return;
    }

    // gap: silence before the drop — only the dot remains
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, W, H);
    const r = 12 * spring(lt - 0.02, 4, 0.35) + 6 * hit(t - b(27.75), 10);
    const pre = E.inCubic(bp(t, 27.8, 28.0));
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 + 160 * pre);
    g.addColorStop(0, `rgba(255,79,26,${0.28 + 0.4 * pre})`);
    g.addColorStop(1, "rgba(255,79,26,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.ember;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0, r * (1 + 0.5 * pre)), 0, TAU);
    ctx.fill();
    const ring = prog(t, b(27.75), b(27.75) + 0.3);
    if (ring > 0 && ring < 1) {
      ctx.strokeStyle = C.paper;
      ctx.globalAlpha = 0.5 * (1 - ring);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 20 + 120 * E.outCubic(ring), 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  },
};
