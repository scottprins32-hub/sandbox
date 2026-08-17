---
name: typography-system
description: Settles the actual type values for a product — which typefaces, the size scale with tracking and line-height baked in per step, measure, weight as a hierarchy lever, tabular figures, webfont loading, and the WCAG floors for resize and text spacing. Use this whenever a type decision is being made or reviewed — even if the user never says "typography", "font" or "type scale" — including "what font should I use", "pick a type scale", "my headings look wrong", "this looks like a Word document", "our numbers jump around in the table", "the page jumps when fonts load", "how big should body text be", or any diff touching `font-size`, `line-height`, `letter-spacing` or `@font-face`. Sized for paper rather than a screen — pt and mm, a legibility floor set by viewing distance — is `print-and-physical-artefacts`. Use it alongside `depth-and-overlays`, which owns text set over a photograph or a scrim, and `color-and-theming`, which owns text colour and contrast tokens; this skill owns the faces, sizes, spacing-per-step and measure. On a new project settle type before spacing, because the type sizes determine what the spacing scale has to accommodate.
---

# Typography system

Most of what you call an interface is text. Buttons are text in a box, tables are text in a grid, and the
part users actually read is nearly all of it. This skill settles the values: which faces, which sizes, what
tracking and leading go with each size, how wide a paragraph may be, and how the fonts arrive without moving
the page. What goes wrong without it is not exotic — it is a screen with seven sizes that differ by 2px each,
a 48px heading still carrying the spacing it was drawn for at 14px, paragraphs running the full 1440px of the
viewport, and a table whose numbers shuffle sideways every time they refresh. Nobody in the review can name
the problem, so it gets blamed on the colours.

`attention-and-hierarchy` owns *why* size and weight create rank, and how the eye scans. Read it for the
mechanism, this for the numbers. `spacing-and-layout` owns the space between things — but settle type first,
because type sizes and line-heights determine what the spacing scale has to accommodate.

## When this is the right skill

- Starting any project: choosing typefaces and defining the scale before writing components.
- "Which font", "how many fonts", "what sizes should I use", "give me a type scale".
- Text that is hard to read, headings that look weak or bloated, a page that "looks like a document".
- Tables, dashboards, prices, timers, counters — anything where digits sit in a column or update in place.
- Font loading: flash of unstyled text, layout shift on load, slow first paint, self-hosting decisions.
- Accessibility review touching text size, zoom, user font-size preferences, or text-spacing overrides.
- Any diff containing `font-size`, `line-height`, `letter-spacing`, `@font-face`, or a Google Fonts `<link>`.

Go elsewhere when: the question is **gaps, padding and layout structure** → `spacing-and-layout`. **Which
element should be loudest, and why people miss things** → `attention-and-hierarchy`. **Text colour and
contrast tokens** → `color-and-theming` (this skill states the floors that constrain them). **Text over
imagery** → `depth-and-overlays`. **What the words say** → `persuasive-copy`. **Whether the whole thing looks
generic** → `taste-frontend-design`. **How text animates in** → `design-motion-principles`. `ui-craft` is the
router for this set.

## Decide first

Six answers fix every number below. Settle them once, write them into `@theme` or `:root` on day one.

1. **Density** — pick one of the three named in `ui-craft` (editorial / product / dense tool); the archetype
   table in `ux-psychology` tells you which surface you are on. An editorial surface wants **at
   most about six sizes across a wide range** — 14px to 64px — because size *is* the hierarchy when there are
   eight things on screen. A dashboard wants **about five sizes in a tight range, rarely exceeding 24px**,
   because there are four hundred things on screen and density is the product. Marketing sizes in a dashboard
   look like a ransom note; dashboard sizes on a landing page look like an internal admin tool.
2. **One typeface, or a justified second?** See move 1. Deciding after ten components is how a codebase ends
   up with four families and no rationale.
3. **Webfont or system stack?** A webfont is 15–60KB, a loading strategy and a layout-shift risk. `system-ui`
   is free, instant, and ships every weight plus tabular figures. Product UI can often take the system stack;
   brand surfaces usually cannot. Decide per surface (move 9).
4. **Root sizing: `rem` everywhere.** Non-negotiable for the accessibility floor (move 7), and converting 400
   `px` sizes later is a mechanical but unfunded refactor.
5. **Scripts and languages.** Latin-only subsets to ~20KB. CJK, Cyrillic, Arabic and Devanagari each change
   typeface availability, file strategy and leading (CJK wants a 40-character measure, not 75). German,
   Finnish and Russian strings run 10–35% longer than English and must fit without the layout breaking.
6. **Existing design system?** Adopt its scale and token names even where you would have chosen differently.
   A second type scale in one codebase is worse than one imperfect scale.

**Law, convention, taste.** Each move is tagged. *Law* means a WCAG success criterion or a hard browser
behaviour: comply or ship a defect. *Convention* means a widely shared pattern with a real rationale —
deviate deliberately, document why. *Taste* means defensible judgement you are entitled to overrule.

