#!/usr/bin/env python3
"""Structure probe for a CorelDRAW-exported SVG.

Run this on `assets/page2-full.svg` BEFORE writing the extractor. How the
extractor has to work depends entirely on answers this gives:

  * Are shapes nested in groups, and do the groups already mean something?
    (If Corel exported per-part groups, clustering is unnecessary -- the
    parts are already named and Stage 1 becomes a renaming job.)
  * Are there transforms on ancestors? Then a path's `d` coordinates are not
    page coordinates and every bounding box must be computed through the
    accumulated matrix.
  * Are there clip paths or masks? Those change a shape's visible extent, so
    a raw geometric bbox can be wildly wrong.
  * Are fills flat colours or gradient references? CLAUDE.md requires
    highlights and shadows survive recolouring, so the split between base
    fills and overlay/shading paths has to be visible in the fill data.
  * Where does content actually sit on the page? The occupancy map shows the
    seven illustrations and gives first-pass region boxes.

Stdlib only, no dependencies.

    python3 scripts/inspect_svg.py assets/page2-full.svg
    python3 scripts/inspect_svg.py assets/page2-full.svg --emit-regions

`--emit-regions` writes a candidate `regions.json` by clustering path bounding
boxes into connected components. It is a starting point to be corrected by
hand, never a final answer.
"""

from __future__ import annotations

import json
import math
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path

SVG_NS = "http://www.w3.org/2000/svg"
XLINK_NS = "http://www.w3.org/1999/xlink"

# --- transform handling ------------------------------------------------------
# A matrix is (a, b, c, d, e, f) meaning:  x' = a*x + c*y + e ;  y' = b*x + d*y + f

IDENTITY = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)

NUM = r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?"
TRANSFORM_RE = re.compile(r"(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)")


def _nums(text: str) -> list[float]:
    return [float(n) for n in re.findall(NUM, text)]


def compose(m1: tuple, m2: tuple) -> tuple:
    """Return m1 then m2 applied as parent-then-child (m1 * m2)."""
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return (
        a1 * a2 + c1 * b2,
        b1 * a2 + d1 * b2,
        a1 * c2 + c1 * d2,
        b1 * c2 + d1 * d2,
        a1 * e2 + c1 * f2 + e1,
        b1 * e2 + d1 * f2 + f1,
    )


def parse_transform(text: str | None) -> tuple:
    if not text:
        return IDENTITY
    m = IDENTITY
    for kind, args in TRANSFORM_RE.findall(text):
        v = _nums(args)
        if kind == "matrix" and len(v) >= 6:
            t = tuple(v[:6])
        elif kind == "translate":
            t = (1.0, 0.0, 0.0, 1.0, v[0] if v else 0.0, v[1] if len(v) > 1 else 0.0)
        elif kind == "scale":
            sx = v[0] if v else 1.0
            sy = v[1] if len(v) > 1 else sx
            t = (sx, 0.0, 0.0, sy, 0.0, 0.0)
        elif kind == "rotate" and v:
            ang = math.radians(v[0])
            cos, sin = math.cos(ang), math.sin(ang)
            t = (cos, sin, -sin, cos, 0.0, 0.0)
            if len(v) >= 3:  # rotate about a point
                cx, cy = v[1], v[2]
                t = compose((1, 0, 0, 1, cx, cy), compose(t, (1, 0, 0, 1, -cx, -cy)))
        elif kind == "skewX" and v:
            t = (1.0, 0.0, math.tan(math.radians(v[0])), 1.0, 0.0, 0.0)
        elif kind == "skewY" and v:
            t = (1.0, math.tan(math.radians(v[0])), 0.0, 1.0, 0.0, 0.0)
        else:
            continue
        m = compose(m, t)
    return m


def apply(m: tuple, x: float, y: float) -> tuple[float, float]:
    a, b, c, d, e, f = m
    return (a * x + c * y + e, b * x + d * y + f)


# --- path geometry -----------------------------------------------------------

PATH_TOKEN_RE = re.compile(rf"([MmZzLlHhVvCcSsQqTtAa])|({NUM})")


