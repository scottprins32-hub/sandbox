# Component state tables

The per-component expansion of move 3 in `ui-signifiers-and-states/SKILL.md`. Read it when implementing or
auditing a component library — one table per component, listing every cell you owe and the attribute that
has to agree with the visual.

Conventions used below:

- **SL** = state layer, the technique from move 3: `color-mix(in oklab, <bg>, <fg> <n>%)`. SL-8 means an 8%
  layer. Values are a tunable convention; the *ordering* (hover < press < drag) is the load-bearing part.
- **Ring** = the shared focus treatment: 2px outline, 2px offset, ≥3:1 against both the component and the
  surrounding background (WCAG 1.4.11), never expressed as a background change.
- Every "selected", "invalid" and "expanded" row assumes a **non-colour cue as well** (SC 1.4.1).
- `--color-*` tokens named below are the semantic set from `color-and-theming/SKILL.md`; this skill adds only
  the `--state-*` deltas.

## Button (all variants)

| State | Filled / primary | Outline / secondary | Ghost / text | Destructive | Attribute |
|---|---|---|---|---|---|
| Rest | Fill `--color-action`, label ≥4.5:1 on it | 1px border ≥3:1, transparent fill | No border, no fill | Fill `--color-danger-solid`, label ≥4.5:1 | — |
| Hover | SL-8 | SL-4 fill appears; border one step darker | SL-6 fill appears | SL-8 | — |
| Active | SL-12 (+ optional `translate-y: 1px`) | SL-8 | SL-10 | SL-12 | — |
| Focus-visible | Ring | Ring | Ring | Ring | — |
| Disabled | Muted pair, ≥3:1 if palette allows | Border and label both muted | Label muted only | Muted — **and reconsider**: a destructive action that is unavailable usually wants an explanation | `disabled` (structural) or `aria-disabled` + guard |
| Loading | Spinner in a fixed slot, width frozen | Same | Same | Same | `aria-disabled="true"`, result in `role="status"` |
| Toggled on | Fill + check glyph or inset border | Fill appears + glyph | Fill appears + glyph | — | `aria-pressed="true"` |

Icon-only buttons additionally need: an accessible name (`aria-label` or visually hidden text), a 24×24 CSS
px minimum target, 44×44 on touch (`spacing-and-layout` owns the expansion recipe), and `aria-hidden` on the
glyph so the name is not read twice.

## Link

| State | Treatment | Note |
|---|---|---|
| Rest | Underlined inside body text; colour ≥4.5:1 | Colour alone is a 1.4.1 failure inside prose |
| Hover | Underline thickens or colour shifts | Not "underline appears" — that was the rest signifier |
| Active | Colour shift | — |
| Focus-visible | Ring; on a wrapped inline link the ring may split across lines — acceptable | — |
| Visited | Optional; keep ≥4.5:1 | Suppressing `:visited` costs real navigational information in content-heavy sites |
| Current | `aria-current="page"` + a non-colour cue (weight, left border) | Not `aria-selected` |
| External / new tab | Icon + text ("opens in a new tab", visually hidden is fine) | Unannounced target changes are a WCAG 3.2.5 concern |

`<a>` styled as a button: does not fire on Space, gets no `:active` from the keyboard, and needs `role`
left alone. If it performs an action rather than navigates, it should be a `<button>`.

## Text input / textarea

| State | Visual | Attribute |
|---|---|---|
| Rest | Border ≥3:1 against the field's background (1px `#e5e7eb` on white is 1.2:1 and fails) | `<label for>` always visible |
| Hover | Border one step darker; pointer only | — |
| Focus | Ring **plus** a border colour change | — |
| Filled | Identical to rest | — |
| Invalid | Border `--color-danger-solid` + icon + message below | `aria-invalid="true"`, `aria-describedby` → message id |
| Warning | Distinct from invalid, non-blocking | `aria-describedby` only |
| Disabled | Muted, `not-allowed`, value not submitted | `disabled` |
| Read-only | Full contrast, flattened border, focusable and copyable | `readonly` |
| Loading (async validation) | Spinner in trailing slot; field stays typable | `aria-busy` on the wrapper |
| Autofilled | Must look like your input in both themes | `:autofill` + `:-webkit-autofill` as separate rules |
| Character limit | Live count that does not steal focus | `aria-describedby`, count region `aria-live="polite"` |

Placeholder is not a label: it disappears on input, usually fails 4.5:1, and is not reliably announced.

## Select and combobox

| State | Native `<select>` | Custom combobox |
|---|---|---|
| Rest | Chevron drawn at ≥3:1 | Same, plus visible text input affordance if editable |
| Focus | Ring | Ring on the input, `aria-expanded="false"` |
| Open | UA popup | `aria-expanded="true"`, listbox rendered, `aria-controls` set |
| Option hover / active-descendant | UA | Highlight **plus** `aria-activedescendant` pointing at the option id |
| Option selected | UA | `aria-selected="true"` + a check glyph |
| Disabled option | UA | `aria-disabled="true"`, skipped by arrow keys |
| Invalid | Border + message | Same, `aria-invalid` on the input |
| Loading options | — | `aria-busy="true"` on the listbox, "Loading options" in a status region |

A custom combobox costs a full keyboard implementation (Up/Down/Home/End/Escape/type-ahead) and a live
region for result counts. Use the native control unless you need something it cannot do.

## Checkbox, radio, switch

