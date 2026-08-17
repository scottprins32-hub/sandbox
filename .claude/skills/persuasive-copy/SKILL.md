---
name: persuasive-copy
description: Writes and reviews the words in an interface — button labels, headings, empty states, error messages, confirmations, pricing pages, notifications and marketing text — so the wording moves the decision instead of just narrating the screen. Use this whenever anyone is writing or reviewing user-facing text, even if they never say "copy" or "microcopy": naming a button, wording a confirmation dialog, writing an error, filling an empty state, drafting a landing or pricing page, phrasing a permission prompt or notification, or translating an interface into another language. Also use it for symptoms like "nobody clicks this", "people don't understand what this does", "this reads as salesy", "what should the button say", or any request to make text clearer, shorter, more honest, or more convincing.
---

# Persuasive copy

Copy is the cheapest lever in the product. Changing a button label is a one-line diff with no migration, no
design review and no performance cost, and it can change what a person decides to do — because the words are
the only part of the interface that states what will happen next. That is also why it gets neglected: it
belongs to nobody, so it defaults to whatever the component was named in code. "Submit". "OK". "An error
occurred." Every one of those is a decision made by nobody, shipped to everybody.

The failure mode this skill exists to prevent is the opposite one: reaching for a persuasion technique
because it worked in a consumer funnel and dropping it into a context where it reads as manipulation or
noise. Urgency copy in a payroll portal. "Join 10,000+ happy customers" on a page whose total addressable
market is forty companies. A confetti animation on a task somebody performs forty times a day. Get the
diagnosis right and most of the technique picks itself.

## When this is the right skill

- You are writing or reviewing any user-facing string: labels, headings, errors, empty states, tooltips,
  confirmations, emails, notifications, legal-adjacent consent text.
- You are writing a landing page, pricing page, plan comparison, or a paywall.
- Someone says the product "doesn't explain itself", "sounds corporate", "sounds salesy", or "nobody clicks".
- You are localising an interface, or the product serves two audiences in two languages.

Go elsewhere when: the screen is a **pricing page, paywall, plan comparison or checkout summary** and the
question is what goes on it and in what order → `decision-screen-design`; this skill owns how each line is
worded, that one owns the composition of the commitment moment. The question is **where the eye lands** →
`attention-and-hierarchy` (copy can't fix a
button nobody sees). The question is **how many fields, what validation, how fast it feels** →
`friction-and-flow`. The question is **what a brand-new user should see first** → `onboarding-activation`.
The question is **whether this notification should exist at all** → `habit-loop-design`. The question is
**is this legal / is this manipulation** → `ethical-persuasion-audit`, which is a hard gate on moves 3, 4, 5
and 7 below. **Did the rewrite work** → `behavioral-metrics`.

## Diagnose first

The same sentence is persuasive in one product and offensive in another. Answer these about *this* surface
before you write a word.

1. **Is the reader choosing, or complying?** A prospect on a marketing page can leave; a warehouse worker
   logging a shift on a portal their employer mandated cannot. Persuasion techniques assume a reader who
   might say no. Where they can't say no, "persuasive" copy reads as an insult, and the job changes to
   *certainty*: what happened, what it means for me, what I do now.
2. **How many times will one person read this string?** A hero headline is read once. A save-confirmation
   toast is read four thousand times. Personality has a half-life measured in repetitions: the joke that
   charms on read one is grating on read thirty and hostile on the read where they just lost work. Frequency
   is the single best predictor of how plain a string should be.
3. **Who is the reader, and are they the payer?** In B2B the person reading the empty state is often not the
   person who signed the contract. Copy aimed at the buyer ("cut costs 30%") lands badly on the user who was
   handed the tool. Write each surface for whoever is actually looking at it.
4. **What is the emotional state at the moment of reading?** Someone reading an error at 2am after a failed
   upload, someone comparing three plans with a budget, someone completing a compliance task they resent.
   Match register to state, not to brand guidelines.
5. **Is there a real fact behind the sentence you want to write?** If you want to write "only 3 left" or
   "most popular" or "trusted by industry leaders" and you cannot point to the query that produces it, you
   don't have a copy problem, you have a claim you're about to invent. Stop.
6. **What language(s), and who wrote the source?** Persuasive copy translated literally changes the social
   relationship between you and the reader (move 9). If any surface is not in the language it was authored
   in, budget for rewriting, not translating.
7. **What is the actual decision this screen is asking for?** Write that down in one sentence, in the
   reader's words, before writing any copy. Most bad microcopy is bad because it describes the system's
   action instead of the user's decision.

## The moves

Ordered by leverage: the first two apply to every string you will ever write; the middle ones apply to
decision surfaces; the last covers the strings nobody is assigned.

### 1. Name the outcome in the user's words, not the system's verb

A button label is read as a **prediction**. The user is asking "if I press this, what will be true
afterwards?" A label that names the mechanism ("Submit", "Continue", "OK") answers a question nobody asked,
so the user has to reconstruct the answer from surrounding context — and if they reconstruct it wrong, the
cost lands after the click, where it becomes distrust rather than hesitation.