def path_points(d: str) -> tuple[list[tuple[float, float]], set[str]]:
    """Yield the points that bound a path, plus the command letters used.

    Curve control points are included. A Bezier lies inside the convex hull of
    its control points, so the resulting box is a superset of the true one --
    conservative, which is what region assignment wants. Arc (A) endpoints are
    included but an arc can bulge outside them; flagged via the command set.
    """
    pts: list[tuple[float, float]] = []
    cmds: set[str] = set()
    tokens = PATH_TOKEN_RE.findall(d)

    cx = cy = 0.0
    sx = sy = 0.0
    cmd = ""
    i = 0

    def take(n: int) -> list[float] | None:
        nonlocal i
        vals = []
        while len(vals) < n and i < len(tokens):
            letter, num = tokens[i]
            if letter:
                return None
            vals.append(float(num))
            i += 1
        return vals if len(vals) == n else None

    while i < len(tokens):
        letter, num = tokens[i]
        if letter:
            cmd = letter
            cmds.add(cmd.upper())
            i += 1
            if cmd in "Zz":
                cx, cy = sx, sy
                continue
        elif not cmd:
            i += 1
            continue
        else:
            # implicit repeat; M repeats as L
            if cmd == "M":
                cmd = "L"
            elif cmd == "m":
                cmd = "l"

        rel = cmd.islower()
        c = cmd.upper()

        if c in ("M", "L", "T"):
            v = take(2)
            if v is None:
                break
            x, y = (cx + v[0], cy + v[1]) if rel else (v[0], v[1])
            pts.append((x, y))
            cx, cy = x, y
            if c == "M":
                sx, sy = x, y
        elif c == "H":
            v = take(1)
            if v is None:
                break
            cx = cx + v[0] if rel else v[0]
            pts.append((cx, cy))
        elif c == "V":
            v = take(1)
            if v is None:
                break
            cy = cy + v[0] if rel else v[0]
            pts.append((cx, cy))
        elif c in ("C", "S", "Q"):
            n = {"C": 6, "S": 4, "Q": 4}[c]
            v = take(n)
            if v is None:
                break
            for j in range(0, n, 2):
                px, py = (cx + v[j], cy + v[j + 1]) if rel else (v[j], v[j + 1])
                pts.append((px, py))
            cx, cy = pts[-1]
        elif c == "A":
            v = take(7)
            if v is None:
                break
            x, y = (cx + v[5], cy + v[6]) if rel else (v[5], v[6])
            pts.append((x, y))
            cx, cy = x, y
        else:
            i += 1

    return pts, cmds


def bbox_of(pts: list[tuple[float, float]]) -> tuple[float, float, float, float] | None:
    if not pts:
        return None
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))


# --- walking the tree --------------------------------------------------------

def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


# Subtrees that define reusable content rather than draw it. Their coordinates
# belong to their own systems, so measuring them as page geometry produces
# nonsense (pattern tiles in particular sit at wild offsets). They are still
# counted for the structural report -- just never treated as page content.
NON_RENDERED = {
    "defs", "clipPath", "pattern", "mask", "marker", "symbol",
    "linearGradient", "radialGradient",
}


class Shape:
    __slots__ = ("index", "tag", "bbox", "fill", "stroke", "opacity", "depth",
                 "group_path", "clipped", "cmds", "elem_id")

    def __init__(self, **kw):
        for k, v in kw.items():
            setattr(self, k, v)