| State | Checkbox | Radio | Switch |
|---|---|---|---|
| Unchecked | Border ≥3:1, empty box | Empty circle | Track + knob at the "off" end |
| Checked | Fill + tick glyph (the glyph, not the fill, is the cue) | Fill + inner dot | Knob at the "on" end + fill |
| Indeterminate | Dash glyph | n/a | n/a |
| Hover | SL-6 halo around the control, not a size change | Same | Same |
| Focus-visible | Ring around the control **and** ideally the label | Same | Same |
| Disabled | Muted control and label | Same | Same |
| Invalid (required group) | Message on the **group**, not each item | Same | Same |
| Attribute | native, or `aria-checked="true\|false\|mixed"` | native, or `aria-checked` | `role="switch"` + `aria-checked` |

Group semantics: wrap radio groups and required checkbox groups in a `<fieldset>` with a `<legend>`, or
`role="group"` with `aria-labelledby`. Clicking the label must toggle the control — bind it with `for`.

Switch vs checkbox is a convention worth holding: a switch applies immediately, a checkbox applies on
submit. Mixing them teaches the user that neither can be trusted.

## Tabs

| State | Treatment | Attribute |
|---|---|---|
| Inactive | Label ≥4.5:1, no indicator | `aria-selected="false"`, `tabindex="-1"` |
| Hover | SL-6 or an underline preview | — |
| Selected | Indicator (2–3px bar) + weight change; never colour alone | `aria-selected="true"`, `tabindex="0"` |
| Focus-visible | Ring on the tab, separate from the selection indicator | — |
| Disabled | Muted | `aria-disabled="true"` |

Roving tabindex: exactly one tab is `tabindex="0"`; arrow keys move selection and focus within the tablist;
Tab exits to the panel. `aria-controls` on the tab, `role="tabpanel"` + `aria-labelledby` on the panel.

## Menu item

| State | Treatment | Attribute |
|---|---|---|
| Rest | Full-width row, label left | `role="menuitem"` |
| Hover / keyboard-highlighted | SL-8 across the full row width | Highlight follows both mouse and arrow keys |
| Focus | Managed via roving tabindex or `aria-activedescendant` — the ring may be the highlight itself | — |
| Checked | Tick in a reserved leading slot (reserve the slot even when unchecked, or rows shift) | `role="menuitemcheckbox"` + `aria-checked` |
| Submenu | Trailing chevron | `aria-haspopup="menu"`, `aria-expanded` |
| Destructive | `--color-danger-text` label + confirm or undo | — |
| Disabled | Muted, still arrow-navigable so it can be read | `aria-disabled="true"` |

## Table row / list item / card

| State | Treatment | Attribute |
|---|---|---|
| Rest | — | — |
| Hover (if the row is clickable) | SL-4 across the row; `cursor: pointer` only if it really is clickable | — |
| Focus-visible | Ring inset (`outline-offset: -2px`) so it is not clipped by the table's overflow | — |
| Selected | Fill **plus** a checked checkbox or a 3px inset left border | `aria-selected` in a grid, or a real checkbox |
| Active / current | Distinct from selected — "current" is where you are, "selected" is what you chose | `aria-current` |
| Expanded (detail row) | Chevron rotates; the detail row is adjacent, not a modal | `aria-expanded` on the trigger |
| Drag source | Opacity 0.5 or elevation, SL-16 | see below |
| Drop target | **Insertion line** showing where it lands, not just a highlight | — |
| Invalid drop target | `not-allowed` cursor + no insertion line | — |
| Loading (row-level action) | Spinner in the action cell; the rest of the row stays usable | `aria-busy` on the row |
| Deleted | Fade out **plus** an undo affordance | Announce in `role="status"` |

Whole-card links: wrap the primary link and use a `::after` overlay for the hit area rather than nesting
interactive elements, or the card becomes one giant link containing buttons that cannot be clicked.

## Disclosure / accordion

Collapsed and expanded both need a visible indicator that *changes* — a chevron that rotates, a +/− swap.
`aria-expanded` goes on the trigger (which must be a `<button>`), `aria-controls` points at the panel id.
Do not put `aria-expanded` on the panel. `<details>`/`<summary>` gives all of this natively; style
`summary::marker` or `list-style: none` plus your own indicator.

## Dialog / drawer

| State | Requirement |
|---|---|
| Opening | Focus moves into the dialog — to the first focusable element, or the dialog itself if it has a heading |
| Open | Focus trapped inside; background `inert` so it is neither clickable nor tabbable |
| Escape | Closes, unless there is unsaved work — then confirm |
| Closing | Focus returns to the element that opened it, or a sensible successor if that element is gone |
| Attributes | `role="dialog"` + `aria-modal="true"` + `aria-labelledby`; native `<dialog>` with `showModal()` gives trapping and `inert` for free |

## Toast / inline notification

| Variant | Treatment | Attribute |
|---|---|---|
| Success | Icon + text; never a lone green tint | `role="status"` (polite) |
| Error | Icon + text + retry or next action | `role="alert"` (assertive) |
| Info | Icon + text | `role="status"` |
| Dismissible | Close button ≥24×24, focusable, labelled | — |

Auto-dismiss is hostile for anything the user must act on: SC 2.2.1 Timing Adjustable applies once content
disappears on a timer. Errors and anything with an action should persist until dismissed. A toast is also the
wrong home for information the user needs later — put that in the page.

## Auditing an existing library

Run this as a script rather than by eye:

1. Grep for `:hover` and count files. Grep for `:focus-visible` and count files. The gap is your backlog.
2. Grep for `outline:\s*none` / `outline:\s*0` and check each one has a replacement in the same rule set.
3. Grep for `disabled` in component props; for each, ask whether an enabled control with an explanation
   would be better (move 5).
4. Grep for `aria-expanded`, `aria-pressed`, `aria-selected`, `aria-current` and check each has a visual
   counterpart that changes with it — and vice versa: every rotating chevron should have an attribute.
5. Render every component in a states gallery: one page, every component, every cell of its table, in light
   and dark. Missing cells become obvious in a way they never do in code review, and the gallery doubles as
   the visual-regression target.
