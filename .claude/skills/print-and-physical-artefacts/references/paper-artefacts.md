# Paper artefacts: recipes, imposition and document tokens

Read this when composing a specific printed artefact, laying several up on one sheet, or wiring a
non-CSS renderer into the project's existing token system.

## 1. Document tokens map the semantic layer — they do not replace it

A PDF renderer that draws with `rgb()` calls at point coordinates has no CSS and no custom properties, so the
temptation is to write a fresh palette next to it. That is how a codebase ends up with two colour systems that
drift, which `ui-craft` §Decide first names as the most common way a design system decays.

**The document theme is a mapping, not a second palette.** It re-points the semantic roles at values correct
for paper, and it derives every one of them from the existing tokens rather than picking new hex values:

| Semantic role | Screen | Document mapping | Why it changes |
|---|---|---|---|
| `surface` | warm off-white tint | **pure white** | A page-wide 4% tint is toner across the whole sheet plus a visible grey rectangle inside the non-printable border |
| `surface-raised` | lighter surface + shadow | a rule, or an outlined box | Shadows do not exist on paper (`depth-and-overlays`) |
| `text-primary` | near-black on tint | near-black on white | Unchanged in role, re-measured against white |
| `text-muted` | grey passing 4.5:1 on the screen surface | a **darker** grey passing 4.5:1 against white *after greyscale conversion* | A muted grey that passes on screen often does not survive the mono conversion — `#9A9488` on `#F7F5F0` is 2.77:1, failing body *and* large-text floors |
| `border-subtle` | 1 px hairline | ≥0.5 pt rule | Below 0.5 pt a rule vanishes on a laser and on any photocopy |
| `danger` / `warning` / `success` | three distinct hues | three distinct **words or glyphs**, colour optional | The hues collapse to within 1.02–1.13:1 of each other in greyscale |
| `focus-ring`, `hover`, `selected` | state layers | nothing | No interaction states exist. Anything they conveyed becomes printed content |

Write this mapping in one place — a `theme` module the renderers import — and forbid raw colour literals in
the individual document files, the same rule components follow on the screen side. Structure it as roles
(`ink`, `inkMuted`, `paper`, `rule`, `ruleStrong`) so a document file never knows a hex value, exactly as a
component never knows one.

Type follows the same rule: the document scale is a **separate scale** derived from viewing distance
(`SKILL.md` move 4), not the screen scale converted at 0.75 pt per px. Name its steps and use them.

## 2. Hand-fill geometry

| Element | Minimum | Comfortable | Points (min / comfortable) |
|---|---|---|---|
| Ruled-line pitch, one line of writing | 8 mm | 10 mm | 22.7 / 28.3 pt |
| Field label to its line | 2 mm | 3 mm | 5.7 / 8.5 pt |
| Checkbox | 5 mm | 7 mm | 14.2 / 19.8 pt |
| Gap between adjacent checkboxes | 4 mm | 6 mm | 11.3 / 17 pt |
| Boxed character cell (machine-read only) | 6 mm | 8 mm | 17 / 22.7 pt |
| Signature box | 60 × 12 mm | 70 × 15 mm | 170 × 34 / 198 × 42.5 pt |
| Date field | 30 mm | 40 mm | 85 / 113 pt |
| Free-text comment block | 3 lines × 8 mm | 4 lines × 10 mm | — |

Rules that come from the pen rather than from taste:

- **Rule weight 0.5–0.75 pt.** 0.4 pt is 0.141 mm — 1.7 dots at 300 dpi — and rounds unpredictably or drops
  out; above 1 pt the rule competes with the handwriting.
- **Label above or to the left, never below.** A label under a rule reads as a caption for what was written
  and steals the descender space.
- **Size for the overshoot, not the mark.** Ticks overhang the box on both sides, crosses fill and overshoot
  it. Nothing may sit close enough to the box that a mark lands on it.
- **Where the mark's shape carries meaning, print the meaning:** `☐ Da  ☐ Nu`, not one box whose
  interpretation depends on whether somebody drew a tick or a cross.
- **Never shade a field.** "Office use only" as a tint becomes a mid-grey somebody writes on in ballpoint. Use
  a rule and a label.
- **Signature over whitespace, never over a printed line or rule.** The line goes *under* the signature area,
  and the label goes under the line.
- **Do not pre-fill anything uncertain.** Nobody corrects printed text; they work around it, and the resulting
  document is ambiguous.

