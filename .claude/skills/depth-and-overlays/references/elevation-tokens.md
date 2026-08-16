# Elevation tokens: complete files, assignment table, and migration

Read this when setting up a new project's depth system, or when auditing a codebase that already has
forty bespoke `box-shadow` declarations and needs to be pulled onto a scale.

`SKILL.md` move 4 has the default scale. This file has the two alternatives, the per-component
assignment table, the comparison against Material and Tailwind, and the migration recipe.

---

## Pick a system style first

| Style | Use when | Resting card | Shadow budget |
|---|---|---|---|
| **A. Flat / bordered** | Dense data tools, admin consoles, tables, anything with >8 boxes on screen | `border` only, `--elevation-0` | Levels 3–5 only. Menus and modals float; nothing else does. |
| **B. Soft product** | General web apps, SaaS dashboards, marketing-adjacent product surfaces | `--elevation-1` + subtle border | All six levels. The default in `SKILL.md`. |
| **C. Dark-first** | Products that ship dark as the primary theme | Surface step, `--elevation-0` | Surface ladder carries elevation; shadows only separate overlays. |

Mixing styles per surface is fine and often right — a marketing page in style B and its admin console
in style A. Mixing them *within* a surface is the failure.

---

## Style A — flat / bordered (dense tools)

Zero shadows below level 3. Everything is separated by hairlines and surface steps. This is what
Linear-, Notion- and GitHub-class density actually looks like up close, and it is the correct default
for anything with a table in it.

```css
:root {
  --shadow-hsl: 222 40% 11%;

  --elevation-0: none;
  --elevation-1: none;                              /* cards use border + surface step */
  --elevation-2: none;                              /* hover uses a background shift   */

  --elevation-3:                                    /* dropdown, popover, tooltip      */
    0 1px 1px  0    hsl(var(--shadow-hsl) / 0.04),
    0 4px 8px  -2px hsl(var(--shadow-hsl) / 0.06),
    0 10px 16px -6px hsl(var(--shadow-hsl) / 0.08);

  --elevation-4:                                    /* modal, sheet, palette           */
    0 2px 4px  -1px hsl(var(--shadow-hsl) / 0.04),
    0 8px 16px -4px hsl(var(--shadow-hsl) / 0.07),
    0 20px 32px -12px hsl(var(--shadow-hsl) / 0.10);

  --elevation-5:                                    /* drag ghost                      */
    0 2px 4px  -1px hsl(var(--shadow-hsl) / 0.06),
    0 12px 24px -6px hsl(var(--shadow-hsl) / 0.10),
    0 28px 44px -16px hsl(var(--shadow-hsl) / 0.14);
}

.card      { background: var(--color-surface-raised); border: 1px solid var(--color-border-subtle); }
.card:hover{
  /* A state layer, not a different surface token. In light themes `--color-surface`,
     `-raised` and `-overlay` are all white, so swapping between them is a no-op —
     the surface ladder carries elevation in DARK mode only. Mixing toward the text
     colour darkens in light and lightens in dark, which is the behaviour you want in
     both. See `ui-signifiers-and-states` for the --state-* deltas. */
  background: color-mix(in oklab, var(--color-surface-raised),
                        var(--color-text-primary) var(--state-hover, 8%));
  border-color: var(--color-border);
}
```

Hover in this style is a **border + background** change, not a lift. That is a feature: it costs no
paint area, works identically in dark mode, and survives forced-colors.

---

## Style C — dark-first

Elevation lives entirely in the surface ladder (`color-and-theming` owns those tokens). Shadows exist
only to separate an overlay from whatever it covers, and there is one extra token — the lit top edge —
that does more work than any of them.

```css
:root[data-theme="dark"] {
  --shadow-hsl: 222 60% 2%;                          /* darker than the darkest surface  */
  --edge-highlight: inset 0 1px 0 0 rgb(255 255 255 / 0.06);

  --elevation-0: none;
  --elevation-1: none;                               /* surface-raised does it           */
  --elevation-2: none;
  --elevation-3: 0 4px 10px -2px hsl(var(--shadow-hsl) / 0.50),
                 0 10px 22px -6px hsl(var(--shadow-hsl) / 0.40);
  --elevation-4: 0 8px 20px -4px hsl(var(--shadow-hsl) / 0.60),
                 0 24px 48px -12px hsl(var(--shadow-hsl) / 0.50);
  --elevation-5: 0 10px 24px -4px hsl(var(--shadow-hsl) / 0.65),
                 0 32px 60px -16px hsl(var(--shadow-hsl) / 0.55);
}

/* Composition at the use site — box-shadow is one property, so tokens concatenate. */
.dialog { background: var(--color-surface-overlay); box-shadow: var(--edge-highlight), var(--elevation-4); }
```

