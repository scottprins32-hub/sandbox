# QR codes on printed artefacts

Read this before placing a code on anything that gets printed. The four decisions are payload, error
correction, physical size and quiet zone, and they are coupled: each one changes the others.

## 1. Capacity — payload and EC level together set the grid

Version 1 is 21 × 21 modules; each version adds 4 modules per side, so version *v* is `21 + 4(v−1)` modules.
Maximum characters, from the ISO/IEC 18004 capacity tables:

| Ver | Modules | Numeric L/M/Q/H | Alphanumeric L/M/Q/H | Byte L/M/Q/H |
|---|---|---|---|---|
| 1 | 21 | 41 / 34 / 27 / 17 | 25 / 20 / 16 / 10 | 17 / 14 / 11 / 7 |
| 2 | 25 | 77 / 63 / 48 / 34 | 47 / 38 / 29 / 20 | 32 / 26 / 20 / 14 |
| 3 | 29 | 127 / 101 / 77 / 58 | 77 / 61 / 47 / 35 | 53 / 42 / 32 / 24 |
| 4 | 33 | 187 / 149 / 111 / 82 | 114 / 90 / 67 / 50 | 78 / 62 / 46 / 34 |
| 5 | 37 | 255 / 202 / 144 / 106 | 154 / 122 / 87 / 64 | 106 / 84 / 60 / 44 |
| 6 | 41 | 322 / 255 / 178 / 139 | 195 / 154 / 108 / 84 | 134 / 106 / 74 / 58 |
| 7 | 45 | 370 / 293 / 207 / 154 | 224 / 178 / 125 / 93 | 154 / 122 / 86 / 64 |
| 8 | 49 | 461 / 365 / 259 / 202 | 279 / 221 / 157 / 122 | 192 / 152 / 108 / 84 |
| 9 | 53 | 552 / 432 / 312 / 235 | 335 / 262 / 189 / 154 | 230 / 180 / 130 / 98 |
| 10 | 57 | 652 / 513 / 364 / 288 | 395 / 311 / 221 / 174 | 271 / 213 / 151 / 119 |

Bits per character: numeric 3.33, alphanumeric 5.5, byte 8. Alphanumeric mode covers **only** `0–9`, `A–Z`
uppercase, space and `$ % * + - . / :` — no lowercase, no `?`, `=`, `&`, `_` or `~`.

**Read the table to understand the coupling, then compute the real number with your encoder.** Encoders
segment the payload into mixed modes, so a string that looks like 25 byte characters may encode partly as
alphanumeric and land a version lower than the table suggests — or a single added query parameter may push it
a version higher, shrinking every module at a fixed physical size.

**The uppercase trick, with its actual value.** A URL written entirely in the alphanumeric set fits in fewer
bits. For a 25-character URL at EC-H: byte mode needs version 4 (33 modules), alphanumeric needs version 3
(29 modules). At a fixed 50 mm code that is 1.52 mm per module versus 1.72 mm — **14% larger modules for
free**. It only works if the host is case-insensitive (always) *and* the path is (usually not, by default) —
so it is a server decision before it is a print decision, and it costs you a URL that looks like shouting when
printed underneath. Take it for asset labels and small codes; usually skip it for a URL humans read.

## 2. Physical size

```
code width (mm)  = scan distance (mm) / 10          ← 10:1 rule of thumb
X-dimension (mm) = code width / module count
quiet zone (mm)  = 4 × X-dimension, on all four sides
total block (mm) = code width + 8 × X-dimension
```

The X-dimension is the number that decides whether it scans. Floors:

- **0.5 mm** — practical floor for a phone camera, and this file's engineering judgement rather than a
  published figure. For scale, GS1 specifies 0.396–0.990 mm with a 0.495 mm target for retail point-of-sale
  scanning — a different optical setup from a phone camera.
- **1.0 mm** — what to aim for on anything that will be dirty, curled, faded, laminated, photocopied or read
  in poor light.

The 10:1 rule is industry convention with no published derivation. It is a starting point; the acceptance
test is §5.

**Worked sizes for a 25-character URL:**

| Artefact | Distance | EC | Grid | Code | X-dim | Quiet | Reserve |
|---|---|---|---|---|---|---|---|
| Card in the hand | 300 mm | M | 25 | 30 mm | 1.20 mm | 4.8 mm | 39.6 mm |
| Card in the hand, durable | 300 mm | Q | 29 | 30 mm | 1.03 mm | 4.1 mm | 38.3 mm |
| A4 sheet, secondary code | 400 mm | Q | 29 | 40 mm | 1.38 mm | 5.5 mm | 51.0 mm |
| Notice board, walk-up | 500 mm | H | 33 | 50 mm | 1.52 mm | 6.1 mm | 62.1 mm |
| Asset label, close scan | 200 mm | H | 33 | 20 mm | 0.61 mm | 2.4 mm | 24.8 mm |

