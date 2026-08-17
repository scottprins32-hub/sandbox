---
name: friction-and-flow
description: Diagnoses why people abandon a task they intended to finish, and makes the remaining steps feel effortless — cognitive load, form design, defaults and choice architecture, target geometry, error recovery, and perceived performance. Use this whenever the user is building or reviewing a form, signup, checkout, wizard, settings page, multi-step flow, search filter, or any screen where someone has to complete something — even if they never say the words friction, conversion or UX. Also use it for symptoms like "people drop off at step 3", "our form converts badly", "this feels slow", "too many clicks", "should this be a confirmation dialog", or any question about loading states, spinners, skeletons and optimistic updates, because waiting is friction and belongs here.
---

# Friction and flow

A user who arrived at your form already decided they wanted the outcome. Everything after that decision is
attrition: each field, each choice, each unexplained wait is a fresh chance for them to reconsider, get
confused, or get interrupted. This skill is about finding the cost you added that the task never required,
and deleting it. Without this pass you end up optimising the wrong thing — rewriting the button copy on a
form that fails because it asks for a phone number nobody wants to give, or adding a progress bar to a
request that should have taken 200ms.

The counterweight: friction is not universally bad. Deleting a confirmation step before a destructive
action, or a review screen before a wire transfer, is not "reducing friction" — it is removing a safeguard.
The goal is to make the *intended* task cheap and the *unintended* one expensive.

## When this is the right skill

- Anyone has to fill something in, choose something, or complete a sequence of steps: forms, signup,
  checkout, onboarding wizards, filters, settings, upload flows.
- Something feels slow, or you are choosing between a spinner, a skeleton, an optimistic update, or a
  progress bar.
- People start a flow and don't finish it, and you want to know where the cost is before you A/B test copy.
- You are deciding between a confirmation dialog and an undo.

Go elsewhere when: the screen is a **repeating list, table or work queue** rather than one task — default
sort, row actions, bulk operations, pagination → `list-and-queue-design`. The screen is asking for **money
or a commitment** — a paywall, plan comparison, price display, checkout summary → `decision-screen-design`,
which owns the composition of that moment; this skill owns completing the task once the decision is made.
The question is **where the eye goes on the screen** → `attention-and-hierarchy`. The
question is **what the words should say** → `persuasive-copy`. The question is **how a brand-new user
reaches the value moment** → `onboarding-activation` (that skill owns first-run; this one owns the mechanics
of any single task within it). The question is **whether a default or a friction asymmetry is manipulative
or lawful** → `ethical-persuasion-audit`, which is a gate on several moves below. **Did the change work** →
`behavioral-metrics`.

## Diagnose first

Friction advice does not transfer between product types. Most of it was written about consumer checkout,
where the user is one impulse away from leaving. That advice actively damages a tool someone uses forty
times a day, where the expensive thing is not the second field but the fact that the flow can't be driven
from the keyboard.

Answer these before you touch anything:

1. **How often does one person do this task?** Once ever (tax return, account deletion), a few times a year
   (insurance claim, annual renewal), or dozens of times a day (support agent tagging a ticket)? Rare tasks
   need to be re-learnable from zero and forgiving. Frequent tasks need to be *fast for someone who already
   knows the way* — that means keyboard paths, stable target positions, no interstitials, and no tour.
2. **Is doing it voluntary?** Someone who chose your product will abandon rather than tolerate. Someone whose
   employer assigned it will not abandon — they will complete it while resenting it, then route around it
   with a spreadsheet. Absence of drop-off is not evidence of absence of friction in mandated tools.
3. **What is the cost of an error, and who bears it?** A typo in a search box costs nothing. A typo in a
   payment amount, a dosage, or a shipping address costs real money. High error cost justifies deliberate
   friction: review steps, typed confirmation, delays before execution.
4. **Is the step reversible?** This single question decides most of the moves below — optimistic UI, undo vs.
   confirmation, how hard you validate, how much you can safely default.
5. **What is the actual value moment, and is this step before or after it?** Everything a user does before
   they get value is a debt you owe them. Steps after value can ask for more.
6. **What device, network and posture?** One thumb on a phone on cellular is a different physics problem from
   a mouse on a 27" monitor. Measure your latency and target sizes on the worst realistic case, not yours.

Write down the answers. If the answer to 1 is "dozens of times a day" and you are about to add a
celebratory success animation, you have already found a bug.

## The moves

### 1. Cut extraneous load — it is the only load you're allowed to cut

