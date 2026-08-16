---
name: typography-system
description: Settles the actual type values for a product — which typefaces, the size scale with tracking and line-height baked in per step, measure, weight as a hierarchy lever, tabular figures, webfont loading, and the WCAG floors for resize and text spacing. Use this whenever the user is writing or reviewing any interface, page, component, email or document that contains words — even if they never say "typography", "font" or "type scale" — including "what font should I use", "pick a type scale", "my headings look wrong", "this looks like a Word document", "the text is hard to read", "our numbers jump around in the table", "the page jumps when fonts load", "how big should body text be", or any request that involves setting `font-size`, `line-height`, `letter-spacing` or `@font-face`. Most of a UI is text, so reach for this before spacing or colour on any new project.
---

# Typography system

Most of what you call an interface is text. Buttons are text in a box, tables are text in a grid, and the
part users actually read is nearly all of it. This skill settles the values: which faces, which sizes, what
tracking and leading go with each size, how wide a paragraph is allowed to be, and how the fonts arrive
without moving the page. What goes wrong without it is not exotic — it is a screen with seven sizes that
differ by 2px each, a 48px heading still carrying the loose spacing it was drawn for at 14px, paragraphs
running the full 1440px of the viewport, and a table whose numbers shuffle sideways every time they refresh.
Nobody in the review can name the problem, so it gets attributed to the colours.

`attention-and-hierarchy` owns *why* size and weight create rank, and how the eye scans. Read it for the
mechanism. Read this for the numbers. `spacing-and-layout` owns the space between things — but settle type
first, because type sizes and line-heights determine what the spacing scale has to accommodate.

## When this is the right skill

- Starting any project: choosing typefaces and defining the type scale before writing components.
- "Which font", "how many fonts", "what sizes should I use", "give me a type scale".
- Text that is hard to read, headings that look weak or bloated, a page that "looks like a document".
- Tables, dashboards, prices, timers, counters — anything where digits sit in a column or update in place.
- Font loading: flash of unstyled text, layout shift on load, slow first paint, self-hosting decisions.
- Accessibility review touching text size, zoom, user font-size preferences, or text-spacing overrides.
- Any diff containing `font-size`, `line-height`, `letter-spacing`, `@font-face`, or a Google Fonts `<link>`.

Go elsewhere when: the question is **gaps, padding and layout structure** → `spacing-and-layout`. **Which
element should be loudest, and why people miss things** → `attention-and-hierarchy`. **Text colour and
contrast tokens** → `color-and-theming` (this skill states the contrast floors that constrain them).
**Text over an image or a gradient** → `depth-and-overlays`. **What the words say** → `persuasive-copy`.
**Whether the whole thing looks generic** → `taste-frontend-design`. **How text animates in** →
`design-motion-principles`. `ui-craft` is the router for this set.

## Decide first

Six answers fix every number below. Settle them once, write them into `@theme` or `:root` on day one.

1. **Density, from the archetype.** Use the table in `ux-psychology`. A marketing or editorial surface wants
   **at most about six sizes across a wide range** — 14px to 64px — because size *is* the hierarchy when
   there are eight things on the screen. A dashboard or ops console wants **about five sizes in a tight
   range, rarely exceeding 24px**, because there are four hundred things on the screen and information
   density is the product. Push marketing sizes into a dashboard and you get a ransom note; push dashboard
   sizes onto a landing page and it reads as an internal admin tool.
2. **One typeface, or a justified second?** See move 1. Deciding this after you have built ten components is
   how a codebase ends up with four families and no rationale.
3. **Webfont or system stack?** A webfont is 15–60KB of render-blocking-ish payload, a loading strategy, and
   a layout-shift risk. `system-ui` is free, instant, and ships every weight plus tabular figures. Product
   UI can often take the system stack; brand surfaces usually cannot. Decide per surface (move 9).
4. **Root sizing: `rem` everywhere.** Non-negotiable for the accessibility floor (move 7). Decide now, because
   converting 400 `px` font sizes later is a mechanical but unfunded refactor.
5. **Scripts and languages.** Latin-only lets you subset to ~20KB. CJK, Cyrillic, Greek, Arabic, Devanagari
   each change typeface availability, file size strategy, and line-height (CJK needs looser leading and has a
   40-character measure guideline, not 75). Also decide whether German, Finnish and Russian strings — which
   run 30–100% longer than English — must fit without wrapping. They usually must not have to.
6. **Existing design system?** Material, Apple HIG, Tailwind's defaults, Radix, a company system — adopt its
   scale and its token names even where you would have chosen differently. A second type scale in one
   codebase is worse than one imperfect scale.

**Law, convention, taste.** Each move is tagged. *Law* means a WCAG success criterion or a hard browser
behaviour: comply or you ship a defect. *Convention* means a widely shared pattern with a real rationale —
deviate deliberately, document why. *Taste* means defensible judgement you are entitled to overrule.

## The moves

### 1. One typeface is almost always enough — *taste, strongly held*

Pick one good neutral sans and use it for everything: body, headings, buttons, labels, nav. Vary size and
weight, not family.

