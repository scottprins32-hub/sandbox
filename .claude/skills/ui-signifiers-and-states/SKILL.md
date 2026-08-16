---
name: ui-signifiers-and-states
description: Specifies how a control announces what it is and what it is doing — affordances and signifiers, and the complete state matrix (rest, hover, active, focus-visible, disabled, loading, selected, expanded, error, empty) with real px values, contrast floors, token names and CSS. Use this whenever the user is building or reviewing any interactive component — button, input, select, checkbox, toggle, tab, menu, card, table row, drag handle, list view — even if they never say "states" or "accessibility". Also use it for symptoms like "the button doesn't feel clickable", "nothing happens when I click", "how do I style focus", "should this button be disabled", "we need a tooltip explaining this", "the copy button gives no feedback", "our inputs look broken when Chrome autofills them", or any request that begins with writing instructions or helper text for a control. If someone is writing CSS for `:hover`, this skill decides what the other seven states are.
---

# UI signifiers and states

A control has to answer two questions without being asked: *what will this do*, and *what is it doing right
now*. The first is signification; the second is state. What goes wrong without this pass is not ugliness — it
is a component that looks finished in the happy path and is missing two thirds of its real surface area. The
button with a nice hover and no focus ring. The input with an error style but no read-only style, that turns
pale yellow when Chrome autofills it. The copy button that highlights on press and never says it copied. The
list that renders beautifully with twelve rows and renders a blank rectangle with zero.

The diagnostic that finds most of it: **instructions are a symptom of a missing signifier.** Every "click the
pencil icon to edit" in your UI is a bug report about the pencil icon.

## When this is the right skill

- Building or reviewing any interactive component, or auditing a component library for gaps.
- Someone says a control "doesn't look clickable", "feels dead", or "nobody knows they can do that".
- Writing CSS for interaction states, focus rings, disabled styling, or selection.
- Deciding whether a button should be disabled, and what to do instead.
- Wiring async feedback: loading buttons, save confirmations, toasts, live regions.
- A view needs its loading / empty / error / partial variants and nobody has defined them.

Go elsewhere when: the question is **where the eye goes and what is loudest** → `attention-and-hierarchy`,
which owns Gestalt grouping, preattentive salience and the theory of hierarchy; this skill assumes it and
gives per-state values. **Which colours the tokens hold** → `color-and-theming`. **How much space around a
target** → `spacing-and-layout`. **Whether a pressed state should use elevation** → `depth-and-overlays`.
**Why people abandon a task**, or whether a wait is a skeleton or a spinner →
`friction-and-flow` (`friction-and-flow/references/perceived-performance.md` owns loading strategy; this skill owns which state
the *control* enters). **Duration, easing, choreography** → `design-motion-principles`. **Whether it looks
good** → `taste-frontend-design`.

## Decide first

Five choices set every number below. Answer them once per project, not per component.

1. **Pointer, touch, or both?** Hover does not exist on touch. If any meaningful share of use is touch, hover
   may only ever *enhance* a signifier that is already visible — never carry one. Assume both unless you own
   the hardware.
2. **Density and archetype.** `ui-craft` names the three densities (editorial / product / dense tool) and
   their starting values; the archetype table in `ux-psychology` tells you which surface you are on. States scale with it: a marketing page affords a 4px focus
   ring at a generous offset and 150ms transitions, an ops console with 40 rows gets 2px at a 1px offset and
   near-instant ones — and needs states that survive being seen a thousand times, carried by shape and
   position rather than by novelty.
3. **Light, dark, or both?** State deltas are not symmetric. On a light surface hover usually darkens; on a
   dark surface it usually lightens. A fixed `darken(4%)` produces an invisible hover in dark mode. Derive
   state layers from the theme's foreground colour, not from a hard-coded direction.
4. **Is there an existing design system?** If it names states, adopt its names and its state mechanism even
   if you dislike the values. Two vocabularies for the same six states is worse than one imperfect one.
5. **Who owns "loading" — the component or the page?** Either a button knows it is submitting or a parent
   passes it in. Pick one and be consistent; most stuck spinners are two layers each assuming the other
   resets the flag.

## The moves

### 1. Get affordance and signifier right, because the distinction is the job

**Affordance** is James J. Gibson's term (*The Ecological Approach to Visual Perception*, 1979): a relation
between object and actor describing what actions are *possible*. A door affords pushing whether or not anyone
can tell. Norman imported it into design in *The Design of Everyday Things* (1988) and then spent twenty
years correcting the result — first "perceived affordance" ("Affordance, Conventions and Design",
*interactions* 6(3), 1999), then decisively in "Signifiers, not affordances" (*interactions* 15(6), 2008):
what designers actually place on a screen are **signifiers**, perceptible cues advertising where an action is
possible. The affordance of a `<button>` is that it can be clicked. The signifier is everything that tells a
human so. You do not design affordances. You design signifiers.