## The moves

### 1. One typeface is almost always enough — *taste, strongly held*

Pick one good neutral sans and use it for everything: body, headings, buttons, labels, nav. Vary size and
weight, not family.

The mechanism, so you can argue it: a well-made text family already ships six to nine weights, italics, small
caps and figure sets — dozens of distinguishable voices that all share a skeleton, an x-height and one set of
vertical metrics. A second family gives you two of everything that must now be tuned into agreement: matched
optical sizes, matched baselines inside a button, matched leading in a mixed heading. The pairing rarely earns
that back, and the failure mode of a bad pairing (two similar sans faces) is worse than the failure mode of
one face (mild sameness), because readers register "something is off" without being able to localise it.

Faces that work as the single face: Inter, Public Sans, Söhne, Untitled Sans, IBM Plex Sans, Source Sans 3,
Geist, and the system stack. What they share — large x-height, open apertures, unambiguous `I`/`l`/`1` and
`0`/`O`, a real weight range, tabular figures, and no personality that gets tiring at 12px.

**Three legitimate exceptions:**

- **A monospace face for code, IDs, hashes, logs and sometimes tabular data.** Not decoration: fixed advance
  width is a functional requirement when the reader compares strings character by character or scans a column.
- **A display face for brand, used sparingly.** Hero, logotype, maybe H1 — never body copy, never UI chrome.
  If it appears in a button label it has stopped being a display face and become a second UI font.
- **A serif for long-form reading surfaces.** Articles and docs. A serif body with a sans UI is coherent
  because the two never occupy the same role.

Anything beyond these is a decision looking for a reason. How it fails: five families accreted over two years
— the brand face, whatever marketing used, a Google Font someone pasted into a component, `Arial` in an email
template, and a monospace nobody chose. Grep `font-family` before believing you have one.

### 2. Hand-tune the scale; a modular ratio is a starting point, not the answer — *convention*

The rule: a closed set of named sizes, each shipping **its own** line-height and letter-spacing, referenced by
token. Never a raw `font-size` in a component.

**Why a single modular ratio usually loses.** A modular scale multiplies by one constant. From 16px at 1.25
you get 16, 20, 25, 31.25, 39.06 — no 14px, no 12px, and fractional sizes landing text on half pixels. At
1.125 you get 16, 18, 20.25, 22.78, 25.63, 28.83 — six sizes between 16 and 29 that nobody can tell apart, and
you still need four more to reach a hero. The problem is structural: **the ratio you need is not constant.**
At 12–18px a 2px difference is a clear rank change and you need every step; at 40–60px a 2px difference is
invisible. The ratio should *grow* as size grows, and hand-tuning is the name for letting it.

Generate a first draft from a ratio, then round to whole pixels, delete steps you never use, and check every
adjacent pair is distinguishable side by side. Six to eleven steps covers everything.

**The artefact — a product-density scale, tracking and leading baked into each step:**

```css
:root {
  /* Sizes in rem so the user's browser setting still governs.
     letter-spacing in em so it stays proportional. line-height unitless so it inherits as a ratio. */

  --text-2xs:      0.6875rem;  /* 11px */
  --text-2xs-lh:   1.55;   --text-2xs-ls:   0.02em;

  --text-xs:       0.75rem;    /* 12px */
  --text-xs-lh:    1.5;    --text-xs-ls:    0.015em;

  --text-sm:       0.875rem;   /* 14px */
  --text-sm-lh:    1.5;    --text-sm-ls:    0.005em;

  --text-base:     1rem;       /* 16px  ← body, inputs, controls */
  --text-base-lh:  1.5;    --text-base-ls:  0em;

  --text-lg:       1.125rem;   /* 18px */
  --text-lg-lh:    1.45;   --text-lg-ls:   -0.005em;

  --text-xl:       1.25rem;    /* 20px */
  --text-xl-lh:    1.4;    --text-xl-ls:   -0.01em;

  --text-2xl:      1.5rem;     /* 24px  ← dashboards usually stop here */
  --text-2xl-lh:   1.3;    --text-2xl-ls:  -0.015em;

  --text-3xl:      1.875rem;   /* 30px */
  --text-3xl-lh:   1.22;   --text-3xl-ls:  -0.02em;

  --text-4xl:      2.375rem;   /* 38px */
  --text-4xl-lh:   1.15;   --text-4xl-ls:  -0.022em;

  --text-5xl:      3rem;       /* 48px */
  --text-5xl-lh:   1.1;    --text-5xl-ls:  -0.025em;

  --text-6xl:      3.75rem;    /* 60px */
  --text-6xl-lh:   1.05;   --text-6xl-ls:  -0.03em;
}
```

