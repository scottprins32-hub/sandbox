# Print CSS, page geometry and renderer selection

Read this when writing or debugging a print stylesheet, or when choosing between a headless browser and a PDF
library. Values and rationale for what goes *on* the page are in `SKILL.md`.

## 1. Paper geometry

`1 pt = 1/72 in = 0.352778 mm`. `1 CSS px = 1/96 in = 0.75 pt`. PDF page boxes are in points, origin at the
bottom-left, y increasing upward — the opposite of every screen coordinate system, and the single most common
source of upside-down output when porting a layout.

| Size | mm | pt | Typical use |
|---|---|---|---|
| A3 | 297 × 420 | 841.89 × 1190.55 | Large wall schedule, plan |
| A4 | 210 × 297 | 595.28 × 841.89 | Documents, notices, forms |
| A5 | 148 × 210 | 419.53 × 595.28 | Notice, leaflet, half-sheet |
| A6 | 105 × 148 | 297.64 × 419.53 | Card, postcard, tag |
| A7 | 74 × 105 | 209.76 × 297.64 | Label, ticket |
| US Letter | 215.9 × 279.4 | 612 × 792 | North America |
| US Legal | 215.9 × 355.6 | 612 × 1008 | North American contracts |

**The halving rounding trap.** ISO 216 halves each size and rounds down to whole millimetres, so the halves
are not exact. A4 halved is 105 × 148.5 mm; true A6 is 105 × 148 mm. Deriving an A6 card as `A4.height / 2`
gives 420.945 pt where A6 is 419.53 pt — 1.4 pt, 0.5 mm, taller. Harmless for cards you trim by hand off an
A4 sheet; wrong for a die-cut, an A6-fed printer, or anything that has to butt up against a real A6 item.

**Fit-to-page scaling.** Sending A4 to a Letter-default driver applies
`min(215.9/210, 279.4/297) = 0.9407` — a uniform 94.1% shrink. Letter onto A4 applies
`min(210/215.9, 297/279.4) = 0.9727`. Neither is announced anywhere in the UI. Design with headroom above every
physical floor (QR module size, checkbox size, type floor) so a 94% print still clears it.

**Non-printable border.** Most office and consumer printers cannot print within roughly 3–5 mm of the edge,
and often 6.4 mm at the trailing edge. 15 mm margins minimum on unknown hardware, and treat the outer 5 mm as
void — no rules, no folios, no cut marks that must survive.

## 2. The `@page` reference

```css
@page {
  size: A4 portrait;          /* keyword | `210mm 297mm` | `auto` */
  margin: 18mm 16mm 20mm 16mm;
}

/* Named page — apply with the `page` property. Narrower support than size/margin. */
@page annexe { size: A4 landscape; margin: 14mm; }
.annexe      { page: annexe; }

/* Pseudo-classes, for duplex documents with a binding edge. */
@page :first { margin-top: 32mm; }
@page :left  { margin-right: 24mm; }
@page :right { margin-left: 24mm; }
```

| Descriptor | Support | Notes |
|---|---|---|
| `size` | Widest | Keyword or explicit dimensions. `auto` inherits the print dialog's guess — never what you want. |
| `margin` (and `-top`/`-right`/`-bottom`/`-left`) | Widest | Absolute units only; `%` resolves against the sheet, not the content. |
| `page-orientation` | Partial | Rotation applied after layout, so it does not reflow. |
| `@top-center` and the other 15 margin at-rules | Not implemented in browsers | Do not build running headers from these. Use `position: fixed` inside `@media print`, or the renderer's own header/footer API. |
| `background`, `border`, `color`, `font`, `width`, `height` on `@page` | Not implemented in any browser | Specified, unshipped. |

**Named pages** (`page: name`) have materially narrower support than `size`/`margin`. Verify against the
single renderer you ship before designing a document that needs them.

**Running headers and page numbers without the margin at-rules:**

```css
@media print {
  .running-header { position: fixed; top: 0; left: 0; right: 0; }
  .running-footer { position: fixed; bottom: 0; left: 0; right: 0; }
  body { margin-top: 24mm; margin-bottom: 22mm; }  /* reserve their space */
}
```