Bill Gaver's taxonomy ("Technology Affordances", *CHI '91*) names the two failure modes:

| | Action possible | Action not possible |
|---|---|---|
| **Cue present** | Perceptible affordance — the goal | **False affordance**: cards with hover shadows that do nothing, underlined non-links, `cursor: pointer` on dead elements |
| **Cue absent** | **Hidden affordance**: the swipe nobody found, the right-click menu, the edit-on-double-click cell | Correct rejection |

Every "users didn't realise they could…" bug is a hidden affordance; every "people keep clicking that" bug is
a false one. Both are fixed with signifiers, not documentation.

**The operational rule:** every interactive element must be identifiable as interactive under three
simultaneous deprivations — **no hover, no colour, no motion**. That is not a hypothetical: it is a touch
user with a colour-vision deficiency who has `prefers-reduced-motion` set, and it is also just someone
looking at a screenshot. Test it by desaturating a screenshot and asking a colleague to circle everything
they think is clickable. Signifiers ranked by how well they survive that test:

| Signifier | Greyscale | Touch |
|---|---|---|
| Text label naming the action ("Save draft") | Yes | Yes |
| Enclosure — a filled or outlined container | Yes | Yes |
| Position in a known slot (dialog footer, row end); conventional icon (✎ ⌄ ⋮ ⇅) | Yes | Yes |
| Underline on inline text | Yes | Yes |
| Elevation / shadow | Weakly | Yes |
| Cursor change | Yes | **No** |
| Colour alone | **No** | Yes |
| Hover reveal, and tooltips — the weakest available (move 10) | n/a | **No** |

**A container says three different things, and the difference is context, not the border.** The folklore — a
container around a group means relatedness, around one item means selection, greyed means inactive — is right
and under-specified, and the missing half is what makes it usable. It reads as **grouping** when containers
are the *uniform* treatment: every card has one, so the border says "region" (Palmer's common region;
`attention-and-hierarchy` owns the mechanism). It reads as **selection** only as an *exception in an
otherwise uniform field* — one item of twelve carries a fill the others lack; if every row already has a
border, bordering the selected row communicates nothing. And it reads as **inactive** when its contrast
collapses *relative to its neighbours* — grey-on-grey surrounded by more grey is just a quiet UI. So never
ask what a border means in isolation. Ask what the other eleven items look like.

How it fails: teams add signifiers by adding chrome — borders and shadows on everything — which destroys the
uniform field that made exception legible, then reach for colour to compensate, which fails greyscale. Add
signifiers by *subtracting* from the non-interactive elements first.

### 2. Hover is a bonus channel; build for its absence

`:hover` is unavailable on touch, unreliable on hybrids, and on iOS a tap can leave a control stuck in hover
until the user taps elsewhere. Treat every hover style as decoration over a design that already worked.

```css
/* Default is visible. Hover-reveal is applied only where hover exists. */
.row-actions { opacity: 1; }
@media (hover: hover) and (pointer: fine) {
  .row-actions { opacity: 0; transition: opacity 120ms; }
  .row:hover .row-actions,
  .row-actions:focus-within { opacity: 1; }   /* focus-within is mandatory, not optional */
}
```

Written the other way round — hidden by default, shown on hover — the touch user gets nothing and so does the
keyboard user. **Cursors** (convention; the web's is settled regardless of the purist "pointer means link"
argument): `pointer` on anything clickable, `text` on text, `grab`/`grabbing` on drag handles, `not-allowed`
on `aria-disabled` controls, and `default` — never `pointer` — on non-interactive elements.

