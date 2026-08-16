---
name: behavioral-metrics
description: Decides what to measure, how to instrument it, and how to tell whether a UX or growth change actually worked — activation definitions, retention curve shape, HEART/goals-signals-metrics, guardrail metrics, honest A/B testing, and the qualitative methods that beat weak statistics at small scale. Use this whenever the user is deciding what to track, reading an analytics or funnel result, planning an A/B test, defining activation or "aha" moments, setting a north-star or OKR metric, or claiming a change improved something — even if they never say "metrics", "analytics" or "experiment". Also use it proactively before shipping any engagement, onboarding, notification or persuasion change, because the guardrails that catch the backfire have to exist before the change ships, not after. Also use it when someone quotes a conversion or retention number and you need to work out whether it means anything.
---

# Behavioral metrics

This skill answers two questions: **did the thing we built actually work, and what did it break?** Both are routinely answered wrong in the same direction. A team ships an engagement change, watches sessions-per-day rise, declares victory, and never notices that notification opt-outs doubled and support tickets about a confusing new prompt tripled — because nobody was watching those. Or they run an "A/B test" with 400 users, stop it the afternoon the p-value dips under 0.05, and ship a result that is noise. The output of both failures is the same: a product that gets measurably better on the dashboard and worse in the hands of the people using it. The discipline here is narrow and unglamorous — define the value event before you build, pair every engagement number with a value number, write down your guardrails and stopping rule *before* you look, and know when you simply do not have the traffic to answer the question quantitatively at all.

## When this is the right skill

- Choosing what to instrument: activation events, north-star metrics, OKR metrics, funnel definitions, dashboards.
- Interpreting a result: "retention is 22%, is that good", "the test won, can we ship", "engagement is up".
- Planning or reviewing an A/B test, holdback, or staged rollout.
- Before shipping anything from the persuasion/engagement skills — the guardrails must be live first.
- Deciding what to do when you have a few hundred users a week and someone asked for statistical significance.

Go elsewhere when: you need to *find and validate* the activation moment itself in depth → **onboarding-activation** and its `references/instrumenting-activation.md`, which owns candidate generation and the causation test. You are deciding whether a mechanic is defensible → **ethical-persuasion-audit** (a guardrail regression is evidence, not a substitute for the ethics review). You already know where the funnel leaks and need the fix → **friction-and-flow**, **attention-and-hierarchy**, **persuasive-copy**, **habit-loop-design**. Unsure which principle is at play → **ux-psychology** (router + full catalog).

## Diagnose first

Measurement plans imported from a consumer social app into a B2B tool are the standard failure. "DAU" is meaningless for a payroll product used twice a month; "time in app" is a *failure* metric for an insurance claim. Answer these before you name a single metric.

1. **What is the natural frequency of the underlying need?** Daily, weekly, monthly, event-driven, once. This sets the retention window (D1/D7 vs. W4 vs. M6) and decides whether "active user" means anything at all. Measuring D7 on a quarterly-use product produces a number that is always near zero and always uninformative.
2. **Is usage voluntary or assigned?** In mandated software, logins measure your customer's management pressure, not your product's value. Measure task completion and time-to-complete instead; engagement metrics will look great regardless of whether you are helping.
3. **Who pays, who uses, who decides?** In B2B these differ. Account-level retention (renewal, seats in active use, data volume, integrations connected) usually predicts revenue better than any individual-user engagement metric, and individual engagement can be actively misleading — a well-designed tool used *less* per seat can renew better.
4. **What is the one moment where value becomes real, stated as a sentence with a subject, verb and object?** "The user sees their own data in a chart." "The candidate receives a reply." Everything downstream derives from this sentence. If you cannot write it, stop measuring and go find it.
5. **Do you want the user in here longer, or out faster?** Write this down explicitly, because it inverts the sign on half your metrics. Getting this wrong is how a tool team ends up optimising for the same numbers as a slot machine.
6. **How much traffic do you actually have at the point you want to change?** Not signups — *users reaching that specific screen per week*. This number, more than anything else, determines whether the rest of this skill's quantitative half is available to you. Compute it first (see move 7); most teams discover the answer is "no".

## The moves

Ordered by leverage. Moves 1–3 are worth more than the rest combined, and they are the ones skipped.

### 1. Define one value event, from product state, before you build anything

The activation or "aha" event is the anchor for the whole measurement plan: onboarding is judged by the rate of reaching it, retention by returning to it, experiments by their effect on it. It has to be defined precisely enough that two engineers would instrument it identically.

