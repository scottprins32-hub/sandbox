---
name: ui-signifiers-and-states
description: Specifies how a control announces what it is and what it is doing — affordances and signifiers, and the complete state matrix (rest, hover, active, focus-visible, disabled, loading, selected, expanded, error, empty) with real px values, contrast floors, token names and CSS. Use this whenever the user is building or reviewing any interactive component — button, input, select, checkbox, toggle, tab, menu, card, table row, drag handle, list view — even if they never say "states" or "accessibility". Also use it for symptoms like "the button doesn't feel clickable", "nothing happens when I click", "how do I style focus", "should this button be disabled", "we need a tooltip explaining this", "the copy button gives no feedback", "our inputs look broken when Chrome autofills them", or any request that starts with writing instructions or helper text for a control. If someone is writing CSS for `:hover`, this skill decides what the other seven states are.
---

# UI signifiers and states

A control has to answer two questions without being asked: *what will this do* and *what is it doing right
now*. The first is signification; the second is state. What goes wrong without this pass is not ugliness — it
is a component that looks finished in the happy path and is missing two thirds of its real surface area. The
button with a nice hover and no focus ring. The input that has an error style but no read-only style, and
turns yellow when Chrome autofills it. The copy button that highlights on press and never tells you it
copied. The list that renders beautifully with twelve rows and renders a blank rectangle with zero. This
skill is the checklist that turns "it works" into "it is complete", with the actual numbers.

The diagnostic: **instructions are a symptom of a missing signifier.** Every "click the pencil icon to edit"
in your UI is a bug report about the pencil icon.

## When this is the right skill

- Building or reviewing any interactive component, or auditing an existing component library for gaps.
- Someone says a control "doesn't look clickable", "feels dead", or "nobody knows they can do that there".
- Writing CSS for interaction states, focus rings, disabled styles, or selection styling.
- Deciding whether a button should be disabled, and what to do instead.
- Wiring async feedback: loading buttons, save confirmations, toasts, live regions.
- A view needs its loading / empty / error / partial variants defined and nobody has defined them.

Go elsewhere when: the question is **where the eye goes and what is loudest** → `attention-and-hierarchy`,
which owns Gestalt grouping, preattentive salience, scan patterns and the contrast ladder; this skill assumes
that theory and gives the per-state values. The question is **why people abandon a task**, or whether a wait
should be a skeleton or a spinner → `friction-and-flow` (its `references/perceived-performance.md` owns
loading strategy; this skill owns which state the *control* enters). The question is **duration, easing or
choreography** → `design-motion-principles`. The question is **whether it looks good** →
`taste-frontend-design`.

## Decide first

These five choices set every number below. Answer them once per project, not per component.

1. **Pointer, touch, or both?** Hover does not exist on touch. If any meaningful share of traffic is touch,
   hover may only ever *enhance* a signifier that is already visible — never carry one. Assume both unless
   you control the hardware.
2. **What density and archetype?** Use the archetype table in `ux-psychology`. A marketing page can afford
   4px focus rings, 48px targets and generous state transitions. An ops console with 40 rows on screen needs
   the same information in 2px and 28px, and needs states that survive being seen a thousand times — position
   and shape, not novelty.
3. **Light, dark, or both?** State deltas are not symmetric. On a light surface, hover usually *darkens*; on
   a dark surface, hover usually *lightens*. A single `hover: darken(4%)` rule produces an invisible hover in
   dark mode. Compute state layers from the theme's foreground colour, not from a fixed direction.
4. **Is there an existing design system?** If it names states, adopt its names and its state-layer mechanism
   even if you dislike the values. Two vocabularies for the same six states is worse than one imperfect one.
5. **Who owns "loading" — the component or the page?** Decide whether a button knows it is submitting, or
   whether a parent passes it in. Whichever you pick, do it consistently; the most common source of stuck
   spinners is two layers each assuming the other resets the flag.

## The moves

### 1. Get affordance and signifier right, because the distinction is the whole job

**Affordance** is James J. Gibson's term (*The Ecological Approach to Visual Perception*, 1979): a
relationship between an object and an actor, describing what actions are *possible*. A door affords pushing
whether or not anyone can tell. Norman imported it into design in *The Design of Everyday Things* (1988), and
then spent twenty years correcting the result — first with "perceived affordance" ("Affordance, Conventions
and Design", *interactions* 6(3), 1999), then decisively in "Signifiers, not affordances" (*interactions*
15(6), 2008): what designers actually place on a screen are **signifiers** — perceptible cues that advertise
where an action is possible. The affordance of a `<button>` is that it can be clicked. The signifier is
everything that tells a human so.

The practical taxonomy is Bill Gaver's ("Technology Affordances", *CHI '91*):

| | Action is possible | Action is not possible |
|---|---|---|
| **Cue present** | Perceptible affordance — the goal | **False affordance** — looks clickable, isn't. Cards with hover shadows that do nothing; underlined non-links |
| **Cue absent** | **Hidden affordance** — the swipe nobody found; the right-click menu; the editable-on-double-click cell | Correct rejection |

Almost every "users didn't realise they could…" bug is a hidden affordance, and almost every "people keep
clicking that" bug is a false affordance. Both are fixed with signifiers, not with documentation.

