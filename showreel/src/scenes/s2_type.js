// 02 — KINETIC TYPE: "FORM / FOLLOWS / MOTION", one word per beat, each with
// its own motion idea, ending in a camera dive through the counter of an O.
import { W, H, b, bp, E, C, lerp, prog, TAU } from "../core.js";
import { layout, glyph, fitSize } from "../type.js";
import S3 from "./s3_geometry.js";

const cx = W / 2, cy = H / 2;
let F, M; // display + mono faces
const K = {}; // precomputed metrics

/** lay out a word whose letters each carry their own variation */
function perLetter(face, str, size, varsOf) {
  const s = size / face.upm;
  let x = 0;
  const items = [];
  for (let i = 0; i < str.length; i++) {
    const vars = varsOf(i);
    const w = face.weights(vars);
    const adv = face.adv(str[i], w);
    items.push({ ch: str[i], i, x: x * s, adv: adv * s, w, vars });
    x += adv + (i < str.length - 1 ? face.kern(str[i], str[i + 1], w) : 0);
  }
  return { items, width: x * s };
}

function monoLabel(ctx, str, x, y, size, align = "left") {
  const L = layout(M, str, { size, vars: { wght: 500 }, track: 50 });
  const ox = align === "right" ? -L.width : 0;
  for (const it of L.items) if (it.ch !== " ") glyph(ctx, M, it.ch, L.w, x + ox + it.x, y, size);
}

// ── zoom-through: shared with S3 so the move is continuous across the cut ──
export const ZOOM = { t0: b(7.25), tMid: b(8.0), t1: b(8.8) };
export function zoomState(t) {
  const p = prog(t, ZOOM.t0, ZOOM.t1);
  const zs = E.inOutCubic(p);
  const Z = Math.exp(Math.log(K.zmax) * zs);
  const mv = E.inOutCubic(prog(t, ZOOM.t0, ZOOM.tMid));
  const px = lerp(K.oCx, cx, mv), py = lerp(K.oCy, cy, mv);
  return { Z, px, py, zmax: K.zmax };
}

function drawForm(ctx, t) {
  const T0 = b(4.0);
  const L = perLetter(F, "FORM", K.formSize, (i) => {
    const ti = T0 + i * 0.035;
    let wd = lerp(62, 125, E.outExpo(prog(t, ti, ti + 0.5)));
    wd -= 26 * Math.sin(Math.PI * prog(t, b(4.5) + i * 0.025, b(4.5) + i * 0.025 + 0.17));
    return { wght: 900, wdth: wd };
  });
  const capH = F.capH * (K.formSize / F.upm);
  const yb = cy + capH / 2 - 6;
  const x0 = cx - L.width / 2;

  ctx.fillStyle = C.ember;
  ctx.fillRect(0, 0, W, H);

  // baseline rule
  const rw = K.formW * E.outExpo(bp(t, 4.0, 4.42)) * (1 - E.inExpo(bp(t, 4.74, 4.98)));
  ctx.fillStyle = C.ink;
  ctx.fillRect(cx - rw / 2, yb + 20, rw, 6);

  // letters rise out of the baseline mask
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, yb + 3);
  ctx.clip();
  for (const it of L.items) {
    const ti = T0 + it.i * 0.035;
    const rise = 1 - E.outExpo(prog(t, ti, ti + 0.42));
    const te = b(4.72) + it.i * 0.022;
    const fall = E.inExpo(prog(t, te, te + 0.2));
    glyph(ctx, F, it.ch, it.w, x0 + it.x, yb + (rise + fall) * capH * 1.22, K.formSize);
  }
  ctx.restore();

  // live variable-axis readout
  const ro = E.outCubic(bp(t, 4.12, 4.45)) * (1 - E.inCubic(bp(t, 4.8, 4.98)));
  if (ro > 0) {
    const avg = L.items.reduce((a, it) => a + it.vars.wdth, 0) / L.items.length;
    ctx.globalAlpha = ro * 0.85;
    monoLabel(ctx, `WGHT 900   WDTH ${String(Math.round(avg)).padStart(3, "0")}`, cx - K.formW / 2, yb + 76, 18);
    monoLabel(ctx, "ARCHIVO VARIABLE — 2 AXES", cx + K.formW / 2, yb + 76, 18, "right");
    ctx.globalAlpha = 1;
  }
}

