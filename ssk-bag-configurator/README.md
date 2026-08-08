# SSK Bag Configurator

## Setup

```bash
pip install pymupdf
python scripts/extract_page2.py
```

This generates `assets/` from `source/SSK_Custom_Bags.pdf`. Nothing in `assets/` is
committed — it is all reproducible output.

Expected report: **4,233 vector paths, 0 raster images** on page 2.

## Layout

| Path | What |
|---|---|
| `CLAUDE.md` | Project context and domain rules. Read first. |
| `KICKOFF.md` | Staged build brief. |
| `data/ssk-bags.json` | Single source of truth. Never hardcode a price or rule. |
| `scripts/extract_page2.py` | Regenerates all artwork from the source PDF. |
| `scripts/inspect_svg.py` | Structure probe for the generated SVG. Run before writing the extractor. |
| `scripts/validate_data.py` | Integrity check for `data/ssk-bags.json`. |
| `source/` | SSK Europe PDFs. Gitignored (17 MB). |
| `assets/` | Generated. Gitignored. |

## Status

**Stage 0 is blocked on one file: `source/SSK_Custom_Bags.pdf`.**

`extract_page2.py` and `pymupdf` are both in place, and the pipeline is verified
working — run against a synthetic multi-page fixture it produced `page2-full.svg`,
all seven `preview_*.png` crops and `regions.json`, and its low-path-count guard
fired correctly. The source PDF is gitignored, so it is not in the clone and has
to be supplied before Stage 1 can begin.

Stages 1–3 are not started; the brief says to stop after each for review.

## Before the extractor is written

```bash
python3 scripts/inspect_svg.py assets/page2-full.svg
```

How the extractor must work depends on what CorelDRAW emitted, and this answers it:

- **Are the `<g>` groups already named?** If Corel exported per-part groups, Stage 1
  collapses from clustering to renaming. This is the first thing to check, and the
  reason the `.cdr` is worth requesting in parallel — both `CLAUDE.md` and the JSON's
  own `meta.TODO` already flag it.
- **Ancestor transforms?** Then path coordinates are not page coordinates and every
  bounding box must be computed through the matrix stack.
- **Clip paths or masks?** Those make a raw geometric bbox overstate visible extent.
- **Flat fills or gradient references, and what carries the shading?** `CLAUDE.md`
  requires highlights and shadows survive recolouring, so the base-fill vs overlay
  split has to be readable before a recolouring strategy is chosen.

Stdlib only. Verified against a fixture covering nested groups, `translate`/`matrix`
ancestors, relative path commands, arcs, gradient fills, opacity overlays and label text.

## Validating the data

`ssk-bags.json` is hand-edited whenever SSK reprices (annually — the catalogue carries
新価格 stickers). This guards those edits:

```bash
python3 scripts/validate_data.py
```

Stdlib only. Exits non-zero on an ERROR. It currently reports **0 errors**. It checks
that every colour, palette, material and chart reference resolves; that each model's
part list matches its chart **in the chart's own letter order** (the order string
depends on it, and the charts disagree on what the letters mean); that `applies_to`
agrees with each model's `chart`; that every `stock_twin.delta_eur` equals custom minus
stock (all 12 agree); that locked parts resolve to a single-colour palette; that
catalogue sample colourways are buildable; and that the documented `order_string.example`
still validates against the live charts and palettes.

## Findings worth a decision

Non-blocking, but they shape Stage 2.

1. **Nine colour rules exist only as English prose** in per-model `exceptions[]` — e.g.
   *"PEO-56B belt is BLACK ONLY"*, *"PEO-38C shoulder pad and handle are always the same
   colour as the body"*. `CLAUDE.md` says never hardcode a rule in a component, but as
   written these cannot be enforced from data: a component would have to hardcode them or
   parse English. They need machine-readable equivalents (a `part_overrides` block, say).
   **Neither `PEO-50B` nor `PEO-44B` is affected**, so this gates model three, not the demo.

2. **`extract_page2.py` exports text as outlines.** `get_svg_image()` defaults to
   `text_as_path=True`, so the price and model labels become ordinary paths. Stage 1 has to
   strip that text, and once it is flattened it is indistinguishable from artwork. Passing
   `text_as_path=False` keeps them as `<text>` and makes stripping trivial — worth changing
   unless the outlines are wanted for fidelity.

3. **Adjacent regions overlap slightly** — `PEO-52B` ends at x=0.255 while `PEO-50B` starts
   at 0.245, and `PEO-39C_40C`/`PEO-37C` overlap similarly. Fine for preview crops, but the
   extractor must not assign a path to a model on bbox intersection alone or paths in the
   overlap band land in two bags. Assign by centroid, or by best-overlap-wins.

4. **The kickoff's "+€53 for your club's colours" is `PEO-50B`'s delta.** `PEO-44B` is
   **+€70**. The comparison copy has to read `delta_eur`.

5. **Four catalogue sample colourways are unbuildable in leather** — `PEO-39C`/`PEO-40C`
   body red, `PEO-38C` body purple, `PEO-37C` belt green. Correct as records of the printed
   catalogue (which shows enamel), and good fixtures for the material re-validation path.

6. **The glove configurator is raster, not vector.** `ssk-glove-demo` composites `.webp`
   layers; the bags are SVG path recolouring. A shared `PartColorizer` has to abstract over
   both — a real constraint on that interface before Stage 2.

Two open questions for Pim, both already flagged in the data: whether locked zippers print
as `H:90(fixed)` or are omitted (`order_string.rules`), and whether embroidery is per bag or
per order (`embroidery.confirmed` is `false`).