CSS counters can produce "Page N", but `counter(pages)` for the total is unreliable in browser engines. If
the document needs "Page 3 of 7", generate it server-side (a PDF library knows the page count; a two-pass
browser render can be made to) rather than in CSS.

## 3. Fragmentation

```css
@media print {
  h1, h2, h3, h4         { break-after: avoid; }
  figure, .card, tr, li,
  .signature-block,
  .total-block           { break-inside: avoid; }
  .annexe, .new-section  { break-before: page; }
  thead                  { display: table-header-group; }
  tfoot                  { display: table-footer-group; }
  p                      { orphans: 3; widows: 3; }
}
```

| Property | Values that matter | Support |
|---|---|---|
| `break-before` / `break-after` | `auto`, `avoid`, `page`, `avoid-page`, `left`, `right` | Broad |
| `break-inside` | `auto`, `avoid`, `avoid-page` | Broad |
| `orphans` / `widows` | integer ≥1 | Chromium and WebKit; **not implemented in Firefox** (bug 137367, open since 2002). MDN classifies both as limited availability, not Baseline. |
| `page-break-*` (legacy aliases) | as above | Universal, including old engines; redundant in current Chromium. |

Behaviour worth knowing:

- **`break-inside: avoid` on a block taller than the page area is unsatisfiable.** The renderer breaks it
  anyway, usually at a worse place than it would have chosen freely. Apply it to rows, cards and small
  blocks; never to a whole section.
- **`break-inside: avoid` interacts badly with `display: flex` and `grid`** in several engines — a flex
  container's children may be treated as unbreakable regardless. For a document meant to paginate, block and
  table layout are more predictable than flex or grid.
- **`position: absolute` and `sticky` do not paginate.** Absolutely positioned content appears on one page or
  none. Sticky is meaningless without a scroll container.
- **`overflow: hidden` and `height: 100vh` are the two declarations that most often clip a printout.** `vh`
  resolves against the page box, so `100vh` on a wrapper caps the whole document at one page and drops
  everything after it. Reset both in `@media print`.
- **Table headers repeat only via `display: table-header-group` on a real `<thead>`.** A div-based grid gives
  you nothing; you redraw the header yourself, per page.

## 4. Colour, backgrounds and forcing the light theme

```css
@media print {
  :root { color-scheme: light; }              /* stop the UA painting a dark canvas */

  /* The dark block must not reach print at all. */
  /* @media screen and (prefers-color-scheme: dark) { … }   ← scope it to `screen` */

  body { background: #fff; color: #000; }

  /* Enhancement only. Never load-bearing. */
  thead th { print-color-adjust: exact; -webkit-print-color-adjust: exact; }

  /* Load-bearing, and the one legitimate forced case. */
  .qr { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
```

The user's "Background graphics" checkbox in the print dialog overrides `print-color-adjust` in every engine,
and it defaults to off. The spec is explicit that user-agent options for colour and image printing take
priority, and that each engine may handle the property as it sees fit. Treat it as a request.

**Constructions that survive the fill being dropped:**

| Screen | Print equivalent |
|---|---|
| Dark header band, white text | Bold text, 1.5 pt rule above and below |
| Tinted "selected" row | `▸` marker in a leading column, or bold |
| Solid status badge, reverse text | Outlined badge, dark text, plus the status word |
| Colour-coded left border | Border kept (borders print), plus a label |
| Zebra striping | Keep as ≤10% tint via `print-color-adjust`, but the table must read without it |

**Links.** On paper a link is invisible. Print the destination for external links, suppress it for fragment
and `mailto:` links where the visible text already carries it:

```css
@media print {
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.85em; word-break: break-all; }
  a[href^="#"]::after,
  a[href^="mailto"]::after { content: ""; }
}
```

## 5. Renderer selection

| | Headless browser (`page.pdf()`, WeasyPrint, wkhtmltopdf) | PDF library (pdf-lib, PDFKit, ReportLab, react-pdf) |
|---|---|---|
| Layout | Full CSS, text shaping, automatic pagination | None. You place every element at a coordinate |
| Wrapping | Free, with hyphenation and `text-wrap` | You write it, and measure every string |
| Pagination | Automatic, influenced by `break-*` | You write the page-break check |
| Determinism | Varies with Chromium version and available fonts | Byte-stable for the same input |
| Deploy cost | A Chromium: ~300 MB, cold starts, memory ceilings on serverless | A few hundred KB |
| Source of truth | Shared with the web app | Separate implementation |
| Best for | Content-shaped documents: reports, invoices with variable-length tables | Fixed-geometry artefacts: cards, labels, notices, anything with a QR sized in mm |

