---
name: ui-craft
description: Router and shared token layer for the five craft skills — the primitive-versus-semantic split that makes typography, spacing, colour, depth and states one system instead of five sets of preferences, plus the build order and the accessibility floor that spans all of them. Start here when building or auditing a whole design system, setting up a token file or Tailwind theme from scratch, or when a screen is clearly wrong and you cannot yet name which layer owns it — it diagnoses and hands off. Go straight to the specialist once the symptom is named: cluttered, cramped or "looks unfinished" to `spacing-and-layout`; muddy, garish, washed out, or anything about palettes, tokens for colour and dark mode to `color-and-theming`; flat, or any shadow, overlay or text-on-image question to `depth-and-overlays`; dead, unresponsive or missing states to `ui-signifiers-and-states`; "looks like a Word document" or a spreadsheet to `typography-system`. Also start here when the surface is not a desk screen — read outdoors in daylight, held one-handed, operated with gloves, or on an intermittent connection — because those move density, contrast target and target size together and no single specialist owns the combination. Output that leaves the screen entirely — printed, or rendered to a fixed-page PDF — is `print-and-physical-artefacts`.
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
   values in all five specialist skills. Pick one per surface and declare it in the repo — each name below is
   a preset the specialists actually ship, so naming the density picks the tokens.

   | Density | Selector | Fits | Gaps: field / group / section | Type steps, range | Preset control height |
   |---|---|---|---|---|---|
   | **Editorial** | `[data-density="editorial"]` | Marketing, landing, docs, blog | 24 / 48 / 96px | 6 steps, 14→64px | 48px |
   | **Product** | `[data-density="default"]` | App screens, settings, forms, cards | 24 / 48 / 64px | 11 steps, 11→60px | 40px — pointer-only, see below |
   | **Dense tool** | `[data-density="compact"]` | Ops tables, dashboards, consoles | 12 / 24 / 32px | 6 steps, 11→24px | 28px — pointer-only, see below |

   **The specialist files are normative; this table is a summary.** Spacing comes from
   `spacing-and-layout/references/spacing-tokens.md` §1, type from
   `typography-system/references/type-scales.md` scales A/B/C. If a number here disagrees with one of those,
   the specialist wins and this table is stale — reconcile both in the same commit.

   **Target size is a floor, not a density setting.** The last column is each preset's default control
   *height*; the floor is identical in every row. 24×24 CSS px is the WCAG 2.2 AA minimum (2.5.8) and 44×44
   is what a touch surface needs (2.5.5 AAA; Apple HIG 44pt, Material 48dp with ≥8dp between neighbours). Any
   preset whose `--control-min-h` sits below 44px is a pointer-only surface and must raise it when the
   pointer is coarse, or it ships a defect on the first phone:

   ```css
   @media (pointer: coarse) { :root { --control-min-h: 2.75rem; } }  /* 44 */
   ```

   Applying editorial spacing to an ops table wastes the screen an operator needs; applying dense-tool values
   to a landing page reads as cramped and cheap. **Dense tool is where accessibility gets squeezed** — the
   density is bought with the comfortable 44×44, so it is only available where you can prove the pointer is
   fine. If a product has both a marketing surface and an ops surface, they are two densities in one
   codebase — scope the tokens, don't average them.

   `list-and-queue-design` owns the case where dense-tool needs a runtime comfortable/compact toggle.

   **Field and outdoor is a modifier on product density, not a fourth preset.** A phone held one-handed in
   daylight, possibly gloved, on a connection that comes and goes, is a surface all three presets are wrong
   for — and the mistake is predictable in both directions: *Product* hands it screen-normal contrast and a
   40px control, *Dense tool* hands it a 28px control because it is technically an ops product. Start from
   `default` and override these, then tell the specialists which ones you moved:

   - Body text never below 16px, and inputs never below 16px at any density — under 16px iOS Safari zooms the
     page on focus and the user loses their place (`typography-system`).
   - Cut the scale to four steps. Nothing on a field screen needs eleven (`typography-system`).
   - 56×56 for the primary action, 44×44 for everything else, ≥8px between neighbours
     (`spacing-and-layout` move 8).
   - Aim body contrast at 7:1 — the 1.4.6 AAA ratio — rather than the 4.5:1 floor (`color-and-theming`). Read
     this as judgement, not compliance: no WCAG criterion addresses ambient light, but reflected daylight
     raises the screen's black level and eats apparent contrast, and 7:1 is the nearest defined target above
     the floor.
   - One primary action per screen, in the bottom third where a thumb reaches
     (`ui-signifiers-and-states` for the states it needs when nobody can hover).

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
| — | `print-and-physical-artefacts` | **Not part of the build sequence.** Where the output stops being a screen: paper sizes and page geometry, type sized from viewing distance, monochrome-first colour, QR module size, and the `@page` layer. Reach for it the moment anything gets printed or rendered to a fixed-page PDF. |