The rule that does the most work: **fire the event from product state, never from UI navigation.** A navigation-derived event (`onboarding_completed`, `viewed_dashboard`) rises whenever you shorten a wizard, whether or not anything valuable happened. A state-derived event fires only when the valuable thing exists.

```ts
// Nav-derived: goes up when you make the wizard shorter. Measures nothing.
track('onboarding_completed')

// State-derived: fires when the user has actually seen their own data.
track('first_report_viewed', {
  report_id,
  row_count,                  // real data, or an empty shell?
  is_sample_data: false,      // seeded demo data is not activation
  source: 'csv' | 'api' | 'manual',
  ms_since_signup,
  seat_type: 'owner' | 'invited',
  account_id,                 // B2B: you will need account-level rollups later
})
```

Rules that keep the definition honest over time:

- **Fire once per user, server-side where you can.** Client-only events undercount by your ad-blocker and crash rate, and that rate is not stable across cohorts, browsers or countries — so a client-only metric can move because your traffic mix moved.
- **Exclude sample/demo data explicitly**, or your activation rate becomes a measure of how aggressively you seed.
- **Carry a cohort key and an arrival-source property from day one.** Invited users, cold signups and sales-led trials have genuinely different curves; pooling them hides everything and cannot be fixed retroactively.
- **Never silently redefine an event.** Emit a new name and run both in parallel for a full retention window. A redefined metric with the same name destroys your ability to read your own history — and you will not remember the redefinition happened six months later.
- **Version the definition in code, next to the event, with an owner in a comment.** This is the artifact that stops three teams having three definitions of "active".

Finding and *validating* the right candidate — including the test that separates a lever from a symptom — is covered in depth in **onboarding-activation → `references/instrumenting-activation.md`**. Read it before you commit to a definition.

### 2. Guardrail metrics: the ship gate

This is the central discipline of the skill. **An engagement win is not a result until you have looked at what it cost.** Every technique in the sibling skills works by spending some of the user's attention, patience, or trust; guardrails are how you find out how much you spent.

A guardrail is a metric you are *not* trying to improve, with a threshold agreed **before** the experiment, that blocks the ship if crossed. Kohavi, Tang & Xu (*Trustworthy Online Controlled Experiments*, 2020) treat these as standard practice at scale; the point of writing them down first is that afterwards you will rationalise.

**The standing set.** Instrument these once, watch them on every behavioural change, forever:

| Guardrail | Catches | Notes |
|---|---|---|
| Notification opt-out / push permission revocation | Nagging dressed as engagement | The single most honest counter-metric for any prompt or reminder work |
| Email unsubscribe + spam-complaint rate | Over-sending, misleading subject lines | Spam complaints also threaten deliverability for your whole domain |
| Uninstall / account deletion / churn | Cumulative annoyance | Lagging; still worth it |
| Refund, cancellation, downgrade rate | Persuasion that oversold | Rising refunds after a conversion "win" means you sold, not persuaded |
| Support contact rate per 1,000 sessions | Confusion your funnel can't see | Best early-warning metric most teams already have and don't use |
| Task error rate / correction rate / undo rate | Interfaces that got faster by getting wronger | Especially for defaults, autofill, and one-click actions |
| Time-to-complete for the core task (p50 **and** p95) | Regressions hidden by averages | p95 is where the accessibility and low-end-device damage shows |
| Accessibility-affecting regressions | Contrast, focus order, target size, motion | Cannot be an A/B metric — see below |
| Page weight / latency (p75, p95) | "Engagement" that was actually a slower page | Latency changes move nearly every behavioural metric |
| Rage-click / dead-click / rapid-back rate | Frustration before abandonment | Cheap signal, available in most analytics tools |

**How to set a threshold.** For each guardrail, decide in advance either *no statistically detectable degradation* or an explicit budget ("we will accept up to a 0.5pp rise in unsubscribes for a 3pp rise in activation, and we will revisit in 30 days"). Writing the trade as an explicit exchange rate forces the conversation to happen while it can still change the decision.

**Guardrails you cannot A/B test.** Accessibility regressions, legal/consent compliance, and safety-relevant errors do not go in an experiment — an accessible interface is not a variant that has to earn its place, and a small sample will never detect harm concentrated in a small population. These are pass/fail checks in review. Run them in CI where possible (automated contrast/landmark checks catch a subset; keyboard-only and screen-reader passes catch the rest).

**When a guardrail moves.** The default is: do not ship, or ship with the harm mitigated. The failure mode is negotiating the guardrail down after the fact ("unsubscribes were already trending up"). If you find yourself explaining away a guardrail, you have learned something about the change: it works by extracting something. Take that back to **ethical-persuasion-audit**.

