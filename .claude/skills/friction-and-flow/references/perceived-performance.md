# Perceived performance

The implementation layer under move 5 of `friction-and-flow/SKILL.md`. Read it when a screen feels slow, or
when choosing between a spinner, a skeleton, an optimistic update and a progress bar.

The framing that keeps you honest: **perceived performance work is a complement to real performance work,
never a substitute.** Every technique here buys tens or hundreds of milliseconds of *feeling*. Deleting a
waterfall request buys seconds of *fact*. Do the second one first.

## The budgets

| Threshold | Source | Meaning | Design consequence |
|---|---|---|---|
| ~100ms | Miller (1968); Nielsen (1993) | Perceived as instantaneous — the system responded rather than "is responding" | No loading state. This is the target for anything the user does with their hands: typing, dragging, toggling, hovering |
| ~400ms | Doherty & Thadani, IBM (1982) | Below this, user think-time on the *next* action drops too | Round-trip target for any tool used repeatedly. Above it you slow the human down, not just the machine |
| ~1s | Miller (1968) | Flow of thought survives; the user notices but doesn't lose the thread | No spinner needed. Anything longer needs some feedback |
| ~10s | Miller (1968) | Limit of held attention on one task | Determinate progress, permission to leave, notification on completion |

Two things people get wrong about these. First, they are **per interaction**, not per page load: a 300ms
filter toggle inside an app that took 4s to boot is still a 300ms interaction. Second, they are **not
medians**. Budget at p75/p95 on the hardware and networks your users actually have; the difference between a
flagship phone on office wifi and a three-year-old mid-range device on cellular is routinely an order of
magnitude.

## Loading-state decision table

| Expected duration | Known result shape? | Treatment |
|---|---|---|
| < ~300ms | either | Nothing. Do not show a loader — the flash makes it feel worse |
| ~0.3–1s | either | Minimal in-place signal: button enters a busy state, region dims slightly. Delay the indicator 200–500ms so fast responses show nothing |
| ~1–10s | yes | Skeleton matching the real layout, in place. Reserve the exact final dimensions so nothing shifts |
| ~1–10s | no | In-place spinner or indeterminate bar, sized to the region it's loading, with a one-line label of what is happening |
| > ~10s, measurable | either | Determinate progress with step names or counts. Let the user navigate away; notify on completion |
| > ~10s, unmeasurable | either | Narrate real work ("Checking 140 airlines… found 62 fares"). Give an estimate if you have one. Offer cancel |

Two implementation details that fix most loading-state jank:

- **Delay before showing**, so short responses never render a loader. 200–500ms is the usual window.
- **Minimum display time once shown**, so a loader that did appear doesn't strobe out 40ms later. ~300ms.

```js
// Show a loader only if the work is still running after `delay`,
// and keep it up for at least `minVisible` once shown.
async function withLoader(work, { delay = 300, minVisible = 400, show, hide }) {
  let shownAt = null;
  const timer = setTimeout(() => { shownAt = Date.now(); show(); }, delay);
  try {
    return await work();
  } finally {
    clearTimeout(timer);
    if (shownAt) {
      const remaining = minVisible - (Date.now() - shownAt);
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
      hide();
    }
  }
}
```

## Skeletons: what actually holds up

The comparative evidence is weaker than its popularity suggests. Viget's 2017 test (n=136, mobile, three
identical-length loading treatments) found skeleton screens performed *worst* on perceived duration against
both a spinner and a blank screen; other published comparisons report skeletons winning. There is no clean
replicated answer, and the "skeletons feel 20–30% faster" numbers that circulate have no traceable source.

What is defensible on mechanism rather than on a contested study:

- **A skeleton that matches the final layout prevents layout shift.** That is a measurable harm (Cumulative
  Layout Shift) with real consequences — mistaps on controls that moved. This alone justifies skeletons for
  content-shaped regions.
- **A skeleton that does *not* match the final layout is worse than nothing.** It predicts a shape, then
  breaks the prediction.
- **Shimmer animation spends attention on the wait.** Use it sparingly, keep it slow and low-contrast, and
  respect `prefers-reduced-motion`. On a sub-second load, drop it entirely.
- **Skeletons suit content; spinners suit actions.** A list, card grid or article body has a shape worth
  predicting. "Saving…" does not.

