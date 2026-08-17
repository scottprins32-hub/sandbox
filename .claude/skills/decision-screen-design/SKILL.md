---
name: decision-screen-design
description: Designs the screen where someone decides to commit — pay, subscribe, book, upgrade, or pick a plan — by auditing what question each element makes the user ask, then replacing hard questions with easy ones. Use this for paywalls, pricing pages, plan comparison, free-trial and subscription screens, product and listing detail pages, checkout summaries, booking confirmation screens, upgrade prompts, and any "why isn't this converting" about a screen with a price on it. Distinct from `friction-and-flow`, which owns completing a task once the decision is made, and from `persuasive-copy`, which owns word-level craft anywhere in the product: this skill owns the composition of the commitment moment — what is on the screen, in what order, and what it makes the user wonder. Reach for it the moment a screen asks a human for money or a commitment, even when the request arrives phrased as a purely visual one.
---

# Decision screen design

A decision screen is where a user converts interest into commitment: money, a recurring charge, a booking, a
plan. It is not a form and it is not a page of copy. It is a **set of unanswered questions arranged in
space**, and the user resolves them in whatever order their eye lands, then either acts or postpones. Most
screens of this kind fail because they pose one enormous question — *is this worth it?* — to someone who
has not yet experienced anything worth paying for.

The core move is not persuasion. It is **question substitution**: change what the screen asks so that the
question the user actually faces is one they can answer right now, from this screen, with what they already
know.

## When this is the right skill

- A paywall, hard or soft; a free-trial, subscription or upgrade screen.
- A pricing page, plan comparison, or "choose your plan" step inside signup.
- A product or listing detail page — any screen where several priced options sit side by side.
- A checkout summary, booking summary, or confirmation screen: the last screen before the charge.
- Someone says "traffic is fine, conversion isn't", "people bounce off the pricing page", "trial starts are
  low", "nobody upgrades", or "we tried a bigger button and nothing happened".
- You are choosing what the primary button says on a screen that costs the user money.

Go elsewhere when: the user has already decided and now has to *fill something in* → `friction-and-flow`
(forms, steps, defaults, waiting). The question is purely **what the words should say** → `persuasive-copy`
(framing, social proof, error copy, charm pricing). You need the **deceptive-pattern taxonomy or the general
legal layer** → `ethical-persuasion-audit`, a gate on moves 2, 7, 8, 10 and 12 below. **Where the eye lands**
→ `attention-and-hierarchy`. **Concrete type, spacing, colour and elevation values** → the `ui-craft` set.
**Whether the change worked** → `behavioral-metrics`. One boundary is crossed on purpose: `persuasive-copy`
owns how a button label is written, this skill owns **which commitment the label is allowed to imply**.

## Diagnose first

Six answers change the advice more than any technique below.

1. **How much felt value does the user have right now?** None (opened the app ninety seconds ago), some
   (browsed, configured), or a lot (hit a limit on something they built). This decides whether you may ask
   the hard question at all. Zero felt value means the screen's job is to get them *to* value, not to close.
2. **Is the commitment recurring, and reversible?** A one-off €12 purchase and a €12/month auto-renewal are
   different objects, legally and psychologically. Recurring commitments carry a silent second question —
   *how do I get out?* — that the screen answers whether or not you put it there.
3. **Can you compute the price right now?** If yes, anything vaguer than the number is a choice you made. If
   genuinely not, see move 6 — a bare range is the worst available answer.