**Segment the guardrails even when you can't segment the wins.** Damage concentrates: new users, low-end devices, slow networks, assistive-technology users, the smallest accounts. An aggregate-flat guardrail can hide a severe regression in the 5% of users who cannot route around it.

### 3. Never let an engagement metric travel alone

"Time in app", "sessions per day", "screens per session" and "notifications opened" are the metrics most likely to make your product worse, because **they are exactly the metrics that improve when you make the product harder to finish with.** A confusing navigation raises screens-per-session. A slow search raises time-in-app. A withheld summary raises return visits. Every one of those reads as a win.

The fix is structural, not a matter of judgement: **each engagement metric is paired with a value metric on the same dashboard row, and neither is reported without the other.**

| Engagement metric | Must be shown next to |
|---|---|
| Sessions per user per week | Tasks completed per user per week (and per session) |
| Time in app | Time-to-complete the core task, and outcomes produced per hour |
| Screens/pages per session | Task success rate; rage-click and back-navigation rate |
| Notifications opened | Notifications sent, opt-out rate, and *actions completed after opening* |
| Search queries per user | Queries ending in a click/answer; query reformulation rate (a reformulation is a failure) |
| Feature adoption % | Retention of adopters *vs. matched non-adopters* (see move 9) |
| DAU / MAU ratio | Value delivered per active day — the ratio alone cannot tell habit from compulsion |

For a product people want to be *out* of fast, go further: put the inverted metric in the goal itself. Time-to-completion down, completion-without-support up, re-do/correction rate down, "was this done correctly?" confidence at exit up. Naming these as *targets* is what stops a team quietly optimising for dwell time because it was the number on the dashboard.

A blunt test that works: **would this user pay to get the same outcome in fewer sessions?** If yes, sessions are a cost you impose, not value you deliver, and you should be driving them down.

### 4. Read the shape of the retention curve, not a single day-N number

A day-30 number in isolation is nearly uninterpretable. The question that matters is **does the curve flatten, and at what level** — because a curve that asymptotes above zero means some population has genuinely adopted the product, and one that keeps sloping toward zero means you have a leaky bucket that no amount of top-of-funnel spend will fill. This is standard growth practice (Andrew Chen and the Amplitude/Mixpanel cohort literature both make the flattening the central read); it is a shape argument, not a benchmark argument.

What to build: a **cohort retention table** — rows are signup cohorts (week or month), columns are periods since signup, cells are the % of that cohort performing the *value event* (not "opened the app"). Read it three ways:

- **Down a column**: are newer cohorts retaining better than older ones? This is the only honest read of "is the product improving", and it survives changes in acquisition volume.
- **Across a row**: does it flatten? Where? The asymptote is your real ceiling.
- **Diagonally**: a step change affecting all cohorts at once on the same calendar date is usually a release, an outage, or a tracking bug — not a product truth. Check the release log before theorising.

**Censoring is the most common cohort bug.** A cohort that signed up 10 days ago has no day-30 value. Blending it into an "average day-30 retention" silently biases the number. Only compare cohorts old enough to have completed the window, and label the incomplete cells as incomplete rather than zero.

**Three definitions of "retained", and they tell different stories:**

| Definition | Means | Use when | Watch out |
|---|---|---|---|
| **N-day (exact)** | Active *on* day N specifically | Genuinely daily products | Punishing and noisy for anything less than daily; a weekly user looks churned |
| **Unbounded / rolling** | Active on day N *or any day after* | Infrequent, event-driven products | Monotonic and flattering; it is really "not yet churned", and it is heavily censored for recent cohorts — a user can always come back tomorrow and change history |
| **Bracket / range** | Active within a window (e.g. days 7–13) | Weekly-ish rhythms; most B2B | The sane default; state the bracket every time you quote the number |

Quoting a retention number without saying which definition, which event, and which cohort is the most common way teams accidentally lie to each other. Put all three in the metric's name: `w2_bracket_retention_first_report_viewed`.

Two more reads worth building once: **resurrection** (dormant users returning — usually a large, ignored population) and the **"smile"/upturn** some products show when a subset returns after a long gap. Do not confuse an upturn in a rolling-retention chart with a real resurrection; the former is partly definitional.

### 5. Turn goals into signals into metrics (HEART)

**HEART** (Rodden, Hutchinson & Fu, Google, CHI 2010, *Measuring the User Experience on a Large Scale*) — Happiness, Engagement, Adoption, Retention, Task success. The categories are the famous part; the useful part is the **goals → signals → metrics** process attached to them, which is what stops a team from listing every number their analytics tool emits.

