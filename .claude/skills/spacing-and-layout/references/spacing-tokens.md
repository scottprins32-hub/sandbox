# Spacing tokens: complete files, component tables, and a migration recipe

Read this when setting up a new project's spacing layer, or when auditing a codebase that already has a
hundred arbitrary values. `SKILL.md` gives the scale and the reasoning; this gives the copy-paste artefacts.

## 1. The three density presets

Same eleven-step primitive scale in all three. What changes is which steps the semantic tokens point at.
Pick one per surface — a marketing site and its admin console are different densities.

```css
/* ---- Primitives: identical everywhere. Never referenced by components. ---- */
:root {
  --space-3xs: 0.125rem; /*   2px */
  --space-2xs: 0.25rem;  /*   4px */
  --space-xs:  0.5rem;   /*   8px */
  --space-sm:  0.75rem;  /*  12px */
  --space-md:  1rem;     /*  16px */
  --space-lg:  1.5rem;   /*  24px */
  --space-xl:  2rem;     /*  32px */
  --space-2xl: 3rem;     /*  48px */
  --space-3xl: 4rem;     /*  64px */
  --space-4xl: 6rem;     /*  96px */
  --space-5xl: 8rem;     /* 128px */
}
```

### Preset A — editorial / marketing

Space is the design. Wide range, large steps, generous section rhythm.

```css
[data-density="editorial"] {
  --gap-inline:    var(--space-xs);    /*  8  icon → label */
  --gap-field:     var(--space-xs);    /*  8  label → input */
  --gap-fields:    var(--space-lg);    /* 24  field → field */
  --gap-group:     var(--space-2xl);   /* 48  block → block */
  --gap-section:   var(--space-4xl);   /* 96  section → section */
  --pad-card:      var(--space-xl);    /* 32 */
  --pad-control-y: var(--space-sm);    /* 12 */
  --pad-control-x: var(--space-lg);    /* 24 */
  --control-min-h: 3rem;               /* 48 */
  --measure:       68ch;
  --content-max:   72rem;
  --gutter:        clamp(1.25rem, 5vw, 4rem);
}
```

### Preset B — product default

The one to start from if you are unsure.

```css
[data-density="default"] {
  --gap-inline:    var(--space-2xs);   /*  4 */
  --gap-field:     var(--space-2xs);   /*  4 */
  --gap-fields:    var(--space-lg);    /* 24 */
  --gap-group:     var(--space-2xl);   /* 48  2× the field gap — 32 here reads as one level, not two */
  --gap-section:   var(--space-3xl);   /* 64 */
  --pad-card:      var(--space-lg);    /* 24 */
  --pad-control-y: var(--space-sm);    /* 12 */
  --pad-control-x: var(--space-md);    /* 16 */
  --control-min-h: 2.5rem;             /* 40 */
  --measure:       66ch;
  --content-max:   80rem;
  --gutter:        clamp(1rem, 4vw, 2rem);
}
```

### Preset C — dense / data tool

Half-steps do the work. Information density is the feature; do not "fix" it with whitespace.

```css
[data-density="compact"] {
  --gap-inline:    var(--space-2xs);   /*  4 */
  --gap-field:     var(--space-3xs);   /*  2 */
  --gap-fields:    var(--space-sm);    /* 12 */
  --gap-group:     var(--space-lg);    /* 24 */
  --gap-section:   var(--space-xl);    /* 32 */
  --pad-card:      var(--space-md);    /* 16 */
  --pad-control-y: var(--space-2xs);   /*  4 */
  --pad-control-x: var(--space-xs);    /*  8 */
  --control-min-h: 1.75rem;            /* 28 */
  --measure:       66ch;
  --content-max:   none;
  --gutter:        var(--space-md);
}
```

**Measure does not compress.** Every other token in this preset shrinks; `--measure` does not, and it is the
one people push the other way — a dense tool feels like it should run text edge to edge. A readable
line length is a property of the type, not of the surface: density buys you more *rows* on screen, not
longer *lines*. 80ch is the value usually reached for here and it is out of range twice over — past the
45–75-character convention in the ship checklist, and past the 80-character ceiling in **WCAG 1.4.8 Visual
Presentation (AAA)**. It is worse than it looks, because `ch` is the advance width of `0`, which is wider
than the average character in running prose, so a cap in `ch` always yields more characters than its number
suggests. `typography-system` move 4 owns the measure and the conversion.