This is taste, not law, and it is worth knowing the mechanism so you can argue it. A well-made text family
already ships six to nine weights, italics, small caps and figure sets — that is dozens of distinguishable
voices, all of which share a skeleton, an x-height and a set of vertical metrics. Two families give you two
of everything that must now be tuned into agreement: matched optical sizes, matched baselines inside a
button, matched leading in a mixed heading. The pairing rarely earns back that cost, and the failure mode of
a bad pairing (two similar sans faces) is worse than the failure mode of one face (mild sameness), because
readers register "something is off" without being able to localise it.

Faces that work as the single face: Inter, Public Sans, Söhne, Untitled Sans, IBM Plex Sans, Source Sans 3,
Geist, and the system stack. What they share: large x-height, open apertures, unambiguous `I`/`l`/`1` and
`0`/`O`, a real range of weights, tabular figures, and no personality that gets tiring at 12px.

**Three legitimate exceptions:**

- **A monospace face for code, IDs, hashes, logs, and sometimes tabular data.** This is not decoration —
  fixed advance width is a functional requirement when the reader compares strings character by character or
  scans a column. Use `ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`.
- **A display face for brand, used sparingly.** A distinct face on the hero, the logotype and maybe H1 —
  never in body copy, never in UI chrome. If it appears in a button label, it has stopped being a display
  face and become a second UI font.
- **A serif for long-form reading surfaces.** Articles, docs, and editorial. A serif body with a sans UI is a
  coherent two-family system because the two never occupy the same role.

Anything beyond these is a decision looking for a reason.

How it fails: five families accreted over two years — the original brand face, whatever the marketing page
used, a Google Font someone pasted into a component, `Arial` in an email template, and a monospace nobody
chose. Grep for `font-family` before believing you only have one.

### 2. Hand-tune the scale; a modular ratio is a starting point, not the answer — *convention*

The rule: a closed set of named sizes, each shipping its **own** line-height and letter-spacing, referenced
by token. Never a raw `font-size` in a component.

**Why a single modular ratio usually loses.** A modular scale multiplies by one constant. From 16px at 1.25
you get 16, 20, 25, 31.25, 39.06 — no 14px, no 12px, and fractional sizes that land text on half pixels.
At 1.125 you get 16, 18, 20.25, 22.78, 25.63, 28.83 — six sizes between 16 and 29 that nobody can tell
apart, and you still need four more to reach a hero. The problem is structural: **the ratio you need is not
constant**. Down at 12–18px, a 2px difference is a clear rank change and you need every step. Up at 40–60px,
a 2px difference is invisible and useless. So the ratio should *grow* as size grows. Hand-tuning is just the
name for letting it.

Use a modular ratio to generate a first draft, then round to whole pixels, delete the steps you never use,
and check every adjacent pair is distinguishable side by side. Six to eleven steps is the whole range.

**The artefact — a product-density scale, tracking and leading baked into each step:**

```css
:root {
  /* Type scale. Sizes in rem so the user's browser setting still governs.
     letter-spacing in em so it stays proportional at any size. line-height unitless. */

  --text-2xs:      0.6875rem;  /* 11px */
  --text-2xs-lh:   1.55;
  --text-2xs-ls:   0.02em;

  --text-xs:       0.75rem;    /* 12px */
  --text-xs-lh:    1.5;
  --text-xs-ls:    0.015em;

  --text-sm:       0.875rem;   /* 14px */
  --text-sm-lh:    1.5;
  --text-sm-ls:    0.005em;

  --text-base:     1rem;       /* 16px  ← body, inputs, controls */
  --text-base-lh:  1.5;
  --text-base-ls:  0em;

  --text-lg:       1.125rem;   /* 18px */
  --text-lg-lh:    1.45;
  --text-lg-ls:    -0.005em;

  --text-xl:       1.25rem;    /* 20px */
  --text-xl-lh:    1.4;
  --text-xl-ls:    -0.01em;

  --text-2xl:      1.5rem;     /* 24px  ← dashboards usually stop here */
  --text-2xl-lh:   1.3;
  --text-2xl-ls:   -0.015em;

  --text-3xl:      1.875rem;   /* 30px */
  --text-3xl-lh:   1.22;
  --text-3xl-ls:   -0.02em;

  --text-4xl:      2.375rem;   /* 38px */
  --text-4xl-lh:   1.15;
  --text-4xl-ls:   -0.022em;

  --text-5xl:      3rem;       /* 48px */
  --text-5xl-lh:   1.1;
  --text-5xl-ls:   -0.025em;

  --text-6xl:      3.75rem;    /* 60px */
  --text-6xl-lh:   1.05;
  --text-6xl-ls:   -0.03em;
}
```

Step ratios: 1.09, 1.17, 1.14, 1.13, 1.11, 1.20, 1.25, 1.27, 1.26, 1.25. Accelerating, exactly as argued.

**Layer role tokens over it.** Components reference roles, never steps — the same primitive/semantic split
`ui-craft` describes for colour. A density change then edits one block instead of two hundred components.

```css
:root {
  --font-body:      var(--text-base);   --font-body-lh:    var(--text-base-lh);
  --font-ui:        var(--text-sm);     --font-ui-lh:      1.2;   /* single-line labels override leading */
  --font-caption:   var(--text-xs);     --font-caption-lh: var(--text-xs-lh);
  --font-h3:        var(--text-xl);     --font-h2:         var(--text-2xl);
  --font-h1:        var(--text-3xl);    --font-display:    var(--text-5xl);
}
```

