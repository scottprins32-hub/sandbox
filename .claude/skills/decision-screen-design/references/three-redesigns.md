# Three redesigns, read element by element

These are reconstructions of worked examples from a video, presented there as conversion wins. No data was
published with them: no sample sizes, no effect sizes, no test duration, no statement of what was measured or
against what baseline. Treat them accordingly.

There is a second, more important limit. Each redesign changes eight to twelve things at once — image,
headline, price presentation, information order, button verb, and several new elements that did not exist in
the original. Even with clean data attached, a before/after of that shape cannot credit any single change,
and it cannot tell you whether some of the changes are cancelling each other out. What survives is the
*reasoning*: a coherent account of which question each screen forces the user to answer, and why one question
is answerable and the other is not. Study them as arguments, mine them for hypotheses, and take the
hypotheses to `behavioral-metrics` before you claim any of them worked.

Every legal claim below is stated as an obligation to verify for your market, not as advice. The scope catch
in Case 3 is the kind of thing people get wrong confidently, so it is spelled out.

---

## Case 1 — Subscription paywall for a games app

### Screen A

An abstract space illustration filling the hero. Headline: **"Get access to 1000+ futuristic and fun games."**
Price: **$19/month.** Three feature bullets: instant unlimited access, new games weekly, members-only
rewards. Button: **"Subscribe and start 7 days for free."**

### Screen B

Headline: **"How your free trial works."** Below it, a three-step timeline:

- **Today** — unlock the full library
- **Day 5** — we send a reminder your trial is ending
- **Day 7** — first charge, cancel any time before

Imagery: actual characters from actual games in the library, several titles visible. Button: **"Start my free
trial"**, with subtext **"Starts in 2 taps."**

### What changed, element by element

| Element | A | B | The question each version makes the user ask |
|---|---|---|---|
| Hero image | Abstract space illustration | Characters from real titles in the library | A: *"What kind of app is this?"* — unanswerable, so it resolves to a mood. B: *"Are these games I would actually play?"* — the question genuinely blocking the purchase |
| Headline | "Get access to 1000+ futuristic and fun games" | "How your free trial works" | A: *"Is 1000+ games worth $19/month to me?"* B: *"Do I understand what happens if I tap this?"* |
| Central content | Three benefit bullets | Three-step dated timeline | A: *"Do I believe these claims?"* B: *"When am I charged, and can I get out first?"* |
| Price | $19/month, stated as a fact | Charge date stated; **amount not shown in the reconstruction** | A: *"Can I afford this indefinitely?"* B: *"What happens on day 7?"* — see the gap flagged below |
| Commitment signal | None | "Day 5, we send a reminder" | A: *"Are they hoping I forget?"* B: *"Are they betting against my forgetting?"* |
| Button verb | "Subscribe and start 7 days for free" | "Start my free trial" | A: *"Am I ready to enter a recurring financial relationship?"* B: *"Am I willing to begin a bounded thing?"* |
| Button subtext | None | "Starts in 2 taps" | A: *"How much more of this is there?"* B: *"Two taps. Fine."* |

### The mechanisms worth taking away

**The hard-question / easy-question swap.** A's headline poses a forecasting problem: predict your own future
usage, price it, compare it against alternatives you would have to go and find. Nobody does that on a paywall.
Kahneman and Frederick's *attribute substitution* (2002) says people faced with a hard question quietly answer
an easier one instead — and on a screen like A, the substituted question is usually *"do I trust this app not
to bill me forever?"*, which abstract space art answers badly. B performs the substitution deliberately and
honestly: it puts an easy, true, fully answerable question on the screen and answers it. That is the move.
Not "make the ask smaller" — *choose the question*.

**The day-5 reminder is a costly signal.** Signalling theory (Spence, 1973, on job-market signalling; Zahavi,
1975, on handicaps in biology) says a signal is credible in proportion to what it costs a liar. A company
whose revenue depends on users forgetting to cancel cannot cheaply promise a reminder — the promise is
expensive for exactly the businesses it would be most useful to fake. That is why the line reads as good
faith rather than as copy. Two conditions attach: you have to actually send it, and you have to expect
trial→paid conversion to fall when you do. The bet is that refunds, chargebacks, one-star reviews and
"how do I cancel" tickets fall further. Instrument both sides before you ship it, or you will lose the
argument to whoever owns the conversion number.

