---
name: list-and-queue-design
description: Designs the screen operators live in — tables, data grids, lists, inboxes and work queues — and the decisions that make or break one: the default sort and filter, which columns earn a place, row actions and drawers, density modes, bulk-selection scope, pagination, stability under live data, and queues worked offline on an intermittent connection. Use this whenever a screen shows many records as repeating rows: admin panels, search results, dashboards with a table on them, ticket and moderation queues, file browsers, activity feeds — and for "we need a bulk action", "how should sorting work", "this table is unusable on mobile", "operators can't find anything", "the list jumps while I'm clicking", "should this open a modal", "it has to work with no signal", or "the photos never uploaded". Distinct from `friction-and-flow`, which owns completing one task or one form, and from `attention-and-hierarchy`, which owns where the eye lands on a composed screen: this skill owns what the list *does* — what sits at the top, what a row does when clicked, and what happens when someone selects four thousand records. Reach for it the moment a design contains a repeating row, even when the request arrives phrased as a styling question.
---

# List and queue design

The list is the most-used screen in most products and the least designed. It gets a data grid dropped into it, `ORDER BY
created_at DESC` because that index already existed, fifty rows a page, and eleven columns because eleven fields came back
from the API. Then an operations admin opens it four hundred times a day for three years.

What goes wrong is not visual. Nobody decided what the screen is *for*: what the reader is looking for, what belongs at the
top, what happens when they act on a row, what the tool does when data moves under them. Those decisions are cheap to make
deliberately and brutal to retrofit, because by then every bookmark, every trained habit and every downstream report depends
on the accident.

## When this is the right skill

- Anything rendering records as repeating rows: table, data grid, list view, inbox, work queue, search results, audit log,
  file browser, admin index.
- "Operators can't find anything", "we need bulk actions", "this table is unusable on mobile", "the list moves while I'm
  clicking", "why does it forget my filters".
- Choosing between a modal, a drawer and a full page for a row action, or between pagination, load-more and infinite scroll.
  A queue that will not drain, or two people working the same item.
- A queue worked on a phone with no signal — rows claimed, completed and photographed offline and synced later (move 13 and
  `references/queue-patterns.md` §8).

Go elsewhere when: the table gets **printed or exported to PDF** — a fixed page has no scroll, so column
priority and page-break behaviour are decided differently → `print-and-physical-artefacts`. the question is **one form or one task** → `friction-and-flow`, which owns cognitive load, field-level
form design, the perceived-performance thresholds, and undo-over-confirmation as a general principle; this skill owns how
those apply to many rows at once. **How a row or control is styled per state** → `ui-signifiers-and-states`. **Where the eye
lands** → `attention-and-hierarchy`. **Padding values** → `spacing-and-layout`; this skill owns the density *modes*, that one
owns the numbers inside them. **The moment someone commits** → `decision-screen-design`; a list is upstream of it.
**Measurement** → `behavioral-metrics`.

## Decide first

1. **Is this a list or a queue?** A list is *browsed* and never finished — a customer directory, an audit log. A queue is
   meant to be *emptied* — moderation, support, dispatch, exceptions, approvals. That one difference changes sorting,
   pagination, empty states and what success means: a list succeeds when the reader finds the thing, a queue succeeds when it
   drains. Most teams build a list when the user needed a queue, and **the tell is that the user has to remember where they
   got to.** If the operator keeps a note of the last ID they processed, you shipped the wrong one.
2. **Who reads it, how often, and do they know the data?** Someone who opens this forty times a day needs density, keyboard
   paths and a stable default sort — they navigate by learned position, so moving things is a cost. An occasional visitor
   needs labels, scannability and generous targets. Opposite designs; a persisted density toggle is the honest way to serve
   both.
3. **How many rows at p95, not in your seed data?** ~20–200: render them all, client-side sort and filter, `Ctrl+F` works,
   everything below is over-engineering. ~1k–50k: server-side sort, filter and pagination become mandatory and search stops
   being optional, because scrolling is no longer a strategy. ~100k+: cursor pagination (move 8), virtualised rows, and
   expose *only* sorts you hold an index for or a column header becomes a table scan — and decide whether an approximate
   total labelled as approximate is acceptable before someone builds a slow exact one.
4. **Is the data changing under the reader?** A queue that reorders mid-click is the most infuriating pattern in operations
   software and it causes real errors — the operator actions the record that slid into position. Decide the stability policy
   (move 9) before building; retrofitting means rewriting the fetch layer.
5. **What is the one question the reader opens this screen to answer?** "What might not get done today?" "Who is waiting
   longest?" The default sort, the default filter and the first column all follow from that sentence. If you cannot write it,
   you will ship `created_at DESC` and make the answer the user's job.

### The ops-tool framing