**Tailwind v4**, CSS-first — a `--text-*` key plus its `--line-height` / `--letter-spacing` / `--font-weight`
modifiers means one utility carries all three, which is the whole point:

```css
@import "tailwindcss";

@theme {
  --font-sans: "InterVariable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  --text-sm: 0.875rem;
  --text-sm--line-height: 1.5;
  --text-sm--letter-spacing: 0.005em;

  --text-4xl: 2.375rem;
  --text-4xl--line-height: 1.15;
  --text-4xl--letter-spacing: -0.022em;
  --text-4xl--font-weight: 600;
}
```

Now `class="text-4xl"` is correct on its own. `class="text-4xl tracking-tight leading-none"` — three
decisions re-made at every call site — is the thing this replaces.

Complete scales for marketing, product and dense-tool densities, plus fluid `clamp()` variants and the
modular-ratio reference table, are in `references/type-scales.md`.

How it fails: the scale exists in `:root` and components still write `font-size: 15px`. If arbitrary sizes
appear in the diff, the scale is decorative. Lint for it.

### 3. Tracking and leading are functions of size — the optical-size correction — *convention, with real mechanism*

**The rule, in both directions:**

| Size | `letter-spacing` | `line-height` |
|---|---|---|
| 48px+ display | −0.025em to −0.03em | 1.0 – 1.1 |
| 30–40px | −0.02em | 1.15 – 1.25 |
| 20–28px | −0.01em to −0.015em | 1.3 – 1.4 |
| 16–18px body | 0 to −0.005em | 1.45 – 1.6 |
| 12–14px | +0.005em to +0.015em | 1.5 |
| 11px and below | +0.02em | 1.55 |
| Any size, all caps | +0.05em to +0.1em | unchanged |

**As size goes up, tracking goes down and leading goes down. As size goes down, both go up.**

**Why this works, properly.** Metal type was cut separately at every size. A 6pt cut had sturdier strokes,
a larger relative x-height and noticeably wider sidebearings than a 72pt cut of the same face, because a
design that survives at 6pt is not the design that looks elegant at 72pt. Phototypesetting and early digital
collapsed that to a single master scaled linearly — so the typeface you are using was almost certainly drawn
once, at text sizes, with spacing tuned to hold up small. Blow that up to 48px and you scale the generous
sidebearings up with it: the word looks loose, airy and slightly disintegrated. Negative tracking undoes the
scaling artefact. It is a correction, not a style.

The same argument runs the other way. At 11px the sidebearings scale down past the point where the eye can
separate adjacent letters, especially at low contrast or on a low-DPI display, so small text needs tracking
added back.

Leading tracks size for a different reason: leading exists to help the eye return from the end of one line to
the start of the next, and that return sweep is easy when the lines are few and enormous and hard when they
are many and small. A 60px hero at 1.5 has 30px of gap between lines, which visually detaches them into
separate objects. Also, leading should rise with *measure*, not just fall with size — at 45ch use 1.4–1.45;
at 75ch use 1.55–1.65.

**The real fix, where available.** Variable fonts can carry an optical-size axis, `opsz`, which does exactly
this properly — redrawing stroke contrast, x-height and sidebearings per size instead of faking it with
tracking. CSS applies it automatically:

```css
/* font-optical-sizing: auto is the default; this is what it is doing */
h1 { font-optical-sizing: auto; }            /* opsz follows font-size */
.logo { font-variation-settings: "opsz" 96; } /* override for a specific optical target */
```

Two honest caveats. Most webfonts have **no** `opsz` axis, so the manual tracking correction is still your
job — check with a variable-font inspector before assuming. And `opsz` never touches `line-height`; leading
is always yours to set.

**All caps needs tracking added, always.** Capitals were spaced for occasional appearance inside lowercase
text, not for running in a row. Bringhurst's rule — letterspace all strings of capitals and small caps — is
the reason `text-transform: uppercase` on a label looks cramped until you add `letter-spacing: 0.06em`.

```css
.eyebrow {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;   /* mandatory, not stylistic */
  font-weight: 600;
}
```

**Use `em`, never `px`, for `letter-spacing`.** In `px` the tracking stops being proportional the moment the
size changes — a `-1px` heading token is −2% at 48px and −7% at 14px. Design tools export px; convert on the
way in.

How it fails: `letter-spacing: -0.05em` or worse applied to everything because "tight looks modern". Below
about −0.03em, letters start touching at heavier weights, `rn` reads as `m`, and hinting artefacts appear at
small sizes. Tighten display type; leave body type alone.

### 4. Set the measure — the most common readability failure on the web — *convention, with an AAA floor*

**45–75 characters per line for body copy**, 66 as the reference point (Bringhurst); Butterick allows
45–90. WCAG 2.2 SC **1.4.8 Visual Presentation** (AAA) caps it at **80 characters**, or 40 for CJK.

Why it matters, mechanically: reading is a sequence of saccades, and the hardest one is the return sweep
back to the start of the next line. Its accuracy depends on how far the eye has to travel and how many
candidate lines are near the landing point. Past ~90 characters the sweep starts missing, readers re-read a
line or skip one, and the felt experience is "this is exhausting" rather than "the lines are too long".