**Carbon-copy / NCR sets.** The bottom copy loses fine detail, light tints entirely, and hairlines. Design the
whole form to the weight the *last* copy needs: pure black, ≥0.75 pt rules, ≥10 pt type, no tints. Keep
writing zones clear of any printed rule the pen has to cross — pressure across a printed line is where the
transfer smears.

## 3. Imposition: several artefacts on one sheet

**On office equipment there is no bleed.** Every consumer and office printer has a non-printable border, so a
design that runs ink to the edge of the trimmed piece cannot be produced on it — that requires oversized stock
and a commercial trim. Design office-printed cards with a white margin and stop fighting it.

**Butt-cut is the only imposition worth doing in-house.** Lay the pieces edge to edge with no gutter, so a
single cut separates two pieces. Four A6 cards on A4 is a horizontal cut and a vertical cut.

| Layout | Sheet | Cell | True size | Difference |
|---|---|---|---|---|
| 2-up A5 on A4 | 210 × 297 | 148.5 × 210 | 148 × 210 | +0.5 mm on the cut axis |
| 4-up A6 on A4 | 210 × 297 | 105 × 148.5 | 105 × 148 | +0.5 mm |
| 8-up A7 on A4 | 210 × 297 | 105 × 74.25 | 105 × 74 | +0.25 mm |

The half-millimetre is the ISO 216 rounding (each size halves the previous one and rounds down to whole
millimetres). Irrelevant for hand-trimmed cards; wrong if the piece must fit a die, a sleeve, or an A6-fed
printer. A butt-cut A6 at 148.5 mm still fits a C6 envelope (114 × 162 mm) comfortably.

**Cutting tolerance and the safe area.** A guillotine holds ±0.5 mm, a household trimmer ±1 mm, scissors
±2 mm. Budget **3 mm** of cutting error and keep a further margin inside that: on a 105 × 148.5 mm A6 cell,
10 mm margins give an 85 × 128.5 mm safe area, and nothing that matters goes outside it.

**Cut guides.** Mark the internal cuts only — the outer edges are the sheet edge, and marks placed there land
in the non-printable border. Draw the centre cross as a single 0.5 pt light-grey line rather than a full box
around each cell: a box that is cut 1 mm off leaves a visible border fragment on one edge of every card, which
looks like a defect, while a stray fragment of a single cut line does not.

**Pre-cut label stock is a different problem: never scale it.** Label sheets have fixed geometry you must match
exactly, and any driver "fit to page" scaling accumulates down the sheet — a 94.1% A4-into-Letter shrink puts
the bottom of a 297 mm sheet 17.5 mm out of position, which is more than a label's height. Print label sheets
at exactly 100%, scaling off, on the correct paper size, and check the first sheet against the stock before
committing the rest.

**Duplex.** Front-to-back registration on office duplex drifts 1–2 mm. Nothing on the back may depend on
lining up with anything on the front, and no design should straddle the fold.

## 4. Artefact recipes

Each recipe states the reading distance first, because that sets everything else.

### A4 schedule for an entrance-hall notice board

*Read at 500–700 mm standing, by people who did not come to read it.*

- Margins 18 mm; content width 174 mm. Two columns if the content is a list of tasks, one column if it is a
  schedule.
- **Layered by distance**, not by content type: headline at 25–28 pt (legible at 1 m), the single most-asked
  fact — the days and the time window — at 18–20 pt, task detail at 11–12 pt, footer identity at 9–10 pt.
- Do not claim metre legibility for 12 pt. 12 pt is 4.2 mm, comfortable at about 480 mm. A metre needs 25 pt.
- All-caps letterspaced micro-labels may go to 8 pt: Instrument Sans has a cap height of 0.72 em and an
  x-height of 0.51 em, so an 8 pt all-caps cap height (5.76 pt) is *larger* than a 10 pt lowercase x-height
  (5.10 pt). The 9 pt floor is a lowercase floor. It is not a licence to set them in a failing grey.
- Pure black on white. No tints. Rules at 0.7–1.6 pt for section separation.
- QR at 40–50 mm with a 51–62 mm reserved block, EC-Q or EC-H (§`references/qr-codes.md`), URL printed below.
- Print the generation date and the date the schedule stops being true.
- In the residents' language, regardless of the operator's locale.

### A6 cards, 4-up, left behind after a visit

