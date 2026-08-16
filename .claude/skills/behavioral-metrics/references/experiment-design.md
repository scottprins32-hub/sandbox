# Running an experiment you can actually trust

Read this before running any A/B test, holdback, or staged rollout whose result will change a decision. The parent skill covers *whether* to test and the pre-registration discipline; this covers the mechanics that turn a running test into a trustworthy number, and the failure modes that silently produce confident nonsense.

The governing reference throughout is Kohavi, Tang & Xu, *Trustworthy Online Controlled Experiments* (Cambridge, 2020), written from experimentation platforms at Microsoft, Google and LinkedIn. Where a claim here is theirs, it is marked.

## Before the first user is assigned

### Run an A/A test once

Split traffic between two identical experiences and analyse it exactly as you would a real test. It is the only way to validate the whole pipeline at once — randomisation, assignment persistence, event delivery, the analysis code, and your variance estimates.

What it catches:
- Assignment that isn't actually random (hashing by a key correlated with behaviour, e.g. account id where accounts arrived in cohorts).
- Users flipping between arms across sessions or devices.
- Analysis code that reports significance when it shouldn't. Across many A/A tests, the fraction showing p < 0.05 should land near 5%. Substantially more means your variance is understated — most commonly because you analysed *events* as if they were independent when they are clustered within users.

Repeat it after any change to the assignment or logging layer.

### Decide the trigger condition and the analysis population

The most common quiet error in small-team experiments. If your change only affects users who reach step 3 of a flow, but you analyse *everyone assigned at signup*, you dilute the effect with users who never saw either variant — often by a factor large enough to make a real effect undetectable.

Analyse the **triggered population**: users who reached the point where the variants actually differ. This requires firing an explicit trigger/exposure event at that point, in *both* arms, from the same code path. Firing it only in treatment is a classic bug that guarantees a broken comparison.

Two rules that follow:
- The exposure event must be emitted at the moment of divergence, not at page load, and not at assignment.
- Report the effect on the triggered population **and** the diluted effect on everyone, since business impact depends on the second.

### Choose the randomisation unit deliberately

- **User** (persistent id): the default. Consistent experience, valid for behavioural metrics.
- **Session**: only for changes with no cross-session memory. Users will see both variants; anything about retention becomes meaningless.
- **Account / team / workspace**: required whenever users within an account interact or can see each other's state — otherwise treatment leaks. Costs you a great deal of power, because your effective sample size is the number of *accounts*, not users. For most B2B products this is the honest unit and the reason B2B A/B testing is usually infeasible.
- **Geography or time period**: last resort for changes that cannot be split per user (pricing, marketing, network-wide features). Weak, confounded, but sometimes the only option.

The randomisation unit must match the analysis unit. Randomising by user and analysing per-event understates variance and manufactures significance.

## While it runs

### Sample ratio mismatch (SRM) — check this first, always

If you assigned 50/50, the observed split should be within sampling noise of 50/50. At any real scale, a 50.5/49.5 split is not noise; it is a bug. Compute a chi-squared test on the observed counts; if p < 0.001 on the ratio, **discard the result entirely and find the cause** (Fabijan et al., "Diagnosing Sample Ratio Mismatch in Online Controlled Experiments", KDD 2019).

Usual causes:
- Bot/crawler filtering applied after assignment and hitting one arm differently.
- Redirect-based tests losing users on the redirect leg.
- The treatment being slower and losing more users before the exposure event fires.
- Assignment logged before an eligibility check that fails asymmetrically.
- Client-side treatment code erroring out and never logging exposure.

An SRM almost always means the arms differ in *who is in them*, which invalidates every metric in the test — including the ones that look great. Teams that ship SRM-affected wins are the main source of "our A/B test said +8% and revenue didn't move".

### Do not peek at a fixed-horizon test

Covered in the parent skill; the mechanics, briefly. A fixed-horizon p-value is only valid at the pre-declared sample size. Continuous monitoring with a "stop at p < 0.05" rule inflates the false-positive rate well above nominal, increasing with the number of looks; with unbounded looking the probability of eventually crossing the threshold under a true null tends to 1.