The default failure: a `<p>` in a container with no max-width on a 1440px display, at 16px, is roughly
**180 characters per line**. This is the single most common typographic defect in shipped web pages and it
costs one declaration to fix.

```css
.prose { max-width: 65ch; }              /* ~60–75 rendered characters */
.prose-narrow { max-width: 45ch; }       /* sidebars, cards, callouts */
```

```css
@theme { --container-prose: 65ch; }      /* Tailwind v4 → max-w-prose */
```

`ch` is the advance width of `0` in the current font, not the average character, and `0` is wider than most
lowercase letters — so `65ch` renders as roughly 70–78 actual characters in a typical sans. Set it, then
count a real line before believing the number. If the font swaps on load, the measure changes with it.

Three notes that matter more than they look:

- **Measure applies to the text element, not the page.** A 1200px section containing a 65ch paragraph is
  fine. Capping the whole layout at 65ch to fix paragraphs breaks every table and image in it.
- **Headings can and should run shorter.** 20–40 characters. A heading spanning the full measure reads as a
  paragraph, and the eye stops treating it as an entry point.
- **Balance short text blocks.** `text-wrap: balance` evens out lines in headings, blockquotes and captions
  and eliminates the one-word last line. It is capped at six lines in Chromium and ten in Firefox by design,
  so it will silently no-op on a paragraph. `text-wrap: pretty` is the body-copy version — it prevents
  orphans at a small layout cost. Both degrade to normal wrapping with no fallback needed.

```css
h1, h2, h3, figcaption, blockquote { text-wrap: balance; }
p { text-wrap: pretty; }
```

### 5. Line-height by role, and surviving the text-spacing override — *convention plus law*

- **Body copy: 1.5** — 1.45 at short measure, up to 1.65 at long measure. Butterick: 120–145% of size;
  WCAG 1.4.8 (AAA) asks for at least 1.5 within paragraphs.
- **Headings: 1.1–1.25**, falling as size rises (move 3).
- **Single-line UI labels — buttons, table headers, chips, nav: 1 or a fixed control height.** A 1.5 ratio
  inside a 32px button wastes 8px and pulls the label off optical centre.
- **Paragraph spacing: at least 0.75× the line-height as margin, and never both an indent and a space.**

**Always unitless.** `line-height: 1.5` inherits as a ratio; `line-height: 24px` inherits as 24px, so a
child at 32px gets 24px of leading and its lines overlap. This is a real bug you will meet in production.

**Law: WCAG 2.2 SC 1.4.12 Text Spacing (AA).** No loss of content or functionality when the user forces
line-height to 1.5×, paragraph spacing to 2×, letter-spacing to 0.12×, and word-spacing to 0.16× of font
size. Note precisely what this asks: not that you *set* those values, but that your layout *survives* a user
setting them. What breaks it is almost always the same thing — a fixed `height` on something containing
text, or `overflow: hidden` on a box sized for exactly two lines. Use `min-height`. Test by pasting the
override into devtools:

```css
* { line-height: 1.5 !important; letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important; }
p { margin-bottom: 2em !important; }
```

If anything clips or overlaps, that is a defect, not a preference.

**Optical centring is not the same as vertical centring.** A CSS line box includes ascender and descender
space, so text centred with `line-height` in a button usually sits a pixel or two low — the descender space
is counted but empty. `text-box-trim` / `text-box-edge` (shorthand `text-box`) fixes this at the source by
trimming to cap-height and alphabetic baseline. It shipped in Safari and Chromium but is not Baseline across
all browsers, so treat it as progressive enhancement:

```css
.button-label { text-box: trim-both cap alphabetic; }  /* enhancement; layout must be fine without it */
```

Without it, a 1px `padding-bottom` nudge on button labels is a legitimate optical correction.

### 6. Weight is the cheapest hierarchy lever you have — *convention*

Size changes the box. Weight does not. In a dense UI where nothing has room to grow, weight buys you a rank
change for zero layout cost — which is why it is the primary hierarchy channel in dashboards and the
secondary one everywhere. `attention-and-hierarchy` owns the salience theory; here are the values.

- **400** body copy, long-form text, input values.
- **500** UI labels, buttons, table headers, active nav — the "slightly more important" tier that costs
  nothing. This is the workhorse and the most under-used step.
- **600** headings, emphasised numbers, the one thing in a card that matters.
- **700** sparingly. Display and hero only. In a dense table it is shouting.
- **Below 400: never for body text.** 300 and 200 at 14–16px have insufficient stroke mass, lose contrast
  against the background, thin further on macOS-style rendering, and are the classic "looks stylish in the
  mock, unreadable on the ticket" failure. If a light weight is used at 48px for brand, that is a different
  decision and it is fine.

**Load only the weights you use, and only the ones you loaded.** If you ship 400 and 700 and write
`font-weight: 600`, the browser either snaps to one of them or synthesises a fake bold by smearing the
glyphs — which looks wrong and breaks the metrics. Catch it in development:

```css
:root { font-synthesis: none; }   /* fake bold/italic now render as regular — obvious in review */
```

