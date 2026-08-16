# Finding, validating and instrumenting the activation moment

Read this when you need to actually establish what "activated" means for a product, prove it is a lever rather than a symptom, and wire up the events and views that make onboarding work judgeable.

Everything in the parent skill depends on this. Without it you are redesigning a flow on taste and shipping into the dark.

## Step 1: generate candidates from qualitative work, not from the data

Do not start by mining events for correlations. Correlation mining produces things like "users who uploaded a profile photo retain better" — true, useless, and dangerous if you act on it.

Start with three sources:

1. **Watch five new users**, unassisted, thinking aloud, on their own task. The moment their posture changes — "oh, that's what it does" — is your candidate. Five is enough to generate candidates; it is not enough to validate one.
2. **Ask retained users what hooked them.** Not "why do you use it" (they will recite your marketing) but "tell me about the first week — when did you decide it was worth it?" Look for a repeated concrete event.
3. **Read cancellation and support text.** "I never got it working" and "I couldn't figure out how to X" name the barrier directly, and the barrier sits immediately before the value moment.

Write each candidate as a sentence with a subject, verb and object: *"the user sees their own data rendered in a chart"*, not *"the user engages with reporting"*.

## Step 2: define the event so it cannot drift

An activation event must fire from **product state**, not from UI navigation. The distinction is the whole game: a navigation-derived event rises whenever you make the UI easier to click through, whether or not value occurred.

```ts
// Nav-derived: rises when you shorten the wizard. Meaningless.
track('onboarding_completed')

// State-derived: fires only when the thing that matters actually happened.
track('first_report_viewed', {
  report_id,
  row_count,                 // did they see real data or an empty shell?
  source: 'csv' | 'api' | 'sample',
  is_sample_data: false,     // samples are not activation
  ms_since_signup,
  seat_type: 'owner' | 'invited',
})
```

Rules that keep it honest over time:

- **Fire once per user**, server-side where possible. Client-side-only activation events undercount by whatever your ad-blocker and crash rate happen to be, and that rate is not stable across cohorts.
- **Exclude sample/demo data explicitly.** If seeded sample data can trip the event, your activation rate becomes a measure of how aggressively you seed.
- **Carry a `seat_type` or arrival-source property from day one.** Invited users, cold signups, and sales-led trials have genuinely different activation curves, and pooling them hides everything.
- **Never redefine it silently.** If the definition must change, emit the new event under a new name and run both in parallel for a full retention window. A redefined metric with the same name destroys your ability to read history.
- **Version the definition in code, next to the event**, with a comment saying what it means and who owns it. This is the artifact that stops three teams having three definitions of "activated".

## Step 3: the causation test — the step almost everyone skips

You now have a candidate that correlates with retention. It is probably a **symptom of intent**, not a cause. Users who were already going to stick around did the thing; making a disengaged user do the thing may change nothing.

This is precisely the trap in the folklore around Facebook's "7 friends in 10 days". It was a correlational observation used as an internal rallying point, and its own authors have described the specific numbers as somewhat arbitrary — one of several thresholds that would have served. Repeating it as a discovered law, or copying its *shape* into your product ("get users to N of X in Y days"), imports the error.

The test:

1. Take users who have **not** hit the candidate event.
2. Randomly assign half to an intervention that specifically helps them reach it — a prompt, a shortcut, a prefilled path, concierge help, whatever is cheapest.
3. Measure retention at your standard horizon (day 7, day 30 — long enough to matter, short enough to iterate).

**If the treated group retains better**, the metric is a lever and it is worth building machinery around. **If they hit the event more but retain the same**, you have proven it is a symptom: the event tracks intent, and manufacturing the event manufactures nothing. Go back to step 1.

A cheap pre-test if you cannot run an experiment yet: manually onboard 20 new users over a call, walking them to the candidate moment. If hand-delivered activation does not move their retention against a comparable unassisted group, no amount of product work will.

Also check the boring alternative explanation before celebrating: users who did anything at all retain better than users who did nothing. Compare your candidate against a naive "performed ≥1 meaningful action" baseline. If it does not beat that baseline, it is measuring aliveness, not activation.

