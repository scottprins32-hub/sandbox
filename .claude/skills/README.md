# Design and UX skill set

Fifteen skills covering interface work end to end, in three layers. They are project-agnostic — written to
be copied into any future website or app repo, not tied to this codebase.

Claude loads a skill automatically when a task matches its `description`. You can also invoke one by name.

## The three layers

Each layer answers a different question. Real work usually needs all three, and the most common failure is
using one where another was needed — a spacing tweak will not fix a screen that asks the user a question
they cannot answer.

| Layer | Question | Router |
|---|---|---|
| **Behaviour** | Why does this work on a human? | `ux-psychology` |
| **Commitment** | What question does each element make the user ask? | `decision-screen-design` |
| **Craft** | What are the actual values — px, ratios, states? | `ui-craft` |

### Behaviour — 8 skills

| Skill | Answers |
|---|---|
| **ux-psychology** | Router and 71-entry principle catalogue. **Start here.** Forces a product diagnosis before any technique is picked. |
| **attention-and-hierarchy** | Where does the eye land, and is that where it needs to be? Preattentive salience, Gestalt, whitespace, scan patterns, contrast. |
| **friction-and-flow** | Why do people abandon a task they meant to finish? Cognitive load, Hick's/Fitts's, forms, defaults, and perceived performance — waiting is friction. |
| **persuasive-copy** | Does the wording move the decision? Framing, anchoring, social proof, CTA labels, errors, pricing language. |
| **onboarding-activation** | How fast does a new user reach the moment value becomes real? Time-to-value, deferred signup, endowed progress, empty states that teach. |
| **habit-loop-design** | Why would they come back tomorrow? B=MAP, the Hook model, variable reward, stored value, streaks, notification budgets — and when a habit loop is the wrong goal entirely. |
| **ethical-persuasion-audit** | Is this persuasion or manipulation, and is it lawful? Pattern taxonomy with fixes, plus the EU and US legal layer. |
| **behavioral-metrics** | Did it work, and what did it break? Activation, retention curve shape, guardrail metrics, honest A/B testing. |

### Commitment — 1 skill

| Skill | Answers |
|---|---|
| **decision-screen-design** | The moment someone decides to pay, book, subscribe or pick a plan. Its spine is an element-by-element question audit; it also owns pricing display and the law around reference pricing and auto-renewal. |

### Craft — 6 skills

| Skill | Answers |
|---|---|
| **ui-craft** | Router, plus the design-token layer (primitive vs semantic) that makes the other five one system rather than five sets of preferences. |
| **typography-system** | Typefaces, the size scale with tracking and line-height per step, measure, tabular figures, webfont loading. Start here on a new project — most of a UI is text. |
| **spacing-and-layout** | The spacing scale and why, space within a group vs between groups as numbers, grids and when they don't apply, container queries, reflow. |
| **color-and-theming** | Brand hue to 50–950 ramps in OKLCH, semantic tokens, contrast as a generation constraint, dark mode as re-derivation not inversion. |
| **depth-and-overlays** | Elevation scale, layered shadows, dark-mode depth via lightness, and text over imagery with guaranteed contrast. |
| **ui-signifiers-and-states** | Affordances, and the full state matrix — rest, hover, active, focus-visible, disabled, loading, selected, expanded, error, empty. |

## How to use them

**Building something new** — read `ux-psychology` first. Its diagnosis (voluntary or assigned use? in fast or
out fast? how often? who pays? where does value become real?) decides which of the rest apply. Skipping it is
how consumer-app engagement mechanics end up in a tool someone's employer handed them. Then `ui-craft` for
the values, in its stated order.

**Fixing something broken** — go to `behavioral-metrics` first to find where the funnel actually leaks. The
most common failure in this field is optimising a step that wasn't the problem.

**A screen with a price on it** — `decision-screen-design`, then `ethical-persuasion-audit` as a gate.

**Reviewing a PR** — each skill ends with a ship checklist written to run against a screen or a diff.

## Evidence quality

These skills cite named researchers and studies, and deliberately flag findings that are contested or failed
replication rather than repeating them as fact. `ux-psychology/references/principles.md` grades all 71
entries Robust / Mixed / Contested / Folklore, and closes with commonly repeated claims that don't hold up —
useful when someone cites folklore in a design review. The grading applies to *the claim as designers usually
state it*, not the underlying science: Miller's 7±2 is excellent research about digit span and folklore about
menu length, and appears as the latter.

Where a claim could not be attributed to a source, it is stated qualitatively rather than with an invented
number. Several skills close by naming the statistics they deliberately refused to quote.

## Source material and corrections

Built from three videos, each mapped to the layer it belongs to, with its citations checked:

- `ux-psychology/references/six-principles.md` — video one's six principles. Four of its statistics did not
  survive checking: the car-wash loyalty study is Nunes & Drèze (USC/UCLA), not Columbia; the jam study's
  choice-overload effect averages near zero across 50 replications; the "70–90% never change defaults" and
  "free samples +2,000%" figures have no locatable source.
- `ui-craft/references/source-mapping.md` — video two's craft topics. Mostly accurate; corrections cover
  semantic colour presented as universal when it is a Western convention (and the red/green axis it relies on
  is the most common colour-vision deficiency), the 8pt grid's real justification, and button padding.
- `decision-screen-design/references/three-redesigns.md` — video three's three redesigns, marked as reasoning
  rather than evidence: they carry no published data and each changes a dozen variables at once, so nothing
  can be attributed to any single change.

## Accessibility

Not an appendix. WCAG floors are enforced inline throughout the craft skills — contrast (1.4.3, 1.4.11),
never colour alone (1.4.1), visible keyboard focus (2.4.7), target size (2.5.8), reflow (1.4.10), text
spacing (1.4.12), and `prefers-reduced-motion`. This is the largest gap in the source material: a UI built
exactly to video two's standards can look polished and still be unusable by keyboard.

## Portability

Copy `.claude/skills/` into another repo and it works unchanged. Nothing depends on this project's stack;
code examples use CSS, Tailwind v4 and React for illustration only.
