# Announcing state to assistive technology

The wiring layer under moves 7 and 10 of `ui-signifiers-and-states/SKILL.md`. Read it when an outcome is
visual-only — async results, dynamic content, custom widgets, route changes — and you need it to reach
someone who is not looking at the screen. WCAG SC 4.1.2 Name, Role, Value (Level A) is the binding
requirement: state must be programmatically determinable, which means the attribute and the pixels have to
say the same thing.

## Live regions: the four rules that decide whether anything is announced

Live regions fail silently, which is why so many ship broken. Announcement depends on the region being
present and *watched* before the change happens.

1. **The container must be in the DOM before the content changes.** Inserting a fully-populated
   `<div role="alert">Saved</div>` frequently announces nothing, because the region did not exist to be
   watched. Render an empty region on mount; write text into it later.
2. **The change must be a text change inside it.** Toggling the region's own `display` or `hidden` is not
   reliably a change. Keep it rendered and visually hidden with an `.sr-only` class, not `display: none` —
   `display: none` removes it from the accessibility tree entirely.
3. **Politeness matches interruption cost.** `aria-live="polite"` (or `role="status"`) queues behind whatever
   the screen reader is saying. `aria-live="assertive"` (or `role="alert"`) interrupts mid-word. Use
   assertive only when the user is blocked: a submission failure, a session expiry, a lost connection. A
   polite region is right for saved, copied, filtered, loaded, added, removed.
4. **Identical consecutive text may not re-announce.** Copying twice writes "Copied to clipboard" twice and
   the second is often swallowed. Clear the region first, or append an invisible counter.

```jsx
// One app-level announcer, called from anywhere.
const [msg, setMsg] = React.useState("");
function announce(text) { setMsg(""); requestAnimationFrame(() => setMsg(text)); }

<p role="status" aria-live="polite" className="sr-only">{msg}</p>
<p role="alert" className="sr-only">{errorMsg}</p>
```

```css
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
}
```

**What to announce**: the outcome and the consequence, not the mechanism. "Copied to clipboard" — not
"clipboard write succeeded". "4 results, filtered by Active" — not "table updated". "Saved 2 minutes ago" on
a timer is noise; announce the save once.

## `aria-busy`

`aria-busy="true"` marks a region whose contents are mid-update so assistive tech does not announce a
half-built list. It belongs on the **container being replaced**, not on the button that triggered the work.
Set it before the swap, clear it after, and always clear it in a `finally` — a stuck `aria-busy` silences
that region permanently.

```jsx
<ul id="results" aria-busy={loading}>{rows.map(...)}</ul>
```

`aria-busy` is not a substitute for a visible indicator, and it is not a loading *announcement*. Pair it with
a status message when the wait exceeds ~1s: "Loading results…" then "12 results".

## `aria-disabled` vs `disabled`

Covered in move 5 of the skill; the announcement detail is that both are announced as "dimmed" or
"unavailable" by common screen readers, but only `aria-disabled` leaves the control in the tab order so the
announcement can actually be heard. If you use `aria-disabled`, you own three things: preventing the action
in the handler, preventing form submission if it is a submit button, and providing the explanation via
`aria-describedby` pointing at *visible* text.

## State attributes: which one, and the mistakes

| Situation | Correct | Common mistake |
|---|---|---|
| Two-state button (Mute, Bold, Pin) | `aria-pressed` on a `<button>`, label constant | Swapping the label to "Unmute" *and* setting `aria-pressed` — the state is then announced twice and contradicts itself |
| On/off setting applied immediately | `role="switch"` + `aria-checked` | `aria-pressed` on a switch, or a bare `<div>` with a colour change |
| Multi-select in a list | `aria-selected` inside `role="listbox"`/`option`, or real checkboxes | `aria-selected` on arbitrary `<div>`s, where it is ignored |
| Current page / step | `aria-current="page"` / `"step"` | `aria-selected`, or colour only |
| Show/hide a panel | `aria-expanded` on the trigger + `aria-controls` | `aria-expanded` on the panel; or `aria-hidden` on a panel that is also `display: none` (redundant) and on one that is visible (invisible content bug) |
| Sort direction in a table header | `aria-sort="ascending\|descending\|none"` on the `<th>` | An arrow glyph with no attribute |
| Field in error | `aria-invalid="true"` + `aria-describedby` → the message | `role="alert"` on a permanently-rendered message, which announces on every render |
| Progress | `role="progressbar"` + `aria-valuenow/min/max`, or `<progress>` | An animated `<div>` with no role, silent to AT |

`aria-hidden="true"` removes an element and its subtree from the accessibility tree. Never put it on
anything focusable — that produces a control a keyboard user can reach and a screen reader cannot describe.
Use `inert` when you want both hidden *and* unfocusable.

## Focus management, because focus is state too

- **Route change in an SPA.** The browser does not move focus, so a screen reader stays where it was and the
  user may not know the page changed. Move focus to the new page's `<h1>` (with `tabindex="-1"`) or to a
  skip-target, and announce the new page title in a polite region.
- **Dialog open.** Focus into the dialog; trap it; make the background `inert`. On close, return focus to the
  trigger — or to the nearest sensible element if the trigger no longer exists (a row that was just deleted).
- **After a destructive action.** Focus is orphaned when its element is removed. Move it deliberately: to the
  next row, or to the undo control, which is the most useful destination anyway.
- **Failed submit.** Move focus to the first invalid field, not to the top of the form and not to the error
  summary unless the summary is itself focusable and links to the fields.
- **Newly revealed content.** Expanding a disclosure does *not* require moving focus — `aria-expanded` on the
  trigger is enough, and moving focus unexpectedly is worse. Moving focus is for content that replaces the
  user's context, not content that extends it.
- **`:focus-visible` and programmatic focus.** Calling `.focus()` on an element after a click may not match
  `:focus-visible` in every engine. When a programmatic focus move must be seen, either set focus in response
  to a keyboard interaction or add an explicit class for the duration.

## Testing this without guessing

1. **Keyboard only.** Unplug the mouse. Reach every control, operate it, and see where focus goes after every
   action. Most failures here are visible without a screen reader at all.
2. **One screen reader end to end.** VoiceOver on macOS/iOS or NVDA on Windows. Do the primary task. You are
   listening for three things: does every control announce a *name*, a *role*, and its current *state*.
3. **Announce-check the async paths specifically.** Submit, fail, retry, succeed. Silence on any of those is
   the bug.
4. **Automated checks catch roughly a third of issues** — axe-core, Lighthouse and similar are worth wiring
   into CI for missing names, contrast and invalid ARIA, but they cannot tell you that focus went nowhere
   after a delete. Do not treat a green automated report as a pass.
