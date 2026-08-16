---
name: spacing-and-layout
description: Settles the actual numbers for space and structure — the spacing scale and its token names, how much gap goes inside a group versus between groups, page gutters and measure, layout primitives, CSS Grid/flexbox gap, container queries, fluid clamp() sizing, and the WCAG floors for reflow, text-spacing overrides and target size. Use this whenever the user is building or reviewing any layout, page, card, form, section, grid, table, nav or responsive behaviour — even if they never say "spacing", "grid" or "layout" — including "this feels cluttered", "it looks cramped/unfinished", "make it breathe", "how much padding", "what should my spacing scale be", "should I use a 12-column grid", "it breaks on mobile", "the sidebar collapses wrong", or any question about px values, gaps, margins, breakpoints or container queries. Use it alongside `attention-and-hierarchy`, which owns *why* proximity groups things; this skill supplies the numbers that make it true.
---

# Spacing and layout

This skill settles one question: **what are the actual values?** Not "use consistent spacing" — the eleven
numbers you are allowed to use, which one goes between a label and its input, which one goes between
sections, and what breaks at 320px and 200% zoom if you get it wrong. Without a decided scale, every layout
property becomes a fresh micro-decision, the codebase accumulates 13px and 18px and 22px, nobody can tell
whether a gap is intentional, and the screen reads as cluttered for a reason no one in the review can name.
Space is the cheapest structural tool you have and the only one that adds no ink.

`attention-and-hierarchy` owns the perception — why proximity groups, why common region overrides it, why
whitespace is a hierarchy channel. Read it for the mechanism. Read this for the millimetres.

## When this is the right skill

- Setting up a new project's spacing tokens, page container, gutters and breakpoints.
- Anything "feels cluttered", "cramped", "too airy", "unfinished", or "off but I can't say why".
- Deciding padding for a component, gaps in a card, the space between form fields, section rhythm.
- Responsive work: does this need a breakpoint or a container query, how many columns, what collapses first.
- A layout that overflows, horizontally scrolls, or clips at small widths or high zoom.
- Reviewing a diff full of arbitrary values (`p-[13px]`, `margin-top: 22px`, `w-[347px]`).

Go elsewhere when: the question is the *type scale itself* — sizes, weights, tracking, typeface choice
(`typography-system`, which this skill defers to; type sizes drive spacing, so settle them first); *which
element should be loudest* or why users miss something (`attention-and-hierarchy`); *how the transition
animates* when the layout changes (`design-motion-principles`); whether the whole thing looks generic or
AI-shaped (`taste-frontend-design`); whether a form is hard to *complete* rather than hard to *read*
(`friction-and-flow`, which owns interaction cost and Fitts's law reasoning — this skill supplies the target
pixel values it implies). `ui-craft` is the router for the whole craft set.

## Decide first

Six answers determine every number below. Write them into the project's CSS as tokens on day one; retrofitting
a scale into a codebase with 300 arbitrary values is a week of work nobody funds.

1. **Density.** Marketing/editorial (space is the design — base rhythm 24/48/96), product default
   (16/24/48), or data-dense tool (8/12/24 with 4px half-steps). Density is a legitimate product decision,
   not a failure — a trading screen with generous whitespace is unusable. Pick one per surface. A marketing
   site and its admin console are different densities and should not share a spacing scale wholesale.
2. **Primary input: touch or pointer?** Touch sets a 44px floor on interactive height and forces bigger gaps
   between adjacent targets. Pointer allows 24–32px rows. If both (most web apps), design for touch and let
   pointer users have the extra air, or ship a density toggle — do not average them.
3. **Base unit and half-step.** 4px base with an 8px default rhythm covers almost everything. Decide now
   whether 2px is allowed (hairline optical corrections only) or banned.
4. **Breakpoints or container queries?** Page-level regions still use viewport breakpoints. Components that
   appear in more than one width context — a card that renders in a 3-up grid, a sidebar, and a full-width
   list — should use container queries, or you will ship a card that only looks right in one of the three.
5. **Existing design system?** If Material, Tailwind's default scale, Radix, shadcn/ui or a company system is
   already in play, adopt its scale rather than inventing a parallel one. Two spacing systems in one codebase
   is worse than one imperfect system.
6. **Content constraints.** Maximum measure for prose (45–75 characters), the widest thing that must fit
   without scrolling (a table? a code block? a chart?), and whether the product supports user-set root font
   size — which decides `rem` versus `px` for your tokens.

**Law, convention, taste.** Each move below is tagged. *Law* means a WCAG success criterion or a browser
behaviour — you comply or you ship a defect. *Convention* means a widely-shared pattern with a real but
non-binding rationale — deviate deliberately and document it. *Taste* means defensible judgment you may
disagree with.

## The moves

### 1. Pick a closed scale, and know the real reason for 8 — *convention*

The rule: a small, fixed set of spacing values, referenced by token name, used for every gap, padding and
margin in the product. Eleven steps is enough for anything.

