---
name: attention-and-hierarchy
description: Decides where the eye lands on a screen and makes that the place that matters — preattentive salience, Gestalt grouping, whitespace, contrast, scan patterns, and motion budgets. Use this whenever the user is laying out or reviewing any screen, page, dashboard, table, card, empty state, email or component, even if they never say "hierarchy" or "attention" — including requests like "make this look cleaner", "this feels cluttered/busy/overwhelming", "nobody clicks the button", "people miss the banner", "which CTA should be primary", "our dashboard is unreadable", or "does this pass accessibility". Also use it before any visual-design review, and any time a screen has grown more than one prominent call to action.
---

# Attention and hierarchy

Every screen makes an implicit claim about what matters most, and the human visual system reads that claim in
about a glance — before it reads a single word. Your job is to make the claim deliberate. What goes wrong
without it is not ugliness; it is a screen where the most important element is competing with eleven others of
equal loudness, so the eye picks by accident and the user's first impression is "cluttered" or "I don't know
what this is for". Hierarchy is not decoration. It is the interface's answer to "what do I do here".

## When this is the right skill

- Laying out any new screen, page, panel or component, or reviewing one someone else laid out.
- A screen "feels cluttered", "feels overwhelming", or "looks unfinished" and nobody can say why.
- A specific element is being missed: the CTA, the error, the empty-state action, the new feature.
- Deciding what the primary action is, or discovering there are now four of them.
- Colour, contrast, dark mode and accessibility questions where the real question is legibility and rank.

Go elsewhere when: the problem is people *abandoning a task* they started (`friction-and-flow`); the problem
is the *words* rather than their prominence (`persuasive-copy`); the problem is a first-time user not
understanding the product at all (`onboarding-activation`); the problem is animation craft — easing, duration,
choreography (`design-motion-principles`, which this skill defers to entirely). This skill decides *whether*
to spend motion; that one decides how to spend it well.

## Diagnose first

Layout advice transplants badly. A pattern that works for a marketing page — one screen-filling headline, one
button, acres of whitespace — is malpractice in an ops console where a trained user needs forty values at
once. Answer these before you move a single element.

1. **Is this a first-encounter surface or a daily-driver surface?** A visitor deciding whether to care needs
   one loud thing and very little else. A user who has opened this screen four hundred times needs density,
   stable positions, and hierarchy expressed in ways that survive familiarity (position and grouping) rather
   than ways that fatigue (colour and motion).
2. **Is the task *find one thing*, *compare many things*, or *decide one thing*?** Find → strong grouping and
   scannable anchors. Compare → alignment, consistent formatting, low chrome, high density. Decide → one
   dominant path with the alternatives visible but quiet.
3. **How much does the user already know about where things are?** Learned layouts earn density. Unlearned
   layouts must be readable from structure alone. Never redesign positions in a daily-driver tool for
   aesthetic reasons — you are deleting muscle memory that took months to build.
4. **What is the one thing that, if the user did it, means this screen worked?** If you cannot answer, you
   cannot rank anything, and you will end up giving five elements equal weight. Write the answer down before
   you open the design file.
5. **Under what conditions is it actually read?** Phone in sunlight, second monitor at arm's length,
   projected in a meeting, at 200% browser zoom, in dark mode at 1am, by someone with red-green colour vision
   deficiency. The degraded case is the design target, not an accessibility chore appended later.
6. **Is density a bug or the product?** Bloomberg terminals, flight-ops boards and trading screens are dense
   on purpose and their users would revolt if you added whitespace. Density is legitimate. What is never
   legitimate is dense *and* flat. Dense screens need **more** hierarchy discipline, not less.

## The moves

### 1. Pick one loudest thing, and understand why you only get one

**Preattentive processing** (Anne Treisman & Garry Gelade, feature-integration theory, 1980; practical
catalogue in Healey & Enns, *Attention and Visual Memory in Visualization and Computer Graphics*, 2012). A
small set of visual features is resolved in parallel across the whole visual field before focused attention
arrives: colour (hue and intensity), size, orientation, curvature, shape, enclosure, spatial position,
numerosity, and motion (flicker and direction). A target differing on one of these "pops out" — the time to
find it is roughly independent of how many distractors are on screen. A target that requires a *conjunction*
of features ("the small red one") does not pop out; search becomes serial and slow.