A variable font with a `wght` axis removes this class of bug entirely, and beats static files at three or
more weights (below that, statics are smaller).

**Weight and contrast interact with the law.** WCAG 2.2 SC 1.4.3 (AA) requires **4.5:1** for normal text and
**3:1** for large text, where large means **at least 24px, or 18.66px at bold weight** (18pt / 14pt bold).
So making a heading bold can legitimately move it from the 4.5:1 requirement to the 3:1 one — and making a
caption 300-weight does not lower its requirement at all, while genuinely reducing its legibility. Contrast
ratio is computed from colour alone; it does not know about stroke width. Treat 3:1 on thin type as a
floor you have technically cleared and practically failed. (APCA, the perceptual successor, models stroke
weight — but it is draft work for WCAG 3 and is **not** a compliance standard. Do not cite it as one.)

### 7. Size floors, the 16px input rule, and never blocking user scaling — *mixed: law, browser behaviour, convention*

**WCAG sets no minimum font size.** This is widely believed and false. What it sets is SC **1.4.4 Resize
Text** (AA): text must scale to **200%** without loss of content or functionality — plus the contrast
requirements above. Everything else here is convention.

- **Body copy: 16px (1rem).** This is the browser default, which means it is the size a user implicitly
  chose by not changing it. Butterick recommends 15–25px for web body text. Below 16px on a marketing page
  or article is a decision you should be able to defend.
- **Secondary and dense UI: 14px.** Fine for tables, helper text, and metadata a user reads deliberately.
- **12px is the practical floor** for anything the user must read. 11px for glanceable chrome only — Apple
  HIG puts 11pt as the iOS minimum and Material's smallest label style is 11sp, so you are at the edge of
  what two mature systems will endorse.
- **Below 11px, nothing.** Not a legal disclaimer, not a timestamp. If it is too unimportant to read, delete
  it; if it is legally required, it is required to be readable.

**Browser behaviour, not preference: iOS Safari zooms the viewport when you focus an input whose computed
`font-size` is under 16px.** The page then sits zoomed and off-centre until the user pinches back. This hits
`<input>`, `<textarea>`, `<select>`, and any `contenteditable` editor surface (CodeMirror, ProseMirror,
Slate). Android does not do this.

```css
/* Correct fix — the input is genuinely 16px */
input, select, textarea { font-size: 1rem; }

/* Only if a 14px input is a hard design requirement: keep 16px, scale it visually */
.input-sm { font-size: 1rem; transform: scale(0.875); transform-origin: left center; }
```

**The wrong fix is a WCAG 1.4.4 failure**, and it is everywhere:

```html
<!-- Never. This disables pinch zoom for every user on the page. -->
<meta name="viewport" content="width=device-width, maximum-scale=1, user-scalable=no">
```

**Root sizing, and a correction to the usual folklore.** Two rules that are commonly conflated:

- **`html { font-size: 16px }` is the real defect.** A length in `px` on the root *overrides* the user's
  chosen base size, so someone who set their browser to 24px because they need 24px gets 16px. Everything
  sized in `rem` beneath it is now wrong too.
- **`html { font-size: 62.5% }` — the "1rem = 10px" trick — is usually described as breaking accessibility.
  It does not.** A percentage scales the user's setting proportionally, so a 24px preference becomes 15px
  base and `1.6rem` still renders at 24px. The genuine objections are different and still sufficient: every
  value in your codebase now needs dividing by ten, and any third-party CSS or pasted component that assumes
  `1rem ≈ 16px` renders at 62.5% of its intended size. Skip it for that reason, not the wrong one.

Size **every** font-size in `rem`. `em` compounds when nested — an `em`-sized badge inside an `em`-sized card
inside an `em`-sized panel produces sizes nobody chose. Reserve `em` for things that should track their
parent: `letter-spacing`, icon sizing inside a label, and padding that should grow with the text.

**Fluid type must keep a `rem` term in the middle of the `clamp()`:**

```css
/* Good — scales with viewport AND respects the user's text size */
h1 { font-size: clamp(2rem, 1.5rem + 2.5vw, 3.5rem); }

/* Broken — viewport-only. Ignores the user's font-size preference entirely; risks 1.4.4. */
h1 { font-size: clamp(32px, 5vw, 56px); }
```

### 8. Figures: tabular, lining, and the slashed zero — *convention, and it matters for any product with numbers*

Most sans faces default to **proportional** figures, where `1` is narrower than `8`. In prose that is
correct. In a column of numbers it means the digits never line up vertically, and in a value that updates in
place — a timer, a counter, a live price, a progress percentage — the text visibly jitters sideways on every
tick. Both are fixed by one declaration.

```css
.numeric,
td.num,
.price,
.timer,
.metric {
  font-variant-numeric: tabular-nums lining-nums;
  text-align: right;         /* right-align numeric columns; units and labels left-align */
}
```

- **`tabular-nums`** — every digit gets the same advance width. Use for tables, money, counters, timers,
  durations, IDs, anything in a column or anything that changes in place.
- **`lining-nums`** — all figures at cap height, sitting on the baseline. The default in most sans faces, but
  state it explicitly if the face has old-style figures, or a `7` will drop below the baseline in your table.
