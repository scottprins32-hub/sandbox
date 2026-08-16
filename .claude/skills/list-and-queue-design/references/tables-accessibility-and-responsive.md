# Tables: assistive-technology semantics and 320px

The two halves of a work queue that get built wrong most often, because both fail silently. A table built
from `<div>`s looks identical in a screenshot and is a wall of unlabelled text to a screen reader. A table
that has never been opened below 1200px looks fine in review and is a two-dimensional scroll trap on the
phone the warehouse supervisor actually carries.

`list-and-queue-design/SKILL.md` owns *which* columns exist, the density modes, and what a bulk action means.
This file owns the markup that makes those decisions reach everybody, and what the same table does at 320 CSS
px. Row hover and selected *styling* belongs to `ui-signifiers-and-states`; padding values belong to
`spacing-and-layout`; the live-region mechanics summarised here are covered in depth in
`ui-signifiers-and-states/references/announcing-state.md`.

## 1. Use a real `<table>`, and understand exactly what that buys

A native table with `<caption>`, `<thead>`, `<th scope="col">` and `<th scope="row">` gives you, at zero cost:

- **Row and column announcement.** Moving between cells with a screen reader's table keys reads the column
  header and the row header alongside the cell value. "Amount, £420.00, row 12, refund 8842." Without it the
  user hears "£420.00" and has no way to find out what it is.
- **Table navigation mode.** NVDA, JAWS and VoiceOver expose dedicated cell-by-cell navigation and a "jump to
  table" command, plus row and column counts on entry. Div soup has none of it.
- **Correct counts.** The browser derives row and column totals from the structure.
- **Find-in-page, selection, copy-paste and print** across the whole rendered dataset.

WCAG 2.2 SC 1.3.1 Info and Relationships (Level A) is the binding requirement: the header/data relationships
conveyed visually must be programmatically determinable. Native table markup is the cheapest way to pass it.

```html
<div class="table-scroll" role="region" aria-labelledby="queue-cap" tabindex="0">
  <table>
    <caption id="queue-cap">
      Refund queue — 128 requests awaiting approval
    </caption>
    <thead>
      <tr>
        <th scope="col" class="col-select">
          <input type="checkbox" id="select-page">
          <label for="select-page" class="sr-only">Select all rows on this page</label>
        </th>
        <th scope="col">Request</th>
        <th scope="col" aria-sort="descending">
          <button type="button" data-sort="age">Age<span aria-hidden="true" class="sort-glyph">↓</span></button>
        </th>
        <th scope="col" aria-sort="none">
          <button type="button" data-sort="amount">Amount</button>
        </th>
        <th scope="col">Status</th>
        <th scope="col"><span class="sr-only">Actions</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="col-select">
          <input type="checkbox" id="sel-8842">
          <label for="sel-8842" class="sr-only">Select refund 8842, Acme Corp, £420.00</label>
        </td>
        <th scope="row"><a href="/refunds/8842">#8842</a> Acme Corp</th>
        <td><time datetime="2026-08-10">6 days</time></td>
        <td class="num">£420.00</td>
        <td><span class="badge badge-warn">Awaiting approval</span></td>
        <td><button type="button">Approve<span class="sr-only"> refund 8842</span></button></td>
      </tr>
    </tbody>
  </table>
</div>
```

Details in there that are load-bearing:

- **`<caption>` is the table's accessible name** and must be the first child of `<table>`. Put the real count
  in it and show it — it is the one piece of orientation every user needs, and hiding it with `.sr-only` to
  keep the design tidy throws away a visible affordance to give a non-visible one. If a heading already sits
  above the table, use `aria-labelledby` pointing at that heading instead of duplicating it.
- **`scope="row"` on the identifying cell, not `<td>`.** That cell is what re-orients a screen-reader user who
  has arrowed six columns right. Pick the column a human would read aloud to identify the row — the ID plus
  the customer name, not the timestamp.
- **`scope="row"` applies to the cells that *follow* it in the row** (HTML Standard, `scope` attribute), so
  the checkbox in column 1 gets no association from a row header in column 2. That is why the row checkbox
  carries its own label. Putting the checkbox inside the `<th scope="row">` alongside the ID is the other
  valid answer and removes a column.
- **`aria-sort="none"` is set explicitly on every sortable header**, not just omitted. Its presence is the cue
  that the column is sortable at all; `Status` and `Request` carry no `aria-sort` because they are not.
- **The empty actions header still needs a name.** A blank `<th>` reads as nothing and the column has no
  identity.