The two legitimate options:
1. **Fixed horizon.** Compute n, run to n, look once. You may monitor guardrails and SRM for *safety* — that is a different decision (abort for harm) and doesn't bias the primary readout, provided you don't also stop early for a win.
2. **Sequential.** Always-valid p-values / mSPRT (Johari, Pekelis & Walsh, 2015; KDD 2017) or a group-sequential design with an alpha-spending function (O'Brien–Fleming and similar). These are constructed so that looking repeatedly is valid, at the cost of needing a somewhat larger sample for the same power if you run to the end. Most commercial platforms that advertise "peek any time" implement one of these — confirm which, because some simply report fixed-horizon statistics with reassuring copy.

### Duration: at least one full weekly cycle, usually two

Behaviour has strong weekly periodicity (weekday/weekend for consumer, and for B2B a workweek plus month-end effects). A test that runs Tuesday to Friday measures Tuesday-to-Friday users. Run in whole weeks. If a monthly billing or payroll rhythm exists in your product, a month is the real cycle.

Reaching your sample size early is not a reason to stop early — the sample you accumulated in three days is not a random sample of your users.

### Novelty and primacy

- **Novelty**: the treatment is new, so people click it. Effect decays.
- **Primacy**: existing users are disrupted and perform worse until they adapt. Effect grows (from negative).

Diagnostic (Kohavi, Tang & Xu, 2020): take the users who entered the experiment in the first day or two and plot *their* treatment effect day by day over the whole test. A flat line is a real effect. A decaying or growing line means the test needs to run longer, and that the headline number is currently wrong in a known direction.

New-user cohorts cannot show primacy — they have nothing to be disrupted from — so splitting the readout by new vs. existing users separates the two mechanisms cleanly, and is worth pre-registering as a segment for any UI change to an established product.

## Analysing it

### Metrics that break standard tests

- **Ratio metrics with a user-varying denominator** (clicks per session, revenue per order): the unit of analysis differs from the unit of randomisation. Use the delta method or bootstrap by user; a naive t-test on the pooled ratio understates variance.
- **Heavy-tailed metrics** (revenue, session length, storage used): a single whale moves the mean. Cap/winsorise at a pre-declared percentile, and report a rank-based or capped version alongside the raw one. Deciding the cap *after* seeing the data is a way of choosing your result.
- **Count metrics per user** are usually overdispersed; don't assume Poisson.
- **Rates with tiny denominators** in a segment slice will produce spectacular percentage swings that are pure noise. Show absolute counts next to every rate.

### Variance reduction (when you're near the edge of feasible)

**CUPED** (Deng, Xu, Kohavi & Walker, WSDM 2013) — adjust the metric using each user's *pre-experiment* value of the same metric, which is independent of treatment. For returning-user products with stable pre-period data, this can cut variance substantially and is the single most effective way to make a marginal test viable. It does nothing for brand-new users, who have no pre-period, which is why it rarely rescues onboarding experiments.

Stratifying or blocking on a strong pre-period covariate at assignment time achieves something similar and is easier to implement.

### Interference: when users affect each other

Standard A/B analysis assumes one user's treatment doesn't change another user's outcome. That assumption breaks for:
- Social/collaborative features (a treated user invites an untreated one).
- Marketplaces and any shared, finite resource — treatment can *take* supply/attention from control rather than create value, making an effect look real when it is redistribution.
- Shared caches, shared quotas, shared queues, shared model training.

Fixes are all expensive: cluster randomisation (by account, geography, or social graph component), switchback designs for marketplaces, or accepting that the estimate is biased and stating the direction of the bias. The one thing not to do is ignore it and report a per-user lift.

### Reading a flat result

A non-significant result is not "no effect" — it is "no effect large enough for this sample to detect". Report the **confidence interval**, not just the p-value. A CI of [−0.4%, +0.5%] means you have genuinely ruled out anything large; a CI of [−9%, +11%] means you learned nothing and should say so rather than filing it as a negative result. Teams that record wide-CI nulls as "tested, didn't work" will re-litigate the same idea forever.

Flat is also the most common outcome and often the correct one to ship on: if a change is neutral on metrics but simpler, cheaper, more accessible, or more honest, neutrality is permission.

### Multiple comparisons, concretely

- One pre-declared primary metric. Everything else is exploratory and must be labelled as such in the writeup.
- For a family of metrics you genuinely need claims about, control the false discovery rate (Benjamini–Hochberg) rather than Bonferroni, which is usually too conservative for correlated product metrics.
- Every additional variant, segment and metric multiplies your chances of a spurious winner. Three variants × ten metrics × five segments is 150 chances at 5% each.
- Pre-registered segments are analysis; discovered segments are hypothesis generation. Both are useful — only one licenses a ship decision.

## The writeup

A result nobody can audit later is not a result. Record, in the same place as the pre-registration:

1. Hypothesis and the pre-registered primary metric, MDE, n, duration and stopping rule.
2. SRM check outcome.
3. Primary metric: effect size **with confidence interval**, and the triggered vs. diluted numbers.
4. Every guardrail with its movement, including the flat ones.
5. Pre-registered segments; then, separately labelled, any exploratory slices.
6. Novelty/primacy diagnostic plot.
7. The decision and its rationale — including when you shipped despite a flat result, and why.
8. What you would do differently, and what the next test is.

Keep these in a searchable archive. The compounding value of experimentation comes almost entirely from the archive, not from any individual test: it is what stops the same idea being re-proposed every eighteen months, and what lets you notice that six separate "engagement" wins all cost you the same guardrail.

## Sources

- Kohavi, Tang & Xu, *Trustworthy Online Controlled Experiments*, Cambridge University Press, 2020 — A/A tests, triggering, novelty/primacy diagnostics, guardrails, Twyman's law, sizing.
- Johari, Pekelis & Walsh, "Always Valid Inference: Bringing Sequential Analysis to A/B Testing", arXiv:1512.04922, 2015; "Peeking at A/B Tests", KDD 2017.
- Fabijan, Dmitriev, Arai, Fischer et al., "Diagnosing Sample Ratio Mismatch in Online Controlled Experiments", KDD 2019.
- Deng, Xu, Kohavi & Walker, "Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data" (CUPED), WSDM 2013.
- Benjamini & Hochberg, "Controlling the False Discovery Rate", *JRSS-B*, 1995.