- **`oldstyle-nums`** — text figures with ascenders and descenders. Genuinely better *inside running prose*
  in an editorial face. Never in a table.
- **`slashed-zero`** — use wherever `0` and `O` confusion is costly: serial numbers, licence keys, API
  tokens, part numbers, coordinates.

Prefer `font-variant-numeric` over the low-level `font-feature-settings: "tnum"`; the high-level property
composes correctly with inheritance and other font-variant properties, the low-level one silently resets
sibling features.

**These only work if the font ships the OpenType feature.** Inter, Roboto, IBM Plex, Source Sans, SF and
Segoe UI all do; many display and free faces do not. Two-second test: render `111111` and `000000` in the
same element and compare their widths. If they differ, `tabular-nums` did nothing and you need a different
face for numeric columns — a monospace column is a legitimate fallback.

**Do not apply `tabular-nums` globally.** In running prose it makes `1` sit in a too-wide slot and the text
develops visible gaps.

### 9. System stack versus webfonts, and loading without moving the page — *convention, with a measurable cost*

**The system stack costs zero bytes, causes zero layout shift, renders on the first paint, and ships every
weight plus tabular figures on every platform.**

```css
:root {
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}
```

Its real cost is not aesthetic timidity — it is that the *same page renders in four different typefaces*
across macOS, Windows, Android and Linux, with different x-heights and different metrics, so your measure,
your vertical rhythm and your button widths all differ per platform. For an internal tool that is a fine
trade. For a brand surface it usually is not.

If you do load a webfont, five rules cover almost all of it:

1. **Self-host, WOFF2 only.** Cross-site font caching has been dead since browsers partitioned their HTTP
   caches (Chrome 86 and equivalents), so a third-party font host buys you an extra DNS lookup and TLS
   handshake on the critical path and nothing else. Every browser that matters supports WOFF2; shipping
   WOFF/TTF fallbacks doubles the payload for no one.
2. **Subset, then declare `unicode-range`.** Latin-only subsetting typically takes a face from 150–300KB to
   **15–25KB** per style. `unicode-range` does not subset anything — it tells the browser which of your
   already-subsetted files a page actually needs. Do both.
3. **`font-display: swap`.** Per the spec, `swap` gives an extremely small block period and an **infinite**
   swap period: text paints immediately in the fallback and is replaced whenever the webfont arrives. This
   trades a flash of fallback text (FOUT) for never showing invisible text (FOIT). Use `optional` — small
   block, **zero** swap period — when layout stability outranks brand fidelity: the font is used only if it
   is already cached, so first visits get the fallback and shift nothing.
4. **Preload the fonts that are actually used above the fold**, and no others. The `crossorigin` attribute is
   mandatory even same-origin — fonts are fetched in CORS anonymous mode, and omitting it causes a second,
   duplicate download.
   ```html
   <link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>
   ```
5. **Metric-match the fallback, or accept the layout shift.** This is the part almost everyone skips and it
   is the actual fix for font-swap CLS. Declare a second `@font-face` that wraps a local system font and
   overrides its metrics so its line box is identical to the webfont's — then the swap changes the glyphs and
   moves nothing:
   ```css
   @font-face {
     font-family: "Inter Fallback";
     src: local("Arial");
     size-adjust: 107%;          /* per-font values — generate them, do not guess */
     ascent-override: 90%;
     descent-override: 22%;
     line-gap-override: 0%;
   }
   :root { --font-sans: "InterVariable", "Inter Fallback", sans-serif; }
   ```
   Generate the numbers with a tool (Fontaine, `next/font`, or a fallback-metrics generator) rather than
   inventing them; they are derived from the two fonts' `unitsPerEm`, ascent and descent.

Budget: two files and roughly 50KB is plenty for a marketing page — one variable font covering the weight
range, plus italic if you genuinely use it. If you are loading five static weights, you want the variable
file. The full recipe, including the monospace `font-size` browser quirk and the `font-size-adjust` fallback,
is in `references/webfont-loading.md`.

### 10. The details that separate typeset from typed — *taste*

Cheap, small, and cumulatively the difference between a UI that looks made and one that looks emitted.

- **Real punctuation.** Curly quotes `“ ” ‘ ’`, apostrophes `’`, en dash `–` for ranges, em dash `—` for
  breaks, `×` for dimensions, `…` as one character. Straight quotes in body copy are a typewriter artefact.
  Never in code blocks, where they change the meaning.
- **Hanging punctuation and optical alignment.** `hanging-punctuation: first` where supported; otherwise a
  blockquote's opening quote mark should be nudged left so the text edge aligns, not the glyph edge.
- **Never justify text on the web.** Browsers have no hyphenation dictionary quality or line-breaking
  sophistication to make it work, so `text-align: justify` produces rivers of white space. WCAG 1.4.8 (AAA)
  explicitly asks that text not be justified.
- **Prevent overflow in unbreakable strings** — URLs, emails, IDs, German compounds:
  ```css
  .breakable { overflow-wrap: break-word; hyphens: auto; }   /* hyphens needs lang= on <html> */
  ```
  Setting `lang` correctly is also what lets screen readers pronounce the page and what enables
  language-appropriate hyphenation and quote marks.