### What div soup costs, and what `role="table"` obliges

Applying `role="table"`, `role="row"`, `role="columnheader"`, `role="rowheader"` and `role="cell"` to divs
restores the semantics — every one of them, by hand, on every element, kept correct forever. Miss `role="row"`
on the wrapper and the whole structure collapses, because ARIA table roles have a required owned-element
hierarchy: a `cell` must be inside a `row`, a `row` inside a `table`/`rowgroup`. Getting nine tenths of it
right produces a *broken* table, which announces worse than no table at all. There is no partial credit.

Some things you cannot get back: the `headers` attribute for irregular header associations, native
`colspan`/`rowspan` header inference, and the browser's own row and column counting.

**The same trap arrives through CSS.** Setting `display: block`, `flex` or `grid` on `<table>`, `<tr>` or
`<td>` changes the element's computed role in several engines and drops table semantics. This has been fixed
in Chromium since 2020 but has a long tail across Safari versions and anything older, and it is exactly what
the classic "responsive table" snippet — `table, thead, tbody, tr, td { display: block }` — does. If you find
that CSS in a codebase, it is a live bug, not a style choice. Keep display properties off table elements and
put `overflow` on a wrapper instead (section 7).

### `role="table"` vs `role="grid"` — the choice most teams get wrong

| | `role="table"` (and native `<table>`) | `role="grid"` |
|---|---|---|
| What it is | Static tabular data structure | Composite **widget** |
| Keyboard model | None. Reading only | Arrow-key cell navigation, Home/End, Ctrl+Home/End, Page Up/Down, and selection keys |
| Tab stops | **Every** focusable descendant is in the page tab sequence | **Exactly one** for the entire grid; you manage the rest with roving `tabindex` (or `aria-activedescendant`) |
| Who implements it | The browser | You |

The APG is explicit that a table "is a static tabular structure … it is not an interactive widget", and that
a grid "always contains multiple focusable elements" of which "only one … is included in the page tab
sequence".

That single-tab-stop rule is the whole commitment. Adding `role="grid"` tells assistive technology "arrow
keys navigate cells here and Tab will leave this widget". If you have not written the roving-tabindex focus
manager, the user presses Down expecting the next row, nothing happens, then Tab walks them through 400
focusable cells one at a time — which is worse than plain markup, because plain markup at least never made
the promise. **`role="grid"` bolted onto a table with no keyboard implementation is a regression, and it is
one of the most common ARIA mistakes in shipped admin tools.**

Choose grid only when both hold: the table has enough interactive cells that a 300-stop tab sequence is
genuinely hostile, *and* you are building the full APG grid pattern — arrow navigation, Home/End,
Ctrl+Home/End, Page Up/Down, `Enter`/`F2` to enter a cell's editable content, `Escape` to leave it, and
`aria-selected` maintained on rows or cells. That is a spreadsheet. A work queue with a checkbox, a link and
two buttons per row is not, and is better served by a native table plus the row-level keyboard shortcuts
`list-and-queue-design/SKILL.md` describes.

`role="grid"` is compatible with native markup: `<table role="grid">` keeps `<th scope>` associations while
switching the interaction model. If you commit, do it that way rather than rebuilding on divs.

## 2. Sortable headers

The pattern, in full: a `<button>` inside the `<th>`, `aria-sort` on the **`<th>`** (never on the button),
exactly one header carrying a non-`none` value at a time, and a polite announcement of the new order and the
result count once the rows have re-rendered.

`aria-sort` takes `ascending`, `descending`, `none` (default) or `other`, and applies to `columnheader` and
`rowheader`. The spec's guidance is that it should be on a single header at a time — when sort moves, the
non-`none` value moves with it.

```html
<th scope="col" aria-sort="descending">
  <button type="button" data-sort="amount">Amount<span class="sort-glyph" aria-hidden="true">↓</span></button>
</th>
```

```js
function applySort(th) {
  const key = th.querySelector("button").dataset.sort;
  const next = th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending";

  // Exactly one non-none value in the table.
  for (const h of table.querySelectorAll("th[aria-sort]")) h.setAttribute("aria-sort", "none");
  th.setAttribute("aria-sort", next);

  renderRows(sortBy(key, next));
  // Focus stays on the button the user pressed — do not move it.
  announce(`Sorted by ${key}, ${next}. ${rowCount} rows.`);
}
```

- **A real `<button>`, not a click handler on the `<th>`.** It gets keyboard operation, `Enter` *and* `Space`,
  a focus ring, and a button role announcement for free. A clickable `<th>` is a hidden affordance.