Step ratios: 1.09, 1.17, 1.14, 1.13, 1.11, 1.20, 1.25, 1.27, 1.26, 1.25 — two regimes, not one smooth curve.
From 12px to 20px the steps are a flat 2px, so the ratio *falls* at every one of them — 1.17, 1.14, 1.13, 1.11
— because 2px is already a clear rank change at those sizes and a growing ratio would skip steps you need.
From 20px up it climbs to 1.25–1.27 and holds, because that is where 2px stops being visible. No single
constant reproduces both halves; that is the argument.

**Tailwind v4**, CSS-first. A `--text-*` key plus its `--line-height` / `--letter-spacing` / `--font-weight`
modifiers means one utility carries all of them, which is the whole point:

```css
@import "tailwindcss";

@theme {
  --font-sans: "InterVariable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  --text-sm: 0.875rem;
  --text-sm--line-height: 1.5;
  --text-sm--letter-spacing: 0.005em;

  --text-4xl: 2.375rem;
  --text-4xl--line-height: 1.15;
  --text-4xl--letter-spacing: -0.022em;
  --text-4xl--font-weight: 600;
}
```

Now `class="text-4xl"` is correct on its own. `class="text-4xl tracking-tight leading-none font-semibold"` —
four decisions re-made at every call site — is the thing this replaces.

**Layer role tokens over the steps** so components reference `--font-body`, `--font-ui`, `--font-h2` rather
than a size — the same primitive/semantic split `ui-craft` describes for colour. A density change then edits
one block instead of two hundred components. The full role layer, complete scales for all three densities,
fluid `clamp()` variants and the modular-ratio table are in `references/type-scales.md`.

How it fails: the scale exists in `:root` and components still write `font-size: 15px`. If arbitrary sizes
appear in the diff, the scale is decorative. Lint for it.

### 3. Tracking and leading are functions of size — the optical-size correction — *convention, real mechanism*

**As size goes up, tracking goes down and leading goes down. As size goes down, both go up.**

| Size | `letter-spacing` | `line-height` |
|---|---|---|
| 48px+ display | −0.025em to −0.03em | 1.0 – 1.1 |
| 30–40px | −0.02em | 1.15 – 1.25 |
| 20–28px | −0.01em to −0.015em | 1.3 – 1.4 |
| 16–18px body | 0 to −0.005em | 1.45 – 1.6 |
| 12–14px | +0.005em to +0.015em | 1.5 |
| 11px and below | +0.02em | 1.55 |
| Any size, all caps | +0.05em to +0.1em | unchanged |

**Why this works, properly.** Metal type was cut separately at every size. A 6pt cut had sturdier strokes, a
larger relative x-height and noticeably wider sidebearings than a 72pt cut of the same face, because a design
that survives at 6pt is not the design that looks elegant at 72pt. Phototype and early digital collapsed that
to a single master scaled linearly — so the typeface you are using was almost certainly drawn once, at text
sizes, with spacing tuned to hold up small. Blow it up to 48px and the generous sidebearings scale up with it:
the word looks loose, airy and slightly disintegrated. Negative tracking undoes a scaling artefact. It is a
correction, not a style. The same argument runs the other way: at 11px the sidebearings shrink past the point
where the eye separates adjacent letters, so small text needs tracking added back.

Leading falls with size for a different reason. Leading exists to help the eye return from the end of one line
to the start of the next, and that return sweep is easy when lines are few and enormous, hard when they are
many and small. A 60px hero at 1.5 has 30px between lines, which visually detaches them into separate objects.
Leading should also rise with **measure**, not just fall with size: at 45ch use 1.4–1.45, at 75ch use 1.55–1.65.

**The real fix, where available.** Variable fonts can carry an optical-size axis, `opsz`, which does this
properly — redrawing stroke contrast, x-height and sidebearings per size rather than faking it with tracking.
CSS applies it automatically:

```css
h1 { font-optical-sizing: auto; }             /* the default; opsz follows font-size */
.logo { font-variation-settings: "opsz" 96; } /* override for a specific optical target */
```

Two honest caveats: most webfonts have **no** `opsz` axis, so the manual correction is still your job — check
before assuming. And `opsz` never touches `line-height`; leading is always yours.

**All caps needs tracking added, always.** Capitals were spaced to appear occasionally inside lowercase, not
to run in a row. Bringhurst's rule — letterspace all strings of capitals and small caps — is why
`text-transform: uppercase` on a label looks cramped until you fix it:

```css
.eyebrow {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;   /* mandatory, not stylistic */
  font-weight: 600;
}
```

**Use `em`, never `px`, for `letter-spacing`.** In `px` the tracking stops being proportional the moment size
changes — a `-1px` token is −2% at 48px and −7% at 14px. Design tools export px; convert on the way in.

How it fails: `letter-spacing: -0.05em` on everything because "tight looks modern". Below about −0.03em,
letters touch at heavier weights, `rn` starts reading as `m`, and hinting artefacts appear small. Tighten
display type; leave body type alone.

