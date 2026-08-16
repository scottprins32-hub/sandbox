#!/usr/bin/env python3
"""
Build the Fridays Baby Truck concept pages.

Each page in ../ is a single self-contained HTML file: fonts subset to woff2 and
inlined, photography cropped, compressed and inlined as data URIs. Nothing is
fetched at view time, so the files open from disk, from a USB stick, or from any
static host, and they survive being pasted into a CMS.

    pip install Pillow fonttools brotli
    python3 build.py

Source photography is Fridays Baby Truck's own, pulled from the CDN behind
fridays.cw and cached in .cache/. Fonts come from Google Fonts (OFL).
"""

import base64
import io
import json
import os
import re
import subprocess
import string
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".cache")
SRCDIR = os.path.join(HERE, "src")
OUTDIR = os.path.abspath(os.path.join(HERE, ".."))

CDN = "https://cdn.prod.website-files.com/5debbebdf88fbc92d82d7f61/"

# key -> filename on the Fridays CDN
PHOTOS = {
    "flames":   "654e1af55588be9e22fdbf28_ROB09261.jpg",
    "truck":    "654e237bea37faf3598a0b60__Fridaysbabytruck1content20230706-06086%20(1)%201.jpg",
    "bag":      "654e28b47926e889eae9bc3a_A7C02994_Original-min.jpg",
    "ribs":     "654e1af55588be9e22fdbf1f_A7C02893.jpg",
    "baste":    "654e1af55588be9e22fdbf16_A7C02844.jpg",
    "kapsalon": "654e1af55588be9e22fdbf3c_A7C02948%20(1).jpg",
    "shrimp":   "654e1af55588be9e22fdbf4a_ROB09280%201.jpg",
    "caesar":   "68570ef4c4de453bd66e93f1_P1114509%20(1)-min.jpeg",
    "crew":     "654e1af55588be9e22fdbf3a_ROB09278.jpg",
    "menu":     "677e90998020b23fe728ec91_Fridays_Menu-Pafo_FINAL%20DECEMBER%202024_A4-min.JPEG",
    "logo":     "654e1af45588be9e22fdbeef_Fridays-Logo-PNG-1.png",
}

# name, source, crop aspect (w, h) or None, target width, JPEG quality
DERIVATIVES = [
    ("flames_wide",  "flames",   (16, 10), 1500, 70),
    ("flames_sq",    "flames",   (1, 1),    760, 68),
    ("truck_wide",   "truck",    (16, 9),  1200, 72),
    ("bag_tall",     "bag",      (3, 4),    820, 70),
    ("ribs_wide",    "ribs",     (16, 9),  1300, 70),
    ("baste_wide",   "baste",    (16, 9),  1200, 70),
    ("kapsalon_sq",  "kapsalon", (1, 1),    760, 70),
    ("kapsalon_wide","kapsalon", (16, 10), 1300, 70),
    ("shrimp_sq",    "shrimp",   (1, 1),    700, 72),
    ("shrimp_wide",  "shrimp",   (16, 10),  900, 72),
    ("caesar_sq",    "caesar",   (1, 1),    760, 70),
    ("caesar_tall",  "caesar",   (3, 4),    820, 70),
    ("crew_wide",    "crew",     (16, 9),  1300, 70),
    # The truck's own banner along the bottom of the crew shot reads "CLOSED ON
    # THUESDAY", which contradicts the seven-day hours table it sits beside.
    # crew_win keeps the crew and the service window and leaves the banner out.
    ("crew_win",     "crew",     None,     1300, 72),
    ("menu_tall",    "menu",     None,      900, 72),
    ("t_flames",     "flames",   (1, 1),    380, 66),
    ("t_ribs",       "ribs",     (1, 1),    380, 66),
    ("t_kapsalon",   "kapsalon", (1, 1),    380, 66),
    ("t_shrimp",     "shrimp",   (1, 1),    380, 66),
    ("t_caesar",     "caesar",   (1, 1),    380, 66),
    ("t_baste",      "baste",    (1, 1),    380, 66),
    ("t_bag",        "bag",      (1, 1),    380, 66),
    ("t_truck",      "truck",    (1, 1),    380, 66),
    ("t_crew",       "crew",     (1, 1),    380, 66),
]

# Google Fonts, subset to the glyphs these pages actually set.
FONT_CSS_URL = (
    "https://fonts.googleapis.com/css2"
    "?family=Big+Shoulders+Display:wght@400..900"
    "&family=Instrument+Sans:wght@400..700"
    "&family=Instrument+Serif:ital@1"
)
FONT_FACES = [
    # google family, style, weight, css family name we expose
    ("Big Shoulders Display", "normal", "800", "Shoulders"),
    ("Big Shoulders Display", "normal", "600", "Shoulders"),
    ("Instrument Sans",       "normal", "400", "Instrument"),
    ("Instrument Sans",       "normal", "500", "Instrument"),
    ("Instrument Sans",       "normal", "600", "Instrument"),
    ("Instrument Sans",       "normal", "700", "Instrument"),
    ("Instrument Serif",      "italic", "400", "InstrumentSerif"),
]

