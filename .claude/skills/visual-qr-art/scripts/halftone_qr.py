#!/usr/bin/env python3
"""Picture QR codes that still scan: the picture fills the code, and a small dot in the middle of every
module carries the data, because a scanner samples module centres. Finder and alignment patterns stay solid.

    python halftone_qr.py IMAGE PAYLOAD OUT.png [options]
    python halftone_qr.py IMAGE PAYLOAD OUT.png --auto          # lightest settings that pass every scan test

Every export is decoded by two independent readers (ZXing and OpenCV), on the original and on a set of
degraded copies (small, blurred, JPEG, rotated, tilted, dim). The JSON report next to the PNG holds the
payload, the settings, the image hash and every result. Exit code 1 if the file does not decode with ZXing or the
1080 px copy does not decode with both readers, 2 if --auto finds no passing setting. A software pass is not a phone test.

Needs: segno, zxing-cpp, opencv-python-headless, pillow, numpy. No network access.
"""
import argparse, hashlib, io, json, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps, ImageFilter
import segno

QUIET = 4


def align_centres(version, size):
    if version == 1:
        return []
    n = version // 7 + 2
    step = 26 if version == 32 else (version * 4 + n * 2 + 1) // (n * 2 - 2) * 2
    pos = sorted([size - 7 - i * step for i in range(n - 1)] + [6])
    out = []
    for r in pos:
        for c in pos:
            if (r < 9 and c < 9) or (r < 9 and c > size - 10) or (r > size - 10 and c < 9):
                continue
            out.append((r, c))
    return out


def solid_mask(version, size, timing=True, fmt=True):
    """Modules drawn whole: the three finders with separators, the alignment patterns, and optionally the
    timing lines and the format/version areas (readers such as OpenCV lean on these to fix the grid)."""
    m = np.zeros((size, size), bool)
    m[:8, :8] = m[:8, size - 8:] = m[size - 8:, :8] = True
    if timing:
        m[6, :] = m[:, 6] = True
    if fmt:
        m[8, :9] = m[:9, 8] = True; m[8, size - 8:] = True; m[size - 8:, 8] = True
        if version >= 7:
            m[:6, size - 11:size - 8] = True; m[size - 11:size - 8, :6] = True
    for r, c in align_centres(version, size):
        m[r - 2:r + 3, c - 2:c + 3] = True
    return m


def prepare_picture(path, side, zoom=1.0, ox=0.0, oy=0.0, brightness=0.0, contrast=1.0, saturation=1.0):
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    w, h = im.size
    s = min(w, h) / max(zoom, 1e-3)
    cx = w / 2 + ox * (w - s) / 2 if w > s else w / 2
    cy = h / 2 + oy * (h - s) / 2 if h > s else h / 2
    box = (cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2)
    im = im.resize((side, side), Image.LANCZOS, box=box)
    if saturation != 1:
        im = ImageEnhance.Color(im).enhance(saturation)
    if contrast != 1:
        im = ImageEnhance.Contrast(im).enhance(contrast)
    if brightness:
        im = ImageEnhance.Brightness(im).enhance(1 + brightness)
    return np.asarray(im).astype(np.float32)