Run it per feature or per journey, not per company:

1. **Goal** — what does success look like for *this* feature, for the user and the business? One sentence.
2. **Signal** — what observable user behaviour would change if we succeeded? What behaviour would change if we failed? Both directions, always.
3. **Metric** — how do we count that signal, normalised so it is comparable over time (per user, per session, per eligible visitor — never a raw count, which just tracks traffic).

A filled example for a "saved filters" feature:

| HEART | Goal | Signal | Metric |
|---|---|---|---|
| Adoption | Users discover saved filters exist | First-time saves among users who ran ≥3 searches | % of eligible users saving ≥1 filter within 14 days |
| Task success | Reaching a known result is faster | Fewer query reformulations before a click | Median reformulations per successful search, saved vs. unsaved |
| Retention | Saved filters bring people back | Return visits that start from a saved filter | W4 bracket retention, savers vs. matched non-savers |
| Happiness | People don't feel it's clutter | Complaints, hide/dismiss actions | Support mentions per 1k sessions; dismiss rate |
| Engagement | (deliberately omitted) | — | — |

Two notes. **You do not need all five rows** — HEART's authors are explicit that teams pick the dimensions that fit the product; forcing an Engagement row onto a tool people should use briefly is how bad targets get born. And **Happiness measured by NPS deserves a caveat**: Reichheld's claim (HBR, 2003) that the recommend-question is uniquely predictive of growth did not replicate — Keiningham et al. (*Journal of Marketing*, 2007) found it performed no better than conventional satisfaction measures. NPS is a fine thermometer for tracking your own trend; it is not evidence, and its benchmarks across companies are close to meaningless.

Above the per-feature table, keep **one** headline metric and resist adding a second. A metrics tree — headline at the top, decomposed into the inputs teams can actually move — is how you keep a single north star without pretending one number tells you what to do on Monday.

### 6. Design the experiment before you look at it

**Goodhart's law** (Charles Goodhart, 1975; the memorable phrasing "when a measure becomes a target, it ceases to be a good measure" is Marilyn Strathern's 1997 paraphrase, not Goodhart's own) and **Campbell's law** (Donald Campbell, 1976) are the background threat: any metric under pressure gets gamed, including by well-meaning people who are not aware they are gaming it. The specific defence for experiments is to fix every decision in writing *before* the data exists.

**Write these down before the test starts, in the PR or the ticket:**

1. The **primary metric** — exactly one. (Or an explicit OEC combining a few, decided in advance.)
2. **Minimum detectable effect** — the smallest change that would actually change what you do. Not "any improvement".
3. **Sample size per arm and planned duration**, computed from that MDE.
4. **Guardrails and their thresholds** (move 2).
5. **Any segments you will look at**, pre-registered. Segments invented afterwards are hypotheses, not findings.
6. **The stopping rule** — either "look once at the planned end date", or an explicit sequential procedure.

**Sizing, concretely.** For a proportion, a serviceable approximation for 80% power at α=0.05 two-sided is `n ≈ 16 σ² / Δ²` per arm (Kohavi, Tang & Xu, 2020). For a 5% baseline conversion, σ² = 0.05 × 0.95 = 0.0475:

- Detect a 10% relative lift (Δ = 0.005 absolute): `16 × 0.0475 / 0.005²` ≈ **30,400 per arm**, ~60,800 users total.
- Detect a 20% relative lift (Δ = 0.01): ≈ **7,600 per arm**.

Run this arithmetic *first*. It is usually the end of the conversation, and that is a useful outcome — see move 7.

**Peeking is not a minor sin.** If you monitor a running test and stop when p < 0.05, your actual false-positive rate is far above the nominal 5% and grows with how often you look; under a true null with unlimited looks and no stopping rule, the probability of *eventually* seeing p < 0.05 approaches certainty. Johari, Pekelis & Walsh formalised this (*Always Valid Inference*, 2015; *Peeking at A/B Tests*, KDD 2017) and gave the honest fix: **sequential testing** (their always-valid p-values / mSPRT, or group-sequential designs with alpha spending), which is explicitly designed to let you look continuously and stop early without inflating error. If your platform offers sequential/always-valid results, use them and you may peek. If it reports a fixed-horizon p-value, you may not.

**Multiple comparisons.** Twenty metrics at α=0.05 gives you only about a one-in-three chance (0.95²⁰ ≈ 36%) that *none* of them shows a spurious "significant" result — so on a typical dashboard, something usually wins. Designate one primary metric; treat everything else as exploratory and say so out loud; apply a correction (Benjamini–Hochberg for a family of metrics you actually care about) if you must make claims about several. The same arithmetic applies to running many variants and to slicing by segment.