**Write the label as the outcome the user would describe to a friend.** Then check that the destination's
heading matches the label that got them there; a mismatch between "Get my quote" and a page headed "Lead
capture form" is a small betrayal that people register even when they can't name it.

| Instead of | Write |
|---|---|
| Submit | Get my quote / Send message / Book the inspection |
| Continue | Review order / Add payment method / Invite 3 teammates |
| OK | Delete 3 photos / Keep editing / Got it |
| Learn more | See how pricing works / Read the 2-minute setup guide |
| Sign up | Start free — no card needed / Create my first project |
| Save | Save draft / Publish changes / Apply to 14 records |

**First-person labels.** *"Start my free trial"* versus *"Start your free trial"* is the most-repeated
microcopy tip in the field, and its evidence is thinner than its reputation: essentially one landing-page
A/B test from around 2013 (Michael Aagaard, ContentVerve/Unbounce), on a single page, whose reported ~90%
lift is quoted everywhere and replicated nowhere checkable. The mechanism is plausible — the label reads as
the user's own sentence about their own outcome. The circulating number is not. Test it if the surface has
the traffic, expect something small, and note it reads awkwardly in several languages and in formal B2B
registers, which matters in a bilingual product. If you can't test it, pick the phrasing your users would
say out loud and spend the argument elsewhere. **This is the canonical treatment; siblings point here.**

**Destructive actions name the consequence and its scope.** A dialog's title should ask the real question and
the buttons should answer it, so the pair reads correctly with the body text ignored — which is how they get
read.

```jsx
// Before — the user must reconstruct what "OK" does, and "Cancel" is ambiguous
// ("cancel the deletion" or "cancel the subscription"?)
<Dialog title="Are you sure?">
  <p>This action cannot be undone.</p>
  <Button variant="danger">OK</Button>
  <Button>Cancel</Button>
</Dialog>

// After — the label states the action, the count, and what does not come back
<Dialog title="Delete 3 photos from “Site survey”?">
  <p>They’ll be removed for everyone with access. Deleted photos are recoverable
     from Trash for 30 days; their comments are not.</p>
  <Button variant="danger">Delete 3 photos</Button>
  <Button>Keep them</Button>
</Dialog>
```

Rules that fall out of this: never Yes/No on a destructive dialog (the buttons carry no information when
skimmed); always state the count and the blast radius ("for everyone with access"); name what is *not*
recoverable, because that is the part people get wrong; and phrase the dismissal as its own positive outcome
("Keep them", "Keep editing", "Stay subscribed") rather than "Cancel", which collides with any flow where
"cancel" is also a domain verb.

**How it fails:** outcome-naming turns into whimsy — "Let's do this!", "Take me there!" — which is the
system's personality wearing the user's grammar. It also fails when a label grows past about four words, or
when every button on the screen becomes an enthusiastic sentence and the primary action stops being findable
(`attention-and-hierarchy` owns that half).

### 2. Be specific — specificity is the mechanism behind credibility

A superlative cannot be checked, so a reader learns nothing from it except that you are selling. A specific
claim can be falsified, which signals that someone was willing to be held to it. That is the whole
mechanism, and it is why specificity beats intensity almost everywhere.

**Replace every adjective with the fact that produced it.**

| Before | After |
|---|---|
| Blazing-fast search | Search across 2M records returns in under 200ms |
| Enterprise-grade security | SOC 2 Type II, audited annually; data stays in eu-central-1 |
| Trusted by industry leaders | Used by 4 of the 10 largest housing associations in Romania |
| Easy setup | Connected to your payroll in about 10 minutes, no IT ticket |
| We take your privacy seriously | We never sell your data. We keep shift photos for 90 days, then delete them. |
| Save time on admin | Cuts the weekly timesheet reconciliation from ~3 hours to ~20 minutes |

