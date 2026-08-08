#!/usr/bin/env python3
"""
Extract the vector bag artwork from SSK Europe's custom-bags PDF.

Page 2 of "SSK Custom Bags.cdr" (exported to PDF from CorelDRAW 2019) is pure
vector: ~4,200 path objects, zero raster images. Seven bag illustrations live
there and can be recoloured per part.

This script regenerates every derived asset. Nothing in assets/ is committed by
hand -- run this and you get identical output.

Usage:
    python scripts/extract_page2.py
    python scripts/extract_page2.py --pdf path/to/SSK_Custom_Bags.pdf

Requires: pymupdf
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import pymupdf
except ImportError:
    sys.exit("pymupdf not installed.  pip install pymupdf")


# Page index (0-based) of the vector artwork page.
VECTOR_PAGE = 1

# Approximate bag regions on page 2, as fractions of the page box.
# Verified visually against 60dpi renders -- adjust here if framing drifts.
REGIONS = {
    "PEO-52B":     (0.005, 0.08, 0.255, 0.52),
    "PEO-50B":     (0.245, 0.08, 0.475, 0.52),
    "PEO-45B":     (0.455, 0.08, 0.720, 0.50),
    "PEO-44B":     (0.700, 0.08, 0.995, 0.52),
    "PEO-39C_40C": (0.000, 0.50, 0.360, 0.95),
    "PEO-37C":     (0.345, 0.50, 0.760, 0.98),
    "PEO-38C":     (0.745, 0.48, 0.995, 0.95),
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", default="source/SSK_Custom_Bags.pdf",
                    help="path to the SSK Europe custom-bags PDF")
    ap.add_argument("--out", default="assets", help="output directory")
    ap.add_argument("--scale", type=float, default=2.0,
                    help="SVG export scale factor")
    args = ap.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        sys.exit(
            f"Source PDF not found: {pdf_path}\n"
            "Put SSK Europe's custom-bags PDF there, or pass --pdf."
        )

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    doc = pymupdf.open(pdf_path)
    if len(doc) <= VECTOR_PAGE:
        sys.exit(f"PDF has {len(doc)} page(s); expected the artwork on page {VECTOR_PAGE + 1}.")

    page = doc[VECTOR_PAGE]
    drawings = page.get_drawings()
    rasters = page.get_images()

    print(f"Source      : {pdf_path}  ({doc.metadata.get('creator', 'unknown creator')})")
    print(f"Page {VECTOR_PAGE + 1}      : {len(drawings)} vector paths, {len(rasters)} raster images")

    # Guard: if this page ever stops being pure vector, the whole approach breaks.
    # Fail loudly rather than silently producing unusable assets.
    if rasters:
        print(f"\n  WARNING: page {VECTOR_PAGE + 1} contains {len(rasters)} raster image(s).")
        print("  This page is supposed to be pure vector. The PDF may have been")
        print("  re-exported differently. Check before trusting the output.\n")
    if len(drawings) < 1000:
        print(f"\n  WARNING: only {len(drawings)} vector paths found; expected ~4,200.")
        print("  Wrong page, or a flattened re-export.\n")

    # Full-page SVG -- the input for part clustering.
    svg = page.get_svg_image(matrix=pymupdf.Matrix(args.scale, args.scale))
    svg_path = out / "page2-full.svg"
    svg_path.write_text(svg)
    print(f"\nwrote {svg_path}  ({len(svg) / 1_000_000:.1f} MB)")

    # Per-model region previews, for verifying the crop boxes by eye.
    W, H = page.rect.width, page.rect.height
    manifest = {}
    for name, (x0, y0, x1, y1) in REGIONS.items():
        clip = pymupdf.Rect(x0 * W, y0 * H, x1 * W, y1 * H)
        pix = page.get_pixmap(clip=clip, matrix=pymupdf.Matrix(1.4, 1.4))
        preview = out / f"preview_{name}.png"
        pix.save(preview)
        manifest[name] = {
            "clip_fraction": [x0, y0, x1, y1],
            "clip_pts": [round(v, 1) for v in (clip.x0, clip.y0, clip.x1, clip.y1)],
            "preview": preview.name,
        }
        print(f"wrote {preview}")

    regions_path = out / "regions.json"
    regions_path.write_text(json.dumps(manifest, indent=2))
    print(f"wrote {regions_path}")

    print(f"\nDone. {len(REGIONS)} model regions extracted.")
    print("Models WITHOUT vector art (raster line diagrams only, pages 3-4):")
    print("  PEO-51B, 42B, 43B, 46B, 53B, 54B, 55B, 56B")
    print("  -> do not fabricate these; get the .cdr source from SSK Europe.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