- **Keep the button's accessible name constant** — "Amount", not "Sort by amount ascending". `aria-sort`
  carries the state; a name that changes on every press means the control the user just pressed is now called
  something else. This is the same rule as `aria-pressed` on a toggle button in `ui-signifiers-and-states`.
- **The glyph is `aria-hidden`.** ↑/↓ read as "up arrow" if you let them through, on top of the state
  announcement. And the glyph must exist: sort direction carried by colour or by header weight alone fails SC
  1.4.1 Use of Color.
- **Reserve space for the glyph in every sortable header**, or the columns shift width when sort moves and the
  header the user is aiming at slides out from under the pointer.
- **Announce after the rows land, not on click.** The useful message is the outcome: order plus count. SC
  4.1.3 Status Messages (AA) is the requirement, and its own examples include "18 results returned".
- **Focus does not move.** The user pressed a button; leave them on it so they can press it again to reverse.

Multi-column sort is the one case `aria-sort` cannot express — it has no notion of precedence. If you ship
it, keep `aria-sort` on the primary column only and put the full sort order in visible text near the table
("Sorted by status, then amount, descending"), which the announcement then repeats verbatim.

## 3. Selection

### Per-row checkboxes need names that identify the row

Forty checkboxes all named "Select row" is a list of forty identical controls. The name has to say *which*
row, and it should read the way a human would identify it out loud.

```html
<td class="col-select">
  <input type="checkbox" id="sel-8842" name="ids" value="8842">
  <label for="sel-8842" class="sr-only">Select refund 8842, Acme Corp, £420.00</label>
</td>
```

Two or three identifying fields, not the whole row — the label is read on every arrow-key pass. `aria-label`
on the input is an acceptable alternative; a visible `<label for>` bound to a visually-hidden span is not
better here, and either way the label must be bound so the click target includes it (`friction-and-flow`,
Fitts). Never rely on the row header alone: `scope="row"` does not associate backwards to the checkbox
column.

### Select-all and the indeterminate state

```js
const total = pageRows.length, chosen = selected.size;
selectPage.checked = chosen === total && total > 0;
selectPage.indeterminate = chosen > 0 && chosen < total;
```

`indeterminate` is a JavaScript property only — there is no HTML content attribute for it, and setting
`checked` does not clear it, so set both on every update. A native checkbox in that state maps to
`aria-checked="mixed"` automatically; for a custom checkbox you set `aria-checked="mixed"` yourself. Style it:
a dash rather than a tick, so it is distinguishable without colour (1.4.1).

Keep the header checkbox's name constant — "Select all rows on this page" — and let checked/mixed/unchecked
carry the state. Swapping it to "Clear selection" when partially selected renames a control mid-interaction.

**Say which set it selects.** "All on this page" and "all 128 matching the filter" are different promises and
users assume the second. Name the scope in the label, and when a page selection exists offer the widening
control as a separate, explicit action rather than an inferred one. What each scope should *do* is
`list-and-queue-design/SKILL.md`'s call; this file only insists the name matches it.

### Announce the count, once

```html
<p id="queue-status" role="status" class="sr-only"></p>
```

```js
let pending;
function announceSelection(n, total) {
  clearTimeout(pending);
  pending = setTimeout(() => announce(`${n} of ${total} rows selected.`), 500);
}
```

Debouncing is not optional here. Shift-clicking a range of 40 rows fires 40 state changes; without the
debounce a screen-reader user hears the counter tick past every one of them and cannot hear anything else.
Announce the settled count.

### `aria-selected` belongs to the grid pattern only

`aria-selected` is valid on `row` inside `grid` and `treegrid`, and on `option`, `tab`, `gridcell`,
`columnheader`, `rowheader` and `treeitem`. It is **not** valid on a `<tr>` in a plain `<table>`, where it is
ignored — so a table that shows selection with `aria-selected` and no checkbox has no programmatic selection
state at all.

In a checkbox-driven table the checkbox *is* the selection state, and it is already announced. Do not add
`aria-selected` alongside it; you get two sources of truth that drift, and some screen readers announce both.
The visual selected row style still needs a non-colour cue — an inset left border or a fill plus the ticked
box — per SC 1.4.1; `ui-signifiers-and-states` owns those values.

## 4. Live updates

A queue changes under the user constantly: filters, sorts, page changes, async bulk results, background
refreshes. Every one of those is invisible to someone not looking at the screen unless it lands in a live
region. SC 4.1.3 Status Messages (AA) is the requirement — the change must be conveyed "without receiving
focus".

