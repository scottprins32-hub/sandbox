# Common craft rules, and the ones that are wrong

The advice that circulates in UI-fundamentals talks, threads and design-system onboarding docs is mostly
sound: signifiers, hierarchy, grids, whitespace, typography, colour, dark mode, shadows, icons, buttons,
states, micro-interactions and overlays. Two of its better points — dark-mode elevation inverting, and the
shadow quality test — are stated more clearly there than in many published design-system docs.

This file maps each of those topics onto the skill that owns it, corrects the handful of rules that are wrong
or resting on a bad reason, and names what the usual treatment leaves out entirely.

**Read this when** you are about to repeat one of these rules in a review, or someone has just quoted one at
you and you need to know whether it holds.

---

## Where each topic lives

| Topic | Skill |
|---|---|
| Containers signal grouping; greyed-out signals inactive; the UI teaches its own use | `ui-signifiers-and-states` |
| Button/input states, feedback, micro-interactions, the copy-button chip | `ui-signifiers-and-states` |
| Icon sizing, icon buttons, CTA pairs, button padding | `ui-signifiers-and-states` |
| Hierarchy via size, position and colour; redesigning a card | `attention-and-hierarchy` (theory) + `typography-system` (values) |
| 12/8/4 column grids, whitespace, the 8pt system, grouping by proximity | `spacing-and-layout` |
| One typeface, tracking and line-height on large text, size ranges by density | `typography-system` |
| Primary and accent colour, ramps, semantic colour, dark mode | `color-and-theming` |
| Shadow craft, Y-axis offset, inner shadows, overlays and gradient scrims | `depth-and-overlays` |

---

## Corrections

### The 8pt grid — right rule, weak reason

The usual justification for multiples of 8 is *"you can always halve things with consistency."* That isn't
much of a reason, and it won't survive a colleague asking why.

The better reasons:

- **Device pixel ratios — but this argues for 4, not 8.** Do the arithmetic before repeating it. Multiples of
  4 already land on whole device pixels at every common ratio: 4 × 1.75 = 7, 4 × 1.5 = 6, 4 × 3 = 12. So does
  8, but it buys nothing extra — the DPR argument justifies a **4pt base**, and stopping there would be
  correct. What it rules out is a 2pt or 6pt base: 2 × 1.75 = 3.5 and 6 × 1.75 = 10.5, which land on
  fractional pixels and produce softened hairlines. Use this reason for choosing 4 as the unit, and one of
  the reasons below for choosing 8 as the default step.
- **Decision elimination.** This is the real case for 8 specifically. The point of a scale is that it removes
  a choice from every layout decision, and a coarser step removes more of them. Any value outside the scale
  needs a justification, which is what makes drift visible in code review — and drift is easier to spot
  against eight than against four.
- **Composability.** An 8pt rhythm with 4pt half-steps handles dense UI without abandoning the system.

Keep the rule. Use the real reasons. And keep the accompanying point that not everything must snap to a
12-column grid — grids earn their keep on repeating content, not on custom landing sections.

### Semantic colour is convention, not psychology

*Blue = trust, red = danger, yellow = warning, green = success* is usually presented as though the meanings
were intrinsic. They aren't. They're a Western software convention — worth following rigidly **inside** a
product for internal consistency, but not a fact about human beings. Red signals prosperity and good fortune
across much of East Asia; white is associated with mourning in several cultures. Claims that specific hues
reliably cause specific emotions are not well supported.

The engineering consequence is more important than the cultural one: **roughly 1 in 12 men has a
colour-vision deficiency, most commonly on the red/green axis** — precisely the axis that "red means error,
green means success" depends on. Colour must never be the sole carrier of meaning (WCAG 1.4.1). Always pair
it with an icon, a text label, or a shape. A red border alone is not an error state.

### "Ghost buttons" — terminology

Borderless icon buttons are often called *ghost buttons*. Conventionally a **ghost button** is a text or
outline button with a transparent background; a borderless icon-only control is an **icon button**. Minor,
but it's the kind of thing that causes confusion in a component library PR.

### Button padding

The guideline as usually stated — *"double the height for the width"* — is garbled. The usable heuristic is
**horizontal padding roughly twice the vertical padding** (e.g. `padding: 12px 24px`), which yields balanced
buttons at any label length. Total width is a consequence of the label, not a target.

### One typeface is taste, not law

"You'll never need more than one font" is a defensible working preference and a good default — but it's
taste presented as a rule. The legitimate exceptions are real: a **monospace** face for code, logs, and
tabular data, and occasionally a **display** face used sparingly for brand. What actually matters is that
every additional family needs a justification, not that the count is capped at one.

### Sound advice worth keeping

These are right as usually stated, and the skills preserve them:

- **Tracking down, leading down, as type size goes up** (≈ −2% to −3% letter-spacing, ~110–120% line-height
  on display text). The underlying mechanism is optical sizing: type is drawn with spacing tuned for text
  sizes, so it reads loose when enlarged. Variable fonts with an `opsz` axis do this automatically.
- **Dark mode elevation inverts** — shadows barely register on dark surfaces, so raised surfaces get
  *lighter* instead. This matches Material's dark-theme approach and is the single most-missed dark-mode rule.
- **Shadows offset on Y only**, low opacity, generous blur — and the quality test, *if the shadow is the first
  thing you notice, it's wrong*, which is good enough to be a headline in `depth-and-overlays`.
- **Icon size matched to line-height** (e.g. 24px icons against 24px line-height) for optical alignment.
- **Gradient scrims over flat overlays** for text on imagery — a flat scrim dulls the whole photo.
- **Whitespace matters more than grid adherence.** Correct, and under-appreciated.

---

## What the usual treatment leaves out

Three gaps, one of them serious.

**Accessibility, almost entirely.** Input focus states get covered; keyboard focus rings, contrast ratios,
target sizes and reduced motion generally do not. This is the biggest gap: a UI built to the standard advice
can look polished and still be unusable by keyboard, illegible at low vision, and non-compliant. The floor is
in `ui-craft/SKILL.md` and enforced inline throughout the craft skills — contrast (1.4.3, 1.4.11),
never-colour-alone (1.4.1), visible focus (2.4.7), target size (2.5.8), reflow (1.4.10), text spacing
(1.4.12), and `prefers-reduced-motion`.

**Design tokens.** The rules above are five independent sets of preferences with no mechanism binding them.
Tokens — and specifically the primitive/semantic split — are what make them one system, make dark mode a
redefinition rather than a rewrite, and stop components hardcoding values and drifting. This is the spine of
`ui-craft/SKILL.md`.

**Container queries.** The 12/8/4 responsive column model is viewport-based and dates from a page-layout era.
Components that need to respond to *their own* available width — a card that appears in both a sidebar and a
full-width grid — are what container queries solve. Covered in `spacing-and-layout`.