## Progress indicators

- Determinate whenever you can measure it. An indeterminate bar for a 40-second job tells the user nothing
  and invites them to reload.
- If the underlying work has discrete stages, name the stage. "Uploading (2 of 7)" is more informative than
  a percentage and degrades gracefully when your percentage estimate is bad.
- Never let a progress bar go backwards, and never let it sit at 99%. Both destroy trust in the indicator
  and, by extension, in the system.
- Harrison, Amento, Kuznetsov & Bell (*Rethinking the Progress Bar*, UIST 2007) showed that the animation
  behaviour of a bar measurably changes its perceived duration — bars that appear to accelerate toward the
  end are perceived as faster than linear ones of the same length. Treat this as a tiebreaker on how to
  animate, not as a licence to misrepresent progress.
- For uploads, show per-file progress and let the rest of the form stay usable. The upload should not block
  the work the user could be doing meanwhile.

## Optimistic UI safety checklist

Ship optimistically only when **all** of these hold:

- [ ] Success rate is very high — no server-side business rule can plausibly reject it, no contention with
      other users, no external authorisation involved.
- [ ] The client can reliably detect failure (a real error response, not a silent no-op).
- [ ] The action is reversible or safely replayable, so rollback restores a genuinely correct state — not a
      guess at one.
- [ ] The user can understand the rollback when it happens, from the UI alone.
- [ ] Nothing being rendered is a **server-assigned value**: final price, tax, discount eligibility, stock
      availability, invoice or order number, generated ID, permission result.

Typical safe set: like/unlike, star, mark read/unread, reorder, rename, add/remove tag, toggle a preference,
send a chat message (with a pending state and retry), add to cart.

Typical unsafe set: payment and authorisation, irreversible delete, publish to a public audience, anything
where the user might navigate away believing it succeeded, any write another user's state depends on,
anything with a legal or financial confirmation.

Rollback etiquette: restore the exact prior state, tell the user plainly what didn't save, and give them a
retry. A silent revert is worse than a spinner, because the user believes the wrong thing until they notice.

## Making the wait do work

Ordered by value:

1. **Start early.** Prefetch on hover or focus, on route intent, on scroll proximity. By the time the user
   commits, the data is there.
2. **Stream.** Render what has arrived instead of waiting for everything. Server-side streaming, progressive
   image loading, partial result lists — first meaningful content beats complete content.
3. **Overlap.** Upload in the background while the user fills in metadata. Validate step 1 while they read
   step 2. Commit the previous step while they start the next.
4. **Preview.** Low-resolution image, cached previous version, extracted first page. Something true and
   immediately useful, clearly marked as preliminary.
5. **Narrate real work.** The operational-transparency effect (Buell & Norton, 2011, *Management Science*):
   in travel-search experiments, showing the work in progress raised perceived value versus a faster opaque
   wait. Their own findings also show it reverses when waits get long enough. And the hard line: **never
   manufacture or extend a delay to look thorough.** A fabricated "analysing…" over an instant lookup is a
   deception pattern — see `ethical-persuasion-audit`.
6. **Land the ending cleanly.** The peak-end rule (Kahneman, Fredrickson, Schreiber & Redelmeier, 1993) says
   the ending disproportionately shapes the remembered experience. Finish into a complete, usable, correctly
   scrolled result rather than dumping the user into a half-populated page they have to wait through again.

## What to measure

- **Interaction latency, not just page load.** Instrument the actions people repeat most: the search
  keystroke-to-results, the save, the filter toggle. Page-load metrics miss the interactions that dominate a
  daily-use tool.
- **Report percentiles**, at minimum p50/p75/p95. A good median with a bad p95 means a minority of your users
  are having a bad time consistently — often the same ones every time, on the same devices.
- **Segment by device class and connection.** An average that mixes desktop and mid-range mobile is
  uninformative about both.
- **Watch the field, not just the lab.** Real-user monitoring catches the network conditions and device mix
  a synthetic test never will.
- **Correlate latency with completion**, not just with bounce. The honest question for this skill is whether
  the slow step is where people stop; `behavioral-metrics` covers how to establish that without fooling
  yourself.
- **Test on a throttled mid-range device as a habit.** Most latency bugs are invisible on the machine that
  built them.
