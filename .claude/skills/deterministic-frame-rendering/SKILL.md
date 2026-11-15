---
name: deterministic-frame-rendering
description: Renders web or canvas animation to frame-exact video by making every frame a pure function of its index, proving that with a render-twice check, then encoding, building a contact sheet and running an automatic QA for frozen frames, flashes and cuts. Use this whenever the user wants a video, GIF or image sequence from an HTML, canvas, WebGL or three.js animation, motion graphics or an explainer made in code, a pitch or skeleton overlay turned into a clip, screen recording that drops frames or differs between runs, or says "render", "export to mp4" or "frame by frame" about something drawn in a browser - even if they never say "deterministic". Includes two tested scripts and the traps found by running them.
---

# Deterministic frame rendering

Recording a screen captures whatever the browser managed to draw in real time: dropped frames, timing jitter, a different video every run. The alternative is to **ask the page for frame *i*, take a picture, and move on**. The video is then identical on every machine, can be rendered in pieces, and can be tested. The method comes from several repos read on 2026-11-15 (see `references/sources.md`), restated and implemented here. The scripts below were run for this skill.

## The page contract

The page defines `window.renderFrame(i)` and the output depends on `i` alone:

- No `Date.now()`, `performance.now()`, unseeded `Math.random()`, no `requestAnimationFrame` timing, no state carried from the previous frame, no network at render time.
- No CSS animations or transitions: compute the value from `i` (opacity, position, typed text) and set it.
- Fonts: use system stacks or fonts loaded before `window.__ready = true`. A web font that arrives late changes frame 0 on one run and not the next.
- Add a render mode (`?render=1`) that hides controls and makes the stage fill the viewport. Keep the interactive page and the render on the same drawing code, so what you scrub is what you ship.

```js
window.__ready = true;                         // assets loaded
window.renderFrame = (i, n = 150) => { t = i / (n - 1); draw(t); };   // sync, or return a promise
```

## Render, prove, QA

```bash
node scripts/render_frames.mjs "file://$PWD/index.html" --frames 150 --fps 30 --size 1280x720 --out ./out --selector "#stage" --check
python3 scripts/frame_qa.py out/render.mp4
```

- `render_frames.mjs` needs Node, Playwright (global or local), and ffmpeg. It screenshots frame by frame, encodes H.264, writes `contact-sheet.png` and `report.json`. `--check` renders five frames twice, in a different order, and fails if the bytes differ: that is the proof, not an assumption. Without a GPU it uses SwiftShader (software GL).
- `frame_qa.py` needs only ffmpeg. It finds **frozen runs** (frames with no difference for `--freeze-frames` frames), **flashes** (a luma spike that returns within 3 frames) and **cuts** (a lasting jump, which may be intended). Exit code 1 for a frozen run or a flash.
- **Look at the contact sheet.** The checks cannot tell a good animation from a bad one. Read each tile, fix the worst thing, re-render, repeat until a pass finds nothing. Then watch the video once.

## What running it showed

- 150 frames at 1280×720 took about 14 s on CPU-only software GL; the five-frame determinism check passed; QA found no frozen frames or flashes. The QA was also tested on a clip with a planted two-frame white flash and a planted freeze, and found both. An earlier version caught only one-frame flashes; that is why the window is three frames.
- **Odd sizes break x264.** An element screenshot of a padded stage was 1264×711. The script now scales to even dimensions, and the page's render mode makes the stage fill the viewport so the size is exactly what you asked for.
- **An ES-module import of a globally installed Playwright fails** with `ERR_MODULE_NOT_FOUND`, because ESM does not search global paths. The script loads it through `createRequire`, which does.
- `--selector` crops to one element; use `#stage` and a viewport that matches the video size.
- The demo page starts no `requestAnimationFrame` loop in render mode, so frame *i* is drawn once per request. What happens if a loop runs alongside was not tested: keep render mode loop-free.

## When to use something else

- Heavy 3D or long, high-resolution video: a GPU renderer. See `raea-render-engine` (Rust, local GPU, canary) or `remotion-react-video` (React, licence terms apply).
- A 3D object as a file: `sand3d-modeling`, then `gltf-web-asset-pipeline` for the web.
- Whether the numbers drawn in the video can be trusted: `estimated-motion-validation`.
- Audio, captions and loudness are outside this skill. `whisper-cpp-transcription` and the `auto-editor-silence-cutting` skill cover transcripts and cutting.

## Not verified

GPU rendering, 4K, HDR, long sequences (memory), audio sync, and that frame-exact output matches on another machine's browser build. The method as described by the source repos (readback on the GPU, resumable segments) was read, not run; this skill's scripts use plain screenshots, which are slower.

## Ship checklist

- [ ] `renderFrame(i)` uses only `i`; no timers, no unseeded random, no CSS animation.
- [ ] `--check` passed, with frames compared out of order.
- [ ] Output dimensions are even and match the brief.
- [ ] `frame_qa.py` is clean, or every cut is one you intended.
- [ ] The contact sheet was read tile by tile and the video was watched.
- [ ] The synthetic or estimated nature of what is drawn is stated in the video itself.
