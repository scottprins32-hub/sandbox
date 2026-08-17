---
name: print-and-physical-artefacts
description: Designs anything that leaves the screen and becomes an object — a printed sheet, a generated PDF, a card, a label, a notice taped to a wall, a form somebody fills in with a pen. Settles the physical values: paper sizes and page geometry, type sized from viewing distance in pt and mm, monochrome-first colour, QR module size and error-correction level, blanks big enough for handwriting, and the `@page` / fragmentation / `print-color-adjust` layer of a print stylesheet. Use this whenever output ends up on paper or in a fixed-page document — even when the request never says "print": "generate a PDF", "export the report", "a sheet for the notice board", "a card we leave behind", "an invoice / offer / receipt / certificate", "add a QR code", "print stylesheet", "@media print", "it looks wrong when printed", "the colours vanished in the printout", "the table splits across pages", "nobody can read it from across the room", "the QR won't scan", "make a form they can fill in by hand", "A4 / A5 / A6 / Letter", "labels", "4-up", or any diff touching `@page`, `break-inside`, `print-color-adjust`, pdf-lib, Puppeteer `page.pdf()`, jsPDF, react-pdf, WeasyPrint or wkhtmltopdf. `typography-system`, `color-and-theming` and `spacing-and-layout` own the screen values this deviates from; this skill owns what happens when there is no screen.
---

# Print and physical artefacts

A printed artefact is the only thing you ship that a user cannot report a bug against. It has no hover, no
focus ring, no scroll, no dark mode, no tooltip, no error state and no undo. Once it is on the notice board
it is the product for as long as the tape holds — and the reader may be holding it in a dim stairwell, at
arm's length, outdoors in rain, or with wet hands and a phone in the other one.

Everything the screen set decided has to be re-decided. Not adjusted — re-decided. The 16px body size that is
correct on a laptop is 12pt on paper and wrong for a sheet read standing up. The three status colours that
are unmistakable in the app collapse into one grey on a mono laser. The QR that scans instantly off a monitor
fails off a photocopy of a photocopy. Print is not a rendering mode of the screen design; it is a second
design that shares the content and almost none of the values.

`typography-system` owns the screen type scale this deviates from. `color-and-theming` owns the palette that
gets flattened here. `spacing-and-layout` owns the layout primitives; on a fixed page they stop being
responsive and start being arithmetic.

## When this is the right skill

- Any generated document: PDF invoice, offer, report, certificate, protocol, statement, export.
- Any sheet meant for a wall, a door, a board, a window, or a clipboard.
- Cards, labels, tags, stickers, tickets, badges — anything trimmed out of a larger sheet.
- QR codes, barcodes, or a printed URL that a human might type or read aloud.
- Forms with blanks, checkboxes, ruled lines or a signature space.
- Writing or reviewing a print stylesheet, `@page` rule, or a `break-inside` / `orphans` declaration.
- "It looks fine on screen and wrong on paper", "the background disappeared", "page 2 is one orphan row".
- Choosing between a headless browser and a PDF library, or debugging why the two disagree.

Go elsewhere when: the surface is a **screen used in the field** — outdoors, gloved, offline — which is a
density-and-contrast modifier on product density, defined in `ui-craft` §Decide first, not a paper problem.
The question is **which words** go on the sheet → `persuasive-copy`. **Where the eye lands** on a composed
page → `attention-and-hierarchy` (its rules survive the trip to paper; only the values change). **Text set
over a photograph** → `depth-and-overlays/references/text-over-imagery.md`. **A chart** → `dataviz`, then
come back here for the monochrome pass.

## Decide first

Six answers fix every number below. All six are expensive to change after the first print run.

1. **Paper size and orientation, named once.** A4 (210 × 297 mm) everywhere ISO 216 is used; US Letter
   (215.9 × 279.4 mm) in North America. They are not interchangeable — A4 is 18 mm taller and 6 mm narrower.
   Put the size in one constant and derive every other page from it.
2. **Who prints it, on what.** A mono office laser at 600 dpi is the default assumption for anything
   operational. Colour, duplex, borderless and >120 gsm stock are all things you must confirm exist before
   designing for them.
3. **Read at what distance, in what light.** This is the single input that sets type size (move 4), and it is
   the one nobody writes down. In the hand ≈ 300 mm. On a desk ≈ 400 mm. At a notice board ≈ 500–700 mm.
   Across a lobby ≈ 2 m. A dim stairwell costs you roughly one size step on top.
4. **Does a human write on it?** If yes, the blanks are the design (move 8) and the layout is built around
   them, not around the printed text.
5. **Renderer: browser or library.** A headless browser gives you CSS, reflow and pagination but costs a
   Chromium and gives you approximate control. A PDF library (pdf-lib, PDFKit, ReportLab) gives you exact
   coordinates in points and no layout engine at all — you write the pagination yourself. Decide once per
   artefact; mixing them in one product means two sets of bugs (move 10).
6. **One language or two.** A fixed page cannot reflow. If a Romanian string runs 25% longer than the English
   one it was measured against, it does not wrap onto a new line — it collides with the thing beside it, or
   your greedy wrapper silently pushes the block past the page edge (move 11).