**Verb weight, and the line it must not cross.** "Subscribe" names a recurring obligation that continues until
someone stops it. "Start" names a bounded action. The reduction in perceived commitment is real. It is also
the exact thing consumer law is watching: under the EU Consumer Rights Directive (2011/83/EU, Art. 8(2)) the
control that creates a payment obligation must make that obligation unambiguous, and US ROSCA requires
material terms disclosed clearly before billing information is taken. A soft verb is legitimate only when
the price and the charge date sit adjacent to it and cannot be missed. B passes *because* the timeline is
right there — the verb and the disclosure travel together, and shipping the verb without the timeline is the
deceptive version of the same change.

**The gap in B, which you should not copy.** As reconstructed, B states the charge *date* but never the
*amount*. That fails both the disclosure obligations above and the plain honesty test. Fix it in place: **"Day
7 — first charge of $19, cancel any time before."** Nothing about the redesign's logic requires hiding the
number, and hiding it converts a trust-building screen into a drip-pricing one.

**First-person possessive framing — thin evidence, flag it as such.** "Start *my* free trial" over "Start
*your* free trial" traces to a single practitioner A/B test (Michael Aagaard, ContentVerve/Unbounce, around
2013) on one landing page, endlessly re-quoted at "+90%". There is no published replication and no controlled
study. The proposed mechanism — self-referential encoding, after Rogers, Kuiper & Kirker (1977) — is about
memory for self-relevant material, and the leap from encoding to click-through is not evidenced. Treat it as
a free coin-flip: costs nothing to choose, never worth arguing about in a review, never worth citing as a
number. If someone quotes the 90% at you, this paragraph is the reply.

**Effort specificity.** "Starts in 2 taps" bounds the remaining cost. An unknown cost gets estimated
pessimistically — the user has been through enough signup flows to assume the worst — so naming it converts a
vague dread into a comparison they can make. Same family as showing step counts in a wizard
(→ `friction-and-flow`, on wizards that hide the shape of the task). One requirement: count the taps on the
real device. A promise of two that costs four is a small lie landing at the precise moment you asked for
trust.

**Product imagery over decoration.** A's space art is unfalsifiable, and an unfalsifiable image cannot be
believed either — it carries no information the user can check, so it resolves to genre. B's character art is
evidence: recognisable titles, checkable against taste. The general form is *show the thing, not the feeling
about the thing.*

**The compliance dividend.** B's timeline is close to what auto-renewal rules in several markets already
require, which is worth knowing because it turns a design argument into a procurement one. California's
amended Automatic Renewal Law (in force 1 July 2025) covers free-to-pay conversions, requires express
affirmative consent to the renewal terms, mandates a reminder 3–21 days before expiry for promotional periods
longer than 31 days, requires annual reminders for all auto-renewals, and requires online cancellation via a
prominent direct link. ROSCA and FTC Act §5 apply federally regardless of the vacated Negative Option Rule
amendments. The EU currently has *no* general pre-charge reminder duty — the CRD covers pre-contractual
information and the payment-obligation button, not reminders — though the Commission's Digital Fairness Act
work has reminders and opt-in auto-renewal explicitly on the table. Read that honestly: for a 7-day trial,
the day-5 email is *above* today's legal floor almost everywhere. It is the direction the floor is moving,
and building it now costs you one email job.

### What generalises

- **When the screen's real question is hard, put an easier true question on the screen and answer it — do not
  shout the hard one louder.** Where this does *not* apply: a user who is actively comparison-shopping and
  already wants the category came to answer the hard question. Burying the price behind process detail then
  reads as evasion. Enterprise pricing pages, renewals, and any repeat purchase want the number first.
- **Buy trust with promises that would be expensive to fake.** A reminder before charging, a real cancellation
  date, a stated refund window. Where it does not apply: anywhere you cannot keep the promise — an unkept
  costly signal is worse than none, because it converted a passive user into a betrayed one. And where the
  promise is already legally mandatory it is table stakes rather than a signal; say it anyway, but do not
  expect credit.
- **Show the product, not the mood.** Where it does not apply: products with nothing to photograph —
  insurance, infrastructure, compliance tooling. The equivalent there is a concrete artefact rather than an
  image: a real report, a real dashboard with real numbers, a named customer's actual result.