def walk(root: ET.Element) -> tuple[list[Shape], dict]:
    shapes: list[Shape] = []

    # <use> references content declared elsewhere (usually in <defs>) and does
    # render, so its geometry counts. Index every id up front so it can be
    # resolved during the walk.
    by_id: dict[str, ET.Element] = {}
    for el in root.iter():
        eid = el.get("id")
        if eid and eid not in by_id:
            by_id[eid] = el

    stats = {
        "tags": Counter(),
        "depths": Counter(),
        "transforms": Counter(),
        "group_ids": [],
        "clip_refs": 0,
        "mask_refs": 0,
        "gradient_defs": Counter(),
        "gradient_fill_refs": 0,
        "texts": [],
        "styles": 0,
        "images": 0,
        "unparsed_paths": 0,
        "arc_paths": 0,
        "use_refs": 0,
        "use_unresolved": 0,
        "pattern_filled": 0,
        "images_in_defs": 0,
    }

    def style_lookup(el: ET.Element, prop: str) -> str | None:
        v = el.get(prop)
        if v:
            return v.strip()
        style = el.get("style")
        if style:
            for decl in style.split(";"):
                if ":" in decl:
                    k, val = decl.split(":", 1)
                    if k.strip() == prop:
                        return val.strip()
        return None

    def recurse(el: ET.Element, matrix: tuple, depth: int, gpath: tuple,
                inherited_fill: str | None, clipped: bool,
                in_defs: bool = False, use_chain: tuple = ()) -> None:
        tag = local(el.tag)
        stats["tags"][tag] += 1
        stats["depths"][depth] += 1

        if tag in NON_RENDERED:
            in_defs = True

        tf = el.get("transform")
        if tf:
            for kind, _ in TRANSFORM_RE.findall(tf):
                stats["transforms"][kind] += 1
            matrix = compose(matrix, parse_transform(tf))

        if el.get("clip-path"):
            stats["clip_refs"] += 1
            clipped = True
        if el.get("mask"):
            stats["mask_refs"] += 1
            clipped = True

        fill = style_lookup(el, "fill") or inherited_fill
        if fill and fill.startswith("url("):
            stats["gradient_fill_refs"] += 1

        if tag in ("linearGradient", "radialGradient"):
            stats["gradient_defs"][tag] += 1
        elif tag == "style":
            stats["styles"] += 1
        elif tag == "image":
            stats["images"] += 1
            if in_defs:
                stats["images_in_defs"] += 1
        elif tag == "text":
            content = "".join(el.itertext()).strip()
            if content:
                stats["texts"].append(content)

        if tag == "g":
            gid = el.get("id") or el.get("{http://www.inkscape.org/namespaces/inkscape}label")
            if gid:
                stats["group_ids"].append(gid)
            gpath = gpath + (gid or "g",)

        pts: list[tuple[float, float]] = []
        cmds: set[str] = set()
        if tag == "path":
            d = el.get("d")
            if d:
                pts, cmds = path_points(d)
                if not pts:
                    stats["unparsed_paths"] += 1
                if "A" in cmds:
                    stats["arc_paths"] += 1
        elif tag == "rect":
            try:
                x, y = float(el.get("x", 0)), float(el.get("y", 0))
                w, h = float(el.get("width", 0)), float(el.get("height", 0))
                pts = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
            except ValueError:
                pass
        elif tag in ("circle", "ellipse"):
            try:
                cxv, cyv = float(el.get("cx", 0)), float(el.get("cy", 0))
                if tag == "circle":
                    rx = ry = float(el.get("r", 0))
                else:
                    rx, ry = float(el.get("rx", 0)), float(el.get("ry", 0))
                pts = [(cxv - rx, cyv - ry), (cxv + rx, cyv + ry)]
            except ValueError:
                pass
        elif tag in ("polygon", "polyline"):
            v = _nums(el.get("points", ""))
            pts = list(zip(v[0::2], v[1::2]))
        elif tag == "line":
            try:
                pts = [(float(el.get("x1", 0)), float(el.get("y1", 0))),
                       (float(el.get("x2", 0)), float(el.get("y2", 0)))]
            except ValueError:
                pass

        if pts and not in_defs:
            tp = [apply(matrix, x, y) for x, y in pts]
            bb = bbox_of(tp)
            if bb:
                shapes.append(Shape(
                    index=len(shapes), tag=tag, bbox=bb,
                    fill=(fill or "").lower(), stroke=(style_lookup(el, "stroke") or "").lower(),
                    opacity=style_lookup(el, "opacity") or style_lookup(el, "fill-opacity"),
                    depth=depth, group_path=gpath, clipped=clipped, cmds=cmds,
                    elem_id=el.get("id") or "",
                ))

        # <use> draws a copy of another element, so its geometry is page
        # geometry even though the target usually lives in <defs>.
        if tag == "use" and not in_defs:
            stats["use_refs"] += 1
            href = el.get("href") or el.get(f"{{{XLINK_NS}}}href") or ""
            target = by_id.get(href.lstrip("#")) if href.startswith("#") else None
            if target is None or href in use_chain:
                stats["use_unresolved"] += 1
            else:
                ux, uy = float(el.get("x", 0) or 0), float(el.get("y", 0) or 0)
                m = compose(matrix, (1.0, 0.0, 0.0, 1.0, ux, uy)) if (ux or uy) else matrix
                recurse(target, m, depth + 1, gpath, fill, clipped,
                        in_defs=False, use_chain=use_chain + (href,))

        for child in el:
            recurse(child, matrix, depth + 1, gpath, fill, clipped, in_defs, use_chain)

    recurse(root, IDENTITY, 0, (), None, False)
    return shapes, stats


