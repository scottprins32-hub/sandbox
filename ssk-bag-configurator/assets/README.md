# assets/ — what belongs here, and what is missing

Stage 1 of the kickoff (asset extraction) has **not started**, because its only
input is not in this repository and was not supplied with the brief.

## Missing — Stage 1 cannot begin without these

| File | Referenced by | Status |
|---|---|---|
| `page2-full.svg` | KICKOFF Stage 1 §1, CLAUDE.md "Assets" | **not supplied** |
| `regions.json` | KICKOFF Stage 1 §1 (per-model bounding boxes) | **not supplied** |

Both were searched for and are absent from:

- every commit on every branch of `scottprins32-hub/sandbox`
- `scottprins32-hub/demo-assets` (contains two unrelated `.avif` hero images)
- `scottprins32-hub/ssk-glove-demo` (glove artwork only — `.webp` raster layers)
- the files attached to the kickoff (`KICKOFF.md`, `ssk-bags.json`, `CLAUDE.md`)

## Why this was not worked around

CLAUDE.md is explicit that the nine models without vector source are to be left
alone — *"Do not fake them."* Generating stand-in bag artwork would break that
rule and would make the Stage 1 review page meaningless: the whole deliverable
is a tool for eyeballing which real paths landed in which part, and there are no
real paths to eyeball.

Equally, `extract_parts.py` was not written blind. The clustering step keys on
fill colour and spatial position of the actual paths, and CorelDRAW SVG exports
vary enormously in how they nest groups, apply transforms and emit clip paths —
which of those the file uses determines how bounding boxes must be computed. A
script written against a guessed structure is the guess the kickoff rules out:
*"Ship the review tool, not a guess."*

## What is needed, and in what form

**Preferred: the source `.cdr`.** Both CLAUDE.md and `ssk-bags.json`'s own
`meta.TODO` already flag this — *"paths are likely already grouped per part,
which would make part-mapping nearly free."* If Pim's CorelDRAW file has named
or grouped objects, Stage 1 collapses from a clustering problem to a naming
problem, and the review page becomes a confirmation rather than a correction
exercise. This is worth one message to Pim before any clustering work is done.

**Otherwise: `page2-full.svg` as described** — the full page, 4,233 path
objects, pure vector, seven bag illustrations.

`regions.json` is a convenience, not a blocker: if it does not exist, the
extractor can derive candidate regions by connected-component clustering of path
bounding boxes and emit a first-pass `regions.json` for correction by hand.

## A mapping detail the extractor must handle

Eight models carry `vector_art: "page2"` in `ssk-bags.json`:

    PEO-52B  PEO-50B  PEO-44B  PEO-45B  PEO-39C  PEO-40C  PEO-38C  PEO-37C

but CLAUDE.md and the kickoff both describe **seven** illustrations. `PEO-39C`
(10 bats) and `PEO-40C` (5 bats) are the two sizes of the same self-standing bat
case and share one drawing. So `regions.json` maps 7 regions onto 8 models, and
the region → model relationship is one-to-many. `scripts/validate_data.py`
reports this.

Neither of the two models the build actually targets — `PEO-50B` and `PEO-44B` —
is affected by that, so it does not gate the demo.