function drawFollows(ctx, t) {
  const T0 = b(5.0);
  const size = K.folSize;
  const L = K.folL;
  const capH = F.capH * (size / F.upm);
  const yb = cy + capH / 2 - 4;
  const x0 = cx - L.width / 2;
  const e = E.outQuart(prog(t, T0, T0 + 0.43));
  const D = 1900;
  const A = 190 * (1 - E.outCubic(prog(t, T0 + 0.04, T0 + 0.44)));
  const k = 0.0058, ph = 1.3;
  const wave = (x) => yb - A * Math.sin(k * x + ph);
  const slope = (x) => -A * k * Math.cos(k * x + ph);

  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, W, H);

  // the track the letters ride: a line that is drawn by the leader and
  // eaten by the last letter, ending as an underline that retracts.
  const xs = L.items.map((it) => x0 + it.x + it.adv / 2 + (1 - e) * D);
  const head = xs[0] - L.items[0].adv / 2 - 20;
  const tail = xs[xs.length - 1] + 260 * (1 - e) + 40;
  const fade = 1 - E.inCubic(bp(t, 5.62, 5.95));
  if (fade > 0 && tail > head) {
    ctx.strokeStyle = C.ember;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    const retract = E.inOutCubic(bp(t, 5.55, 5.95));
    const a0 = lerp(head, tail, retract * 0.999);
    ctx.beginPath();
    for (let x = a0; x <= tail; x += 6) {
      const y = wave(x) + 16;
      if (x === a0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.lineCap = "butt";
  }

  ctx.fillStyle = C.paper;
  for (let i = 0; i < L.items.length; i++) {
    const it = L.items[i];
    const x = xs[i];
    if (x - it.adv > W + 40) continue;
    const y = wave(x);
    const ang = Math.atan(slope(x));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    glyph(ctx, F, it.ch, L.w, -it.adv / 2, 0, size);
    ctx.restore();
  }
}

function drawMotion(ctx, t, camera) {
  const size = K.motSize;
  const L = K.motL;
  const capH = F.capH * (size / F.upm);
  const yb = cy + capH / 2 - 4;
  const x0 = cx - L.width / 2;

  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (camera) camera(ctx);

  for (const it of L.items) {
    const Ti = b(6.0) + it.i * 0.055;
    const fall = prog(t, Ti - 0.17, Ti);
    if (fall <= 0) continue;
    const ax = x0 + it.x + it.adv / 2;
    let y = lerp(-40, yb, E.inQuad(fall));
    let sx = 1, sy = 1;
    if (fall < 1) {
      sy = 1 + 0.22 * fall;
      sx = 1 / Math.sqrt(sy);
    } else {
      const tau = t - Ti;
      const sq = 0.26 * Math.exp(-11 * tau) * Math.cos(TAU * 3.2 * tau);
      sy = 1 - sq;
      sx = 1 + sq * 0.7;
      // impact ticks
      const ip = prog(tau, 0, 0.16);
      if (ip < 1) {
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 5 * (1 - ip);
        ctx.lineCap = "round";
        const spread = it.adv * 0.55 + 18 * E.outCubic(ip);
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(ax + s * spread, yb - 8);
          ctx.lineTo(ax + s * (spread + 22 + 30 * E.outCubic(ip)), yb - 30 - 30 * E.outCubic(ip));
          ctx.stroke();
        }
        ctx.lineCap = "butt";
      }
    }
    ctx.save();
    ctx.translate(ax, y);
    ctx.scale(sx, sy);
    ctx.fillStyle = C.ink;
    glyph(ctx, F, it.ch, L.w, -it.adv / 2, 0, size);
    ctx.restore();
  }
  ctx.restore();
}