- **Set `font-variant-ligatures: none` on inputs and code.** Ligatures inside a password field or an ID
  string change what the user sees they typed.
- **Do not fake small caps.** `font-variant-caps: small-caps` synthesises by scaling capitals down when the
  font has no real small-cap set, producing letters with wrong stroke weight. Add
  `font-synthesis-small-caps: none` so the failure is visible rather than subtly ugly.
- **Never colour alone to carry meaning in text** (WCAG 1.4.1). A required field marked only by a red label,
  an error distinguished only by red text, a diff shown only in red and green — each needs a second channel:
  an icon, a word, a prefix, or a shape.

## Anti-patterns

- **Four typefaces and no rationale.** Grep `font-family` before you believe you have one.
- **A modular ratio applied literally**, giving 25.63px and 31.25px sizes and no 14px step.
- **Two sizes within 2px of each other** in the same scale. Nobody can perceive it; it just makes the system
  look untended. Delete one.
- **Display type at body tracking.** A 56px hero at `letter-spacing: normal` looks loose and cheap, and it
  is the single most visible tell that nobody tuned the type.
- **`letter-spacing` in `px`.** Stops being proportional the moment the size changes.
- **`line-height` with units.** Children inherit the absolute value and their lines overlap.
- **Body text at weight 300.** Looks refined in Figma at 200% zoom, unreadable on the actual ticket.
- **`font-size` in `px`.** Ignores the user's browser text-size preference (WCAG 1.4.4 risk).
- **`html { font-size: 16px }`.** Hard-overrides the user's base size; everything in `rem` below it is wrong.
- **`user-scalable=no` or `maximum-scale=1`.** Straight 1.4.4 failure, usually shipped to work around an iOS
  input that should just have been 16px.
- **A fixed `height` on anything containing text.** Breaks WCAG 1.4.12 under user text-spacing overrides, and
  breaks in German before that.
- **Full-width paragraphs.** 180 characters per line on a wide display. One `max-width` fixes it.
- **`text-wrap: balance` on body copy.** Silently no-ops past six lines; you wanted `pretty`.
- **Proportional figures in a table or a live counter.** Columns zig-zag, digits jitter on every update.
- **`tabular-nums` on everything**, including prose, producing visible gaps around `1`.
- **A Google Fonts `<link>` in `<head>`.** Third-party connection on the critical path, no shared-cache
  benefit since cache partitioning, and usually no `font-display` control. Self-host.
- **Preloading every weight.** Preloading everything prioritises nothing and delays the critical resources.
- **Webfont with no metric-matched fallback.** Visible reflow on swap and a CLS penalty you can measure.
- **`font-weight: 600` when only 400 and 700 are loaded.** Synthetic bold, wrong metrics.
- **Justified text.** Rivers. Always.

## Ship checklist

Run against the screen or the PR diff.

- [ ] One typeface, or a documented exception (mono for code/data, display for brand, serif for long-form).
- [ ] Every `font-size` comes from a scale token; no arbitrary values in components.
- [ ] Every scale step ships its own `line-height` and `letter-spacing`; call sites do not re-decide them.
- [ ] Sizes in `rem`; `letter-spacing` in `em`; `line-height` unitless.
- [ ] Size count matches the density: ~6 wide-range steps for marketing, ~5 steps topping out near 24px for
      a dashboard.
- [ ] No two adjacent steps within 2px of each other.
- [ ] Display sizes carry negative tracking (−0.02em to −0.03em at 48px+) and tight leading (1.0–1.15).
- [ ] Small sizes (≤12px) carry slightly positive tracking.
- [ ] Every all-caps run has ≥0.05em added tracking.
- [ ] Body copy capped at 45–75 characters (`max-width: ~65ch`), verified by counting a rendered line.
- [ ] Body `line-height` ≥1.5 at long measure; headings 1.1–1.25; single-line UI labels ~1.
- [ ] Body weight ≥400. No 300-weight body text anywhere.
- [ ] Only loaded weights are used; `font-synthesis: none` in development shows no fake bolds.
- [ ] Tables, money, timers and counters use `font-variant-numeric: tabular-nums lining-nums`, verified by
      the `111111` / `000000` width test.
- [ ] `input, select, textarea` computed `font-size` ≥16px, and no `user-scalable=no` in the viewport meta.
- [ ] No `font-size` on `html` in `px`.
- [ ] Every fluid `clamp()` on a font size has a `rem` term in its middle value.
- [ ] **Contrast:** 4.5:1 for body text; 3:1 for large text (≥24px, or ≥18.66px bold) and for UI component
      boundaries and meaningful graphics (WCAG 1.4.3, 1.4.11).
- [ ] **Colour is never the only carrier of meaning in text** — errors, required fields, statuses and diffs
      all have a second channel (WCAG 1.4.1).
- [ ] **200% zoom:** no content or functionality lost (WCAG 1.4.4).
- [ ] **320px reflow:** no horizontal scrolling, no clipped text (WCAG 1.4.10).
- [ ] **Text-spacing override applied** (line-height 1.5, letter 0.12em, word 0.16em, paragraph 2em): nothing
      clips or overlaps; `min-height` used wherever `height` was tempting (WCAG 1.4.12).