**Law, convention, taste.** Each move is tagged. *Law* means a WCAG criterion, an ISO specification, or a
hard renderer behaviour: comply or ship a defect. *Convention* means a widely shared pattern with a real
rationale — deviate deliberately, document why. *Taste* means defensible judgement you may overrule.

## The moves

### 1. A print stylesheet is a separate design, not a filter over the screen one — *convention, strongly held*

The failure mode is a print stylesheet that is a list of `display: none` — hide the nav, hide the sidebar,
hide the buttons — leaving the screen layout with holes in it. What comes out is a 1200 px-wide grid squeezed
onto a 174 mm content width, which the engine survives by shrinking to fit — so 16 px body, which is 12 pt at
full size, lands nearer 8 pt — and a two-column card grid where every card straddles a page break.

Start from the page instead. Ask what a reader needs from this sheet, in what order, at what distance, and
compose that. Some of the screen's content will not be on it (filters, pagination controls, "load more"), and
some things not on the screen must be added: a date the sheet was generated, a page marker, the URL of the
live version, a document identifier somebody can quote on the phone. A print artefact leaves your system and
gets referred to later; if it does not carry enough identity to be found again, it becomes an orphan.

Two structural consequences:

- **Interaction has to become content.** Every affordance is dead ink. A "View details" link becomes a printed
  URL or a QR (move 7). A tooltip becomes a footnote. An expandable becomes expanded or cut. A sort control
  becomes a stated sort order: *"Sorted by due date, oldest first."* A filter becomes a stated scope: *"Shows
  open items only, as of 14 March 2026."*
- **State has to be printed, because it can no longer be inferred.** A screen shows freshness by being live;
  paper is a photograph. Put the generation timestamp on it, and where the content decays, say by when:
  *"Valid until 30 April."* Absent that, a resident reads a six-month-old sheet as current.

### 2. Set the page geometry explicitly, and never trust the printable area — *convention*

```css
@page {
  size: A4 portrait;     /* or `210mm 297mm`; `size: auto` inherits the print dialog's guess */
  margin: 18mm 16mm 20mm 16mm;
}

/* Named pages: a landscape annexe inside a portrait document. */
@page annexe { size: A4 landscape; margin: 14mm; }
.annexe    { page: annexe; }
```

`size` and `margin` are the two `@page` descriptors with real support across renderers. `page-orientation`
exists; the margin at-rules (`@top-center`, `@bottom-right` and the other 14) and every background, border
and font descriptor on `@page` are specified but not implemented by browsers — do not build a running header
out of them. Named pages via `page:` have narrower support than `size`/`margin`; test the one renderer you
actually ship before relying on them.

**The margin is not free space, it is insurance.** Almost every consumer and office printer has a
non-printable border — commonly 3–5 mm, and more at the trailing edge on many models. Anything inside it is
clipped, silently, with no warning in the preview. Keep 15 mm minimum on all four sides for a document that
will be printed on unknown hardware, and treat the outer 5 mm as void: no rules, no page numbers, no cut
marks that must survive.

**The size trap that actually bites.** A PDF authored at A4 sent to a printer whose default is Letter gets
"fit to printable area", and the driver scales it by `min(215.9/210, 279.4/297) = 0.941`. Everything shrinks
to 94.1%, uniformly and invisibly. A 40 mm QR becomes 37.6 mm; a 5 mm checkbox becomes 4.7 mm; 12 pt body
becomes 11.3 pt. Any value in this skill that was chosen against a physical floor has just been pushed under
it. The mitigation is to design with headroom above every floor, and — where you control the flow — offer the
document in the reader's own paper size rather than one canonical size.

Coordinate systems, so the arithmetic is checkable: **1 pt = 1/72 in = 0.3528 mm**, and PDF page boxes are in
points with the origin at the bottom-left, y increasing upward. CSS `px` is 1/96 in, so `1px = 0.75pt`.
A4 = 595.28 × 841.89 pt. A5 = 419.53 × 595.28 pt. A6 = 297.64 × 419.53 pt.

**The spacing scale needs a document counterpart, not a conversion.** The screen scale in
`spacing-and-layout/references/spacing-tokens.md` is in `rem`, which means it tracks a root font size that
does not exist on paper. Declare a parallel scale in points, keep the same step *names* so a layout reads the
same in both media, and re-derive the values from the document type sizes rather than multiplying the screen
ones by 0.75 — the paper type scale is different (move 4), so the space it needs is different too. Everything
`spacing-and-layout` says about proximity and grouping still holds; only the numbers move, and container
queries and breakpoints do not exist here at all.

### 3. Control fragmentation, or the renderer will do it badly — *convention*

Paper has a hard bottom edge and the content does not know where it is. Declare the breaks.

```css
h2, h3          { break-after: avoid; }   /* never a heading alone at the foot of a page */
tr, li, figure,
.card, .signature-block { break-inside: avoid; }
.annexe         { break-before: page; }
thead           { display: table-header-group; }  /* repeats the header on every page */
tfoot           { display: table-footer-group; }
p               { orphans: 3; widows: 3; }
```