GLYPHS = (
    string.ascii_letters + string.digits
    + " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
    + "áàâäãåéèêëíìîïóòôöõúùûüñçÁÀÂÄÃÅÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑÇøØæÆßºª"
    + "€£¥ƒ¢°·•–—’‘“”„…«»×÷±≈≠≤≥→←↑↓✓✔✕★☆♥№§©®™½¼¾"
    + "   "
)

# Phosphor Icons (MIT), fetched at build time and inlined. One library, one
# weight, so stroke width stays consistent on every surface.
ICON_CDN = "https://unpkg.com/@phosphor-icons/core@2.1.1/assets/bold/{}-bold.svg"
# A rating drawn in outline stars reads as zero out of five, so the star that
# stands for a filled rating comes from the fill weight instead.
ICON_FILL_CDN = "https://unpkg.com/@phosphor-icons/core@2.1.1/assets/fill/{}-fill.svg"
ICONS_FILL = ["star"]
ICONS = [
    "fire", "clock", "map-pin", "phone", "arrow-right", "arrow-left", "arrow-up-right",
    "caret-down", "caret-right", "caret-left", "check", "x", "globe", "basket",
    "shopping-bag", "minus", "plus", "timer", "motorcycle", "storefront",
    "credit-card", "money", "user", "bell", "star", "path", "car", "chef-hat",
    "receipt", "calendar-blank", "warning", "list", "house", "ticket", "heart",
    "bowl-food", "drop", "moon-stars", "users-three", "arrows-left-right",
    "sparkle", "note-pencil", "info", "magnifying-glass", "gear", "share-network",
    "sun-horizon", "hourglass-medium", "seal-check", "pause", "play", "trash",
    "arrow-u-down-left", "bank", "device-mobile", "wifi-high", "battery-full",
    "cell-signal-full", "dots-three", "flame", "leaf", "wallet", "gift",
]


def log(*a):
    print(*a, file=sys.stderr)


