---
name: ethical-persuasion-audit
description: Decides whether a persuasion technique is legitimate influence or a deceptive pattern, and whether it is lawful — an operational pre-ship audit, not an essay. Covers the asymmetry / transparency / retrospect / evidence tests, a fifth subject test for features that act on someone who cannot refuse (workforce monitoring, timestamped proof-of-work, checkpoint scans), the deceptive-pattern taxonomy with a concrete fix for each, and the EU (DSA Art. 25, GDPR consent, UCPD and Omnibus, Consumer Rights Directive, Accessibility Act) and US (FTC Act §5, ROSCA, CPRA) layer that developers usually do not know is enforced. Use this whenever the user is building or reviewing anything involving consent, cookies, permissions, signup, checkout, pricing, trials, subscriptions, cancellation, urgency or scarcity messaging, social proof, reviews, notifications, or any default that benefits the business — even if they never say "dark pattern", "ethics" or "compliance". Also use it on requests phrased as goals: "reduce cancellations", "increase opt-in rate", "add a countdown timer", "make the unsubscribe less obvious", "get more people to accept cookies", or "why is our refund rate so high".
---

# Ethical persuasion audit

Every technique in this skill set works by exploiting a real property of human cognition. That is the point,
and it is not automatically wrong — a good default, a clear progress bar and a well-timed prompt all work on
biases. The question this skill answers is the only one that matters at review time: **does this change help
the user do the thing they already wanted, or does it extract an outcome they would not have chosen if they
were rested, attentive and fully informed?** Get this wrong and the costs are not abstract: refunds,
chargebacks, support load, app-store reviews, press, and — increasingly — regulators who now name specific
interface patterns in statute. This is an audit you run, not a position you hold.

## When this is the right skill

- Any flow touching **money, consent, personal data, permissions, or cancellation**. These are the four
  places where a design decision becomes a legal one.
- Any time you are asked to build something that makes a path **harder** — harder to cancel, to reject, to
  opt out, to unsubscribe, to find the price.
- Reviewing a PR that adds urgency, scarcity, social proof, a countdown, a pre-checked box, a "no thanks"
  link, or a second confirmation step.
- Before shipping anything from `persuasive-copy` or `habit-loop-design`. Those two skills generate the
  material this one gates.
- **Not** the right skill if the question is "how do I get people to come back" (→ `habit-loop-design`),
  "why is this converting badly" (→ `friction-and-flow`), "what should the button say" (→ `persuasive-copy`),
  or "how do I measure whether this hurt anyone" (→ `behavioral-metrics`, which owns guardrail metrics).

**This is an engineering checklist, not legal advice.** Requirements differ by jurisdiction, by whether you
are a platform or a shop, by company size, and they change. Verify current rules for every market you serve
before launch, and route anything genuinely contested to counsel rather than resolving it in a code review.

## Diagnose first

The single biggest failure in this domain is applying a generic ethics rule to a product it does not fit, or
— far more common — assuming none of the law applies because "we're just a startup". Answer these about
**this** product before auditing anything.

1. **Does money change hands, and does it recur?** Recurring charges are the most heavily regulated surface
   in consumer software, in both the EU and the US. A one-off purchase and a subscription are different
   legal objects with different cancellation obligations.
2. **Do you store or read anything on the user's device beyond what is strictly necessary?** Cookies,
   `localStorage`, pixels, SDK fingerprinting, session replay. In the EU this triggers consent duties
   independently of whether you consider the data personal.
3. **Which markets do the users live in?** The law follows the user, not your incorporation. Serving EU
   consumers from a US company does not exempt you.
4. **Are you an "online platform"?** Under the DSA that means, roughly, hosting content that users provide
   and that gets disseminated to the public — marketplaces, social products, review sites, forums. It brings
   an explicit anti-dark-pattern obligation that a plain SaaS dashboard does not carry. Small and micro
   enterprises get relief from parts of the regime; do not assume you are exempt without checking.
5. **Who is the worst-case user of this screen?** Minors, people in financial distress, people managing a
   health event, non-native readers, someone doing this at 1am on a cracked phone. If a pattern only works
   because the user is tired, it is not persuasion.
6. **What is the actual business goal behind the request, and what is the honest version of it?** "Reduce
   cancellations" has an honest version (find out why people leave and fix it, offer a pause) and a
   dishonest one (make the button hard to find). You usually get to ship the honest version.