**Duration, novelty and primacy.** Short tests are contaminated in both directions: a **novelty effect** inflates the treatment because a change is new and gets poked at, and a **primacy effect** deflates it because existing users are disrupted before they adapt. Both decay. Defences: run at least one full weekly cycle (two is better — weekday/weekend and payroll/monthly rhythms are real), and plot the treatment effect *over time* for a fixed early cohort. A trend that is still moving at the end of the test means the test ended too early, not that you have a result. (Kohavi, Tang & Xu, 2020, treat this as a standard diagnostic.)

**Sanity checks that catch more bugs than they should.** Check **sample ratio mismatch** first — if you assigned 50/50 and observe 50.6/49.4 at scale, the test is broken (bot filtering, redirect loss, assignment-before-eligibility), and no result from it is usable. Then apply **Twyman's law**: any figure that looks surprisingly good is probably wrong. Investigate wins as hard as you investigate losses, because nobody else will.

Fuller mechanics — SRM diagnosis, A/A tests, interference and network effects, ratio-metric traps, variance reduction, the trigger/analysis population distinction — are in **`references/experiment-design.md`**. Read it before running a test you intend to make a decision with.

### 7. When you don't have the traffic (this is most teams)

If move 6's arithmetic said you need 30,000 users per arm and you get 900 visitors a week, you cannot run a meaningful A/B test on that change. Say this plainly rather than running an underpowered one — an underpowered test does not just fail to detect real effects, it makes any "significant" result it *does* produce more likely to be wrong and badly exaggerated in size (the winner's-curse / Type-M problem). A tiny test that "wins" is the most dangerous artifact in this entire skill.

What to do instead, roughly in order of value:

**Pre-registered before/after with a written expectation.** Before shipping, write down: the metric, the current value with its normal week-to-week variation, what you expect to happen, by how much, by when, and *what would make you revert*. Ship to everyone. Compare against the pre-registration. This is not causal evidence — seasonality, marketing pushes and other releases confound it — but a pre-registered prediction that misses badly is genuine information, and the discipline of writing "I expect activation to go from 31% to 38% within three weeks" before shipping is most of the value. Keep a release log so you can attribute step changes later.

**Holdback rollouts.** Ship to 90%, hold 10% back for a month. Easier to run than a 50/50 test, and for large effects it will show them. Also the only clean way to measure a *long-run* effect once you've decided to ship anyway.

**Painted-door / fake-door tests.** Put the entry point for an unbuilt feature in the product, measure intent-to-click, then show an honest "this isn't ready yet — want to be told when it is?". This measures demand for pennies. **Two conditions**: never take money or credentials for a thing that does not exist, and never leave the user worse off than before they clicked. A fake door that reads as a bug or a bait-and-switch costs trust that is worth more than the datapoint — see **ethical-persuasion-audit**.

**Sequential/Bayesian analysis of a small stream.** Not a way to conjure power out of a small sample, but an honest way to accumulate evidence over months and stop when it is conclusive rather than when the quarter ends.

**Concierge tests.** Hand-deliver the outcome to 20 users manually. If manually delivered value does not change their behaviour, the automated version will not either — and you learned it in a week without writing the feature.

And be realistic about the ceiling even when you *do* have traffic: Kohavi, Crook & Longbotham (2009) reported that only about **one third** of ideas tested on Microsoft's experimentation platform improved the metrics they were designed to improve, with success rates lower still on heavily optimised surfaces. Most of your ideas are not going to work. That is the normal, healthy state, and it is the reason to test rather than to argue.

### 8. Qualitative methods that beat weak quantitative ones at small scale

At small n, watching five people is strictly more informative than a statistically meaningless test — because usability problems are usually *frequent*, and you are not trying to estimate an effect size, you are trying to find the broken thing.

**Moderated usability sessions.** Give a real task, no instructions, ask them to think aloud, and *do not help*. The moment you want to explain something is the finding. Nielsen & Landauer (1993) modelled problem discovery and Nielsen's widely-cited 2000 essay concluded five users surface around 85% of problems — but this is contested and should not be treated as a law: **Faulkner (2003)** re-sampled from 60 participants and found that random sets of five caught anywhere from 55% to 99% of the known problems, while ten users never fell below 80% and twenty never below 95%. The honest reading: five is an excellent *first* round and reliably finds the worst problems; the variance across any particular five is large, so run several rounds of five between iterations, and use more when your user base has genuinely distinct segments (Nielsen says the same about distinct groups). Anyone asserting "five is enough" as settled fact is quoting one side of a live argument.