4. **Binary or comparative?** Binary (buy / don't) fails as *is it worth it*. Comparative (which of three)
   fails as *deferral* — they pick nothing and leave. Don't apply comparison advice to a paywall.
5. **Did they navigate here, or did you interrupt them?** A pricing page someone sought out can carry detail.
   An upgrade modal over a task in progress gets one sentence, and spends attention allocated elsewhere.
6. **What is the top objection — from evidence, not a brainstorm?** Teams reliably guess "price" when the
   real answer is "will it work with my thing" or "what if my plans change".

If the answer to 1 is "none", most of the moves below are premature and the real work is in
`onboarding-activation`.

## The audit method: one question per element

This is the reusable artefact of this skill. Run it on a screenshot, in about twenty minutes, alone or in a
review.

1. **Screenshot it and number every distinct element.** Headline, subhead, hero, each bullet, each price,
   each badge, each button, microcopy, the legal line, the close affordance. Anything the eye can land on
   separately is an element.
2. **For each, write the question it provokes** — the literal sentence in the user's head, in their words,
   not yours. Not "communicates value proposition". The question. An element that provokes no question at all
   is also a finding: it is occupying space and salience for nothing.
3. **Classify each question by what it costs to answer:**

   | Class | Example | Cost |
   |---|---|---|
   | **Self-answering** | "Can I try this for free?" next to a free trial | Free — the question and answer are the same object |
   | **Answerable from this screen** | "What's the total?" with the total on the button | Cheap |
   | **Requires arithmetic** | "How many nights is 28 Mar – 2 Apr?" | Expensive; error-prone; some users just stop |
   | **Requires information not present** | "What if I need to cancel?" | Very expensive — they leave the screen to find out, and mostly do not come back |
   | **Requires a value judgement they cannot yet make** | "Is 1,000 games worth $19/month to me?" | The most expensive question on any screen. Its usual answer is *later*, which means never |

4. **Replace, answer, or delete.** Hard questions get *substituted* with an adjacent easier one (move 1),
   *answered inline* (moves 4, 9, 10), or the element goes.
5. **Weight by load.** Headline, primary button and price frame the whole screen; a bullet does not. Fix the
   frame first — a screen whose headline asks the wrong question cannot be rescued by microcopy.

### Worked example of the output

The filled table for a games-subscription paywall, a ride picker and a hotel booking screen. Each row is one
of the moves below.

| Element | Question it asks now | Easier question to replace it with | The change |
|---|---|---|---|
| Headline "Get access to 1000+ games" | "Is this worth $19 a month to me?" | "Can I try this for free?" | "How your free trial works" |
| Feature bullets | "Do I want these features?" — unanswerable without using it | — | Delete; spend the space on evidence |
| Abstract hero illustration | "What is this, actually?" | Never asked | Screenshots of real games |
| Price "$19.99/mo" standing alone | "What happens if I forget to cancel?" | "When am I charged, and will I be warned?" | 3-step timeline naming the reminder day |
| Button "Subscribe" | "Am I signing up for something I can't get out of?" | "Where do I start?" | "Start my free trial" |
| (nothing under the button) | "Is there a form? Do I need my card? How long?" | — | "Starts in 2 taps" — if it is 2 taps |
| Option prices "$13–17 / $17–22 / $16–21" | "How much am I willing to risk?" ×3 | "Which one do I want?" | One computed price per option |
| Ride options shown before destination | "Do I even want a ride?" | "Which car?" | Confirm destination first; add "12:53pm · 2 min away" and a `Cheaper` badge |
| Booking card with no policy | "What if my plans change?" | Never asked | "Free cancellation before 26 March" |
| Button "Reserve", dates "28 Mar – 2 Apr" | "How much, total?" · "How many nights?" | — | "Reserve · EUR 445 total"; "Fri 28 Mar – Wed 2 Apr · 5 nights" |

The full before/after of each screen, element by element, is in `references/three-redesigns.md`. Read it when
you want a worked example to imitate, or to show a stakeholder what the audit produces on a real screen.

## The moves

### 1. Substitute an easier question

A paywall headed "Get access to 1000+ games", with a price and three feature bullets, asks: *is this worth
$19 a month?* Answering requires estimating value the user has never experienced, thirty seconds after
opening the app. There is no honest way for them to do it, so they answer the only available way — *not now*.
A paywall headed "How your free trial works" asks *can I try this for free?* — a question that answers itself
from the headline, so the next action is a small yes rather than a valuation.

**The general move:** name the hard question your screen currently asks, then find the **smaller adjacent
question that leads to the same place**. Adjacent matters — the easy question must be on the path to the
commitment, not a detour that harvests a click.

| Hard question the screen asks | Adjacent easier question | What changes on the screen |
|---|---|---|
| Is this worth $19/month? | Can I try it free? | Headline is the trial mechanics, not the catalogue size |
| Which of these three plans is right for my team? | Which one is built for a team my size? | Label each tier by who it is for, not by feature count |
| Do I want to commit to this trip? | Can I hold this without committing? | Free-cancellation date shown before the price |
| Should I upgrade? | Do I want to keep the thing I just hit the limit on? | Prompt fires at the limit, referencing the specific object |

**The mechanism, described honestly.** Kahneman and Frederick's *attribute substitution* (2002) describes
people spontaneously answering an easier question in place of a hard one without noticing the swap. That is a
description of intuitive judgement, not a licence. Here you change which question the screen poses, openly,
and the user still gets a true answer to it. If the substitution works only because they did not realise
which question they answered, you built a deceptive pattern — take it to `ethical-persuasion-audit`.

**The honest limit, and it is a big one.** This move *defers* the hard question; it does not answer it. It
works when the trial genuinely delivers the value, because then experience answers the valuation question
instead of argument. When the product does not deliver, you have converted a bounce into a cancellation, or
into a charge the user did not intend — forced continuity, not conversion. **Deferral is not conversion:
measure trial-to-paid and paid-retained, never trial-start**, and read rising trial starts against flat paid
conversion as a warning (→ `behavioral-metrics`).

### 2. Proactively disclose the downside

Replace feature bullets with a three-step timeline:

| Before | After |
|---|---|
| ✓ 1000+ games ✓ No ads ✓ Play offline | **Today** — unlock everything |
| $19.99/month | **Day 5** — we email you that the trial is ending |
| [Subscribe] | **Day 7** — first charge, $19.99. Cancel any time before |

The day-5 line is the whole point. It is the only element on the screen that runs against your immediate
interest, and it answers the question the price silently raised: *what if I forget?* A user who believes they
will be warned can say yes cheaply, because the decision has become reversible in their mind.

**The mechanism.** Volunteering information that costs you something is a costly signal: anyone can claim to
be trustworthy, but only someone who expects the relationship to outlast a single charge hands the user an
exit ramp. Nobody reasons this out; they experience it as *these people are not trying to catch me*.

**The literature, without overclaiming.** The **pratfall effect** (Aronson, Willerman & Floyd, 1966,
*Psychonomic Science*) found a blunder raised the likeability of a person already seen as highly competent
and *lowered* it for a mediocre one — but note what that study is: interpersonal attraction, a lab, 1966, a
person rather than a product. Closer is the **blemishing effect** (Ein-Gar, Shiv & Tormala, 2012, *Journal of
Consumer Research*), where a small dose of negative information improved product evaluations, but only when
it followed the positive information and was processed with low effort. Both moderators run against a
considered purchase, so this is not a general law of pricing screens; the wider two-sided-message tradition
points the same way without giving you a number. A sound mechanism and a hypothesis, not a coefficient.

**The non-negotiable condition: send the reminder.** A promised warning that never arrives is a lie rendered
in a timeline component, and for auto-renewing subscriptions a regulatory problem in several markets. Split
the jurisdictions, because they differ more than most teams assume: **reminder** duties sit in US state
auto-renewal laws (California's amended ARL, in force 1 July 2025, requires notice 3–21 days before a
promotional period longer than 31 days ends), alongside material-terms-before-billing duties under ROSCA and
FTC Act §5. **The EU has no general pre-charge reminder duty today** — the Consumer Rights Directive covers
pre-contractual information and the payment-obligation button, not reminders, and the UCPD catches deception
rather than mandating notices. Reminders and opt-in auto-renewal are on the table in the Commission's
Digital Fairness Act work, which is proposed rather than enacted. So a day-5 email sits *above* today's legal
floor almost everywhere — and in the direction the floor is moving. Verify per market;
see `ethical-persuasion-audit` on forced continuity. Engineering rule: **the timeline reads its dates from
the same record the billing job reads.** If the reminder is a marketing email another team can switch off,
the screen is promising something your system does not deliver.

### 3. Choose the verb by the commitment it implies

The first word of a button sets the **category of act** the user thinks they are performing, and trailing
words rarely undo it. Treat that as a design heuristic worth testing, not a measured effect about reading
order. **"Subscribe"** names a recurring contract,
and carries everything the user has ever felt about
subscriptions, including cancelling them. **"Start"** names a beginning, and beginnings are cheap and assumed
stoppable. **"Continue"** names nothing, which is its own problem on a screen that charges money. Softening a
heavy verb with trailing words does not undo the first one: *"Subscribe and start 7 days free"* still opens
with the contract. If the act really is starting a trial, name it that — *"Start my free trial"*.

**The constraint that stops this becoming a trick:** a soft verb is legitimate only on a button that does not
create a payment obligation *now*. The button that actually charges must say so, with the amount — "Pay €39",
"Subscribe · €12/month". In the EU this is explicit in the Consumer Rights Directive's order-button
requirement, and getting it wrong can leave the consumer not bound by the contract. Moves 3 and 10 are two
halves of one rule: **soft verbs for reversible starts, explicit payment language for charges.**

**First-person framing** — *"Start my free trial"* versus *"your free trial"* — is `persuasive-copy`'s call;
it owns the debunk. The short version: the circulating ~90% figure comes from one unreplicated 2013 test,
so treat it as a free coin-flip, never as a number to cite.

### 4. Kill uncertainty with a number

Under the button, in six words or fewer, answer the questions nobody types into a survey: *is there a form?
do I need my card? how long is this? does it charge now?* — `[ Start my free trial ]` over the line
*"Starts in 2 taps · no card for 7 days"*.

**The mechanism is checkability.** A number is falsifiable and a vague adjective is not, so the number
carries credibility the adjective cannot borrow. "Fast delivery" states your opinion of yourself; "delivery
in 23 minutes" is something someone can hold you to. `persuasive-copy` move 2 owns specificity generally;
here it is aimed at the **procedural** uncertainty specific to commitment screens — not *how good is it* but
*what happens when I press this*.

| Vague | Checkable |
|---|---|
| Quick setup | Live in about 4 minutes |
| Near the beach | 200 m to the sand — about 3 minutes' walk |
| Cancel any time | Cancel in 2 taps from Settings |
| No commitment | No card required for 7 days |

**The condition is absolute: the number must be true, and stay true.** "Starts in 2 taps" is a promise the
next screen keeps — if the flow grew a phone-number step last quarter, the microcopy is now a false statement
and the user's first experience of your product is catching you in one. Wire these strings to something real
where you can (a step count from the flow config, a p50 from your own telemetry) and put them on the same
review checklist as the flow.

### 5. Show the thing, not a decoration

A beautiful abstract hero — gradient blobs, an isometric illustration, a stock photo of a laptop — does not
answer *what am I actually getting*. Screenshots of real content do: the actual game characters, the actual
room, the actual dashboard with plausible data in it.

**The mechanism:** people cannot commit to something they cannot picture. Concrete imagery lets the user
simulate possession — run the "what would this be like for me" prediction the price is demanding. A
decorative hero gives that simulation nothing, so they run it on the price alone, the one attribute where
you lose.

Practically: use **the user's own content** whenever you have it — a paywall shown after someone built three
boards should show their three boards, the strongest version of this move and one almost nobody ships. Show
the product **in use**, at real density; an empty-state screenshot advertises an empty state. Then run **the
cover test**: hide all the copy, and see whether someone can still say what they would be getting. If not,
the image is decoration occupying the most salient region of the screen. Scale, crop and placement are
`attention-and-hierarchy`; legible text over photography (scrims, contrast floors) is `depth-and-overlays`
and `color-and-theming`.

### 6. One number beats a range

Three ride options priced $13–17, $17–22, $16–21 present six numbers and three simultaneous unknowns. People
do not appear to mentally average a range. The likely mechanism is anchoring composed with loss framing: for
a cost, you plan against the top of the range and read the spread as exposure. Treat that as a reasonable
composition of two established effects, not as a single named finding — it is a mechanism, not a result.
Note also that the ranges here *overlap* ($16–21 against $17–22), which defeats any simple comparison rule
and is the actual defect in the screen. So it asks
*how much am I willing to risk?* three times, and then asks the user to compare the three risks. A single
price per option turns all of that into *which one do you want?*

**The mechanism is evaluative ease, not option count.** Processing fluency — the subjective ease of handling
information — reliably shifts judgement across a wide range of tasks (Alter & Oppenheimer, 2009, *Uniting the
Tribes of Fluency to Form a Metacognitive Nation*). Options that are easy to evaluate get chosen; options
that are hard to evaluate produce **choice deferral**, where the user picks nothing rather than picking
wrong (Dhar, 1997, *Consumer Preference for a No-Choice Option*, showing deferral rises when no alternative
has a decisive advantage). On a commitment screen, deferral is abandonment with a politer name.

Note what this argument deliberately does *not* rest on: **choice overload**. The famous jam study does not
survive meta-analysis (Scheibehenne, Greifeneder & Todd, 2010, mean effect near zero), and
`ux-psychology/references/principles.md` grades it **Mixed** — a real effect that shows up reliably only
under specific moderators (complex choice set, difficult task, unclear preferences, no articulated goal),
none of which is "three options". The problem with three ranges is not that three is too many; it is that
each option is individually hard to evaluate. Fix evaluability, not cardinality.

**The generalisable rule: when you can compute a number, show the number.** A range transfers your
uncertainty onto the user, and uncertainty is the most expensive thing on a decision screen — the one cost
they cannot bound.

When the number genuinely is not knowable in advance, do not fall back to a bare range. **One number plus a
cap you own** — "About $16, never more than $19" — converts their risk into your guarantee, which is a thing
you can price. **One number plus the variable named** — "$16 · +$3 if you add a stop" — gives the spread a
cause under the user's control. Or **commit to one price** and absorb the variance, which is often the
cheapest fix and rarely considered.

### 7. Reframe the axis

Adding "12:53pm · 2 min away" under a price stops the screen being a price comparison and makes it a
convenience comparison. A one-word badge — `Cheaper`, `Fastest`, `Best for 4 people` — goes further: it does
the categorising the user would otherwise do themselves, which is the actual work you are removing.

Two rules keep it from backfiring. **Add an attribute only if it resolves the comparison or is the one people
actually decide on** — a second attribute that trades off against the first makes evaluation *harder* (move 6
in reverse), leaving them to weigh money against minutes with no exchange rate; sort by the deciding
attribute, or badge it. And **a badge must be a query result, not a design decision**: `Cheaper` computed
against the other options on this screen right now, `Most popular` a number from your database. A hardcoded
badge is a misleading commercial practice in the EU and a §5 deception risk in the US, and it is the kind of
thing that outlives you in a screenshot (see `persuasive-copy` on fake popularity claims and
`ethical-persuasion-audit` on runtime truth).

### 8. Sequence so the remaining decision is small

Confirm the destination before showing ride options, and the open question on the options screen becomes
*which car* rather than *should I take a ride at all*. The order of steps determines which decision is live
at each moment, and one small live decision beats one large one.

This is **commitment and consistency** (Cialdini, *Influence*, 1984) used legitimately; the related
foot-in-the-door work (Freedman & Fraser, 1966) points the same way with modest, heavily moderated effect
sizes, so lean on the sequencing logic rather than the number.

**The legitimacy test is whether the early step is genuinely load-bearing.** Confirming a destination is
information you need to price the ride — the user gets something for it. A five-question "personalisation
quiz" whose answers change nothing is manufactured investment, engineered so abandoning feels wasteful. That
is sunk-cost manipulation, and it gets sharply worse when costs are revealed only after the commitment —
**drip pricing** (move 10, and the money table in `ethical-persuasion-audit`). The clean rule: **every step
before the price gives the user something back, and the price is never worse than they could have inferred
at any earlier step.**

### 9. Answer the top objection inline, before it is asked

On a hotel booking screen the number-one hesitation is *what if my plans change*. So "Free cancellation
before 26 March" belongs on the decision screen, next to the price — not behind a "Cancellation policy" link,
and not on a terms page. A user who leaves the screen to resolve an objection has left the screen.

The method: **get the top three objections from evidence** — support tickets containing "can I", sales-call
notes, review text, exit-survey free text, session recordings of hesitation and scroll-back, never a
workshop. **Write each as the user's own sentence** ("what if it doesn't work with our payroll system", "how
hard is it to get my data out"). Then **place each answer inside the field of view at the moment of
hesitation** — adjacent to the price or the button, in the same visual group (→ `attention-and-hierarchy` on
grouping), not in a tooltip, an accordion or a link. If an objection cannot be answered in one line, that is
a product finding, not a copy finding.

Naming an objection does not plant it. The user already has it; the only variable is whether they resolve it
on your screen or somewhere else.

### 10. Put the total on the button

"Reserve" asks *how much, total, really?* — and the user knows from experience that the number shown is not
the number they will pay. "Reserve · EUR 445 total" answers it before it is asked. Late-appearing fees are a
well-documented source of checkout abandonment and the reason the disclosure rules below exist, so on most
booking and checkout screens this is worth testing first — but treat it as a hypothesis like everything else
here, not a ranked effect size. Increasingly it is not an optimisation at all but an obligation.

- **EU** — the Consumer Rights Directive requires the total price inclusive of taxes and all additional
  charges *where they can reasonably be calculated in advance*; where they cannot, it requires stating that
  such charges may be payable and how they are calculated — plus an order button that makes the payment
  obligation unambiguous. Drip pricing — fees appearing only at the final step — is generally treated as a
  misleading omission under UCPD Art. 7, assessed case by case rather than sitting on the Annex I blacklist,
  and as a CRD Art. 6 total-price problem.
- **US** — FTC Act §5 covers unfair and deceptive practices generally, and the FTC's **Rule on Unfair or
  Deceptive Fees (16 CFR Part 464)**, effective 12 May 2025, requires clear and conspicuous disclosure of the
  **total price** including all mandatory fees whenever a price is offered, displayed or advertised for
  **live-event tickets and short-term lodging** (government charges, shipping and genuinely optional add-ons
  may be excluded). It binds platforms and resellers, not just the venue or hotel. State junk-fee and
  auto-renewal statutes add more.

Build the strictest version once — total-inclusive pricing everywhere, itemised below, the button carrying
the number — and the legal question never arises while the conversion benefit is free.

### 11. Reduce mental math

"28 Mar – 2 Apr" makes the user compute the night count. "Fri 28 Mar – Wed 2 Apr · 5 nights" hands it to
them, and the day names make the trip concrete — weekend or not is a fact people decide with. **The rule
generalises: any arithmetic the interface makes the user perform is friction you chose to impose.** It is
extraneous cognitive load in the precise sense of `friction-and-flow` move 1 — demand created by
presentation rather than by the task.

| Makes them compute | Computed for them |
|---|---|
| 28 Mar – 2 Apr | Fri 28 Mar – Wed 2 Apr · 5 nights |
| €49/seat, 12 seats | €49/seat × 12 = €588/month |
| Billed annually at €588 | €588 today · renews 1 Sept 2027 |
| 31% off | €129 → €89 · you save €40 |
| Trial ends in 7 days | Trial ends Sun 23 Aug · first charge Mon 24 Aug |
| 500 GB included | Enough for about 40,000 photos |

The last row is the interesting one: translating a unit the user does not think in into one they do is the
same move as removing arithmetic, and it is where most storage, credit and API pricing pages fail.

### 12. Anchoring, and the line where it becomes illegal

A struck-through **€129** next to **€89** with a `-31%` badge reframes an €89 purchase as a €40 saving. It is
the oldest anchoring move there is (Tversky & Kahneman, 1974; `persuasive-copy` move 4 for the pricing
craft), it works, and it is the **most legally constrained technique in this skill**. This section is part of
the implementation, not a compliance appendix.

Where a reference-price rule binds, it binds on the arithmetic and not just the display: the reduction is
**computed on the lowest price you actually charged in at least the preceding 30 days**. A `-31%` badge
derived from €129 when €99 was that lowest price is exactly what the rule prohibits — against €99 the badge
reads −10%.

**The plain engineering rule that satisfies all of it:** *a strikethrough price must be a price you actually
charged, and the reference period must be checkable from your own data.*

```tsx
// Finding: the reference price is a marketing field someone types into the CMS.
<Price was={product.compareAtPrice} now={product.price} />

// Fix: the reference price is derived from what you actually charged, in the window.
const prior = lowestPriceCharged(product.id, { since: daysAgo(30) });   // from price history
const pct   = prior && prior > price ? Math.round((1 - price / prior) * 100) : null;
// No qualifying prior price in the window => render the price alone. No strikethrough, no badge.
```

Which means price history is a **first-class table** — product, price, effective from, effective to, market —
not something reconstructed from order lines when a regulator asks. If you cannot answer "what was the lowest
price we charged for this in the last 30 days" with a query, you cannot show a defensible discount badge.
Build that strict version once and apply it everywhere; the alternative is a per-market conditional in your
pricing code, which is how mistakes ship.

Which instrument binds depends on what you sell and where —
`references/reference-pricing-law.md` has the scope analysis per market: EU Article 6a and *Aldi Süd* for
goods, the UCPD's fictitious-reference-price prohibition for services and digital content, FTC Act §5 and
the state statutes in the US. Verify the current text per market before launch and date the check; this is
not legal advice.

## What these moves are worth

The three case studies behind them are presented as tested wins and come with **no published data, no sample
sizes and no effect sizes**, and each redesign changed many variables at once. So **treat every move above as
a well-reasoned hypothesis to test on your own product** — the mechanisms are sound, the magnitudes are
unknown. Testing them is `behavioral-metrics`' job, including the uncomfortable part: a decision screen's
conversion event is rare, required sample scales with the inverse square of the effect, and most teams
therefore need sequencing, holdouts and qualitative evidence rather than a clean A/B test.

One pattern across all three is worth naming in a review because it turns an ethics argument into a design
argument: **on a commitment screen the user's dominant emotion is uncertainty, and honesty is the cheapest
way to remove it.** That is a tendency, not a law — manipulative patterns convert in the short term, which is
why `ethical-persuasion-audit` and guardrail metrics exist. Where the two diverge you are choosing between a
conversion number and a refund rate, so measure both.

## Anti-patterns

- **The valuation ambush.** A hard paywall in front of a user with zero felt experience of the product. No
  copy fixes this; it is an `onboarding-activation` problem wearing a pricing-screen costume.
- **Feature bullets as the value argument.** A list of nouns the user cannot evaluate, occupying the space
  where evidence should be. Bullets are for confirming a decision already forming, not for making one.
- **The decorative hero.** The most salient region of the screen spent on a gradient. Show the thing.
- **A price range where a price could be computed.** Your uncertainty, invoiced to the user.
- **The soft verb on the hard button.** "Continue" or "Get started" as the control that charges a card — a
  named legal defect in the EU, not a copy preference.
- **A promised reminder no system sends.** The day-5 line with no day-5 job: worse than omitting it, because
  it converted on a promise. Its cousin, **microcopy that stopped being true** — "Starts in 2 taps" over a
  flow that grew a step. Nobody owns these strings, so nobody notices.
- **Objections answered behind links.** Cancellation policy, compatibility, data export, refund terms. Each
  link is an invitation to leave the screen.
- **Drip pricing**, and the **manufactured commitment** built to make it land — a quiz or configurator whose
  only function is to make abandoning feel wasteful.
- **A strikethrough price nobody ever charged**, or one derived from "the last price before this promotion"
  rather than the lowest in the window. The second looks reasonable and is exactly what *Aldi Süd* ruled out.
- **Badges as design elements.** `Most popular`, `Best value`, `Cheaper` hardcoded in JSX.
- **Testing eleven changes as one variant and declaring a winner.** You have learned the new screen is
  better and nothing about why, so you cannot carry any of it to the next screen.

## Ship checklist

Run against the screen, the design, or the diff.

**The audit**
- [ ] Every element has a written question beside it, and none is in the "value judgement they cannot make"
      class. Nothing occupies salience while provoking no question at all.
- [ ] The headline poses a question the user can answer from the headline.

**The commitment**
- [ ] The button's verb matches the commitment it creates: soft verb only where nothing is charged now;
      explicit amount and cadence on any button that charges.
- [ ] Under the button, one checkable fact about what happens next — steps, time, or card requirement — and
      it is true today, with something on the review checklist keeping it true.

**Money**
- [ ] The total is on the screen, and on the button where a total exists. No mandatory fee appears later.
- [ ] Recurring charges: charge date, amount, cadence and cancellation route all shown before card entry.
- [ ] The reminder the screen promises is sent by a job reading the same dates the screen renders.

**Options and objections**
- [ ] Every option shows one computed price, or one price plus an owned cap — never a bare range.
- [ ] The attribute people actually decide on is visible, and sorted or badged.
- [ ] Every badge is a query result at render time. (`grep` the JSX for hardcoded "popular", "best", "cheap".)
- [ ] Top three objections come from dated support/sales/review evidence, and each answer sits adjacent to
      the price or button in the same visual group, not behind a link.

**Evidence and arithmetic**
- [ ] The hero shows real content — ideally the user's own — and passes the cover test.
- [ ] No arithmetic left to the user: durations, totals, renewal dates, per-unit maths, unit translation.

**Discounts**
- [ ] Every strikethrough is a price actually charged, derived by query from a price-history table.
- [ ] The percentage is calculated against the lowest price in at least the prior 30 days.
- [ ] No qualifying prior price in the window → no badge, no strikethrough.
- [ ] Requirements verified for every market served (`references/reference-pricing-law.md`), and the check is
      dated.

**After**
- [ ] Guardrails instrumented before launch: trial-to-paid (not trial-start), refund and chargeback rate,
      cancellation attempts, support contacts containing "cancel" and "I didn't mean to".
- [ ] Changes sequenced or isolated well enough that a result teaches you something transferable.

## Sources

- **Attribute substitution** — Kahneman & Frederick (2002), in *Heuristics and Biases*. Used here as a design
  move, not as a claim that the user is fooled.
- **Pratfall effect** — Aronson, Willerman & Floyd (1966), *Psychonomic Science*. Interpersonal attraction; a
  blunder helped a highly competent target and hurt a mediocre one. Do not transfer the effect size to screens.
- **Blemishing effect** — Ein-Gar, Shiv & Tormala (2012), *Journal of Consumer Research* 38(5), 846–859.
  Moderated by order (negative after positive) and low processing effort; both limit its reach.
- **Processing fluency** — Alter & Oppenheimer (2009), *Uniting the Tribes of Fluency to Form a Metacognitive
  Nation*, *Personality and Social Psychology Review* 13, 219–235. **Choice deferral** — Dhar (1997),
  *Consumer Preference for a No-Choice Option*, *JCR* 24(2), 215–231: deferral rises when no alternative has
  a decisive advantage.
- **Choice overload — deliberately not relied on.** Iyengar & Lepper (2000); near-zero mean effect in
  Scheibehenne, Greifeneder & Todd (2010); real under the moderators in Chernev, Böckenholt & Goodman (2015),
  which is why `ux-psychology/references/principles.md` grades it Mixed rather than contested.
- **Anchoring** — Tversky & Kahneman (1974), *Science*; among the better-replicated effects here.
  **Commitment and consistency** — Cialdini, *Influence* (1984); **foot-in-the-door**, Freedman & Fraser
  (1966), modest and heavily moderated.
- **Reference pricing and discounts** — Directive 98/6/EC Art. 6a (Omnibus), CJEU C-330/23 (*Aldi Süd*), the
  goods-only scope in the Commission's Art. 6a guidance, and the UCPD rule that governs services and digital
  content instead: all cited in full in `references/reference-pricing-law.md`.
- **EU unfair practices** — UCPD 2005/29/EC as amended by (EU) 2019/2161; Consumer Rights Directive
  2011/83/EU for total-price disclosure and the order-button requirement.
- **US fees** — FTC Act §5; FTC *Rule on Unfair or Deceptive Fees*, 16 CFR Part 464, effective 12 May 2025 —
  total price including all mandatory fees, for live-event tickets and short-term lodging, binding on
  platforms and resellers as well as sellers.
- **First-person CTA copy** — owned by `persuasive-copy`; one unreplicated 2013 test, not a finding.

**Deliberately not quoted:** any conversion-lift percentage for the three redesigns, any "X% abandon when
they see a range", and any claimed fine for a specific pricing pattern. Where a number could not be traced to
a named source it is described qualitatively.

## References

- `references/three-redesigns.md` — the three case studies in full: a mobile-game paywall, a ride-hailing
  option picker and a hotel booking screen, each audited element by element with the before/after and the
  question every change replaced. Read it before running the audit on your own screen for the first time, or
  when you need to show a stakeholder what its output looks like.
- `references/reference-pricing-law.md` — read before shipping any strikethrough, "was/now" or discount
  badge: which instrument binds per market and product category (EU Art. 6a and *Aldi Süd* for goods, the
  UCPD for services and digital content, FTC Act §5 and state statutes in the US), and the one
  implementation that satisfies all of them.