def render_code(matrix, version, pic, M, dot=0.36, bias=0.0, shape='square', dark=(17, 17, 17), light=(255, 255, 255), timing=True, fmt=True, margin=0.24, spread=0.6):
    """matrix: N x N bools (True = dark). pic: (N*M, N*M, 3) float. Returns the code area (no quiet zone)."""
    N = matrix.shape[0]
    dark, light = np.array(dark, np.float32), np.array(light, np.float32)
    mod = np.kron(matrix.astype(np.uint8), np.ones((M, M), np.uint8)).astype(bool)
    target = np.where(mod[..., None], dark, light)
    img = pic * (1 - bias) + target * bias                   # optional global push toward each module's colour
    if margin > 0:
        # Per module: a reader that averages a module (a phone at a distance, OpenCV) must see it on the right
        # side of mid-grey. Blend only the modules that are not, and only as far as needed.
        lum = img @ np.array([.2126, .7152, .0722], np.float32)
        mean = lum.reshape(N, M, N, M).mean(axis=(1, 3))
        tl = target @ np.array([.2126, .7152, .0722], np.float32)
        goal = np.where(matrix, 255 * (.5 - margin), 255 * (.5 + margin))
        # Weight map inside a module: 1 near the centre, falling toward the edges ("spread" sets how wide), so the
        # correction sits around the data dot and the module borders keep the picture.
        yy, xx = np.mgrid[0:M, 0:M]
        r = np.hypot(yy + .5 - M / 2, xx + .5 - M / 2) / (M / 2)
        w = np.clip(1.2 - r / max(spread, 1e-3), 0, 1).astype(np.float32) if spread < 1 else np.ones((M, M), np.float32)
        Wt = np.tile(w, (N, N))
        for _ in range(2):                                   # second pass with full weight takes up any shortfall
            lum = img @ np.array([.2126, .7152, .0722], np.float32)
            mean = lum.reshape(N, M, N, M).mean(axis=(1, 3))
            need = np.where(matrix, mean > goal, mean < goal)
            gain = ((tl - lum) * Wt).reshape(N, M, N, M).mean(axis=(1, 3))     # mean change at alpha = 1
            alpha = np.clip(np.where(need, (goal - mean) / np.where(np.abs(gain) < 1e-3, 1e-3, gain), 0), 0, 1)
            A = (np.kron(alpha, np.ones((M, M), np.float32)) * Wt)[..., None]
            img = img * (1 - A) + target * A
            Wt = np.ones_like(Wt)
    solid = np.kron(solid_mask(version, N, timing, fmt).astype(np.uint8), np.ones((M, M), np.uint8)).astype(bool)
    img[solid] = target[solid]
    d = max(3, int(round(dot * M)))
    a = (M - d) // 2
    yy, xx = np.mgrid[0:M, 0:M]
    if shape == 'circle':
        cell = (yy + .5 - M / 2) ** 2 + (xx + .5 - M / 2) ** 2 <= (d / 2) ** 2
    else:
        cell = (yy >= a) & (yy < a + d) & (xx >= a) & (xx < a + d)
    dots = np.tile(cell, (N, N))
    img[dots] = target[dots]
    return np.clip(img, 0, 255).astype(np.uint8)


