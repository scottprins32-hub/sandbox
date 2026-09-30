// Glyph-outline type engine. Text is drawn as Path2D outlines rebuilt from the
// font's variation masters, so wdth/wght can animate continuously per letter.
import { clamp } from "./core.js";

export class Face {
  constructor(key) {
    const d = window.GLYPHS[key];
    if (!d) throw new Error(`missing glyph data for ${key}`);
    this.key = key;
    this.d = d;
    this.upm = d.upm;
    this.capH = d.capH;
    this.xH = d.xH;
    this.cache = new Map();
  }

  /** user-space axis value → normalized coordinate (with avar) */
  norm(tag, v) {
    const [lo, df, hi] = this.d.axisInfo[tag];
    v = clamp(v, lo, hi);
    let n = v < df ? (v - df) / (df - lo) : (v - df) / (hi - df);
    const seg = this.d.avar[tag];
    if (seg) {
      for (let i = 0; i < seg.length - 1; i++) {
        const [a0, b0] = seg[i], [a1, b1] = seg[i + 1];
        if (n >= a0 && n <= a1) {
          n = a1 > a0 ? b0 + ((b1 - b0) * (n - a0)) / (a1 - a0) : b0;
          break;
        }
      }
    }
    return n;
  }

  /** master weights for a variation {wght, wdth} */
  weights(vars = {}) {
    const axes = this.d.axes;
    if (!axes.length) return [1];
    const coords = axes.map((tag) => this.norm(tag, vars[tag] ?? this.d.axisInfo[tag][1]));
    return this.d.masters.map((m) => {
      let w = 1;
      for (let i = 0; i < m.length; i++) w *= Math.max(0, 1 - Math.abs(coords[i] - m[i]));
      return w;
    });
  }

  has(ch) {
    return !!this.d.glyphs[ch];
  }

  pts(ch, w) {
    const g = this.d.glyphs[ch] || this.d.glyphs["?"];
    if (w.length === 1) return g.p[0];
    const n = g.p[0].length;
    const out = new Float32Array(n);
    for (let m = 0; m < w.length; m++) {
      const wm = w[m];
      if (!wm) continue;
      const src = g.p[m];
      for (let i = 0; i < n; i++) out[i] += wm * src[i];
    }
    return out;
  }

  adv(ch, w) {
    const g = this.d.glyphs[ch] || this.d.glyphs["?"];
    let a = 0;
    for (let m = 0; m < w.length; m++) a += w[m] * g.a[m];
    return a;
  }

  kern(a, c, w) {
    const k = this.d.kern[a + c];
    if (!k) return 0;
    let v = 0;
    for (let m = 0; m < w.length; m++) v += w[m] * k[m];
    return v;
  }

  _key(ch, w) {
    let k = ch;
    for (let i = 0; i < w.length; i++) k += "|" + w[i].toFixed(4);
    return k;
  }

  /** Path2D in font units (y up) */
  path(ch, w) {
    const key = this._key(ch, w);
    let p = this.cache.get(key);
    if (p) return p;
    p = this.build(ch, w).path;
    if (this.cache.size > 4000) this.cache.clear();
    this.cache.set(key, p);
    return p;
  }

  /** full path + per-contour paths and bounds */
  build(ch, w) {
    const g = this.d.glyphs[ch] || this.d.glyphs["?"];
    const P = this.pts(ch, w);
    const cmds = g.c;
    const path = new Path2D();
    const contours = [];
    let cur = null, bb = null;
    let j = 0;
    const grow = (x, y) => {
      if (x < bb[0]) bb[0] = x;
      if (y < bb[1]) bb[1] = y;
      if (x > bb[2]) bb[2] = x;
      if (y > bb[3]) bb[3] = y;
    };
    for (let i = 0; i < cmds.length; i++) {
      const c = cmds[i];
      if (c === "M") {
        cur = new Path2D();
        bb = [Infinity, Infinity, -Infinity, -Infinity];
        contours.push({ path: cur, bb });
        path.moveTo(P[j], P[j + 1]);
        cur.moveTo(P[j], P[j + 1]);
        grow(P[j], P[j + 1]);
        j += 2;
      } else if (c === "L") {
        path.lineTo(P[j], P[j + 1]);
        cur.lineTo(P[j], P[j + 1]);
        grow(P[j], P[j + 1]);
        j += 2;
      } else if (c === "Q") {
        path.quadraticCurveTo(P[j], P[j + 1], P[j + 2], P[j + 3]);
        cur.quadraticCurveTo(P[j], P[j + 1], P[j + 2], P[j + 3]);
        grow(P[j + 2], P[j + 3]);
        j += 4;
      } else if (c === "C") {
        path.bezierCurveTo(P[j], P[j + 1], P[j + 2], P[j + 3], P[j + 4], P[j + 5]);
        cur.bezierCurveTo(P[j], P[j + 1], P[j + 2], P[j + 3], P[j + 4], P[j + 5]);
        grow(P[j + 4], P[j + 5]);
        j += 6;
      } else if (c === "Z") {
        path.closePath();
        cur.closePath();
      }
    }
    return { path, contours };
  }