**The compact caveat.** A 28px control passes WCAG 2.5.8 (24×24 CSS px, Level AA) only if it is also ≥24px
wide *or* satisfies the spacing exception. It fails the 44px touch standard, so a compact density must be
pointer-only or must switch presets on coarse pointers:

```css
@media (pointer: coarse) {
  :root { --control-min-h: 2.75rem; --pad-control-y: var(--space-sm); }
}
```

## 2. Component padding tables

Values are for **Preset B (product default)**. Multiply by ~1.35 for editorial, ~0.6 for compact.

### Buttons

| Size | Padding (y × x) | min-height | Gap icon→label | Notes |
|---|---|---|---|---|
| sm | 6 × 12 | 32px | 6px | Pointer-only surfaces; fails the 44px touch target |
| md | 10 × 16 | 40px | 8px | Default |
| lg | 14 × 24 | 48px | 8px | Primary CTA, touch surfaces |
| icon-only sm | — | 32×32 | — | Expand hit area to 44px with `::after { inset: -6px }` |
| icon-only md | — | 40×40 | — | Expand to 44px with `::after { inset: -2px }` |

Use `min-height`, never `height` — WCAG 1.4.12 text-spacing overrides will clip a fixed height. Size comes
from padding plus line-height:

```css
.btn {
  min-block-size: var(--control-min-h);
  padding: var(--pad-control-y) var(--pad-control-x);
  line-height: 1.25;
  display: inline-flex; align-items: center; gap: var(--space-xs);
}
```

Space *between* buttons: 8px within a related cluster, 16px between a primary group and a destructive action,
and 8px is the WCAG-friendly floor (Material specifies ≥8dp between touch targets).

### Text inputs and form structure

| Relationship | Value |
|---|---|
| Input padding | 10px × 12px, `min-height: 40px` |
| Label → input | 4px |
| Input → hint or error | 4px |
| Field → next field | 24px |
| Fieldset → next fieldset | 48px |
| Legend → first field | 12px |
| Checkbox/radio → its label | 8px |
| Stacked checkbox → next checkbox | 12px |
| Form → submit row | 48px |

The critical ratio is **4px inside a field versus 24px between fields (1:6)**. Anything under 1:2 produces
the equidistant-label bug described in `SKILL.md` move 2.

```css
.field       { display: grid; gap: var(--gap-field); }
.field-stack { display: grid; gap: var(--gap-fields); }
.fieldset    { display: grid; gap: var(--gap-group); }
```

### Cards and panels

| Property | Value | Rule |
|---|---|---|
| Card padding | 24px | Must be ≥ the largest gap inside the card |
| Compact card padding | 16px | With ≤16px internal gaps |
| Card internal zone gap | 24px | Between meta / body / actions |
| Within a zone | 4–8px | Badge, title and byline are one unit |
| Card → card in a grid | 24px | The grid `gap`, not card margins |
| Media edge-to-edge inside a padded card | negative inset | `margin-inline: calc(var(--pad-card) * -1)` |

### Tables

| Property | Comfortable | Compact |
|---|---|---|
| Cell padding y | 12px | 6px |
| Cell padding x | 16px | 8px |
| Row min-height | 48px | 32px |
| Header padding y | 12px | 8px |
| First/last cell outer padding | match the container padding | — |

Numeric columns are right-aligned with tabular figures (`font-variant-numeric: tabular-nums`); alignment
does more for scannability than any amount of extra padding. Row *striping* and row *padding* solve the same
problem — pick one, and prefer padding plus a hairline border.

### Navigation, modals, sections

| Element | Value |
|---|---|
| Nav item padding | 8px × 12px, min 44px tall on touch |
| Nav item → nav item | 4px (vertical), 8px (horizontal) |
| Nav group → nav group | 24px, or a 16px gap plus a divider — not both |
| Modal padding | 24px, 32px on desktop |
| Modal header → body | 16px |
| Modal body → footer | 24px |
| Modal viewport inset | `max(16px, env(safe-area-inset-*))` |
| Section → section (app) | 64px |
| Section → section (marketing) | 96–128px, fluid via `clamp()` |
| Heading → its content | 12px |
| Content → next heading | 32px |