The critical corollary is **Duncan & Humphreys (1989)**: pop-out depends on target–distractor difference *and*
distractor–distractor similarity. One red button among grey buttons is found instantly. One red button among
buttons in six different colours is found by reading them all. This is the mechanism behind the design rule
everyone repeats and few enforce:

> Salience is zero-sum. Emphasis is a share of a fixed budget. Five primary buttons is zero primary buttons.

What to build:

- Name the single most important element on each screen. Give it the loudest treatment available in your
  system. Everything else gets demoted, not just "made slightly less loud".
- Make emphasis structurally impossible to over-spend. If your button component takes `variant="primary"`,
  the design review question is "how many primaries render in one viewport?", and the answer is one. Encode
  it where it can be checked:

  ```jsx
  // One primary per view. Secondary actions are quiet by construction.
  <Button variant="primary">Publish</Button>
  <Button variant="ghost">Save draft</Button>
  <Button variant="ghost">Preview</Button>
  ```

  Three filled buttons in a row is the single most common hierarchy bug in shipped software. Filled + outline
  + outline is nearly as bad; the outlines still read as buttons of equal rank. Filled + text + text is right.
- Keep the distractor field uniform. A page where every card has a different accent colour has destroyed its
  own ability to highlight anything. Uniformity is what makes exception legible.

How it fails: teams treat "important" as an attribute of the element rather than a rank in a competition, so
every stakeholder's feature becomes primary. It also fails when the loudest thing is loud but *empty* — a
giant hero with no actionable content is a well-executed hierarchy pointing at nothing.

### 2. Build the structure with grouping before you style anything

**Gestalt grouping principles** (Max Wertheimer, 1923; Kurt Koffka; Wolfgang Köhler). These are not
aesthetics; they are the perceptual machinery that makes a layout read as organised before it is read at all.
Six matter in UI, and two do most of the work:

- **Proximity** — things close together are one group. The strongest and cheapest tool you have.
- **Common region** — things inside a shared boundary are one group. **Palmer (1992)** showed common region
  can *override* proximity and similarity: a border or background around two distant items groups them more
  strongly than adjacency groups two others. This is why cards work, and why a stray border creates a group
  you did not intend.
- **Similarity** — same colour, shape, size, or treatment reads as same kind. This is what makes "all links
  are blue and underlined" load-bearing rather than decorative.
- **Continuity** — the eye follows lines and alignment. A shared left edge is a rail the eye rides down; a
  broken alignment reads as a new section whether you meant it or not.
- **Closure** — the eye completes implied shapes, which is why three aligned corners can bound a region
  without four drawn borders.
- **Common fate** — things that move together are one group. Reserve it; see move 7.

What to build:

- **Make the gap inside a group visibly smaller than the gap between groups.** This one ratio fixes most
  "feels cluttered" complaints. A ~2–3× step is a workable starting point; the requirement is that the
  difference is unmistakable, not subtle.

  ```jsx
  {/* label→input is intra-group; field→field is inter-group */}
  <div className="space-y-6">              {/* between fields */}
    <div className="space-y-1.5">          {/* within a field */}
      <label>Email</label>
      <input />
      <p className="text-sm">We never share this.</p>
    </div>
  </div>
  ```

  A help text sitting closer to the *next* field than to its own is a bug, and it is everywhere.
- **Pick one grouping device per group.** Border, background tint, shadow and whitespace are four ways to
  express common region. Using all four at once is not four times as clear; it is noise that makes the *next*
  distinction impossible to draw. Most interfaces should default to whitespace and reach for a background
  tint only when whitespace cannot do it.
- **Audit for accidental groups.** A section heading spaced equally between the block above and below belongs
  to neither. Headings should be visually tight to the content they head.

How it fails: applying grouping devices to a screen that has no conceptual grouping — boxing arbitrary
collections of controls creates false structure the user then tries to make sense of. Group by meaning first;
if you cannot name the group, delete the box.

### 3. Spend whitespace before you spend colour

The most under-used hierarchy tool, because it is invisible on the spec and looks like nothing to a
stakeholder. Mechanism: whitespace is how you express proximity and common region **without adding another
element that competes for attention**. Every border, divider, shadow and tint you draw is one more mark the
visual system must resolve. Space groups for free.