The four rules that decide whether anything is announced at all are in
`ui-signifiers-and-states/references/announcing-state.md`. Compressed, with the list-specific consequence:

1. **The region must exist in the DOM before the content changes.** Rendering
   `<p role="status">12 results</p>` into the page announces nothing in most screen readers, because the
   region was not there to be watched. Mount one empty `role="status"` element with the table shell and write
   text into it. This is the single most common reason a correctly-reasoned announcement is silent.
2. **Keep it rendered.** Visually hide with `.sr-only`; `display: none` removes it from the accessibility tree
   and toggling `hidden` is not reliably a change.
3. **Identical consecutive text may not re-announce.** Filtering twice to the same count is common in a queue.
   Clear the region and rewrite on the next frame, or vary the text.
4. **Polite, essentially always.** `aria-live="polite"` / `role="status"` queues behind whatever the screen
   reader is saying. `assertive` / `role="alert"` interrupts mid-word.

**Why `assertive` is almost always wrong in a list.** A queue emits status constantly. Assertive means "cut
the user off" — so an assertive result count truncates the row they were in the middle of reading, every time
they type a character into a filter. Reserve it for the cases where the user is genuinely blocked and
continuing would be harmful: the bulk action failed, the session expired, the connection dropped mid-write.
Everything else — filtered, sorted, paged, loaded, selected, saved — is polite.

**What to say.** The outcome and the consequence, not the mechanism:

| Event | Announce |
|---|---|
| Filter applied | "12 of 128 rows. Filtered by status: awaiting approval." |
| Sort changed | "Sorted by amount, descending. 128 rows." |
| Page changed | "Page 3 of 6. Rows 51 to 75 of 128." |
| Bulk action done | "12 refunds approved. 2 failed — see the errors above the table." |
| Bulk action failed | `role="alert"`: "Nothing was approved. The request timed out. Your selection is still active." |
| Background refresh | "3 new requests." Never announce an unchanged count. |

**`aria-busy` during a load.** Set it on the container being replaced — `<tbody>` or the table — so assistive
tech does not read a half-built list, and clear it in a `finally`. A stuck `aria-busy` silences that region
permanently.

```jsx
<tbody aria-busy={loading}>{rows.map(renderRow)}</tbody>
```

`aria-busy` is not a visible indicator and not an announcement. Pair it with the visible loading treatment
(`friction-and-flow/references/perceived-performance.md` owns which one) and, past ~1s, a polite "Loading
requests…" followed by the result count.

## 5. Focus management

Focus is state. A table that destroys and rebuilds rows destroys focus with them, and the default failure —
focus falls to `<body>` — sends a keyboard user back to the top of the document on every action. In a queue
where the job is "do this to 40 rows in a row", that is the difference between usable and unusable.

| After | Focus goes to |
|---|---|
| A row is deleted or removed by an action | The same position in the next row (its first focusable control). If it was the last row, the previous row. If the list is now empty, the empty state's heading with `tabindex="-1"`, or the primary action in it |
| A row drawer, dialog or side panel closes | **Back to the control that opened it.** If that row no longer exists, the row that took its place |
| A bulk action completes | The bulk-action control if it survives; if the toolbar unmounts because selection cleared, keep the toolbar mounted and disabled-with-explanation instead, or move focus to the table region |
| A page changes | The pagination control that was pressed, if it still exists. "Next" on the last page disappears — move focus to the table region and scroll it to the top |
| A filter is applied | Nowhere. The user is typing in the filter; leave them there and announce the count |
| A sort is applied | Nowhere. Leave them on the header button |

The rule underneath: **move focus when the user's context is replaced, leave it when the context is
extended.** A drawer replaces context. A filtered result set extends it.

Do not move focus into a toast. An auto-dismissing undo toast that steals focus disappears out from under the
user mid-read, and if it takes focus with it you have orphaned them twice. Announce the undo politely, keep a
persistent recovery path (a trash view, a per-row undo), and let the toast be the fast path for people
looking at it — the same argument `friction-and-flow` makes for undo never being the *only* recovery.

### SC 2.4.11 Focus Not Obscured, and the sticky-header bug

SC 2.4.11 (Level AA, new in WCAG 2.2): "When a user interface component receives keyboard focus, the
component is not entirely hidden due to author-created content." Partial obscuring passes AA; total obscuring
fails. SC 2.4.12 (AAA) tightens it to none.