- [ ] Focus rings on links and text inputs are visible and not clipped by an overflow container
      (WCAG 2.4.7, 2.4.11).
- [ ] Webfonts self-hosted, WOFF2, subsetted, `font-display: swap` (or `optional`), above-the-fold files
      preloaded with `crossorigin`, and a metric-matched fallback declared.
- [ ] `lang` set on `<html>` so hyphenation, quote marks and screen-reader pronunciation are correct.
- [ ] Checked in dark mode: type looks heavier on dark backgrounds, so a weight that reads at 400 on white
      may need 350 or a slightly lower-contrast colour on black.

## Sources

- **WCAG 2.2** (W3C Recommendation) — SC **1.4.1 Use of Color** (A); SC **1.4.3 Contrast (Minimum)** (AA,
  4.5:1 normal text, 3:1 large text, where large = 18pt / 14pt bold ≈ 24px / 18.66px CSS px); SC **1.4.4
  Resize Text** (AA, 200% without loss of content or functionality); SC **1.4.8 Visual Presentation** (AAA —
  line length ≤80 characters (40 for CJK), line spacing ≥1.5 within paragraphs, paragraph spacing ≥1.5× line
  spacing, text not justified); SC **1.4.10 Reflow** (AA, 320 CSS px); SC **1.4.11 Non-text Contrast** (AA,
  3:1); SC **1.4.12 Text Spacing** (AA — no loss of content at line-height 1.5×, paragraph spacing 2×,
  letter spacing 0.12×, word spacing 0.16× of font size); SC **2.4.7 Focus Visible** (AA) and **2.4.11 Focus
  Not Obscured (Minimum)** (AA, new in 2.2). WCAG specifies **no minimum font size**.
- **Robert Bringhurst**, *The Elements of Typographic Style* — 45–75 characters is a satisfactory measure,
  66 widely regarded as ideal; letterspace all strings of capitals and small caps.
- **Matthew Butterick**, *Practical Typography* — body text 15–25px on screen; line spacing 120–145% of size;
  line length 45–90 characters; point size, line spacing and line length as the three decisions that matter
  most for body text.
- **Ellen Lupton**, *Thinking with Type* — type as system rather than ornament; the case for a small closed
  set of styles.
- **Material Design 3** — type scale structure of five roles (display, headline, title, body, label) × three
  sizes, with size, line-height, weight and tracking as separate tokens per step; body-large is 16sp / 24sp
  line-height with positive tracking, label styles run 14 / 12 / 11sp at medium weight. Check the current
  token reference for exact display-size tracking before quoting it.
- **Apple Human Interface Guidelines** — Dynamic Type; 11pt minimum text size on iOS/iPadOS; 17pt body.
- **CSS specifications** — CSS Fonts Module Level 4 (`font-optical-sizing`, `opsz` axis,
  `font-variant-numeric`, `font-synthesis`, `size-adjust`, `ascent-override`, `descent-override`,
  `line-gap-override`, `font-size-adjust`); CSS Font Loading / Font Display (`font-display` block and swap
  periods: `swap` = extremely small block + infinite swap; `optional` = extremely small block + no swap);
  CSS Text Module Level 4 (`text-wrap: balance` / `pretty`, `hanging-punctuation`, `hyphens`,
  `overflow-wrap`); CSS Inline Layout Level 3 (`text-box-trim`, `text-box-edge`, `text-box`); CSS Values and
  Units Level 4 (`clamp()`, `ch`, `rem`, `em`).
- **Browser behaviour facts used above** — iOS Safari zooms the viewport on focus of any form control with
  computed `font-size` below 16px (Android does not); HTTP cache partitioning (Chrome 86 and equivalents)
  removed any cross-site caching benefit from third-party font hosts; `text-wrap: balance` shipped Chrome
  114 / Firefox 121 / Safari 17.5 and is limited to ~6 lines in Chromium and ~10 in Firefox; `text-wrap:
  pretty` shipped Chrome 117 and Firefox 134 with Safari later, so treat it as progressive enhancement;
  `text-box-trim` is implemented in Chromium and Safari but is not yet Baseline.
- **APCA (Accessible Perceptual Contrast Algorithm)** — models stroke weight and polarity, which WCAG 2.x
  contrast ratio does not. It is draft work toward WCAG 3 and is **not** a conformance standard; do not use
  it for compliance claims.
- **Neighbouring skills** — `attention-and-hierarchy` (why size and weight create rank, scan patterns,
  Gestalt); `spacing-and-layout` (the spacing scale type sizes must fit into); `color-and-theming` (text
  colour tokens and contrast generation); `design-motion-principles` (any animation of text);
  `taste-frontend-design` (whether the result looks generic).

`references/type-scales.md` — complete ready-to-paste scales for marketing, product and dense-tool densities,
fluid `clamp()` variants, the modular-ratio table, and a full Tailwind v4 `@theme` block. Read it when
setting up a new project or changing a product's density.

`references/webfont-loading.md` — the full loading recipe: subsetting commands, `unicode-range` splits,
variable vs static break-even, metric-override generation, the monospace `font-size` browser quirk, and how
to measure the CLS you are actually paying. Read it when adding a webfont or debugging layout shift and slow
text paint.