```css
:root {
  /* Spacing scale — ~1.5× ratio, all multiples of 4 except the hairline step. */
  --space-3xs: 0.125rem; /*   2px  hairline optical corrections only */
  --space-2xs: 0.25rem;  /*   4px  label→input, icon→text, chip innards */
  --space-xs:  0.5rem;   /*   8px  tight clusters, dense table cells */
  --space-sm:  0.75rem;  /*  12px  compact control padding */
  --space-md:  1rem;     /*  16px  default control padding, card innards */
  --space-lg:  1.5rem;   /*  24px  between form fields, card padding */
  --space-xl:  2rem;     /*  32px  between subsections */
  --space-2xl: 3rem;     /*  48px  between content blocks */
  --space-3xl: 4rem;     /*  64px  between page sections (app) */
  --space-4xl: 6rem;     /*  96px  between page sections (marketing) */
  --space-5xl: 8rem;     /* 128px  hero breathing room */
}
```

Tailwind v4, CSS-first — `--spacing` is the multiplier all numeric utilities derive from, and any
`--spacing-*` key generates a named utility:

```css
@import "tailwindcss";

@theme {
  --spacing: 0.25rem;                         /* p-4 → 1rem, gap-6 → 1.5rem */
  --spacing-gutter: clamp(1rem, 5vw, 3rem);   /* px-gutter, gap-gutter */
  --container-prose: 68ch;                    /* max-w-prose */
}
```

Layer semantic aliases on top for the handful of relationships that repeat across the product, so a density
change is one edit rather than a find-and-replace (this is the primitive/semantic split `ui-craft` describes,
applied to space):

```css
:root {
  --gap-field:   var(--space-2xs); /* label → input */
  --gap-fields:  var(--space-lg);  /* field → field */
  --gap-group:   var(--space-xl);  /* fieldset → fieldset */
  --gap-section: var(--space-3xl); /* section → section */
  --pad-card:    var(--space-lg);
  --pad-control: var(--space-sm) var(--space-md);
}
```

**Use `rem`, not `px`.** Browser *zoom* scales both, but a user who raised their default font size in browser
settings gets a proportionally larger layout only from `rem`. A `px` scale keeps a 16px gap around 24px text
and the layout tightens as the text grows — the exact opposite of what that user asked for.

**Why 8, honestly.** The reason usually given — "you can always halve it" — is true of 10 and 100 too, so it
explains nothing. Three real reasons:

- **Fractional device pixel ratios.** Windows ships display scaling at 125/150/175/200%; Android at
  1.5×/2×/3×; iOS at 2×/3×. A CSS length paints on whole device pixels when `length × ratio` is an integer.
  Multiples of 4 survive every one of those: 4×1.25=5, 4×1.5=6, 4×1.75=7. Six does not (6×1.75 = 10.5).
  Odd values fail at every fractional ratio. The visible cost is not broken layout — engines do subpixel
  layout fine — it is **soft, grey, half-painted hairlines**: 1px borders, dividers, small icon boxes and
  avatar circles that land on a half pixel get anti-aliased into mush. Spacing feeds this because a 13px gap
  pushes everything after it onto fractional positions.
- **A closed set removes a decision from every property.** Eleven values with no debate beats infinite values
  with a micro-decision each. This is the larger practical win and it compounds across a team.
- **It makes inconsistency visible in review.** "Why is this 13px?" is a question any reviewer can ask
  without taste. "Why is this 16 and not 14?" is not a question anyone can adjudicate. A scale converts an
  aesthetic argument into a lint rule.

**When to break the scale** — legitimately, and only these:

- **Optical alignment.** Round shapes, triangles and glyphs with asymmetric sidebearings need 1–2px nudges to
  *look* centred. Trust your eye over the number; a mathematically centred play triangle looks left-heavy.
- **Icon centring in an odd box.** A 24px icon in a 40px button leaves 8px each side. A 20px icon leaves 10.
  Either resize the icon or accept the 10.
- **1px borders.** A 16px padding plus a 1px border is 17px of visual inset unless `box-sizing: border-box`
  is set (it should be, globally). For a border that must not change the box, use `outline` or
  `box-shadow: inset 0 0 0 1px`.
- **Type leading.** `line-height` is a unitless ratio (1.4–1.6 for body), not a spacing step. Do not force it
  to land on the grid; see move 8.
- **Percentages and fractions.** `1fr`, `50%`, `minmax()` are not scale violations. The scale governs gaps
  and padding, not track sizes.

How it fails: a scale defined in tokens and then bypassed with arbitrary values in the markup. If
`p-[13px]` and `style="margin-top: 22px"` appear in the diff, the scale is decorative. Ban arbitrary spacing
values in lint, with an escape hatch comment for optical corrections.

### 2. Whitespace is the primary structure — spend it before you spend ink — *taste, with a mechanical rule*