A sticky table header and a sticky bulk-action bar are the two most reliable ways to fail it. Tab down
through rows and the browser scrolls the focused row just into the viewport — which is *underneath* the
sticky header, because the browser does not know the header is there. The row is focused, invisible, and the
user is operating a control they cannot see. This is a real AA failure and it ships constantly.

The fix is scroll padding on the scroll container, sized to whatever is pinned:

```css
.table-scroll {
  --sticky-head: 2.75rem;   /* height of the pinned thead */
  --sticky-bar: 3.5rem;     /* height of the pinned bulk-action bar */
  overflow: auto;
  scroll-padding-block: var(--sticky-head) var(--sticky-bar);
}

/* Belt and braces: works even when the scrolling ancestor is not yours. */
.table-scroll :is(a, button, input, select, [tabindex]) {
  scroll-margin-block: var(--sticky-head) var(--sticky-bar);
}

/* If the page itself scrolls under a global sticky header, it needs the same. */
html { scroll-padding-top: 3.5rem; }
```

`scroll-padding` on the container and `scroll-margin` on the target both feed sequential focus navigation
scrolling and `scrollIntoView()`. Use whichever you control; setting both is cheap and covers the case where
a parent becomes the scroller at a different breakpoint.

Two things this does not fix, so check them by hand:

- **The bulk bar appears only when rows are selected**, changing the required offset mid-session. Drive
  `--sticky-bar` from the bar's measured height, or reserve the space permanently.
- **At 400% zoom the sticky chrome is four times taller in CSS pixels** and can occupy most of the viewport.
  A header plus a bulk bar that took 15% of the screen at 100% zoom can leave no room for a row at all. Test
  it (section 8) and consider unsticking both below a height threshold.

## 6. Virtualisation, honestly

Row virtualisation renders only the visible slice and reports a fake scroll height. It is a real performance
technique and it removes real functionality. Decide with the costs on the table, not after.

**What it breaks:**

- **Find-in-page.** `Ctrl/Cmd-F` searches the DOM. On a virtualised 5,000-row table it searches the ~40 rows
  currently mounted and reports "no results" for a row that exists. Operators use find-in-page constantly to
  locate an order number, and it is the fastest path they have — you are removing a tool they already know in
  exchange for one they have to learn.
- **Select-all and copy.** `Cmd+A` then copy yields the visible slice. So does dragging a selection. Anyone
  who exports to a spreadsheet by copy-pasting the table — which is most operations teams — silently gets
  partial data.
- **Print, and browser translation.** Both operate on the DOM.
- **Focus.** A focused row scrolled out of range gets unmounted and focus falls to `<body>`. The keyboard user
  is teleported to the top of the page mid-task.
- **Screen-reader counts.** The AT reads the mounted row count as the total: "table, 6 columns, 40 rows" for a
  5,000-row dataset. Position within the list becomes meaningless.
- **Deep links to a row**, and browser restore-scroll-on-back.

**Mitigations, in order of value:**

1. **Try `content-visibility: auto` first.** It skips rendering off-screen content while keeping it in the DOM
   and the accessibility tree, so find-in-page, copy and AT still work. Pair with `contain-intrinsic-size` to
   stop the scrollbar jumping. Chromium exposes skipped content to find-in-page; Safari currently does not,
   so this improves the situation rather than fully solving it.

   ```css
   tbody tr { content-visibility: auto; contain-intrinsic-size: auto 44px; }
   ```

2. **Set the real counts** so AT reports the dataset, not the slice. `aria-rowcount` on the table (`-1` if the
   total is genuinely unknown), `aria-rowindex` on every row — 1-based, and the header row counts as row 1,
   so the first body row is 2.

   ```html
   <table aria-rowcount="5241">
     <thead><tr aria-rowindex="1">…</tr></thead>
     <tbody>
       <tr aria-rowindex="1287">…</tr>
       <tr aria-rowindex="1288">…</tr>
     </tbody>
   </table>
   ```

   These are meaningful on `table`, `grid` and `treegrid`. They are the *only* thing that makes a virtualised
   table honest to assistive technology, and they are almost always missing.

3. **Never unmount the focused row.** Keep it in the mounted set regardless of scroll position, or restore
   focus to the nearest mounted row on unmount. Overscan by a screenful in both directions.
4. **Replace find-in-page deliberately.** A prominent filter/search that queries the *server* over the whole
   dataset, positioned where the user will find it, and labelled so it reads as the search for this table.
   Intercepting `Ctrl/Cmd-F` is defensible only if your replacement matches across the full dataset,
   highlights hits, supports Enter / Shift-Enter for next and previous, and closes on Escape. If it does
   less than native find-in-page, leave the shortcut alone.