def fetch(url, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if os.path.exists(path) and os.path.getsize(path) > 512:
        return path
    log("  fetch", os.path.basename(path))
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(path, "wb") as f:
        f.write(r.read())
    return path


# Derivatives that need a hand-placed crop rather than a centred one.
# name -> (left, top, right, bottom) as fractions of the source.
MANUAL_CROPS = {
    "crew_win": (0.06, 0.06, 0.98, 0.62),
    # A centred square puts the pan of shrimps half out of frame under an
    # out-of-focus grill, so this one is anchored to the bottom of the shot.
    "shrimp_sq": (0.0, 0.273, 1.0, 1.0),
    # The pan sits in the bottom third of the frame, so both the wide card and
    # the thumbnail crop to that band instead of the empty grill above it.
    "shrimp_wide": (0.0, 0.52, 1.0, 1.0),
    "t_shrimp": (0.0, 0.44, 1.0, 1.0),
}


def crop_to(im, ratio):
    if ratio is None:
        return im
    target = ratio[0] / ratio[1]
    w, h = im.size
    if abs(w / h - target) < 0.005:
        return im
    if w / h > target:
        nw = int(h * target)
        return im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    nh = int(w / target)
    y = int((h - nh) * 0.42)          # bias the crop slightly above centre
    return im.crop((0, y, w, y + nh))


def build_images():
    from PIL import Image

    log("photography")
    for key, name in PHOTOS.items():
        fetch(CDN + name, os.path.join(CACHE, "src_" + key))

    assets, opened, total = {}, {}, 0
    for name, src, ratio, width, q in DERIVATIVES:
        if src not in opened:
            opened[src] = Image.open(os.path.join(CACHE, "src_" + src)).convert("RGB")
        im = opened[src]
        if name in MANUAL_CROPS:
            l, t, r, bt = MANUAL_CROPS[name]
            w, h = im.size
            im = im.crop((int(w * l), int(h * t), int(w * r), int(h * bt)))
        im = crop_to(im, ratio)
        if im.width > width:
            im = im.resize((width, max(1, round(im.height * width / im.width))), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=q, optimize=True, progressive=True, subsampling=2)
        raw = buf.getvalue()
        total += len(raw)
        assets[name] = "data:image/jpeg;base64," + base64.b64encode(raw).decode()

    lg = Image.open(os.path.join(CACHE, "src_logo")).convert("RGBA")
    lg = lg.crop(lg.getbbox())
    lg.thumbnail((512, 512), Image.LANCZOS)
    buf = io.BytesIO()
    lg.save(buf, "PNG", optimize=True)
    total += len(buf.getvalue())
    assets["logo"] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

    log(f"  {len(assets)} derivatives, {total // 1024} KB before base64")
    return assets


def build_fonts():
    log("fonts")
    css_path = fetch(FONT_CSS_URL, os.path.join(CACHE, "google.css"))
    css = open(css_path, encoding="utf-8").read()

    found = {}
    for block in re.findall(r"@font-face\s*\{(.*?)\}", css, re.S):
        fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
        sty = re.search(r"font-style:\s*(\w+)", block).group(1)
        wt = re.search(r"font-weight:\s*(\d+)", block).group(1)
        url = re.search(r"url\(([^)]+)\)", block).group(1)
        found[(fam, sty, wt)] = url

    unicodes = ",".join("U+%04X" % ord(c) for c in sorted(set(GLYPHS)))
    faces, total = [], 0
    for fam, sty, wt, expose in FONT_FACES:
        if (fam, sty, wt) not in found:
            raise SystemExit(f"Google Fonts did not serve {fam} {sty} {wt}")
        slug = re.sub(r"\W+", "", fam) + wt + ("i" if sty == "italic" else "")
        ttf = fetch(found[(fam, sty, wt)], os.path.join(CACHE, slug + ".ttf"))
        woff2 = os.path.join(CACHE, slug + ".woff2")
        if not os.path.exists(woff2):
            subprocess.run(
                ["pyftsubset", ttf, "--output-file=" + woff2, "--flavor=woff2",
                 "--unicodes=" + unicodes,
                 "--layout-features=kern,liga,calt,tnum", "--no-hinting",
                 "--desubroutinize", "--drop-tables+=DSIG"],
                check=True, capture_output=True,
            )
        blob = open(woff2, "rb").read()
        total += len(blob)
        faces.append(
            "@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:block;"
            "src:url(data:font/woff2;base64,%s) format('woff2')}"
            % (expose, sty, wt, base64.b64encode(blob).decode())
        )
    log(f"  {len(faces)} faces, {total // 1024} KB before base64")
    return "\n".join(faces)


def build_icons():
    log("icons")
    out = {}
    wanted = [(n, ICON_CDN, "icon_" + n) for n in ICONS]
    wanted += [(n + "-fill", ICON_FILL_CDN, "iconfill_" + n) for n in ICONS_FILL]
    for name, cdn, slug in wanted:
        base = name[:-5] if name.endswith("-fill") else name
        path = fetch(cdn.format(base), os.path.join(CACHE, slug + ".svg"))
        svg = open(path, encoding="utf-8").read().strip()
        # Strip the fixed size so CSS drives it, and mark it decorative by default.
        svg = re.sub(r'\s(width|height)="[^"]*"', "", svg, count=2)
        svg = svg.replace(
            "<svg ", '<svg class="ic" aria-hidden="true" focusable="false" ', 1
        )
        out[name] = svg
    log(f"  {len(out)} icons")
    return out


def render(template, fonts, assets, icons):
    out = template.replace("{{FONTS}}", fonts)

    def icon(m):
        key = m.group(1)
        if key not in icons:
            raise SystemExit(f"unknown icon: {key} (add it to ICONS)")
        return icons[key]

    out = re.sub(r"\{\{ICON:([a-z0-9\-]+)\}\}", icon, out)

    def img(m):
        key = m.group(1)
        if key not in assets:
            raise SystemExit(f"unknown image key: {key}")
        return assets[key]

    out = re.sub(r"\{\{IMG:([a-z0-9_]+)\}\}", img, out)

    def bundle(m):
        keys = [k.strip() for k in m.group(1).split(",") if k.strip()]
        return json.dumps({k: assets[k] for k in keys}, separators=(",", ":"))

    out = re.sub(r"\{\{IMGJSON:([a-z0-9_,\s]+)\}\}", bundle, out)

    leftover = re.findall(r"\{\{[A-Z]+[^}]*\}\}", out)
    if leftover:
        raise SystemExit("unresolved tokens: " + ", ".join(sorted(set(leftover))))
    return out


def main():
    assets = build_images()
    fonts = build_fonts()
    icons = build_icons()

    os.makedirs(OUTDIR, exist_ok=True)
    log("pages")
    for src in sorted(os.listdir(SRCDIR)):
        if not src.endswith(".html"):
            continue
        template = open(os.path.join(SRCDIR, src), encoding="utf-8").read()
        html = render(template, fonts, assets, icons)
        dest = os.path.join(OUTDIR, src)
        with open(dest, "w", encoding="utf-8") as f:
            f.write(html)
        log(f"  {src:24s} {len(html) // 1024:5d} KB")


if __name__ == "__main__":
    main()