**Give a reason, and make it a real one.** Langer, Blank & Chanowitz (1978) found people granted a
line-cutting request far more often when *any* reason followed "because" — even a contentless one ("because
I have to make copies"). Two honest caveats: the effect held for a small request and disappeared for a large
one (20 pages), and the finding is routinely over-generalised into "just add the word because". The usable
version: every ask should be accompanied by why you're asking, and the reason should survive scrutiny,
because your asks are not small. "We need your phone number **so the driver can reach you if the gate is
locked**" converts a demand into an explanation.

**Cut.** Morkes & Nielsen's 1997 study for NN/g rewrote the same site five ways and measured concise text,
scannable layout and objective (non-promotional) language each improving a composite usability score, with
the combination best of all. Note what it is before quoting the famous "124%": one small study (n=51), a
composite metric, and 1997. The direction is safe and matches everything since; the number is not a
constant, so don't put it in a deck.

Practical cutting rules: delete every sentence that says the screen exists ("This page allows you to…"),
every intensifier ("very", "really", "simply", "just"), and every instance of "please" that isn't
apologising for something you did. Read the result out loud; the sentence you stumble on is the one to split.

### 3. Framing: you are always choosing a reference point

**Framing effects (Tversky & Kahneman, 1981, "The Framing of Decisions and the Psychology of Choice").** The
Asian-disease problem: identical outcomes described as lives saved versus lives lost flipped the majority
preference between a sure and a risky option. Levin, Schneider & Gaeth (1998) usefully split this into three
kinds, and only two matter for product copy:

- **Attribute framing** — the same attribute described positively or negatively ("90% lean" vs "10% fat";
  "99.9% uptime" vs "about 9 hours of downtime a year"). This is the most reliable and most relevant kind.
- **Goal framing** — the same action described as achieving a gain or avoiding a loss ("back up your files
  and keep your photos" vs "back up your files or lose your photos"). Reliably the *weakest* of the three.
- Risky-choice framing (the original) — rarely what a UI is doing.

**Calibrate your expectations.** The risky-choice framing effect replicated in Many Labs 1 (Klein et al.,
2014) at roughly half the original effect size. But goal framing — which is what "reframe the CTA as a loss"
actually means — is a much weaker lever than folklore suggests: O'Keefe & Jensen's meta-analyses of health
messaging (93 studies, N≈21,656 for prevention behaviours; 53 studies, N≈9,145 for detection) found
gain/loss framing differences that were statistically significant but *tiny* (on the order of r ≈ .03), with
the direction flipping between prevention and detection contexts. So: framing is worth getting right because
it is free, not because it will move your conversion rate on its own.

**Loss aversion (Kahneman & Tversky, 1979, prospect theory)** — losses loom larger than equivalent gains.
State this carefully: the *direction* is well supported in risky choice and endowment paradigms, but the
generality and the size are actively disputed. Gal & Rucker (2018, *Journal of Consumer Psychology*) argued
the evidence does not support losses being systematically more impactful, provoking a large set of
commentaries on both sides; Kahneman himself has granted that it is context-dependent rather than a law of
human nature. Do not quote a "losses hurt twice as much" multiplier — it is a parameter from specific
gambling experiments, not a property of your checkout.

**What actually works: frame against a reference point the reader already holds.** Loss framing has bite when
there is a real thing they already have and could lose, and no bite when you invent one.

```
Before: "Upgrade to keep using advanced reports."
After:  "Your 12 saved reports become read-only on 3 September. Upgrading keeps them editable."

Before: "Renew now for 20% off."
After:  "Your team's 340 saved templates stay available if you renew before 1 May. After that they're
         archived for 90 days, then deleted."

Before: "2.9% transaction fee."
After:  "You keep 97.1% of every payment."     ← attribute framing; both true, pick the one you'd be
                                                  happy to see quoted back to you in a complaint
```

**How it fails, and the ethical line.** Framing selects which true fact leads. It becomes deception the
moment the frame implies something untrue, or the moment the omitted frame is *material* — "free trial" that
suppresses the auto-charge, "you keep 97.1%" without the fixed per-transaction fee, "you'll lose your data"
when you actually keep it for a year. Material omission is separately actionable in both the EU (UCPD Art. 7)
and the US (FTC Act §5). Anything of this shape goes through `ethical-persuasion-audit` before it ships.

### 4. Control the first number: anchoring and pricing presentation

**Anchoring (Tversky & Kahneman, 1974).** An initial number becomes the reference against which subsequent
judgments are adjusted, and the adjustment is systematically insufficient — it works even when the anchor is
transparently irrelevant and even when people are warned. It is one of the better-replicated effects in this
literature (Many Labs 1 found anchoring among its strongest replications), which puts it in a different
evidential class from most of what circulates in growth blogs.

Anchors in a product are not just the price. They are the order and range of your pricing tiers; a slider's
default position *and its maximum* (a seats slider starting at 5 and maxing at 50 produces different
self-reported needs than one starting at 50 and maxing at 5,000 — set it to your honest median, not the
anchor that flatters your ARPU); pre-filled quantities, suggested donation amounts and credit-pack sizes;
and the struck-through "was" price — which is legally constrained, since the EU Price Indication Directive
as amended requires a displayed prior price to be the lowest applied in the previous 30 days. An invented
"was" price is not clever anchoring, it's an offence.

**Per-unit and temporal reframing.** Gourville (1998, *Journal of Consumer Research*) showed that reframing
an aggregate cost into a small ongoing one ("pennies a day") can increase willingness to pay, by making the
amount comparable to trivial daily expenses. It fails when the daily figure is large enough that the
comparison stops being trivial, and it reads as evasive when the total is hidden. **Always show both**, and
in the EU showing the total payable is required for subscriptions under the Consumer Rights Directive.

```
Weak:      €588/year
Better:    €49/month, billed annually — €588 today, renews 1 Sept 2027
Weakest:   "Less than a coffee a day!"   ← the total is missing and the tone is doing the arguing
```

**Decoy tiers: don't.** The attraction/asymmetric-dominance effect (Huber, Payne & Puto, 1982) — adding a
dominated third option to shift share toward a target — is a favourite of pricing blogs and has a **mixed
replication record**: Frederick, Lee & Baskin (2014) and Yang & Lynn (2014) largely failed to find it with
realistic stimuli and real products, as opposed to the abstract numeric attributes of the original studies.
Building a deliberately bad plan on that basis costs you a tier of your pricing page and probably does
nothing. The **compromise effect** (Simonson, 1989) — middle options gaining share — has held up better, and
the honest version of the same lever works without any trickery: label a recommendation and say who it's
for.

```
Before: [Starter] [Pro ★ MOST POPULAR] [Enterprise]      ← is "most popular" true? can you prove it?
After:  [Starter — solo, under 50 invoices/mo]
        [Team — recommended for 5–20 people; 82% of teams your size choose this]
        [Enterprise — SSO, DPA, custom retention]
```

A popularity claim must be a query result, not a design decision. Fake "most popular" badges are misleading
commercial practice in the EU and a §5 deception risk in the US, and they're the kind of thing a screenshot
outlives.

**Charm pricing is weaker than folklore.** Anderson & Simester (2003) ran real catalogue field experiments
where $9 endings increased demand — in one test the same item sold 21 units at $39 against 16 at $34 and 17
at $44. Note the unit counts: small samples, and the effect was **stronger for new items** and interacted
with other discount cues. The left-digit mechanism (Thomas & Morwitz, 2005) is real; the blanket rule
"always end in 9" is not. A $9 ending also signals *discount*, working against a premium or enterprise
positioning, and does nothing on a B2B page where procurement is comparing feature matrices. Round numbers
when you sell on quality; charm endings when you sell on price.

### 5. Social proof that names someone like the reader

**Cialdini's social proof**: under uncertainty, people take others' behaviour as evidence about what is
correct. The operative variables are **specificity** and **similarity**, not volume. "10,000 happy customers"
is unfalsifiable and describes nobody the reader recognises. "4 buildings on your street use Scara" is
checkable and describes their exact situation.

**Calibrate the size honestly.** The best evidence here is large and modest: Allcott (2011, *Journal of
Public Economics*) evaluated OPOWER Home Energy Reports — which compare a household's usage to its
neighbours' — across 17 randomised field experiments and ~600,000 households, finding an average **2.0%**
reduction (range 1.4–3.3%). Real, replicated, cheap — and not a doubling. Anyone promising social proof will
transform a conversion rate is selling something.

**The famous hotel-towel study, with its caveat.** Goldstein, Cialdini & Griskevicius (2008, *JCR*) found a
descriptive-norm card ("the majority of guests reuse their towels") produced more reuse than a standard
environmental appeal (44.1% vs 35.1%), and a *provincial* norm naming guests **in this room** did better
still (49.3%). It is the canonical citation for "similar-other proof beats generic proof" — and Bohner &
Schlüter's German replication (2014, *PLOS ONE*, N=724 and N=204) **failed to reproduce it**, with the
standard message performing as well or better and the room-level norm inconsistent. Baseline reuse in the
German hotels was 70–90% versus 35–50% in the US, so a ceiling effect is a plausible explanation, but the
honest summary is: the provincial-norm result is not settled. Cite the mechanism, not the percentages, and
don't put "49.3%" in a design review.

**The descriptive-norm backfire is the trap you will actually hit.** Schultz, Nolan, Cialdini, Goldstein &
Griskevicius (2007, *Psychological Science*) showed households the neighbourhood average: heavy users
reduced, and **light users increased** — the boomerang. Adding an injunctive cue (approval/disapproval of the
behaviour) eliminated the increase. Telling people what many others do *normalises it*, including when what
they do is the thing you want to stop.

```
Backfires: "Only 12% of teams have enabled two-factor authentication."
           ← you have just told 88% of readers that skipping it is normal.

Better:    "Two-factor is on for every admin on your plan except you."   (local, injunctive, true)
Better:    "Teams that enable 2FA lose 60% fewer hours to account lockouts."  (consequence, if measured)
Better:    "Enabling 2FA takes about 40 seconds and is required by your organisation's policy."
```

Never publish a descriptive norm describing an undesirable majority. If the true number is unflattering,
narrow the reference group until it isn't, switch to an injunctive norm ("required", "expected", "what good
looks like"), or say nothing.

**What to build:** testimonials with a name, a role, a company and a *specific outcome* ("cut our Friday
reconciliation from 3 hours to 20 minutes" beats "great product, highly recommend"); counts scoped to the
reader's segment, industry or geography; real recent activity rather than a rolling ticker; review
distributions rather than a bare average. Fabricated proof is now explicitly regulated — the FTC's 2024 rule
on consumer reviews and testimonials bans fake and purchased reviews, and fake reviews and fake "consumer"
endorsements sit on the EU UCPD Annex I blacklist.

**When to skip it entirely:** internal and mandated tools. "Trusted by 1,200 teams" means nothing to someone
whose employer bought the licence. There the only proof that helps is local and operational: "Ana approved
this yesterday", "your site manager submitted 14 of these last month".

### 6. Credibility: who is saying it, and what have you given first

**Source credibility (Hovland & Weiss, 1951).** The identical message produced different opinion change
depending on the source it was attributed to. Credibility decomposes into *expertise* (do they know?) and
*trustworthiness* (will they tell me straight?), judged separately — and trustworthiness is raised most
efficiently by arguing against your own interest.

What that means in an interface: attribute claims to a named person or institution with a date, link the
methodology, show credentials that are actually relevant to the claim, and state limits.

```
Before: "Bank-level security."
After:  "SOC 2 Type II report (Nov 2025, audited by <firm>) — request a copy.
         We don't yet support SCIM; it's on the roadmap for Q3."

Before: "The best tool for property managers."
After:  "Built for buildings of 20–200 units. If you manage single-family rentals,
         <competitor> fits better — here's why."
```

That second pattern — naming who you're wrong for — buys more credibility than any superlative, and it
filters out the accounts that would have churned. **Borrowed authority is weak**: logo walls, "as seen in"
strips, and unverifiable badges are cheap to fake and therefore cheap to discount. Anything a reader can
verify beats anything they can't.

**Reciprocity (Cialdini; Regan, 1971, the Coke study).** An unrequested favour raises compliance with a later
request. The restaurant-candy field experiments (Strohmetz, Rind, Fisher & Lynn, 2002) point the same way,
with the largest lift when the gift felt personalised — small studies, direction believable, exact
percentages not worth quoting. In product terms: **give something usable before you ask for anything.** A
working result before signup, a real calculator, an audit that returns findings, a template pack that
functions. The copy job is to name what they're getting, in concrete terms, before the ask — and never to
claim the gift is bigger than it is.

**How it fails:** manufactured obligation ("we've given you so much value…"), "free" resources gated behind
a sales call, and — worst — reciprocity language on a surface where the reader has no choice. A portal
someone's employer requires them to use should never tell them it's giving them a gift.

### 7. Scarcity and urgency: real constraints only, no exceptions

**Scarcity (Worchel, Lee & Adewole, 1975).** Cookies from a nearly-empty jar were rated more desirable than
identical cookies from a full one, and most desirable when the scarcity had just been created by demand.
Scarcity is read as a signal both of value and of a closing option.

**The line, stated once and not negotiated: the constraint must be real.** This is not a taste preference.

- **EU:** Annex I point 7 of the Unfair Commercial Practices Directive is a *blacklist* item — "falsely
  stating that a product will only be available for a very limited time, or that it will only be available
  on particular terms for a very limited time, in order to elicit an immediate decision" is unfair **in all
  circumstances**, in every member state, with no balancing test. A timer that resets, or an "offer ends
  today" that doesn't, is squarely inside it.
- **US:** the FTC's staff report *Bringing Dark Patterns to Light* (September 2022) names baseless countdown
  timers and false limited-time messages as deceptive practices, and the Commission has brought
  dark-pattern-based actions with substantial payouts (e.g. the 2022 Vonage matter, $100M).

Beyond the legal exposure, the practical argument is stronger than developers expect: fake urgency is a
**one-shot asset that destroys a permanent one**. The first time a user watches your timer hit zero and
nothing change, every future deadline you state becomes noise — including the real ones.

**Real constraints worth stating, with the reason attached:**

```
Before: "⏰ Only 2 hours left! Don't miss out!"
After:  "Enrolment closes Friday 17:00 — the cohort starts Monday and the group projects
         are fixed at 12 people."

Before: "Selling fast! 🔥"
After:  "3 inspection slots left this week. Next availability is 24 March."

Before: "Limited time offer!"
After:  "This price holds until 1 April. After that it's €59/month — existing subscriptions keep €49."
```

Naming *why* the deadline exists converts pressure into information, which is the version that survives being
screenshotted. And run it in reverse where the purchase is high-stakes: "this price is the same next week,
take your time" measurably reduces the felt need to defend against you. In internal tools, urgency copy is
pure noise unless there is a genuine SLA or legal deadline, in which case state that instead of decorating it.

### 8. The strings nobody is assigned: errors, empty states, endings

These are where most of the words in your product live, and they are almost always written last, by whoever
was implementing the branch, from the system's point of view.

**Errors: no blame, what happened, what to do next.** Nielsen's ninth heuristic (1994) asks that errors be
expressed in plain language, indicate the problem precisely, and suggest a solution. Add one rule of your
own: *never assign fault to the user*, because a reader who feels accused stops reading and starts arguing.

```
Before: "Invalid input."
After:  "That date is in the past. Pick a date from today onward."

Before: "Error 500: An unexpected error occurred."
After:  "We couldn't save your changes — our end, not yours. Your draft is safe on this device.
         Try again, or come back in a few minutes. (Ref: 8f2c-91)"
```

The single most valuable sentence in an error is **whether their work survived**. Say it explicitly, every
time, even when the answer is yes. Include a reference code only when support can actually use it, and say
so. Never surface an exception class or a stack trace to a user.

**Empty states teach, and they are your best-read documentation** — shown at the exact moment of intent, to
someone who has already decided to do the thing. Three different empty states need three different copies,
and shipping one for all three is the common bug: **first-run** (say what goes here, why it's worth having,
one action, offer a seed), **filtered** (say the filter is what's hiding things and offer the escape — never
"No results found", which reads as "your data is gone"), and **cleared** (confirm the achievement; don't
sell into it).

**Success and confirmation close the loop.** "Sent" is a status, not a confirmation. Say what happened, what
it means, what happens next and when, and how to change or find it.

```
Before: "Invitation sent!"
After:  "Invited ana@example.com as an Editor. She has 7 days to accept; we'll email you when she does.
         Resend or revoke from Settings → Members."
```

**The peak-end rule (Kahneman, Fredrickson, Schreiber & Redelmeier, 1993; Redelmeier & Kahneman, 1996).**
Remembered experience is dominated by its most intense moment and its ending, and is surprisingly insensitive
to duration. This has a direct, cheap consequence: **the last screen of a flow is disproportionately what the
user will remember and report**, so it deserves your best sentence and the most care, and it is usually the
one that got the least. Concretely — end into a resolved state, not a dead end; put the reassurance
(what happens next, when, what they can do now) on the final screen rather than the first; and be careful
what you make the ending, because a satisfaction survey shown after the success screen makes *the survey*
the ending. Two caveats: peak-end is a well-supported description of remembered utility in its original
paradigms, but "end on a high note" is a loose extrapolation — do not manufacture a celebration on a task
someone performs forty times a day, where the memorable ending is the one that got out of the way.

Copy patterns for each error class, empty state, confirmation, destructive dialog, permission prompt and
notification subject line are in `references/microcopy-patterns.md`.

### 9. Plain language, reading level, and register — including across languages

**Mechanism: processing fluency.** Text that is easier to process is judged more favourably, and its author
judged more competent. Oppenheimer (2006, *Applied Cognitive Psychology*) manipulated vocabulary complexity
across four experiments and found needlessly complex writing consistently *lowered* judged intelligence of
the author, mediated by fluency. Flag the neighbourhood: the broader disfluency literature is shaky — the
best-known claim that hard-to-read fonts improve reasoning (Alter et al., 2007) failed a large multi-lab
replication (Meyer et al., 2015) — so lean on the plain-language finding and not on fluency as a universal
dial.

**This matters more for expert readers, not less.** Trudeau (2012, *The Public Speaks*, N=376) found
preference for plain English over legal jargon rose with the reader's expertise, and rose with the
complexity of the issue. It's a preference survey rather than a comprehension test, so hold it lightly — but
the mechanism is solid and observable: an expert under time pressure is *skimming for the
decision-relevant token*, and dense prose defeats skimming. Jargon is only efficient when it is the reader's
own working vocabulary and it replaces a longer phrase; everywhere else it is an obstacle disguised as
precision.

Practical rules: lead with the decision; one idea per sentence; name each concept with exactly one word
everywhere in the product (elegant variation costs a lookup — "member", "user", "seat" and "teammate" for
the same thing is a real bug); active voice with a named actor; kill nominalisations ("perform a validation"
→ "check"); read your longest sentence out loud.

**Register and localisation — where literal translation changes the social relationship.** English has one
second person; Romanian, German, French, Spanish, Dutch and many others have two. A breezy English "you"
translates by default into the informal (*tu*, *du*, *tu*, *tú*), which can read as presumptuous or
disrespectful to an older, working-class, or professional reader who would expect *dumneavoastră* / *Sie* /
*vous* / *usted*. The register is not a translation detail; it is a statement about the relationship, and
you make it whether you intend to or not.

The concrete case: an app with an **English admin console**, a **Romanian public marketing page**, and a
**Romanian worker portal** has three registers, not one voice in two languages.

| Surface | Reader | Register |
|---|---|---|
| Admin console | Expert, uses it all day, chose it | Terse, imperative, zero personality. "Assign 4 workers" |
| Public page (RO) | Prospect who can leave | Persuasive, warm, formal address by default |
| Worker portal (RO) | Person whose pay depends on it, no choice | Plain, respectful, formal address, no marketing, no gamification |

```
Worker portal — before (English marketing voice, translated literally, informal):
  "Grozav! Ai terminat tura! 🎉 Continuă tot așa!"
  ("Great! You finished your shift! Keep it up!") — reads as a manager patronising an adult.

Worker portal — after (plain, formal, certainty-first):
  "Tura din 14 august a fost înregistrată. Suma de 320 RON va fi plătită pe 25 august."
  ("Your 14 August shift is recorded. 320 RON will be paid on 25 August.")
```

The worker's questions are: what am I owed, when do I get it, what do I do next, who do I contact if it's
wrong. Answer those in that order and delete everything else.

Three mechanics that specifically break persuasive copy in translation: never concatenate sentence fragments
(gender, case and word order won't survive it); plural rules differ (Romanian needs *de* from 20 upward —
*1 zi, 2 zile, 20 de zile* — so use ICU plural categories, not `count === 1`); and an untranslated English
string in a localised page reads as *broken*, not multilingual, which is worst on errors and payment
strings, exactly where trust is thinnest. The rest is in `references/localisation-and-register.md`.

## Anti-patterns

- **"Submit", "OK", "Yes/No", or a bare "Continue" as a whole label.** The user has to reconstruct what
  happens; on a destructive dialog they reconstruct it wrong.
- **Personality on high-frequency strings.** "Oops! Our hamsters dropped the data 🙈" is charming once,
  irritating at read thirty, and hostile on the read where someone lost an hour of work.
- **Blame in errors.** "You entered an invalid…", "You forgot to…". Also: errors that don't say whether the
  user's input survived.
- **Leaked implementation.** Exception names, stack traces, "null", field names from the schema, HTTP status
  codes with no plain-language equivalent.
- **The dead-end confirmation.** "We've sent you an email" with no address shown, no resend, no "check
  spam", and no indication of how long it takes.
- **Fake anything with a number on it:** countdown timers that reset, invented stock counts, "23 people are
  viewing this", fabricated review counts, "was" prices that were never charged. Unlawful in the EU as
  blacklisted practices; deceptive under FTC §5; and permanently corrosive to every real number you publish.
- **Generic volume proof on a narrow market.** "Join 10,000+ happy customers" on a page selling to forty
  possible buyers reads as either irrelevant or false.
- **Publishing an undesirable descriptive norm.** "Only 12% have enabled this" normalises not enabling it.
- **Superlative stacking.** "The world's leading AI-powered end-to-end platform." Nothing is checkable, so
  nothing is believed.
- **Confirmshaming.** "No thanks, I don't like saving money." It's an admitted manipulation, it's in every
  regulator's dark-patterns taxonomy, and it makes the decline memorable in the wrong way.
- **Consent copy written as marketing.** "Yes! Keep me in the loop!" pre-ticked, next to a greyed-out
  refusal. Consent must be freely given and unambiguous; the copy is part of what makes it invalid.
- **Double negatives in checkboxes.** "Uncheck this box if you would prefer not to be excluded from updates."
- **Selling in an empty state or a success screen of a mandated tool.** The reader can't leave and can't buy.
- **Celebration on a routine action.** Confetti on the fortieth timesheet of the month.
- **Writing copy last, from the component's perspective.** "Form submitted successfully", "Entity created",
  "Operation completed". If a string names a noun from your data model, it wasn't written for a user.
- **Marketing voice leaking into the worker- or citizen-facing surface** of a bilingual product, usually
  because the strings were translated from the marketing page rather than written for that reader.

## Ship checklist

Run against the screen, the string file, or the diff:

- [ ] Every button label names the outcome, in the user's words, in four words or fewer. No "Submit"/"OK".
- [ ] The destination's heading matches the label that led there.
- [ ] Destructive dialogs: title asks the real question, buttons state the action and the count, the
      dismissal is phrased as its own outcome, and what is *not* recoverable is named.
- [ ] Every claim with an adjective in it has been replaced by, or backed with, a checkable fact.
- [ ] Every number, count, "most popular", "only N left" and "was" price traces to a real query or a real
      constraint. If you can't name the source, it's out.
- [ ] Any urgency has a stated reason, and the deadline actually bites. No resetting timers.
- [ ] Social proof is scoped to someone the reader recognises, and no published norm describes an
      undesirable majority.
- [ ] Errors: no blame, plain language, says what happened, says whether their work survived, gives a next
      action. No stack traces, no bare status codes.
- [ ] Every empty state is one of first-run / filtered / cleared, and is written for that case specifically.
- [ ] Success copy says what happened, what's next and when, and how to undo or find it.
- [ ] The **last screen of the flow** has been written deliberately, and is a resolved state — and nothing
      (survey, upsell, dead end) has been bolted on after it.
- [ ] High-frequency strings are plain; personality is confined to strings read once.
- [ ] One term per concept, consistently, across the whole product.
- [ ] Consent and payment copy is neutral, unticked, symmetrical, and reviewed against
      `ethical-persuasion-audit`.
- [ ] Localised surfaces: correct formality level for that audience, no concatenated fragments, ICU plurals,
      layout survives text expansion, and no untranslated strings left in critical paths.

## Sources

- **Framing** — Tversky & Kahneman (1981), *The Framing of Decisions and the Psychology of Choice*, *Science*.
  Typology: Levin, Schneider & Gaeth (1998). Replication at roughly half the original effect size:
  Klein et al., Many Labs 1 (2014). Gain/loss framing in persuasive messaging is *small*: O'Keefe & Jensen
  meta-analyses (2007, prevention, 93 studies; 2009, detection, 53 studies) — differences around r ≈ .03.
- **Loss aversion** — Kahneman & Tversky (1979), prospect theory. Direction supported in risky choice and
  endowment paradigms; generality and magnitude disputed: Gal & Rucker (2018), *Journal of Consumer
  Psychology*, plus the commentary set it provoked (e.g. Simonson, 2018). No fixed multiplier is quoted here.
- **Anchoring** — Tversky & Kahneman (1974), *Judgment under Uncertainty*. Among the strongest replications in
  Many Labs 1 (Klein et al., 2014).
- **Temporal / per-unit reframing** — Gourville (1998), *Pennies-a-Day*, *Journal of Consumer Research*.
- **Decoy / attraction effect** — Huber, Payne & Puto (1982). Mixed replication with realistic stimuli:
  Frederick, Lee & Baskin (2014); Yang & Lynn (2014). **Compromise effect** — Simonson (1989) — holds up
  better.
- **Charm pricing** — Anderson & Simester (2003), *Effects of $9 Price Endings on Retail Sales*, *QME*: field
  experiments; one test sold 21 units at $39 vs 16 at $34 and 17 at $44; effect stronger for new items.
  Left-digit mechanism: Thomas & Morwitz (2005). Small samples; not a universal rule.
- **Social proof** — Cialdini, *Influence*. Field magnitude: Allcott (2011), *Journal of Public Economics*,
  17 RCTs, ~600,000 households, mean **2.0%** reduction. Provincial norms: Goldstein, Cialdini &
  Griskevicius (2008), *JCR* (35.1% / 44.1% / 49.3%) — **failed to replicate** in Bohner & Schlüter (2014),
  *PLOS ONE*, N=724 and N=204, plausibly due to ceiling effects. **Boomerang / descriptive-norm backfire**:
  Schultz, Nolan, Cialdini, Goldstein & Griskevicius (2007), *Psychological Science*.
- **Source credibility** — Hovland & Weiss (1951), *The Influence of Source Credibility on Communication
  Effectiveness*.
- **Reciprocity** — Regan (1971); Strohmetz, Rind, Fisher & Lynn (2002), *Sweetening the Till*, *Journal of
  Applied Social Psychology* — small field studies; direction only, percentages not quoted.
- **Scarcity** — Worchel, Lee & Adewole (1975), cookie-jar experiment.
- **Reasons / "because"** — Langer, Blank & Chanowitz (1978). Effect held for a *small* request only; do not
  generalise to hollow reasons.
- **Writing for the web** — Morkes & Nielsen (1997), NN/g, n=51, composite usability metric. Direction sound;
  the "124%" figure is one small study, not a constant.
- **Error-message guidance** — Nielsen's usability heuristics (1994), heuristic 9.
- **Peak-end rule** — Kahneman, Fredrickson, Schreiber & Redelmeier (1993); Redelmeier & Kahneman (1996),
  colonoscopy field study.
- **Plain language** — Oppenheimer (2006), *Applied Cognitive Psychology*. Neighbouring disfluency claim
  (Alter et al., 2007) failed multi-lab replication (Meyer et al., 2015). Expert preference for plain
  language: Trudeau (2012), *The Public Speaks*, N=376 — a preference survey.
- **First-person CTA** — Michael Aagaard / Unbounce landing-page test, reported +90% CTR. One unaudited A/B
  test on one page; cited for the mechanism, not the number.
- **Law** — EU UCPD (2005/29/EC) Annex I point 7 (false limited-time claims, blacklisted in all
  circumstances) and Annex I on fake reviews/endorsements; UCPD Art. 7 on material omissions; Price
  Indication Directive as amended by the Omnibus Directive (prior-price = lowest in the previous 30 days);
  Consumer Rights Directive on total price for subscriptions. US: FTC Act §5; FTC staff report *Bringing
  Dark Patterns to Light* (September 2022) on baseless countdown timers; FTC action against Vonage (2022,
  $100M); FTC rule on consumer reviews and testimonials (2024).

Numbers that could not be traced to a named source are stated qualitatively rather than invented. In
particular: no "X% of users abandon after N seconds" figure appears here, because none of the widely
circulated ones has a locatable origin.

## References

- `references/microcopy-patterns.md` — a copy library to write from: error messages by failure type, empty
  states, confirmations and success, destructive dialogs, permission prompts, notification and email subject
  lines, paywalls and cancellation flows. Read it while you are actually writing strings.
- `references/localisation-and-register.md` — formality and the T–V distinction, choosing a register per
  surface, what breaks when persuasive copy is translated, ICU plurals and interpolation, text expansion,
  and a review process for bilingual products. Read it before localising anything, or when one product
  serves both a marketing audience and a captive one.