Increasing whitespace is the cheapest fix for "this feels cluttered", and it is almost always the right first
move because it is the only grouping device that adds nothing to look at. Every border, divider, shadow and
background tint you draw is another mark the eye has to resolve. `attention-and-hierarchy` explains why
(Gestalt proximity, Palmer's common region). Here is the number.

**The proximity ratio.** Space *within* a group must be visibly smaller than space *between* groups. Aim for
**at least 2×, ideally 2–3× between adjacent levels of the hierarchy**. Under 1.5× the difference is
ambiguous; the eye cannot resolve it and the grouping information is lost.

| Relationship | Token | Value |
|---|---|---|
| Label → its input | `--space-2xs` | 4px |
| Input → its hint/error | `--space-2xs` | 4px |
| Field → next field | `--space-lg` | 24px |
| Field group → next group | `--space-xl`–`2xl` | 32–48px |
| Section → next section | `--space-3xl`–`4xl` | 64–96px |

Each step is 2–6× the one above it. That is what makes the structure readable before a word is.

**The equidistant-label bug.** The most common spacing defect in shipped software, and it is invisible until
you look for it:

```css
/* BROKEN — one gap for everything. */
form > * + * { margin-block-start: 12px; }
```

```html
<label for="email">Email</label>
<input id="email">
<p class="hint">We only use this for receipts.</p>   <!-- 12px from the input above,
                                                          12px from the label below -->
<label for="company">Company</label>
<input id="company">
```

The hint sits exactly between the Email input and the Company label, so the eye assigns it to whichever it
scans first — usually the one below. Worse, "Company" is equidistant from the field above and the field
below, so on a quick scan it reads as a label *for the field above it*. Users fill the wrong box. Nothing is
misaligned, no colour is wrong, and no amount of restyling fixes it.

```css
/* FIXED — two gaps, 6× apart. Same markup, same colours, same type. */
.field       { display: grid; gap: var(--space-2xs); }  /*  4px inside a field */
.field-stack { display: grid; gap: var(--space-lg);  }  /* 24px between fields */
```

The same bug appears with section headings: a heading spaced equally above and below belongs to neither
block. Headings are tight to the content they head — `margin-block: var(--space-xl) var(--space-sm)`, roughly
3:1 in favour of the space *above*.

**Padding must be ≥ the largest gap inside it.** A card with 24px between its internal zones and 12px of
padding looks like its contents are escaping. Frame ≥ contents, always. This one rule fixes a surprising
share of "looks cramped".

How it fails: uniform generous space applied as a style rather than as structure. A page where everything is
32px from everything else is airy *and* structureless — it carries exactly as little grouping information as
a page where everything is 8px apart. Differential space is the point; more space is not.

### 3. Give space to the container, not the child — *convention, strongly held*

`gap` is the correct mechanism for spacing siblings. Margins on children are a leak: the child asserts space
it does not own, the last one needs a reset, and the value has to be re-litigated at every reuse site.

```css
/* Good: the layout owns the rhythm. */
.stack   { display: grid; gap: var(--space-lg); }
.cluster { display: flex; flex-wrap: wrap; gap: var(--space-xs); align-items: center; }
```

```css
/* Bad: every reuse of .card fights this. */
.card { margin-bottom: 24px; }
.card:last-child { margin-bottom: 0; }
```

Why `gap` beats margin concretely: it never collapses (so nested containers behave predictably), it needs no
`:last-child` reset, it applies in both axes with `row-gap`/`column-gap`, and it makes wrapped flex rows
space correctly — the thing negative-margin grid hacks existed to fake. `gap` has worked in flexbox in every
current browser since **Safari 14.1 / iOS Safari 14.5 (April 2021)**; Chrome and Firefox years earlier. The
negative-margin gutter pattern is dead and should be deleted on sight.

When you cannot establish a flex or grid context — long-form prose where you want margin collapsing and
`<hr>` semantics — use the owl:

```css
.prose > * + * { margin-block-start: var(--flow, 1em); }
.prose > h2    { --flow: var(--space-xl); }
.prose > p     { --flow: var(--space-md); }
```

**One-direction rule for any margin that survives.** Pick block-start or block-end and never mix; mixed
directions produce collapsed margins you cannot reason about. Use logical properties (`margin-block-start`,
`padding-inline`) so the layout survives RTL without a second stylesheet.

How it fails: `gap` on a flex container also spaces *wrapped* rows, which surprises people who wanted
horizontal-only spacing. Use `column-gap` explicitly if the row gap should differ.

### 4. Think in primitives, not columns — *convention*

Column counts encode a viewport assumption (`col-md-4` means "one third, at this breakpoint, on this page").
Primitives encode a *relationship*, which stays true at every size. Six cover almost all layout (the
vocabulary is from *Every Layout*, Heydon Pickering & Andy Bell):

```css
/* Stack — vertical flow with one rhythm. */
.stack { display: grid; gap: var(--space, var(--space-lg)); }

/* Cluster — things that sit in a row and wrap gracefully. Toolbars, tag lists, button groups. */
.cluster { display: flex; flex-wrap: wrap; gap: var(--space-xs); align-items: center; }

/* Sidebar — fixed-ish side, fluid main, collapses on its own when there is no room. */
.sidebar { display: flex; flex-wrap: wrap; gap: var(--space-xl); }
.sidebar > :first-child { flex: 1 1 18rem; }            /* the sidebar */
.sidebar > :last-child  { flex: 999 1 30rem; min-width: 0; } /* main: needs 30rem or it wraps */

/* Switcher — N across above a threshold, stacked below it. No media query. */
.switcher { display: flex; flex-wrap: wrap; gap: var(--space-lg); }
.switcher > * { flex: 1 1 calc((40rem - 100%) * 999); min-width: 0; }

/* Grid — as many as fit, never narrower than the minimum. */
.grid {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
}

/* Center — the page container. */
.center {
  box-sizing: content-box;
  max-width: var(--content-max, 72rem);
  margin-inline: auto;
  padding-inline: var(--gutter);
}
```

Two details that are load-bearing and get missed:

- **`min-width: 0` on flex and grid children.** The initial `min-width: auto` means a child refuses to shrink
  below its content's intrinsic minimum — one long URL, an unbreakable table, a `<pre>` block — and the whole
  layout overflows horizontally. This is the single most common cause of a 320px reflow failure (move 9).
- **`min(18rem, 100%)` inside `minmax()`.** Bare `minmax(18rem, 1fr)` overflows any container narrower than
  18rem. The `min()` guard is what makes `auto-fit` safe on a phone.

How it fails: reaching for a primitive when the content genuinely has a designed composition. A bespoke
landing section that aligns to nothing is fine — see move 5.

### 5. Grids earn their keep on repeating content, not on every section — *convention, commonly over-applied*

The 12-column grid is a **convention inherited from print and popularised by Bootstrap**, not a law. Twelve
is chosen because it factors into 2, 3, 4 and 6 — that is the entire rationale. Plenty of good custom
landing sections align to no column grid at all and are better for it.

**Use a column grid when:**

- Content is repeating and routine — card lists, galleries, blog indexes, product grids, dashboards of
  equal-weight tiles, tables.
- Multiple people or teams build pages that must feel like one product.
- You need predictable responsive collapse across many templates.

**Skip it when:** the section is a one-off composition — a hero, a pull-quote, an editorial image/text pair,
a pricing table with an emphasised middle plan. Align those to the **page gutter and max-width**, which is
the part that must stay consistent, and compose freely inside.

The responsive convention worth knowing is **12 columns desktop / 8 tablet / 4 mobile** (Material Design's
layout grid). It is a sensible default because 12, 8 and 4 share factors, so a "4 of 12" item maps to "4 of
8" and "4 of 4" without re-authoring. Treat it as a starting point, not a requirement — and note that for
*components* (as opposed to page regions) container queries are the better modern answer (move 6).

What actually needs to be consistent across every page:

```css
:root {
  --gutter:      clamp(1rem, 5vw, 3rem);  /* page edge inset, fluid */
  --content-max: 72rem;                   /* ~1152px */
  --measure:     68ch;                    /* prose column */
}
```

The breakout grid — one container that gives you a constrained column plus full-bleed escapes, with no
negative margins:

```css
.layout {
  display: grid;
  grid-template-columns:
    [full-start] minmax(var(--gutter), 1fr)
    [content-start] min(100% - (var(--gutter) * 2), var(--content-max)) [content-end]
    minmax(var(--gutter), 1fr) [full-end];
}
.layout > *          { grid-column: content; }
.layout > .full-bleed{ grid-column: full; }
```

For a genuine column grid, name the lines so the markup stops counting:

```css
.grid-12 { display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--gutter); }
@media (width < 60rem) { .grid-12 { grid-template-columns: repeat(8, 1fr); } }
@media (width < 40rem) { .grid-12 { grid-template-columns: repeat(4, 1fr); } }
```

How it fails: forcing bespoke content onto columns produces the "template" look — everything a third or a
half, nothing at an interesting width. And a 12-column grid with a 24px gutter on a 360px phone gives 8px
columns, which is why the mobile grid is 4 columns, not 12 squeezed.

### 6. Container queries are the real answer to "8 columns on tablet" — *convention, now safe to use*

A component's layout should depend on **the space it has**, not on the viewport. A card that is 320px wide in
a sidebar and 320px wide on a phone should look identical; with media queries it will not.

```css
.card-host {                 /* the wrapper, not the card itself */
  container-type: inline-size;
  container-name: card;
}

.card { display: grid; gap: var(--space-md); }

@container card (width >= 24rem) {
  .card { grid-template-columns: 8rem 1fr; align-items: start; }
}
@container card (width >= 40rem) {
  .card { grid-template-columns: 12rem 1fr auto; gap: var(--space-lg); }
}
```

Container query units (`cqi` = 1% of the container's inline size) let type and space scale to the component:

```css
.card__title { font-size: clamp(1rem, 0.9rem + 1cqi, 1.5rem); }
```

Tailwind v4 ships this as first-class utilities:

```html
<div class="@container">
  <article class="grid gap-4 @md:grid-cols-[8rem_1fr] @xl:grid-cols-[12rem_1fr_auto]">…</article>
</div>
```

Support: `@container` is in every current browser (Chrome/Edge 105, Safari 16, Firefox 110 — Feb 2023) and
reached Baseline Widely Available in 2025. It needs no fallback for evergreen targets.

Three gotchas:

- **An element cannot query itself.** You need a wrapper with `container-type`, and the styled element must
  be a descendant. Forgetting this is the usual "my container query does nothing".
- **`container-type: inline-size` applies size and layout containment.** The container becomes a containing
  block for absolutely positioned descendants and its block size no longer depends on its inline-size
  containment — mostly invisible, but it can break an absolutely positioned overlay that expected to escape.
- **Keep page-level regions on media queries.** Nav collapsing, sidebar showing/hiding and page gutters are
  viewport decisions, not container decisions.

How it fails: containerising everything. One container per reusable component that appears in more than one
width context — not one per div.

### 7. Size intrinsically: `clamp()`, `min()`, `max()` — with the zoom trap — *convention + one law*

Fluid values replace breakpoint stair-steps for anything continuous: gutters, section rhythm, type.

```css
:root {
  --gutter:        clamp(1rem, 5vw, 3rem);      /* 16 → 48 */
  --space-section: clamp(3rem, 8vw, 6rem);      /* 48 → 96 */
  --step-0:        clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --step-2:        clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem);
}
```

**The law you can break here: WCAG 1.4.4 Resize Text (AA)** — text must be resizable to 200% without loss of
content or functionality. A viewport-only value (`font-size: 4vw`, or `clamp(1rem, 4vw, 2rem)` where `4vw`
dominates) does not respond to the user's text-size preference at all, because `vw` is fixed to the viewport.
**Always include a `rem` term in the middle value** so the value grows when the user's root size does:

```css
/* Fails users who need larger text — the vw term is unaffected by their setting. */
font-size: clamp(1rem, 4vw, 2rem);

/* Correct — the rem term carries the user's preference through. */
font-size: clamp(1rem, 0.85rem + 1.2vw, 2rem);
```

Other useful forms:

- `width: min(100%, 40rem)` — never wider than 40rem, never overflowing. Replaces `max-width` + `width: 100%`.
- `padding-inline: max(var(--space-md), env(safe-area-inset-left))` — a floor that also clears a notch.
- `flex: 1 1 calc((40rem - 100%) * 999)` — the switcher's breakpoint-free threshold (move 4).

How it fails: a `clamp()` minimum below the readable floor. Set the min to the smallest size that is actually
usable (≥16px for body text on mobile, or iOS Safari zooms the page on input focus), not to whatever makes
the curve look smooth.

### 8. Where type meets space: measure, leading, and the vertical-rhythm myth — *convention + taste*

`typography-system` owns the type scale — sizes, weights, tracking. This move covers only the places where
type decisions *are* spacing decisions, which is where the two skills touch.

- **Measure: 45–75 characters** for body prose, ~66 as the classic target (Robert Bringhurst, *The Elements
  of Typographic Style*; Matthew Butterick, *Practical Typography*, argues 45–90 depending on size and
  leading). Set it with `ch` units — `max-width: 68ch` — which tracks the actual font. Long lines lose the
  reader on the return sweep; short ones break the rhythm.
- **Line-height: unitless, 1.4–1.6 for body**, tightening to 1.1–1.25 as headings get larger. Unitless is not
  a style preference: `line-height: 24px` on `body` is inherited as *24px* by a 32px heading and clips it.
  `line-height: 1.5` is inherited as a ratio and behaves.
- **Longer measure needs more leading.** They trade off — a 75ch line at 1.4 is harder to track than a 60ch
  line at 1.4. If you cannot shorten the measure, raise the leading.
- **The baseline-grid myth.** Forcing every text block onto a strict baseline grid (as print does) is
  expensive on the web and pays almost nothing: dynamic content, variable fonts, user zoom, text-spacing
  overrides (move 9) and mixed embedded content all break the alignment the moment it ships. Align *space
  between blocks* to the scale; let leading be a ratio. This is taste, and typographers will argue — but the
  cost/benefit on a responsive, user-restylable medium is clear.

Space around text belongs to the *type*, not the layout: heading margins expressed in `em` scale with the
heading, so a `2.5rem` H1 and a `1.25rem` H3 get proportional air from one rule.

```css
h2 { margin-block: 1.6em 0.5em; line-height: 1.2; text-wrap: balance; }
p  { max-width: var(--measure); text-wrap: pretty; }
```

### 9. Survive the user's settings: reflow and text-spacing — *law*

Two success criteria that spacing decisions break more often than any others, and both are Level AA.

**WCAG 1.4.10 Reflow (AA).** Content must present "without loss of information or functionality, and without
requiring scrolling in two dimensions" at a width equivalent to **320 CSS px** (and 256 CSS px height for
horizontally-scrolling content), "except for parts of the content which require two-dimensional layout for
usage or meaning" — data tables, maps, complex diagrams. 320px equivalent is what you get at **1280px wide,
400% browser zoom**, which is how to test it on a desktop.

What breaks it, in order of frequency:

```css
/* 1. Flex/grid children refusing to shrink (min-width:auto). Fix everywhere. */
.flex-child, .grid-child { min-width: 0; }

/* 2. Fixed pixel widths on containers. */
.panel { width: 480px; }        /* → width: min(100%, 30rem); */

/* 3. Unbreakable content: long URLs, tokens, code. */
.break { overflow-wrap: anywhere; }

/* 4. Wide content that legitimately cannot reflow — scroll it inside its own box,
      never let it scroll the page. */
.table-wrap { overflow-x: auto; }
.table-wrap table { min-width: 40rem; }

/* 5. Media. */
img, video, svg, canvas { max-width: 100%; height: auto; }
```

**WCAG 1.4.12 Text Spacing (AA).** No loss of content or functionality when the user overrides: line height
**≥1.5× font size**, spacing after paragraphs **≥2×**, letter spacing **≥0.12×**, word spacing **≥0.16×**.
This is the criterion that fixed-height boxes fail. Test it by pasting this into devtools:

```css
* { line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important; }
p { margin-block-end: 2em !important; }
```

Then look for clipped text. The fixes are all spacing decisions:

- **`min-height`, never `height`,** on buttons, chips, badges, nav items, table rows, cards.
- **Size by padding + line-height,** not by a magic pixel height. `padding-block: 0.625rem` with
  `line-height: 1.25` gives a ~40px button that grows correctly instead of clipping.
- **No `overflow: hidden` on text containers** unless you also accept the clipping. Single-line truncation
  with ellipsis is allowed by 1.4.12 only where the full text is available another way.

### 10. Edges: safe areas, target size, and focus that survives sticky bars — *law*

**Target size.** WCAG 2.2 **2.5.8 Target Size (Minimum), Level AA: at least 24×24 CSS px**, with exceptions
for *spacing* (undersized targets whose 24px-diameter centred circles do not intersect another target's),
*equivalent* (the same function available elsewhere at size), *inline* (targets inside a sentence),
*user agent control*, and *essential*. **2.5.5 Target Size (Enhanced) is AAA at 44×44 CSS px.** Platform
guidance is stricter than the AA floor and is the number to design to: **Apple HIG specifies a minimum
44×44 pt tappable area; Material Design specifies 48×48 dp touch targets with at least 8dp between them.**

Practical rule: **44px minimum height for any touch target, 24px absolute floor for dense pointer UI, 8px
minimum between adjacent targets.** Expand the hit area without changing the visual size using a
pseudo-element:

```css
.icon-btn { position: relative; inline-size: 1.5rem; block-size: 1.5rem; }
.icon-btn::after { content: ""; position: absolute; inset: -0.625rem; } /* 24px → 44px */
```

Check that the expanded areas do not overlap each other — overlapping hit areas cause mis-taps, which is the
failure the spacing exception exists to prevent.

**Safe areas.** On notched and gesture-bar devices, content under the home indicator or in the corner
curvature is untappable. `env()` returns 0 unless the viewport opts in:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
.app-shell { padding-inline: max(var(--space-md), env(safe-area-inset-left),
                                                  env(safe-area-inset-right)); }
.bottom-bar { padding-block-end: calc(var(--space-sm) + env(safe-area-inset-bottom)); }
.full-height { min-block-size: 100svh; }   /* svh/dvh, not vh — vh ignores mobile browser chrome */
```

**WCAG 2.2 2.4.11 Focus Not Obscured (Minimum), Level AA:** when a component receives keyboard focus it must
not be *entirely* hidden by author-created content. Sticky headers and bottom bars break this constantly —
tab down a long form and the focused field scrolls under the header. The fix is a spacing property:

```css
:root { --header-h: 4rem; }
html { scroll-padding-block-start: calc(var(--header-h) + var(--space-md));
       scroll-padding-block-end: calc(var(--bottom-bar-h, 0px) + var(--space-md)); }
```

(2.4.12 Focus Not Obscured (Enhanced) is the AAA version — *no part* obscured.) Also give focus rings room:
a 2px ring with a 2px offset needs 4px of clearance, so a control flush against a container edge will have
its ring clipped by any ancestor with `overflow: hidden`.

### 11. Before and after: a cluttered card, fixed with spacing alone — *worked example*

Same markup, same colours, same type, same borders. Only spacing changes.

```html
<article class="card">
  <span class="badge">New</span>
  <h3>Quarterly revenue report</h3>
  <p class="byline">Updated 12 minutes ago by Dana Whitfield</p>
  <p class="summary">Revenue grew 8.2% against a forecast of 6.5%, driven by renewals in
     the enterprise segment and a shorter average sales cycle.</p>
  <button class="primary">Open report</button>
  <button class="ghost">Share</button>
</article>
```

```css
/* BEFORE — one gap for six items, padding smaller than the internal gap. */
.card       { padding: 12px; border: 1px solid var(--line); }
.card > *   { margin-bottom: 12px; }
.card > *:last-child { margin-bottom: 0; }
```

Six equally-spaced items means six perceived groups. The badge floats free of the title it modifies, the
byline is as far from its heading as the summary is from the buttons, and the 12px padding is the same as the
internal gap so the content reads as pressed against the frame. Every fix reached for at this point — a
divider, a background tint on the meta block, a bolder title — adds ink to solve a spacing problem.

```css
/* AFTER — three zones, three gap values, frame ≥ contents. */
.card {
  padding: var(--space-lg);              /* 24 — padding ≥ largest inner gap */
  border: 1px solid var(--line);
  display: grid;
  gap: var(--space-lg);                  /* 24 — between zones */
}
.card__meta    { display: grid; gap: var(--space-2xs); justify-items: start; } /* 4 */
.card__summary { max-width: 60ch; }
.card__actions { display: flex; flex-wrap: wrap; gap: var(--space-xs); }       /* 8 */
```

```html
<article class="card">
  <div class="card__meta">
    <span class="badge">New</span>
    <h3>Quarterly revenue report</h3>
    <p class="byline">Updated 12 minutes ago by Dana Whitfield</p>
  </div>
  <p class="card__summary">…</p>
  <div class="card__actions">…</div>
</article>
```

What changed measurably: perceived groups 6 → 3; intra-group gap to inter-group gap ratio 1:1 → 1:6; padding
to internal gap ratio 1:1 → 1:1 at 24px (frame no longer smaller than the gaps); measure capped at 60ch. No
new borders, tints, weights or colours. This is what "spend whitespace before you spend ink" means in
practice, and it is the first thing to try on any card, row or panel that "feels cluttered".

## Anti-patterns

- **Arbitrary values in the markup.** `p-[13px]`, `gap-[18px]`, `style="margin-top: 22px"`. The scale exists
  or it does not; there is no partial adoption.
- **One gap for everything.** A single spacing value across a screen transmits zero grouping information, and
  it is the direct cause of the equidistant-label bug.
- **Padding smaller than the internal gap.** Content reads as leaking out of its frame.
- **Fixed `height` on anything containing text.** Breaks WCAG 1.4.12 the moment a user overrides spacing, and
  breaks in German and Finnish before that.
- **Negative-margin gutter hacks.** Obsolete since flex `gap` shipped in Safari 14.1. Delete them.
- **Missing `min-width: 0` on flex/grid children.** The most common 320px reflow failure, and it is one line.
- **`minmax(18rem, 1fr)` without a `min()` guard.** Overflows every container narrower than 18rem.
- **Viewport-only `clamp()` on font size.** Ignores the user's text-size preference; risks WCAG 1.4.4.
- **`100vh` for full-height mobile layouts.** Ignores browser chrome; use `100dvh` or `100svh`.
- **Forcing bespoke sections onto 12 columns.** Produces the template look — everything a half or a third.
- **Media queries for component layout.** A card in a sidebar and a card on a phone are the same width and
  should look the same; only container queries make that true.
- **Solving a spacing problem with a divider.** If a 32px gap already separates two blocks, the `<hr>` is
  ink saying something already said. Remove the rule, not the space.
- **Icon buttons at their visual size.** A 16px icon in a 16px button is a 16px target — under the 24px AA
  floor and far under the 44px touch standard.
- **`env(safe-area-inset-*)` without `viewport-fit=cover`.** Returns 0 and silently does nothing.
- **Two spacing systems in one codebase.** Worse than one imperfect system. Pick the incumbent.

## Ship checklist

Run against the screen or the PR diff.

- [ ] Every spacing value in the diff comes from the token scale; no arbitrary values without a comment.
- [ ] Tokens are in `rem`, not `px`.
- [ ] Within-group gaps are at least 2× smaller than between-group gaps, everywhere it matters.
- [ ] No label, hint or heading sits equidistant between the thing it belongs to and the thing it does not.
- [ ] Container padding is ≥ the largest gap inside that container.
- [ ] Sibling spacing uses `gap` on the parent, not margins on children; no `:last-child` resets.
- [ ] Logical properties (`margin-block`, `padding-inline`) used, so RTL works without a second stylesheet.
- [ ] `min-width: 0` on flex and grid children that contain text, tables or code.
- [ ] `auto-fit`/`auto-fill` tracks use `minmax(min(Xrem, 100%), 1fr)`.
- [ ] Components that render at multiple widths use container queries, not media queries.
- [ ] Every `clamp()` on a font size has a `rem` term in its middle value.
- [ ] Prose is capped at 45–75ch; `line-height` is unitless.
- [ ] **320px / 400% zoom:** no horizontal page scroll, no clipped content, no two-dimensional scrolling
      except for tables, maps and diagrams that genuinely require it (WCAG 1.4.10).
- [ ] **Text-spacing override applied** (1.5 line-height, 0.12em letter, 0.16em word, 2em paragraph): nothing
      clips, no `height` where `min-height` belongs (WCAG 1.4.12).
- [ ] Every interactive target ≥24×24 CSS px (WCAG 2.5.8), ≥44px on touch surfaces, ≥8px apart.
- [ ] Focus rings have clearance and are not clipped by `overflow: hidden`; `scroll-padding` clears sticky
      headers and bottom bars so focused elements are never hidden (WCAG 2.4.11).
- [ ] `viewport-fit=cover` set and `env(safe-area-inset-*)` respected on any edge-anchored bar.
- [ ] `dvh`/`svh` instead of `vh` for full-height mobile layouts.
- [ ] Tested at 200% zoom and in the narrowest supported container, not just the narrowest viewport.

## Sources

- **WCAG 2.2** (W3C Recommendation) — the law-like layer. SC **1.4.4 Resize Text** (AA, 200% without loss of
  content or functionality); SC **1.4.10 Reflow** (AA, 320 CSS px vertical / 256 CSS px horizontal, exception
  for content requiring two-dimensional layout); SC **1.4.12 Text Spacing** (AA — line height ≥1.5×, spacing
  after paragraphs ≥2×, letter spacing ≥0.12×, word spacing ≥0.16× of font size); SC **2.4.11 Focus Not
  Obscured (Minimum)** (AA, new in 2.2) and **2.4.12** (AAA); SC **2.5.5 Target Size (Enhanced)** (AAA,
  44×44 CSS px); SC **2.5.8 Target Size (Minimum)** (AA, new in 2.2, 24×24 CSS px with spacing, equivalent,
  inline, user-agent-control and essential exceptions).
- **Material Design** (Google) — layout grid and spacing: components align to an **8dp** square baseline
  grid; iconography and type align to a **4dp** grid; responsive column counts of **12 / 8 / 4** for
  desktop / tablet / mobile; touch targets **≥48×48 dp** with 8dp or more between them; default screen
  margins of 16dp on mobile.
- **Apple Human Interface Guidelines** — minimum **44×44 pt** tappable area for controls; safe-area and
  layout-margin guidance for devices with rounded corners, notches and home indicators.
- **CSS specifications** — CSS Box Alignment Module Level 3 (`gap`, `row-gap`, `column-gap`); CSS Grid Layout
  Level 1 (`minmax()`, `repeat()`, `auto-fit`/`auto-fill`, named lines); CSS Values and Units Level 4
  (`min()`, `max()`, `clamp()`); CSS Containment Module Level 3 (`container-type`, `@container`, `cqi`/`cqb`
  units); CSS Environment Variables Level 1 (`env(safe-area-inset-*)`); CSS Values Level 4 large/small/dynamic
  viewport units (`lvh`, `svh`, `dvh`); CSS Logical Properties and Values Level 1.
- **Browser support facts used above** — flexbox `gap` shipped in Safari 14.1 (macOS, April 2021) and iOS
  Safari 14.5; container queries shipped Chrome/Edge 105 (Aug 2022), Safari 16 (Sep 2022), Firefox 110
  (Feb 2023), reaching Baseline Widely Available in 2025.
- **Layout primitives** — Heydon Pickering & Andy Bell, *Every Layout* (Stack, Cluster, Sidebar, Switcher,
  Grid, Center, Cover, Frame, Reel, Imposter). The source of the composition-over-columns framing and of the
  breakpoint-free Sidebar and Switcher techniques.
- **Typography** — Robert Bringhurst, *The Elements of Typographic Style* (measure, the 66-character line);
  Matthew Butterick, *Practical Typography* (line length, leading, and the argument against over-precise
  vertical grids on the web); Ellen Lupton, *Thinking with Type* (grid systems and their limits).
- **Grids** — Josef Müller-Brockmann, *Grid Systems in Graphic Design* (1981), the origin of the modular grid
  in modern practice, and worth reading for the part everyone skips: grids serve repeating, systematic
  content and are a means, not an aesthetic.
- **Affordances and signifiers** — Donald Norman, *The Design of Everyday Things* (revised ed., 2013) — the
  reason a target's *visible* extent must match its *interactive* extent, which is why invisible hit-area
  expansion is a compromise, not a free win.
- **Gestalt grouping**, the mechanism behind move 2, is owned by `attention-and-hierarchy`, which cites
  Wertheimer (1923) and Palmer (1992) on common region. This skill supplies the ratios, not the perception.

**Claims deliberately not made here:** that the 8pt grid is required by any platform (Material recommends it;
nothing enforces it); that 12 columns has any basis beyond its divisors; that a strict typographic baseline
grid measurably improves reading on the web; that golden-ratio or modular-scale spacing outperforms a plain
1.5× ratio; and any percentage figure for whitespace improving comprehension or conversion — those numbers
circulate widely with no locatable primary source.

## Further reading in this skill

- `references/spacing-tokens.md` — read when setting up a project or auditing an existing one: complete token
  files for three densities, per-component padding tables (buttons, inputs, cards, tables, nav, modals),
  Tailwind v4 and plain-CSS versions, and a staged migration recipe with lint rules for a codebase already
  full of arbitrary values.
- `references/responsive-layout.md` — read when a layout must adapt: breakpoint strategy versus container
  queries with a decision table, the full primitive library, grid recipes (breakout, auto-fit, sidebar,
  holy-grail, dense dashboards), how to make tables and charts survive 320px, mobile viewport units and safe
  areas, and a step-by-step 320px/400%-zoom reflow audit.