**Funnel drop-off analysis.** Instrument each step of a flow with both entry and success events, then look at where the largest *absolute* number of users is lost, not the largest percentage. Sort by users-lost, not by rate. Break drop-off down by device and by new-vs-returning before theorising; "our checkout is broken" is frequently "our checkout is broken on Android".

**Session replay** — the highest-information-per-hour tool available for "why did they abandon", *with consent* (see the privacy section; it is not consent-exempt anywhere in the EU/UK). Watch replays of sessions that hit a failure event, not random ones. Mask all input fields by default and block payment and credential fields at the SDK level, not by policy.

**Support tickets and cancellation text as a data source.** Chronically underused and free. Tag every ticket to a product surface, count per 1,000 sessions of that surface, and read the tickets in the top surface each week. Cancellation free-text answers the causal question your funnel cannot: *why they left*. Ticket rate per surface is also one of your best guardrails (move 2), which means this doubles as instrumentation.

**Watch for the sampling bias in all of the above**: people who complain, respond to surveys, or agree to a session are systematically not your median user, and never your churned user. Qualitative work tells you *what can go wrong and why*; it does not tell you *how often*. Use it for mechanism, use counts for prevalence.

### 9. Correlation is not the intervention

"Users who create 3+ projects retain twice as well" is almost always **survivorship and intent, not causation.** People who were already going to stay did the thing. Building machinery to push disengaged users into doing the thing then produces the behaviour without the retention — you manufactured the symptom.

The diagnostic question: **is this event a marker of pre-existing intent, or a supplier of value?** Uploading a profile photo is a marker. Connecting your data source is usually a supplier. If you can't tell, test it: take users who have *not* done it, randomly assign half to an intervention that helps them do it, and measure retention — not the event rate. If the treated group hits the event more and retains the same, you have proven it is a symptom.

Related traps in the same family:

- **Survivorship in cohort reads**: "our power users love feature X" is a statement about people who stayed. The people it drove away are not in your dataset.
- **Selection into adoption**: comparing adopters to non-adopters is not an experiment. If you must, match on pre-adoption behaviour (activity level, tenure, plan) and present it as suggestive, labelled as such.
- **Simpson's paradox**: a metric can improve in every segment and fall overall (or the reverse) when segment mix shifts. Always check whether the *mix* moved before believing an aggregate.
- **Regression to the mean**: you targeted the worst-performing cohort, it improved. Some of that was going to happen anyway. This is why the untouched control exists.
- **Novelty in disguise**: a change that only helps users who were already engaged has an unimpressive story to tell about growth.

## Analytics and privacy

Getting this wrong is a legal problem, not a style problem, and it constrains which of the methods above you may use.

**The rule that catches people out**: in the EU/UK, consent for storing or reading information on a user's device comes from **ePrivacy Directive Article 5(3)**, not from GDPR — so "legitimate interest" is *not* available as a basis for setting an analytics cookie or reading from local storage. The exemption is narrow: strictly necessary for the service the user requested. The EDPB's guidelines on Article 5(3) (2/2023) confirm the scope is technology-neutral: pixels, local storage, IP-based tracking, fingerprinting and URL-based identifiers are covered too, so "we're cookieless" is not by itself an exemption. Separately, GDPR still governs the personal data you process once you have it.

Roughly where the lines fall (verify against current national guidance — this area moves):

| Practice | Consent needed in EU/UK? |
|---|---|
| Server-side request logs kept for security/operations, minimised and short-retention | Generally no (still GDPR-governed) |
| Strictly necessary state: session, auth, cart, load balancing, consent record | No |
| First-party, aggregate-only audience measurement, no cross-site tracking, no sharing, IP truncated | **Sometimes** — France's CNIL operates a narrow exemption under conditions; the UK has legislated a narrow statistics exception under PECR. Neither is a general licence, and both are conditional. Check current text before relying on it |
| Ordinary product analytics with a persistent user/device ID | Yes |
| A/B test assignment stored against a persistent identifier | Yes (assignment is device storage) |
| Session replay, heatmaps, scroll/mouse recording | **Yes** — CNIL and other regulators treat replay as consent-requiring, with credential and payment fields blocked by default and blanket recording of all sessions unacceptable |
| Advertising, retargeting, cross-site/cross-device attribution | Yes, unambiguously |