export default {
  id: "s2",
  label: "KINETIC TYPE",
  t0: b(4),
  t1: b(8),
  samples: 12,
  shutter: 0.6,
  hardIn: true,
  hudAt: (t) => (t < b(5) ? "ink" : t < b(6) ? "paper" : t < b(7.93) ? "ink" : "paper"),
  post: (t) => ({ vignette: t >= b(5) && t < b(6) ? 0.35 : 0.18 }),

  init(env) {
    F = env.faces.display;
    M = env.faces.mono;
    K.formW = 1560;
    K.formSize = fitSize(F, "FORM", K.formW, { vars: { wght: 900, wdth: 125 } });
    K.folSize = fitSize(F, "FOLLOWS", 1380, { vars: { wght: 800, wdth: 100 } });
    K.folL = layout(F, "FOLLOWS", { size: K.folSize, vars: { wght: 800, wdth: 100 } });
    K.motSize = fitSize(F, "MOTION", 1700, { vars: { wght: 900, wdth: 125 } });
    K.motL = layout(F, "MOTION", { size: K.motSize, vars: { wght: 900, wdth: 125 } });

    // the counter of the first O: centre, size, path — for the zoom-through
    const it = K.motL.items[1];
    const s = K.motSize / F.upm;
    const capH = F.capH * s;
    const yb = cy + capH / 2 - 4;
    const x0 = cx - K.motL.width / 2;
    const built = F.build("O", K.motL.w);
    const inner = built.contours
      .map((c) => ({ ...c, area: (c.bb[2] - c.bb[0]) * (c.bb[3] - c.bb[1]) }))
      .sort((a, c) => a.area - c.area)[0];
    const [bx0, by0, bx1, by1] = inner.bb;
    K.oX = x0 + it.x;
    K.oY = yb;
    K.oS = s;
    K.counter = inner.path;
    K.oCx = K.oX + ((bx0 + bx1) / 2) * s;
    K.oCy = yb - ((by0 + by1) / 2) * s;
    // zoom needed for the counter's inscribed ellipse to contain the frame
    const a = ((bx1 - bx0) / 2) * s * 0.96, c = ((by1 - by0) / 2) * s * 0.96;
    const zc = Math.hypot(cx / a, cy / c);
    K.oR = Math.hypot(a, c) * 1.1;
    K.zmax = Math.pow(zc * 1.08, 2);
  },

  render(env, t) {
    const { ctx } = env;
    if (t < b(5.0)) return drawForm(ctx, t);
    if (t < b(6.0)) return drawFollows(ctx, t);
    if (t < ZOOM.t0) {
      const push = 1 + 0.025 * E.inOutSine(bp(t, 6.6, 7.25));
      const cam = (c) => {
        c.translate(K.oCx, K.oCy);
        c.scale(push, push);
        c.translate(-K.oCx, -K.oCy);
      };
      drawMotion(ctx, t, cam);
      // the portal: the counter irises open onto the next world
      const po = E.outBack(bp(t, 6.95, 7.25), 1.6);
      if (po > 0) {
        ctx.save();
        cam(ctx);
        ctx.translate(K.oX, K.oY);
        ctx.scale(K.oS, -K.oS);
        ctx.clip(K.counter);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        cam(ctx);
        ctx.beginPath();
        ctx.arc(K.oCx, K.oCy, po * K.oR, 0, TAU);
        ctx.clip();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        S3.draw(env, t, S3.zoomMatrix(ZOOM.t0));
        ctx.restore();
      }
      return;
    }
    // dive: world scales about the O's counter, which drifts to frame centre
    const push = 1.025;
    const z = zoomState(t);
    const cam = (c) => {
      c.translate(z.px, z.py);
      c.scale(z.Z * push, z.Z * push);
      c.translate(-K.oCx, -K.oCy);
    };
    drawMotion(ctx, t, cam);
    ctx.save();
    cam(ctx);
    ctx.translate(K.oX, K.oY);
    ctx.scale(K.oS, -K.oS);
    ctx.clip(K.counter);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    S3.draw(env, t, S3.zoomMatrix(t));
    ctx.restore();
  },
};
