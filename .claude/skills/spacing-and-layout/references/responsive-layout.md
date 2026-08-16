# Responsive layout: primitives, grid recipes, and the 320px audit

Read this when a layout has to adapt — deciding between breakpoints and container queries, building the
grid, making tables and charts survive small widths, or debugging a horizontal scrollbar. `SKILL.md` gives
the rules; this gives the working code and the audit procedure.

## 1. Breakpoint or container query? A decision table

| The thing adapting | Use | Why |
|---|---|---|
| Page gutters, max-width | Viewport (or `clamp()`, no query at all) | It is a viewport property by definition |
| Nav collapsing to a menu | Viewport | Depends on the whole screen, not a box |
| Sidebar showing / hiding | Viewport | Same |
| Number of columns in a page-level grid | Viewport, or `auto-fit` | Either is defensible |
| A card's internal layout | **Container** | The same card appears at several widths on one screen |
| A stat tile, media object, comment, list row | **Container** | Reused across contexts |
| Anything inside a resizable panel or split view | **Container** | The viewport tells you nothing |
| Font size of body text | `clamp()` with a `rem` term | Continuous, not stepped |
| Showing / hiding a whole feature | Viewport | A product decision, not a layout one |

The rule of thumb: **if the component is used in exactly one place, a media query is fine; the second reuse
site is when it becomes wrong.** Most "responsive bugs" in a mature codebase are components that were built
against the viewport and then reused in a narrower container.

### Breakpoints worth having

Fewer is better. Four covers almost everything, and they should be named for the layout change they cause,
not for devices — no device has stayed at 768px since 2012.

```css
:root { }
/* 40rem  640px  — single column ends, two-up becomes possible */
/* 48rem  768px  — sidebar can appear */
/* 64rem 1024px  — full desktop layout, multi-column */
/* 80rem 1280px  — max content width reached; only gutters grow after this */
```

Use range syntax (`@media (width >= 48rem)`), which is in every current browser and reads correctly, rather
than `min-width` with its off-by-one `max-width: 47.99rem` workarounds. Use `rem`, so breakpoints respond to
the user's font size.

**Mobile-first is a convention, not a law**, but a load-bearing one: styles outside a query are the fallback
for every context including print, email clients and old browsers, so the narrow layout should be the
unqualified one. The exception is a genuinely desktop-only tool, where writing it the other way is honest.

## 2. The primitive library, in full

```css
/* ---------- Stack: vertical flow with one rhythm ---------- */
.stack { display: grid; gap: var(--space, 1.5rem); }
/* Push one child to the bottom (footer in a card of variable height): */
.stack--split { block-size: 100%; }
.stack--split > .push-down { margin-block-start: auto; }

/* ---------- Cluster: a wrapping row of related things ---------- */
.cluster {
  display: flex; flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: center;
  justify-content: var(--justify, flex-start);
}

/* ---------- Sidebar: fixed-ish side + fluid main, wraps by itself ---------- */
.sidebar { display: flex; flex-wrap: wrap; gap: var(--space-xl); }
.sidebar > :first-child { flex: 1 1 var(--side-width, 18rem); }
.sidebar > :last-child  { flex: 999 1 var(--main-min, 30rem); min-inline-size: 0; }
/* Mechanism: main has a huge flex-grow so it takes all spare space, but a large
   flex-basis so when it cannot get --main-min the whole thing wraps. No query. */

/* ---------- Switcher: N-across above a threshold, stacked below ---------- */
.switcher { display: flex; flex-wrap: wrap; gap: var(--space-lg); }
.switcher > * { flex: 1 1 calc((var(--threshold, 40rem) - 100%) * 999); min-inline-size: 0; }
/* Mechanism: above the threshold the basis computes negative → clamped to 0 → items
   share the row. Below it, the basis is enormous → each item takes a full row. */

/* ---------- Grid: as many as fit, never narrower than the minimum ---------- */
.grid {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fit, minmax(min(var(--min-item, 18rem), 100%), 1fr));
}
/* auto-fit collapses empty tracks (last item stretches);
   auto-fill keeps them (last item keeps its column width). Pick deliberately. */

/* ---------- Center: the page container ---------- */
.center {
  box-sizing: content-box;
  max-inline-size: var(--content-max, 72rem);
  margin-inline: auto;
  padding-inline: var(--gutter);
}

/* ---------- Cover: full-height hero with a centred principal item ---------- */
.cover {
  display: grid; gap: var(--space-xl);
  min-block-size: var(--cover-h, 100svh);
  padding: var(--space-xl);
  align-content: center;
}

/* ---------- Reel: a horizontally scrolling row (use sparingly) ---------- */
.reel {
  display: flex; gap: var(--space-md);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--gutter);
  overscroll-behavior-inline: contain;
}
.reel > * { flex: 0 0 min(18rem, 80%); scroll-snap-align: start; }
```