- **Softening the commitment verb is legitimate only when the commitment is disclosed next to it.** The verb
  and the price are one unit. Split them and you have built the pattern, not the fix.

---

## Case 2 — Ride-hailing option picker

### Screen A

Three options, each with a price range: **GoX $13–17**, **Comfort $17–22**, **GoXL $16–21**.

### Screen B

One price per option. Under GoX, an arrival line: **"12:53pm, 2 min away."** A small green **"Cheaper"** badge
on GoX. Above the option list, a map card confirming the destination.

### What changed, element by element

| Element | A | B | The question each version makes the user ask |
|---|---|---|---|
| Price format | Range, $13–17 | Single number | A: *"Which end will I actually pay — and how badly can this go?"* B: *"Is that worth it?"* |
| Numbers on screen | Six | Three | A: *"What am I even comparing — floors, midpoints, or worst cases?"* B: *"Which of these three?"* |
| Time information | Absent | "12:53pm, 2 min away" | A: *"How long will I stand here?"* — unanswerable, so it becomes a reason to check another app. B: *"Is 9 extra minutes worth $4?"* |
| Recommendation | None | Green "Cheaper" badge | A: *"Which one is the sensible choice?"* B: *"Do I want the sensible choice, or something else?"* |
| Destination | Not shown | Map card above the options | A: *"Is $17 a fair price for… what, exactly?"* B: *"That's my trip. Now, which car?"* |
| Screen's implicit stage | Still deciding whether to travel | Already travelling; choosing how | A: *"Should I do this?"* B: *"Which one?"* |

### The mechanisms worth taking away

**A range anchors near its ceiling and reads as risk.** Two things stack. Anchoring (Tversky & Kahneman, 1974)
means the numbers on screen become the reference points for judgement, and for a *cost* people plan against
the top of the range — you budget $17, not $13. Separately, a range is the vendor admitting uncertainty about
its own price, and uncertainty in a price is read as exposure: the user's question stops being "is this worth
it" and becomes "how badly can this go". Be honest about the evidence here — "ranges are evaluated at their
upper bound" is a reasonable composition of anchoring with loss framing, not a single named finding. State it
as a mechanism, not a result.

**Three ranges is six numbers and no comparison rule.** The cost is not the count. It is that the user must
first invent a rule — compare floors? midpoints? ceilings? — before they can compare anything, and the rule
is not on the screen. Note that GoXL's $16–21 overlaps Comfort's $17–22 in a way that defeats every simple
rule, which is the real defect. This is the point `friction-and-flow` makes about Hick's law: structure beats
truncation. B does not remove options, it supplies the rule.

**Evaluability and choice deferral.** Hsee's work on joint versus separate evaluation (1996) shows attributes
that are hard to evaluate get underweighted, and options that are hard to *compare* produce deferral rather
than a different pick — Dhar (1997) on preference for the no-choice option is the direct statement. On a
ride-hailing screen "defer" is not neutral: it means backgrounding the app and opening a competitor, at the
exact moment the user most wants the problem solved. The failure mode of a hard comparison is not a worse
choice, it is no choice.

**Reframing cost into convenience.** "12:53pm, 2 min away" changes the axis. The user was comparing money
against money with no way to break the tie; now they are trading money against time, which is a trade they
know how to make. This is the ethical form of the move and worth naming as such: you *added* an attribute, you
did not suppress one. Hiding the price and showing only the ETA would be the extractive version of the same
idea. Both numbers on screen, user picks the trade.

**A one-word badge does the categorisation for them.** "Cheaper" collapses the expensive part of comparison —
working out which bucket each option belongs to — into a glance. Three conditions, all non-negotiable:

1. **It must be true against the options actually shown.** A "Cheaper" badge on the second-cheapest row is a
   misrepresentation, not a nudge.
2. **It must be computed at render from the same numbers on the screen** — not configured, not assigned by a
   growth experiment, not attached to the highest-margin tier. `ethical-persuasion-audit` states the general
   rule: for every dynamic claim on screen, find the line of code that makes it true, or delete the claim.