`break-inside: avoid` on a block taller than the page area is unsatisfiable and the renderer will break it
anyway — apply it to rows and cards, not to a whole section. `orphans` and `widows` are implemented in
Chromium and WebKit but **not in Firefox**, which is the single strongest argument for pinning one renderer
(move 10) rather than "whatever the user's browser is". Ship the legacy `page-break-inside: avoid` alongside
`break-inside` only if your target renderer is old enough to need it; in current Chromium it is redundant.

**A signature block, a total, and a table header must never be separated from what they refer to.** Wrap each
in a `break-inside: avoid` container. The specific defect this prevents is a page 2 containing nothing but
"Total: 4.280 RON" and two signature lines — which is legally and practically a different document from one
where the total sits under its table.

**When you are drawing at coordinates rather than laying out with CSS**, you own all of this: before drawing
any block, check that `y - blockHeight` clears the bottom margin plus the footer, and if it does not, start a
new page *before* drawing rather than after discovering the overflow. Compute the block height first — the
wrapped line count times the leading, plus padding — because a two-line heading and a three-line one break
differently and the difference only appears on real data.

### 4. Size type from viewing distance, in physical units — *convention*

Set sizes in `pt` or `mm`, never `px`. On paper `px` is a fiction the renderer resolves at 96 dpi and any
later scaling (move 2) or dpi assumption changes what it means. `pt` is a physical length and survives.

**The screen type scale does not transfer, and neither does its logic.** A screen scale is tuned for a
roughly fixed 400–600 mm viewing distance and gets its hierarchy from size ratios plus colour and weight; a
sheet has one ink, a wider distance range, and less room. Cut to four or five sizes. Raise the body floor: the
screen's 16px = 12pt is a *reasonable* paper body size, but 10 pt is the practical floor for continuous text
and 9 pt for dense tabular data — below 9 pt a 600 dpi laser starts filling counters on a humanist sans, and a
photocopy closes them entirely.

**The rule that makes distance an input.** Comfortable continuous reading corresponds to roughly 10 pt at
400 mm. That is a ratio: **em size in mm ≈ viewing distance in mm ÷ 113**. Derived from that anchor:

| Read at | Em size | ≈ pt | Typical artefact |
|---|---|---|---|
| 300 mm (in the hand) | 2.7 mm | 7.5 pt | card, label, receipt — floor still applies, use 9–10 pt |
| 400 mm (desk, clipboard) | 3.5 mm | 10 pt | invoice, offer, form |
| 700 mm (standing at a board) | 6.2 mm | 17.5 pt | notice-board schedule body |
| 1 m (across a hallway) | 8.9 mm | 25 pt | notice headline |
| 1.5 m | 13.3 mm | 38 pt | poster headline |
| 2 m | 17.7 mm | 50 pt | lobby sign |

The signage industry's independent rule of thumb — one inch of cap height per ten feet of viewing distance —
lands about 35% more conservative (50.6 pt rather than 38 pt at 1.5 m). Where the reader will not step closer,
take the larger number.

**The practical consequence people get wrong:** you cannot set body text for 1.5 m. A sheet whose entire
content is legible at 1.5 m holds about a paragraph. Design the distance in layers instead — a headline
readable at the far distance, a schedule line at 700 mm, and detail at 400 mm that people step up to read —
and then be honest that "12 pt body, legible from a metre" is arithmetically false: 12 pt is 4.2 mm, which is
comfortable at 480 mm. A metre needs 25 pt.

**Measure, at the widths paper actually gives you.** With ~0.5 em average character width for a humanist sans:

| Page | Content width | 10 pt | 11 pt | 12 pt |
|---|---|---|---|---|
| A4, 18 mm margins | 174 mm | ~99 ch | ~90 ch | ~82 ch |
| A5, 14 mm margins | 120 mm | ~68 ch | ~62 ch | ~57 ch |
| A6 card, 9 mm margins | 87 mm | ~49 ch | ~45 ch | ~41 ch |

A4 at a single column runs 82–99 characters — well past the 45–75 that `typography-system` settles on. Either
raise the size, widen the margins, or go two-column. A single 174 mm measure at 10 pt is the most common
reason a generated PDF feels like a legal document nobody reads.

Leading runs slightly tighter on paper than screen — 1.35–1.45 for body at 10–12 pt — because the higher
effective resolution and the absence of sub-pixel rendering make lines easier to track.

### 5. Design monochrome first — *taste, strongly held; the colour-alone rule is law*

Most operational printing is black and white, and you will not be told when it stops being colour. Design the
sheet so that a mono laser loses nothing, then add colour as an enhancement that no meaning depends on.

**What actually happens in greyscale.** A driver converts with a luma weighting close to
`0.299R + 0.587G + 0.114B`. Three status colours chosen to be maximally distinct in hue frequently sit within
a few percent of each other in luma, because hue distance and lightness distance are independent. A worked
example on a real status triple:

| Token | Hex | → grey | sRGB grey level |
|---|---|---|---|
| success | `#2E6B4F` | `#565656` | 33.6% |
| danger | `#9C3B25` | `#555555` | 33.5% |
| warning | `#7C5A17` | `#5D5D5D` | 36.3% |

Mutual contrast after conversion: **1.02:1, 1.11:1 and 1.13:1** — three identical mid-greys. In colour they
are instantly separable; on the printout the sheet has one status. Nothing in the design review catches this,
because the review happened on a screen.