**Cognitive load theory (Sweller, 1988; Sweller, van Merriënboer & Paas, 1998).** Working memory is small and
easily saturated. The theory splits demand into *intrinsic* load (the irreducible difficulty of the task
itself), *extraneous* load (demand created by how the task is presented), and *germane* load (effort that
goes into actually learning the thing). One clause of caveat: the three-way split is contested inside the
field — Sweller himself later argued germane load isn't a separate source but working-memory resources
devoted to intrinsic load. The practical rule survives the argument intact, and it's the only part you need.

**The rule:** you cannot reduce intrinsic load without changing the task. So every load-reduction idea must
be an extraneous-load idea, and if it isn't, you're about to make the product worse by hiding something the
user genuinely needs.

What extraneous load looks like in code review:

- **Split attention.** Information the user needs to complete a field, placed somewhere they have to hold in
  memory while they type. Password rules above the field that disappear when focused. An error summary at
  the top of the page describing a field three screens down. Units named in a tooltip instead of a suffix
  inside the input. Fix: put the information at the point of use.
- **Recall instead of recognition** (Nielsen's usability heuristic #6, 1994). Any time the user must remember
  something from a previous screen — an ID they were shown once, a value they typed in step 2 that step 4
  needs — you have made them do memory work for you. Show it, or carry it forward.
- **Redundant transformation.** "Enter amount in cents." "Date as DD/MM/YYYY." "No spaces in card number."
  Every format you refuse to accept is arithmetic you assigned to a human. Accept anything parseable and
  normalise server-side (Postel's robustness principle, 1980, applied to human input).
- **Simultaneous unrelated decisions.** A screen that asks for plan, billing period, seat count, VAT number
  and payment method at once forces the user to hold four dependencies at a time. Sequence them.

**How it fails:** "reduce cognitive load" gets used to justify hiding things — collapsing the price
breakdown, removing the field labels, replacing words with ambiguous icons. That moves load rather than
removing it, and for infrequent or high-stakes tasks the hidden state is exactly what the user needed. If
removing something makes the user ask a question they can't answer from the screen, it was intrinsic.

### 2. Delete the field

Forms are the highest-leverage friction surface in almost every product, because the cost is per-field,
compounding, and completely under your control. Baymard Institute's checkout research finds the average US
checkout shows around 15 form fields (about 23 form elements including checkboxes and dropdowns) where
roughly 7 fields would do, and that most checkouts can cut form elements by 20–60% without losing anything
the business needs. Their aggregate of 50 published studies puts average cart abandonment near 70%, with
"too long / complicated checkout" cited by a meaningful share of abandoners — real numbers from a named
source, unlike most of what circulates on this topic.

The interrogation, per field, in order:

1. **Do we need this at all, ever?** Fields survive in forms because deleting them requires someone to say
   so and nobody owns them. "How did you hear about us?" is a marketing team's curiosity billed to every
   user. Kill it or make it optional and last.
2. **Do we need it *now*, or can we ask after value?** Company name, team size, job title, phone: none of
   these are needed to create an account. Ask in-app, in context, when the answer does something visible for
   the user.
3. **Can we derive it?** Country from IP or locale (editable). City/state from postcode. Company from the
   email domain. Card type from the first digits. Currency from the country. Every derived field is a field
   deleted.
4. **Can we defer it to a system that already has it?** Address autofill, payment sheets (Apple Pay / Google
   Pay / Payment Request API), OAuth for profile data. Handing the field to the platform is usually faster
   than any form you can design.
5. **Is it optional but unmarked?** Mark optional fields explicitly rather than marking required ones —
   there are usually fewer optional ones, and an unmarked field reads as required.

**Confirm-email and confirm-password fields.** Both mostly harm. Confirm-email doubles the typing and is
routinely defeated by copy-paste, and a wrong-but-confirmed address fails exactly the same way — the
verification email is the real check, so send that and skip the field. Confirm-password exists because the
input is masked; unmask it instead. GDS removed every confirm-password input from GOV.UK Accounts after
shipping a show/hide password component (GDS technology blog, 2021). Keep a confirmation field only where a
typo is silently unrecoverable and there is no later verification step.

**How it fails:** deleting fields the business actually needs, then reintroducing them as a mandatory
post-signup interstitial, which is the same friction with worse timing. And in B2B, a lead-qualification
field that lets sales reach the right person can be worth more than the marginal signups it costs — decide
with `behavioral-metrics`, not with a blog post's field-count target.

#### Before / after: a trial signup form

**Before** — 15 inputs, three of them redundant:

```html
<!-- First name, Last name, Email, Confirm email, Password, Confirm password,
     Company, Job title, Company size, Phone, Country, How did you hear about us?,
     [ ] Email me product updates, [x] I agree to the terms, CAPTCHA -->
<input type="text" name="fname" placeholder="First name">
<input type="text" name="lname" placeholder="Last name">
<input type="text" name="email" placeholder="Email">
<input type="text" name="email2" placeholder="Confirm email">
<input type="password" name="pw" placeholder="Password (8+ chars, 1 number, 1 symbol)">
<input type="password" name="pw2" placeholder="Confirm password">
<select name="size"><!-- 8 options --></select>
<select name="country"><!-- 195 options, alphabetical, defaults to Afghanistan --></select>
<input type="text" name="phone" placeholder="Phone">
<label><input type="checkbox" name="marketing" checked> Email me product updates</label>
<button>Submit</button>
```

Everything wrong here is a named failure: placeholders as labels (the label vanishes on focus and the field
becomes unlabelled for screen readers), password rules that disappear the moment you start typing, a
country dropdown whose default is alphabetical rather than likely, `type="text"` on an email field so the
mobile keyboard has no `@`, no `autocomplete` attributes so nothing autofills, a pre-ticked marketing
consent that is unlawful under the GDPR (see move 3), and a "Submit" button that names the mechanism instead
of the outcome.

**After** — 2 inputs:

```html
<form>
  <label for="email">Work email</label>
  <input id="email" name="email" type="email" autocomplete="email"
         inputmode="email" autocapitalize="off" spellcheck="false" required>

  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="new-password"
         minlength="12" required aria-describedby="pw-help">
  <p id="pw-help">At least 12 characters. Use anything you like — no symbol rules.</p>
  <button type="button" aria-pressed="false" data-toggle-password>Show password</button>

  <button type="submit">Start free trial</button>
  <p>No card required. By continuing you agree to the <a href="/terms">Terms</a>.</p>
</form>
```

Name, company and role are asked inside the product when they first do something visible (name on the first
shared document, company when they invite a teammate). Country is derived and editable at checkout. Phone
moves to an optional profile field. Marketing consent becomes a separate, unticked, freely-refusable opt-in
shown after signup. The password rule is stated once, permanently, and relaxed to length-only — which is
also the current NIST SP 800-63B guidance, so it is a security improvement as well as a usability one.

Details that matter and are invisible in a screenshot: `autocomplete="new-password"` tells password managers
to offer a generated password; `autocomplete="email"` fills from the platform's stored identity;
`inputmode` and `autocapitalize` fix the mobile keyboard. Field-by-field attribute recipes are in
`references/forms.md`.

### 3. Set the default — the most under-used lever in most apps

**The default effect (Johnson & Goldstein, 2003, "Do Defaults Save Lives?", *Science*).** Countries with
opt-out organ-donor consent showed dramatically higher recorded consent than otherwise similar opt-in
countries; the authors reproduced the effect in a controlled online experiment where the only manipulation
was which box was pre-ticked. One caveat worth knowing so you don't overclaim in a design review: *recorded
consent* is not *donations performed*, and real donation rates depend on family veto and transplant
infrastructure. **Madrian & Shea (2001)** is the cleaner field evidence for product work — a single firm
switched 401(k) enrolment from opt-in to automatic and participation among new hires jumped from a minority
to the large majority, with most people also staying on the default contribution rate and default fund.
A meta-analysis of default effects (Jachimowicz, Duncan, Weber & Johnson, 2019) finds a reliable
moderate-to-large average effect, which puts defaults among the most robust findings in this whole domain —
unlike several crowd-pleasers flagged below.

**The mechanism** tells you when defaults will and won't move: a default is simultaneously the low-effort
option, an implicit recommendation from the vendor, and the reference point against which alternatives are
judged as losses. All three push the same way, and the push is largest when the user is uncertain,
uninterested, or in a hurry — which describes most settings screens.

**What to build:**

- Every select, toggle, radio group and prefillable field ships with a considered default. "No default" is
  itself a choice, usually the worst one, because it converts a free decision into a required one.
- Default to the **most common correct answer**, computed from your own data, not to the first item
  alphabetically. Country defaults to the user's actual country; date range and sort order default to what
  people actually pick.
- **Personalise over time** where you can: last-used value, most-used value, a team template's value.
- **Make the default visible and changeable in one gesture.** A default that is hard to find or override is
  a decision taken away, not a decision made easier. Prefills from autofill, geolocation or an OAuth profile
  are defaults the user can edit, never locked values.

**Smart defaults vs. dark defaults.** The test is whose interest the default serves when they diverge. A
default that costs the user money, exposes their data, enrolls them in recurring billing, or grants consent
is not a smart default. Pre-ticked consent is specifically unlawful in the EU — the CJEU held in *Planet49*
(C-673/17, 2019) that a pre-checked box is not valid consent under the GDPR/ePrivacy regime, and the same
logic applies to bundled marketing opt-ins. Any default touching consent, payment, sharing or data retention
goes through `ethical-persuasion-audit` before it ships.

**How it fails:** defaulting a field that genuinely has no common answer teaches users to trust prefilled
values, so they stop reading and submit wrong data. If you cannot name the reason a value is the default,
leave it empty and label it clearly.

### 4. Validate at the right moment, and never lose what they typed

Validation timing is where forms are won and lost, and both extremes are wrong. Validating on every
keystroke tells someone their email is invalid while they are still typing the second character —
punishment for being mid-word. Validating only on submit makes them fix errors in a batch, after they have
mentally finished, often with the page scrolled somewhere else.

**The rule (widely known as "reward early, punish late"):** validate a field when the user *leaves* it, not
while they are in it — except when they are re-editing a field that already failed, where you switch to
live validation so they see the moment they've fixed it. Positive confirmation (a checkmark for an available
username) can and should appear early.

The evidence here is one small named study, and worth citing honestly: Wroblewski's inline-validation test
with Etre (*A List Apart*, 2009, n=22) found the best inline-validated form beat after-submit validation on
success rate, error rate, completion time and satisfaction. Small sample, one form, one lab — treat as a
strong prior, not a law, and note that the same body of practice has since converged on *not* validating
during first entry, which the original study did not isolate.

**Error message rules.** An error message has one job: get the user to a valid state. Structure it as *what
went wrong → how to fix it → why we need it, if that isn't obvious*. "Invalid input" names nothing and fixes
nothing; "Enter a date in the future" does both. "Please enter a valid phone number" argues with a user who
believes theirs is valid; "We need a mobile number to send the verification code — include your country
code" explains the constraint. Put the message adjacent to the field, wire it with `aria-describedby`, mark
the field `aria-invalid="true"`, move focus to the first error on submit failure, and never signal an error
with colour alone. Copy patterns per situation are in `references/forms.md`.

**Preserving input is non-negotiable.** A failed submit that clears the form, loses an upload, or drops
everything below the error is the single most reliable way to lose a user who had already decided to buy.
This isn't just etiquette: WCAG 2.2 SC 3.3.4 requires that submissions causing legal or financial commitments
be reversible, checked, or confirmed. Concretely: keep server-rendered forms repopulated from the submitted
values; persist long or multi-step forms to `localStorage` or the server as the user goes; keep uploaded
files on a session-scoped store so a validation failure elsewhere doesn't force a re-upload; and on network
failure, retain the payload and offer retry rather than erasing it.

**How it fails:** aggressive live validation on fields with legitimate intermediate states (a phone number
being typed, a formula being written) generates a stream of red that trains users to ignore errors.

### 5. Perceived performance is a friction problem

Latency is not a backend concern that becomes a UX concern at some threshold; it is friction with a
stopwatch on it. Two sets of numbers, both from named sources, both durable:

**Miller (1968), popularised by Nielsen (1993):**

| Budget | What the user experiences | What to build |
|---|---|---|
| ~0.1s | Feels instantaneous; the system responded, not "is responding" | No loading state at all. Direct manipulation, local state, optimistic update |
| ~1s | Flow of thought stays unbroken; they notice, but don't lose the thread | No spinner needed; a subtle state change is enough. Never flash a loader here |
| ~10s | Upper limit on holding attention to one task | Determinate progress, and the ability to leave and come back |

**The Doherty threshold (Doherty & Thadani, IBM technical report GE20-0752-0, November 1982, "The Economic Value of Rapid Response
Time"): ~400ms.** The industry standard at the time was a 2-second response; Doherty and Thadani showed
productivity kept climbing well below that, peaking around 400ms. The finding that matters is the mechanism,
not the number: *system response time drags user think-time with it.* A slow system doesn't just cost you
the wait — it makes the human slower on their next action too. If you build a tool people use repeatedly,
400ms round-trip is the target, and it is a target for the p75/p95 on your users' real devices and networks,
not the median on your laptop.

**Loading states, in order of preference.** First, be fast enough not to need one — prefetch on intent,
cache, render from local state, stream partial results. Under ~300ms show nothing at all: a spinner that
appears and vanishes reads as a flicker and makes the interaction feel *less* stable, so delay any loader by
200–500ms and give it a ~300ms minimum lifetime once shown. Between 1s and 10s, indicate **in place** —
where the result will appear, not as a full-screen overlay that destroys the user's context. Past 10s, show
determinate progress plus a way to leave and be notified. Full decision table in
`references/perceived-performance.md`.

**Skeleton screens vs. spinners: the evidence is weaker than the blog posts.** Viget's 2017 test (n=136,
mobile, three loading treatments of identical length) found skeleton screens performed *worst* on perceived
duration, against both a spinner and a blank screen; other write-ups of similar comparisons report the
opposite ordering. Nobody has a clean, replicated answer, and the widely circulated "skeletons feel 20–30%
faster" figures have no traceable source. What holds up mechanically: a skeleton matching the final layout
prevents layout shift (a real, measurable harm), and a skeleton that *doesn't* match is worse than nothing
because it makes a prediction and breaks it. So use skeletons for content-shaped regions whose shape you
know, in-place spinners for actions and unknown shapes, and no shimmer on a 300ms load.

**Optimistic UI — when it's safe.** Render the success state immediately, reconcile with the server after.
The biggest perceived-performance win available, and safe only when all four hold: the action succeeds
nearly always; failure is reliably *detectable* by the client; the action is reversible or replayable so
rollback restores a genuinely true state; and the user can understand the rollback when it happens.

Safe: like/unlike, mark as read, reorder, toggle a setting, add a tag, send a chat message (with a pending
state and retry). Unsafe: payments and authorisations, irreversible deletes, anything where the user
navigates away believing it succeeded, and anything whose value is *assigned by the server* — final price,
tax, invoice number, stock availability, generated IDs. Never optimistically render a number the server
computes. On rollback, restore the exact prior state and say plainly what didn't save; a silent revert is
worse than a spinner, because the user believes the wrong thing until they notice.

**Fill the wait with work the user wanted anyway.** Upload in the background while they keep filling in
metadata. Show a low-res preview while the full render completes. Start the next step's form while the
previous step commits. A wait spent doing something is shorter than a wait spent watching.

**Operational transparency / the labour illusion (Buell & Norton, 2011, *Management Science*).** In travel
search experiments, showing users the work in progress — naming the airlines being checked — increased
perceived value relative to a faster but opaque wait. Use it for genuinely long operations: name the step,
count the items, show what was found. Two caveats. Buell and Norton's own work shows the effect reverses
once the wait is long enough. And **artificially slowing an operation so it looks like more work is a
deception pattern** — a fake three-second "analysing your answers…" over an instant lookup manufactures a
belief about your product that isn't true. Show real work; never invent it, and take any argument about it
to `ethical-persuasion-audit`.

**End the wait well.** The peak-end rule (Kahneman, Fredrickson, Schreiber & Redelmeier, 1993) says
remembered experience is dominated by the most intense moment and the ending. Finish into a complete,
usable, correctly scrolled result rather than a half-rendered page the user has to wait through again.

More detail — a loading-state decision table, prefetch strategies, and what to measure — is in
`references/perceived-performance.md`.

### 6. Fitts's law: the geometry of effort

**Fitts (1954).** Time to acquire a target is a function of the distance to it and its size — formally
proportional to `log2(2D/W)`. Far and small is slow and error-prone; near and large is fast. It is one of the
most reliably replicated findings in human performance, and it has direct, non-obvious consequences:

- **Size touch targets by the finger, not the glyph.** Apple's HIG specifies 44×44pt, Material Design
  48×48dp with 8dp spacing; WCAG 2.2 SC 2.5.8 requires 24×24 CSS px at AA and SC 2.5.5 asks 44×44 at AAA.
  Expand the hit area past the visible icon with padding or a pseudo-element rather than inflating artwork.
- **Bind labels to inputs.** `<label for>` makes the label part of the target — a free multiplication of hit
  area on every checkbox and radio in your product, and the most common Fitts bug in real codebases.
- **Screen edges and corners are effectively infinite targets on pointer devices** (Tognazzini, "A Quiz
  Designed to Give You Fitts", 1999). The cursor clamps at the edge, so an edge-flush control has unbounded
  depth and a corner is unbounded in two dimensions — this is why the macOS menu bar works. The effect
  disappears for touch, for non-maximised windows, and between two monitors, so don't build a critical web
  interaction on it.
- **Put the action where the hand already is.** Primary submit at the end of the form, not the top of the
  page. On mobile the reachable zone is the lower screen. Hoober's observational study of 1,333 people (2013)
  found 49% held the phone one-handed (36% cradled, 15% two-handed) and that around three quarters of
  touches were thumb-driven — so one-handed is the plurality case, not the majority. Bottom sheets and
  bottom nav beating top-right buttons follows from Fitts plus that grip data as a reach heuristic, not
  from a measured comparison.
- **Distance is a safety feature.** Delete does not belong adjacent to Save; "Cancel subscription" does not
  belong next to "Update card". When separation isn't possible, change the interaction cost instead: a
  different gesture, or — better, see move 9 — make it undoable.
- **Diagonal travel across menus.** Moving from a parent item to a submenu item passes over siblings and
  closes the submenu. Amazon's mega-dropdown tracks pointer direction toward the submenu before switching
  (documented by Ben Kamens, 2013); the cheap version is a short close delay on mouse-out.

**How it fails:** Fitts is about *acquisition*, not *decision*. Making a button huge doesn't help someone who
doesn't know whether to press it. And enlarging every target competes with information density — for an
expert tool used all day, a compact layout the user has memorised can beat a spacious one, because learned
position collapses the search cost that spacing was buying.

### 7. Structure the choice — and don't misuse Hick or Miller doing it

**Hick's law (Hick, 1952; Hyman, 1953).** Reaction time to choose among *n* equally probable, equally
familiar alternatives grows with `log2(n+1)`. Two things about this are routinely got wrong.

First, it describes a **simple choice reaction** among options the person already knows and does not need to
evaluate. It is a decent model for "which of these five toolbar buttons do I press" and a bad model for
"which of these three pricing plans is right for my team" — the latter is a *comparison* cost driven by how
different and how consequential the options are, not by how many there are.

Second, and this is where people do damage: Hick's law is often quoted to justify shortening lists. But it
governs *undifferentiated* choice — options the user must consider individually. A categorised, labelled,
sorted, searchable list lets the user prune: they pick a category, and the effective *n* is the number of
categories, not the number of items. A 200-item country list with type-ahead is faster than a 12-item
list of "regions" that makes you guess which one contains yours. **Structure beats truncation.** Reach for
grouping, ordering by likelihood, search, and progressive disclosure before you reach for deletion.

**Three folklore claims get cited to justify deleting options, and the verdict on each is the same — don't.**
Miller's 7±2 measured memory span for items held in mind, not menu length, and a menu is on the screen, where
the user recognises rather than recalls. Choice overload is small and conditional, not a licence to cut a
catalogue. Ego depletion failed replication, and the parole-board "decision fatigue" study usually paired with
it has unresolved confound critiques about case ordering. The full replies, with the study each claim actually
rests on, are in `ux-psychology/references/principles.md` §Commonly repeated claims that do not hold up; the
Sources block below carries the replication citations for a review where someone cites one.

**What to do instead of deleting.** Make the options comparable, name a recommended one, and support
filtering. Then order the flow so cheap, confidence-building, low-stakes choices come before expensive
irreversible ones, and so each choice's inputs are already known by the time it is asked: put the hardest
decision where the user has the most context, never stack five consequential ones on one screen, and let
people save and resume. That sequencing rests on working-memory limits, interruption risk, and abandonment
probability accumulating with every step — plainer ground than any of the three claims above.

### 8. Jakob's law: conventions are free speed

**Jakob's law (Nielsen).** Users spend most of their time on *other* sites and apps, so they expect yours to
work like the ones they already know. Every convention you honour costs the user nothing to learn; every
one you break spends attention that was supposed to go to your product.

Concretely, conventional means: logo top-left links home; cart top-right; primary action bottom-right of a
dialog on desktop; underlined blue-ish text is a link; a "hamburger" opens navigation; form label above
field; the browser back button works and doesn't destroy state; `Cmd/Ctrl+K` opens search in a modern web
app; a modal closes on `Esc` and on backdrop click; a shopping flow shows the total before asking for a card.

Novelty is a budget. Spend it on the thing that makes your product *worth using* — the core interaction that
is genuinely new — and pay conventional prices everywhere else. A file-manager metaphor in a novel 3D
interface has spent the whole budget on the file manager.

**How it fails:** "conventional" is not the same as "whatever competitors do", and it is not permission to
copy a competitor's deceptive pattern because it is common. Conventions are also *contextual* — the
convention for a developer tool is not the convention for a consumer marketplace. And genuinely bad
conventions exist (cookie banners, carousel heroes); matching them is not a defence.

### 9. Undo beats confirmation

Confirmation dialogs are a tax on the 99% of correct actions to catch the 1% of mistakes, and they don't even
work: a dialog that appears every time gets dismissed reflexively, so by the time the user actually needs it,
it has already been trained into invisibility. Undo inverts the deal — the correct action stays free, and the
mistake becomes recoverable. It maps to Nielsen's third heuristic, "user control and freedom" (1994), and was
argued most directly by Aza Raskin ("Never Use a Warning When you Mean Undo", 2010). Gmail's Undo Send is the
canonical shipped version.

**Build it as:** perform the action immediately, show a transient non-blocking confirmation with an Undo
affordance ("Message archived — Undo"), and hold the irreversible commit for a grace window if you can.
Keep undo on the keyboard (`Cmd/Ctrl+Z`) where the surface supports it, give the toast a long enough life
for a slow reader, and never make it the *only* recovery path — a toast that disappears is not a safety net
for someone using a screen reader or looking away. Pair it with a trash/archive the user can dig through.

**Keep confirmation when undo is genuinely impossible or the blast radius is large:** sending money,
deleting an account and its data, publishing to a public audience, actions affecting other people, bulk
operations across many records. Escalate friction to match: state precisely what will happen and to how many
things, require typing the resource name for the worst cases (GitHub's repository-deletion pattern), and
never make the destructive button the visually default one.

**How it fails:** an undo that doesn't actually restore state — the record comes back but its position,
permissions or associations don't. Un-restorable "undo" is worse than a confirmation because it made a
promise. If you can't restore fully, say what undo will and won't bring back.

## Anti-patterns

- **The pre-submit account wall.** Making someone create an account before they can see the total, the
  shipping cost, or the result. Let them do the work first and convert the anonymous session afterwards —
  guest checkout is repeatedly the single highest-impact checkout change in Baymard's research.
- **Placeholder text as the label.** It disappears on focus, so the user loses the field's identity exactly
  when they need it, it fails contrast requirements at typical styling, and screen readers treat it
  inconsistently. Use a persistent visible label.
- **Multi-step wizards that hide the shape of the task.** A flow with no visible step count or step names is
  an unbounded commitment; people bail rather than enter one. Show where they are and how much is left.
- **Splitting one form across five screens to look shorter.** Page transitions cost more than scrolling, and
  each page boundary is an abandonment opportunity. Split when steps are genuinely sequential or dependent;
  don't split for cosmetics.
- **Optimistic UI on money.** Rendering "Payment successful" before the authorisation returns. When it fails
  you have created a user who believes they bought something.
- **Fake progress.** Progress bars that don't track anything, "analysing…" delays over an instant lookup,
  loading animations added to make a product feel substantial. This is the deception edge of move 5.
- **The full-screen blocking spinner.** It destroys the user's context for a request that affected one
  region of the page. Load in place.
- **Disabled submit buttons with no explanation.** The user cannot tell what is missing, and disabled
  controls are often skipped by assistive tech. Leave it enabled and explain the failure on submit — or
  explain, next to the button, exactly what is blocking it.
- **Format tyranny.** Rejecting a card number with spaces, a phone number with dashes, a postcode in
  lowercase. Strip and normalise on your side.
- **Clearing the form on error.** Also: losing uploads, resetting scroll to the top of the page, and dropping
  everything the user typed when a session expires mid-flow.
- **Confirmation on the frequent action, no confirmation on the rare destructive one.** Look at the actual
  frequencies before deciding where friction goes.
- **Field-count theatre.** Cutting fields that the business needs and re-asking for them in a mandatory
  interstitial right after signup. Same cost, worse timing, and now it lands after the conversion event so
  your metrics look better while the user's experience got worse.

## Ship checklist

Run this against the screen or the diff:

- [ ] Every field answers: needed at all? needed *now*? derivable? deferrable to the platform?
- [ ] No confirm-email field; no confirm-password field unless the typo is unrecoverable (use show/hide).
- [ ] Every input has a persistent visible `<label for>`, correct `type`, correct `inputmode`, and a correct
      `autocomplete` token. Test that browser autofill actually fills the form.
- [ ] Every select, toggle and prefillable field has a considered default — the most likely correct answer,
      not the alphabetically first. No default that benefits you at the user's expense; nothing consent-
      related pre-ticked.
- [ ] Validation fires on blur, not per keystroke; re-validates live once a field has failed; positive
      confirmation shown early.
- [ ] Error messages say how to fix it, sit next to the field, are wired with `aria-describedby` /
      `aria-invalid`, and focus moves to the first error on failed submit.
- [ ] A failed submit loses nothing: values, uploads, scroll position, and multi-step progress all survive.
- [ ] Interactive targets meet 24×24 CSS px minimum (44×44 preferred on touch), with labels bound to inputs.
- [ ] Destructive actions are physically separated from frequent ones, and are not the visual default.
- [ ] Undo exists for anything reversible; confirmation reserved for the genuinely irreversible, and scaled
      to the blast radius.
- [ ] No loading indicator below ~300ms; loaders are delayed and have a minimum display time so they can't
      flash; loading happens in place, not behind a full-screen overlay.
- [ ] Anything over ~1s shows feedback; anything over ~10s shows determinate progress and lets the user
      leave.
- [ ] Optimistic updates only where the action is reversible, near-certain to succeed, and detectably
      failing. No optimistic rendering of server-computed values.
- [ ] No artificial delay anywhere. Any "working…" narration describes work that is really happening.
- [ ] The flow is completable by keyboard alone, and back-button behaviour doesn't destroy state.
- [ ] Latency measured at p75/p95 on a real mid-range device and a throttled network, not on your machine.
- [ ] Conventions honoured except where novelty is the point; you can name what you spent the novelty on.

## Sources

- **Cognitive load theory** — Sweller (1988); Sweller, van Merriënboer & Paas (1998) for the
  intrinsic/extraneous/germane split. Sweller (2010) and Kalyuga (2011) question germane load as a separate
  category; the extraneous-load rule is unaffected.
- **Hick's law** — Hick (1952); Hyman (1953). Applies to choice reaction among known, equally probable
  alternatives.
- **Fitts's law** — Fitts (1954). Edge/corner targeting: Tognazzini, "A Quiz Designed to Give You Fitts"
  (1999). Mega-dropdown hover intent: Ben Kamens (2013). Mobile thumb zones: Hoober (2013), observational
  study of 1,333 users.
- **Target size standards** — WCAG 2.2 SC 2.5.8 (24×24 CSS px, AA) and SC 2.5.5 (44×44, AAA); Apple HIG
  (44×44pt); Material Design (48×48dp).
- **Miller's 7±2** — Miller (1956), *The Magical Number Seven, Plus or Minus Two* — about immediate memory
  span, not menu length. Revised chunk estimates: Cowan (2001).
- **Jakob's law** — Jakob Nielsen. Usability heuristics (user control and freedom; recognition rather than
  recall; error recovery): Nielsen (1994).
- **Default effect** — Johnson & Goldstein (2003), *Science*; Madrian & Shea (2001), *Quarterly Journal of
  Economics*, on 401(k) automatic enrolment; meta-analysis: Jachimowicz, Duncan, Weber & Johnson (2019).
  Pre-ticked consent: CJEU *Planet49*, C-673/17 (2019).
- **Choice overload** — Iyengar & Lepper (2000); meta-analysis finding a near-zero mean effect:
  Scheibehenne, Greifeneder & Todd (2010).
- **Ego depletion** — Hagger et al. (2016) multi-lab registered replication found no effect. Do not build on
  it. **Decision fatigue in judges** — Danziger, Levav & Avnaim-Pesso (2011), critiqued by
  Weinshall-Margel & Shapard (2011) and Glöckner (2016).
- **Response-time thresholds** — Robert B. Miller (1968), *Response time in man-computer conversational
  transactions*; popularised by Nielsen, *Usability Engineering* (1993).
- **Doherty threshold** — Doherty & Thadani, *The Economic Value of Rapid Response Time*, IBM technical
  report GE20-0752-0, November 1982; ~400ms.
- **Inline validation** — Wroblewski with Etre, *A List Apart* (2009), n=22. Small single study.
- **Skeleton screens** — Viget (2017), n=136, found skeletons worst on perceived duration; other comparisons
  report the opposite. Evidence is genuinely mixed; the commonly quoted "20–30% faster" figures have no
  traceable source and are not repeated here.
- **Progress-bar perception** — Harrison, Amento, Kuznetsov & Bell, *Rethinking the Progress Bar*, UIST
  (2007): animation behaviour measurably changes perceived duration.
- **Operational transparency / labour illusion** — Buell & Norton (2011), *Management Science*.
- **Peak-end rule** — Kahneman, Fredrickson, Schreiber & Redelmeier (1993).
- **Checkout and form-field data** — Baymard Institute's ongoing checkout usability research (average ~15
  form fields vs. ~7 needed; ~70% average cart abandonment across 50 aggregated studies; guest checkout).
- **Password guidance** — NIST SP 800-63B (length over composition rules); GDS technology blog (2021) on
  removing confirm-password fields via a show-password component.
- **Undo over warnings** — Aza Raskin (2010).
- **Robustness in input handling** — Postel (1980), applied by analogy.

Where a number could not be traced to a named source it is stated qualitatively here rather than invented.

## References

- `references/forms.md` — field-by-field implementation recipes: `autocomplete` tokens, `inputmode` and
  keyboard selection, address and card formatting, phone and one-time codes, password fields, validation
  timing table, and error-message copy patterns. Read it while actually writing a form.
- `references/perceived-performance.md` — loading-state decision table, optimistic-UI safety checklist,
  prefetch and streaming strategies, and what to measure. Read it when a screen feels slow or you are
  choosing a loading treatment.