5. **Offer a real export.** If people copy-paste the table to get data out, a CSV/XLSX export removes the
   need and works regardless of how you render.

**When virtualisation is worth its cost:** an unbounded or streaming dataset the user genuinely scans
continuously — log tails, event streams, audit trails, time series — where pagination would break the mental
model of one continuous timeline, and where the alternative is a browser that stops responding.

**When server-side pagination is the better answer** — which is most work queues:

- The user's job is to *process* rows, not scan them. They want the next 25 items, not row 3,000.
- The dataset is bounded, or bounded by the filter the user should be applying anyway.
- You have not measured. Modern browsers handle a few thousand simple rows without trouble; the row count at
  which yours degrades depends entirely on how much you render per cell. Profile on the worst device your
  users actually have before adopting a technique that removes find-in-page.

The diagnostic: **if the answer to "how does a user find one specific row" is "scroll and look", you have a
filtering problem, not a rendering problem.** Virtualising makes scrolling fast without making finding
possible. Fix the filters and paginate.

## 7. Responsive at 320 CSS px

SC 1.4.10 Reflow (AA) requires content presented "without loss of information or functionality, and without
requiring scrolling in two dimensions" at a width equivalent to 320 CSS px — "except for parts of the content
which require two-dimensional layout for usage or meaning". The Understanding document names data tables as
relying on two-dimensional layout, so **a horizontally scrolling data table is explicitly permitted**, and it
is usually the best of the three options rather than the fallback.

What is *not* excepted: everything around the table. The heading, filters, bulk bar, pagination and footer all
have to fit in 320 px with no horizontal page scroll. Only the table's own container may scroll sideways.
320 CSS px is the normative equivalent of a 1280 px viewport at 400% zoom.

### Pattern A — horizontal scroll with a sticky identity column

The default. Preserves the table, the semantics, sorting, comparison and every keyboard path, and costs about
thirty lines.

```html
<div class="table-scroll" role="region" aria-labelledby="queue-cap" tabindex="0">
  <table>…</table>
</div>
```

```css
.table-scroll {
  --col-select-w: 2.75rem;
  --sticky-head: 2.75rem;
  overflow: auto;
  overscroll-behavior-x: contain;          /* stop sideways swipes triggering back-navigation */
  scroll-padding-block-start: var(--sticky-head);
}
.table-scroll:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;                    /* drawn inside; the container clips its own overflow */
}

.table-scroll table {
  border-collapse: separate;               /* NOT collapse — see below */
  border-spacing: 0;
  min-width: 46rem;                        /* below this the columns wrap into unreadable slivers */
}
.table-scroll :is(th, td) {
  border-block-end: 1px solid var(--border-subtle);
  white-space: nowrap;
  background: var(--surface);              /* mandatory on sticky cells; harmless elsewhere */
}

/* Header row pins vertically. */
.table-scroll thead th { position: sticky; inset-block-start: 0; z-index: 2; }

/* Identity columns pin horizontally. */
.table-scroll .col-select        { position: sticky; inset-inline-start: 0; z-index: 2;
                                   inline-size: var(--col-select-w); }
.table-scroll th[scope="row"]    { position: sticky; inset-inline-start: var(--col-select-w); z-index: 2;
                                   border-inline-end: 1px solid var(--border-subtle); }

/* The corner cells are sticky in both axes and must sit above both. */
.table-scroll thead .col-select,
.table-scroll thead th[scope="row"] { z-index: 3; }
```

Three things bite here every time:

- **`border-collapse: collapse` and `position: sticky` are incompatible.** Collapsed borders belong to the
  table, not the cell, so they stay behind while the sticky cell moves — the header's bottom rule scrolls away
  and leaves a gap. Use `border-collapse: separate; border-spacing: 0` and put the border on one edge of each
  cell, or draw the rules with `box-shadow`.
- **Sticky cells need an opaque background**, or the scrolled content shows through them.
- **`z-index` ordering is a matrix, not a line.** Sticky header (vertical) and sticky identity column
  (horizontal) intersect at the corner cell, which must beat both.

**The container must be keyboard-focusable and named**, and this is the part most often skipped. Without
`tabindex="0"` a keyboard-only user cannot scroll the region at all — a direct SC 2.1.1 Keyboard failure — and
without a role and an accessible name they get an unlabelled tab stop (SC 4.1.2). `role="region"` plus
`aria-labelledby` pointing at the `<caption>` gives both, and makes the table a landmark users can jump to.

