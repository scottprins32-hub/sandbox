// Global "hits": every musical impact is also a camera + lens event.
import { W, b, C, glc, noise2 } from "./core.js";

// at (beats) · shake (px) · ca (lens split) · flash (0-1) · distort (barrel)
export const IMPACTS = [
  { at: 4.0, shake: 18, ca: 0.018, distort: 0.06 },
  { at: 5.0, shake: 8, ca: 0.008 },
  { at: 6.0, shake: 10, ca: 0.01 },
  { at: 8.0, shake: 10, ca: 0.02, distort: 0.08 },
  { at: 12.0, shake: 26, ca: 0.03, flashExp: 1.0, flashDecay: 22, distort: 0.12 },
  { at: 16.0, shake: 10, ca: 0.012, flashExp: 0.35, flashDecay: 24 },
  { at: 18.0, shake: 8, ca: 0.01 },
  { at: 20.0, shake: 14, ca: 0.02, distort: 0.08 },
  { at: 24.0, shake: 16, ca: 0.02 },
  { at: 24.5, shake: 7, ca: 0.01 },
  { at: 25.0, shake: 12, ca: 0.014 },
  { at: 25.5, shake: 7, ca: 0.01 },
  { at: 26.0, shake: 14, ca: 0.016 },
  { at: 26.5, shake: 6, ca: 0.01 },
  { at: 26.75, shake: 6, ca: 0.01 },
  { at: 27.0, shake: 8, ca: 0.012 },
  { at: 27.125, shake: 5, ca: 0.01 },
  { at: 27.25, shake: 5, ca: 0.01 },
  { at: 27.375, shake: 5, ca: 0.01 },
  { at: 28.0, shake: 30, ca: 0.035, flash: 1.0, flashDecay: 30, flashExp: 0.6, flashColor: C.paper, distort: 0.14, decay: 6 },
];

export function postAt(t, sc) {
  let ca = 0.0012, flash = 0, flashColor = [1, 1, 1], distort = 0, flashExp = 0;
  for (const im of IMPACTS) {
    const dt = t - b(im.at);
    if (dt < 0 || dt > 2) continue;
    const e = Math.exp(-(im.decay ?? 9) * dt);
    ca += (im.ca ?? 0) * e;
    distort += (im.distort ?? 0) * e;
    if (im.flashExp) flashExp += im.flashExp * Math.exp(-(im.flashDecay ?? 11) * dt * 0.6);
    if (im.flash) {
      const f = im.flash * Math.exp(-(im.flashDecay ?? 11) * dt);
      if (f > flash) {
        flash = f;
        flashColor = glc(im.flashColor ?? C.paper);
      }
    }
  }
  const s = sc.post ? sc.post(t) : {};
  const out = { bloom: 0, bloomThr: 0.85, vignette: 0.26, grain: 0.032, glitch: 0, fade: 0, ...s };
  out.ca = ca + (s.ca ?? 0);
  out.distort = distort + (s.distort ?? 0);
  out.flashExp = flashExp + (s.flashExp ?? 0);
  if ((s.flash ?? 0) > flash) {
    out.flash = s.flash;
    out.flashColor = s.flashColor ?? [1, 1, 1];
  } else {
    out.flash = flash;
    out.flashColor = flashColor;
  }
  return out;
}

export function shakeAmp(t) {
  let amp = 0;
  for (const im of IMPACTS) {
    const dt = t - b(im.at);
    if (dt >= 0 && dt < 1.5) amp += (im.shake ?? 0) * Math.exp(-(im.shakeDecay ?? 9) * dt);
  }
  return amp;
}

/** [zoom, rotation, dx, dy] applied to the whole scene layer per sub-frame */
export function cameraAt(t, sc) {
  const amp = shakeAmp(t) + (sc.shake ? sc.shake(t) : 0);
  const sz = sc.zoom ? sc.zoom(t) : 1;
  if (amp < 0.05) return [sz, 0, 0, 0];
  const sx = noise2(t * 31, 1.7) * amp;
  const sy = noise2(t * 31, 9.3) * amp;
  const r = noise2(t * 23, 4.1) * amp * 0.0011;
  const zoom = (1 + ((Math.abs(sx) + Math.abs(sy)) * 2.4) / W + Math.abs(r) * 1.3) * sz;
  return [zoom, r, sx, sy];
}