The heading rule is the one to internalise: the space *above* a heading should be roughly 2.5–3× the space
below it. Equal space on both sides orphans the heading.

## 3. Tailwind v4, CSS-first

```css
@import "tailwindcss";

@theme {
  /* Base multiplier: p-4 → 1rem, gap-6 → 1.5rem, space-y-8 → 2rem. */
  --spacing: 0.25rem;

  /* Named spacing utilities: p-gutter, gap-section, px-gutter. */
  --spacing-gutter:  clamp(1rem, 4vw, 2rem);
  --spacing-section: clamp(3rem, 8vw, 6rem);

  /* Containers: max-w-prose, max-w-content. */
  --container-prose:   66ch;
  --container-content: 80rem;

  /* Container-query breakpoints for @md:, @xl: variants. */
  --container-card: 24rem;
}
```

Tailwind's default numeric scale is already a 4px grid (`1` = 4px, `2` = 8px, `4` = 16px, `6` = 24px,
`8` = 32px, `12` = 48px, `16` = 64px, `24` = 96px). Using it as-is is a perfectly good decision — the useful
discipline is restricting yourself to a *subset* of it. A house rule of "only 1, 2, 3, 4, 6, 8, 12, 16, 24"
gets the same benefit as a bespoke scale with none of the setup.

Ban arbitrary spacing values in review. In ESLint with `eslint-plugin-tailwindcss`, or as a plain grep gate
in CI:

```bash
# Fails the build on arbitrary spacing values in class names.
rg -n '\b(p|m|gap|space)[a-z]*-\[' src/ && exit 1 || exit 0
```

## 4. Plain CSS, no framework

```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; }

.stack        { display: grid; gap: var(--gap-fields); }
.stack--tight { gap: var(--gap-field); }
.stack--loose { gap: var(--gap-group); }

.cluster { display: flex; flex-wrap: wrap; gap: var(--space-xs); align-items: center; }

.center {
  box-sizing: content-box;
  max-inline-size: var(--content-max);
  margin-inline: auto;
  padding-inline: var(--gutter);
}

.prose > * + * { margin-block-start: var(--flow, 1em); }
.prose > h2    { --flow: 1.6em; margin-block-end: 0.5em; }
.prose > p     { max-inline-size: var(--measure); }
```

## 5. Migrating a codebase that already has 100 arbitrary values

Do not do this as one pull request. It will not get reviewed and it will not get merged.

**Stage 1 — measure.** Extract every spacing value in use and count them.

```bash
rg -o --no-filename '(padding|margin|gap|top|left|right|bottom)[^:;]*:\s*[0-9.]+(px|rem)' src/ \
  | rg -o '[0-9.]+(px|rem)$' | sort | uniq -c | sort -rn
```

The output is the argument for the work: a typical unsystematised codebase shows 30–60 distinct values, with
a long tail of one-use numbers (13px, 18px, 22px, 27px) that nobody chose deliberately.

**Stage 2 — map, don't refactor.** Write the token file, then map every existing value to its nearest token.
Round to the nearest scale step; if a value is more than 3px from any step, flag it for a human — that is
either a real optical correction or a genuine mistake, and only a person can tell which.

**Stage 3 — enforce at the boundary.** Add the lint rule for *new* code only. Existing violations go in an
ignore list that shrinks. This is the step that makes the migration finish, because it stops the leak while
the backlog drains.

**Stage 4 — convert per component, with the review question.** Each PR converts one component. The review
question is not "is this value right" but **"which token is this, and why that one?"** — a question the
author can answer and the reviewer can check.

**What not to do:** a global find-and-replace of `13px` → `12px`. It will silently alter optical corrections
and break a handful of layouts in ways nobody traces back for months.

## 6. The audit questions

Run these against any screen with a spacing complaint:

1. How many distinct spacing values are in one viewport? Above ~6 and it will read as unsystematic.
2. Is the largest gap inside a container bigger than the container's padding? If so, the content is leaking.
3. Pick the three tightest groupings. Is each one at least 2× tighter than the space around it?
4. Is anything equidistant between two things it could belong to?
5. Is there a divider doing a job whitespace already did?
6. Does anything have a fixed `height` that contains text?
7. At 320px, does anything scroll horizontally?