What to build:

- Establish a spacing scale (4/8/12/16/24/32/48…) and use *steps* on it to encode relationship distance.
  Uniform 16px everywhere means the layout carries zero grouping information — the most common failure in
  dashboards.
- Delete dividers that whitespace already implies. If a 32px gap separates two sections, the `<hr>` between
  them is adding ink to say something already said.
- Give the one loudest thing room. Isolation is itself an emphasis channel and costs no colour, no weight,
  and no accessibility budget.
- Treat line-height and measure as hierarchy: a comfortable line-height (~1.5 for body) and a measure capped
  around 45–75 characters is what makes a text block read as a *unit* rather than a wall.

How it fails: whitespace applied uniformly, as a style rather than as structure — "airy" layouts where
everything is equally far from everything and the grouping information is gone. It also fails in genuinely
dense tools, where the answer is not more space but *differential* space: tight within a row, looser between
logical column groups.

Do not quote a percentage improvement for whitespace. Figures like "whitespace increases comprehension by
20%" circulate widely with no locatable primary study; the effect is real and the number is folklore.

### 4. Use contrast as a ladder, with accessibility as the floor

Contrast is the quantitative handle on hierarchy — the one part of this you can compute and put in CI. Treat
WCAG minimums as the floor of a deliberate ladder, not as a compliance chore bolted on at the end.

The numbers that bind (WCAG 2.1/2.2 Level AA):

| Requirement | Ratio | Success criterion |
|---|---|---|
| Body text | 4.5:1 | 1.4.3 Contrast (Minimum) |
| Large text (≥24px, or ≥18.66px bold) | 3:1 | 1.4.3 |
| UI component boundaries, icons, chart marks, focus rings | 3:1 | 1.4.11 Non-text Contrast |
| Meaning never carried by colour alone | — | 1.4.1 Use of Color |

Concrete, because the failures are always the same greys and greens (computed against white):

```
#111827  17.7:1  ok — primary text
#4B5563   7.6:1  ok — secondary text
#6B7280   4.8:1  ok — the quietest text you are allowed for body copy
#9CA3AF   2.5:1  FAILS — the "muted label" colour half the industry ships
#16A34A   3.3:1  FAILS as text — the green in your success message
#F59E0B   2.2:1  FAILS everything — amber text is almost always illegal
```

What to build:

- Define exactly three text weights in your token set — primary, secondary, muted — where *muted still
  passes 4.5:1*. If you need a fourth level of quiet, you have too much on the screen.
- Encode status with **colour + shape + text**, never colour alone. Red-green colour vision deficiency
  affects roughly 8% of men and 0.5% of women of Northern European descent (prevalence is lower in Asian and
  African populations; see *Eye*, 2010, and subsequent epidemiological reviews). A red down-triangle with a
  minus sign and the word "down" survives; a red number does not.

  ```jsx
  <span className="text-red-700">
    <ArrowDown aria-hidden />  −12.4%  <span className="sr-only">decrease</span>
  </span>
  ```
- Underline links inside body text, or give them a non-colour cue on hover and focus. A blue word among black
  words is a colour-only affordance.
- Check contrast in *both* themes. A palette that passes in light mode routinely fails in dark mode, and vice
  versa; they are two designs, not one design with inverted tokens.

How it fails: chasing AAA (7:1) everywhere flattens the ladder — if every text level is maximum contrast, you
have lost the ability to signal rank with contrast at all. Meet AA, then use the *remaining* headroom
deliberately. Second failure: the WCAG 2.x contrast formula is known to misjudge some cases, particularly
light-on-dark and thin type; APCA is the candidate replacement being developed for WCAG 3 but is not a
conformance standard. Meet 2.x because it is what is enforced, and still look at dark mode with your eyes.

`references/contrast-and-color.md` has the full treatment: focus indicators, dark mode, chart encoding,
CVD-safe palette construction and tooling.

### 5. Design for scanning, and know what the scan-pattern research actually says

People do not read screens; they scan for something that looks like what they want, then read that. Two
findings with real evidence, and one honest correction:

**The F-pattern** (Jakob Nielsen / Nielsen Norman Group, 2006, eyetracking, 232 participants) — two
horizontal sweeps then a vertical scan down the left. **The correction, from NN/g's own later work, is the
important half**: the F is what happens when a page is text-heavy and *unformatted*, giving the eye no better
cue. It is a symptom of poor formatting, not a layout template. NN/g's later eyetracking documents several
other patterns — layer-cake (scanning headings and subheads), spotted, marking, commitment — and the
layer-cake is the one you *want*, because it means your headings are doing their job. Design so that
headings, bolded key phrases and front-loaded first words carry the meaning; then the scan pattern follows
your structure rather than defaulting to an F.

The **Z-pattern** is a practitioner heuristic, not an eyetracking finding. It is a reasonable composition
device for a sparse page with few elements. Do not present it as research.

**Banner blindness** (Jan Panero Benway & David Lane, Rice University, 1998). Users systematically missed
links that were placed and styled like advertisements — even when those links contained exactly the
information they were looking for. Ad-shaped geometry alone made relevant content invisible. This transfers
directly to in-product promos: the "Upgrade to Pro" card in the right rail, the boxed announcement with a
gradient, the coloured strip pinned above the content. If it looks like an ad, it is invisible, and adding
contrast makes it look *more* like an ad.

The fix is never "make it louder". It is to move the message into the content flow at the moment of need, in
the product's own voice. An upgrade prompt attached to the feature the user just hit the limit of outperforms
a permanent rail card that nobody has seen since week one.

**The fold.** People scroll; the "nobody scrolls" claim has been dead for years. But attention is still
sharply front-loaded: NN/g's scrolling research found roughly 80% of viewing time above the fold in 2010,
and about 57% above the fold with ~74% in the first two screenfuls in the 2018 update — the distribution
flattened, the shape did not change. The right reading: **the fold governs commitment, not consumption.**
What is visible on arrival decides whether scrolling happens; what is below decides whether it was worth it.
So the first screenful must answer "what is this, is it for me, what can I do", and it must not look
*finished* — a full-viewport hero with a clean horizontal edge at the fold line creates the illusion of
completeness and suppresses the scroll. Let content cross the boundary.

### 6. Order matters: primacy, recency, and genuine distinctiveness

**Serial position effects** (Hermann Ebbinghaus; classic free-recall curve, Bennet Murdock, 1962): items at
the start and end of a list are recalled better than items in the middle. Honest caveat: this is a
memory-for-lists finding. Extending it to "the first and last nav items get clicked most" is a plausible
inference, not a demonstrated UI result — treat it as an ordering heuristic worth following when you have no
data, and measure if the ordering is commercially load-bearing.

What to build: put the highest-value item first, the second-highest last, and let the middle be the middle —
in nav bars, dropdowns, tab strips, footer link groups and settings lists. Do not bury the item you most want
found in position four of seven. And when the middle is where the important thing must live, give it a
non-positional cue.

**The Von Restorff / isolation effect** (Hedwig von Restorff, 1933) — the item that differs from its
neighbours is remembered better. The effect itself is well replicated, but the way UI writing uses it is
usually wrong, and the correction is useful: **R. Reed Hunt (1995)** showed von Restorff specifically
demonstrated that *perceptual* salience is not necessary — the isolate was placed early in the list precisely
to avoid visual pop-out. The effect is about difference from context in a category, not about being bright.

So the honest reading for interfaces: the claim "the visually distinct button gets clicked" rides on
preattentive pop-out (move 1), not on von Restorff. What von Restorff contributes is the part designers keep
forgetting — **distinctiveness is relative to context, and it decays with every additional distinct thing.**
The fifth "special" item is not special. This is the mechanism behind the one-primary-button rule, and it is
also why a "New!" badge stops working the moment it is on three menu items.

### 7. Motion is the loudest channel, so it is the most expensive

Motion captures attention involuntarily and it does so in the periphery, where colour and shape detection
fall off — **Bartram, Ware & Calvert (2003)** found peripheral detection of moving glyphs held up where
colour-coded ones degraded, and that the same property makes motion the most *distracting* encoding. That
combination is the whole design brief: motion is the only channel that works when the user is not looking at
it, which is exactly why you cannot spend it on decoration.

What to build:

- Budget: at most one thing on screen may be moving for attentional reasons at a time. Autoplay carousels,
  looping illustrations, parallax and animated gradients spend the channel on nothing and leave you with no
  way to signal a real event.