**Hit area** (law; `friction-and-flow` owns Fitts's law): WCAG 2.2 SC 2.5.8 Target Size (Minimum, AA)
requires 24×24 CSS px, SC 2.5.5 (Enhanced, AAA) asks 44×44, and `spacing-and-layout` owns those values, the
invisible-expansion recipe and the minimum gap between adjacent targets. What belongs here is only that the
expanded target must match what the signifier appears to advertise — a hit area reaching well past the visible
control is a false affordance pointing the other way, swallowing clicks aimed at its neighbour.

How it fails: hover-only table-row actions are the single most common way a desktop-designed app becomes
unusable on a tablet.

### 3. Build the state matrix as a token layer, not per component

States are not a list; they are orthogonal axes that multiply.

| Axis | Values |
|---|---|
| Interaction | rest → hover → active/pressed, and independently focus-visible |
| Availability | enabled, disabled, read-only, loading/busy |
| Selection | unselected, selected, indeterminate |
| Disclosure | collapsed, expanded |
| Validity | untouched, valid, invalid, warning |

Enumerating the cross-product per component is how a library ends up with 200 hand-tuned styles that drift.
Define the *deltas* once as tokens; let every component consume them.

**The state-layer technique.** A state is a translucent layer of the component's own foreground colour
composited over its background. One mechanism, automatically correct in both themes, because the direction of
the shift is derived from the theme instead of hard-coded.

```css
:root {
  /* Deltas: convention, not law. Tune the values; keep the ordering. */
  --state-hover: 8%; --state-press: 12%; --state-selected: 10%; --state-drag: 16%;
}
/* This skill defines no colours. `--color-action`, `--color-on-action`, `--color-surface`,
   `--color-focus-ring` and the status set come from `color-and-theming` move 7, declared once
   with light-dark() so both themes fall out of a single definition. */

.btn-primary { background: var(--color-action); color: var(--color-on-action); }
@media (hover: hover) and (pointer: fine) {
  .btn-primary:hover { background: color-mix(in oklab, var(--color-action), var(--color-on-action) var(--state-hover)); }
}
.btn-primary:active  { background: color-mix(in oklab, var(--color-action), var(--color-on-action) var(--state-press)); }
```

Mixing toward `--color-on-action` rather than toward black or white is what makes one rule correct in both
themes: the foreground token already flips with the theme, so the hover darkens a light fill and lightens a
dark one without a second block. `color-mix()` in `oklab` then gives perceptually even steps, so 8% looks like
the same size of change on every hue — which a naive `hsl()` lightness shift does not (CSS Color Level 4/5;
interoperable across evergreen browsers since 2023). In Tailwind v4 the palette lives in `@theme` and the
deltas in one `@utility`, so the 8%/12% still exists in exactly one place:

```css
/* @theme carries the --color-* palette from `color-and-theming`; only the deltas live here. */
@utility btn-primary {
  background: var(--color-action); color: var(--color-on-action);
  &:hover  { @media (hover: hover) { background: color-mix(in oklab, var(--color-action), var(--color-on-action) var(--state-hover)); } }
  &:active { background: color-mix(in oklab, var(--color-action), var(--color-on-action) var(--state-press)); }
}
```

**Precedence.** States collide, and CSS resolves collisions by source order at equal specificity. Write them
in this order, last wins:

```
rest → hover → selected → active/pressed → read-only → loading → disabled → focus-visible
```

Two rules make that survivable. **Express focus with `outline`, never with `background`** — an outline
composes with any background state, so the ring stays visible on a hovered, selected, pressed control. And
**disabled must override every colour state**, which is why it sits second to last.

**The button matrix.** This is the minimum shippable set; anything less is an incomplete component.

| State | Visual delta | Contrast requirement |
|---|---|---|
| Rest | Base tokens | Label ≥4.5:1 on its own fill (1.4.3); fill or border ≥3:1 vs page background (1.4.11) |
| Hover | State layer 8%, pointer devices only | Same as rest — hover is not licence to drop contrast |
| Active / pressed | State layer 12%, optionally `translate-y: 1px` or `scale: .98`. Must be visibly different **from hover**, because the pointer is already hovering when it presses | Same as rest |
| Focus-visible | 2px ring at 2px offset, drawn outside the component | Ring ≥3:1 against both the component and the adjacent background (1.4.11) |
| Disabled | Reduced-contrast token pair (move 5) | Exempt from 1.4.3/1.4.11 as an inactive component — aim ≥3:1 anyway |
| Loading / busy | Spinner joins or replaces the label, **width frozen** | Indicator ≥3:1 (1.4.11) |
| Selected (toggle buttons) | Fill plus a non-colour cue: check glyph, inset border | 1.4.1 — never colour alone |

Freeze the width: a button whose label swaps from "Save" to "Saving…" reflows the row and moves whatever sits
beside it under the user's cursor. Use `min-width` from the longest label, or a fixed-size spinner slot.

How it fails: per-component hard-coded hex. The tell is `#1e40af` in nine files with the ninth one a shade
off. Second tell: a hover that is invisible in dark mode, which a fixed-direction darken always produces.

### 4. Focus: the one state with a legal floor and the one most often deleted

**Law.** WCAG 2.2 SC 2.4.7 Focus Visible (AA): any keyboard-operable interface has a mode of operation where
the focus indicator is visible. `outline: none` with no replacement is a direct failure — probably the most
common WCAG failure in modern CSS, because it arrives via a reset or a "remove the ugly blue ring" snippet.
SC 2.4.11 Focus Not Obscured (Minimum, AA), new in 2.2, adds that a focused component must not be *entirely*
hidden by author content — which in practice means sticky headers, sticky footers, cookie bars and toasts.
SC 2.4.13 Focus Appearance (AAA) quantifies "visible": an indicator area at least as large as a 2 CSS px
thick perimeter of the component, at ≥3:1 against the unfocused state.

**`:focus` vs `:focus-visible`.** `:focus` matches whenever the element has focus, including a mouse click on
a button — which is why authors delete it. `:focus-visible` matches only when the user agent's heuristic says
the indicator should be shown: keyboard navigation, and always for text inputs. Style `:focus-visible`.
Keyboard users get the ring, mouse users get a clean press, no accessibility cost.

```css
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--color-surface);   /* two-tone halo; use -raised on a raised card */
}
/* Only ship this alongside the rule above, never instead of it. */
:where(a, button, input, select, textarea):focus:not(:focus-visible) { outline: none; }
```

Nothing in that rule touches `border-radius`, and nothing should: current browsers already draw the outline
following the element's *own* radius. The `border-radius: inherit` that circulates in focus snippets is
actively harmful — `border-radius` is not an inherited property, so `inherit` explicitly pulls the *parent's*
computed radius and applies it for the duration of focus. A 6px-rounded button inside a square wrapper snaps
to square corners the instant it is tabbed to.

The two-tone ring is the fix for indicators sitting on unknown backgrounds: a focus colour passing 3:1 on
white fails on a dark card, so draw two rings of opposing luminance — the `box-shadow` fills the offset gap
with the surface colour, so the outline always has a known neighbour. `outline-offset` also needs an unclipped
ancestor — a focus ring inside `overflow: hidden` is a ring you cannot see, a frequent bug in scroll
containers, table cells and rounded cards. Give the container padding equal to the offset, or pull the ring
inward with `outline-offset: -2px`. And use `:focus-within` on composite widgets: the wrapper around a text
field with an inline button, and every hover-revealed action.

How it fails: (a) `*:focus { outline: none }` in a reset, uncompensated; (b) a focus ring the same colour as
the hover state, so hover looks like focus; (c) sticky headers hiding the focused element — test by tabbing
from the top of a long page with the header pinned; (d) focus removed from `<a>` styled as a button, which is
also the element that does not fire on Space and does not get `:active` from the keyboard.

### 5. Disabled: exempt from contrast, still not allowed to be illegible — and usually the wrong answer

**Law, precisely.** SC 1.4.3 and 1.4.11 both exclude *inactive* user interface components from their contrast
requirements. A disabled button at 2.1:1 therefore does not fail AA. That is the entire concession, and it is
over-read: it means you will not fail an audit, not that the control is usable. A disabled control must still
be *read* — the user has to be able to tell that a "Continue" button exists and is currently unavailable. Aim
≥3:1 for disabled content when your palette allows; when it cannot, keep disabled recognisable by **shape**
(outline stays at full contrast, only fill and label soften) rather than fading the whole thing away.
Material's convention — content at 38% opacity over a container at 12% — is a reasonable default, and it is a
convention, not a threshold; on a low-contrast palette it lands well under 3:1.

**`disabled` vs `aria-disabled`** are different mechanisms and the difference is the whole argument:

| | `disabled` (HTML) | `aria-disabled="true"` |
|---|---|---|
| In tab order | **No** — removed, along with descendants of a disabled `<fieldset>` | Yes, still focusable |
| Fires events | No — clicks and most pointer events suppressed | **Yes** — you must guard the handler |
| Can carry an explanation the user can reach | Poorly: not focusable, pointer events suppressed | Yes |
| Value submitted with the form | No | Yes |

Because a `disabled` control cannot receive focus, a keyboard or screen-reader user cannot land on it, cannot
read a tooltip attached to it, and in a long form may never discover the submit button exists. That is the
accessibility problem with disabled buttons, and adding a `title` does not solve it.

**Prefer the enabled button that explains what is missing.** The GOV.UK Design System's button guidance is
blunt: disabled buttons have poor contrast and confuse users, so avoid them unless research shows they help.

```jsx
// Enabled. On submit: validate, move focus to the first offending field, say why.
<button type="submit" onClick={handleSubmit}>Create account</button>

// If unavailability must be shown, keep it focusable and explain it in visible text —
// not in a tooltip, which touch users cannot reach.
<button type="button" aria-disabled={!canPublish} aria-describedby="publish-why"
  onClick={(e) => { if (!canPublish) { e.preventDefault(); focusBlocker(); return; } publish(); }}
>Publish</button>
<p id="publish-why" className="text-sm">Add a title and one section before publishing.</p>
```

Two cases where `disabled` is genuinely right: a control unavailable for a *structural* reason the user
cannot influence from this screen (a permission they lack, a field belonging to another plan), and a control
that is momentarily busy — where "loading" is the honest state name, and even then `aria-disabled` plus a
guard keeps it focusable.

How it fails: the disabled submit on a long form. The user cannot tell which of eleven fields is unsatisfied,
gets no error to read, and cannot Tab to the button to find out the form ends there. Second failure:
`aria-disabled` with no handler guard — announced unavailable, still fires.

### 6. Inputs need more states than buttons, and they must survive autofill

The essential set (the full per-component table, including select, checkbox, switch and combobox, is in
`references/component-state-tables.md`):

| State | Visual | Wiring |
|---|---|---|
| Rest | Border ≥3:1 vs background (1.4.11) — a 1px `#e5e7eb` border on white is 1.2:1 and fails | Visible `<label for>`, always |
| Focus | Ring per move 4 **plus** a border colour change; in a dense form the ring alone is ambiguous | — |
| Filled | Identical to rest. A distinct "filled" style reads as a state change the user did not cause | — |
| Invalid | Border + icon + message text — never border colour alone (1.4.1) | `aria-invalid="true"`, message via `aria-describedby` |
| Warning | Visually distinct from invalid and **non-blocking** — do not reuse the error treatment for "are you sure?" | `aria-describedby`, no `aria-invalid` |
| Disabled | Reduced contrast, `not-allowed`, value not submitted | `disabled` — structural cases only (move 5) |
| Read-only | **Full contrast**, flattened or absent border, still focusable, selectable, copyable | `readonly` — value *is* submitted |
| Loading | Stays interactive if it can; spinner in the trailing slot | `aria-busy` on the region being populated |

**Read-only is not disabled.** Read-only means "this value is real and yours, you just cannot change it here"
— an account number, a computed total. Shipping it as `disabled` makes it uncopyable, illegible, and drops it
from form submission: a data bug wearing a style bug's clothes.

**Validate on the user's schedule, not the DOM's.** `:invalid` matches an empty required field before the
user types, so a form styled with it is red on arrival. `:user-invalid` / `:user-valid` match only after
interaction or a submit attempt — `:user-invalid` reached Baseline *newly* available in November 2023 and
*widely* available in May 2026, so it needs no fallback now but did while the 30-month window ran:

```css
/* --color-danger-solid, not --color-danger-border: the wash companion is 2.6:1 on white
   and fails 1.4.11 as a control boundary. */
.field input:user-invalid { border-color: var(--color-danger-solid); }
.field input:user-invalid + .field-error { display: block; }
```

**Autofill survival.** Chrome and Safari apply a UA background to autofilled fields with `!important`, so
`background-color` and `color` cannot be overridden directly. Use an inset `box-shadow` for the fill and
`-webkit-text-fill-color` for the text — and write the two selectors as **separate rules**, because an
unrecognised selector inside a selector list invalidates the entire rule:

```css
input:-webkit-autofill { -webkit-text-fill-color: var(--color-text-primary); box-shadow: inset 0 0 0 100px var(--color-surface); }
input:autofill         { -webkit-text-fill-color: var(--color-text-primary); box-shadow: inset 0 0 0 100px var(--color-surface); }
/* Repeat both for :hover, :focus and :active, or the UA style returns on interaction. */
```

Then actually test it: fill the form with real data, reload, autofill. Check legibility in both themes, that
a floating label still floats (JS-driven float logic routinely misses autofill because no `input` event fires
the way it expects), and that your empty/filled logic agrees with what is on screen.

**Text spacing and reflow.** SC 1.4.12 (AA) requires no loss of content or function when the user overrides
to line-height 1.5×, paragraph spacing 2×, letter-spacing 0.12em, word-spacing 0.16em. Fixed `height` on
inputs, labels and helper text is what breaks — use `min-height` plus padding. SC 1.4.10 Reflow requires the
same at 320 CSS px wide with no two-dimensional scrolling.

Error *wording*, field order and how many fields to ask for belong to `friction-and-flow`
(`friction-and-flow/references/forms.md`). This move owns the state surface, not the form design.

### 7. Every action gets a response, budgeted by latency

| Latency | What the control must do | Why |
|---|---|---|
| < ~100ms | Nothing beyond its normal pressed state | Perceived as instantaneous (Miller, 1968; Nielsen, 1993). A spinner here is a flash that reads as *slower* |
| ~100ms – 1s | A state change on the control itself: held-pressed, a busy style, an inline "Saving…" | Flow of thought survives, but silence reads as "my click didn't register" and the user clicks again |
| ~1s – 10s | An indicator sized to the affected region — determinate if measurable, indeterminate if not — plus a result announcement | Attention is holding but needs a reason to |
| > ~10s | Determinate progress with named stages, permission to leave, notification on completion | Past the limit of held attention |

`friction-and-flow/references/perceived-performance.md` owns *what the indicator should be* (skeleton vs
spinner vs optimistic update, the 200–500ms delay before showing, the ~300ms minimum display). Two things
live on the component instead.

**Announce the result, not just the request.** A visual change is invisible to a screen reader unless it is
in a live region, and the region must be in the DOM *before* the content arrives — inserting an
already-populated live region often announces nothing. `role="status"` carries an implicit
`aria-live="polite"`; use polite for anything the user is not blocked on, and reserve `assertive` /
`role="alert"` for errors that stop them, since assertive interrupts whatever the screen reader was
mid-sentence on. Set `aria-busy="true"` on the *region* whose contents you are replacing so assistive tech
does not read a half-rendered list, and clear it when done.

```jsx
<p role="status" aria-live="polite" className="sr-only">{statusMessage}</p>
```

**Do not put `aria-busy` on the button.** The pattern that behaves correctly keeps the button focusable:

```jsx
<button aria-disabled={saving} style={{ minWidth: "10ch" }}
        onClick={(e) => { if (saving) return e.preventDefault(); save(); }}>
  {saving ? <><Spinner aria-hidden /> Saving…</> : "Save"}
</button>
```

How it fails: the double-submit. A button with no busy state for a 700ms request gets clicked twice and
creates two records. Guard on the server too — the state is a courtesy, not a lock.

### 8. Micro-interactions that confirm an outcome are not optional; decorative ones are

Split them, because the two get treated as one category and then both get cut, or both get kept.
**Confirming** micro-interactions answer "did that work?" for an action whose result is otherwise invisible;
they are functional, and removing one removes information. **Decorative** ones add polish to an outcome that
was already obvious — first to drop under `prefers-reduced-motion` and under a performance budget.

The copy button is the exact case, because hover and pressed states are genuinely insufficient. Hover says
"you can press this". Pressed says "you pressed this". Neither says *anything was copied* — the clipboard is
invisible, so the user's only verification is to paste somewhere and look.

```jsx
const [copied, setCopied] = React.useState(false);
const copy = async () => {
  await navigator.clipboard.writeText(text);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

<button aria-label="Copy to clipboard" onClick={copy}>
  {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
  <span className="chip" data-visible={copied}>Copied</span>
</button>
{/* The confirmation must reach non-visual users too. */}
<span role="status" aria-live="polite" className="sr-only">{copied ? "Copied to clipboard" : ""}</span>
```

```css
.chip { opacity: 0; transform: translateX(-4px); transition: opacity 120ms, transform 120ms; }
.chip[data-visible="true"] { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .chip { transition: opacity 1ms; transform: none; }   /* keep the confirmation, drop the movement */
}
```

That is the whole discipline: under reduced motion the chip still appears, it just does not slide. **Never
delete a confirmation in a reduced-motion branch** — that removes information from the users most likely to
need it stated plainly. For durations and easing curves themselves, use `design-motion-principles`; this
skill decides only that the confirmation must exist and what it must say.

Three more actions whose outcome is invisible and therefore need explicit confirmation: autosave (show
"Saved" with a timestamp, not a fading tick alone), adding to a cart or list that is off-screen, and anything
that succeeded by *removing* something from view — a deleted row that simply vanishes needs an undo
affordance, which doubles as the confirmation.

### 9. View-level states, and why "empty" is at least two states

Components have states; so do the views holding them. Most bugs filed as "the page looks broken" are an
unhandled member of this set. Model it as a discriminated union so the compiler forces each one:

```ts
type ViewState<T> =
  | { status: "loading" }
  | { status: "error"; message: string; retry: () => void }
  | { status: "empty" }                                  // succeeded, nothing exists yet
  | { status: "no-results"; activeFilters: string[] }    // succeeded, filters excluded everything
  | { status: "partial"; rows: T[]; degraded: string }   // a source failed; name which
  | { status: "forbidden" }                              // exists, not yours to see
  | { status: "ready"; rows: T[] };
```

**Empty and no-results are different screens with different jobs.** Empty means nothing has ever been
created: teach, and offer the first action (`onboarding-activation` owns what that should say). No-results
means a filter excluded everything: show what was applied and offer to clear it. Rendering "Nothing here yet
— create your first project!" to someone who mistyped a search is the common version of this bug.

**Partial is the state nobody builds.** One of three widgets failed. The honest treatment renders the two
that worked and names the one that did not, with a retry scoped to it. Both dishonest treatments are common:
fail the whole page, or silently render a chart missing a series so the user reads wrong numbers confidently.
And errors get a cause and a next action — "Something went wrong" with no retry is a dead end.

### 10. Selection, disclosure, drag — and the weakest signifier of all

State must be programmatically determinable (SC 4.1.2), so the visual and the attribute have to agree. The
short version; full patterns and the announcement mechanics are in `references/announcing-state.md`:

| Pattern | Attribute | Note |
|---|---|---|
| Toggle button (Bold, Mute) | `aria-pressed` | The label stays constant — "Mute", not "Unmute". The state changes, not the name |
| Switch | `role="switch"` + `aria-checked`, or a native checkbox | Needs an on/off cue beyond colour; knob position counts |
| Checkbox / radio | native input, or `aria-checked` (`"mixed"` for indeterminate) | Indeterminate is a real third state — style it |
| Selected item in a listbox / tab set / grid | `aria-selected` | Only valid inside the roles that define it |
| Current page in nav | `aria-current="page"` | Not `aria-selected`, and not just a colour |
| Disclosure / accordion / menu trigger | `aria-expanded` on the **trigger**, `aria-controls` on the panel | The chevron must rotate or swap; a static chevron is a broken signifier |

**SC 1.4.1 Use of Color binds hardest here.** A selected row differing only by a background tint fails for
colour-blind users and in greyscale. Add a second cue — a check glyph, a 3px inset left border, a weight
change, or the word. Verify by desaturating a screenshot with three rows selected.

**Drag** needs, at minimum: a grab cursor and a visible handle (signifier at rest), a lifted source (reduced
opacity or elevation), a **drop indicator showing where it will land** — an insertion line, not just a
highlighted neighbour — an invalid-target state, and a keyboard path, because pointer-only reordering is a
hidden affordance that excludes anyone who cannot drag. `aria-grabbed` is deprecated; announce moves through
a live region instead.

**Tooltips are the weakest signifier available.** They do not exist on touch; they require hover or focus, so
they are invisible until you are already interacting; the native `title` is unstyleable, appears after an
uncontrollable delay and is unreliably announced. WCAG 2.1 SC 1.4.13 Content on Hover or Focus (AA)
constrains custom ones: **dismissible** without moving the pointer (Escape closes), **hoverable** (the
pointer can move onto it), **persistent** until dismissed. So: an icon-only button gets a real accessible
name (`aria-label` or visually hidden text) and the tooltip is a *redundant* reminder for sighted pointer
users, never the name itself; anything the user must know to complete the task goes in visible text, not a
tooltip and not a `?` icon; and interactive content inside makes it a popover, which needs focus management.

How it fails: the icon-only toolbar. Twelve glyphs whose meaning exists only on hover — unusable on tablets,
unlearnable anywhere, because finding one action means hovering each in turn.

## Anti-patterns

- **`*:focus { outline: none }`** with no replacement. A 2.4.7 failure, shipped by resets and by "remove the
  ugly blue ring" snippets.
- **Hover-only row actions.** Invisible on touch, unreachable by keyboard without `:focus-within`.
- **The disabled submit button on a long form.** No explanation, not focusable, so the user cannot find out
  what is missing. Enable it and validate on submit.
- **`aria-disabled` with no handler guard.** Announced unavailable, still fires.
- **`disabled` used for read-only values.** Uncopyable, illegible, dropped from submission.
- **Selection styled with a background tint only.** Fails 1.4.1 and vanishes in greyscale.
- **A pressed state identical to hover.** The pointer is already hovering, so the press produces no
  perceptible change and the click feels unregistered.
- **Buttons that resize on entering their loading state.** The layout jumps under the cursor.
- **`:invalid` styling on load.** A form that greets the user in red before they have typed.
- **Autofill left unstyled.** Chrome's pale fill under your dark-mode text.
- **Tooltip as the only label**, especially on an icon-only toolbar.
- **One empty state for "nothing exists" and "your filter matched nothing".**
- **Chevrons that never rotate**, ticks that never appear, and other signifiers wired to nothing.
- **Focus rings clipped by `overflow: hidden`.** Present in the CSS, invisible on screen.
- **`border-radius: inherit` inside a `:focus-visible` rule.** `border-radius` is not inherited, so this
  hands the control its parent's radius and changes its shape the moment it is focused.
- **Deleting a confirmation under `prefers-reduced-motion`** instead of just removing its movement.

## Ship checklist

Run against the component or the PR diff.

- [ ] Every interactive element is identifiable as interactive with hover, colour and motion all removed.
- [ ] No instruction text exists that a signifier should have carried.
- [ ] Buttons implement all six: rest, hover, active, focus-visible, disabled, loading.
- [ ] Inputs implement rest, hover, focus, invalid, warning, disabled, read-only — and survive autofill in
      both themes.
- [ ] `:focus-visible` is styled on every focusable element; nothing removes an outline without replacing it.
- [ ] Focus ring ≥3:1 against both the component and its surroundings, ≥2px, unclipped by any ancestor's
      `overflow`, and not hidden by sticky headers or footers (SC 2.4.11).
- [ ] Every hover style is gated behind `@media (hover: hover)`, and nothing is *only* discoverable on hover.
- [ ] Targets ≥24×24 CSS px (2.5.8); 44×44 wherever touch is primary.
- [ ] Disabled controls are legible, and every one either explains itself in adjacent visible text or has
      been replaced by an enabled control that validates on submit.
- [ ] `aria-pressed` / `aria-checked` / `aria-selected` / `aria-current` / `aria-expanded` matches the visual
      state in every case (SC 4.1.2).
- [ ] No state is carried by colour alone (1.4.1) — verified by desaturating a screenshot.
- [ ] Async actions: the control enters a busy state above ~100ms, width is frozen, the result is announced
      in a `role="status"` region, and double-submit is impossible.
- [ ] Actions with invisible outcomes (copy, autosave, add-to-off-screen-list, delete) have an explicit
      confirmation that exists for screen readers too.
- [ ] `prefers-reduced-motion` removes movement from confirmations, not the confirmations themselves.
- [ ] The view handles loading, error, empty, no-results, partial and forbidden — empty and no-results as
      distinct screens.
- [ ] No tooltip is the sole carrier of a label or a required instruction; custom tooltips are dismissible,
      hoverable and persistent (1.4.13).
- [ ] Layout survives the 1.4.12 text-spacing overrides and reflows at 320px (1.4.10).

## Further reading in this skill

- `references/component-state-tables.md` — read when implementing or auditing a component library: full
  per-component matrices (button variants, text input, select, checkbox/radio/switch, link, tab, menu item,
  table row, card, drag handle, toast, dialog) with the visual delta and required attribute for every cell.
- `references/announcing-state.md` — read when wiring async results, dynamic content or custom widgets to
  assistive technology: live regions, `aria-busy`, focus management on route and dialog changes, and which
  announcement patterns actually work versus the ones that silently do nothing.

## Sources

- **Affordances** — James J. Gibson, *The Ecological Approach to Visual Perception*, 1979 (origin); Donald
  Norman, *The Design of Everyday Things*, 1988 / revised 2013 (the revision adds the signifier chapter).
- **Norman's own correction** — "Affordance, Conventions and Design", *interactions* 6(3), 1999 (introduces
  "perceived affordance"); "Signifiers, not affordances", *interactions* 15(6), 2008, pp. 18–19 — the
  argument that what designers place in an interface are signifiers, and that "affordance" was misused for
  them.