Vocabulary from *Every Layout* (Heydon Pickering & Andy Bell). The value is that each name describes a
*relationship* that holds at every width, so a layout can be read without simulating breakpoints in your head.

**Accessibility note on `.reel`:** a horizontally scrolling region must be keyboard-scrollable. Give it
`tabindex="0"` and an accessible name (`role="group" aria-label="…"`) so keyboard users can reach and scroll
it — a scroll container that only responds to a trackpad excludes them.

## 3. Grid recipes

### Breakout / full-bleed without negative margins

```css
.layout {
  display: grid;
  grid-template-columns:
    [full-start] minmax(var(--gutter), 1fr)
    [content-start] min(100% - (var(--gutter) * 2), var(--content-max)) [content-end]
    minmax(var(--gutter), 1fr) [full-end];
}
.layout > *           { grid-column: content; }
.layout > .full-bleed { grid-column: full; }
```

Add a wide track for pull-quotes and figures that exceed the text column but not the page:

```css
.layout {
  grid-template-columns:
    [full-start] minmax(var(--gutter), 1fr)
    [wide-start] minmax(0, 8rem)
    [content-start] min(100% - (var(--gutter) * 2), var(--measure)) [content-end]
    minmax(0, 8rem) [wide-end]
    minmax(var(--gutter), 1fr) [full-end];
}
.layout > .wide { grid-column: wide; }
```

### Named-area page shell

```css
.shell {
  display: grid;
  min-block-size: 100svh;
  grid-template-areas: "header" "main" "footer";
  grid-template-rows: auto 1fr auto;
}
@media (width >= 64rem) {
  .shell {
    grid-template-areas: "header header" "nav main" "footer footer";
    grid-template-columns: 16rem 1fr;
  }
}
.shell > header { grid-area: header; }
.shell > nav    { grid-area: nav; }
.shell > main   { grid-area: main; min-inline-size: 0; }  /* critical */
.shell > footer { grid-area: footer; }
```

`min-inline-size: 0` on `main` is what stops a wide table or `<pre>` inside it from blowing out the whole
page. It is the single most common missing line in a grid shell.

### Dashboard: tiles that span, without a 12-column framework

```css
.dash {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
  grid-auto-rows: minmax(8rem, auto);
}
.dash > .wide { grid-column: span 2; }
.dash > .tall { grid-row: span 2; }

/* Stop the span from causing overflow on narrow screens. */
@media (width < 48rem) {
  .dash > .wide, .dash > .tall { grid-column: auto; grid-row: auto; }
}
```

### Equal-height rows without a framework

Grid rows are equal-height by default; flex items stretch by default. If you are reaching for a
"equal height cards" utility, you have a flex `align-items` override somewhere undoing it.

## 4. Container queries in practice

```css
/* The wrapper carries the container; the styled element is a descendant. */
.card-host { container: card / inline-size; }   /* shorthand: name / type */

.card { display: grid; gap: var(--space-md); }

@container card (width >= 24rem) {
  .card { grid-template-columns: 8rem 1fr; align-items: start; }
}
@container card (width >= 40rem) {
  .card { grid-template-columns: 12rem 1fr auto; gap: var(--space-lg); }
}
```

**Style the container itself** by putting the container on a parent, or use the `:has()` alternative when you
genuinely cannot add a wrapper. There is no self-query.

**Container units:** `cqi` (1% of inline size), `cqb` (block), `cqmin`, `cqmax`. Useful for type and padding
that should scale to the component rather than the page:

```css
.card { padding: clamp(1rem, 4cqi, 2rem); }
.card__title { font-size: clamp(1rem, 0.9rem + 1cqi, 1.5rem); }
```

**Gotchas, in the order people hit them:**

1. No wrapper → the query silently never matches.
2. `container-type: inline-size` establishes a containing block for absolutely positioned descendants and
   applies layout/style containment; an overlay that expected to escape the card will now be clipped by it.
   Put the overlay outside the container, or use a popover/dialog.
3. `container-type: size` (both axes) requires the element's block size to be independent of its contents —
   it will collapse to zero unless you set a height. `inline-size` is what you want 95% of the time.
4. Container queries do not work in `@media print` contexts the way you might hope; print styles need their
   own pass.

Support: Chrome/Edge 105 (Aug 2022), Safari 16 (Sep 2022), Firefox 110 (Feb 2023); Baseline Widely Available
in 2025. No fallback needed for evergreen targets. If you must support older, the graceful degradation is
that the base (narrow) layout applies everywhere — which is why writing the narrow case unqualified matters.

## 5. Content that does not want to reflow