Most lists live in assigned-use software (`ux-psychology`'s *professional daily tool* and *assigned tool* archetypes). The
reader did not choose this and cannot leave, which changes the work:

- **Absence of drop-off is not evidence of quality.** Nobody abandons a task their employer assigned; they finish it while
  resenting it, then rebuild your table in a spreadsheet. *Full-dataset exports are your real churn metric* — a spike means
  the tool cannot answer a question people need answered.
- **The measures are task-completion time, error rate, rework rate, and the age of the oldest unhandled item.** Not sessions,
  not DAU; time-in-app is a *failure* metric here. `behavioral-metrics` owns defining and instrumenting them — do not invent
  queue-health metrics on this page.
- **Engagement mechanics read as condescension**: no streak for clearing a queue, no confetti on the 400th row, no tour for
  someone in month nine. **Interaction cost compounds into payroll**: 200ms and one extra click, times 400 rows a day, times
  a team — the one context where shaving a keystroke has a defensible ROI.
- **Design for expertise, not first contact.** They will see this ten thousand times, so stable positions and learned
  shortcuts beat discoverability after week one — but week one still needs a labelled path, because there is turnover.
- **Watch your best operator, not a new user.** The senior person already invented the workaround, and the workaround is a
  specification for what the tool is missing.

## The moves

### 1. The default sort and the default filter are the product's opinion

What sits at the top when someone opens the screen with no query is the most consequential decision on the page, and it is
almost always made by accident — by whichever column had an index.

**"Newest first" is right for an activity feed and wrong for a work queue.** On a queue `created_at DESC` is a LIFO service
discipline: it buries the oldest unhandled item under everything that arrived since, which is exactly the item closest to
breaching. The right default is *most urgent*, failing that *oldest unhandled*. Urgency is rarely a column you already have —
compute it, because a sort the reader must mentally assemble from three columns is a sort they will get wrong.

```sql
ORDER BY CASE WHEN status = 'blocked' THEN 0                          -- needs a human now
              WHEN scheduled_at < now() THEN 1                        -- overdue
              WHEN scheduled_at < now() + '2h'::interval THEN 2       -- imminent
              ELSE 3 END,
         scheduled_at ASC NULLS LAST,
         id ASC;                                                      -- stability
```

- **A secondary sort is not optional.** Sorting on a non-unique column leaves ties in whatever order the engine felt like,
  which differs between loads and between pages — the symptom is rows shuffling on refresh, or one row appearing on both page
  2 and page 3. Append the primary key to every sort; it is also what makes cursor pagination possible (move 8).
- **Handle nulls explicitly, because databases disagree.** PostgreSQL treats NULL as larger than any non-null value, so `ASC`
  puts nulls last and `DESC` puts them first: flip the direction and every unscheduled row teleports from the bottom of the
  list to the top. MySQL does the opposite. Write the placement rather than inheriting a default nobody chose — `NULLS LAST`
  on PostgreSQL, Oracle and SQLite; MySQL has no such clause, so spell it as a leading key: `ORDER BY scheduled_at IS NULL,
  scheduled_at` (works for every type; the `-col DESC` trick only works for numerics and gives up the index).
- **Make the active sort visible** — an implicit sort is a fact the reader must infer from the data. The header is both
  control and indicator: a glyph, plus `aria-sort="ascending"` on that header cell. Per the ARIA table pattern it belongs on
  the sorted column's header, and only one header carries a value other than `none` at a time, so move it when the sort moves.
- **The default filter is the same decision with even less thought behind it.** A queue's default is almost always *mine, and
  not done*. An unfiltered all-time list means every operator filters by hand every morning and the ones who forget work the
  wrong records. Show the default as removable chips (move 7) — a silent default filter is how someone concludes records are
  missing.

### 2. The row-action decision tree

| Interaction | Use when | Because |
|---|---|---|
| **Inline edit in the cell** | One field, known value set, low stakes, reversible — status, assignee, a flag | Zero navigation; the operator stays in the scan. Commit on change, undo on the toast |
| **Side drawer** | Two to five fields, or review-and-act: read the detail, decide, act | The list stays visible so the operator works *down* it. The default for a queue, and the most under-used pattern in the set |
| **Full page** | Multi-step, needs its own URL, has sub-tabs, is linked from email or a ticket | Deserves history, deep links, native back |
| **Modal** | Almost never | It covers the list. The moment the user needs a value from a row to decide, they must cancel and lose their work |

The modal rule is not aesthetic: a modal over a list bets that the list holds nothing the user needs mid-decision, and on an
ops screen that bet loses constantly — "is anyone else assigned to Building 12 today?" is answerable in a drawer and requires
abandoning a modal. **A drawer needs the parts people forget**: a URL (`?visit=8842`) so back works and the view is shareable;
focus moved in on open and returned to the originating row on close; `Escape` to close; and **previous/next inside the
drawer**, so the operator works the queue from within it instead of bouncing back for every item — often the largest single
speed win on the screen.

**The whole-row-clickable problem.** Making the row a link and putting buttons in it is invalid: the content model of `<a>` is
"Transparent, but there must be no interactive content descendant, `a` element descendant, or descendant with the `tabindex`
attribute specified." Browsers and screen readers handle the violation inconsistently and the nested control often becomes
unreachable. Two patterns work. **A — stretched link** works on `<li>` and grid rows, swallows text selection, and is broken
on `<tr>` in every stable Safari — a relatively positioned table row is not a containing block there, so every row's overlay
covers the whole table and the last row wins every click. Use B in an ops tool; the per-cell workaround, if you must ship A
on a table, is in `references/tables-accessibility-and-responsive.md` §1.

**B — real link plus a guarded row handler.** Preferred for ops tools, because selection survives.

```jsx
<tr onClick={(e) => {
  if (e.target.closest("a, button, input, [role=button]")) return;  // let controls act
  if (window.getSelection()?.toString()) return;                    // don't hijack a text drag
  openDrawer(row.id);
}}>
  <td><a href={`/visits/${row.id}`}>{row.title}</a></td>            {/* the keyboard and AT path */}
  <td className="row-actions"><button>Reassign</button></td>
</tr>
```

The handler is a pointer convenience; the link is what keyboard, screen readers, middle-click and open-in-new-tab use. **A
bare `onClick` on `<tr>` with no link inside is the broken version**, and the most common accessibility defect on this screen.

### 3. Column discipline

**A column earns its place if the reader scans down it or sorts by it.** That is the test; "someone might want to know" is a
drawer field. Every column costs scannability in all the others, because each is a competing vertical channel
(`attention-and-hierarchy` owns the mechanism). Order: identifier, status, the thing the reader's question depends on, then
whatever survives. Six is a good target for a queue; past eight you are building a spreadsheet, and the honest move is to ship
an export instead of pretending.

- **IDs are rarely a column.** The name is the identifier; put the reference as secondary text in the same cell.
- **Numerics right-aligned with `font-variant-numeric: tabular-nums`,** so digit places line up and a refresh does not shuffle
  the column sideways (`typography-system` owns figure styles). Text left; centre almost nothing.
- **Dates: relative for recency, absolute for comparison.** "3 days overdue" answers a queue's question, "12 Aug" answers an
  audit's — ship both, visible relative with the absolute in `<time datetime="…">`, and never render a raw ISO string.
- **Truncation needs a real fallback, and `title` is not one** — tooltips do not exist on touch and are unreliably announced
  (`ui-signifiers-and-states` move 10). Never truncate the identifier; wrap it to two lines. Truncate only supporting text and
  put the full value in the drawer. Ellipsis also needs `min-width: 0` on a flex or grid cell or it silently does nothing.
- **Freeze column widths so they do not reflow as data loads** — `table-layout: fixed` with explicit `<col>` widths, or a grid
  with fixed tracks. Under `auto` layout the browser re-measures on every data change, so skeletons and real rows produce
  different widths and the header jumps at load, which is why move 12's skeletons only work if you do this. **Set the width
  per locale, from the longest supported label rather than the English one**, in `ch` or `rem` so it tracks the type:
  "Awaiting approval" becomes "În așteptarea aprobării", and a track measured on English clips the translation or wraps it
  into a header twice as tall as its neighbours. Wrap header labels, never truncate them. Fixed widths and long translations
  only conflict when the width came from English — `persuasive-copy/references/localisation-and-register.md` has the
  expansion rules and what may be truncated at all.
- **Sticky header, plus a sticky identifying first column** where horizontal scroll is unavoidable. Apply `position: sticky` to
  the `<th>` cells rather than `<thead>`: sticky on `<thead>`/`<tr>` only became interoperable with Chrome 91 and Safari 14
  (2021), while cell-level sticky works everywhere. The corner cell is the one everyone forgets — the header above the
  identity column pins in both axes and must outrank both, or scrolling right leaves the pinned column headerless. And a
  pinned header hides the row the keyboard just focused, which is a real WCAG 2.2 SC 2.4.11 failure: offset the scroll with
  `scroll-padding` on the container and `scroll-margin` on the focusable controls, sized from the same token as the header.
  The CSS block, the `border-collapse` trap, the z-index matrix and what the offsets do *not* settle (a bulk bar that appears
  on selection, 400% zoom) are in `references/tables-accessibility-and-responsive.md` §5 and §7. Test by tabbing down a long
  table with the header pinned.

### 4. Density modes

Density is not a taste argument settled once by whoever built the screen. Ship both modes and persist the choice **per user,
server-side** — not per session or per device, or the operator re-picks it every Monday.

| Mode | Row height floor | Text | Rows in 720px of list |
|---|---|---|---|
| Comfortable — default for occasional readers | 48px | 14px / 20px | 15 |
| Compact — default for someone who lives here | 32px | 13px / 18px | 22 |

That last column is the whole argument: compact shows half again as many rows per screen (22 against 15), which is about a
third fewer scroll-and-reorient cycles a day. It costs target size, scan comfort under fatigue, and tolerance for long values.
The padding that goes with each mode belongs to `spacing-and-layout` — `spacing-and-layout/references/spacing-tokens.md` has a
Tables block; take the numbers from there rather than inventing a second set here.

**Row density is its own axis, and it is not the page density preset.** `spacing-and-layout` owns
`[data-density="editorial"|"default"|"compact"]` on the root element, which sets the whole surface's gaps, type scale and
control heights. This skill's `[data-row-density="comfortable"|"compact"]` sets row height inside one table. They are
independent on purpose: a comfortable table inside a dense-tool page is a legitimate, common combination — the supervisor who
lives in a console still wants readable rows in the one table she works from — and so is a compact table on an otherwise
editorial page. Keep them on different attributes and different elements, or the row toggle silently rewrites the page
preset, `comfortable` matches no page preset at all, and the operator's density choice starts moving the page's gutters.

**Compact still has a floor, and it is an accessibility floor.** WCAG 2.2 SC 2.5.8 Target Size (Minimum, AA) wants pointer
targets of at least 24×24 CSS px; its spacing exception passes a smaller target only if a 24px-diameter circle centred on each
undersized target does not intersect another's — and row actions sit adjacent by definition, so that exception rarely rescues
a dense row. **32px is the compact floor for any row containing a control** (24×24 icon button, 4px above and below); a
read-only row can reach 28px. Do not buy rows by shrinking text below 13px — shrink padding first, then drop a column.

```css
[data-row-density="comfortable"] { --row-h: 48px; --row-size: 0.875rem;  --row-line: 1.43; }
[data-row-density="compact"]     { --row-h: 32px; --row-size: 0.8125rem; --row-line: 1.38; }
td, th { height: var(--row-h);                                  /* on a cell, height is a floor — see below */
         padding: var(--cell-pad-y, 12px) var(--cell-pad-x, 16px);  /* values: spacing-and-layout/
                                                                    references/spacing-tokens.md, Tables */
         font-size: var(--row-size); line-height: var(--row-line); }
```

Two traps in that block. **Keep font-size and line-height as longhands.** `font: var(--row-font)` with `--row-font:
0.875rem/1.43` is invalid and silently drops: the `font` shorthand requires a `<font-family>`, and a `var()` substitution
that produces an invalid shorthand is invalid at computed-value time — which unsets every longhand the shorthand covers,
family and weight included. You get a worse result than writing nothing. If you want the shorthand it must carry a family.

**In table markup use `height`, not `min-height`.** CSS 2.1 leaves the effect of `min-height` on table cells, rows and row
groups explicitly undefined, and browsers do not grow a row to satisfy it — the density floor just never applies. A table
cell's `height` is not a cap: §17.5.3 makes the row height the maximum of the row's height, each cell's height, and the
minimum height the content needs, so a row still grows under the SC 1.4.12 text-spacing overrides. Outside table markup the
rule inverts — on a flex or grid row, `min-height`, never `height`, because there a fixed height does clip.

### 5. Three empty states, and never conflate them

`ui-signifiers-and-states` move 9 owns the view-state union that forces you to handle each; this move owns what a *list* must
say in each. The bug behind all of them is the same: `rows.length === 0` is the only condition anyone checks.

| State | What actually happened | What it must do |
|---|---|---|
| **Never-had-any** | Zero records exist | Teach what a row is and why it matters; offer the create action as primary. `onboarding-activation` owns this copy |
| **Filtered to nothing** | Records exist; filters excluded them all | Name every active filter, offer to remove each and clear all, keep the filter UI on screen, state the unfiltered count: "0 of 1,284 visits match" |
| **Failed to load** | The request errored | Say what failed, offer a retry scoped to the list. **Never render an error as an empty list** — it reads as "no work exists", a silent data-loss bug |
| **Drained** (queues only) | Records exist; none are yours to do — and, where rows carry evidence, nothing is still in the outbox (move 13) | Say so, with the count cleared and when the next arrives |

**Filtered-to-nothing is the one everyone gets wrong**, and specifically: a cheerful onboarding illustration reading "Create
your first visit!" shown to someone who typed *Buiding B*. They now believe their data is gone, and the next thing they do is
file a bug or re-enter records that already exist.

```jsx
if (error)                             return <ListError error={error} onRetry={refetch} />;
if (!rows.length && hasActiveFilters)  return <NoMatches filters={active} total={unfilteredCount} onClear={clearAll} />;
if (!rows.length && everCreated === 0) return <FirstRun onCreate={create} />;
if (!rows.length)                      return <Drained clearedToday={done} nextAt={nextArrival} />;
```

Note what that needs: an *unfiltered* count and a *total-ever* count, both fetched. Teams skip these states because they
skipped the two extra numbers. And **drained deserves celebrating, not blanking**: "You're all caught up — 47 visits cleared,
next batch at 06:00" is the only moment in the day the tool says the operator is finished, and what builds the belief that it
respects their time rather than generating infinite work. It is not a variable-reward mechanic and must not become one — it is
an accurate completion signal, which is the honest version. Offer the obviously useful next thing rather than a dead end.

### 6. Selection and bulk actions

**The critical distinction: select-all-on-page versus select-all-matching-the-filter.** These look identical and differ by four
thousand records. The header checkbox selects the *page* — that is what the user can see, so that is what it must mean.
Selecting everything matching is a separate, explicit, counted act, offered by an interstitial once the page is fully selected:

```
[✓] 50 visits on this page are selected.  [ Select all 4,218 visits matching these filters ]   Clear
```

Nobody deletes four thousand rows by accident from that; plenty do from a header checkbox that silently meant "everything".

- **The header checkbox is tri-state** — some-but-not-all is `indeterminate` on a native input or `aria-checked="mixed"` on a
  custom one, never unchecked, which lies.
- **State the true count in the action label**: "Delete 47 visits", never "Delete"; "Reassign 4,218 visits", never "Reassign
  selected". The count is the last cheap chance to notice the scope is wrong.
- **Keep the selection visible while scrolled** — a sticky action bar anchored to the list carrying the count and the actions,
  not a toolbar four hundred rows above the viewport. Pad the scroll container so it cannot obscure a focused row (2.4.11).
- **Clear the selection when the filter changes, and say so.** Otherwise it accumulates rows that are no longer on screen and
  the operator acts on records they cannot see. "Selection cleared because the filter changed" prevents a class of incident.
- **Partial failure is the normal case, and one banner is a lie.** A bulk action over N rows is N operations; some fail on
  permissions, locks or already-changed state. Report per row: *"44 of 47 visits archived. 3 failed — 2 already archived, 1
  locked by Sara Nkemi. [Retry the 3] [Show only failed]"*. "Show only failed" re-selects exactly the failures so the operator
  acts on them without reconstructing the set by hand. Past ~10 seconds, run it as a server-side job the user can walk away
  from, reporting somewhere durable — a toast that expires while they are on another screen is not a result.
- **Undo over confirmation, scaled to blast radius.** `friction-and-flow` move 9 owns the principle; two things change in bulk.
  An undo for 47 rows must restore all 47 or name precisely which it could not — a partial undo that promised a full one is
  worse than none. And for the irreversible cases, put the count and scope in the dialog *body*, not just the title, and give a
  real deadline instead of an "are you sure": "Deleted permanently after 30 days" is a genuine safety net, a
  reflexively-dismissed dialog is not. Past a threshold you pick, require typing the count or the resource name.

### 7. Filter, search and sort are three different tools

They get built as one control and then none of them works. **Filter** reduces by a known attribute with a known value set; the
reader knows the vocabulary. Faceted, with counts. **Search** reduces by a string when the reader knows what they want but not
where it is: debounce ~200ms, never steal focus, and say what it searched — "matching name, address or reference". **Sort**
reorders without reducing; a screen that only sorts makes the reader do the filtering with their eyes, which is the "operators
can't find anything" complaint almost every time.

- **Facet counts computed against the other active filters** tell the reader where the work is before they click: `Overdue
  (312) · Due today (88) · Scheduled (1,204)`. A zero facet stays visible and disabled rather than disappearing; hiding it
  makes the reader conclude the option does not exist.
- **Filter chips make active state visible and individually removable.** Every active filter — including defaults you applied
  for them — gets a chip with its value and its own remove control, plus one "Clear all". Without chips the state hides in a
  collapsed panel and the reader concludes records are missing.
- **Filter state belongs in the URL**: `?status=overdue&building=b12&sort=-scheduled_at&cursor=…` is shareable, bookmarkable,
  reloadable and back-button-survivable. Use `replaceState` while the user types so back does not step through fourteen
  keystrokes, `pushState` on a committed change.
- **Losing filter state on navigating into a row and back is a recurring complaint about internal tools**, and it is
  a one-line bug: the detail navigation pushed a URL that dropped the query string. Fix it by making the detail a *parameter of
  the list URL* (`…&visit=8842`, which move 2's drawer already does), or by capturing and restoring the list URL. Test
  explicitly: filter, sort, scroll, open a row, act, go back. Everything should be exactly where it was.
- **Saved views are stored value.** A named filter + sort + column + density set turns a screen the operator reconfigures every
  morning into one that opens correct. This is `habit-loop-design`'s investment move in its most legitimate form — the tool is
  materially better for this user because of what they put in, and it costs nothing to leave (ship export). Make views
  shareable: a supervisor defining "Overdue in Zone 3" once beats twelve operators rebuilding it daily. Views do not excuse you
  from move 1; the first-time reader still gets the default.

### 8. Pagination, load-more, or infinite scroll

| Pattern | Use when | Cost |
|---|---|---|
| **Pagination with a total** | Queues; anything auditable; when the reader needs to know how much work exists; deep links matter | An exact total is expensive on large tables |
| **Load more** (cursor-backed) | Browse-y lists, unknown or huge totals, readers who rarely go deep | No sense of position or completion |
| **Infinite scroll** | Homogeneous disposable content browsed for pleasure | Everything below |

**Infinite scroll is wrong for a work queue**, structurally. It removes any sense of progress or completion, which is the
queue's entire point. It breaks the back button — return from a row and you are at the top of a list you had scrolled four
hundred rows into. It breaks deep links, because the URL never describes what is loaded. It strands the footer. It makes
`Ctrl+F` useless, because only some rows are in the DOM. And it makes "where was I" unanswerable, which is exactly the question
an interrupted operator asks. Partial rendering is also what `aria-rowcount` and `aria-rowindex` exist for: the ARIA table
pattern says that when only a subset of rows is in the DOM, set `aria-rowcount` on the table to the total — `-1` if the total
is genuinely unknown — and `aria-rowindex` on each row to its real 1-based position. The `-1` sentinel belongs to the count
only; `aria-rowindex` takes an integer of 1 or more. Without them, assistive tech announces "row 20 of 20" on a list of forty
thousand.

**Cursor versus offset is a correctness issue, not a performance one.**

```sql
… ORDER BY scheduled_at, id LIMIT 50 OFFSET 200;                                    -- wrong on changing data
… WHERE (scheduled_at, id) > (:last_scheduled_at, :last_id)
  ORDER BY scheduled_at, id LIMIT 50;                                               -- keyset: stable, constant-time
```

`OFFSET` means "skip the first 200 rows *of the set as it exists right now*". Insert three rows above the reader's position
between page 4 and page 5 and three rows they already saw come back; complete and filter out three and three rows they never
saw are skipped. In a live queue rows arrive and leave constantly, so offset pagination silently hides work — the exact failure
a queue exists to prevent. Deep offsets are slow too, because the engine still walks the skipped rows. Cursor pagination needs
the sort key to be unique, which move 1's tiebreaker gave you, and cannot jump to page 7. For a queue: cursor for the rows, a
separately fetched total for the "how much work exists" number, labelled approximate if it is.

### 9. Stability under live data

**Never reorder or remove a row under the pointer.** A row that moves between mousedown and mouseup means the operator actioned
a different record than the one they aimed at — in an ops tool, a crew sent to the wrong address, discovered hours later.
**Buffer incoming changes and let the reader choose when the ground moves**: poll or subscribe, but do not splice into the
rendered list. Hold changes behind a dismissible, non-displacing affordance pinned at the top — `↑ 3 new visits — Load` — which
moves nothing until clicked. Every mail client and trading screen does this for the same reason.

- **In-place cell updates are fine** when the row keeps its position — a status chip changing. Flash it to draw the eye; under
  `prefers-reduced-motion` keep the change and drop the flash, never the reverse.
- **Rows leaving the set should not vanish.** If someone else claims an item, dim it and tag it "Claimed by Sara" until the next
  explicit refresh. A disappearing row makes the operator think they misread, and they will go looking for it.
- **Preserve scroll position, selection, focused row, expanded rows and drawer contents across refresh.** Mostly that means
  keying rows on stable IDs (`key={row.id}`, never the array index) so a refetch patches the list instead of remounting it.
- **If a row the user has open was updated elsewhere, say so** — a non-destructive banner in the drawer: "Sara changed the
  status 20 seconds ago. [Reload] [Keep my edits]". Silently overwriting their draft and silently swapping values under their
  cursor are both worse than the interruption.
- **The polling interval is a product decision, not a default.** Match it to how fast work actually arrives, and back off when
  the tab is hidden (`document.visibilityState`).

### 10. Keyboard paths, because this is someone's whole day

Every mouse round-trip is charged four hundred times a day.

| Key | Action |
|---|---|
| `↓`/`j`, `↑`/`k` | Move the focused row |
| `Enter` (or `o`) / `Escape` | Open the focused row / close the drawer and return focus to the originating row |
| `Space` | Toggle selection of the focused row (`preventDefault`, or the page scrolls) |
| `Shift + ↑/↓`, `Shift + click` | Extend selection from the anchor |
| `Ctrl/Cmd + A` | Select all on the page (per the ARIA grid pattern) |
| `/`, `?` | Focus search; open the shortcut list |
| One documented letter | The primary action — `e` archive, `r` resolve, `x` select |

**Make the list one tab stop, not three hundred.** The ARIA grid pattern is explicit that only one focusable element inside a
grid sits in the page tab sequence; arrows move within it (roving `tabindex`), and its own stated rationale is that converting
a table full of interactive widgets to a grid shortens that sequence. Use `role="grid"` when the table is an interactive widget
with focusable cells; keep a plain `<table>` with a real link per row when it is static content — adding grid semantics to a
table whose rows merely link somewhere means owing the whole keyboard contract.

**The detail everyone misses: after actioning a row, move focus to the next row — never to `document.body`.** Archive an item,
focus falls to the top of the page, and the operator re-navigates to their position after every single item. That is what makes
a queue exhausting to work, and it is a five-line fix: capture the index before removal, focus the row now at that index, fall
back to the new last row, and focus the empty state's heading if the list is now empty. Announce the outcome in a
`role="status"` region too — a vanishing row is silent to a screen reader
(`ui-signifiers-and-states/references/announcing-state.md`).

**Single-character shortcuts carry a WCAG requirement.** SC 2.1.4 Character Key Shortcuts (A): a shortcut using only letter,
punctuation, number or symbol characters must be turn-off-able, remappable, or active only when the relevant component has
focus. `j`/`k`/`x` bound globally to `document` fails it and breaks speech input. Scope them to the list or make them
configurable — and make them discoverable, with a `?` overlay and the shortcut printed next to its label in the row's action
menu. An undiscoverable shortcut is a hidden affordance only its author uses.

### 11. Queue semantics specifically

**Claiming.** Two operators on one item is wasted labour and sometimes a duplicated real-world action. Claim on *open*, not on
first edit — opening is the intent signal. It must be atomic, or two people who click in the same second both get it:

```sql
UPDATE visits SET claimed_by = :me, claimed_at = now()
WHERE id = :id AND (claimed_by IS NULL OR claimed_at < now() - interval '30 minutes')
RETURNING *;              -- zero rows means someone else has it: say so, do not fail silently
```

- **Claim expiry.** An operator closes their laptop and the item is theirs forever; do that a hundred times and the queue
  quietly leaks. Set a TTL matched to how long the task really takes, heartbeat it while the drawer is open, and warn the
  holder before it lapses rather than yanking it mid-edit.
- **"Done" must be explicit, never inferred.** "The operator looked at it" is not "handled". Inferred completion empties a queue
  without the work happening and leaves no audit trail. Every terminal state records who and when.
- **You need a not-done terminal state** — blocked / needs-info / not-actionable, with a reason. Without one, an item that
  cannot be completed stays claimed forever, and that is how a queue dies: the count stops falling and everyone stops trusting
  it.
- **Queue health is measured, not felt** — age of the oldest unhandled item, arrival versus completion rate, time to first
  touch, breach count. `behavioral-metrics` owns defining and instrumenting these; the point here is only that the success
  metric is drain, not engagement.

Assignment strategies, priority ageing, per-operator WIP limits, SLA and breach handling, retry and dead-letter states,
skip-locked claiming, and **working offline — the outbox, device-generated idempotency keys, claiming a route without a
network, conflict resolution and visible sync state** — are in `references/queue-patterns.md`.

### 12. Perceived performance and loading

`friction-and-flow/references/perceived-performance.md` owns the thresholds — when a loader may appear, its minimum lifetime,
when optimistic updates are safe. Four things are list-specific.

- **Skeleton rows must preserve column widths**, or the header snaps sideways when real data lands — which only works if move
  3's widths are fixed. Render as many skeletons as the page size so scroll height does not jump either.
- **Keep the previous page visible while the next loads.** Flashing to empty destroys context and makes a 300ms request feel
  like a failure. Dim rows to ~60%, set `aria-busy="true"` on the list region, keep header, filters and pagination live.
- **Optimistic row updates** are safe for the usual class — status toggles, assignment, mark-as-read, archive-with-undo — with
  one list-specific trap: **if the mutation changes the row's position under the current sort, do not apply it
  optimistically.** Marking an item done under a "done last" sort makes it leap across the viewport before the server agreed.
  Mark it in place and let it move on the next explicit refresh (move 9).
- **Prefetch on intent** — fetch the next page when the reader scrolls within a viewport of the bottom, or hovers "Next".
  Cheaper than any loading treatment, because there is nothing to indicate.

### 13. When the row's evidence is a photo or a file

Queues whose completion requires an artefact — a photo of the finished work, a signature, a scanned document — carry a second
state machine per row, and `has_photo: boolean` is the bug that hides it. The file is captured on a device that may have no
signal, so the row can be *done* and the evidence not yet anywhere you can read it.

| Row shows | Means | What it must not do |
|---|---|---|
| **Proof required** | Nothing captured yet | Read as an error before the visit has happened |
| **Saved on device** | Captured, queued, not uploaded | Look identical to uploaded — it is the false affordance that costs a repeat visit |
| **Uploading** | In flight, with a determinate share for anything over a few seconds | Block the row's completion |
| **Synced** | The server has acknowledged it | Appear before that acknowledgement — never claim storage you have not confirmed |
| **Retrying** | Failed, backing off, attempt *n* | Retry silently forever, with no visible count and no manual control |
| **Rejected** | The server refused it — too dark, too large, wrong type, duplicate | Collapse into "upload failed"; name the cause and the fix |

- **A word plus an icon, never colour alone** (SC 1.4.1), and announce transitions politely in the list's `role="status"`
  region. The capture control's own rest/hover/loading/disabled/error styling is `ui-signifiers-and-states` move 7 and
  `ui-signifiers-and-states/references/component-state-tables.md` — take those values rather than inventing a second set here.
- **Completion commits without the file.** Reference the attachment by a client-generated id and let "done" record while the
  4 MB photo climbs one bar of signal; blocking the state transition on the upload means the work is not recorded at all. The
  outbox, the device-generated idempotency key that survives a lost response, and conflict handling are in
  `references/queue-patterns.md` §8.
- **Retry is automatic with backoff *and* manually available per row**, because the person who can act on the failure is
  standing in the stairwell, not watching a dashboard. Pair it with the global "N actions waiting to sync · last synced 14:02".
- **Make it filterable and countable.** "Done, proof missing" is a real work state and needs a facet, or nobody finds the
  forty visits whose evidence never landed. If the product's promise is the evidence, **drained is not "no rows left" but "no
  rows left and the outbox is empty"** — say so in the empty state rather than congratulating someone whose morning is still
  on their phone.
- **Bulk actions stop at the device boundary.** "Mark 40 done" cannot manufacture forty photos; either exclude items whose
  proof is missing from the action or state the count that will complete without evidence.

## Worked example: cleaning visits

**Before** — eleven columns: ID, Building, Unit, Worker, Status, Scheduled, Created, Updated, Photo, Notes, Actions. Sorted
`created_at DESC`, no default filter, 50 rows a page on offset pagination. The whole row opens a modal that also contains a
Delete button. One empty state: "No visits yet — add your first visit!". A supervisor manages 1,200 visits a week across 40
buildings and starts every morning by sorting on Scheduled and scrolling for red text. **The question the screen exists to
answer:** *which of today's visits are at risk of not happening?* It is a queue — she wants it empty by 10am — and the tell was
already there: she keeps a note of where she got to.

| Decision | Before | After |
|---|---|---|
| Default filter | none | `date = today AND status ≠ completed`, scoped to her buildings, shown as removable chips |
| Default sort | `created_at DESC` | `risk_bucket, scheduled_at ASC NULLS LAST, id` — blocked → overdue → imminent → later |
| Columns | 11 | 6: **Visit** (building, unit, ref as secondary text) · **Status** · **Worker** · **Scheduled** ("40m overdue", absolute in `<time>`) · **Proof** (icon + text) · **Actions** |
| Moved to the drawer | — | Created, Updated, Notes (count badge stays in the row), full address, history |
| Row click | Modal | Drawer at `…&visit=8842` with prev/next; building name is a real link; Reassign and Mark done are real buttons the row handler steps around |
| Pagination | Offset, 50/page | Cursor, 50/page, plus a separately fetched total: "312 visits at risk" |
| Bulk | Header checkbox = everything, "Reassign" | Header checkbox = the page; interstitial offering all 312; label reads "Reassign 312 visits"; per-row failure summary |
| Empty states | One | Four: first-run · "0 of 1,284 visits match — Building: B12, Status: Overdue [Clear]" · load failure with retry · "All caught up — 47 cleared, next batch 06:00" |
| Keyboard | none | `j`/`k`, `Enter`, `Escape`, `Space`, `e` = mark done; focus lands on the next row after every action |
| Density | fixed 44px | Comfortable 48px for her; compact 32px persisted for the dispatcher who lives in it |
| Proof | `has_photo` tick | Six states in one cell — required · saved on device · uploading · synced · retrying · rejected — plus a "done, proof missing" facet |

The change that moved the day was not the column cull. It was the default sort plus the drawer's next control: she now opens
the screen already looking at the most at-risk visit and works down without returning to the list, and the note about where she
got to is no longer necessary.

## Anti-patterns

- **`created_at DESC` on a work queue.** LIFO service: the oldest unhandled item is buried under everything that arrived since,
  and that is the one about to breach. Its cousin: **a sort with no unique tiebreaker**, so rows shuffle between loads and
  appear on two pages at once.
- **Offset pagination over live data.** Silently duplicates rows already seen and skips rows never seen.
- **Infinite scroll on a queue.** No completion, no deep links, no back button, no footer, no `Ctrl+F`.
- **Rows that reorder or vanish under the pointer.** The operator actions the wrong record and may never find out.
- **`onClick` on `<tr>` with no link inside**, and its opposite, **a row that is a link with buttons nested inside it** —
  invalid per the `<a>` content model, and it usually makes the nested control unreachable.
- **A modal for a row action.** It hides the list at the exact moment the list is needed to decide.
- **One empty state for "nothing exists" and "your filter matched nothing".** A cheerful onboarding illustration shown to
  someone who mistyped a search, who now believes their data is gone. Worse: **an error rendered as zero rows**, which reads as
  "no work to do" — the most expensive possible lie on a queue.
- **A header checkbox that means "all 4,218 matching" rather than "these 50"**; **"Delete" with no count in the label**; and a
  selection that survives a filter change.
- **One green banner after a partial bulk failure.** Three records did not archive and nobody finds out until an audit.
- **Filter state that lives only in component state.** Not shareable, not bookmarkable, gone on back — and losing it when the
  operator opens a row is a complaint you will hear for as long as the tool ships.
- **Focus falling to the top of the page after every row action.** Re-navigate to your position, four hundred times a day.
- **Global single-letter shortcuts with no way to disable them** (SC 2.1.4), which also break speech input.
- **A density argument settled once by whoever built it.** Ship both modes and persist the choice. Its neighbour: **a row
  density toggle that writes the page's `data-density` preset**, so choosing compact rows also shrinks the page gutters.
- **`has_photo: boolean`.** A photo sitting in a phone's outbox rendered exactly like one the server has acknowledged — the
  cheapest possible way to lose the evidence a proof-of-work product exists to produce.
- **Truncating the identifier with only a `title` tooltip as fallback.** Invisible on touch, unreliably announced.
- **Eleven columns because eleven fields came back from the API.**

## Ship checklist

Run against the screen or the diff. One assertion per box, so a partial pass is recordable.

**Purpose**
- [ ] The PR states in one sentence the question this screen answers.
- [ ] The default sort and the default filter are derivable from that sentence.
- [ ] The screen is labelled list or queue, and pagination matches it — cursor plus a total for a queue, load-more for a
      browse-y list.
- [ ] The success metric matches the same choice: drain for a queue, found-it for a list.

**Sort and filter**
- [ ] Every sort ends in a unique tiebreaker.
- [ ] Null ordering is written explicitly, not inherited from the engine.
- [ ] The active sort is visible, with `aria-sort` on exactly one header cell.
- [ ] Default filters appear as removable chips.

**Columns**
- [ ] Every column passes the one-glance test — scanned down or sorted by.
- [ ] Numerics are right-aligned with `tabular-nums`.
- [ ] Column widths are fixed, so nothing reflows as data loads.
- [ ] Those widths are sized from the longest supported label in every shipped locale, not the English one.
- [ ] A sticky header cannot leave a focused row entirely obscured (2.4.11), checked at 100% and 400% zoom.

**Rows**
- [ ] The row's primary action is a real `<a>` or `<button>`.
- [ ] Nothing interactive is nested inside a link.
- [ ] Row detail opens in a drawer with its own URL, focus moved in and returned, `Escape`, and prev/next.
- [ ] Density is a persisted per-user preference.
- [ ] The density toggle writes `data-row-density`, never the page's density preset.
- [ ] Compact rows containing controls are ≥32px.
- [ ] In-row targets meet 24×24 CSS px (2.5.8) rather than leaning on the spacing exception.

**Empty and error states**
- [ ] All four empty states exist and are distinguishable in code.
- [ ] "0 of N match" names every active filter and offers to clear each.
- [ ] An error never renders as an empty list.

**Selection and bulk**
- [ ] The header checkbox selects the page, not everything matching.
- [ ] It is tri-state when the page is partly selected.
- [ ] Selecting everything matching the filter is a separate, counted, opt-in act.
- [ ] Every bulk action label carries the true count.
- [ ] The selection stays visible while scrolled.
- [ ] The selection is cleared — with a message — when the filter changes.
- [ ] Bulk results report per-row outcomes.
- [ ] Failures can be re-selected without rebuilding the set by hand.
- [ ] Reversible bulk actions have an undo that restores everything or names what it could not.

**State, pagination and live data**
- [ ] Filter, sort, search, page and open-row state all live in the URL.
- [ ] All of it survives open-a-row-and-go-back.
- [ ] Pagination is cursor-based wherever the underlying data changes.
- [ ] New rows are buffered behind an explicit "N new — load".
- [ ] Nothing reorders or vanishes under the pointer.
- [ ] Scroll position, selection and focus survive a refresh.

**Keyboard**
- [ ] Arrows/`j`/`k`, `Enter`, `Escape`, `Space`, shift-range and one primary-action shortcut all work.
- [ ] The list is one tab stop, not three hundred.
- [ ] Single-character shortcuts are scoped to the list or disableable (2.1.4).
- [ ] Focus lands on the next row after a row is actioned.
- [ ] The outcome of that action is announced in a live region.

**Queue mechanics**
- [ ] Claiming is atomic, and claims expire.
- [ ] There is an explicit done state and an explicit not-actionable state, each recording who and when.

**Loading and evidence**
- [ ] Skeletons preserve column widths and row count.
- [ ] The previous page stays visible while the next loads.
- [ ] No optimistic update moves a row across the viewport before the server agrees.
- [ ] Captured evidence is never rendered as synced before the server acknowledges it.
- [ ] "Done, proof missing" is a state the screen can filter to, and drained accounts for the outbox.

## References

- `references/tables-accessibility-and-responsive.md` — read when writing the markup: semantic table structure, `role="grid"`
  versus `<table>`, sortable-header and selectable-row wiring, virtualisation without breaking assistive tech, and the
  responsive strategies (column priority, horizontal scroll, card-per-row) with their trade-offs. Go here the moment "this
  table is unusable on mobile" comes up.
- `references/queue-patterns.md` — read when building an actual work queue: assignment and claiming strategies, priority
  ageing, per-operator WIP limits, SLA and breach handling, retry and dead-letter states, the queue-shaped data model, and
  §8 **offline and unreliable networks** — why `navigator.onLine` lies, the outbox of intents, device-generated idempotency
  keys, pre-claiming a route for longer than the shift, conflict resolution and making sync state visible. Read §8 before
  building anything worked on a phone in a basement.

## Sources

- **WCAG 2.2** (W3C Recommendation) — 1.4.1 Use of Color (A); 1.4.10 Reflow at 320 CSS px, which excepts content requiring
  two-dimensional layout, *data tables included* (AA); 1.4.12 Text Spacing (AA); 2.1.1 Keyboard (A); 2.1.4 Character Key
  Shortcuts — turn off, remap, or active only on focus (A); 2.4.7 Focus Visible (AA); 2.4.11 Focus Not Obscured, Minimum (AA);
  2.5.8 Target Size (Minimum) — 24×24 CSS px, whose spacing exception is measured as non-intersecting 24px-diameter circles
  centred on each undersized target (AA); 4.1.2 Name, Role, Value (A).
- **W3C WAI-ARIA Authoring Practices Guide** — the Table pattern (`aria-sort` on the sorted header cell;
  `aria-rowcount`/`aria-rowindex` and `aria-colcount`/`aria-colindex` when only a subset of rows or columns is in the DOM) and
  the Grid pattern (arrow-key navigation, `Ctrl+A`, `Shift+Space`, `aria-selected` on the selected row or cell, and the rule
  that only one focusable element inside a grid is in the page tab sequence). `aria-sort` values are `ascending`, `descending`,
  `other`, `none`; MDN's guidance is one header at a time, moved when the sort moves.
- **HTML Standard** — content model of the `a` element: "Transparent, but there must be no interactive content descendant, `a`
  element descendant, or descendant with the `tabindex` attribute specified." That is why a link-wrapped row cannot contain
  buttons. **Sticky headers**: `position: sticky` on `<thead>`/`<tr>` became interoperable with Chrome 91 and Safari 14 (2021),
  while `<th>`/`<td>` works more widely; Adrian Roselli, "Fixed Table Headers" (2020), documents the failure modes.
- **CSS** — the `font` shorthand grammar requires a `<font-family>` (CSS Fonts), and a `var()` substitution yielding an invalid
  shorthand is invalid at computed-value time, unsetting every longhand it covers (CSS Variables). CSS 2.1 §10.7 leaves
  `min-height`/`max-height` on tables, table cells, rows and row groups undefined, while §17.5.3 makes a row's height the
  maximum of the row's height, each cell's height and the content's minimum — so on a cell, `height` is a floor.
  `scroll-margin` applies to the box being scrolled into view and `scroll-padding` to the scroll container, and both feed
  sequential focus navigation scrolling and `scrollIntoView()` (CSS Scroll Snap). WebKit did not treat a relatively
  positioned `<tr>` as a containing block for absolutely positioned descendants (WebKit bug 240961, fixed April 2026 and
  shipped first in Safari Technology Preview 243), so stable Safari in the field still behaves that way.
- **Data-layer facts** — PostgreSQL sorts NULL greater than any non-null value (nulls last under `ASC`, first under `DESC`),
  MySQL sorts NULL lowest; `NULLS FIRST`/`NULLS LAST` is standard SQL that MySQL does not implement, hence the `col IS NULL`
  leading key there. The cursor-versus-offset argument is a correctness one that follows from what `OFFSET` means, not a
  benchmark; the performance half is that the engine still walks the skipped rows.
- **Related skills** — `friction-and-flow` for Fitts's law, undo-over-confirmation and latency thresholds;
  `ui-signifiers-and-states` for the row and control state matrix and live-region announcements; `typography-system` for
  tabular figures; `spacing-and-layout` for the padding scale, reflow and the page density preset;
  `attention-and-hierarchy` for why each column competes; `persuasive-copy/references/localisation-and-register.md` for how
  much a translated label expands and what that does to a fixed column; `habit-loop-design` for investment and stored value;
  `behavioral-metrics` for queue health.

**Claims deliberately not made here:** no figure for how many columns a reader can scan, how much faster a compact table is to
work, or what share of operators use keyboard shortcuts. The six-column target, the row-height table and the ~200ms debounce
are tunable conventions with their reasoning attached, not findings. The row-visibility counts in move 4 are arithmetic from
the stated row heights — 720 ÷ 48 and 720 ÷ 32, before any header, filter bar or pagination chrome — not measurements, and
"most-complained-about" rankings for internal tools are not asserted anywhere here because nobody has measured one.