3. **One badge per screen.** Badge everything and you have rendered a rank ordering as decoration; the user
   still has to decode it, and you have spent the salience for nothing (→ `attention-and-hierarchy`).

**Destination-first sequencing.** Confirming the trip on a map before showing prices is commitment and
consistency (Cialdini): a small settled decision — *yes, that is where I am going* — reframes what follows as
execution rather than deliberation. It is also, independently, correct information design, because you cannot
judge whether $17 is fair without knowing the trip it buys.

The abuse case is the same mechanic with the effort manufactured. Making someone enter an address, then a
card, then revealing a booking fee is sunk-cost extraction: the investment was harvested so the surprise
would survive. The test that separates them is mechanical — **is each step's information required to compute
the next step's output?** The destination is required to price the ride, so it is sequencing. A phone number
collected before a price is shown is not, so it is a trap. Drip pricing is the named version; see the money
path table in `ethical-persuasion-audit`.

### What generalises

- **Give one number and a comparison rule, not a range and a puzzle.** Where it does *not* apply: genuinely
  variable pricing — surge, metered fares, usage-based billing, anything whose final amount depends on facts
  not yet known. A single number there is a lie that becomes a dispute at charge time. Honest alternatives, in
  order of preference: (a) make the price actually fixed at booking and show it; (b) show a guaranteed maximum
  — *"€22 max, usually less"*; (c) show a clear point estimate with the variability named in one line —
  *"about €17, more if traffic is bad."* What you may not do is fabricate precision. A "€17" that bills at €23
  costs more in refunds and reviews than the range ever cost in conversions. Note the second-order effect
  though: the discipline of putting one number on the screen often forces the business to *actually fix the
  price*, and that is the larger win hiding inside this case.
- **Add the missing attribute rather than hiding the awkward one.** ETA next to price, delivery date next to
  shipping cost, seat count next to plan price. Where it does not apply: attributes the user cannot act on, or
  a third and fourth attribute — past two axes you have rebuilt the comparison problem you just solved.
- **A one-word label is the highest-leverage element on a comparison screen, and the easiest to turn into a
  lie.** It only works while it is derived from the data in front of the user.
- **Sequence so that each step's input is needed for the next step's output.** Where it does not apply:
  sequencing that exists to accumulate sunk cost before a disclosure. Same shape, opposite purpose; the test
  above tells them apart in one question.

---

## Case 3 — Accommodation listing

### Screen A

A small thumbnail. Title: **"Beach House."** **4.8 stars.** **EUR 89/night.** Check-in and check-out dates.
Button: **"Reserve."**

### Screen B

A photo occupying the top half of the screen. Badges: **Superhost**, **Guest favourite**, **"1 of 24
photos."** Title: **"Beachside escape, steps from the sand."** Price: **EUR 129** struck through, **EUR 89**,
and a **"-31%"** badge. Dates rendered as **"Fri 28 March – Wed 2 April"** with a **"5 nights"** badge.
Button: **"Reserve · EUR 445 total."** Below it, a green shield line: **"Free cancellation before 26 March."**

### What changed, element by element

| Element | A | B | The question each version makes the user ask |
|---|---|---|---|
| Image | Small thumbnail | Half the screen | A: *"Is this place real?"* — the thumbnail is an ID photo. B: *"Can I picture myself there?"* |
| Trust marks | 4.8 stars | Superhost, Guest favourite, 4.8, "1 of 24 photos" | A: *"4.8 out of how many, judged by whom?"* B: *"Has someone already vetted this?"* |
| Title | "Beach House" | "Beachside escape, steps from the sand" | A: *"How far is the beach, actually?"* B: *"How far is the beach?"* — answered in the title |
| Price | EUR 89/night | EUR 129 struck, EUR 89, "-31%" | A: *"Is 89 a good price?"* — requires market knowledge they do not have. B: *"Am I getting a deal?"* — answered on screen, and only honest if the 129 is real |
| Dates | Raw check-in / check-out | "Fri 28 March – Wed 2 April" + "5 nights" | A: *"What days are those, and how many nights am I paying for?"* B: none — both facts are stated |
| Button | "Reserve" | "Reserve · EUR 445 total" | A: *"What will this actually cost me once the fees land?"* B: *"Do I want to spend 445?"* |
| Risk | Nothing | "Free cancellation before 26 March" | A: *"What if plans change?"* B: *"How long do I have to be sure?"* — a much smaller question |

