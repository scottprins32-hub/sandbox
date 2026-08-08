# SSK Bag Configurator

Visual configurator for SSK PROEDGE custom baseball bags. See `CLAUDE.md` for
domain rules and `KICKOFF.md` for the three-stage brief.

## Status

**Stage 1 (asset extraction) is blocked.** Its only input, `assets/page2-full.svg`,
was not supplied and is not in any accessible repository. See
[`assets/README.md`](assets/README.md) for what was searched and what is needed.

Nothing in Stage 2 or Stage 3 has been started — the brief says to stop after
each stage for review.

| Stage | State |
|---|---|
| 1 — asset extraction, part clustering, review page | blocked on `page2-full.svg` |
| 2 — configurator UI, `PartColorizer` | not started (awaiting Stage 1 review) |
| 3 — order string, share URL, PNG export, presets | not started |

## What is here

```
CLAUDE.md                  domain rules — read before touching colour logic
KICKOFF.md                 the three-stage brief
data/ssk-bags.json         single source of truth (16 custom, 35 stock models)
scripts/validate_data.py   integrity check for the above
scripts/inspect_svg.py     structure probe — run this on the artwork first
assets/README.md           the missing-artwork situation, in detail
```

## First step once the artwork lands

```bash
python3 scripts/inspect_svg.py assets/page2-full.svg --emit-regions
```

The extractor cannot be written responsibly before this runs, because how it
must work depends on what Corel emitted. The probe answers:

- **Are the groups already named?** If Corel exported per-part groups, Stage 1
  collapses from clustering to renaming. This is the single question worth
  asking first, and it is why the `.cdr` is worth requesting in parallel.
- **Are there ancestor transforms?** Then path `d` coordinates are not page
  coordinates and every bounding box must go through the matrix stack.
- **Clip paths or masks?** Those make a raw geometric bbox overstate the
  visible extent.
- **Flat fills or gradient references, and what carries the shading?** CLAUDE.md
  requires highlights and shadows survive recolouring, so the base-fill vs
  overlay split has to be readable from the fill data before any recolouring
  strategy is chosen.
- **Where is content on the page?** An occupancy map plus connected-component
  clustering gives first-pass region boxes; `--emit-regions` writes them to
  `assets/regions.candidate.json` for correction by hand.

Stdlib only. Verified against a synthetic Corel-shaped fixture covering nested
groups, `translate`/`matrix` ancestors, relative path commands, arcs, gradient
fills, opacity overlays and label text.

## Validating the data

`ssk-bags.json` is hand-edited whenever SSK reprices (annually — the catalogue
carries 新価格 stickers). This guards those edits:

```bash
python3 scripts/validate_data.py
```

Stdlib only, no dependencies. Exits non-zero on an ERROR; WARNs and NOTEs are
informational. It currently reports **0 errors** — the data is internally
consistent. It checks:

- every colour, palette, material and chart reference resolves
- each model's part list matches its chart, **in the chart's own letter order**
  (the order string depends on that order, and the two charts disagree on what
  the letters mean — backpack `E`=piping/`F`=zipper vs shoulder `F`=piping/`H`=zipper)
- `applies_to` on each chart agrees with each model's `chart` field
- every `stock_twin.delta_eur` equals custom price − stock price (all 12 agree)
- locked parts resolve to a single-colour palette
- catalogue sample colourways are buildable in the materials the model offers
- the documented `order_string.example` validates against the live charts and palettes

## Findings worth a decision

Non-blocking, but they shape Stage 2. Full detail in the validator output.

1. **Nine colour rules exist only as English prose** in per-model `exceptions[]`
   — e.g. *"PEO-56B belt is BLACK ONLY"*, *"PEO-38C shoulder pad and handle are
   always the same colour as the body"*. CLAUDE.md says never hardcode a rule in
   a component, but these cannot be enforced from data as written: a component
   would have to hardcode them or parse English. They need machine-readable
   equivalents (a `part_overrides` block, say) before the models that carry them
   go live. **Neither `PEO-50B` nor `PEO-44B` is affected**, so this does not
   gate the demo — it gates model three.

2. **Four catalogue sample colourways are unbuildable in leather** — `PEO-39C`
   and `PEO-40C` body red, `PEO-38C` body purple, `PEO-37C` belt green. These
   are correct as records of the printed catalogue (which shows enamel), and
   they make good fixtures for the material re-validation path.

3. **The kickoff's "+€53 for your club's colours" is `PEO-50B`'s delta.**
   `PEO-44B` is **+€70**. The comparison copy has to read `delta_eur`, not the
   figure in the brief.

4. **Two open questions block a correct order string**, both already flagged in
   the data: whether locked zippers appear as `H:90(fixed)` or are omitted
   (`order_string.rules`), and whether embroidery is priced per bag or per order
   (`embroidery.confirmed` is `false`). The configurator needs a default for the
   first and a "provisional" label on the second.