### 4. Set the measure — the most common readability failure on the web — *convention, with an AAA floor*

**45–75 characters per line for body copy**, 66 as the reference point (Bringhurst); Butterick allows 45–90.
WCAG 2.2 SC **1.4.8 Visual Presentation** (AAA) caps it at **80 characters**, or 40 for CJK.

Why, mechanically: reading is a sequence of saccades, and the hardest is the return sweep back to the start of
the next line. Its accuracy depends on how far the eye travels and how many candidate lines sit near the
landing point. Past ~90 characters the sweep starts missing, readers re-read or skip a line, and the felt
experience is "this is exhausting" rather than "the lines are too long".

The default failure: a `<p>` with no max-width on a 1440px display at 16px is roughly **180 characters per
line**. This is the single most common typographic defect in shipped web pages and it costs one declaration.

```css
.prose { max-width: 65ch; }        /* ~70–78 rendered characters — the top of the band */
.prose-narrow { max-width: 45ch; } /* sidebars, cards, callouts */
```
```css
@theme { --container-prose: 65ch; }  /* Tailwind v4 → max-w-prose */
```

`ch` is the advance width of `0`, not the average character, and `0` is wider than most lowercase, so `65ch`
renders as roughly 70–78 actual characters in a typical sans — the top of the band, and past 1.4.8's 80 in a
face with wide figures. Use `58–60ch` to land near Bringhurst's 66. Either way, set it and then count a real
line; if the font swaps on load, the measure changes with it.

Three notes that matter more than they look:

- **Measure applies to the text element, not the page.** A 1200px section containing a 65ch paragraph is
  fine. Capping the whole layout at 65ch to fix paragraphs breaks every table and image in it.
- **Headings should run shorter** — 20–40 characters. A heading spanning the full measure reads as a
  paragraph and stops working as an entry point.
- **Balance short blocks.** `text-wrap: balance` evens out lines in headings, blockquotes and captions and
  kills the one-word last line; it is capped at six lines in Chromium and ten in Firefox by design, so it
  silently no-ops on a paragraph. `text-wrap: pretty` is the body-copy version. Both degrade to normal
  wrapping, so no fallback is needed.

```css
h1, h2, h3, figcaption, blockquote { text-wrap: balance; }
p { text-wrap: pretty; }
```

### 5. Line-height by role, and surviving the text-spacing override — *convention plus law*

- **Body copy: 1.5** — 1.45 at short measure, up to 1.65 at long. Butterick: 120–145% of size; WCAG 1.4.8
  (AAA) asks for at least 1.5 within paragraphs.
- **Headings: 1.1–1.25**, falling as size rises (move 3).
- **Single-line UI labels — buttons, table headers, chips, nav: 1, or a fixed control height.** A 1.5 ratio
  inside a 32px button wastes 8px and pulls the label off optical centre.
- **Paragraph spacing: at least 0.75× the line-height as margin** — and never both an indent and a space.

**Always unitless.** `line-height: 1.5` inherits as a ratio; `line-height: 24px` inherits as 24px, so a child
at 32px gets 24px of leading and its lines overlap. This is a real production bug, not a style preference.

**Law: WCAG 2.2 SC 1.4.12 Text Spacing (AA).** No loss of content or functionality when the user forces
line-height to 1.5×, paragraph spacing to 2×, letter-spacing to 0.12× and word-spacing to 0.16× of font size.
Note precisely what it asks: not that you *set* those values, but that your layout *survives* a user setting
them. What breaks it is almost always the same thing — a fixed `height` on something containing text, or
`overflow: hidden` on a box sized for exactly two lines. Use `min-height`. Test by pasting this into devtools:

```css
* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
p { margin-bottom: 2em !important; }
```

If anything clips or overlaps, that is a defect, not a preference.

**Optical centring is not vertical centring.** A CSS line box includes ascender and descender space, so text
centred by `line-height` in a button sits a pixel or two low. `text-box: trim-both cap alphabetic` fixes it at
the source — implemented in Chromium and Safari, not yet Baseline, so treat it as progressive enhancement.
Without it, a 1px `padding-bottom` reduction on the label is a legitimate optical correction.

### 6. Weight is the cheapest hierarchy lever you have — *convention*

Size changes the box; weight does not. In a dense UI where nothing has room to grow, weight buys a rank change
for zero layout cost — which is why it is the primary hierarchy channel in dashboards and the secondary one
everywhere else. `attention-and-hierarchy` owns the salience theory; here are the values.

- **400** body copy, long-form text, input values.
- **500** UI labels, buttons, table headers, active nav — the "slightly more important" tier that costs
  nothing. The workhorse, and the most under-used step in most codebases.
- **600** headings, emphasised numbers, the one thing in a card that matters.
- **700** sparingly — display and hero. In a dense table it is shouting.
- **Below 400: never for body text.** 300 and 200 at 14–16px have insufficient stroke mass, lose contrast
  against the background, and thin further under some rendering stacks. This is the classic "looks refined in
  Figma at 200% zoom, unreadable on the actual ticket" failure. A light weight at 48px for brand is a
  different decision and it is fine.