# --- region clustering -------------------------------------------------------

def cluster(shapes: list[Shape], pad_ratio: float = 0.012) -> list[dict]:
    """Union-find over bounding boxes that overlap once padded. Illustrations
    on a page are separated by whitespace, so their shapes form connected
    components."""
    if not shapes:
        return []
    xs0 = min(s.bbox[0] for s in shapes)
    ys0 = min(s.bbox[1] for s in shapes)
    xs1 = max(s.bbox[2] for s in shapes)
    ys1 = max(s.bbox[3] for s in shapes)
    pad = max(xs1 - xs0, ys1 - ys0) * pad_ratio

    parent = list(range(len(shapes)))

    def find(a: int) -> int:
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    def union(a: int, b: int) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    # Sweep by x to avoid an O(n^2) blow-up on 4k paths.
    order = sorted(range(len(shapes)), key=lambda i: shapes[i].bbox[0])
    active: list[int] = []
    for i in order:
        bi = shapes[i].bbox
        active = [j for j in active if shapes[j].bbox[2] + pad >= bi[0]]
        for j in active:
            bj = shapes[j].bbox
            if (bi[0] - pad <= bj[2] and bj[0] - pad <= bi[2]
                    and bi[1] - pad <= bj[3] and bj[1] - pad <= bi[3]):
                union(i, j)
        active.append(i)

    groups: dict[int, list[int]] = defaultdict(list)
    for i in range(len(shapes)):
        groups[find(i)].append(i)

    regions = []
    for members in groups.values():
        bs = [shapes[i].bbox for i in members]
        regions.append({
            "x": round(min(b[0] for b in bs), 3),
            "y": round(min(b[1] for b in bs), 3),
            "x2": round(max(b[2] for b in bs), 3),
            "y2": round(max(b[3] for b in bs), 3),
            "path_count": len(members),
        })
    for r in regions:
        r["w"] = round(r["x2"] - r["x"], 3)
        r["h"] = round(r["y2"] - r["y"], 3)
    regions.sort(key=lambda r: r["path_count"], reverse=True)
    return regions