**The rule that operationalises it:** every interactive element must be identifiable as interactive under
three simultaneous deprivations — **no hover, no colour, no motion**. That is not a hypothetical user; it is
a touch user with a colour-vision deficiency who has `prefers-reduced-motion` set, and it is also just
"someone glancing at a screenshot". Run it as a test: screenshot the screen, desaturate it, and ask a
colleague to circle everything they think they can click.

**Signifier vocabulary**, ranked by how well each survives that test:

| Signifier | Carries | Survives greyscale | Survives touch |
|---|---|---|---|
| Text label naming the action ("Save draft") | What it does | Yes | Yes |
| Enclosure — a filled or outlined container | "This is one hit target" | Yes | Yes |
| Position in a known slot (dialog footer, row end) | Convention | Yes | Yes |
| Icon with an established meaning (✎, ⌄, ⋮, ⇅) | Action type | Yes | Yes |
| Underline on inline text | "Link" | Yes | Yes |
| Elevation / shadow | "Raised, pressable" | Weakly | Yes |
| Cursor change | "Interactive" | Yes | **No** |
| Colour alone | Nothing reliable | **No** | Yes |
| Hover reveal | Nothing reliable | n/a | **No** |
| Tooltip | Least of all — see move 9 | n/a | **No** |

**Containers say three different things, and the difference is context, not the border.** The source folklore
— a container around a group means relatedness, around one item means selection, greyed means inactive — is
right but under-specified, and the missing half is what makes it usable:

- A container reads as **grouping** when containers are the *uniform* treatment: every card has one, so the
  border says "region", not "chosen". (This is Palmer's common region; `attention-and-hierarchy` covers the
  perceptual mechanism.)
- A container reads as **selection** only when it is an *exception in an otherwise uniform field* — one item
  in a list of twelve carries a fill and a border the others lack. Selection is a difference, not a
  decoration. If every row has a border, adding a border to the selected row communicates nothing.
- A container reads as **inactive** when its contrast collapses relative to its neighbours. Greying is a
  relative signal too: grey-on-grey among more grey is just a quiet UI.

So: never ask "what does this border mean" in isolation. Ask what the *other eleven* items look like.

How it fails: teams add signifiers by adding chrome — borders and shadows on everything — which destroys the
uniform field that made exception legible, and then reach for colour to compensate, which fails the greyscale
test. Add signifiers by *subtracting* from the non-interactive elements first.

### 2. Hover is a bonus channel; build for its absence

`:hover` is unavailable on touch, unreliable on hybrid devices, and on iOS a tap can leave a control stuck in
its hover state until the user taps elsewhere. Treat every hover style as decoration over a design that
already worked.

```css
/* Gate hover so it never fires on touch, and never sticks after a tap. */
@media (hover: hover) and (pointer: fine) {
  .btn:hover { background: var(--btn-bg-hover); }
  .row:hover .row-actions { opacity: 1; }
}
/* The row actions must be reachable without hover. */
.row-actions { opacity: 1; }
@media (hover: hover) and (pointer: fine) {
  .row-actions { opacity: 0; transition: opacity 120ms; }
  .row-actions:focus-within { opacity: 1; }
}
```

Note the ordering: the *default* is visible, and the hover-reveal is applied only where hover exists. Written
the other way round — hidden by default, shown on hover — the touch user gets nothing. `:focus-within` is
mandatory on any hover-revealed control or it is unreachable by keyboard as well.

**Cursors** (convention, and the web's convention is settled regardless of the purist argument that `pointer`
means "link"): `cursor: pointer` on buttons and anything clickable; `text` on text inputs and selectable
text; `grab` / `grabbing` on drag handles; `not-allowed` on `aria-disabled` controls; `default` — never
`pointer` — on non-interactive elements. `cursor: pointer` on a whole card that is not clickable is a false
affordance costing you a click that does nothing.

