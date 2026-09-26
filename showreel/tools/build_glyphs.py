"""Export glyph outlines, advances and kerning for the reel's type engine.

Every font is sampled at its variation masters (normalized coords -1/0/+1 per
axis). gvar/HVAR/GPOS deltas are bilinear between masters in normalized
space, so the browser can rebuild any wdth/wght exactly by interpolating these
samples after applying the font's avar mapping.

Output: assets/glyphs.js  (window.GLYPHS = {...})
"""
import itertools
import json
import os

import uharfbuzz as hb
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "fonts")
OUT = os.path.join(ROOT, "assets", "glyphs.js")

CHARS = "".join(chr(c) for c in range(0x20, 0x7F)) + "—–·’‘“”•×→←↗●■▲◆°"
SCALE = 16  # sub-unit precision for draw callbacks


class RecPen:
    """Minimal pen that records M/L/Q/C/Z with flattened coordinates."""

    def __init__(self):
        self.cmds, self.pts = [], []

    def _p(self, *pts):
        for x, y in pts:
            self.pts += [round(x / SCALE, 2), round(y / SCALE, 2)]

    def moveTo(self, p):
        self.cmds.append("M"); self._p(p)

    def lineTo(self, p):
        self.cmds.append("L"); self._p(p)

    def qCurveTo(self, *pts):
        # HarfBuzz emits one off-curve + on-curve per call, but be general.
        *offs, on = pts
        for i, c in enumerate(offs):
            if i < len(offs) - 1:
                n = offs[i + 1]
                end = ((c[0] + n[0]) / 2, (c[1] + n[1]) / 2)
            else:
                end = on
            self.cmds.append("Q"); self._p(c, end)

    def curveTo(self, *pts):
        self.cmds.append("C"); self._p(*pts)

    def closePath(self):
        self.cmds.append("Z")

    def endPath(self):
        pass


def export(path, key, kern_chars):
    blob = hb.Blob.from_file_path(path)
    face = hb.Face(blob)
    font = hb.Font(face)
    upm = face.upem
    font.scale = (upm * SCALE, upm * SCALE)
    tt = TTFont(path)
    axes = [a.axisTag for a in tt["fvar"].axes] if "fvar" in tt else []
    axis_info = {a.axisTag: [a.minValue, a.defaultValue, a.maxValue] for a in tt["fvar"].axes} if axes else {}
    avar = {}
    if "avar" in tt:
        for tag, seg in tt["avar"].segments.items():
            avar[tag] = [[round(k, 5), round(v, 5)] for k, v in sorted(seg.items())]
    # master grid in normalized space, axis order = fvar order
    masters = list(itertools.product(*[[-1.0, 0.0, 1.0] for _ in axes])) or [()]

    cmap = tt.getBestCmap()
    chars = [ch for ch in CHARS if ord(ch) in cmap]
    glyphs = {}
    for ch in chars:
        gid = font.get_nominal_glyph(ord(ch))
        entry = {"c": None, "p": [], "a": []}
        for m in masters:
            if axes:
                font.set_var_coords_normalized(list(m))
            pen = RecPen()
            font.draw_glyph_with_pen(gid, pen)
            cmds = "".join(pen.cmds)
            if entry["c"] is None:
                entry["c"] = cmds
            elif entry["c"] != cmds:
                raise SystemExit(f"{key}: command mismatch for {ch!r} at {m}")
            entry["p"].append(pen.pts)
            entry["a"].append(round(font.get_glyph_h_advance(gid) / SCALE, 2))
        glyphs[ch] = entry

    # pair kerning via shaping (GPOS), per master
    kern = {}
    kc = [c for c in kern_chars if c in glyphs]
    for mi, m in enumerate(masters):
        if axes:
            font.set_var_coords_normalized(list(m))
        for a, b in itertools.product(kc, kc):
            buf = hb.Buffer()
            buf.add_str(a + b)
            buf.guess_segment_properties()
            hb.shape(font, buf, {"kern": True, "liga": False})
            pos = buf.glyph_positions
            adv = font.get_glyph_h_advance(font.get_nominal_glyph(ord(a)))
            k = (pos[0].x_advance - adv) / SCALE
            if abs(k) >= 0.5 or (a + b) in kern:
                kern.setdefault(a + b, [0.0] * len(masters))[mi] = round(k, 2)

    ext = font.get_font_extents("ltr")
    os2 = tt["OS/2"]
    return {
        "upm": upm,
        "asc": round(ext.ascender / SCALE, 2),
        "desc": round(ext.descender / SCALE, 2),
        "capH": getattr(os2, "sCapHeight", 0),
        "xH": getattr(os2, "sxHeight", 0),
        "axes": axes,
        "axisInfo": axis_info,
        "avar": avar,
        "masters": [list(m) for m in masters],
        "glyphs": glyphs,
        "kern": kern,
    }


def main():
    upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    lower = "abcdefghijklmnopqrstuvwxyz"
    digits = "0123456789"
    punct = ".,:;-—’'!?/&"
    data = {
        "archivo": export(os.path.join(FONTS, "Archivo[wdth,wght].ttf"), "archivo", upper + lower + digits + punct),
        "mono": export(os.path.join(FONTS, "JetBrainsMono[wght].ttf"), "mono", ""),
        "serif": export(os.path.join(FONTS, "InstrumentSerif-Regular.ttf"), "serif", upper + lower + punct),
        "serifItalic": export(os.path.join(FONTS, "InstrumentSerif-Italic.ttf"), "serifItalic", upper + lower + punct),
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        f.write("// Generated by tools/build_glyphs.py — do not edit.\n")
        f.write("window.GLYPHS=")
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)
        f.write(";\n")
    for k, v in data.items():
        print(k, "glyphs", len(v["glyphs"]), "kern pairs", len(v["kern"]), "masters", len(v["masters"]))
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