So: **WCAG 1.4.1 Use of Colour stops being a floor and becomes the whole mechanism.** On paper every
distinction carries a second, non-colour channel — a word, a glyph, a rule weight, a fill pattern, position in
a column. A status chip becomes `● Efectuat` / `○ Restant`, or a filled versus outlined box, or the word
alone. Then, if you also print in colour, the colour is free redundancy.

Where you must keep tonal distinctions, separate them by **lightness**, not hue, and check the greys have
≥3:1 between adjacent steps. Two or three greys is the whole usable range: a mono laser's dither makes 60%
and 70% tints indistinguishable at any size a reader cares about.

**Ink is a real cost and shows up as a real refusal.** Toner is the reason an office prints a sheet once and
never again. Large flat fills are the expense: a page-wide tint at even 4% reflectance loss covers the entire
sheet in dither and leaves a visible grey rectangle with a white non-printable border around it. Print white
paper and reserve tints for bands you can justify. Where the screen design uses a warm off-white surface
(`#F7F5F0` and similar), map it to pure white on paper — see `color-and-theming/references/palette-tokens.md`
for the semantic tokens this remaps, and do the remapping in the print theme, not by editing the palette.

The screen's `--color-text-muted` is the specific token to re-check. A muted grey that passes 4.5:1 on a
screen surface often does not survive: `#9A9488` on `#F7F5F0` is **2.77:1** — it fails 4.5:1 body and fails
even the 3:1 large-text floor, and on paper there is no zoom and no theme toggle to escape it. Muted text on
paper should sit at 4.5:1 or better against white; the paper equivalent of `--color-text-muted` is a darker
value than the screen one, not the same one.

### 6. Background colours drop by default — plan around it rather than forcing it — *convention*

Browsers strip background colours and images from printouts unless the user ticks "Background graphics" in
the print dialog. This is deliberate: it is the default that stops a dark-themed page consuming a cartridge.
You can ask for it back —

```css
@media print {
  .status-chip, thead th { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
```

— unprefixed `print-color-adjust` landed in Firefox 97 and Safari 15.4; Chromium shipped the prefixed
`-webkit-print-color-adjust` years earlier and the unprefixed alias later, and published sources disagree on
which Chromium version, so ship both declarations and stop worrying about it.
**But the user's checkbox still wins.** The spec is explicit that any user-agent option controlling colour and
image printing takes priority over the property, and each engine may decide for itself what to do with it —
this is a request, not a guarantee, and it defaults to off. Any design in which a filled background carries
meaning — a colour-coded row, a reverse-video header, a white-on-dark badge — has a failure mode where the
fill vanishes and the white text goes with it, leaving a blank cell.

The robust construction is to not need the fill:

- Header row: rule above and below, and bold, rather than a dark band with white text.
- Emphasis: a 1.5 pt left rule and bold, rather than a tinted box.
- Selected/current: a printed marker (`▸`, `→`, the word "current") rather than a highlight.
- Badges: outlined with a border and dark text, never solid with reverse text.

Use `print-color-adjust: exact` for enhancement — a tint that makes a table easier to track — and never for
anything load-bearing. The one case where forcing it is correct is a **QR code**, which must be true black on
true white or it will not scan; give it `print-color-adjust: exact` and also make it a vector path so it
survives regardless (move 7).

Force the light theme unconditionally. `color-and-theming/references/theme-switching.md` covers the
mechanism; the print-specific point is that `prefers-color-scheme: dark` must not reach the print stylesheet,
so scope the dark block so it cannot: `@media screen and (prefers-color-scheme: dark)`.

### 7. Size a QR from scan distance, its error correction from how it will be abused — *convention*

Four numbers, in this order; the symbol structure they sit on is ISO/IEC 18004.

**Payload → module count.** A QR's grid is set by its version: v1 is 21 × 21 and each version adds 4 modules
per side. Which version you get depends on payload length *and* error-correction level. For a 25-character URL
in byte mode:

| EC level | Recovers up to | Version | Grid |
|---|---|---|---|
| L | 7% | 2 | 25 × 25 |
| M | 15% | 2 | 25 × 25 |
| Q | 25% | 3 | 29 × 29 |
| H | 30% | 4 | 33 × 33 |

Compute this with your encoder rather than reading it off a table — mode segmentation (numeric, alphanumeric,
byte) changes the answer, and a URL that gains one query parameter can jump a version and silently shrink
every module.

**Scan distance → overall size.** The working rule of thumb across the QR industry is **10:1** — code width
= scan distance ÷ 10. Then the module size (the "X-dimension") falls out as width ÷ modules, and it must clear
a physical floor. GS1 specifies 0.396–0.990 mm for retail scanning with a 0.495 mm target — measured on point-of-sale
scanners, not phone cameras, so borrow the order of magnitude, not the number. **Treat 0.5 mm as the floor
for a phone camera and aim for ≥1.0 mm anywhere the code will be dirty, curled or badly lit.** Those two are
this skill's judgement, not a published standard; verify by scanning the real artefact.