- Reserve motion for state change the user needs to notice: something arrived, something failed, something
  crossed a threshold, something moved because of an action they took.
- **Common fate** is motion's grouping use: elements that animate together read as one object. This is what
  makes a well-done list reorder comprehensible and a badly-done one chaotic.
- Honour `prefers-reduced-motion` — vestibular disorders make large transform animations genuinely nauseating,
  not merely annoying. Reduce, don't necessarily remove: keep opacity, drop translation and scale.

  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- WCAG bindings: 2.2.2 Pause, Stop, Hide (anything auto-moving or auto-updating for more than five seconds
  needs a control); 2.3.1 Three Flashes; 2.3.3 Animation from Interactions (AAA).

How it fails: numbers that animate on every poll, so nothing distinguishes a routine refresh from an alert;
skeleton shimmers that keep pulsing long after the page has settled; hover animations on every card in a grid,
which turn cursor movement into a light show. For easing, duration and choreography, use
`design-motion-principles` — this skill only decides whether motion is warranted.

### 8. Know that beauty will lie to you in testing

**The aesthetic-usability effect** (Masaaki Kurosu & Kaori Kashimura, Hitachi Design Center, 1995 — 26 ATM
interface variants rated by 252 participants; the correlation between rated aesthetic appeal and *perceived*
ease of use exceeded the correlation between appeal and *actual* ease of use). Replicated cross-culturally by
Noam Tractinsky (1997), and extended in Tractinsky, Katz & Ikar, "What is beautiful is usable" (2000). This
is one of the better-supported findings in HCI.

Two consequences, and the second one is the one people skip:

- **Attractiveness buys tolerance.** A well-crafted interface earns patience for its rough edges and reads as
  more trustworthy and more competent. Visual craft is not vanity; it is a real usability asset.
- **It corrupts your evidence.** In usability testing, participants rate an attractive prototype as easier
  while still failing tasks on it, and they under-report problems they did encounter. So: weight **observed
  behaviour** (task success, time, error, backtracking) over stated satisfaction, always. If you must compare
  two designs, compare them on completion and error rates, not preference. And be suspicious of a redesign
  that "tested great" and shipped with the same funnel numbers — that is the aesthetic-usability effect
  showing up in your research process.

## The three audits worth memorising

Familiarity destroys your ability to see hierarchy — you know where everything is, so you can no longer tell
whether it is findable. Three checks restore the naive view in under a minute:

- **Squint / blur test.** Blur the screen ~8–10px (squint, or `filter: blur(8px)`). What still reads as
  distinct shapes *is* your hierarchy. If the loudest surviving blob is not the thing that matters, the
  hierarchy is wrong no matter how good it looks sharp.
- **Greyscale test.** Remove all colour. If the screen becomes unusable, meaning was riding on hue alone —
  and roughly 1 in 12 men is already seeing that version.
- **Count test.** Filled buttons in one viewport (answer: 1). Distinct type sizes (most screens need 4–5).
  Saturated brand-colour elements (above ~3 and the brand colour has stopped meaning "act here").

`references/auditing-a-screen.md` has the full toolkit — five-second and first-click tests, the upside-down
test, CVD simulation — plus a **worked audit of a dense operations dashboard**: ten findings with fixes, and
the before/after squint result. Read it before any design review or layout-change PR.

## Anti-patterns

- **Three filled buttons in a row.** Zero primary actions. One filled, the rest text buttons.
- **Every card given its own accent colour.** Colour-coding without a legend, and a distractor field so
  heterogeneous that nothing can ever pop out again.
- **Making the missed element louder.** The standard response to "nobody clicks it" is to increase its size
  and saturation, which usually pushes it further towards ad-shaped and makes it *more* invisible. Move it
  into the content flow at the point of need instead.
- **Uniform spacing as a design system.** A single gap value everywhere feels tidy in Figma and transmits no
  grouping information at all.
- **Borders around everything.** Common region applied indiscriminately creates groups the user then tries to
  interpret. If you cannot name the group, it should not have a box.
- **Muted text that fails contrast.** The `#9CA3AF`-on-white "secondary label" is the most-shipped
  accessibility failure in modern UI, at 2.5:1.