Note the alphas: **40–65%**, versus 4–16% in light mode. That is not a contradiction of "reduce opacity
and increase blur" — the shadow's *job* has changed. In light mode it says "this is 24px above the
page". In dark mode it says "there is a boundary here and the page behind it is not part of me". The
tight-and-dark shadow that would be wrong in light mode is right for that second job, because there is
almost no luminance below `#15171C` to work with.

Verify by disabling shadows: every dark-theme container must still be visible from its surface step
and its border alone.

---

## Component assignment table

Decide once. This is the artefact that stops per-component shadow arguments.

| Component | Level | Also needs |
|---|---|---|
| Page section, table row, list item, breadcrumb | 0 | Border or surface step |
| Card, panel, tile, chip, well | 1 (A: 0) | `--color-border-subtle` |
| Input, select, textarea at rest | 0–1 | Border at ≥3:1 (WCAG 1.4.11) |
| Card hover, tile hover | 2 (A: background shift) | Transition ≤150ms |
| Sticky header / footer, app bar | 2 | Only once scrolled; 0 at scroll-top |
| Segmented-control thumb, raised button | 2 | `--edge-highlight` if physical style |
| Dropdown, select menu, combobox list | 3 | Border; `overflow` clipping check |
| Popover, tooltip, date picker, autocomplete | 3 | Arrow/pointer inherits the same shadow |
| Toast, snackbar, notification | 3 | Never above a modal in z-index |
| Modal, dialog, alert, action sheet | 4 | Backdrop; focus trap |
| Drawer / side sheet | 4 | Shadow on the leading edge only |
| Command palette | 4 | Often 5 if it floats over a modal |
| Drag ghost / reorder preview | 5 | `opacity: 0.9` and a cursor change |
| Anything sitting on a photograph | — | Border or light ring, **never** a shadow |

**The invariant:** sort every component by z-index and by elevation level. The two orderings must be
identical. A mismatch is a bug you can find with a script.

---

## How this compares to Material and to Tailwind's defaults

**Material 2 / MDC** composes each of 25 levels (0–24dp) from three shadows at fixed opacities —
`$shadow-key-umbra-opacity: 0.20`, `$shadow-key-penumbra-opacity: 0.14`,
`$shadow-ambient-shadow-opacity: 0.12` — with blur and offset scaling by dp. It is internally
consistent and considerably heavier than contemporary taste; Material 3 reduced to two layers and moved
primary elevation expression onto surface tint. If you are implementing Material, use Material's values;
do not blend them with the scale here.

**Tailwind's default `shadow-*`** utilities are two-layer and reasonable, but they are a *size* scale
(`sm`/`md`/`lg`/`xl`/`2xl`), not a *role* scale, and they are pure black. Two consequences: developers
pick by how it looks in isolation rather than by what the component is, so a popover ends up at
`shadow-md` while a card next to it is `shadow-lg`; and every shadow is `rgb(0 0 0 / …)`, which is the
muddiness problem in `SKILL.md` move 5. Override the namespace with role names (`shadow-e1` …
`shadow-e5`) so the utility name states the intent, and point them at `--shadow-hsl`.

---

## Lint and migration

**Lint rule.** Any `box-shadow` in a component file whose value is not `var(--elevation-*)`,
`var(--edge-highlight)`, a focus ring built from `--color-focus-ring` (`ui-signifiers-and-states` owns
that shape), `none`, or an `inset` autofill override is a violation.

```bash
# Every literal shadow left in the codebase, worst offenders first.
rg -n --glob '!**/tokens*.css' \
   'box-shadow:\s*(?!var\(|none|inset 0 0 0 100px)' -P src/ | sort | uniq -c | sort -rn
```

**Staged migration**, for a codebase with dozens of bespoke shadows:

1. **Inventory.** Run the grep above. Expect 20–60 distinct values and expect most of them to be
   within a few px of each other — that redundancy is the whole problem, and showing the list to the
   team is usually enough to win the argument.
2. **Cluster to six.** Group by total downward reach (`offsetY + blur/2 − spread`). The clusters fall
   out almost automatically: 0–4px, 4–10px, 10–24px, 24–48px, >48px.
3. **Define the tokens first, in one file**, and ship that as its own commit that changes nothing.
4. **Replace mechanically, cluster by cluster**, one commit per cluster. Every replacement is a
   *visual* change — that is the point — so do it where a designer can review a screenshot diff.
5. **Add the border pass.** Every container that was shadow-only gets `--color-border-subtle` or a
   `@media (forced-colors: active)` rule. This is the step that gets skipped; schedule it explicitly.
6. **Build the elevation sheet** (`SKILL.md` move 6) and land it in the same PR as the tokens, so the
   next person changing a value sees it against every surface immediately.
7. **Turn on the lint rule** as an error, not a warning, in the same PR that removes the last literal.

**What to do when a component genuinely needs a value off the scale:** it almost never does, but when
it does — an oversized promotional card, a floating video player — add a *named* token
(`--elevation-media-player`), not an inline literal. A named exception is auditable; an inline literal
is the start of the next forty.