**Load only the weights you use, and use only the ones you loaded.** Ship 400 and 700, write
`font-weight: 600`, and the browser either snaps to a loaded weight or synthesises a fake bold by smearing the
glyphs — wrong shapes, wrong metrics. Catch it in development with `font-synthesis: none`, which renders fake
bold and italic as plain regular so the gap is obvious in review. A variable font with a `wght` axis removes
the whole class of bug, and beats static files at three or more weights.

**Weight interacts with the law.** WCAG 2.2 SC 1.4.3 (AA) requires **4.5:1** for normal text and **3:1** for
large text, where large means **at least 24px, or 18.66px at bold weight** (18pt / 14pt bold). So making a
heading bold can legitimately move it from the 4.5:1 requirement to the 3:1 one — while making a caption
300-weight does not lower its requirement at all and genuinely reduces legibility. Contrast ratio is computed
from colour alone; it knows nothing about stroke width, so treat 3:1 on thin type as a floor you have
technically cleared and practically failed. (APCA, the perceptual successor, does model stroke weight — but it
is draft work toward WCAG 3 and is **not** a conformance standard. Do not cite it as one.)

### 7. Size floors, the 16px input rule, and never blocking user scaling — *law, browser behaviour, convention*

**WCAG sets no minimum font size.** Widely believed, and false. What it sets is SC **1.4.4 Resize Text** (AA):
text must scale to **200%** without loss of content or functionality — plus the contrast requirements above.
Everything else in this list is convention.

- **Body copy: 16px (1rem).** The browser default, which makes it the size a user implicitly chose by not
  changing it. Butterick recommends 15–25px for web body text. Below 16px on a marketing page or an article
  is a decision you should be able to defend.
- **Secondary and dense UI: 14px.** Fine for tables, helper text and metadata read deliberately.
- **12px is the practical floor** for anything a user must read; 11px for glanceable chrome only — Apple HIG
  sets 11pt as the iOS minimum and Material's smallest label is 11sp, so you are at the edge of what two
  mature systems endorse.
- **Below 11px, nothing.** Not a disclaimer, not a timestamp. If it is too unimportant to read, delete it; if
  it is legally required, it is required to be readable.

**Browser behaviour, not preference: iOS Safari zooms the viewport when you focus an input whose computed
`font-size` is under 16px**, leaving the page zoomed and off-centre until the user pinches back. It hits
`<input>`, `<textarea>`, `<select>` and any `contenteditable` editor surface (CodeMirror, ProseMirror, Slate).
Android does not do this.

```css
/* Correct fix — the input is genuinely 16px */
input, select, textarea { font-size: 1rem; }

/* Only if a smaller input is a hard requirement: keep 16px, scale it visually */
.input-sm { font-size: 1rem; transform: scale(0.875); transform-origin: left center; }
```

**The wrong fix is a WCAG 1.4.4 failure**, and it is everywhere:

```html
<!-- Never. This disables pinch zoom for every user on the page. -->
<meta name="viewport" content="width=device-width, maximum-scale=1, user-scalable=no">
```

**Root sizing, and a correction to the usual folklore.** Two rules that get conflated:

- **`html { font-size: 16px }` is the real defect.** A `px` length on the root *overrides* the user's chosen
  base size, so someone who set their browser to 24px because they need 24px gets 16px — and everything sized
  in `rem` beneath it is now wrong too.
- **`html { font-size: 62.5% }` — the "1rem = 10px" trick — is usually described as breaking accessibility.
  It does not.** A percentage scales the user's setting proportionally: a 24px preference becomes a 15px base
  and `1.6rem` still renders at 24px. The genuine objections are different and still sufficient — every value
  in the codebase now needs dividing by ten, and any third-party CSS or pasted component that assumes
  `1rem ≈ 16px` renders at 62.5% of its intended size. Skip it for that reason, not the wrong one.

Size **every** font-size in `rem`. `em` compounds when nested — an `em`-sized badge inside an `em`-sized card
inside an `em`-sized panel produces sizes nobody chose. Reserve `em` for things that should track their
parent: `letter-spacing`, inline code, icon sizing inside a label.

**Fluid type must keep a `rem` term in the middle of the `clamp()`:**

```css
h1 { font-size: clamp(2rem, 1.5rem + 2.5vw, 3.5rem); }  /* scales with viewport AND user text size */
h1 { font-size: clamp(32px, 5vw, 56px); }               /* broken — viewport-only; risks 1.4.4 */
```

### 8. Figures: tabular, lining, and the slashed zero — *convention, and it matters wherever there are numbers*

Most sans faces default to **proportional** figures, where `1` is narrower than `8`. In prose that is correct.
In a column of numbers it means digits never line up vertically, and in a value that updates in place — a
timer, a counter, a live price, a percentage — the text visibly jitters sideways on every tick. One
declaration fixes both.