WCAG 1.4.10 exempts "parts of the content which require two-dimensional layout for usage or meaning". That
exemption covers the *table*, not the page. The page must never scroll horizontally.

### Tables

```css
.table-wrap {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}
.table-wrap table { min-inline-size: 45rem; }
```

Make the scroll region keyboard-accessible and announced:

```html
<div class="table-wrap" tabindex="0" role="region" aria-labelledby="tbl-cap">
  <table aria-describedby="tbl-cap"> … </table>
</div>
```

For a small table, the better answer is to **restack into cards below the breakpoint** rather than scroll:

```css
@media (width < 40rem) {
  .stack-table thead { position: absolute; inline-size: 1px; block-size: 1px;
                       overflow: hidden; clip-path: inset(50%); }
  .stack-table tr { display: grid; gap: var(--space-2xs);
                    padding-block: var(--space-md); border-block-end: 1px solid var(--line); }
  .stack-table td { display: grid; grid-template-columns: 8rem 1fr; gap: var(--space-xs); }
  .stack-table td::before { content: attr(data-label); font-weight: 600; }
}
```

This changes the table's semantics for assistive technology (`display: grid` on rows/cells drops the table
role in some engines). If the data relationships matter, prefer the scroll container. Restacking is for
simple key/value lists that were only ever a table for convenience.

### Code blocks, long tokens, URLs

```css
pre { overflow-x: auto; }
.wrap-anywhere { overflow-wrap: anywhere; }
/* Not `word-break: break-all` — it breaks mid-word in prose. */
```

### Charts and diagrams

Set a `min-width` and scroll, or switch representation below a threshold (a sparkline instead of a full axis
chart). A chart squeezed to 300px is not accessible, it is unreadable — the data table underneath it is the
accessible version, and it should exist anyway.

## 6. Mobile viewport units and safe areas

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
/* svh: smallest viewport (browser chrome expanded) — safe for min-height, never clips.
   lvh: largest (chrome retracted) — content will be hidden behind chrome on load.
   dvh: dynamic — resizes as chrome moves; smooth, but reflows during scroll. */
.hero    { min-block-size: 100svh; }
.app     { block-size: 100dvh; }          /* app shells that must exactly fill */

.app-shell  { padding-inline: max(var(--space-md), env(safe-area-inset-left),
                                                   env(safe-area-inset-right)); }
.bottom-bar { padding-block-end: calc(var(--space-sm) + env(safe-area-inset-bottom)); }
.top-bar    { padding-block-start: calc(var(--space-sm) + env(safe-area-inset-top)); }
```

`env()` values are 0 without `viewport-fit=cover`, which is why `max()` rather than `+` is the safe form for
insets that also need a normal minimum.

Keyboard avoidance on mobile: `interactive-widget=resizes-content` in the viewport meta, plus
`scroll-margin-block-end` on inputs, keeps a focused field above the on-screen keyboard.

## 7. The 320px / 400%-zoom reflow audit

WCAG 1.4.10 asks for 320 CSS px equivalent, which on a desktop means **1280px wide at 400% zoom**. Run this
before merging any layout change.

1. **Set the viewport.** Devtools responsive mode at 320×640, *or* a 1280px window at 400% zoom. Both, if
   the layout has zoom-sensitive code.
2. **Look for the horizontal scrollbar on `<html>`.** If it exists, find the culprit:

   ```js
   // Paste in the console. Lists every element wider than the viewport.
   [...document.querySelectorAll('*')].filter(
     el => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1
   ).forEach(el => console.log(el.getBoundingClientRect().width.toFixed(0), el));
   ```

3. **Check the usual suspects, in order:** flex/grid children missing `min-width: 0`; fixed `width` in px;
   `minmax(Xrem, 1fr)` without a `min()` guard; images without `max-width: 100%`; long unbroken strings;
   absolutely positioned decoration; a `100vw` element inside a page with a scrollbar (`100vw` includes the
   scrollbar width — use `100%`).
4. **Apply the text-spacing override** (line-height 1.5, letter 0.12em, word 0.16em, paragraph 2em) *while
   still at 320px*. This is where fixed heights fail, and the two criteria compound.
5. **Tab through it.** With any sticky header or bottom bar present, confirm no focused element ends up
   entirely hidden (WCAG 2.4.11). Fix with `scroll-padding-block` on `html`, not with JavaScript scroll
   handlers.
6. **Check target sizes at this width.** Controls that were comfortable at desktop often end up adjacent and
   under 24px apart once the layout collapses to one column.
7. **Confirm nothing was hidden to pass.** `display: none` on a control at narrow widths is a 1.4.10 failure
   if it removes functionality — "without loss of information or functionality" is the operative phrase.
   Moving it into a menu is fine; deleting it is not.