**Practical consequences for your measurement plan.** Consent rates are not uniform — they vary by geography, device and audience — so consent-gated analytics gives you a **biased sample, not a smaller one**, and the bias correlates with exactly the privacy-conscious users you might most want to understand. Design for this: put your critical activation and guardrail events on the server side where the lawful basis is contractual necessity and the data is minimised, and reserve consent-gated tooling (replay, heatmaps) for diagnostic work rather than for anything that feeds a ship decision.

**The case for privacy-preserving analytics** is not only ethical: cookieless, aggregate, first-party analytics can often run without a consent banner (subject to the conditions above), which means it measures 100% of your traffic instead of the consenting fraction. A complete unbiased count of page-level behaviour frequently beats a partial, consent-skewed count with richer per-user detail. Collect the minimum that answers your written questions, set a retention limit and enforce it, and never send PII — email, name, raw IP, free-text field contents — into an analytics event payload; it is the single most common way teams create a breach out of a dashboard. See **ethical-persuasion-audit → `references/consent-and-cancellation.md`** for the consent UI itself, which has its own legal requirements.

## The instrumentation plan template

Fill this in before building a feature. It fits in a PR description or a ticket; if it can't be filled in, the feature is not ready to build.

```md
## Instrumentation plan: <feature>

**Value moment** (subject–verb–object, one sentence):
> The user ______________________________.

**Primary metric** (exactly one, normalised per user/session/eligible visitor):
- Name:                    <snake_case_metric_name_with_window>
- Definition:              numerator / denominator, stated explicitly
- Current value + normal week-to-week variation:
- Target and by when:
- Minimum effect that would change our decision:

**Paired value metric** (required if the primary is an engagement metric):

**Events to emit** (state-derived, server-side where possible):
| Event | Fires when | Properties | Once per? | Client/server |
|---|---|---|---|---|
|  |  |  |  |  |

**Cohort/segment keys carried on every event:** arrival source, plan, seat type,
account id, device class, locale

**Guardrails** (threshold + owner; blocks ship if crossed):
| Guardrail | Threshold | Owner |
|---|---|---|
| Notification opt-out |  |  |
| Unsubscribe / spam complaints |  |  |
| Support contacts per 1k sessions |  |  |
| Task error / undo rate |  |  |
| Core task time p50 / p95 |  |  |
| Accessibility check (pass/fail, not A/B) |  |  |
| Latency p75 / p95 |  |  |

**How we will judge it**
- [ ] A/B test — n per arm ______, duration ______, stopping rule ______,
      pre-registered segments ______
- [ ] Holdback ____% for ______
- [ ] Pre-registered before/after — expectation: ____________, revert if: ____________
- [ ] Qualitative only — n sessions, tasks, what would count as failure

**Privacy**: lawful basis ______ | consent required? Y/N | PII in payloads? must be N
| retention ______ | server-side or client-side and why ______

**Pre-registered prediction** (write it before shipping, review it after):
> We expect ______ to move from ______ to ______ within ______ because ______.
> If instead ______ happens, we will ______.

**Review date:** ______   **Owner:** ______
```

## Anti-patterns

- **Shipping the engagement win, measuring the cost never.** The complete version of this failure: engagement rises, opt-outs rise faster, and because opt-outs weren't on the dashboard the team ships three more of the same change before churn makes it visible a quarter later.
- **Stopping the test when it turns significant.** The single most common way software teams generate false results. If you cannot commit to a fixed horizon, use a sequential procedure — those are the only two honest options.
- **The 400-user A/B test.** Underpowered tests do not merely fail to find effects; the "wins" they do produce are disproportionately false and inflated. Do the sizing arithmetic first and switch to move 7 when it fails.
- **Segment-hunting after the fact.** "It didn't win overall, but it won for mobile users in Germany" is a hypothesis for the next test, never a reason to ship this one.
- **Vanity denominators.** Raw counts (total signups, total sessions) go up when marketing spends money. Normalise everything per eligible user, per session, or per cohort, or you are reporting your ad budget.
- **Averaging cohorts of different ages.** Blending a 40-day-old cohort with a 10-day-old one into "average D30 retention" produces a number that moves whenever acquisition volume moves.
- **One metric owning a team's bonus.** Goodhart guarantees the metric gets satisfied and the goal does not. Pair it with a guardrail that would catch the cheapest way to game it, and ask out loud in the planning meeting: "what is the laziest way to move this number, and would we be happy if that happened?"
- **Renaming or redefining an event without versioning it.** Destroys the history and nobody remembers six months later. New meaning, new name.
- **Treating NPS or a PMF score as evidence.** The Sean Ellis "40% would be very disappointed" threshold is a widely-used practitioner heuristic with no published validation behind the specific number, and both it and NPS over-sample respondents who are still around. Use them to track your own trend; do not use them to settle an argument.
- **A dashboard nobody has ever acted on.** If no decision has ever changed because of a chart, delete the chart. It is costing you attention and creating an illusion of measurement.
- **Sending PII into analytics payloads** because it was convenient for a join. Do the join in your own warehouse on an internal ID.