- **Red/green as the only status encoding.** Especially in charts, diffs, and financial deltas.
- **Permanent alert-coloured banners.** Any always-on urgency colour trains users to filter that colour.
- **Treating the F-pattern as a layout requirement.** It describes scanning of *unstructured text*, and it is
  a symptom to design away from, not a grid to design towards.
- **Full-viewport heroes with a clean edge at the fold.** The illusion of completeness suppresses scrolling
  in exactly the audience you were trying to convert.
- **Justifying a nav item limit with Miller's 7±2.** Miller (1956) measured short-term recall for digits, not
  menu capacity. The right number of nav items is however many distinct top-level areas the product has;
  legibility comes from grouping and labelling, not from a magic count.
- **Animating on data refresh.** Motion spent on routine events leaves nothing for exceptional ones.
- **Shipping the version that "looks better" without a task-success comparison.** See move 8: attractiveness
  reliably inflates perceived usability, including in your own team's judgement.

## Ship checklist

Run against the screen or the PR diff before merging.

- [ ] I can name the one thing this screen exists to get done, and it is the visually loudest element.
- [ ] Exactly one filled/primary button renders in a single viewport.
- [ ] The blur test at ~8px still points at the right element.
- [ ] The greyscale test leaves the screen usable; no meaning is carried by hue alone.
- [ ] Gaps within a group are visibly smaller than gaps between groups, on a defined spacing scale.
- [ ] Each group uses one common-region device, not three stacked (border + shadow + tint).
- [ ] Every box on the screen corresponds to a group I can name.
- [ ] All body text ≥4.5:1; large text and all UI component boundaries, icons and focus rings ≥3:1 — checked
      in both light and dark themes.
- [ ] Status, deltas and chart series carry a non-colour encoding (icon, shape, pattern, direct label).
- [ ] Focus is visible on every interactive element and the keyboard order matches the visual order.
- [ ] Nothing animates except deliberate state changes; `prefers-reduced-motion` is honoured; anything
      auto-moving beyond five seconds can be paused.
- [ ] No element is positioned or styled like an advertisement — especially in-product promos.
- [ ] The first screenful answers what/for-whom/what-now and visibly continues past the fold.
- [ ] Lists and nav put the highest-value item first, second-highest last.
- [ ] Headings and the first two words of each row/link carry the distinguishing information.
- [ ] Checked at 200% zoom and at 320px width; no horizontal scroll and no clipped content.
- [ ] If this is a redesign of a learned daily-driver screen, nothing moved without a reason worth the
      retraining cost.

## Sources

- **Preattentive features / feature-integration theory** — Anne Treisman & Garry Gelade, "A feature-integration
  theory of attention", *Cognitive Psychology* 12(1), 1980. Practical feature catalogue and visualization
  application: Christopher Healey & James Enns, "Attention and Visual Memory in Visualization and Computer
  Graphics", *IEEE TVCG* 18(7), 2012. Note: "preattentive" as a strict processing *stage* is debated; the
  usable claim — that certain features support efficient, set-size-independent search — is well supported.
- **Why pop-out collapses in heterogeneous fields** — John Duncan & Glyn Humphreys, "Visual search and stimulus
  similarity", *Psychological Review* 96(3), 1989.
- **Gestalt grouping** — Max Wertheimer, "Untersuchungen zur Lehre von der Gestalt", 1923; Kurt Koffka,
  *Principles of Gestalt Psychology*, 1935.
- **Common region** — Stephen E. Palmer, "Common region: a new principle of perceptual grouping", *Cognitive
  Psychology* 24(3), 1992 — demonstrates common region overriding proximity and similarity.
- **Isolation effect** — Hedwig von Restorff, 1933. Robustly replicated as a *memory* effect. Important
  correction: R. Reed Hunt, "The subtlety of distinctiveness: What von Restorff really did", *Psychonomic
  Bulletin & Review* 2(1), 1995 — perceptual salience is not necessary for the effect, so the common UI
  citation ("make it visually distinct so it gets clicked") is better supported by pop-out than by von Restorff.
- **Serial position** — Hermann Ebbinghaus, 1885; Bennet B. Murdock Jr., "The serial position effect of free
  recall", *Journal of Experimental Psychology* 64(5), 1962. Free-recall list learning; the navigation-ordering
  extension is a heuristic, not a demonstrated UI effect.
