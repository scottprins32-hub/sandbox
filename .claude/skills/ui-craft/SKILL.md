---
name: ui-craft
description: Router and shared token layer for the five craft skills — the primitive-versus-semantic split that makes typography, spacing, colour, depth and states one system instead of five sets of preferences, plus the build order and the accessibility floor that spans all of them. Start here when building or auditing a whole design system, setting up a token file or Tailwind theme from scratch, or when a screen is clearly wrong and you cannot yet name which layer owns it — it diagnoses and hands off. Go straight to the specialist once the symptom is named: cluttered, cramped or "looks unfinished" to `spacing-and-layout`; muddy, garish, washed out, or anything about palettes, tokens for colour and dark mode to `color-and-theming`; flat, or any shadow, overlay or text-on-image question to `depth-and-overlays`; dead, unresponsive or missing states to `ui-signifiers-and-states`; "looks like a Word document" or a spreadsheet to `typography-system`.
---

# UI craft

This set answers a different question from the behaviour set. `ux-psychology` and its siblings tell you
**why** something works on a human — Gestalt grouping, salience, cognitive load. This set tells you **what
the values actually are**: 24px or 32px, 1.5 or 1.2, 4.5:1 or 3:1, which six states a button needs.

Both layers are required. Theory without values produces a design review full of adjectives. Values without
theory produce a tidy screen that emphasises the wrong thing.

The failure this set exists to prevent: a UI assembled from individually reasonable decisions that were each
made in isolation. Nothing is *wrong* on any single screen, and the whole thing still looks amateur — because
there are eleven spacing values, four near-identical greys, three type sizes within 2px of each other, and a
shadow that changes on every card. **Consistency is the effect. A system is the cause.**

## Decide first

These five choices determine every number downstream. Settle them before writing CSS.

1. **Density.** A marketing page and a dashboard are opposite problems, and this one choice sets the starting
   values in all five specialist skills. Pick one of three and name it — the specialists refer to these names
   rather than each inventing their own scale.

   | Density | Fits | Spacing rhythm | Type sizes | Top of type scale | Min target |
   |---|---|---|---|---|---|
   | **Editorial** | Marketing, landing, docs, blog | 8pt base, sections 64–96px | 5–6 sizes, wide range | 48–60px | 44×44 |
   | **Product** | App screens, settings, forms, cards | 8pt base, sections 32–48px | 6–8 sizes | 30–38px | 44×44 |
   | **Dense tool** | Ops tables, dashboards, consoles | 4pt base, sections 16–24px | 4–5 sizes, tight range | 20–24px | 24×24 floor, 32px rows |

   Applying editorial spacing to an ops table wastes the screen an operator needs; applying dense-tool values
   to a landing page reads as cramped and cheap. **Dense tool is where accessibility gets squeezed**, so it
   carries an explicit floor: 24×24 CSS px is the WCAG 2.2 minimum (2.5.8), not a target, and the comfortable
   44×44 is what you give up to get the density. If a product has both a marketing surface and an ops
   surface, they are two densities in one codebase — scope the tokens, don't average them.

   `list-and-queue-design` owns the case where dense-tool needs a runtime comfortable/compact toggle.
2. **Platform and input.** Touch needs larger targets and has no hover — any signifier that only appears on
   hover does not exist on a phone. Pointer allows denser layouts and hover affordances.
3. **Brand constraints.** An existing brand colour, typeface or logo is a fixed point. Brand colours very
   often fail text contrast; plan for an accessible variant rather than discovering this at the end.
4. **Light, dark, or both.** Deciding this late is expensive — dark mode is a re-derivation of the palette,
   not a filter you apply afterwards, and retrofitting it forces a token refactor.
5. **Is there an existing design system?** If the project uses one, your job is to use it correctly and
   extend it consistently, not to invent a parallel scale. Inventing a second system is the most common way
   a codebase's UI decays.

## The token layer

This is the part most "design fundamentals" material leaves out, and it is what makes the rest hold.

Every skill in this set produces **tokens** — named values, defined once, referenced everywhere. Components
must never contain raw values. The moment a component hardcodes `#3b82f6` or `padding: 13px`, it has opted
out of the system and will drift.

Two levels, and the distinction matters:

- **Primitive tokens** name a raw value: `--blue-600`, `--space-4`, `--text-lg`. They describe *what it is*.
- **Semantic tokens** name a role: `--color-surface`, `--color-surface-raised`, `--color-border-subtle`,
  `--color-text-primary`, `--color-danger`. They describe *what it is for*, and they point at primitives.

Components reference **semantic** tokens only. That indirection is what makes theming tractable: dark mode
becomes a redefinition of the semantic layer, and no component changes. Without it, dark mode means editing
every component, and you will miss some.

