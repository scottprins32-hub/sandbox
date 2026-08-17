# Type scales, ready to paste

Three complete scales for three densities, plus fluid variants, the modular-ratio reference, and a full
Tailwind v4 `@theme` block. Pick one density per surface. A marketing site and its admin console are
different densities and should not share a scale wholesale.

All sizes in `rem` (user's browser setting still governs), tracking in `em` (proportional at any size),
line-height unitless (inherits as a ratio, not an absolute).

---

## A. Marketing / editorial — six steps, wide range

Size is the hierarchy here, because there are few elements on screen. Wide gaps between steps; the top of the
scale is genuinely large.

```css
:root {
  --text-sm:    0.875rem;  --text-sm-lh:    1.5;   --text-sm-ls:     0.005em; /* 14 – captions, meta */
  --text-base:  1.0625rem; --text-base-lh:  1.6;   --text-base-ls:   0em;     /* 17 – body (long-form) */
  --text-lg:    1.375rem;  --text-lg-lh:    1.45;  --text-lg-ls:    -0.005em; /* 22 – lead paragraph */
  --text-xl:    2rem;      --text-xl-lh:    1.2;   --text-xl-ls:    -0.02em;  /* 32 – section heading */
  --text-2xl:   3rem;      --text-2xl-lh:   1.1;   --text-2xl-ls:   -0.025em; /* 48 – page heading */
  --text-3xl:   4rem;      --text-3xl-lh:   1.02;  --text-3xl-ls:   -0.03em;  /* 64 – hero */
}
```

Body at 17px rather than 16px: long-form reading surfaces benefit from the extra size, and Butterick's
recommended range runs to 25px. Leading at 1.6 because the measure is long (65ch) and marketing body copy is
read continuously rather than scanned.

Step ratios: 1.21, 1.29, 1.45, 1.50, 1.33. Deliberately large — with six steps you want every one obviously
distinct at a glance.

## B. Product / app default — the general-purpose scale

The scale in SKILL.md, repeated here for completeness. Eleven steps; body 16px; the range covers dense
tables through to a marketing-ish empty state without a second scale.

```css
:root {
  --text-2xs:   0.6875rem; --text-2xs-lh:  1.55;  --text-2xs-ls:    0.02em;   /* 11 – chrome only */
  --text-xs:    0.75rem;   --text-xs-lh:   1.5;   --text-xs-ls:     0.015em;  /* 12 – badges, meta */
  --text-sm:    0.875rem;  --text-sm-lh:   1.5;   --text-sm-ls:     0.005em;  /* 14 – secondary, tables */
  --text-base:  1rem;      --text-base-lh: 1.5;   --text-base-ls:   0em;      /* 16 – body, inputs */
  --text-lg:    1.125rem;  --text-lg-lh:   1.45;  --text-lg-ls:    -0.005em;  /* 18 – lead, card title */
  --text-xl:    1.25rem;   --text-xl-lh:   1.4;   --text-xl-ls:    -0.01em;   /* 20 – section heading */
  --text-2xl:   1.5rem;    --text-2xl-lh:  1.3;   --text-2xl-ls:   -0.015em;  /* 24 – page title */
  --text-3xl:   1.875rem;  --text-3xl-lh:  1.22;  --text-3xl-ls:   -0.02em;   /* 30 */
  --text-4xl:   2.375rem;  --text-4xl-lh:  1.15;  --text-4xl-ls:   -0.022em;  /* 38 */
  --text-5xl:   3rem;      --text-5xl-lh:  1.1;   --text-5xl-ls:   -0.025em;  /* 48 – empty states, hero */
  --text-6xl:   3.75rem;   --text-6xl-lh:  1.05;  --text-6xl-ls:   -0.03em;   /* 60 */
}
```

## C. Dense tool / dashboard / ops console — six steps, tight range

Information density is the feature. The top of the scale is 24px and that is deliberate: a 48px heading in a
screen showing four hundred values steals space from the data and adds nothing, because the user opened this
screen knowing what it is. Hierarchy moves to **weight, colour and position** — see move 6 in SKILL.md and
`attention-and-hierarchy` for why those channels survive familiarity better than size does.

```css
:root {
  --text-2xs:   0.6875rem; --text-2xs-lh:  1.45;  --text-2xs-ls:    0.02em;   /* 11 – column meta, units */
  --text-xs:    0.75rem;   --text-xs-lh:   1.4;   --text-xs-ls:     0.015em;  /* 12 – table headers, chips */
  --text-sm:    0.8125rem; --text-sm-lh:   1.45;  --text-sm-ls:     0.005em;  /* 13 – table body, dense UI */
  --text-base:  0.875rem;  --text-base-lh: 1.5;   --text-base-ls:   0em;      /* 14 – body, form labels */
  --text-lg:    1rem;      --text-lg-lh:   1.4;   --text-lg-ls:     0em;      /* 16 – panel heading, KPI */
  --text-xl:    1.5rem;    --text-xl-lh:   1.25;  --text-xl-ls:    -0.015em;  /* 24 – page title, big number */
}
```

Two warnings specific to this density.

- **Inputs still need 16px on touch.** A 14px base is fine for reading, but any `<input>`, `<select>`,
  `<textarea>` or `contenteditable` under 16px triggers iOS Safari's focus zoom. If the console is
  desktop-only, this does not bind — verify that claim before relying on it.
- **13px and 14px in the same scale is defensible only here.** In any other density it is two steps within
  1px and you should delete one. In a dense table the difference between the body row and the label column
  is load-bearing.

---

## Role tokens — the layer components actually use

Never let a component reference a scale step directly, for the same reason `ui-craft` says a component must
never reference `--blue-600`. The step is a primitive (*what it is*); the role is semantic (*what it is
for*). Changing density then edits this block only.

```css
:root {
  /* reading */
  --font-body:        var(--text-base);  --font-body-lh:      var(--text-base-lh);
  --font-body-lead:   var(--text-lg);    --font-body-lead-lh: var(--text-lg-lh);
  --font-caption:     var(--text-xs);    --font-caption-lh:   var(--text-xs-lh);

  /* interface chrome — single-line, so leading is overridden to ~1 */
  --font-ui:          var(--text-sm);    --font-ui-lh:        1.2;
  --font-ui-sm:       var(--text-xs);    --font-ui-sm-lh:     1.2;
  --font-label:       var(--text-xs);    --font-label-lh:     1;
  --font-label-ls:    0.08em;            /* all-caps eyebrows and table headers */

  /* structure */
  --font-h1:          var(--text-3xl);   --font-h1-lh:        var(--text-3xl-lh);
  --font-h2:          var(--text-2xl);   --font-h2-lh:        var(--text-2xl-lh);
  --font-h3:          var(--text-xl);    --font-h3-lh:        var(--text-xl-lh);
  --font-display:     var(--text-5xl);   --font-display-lh:   var(--text-5xl-lh);

  /* data */
  --font-code:        var(--text-sm);
  --font-metric:      var(--text-2xl);   /* big numbers — pair with tabular-nums */

  /* weights */
  --weight-body: 400;
  --weight-ui:   500;   /* the under-used workhorse step */
  --weight-head: 600;
  --weight-loud: 700;   /* display only */
}
```

---

## Fluid variants

Only worth it for the top three or four steps. Fluid body text is a solution to a problem nobody has, and it
makes measure unpredictable.

Every `clamp()` middle value must contain a `rem` term, or the size becomes viewport-only and stops
responding to the user's text-size preference — a WCAG 1.4.4 risk.

```css
:root {
  --text-3xl: clamp(1.5rem,   1.25rem + 1.25vw, 1.875rem);  /* 24 → 30 */
  --text-4xl: clamp(1.875rem, 1.5rem  + 1.9vw,  2.375rem);  /* 30 → 38 */
  --text-5xl: clamp(2.25rem,  1.6rem  + 3.2vw,  3rem);      /* 36 → 48 */
  --text-6xl: clamp(2.5rem,   1.5rem  + 5vw,    3.75rem);   /* 40 → 60 */
}
```

Deriving the middle term: for a size going from `Smin` at viewport `Vmin` to `Smax` at `Vmax`, the slope is
`(Smax − Smin) / (Vmax − Vmin) × 100vw`, and the intercept is `Smin − slope × Vmin`. Express the intercept in
`rem`. Sanity-check both ends in the browser rather than trusting the arithmetic.

A caveat worth knowing: viewport-unit terms cause the size to change on every resize step, so a heading that
is exactly two lines at one width can become three at another. Set `text-wrap: balance` on fluid headings.

**Container-relative fluid type.** If the element appears at several widths inside one page — a card in a
3-up grid and the same card in a sidebar — use container query units (`cqi`) instead of `vw`, so the type
responds to the box rather than the window:

```css
.card { container-type: inline-size; }
.card h3 { font-size: clamp(1rem, 0.875rem + 1.5cqi, 1.25rem); }
```

---

## Modular ratios, for generating a first draft

Useful as a starting point. Round to whole pixels, delete unused steps, and widen the gaps at the top — see
move 2 in SKILL.md for why a single constant ratio is the wrong shape for a UI scale.

| Ratio | Name | From 16px | Character |
|---|---|---|---|
| 1.067 | Minor second | 16, 17, 18, 19, 21 | Too tight to be useful alone |
| 1.125 | Major second | 16, 18, 20, 23, 26, 29 | Good for the *lower* half of a scale |
| 1.200 | Minor third | 16, 19, 23, 28, 33, 40 | Reasonable general-purpose |
| 1.250 | Major third | 16, 20, 25, 31, 39, 49 | Common default; fractional sizes |
| 1.333 | Perfect fourth | 16, 21, 28, 38, 51, 67 | Good for the *upper* half; marketing |
| 1.414 | Augmented fourth | 16, 23, 32, 45, 64 | Dramatic; few steps |
| 1.500 | Perfect fifth | 16, 24, 36, 54, 81 | Hero-heavy, editorial |
| 1.618 | Golden ratio | 16, 26, 42, 68 | Four usable steps at most |

**The golden ratio has no typographic authority.** It is an aesthetically pleasant number with a long
history of retrofitted justification, and no evidence that it produces more readable or more legible type
than 1.5 does. Use it because you like the sizes it gives you, not because of φ.

A practical hybrid that beats any single ratio: **1.125 from 12px up to 20px, then 1.25–1.33 above it.**
That is essentially what scale B is, arrived at by hand.

---

## Full Tailwind v4 `@theme` block

Tailwind v4 is CSS-first: `@theme` keys generate utilities, and the `--line-height` / `--letter-spacing` /
`--font-weight` modifiers on a `--text-*` key mean `text-4xl` alone carries all four values. That is the
entire point of baking tracking and leading into the step — the call site stops re-deciding.

```css
@import "tailwindcss";

@theme {
  /* families */
  --font-sans: "InterVariable", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  /* scale */
  --text-2xs: 0.6875rem;
  --text-2xs--line-height: 1.55;
  --text-2xs--letter-spacing: 0.02em;

  --text-xs: 0.75rem;
  --text-xs--line-height: 1.5;
  --text-xs--letter-spacing: 0.015em;

  --text-sm: 0.875rem;
  --text-sm--line-height: 1.5;
  --text-sm--letter-spacing: 0.005em;

  --text-base: 1rem;
  --text-base--line-height: 1.5;
  --text-base--letter-spacing: 0em;

  --text-lg: 1.125rem;
  --text-lg--line-height: 1.45;
  --text-lg--letter-spacing: -0.005em;

  --text-xl: 1.25rem;
  --text-xl--line-height: 1.4;
  --text-xl--letter-spacing: -0.01em;
  --text-xl--font-weight: 600;

  --text-2xl: 1.5rem;
  --text-2xl--line-height: 1.3;
  --text-2xl--letter-spacing: -0.015em;
  --text-2xl--font-weight: 600;

  --text-3xl: 1.875rem;
  --text-3xl--line-height: 1.22;
  --text-3xl--letter-spacing: -0.02em;
  --text-3xl--font-weight: 600;

  --text-4xl: 2.375rem;
  --text-4xl--line-height: 1.15;
  --text-4xl--letter-spacing: -0.022em;
  --text-4xl--font-weight: 600;

  --text-5xl: 3rem;
  --text-5xl--line-height: 1.1;
  --text-5xl--letter-spacing: -0.025em;
  --text-5xl--font-weight: 600;

  --text-6xl: 3.75rem;
  --text-6xl--line-height: 1.05;
  --text-6xl--letter-spacing: -0.03em;
  --text-6xl--font-weight: 700;

  /* measure */
  --container-prose: 65ch;
}

/* Base layer: the defaults every page inherits. */
@layer base {
  html {
    font-family: var(--font-sans);
    -webkit-text-size-adjust: 100%;
    font-synthesis: none;   /* dev guard: fake bold/italic render as regular, so they show up in review */
  }
  body { font-size: var(--text-base); line-height: 1.5; }

  h1, h2, h3, h4, figcaption, blockquote { text-wrap: balance; }
  p { text-wrap: pretty; }

  /* iOS Safari zooms the viewport on focus below 16px. Non-negotiable. */
  input, select, textarea { font-size: 1rem; }

  /* Numbers that sit in columns or update in place. */
  table, .tabular, .metric, .price { font-variant-numeric: tabular-nums lining-nums; }
}
```

Note what is *not* in the utility classes afterwards: no `tracking-tight`, no `leading-none`, no
`font-semibold` sprinkled on every heading. If those appear in the markup, either the token is wrong or
someone is overriding the system — both are worth a review comment.

---

## Checking a scale before you commit to it

1. **Render every step in one column, in the real face, at the real weight.** Any pair you cannot tell apart
   at a glance is one step too many. Delete the lower-value one.
2. **Render the extremes side by side.** If the largest step does not feel decisively larger than the second
   largest, the top of the scale is compressed and your hero will look timid.
3. **Set a real paragraph at the body step at the real measure** and read it. Not lorem ipsum — real product
   copy, at 65ch, on the real background colour.
4. **Zoom the browser to 200%** and confirm nothing breaks (WCAG 1.4.4).
5. **Set the OS/browser text size to large** and confirm the layout grows proportionally. If it does not,
   something is in `px`.
6. **Apply the 1.4.12 text-spacing override** and confirm nothing clips.
7. **Check dark mode.** Identical type looks heavier on dark backgrounds because light glyphs bloom against
   dark. A 400 weight that reads well on white can look slightly bold on black; if the face is variable, 350
   on dark surfaces is a legitimate correction, and lowering the text colour a step off pure white helps more.