Fixing an existing screen rather than building a system? Go straight to the skill that owns the symptom:
*cluttered* → `spacing-and-layout`. *Looks like a spreadsheet* → `typography-system` then `depth-and-overlays`.
*Muddy or garish* → `color-and-theming`. *Feels dead or unresponsive* → `ui-signifiers-and-states`.
*Fine on screen and wrong on paper — colours gone, table split across pages, QR won't scan* →
`print-and-physical-artefacts`.

### Neighbouring skills

- **Where the eye goes and why** — `attention-and-hierarchy`. It owns Gestalt, salience and scan patterns;
  this set supplies the numbers that implement them. Read both when laying out a screen.
- **Animation timing and easing** — `design-motion-principles`.
- **Visual taste and avoiding generic AI-looking design** — `taste-frontend-design`.
- **Whether the screen should exist and what it should make someone do** — `ux-psychology`.
- **When there is no screen** — `print-and-physical-artefacts`. It deviates from this set's values on
  purpose: physical units instead of px, monochrome first, and a legibility floor set by viewing distance.

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

### The degraded-case check

`ux-psychology`, `attention-and-hierarchy` and `onboarding-activation` all say to design for the degraded
case — tired user, cracked phone, bad light, slow connection, second language. That is the principle; this is
the test. Run it once per surface, on the screen that surface exists for, before shipping.

1. DevTools → Network **Slow 4G**, Performance → CPU **4× slowdown**. Hard-reload. Within 3 seconds the
   screen shows something the user can act on or a skeleton in the shape of the real layout — not a spinner.
2. Device toolbar → width **320px**, which is what 1.4.10 actually asks for (equivalently 1280px at 400%
   zoom). Nothing scrolls horizontally. Then **iPhone SE (375×667)** at **200%** browser zoom, standing in
   for a user who has scaled their text (1.4.4): the primary action is still reachable without hunting and
   nothing overlaps.
3. Rendering panel → Emulate vision deficiencies → **Blurred vision**, then **Reduced contrast**. Under each,
   the primary action is still the first thing you find.
4. Screenshot it and view the image at 25%. The primary action is still the loudest thing. If the page goes
   uniformly grey, the hierarchy was carried by colour alone and fails 1.4.1 as well.
5. Inspect the primary action's box: ≥44×44 CSS px, ≥56×56 on a field surface, ≥8px to its nearest neighbour.
6. Compute body text contrast against the background it *renders* on — not the token pair's nominal value,
   which stops being true the moment text lands on a raised surface or an image. ≥4.5:1, ≥7:1 in the field.
7. Drop a real phone's brightness to a third and read the screen outdoors. This is the only step that needs
   hardware and the only one that finds the greys nobody can see.

A failure here is a token or density defect, not a screen defect. Fix it in the preset or the next screen
inherits it.

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

## Ship checklist

The five specialists each check their own layer. This one checks the seams between them, which is where a
system decays — no specialist's checklist catches four near-identical greys, because each grey is fine.
Run it against the token file plus one representative screen per surface.

- [ ] `rg -n '#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(' src/components/` returns nothing. A raw colour in a component
      has opted out of theming and will be missed on the dark-mode pass.
- [ ] `rg -n '(padding|margin|gap|inset|width|height)\s*:\s*[0-9.]+(px|rem)' src/components/` returns nothing.
- [ ] No component references a primitive token — `--grey-700`, `blue-500`, `--space-4`, `--text-lg`. Only
      semantic aliases: `--color-*`, `--gap-*`, `--pad-*`, `--font-*`.
- [ ] No semantic token names an appearance:
      `rg -n '\-\-color-([a-z-]*-)?(light|dark|grey|gray|blue|red|green)'` returns nothing. `--color-text-on-dark`
      is the common one and it becomes a lie in light mode. The optional group is what keeps `--color-highlight`
      out of the results.
- [ ] Count distinct values in the **built** CSS, not the source. Ceilings are the scale lengths the
      specialists ship: spacing ≤ 11, font-size ≤ 11, neutral steps ≤ 11, box-shadow ≤ 6. Over the ceiling
      means values are entering from outside the system.
- [ ] The surface's density is declared in the repo (`data-density` or the equivalent), and its gaps, type
      steps and control height match that row of the table above — the whole row, not the one value someone
      needed.
- [ ] Flipping `data-theme` changes no file outside the token layer. If a component needs editing, the
      semantic layer is incomplete.
- [ ] Every specialist checklist was run, or the diff provably touches none of that layer.
- [ ] Accessibility floor on the rendered screen: 4.5:1 body / 3:1 large text and boundaries,
      `:focus-visible` on every focusable thing, ≥24×24 targets and 44×44 on touch, no meaning by colour
      alone, reflow at 320px, survives the 1.4.12 text-spacing override.
- [ ] The degraded-case check above passes on one screen per surface.
- [ ] One screenshot per surface, placed side by side, reads as one product. This is the check the token
      counts exist to approximate, and it is the one that actually decides.

## Further reading in this skill

`references/source-mapping.md` takes the craft rules that circulate most widely — the 8pt grid, semantic
colour, "one typeface is enough", ghost buttons, button padding — maps each onto the skill that owns it, and
corrects the ones that are wrong or resting on a bad reason. Read it before repeating one of them in a review.