Pin one per artefact. The same document through both will differ in line breaks, hyphenation and where page
2 starts, and chasing that difference is unbounded work.

**Browser-specific traps**

- `page.pdf()` uses the print path, not the screen path. `@media screen` rules do not apply, and lazy-loaded
  images, `IntersectionObserver` content and animations mid-flight will not be there. Wait for fonts
  (`document.fonts.ready`) and for images before capturing.
- `printBackground` defaults to `false` in Puppeteer. Even with `print-color-adjust: exact` in the CSS, no
  fill appears until you pass `printBackground: true`.
- Header and footer templates are a **separate mini-document** with their own font resolution and their own
  margin arithmetic. They do not inherit page CSS, they are rendered at a default scale, and they are clipped
  to the margin you reserved. Inline all their styles.
- `preferCSSPageSize: true` makes `@page { size: … }` win over the API's `format`. Without it the API wins and
  your `@page` is ignored — a common cause of "my A4 rule does nothing".
- Font availability differs between your laptop and a slim container image. A missing font falls back
  silently and every measurement shifts. Ship the font files with the image and declare them with `@font-face`
  pointing at local files, rather than relying on system fonts.
- Chrome's own desktop print dialog and headless `page.pdf()` can produce different glyph advances for the
  same font. Do not accept a desktop-print check as evidence the server output is right.

**Library-specific traps**

- **You own pagination.** Compute a block's height *before* drawing: wrapped line count × leading + padding.
  Check `y − blockHeight ≥ bottomMargin + footerHeight` and start a new page before drawing, not after
  discovering the overflow.
- **A greedy wrapper has no widow control and no hyphenation.** A single long token — an IBAN, a URL, a
  compound word — exceeds the measure and is emitted as one over-wide line that runs off the page. Break long
  tokens explicitly.
- **Letter-spacing is often unimplemented**, so tracked micro-labels get drawn character by character with a
  manual advance. Correct, but it also means the string is emitted as N separate text runs and extracts from
  the PDF with spaces between every letter. Keep it for short labels only.
- **Ligature and shaping bugs.** Some libraries mis-advance multi-codepoint glyphs; a `fi` ligature can render
  as "Veri fi cat" and extract as garbage. Disabling `liga`/`rlig`/`calt` is a legitimate fix for a document
  face, and costs nothing at document sizes.
- **`subset: true` is a correctness decision, not just a size one.** Subsetting against one render pass and
  reusing the font object for later content with new characters yields missing glyphs. Subset per document,
  against that document's actual strings.

## 6. Fonts in generated documents

- **Embed every face and weight used.** A non-embedded font resolves against the reader's viewer; "Arial" on
  a Linux print server is not Arial, and a synthesised bold looks like a fax.
- **Synthetic italic and bold are visible.** If the design uses them, ship the real files.
- **Subsetting** cuts a text face from ~340 KB to tens of KB. Where content is dynamic, subset against the
  full catalogue of strings the product can emit, or do not subset.
- **A missing glyph raises no error.** It draws as an empty box or as nothing. The only defence is a test that
  walks every printable string and asserts coverage:

  ```ts
  const font = fontkit.create(fs.readFileSync(FONT_PATH));
  const missing = [...text].filter(
    (ch) => !/\s/.test(ch) && !font.hasGlyphForCodePoint(ch.codePointAt(0)!)
  );
  expect(missing).toEqual([]);
  ```

  Run it over every catalogue, label and legal-reference string, not over a sample. Superscripts, currency
  symbols, `·`, `–`, `—`, `„ ”` and diacritics are the usual casualties.
- **Verify text extraction, not appearance.** On an invoice or a legal document the text must be selectable and
  searchable. Extract it back out of the generated PDF in a test and compare against the input; visual
  inspection will not catch a document whose glyphs draw correctly and extract as mojibake.