### The mechanisms worth taking away

**Image scale is transport, not information.** A bigger photo carries no more data. It does a different job:
narrative transportation and mental simulation (Green & Brock, 2000, on transportation into narrative worlds).
The user stops evaluating a listing and starts imagining a stay. This is why "how big should the image be"
has no general answer — it depends on whether the decision is *imaginative* (holiday, clothing, restaurant,
car) or *specification-driven* (a disk, an API tier, a mortgage). Blow up the photo on a spec-driven purchase
and you have pushed the deciding facts below the fold (→ `attention-and-hierarchy`).

**Concrete, sensory, specific language.** "Beach House" is a category label; it tells the reader which shelf
the product sits on and nothing else. "Beachside escape, steps from the sand" names a sensation and a
distance. Two mechanisms are working: concrete language is processed faster and remembered better than
abstract language (Paivio's dual-coding tradition), and a *specific* claim is falsifiable, which is why it
reads as more likely to be true — "steps from the sand" invites a check in a way "great location" does not.
`persuasive-copy` owns this craft in general; the point here is placement. The sensory phrase belongs in the
title, on the decision screen, not in a description nobody scrolls to.

**Anchoring via reference price, and the percentage that does the arithmetic.** EUR 129 struck through gives
the EUR 89 a reference point it did not have (Tversky & Kahneman, 1974), and "-31%" removes the division. It
is the most effective element on this screen and the only one that can get you fined. See below.

**Day names and night count remove homework.** A's raw dates require the user to recall which weekdays those
are and to count the nights — and nights is the number the nightly price multiplies by. Both are recall rather
than recognition, and both are arithmetic assigned to a human: the extraneous-load category in
`friction-and-flow`. This is the cheapest change in all three cases and the one with the least downside.

**Total on the button kills hidden-fee anxiety at its peak.** The per-night figure is the marketing number;
EUR 445 is the number leaving their account. Putting it on the button means the user commits to a figure they
have read. And when 445 ≠ 5 × 89, the discrepancy becomes visible — which is correct. The fees exist either
way; the only decision available is whether the user meets them now or at step four of checkout. Meeting them
at step four is drip pricing, which is a named unfair practice, an expensive source of abandonment, and the
thing the Consumer Rights Directive's price-transparency and payment-obligation rules exist to prevent.

**The cancellation line answers the top objection where hesitation happens.** "Free cancellation before 26
March" changes the decision from *"is this the right place?"* — which needs research the user has not done —
to *"is this worth holding for ten days?"*, which they can answer immediately. That is reversibility used as
a conversion mechanism, the same principle `friction-and-flow` applies when it prefers undo over confirmation.
Conditions: the date must be computed from the actual policy for these actual dates, the shield styling must
not overstate a partial policy, and cancelling must be as easy as booking — a reassurance about an exit you
have made hard is the roach-motel pattern with better copy.

### The legal flag on the struck-through price — read this before shipping one

A reference price is lawful only if it is real. In the EU, for **goods**, Article 6a of the Price Indication
Directive (98/6/EC), inserted by the Omnibus Directive (EU) 2019/2161 and applicable from 28 May 2022,
requires any announcement of a price reduction to state the prior price, defined as **the lowest price the
trader applied during at least the 30 days before the reduction**. The CJEU confirmed in **C-330/23 (Aldi
Süd, 26 September 2024)** that the reduction itself must be *calculated from* that 30-day low, not from the
most recently charged price — so a "-31%" computed against last week's price is unlawful even where last
week's price was genuine.

**The scope catch, which is routinely got wrong:** the Price Indication Directive applies to *products*, which
the Commission's guidance on Article 6a (Commission Notice, December 2021) reads as **goods** — it does not
cover services or digital content. A night's accommodation is a service. So Article 6a does not directly bite
on this exact screen, and anyone citing it at a booking listing is citing the wrong instrument.

That is not a licence. A fictitious reference price on a service is caught by the **Unfair Commercial
Practices Directive (2005/29/EC)** as a misleading action, and EU consumer authorities have pursued
accommodation platforms on precisely this surface: the CPC network's coordinated action produced EU-wide
commitments from **Booking.com** (announced December 2019, implemented by mid-2020) and **Expedia** (2020)
governing how discounts, reference prices, room-availability claims and host status are presented. Several
Member States additionally apply national reference-pricing rules to services. Net effect: the practical
standard for a booking screen is the goods standard, arrived at by a different route. Build the strict version
once — as `ethical-persuasion-audit` argues generally — and stop tracking which directive owns which surface.
Verify current rules for every market you serve; this area moves.

**The badges carry the same obligation, renewed at render time.** "1 of 24 photos" is a trust signal *because
it is countable and checkable* — and only while there are 24 photos and they are of this property. "Superhost"
and "Guest favourite" are trust signals only while they are awarded by a stated rule, applied consistently,
and revocable when the rule stops being met. A badge assigned by a growth experiment, or granted to boost a
low-performing listing, is a fabricated quality claim; the UCPD as amended by Omnibus attaches explicit
authenticity and transparency duties to claims about reviews, rankings and paid placement. The runtime test
does not change: find the line of code that makes the badge true.

### What generalises

- **Scale the image to the kind of decision.** Large and immersive for imaginative purchases; small and
  dense for comparative or specification-driven ones. Where it does not apply: B2B tools, repeat purchases,
  anything the user is comparing across five open tabs, and any screen where the deciding fact is a number.
  There the photo is in the way.
- **Delete every arithmetic step between the number shown and the number paid.** Day names, night counts,
  totals, unit conversions, tax and fee inclusion. This one applies almost everywhere and almost never costs
  anything. The single exception is instructive: if showing the total early hurts, the fee is the problem, not
  the disclosure.
- **Answer the top objection in one line, next to the button.** The constraint is that you must *know* the
  objection — take it from support tickets, cancellation reasons and session recordings, not from a
  workshop. Where it does not apply: as a stack. Three reassurance lines around a button read as anxiety,
  not confidence. Pick the one.
- **Every trust badge and every reference price is a claim you re-make each time the page renders.** Where
  this bites hardest: badges owned by a team that does not own the data behind them. If nobody can point at
  the query, the badge is a liability with a rounded corner.

---

## Running this on your own screen

The transferable artefact from all three cases is not a layout. It is the audit: for each element, name the
question it makes the user ask, then check whether the screen can answer it.

Fill this in for the screen in front of you. One row per visible element — including the ones you inherited
and stopped seeing.

| Element | What it currently shows | The question it makes the user ask | Answerable from this screen? | An easier true question available? |
|---|---|---|---|---|
| Hero / image |  |  | yes / no |  |
| Headline |  |  | yes / no |  |
| Price presentation |  |  | yes / no |  |
| Supporting content |  |  | yes / no |  |
| Recommendation or badge |  |  | yes / no |  |
| Primary button label |  |  | yes / no |  |
| What is next to the button |  |  | yes / no |  |
| The top objection |  | *(is it addressed anywhere?)* | yes / no |  |

Rules for using it:

**Every "no" in column four is a defect.** A question the user cannot answer from the screen does not go
away — it gets answered by a guess, and on a commitment screen the guess is pessimistic. Either answer it or
replace the element with one that poses an answerable question.

**Rank by question-hardness, then change one thing.** Each of the three redesigns above alters eight to twelve
elements simultaneously. Ship a change of that shape and a conversion movement teaches you almost nothing:
you cannot transfer it to the next screen, you cannot tell which element is carrying the lift, and you cannot
see the one that is quietly costing you. Pick the single element you believe most hardens the question,
change that, measure, iterate. If the whole redesign genuinely has to ship at once — a rebrand, a platform
migration — then say out loud that it is a redesign, not an experiment, and do not report it as evidence for
any individual element.

**Measure the right thing.** On a paywall, trial→paid is not the metric; day-30 still-subscribed net of
refunds and chargebacks is, and the day-5 reminder is designed to trade the first for the second. On a
comparison screen, selection rate is not the metric; completed transactions net of disputes is. Define the
guardrail before the test, not after the result (→ `behavioral-metrics`).

**If you do not have the traffic for a test — and most teams do not — run the audit anyway.** Its output is a
ranked list of hypotheses about which question is blocking the decision, which is a better input to a design
review than a screenshot and a hunch. Just do not launder it into a claim about conversion afterwards.