- **F-shaped scanning** — Jakob Nielsen, "F-Shaped Pattern For Reading Web Content", Nielsen Norman Group, 2006
  (eyetracking, 232 participants), and the essential correction, Kara Pernice, "F-Shaped Pattern of Reading on
  the Web: Misunderstood, But Still Relevant (Even on Mobile)", NN/g, 2017 — the F is a consequence of
  unformatted text, and other patterns (layer-cake, spotted, marking, commitment) appear when formatting gives
  the eye better cues. The **Z-pattern has no comparable eyetracking basis**; it is a composition heuristic.
- **Banner blindness** — Jan Panero Benway & David M. Lane, "Banner Blindness: Web Searchers Often Miss
  'Obvious' Links", *Internetworking* / Rice University, 1998; Benway, *Proceedings of the Human Factors and
  Ergonomics Society*, 1998.
- **Scrolling and the fold** — Jakob Nielsen, "Scrolling and Attention", NN/g, 2010 (~80% of viewing time above
  the fold); Kara Pernice, 2018 update (~57% above the fold, ~74% within the first two screenfuls). Attention
  is front-loaded; scrolling itself is not the obstacle.
- **Motion detection and distraction** — Lyn Bartram, Colin Ware & Tom Calvert, "Moticons: detection,
  distraction and task", *International Journal of Human-Computer Studies* 58(5), 2003. Also Colin Ware,
  *Information Visualization: Perception for Design* (4th ed., 2020) for the general perceptual grounding.
- **Aesthetic-usability effect** — Masaaki Kurosu & Kaori Kashimura, "Apparent usability vs. inherent
  usability", *CHI '95* (Hitachi Design Center; 26 ATM layouts, 252 participants). Replication and extension:
  Noam Tractinsky, "Aesthetics and apparent usability", *CHI '97*; Tractinsky, Adi Katz & Dror Ikar, "What is
  beautiful is usable", *Interacting with Computers* 13(2), 2000. The testing-contamination warning is
  developed in Kate Moran, "The Aesthetic-Usability Effect", NN/g, 2017.
- **Contrast and colour requirements** — W3C, *Web Content Accessibility Guidelines* 2.1 / 2.2: SC 1.4.1 Use of
  Color, 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast, 2.4.7 Focus Visible, 2.2.2 Pause/Stop/Hide,
  2.3.1 Three Flashes, 2.3.3 Animation from Interactions. APCA is a candidate method under development for
  WCAG 3 and is **not** a conformance standard today.
- **Colour vision deficiency prevalence** — red-green CVD affects up to ~8% of males and ~0.5% of females of
  Northern European descent, with lower rates in Asian and African populations; see J. Birch's review in *Eye*
  (Nature), 2010, and subsequent epidemiological reviews. Quote it as an order of magnitude, not a constant.
- **Fitts's law** (target size and distance) — Paul Fitts, 1954 — matters here for tap-target sizing but is
  covered in `friction-and-flow`, which owns interaction cost.

**Claims deliberately not made here:** any "whitespace improves comprehension by N%" figure (widely repeated,
no locatable primary source); "users judge a site in 50 milliseconds" as a general claim — Lindgaard et al.
(2006) measured *visual-appeal* judgment specifically, not usability, trust or purchase intent, and it does not
license "you have 50ms to make your case"; Miller's 7±2 as a bound on menu or nav item counts (Miller, 1956,
measured digit-span recall); the Z-pattern as an eyetracking finding; the golden ratio as a basis for type
scales; and any "N% of users never scroll" statistic — the NN/g attention distribution above is the
attributable version.

## Further reading in this skill

- `references/auditing-a-screen.md` — read when reviewing an existing screen rather than building a new one:
  the full audit toolkit (five-second, first-click, upside-down, zoom-out, CVD simulation) and a worked
  ten-finding audit of a dense operations dashboard.
- `references/contrast-and-color.md` — read when working on a palette, a dark theme, chart colours, focus
  indicators, or an accessibility audit: the full WCAG contrast mechanics, how to build a text ramp that is
  both compliant and hierarchical, colour-vision-safe encoding, and the tooling to check it in CI.