Browsers do not save you here. Firefox has made scroll containers tab stops for years; Chromium ships
keyboard-focusable scrollers too — but **only when the scroller has no focusable children**. A data table has
sort buttons, checkboxes and row links, so it never qualifies. Safari does not do it at all. Add
`tabindex="0"` yourself.

Two refinements worth the code: only add `tabindex` when the region actually overflows
(`el.scrollWidth > el.clientWidth`, re-evaluated on resize and on data change), so users are not given a dead
tab stop on wide screens; and if a page carries many such regions, that is usually a sign the page has too
many tables rather than a reason to drop the landmark.

### Pattern B — collapse to cards

Each row becomes a self-contained card with its values labelled inline. Genuinely better when the mobile task
is "deal with the top item", genuinely destructive otherwise.

**Do not do it with `display: block` on table elements.** That is the well-known snippet and it strips table
semantics in some engines (section 1). Render a different component from the same data.

```html
<ul class="queue-cards" aria-label="Refund queue, 128 requests">
  <li>
    <article aria-labelledby="c-8842">
      <h3 id="c-8842"><a href="/refunds/8842">#8842 — Acme Corp</a></h3>
      <dl>
        <div><dt>Amount</dt><dd>£420.00</dd></div>
        <div><dt>Age</dt><dd><time datetime="2026-08-10">6 days</time></dd></div>
        <div><dt>Status</dt><dd><span class="badge badge-warn">Awaiting approval</span></dd></div>
      </dl>
      <button type="button">Approve<span class="sr-only"> refund 8842</span></button>
    </article>
  </li>
</ul>
```

The `<dl>` carries what `<th scope="col">` used to: every value keeps a visible label, which is the whole
point — a card of bare values is worse than the table it replaced.

**What you lose, and must replace:**

- **Sorting has no home.** The column headers were the sort controls. Add an explicit sort control — a
  `<select>` or menu button above the list — or the feature silently disappears on mobile.
- **Column comparison is gone.** Vertical alignment is what makes "which of these is the outlier" a
  half-second glance; stacked cards make it an act of memory. If comparing across rows is the job, this
  pattern breaks it.
- **Scanning density collapses.** A card list runs four to six times taller than the rows it replaces, so
  pagination that was comfortable now needs many more swipes.
- **Two components to maintain**, which drift. Every new column has to be added twice or it vanishes on
  mobile.

Switch with a container query, not a media query — a table inside a narrowed panel needs the same treatment
at a wide viewport:

```css
.queue { container-type: inline-size; }
.queue-cards { display: none; }
@container (width < 34rem) {
  .queue .table-scroll { display: none; }
  .queue-cards { display: grid; gap: 0.75rem; }
}
```

### Pattern C — priority columns with a row expand

Give every column a priority tier and drop from the bottom as width shrinks; the dropped values reappear in a
per-row disclosure.

- **Tier 1** — identity. The row header. Never dropped.
- **Tier 2** — the fields the user's decision depends on. Status, amount, age. Dropped last, and internally
  ordered so the least decisive of them goes first.
- **Tier 3** — metadata: created-by, channel, internal reference, last-updated. Dropped first.

Assigning the tiers is the same judgement as deciding which columns earn a place at all —
`list-and-queue-design/SKILL.md` owns that call, and this is where it is enforced.

```html
<tr>
  <td class="col-select">…</td>
  <th scope="row">#8842 Acme Corp</th>
  <td class="prio-2a">£420.00</td>
  <td class="prio-2b">6 days</td>
  <td class="prio-3">Card · EU</td>
  <td class="prio-3">j.okafor@acme.test</td>
  <td>
    <button type="button" aria-expanded="false" aria-controls="d-8842">
      <span class="sr-only">Show all details for refund 8842</span>
      <svg class="chev" aria-hidden="true" width="16" height="16">…</svg>
    </button>
  </td>
</tr>
<tr id="d-8842" hidden>
  <td colspan="7"><dl>…every hidden column, labelled…</dl></td>
</tr>
```

```css
.queue { container-type: inline-size; }
@container (width < 44rem) { .prio-3  { display: none; } }
@container (width < 30rem) { .prio-2b { display: none; } }   /* tier 2, in reverse importance */
```

- **Hide the `<th>` and the matching `<td>`s together**, or the header row desynchronises from the body.
- **`colspan` on the detail cell can stay at the full column count**; browsers clamp a `colspan` larger than
  the number of columns actually present, so it survives columns being hidden.