*Read at ~300 mm in the hand, glanced at then binned or kept.*

- Cell 105 × 148.5 mm, 10 mm margins, 85 × 128.5 mm safe area.
- One headline that works alone — a person picking this off a doormat gets one line. 14–16 pt, bold.
- The handwritten part is the product. Blanks at 8.5 mm pitch minimum (24 pt line advance is 8.47 mm — right at
  the floor; 28 pt gives 9.9 mm and is better). Label left, rule right, 0.6–0.75 pt.
- Pre-print the date only when it is certain; otherwise leave the blank.
- QR 30 mm, 39.6 mm reserved block, EC-M in a pocket or EC-Q if the card gets pinned up.
- No bleed. Centre-cross cut guide at 0.5 pt light grey, no box per card.

### A5 notice naming a specific person

*Read at 500 mm–1 m, next to the schedule.*

- Margins 14 mm; content width 120 mm, which is 57–68 characters at 10–12 pt — a good measure without effort.
- The name is the artefact: 26 pt is comfortable at ~1.04 m, which is the right target for a stairwell board.
- A schedule line at 17 pt reads at ~0.68 m and a phone number at 19 pt at ~0.76 m — both correct for someone
  standing in front of it, both wrong to describe as "readable from across the hall".
- If a photograph is included it is consent-gated, and the sheet must read identically without it — never
  compose so that removing the photo leaves a hole.
- Contrast in monochrome: a photograph printed on a mono laser is a coarse dither. Crop tight, high contrast,
  and never put text over it (`depth-and-overlays/references/text-over-imagery.md`).

### Checkpoint / QR sheet

*Scanned at 200–500 mm, mounted for months, by a worker in a hurry.*

- The QR is the content; everything else is labelling. Size from §2 of `references/qr-codes.md` and reserve the
  full block including the quiet zone.
- EC-H. This is the artefact the level exists for: dust, sun-fade, thumbprints, a corner covered by another
  notice.
- Human-readable identifier next to the code in large type, so a worker with a dead phone can still report
  which checkpoint they are standing at, and so an operator can match it over the phone.
- Printed URL below the code.
- Matte laminate if it lives more than a season. Gloss reflects the stairwell light into the camera and is the
  most common reason a correctly sized code fails to scan in situ.
- Leave a 15 mm border clear for the laminate seal and the tape.

### Multi-page offer, invoice or protocol

*Read at 400 mm on a desk, filed, quoted back at you months later.*

- Margins 18/16/20/16 mm. Single column at 10–11 pt gives 90–99 characters, which is over the comfortable
  measure — either indent the body, use a two-column block for prose, or accept it only for tabular content.
- Repeat the table header on every page; keep totals and signature blocks unbreakable and attached to what they
  refer to.
- Page marker on every page, including the last: "Page 3 of 7", generated server-side.
- Document identity on page 1 and in the footer of every page: issuer, document number, date. This document
  outlives the session that produced it.
- Signature blocks last, in a `break-inside: avoid` container, sized per §2, with the label under the rule.
- Dates as words or ISO 8601; numbers in the document's locale with tabular figures; currency and VAT
  statements in the language of the recipient.
- Text must extract cleanly — a contract that cannot be searched or copied is a scan with extra steps.

## 5. Bilingual pages

A fixed page cannot reflow, so a translation that runs longer collides, overflows the bottom margin, or
produces one extra wrapped line that pushes the following block onto a new page.

- Measure every fixed-width block, column and label-plus-value pair at the **longest supported language**.
  `persuasive-copy/references/localisation-and-register.md` owns register and string growth.
- Compute each block's height from its **wrapped line count** before drawing it, and use that height in the
  page-break check. A two-line heading and a three-line one paginate differently, and the difference only
  appears on real data.
- Side-by-side bilingual columns are acceptable — the longer language sets the height and the shorter one has a
  ragged bottom. Interleaved bilingual lines are not, on anything with a form structure: every pair is a
  different height and nothing aligns down the page.
- Normalise diacritics on the way in so the render path only sees correct code points (Romanian: U+015F →
  U+0219, U+0163 → U+021B), and keep a glyph-coverage test as the backstop — font coverage of these ranges is
  genuinely uneven and asymmetric within a single family.
- Localise dates and numbers from the same locale that chose the strings. `03/04/2026` is unrecoverable on
  paper; print the month as a word or use ISO 8601.