| Artefact | Distance | EC | Grid | Code | X-dim | Quiet zone | Total block |
|---|---|---|---|---|---|---|---|
| Card held in the hand | 300 mm | M | 25 | 30 mm | 1.20 mm | 4.8 mm | **39.6 mm** |
| A4 sheet, secondary QR | 400 mm | Q | 29 | 40 mm | 1.38 mm | 5.5 mm | **51 mm** |
| Notice board, walk-up | 500 mm | H | 33 | 50 mm | 1.52 mm | 6.1 mm | **62 mm** |
| Asset label, close scan | 200 mm | H | 33 | 20 mm | 0.61 mm | 2.4 mm | **24.8 mm** |

**Quiet zone: four modules of blank on all four sides, and it is part of the code.** Cropping it is the most
common reason a technically valid code fails to scan. Reserve the total block, not the code — a 30 mm code on
an A6 card is a 39.6 mm square, which is 46% of an 87 mm content width, and that has to be in the layout from
the start rather than squeezed in at the end.

**Error correction is a durability budget, not a quality setting.** L through H trade payload capacity for
recoverable damage. A code on a screen or in an email can be L or M. **A code printed on a notice board is Q
or H** — it will get dust, sun-fade, a thumbprint, a corner of somebody else's flyer, and a fold. Reed-Solomon
recovery is per block, so a contiguous blot destroys a block far more efficiently than the nominal percentage
suggests, and the finder patterns, timing patterns and format information are not covered by the data
error-correction budget at all. That is also why a **logo over the centre is a bad default**: even at H the
safe covered area is well under 30%, and the moment somebody scales the logo up nobody notices until scanning
fails in the field. If a logo is required, put it beside the code, not on it.

**Contrast and construction.** Dark modules on light, true black on true white, code darker than background
(inverted codes fail on many readers). Never place a code over a photo, a gradient or a tint. Draw it as a
**vector path**, not a raster image: at 600 dpi one dot is 0.042 mm, and a bitmap scaled to a non-integer
multiple of the module grid produces uneven module edges that cost you decode margin for free.

**The URL is part of the design.** Short (fewer characters, smaller grid, larger modules at the same physical
size), lowercase, no tracking parameters, no redirect on the happy path — a 308 on the first hop wastes a
round trip on the worst connection in the building. Make it readable and typeable, because someone will read
it aloud down a phone: avoid `l`/`1`/`I` and `0`/`O` in generated codes, and prefer a path a human can hold in
their head. **Print the URL under the code in plain text.** For a reader who cannot use a camera, that text is
the only route in (move 12).

**Test on a cheap phone, in bad light, on the actual print.** Not on a screen, not on the design file, not on
your own phone. A five-year-old mid-range Android in a stairwell at dusk, holding a photocopy, is the
acceptance test. `references/qr-codes.md` has the full capacity table, the URL-shape rules and the test
protocol.

### 8. Blanks are a designed element, sized for a hand — *convention*

If a person writes on it, the writing space is the layout and the printed text is the annotation. Adult
handwriting has an x-height of roughly 4–5 mm and needs ascender and descender room around it, so:

| Element | Minimum | Comfortable | In points |
|---|---|---|---|
| Ruled-line pitch (one line of writing) | 8 mm | 10 mm | 22.7 / 28.3 pt |
| Checkbox | 5 mm | 7 mm | 14.2 / 19.8 pt |
| Signature box | 60 × 12 mm | 70 × 15 mm | 170 × 34 / 198 × 42.5 pt |
| Date field | 30 mm | 40 mm | 85 / 113 pt |

Rules that follow from the pen rather than from taste:

- **A line to write on is 0.5–0.75 pt.** Below 0.5 pt it disappears on a laser and on any photocopy — 0.4 pt
  is 0.141 mm, which is 1.7 dots at 300 dpi and rounds unpredictably. Above 1 pt it competes with the writing.
- **The label goes above or to the left of the line, never below it.** A label under a rule reads as a caption
  for whatever was written and steals the descender space.
- **Accept a tick or a cross; do not depend on either.** Ticks overhang the box on both sides; crosses fill it
  and overshoot. Size the box for the overshoot and never put text so close that a tick lands on it. Where the
  distinction between marks carries meaning, print it: `☐ Da ☐ Nu`, not one box whose meaning depends on what
  shape the mark is.
- **Boxed character fields only where the data is machine-read**, and then 6–8 mm per cell. For anything a
  human reads back, one ruled line is faster to fill and far less annoying.
- **Never rely on shaded fields.** The tint that says "office use only" prints as a mid-grey somebody then
  writes on with a ballpoint. Use a rule and a label.
- **Duplicate and carbon-copy.** If the artefact is a two-part NCR set, the second copy loses fine detail and
  light tints entirely — design the whole form at the weight the *bottom* copy needs, keep the writing zones
  clear of any printed rule the pen would have to cross, and never put a signature over a printed line.
- **Leave the pre-printed fields blank when the data is uncertain.** A pre-filled wrong date is worse than a
  blank one: nobody corrects printed text, they work around it.

### 9. A document that lives on a wall is a different artefact — *taste*

Wall documents are read standing up, at a distance the reader chooses, by people who did not come to read it.
Three constraints follow.

**Distance sets the hierarchy, not the content structure.** One headline sized for the far distance (move 4's
table), one line of the single most-asked fact at mid distance, and everything else at reading distance. If
the sheet has three things at the same size, it has no headline and gets read by nobody.