7. **Which metric is applying the pressure, and does it have a counter-metric?** A team optimising opt-in
   rate with no refund-rate or complaint-rate guardrail will drift into deception without anyone deciding to.

## The line, and five tests that find it

**Persuasion** makes a choice the user already wanted easier, clearer or more salient. **A deceptive pattern**
— Harry Brignull's original term was "dark patterns"; he and most regulators now prefer *deceptive design* —
uses interface craft to produce an outcome the user would not have chosen with full information and full
attention. The distinguishing feature is not the technique. It is whether the user's own goal is being served
or substituted.

Any single failure is a finding.

**First, check which set applies.** Tests 1–4 assume the person being persuaded is the person who benefits,
and that they can walk away. Ask: *is the person this feature acts on the same person it benefits, and can
they decline it?* If the answer to either half is no — a worker handed a tool by their employer, a resident
whose building signed a contract, a patient, a child — then tests 1–4 do not bind, because consent and
opt-out are not real options for that person. Run **test 5** instead, and run it as well as the others where
both apply.

**1. The asymmetry test.** Is the effort to opt *in* the same as the effort to opt *out*? Count clicks,
screens, seconds, and reading level in both directions. Accept-all in one tap and reject in three screens is
the canonical failure. This test is doing double duty: it is also, almost verbatim, the operative legal
standard in several regimes (GDPR Art. 7(3) "as easy to withdraw as to give"; the CCPA regulations'
"symmetry in choice"; the DSA's concern with termination being harder than subscription).

**2. The transparency test.** Would the user be annoyed if you explained the mechanism to them in plain
words, on the screen, as it happened? Write the sentence. *"We pre-checked this because most people don't
uncheck it."* *"This timer resets when you reload."* *"We put Reject in grey because grey gets clicked less."*
If the sentence is embarrassing, the pattern is the problem, not the sentence. The honest version of the same
mechanism usually survives the test fine: *"Most teams pick Standard, so we've selected it — change it any
time in Settings."*

**3. The retrospect test.** In a week, will the user be glad they did this? Not "did they click" — clicks are
cheap and prove nothing about consent. A signup driven by a fake countdown converts and then churns, refunds,
or leaves a review. Persuasion that survives a week is retention; persuasion that does not is a loan against
your support queue.

**4. The evidence test — and this is the one that ends arguments.** Look at what already happened. Pull:
refund and chargeback rates for the flow; cancellation attempts that did not complete; support tickets
containing "I didn't mean to", "I didn't know", "how do I cancel"; consent withdrawal rate shortly after
consent; app-store and review-site text mentioning the flow; and the gap between opt-in rate and subsequent
engagement with the thing they opted into. **A high opt-in rate paired with near-zero use of the opted-into
feature is a confession, not a win.** Instrument these before you ship the change so you have a baseline
(→ `behavioral-metrics`).

**5. The subject test — for features that act on someone who cannot refuse.** This is the case tests 1–4
miss entirely, and it is the whole of workforce and monitoring software: location capture, timestamped
photos, checkpoint scans, activity metrics, quality scores. The subject of the feature is a worker; the
beneficiary is their employer or the employer's customer. "They consented" is not available as an answer,
because refusing means not having the job.

Five questions, all of which must clear:

- **Disclosure.** Would you show this person, in plain language and in *their* language, exactly what is
  captured, how often, how long it is kept, and who can see it? If the honest version of that screen would
  cause a problem, the feature is the problem.
- **Reciprocity.** Does the subject get something from it themselves — proof they did the work when a
  complaint is wrong, a shorter shift, fewer disputes, faster pay — or does the value flow only upward? A
  monitoring feature that returns nothing to the monitored is extraction with a UI.
- **Access and contest.** Can they see their own record, and is there a named route to correct an error?
  Data used to evaluate someone, which they cannot see or challenge, is the thing to refuse to build.
- **Proportionality.** Is there a less invasive design that serves the same legitimate purpose? Continuous
  location tracking and a scan at arrival and departure often prove the same thing; one of them follows
  someone home.
- **Purpose limitation, enforced in code.** Data captured to prove a job was done gets reused for
  performance ranking unless something stops it. Decide the permitted purpose at capture, write it down,
  and constrain the query surface so a future feature cannot quietly widen it.

The legal shape matches the ethical one. Under GDPR, **consent is generally not a valid basis for processing
employee data** — the Article 29 Working Party's Opinion 2/2017 on data processing at work, carried forward
by the EDPB, treats the power imbalance as making consent unlikely to be freely given, so employers must
rely on another basis and satisfy necessity and proportionality. Systematic monitoring of individuals will
usually require a **data protection impact assessment (Art. 35)**, and works-council or employee-consultation
duties apply in many member states. Verify per market; this is an engineering checklist, not legal advice.

A sixth, informal one worth keeping: **the deposition test.** Would you be comfortable explaining this
decision, in writing, with the Slack thread attached? Most of this domain is decided in Slack threads that
someone later reads out loud.

## The moves

### 1. Symmetry is the master rule — apply it before anything else

Nearly every pattern in the taxonomy is a symmetry violation wearing a different hat. Make it a mechanical
check: for every choice in the product, measure both directions on four axes.

| Axis | Measure |
|---|---|
| **Steps** | Clicks/taps/screens to reach the outcome |
| **Prominence** | Contrast ratio, size, position in reading order, whether it is a button or a text link |
| **Time** | Including any imposed delay, chat queue, "we'll email you", or business-hours restriction |
| **Words** | Reading level and plainness. "Accept all" vs "Manage my legitimate interest preferences" is asymmetric even at equal click count |

Symmetry does not mean the two options must be *identical*. A primary button and a secondary button of equal
size, contrast-compliant text, same click count, same medium, is fine and is the normal, defensible shape.
What is not defensible is one option rendered as a button and the other as low-contrast text, or one that
completes in-app and the other that requires a phone call.

**When not to apply it literally:** destructive and irreversible actions legitimately carry more friction
than their reverse — deleting an account, wiring money, publishing to a large audience. The asymmetry there
protects the user rather than you, which is exactly how you tell the difference. If the extra friction is on
the path that costs *you* money, it is a finding; if it is on the path that costs *the user* something
unrecoverable, it is good design (→ `friction-and-flow` on confirmation vs. undo).

### 2. Audit the money path

Money patterns carry the sharpest legal exposure and the highest refund cost. Walk your own checkout with a
clean session and a stopwatch.

| Pattern | What it looks like | The fix |
|---|---|---|
| **Hidden costs / drip pricing** | Fees, service charges, shipping, or "processing" appear only at the final step | Show the total a user will actually pay as early as it is knowable — ideally on the listing. If a fee is unavoidable, it is part of the price |
| **Sneak into basket** | An add-on, insurance, donation, or expedited shipping is inserted without an affirmative action | Nothing enters the cart without a deliberate user action. Extras are opt-in, unticked, and itemised |
| **Forced continuity** | A free trial silently converts to a paid plan, or an annual renewal happens with no warning | Disclose the charge date and amount *before* taking payment details; send a reminder before the first charge and before each renewal; make cancellation reachable from that reminder |
| **Roach motel** | Easy to subscribe online, cancellation requires a call, a chat agent, an email, or a retention gauntlet | Cancel in the same medium and roughly the same number of steps as signup. See `references/consent-and-cancellation.md` |
| **Preselected paid extras** | Pre-ticked donation, insurance, warranty, priority delivery | Default to off. Under EU rules, additional payments require the consumer's *express* consent; a default the consumer must reject does not count |
| **Bait and switch** | The advertised item or price is unavailable and something else is substituted at the point of commitment | Do not advertise what you cannot supply at that price. If stock ran out, say so plainly and let them leave |
| **Vague order button** | "Continue", "Complete", "Get started" as the final button that charges a card | The button that creates a payment obligation must say so. "Pay €39 now", "Subscribe — €12/month". In the EU this wording requirement is explicit, and getting it wrong can leave the consumer not bound by the contract |

The mechanism worth internalising: people evaluate a purchase against the number they first saw (anchoring —
Tversky & Kahneman, 1974) and commit progressively as sunk effort accumulates. Drip pricing works precisely
*because* the user has already invested five minutes by the time the fee appears. That is why it is a
misleading omission rather than a mere layout choice.

### 3. Audit the consent path

Consent is the surface where design decisions most directly become legal ones, because in the EU consent has
a definition with four adjectives attached and an interface can fail any of them.

| Pattern | What it looks like | The fix |
|---|---|---|
| **Preselection** | Pre-ticked boxes, toggles defaulted on, "legitimate interest" sliders pre-enabled | Every consent control starts off. Consent requires a clear affirmative action; pre-ticked boxes are explicitly not consent under GDPR |
| **Misdirection / false hierarchy** | "Accept all" as a saturated primary button, "Reject" as grey text or absent from the first layer | Equal visual weight, both on the first layer, both one click. See `references/consent-and-cancellation.md` |
| **Trick wording / double negatives** | "Untick if you do not wish to not receive..." | One clause, one decision, positive voice: "Email me product updates." Read it aloud; if you have to re-read, rewrite |
| **Privacy zuckering** | Sharing defaults set wider than the user expects; settings that reset on update; consent bundled with service access | Default to the narrowest sharing. Never widen a setting during a migration. Keep consent unbundled from access unless the processing is genuinely necessary for the service |
| **Nagging** | Re-asking for a permission the user already declined, on every session | Ask once, then wait for a moment of genuine need and ask once more with a reason. Cap it. Repeatedly re-requesting a choice already made is named as a problem pattern in EU platform rules |
| **Obstruction** | Data export or deletion buried, rate-limited, or requiring a support ticket | Self-serve, discoverable from account settings, same number of steps as the equivalent creation action |
| **Consent walls on the exit** | Cannot decline without creating an account, entering an email, or "verifying" | Declining must be possible with less effort than accepting, never more |

The mechanism: consent decisions are made in a state of near-zero attention, on the way to something else.
The user's goal is the article, not the preferences dialog. Anything you extract in that window was extracted
from someone who was not deciding — which is exactly why "freely given, specific, informed and unambiguous"
is the legal test, and why a technically-true dialog can still fail it.

### 4. Audit every claim for truth at runtime

This is the cheapest audit and it catches the most legally dangerous class of pattern, because a false
statement is a misrepresentation regardless of how tastefully it is designed.

Rule: **for every dynamic claim on screen, find the line of code that makes it true.** If you cannot, delete
the claim.

| Pattern | The test | The honest version |
|---|---|---|
| **Fake urgency** | Does the timer correspond to a real deadline? Does it reset on reload or on a new session? | Real deadlines only: "Offer ends 31 Oct" from a stored date, or no timer |
| **Fake scarcity** | Is "Only 2 left" reading inventory, or a random number seeded by session? | Read real stock. If you cannot, say nothing. Falsely stating something is available only for a limited time in order to force a decision is on the EU blacklist of always-unfair practices |
| **Fake social proof** | Are "17 people are viewing this" and "Sarah from Leeds just bought" backed by events? Are reviews real and unfiltered? | Query real telemetry, or drop the widget. Fake and incentivised reviews, and suppressing negative ones, are specifically regulated on both sides of the Atlantic |
| **Disguised ads** | Would a reasonable user know this is paid? Is sponsored content styled identically to organic? | Label paid placement and paid rankings clearly and adjacently — not in a tooltip, not in grey 10px |
| **Misleading "free"** | Does "free" require payment details, or convert automatically? | "Free for 14 days, then €20/month. Card required." |
| **Manufactured comparison** | Is the "was €199" price one you ever actually charged? | Reference prices must be real prior prices, and EU rules specify how the prior price is derived. Verify the current rule for your market |

Countdown timers deserve a special note because they are so routinely faked: a timer that resets per session
is not a persuasion technique, it is a false statement rendered in CSS.

```tsx
// Finding: the deadline is a function of when the user arrived.
const [left, setLeft] = useState(15 * 60);  // "Offer expires in 14:59"

// Fix: the deadline is a property of the offer, and the UI reads it.
const left = Math.max(0, offer.endsAt - now);   // absent => render nothing
```

### 5. Audit the attention spend

Herbert Simon's formulation (1971) is the one to carry: information consumes attention, so an abundance of
information creates a poverty of attention. Every interstitial, autoplay, badge and push notification spends
a finite resource that belongs to the user, on your behalf, without asking. That is not automatically wrong —
a genuinely useful alert is a good trade — but it should be a decision someone made, with a budget.

| Pattern | Why it is a finding | The fix |
|---|---|---|
| **Infinite scroll on a finite job** | Removes the natural stopping cue that lets a user decide to leave | Paginate, or add a real end state ("You're all caught up"). Keep infinite scroll for genuinely unbounded browsing, and give it a stopping point |
| **Autoplay next** | Starts the next unit of consumption before the user decides to consume it | Default off, or a countdown that is genuinely cancellable and remembers "don't autoplay" |
| **Confirmshaming** | The decline option is written to make the user feel stupid or mean: "No thanks, I hate saving money" | Neutral decline: "No thanks." The decline copy is the single fastest ethics tell in a codebase — grep for `No thanks, I` |
| **Notification volume as a growth lever** | Trains ignoring, then uninstalling | Weekly budget, quiet hours, granular per-category off switches, and every notification references a specific object (→ `habit-loop-design`) |
| **Badge inflation** | Red dots on marketing content destroy your ability to signal anything real | Badge only user-addressed, actionable things |
| **Interstitials over content** | Especially on a first visit, especially on mobile | Delay any modal until after the user has got what they came for; never cover content the user is mid-way through |

A caution on the science: the popular "infinite scroll hacks dopamine" framing overstates a real but narrower
finding. Dopamine signals reward *prediction error*, not pleasure (Schultz, Dayan & Montague, 1997), and
variable-ratio schedules do sustain responding (Ferster & Skinner, 1957). That is enough to justify care. It
is not enough to justify claiming an interface is "addictive" in a clinical sense, and that claim is not
needed — "this removes the user's natural stopping point" is both true and sufficient.

### 6. Design for the vulnerable case, and treat accessibility as part of this audit

**The design target is a distracted, tired, non-native-speaking or low-literacy user on a poor connection.**
Not the edge case — the target. OECD's PIAAC adult skills surveys consistently find a large minority of
adults in wealthy countries at the lowest literacy proficiency levels, and every user is temporarily in that
population when stressed, rushed, or ill. A flow that is only honest to an alert expert reader is not honest.

Concretely: short sentences, one decision per screen, plain words over legal ones in the interface (keep the
legal words in the linked terms), amounts and dates written out rather than implied, and no reliance on a
user noticing a subtle difference between two similar-looking options.

Accessibility belongs in this skill, not only in a compliance checklist, because the failure mode is the
same: **an interface that cannot be operated is an interface whose choices cannot be refused.** A cookie
dialog whose Reject control is unreachable by keyboard is not merely inaccessible; it is a consent mechanism
that fails the asymmetry test for that user. Specific overlaps to check:

- **Contrast.** A Reject button below the WCAG contrast minimum is both an accessibility defect and a
  misdirection finding. They are the same defect, found twice.
- **Focus order and keyboard operability.** Every consent, cancellation and payment control must be reachable
  and operable by keyboard, in a sensible order, with a visible focus indicator.
- **Targets and dismissal.** Small close buttons on interstitials are obstruction for motor-impaired users.
- **Screen-reader semantics.** A toggle whose accessible name is "on" tells a screen-reader user nothing about
  what they just consented to.
- **Timeouts.** Timed offers and session timeouts must be extendable, or they discriminate by reading speed.

Build to **WCAG 2.2 AA** as the working reference level (W3C Recommendation, 2023); it is a superset of 2.1 AA,
which is what the EU harmonised standard EN 301 549 has tracked. The **European Accessibility Act**
(Directive (EU) 2019/882) extends accessibility obligations to a range of consumer-facing digital services
including e-commerce; scope, timing and small-enterprise relief vary, so verify against your product and
market. In the US, Section 508 covers federal procurement and ADA-based web accessibility litigation is
routine for consumer sites.

### 7. Get the retention benefit ethically — it is available, and it lasts longer

Every deceptive pattern is a shortcut around a real mechanism that also works. The honest version is slower
to build and does not decay.

| The pattern's goal | The extractive version | The version that survives the four tests |
|---|---|---|
| Reduce churn | Hide the cancel button | **Stored value**: make leaving cost the user something they actually built — history, templates, integrations, data — and make it exportable so the value is real rather than hostage |
| Increase opt-in | Pre-tick and misdirect | **Earned relevance**: ask at the moment the permission unlocks something specific, with the reason stated, after value has been delivered |
| Bring people back | Nag and guilt | **Honest re-engagement**: notify about a specific thing that happened involving them, deep-link to it, and let them turn that category off |
| Raise conversion | Fake scarcity | **Real reasons**: a real deadline, a real limited batch, or a plain statement of the benefit. Real constraints are more persuasive anyway, because they survive scrutiny |
| Grow ARPU | Sneak add-ons in | **Genuine utility**: recommend the add-on when the user hits the limit it solves, and show what it costs |
| Retain the trial user | Make cancellation hard | **A pause option**, a downgrade path, and a reminder before charging. Users who leave cleanly come back; users who feel trapped write reviews |

The pattern here: extractive versions harvest a decision *once*, from an inattentive user, and pay for it
later in refunds and reputation. The honest versions compound. If a stakeholder needs the argument in
business terms rather than ethical ones, this table is the argument.

### 8. The escalation move: what to write when you are asked to build over the line

You will be asked. The productive response is not a moral objection — it is a risk memo with a shippable
alternative attached. Keep it short, factual and unsmug, and put it in the PR or the ticket so it exists in
writing.

```markdown
**Flagging before I build this.**

What's being asked: hide the "Cancel subscription" link behind a chat-only flow.

Why I'm raising it: this is the pattern regulators call "hard to cancel" / roach motel. Specific exposure:
- EU: the DSA names making termination harder than subscription as a problem interface pattern for
  platforms; UCPD unfair-practice exposure applies more broadly.
- US: ROSCA requires a simple mechanism to stop recurring charges; the FTC has brought negative-option
  cases on cancellation friction, and several US states require online cancellation for online signups.
- Our own numbers: 214 support tickets last quarter contain "cancel" — roughly 9% of contacts. Chargeback
  rate on subscriptions is 1.4x the rest of the book.

What I propose instead (same goal, ~most of the benefit):
1. Self-serve cancel, two clicks from account settings.
2. On the cancel screen, offer *pause for 3 months* and *downgrade* as equal-weight options — these
   recover a real share of intent-to-cancel in published writeups, and they don't create exposure.
3. One free-text "why are you leaving" field, skippable, that routes to the product channel.

I can ship that this sprint and instrument save-rate so we can compare. If we still want the original,
I'd like a written sign-off from [legal/owner] first — happy to be wrong about the exposure.
```

The four things that make this work: **name the pattern** (it has a name, which means it is a known category
rather than your opinion), **name the specific rule** (not "this is illegal" — the actual obligation), **bring
your own numbers** from the evidence test, and **arrive with the compliant alternative already designed** so
the conversation is about which to build rather than whether to comply. Ask for sign-off in writing; that
request alone resolves most of these, and if it does not, you are documented.

If it is escalated past you and shipped anyway: log the instrumentation for it (refunds, complaint text,
cancellation attempts) so the evidence test can be run in three months. Facts end these arguments; arguments
do not.

## The legal layer

Detail, per regime, is in **`references/legal-layer.md`** — read it before shipping consent, checkout,
subscription or cancellation code in a regulated market. The short version of what most developers do not
know is enforced:

- **EU DSA Art. 25** prohibits providers of online platforms from designing or operating interfaces that
  deceive or manipulate users or otherwise materially distort their ability to make free and informed
  decisions. It carves out conduct already covered by the UCPD and GDPR, so those still bite.
- **UCPD (2005/29/EC) as amended by the Omnibus Directive (2019/2161)** governs unfair, misleading and
  aggressive practices generally, with an annex of practices that are unfair in all circumstances — false
  limited-time claims and undisclosed advertorial among them. Omnibus added transparency duties on ranking
  parameters, paid placement, and the authenticity of reviews.
- **GDPR Art. 4(11) and 7** require consent to be freely given, specific, informed and unambiguous, given by
  a clear affirmative action, and as easy to withdraw as to give. Pre-ticked boxes and inactivity do not
  constitute consent. EDPB and national DPA guidance treats a one-click Accept with no equally easy Reject as
  invalid consent. Storing or reading anything non-essential on a device triggers this independently of
  whether you regard the data as personal.
- **Consumer Rights Directive (2011/83/EU)** requires pre-contractual information, an order button that makes
  the payment obligation unambiguous, express consent for any additional payment (so no pre-ticked extras),
  and a right of withdrawal for distance contracts whose period is extended if you fail to inform the
  consumer about it.
- **US FTC Act §5** covers unfair or deceptive acts and practices; FTC staff have published specifically on
  dark patterns. **ROSCA** governs online negative-option sales: clear disclosure of material terms before
  billing information is taken, express informed consent, and a simple cancellation mechanism. The FTC's
  amended "click-to-cancel" Negative Option Rule was vacated on procedural grounds and rulemaking has been
  restarted — **ROSCA, §5 and state auto-renewal laws continue to apply regardless**, so build as if
  click-to-cancel were the standard.
- **California (CCPA as amended by CPRA)** defines "dark pattern" in statute, requires symmetry in choice,
  and provides that agreement obtained through a dark pattern is not consent. Several other US states have
  adopted comparable language.

Two habits that keep you out of trouble more reliably than memorising any of this: **build the strictest
version once** (equal-weight consent choices, self-serve cancellation, all-in pricing) rather than
per-jurisdiction variants, and **verify current requirements before launch** — this area is actively
changing, including an EU Digital Fairness initiative aimed squarely at deceptive and addictive design.

## Anti-patterns

- **Ethics review as a launch-day gate.** By then the flow is built and the meeting is about shipping it
  anyway. Run the four tests at design time, on the spec.
- **"It's just a default."** Defaults are the most powerful lever in the set, which is exactly why they carry
  the obligation. The test is whose interest the default serves when the two diverge, and whether changing it
  is as easy as accepting it.
- **"Legal signed off"** treated as "this is fine". Legal answers whether it is actionable in one
  jurisdiction today. It does not answer the retrospect test, and it does not read your app-store reviews.
- **A/B testing your way past the line.** A variant that lifts conversion 30% and refunds 40% is not a
  winner, it is an unmeasured one. Any test on a consent, price or cancellation surface needs refund,
  complaint and downstream-engagement guardrails defined *before* it runs (→ `behavioral-metrics`).
- **Copying a large incumbent.** "Amazon does it" is not a defence; several patterns in this taxonomy became
  named categories precisely because large platforms were investigated for them. Their legal budget is not
  a shared resource.
- **Compliance theatre.** A 400-word consent notice nobody reads satisfies a checkbox and fails the
  informed test. The measure is comprehension, not disclosure volume.
- **Hiding behind the word "nudge".** A nudge, in Thaler and Sunstein's original formulation, must be easy and
  cheap to avoid. If avoiding it is not easy and cheap, whatever you have built is not a nudge.
- **Treating accessibility as a separate, later workstream.** The inaccessible control and the misdirecting
  control are frequently the same control.
- **One-way ethics review.** If your audit only ever fires on things marketing asks for, you will miss the
  engineering-side versions: the retention job that emails cancelled users, the migration that resets a
  privacy setting, the SDK that phones home.

## Ship checklist

Run against a screen, a spec, or a PR. Anything unticked is a finding, not a nitpick.

**The four tests**
- [ ] Effort to opt out ≈ effort to opt in, measured in steps, prominence, time and reading level.
- [ ] I can write the mechanism on the screen in plain words without embarrassment.
- [ ] In a week, this user will be glad they did it.
- [ ] Refund / chargeback / cancellation-attempt / support-text / consent-withdrawal baselines exist for
      this flow, and I will look at them after shipping.

**Claims and content**
- [ ] Every countdown reads a real, stored deadline and does not reset on reload or new session.
- [ ] Every scarcity claim reads real inventory.
- [ ] Every "N people are viewing / just bought" reads real events.
- [ ] Reviews and testimonials are genuine, unfiltered for sentiment, and any incentive is disclosed.
- [ ] Paid placement, sponsored content and paid rankings are labelled adjacently and legibly.
- [ ] "Free" is accurate; if it converts to paid, the price and date are stated before card entry.

**Money**
- [ ] The total the user will pay is visible before they invest effort, not only at the last step.
- [ ] Nothing enters the cart without an affirmative action; all extras default to off.
- [ ] The button that creates a payment obligation says so, with the amount and the cadence.
- [ ] Trial → paid conversion is disclosed up front and reminded before the first charge.
- [ ] Renewal reminders go out before each charge and link straight to cancellation.

**Consent and data**
- [ ] No pre-ticked boxes, no toggles defaulted on, anywhere in the consent surface.
- [ ] Reject and Accept sit on the first layer, one click each, at equal visual weight.
- [ ] Non-essential storage and tracking do not fire before consent. (Verify in devtools, not in the code.)
- [ ] Consent copy is one positive clause per decision; no double negatives.
- [ ] Withdrawal is as easy as granting, and reachable from account settings.
- [ ] A declined permission is not re-requested on the next session.
- [ ] Sharing and visibility defaults are the narrowest that make the feature work, and no migration widens
      an existing user's setting.
- [ ] Export and deletion are self-serve and discoverable.

**Exit**
- [ ] Cancellation is self-serve, in the same medium as signup, within roughly the same number of steps.
- [ ] The retention offer on the cancel path is a genuine alternative (pause, downgrade), presented once,
      at equal weight, and never blocking.
- [ ] Unsubscribe is one click from the email and does not require login.
- [ ] Decline and cancel copy is neutral. (`grep -ri "no thanks, i"` returns nothing.)

**Attention and access**
- [ ] Autoplay and infinite scroll are either off by default or have a genuine stopping point.
- [ ] Notification volume is budgeted, categorised, and individually switchable.
- [ ] Consent, payment and cancellation controls are fully keyboard-operable with visible focus.
- [ ] Both options in any binary choice meet contrast minimums — not just the one you prefer.
- [ ] The flow is comprehensible to a distracted, non-native reader on a small screen.

**Process**
- [ ] The market's current requirements were checked, not assumed, and the check is dated.
- [ ] Anything contested went to counsel, and anything overruled is documented in writing with
      instrumentation attached.

## Sources

- **Brignull, H. (2010–), deceptive.design; *Deceptive Patterns* (2023).** Origin of the term "dark
  patterns" and the original taxonomy; now framed as *deceptive design*. The naming conventions used in this
  skill are largely his.
- **Mathur, A. et al. (2019), "Dark Patterns at Scale: Findings from a Crawl of 11K Shopping Websites,"
  *PACM HCI* 3(CSCW).** Princeton/Chicago; ~53k product pages across 11k sites; identified roughly 1,800
  instances across 15 types in 7 categories, and found deceptive patterns more prevalent on more popular
  sites. The empirically grounded taxonomy.
- **Gray, C. et al. (2018), "The Dark (Patterns) Side of UX Design," *CHI '18*.** Practitioner-derived
  taxonomy: nagging, obstruction, sneaking, interface interference, forced action. The five verbs are a
  useful audit frame.
- **Thaler, R. & Sunstein, C. (2008), *Nudge*.** Choice architecture; the definition that a nudge must be
  easy and cheap to avoid — the criterion that separates most of this skill's good and bad cases.
- **Tversky, A. & Kahneman, D. (1974), *Science*.** Anchoring and adjustment — the mechanism drip pricing
  exploits. **Kahneman & Tversky (1979)**, prospect theory, for loss framing; note that **Gal & Rucker
  (2018)** argue loss aversion is far more context-dependent than commonly claimed, so use it qualitatively.
- **Simon, H. (1971), "Designing Organizations for an Information-Rich World."** Information consumes
  attention; attention is the scarce resource being spent.
- **Schultz, W., Dayan, P. & Montague, P.R. (1997), *Science***; **Ferster & Skinner (1957),
  *Schedules of Reinforcement*.** Reward prediction error and variable-ratio responding — the real mechanism
  behind engagement loops, and the reason to be careful with the pop-science "dopamine hit" framing, which
  overstates it.
- **OECD PIAAC (Survey of Adult Skills).** Large minorities of adults in high-income countries score at the
  lowest literacy proficiency levels. Cited qualitatively; the exact share varies by country and cycle.
- **OECD (2022), *Dark Commercial Patterns*.** Cross-jurisdictional survey and taxonomy; useful when you need
  a non-advocacy source for a stakeholder.
- **EDPB Guidelines 03/2022 on deceptive design patterns in social media platform interfaces** (revised
  version adopted 2023); **EDPB Guidelines 05/2020 on consent**; **EDPB Cookie Banner Taskforce report
  (2023).** The operative reading of what an interface must do for consent to be valid in the EU.
- **CPPA Enforcement Advisory 2024-02 (dark patterns).** California regulator's own framing: dark patterns
  are assessed by **effect, not intent** — a design can be a dark pattern without anyone intending to
  deceive. The single most useful sentence to quote in an internal argument.
- **FTC (2022), *Bringing Dark Patterns to Light*, staff report.** US enforcement framing under §5.
- **W3C, WCAG 2.2 (Recommendation, 2023)**; **EN 301 549** as the EU harmonised ICT standard.

**Deliberately not quoted:** any "X% of users abandon after N seconds", any specific percentage of sites
using dark patterns outside the Mathur crawl's own reported figures, any claimed revenue lift or loss from
removing a specific pattern, and any assertion that a given company was fined a specific amount for a given
pattern. Enforcement outcomes are jurisdiction- and date-specific, frequently appealed, and are the fastest
way for this document to become wrong. Describe the obligation; look up the docket if you need one.

## References

- **`references/legal-layer.md`** — the EU and US regimes in detail, mapped to the interface decision each
  one constrains. Read before shipping consent, checkout, subscription or cancellation code, or when you need
  to cite a specific obligation in an escalation.
- **`references/consent-and-cancellation.md`** — "consent dialog done right" and "cancellation flow done
  right", with markup, copy and the common failure modes. Read when building or reviewing either flow.