- **Perceptible / hidden / false affordances** — William Gaver, "Technology Affordances", *CHI '91*.
- **Common region** (why a container groups) — Stephen E. Palmer, *Cognitive Psychology* 24(3), 1992.
  `attention-and-hierarchy` owns the perceptual theory.
- **WCAG 2.2** (W3C Recommendation), the law-like layer. 1.4.1 Use of Color (A); 1.4.3 Contrast (Minimum) —
  4.5:1 body, 3:1 large text, *inactive components excluded* (AA); 1.4.10 Reflow at 320 CSS px (AA); 1.4.11
  Non-text Contrast — 3:1 for UI components, states and graphical objects, *inactive components excluded*
  (AA); 1.4.12 Text Spacing — line-height 1.5×, paragraph 2×, letter 0.12em, word 0.16em (AA); 1.4.13
  Content on Hover or Focus — dismissible, hoverable, persistent (AA); 2.4.7 Focus Visible (AA); 2.4.11 Focus
  Not Obscured, Minimum (AA, new in 2.2); 2.4.13 Focus Appearance — 2 CSS px perimeter equivalent at 3:1
  (AAA, new in 2.2); 2.5.5 Target Size Enhanced 44×44 (AAA); 2.5.8 Target Size Minimum 24×24 (AA, new in
  2.2); 4.1.2 Name, Role, Value (A).