**It will be photocopied, and the copy is the artefact.** Each generation loses fine detail, closes counters
below 9 pt, flattens light tints toward white or crushes them toward grey, thickens hairlines under 0.5 pt
into blobs or loses them entirely, and degrades QR modules. Design so the third-generation photocopy still
works: pure black on white, no tints carrying meaning, hairlines ≥0.5 pt, type ≥10 pt, QR at Q or H with
generous modules.

**It faces weather and hands.** Outdoors or in an unheated stairwell, paper cockles, ink from an inkjet runs,
and tape yellows and lifts corners. Laminate anything that must last a season, and if it is laminated, matte
laminate only — gloss reflects the stairwell light straight into the reader's eyes and, worse, blows out a
phone camera trying to read the QR. Leave a 15 mm border for the laminate seal and for tape, and keep all
content out of it.

**Give it an expiry.** A wall document with no date is read as current forever. Print the generation date and,
where the content is a schedule or a commitment, the date it stops being true.

### 10. Choose the renderer deliberately; the two kinds fail differently — *convention*

**Headless browser (Puppeteer/Playwright `page.pdf()`, WeasyPrint, wkhtmltopdf).** You get CSS, real text
layout, automatic pagination, and one source of truth with the web app. You also get: a Chromium in the deploy
(cold starts and memory on serverless), rendering that differs from the same browser's desktop print path,
font metrics that can differ from what you see locally, and pagination you influence but do not control.
Header/footer templates in `page.pdf()` are a separate mini-document with their own margin arithmetic and
their own font resolution — they will not inherit your page's fonts.

**PDF library (pdf-lib, PDFKit, ReportLab, react-pdf).** You get deterministic output, small dependencies, and
exact placement in points. You also get no layout engine: you write text wrapping, you write pagination, you
measure every string before you draw it, and every new content shape is code.

Neither is wrong. What is wrong is expecting them to agree — the same document through both will differ in
line breaks, hyphenation, and where page 2 starts. Pin one per artefact and diff its output in CI.

**Fonts are where both fail silently.**

- **Embed, always.** A non-embedded font resolves against whatever the reader's viewer has, and "Arial" on a
  Linux print server is not Arial. Every font used, including bold and italic — a PDF that "synthesises" bold
  by smearing outlines looks like a fax.
- **Subset for size, but against the real corpus.** Subsetting to the glyphs used cuts a typical text face
  from ~340 KB to tens of KB, and breaks the moment a later document contains a character the subset lacks —
  a currency symbol, a superscript, an unusual diacritic. With dynamic content, subset against the full
  catalogue of strings that can appear, or do not subset.
- **A missing glyph is invisible to the renderer.** It draws as an empty box or as nothing, and no library
  raises an error. The only defence is a test walking every printable string and asserting glyph coverage —
  cheap to write, and the only thing that catches `art. 28¹⁴(5)` shipping as `art. 28□□(5)`.
- **Verify text extraction, not appearance.** Some libraries mis-advance multi-codepoint glyphs, so a
  ligature can draw correctly and extract as garbage. On an invoice or a contract the text must be selectable
  and searchable, so extract it back out of the generated file in a test.

`references/print-css.md` §5–6 has the per-renderer trap list and the coverage-test code.

**Test on the printer, not the preview.** The preview is a screen render of a page description; it does not
show you the non-printable border, the driver's fit-to-page scaling, the dither pattern on your tints, or that
your 0.4 pt rule vanished. One physical print, on the cheapest printer in the building, before the design is
considered done.

### 11. On a fixed page, a longer translation has nowhere to go — *convention*

Screen layouts absorb a 30% longer string by wrapping. A page absorbs it by overlapping the next element, by
pushing a block past the bottom margin, or — with a greedy wrapper — by producing a fourth line where you
budgeted three and shifting everything below it onto the next page.

- **Measure at the longest supported language, not the source one.** Every fixed-width block, every column,
  every label-plus-value pair. `persuasive-copy/references/localisation-and-register.md` owns the register and
  string-growth material; the print-specific consequence is that a block's height must be *computed from the
  wrapped line count* before it is drawn, and the page-break check must use that computed height.
- **Two-language layouts are two documents.** Side-by-side columns in a fixed width means the longer language
  sets the column height and the shorter one has a ragged bottom — acceptable. Interleaved lines means every
  pair is a different height and nothing aligns — not acceptable on a form.

**Diacritics need verified font coverage, not assumed coverage.** Romanian is the clean example, because it
has a well-known encoding split. The correct characters are **comma-below**: Ș U+0218, ș U+0219, Ț U+021A,
ț U+021B — added to Unicode in 1999, and still absent from older fonts and from the Latin-1 repertoire. The
lookalikes ş U+015F and ţ U+0163 are **cedilla** letters belonging to Turkish, wrong for Romanian, and endemic
in legacy Windows-1250 data. Romanian also needs ă U+0103 and Ă U+0102 (Latin Extended-A, *not* in Latin-1),
plus â/Â and î/Î (which are).

Coverage is genuinely uneven and asymmetric, which is why it must be checked rather than assumed. A verified
example: Instrument Sans (343-glyph release) covers all four comma-below characters and ş U+015F, but has **no
glyph for ţ U+0163** — so text stored with the Turkish cedilla forms renders correctly for `ş` and produces an
empty box for `ţ`. Inter and Space Grotesk cover all six. Check the actual font binaries you ship:

```python
from fontTools.ttLib import TTFont
cmap = set(TTFont("InstrumentSans_400Regular.ttf").getBestCmap())
# The code points Romanian actually needs, once input is normalised to comma-below.
need = {0x0218, 0x0219, 0x021A, 0x021B, 0x0102, 0x0103, 0x00C2, 0x00E2, 0x00CE, 0x00EE}
print(sorted(hex(c) for c in need - cmap))
# Add 0x015E, 0x015F, 0x0162, 0x0163 to `need` only if you are NOT normalising,
# in which case the font must carry the cedilla forms too — and often does not.
```

Then **normalise on the way in** — map U+015F → U+0219 and U+0163 → U+021B before storage — so the render
path only ever sees correct code points, and keep the glyph test as the backstop.

**Dates and numbers are localised, and on paper they are unrecoverable.** `03/04/2026` is 3 April in Romania
and 4 March in the US; on a screen you can hover, on paper you cannot. Print the month as a word, or use
ISO 8601 `2026-04-03`, on anything that crosses a border or a filing cabinet. Decimal comma versus point and
the thousands separator follow the document's locale, not the developer's: `4.280,50 RON` in Romanian,
`4,280.50` in English. Set them from the same locale that chose the strings, and use tabular figures so
columns of numbers align (`typography-system`).

### 12. Accessibility on paper has no escape hatches — *law where WCAG reaches, judgement past it*

Paper has no zoom, no reflow, no screen reader, no theme toggle and no user stylesheet. Every accommodation
the web gives a reader for free has to be built into the artefact.

- **Type floor: 10 pt for continuous text, 9 pt for dense tabular data, and nothing below 9 pt anywhere.**
  WCAG specifies no minimum size, so this is platform judgement rather than law — but it is the point below
  which laser dither and photocopying start eating the letterforms, and it should be treated as hard.
- **Contrast, evaluated in monochrome.** Black on white is 21:1; a mid-grey is not. Convert the palette to
  greyscale first (move 5) and require 4.5:1 for body against white, 3:1 for text ≥18 pt or ≥14 pt bold. On
  paper this is the whole of WCAG 1.4.3's protection, so do not spend the margin on a fashionable grey.
- **Never colour alone (WCAG 1.4.1), unconditionally** — move 5 explains why the greyscale collapse makes this
  absolute rather than a floor.
- **A QR code is inaccessible on its own.** A reader who is blind, has a phone too old to scan, has no data,
  or simply has no phone, has no route in. **Print the URL in plain text next to every code, at body size, in
  a form that can be typed** — that is the accessible alternative, and it is not optional.
- **Say what the sheet is, in words, at the top.** Paper has no `<title>`, no landmark and no heading
  structure to skim — the first line does all three jobs at once. If a reader cannot tell in three seconds
  what the document is and who it is from, it fails for everyone, not only for assistive-technology users.
- **Print in the reader's language, not the operator's.** A document for residents is in the residents'
  language regardless of what locale the admin generated it in. It is the one accessibility decision on paper
  that costs nothing and is skipped most often.

## Ship checklist

Run this before anything goes to a printer or into a customer's hands.