## Ship checklist

Run this against the PR before merging anything that changes user behaviour.

- [ ] The value event is defined from product state, fires once per user, and excludes sample data.
- [ ] Exactly one primary metric, named with its window and its denominator.
- [ ] If the primary metric is engagement-flavoured, a value metric is on the same row and both are reported together.
- [ ] Guardrails are instrumented and *live before this ships* — opt-out, unsubscribe, support contacts, error/undo rate, p95 task time, latency — with thresholds written down.
- [ ] Accessibility and consent checks are pass/fail in review, not experiment arms.
- [ ] If testing: sample size, duration, stopping rule and any segments were written down before data existed, and the test covers at least one full weekly cycle.
- [ ] If not testing: a pre-registered expectation and a revert condition are written down, and the release is in the log so a future step-change can be attributed.
- [ ] Cohort/segment keys (source, plan, device class, seat type) ride on the new events.
- [ ] SRM/sanity check planned; surprising wins get investigated as hard as losses.
- [ ] No PII in event payloads; lawful basis identified; replay/heatmaps behind consent.
- [ ] Someone named owns reading the result on a named date. An unowned metric is not measured.

## Sources

- **HEART framework and goals–signals–metrics** — Rodden, Hutchinson & Fu, "Measuring the User Experience on a Large Scale: User-Centered Metrics for Web Applications", CHI 2010 (Google).
- **Experiment design, guardrails, OEC, novelty/primacy, Twyman's law, sizing rule of thumb** — Kohavi, Tang & Xu, *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing*, Cambridge University Press, 2020.
- **Idea success rate (~1/3 at Microsoft)** — Kohavi, Crook & Longbotham, "Online Experimentation at Microsoft", 2009; see also Kohavi et al., "Online Controlled Experiments at Large Scale", KDD 2013.
- **Peeking and sequential testing** — Johari, Pekelis & Walsh, "Always Valid Inference: Bringing Sequential Analysis to A/B Testing" (arXiv:1512.04922, 2015); "Peeking at A/B Tests: Why It Matters, and What To Do About It", KDD 2017.
- **Sample ratio mismatch** — Fabijan et al., "Diagnosing Sample Ratio Mismatch in Online Controlled Experiments", KDD 2019.
- **Five-user usability testing, and the argument against it** — Nielsen & Landauer, "A Mathematical Model of the Finding of Usability Problems", INTERCHI 1993; Nielsen, "Why You Only Need to Test with 5 Users", 2000; **Faulkner, "Beyond the five-user assumption: Benefits of increased sample sizes in usability testing", *Behavior Research Methods* 35(3), 2003** — the critique, with the 55–99% variance figures. Treat the "five is enough" claim as contested.
- **Metric gaming** — Goodhart, "Problems of Monetary Management: The U.K. Experience", 1975; Strathern, "'Improving ratings': audit in the British University system", 1997 (source of the popular phrasing); Campbell, "Assessing the Impact of Planned Social Change", 1976.
- **NPS and its failure to replicate** — Reichheld, "The One Number You Need to Grow", *Harvard Business Review*, 2003; **Keiningham, Cooil, Andreassen & Aksoy, "A Longitudinal Examination of Net Promoter and Firm Revenue Growth", *Journal of Marketing* 71(3), 2007** — found no advantage over conventional satisfaction measures.
- **Product-market-fit survey** — Sean Ellis's "40% very disappointed" heuristic (c. 2009). Practitioner pattern-matching, not a validated instrument; no peer-reviewed evidence for the specific threshold.
- **Analytics consent** — ePrivacy Directive Art. 5(3); EDPB Guidelines 2/2023 on the technical scope of Art. 5(3); CNIL guidance on audience-measurement exemption and on session replay; UK PECR and current ICO guidance for the narrow statistics exception. Verify current text — this area changes.

Deliberately not asserted here: any "X% of users abandon after N seconds" figure, industry retention benchmarks by category, and the claim that any specific engagement threshold ("N friends in M days", "3 projects") is causal — those are correlational observations from individual companies, not laws.

## References

- **`references/experiment-design.md`** — read before running any test you'll make a decision on: SRM diagnosis, A/A tests, trigger vs. analysis population, ratio-metric traps, interference and network effects, variance reduction, and how to read a result that is flat.