- **ARIA state semantics** — W3C *WAI-ARIA Authoring Practices Guide* for `aria-pressed`, `aria-checked`,
  `aria-selected`, `aria-current`, `aria-expanded`, `aria-disabled`, `aria-busy` and live regions.
  `aria-grabbed` is deprecated as of ARIA 1.1.
- **Conventions, not law** — Material's disabled
  treatment at 38% content over a 12% container; GOV.UK Design System's Button guidance that disabled
  buttons have poor contrast and confuse users, so avoid them unless research shows they help. The Apple HIG
  and Material target-size conventions sit in `spacing-and-layout` with the WCAG figures; Fitts's law is
  owned by `friction-and-flow`.
- **Latency thresholds** — Robert B. Miller, "Response time in man-computer conversational transactions",
  *AFIPS '68* (~0.1s / ~1s / ~10s); Jakob Nielsen, *Usability Engineering*, 1993, ch. 5.
  `friction-and-flow` carries the fuller treatment including Doherty & Thadani (IBM, 1982).
- **CSS mechanics** — CSS Selectors Level 4 and the HTML Standard for `:focus-visible`, `:user-invalid` /
  `:user-valid` and `:autofill`; CSS Color Levels 4/5 for `color-mix()` and `oklab` interpolation. `:autofill`
  still needs a duplicated `:-webkit-autofill` rule for full coverage, and UA autofill backgrounds carry
  `!important`, so they are overridden with inset `box-shadow` and `-webkit-text-fill-color`, never
  `background-color`.

**Claims deliberately not made here:** specific Material Design 3 state-layer opacities for hover, focus and
press — the 8/10/12% figures circulate widely but could not be confirmed against the current published spec,
so move 3's values are given as a tunable convention with the *ordering* as the load-bearing part. No "N% of
users abandon after X seconds" figure appears; the latency table is Miller's thresholds only.