def frame(code, M, kind='card', caption=None, bg=(255, 255, 255), ink=(40, 40, 40)):
    """Quiet zone of four modules, then a card or a perforated stamp. Returns RGBA."""
    q = QUIET * M
    side = code.shape[0] + 2 * q
    if kind == 'none':
        out = Image.new('RGBA', (side, side), bg + (255,))
        out.paste(Image.fromarray(code), (q, q))
        return out
    pad = M * (2 if kind == 'card' else 3)
    cap_h = int(M * 3.2) if caption else 0
    W, H = side + 2 * pad, side + 2 * pad + cap_h
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dr = ImageDraw.Draw(out)
    if kind == 'card':
        dr.rounded_rectangle((0, 0, W - 1, H - 1), radius=int(M * 1.6), fill=bg + (255,))
    else:                                                    # stamp: scalloped edge, thin inner rule
        dr.rectangle((0, 0, W - 1, H - 1), fill=bg + (255,))
        r = max(2, int(M * .55))
        step = 2 * r + max(2, int(M * .5))
        for x in range(step // 2, W, step):
            dr.ellipse((x - r, -r, x + r, r), fill=(0, 0, 0, 0)); dr.ellipse((x - r, H - r, x + r, H + r), fill=(0, 0, 0, 0))
        for y in range(step // 2, H, step):
            dr.ellipse((-r, y - r, r, y + r), fill=(0, 0, 0, 0)); dr.ellipse((W - r, y - r, W + r, y + r), fill=(0, 0, 0, 0))
        e = int(M * 1.6)
        dr.rectangle((e, e, W - 1 - e, H - 1 - e), outline=ink + (90,), width=max(1, M // 10))
    out.paste(Image.fromarray(code), (pad + q, pad + q))
    if caption:
        try:
            font = ImageFont.load_default(size=max(10, int(M * 1.25)))
        except TypeError:
            font = ImageFont.load_default()
        tw = dr.textlength(caption, font=font)
        dr.text(((W - tw) / 2, pad + side - q / 2 + M * .2), caption, fill=ink + (255,), font=font)
    return out


# ---------------- verification ----------------

def read_all(img_rgb):
    """Payloads found by each reader in an RGB uint8 array."""
    import cv2, zxingcpp
    res = {}
    try:
        res['zxing'] = [b.text for b in zxingcpp.read_barcodes(img_rgb) if b.format == zxingcpp.BarcodeFormat.QRCode]
    except Exception as e:
        res['zxing'] = ['ERROR ' + str(e)]
    g = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    txt = ''
    for det in (cv2.QRCodeDetector(), cv2.QRCodeDetectorAruco()):
        try:
            txt, _, _ = det.detectAndDecode(g)
        except Exception:
            txt = ''
        if txt:
            break
    res['opencv'] = [txt] if txt else []
    return res


def degrade(rgba, case):
    """Copies that mimic a phone seeing a print: small, soft, compressed, rotated, tilted, dim."""
    im = Image.new('RGB', rgba.size, (235, 235, 230))
    im.paste(rgba, mask=rgba.split()[3])
    if case == 'original':
        return np.asarray(im)
    name, val = case.split(':')
    if name == 'width':
        w = int(val); im = im.resize((w, int(w * im.height / im.width)), Image.LANCZOS)
    elif name == 'blur':
        im = im.resize((480, int(480 * im.height / im.width)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(float(val)))
    elif name == 'jpeg':
        im = im.resize((480, int(480 * im.height / im.width)), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, 'JPEG', quality=int(val)); im = Image.open(b).convert('RGB')
    elif name == 'rotate':
        im = im.resize((560, int(560 * im.height / im.width)), Image.LANCZOS).rotate(float(val), expand=True, fillcolor=(235, 235, 230), resample=Image.BICUBIC)
    elif name == 'tilt':
        im = im.resize((560, int(560 * im.height / im.width)), Image.LANCZOS)
        import cv2                                           # true perspective: top edge further away
        a = np.asarray(ImageOps.expand(im, border=int(.15 * im.width), fill=(235, 235, 230)))
        H, W = a.shape[:2]; k = float(val) * W
        T = cv2.getPerspectiveTransform(np.float32([[0, 0], [W, 0], [W, H], [0, H]]), np.float32([[k, k * .5], [W - k, k * .5], [W, H], [0, H]]))
        im = Image.fromarray(cv2.warpPerspective(a, T, (W, H), flags=cv2.INTER_CUBIC, borderValue=(235, 235, 230)))
    elif name == 'dim':
        im = im.resize((480, int(480 * im.height / im.width)), Image.LANCZOS)
        a = np.asarray(im).astype(np.float32) / 255
        im = Image.fromarray(np.clip(255 * (a ** float(val)) * .8, 0, 255).astype(np.uint8))
    return np.asarray(im)


# 'width:1080' stands in for a phone camera frame; the full-size file is checked separately (ZXing must read it).
STRESS = ['width:1080', 'width:640', 'width:320', 'width:200', 'blur:1.2', 'jpeg:45', 'rotate:12', 'tilt:0.08', 'dim:1.8']


def verify(rgba, payload, cases=STRESS):
    full = read_all(degrade(rgba, 'original'))
    file_row = {'case': 'file (full size)', 'zxing': payload in full['zxing'], 'opencv': payload in full['opencv']}
    rows, all_ok = [], True
    for c in cases:
        r = read_all(degrade(rgba, c))
        ok = {k: payload in v for k, v in r.items()}
        wrong = {k: [x for x in v if x != payload] for k, v in r.items() if any(x != payload for x in v)}
        rows.append({'case': c, **{k: ok[k] for k in ok}, **({'wrong': wrong} if wrong else {})})
        all_ok &= all(ok.values())
    first = rows[0]
    return {'file': file_row, 'original_both': bool(file_row['zxing'] and first['zxing'] and first['opencv']), 'all_cases_both': all_ok and file_row['zxing'],
            'passed': sum(r['zxing'] and r['opencv'] for r in rows), 'cases': len(rows), 'rows': rows,
            'rule': 'The full-size file must decode with ZXing; every degraded copy (1080 px and smaller) must decode with ZXing and OpenCV. '
                    'OpenCV on the full-size file is reported but not required: at very high resolution it sees the picture inside each module, which a phone camera does not.'}


# ---------------- main ----------------

def build(a, dot, margin):
    qr = segno.make(a.payload, error=a.ec, micro=False, boost_error=False)
    matrix = np.array([[bool(x) for x in row] for row in qr.matrix])
    N = matrix.shape[0]
    M = a.module * a.scale
    pic = prepare_picture(a.image, N * M, a.zoom, a.ox, a.oy, a.brightness, a.contrast, a.saturation)
    code = render_code(matrix, qr.version, pic, M, dot, a.bias, a.shape, margin=margin, spread=a.spread)
    caption = None if a.no_caption else (a.caption or a.payload.split('://', 1)[-1].rstrip('/'))
    return qr, frame(code, M, a.frame, caption)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('image'); p.add_argument('payload'); p.add_argument('out')
    p.add_argument('--ec', default='h', choices=list('lmqh'), help='error correction level (default h)')
    p.add_argument('--module', type=int, default=24, help='pixels per module at scale 1')
    p.add_argument('--scale', type=int, default=1, choices=[1, 2, 4, 6, 8])
    p.add_argument('--dot', type=float, default=.3, help='data dot size as a fraction of a module')
    p.add_argument('--margin', type=float, default=.24, help='scan safety: how far each module average must sit from mid-grey (0..0.4; 0.24 passed every test picture)')
    p.add_argument('--spread', type=float, default=.6, help='how wide the correction spreads from the dot (0.3 tight .. 1 whole module)')
    p.add_argument('--bias', type=float, default=0.0, help='optional global push of the whole picture toward module colours')
    p.add_argument('--shape', default='square', choices=['square', 'circle'])
    p.add_argument('--zoom', type=float, default=1.0); p.add_argument('--ox', type=float, default=0.0); p.add_argument('--oy', type=float, default=0.0)
    p.add_argument('--brightness', type=float, default=0.0); p.add_argument('--contrast', type=float, default=1.0); p.add_argument('--saturation', type=float, default=1.0)
    p.add_argument('--frame', default='card', choices=['card', 'stamp', 'none'])
    p.add_argument('--caption', help='readable link under the code (default: the payload without https://)')
    p.add_argument('--no-caption', action='store_true')
    p.add_argument('--auto', action='store_true', help='pick the lightest dot and margin that pass every scan test with both readers')
    a = p.parse_args()

    tried = []
    if a.auto:
        grid = [(d, m) for m in (.1, .14, .18, .22, .26, .3, .35) for d in (.3, .36, .42)]   # least intrusive first
        a_small = argparse.Namespace(**{**vars(a), 'scale': 1})
        choice = None
        for d, m in grid:
            _, img = build(a_small, d, m)
            v = verify(img, a.payload)
            tried.append({'dot': d, 'margin': m, 'passed': v['passed'], 'cases': v['cases']})
            if v['all_cases_both']:
                choice = (d, m); break
        if not choice:
            print(json.dumps({'error': 'no setting passed every scan test', 'tried': tried}, indent=1))
            sys.exit(2)
        a.dot, a.margin = choice

    qr, img = build(a, a.dot, a.margin)
    img.save(a.out)
    v = verify(img, a.payload)
    raw = open(a.out, 'rb').read()
    rep = {'payload': a.payload, 'version': qr.version, 'modules': qr.symbol_size(border=0)[0], 'ec': qr.error,
           'settings': {k: getattr(a, k) for k in ('dot', 'margin', 'spread', 'bias', 'shape', 'zoom', 'ox', 'oy', 'brightness', 'contrast', 'saturation', 'frame', 'module', 'scale')},
           'image': {'path': a.out, 'size': list(img.size), 'sha256': hashlib.sha256(raw).hexdigest()},
           'verify': v, 'auto_tried': tried or None,
           'note': 'Software decode of the exported file and degraded copies with ZXing and OpenCV. Not a test with phone cameras or prints.'}
    json.dump(rep, open(a.out.rsplit('.', 1)[0] + '.json', 'w'), indent=1)
    print(f"{a.out}: version {qr.version} ({rep['modules']}x{rep['modules']}), ec {qr.error}, dot {a.dot}, margin {a.margin}, "
          f"{img.size[0]}x{img.size[1]} px; scan tests passed by both readers: {v['passed']}/{v['cases']}")
    f = v['file']; print(f"  {'file':<12} zxing {'ok ' if f['zxing'] else 'NO '} opencv {'ok' if f['opencv'] else 'no (not required)'}")
    for r in v['rows']:
        print(f"  {r['case']:<12} zxing {'ok ' if r['zxing'] else 'NO '} opencv {'ok' if r['opencv'] else 'NO'}{'  WRONG ' + str(r['wrong']) if 'wrong' in r else ''}")
    sys.exit(0 if v['original_both'] else 1)


if __name__ == '__main__':
    main()