**Reserve the block, not the code.** A 30 mm code on an A6 card with 9 mm margins occupies 39.6 mm of an
87 mm content width — 46%. A 50 mm code on A4 with 18 mm margins occupies 62 mm of 174 mm — 36%. These are
layout-defining, and they have to be in the composition from the first sketch, not squeezed in at the end.

**The floor almost never binds on a wall or a card** — the scan distance dominates. It binds on labels, asset
tags and anything printed at 20 mm or below, which is where the arithmetic actually needs doing.

## 3. Error correction

| Level | Recovers | Use for |
|---|---|---|
| L | ~7% | Screen, email, a code inside a document that stays in a drawer |
| M | ~15% | Cards and leaflets that live in a pocket or a bag |
| Q | ~25% | Anything mounted indoors, anything that gets photocopied |
| H | ~30% | Notice boards, outdoors, laminated, labels on equipment, anything exposed for months |

**Error correction is a durability budget, not a quality setting**, and the nominal percentage is optimistic
for real damage:

- Reed-Solomon works over **blocks**. Scattered noise is cheap to recover; a contiguous blot — a thumbprint, a
  corner of somebody else's flyer, a fold — can wipe an entire block and costs far more than its area suggests.
- The **finder patterns** (three corners), **alignment patterns**, **timing patterns** and **format
  information** are not covered by the data error-correction budget. Damage there is fatal regardless of level.
  This is why a torn corner kills a code that survives a much larger stain in the middle.

**Logos over the code.** The safe covered area at H is well under the nominal 30%, and nothing warns you when
somebody scales the logo up in a later revision — the code keeps scanning on the designer's phone at 15 cm and
fails in the stairwell. Default to no logo. If brand insists, put the mark **beside** the code with a
generous gap, not on it; if it must be on it, keep it centred, small, and re-run §5 on the final artwork every
time the logo or the URL changes.

## 4. Construction and the URL

**Rendering**

- **Dark modules on light background**, code darker than its surround. Inverted codes fail on a meaningful
  share of readers.
- **True black on true white.** Not the brand ink, not the paper tint. If the code is CSS-rendered, force it:
  `print-color-adjust: exact; -webkit-print-color-adjust: exact` — this is the one place forcing is correct.
- **Never over a photo, gradient, tint or texture.** Not even a light one.
- **Vector, not raster.** At 600 dpi one printer dot is 0.042 mm; a bitmap scaled to a non-integer multiple of
  the module grid gives uneven module edges and throws away decode margin for nothing. Emit an SVG or PDF path
  of filled rectangles, run-length merged per row, in a `modules × modules` box, and let the caller scale by
  `size / modules` — that way the same code is correct at any physical size and for any payload length.
- Watch the fill rule when moving a path between renderers: an SVG QR emitted as a *stroked* path (horizontal
  segments at `y + 0.5` with an implicit stroke width of 1) draws nothing at all in a renderer that fills by
  default.

**The URL is part of the design**

- **Short.** Every character can cost a version, and a version costs module size at fixed physical size.
- **Lowercase, no tracking parameters, no fragment.** Query strings inflate the payload and often break when
  hand-typed.
- **No redirect on the happy path.** A 308 to add or strip a trailing slash costs a round trip on the worst
  connection in the building, which is exactly the connection the reader has.
- **Typeable and speakable.** Someone will read it down a phone. Avoid `l`/`1`/`I` and `0`/`O` in generated
  codes; prefer a short path a person can hold in their head over an opaque token.
- **Resolve before you print.** A QR that 404s is worse than no QR — it costs the reader a scan, and it makes
  the whole sheet look abandoned. Only render a code for a destination the system knows is live.
- **Print the URL in plain text beneath the code**, at body size. It is the accessible alternative for anyone
  without a working camera, without data, or without a phone, and it is not optional.

## 5. The acceptance test

A code that scans in the design tool proves nothing. Test the artefact.

1. Print the **real artefact** on the **cheapest printer** available, on the stock it will actually use.
2. Photocopy it once, then photocopy the copy. Test all three generations.
3. Scan from the **stated distance** with a **cheap, several-year-old phone** — not your own current one, whose
   camera and autofocus are better than the median reader's.
4. Scan in **bad light**: a dim stairwell at dusk, or the actual location. Then in **direct light**, at an
   angle, to check for glare — the reason matte laminate is the only acceptable laminate.
5. Scan it **taped to the wall at its mounting height**, not flat on a desk. A code above eye level is read at
   an angle, which costs decode margin.
6. Obscure a corner with a thumb and try again. If it fails immediately, the EC level is too low for a notice
   board.
7. Confirm the destination **resolves without a redirect** and renders on a slow connection.
8. Type the printed URL by hand and confirm it lands in the same place.

Re-run 1–8 whenever the URL scheme, the EC level, the physical size, or any logo placement changes. All four
are coupled, and changing one silently invalidates the test for the others.
