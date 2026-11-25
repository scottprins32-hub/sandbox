---
name: visual-qr-art
description: Makes picture QR codes that still scan - the picture fills the code, a small dot in each module carries the data, and only the modules a reader would misjudge are corrected - with a Python generator that tests every export on two independent readers (ZXing and OpenCV) across nine degraded copies, and a local browser tool with sliders, card or stamp frames and a live scan badge. Use this whenever the user wants a QR code that looks like a photo, illustration, player image, logo or poster, a branded or "designer" QR for a card, flyer, report, sticker or merch, asks why an artistic QR does not scan, or shares a QR-art tool or reel - even if they never say "halftone". Main caveat - a software pass is not a phone test; print at the real size and scan with an iPhone and an Android phone before anything ships.
---

# Visual QR art

Built 2026-11-25 after a reel by @aleksandra.desssign showing visualcodes.aleksandra.design (paste a link, drop a picture, move sliders, pick a clean card or a stamp, download up to 6,400 px; free, in the browser). That tool's code is not published; this skill is an independent build of the same idea, tested here.

## How it works

A QR reader finds the three finder squares, lays a grid over the code and decides per module: dark or light. Two kinds of reader do that differently, and a picture code has to satisfy both:

- **Centre samplers** (ZXing and most phone apps at close range) look at the middle of each module. A solid dot there (`--dot`, default 0.3 of a module) is enough; the picture around it can be anything.
- **Averagers** (OpenCV, and any phone reading from a distance or out of focus) effectively see each module's average brightness. A dark picture behind a light module reads as dark, whatever the dot says.

So the generator keeps the finders, alignment patterns, timing lines and format areas solid, draws the dots, and then corrects only the modules whose average sits on the wrong side of mid-grey, and only as far as `--margin` asks. The correction is weighted toward the centre of the module (`--spread`), so module edges keep the picture.

Measured here (two links, six pictures, nine degraded copies, both readers): with no correction ZXing passed almost everything and OpenCV almost nothing. At a margin of 0.24 every picture passed every case; the lightest passing margin ranged from 0.12 (busy, colourful pictures) to 0.22 (a flat, low-contrast render). A uniform push of the whole picture (the obvious approach) needed about 0.65 and washed the picture out.

## Make one (Python, authoritative)

Needs `segno` (BSD-3), `zxing-cpp` (Apache-2.0), `opencv-python-headless`, `pillow`, `numpy`. No network access.

```bash
python3 -m venv .qrv && .qrv/bin/pip install segno zxing-cpp opencv-python-headless pillow numpy
.qrv/bin/python scripts/halftone_qr.py picture.jpg "https://example.com/x" out.png --auto
.qrv/bin/python scripts/halftone_qr.py picture.jpg "https://example.com/x" out.png --auto --frame stamp --shape circle --scale 4
```

`--auto` tries the least intrusive dot and margin first and keeps the first setting where the exported file decodes with ZXing and all nine degraded copies (1,080, 640, 320 and 200 px wide, blur, JPEG 45, 12 degree rotation, perspective tilt, dim) decode with both readers. It writes `out.json` with the payload, version, settings, SHA-256 of the PNG and every result. Exit code 0 pass, 1 fail, 2 no passing setting. Picture controls: `--zoom --ox --oy --brightness --contrast --saturation`; framing: `--frame card|stamp|none`, `--caption` (default: the link without `https://`), `--no-caption`.

OpenCV on the full-size file is reported but not required: at a few thousand pixels it sees the picture inside each module, which a phone camera framing the code never does.

## Make one (browser)

Open `tool/index.html` from disk. Everything runs in the page; the two libraries are vendored in `tool/vendor/` (qrcode-generator 1.4.4 MIT, jsQR 1.4.0 Apache-2.0, unmodified). Sliders for picture, dot, scan safety and spread; card, stamp or no frame; error correction M, Q or H; 1x to 8x PNG export. The badge decodes the preview with jsQR (full size, 320 px, blurred). jsQR is a centre sampler and too lenient on its own: it passed codes OpenCV could not read. So the page defaults to scan safety 0.24, "Make it scan" never goes below it, and the badge turns red when you drag lower. Run the Python script on the downloaded PNG before printing.

## Rules that keep it scanning

- **Short links.** A 31-character link gives 33x33 modules (version 4); a long report URL went to 49x49 (version 8). More modules means smaller modules and less picture per module. Use a short redirect you control.
- **Error correction H** (default). Picture codes lean on it.
- **Quiet zone of four modules**, always light. The card and stamp frames include it; do not crop it.
- **Pictures**: busy and colourful is easy; flat, low-contrast or very dark needs a higher margin, which `--auto` finds.
- **Keep the link readable** under the code (the default caption) and offer a plain QR or a clickable link wherever the picture code might fail. See `artistic-qr-validation` for exact-payload checks and device testing records.
- **Never re-encode** an approved PNG (JPEG, resizing in a layout app, colour profiles) without running the check again on the final file.

## Before it ships

- [ ] `halftone_qr.py` report: file passes ZXing, 9/9 cases pass both readers, payload exact.
- [ ] Printed or displayed at the real size; scanned with an iPhone camera and an Android camera at the real distance, in the real light. Record devices, size and result next to the JSON.
- [ ] The link behind it is yours, short, and still works; private pages need their own access control (a QR code is public the moment it is printed).
- [ ] Picture rights: you own the picture or have permission. "QR Code" is a registered trademark of DENSO WAVE.

## Files

- `scripts/halftone_qr.py`: generator and verifier. `scripts/test_halftone_qr.py`: 7 unit tests (plain code passes, alignment centres, module averages meet the margin, solid finders, determinism, default margin scans on dark/flat/noise pictures, no margin fails strict readers).
- `tool/index.html`: browser tool. `tool/vendor/`: the two libraries with their licences.
- `examples/`: `pitch-score-card.png` (synthetic Pitch Score poster, card, auto margin 0.18), `sand3d-stamp.png` (sand3d render, stamp and round dots, auto margin 0.22), each with its JSON report; `margin-compare.jpg` shows the same picture at margin 0 and 0.24 with their test counts.
