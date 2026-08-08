# Kickoff prompt — paste into Claude Code

> Read `CLAUDE.md` first. It has the domain rules and they are not optional —
> particularly the part-letter difference between charts.

---

I'm building a visual configurator for SSK PROEDGE custom baseball bags. Everything you
need is in this repo: `CLAUDE.md` for context and domain rules, `data/ssk-bags.json` as the
single source of truth, and `assets/page2-full.svg` for artwork.

Work in three stages and **stop after each for my review**. Don't run ahead.

## Stage 1 — Asset extraction

`assets/page2-full.svg` is a full-page SVG extracted from SSK's own CorelDRAW file. It
contains seven bag illustrations as native vector paths (no raster). I need them split
apart and their parts identified.

Write `scripts/extract_parts.py` that:

1. Splits the page SVG into seven per-model SVGs using the bounding boxes in
   `assets/regions.json` as a starting point. Trim each to its own tight viewBox and strip
   the price/label text — I want the bag artwork only.
2. For `PEO-50B` and `PEO-44B`, clusters the paths into named bag parts. Cluster by fill
   colour plus spatial position, then assign to part IDs from that model's chart in the
   JSON. Emit `assets/parts-map.json` mapping `part_id -> [path indices]`.
3. Writes `assets/{MODEL}.svg` with `data-part="A"` etc. on each path or group, so the
   front end can recolour by CSS selector.

The clustering will not be perfect and I don't expect it to be. Generate an HTML review
page — each part swatched in a garish distinct colour, part ID labelled — so I can see at a
glance what's mis-assigned and correct it by hand. **Ship the review tool, not a guess.**

Preserve highlights and shadows. The artwork has gradients and specular detail that make
these look like real bags; if recolouring flattens them the demo dies. Consider recolouring
base fills only and leaving overlay/shading paths untouched.

Stop. Show me the review page.

## Stage 2 — The configurator

Single-page app, mobile-first, self-contained static bundle, embeddable in an iframe.

Screen flow:

1. **Model picker.** Only `PEO-50B` and `PEO-44B` are live; show the others greyed with
   "coming soon". For each live model show the stock-vs-custom comparison from the JSON —
   stock price, custom price, and the delta framed as *"+€53 for your club's colours"*.
   This comparison is the conversion moment; give it real estate.
2. **Material picker.** E / S / P with texture and description from the JSON. State plainly
   that material does not change the price.
3. **Part colouring.** The bag SVG large and central. Tapping a part selects it; tapping a
   swatch colours it. Also a part list so nothing is undiscoverable on a small screen.
   Locked parts (zipper) render visibly locked with the reason. Piping shows its extended
   accent palette including gold — call that out, it's the part that sells.
4. **Summary.** Rendered bag, spec, price, embroidery add-ons, lead time, and the order
   string with a copy button.

Requirements:

- Every price, colour, dimension and rule reads from `ssk-bags.json`. Nothing hardcoded.
- Enforce every rule in `CLAUDE.md`'s domain section.
- On material change, re-validate all parts. If a chosen colour is unavailable in the new
  material, tell the user what changed and what it became — never silently reset.
- Build `PartColorizer` as a standalone module with a product-schema interface. It will be
  reused by the glove configurator, so keep it free of bag-specific assumptions.
- No build-time dependency on a specific site framework.

Stop. I'll review in a browser.

## Stage 3 — Order output and polish

- Order string exactly per `order_string` in the JSON, copy-to-clipboard.
- A shareable state URL so a player can send their design to a teammate or to me.
- PNG export of the configured bag for WhatsApp.
- Preset colourways for known clubs as a starting point — Nettuno, Amsterdam Pirates, the
  Dutch national team — so the tool opens on something that looks finished rather than a
  blank grey bag.

## Notes

- Ask me before adding a dependency.
- If part clustering turns out to be genuinely unreliable rather than just imperfect, say
  so early and we'll get the `.cdr` source from Pim instead of grinding at it.
- Hex values in the JSON are eyeballed from print and are approximate. Keep them in one
  place so they can be corrected in a single edit once I check physical swatches.