## Step 4: the views that make onboarding legible

Build these three. They answer different questions and you need all of them.

**A. Retention by activation status.** Two retention curves — activated in session one vs not — for each weekly signup cohort. This is the scoreboard. If the gap is small, either your activation definition is wrong or the product's real problem is downstream.

**B. Step-level drop-off with time, not just counts.** For each step on the path to activation: how many entered, how many left, and the *median time spent by those who left*. Time is the diagnostic that counts alone cannot give you:

- Fast exit → the step is confusing, unwanted, or read as a wall (a permission prompt, a paywall, an irrelevant question). They rejected it on sight.
- Slow exit → the step is genuinely hard, or they hit an error, or it required something they had to go find (an API key, an approval, a file). They tried and failed.

The two demand opposite fixes: delete/defer versus support/simplify. Pooled drop-off counts make them look identical.

**C. Time-to-value distribution, not average.** Plot the distribution and read the **median** and the shape. Averages in this metric are destroyed by a long tail of users who signed up, wandered off, and came back three days later. A bimodal distribution — a fast cluster and a slow cluster — usually means two distinct populations sharing one flow, which is a routing problem, not a flow problem.

## Step 5: the guardrails

Onboarding changes are unusually good at moving one number by wrecking another. Pair every activation experiment with:

- **Downstream retention of the activated cohort.** If you make activation easier and the activated cohort's day-30 retention *drops*, you have diluted the definition — you are now counting people who did not really get value. This is the most common way an activation win is fake.
- **Support contact rate in week one.** Deferring setup can push confusion downstream.
- **Data quality**, if you replaced questions with inference. Guessing the timezone wrong is worse than asking.
- **Long-run monetisation**, if you deferred the card or the paywall. Deferral usually helps, but verify rather than assume.

## Sample-size sanity

Onboarding experiments are frequently underpowered, and an underpowered experiment reporting a large effect is mostly reporting noise.

Before running: estimate your baseline activation rate and the smallest lift that would justify shipping, and check whether your weekly signup volume can detect it in a reasonable window. If it cannot, do not run a doomed A/B test — use the qualitative route (watch people fail, fix the failure) which needs five users, not five thousand. Small products should fix obvious breakage by observation and save experimentation for when volume supports it.

Do not stop an experiment the moment it crosses significance; onboarding metrics are especially prone to early-peeking illusions because the earliest-arriving users in a cohort are not representative of it. Fix the horizon in advance.

## Anti-patterns specific to measurement

- **Every team has its own "activated".** Sales means "had a demo", marketing means "signed up", product means "used feature X". Publish one definition, in code, with an owner.
- **Measuring onboarding-funnel completion as the goal.** It rises when you delete value-delivering steps.
- **Comparing cohorts across a definition change** without noting the change on the chart. Annotate releases on every activation chart; unexplained step changes eat weeks of investigation.
- **Optimising the metric instead of the outcome.** The moment activation becomes a team target, someone will find a way to fire the event more cheaply. The guardrail against this is (A) above: the activated cohort's downstream retention.
- **Segmenting only after a surprising result.** Decide the segments that matter (arrival source, seat type, platform, plan) up front and carry them as event properties, or you will be unable to answer the first question anyone asks.

## Sources

- Dave McClure, "Startup Metrics for Pirates" (AARRR), 2007 — origin of activation as a named funnel stage.
- Facebook growth-team practice as recounted publicly by Chamath Palihapitiya — the origin of the "magic number" pattern, and, read carefully, the best available argument for why the pattern needs a causal test rather than imitation. The "7 friends in 10 days" figure is correlational.
- Cohort retention analysis and the correlation/causation distinction in product metrics are standard practice rather than a single citable finding; the specific critique of magic numbers as illusions has been made publicly by analytics vendors including Mixpanel and Geckoboard.

Deliberately not claimed: benchmark activation rates or "good" time-to-value figures by category. Numbers of that kind circulate widely without a traceable methodology, mix wildly different products, and are most often used to justify a decision already made. Your own historical baseline is the only comparison worth making.