```css
.numeric, td.num, .price, .timer, .metric {
  font-variant-numeric: tabular-nums lining-nums;
  text-align: right;   /* right-align numeric columns; units and labels left-align */
}
```

- **`tabular-nums`** — every digit gets the same advance width. Tables, money, counters, timers, durations,
  IDs: anything in a column or anything that changes in place.
- **`lining-nums`** — all figures at cap height on the baseline. The default in most sans faces, but state it,
  or a face with old-style figures will drop the `7` below the baseline in your table.
- **`oldstyle-nums`** — text figures with ascenders and descenders. Genuinely better *inside running prose* in
  an editorial face. Never in a table.
- **`slashed-zero`** — wherever `0`/`O` confusion is costly: serial numbers, licence keys, API tokens, part
  numbers, coordinates.

Prefer `font-variant-numeric` over the low-level `font-feature-settings: "tnum"` — the high-level property
composes with inheritance and with sibling font-variant properties; the low-level one silently resets every
feature a previous declaration set.

**These only work if the font ships the OpenType feature.** Inter, Roboto, IBM Plex, Source Sans, SF and Segoe
UI all do; many display and free faces do not. Two-second test: render `111111` and `000000` in the same
element and compare widths. If they differ, `tabular-nums` did nothing and you need a different face for
numeric columns — a monospace column is a legitimate fallback. Also check your subsetting kept `tnum`;
dropping it is a common self-inflicted bug.

**Do not apply `tabular-nums` globally.** In prose it puts `1` in a too-wide slot and the text develops gaps.

### 9. System stack versus webfonts, and loading without moving the page — *convention, measurable cost*

**The system stack costs zero bytes, causes zero layout shift, renders on the first paint, and ships every
weight plus tabular figures on every platform.**

