#!/usr/bin/env node
// Drives the reel in headless Chromium and captures raw frames.
//
//   node tools/render.mjs --stills 0,120,480           → render/stills/f0000.png …
//   node tools/render.mjs --sheet 0:900:45 --cols 5    → render/sheet.png (contact sheet)
//   node tools/render.mjs --video render/reel.mp4      → full encode (+ --audio file.wav)
//        [--from 0 --to 900] [--samples 4] [--crf 16] [--scale 0.5]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawn, execSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const W = 1920, H = 1080;

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 ? argv[i + 1] : d;
};
const flag = (k) => argv.includes(`--${k}`);

function ffmpegPath() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try {
    return execSync(`python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"`).toString().trim();
  } catch {
    return "ffmpeg";
  }
}

// ── tiny PNG writer (rows given bottom-up, as read from WebGL) ─────────────
function png(w, h, rgba, bottomUp = true) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    const sy = bottomUp ? h - 1 - y : y;
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, sy * stride, sy * stride + stride);
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// box-downscale a bottom-up RGBA frame into a top-down tile
function downscale(src, k) {
  const w = W / k, h = H / k;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, bl = 0;
      for (let j = 0; j < k; j++) {
        const sy = H - 1 - (y * k + j);
        let i = (sy * W + x * k) * 4;
        for (let q = 0; q < k; q++, i += 4) {
          r += src[i];
          g += src[i + 1];
          bl += src[i + 2];
        }
      }
      const o = (y * w + x) * 4, n = k * k;
      out[o] = r / n;
      out[o + 1] = g / n;
      out[o + 2] = bl / n;
      out[o + 3] = 255;
    }
  }
  return { w, h, data: out };
}

function parseFrames(spec) {
  if (!spec) return [];
  if (spec.includes(":")) {
    const [a, c, s] = spec.split(":").map(Number);
    const r = [];
    for (let f = a; f < c; f += s || 1) r.push(f);
    return r;
  }
  return spec.split(",").map(Number);
}

// ── server ───────────────────────────────────────────────────────────────
let sink = null;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".wav": "audio/wav", ".mp4": "video/mp4", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "POST" && url.pathname === "/frame") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", async () => {
      const buf = Buffer.concat(chunks);
      try {
        await sink(Number(url.searchParams.get("i")), buf);
        res.end("ok");
      } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.end("err");
      }
    });
    return;
  }
  const f = path.join(ROOT, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
  if (!f.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.statusCode = 404; return res.end(); }
    res.setHeader("content-type", MIME[path.extname(f)] ?? "application/octet-stream");
    res.end(d);
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-driver-bug-workarounds"],
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on("console", (m) => {
  const s = m.text();
  if (!s.includes("GL Driver Message") && !s.includes("GPU stall")) console.log("[page]", s);
});
let pageError = null;
page.on("pageerror", (e) => { pageError = e; console.error("[pageerror]", e.message); });
await page.goto(`http://127.0.0.1:${port}/index.html`);
await page.waitForFunction(() => window.reel?.ready || window.reelError, null, { timeout: 60000 }).catch(() => {});
if (pageError || !(await page.evaluate(() => !!window.reel?.ready))) {
  console.error("reel failed to load", await page.evaluate(() => String(window.reelError ?? "")));
  await browser.close();
  server.close();
  process.exit(1);
}

const samples = arg("samples") ? Number(arg("samples")) : undefined;
const opts = samples ? { samples } : {};
const renderOne = async (f) => {
  const ok = await page.evaluate(async ([f, o]) => {
    window.reel.render(f, o);
    return window.reel.send(f);
  }, [f, opts]);
  if (!ok) throw new Error(`frame ${f} failed`);
};

const t0 = Date.now();
if (arg("stills")) {
  const dir = path.resolve(arg("out", path.join(ROOT, "render/stills")));
  fs.mkdirSync(dir, { recursive: true });
  sink = async (i, buf) => fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, "0")}.png`), png(W, H, buf));
  for (const f of parseFrames(arg("stills"))) await renderOne(f);
  console.log(`stills → ${dir}`);
} else if (arg("sheet")) {
  const frames = parseFrames(arg("sheet"));
  const cols = Number(arg("cols", 5));
  const k = Number(arg("k", 6)); // downscale factor
  const tw = W / k, th = H / k, gap = 6;
  const rows = Math.ceil(frames.length / cols);
  const SW = cols * tw + (cols + 1) * gap, SH = rows * th + (rows + 1) * gap;
  const sheet = Buffer.alloc(SW * SH * 4, 40);
  let n = 0;
  sink = async (i, buf) => {
    const tile = downscale(buf, k);
    const cx = n % cols, cy = Math.floor(n / cols);
    n++;
    const ox = gap + cx * (tw + gap), oy = gap + cy * (th + gap);
    for (let y = 0; y < th; y++) tile.data.copy(sheet, ((oy + y) * SW + ox) * 4, y * tw * 4, (y + 1) * tw * 4);
  };
  for (const f of frames) await renderOne(f);
  const outFile = path.resolve(arg("out", path.join(ROOT, "render/sheet.png")));
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, png(SW, SH, sheet, false));
  console.log(`sheet (${frames.length} frames, ${cols} cols) → ${outFile}`);
} else if (arg("video")) {
  const outFile = path.resolve(arg("video"));
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const from = Number(arg("from", 0)), to = Number(arg("to", 900));
  const audio = arg("audio");
  const scale = Number(arg("scale", 1));
  const lossless = flag("lossless");
  const vf = ["vflip"];
  if (scale !== 1) vf.push(`scale=${Math.round(W * scale / 2) * 2}:${Math.round(H * scale / 2) * 2}:flags=lanczos`);
  if (!lossless) vf.push("scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int", "format=yuv420p");
  const ffArgs = [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", "60", "-i", "-",
  ];
  if (audio) ffArgs.push("-ss", String(from / 60), "-t", String((to - from) / 60), "-i", audio);
  ffArgs.push("-vf", vf.join(","));
  if (lossless) ffArgs.push("-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", "-slices", "4");
  else ffArgs.push(
    "-c:v", "libx264", "-preset", arg("preset", "slow"), "-crf", arg("crf", "16"),
    "-profile:v", "high", "-x264-params", "aq-mode=3:aq-strength=0.9:deblock=-1,-1",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
  );
  if (audio) ffArgs.push("-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest");
  if (!lossless) ffArgs.push("-movflags", "+faststart");
  ffArgs.push(outFile);
  const ff = spawn(ffmpegPath(), ffArgs, { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((r) => ff.on("close", r));
  sink = (i, buf) => new Promise((r) => (ff.stdin.write(buf) ? r() : ff.stdin.once("drain", r)));
  let last = Date.now();
  for (let f = from; f < to; f++) {
    await renderOne(f);
    if (Date.now() - last > 10000 || f === to - 1) {
      last = Date.now();
      const el = (Date.now() - t0) / 1000;
      console.log(`frame ${f + 1}/${to}  ${el.toFixed(0)}s  (${(el / (f - from + 1)).toFixed(2)} s/f)`);
    }
  }
  ff.stdin.end();
  const code = await done;
  if (code !== 0) console.error("ffmpeg exited", code);
  console.log(`video → ${outFile}`);
}
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
await browser.close();
server.close();