  /** sample points along the outline (font units) — for particles & morphs */
  samplePoints(ch, w, step = 8) {
    const g = this.d.glyphs[ch] || this.d.glyphs["?"];
    const P = this.pts(ch, w);
    const out = [];
    let j = 0, x = 0, y = 0, sx = 0, sy = 0;
    const seg = (fn, len) => {
      const n = Math.max(1, Math.ceil(len / step));
      for (let k = 1; k <= n; k++) out.push(fn(k / n));
    };
    for (const c of g.c) {
      if (c === "M") { x = sx = P[j]; y = sy = P[j + 1]; j += 2; out.push([x, y]); }
      else if (c === "L") {
        const x1 = P[j], y1 = P[j + 1], x0 = x, y0 = y;
        seg((t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t], Math.hypot(x1 - x0, y1 - y0));
        x = x1; y = y1; j += 2;
      } else if (c === "Q") {
        const cx = P[j], cy = P[j + 1], x1 = P[j + 2], y1 = P[j + 3], x0 = x, y0 = y;
        seg((t) => {
          const u = 1 - t;
          return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
        }, Math.hypot(cx - x0, cy - y0) + Math.hypot(x1 - cx, y1 - cy));
        x = x1; y = y1; j += 4;
      } else if (c === "C") {
        const c1x = P[j], c1y = P[j + 1], c2x = P[j + 2], c2y = P[j + 3], x1 = P[j + 4], y1 = P[j + 5], x0 = x, y0 = y;
        seg((t) => {
          const u = 1 - t;
          return [
            u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x1,
            u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y1,
          ];
        }, Math.hypot(c1x - x0, c1y - y0) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x1 - c2x, y1 - c2y));
        x = x1; y = y1; j += 6;
      } else if (c === "Z") {
        seg((t) => [x + (sx - x) * t, y + (sy - y) * t], Math.hypot(sx - x, sy - y));
        x = sx; y = sy;
      }
    }
    return out;
  }
}

/**
 * Lay out a string. Returns glyph items with pen x positions in px.
 * opts: size (px em), vars {wght, wdth}, track (1/1000 em)
 */
export function layout(face, text, opts = {}) {
  const size = opts.size ?? 100;
  const vars = opts.vars ?? {};
  const track = opts.track ?? 0;
  const w = face.weights(vars);
  const s = size / face.upm;
  const items = [];
  let x = 0;
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const adv = face.adv(ch, w);
    items.push({ ch, i, x: x * s, adv: adv * s });
    if (i < chars.length - 1) x += adv + face.kern(ch, chars[i + 1], w) + track;
    else x += adv;
  }
  return { items, width: x * s, size, s, w, vars, face, capH: face.capH * s, xH: face.xH * s };
}

/** Width of text at given settings (px). */
export function measure(face, text, opts) {
  return layout(face, text, opts).width;
}

/** Font size that makes `text` exactly `width` px wide. */
export function fitSize(face, text, width, opts = {}) {
  const w1 = measure(face, text, { ...opts, size: 100 });
  return (100 * width) / w1;
}

/** Draw a single glyph with its baseline-left at (x, y). */
export function glyph(ctx, face, ch, w, x, y, size, mode = "fill") {
  const s = size / face.upm;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, -s);
  if (mode === "fill") ctx.fill(face.path(ch, w));
  else {
    ctx.lineWidth /= s;
    ctx.stroke(face.path(ch, w));
  }
  ctx.restore();
}

/**
 * Draw text. align: 'left' | 'center' | 'right'. Returns the layout.
 * mode: 'fill' | 'stroke'
 */
export function text(ctx, face, str, x, y, opts = {}) {
  const L = layout(face, str, opts);
  const align = opts.align ?? "left";
  const ox = align === "center" ? -L.width / 2 : align === "right" ? -L.width : 0;
  for (const it of L.items) {
    if (it.ch === " ") continue;
    glyph(ctx, face, it.ch, L.w, x + ox + it.x, y, L.size, opts.mode ?? "fill");
  }
  L.x0 = x + ox;
  return L;
}