def occupancy_map(shapes: list[Shape], cols: int = 78, rows: int = 40) -> str:
    if not shapes:
        return "(no shapes)"
    x0 = min(s.bbox[0] for s in shapes)
    y0 = min(s.bbox[1] for s in shapes)
    x1 = max(s.bbox[2] for s in shapes)
    y1 = max(s.bbox[3] for s in shapes)
    w, h = max(x1 - x0, 1e-9), max(y1 - y0, 1e-9)
    grid = [[0] * cols for _ in range(rows)]
    for s in shapes:
        a = int((s.bbox[0] - x0) / w * (cols - 1))
        b = int((s.bbox[2] - x0) / w * (cols - 1))
        c = int((s.bbox[1] - y0) / h * (rows - 1))
        d = int((s.bbox[3] - y0) / h * (rows - 1))
        for r in range(max(c, 0), min(d, rows - 1) + 1):
            for col in range(max(a, 0), min(b, cols - 1) + 1):
                grid[r][col] += 1
    ramp = " .:-=+*#%@"
    peak = max(max(r) for r in grid) or 1
    return "\n".join(
        "".join(ramp[min(int(v / peak * (len(ramp) - 1)), len(ramp) - 1)] for v in row)
        for row in grid
    )


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    if not args:
        print(__doc__)
        return 2
    path = Path(args[0])
    if not path.exists():
        print(f"FATAL: {path} not found.", file=sys.stderr)
        print("Stage 1 needs assets/page2-full.svg -- see assets/README.md.", file=sys.stderr)
        return 2

    root = ET.parse(path).getroot()
    shapes, st = walk(root)

    print(f"=== {path} ({path.stat().st_size / 1024:.0f} KB) ===")
    print(f"root: viewBox={root.get('viewBox')!r} width={root.get('width')!r} "
          f"height={root.get('height')!r}")
    print()

    print("--- elements ---")
    for tag, n in st["tags"].most_common(20):
        print(f"  {tag:16} {n}")
    print(f"  drawable shapes measured: {len(shapes)}")
    if st["unparsed_paths"]:
        print(f"  !! {st['unparsed_paths']} path(s) produced no points -- check the parser")
    print()

    print("--- nesting ---")
    print(f"  max depth: {max(st['depths']) if st['depths'] else 0}")
    depths = sorted(st["depths"].items())
    print("  " + "  ".join(f"d{d}:{n}" for d, n in depths[:14]))
    ids = st["group_ids"]
    print(f"  <g> with an id/label: {len(ids)}")
    if ids:
        print("  NOTE: named groups exist. If these name parts, clustering may be")
        print("        unnecessary -- inspect before writing the extractor.")
        for gid in ids[:25]:
            print(f"        - {gid}")
    print()

    print("--- transforms / clipping ---")
    if st["transforms"]:
        for kind, n in st["transforms"].most_common():
            print(f"  {kind:12} {n}")
        print("  -> bounding boxes MUST be computed through the matrix stack.")
    else:
        print("  none -- path coordinates are page coordinates.")
    print(f"  clip-path refs: {st['clip_refs']}   mask refs: {st['mask_refs']}")
    if st["clip_refs"] or st["mask_refs"]:
        print("  -> geometric bboxes may overstate visible extent.")
    if st["arc_paths"]:
        print(f"  arc (A) commands in {st['arc_paths']} path(s) -- bboxes approximate there.")
    print()

    print("--- fills ---")
    fills = Counter(s.fill for s in shapes if s.fill)
    print(f"  distinct fill values: {len(fills)}")
    for val, n in fills.most_common(25):
        print(f"  {val:28} {n}")
    grad = sum(st["gradient_defs"].values())
    patterns = st["tags"].get("pattern", 0)
    print(f"  gradient defs: {grad}   pattern defs: {patterns}")
    print(f"  shapes filled by url() reference: {st['gradient_fill_refs']}")
    if grad:
        print("  -> some shading is gradient-based; recolour flat base fills only")
        print("     and leave gradient shapes untouched (CLAUDE.md).")
    if patterns:
        print("  -> !! PATTERN fills present. If those patterns contain <image>")
        print("     tiles, the areas they cover are RASTER and cannot be recoloured")
        print("     by changing a fill. Those parts need a different treatment.")
    translucent = [s for s in shapes if s.opacity and s.opacity not in ("1", "1.0")]
    print(f"  shapes with opacity < 1: {len(translucent)} (likely shading overlays)")
    print()

    print("--- indirection ---")
    print(f"  <use> on the page: {st['use_refs']} "
          f"({st['use_unresolved']} unresolved)")
    print(f"  clipPath defs: {st['tags'].get('clipPath', 0)}")
    print()

    print("--- text (to be stripped: prices and labels) ---")
    print(f"  {len(st['texts'])} text node(s)")
    for t in st["texts"][:40]:
        print(f"    {t!r}")
    if not st["texts"]:
        print("  none -- text was flattened to outlines on export (text_as_path=True).")
        print("  The price/model labels are now ordinary paths and cannot be stripped")
        print("  by element type. Re-export with text_as_path=False to strip them cleanly.")
    if st["images"]:
        page_images = st["images"] - st["images_in_defs"]
        print(f"  !! {st['images']} <image> element(s): {st['images_in_defs']} inside "
              f"pattern/defs, {page_images} drawn directly")
        if st["images_in_defs"]:
            print("     The in-defs ones are rasterised texture tiles -- see fills above.")
    print()

    regions = cluster(shapes)
    print("--- candidate regions (connected components) ---")
    print(f"  {len(regions)} component(s); the brief expects 7 illustrations")
    for i, r in enumerate(regions[:14]):
        print(f"  [{i}] x={r['x']:9.2f} y={r['y']:9.2f} w={r['w']:8.2f} h={r['h']:8.2f} "
              f"paths={r['path_count']}")
    if len(regions) > 7:
        print(f"  ({len(regions) - 14 if len(regions) > 14 else 0} more not shown; small")
        print("   components are usually stray text or rules -- raise --pad to merge)")
    print()

    print("--- occupancy map ---")
    print(occupancy_map(shapes))
    print()

    if "--emit-regions" in flags:
        out = path.parent / "regions.candidate.json"
        payload = {
            "_comment": (
                "First-pass regions from connected-component clustering of path "
                "bounding boxes. Correct by hand, then rename to regions.json. "
                "Note PEO-39C and PEO-40C share one drawing."
            ),
            "source": path.name,
            "regions": regions[:20],
        }
        out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {out}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