**Geometry**
- [ ] Page size declared explicitly (`@page { size: … }` or the library's page constant), not inherited.
- [ ] ≥15 mm margins on all four sides; nothing meaningful in the outer 5 mm.
- [ ] Checked at both A4 and Letter, or the document is offered in the reader's paper size.
- [ ] No content clipped, no unintended horizontal overflow, no blank trailing page.

**Fragmentation**
- [ ] Table headers repeat on every page (`display: table-header-group`, or redrawn per page).
- [ ] No heading last on a page; no orphan/widow line; no signature block or total separated from its content.
- [ ] Every drawn block's height computed before the page-break check, not after.

**Type**
- [ ] All sizes in `pt`/`mm`, none in `px`.
- [ ] Body ≥10 pt (≥9 pt tabular); largest size checked against the stated reading distance.
- [ ] Measure between 45 and 75 characters, or the column is deliberately two-column.

**Colour and ink**
- [ ] Printed once in greyscale: every distinction still readable, no two statuses the same grey.
- [ ] No meaning carried by a background fill, a tint, or colour alone.
- [ ] Muted text ≥4.5:1 against white after greyscale conversion.
- [ ] No page-wide tint; hairlines ≥0.5 pt.

**QR**
- [ ] Size derived from stated scan distance (10:1), X-dimension ≥0.5 mm and ≥1.0 mm on a notice board.
- [ ] 4-module quiet zone present and included in the reserved block.
- [ ] EC level Q or H for anything mounted, exposed, or photocopied; no logo over the code.
- [ ] Drawn as vector, true black on true white, `print-color-adjust: exact` if CSS-rendered.
- [ ] Destination URL printed as plain text beside it.
- [ ] Scanned from the real print, at the real distance, on a cheap phone, in poor light — and the URL resolves
      without a redirect and without a 404.

**Hand-fill**
- [ ] Ruled-line pitch ≥8 mm, checkboxes ≥5 mm, signature box ≥60 × 12 mm.
- [ ] Labels above or beside their lines, never below; rules 0.5–0.75 pt.
- [ ] Nothing pre-filled that could be wrong.

**Generation**
- [ ] All fonts embedded, including bold and italic; subset validated against the full string catalogue.
- [ ] Glyph-coverage test passing over every printable string, including diacritics.
- [ ] Text extracts cleanly from the PDF (copy-paste and search both work).
- [ ] Dates unambiguous; numbers in the document's locale; tabular figures in numeric columns.
- [ ] Generation date printed, and an expiry where the content decays.
- [ ] Printed on a real, cheap printer and looked at on paper.

## Sources

- **ISO 216** — A-series paper. A4 210 × 297 mm, A5 148 × 210 mm, A6 105 × 148 mm; each size is the previous
  one halved with the millimetre rounded. That rounding is a real trap: halving A4 gives 148.5 mm, while true
  A6 is 148 mm, so a 2 × 2 imposition on A4 is 0.5 mm taller per card than A6 — irrelevant for hand-trimmed
  cards, wrong for a die-cut or an A6-fed printer. US Letter (ANSI A) is 215.9 × 279.4 mm.
- **ISO/IEC 18004** — QR Code symbology. Version 1 is 21 × 21 modules, +4 per side per version; error
  correction L/M/Q/H recovers approximately 7 / 15 / 25 / 30% of codewords; the quiet zone is 4 modules.
  Byte-mode capacities used above (v2 = 26 at M, v3 = 32 at Q, v4 = 34 at H) are from the standard's capacity
  tables — compute yours with your encoder rather than quoting these.
- **GS1 General Specifications** §5.12.3.1 — QR X-dimension 0.396–0.990 mm for retail point of sale, 0.495 mm
  target. The 0.34 mm figure that circulates for phone cameras traces to GS1 trials run on point-of-sale
  scanners, not phones — do not cite it as phone data. The 0.5 mm floor below is this skill's own
  engineering judgement, arrived at the same way as the 9/10 pt type floors.
- **The 10:1 distance rule** is industry rule of thumb, not a standard — widely used, no published derivation.
  Treat it as a starting point and verify by scanning.
- **CSS Paged Media Level 3 and CSS Fragmentation Level 3** — `@page`, `size`, `margin`, named pages via the
  `page` property, `break-before`/`break-after`/`break-inside`, `orphans`, `widows`. `size` and `margin` are
  Baseline; the 16 margin at-rules and the background/border/font descriptors on `@page` are specified but
  unimplemented in browsers; named pages have narrower support than `size`/`margin`. `orphans` and `widows`
  are supported in Chromium and WebKit but MDN lists them as *limited availability, not Baseline* — Firefox
  has never implemented them (Mozilla bug 137367, open since 2002).
- **CSS Color Adjustment Level 1** — `print-color-adjust: economy | exact`. Unprefixed form reached Baseline
  newly-available in 2025; Chromium dropped the `-webkit-` prefix in 98, older Safari still needs it. The spec
  states there is no guarantee it does anything: user-agent options for controlling colour and image printing
  take priority, and each user agent decides for itself how to handle it.
- **WCAG 2.2** — 1.4.1 Use of Colour and 1.4.3 Contrast (Minimum) are the two that transfer to paper intact
  and are cited inline. WCAG specifies no minimum font size; the 9/10 pt floors here are judgement about laser
  dither and photocopy degradation. The shared floor is in `ui-craft` §The accessibility floor.
- **Unicode** — Romanian comma-below Ș/ș U+0218/U+0219 and Ț/ț U+021A/U+021B, added in Unicode 3.0 (1999);
  the Turkish cedilla forms Ş/ş U+015E/U+015F and Ţ/ţ U+0162/U+0163 are distinct characters and wrong for
  Romanian. The Instrument Sans coverage gap quoted in move 11 was verified with fontTools against the shipped
  343-glyph binary, not assumed.
- **Neighbouring skills** — `typography-system` (the screen scale this deviates from, measure, tabular
  figures); `color-and-theming` (the palette that gets flattened, and the light-theme forcing in
  `color-and-theming/references/theme-switching.md`); `spacing-and-layout` (the layout primitives, which stop
  being responsive here); `persuasive-copy/references/localisation-and-register.md` (register and string
  growth); `attention-and-hierarchy` (where the eye lands, which survives the trip to paper);
  `depth-and-overlays/references/text-over-imagery.md` (text over a photo, and what print does to a scrim);
  `ui-craft` (the semantic token layer a document renderer maps rather than redefines).

**References in this skill.** `references/print-css.md` — a complete print stylesheet, the `@page` and
fragmentation reference, `print-color-adjust` behaviour per engine, and a browser-vs-library comparison with
the traps for each; read it when writing or debugging print CSS or choosing a renderer.
`references/qr-codes.md` — the full version/capacity table, the sizing worksheet, error-correction selection,
URL shape rules and the field test protocol; read it before placing any code on a printed artefact.
`references/paper-artefacts.md` — per-artefact recipes (A4 wall schedule, A6 cards 4-up with cut marks and
bleed, A5 notice, checkpoint QR sheet, a formal offer or invoice), hand-fill geometry, imposition, and the
document-token mapping for a non-CSS renderer.