- **`aria-expanded` on the trigger, `aria-controls` on the detail row**, and the chevron must actually rotate
  — `ui-signifiers-and-states` owns that state.
- **The disclosure repeats the labels**, because outside the table body the column headers no longer apply.
- Expanding does **not** move focus; `aria-expanded` on the trigger is the announcement. Announce nothing.

The cost is ongoing: every new column needs a tier, the tiers need re-checking whenever the queue's purpose
shifts, and an untiered column silently defaults to always-visible and breaks the narrow layout.

### Choosing between them

| The user's job at this width is… | Pattern |
|---|---|
| Compare a value across rows — find the outlier, the oldest, the largest | **A** — scroll with a sticky identity column. Alignment is the feature; do not break it |
| Act on one item at a time — triage, approve, call, dispatch | **B** — cards, plus an explicit sort control |
| Both, or the table has eight-plus columns of clearly unequal importance | **C** — priority columns with expand |
| You do not know, or you have not asked anyone | **A**. It is the cheapest, keeps every capability, and 1.4.10 explicitly allows it |

Default to A and move off it only when you can name the narrow-viewport task in a sentence. B and C both cost
a second rendering path that will drift from the first; A costs a wrapper and thirty lines of CSS.

## 8. Testing recipe

Four passes. None takes more than ten minutes, and each finds a different class of failure.

**Keyboard only.** Unplug the mouse and Tab in from above the table.

- The order is: filters → the scroll region (one stop) → select-all → each sort button → each row's controls
  in visual order → pagination. Nothing skipped, nothing out of sequence.
- Sort buttons operate on both `Enter` and `Space`.
- With the region focused, arrow keys scroll it horizontally.
- Delete a row: focus lands on the next row, never on `<body>`. Watch the focus ring, do not assume.
- Open a row drawer and close it with `Escape`: focus returns to the button that opened it.
- Run a bulk action, change page, apply a filter — check where focus is after each.
- With the sticky header and bulk bar both pinned, every focused element is at least partly visible (2.4.11).

**One screen reader end to end** — VoiceOver or NVDA. You are listening for a specific script:

| Step | Must be announced |
|---|---|
| Entering the table | The caption as the table's name, plus column and row counts (the `aria-rowcount` total if virtualised) |
| Arrowing across a row | Each cell's column header, and the row header for orientation |
| Landing on a sort button | Its name, "button", and the column's sort state |
| After pressing sort | Polite: "Sorted by amount, descending. 128 rows." |
| Landing on a row checkbox | A name identifying *that* row, plus "checkbox, not checked" |
| Select-all with a partial page selected | "Partially checked" / "mixed", then a polite "12 of 25 rows selected" |
| After a bulk action | Polite outcome plus failure count; a `role="alert"` only if nothing succeeded |
| After changing page | "Page 3 of 6. Rows 51 to 75 of 128." |
| During a load | Nothing half-read from the table (`aria-busy`), then the settled count |

Silence at any of those steps is the bug. So is hearing the same thing twice, which means the live region and
a focus move are both announcing.

**320 px.** Set the viewport to 320 px wide.

- The page does not scroll horizontally. Only the table region does.
- Heading, filters, bulk bar and pagination are all reachable without sideways page scroll.
- The sticky identity column stays readable while scrolling right, with an opaque background and no border
  gaps.
- Every target is still ≥24×24 CSS px (2.5.8).
- The region is focusable and arrow-scrollable.
- Check the *empty* and *one row* states too — sticky columns with nothing to stick to look broken.

**400% zoom.** Set the window to 1280×1024 and zoom the browser to 400%. This is not the same as resizing the
window: text and layout scale differently, and every offset you expressed in `px` is now four times taller in
viewport terms.

- The sticky header plus the sticky bulk bar together still leave room to read a row. If they do not, unstick
  one below a height threshold.
- Re-run the 2.4.11 check at this zoom — it fails here long before it fails at 100%.
- Nothing is clipped or overlapped, and no control has become unreachable.

Also worth running once per project, though they are not table-specific: SC 1.4.4 Resize Text at 200% and the
SC 1.4.12 text-spacing overrides, both covered in `ui-signifiers-and-states`. Fixed row `height` is what
breaks under 1.4.12 — use `min-height` and padding.

Automated tooling catches roughly a third of this. axe-core will find a missing accessible name on a
checkbox and an invalid ARIA attribute; it will not tell you that focus went to `<body>` after a delete, that
your select-all selects a different set than its label promises, or that the sticky header hides the focused
row. Run it in CI and do not treat a green report as a pass.