```css
--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

Its real cost is not aesthetic timidity — it is that **the same page renders in a different typeface on every
platform**, with different x-heights and metrics, so your measure, vertical rhythm and button widths differ per
OS and a design signed off on a Mac is not what a Windows user sees. Fine for an internal console; usually not
for a brand surface. The middle path that often wins: system stack for product UI, one webfont for marketing.

If you load a webfont, five rules cover almost all of it. Each is expanded, with commands and generated
values, in `references/webfont-loading.md`.

1. **Self-host, WOFF2 only.** Cross-site font caching died when browsers partitioned their HTTP caches
   (Chrome 86 and equivalents), so a third-party font host now buys an extra DNS lookup and TLS handshake on
   the critical path and nothing else. Every current browser supports WOFF2; WOFF/TTF fallbacks double the
   payload for nobody.
2. **Subset, then declare `unicode-range`.** Latin-only subsetting typically takes a face from 150–300KB to
   **15–25KB** per style. `unicode-range` does not subset anything — it tells the browser which of your
   already-subsetted files a page needs. Do both, and keep `tnum`/`lnum`/`kern`/`liga` in the feature list.
3. **`font-display: swap`.** Per spec, `swap` gives an extremely small block period and an **infinite** swap
   period: text paints immediately in the fallback and is replaced whenever the webfont lands. That trades a
   flash of fallback text for never showing invisible text, which is the accessibility-relevant property —
   with `block`, a slow connection shows a page with no readable text at all. Use `optional` — small block,
   **zero** swap — when stability outranks brand: the font is used only if already cached, so first visits
   shift nothing.
4. **Preload only the files used above the fold**, each with `crossorigin`. That attribute is mandatory even
   same-origin: fonts are fetched in CORS anonymous mode, so a preload without it downloads the file twice and
   makes things strictly worse. Preloading everything prioritises nothing.
   ```html
   <link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>
   ```
5. **Metric-match the fallback, or accept the shift.** The step almost everyone skips, and the actual fix for
   font-swap layout shift. Declare a second `@font-face` wrapping a local system font, with `size-adjust`,
   `ascent-override`, `descent-override` and `line-gap-override` set so its line box is identical to the
   webfont's — the swap then changes glyphs and moves nothing. **Generate the numbers** (Fontaine, `next/font`,
   a fallback-metrics generator); they derive from both fonts' `unitsPerEm`, ascent and descent.

Budget: two files and roughly 50KB is plenty for a marketing page. If you are loading five static weights, you
want the variable file — break-even is around three weights.

### 10. The details that separate typeset from typed — *taste*

`references/typographic-details.md` covers these in full: real punctuation (curly quotes, en and em dashes,
`×`, `…`, non-breaking spaces — and never in code blocks), hanging punctuation and optical alignment,
truncation that actually works, OpenType feature control, internationalisation (string growth, logical
properties, CJK measure and leading, per-script fallbacks), dark-mode weight correction, text over imagery,
and the different rules for email. Read it when polishing, when adding a second locale, or when a build has
"looks fine but feels cheap" as its only review comment.

Two that belong here because they are frequently wrong and cheap to fix:

- **Never justify text on the web.** Browser line-breaking has neither the hyphenation quality nor the
  paragraph-level optimisation that makes justification work in print, so `text-align: justify` produces
  rivers of white space. WCAG 1.4.8 (AAA) asks explicitly that text not be justified.
- **Never let colour alone carry meaning in text** (WCAG 2.2 SC **1.4.1**, level A). A required field marked
  only by a red label, an error shown only as red text, a diff rendered only in red and green — each needs a
  second channel: an icon, a word, a prefix, or a shape.

## Anti-patterns

- **Four typefaces and no rationale.** Grep `font-family` before believing you have one.
- **A modular ratio applied literally**, giving 25.63px and 31.25px steps and no 14px.
- **Two sizes within 2px of each other** in the same scale. Imperceptible; just looks untended. Delete one.
- **Display type at body tracking.** A 56px hero at `letter-spacing: normal` is the most visible sign that
  nobody tuned the type.
- **`letter-spacing` in `px`** — stops being proportional the moment the size changes.
- **`line-height` with units** — children inherit the absolute value and their lines overlap.
- **Body text at weight 300.** Refined in Figma at 200% zoom, unreadable on the actual ticket.
- **`font-size` in `px`** — ignores the user's browser text-size preference (WCAG 1.4.4 risk).
- **`html { font-size: 16px }`** — hard-overrides the user's base size; everything in `rem` below is wrong.
- **`user-scalable=no` or `maximum-scale=1`** — a straight 1.4.4 failure, usually shipped to work around an
  iOS input that should just have been 16px.
- **A fixed `height` on anything containing text.** Breaks 1.4.12 under user overrides, and breaks in German
  before that.
- **Full-width paragraphs** — 180 characters per line on a wide display. One `max-width` fixes it.
- **`text-wrap: balance` on body copy** — silently no-ops past six lines; you wanted `pretty`.
- **Proportional figures in a table or a live counter** — columns zig-zag, digits jitter on every update.
- **`tabular-nums` on everything**, prose included, producing visible gaps around `1`.
- **A Google Fonts `<link>` in `<head>`** — third-party connection on the critical path, no shared-cache
  benefit since cache partitioning, and little `font-display` control. Self-host.
- **Preloading every weight** — prioritises nothing and delays the resources that matter.
- **A webfont with no metric-matched fallback** — visible reflow on swap and a CLS penalty you can measure.
- **`font-weight: 600` when only 400 and 700 are loaded** — synthetic bold, wrong metrics.
- **Justified text.** Rivers. Always.

## Ship checklist

Run against the screen or the PR diff.

- [ ] One typeface, or a documented exception (mono for code/data, display for brand, serif for long-form).
- [ ] Every `font-size` comes from a scale token; no arbitrary sizes in components.
- [ ] Each scale step ships its own `line-height` and `letter-spacing`; call sites do not re-decide them.
- [ ] Sizes in `rem`; `letter-spacing` in `em`; `line-height` unitless.
- [ ] Size count matches the density: ~6 wide-range steps for marketing, ~5 topping out near 24px for a
      dashboard. No two adjacent steps within 2px.
- [ ] Display sizes carry negative tracking (−0.02em to −0.03em at 48px+) and tight leading (1.0–1.15);
      sizes ≤12px carry slightly positive tracking; every all-caps run has ≥0.05em added.
- [ ] Body copy capped at 45–75 characters (`max-width: 58–65ch`, since `ch` over-counts), verified by
      counting a rendered line.
- [ ] Body `line-height` ≥1.5 at long measure; headings 1.1–1.25; single-line UI labels ~1.
- [ ] Body weight ≥400. No 300-weight body text anywhere.
- [ ] Only loaded weights are used; `font-synthesis: none` in development shows no fake bolds.
- [ ] Tables, money, timers and counters use `font-variant-numeric: tabular-nums lining-nums`, verified with
      the `111111` / `000000` width test.
- [ ] `input, select, textarea` computed `font-size` ≥16px; no `user-scalable=no` in the viewport meta.
- [ ] No `px` `font-size` on `html`; every fluid `clamp()` has a `rem` term in its middle value.
- [ ] **Contrast:** 4.5:1 body text; 3:1 large text (≥24px, or ≥18.66px bold) and UI component boundaries and
      meaningful graphics (WCAG 1.4.3, 1.4.11).
- [ ] **Colour is never the only carrier of meaning** — errors, required fields, statuses and diffs each have
      a second channel (WCAG 1.4.1).
- [ ] **200% zoom:** no content or functionality lost (WCAG 1.4.4).
- [ ] **320px reflow:** no horizontal scrolling, no clipped text (WCAG 1.4.10).
- [ ] **Text-spacing override applied** (line-height 1.5, letter 0.12em, word 0.16em, paragraph 2em): nothing
      clips or overlaps; `min-height` wherever `height` was tempting (WCAG 1.4.12).
- [ ] Focus rings on links and text inputs are visible and not clipped by an overflow container (2.4.7, 2.4.11).
- [ ] Webfonts self-hosted, WOFF2, subsetted, `font-display: swap` (or `optional`), above-the-fold files
      preloaded with `crossorigin`, and a metric-matched fallback declared.
- [ ] `lang` set on `<html>` so hyphenation, quote marks and screen-reader pronunciation are correct.
- [ ] Checked in dark mode — light glyphs bloom on dark backgrounds, so a weight that reads at 400 on white
      may want 350, and pure white on pure black should be pulled off both extremes.

## Sources

- **WCAG 2.2** (W3C Recommendation). The criteria this skill's checklist enforces are 1.4.1, 1.4.3, 1.4.4,
  1.4.10, 1.4.11, 1.4.12, 2.4.7 and 2.4.11, cited inline where they bite; the shared floor with full
  definitions is in `ui-craft` §The accessibility floor. Two things belong to this skill and are not stated
  there. SC **1.4.8 Visual Presentation** (AAA) is the only criterion that touches type composition directly:
  line length ≤80 characters (40 for CJK), line spacing ≥1.5 within paragraphs, paragraph spacing ≥1.5× line
  spacing, and text not justified. And WCAG specifies **no minimum font size** anywhere — every size floor in
  this file is platform guidance or judgment, not law.
- **Robert Bringhurst**, *The Elements of Typographic Style* — 45–75 characters is a satisfactory measure, 66
  widely regarded as ideal; letterspace all strings of capitals and small caps.
- **Matthew Butterick**, *Practical Typography* — body text 15–25px on screen; line spacing 120–145% of size;
  line length 45–90 characters; point size, line spacing and line length as the three decisions that matter
  most for body text.
- **Ellen Lupton**, *Thinking with Type* — type as system rather than ornament; the case for a small closed
  set of styles.
- **Material Design 3** — type scale of five roles (display, headline, title, body, label) × three sizes, with
  size, line-height, weight and tracking as separate tokens per step; body-large is 16sp / 24sp with positive
  tracking, label styles run 14 / 12 / 11sp at medium weight. Verify exact display-size tracking against the
  current token reference before quoting it.
- **Apple Human Interface Guidelines** — Dynamic Type; 11pt minimum text size on iOS/iPadOS; 17pt body.
- **CSS specifications** — Fonts Level 4 (`font-optical-sizing`, `opsz`, `font-variant-numeric`,
  `font-synthesis`, `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`,
  `font-size-adjust`); Font Display (`swap` = extremely small block + infinite swap; `optional` = extremely
  small block + no swap); Text Level 4 (`text-wrap: balance`/`pretty`, `hanging-punctuation`, `hyphens`,
  `overflow-wrap`); Inline Layout Level 3 (`text-box-trim`, `text-box-edge`, `text-box`); Values and Units
  Level 4 (`clamp()`, `ch`, `rem`, `em`).
- **Browser behaviour used above** — iOS Safari zooms the viewport on focus of any form control with computed
  `font-size` below 16px (Android does not); HTTP cache partitioning (Chrome 86 and equivalents) removed the
  cross-site caching benefit of third-party font hosts; `text-wrap: balance` shipped Chrome 114 / Firefox 121 /
  Safari 17.5 and is limited to ~6 lines in Chromium, ~10 in Firefox; `text-wrap: pretty` shipped Chrome 117
  and Safari 26, but Firefox does not support it as of Firefox 156 — a genuine progressive enhancement
  rather than a near-universal one; `text-box-trim` is implemented in Chromium and
  Safari but is not yet Baseline.
- **APCA** — models stroke weight and polarity, which WCAG 2.x contrast ratio does not. Draft work toward
  WCAG 3, **not** a conformance standard; do not use it for compliance claims.
- **Neighbouring skills** — `attention-and-hierarchy` (why size and weight create rank, scan patterns,
  Gestalt); `spacing-and-layout` (the spacing scale type must fit into); `color-and-theming` (text colour
  tokens and contrast generation); `depth-and-overlays` (text over imagery);
  `design-motion-principles` (animating text); `taste-frontend-design` (whether the result looks generic).

**References in this skill.** `references/type-scales.md` — complete scales for marketing, product and
dense-tool densities, the role-token layer, fluid `clamp()` variants, the modular-ratio table and a full
Tailwind v4 `@theme` block; read it when setting up a project or changing density.
`references/webfont-loading.md` — subsetting commands, `unicode-range` splits, variable-vs-static break-even,
metric-override generation, the monospace `font-size` quirk, and how to measure the CLS you are paying; read
it when adding a webfont or debugging layout shift. `references/typographic-details.md` — punctuation, optical
alignment, truncation, OpenType features, internationalisation, dark mode and email; read it when polishing or
adding a locale.