```css
:root {
  /* primitives — what it is */
  --grey-50:  oklch(0.98 0.002 250);
  --grey-900: oklch(0.21 0.008 250);
  --space-4: 1rem;

  /* semantic — what it's for. Components use only these. */
  --color-surface:      var(--grey-50);
  --color-text-primary: var(--grey-900);
}

:root[data-theme="dark"] {
  --color-surface:      var(--grey-900);   /* one layer changes */
  --color-text-primary: var(--grey-50);
}
```

Name semantic tokens by role, never by appearance. `--color-border-subtle` survives a redesign;
`--color-border-light-grey` becomes a lie the first time it is dark.

## Route to the right skill

Build a new system in this order — each stage depends on the one above it.

| Order | Skill | Owns |
|---|---|---|
| 1 | `typography-system` | Typeface choice, type scale, tracking and line-height per step, measure, density by product type. Start here: most of a UI is text, and type sizes drive spacing. |
| 2 | `spacing-and-layout` | Spacing scale and why 8pt, whitespace as hierarchy, proximity as actual numbers, grids and when they don't apply, layout primitives, container queries, reflow. |
| 3 | `color-and-theming` | Primary and accent, perceptual ramps in OKLCH, semantic colour, contrast as a generation constraint, and dark mode as a re-derivation. |
| 4 | `depth-and-overlays` | Elevation scale, layered shadows, borders vs shadows, dark-mode depth via lightness, and text over imagery with guaranteed contrast. |
| 5 | `ui-signifiers-and-states` | Affordances and signifiers, the full state matrix for every interactive component, feedback by latency, and micro-interactions that confirm outcomes. |

Fixing an existing screen rather than building a system? Go straight to the skill that owns the symptom:
*cluttered* → `spacing-and-layout`. *Looks like a spreadsheet* → `typography-system` then `depth-and-overlays`.
*Muddy or garish* → `color-and-theming`. *Feels dead or unresponsive* → `ui-signifiers-and-states`.

### Neighbouring skills

- **Where the eye goes and why** — `attention-and-hierarchy`. It owns Gestalt, salience and scan patterns;
  this set supplies the numbers that implement them. Read both when laying out a screen.
- **Animation timing and easing** — `design-motion-principles`.
- **Visual taste and avoiding generic AI-looking design** — `taste-frontend-design`.
- **Whether the screen should exist and what it should make someone do** — `ux-psychology`.

## The accessibility floor

These apply across all five skills and are not negotiable in the way taste is. They are the most common gap
in design-fundamentals material, which tends to cover component states while never mentioning keyboard users
or contrast at all.

- **Contrast**: 4.5:1 for body text, 3:1 for large text (18.66px bold / 24px regular) and for UI component
  boundaries and meaningful graphics (WCAG 1.4.3, 1.4.11).
- **Never colour alone.** Roughly 1 in 12 men has a colour-vision deficiency, most commonly on the red/green
  axis — the exact axis "red = error, green = success" depends on. Always pair colour with an icon, a label,
  or a shape (WCAG 1.4.1).
- **Visible keyboard focus.** Removing an outline without replacing it is a straight failure (2.4.7). Use
  `:focus-visible` so pointer users don't see rings but keyboard users do.
- **Target size** at least 24×24 CSS px (2.5.8); 44×44 is the comfortable touch target.
- **Respect user settings**: `prefers-reduced-motion`, `prefers-color-scheme`, and browser font scaling —
  size in `rem`, never lock text size.
- **Reflow at 320px** without horizontal scrolling (1.4.10), and survive user text-spacing overrides (1.4.12),
  which means no fixed-height text containers.

## Rules that hold across the set

**A small closed set of values beats a good eye.** The reason to use a scale is not that 8px is magic — it is
that a constrained set removes a decision from every layout choice and makes inconsistency visible in code
review. Any value outside the scale should require a reason.

**Consistency is worth more than optimality.** A slightly-too-large spacing value used everywhere looks
deliberate. Eleven nearly-identical values look broken. When in doubt, reuse rather than tune.

**Whitespace is the cheapest fix you have.** Most "this feels cluttered" problems are solved by spacing
alone, with no colour, type or layout change. Try that before anything else.

**Every state, every time.** A component is not done when it renders. Default, hover, active, focus-visible,
disabled and loading are all part of the deliverable, and so are the empty, error and partial-data states of
any view that fetches something.

**If you notice the effect before the content, the effect is wrong.** This is literally true of shadows, and
it generalises: to gradients, borders, animation and colour saturation. Craft is felt, not seen.

**Separate law, convention, and taste.** Contrast minimums are law — comply. An 8pt grid is a convention —
adopt it unless you have a better system. "One typeface is enough" is taste — defensible, arguable, and
yours to overrule. Each skill in this set marks which is which, so you know what you're allowed to disagree
with.

`references/source-mapping.md` takes the craft rules that circulate most widely — the 8pt grid, semantic
colour, "one typeface is enough", ghost buttons, button padding — maps each onto the skill that owns it, and
corrects the ones that are wrong or resting on a bad reason. Read it before repeating one of them in a review.
