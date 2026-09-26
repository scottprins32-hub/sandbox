// The reel's persistent overlay: crop marks, slate, timecode, chapter label,
// beat LED and a scene-marked progress rail. Drawn once per output frame.
import { W, H, FPS, BEAT, DURATION, C, rgba, clamp, prog, E, hash, b } from "./core.js";
import { layout, glyph } from "./type.js";

const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/+*<>=";

export function scramble(str, p, seed) {
  if (p >= 1) return str;
  const n = str.length;
  let out = "";
  for (let i = 0; i < n; i++) {
    const ch = str[i];
    if (ch === " ") { out += " "; continue; }
    const reveal = p * (n + 4) - 4;
    if (i < reveal) out += ch;
    else if (i < reveal + 5) out += SCRAMBLE[Math.floor(hash(seed * 131 + i * 17) * SCRAMBLE.length)];
    else out += " ";
  }
  return out;
}

function monoText(ctx, face, str, x, y, { size = 15, wght = 500, align = "left", track = 60 } = {}) {
  const L = layout(face, str, { size, vars: { wght }, track });
  const ox = align === "right" ? -L.width : align === "center" ? -L.width / 2 : 0;
  for (const it of L.items) if (it.ch !== " ") glyph(ctx, face, it.ch, L.w, x + ox + it.x, y, size);
  return L.width;
}

export function timecode(t) {
  const f = Math.round(t * FPS);
  const ff = f % FPS, s = Math.floor(f / FPS);
  const p = (n) => String(n).padStart(2, "0");
  return `00:00:${p(s)}:${p(ff)}`;
}

/**
 * ctx: transparent overlay canvas; scene: current scene descriptor;
 * scenes: all scenes (for rail ticks).
 */
export function drawHud(ctx, t, scene, scenes, faces) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const hud = scene.hudAt ? scene.hudAt(t) : scene.hud ?? "paper";
  if (hud === "none") return;
  const alpha = scene.hudAlpha ? scene.hudAlpha(t) : 1;
  if (alpha <= 0) return;
  const col = hud === "ink" ? C.ink : C.paper;
  const mono = faces.mono;
  const fr = Math.round(t * FPS);

  // boot sequence: everything types on during the first two beats
  const boot = (d0, d1) => E.outCubic(prog(t, b(d0), b(d1)));

  ctx.globalAlpha = alpha;
  ctx.fillStyle = col;
  ctx.strokeStyle = col;

  // crop marks
  const m = 40, L = 20;
  const cm = boot(0.5, 1.25);
  if (cm > 0) {
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const l = L * cm;
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
      ctx.moveTo(x + sx * l, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + sy * l);
    }
    ctx.stroke();
  }

  const y1 = 76, y2 = H - 64;
  // slate (top-left)
  const s1 = boot(0.6, 1.6);
  if (s1 > 0) {
    let x = 72;
    const a = scramble("CLAUDE", s1, 3 + (fr >> 2));
    x += monoText(ctx, mono, a, x, y1, { wght: 800 }) + 18;
    ctx.globalAlpha = alpha * 0.6;
    monoText(ctx, mono, scramble("MOTION DESIGN REEL 2026", s1, 7 + (fr >> 2)), x, y1, { wght: 400 });
    ctx.globalAlpha = alpha;
  }

  // timecode (top-right)
  const s2 = boot(0.9, 1.7);
  if (s2 > 0) {
    ctx.globalAlpha = alpha * 0.6;
    const w = monoText(ctx, mono, timecode(t), W - 72, y1, { wght: 500, align: "right", track: 40 });
    monoText(ctx, mono, scramble("TC", s2, 11), W - 72 - w - 16, y1, { wght: 400, align: "right" });
    ctx.globalAlpha = alpha;
  }

  // chapter label (bottom-left) with scramble on every scene change
  const s3 = boot(1.2, 2.2);
  if (s3 > 0) {
    const sp = Math.min(s3, prog(t, scene.t0, scene.t0 + 0.32));
    const idx = String(scene.index + 1).padStart(2, "0");
    ctx.fillRect(72, y2 - 11, 9, 9);
    monoText(ctx, mono, scramble(idx, sp, 13 + (fr >> 2)), 94, y2, { wght: 800 });
    ctx.globalAlpha = alpha * 0.6;
    monoText(ctx, mono, scramble("/ " + scene.label, sp, 17 + (fr >> 2)), 128, y2, { wght: 400 });
    ctx.globalAlpha = alpha;
  }

  // BPM + beat LED + progress rail (bottom-right)
  const s4 = boot(1.5, 2.5);
  if (s4 > 0) {
    const railW = 260 * E.outExpo(s4), rx = W - 72 - railW, ry = y2 - 6;
    ctx.globalAlpha = alpha * 0.28;
    ctx.fillRect(rx, ry, railW, 1.5);
    ctx.globalAlpha = alpha;
    ctx.fillRect(rx, ry, railW * clamp(t / DURATION), 1.5);
    for (const s of scenes) {
      const x = rx + railW * (s.t0 / DURATION);
      ctx.globalAlpha = alpha * (t >= s.t0 ? 0.9 : 0.35);
      ctx.fillRect(Math.round(x), ry - 5, 1.5, 11);
    }
    ctx.globalAlpha = alpha;
    // playhead
    const px = rx + railW * clamp(t / DURATION);
    ctx.fillRect(px - 1, ry - 8, 2, 17);
    // beat LED
    const ph = (t / BEAT) % 1;
    const led = Math.exp(-ph * 9);
    ctx.globalAlpha = alpha * (0.25 + 0.75 * led);
    ctx.fillStyle = hud === "ink" ? C.ink : C.ember;
    ctx.beginPath();
    ctx.arc(rx - 30, ry + 0.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = col;
    monoText(ctx, mono, scramble("128 BPM", s4, 19), rx - 48, y2, { wght: 400, align: "right" });
  }
  ctx.globalAlpha = 1;
}
