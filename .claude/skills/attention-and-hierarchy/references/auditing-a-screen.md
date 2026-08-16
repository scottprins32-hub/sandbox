# Auditing a screen

Read this when reviewing an existing screen rather than building a new one — a design review, a PR with a
layout change, a "this feels cluttered but I can't say why" complaint, or your own work after you have looked
at it long enough to stop seeing it. Familiarity destroys your ability to judge hierarchy: you know where
everything is, so you can no longer tell whether it is findable. These techniques restore the naive view.

Use with the ship checklist at the end of `../SKILL.md`.

## The toolkit

Each of these takes under a minute. The first three are in `../SKILL.md`; the rest are here.

- **Squint / blur test.** Blur the screen ~8–10px (squint, screenshot through a blur filter, or CSS
  `filter: blur(8px)`). What still reads as distinct shapes is your actual hierarchy. If the loudest surviving
  blob is not the thing that matters, the hierarchy is wrong regardless of how it looks sharp.
- **Greyscale test.** Remove all colour. If the screen becomes unusable, you were encoding meaning in hue
  alone and roughly 1 in 12 men is already seeing the greyscale version.
- **Count test.** Count filled buttons in one viewport (answer: 1). Count distinct type sizes (most screens
  need 4–5). Count saturated brand-colour elements (if it is above ~3, the brand colour has stopped meaning
  "act here").
- **Five-second test.** Show someone the screen for five seconds, hide it, ask what it was and what they
  would do next. Failures here are hierarchy failures, not copy failures.
- **First-click test.** Give a task, record only the first click. First-click accuracy is the cleanest
  available proxy for whether your hierarchy points where you think it does.
- **Upside-down test.** Rotate the screenshot 180°. Reading is suppressed, composition is not, and imbalance
  becomes obvious.
- **The zoom-out.** View at 50% or from three metres. Structure survives; detail does not — which is exactly
  the information you want.
- **CVD simulation.** Chrome DevTools → Rendering → Emulate vision deficiencies. Check deuteranopia and
  protanopia at minimum.

## Worked audit: a dense support-operations dashboard

The screen: internal tool, used all day by support leads. Top bar with logo, six nav links, global search,
notification bell, avatar. A red pinned banner ("Scheduled maintenance Sunday"). A row of eight identical KPI
tiles. A line chart panel. A "Tickets needing action" table. A right rail with an "Upgrade to Team Pro" card
and a "What's new" feed. Every number rendered in the brand blue. Panels have a 1px border, a drop shadow,
*and* a tinted background. Uniform 16px gaps throughout. Live values re-animate on every 10-second poll.

Diagnosis first: daily-driver surface, trained users, task is *find the thing that needs action*, density is
legitimate. So the fix is not "add whitespace and remove things" — it is to install a hierarchy the density
currently lacks.

**What the audit finds**

1. **No loudest thing.** Count the saturated elements: red banner, blue KPI numbers ×8, blue chart line, blue
   table links, the upgrade card, the notification badge. Nothing pops out because everything does — the
   Duncan & Humphreys failure exactly. *Fix:* the brand colour becomes reserved for interactive things only.
   Numbers render in the text ramp, not in blue.
2. **Eight equal tiles is a list, not a hierarchy.** Users care about two of these; the other six are context.
   *Fix:* one hero metric at ~2× type size on the left, the remaining seven at reading size, split into two
   labelled clusters by common region. Comparison tasks need alignment and consistent number formatting far
   more than they need decoration.
3. **Status is colour-only.** Green/red deltas with no glyph. *Fix:* arrow + sign + accessible text; and the
   green in use (`#16A34A`, 3.3:1 on white) fails as text — darken it.
4. **The right rail is ad-shaped.** Both the upgrade card and the "What's new" feed sit in the rail position,
   in boxed marketing styling. Benway & Lane predicts they are invisible, and the team's own click data will
   confirm it. *Fix:* delete the rail. "What's new" moves behind a single quiet entry in the top bar; the
   upgrade prompt moves to the moment a limit is actually hit.
5. **Uniform 16px gaps carry zero grouping.** *Fix:* 8px within a tile, 24px between tile clusters, 48px
   between major regions. This single change resolves most of what people call "cluttered".
6. **Common region is triple-encoded.** Border + shadow + tint on every panel means three marks doing one
   job, and no headroom left to distinguish a panel that needs attention. *Fix:* pick one — a hairline border
   on a flat background. Reserve the tint for the one panel in an alert state.
7. **Motion spent on nothing.** Every poll re-animates every number, so a genuine threshold breach looks
   identical to a routine refresh, and the peripheral-detection advantage of motion is fully burnt. *Fix:*
   numbers update silently; a brief highlight fires only when a value crosses a defined threshold. Gate it
   behind `prefers-reduced-motion`.
8. **The table is sorted by ticket ID.** Primacy is being spent on an arbitrary ordering. *Fix:* default sort
   by "needs action, oldest first" — the actual job of the screen. Front-load the first two words of each row
   with the distinguishing information, not with a shared prefix like "Customer request —".
9. **Table body text is `#9AA0A6` on white — 2.6:1.** Fails 1.4.3, and this is the text people read most.
   *Fix:* values render in the secondary text token, not a one-off grey; the muted level is for labels only,
   and it has to clear 4.5:1 on the row background including the hover and selected states. Take the levels
   from `color-and-theming`.
10. **The red banner is permanent.** A red strip that has been there for three weeks has taught every user to
    filter red at the top of the page. When there is a real incident, it will be invisible. *Fix:* dismissible,
    with the red channel reserved for states that are both new and actionable.

**Result of the squint test after:** one large number top-left, one dark table block with a highlighted first
row, and a quiet grid of context around them. Before, the blur showed a red stripe, a blue field of noise, and
a bright rectangle on the right that nobody had clicked in a year.