**Hit area** (law, cited in full by `friction-and-flow`, which owns Fitts's law): WCAG 2.2 SC 2.5.8 Target
Size (Minimum, AA) requires 24×24 CSS px; SC 2.5.5 (Enhanced, AAA) asks 44×44. Apple HIG specifies 44×44pt,
Material Design 48×48dp. The craft move is to enlarge the *target* without enlarging the *look*:

```css
.icon-btn { position: relative; width: 24px; height: 24px; }
.icon-btn::after {              /* invisible 44×44 hit area, no layout impact */
  content: ""; position: absolute; inset: -10px;
}
```

How it fails: hover-only affordances in table rows — the edit and delete icons that appear on hover — are the
single most common way a desktop-designed app becomes unusable on a tablet. Second failure: enlarging hit
areas with padding until adjacent targets overlap; the pseudo-element trick needs a spacing check too.

### 3. Build the state matrix as a token layer, not per component

The states are not a list; they are orthogonal axes that multiply. A component has a position on each.

| Axis | Values |
|---|---|
| Interaction | rest → hover → active/pressed → (independently) focus-visible |
| Availability | enabled, disabled, read-only, loading/busy |
| Selection | unselected, selected, indeterminate |
| Disclosure | collapsed, expanded |
| Validity | untouched, valid, invalid, warning |

Enumerating the cross-product per component is how component libraries end up with 200 hand-tuned styles that
drift. Define the *deltas* once as tokens and let every component consume them.

**The state-layer technique.** A state is a translucent layer of the component's own foreground colour
composited over its background. One mechanism, correct in both themes automatically, because it derives the
direction of the shift from the theme rather than hard-coding "darken".

```css
:root {
  /* Deltas — convention, not law. Tune the values, keep the ordering. */
  --state-hover: 8%;
  --state-press: 12%;
  --state-selected: 10%;
  --state-drag: 16%;

  --surface: #ffffff;
  --on-surface: #111827;
  --action: #1d4ed8;          /* 8.0:1 on white */
  --on-action: #ffffff;
  --focus-ring: #1d4ed8;
  --focus-ring-offset: var(--surface);
}
:root:not([data-theme="light"]) {
  @media (prefers-color-scheme: dark) {
    --surface: #0b1220;
    --on-surface: #e5e7eb;
    --action: #93b4ff;        /* light-on-dark needs a lighter action colour */
    --on-action: #0b1220;
    --focus-ring: #bfd3ff;
  }
}

.btn-primary { background: var(--action); color: var(--on-action); }

@media (hover: hover) and (pointer: fine) {
  .btn-primary:hover {
    background: color-mix(in oklab, var(--action), var(--on-action) var(--state-hover));
  }
}
.btn-primary:active {
  background: color-mix(in oklab, var(--action), var(--on-action) var(--state-press));
}
```

`color-mix()` in `oklab` gives perceptually even steps, so 8% looks like the same size of change on every hue
— which a naive `hsl()` lightness shift does not. (CSS Color Module Level 4/5; `color-mix()` has been
interoperable across evergreen browsers since 2023.)

**Tailwind v4, CSS-first**, same tokens:

```css
@import "tailwindcss";
@theme {
  --color-action: oklch(0.48 0.19 264);
  --color-on-action: oklch(0.99 0 0);
  --color-focus-ring: oklch(0.48 0.19 264);
}
/* utilities compose the states; the delta lives in one place */
@utility btn-primary {
  background: var(--color-action);
  color: var(--color-on-action);
  &:hover  { @media (hover: hover) { background: color-mix(in oklab, var(--color-action), var(--color-on-action) 8%); } }
  &:active { background: color-mix(in oklab, var(--color-action), var(--color-on-action) 12%); }
}
```

**Precedence.** States collide, and CSS resolves collisions by source order at equal specificity. Write them
in this order, last wins:

```
rest → hover → selected → active/pressed → read-only → loading → disabled → focus-visible
```

Two rules make this survivable. First, **express focus with `outline`, never with `background`** — an outline
composes with any background state, so the ring stays visible on a hovered, selected, pressed control.
Second, **disabled must override every colour state**, which is why it sits second-to-last.

**The button matrix, with the contrast each cell must hit.** This is the minimum shippable set; anything less
is an incomplete component.

| State | Visual delta | Contrast requirement |
|---|---|---|
| Rest | Base tokens | Label ≥4.5:1 on its own fill (1.4.3). Fill or border ≥3:1 vs page background (1.4.11) |
| Hover | State layer 8%; pointer devices only | Same as rest — hover is not licence to drop contrast |
| Active / pressed | State layer 12%, plus optionally `translate-y: 1px` or `scale: .98`. Must be visibly *different from hover*, since the pointer is already hovering when it presses | Same as rest |
| Focus-visible | 2px ring, 2px offset, drawn outside the component | Ring ≥3:1 vs both the component and the adjacent background (1.4.11) |
| Disabled | Reduced-contrast pair (see move 5) | Exempt from 1.4.3/1.4.11 as an inactive component — aim ≥3:1 anyway |
| Loading / busy | Spinner or progress replaces or joins the label, **width frozen** | Indicator ≥3:1 (1.4.11) |
| Selected (toggle buttons) | Fill + a non-colour cue (check glyph, inset border) | 1.4.1: never colour alone |

Freeze the width: a button whose label changes from "Save" to "Saving…" and back reflows the row and moves
whatever sits beside it under the user's cursor. `min-width` from the longest label, or render the spinner in
a fixed-size slot.

How it fails: per-component hard-coded hex values. The tell is a codebase where `#1e40af` appears in nine
files and the ninth one is one shade off. Second tell: a hover style that is invisible in dark mode, which is
what a fixed-direction darken always produces.

### 4. Focus: the one state with a legal floor and the one most often deleted

**Law.** WCAG 2.2 SC 2.4.7 Focus Visible (AA): any keyboard-operable interface has a mode of operation where
the focus indicator is visible. `outline: none` with no replacement is a direct failure of 2.4.7 — it is
probably the most common WCAG failure in modern CSS, because it arrives via a reset or a "remove ugly blue
outline" snippet. SC 2.4.11 Focus Not Obscured (Minimum, AA) is new in WCAG 2.2: when a component receives
focus, it must not be *entirely* hidden by author-created content — which in practice means sticky headers,
sticky footers, cookie bars and toasts, all of which hide the focused element when you tab into content
behind them. SC 2.4.13 Focus Appearance (AAA) quantifies "visible": an area at least as large as a 2 CSS px
thick perimeter of the component, at ≥3:1 against the unfocused state.

**`:focus` vs `:focus-visible`.** `:focus` matches whenever the element has focus, including a mouse click on
a button — which is why authors delete it. `:focus-visible` matches only when the user agent's heuristic says
the indicator should be shown: keyboard navigation, and always for text inputs. Style `:focus-visible`. That
gives keyboard users their ring and mouse users a clean press, with no accessibility cost.

```css
/* One rule, every focusable element. */
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: inherit;      /* outline follows border-radius in current browsers */
}
/* Optional belt-and-braces for older UAs that support :focus but not :focus-visible.
   Do NOT ship the first line without the :focus-visible rule above. */
:where(a, button, input, select, textarea):focus:not(:focus-visible) { outline: none; }
```

**The two-tone ring** is the fix for indicators that must work on unknown backgrounds — a focus colour that
passes 3:1 on white will fail on a dark card. Draw two rings of opposing luminance; one of them always
contrasts:

```css
.btn:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--focus-ring-offset);  /* separates ring from any surface */
}
```

Also: `outline-offset` needs the parent not to clip it. A focus ring inside `overflow: hidden` is a ring you
cannot see — a real and frequent bug in scroll containers, table cells and cards with rounded corners. Give
the scroll container `padding` equal to the offset, or move the ring inside with `outline-offset: -2px`.

`:focus-within` styles a composite widget when anything inside it has focus — use it for the container around
a text field with an inline button so the whole control reads as focused, and for hover-revealed actions.

How it fails: (a) `*:focus { outline: none }` in a reset, uncompensated — a 2.4.7 failure and by far the most
common; (b) a focus ring that is the same colour as the component's hover state, so hovering looks like
focus; (c) sticky headers hiding the focused element — check it by tabbing from the top of a long page with
the header pinned; (d) focus styles removed from `<a>` elements styled as buttons, which are also the ones
that do not respond to Space and do not get `:active` from the keyboard.

### 5. Disabled: exempt from contrast, still not allowed to be illegible — and usually the wrong answer

**Law, precisely.** WCAG SC 1.4.3 and 1.4.11 both exclude *inactive* user interface components from their
contrast requirements. So a disabled button that reads at 2.1:1 does not fail AA. That is the entire
concession, and people over-read it: it means you will not fail an audit, not that the control is usable. A
disabled control still has to be *read* — the user must be able to tell that a "Continue" button exists and
is currently unavailable. Target ≥3:1 for disabled content when your palette allows it; if you cannot, keep
disabled recognisable by *shape* (the button outline stays at full contrast, only the fill and label soften)
rather than by fading the whole thing into the background.

Material Design's convention — disabled content at 38% opacity over a container at 12% — is a reasonable
default. It is a convention, not a standard, and on a low-contrast palette it lands well under 3:1.

**`disabled` vs `aria-disabled`.** These are different mechanisms and the difference matters:

| | `disabled` (HTML attribute) | `aria-disabled="true"` |
|---|---|---|
| In tab order | **No** — removed, and so are descendants of a disabled `<fieldset>` | Yes, still focusable |
| Fires events | No — clicks and most pointer events are suppressed | **Yes** — you must guard the handler yourself |
| Announced as unavailable | Yes | Yes |
| Can carry a tooltip / explanation | Poorly — not focusable, and pointer events are suppressed | Yes |
| Blocks form submission of its value | Yes (value not submitted) | No |

Because a `disabled` control cannot receive focus, a keyboard or screen-reader user cannot land on it, cannot
read a tooltip attached to it, and in a long form may not discover the submit button exists at all. That is
the accessibility problem with disabled buttons, and it is not solved by adding a `title`.

**Prefer the enabled button that explains what is missing.** The GOV.UK Design System's button guidance is
blunt about this: disabled buttons have poor contrast and confuse users, so avoid them unless research shows
they help. The pattern that replaces them:

```jsx
// Enabled. On submit, validate, focus the first offending field, and say why.
<button type="submit" onClick={handleSubmit}>Create account</button>

// If you must show unavailability, keep it focusable and explain it inline —
// not in a tooltip, which touch users cannot reach.
<button
  type="button"
  aria-disabled={!canPublish}
  aria-describedby="publish-why"
  onClick={(e) => { if (!canPublish) { e.preventDefault(); focusBlocker(); return; } publish(); }}
>
  Publish
</button>
<p id="publish-why" className="text-sm">Add a title and one section before publishing.</p>
```

Two exceptions where `disabled` is genuinely right: a control that is unavailable for a *structural* reason
the user cannot influence from this screen (a permission they do not have, a field that only applies to
another plan), and a control that is momentarily busy, where "loading" is the honest state name — and even
then `aria-disabled` plus a guard keeps it focusable.

How it fails: the disabled submit button on a long form. The user cannot tell which of eleven fields is
unsatisfied, gets no error to read, and the button is unreachable by Tab so a screen-reader user does not
know the form ends there. Second failure: `aria-disabled` without a handler guard, which produces a control
announced as unavailable that still fires.

### 6. Inputs need more states than buttons, and they must survive autofill

Minimum set, all of which need a defined visual and an announced equivalent:

| State | Visual | Wiring |
|---|---|---|
| Rest (empty) | Border ≥3:1 vs background (1.4.11) — a 1px `#e5e7eb` border on white is 1.2:1 and fails | Visible `<label for>`, always |
| Hover | Border one step darker; pointer only | — |
| Focus | Ring per move 4, plus a border colour change; the ring alone can be ambiguous in a dense form | — |
| Filled | Same as rest. Do not restyle — a "filled" style that differs from rest reads as a state change the user did not cause | — |
| Invalid | Border + icon + message text; never border colour alone (1.4.1) | `aria-invalid="true"`, message via `aria-describedby` |
| Warning | Visually distinct from invalid and *non-blocking* — do not use the error treatment for "are you sure?" | `aria-describedby`, no `aria-invalid` |
| Disabled | Reduced contrast, `not-allowed` cursor, value not submitted | `disabled` (structural only — see move 5) |
| Read-only | **Full contrast**, no border or a flattened border, still focusable, still selectable/copyable | `readonly` — value *is* submitted |
| Loading | Field stays interactive if it can; spinner in the trailing slot | `aria-busy` on the region being populated |
| Autofilled | Must still be legible and still look like your input | See below |

**Read-only is not disabled.** Read-only means "this value is real and yours, you just cannot change it here"
— an account number, a computed total. It stays focusable, selectable and copyable, and it keeps full
contrast. Disabled means "this does not apply". Shipping a read-only value as `disabled` makes it
uncopyable and drops it from the form submission, which is a data bug, not a style bug.

**Validate on the user's schedule, not the DOM's.** `:invalid` matches an empty required field before the
user has typed a character, so a form styled with `:invalid` is red on arrival. `:user-invalid` (and
`:user-valid`) match only after interaction or a submit attempt — Baseline widely available since late 2023.

```css
.field input:user-invalid { border-color: var(--danger); }
.field input:user-invalid + .field-error { display: block; }
```

**Autofill survival.** Chrome and Safari apply a UA background to autofilled fields with `!important`, so
`background-color` and `color` cannot be overridden directly. Use an inset `box-shadow` for the fill and
`-webkit-text-fill-color` for the text. Write the two selectors as **separate rules** — an unknown selector
inside a selector list invalidates the whole rule in browsers that do not recognise it:

```css
input:-webkit-autofill { -webkit-text-fill-color: var(--on-surface); box-shadow: inset 0 0 0 100px var(--surface); }
input:autofill         { -webkit-text-fill-color: var(--on-surface); box-shadow: inset 0 0 0 100px var(--surface); }
/* Repeat for :hover, :focus, and :active or the UA style returns on interaction. */
```

Then actually test it: fill the form once with real data, reload, and autofill it. Check the value is legible
in both themes, that the label still floats correctly if you use a floating label, and that your
"filled/empty" logic noticed — JS-driven floating labels routinely miss autofill because no `input` event
fires the way they expect.

**Text spacing must not break the layout.** SC 1.4.12 (AA) requires no loss of content or function when the
user overrides to line-height 1.5×, paragraph spacing 2×, letter-spacing 0.12em, word-spacing 0.16em. Fixed
`height` on inputs, labels and helper text is what breaks; use `min-height` plus padding. Same for SC 1.4.10
Reflow: usable at 320 CSS px wide with no two-dimensional scrolling.

Error *message wording*, field ordering and how many fields to ask for belong to `friction-and-flow`
(`references/forms.md`). This move owns the state surface, not the form design.

### 7. Every action gets a response, budgeted by latency

| Latency | What the control must do | Why |
|---|---|---|
| < ~100ms | Nothing beyond its normal pressed state | Perceived as instantaneous (Miller, 1968; Nielsen, 1993). A spinner here is a flash that makes it feel *slower* |
| ~100ms – 1s | A state change on the control itself: pressed-and-held, a disabled-looking busy style, an inline "Saving…" | Flow of thought survives, but silence reads as "my click didn't register", and the user clicks again |
| ~1s – 10s | An indicator sized to the affected region — indeterminate if you cannot measure, determinate if you can — plus a result announcement | Attention is holding but needs a reason to |
| > ~10s | Determinate progress with named stages, permission to leave, notification on completion | Beyond the limit of held attention |

`friction-and-flow/references/perceived-performance.md` owns *what the indicator should be* (skeleton vs
spinner vs optimistic update, the 200–500ms delay before showing and the ~300ms minimum display). This move
owns the two things that live on the component:

**Announce the result, not just the request.** A visual change is invisible to a screen reader unless it is
in a live region. Put the region in the DOM *before* the content arrives — inserting an already-populated
live region often announces nothing.

```jsx
// Rendered always; empty until there is something to say.
<p role="status" aria-live="polite" className="sr-only">{statusMessage}</p>
```

`role="status"` carries an implicit `aria-live="polite"`. Use `polite` for everything the user is not blocked
on; reserve `assertive` / `role="alert"` for errors that stop them, because assertive interrupts whatever the
screen reader was saying. Set `aria-busy="true"` on a *region* while you replace its contents so assistive
tech does not announce a half-rendered list, and clear it when done.

**Do not put `aria-busy` on the button.** The pattern that behaves correctly: keep the button focusable with
`aria-disabled="true"`, guard the handler, freeze its width, swap the visual to a spinner while keeping an
accessible name, and announce the outcome in the status region.

```jsx
<button aria-disabled={saving} onClick={(e) => { if (saving) return e.preventDefault(); save(); }}
        style={{ minWidth: "10ch" }}>
  {saving ? <><Spinner aria-hidden /> Saving…</> : "Save"}
</button>
```

How it fails: the double-submit. A button that shows no busy state for a 700ms request gets clicked twice and
creates two records. Guard on the server too; the state is a courtesy, not a lock.

### 8. Micro-interactions that confirm an outcome are not optional; decorative ones are

Split them, because the two get treated as one category and then both get cut or both get kept.

**Confirming micro-interactions** answer "did that work?" for an action whose result is otherwise invisible.
They are functional, and removing them removes information. **Decorative micro-interactions** add polish to
an outcome that was already obvious. They are the first thing to drop under `prefers-reduced-motion`, and the
first thing to drop under a performance budget.

The copy button is the perfect case, because hover and pressed states are genuinely insufficient. Hover says
"you can press this". Pressed says "you pressed this". Neither says *anything was copied* — the clipboard is
invisible, so without a confirmation the user's only verification is to paste somewhere and check.

```jsx
function CopyButton({ text }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        aria-label="Copy to clipboard"
      >
        {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
        <span className="chip" data-visible={copied}>Copied</span>
      </button>
      {/* The confirmation must exist for non-visual users too. */}
      <span role="status" aria-live="polite" className="sr-only">{copied ? "Copied to clipboard" : ""}</span>
    </>
  );
}
```

```css
.chip { opacity: 0; transform: translateX(-4px); transition: opacity 120ms, transform 120ms; }
.chip[data-visible="true"] { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  /* Keep the confirmation. Drop only its movement. */
  .chip { transition: opacity 1ms; transform: none; }
}
```

That is the whole discipline: under reduced motion the chip still appears, it just does not slide. Never
delete a confirmation in a reduced-motion branch — you have removed information from the users most likely to
need it stated plainly. For the durations and easing curves themselves, use `design-motion-principles`; this
skill only decides that the confirmation must exist and what it must say.

Three more actions whose outcome is invisible and therefore need explicit confirmation: autosave (show
"Saved" with a timestamp, not a fading checkmark alone), adding to a cart or list that is off-screen, and
anything that succeeded by *removing* something from view — a deleted row that just vanishes needs an undo
affordance, which doubles as the confirmation.

### 9. View-level states, and why "empty" is at least two states

Components have states; so do the views that hold them. Most bugs filed as "the page looks broken" are an
unhandled member of this set. Model it as a discriminated union so the compiler makes you handle each one:

```ts
type ViewState<T> =
  | { status: "loading" }
  | { status: "error"; message: string; retry: () => void }
  | { status: "empty" }                                  // succeeded, nothing exists yet
  | { status: "no-results"; activeFilters: string[] }    // succeeded, filters excluded everything
  | { status: "partial"; rows: T[]; degraded: string }   // some source failed; say which
  | { status: "forbidden" }                              // exists, not yours to see
  | { status: "ready"; rows: T[] };
```

**Empty and no-results are different screens with different jobs.** Empty means the user has never created
anything: the job is to teach and offer the first action (`onboarding-activation` owns what that content
should say). No-results means their filter or query excluded everything: the job is to show what was applied
and offer to clear it. Rendering "Nothing here yet — create your first project!" to someone who typed a typo
into search is the most common version of this bug.

**Partial is the state nobody builds.** One of three widgets failed to load. The honest treatment is to render
the two that worked and say plainly which one did not, with a retry scoped to it. The dishonest treatments are
both common: fail the whole page, or silently render a chart missing a series so the user reads wrong numbers
without knowing.

**Errors get a cause and a next action.** "Something went wrong" with no retry is a dead end. Give what
failed, whether it is likely theirs or yours, and one button.

### 10. Toggles, selection and disclosure — pick the right ARIA state, and never colour alone

Getting these wrong makes a control that looks right and announces nonsense. `4.1.2 Name, Role, Value`
requires state to be programmatically determinable, so the visual and the attribute must agree.

| Pattern | Attribute | Notes |
|---|---|---|
| Toggle button (Bold, Mute) | `aria-pressed="true/false"` | The label stays constant — "Mute", not "Unmute"; the *state* changes, not the name |
| Switch (settings on/off) | `role="switch"` + `aria-checked`, or a native checkbox | Needs a visible on/off cue beyond colour — knob position counts |
| Checkbox / radio | native input, or `aria-checked` (`"mixed"` for indeterminate) | Indeterminate is a real third state; style it |
| Selected item in a listbox/grid/tab set | `aria-selected="true"` | Only valid inside the roles that define it |
| Current page in nav | `aria-current="page"` | Not `aria-selected`; not just a colour |
| Disclosure / accordion / menu trigger | `aria-expanded` on the **trigger**, `aria-controls` pointing at the panel | The chevron must rotate or swap — a static chevron with a changing panel is a broken signifier |
| Drag source / target | `aria-grabbed` is deprecated — expose a keyboard alternative and announce moves via a live region | Drag-only reordering is a hidden affordance with no keyboard path |

**SC 1.4.1 Use of Color** binds hardest here. A selected row that differs from unselected rows only by a
background tint fails for colour-blind users and in greyscale. Add a second cue: a check glyph, an inset left
border 3px, a weight change, or the word. Test it by desaturating a screenshot with three rows selected.

Drag deserves its own note: a drag interaction needs at minimum a **grab cursor and handle** (signifier at
rest), a **lifted source** (reduced opacity or elevation), a **drop indicator** showing where it will land —
an insertion line, not just a highlighted neighbour — and an **invalid-target** state. And a keyboard path,
because pointer-only reordering excludes anyone who cannot drag.

### 11. Tooltips are the weakest signifier available; never make them the only one

Everything is against them: they do not exist on touch; they require hover or focus, so they are invisible
until you are already interacting; the native `title` attribute is unstyleable, appears after an
uncontrollable delay, is unreliably announced by screen readers, and does not work on touch at all. A tooltip
is a footnote, not a label.

WCAG 2.1 SC 1.4.13 Content on Hover or Focus (AA) constrains custom ones: the content must be **dismissible**
without moving the pointer (Escape closes it), **hoverable** (the pointer can move onto the tooltip without
it vanishing), and **persistent** until dismissed or invalidated.

Rules:

- An icon-only button gets a real accessible name (`aria-label` or visually hidden text). The tooltip is a
  *redundant* visual reminder for sighted pointer users, never the name itself.
- Anything a user must know to complete the task goes in visible text — a label, helper text below the field,
  or an inline note. Not a tooltip, and not a `?` icon.
- If the tooltip contains interactive content, it is a popover, not a tooltip, and needs focus management.
- `title` is acceptable for genuinely optional trivia and nothing else.

How it fails: the icon-only toolbar. Twelve glyphs, meaning available only on hover, unusable on tablets, and
unlearnable because the user must hover each one in turn to find the one they want. Add text labels, or
reduce the toolbar to the three actions that earn a glyph.

## Anti-patterns

- **`*:focus { outline: none }`** with no replacement. A WCAG 2.4.7 failure, shipped by resets and by
  "remove the ugly blue ring" snippets.
- **Hover-only row actions.** Invisible on touch, unreachable by keyboard without `:focus-within`.
- **The disabled submit button on a long form.** No explanation, not focusable, so the user cannot find out
  what is missing. Enable it and validate on submit.
- **`aria-disabled` without a handler guard.** Announced as unavailable, still fires.
- **Using `disabled` for read-only values.** Uncopyable, illegible, and dropped from form submission.
- **Selection styled with a background tint only.** Fails 1.4.1 and vanishes in greyscale.
- **A pressed state that looks identical to hover.** The pointer is already hovering when it presses, so the
  press produces no perceptible change and the click feels unregistered.
- **Buttons that resize when they enter their loading state.** The layout jumps under the cursor.
- **`:invalid` styling on load.** A form that greets the user in red before they have typed.
- **Autofill left unstyled.** The pale-yellow Chrome fill with your dark-mode text on top of it.
- **Tooltip as the only label.** Especially on an icon-only toolbar.
- **A single empty state for "nothing exists" and "your filter matched nothing".**
- **Chevrons that never rotate**, checkmarks that never appear, and other signifiers wired to nothing.
- **Focus rings clipped by `overflow: hidden`.** Present in the CSS, invisible on screen.
- **Deleting a confirmation micro-interaction under `prefers-reduced-motion`** instead of just removing its
  movement.

## Ship checklist

Run against the component or the PR diff.

- [ ] Every interactive element is identifiable as interactive with hover, colour and motion all removed.
- [ ] No instruction text exists that a signifier should have carried.
- [ ] Buttons implement all six: rest, hover, active, focus-visible, disabled, loading.
- [ ] Inputs implement: rest, hover, focus, invalid, warning, disabled, read-only, and survive autofill in
      both themes.
- [ ] `:focus-visible` is styled on every focusable element; nothing removes an outline without replacing it.
- [ ] Focus ring ≥3:1 against both the component and its surroundings, ≥2px, not clipped by any ancestor's
      `overflow`, and not hidden by sticky headers or footers (SC 2.4.11).
- [ ] Every hover style is gated behind `@media (hover: hover)`, and nothing is *only* discoverable on hover.
- [ ] Targets ≥24×24 CSS px (2.5.8); 44×44 where touch is primary.
- [ ] Disabled controls are still legible; every disabled control either explains itself in adjacent visible
      text or has been replaced by an enabled control that validates on submit.
- [ ] State is exposed to assistive tech: `aria-pressed` / `aria-checked` / `aria-selected` / `aria-current` /
      `aria-expanded` matches the visual state in every case.
- [ ] No state is carried by colour alone (1.4.1) — checked by desaturating a screenshot.
- [ ] Async actions: control enters a busy state above ~100ms, width is frozen, result is announced in a
      `role="status"` region, and double-submit is impossible.
- [ ] Actions with invisible outcomes (copy, autosave, add-to-off-screen-list, delete) have an explicit
      confirmation that also exists for screen readers.
- [ ] `prefers-reduced-motion` removes movement from confirmations, not the confirmations themselves.
- [ ] The view handles loading, error, empty, no-results, partial and forbidden — with empty and no-results
      as distinct screens.
- [ ] No tooltip is the sole carrier of a label or a required instruction; custom tooltips are dismissible,
      hoverable and persistent (1.4.13).
- [ ] Layout survives the 1.4.12 text-spacing overrides and reflows at 320px (1.4.10).

## Further reading in this skill

- `references/component-state-tables.md` — read when implementing or auditing a component library: the full
  per-component state matrices (button variants, text input, select, checkbox/radio/switch, link, tab, menu
  item, table row, card, drag handle, toast) with the visual delta and the required attribute for every cell.
- `references/announcing-state.md` — read when wiring async results, dynamic content or custom widgets to
  assistive technology: live regions, `aria-busy`, focus management on route and dialog changes, and the
  announcement patterns that actually work versus the ones that silently do nothing.

## Sources

- **Affordances** — James J. Gibson, *The Ecological Approach to Visual Perception*, 1979 (origin of the
  term). Donald Norman, *The Psychology of Everyday Things* / *The Design of Everyday Things*, 1988, revised
  edition 2013 (introduction to design; the revised edition adds the signifier chapter).
- **Norman's own correction** — Donald Norman, "Affordance, Conventions and Design", *interactions* 6(3),
  1999 (introduces "perceived affordance"), and "Signifiers, not affordances", *interactions* 15(6), 2008,
  pp. 18–19 — the argument that what designers place in an interface are signifiers, and that "affordance"
  had been widely misused for them.
- **Perceptible / hidden / false affordances** — William Gaver, "Technology Affordances", *CHI '91*.
- **Common region** (why a container groups) — Stephen E. Palmer, *Cognitive Psychology* 24(3), 1992. The
  perceptual theory is owned by `attention-and-hierarchy`.
- **WCAG 2.2** (W3C Recommendation) — SC 1.4.1 Use of Color (A); 1.4.3 Contrast (Minimum) 4.5:1 body, 3:1
  large text, with inactive components excluded (AA); 1.4.10 Reflow, 320 CSS px (AA); 1.4.11 Non-text
  Contrast 3:1 for UI components, states and graphical objects, inactive components excluded (AA); 1.4.12
  Text Spacing — line-height 1.5×, paragraph spacing 2×, letter-spacing 0.12em, word-spacing 0.16em (AA);
  1.4.13 Content on Hover or Focus — dismissible, hoverable, persistent (AA); 2.4.7 Focus Visible (AA);
  2.4.11 Focus Not Obscured (Minimum) (AA, new in 2.2); 2.4.13 Focus Appearance — 2 CSS px perimeter
  equivalent at 3:1 (AAA, new in 2.2); 2.5.5 Target Size (Enhanced) 44×44 (AAA); 2.5.8 Target Size (Minimum)
  24×24 (AA, new in 2.2); 4.1.2 Name, Role, Value (A).
- **ARIA state semantics** — W3C *WAI-ARIA Authoring Practices Guide* for `aria-pressed`, `aria-checked`,
  `aria-selected`, `aria-current`, `aria-expanded`, `aria-disabled`, `aria-busy`, and live regions.
  `aria-grabbed` is deprecated in ARIA 1.1 and later.
- **Target sizes** — Apple *Human Interface Guidelines* (44×44pt); Material Design (48×48dp). Both are design
  system conventions; the law-like figures are the WCAG ones above. Fitts's law itself is covered by
  `friction-and-flow`.
- **Disabled buttons** — GOV.UK Design System, Button component: disabled buttons have poor contrast and can
  confuse users, so avoid them unless research shows they help.
- **Latency thresholds** — Robert B. Miller, "Response time in man-computer conversational transactions",
  *AFIPS '68* (the ~0.1s / ~1s / ~10s thresholds); Jakob Nielsen, *Usability Engineering*, 1993, ch. 5.
  `friction-and-flow` carries the fuller treatment including Doherty & Thadani (IBM, 1982).
- **CSS mechanics** — CSS Selectors Level 4 and the HTML Standard for `:focus-visible`, `:user-invalid` /
  `:user-valid`, and `:autofill`; CSS Color Module Levels 4/5 for `color-mix()` and the `oklab` interpolation
  space. `:autofill` still needs a duplicated `:-webkit-autofill` rule for full coverage, and UA autofill
  backgrounds are `!important`, so they are overridden with inset `box-shadow` and `-webkit-text-fill-color`,
  not `background-color`.

**Claims deliberately not made here:** specific Material Design 3 state-layer opacity percentages for hover,
focus and press — the 8/10/12% figures circulate widely but could not be confirmed against the current
published spec, so the values in move 3 are presented as a tunable convention with the ordering as the
load-bearing part. Material's disabled convention (38% content / 12% container) is quoted as a convention,
not a threshold. No "N% of users abandon after X seconds" figure is used; the latency table is Miller's
thresholds only.
