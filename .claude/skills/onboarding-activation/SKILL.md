---
name: onboarding-activation
description: Designs the first-run experience — getting a new user from arrival to the moment your product's value becomes real to them, before their patience runs out. Covers finding and instrumenting the activation ("aha") moment, budgeting time-to-value, deferring signup and permission prompts until after value is shown, seeded state and endowed progress, making the first real task double as the tour, and onboarding for tools people were told to use rather than chose. Use this whenever the user is building or reviewing a signup flow, welcome screen, setup wizard, first-run experience, empty state, product tour, activation funnel, trial, or invite flow — even if they never say "onboarding" or "activation". Also use it when they describe a symptom like "people sign up but never come back", "our trial-to-paid is bad", "nobody finishes setup", or "users don't get it".
---

# Onboarding and Activation

Onboarding is not a screen sequence you add in front of the product. It is the decision about which single outcome a new user must reach before they will spend any more of their own attention on you, and what you are willing to delete to get them there faster. Teams that skip this decision build a wizard: five steps of data collection that serve the company's database, arranged before any value reaches the person filling it in. They then measure "onboarding completion" — the wizard's completion rate — and optimise a number that has nothing to do with whether anyone got value. The result is a funnel that looks healthy at the top, a retention curve that collapses in week one, and no instrument anywhere that would tell you which is which.

The job here is to name the value moment, measure the distance to it in seconds and taps, and then spend the entire first session buying that distance down.

## When this is the right skill

- Designing or reviewing anything a **new** user hits: signup, welcome, setup, install, trial start, invite acceptance, first empty state.
- Diagnosing a gap between acquisition and retention — signups fine, week-one retention bad.
- Deciding what to ask for, when to ask, and what to infer or default instead.
- Choosing whether to build a product tour, a checklist, sample data, or nothing.
- Onboarding a workforce onto a tool their employer chose for them.

Go elsewhere when: the user already activated and you want them to come back on day 7 → **habit-loop-design**. The problem is a specific form or checkout that is slow and annoying for *existing* users → **friction-and-flow**. You need the layout and visual-priority pass on the screen → **attention-and-hierarchy**. You are writing the words on the value prop → **persuasive-copy**. You need to define and instrument the metric set properly → **behavioral-metrics**. The screen at the end of the trial is a **paywall or plan comparison** → **decision-screen-design**. You are worried a technique here is manipulative → **ethical-persuasion-audit**. You do not know which of these you need → **ux-psychology**.

## Diagnose first

The dominant failure mode in this domain is transplanting a technique from a consumer social app into a product with a completely different motivational structure. A streak counter is not a good idea in a compliance tool. A "you're 20% done!" progress bar is patronising to a warehouse supervisor. Answer these about **this** product before you apply anything below.

1. **What is the smallest thing a user can do or see that makes the product's value real?** Not "completed setup". Something like: sees their own data in a chart, gets a reply from a teammate, hears the transcription of their own voice, watches a build go green. If you cannot say it in one concrete sentence, you are not ready to design onboarding — you are ready to go watch five people use the product.
2. **How long is the value moment intrinsically gated?** Some products can deliver in 10 seconds. Some genuinely cannot: value requires a second person (marketplaces, messaging), a data volume that takes days to accumulate (analytics, monitoring), or an external event (an alert fires). If value is gated, your first session's job is not value — it is a **credible promise plus a reason to return**, and everything shifts toward habit-loop-design.
3. **Voluntary or mandated?** Did the user choose this product, or was it handed to them at work? Mandated users will not churn, so retention is a useless signal; they will instead be slow, error-prone, resentful, and quietly maintain a spreadsheet on the side. Their onboarding optimises for competence and speed to first correct task, not for delight. See move 9.
4. **Who pays vs who uses?** In B2B the buyer's onboarding (proving ROI, admin config, security review) and the end user's onboarding (do my job faster) are different flows with different value moments. Conflating them produces a first-run experience that asks a new seat-holder for billing preferences.
5. **How often will this be used?** Daily-use tools can teach across many short sessions and should teach almost nothing up front. A tool used once a quarter must re-onboard every time, because nobody remembers; there, in-context guidance is permanent furniture, not a first-run affordance.
6. **What setup is genuinely irreducible?** Some data really is required before anything works (a repo URL, a bank connection). Be ruthless: for each field, ask "does the very next screen change based on this answer?" If not, it is not setup, it is a CRM wish.
7. **Are they arriving cold or warm?** Someone who accepted a teammate's invite already has context, a workspace, and data. Serving them the same flow as a stranger from a search ad wastes the single biggest advantage you have.

## The moves

### 1. Name one activation moment, then instrument it before you change anything

**Principle:** Activation as a distinct funnel stage was popularised by Dave McClure's "AARRR" pirate-metrics framing (2007); the practice of finding a behavioural correlate of retention was popularised by Facebook's growth team under Chamath Palihapitiya.

Pick **one** event, defined in your event schema, that means "this user has received the value". Fire it from real product state, not from a wizard step. Then build a cohort view: retention at day 7 / 30 split by whether the user hit that event in session one. That chart is the only scoreboard onboarding work should be judged against. "Completed onboarding" is not a proxy for it and will diverge the moment you start optimising.

```ts
// Bad: fires because the user clicked Next.
track('onboarding_step_completed', { step: 3 })

// Good: fires because value actually occurred, with the facts needed to segment.
track('first_report_viewed', {
  source: 'csv_import',
  rows: 1_284,
  ms_since_signup: 96_000,
})
```

**The trap, and it is the big one in this space:** an activation metric found by correlation is not a lever. Facebook's widely-repeated "7 friends in 10 days" is a *correlational* observation — engaged users added friends; it does not follow that pushing friend-adds on a disengaged user creates engagement. Palihapitiya's own retellings make clear the specific numbers were a rallying heuristic, not a discovered constant. Before you build machinery to drive users to your candidate metric, test causality: run an experiment where you help a random half reach it and see whether their retention moves. Many candidate metrics are symptoms of intent, and pushing on a symptom does nothing.

**How it fails:** picking a metric that is easy to move (profile photo uploaded) rather than one that means anything; letting each team define its own "activated"; instrumenting after the redesign so you cannot tell if you helped.

### 2. Budget time-to-value in seconds, and spend the whole first session buying it down

**Principle:** Doherty threshold (Doherty & Thadani, IBM technical report GE20-0752-0, November 1982) — when system response drops below roughly 400ms, users stop waiting on the machine and throughput and satisfaction rise sharply. Treat the 400ms figure as directional rather than a law; it came from 1980s mainframe terminal work and gets over-quoted as universal. The mechanism generalises fine: every wait long enough to notice is a place where attention leaves and may not come back.

Write the number down: *time-to-value is currently 4 minutes 10 seconds and 11 taps; target 40 seconds and 3 taps.* Then walk the flow and classify every element as **on the value path** or **not**, and delete or defer the second category. Company size, job title, how-did-you-hear-about-us, avatar, email verification, tour — none of these are on the value path for any product I have seen.

Two widely-cited single-company cases make the point about how much a single off-path element can cost, both self-reported rather than peer-reviewed: Expedia removed one optional "Company" field that users were misreading as their bank name, and reported roughly $12M/year in additional profit; and Jared Spool's UIE case study of a large retailer reported a ~45% sales lift from replacing a "Register" button with "Continue". Use these as existence proofs that a single obstacle can dominate a funnel, not as effect sizes to expect.

Also buy time back by faking nothing but *sequencing* honestly: start the expensive work (import, index, provision) the instant you have enough input, in the background, while the user does the next step. If a wait is unavoidable, show what is being built, not a spinner.

**How it fails:** optimistically rendering a value moment that then fails and has to be retracted; parallelising work in a way that produces a half-populated screen the user reads as broken.

### 3. Defer the account until the user has something worth saving

**Principle:** value before commitment. Spool's "$300 Million Button" (UIE) is the canonical case: the registration wall sat between an intent-carrying user and the outcome they wanted, and moving it produced a step change.

Let people use the product first. Hold state locally or against an anonymous server-side session, deliver the value moment, and *then* ask for an account with a reason attached to what they just made: "Create an account to keep this report." The ask converts far better because the user is now protecting something they own rather than paying an entry toll on a promise.

```ts
// Anonymous session at first meaningful action; claim it at signup.
const sessionId = getOrCreateAnonymousSession()
await createReport(sessionId, csv)          // value happens here
// ...user sees their report...
await claimSession(sessionId, newUserId)    // signup happens here, nothing is lost
```

Design the claim path carefully — losing the user's work at the signup boundary is worse than having asked up front. Test the case where they sign up in a different tab, and the case where an existing user's email collides with anonymous work.

**When not to:** anything handling money, regulated identity (KYC, health records), or where the value moment is intrinsically multi-device or multi-user. Also skip it if anonymous compute is expensive enough to invite abuse — a rate limit or a lightweight challenge is cheaper than a signup wall, but not free.

**How it fails:** a "guest mode" that turns out to be a crippled demo; the user notices the bait and trusts you less than if you had asked honestly.

### 4. Make the first real task the tour

**Principle:** minimalist instruction and the "training wheels" interface (John M. Carroll, IBM Watson; *The Nurnberg Funnel*, MIT Press, 1990). Carroll's finding, from studying people learning real software, is that adults learning a tool refuse to read first — they act, fail, and learn from recovering. Instruction that front-loads explanation is skipped; instruction embedded in a real task the learner cares about, with the dangerous surface temporarily reduced, produces faster competence.

So: instead of a five-slide carousel about your features, put the user into a real, small, completed-in-under-a-minute instance of the core job, with the UI reduced to what that job needs. Reveal the rest as they go.

NN/g's guidance is blunt on the alternative — Alita Kendrick's "Onboarding: Skip It When Possible" (2021) argues that instructions users must digest before using a product consume attention and reduce usability, and should be avoided where design can carry the meaning instead.

Practical shape:
- **Reduce, don't explain.** Hide advanced panels for the first session rather than annotating them.
- **Coach marks only just-in-time**, anchored to an element the user is about to need, triggered by their behaviour, and dismissible permanently. One at a time.
- **Let the first task be undoable and consequence-free**, so exploration is cheap. Carroll's training-wheels work found error *recovery* time dominates novice learning; a visible undo teaches more than a warning dialog.

**How it fails:** treating "interactive tour" as a synonym for "tour with a highlighted rectangle" — if the user is clicking a scripted path through fake data, it is still a tour and they will still click Skip. Also beware the vendor statistics circulating about tour engagement rates; most trace to unsourced blog posts, and several widely-quoted tooltip figures attributed to NN/g or Amplitude do not appear in any publication by those organisations. Design from the mechanism, not the numbers.

### 5. Start them mid-stream: defaults, seeded state, and a progress bar that is not empty

**Principle:** endowed progress (Nunes & Drèze, *Journal of Consumer Research*, 2006). In their car-wash field experiment, customers given a 10-stamp card with 2 stamps pre-filled completed at roughly 34%, versus roughly 19% for those given an 8-stamp card starting empty — identical real effort, near-doubled completion. Complementary: the goal-gradient effect (Hull, 1932; resurrected for humans by Kivetz, Urminsky & Zheng, *Journal of Marketing Research*, 2006), where café-card members shortened the interval between purchases as the reward approached, cutting inter-purchase time by roughly 20% from first stamp to last.

What to build:
- Any onboarding checklist starts with items **already checked** — and they must be things the user genuinely did (created an account, imported a file), not fabrications. The endowed-progress mechanism is about reframing where the starting line is, not about lying.
- Show remaining steps, not just percent, once the user is close; proximity is what drives the goal-gradient acceleration.
- Prefer inference to interrogation. Timezone from the browser, currency and locale from IP, company name and logo from the email domain, plan from the referring page, team members from the domain's existing accounts. Every default correctly guessed is a question deleted.
- Where you must ask, pre-select the modal answer and make the control a confirmation rather than a decision.

```tsx
// Pre-fill from what you already know; the user confirms rather than composes.
const [workspace, setWorkspace] = useState(
  () => titleCase(email.split('@')[1].split('.')[0])   // "acme.com" -> "Acme"
)
```

**Accuracy caveat worth carrying:** the endowed-progress and goal-gradient evidence comes from loyalty-reward contexts with a concrete prize. Transferring it to a software setup checklist is a *reasonable* extrapolation, not a demonstrated one — the "reward" for finishing onboarding is diffuse, and progress bars can backfire when the remaining work is visibly disproportionate to the reward. Ship it behind an experiment. Relatedly: do not justify onboarding checklists with the Zeigarnik effect (the pull of unfinished tasks); its replication record is weak and inconsistent. And do not build anything on ego depletion — that literature largely failed to replicate.

**How it fails:** a checklist with a step the user cannot complete yet ("invite a teammate" for a solo user) that permanently pins the bar at 80%; sample data so realistic the user mistakes it for their own, or so obviously fake it reads as an empty product; defaults that are wrong and expensive to reverse.

### 6. Ask for a small investment that pays the user back inside the same session

**Principle:** the IKEA effect (Norton, Mochon & Ariely, *Journal of Consumer Psychology*, 2012) — people value what they built more than an equivalent thing handed to them. The boundary condition in the original paper is the important part: the effect appears only when the labour **succeeds**. Participants who failed to complete or who destroyed their creation showed no elevated valuation. A conceptual replication (Sarstedt et al.) supported the core effect and pointed to psychological ownership as the mechanism.

So investment works when it is small, successful, and visibly changes the product:

- Naming the workspace, then seeing that name in the header.
- Picking three topics, then seeing a feed rebuild around them.
- Importing a CSV, then seeing their own rows.
- Choosing a theme or a keyboard-shortcut set they will actually use.

**The line where it becomes busywork:** *does this input change what the user sees within the next 30 seconds?* If yes, it is investment and it builds ownership. If it only populates a database column for a sales team, it is a tax the user pays for your benefit, and it degrades trust precisely because it looks like the good kind. "Company size" and "what's your role?" are the usual offenders. If you need them for routing or segmentation, ask after activation, in a dismissible prompt, and say what you will do with the answer.

**How it fails:** stacking five investments in a row, so that the user's effort is real but the payoff is deferred past their patience — that is the failed-labour case where the effect disappears and resentment replaces ownership. One investment, one immediate payoff, repeat.

### 7. Prime every permission; never let the OS ask cold

**Principle:** permission priming, popularised by Brenden Mulligan's write-up of Cluster's approach ("The Right Way to Ask Users for iOS Permissions", TechCrunch, 2014). The structural problem: an OS permission dialog is a one-shot, irreversible-ish, dead-serious modal. A "Don't Allow" is usually permanent and can only be undone in system settings, which nobody does.

So never fire the system prompt as a side effect of a screen loading. Instead:

1. Reach a moment where the permission is obviously implied by what the user just tried to do.
2. Show **your own** UI explaining what you want and what they get — you control the copy and the styling, and a "Not now" here is free and reversible.
3. Only if they say yes, trigger the real OS dialog — which they now approach intending to accept.

Cluster reported that contacts access approached universal acceptance under this pattern, and that a meaningful share of users who declined the soft ask accepted later when asked at a better moment. These are self-reported company figures, so take the direction and not the decimals.

```ts
async function requestNotifications() {
  if (Notification.permission !== 'default') return   // never re-prompt cold
  const wantsIt = await showOwnPrimer({
    title: 'Get told when your build finishes',
    body: 'We only notify on build completion and failures. Nothing else.',
    accept: 'Turn on alerts',
    decline: 'Not now',            // free, repeatable, no OS state burned
  })
  if (wantsIt) await Notification.requestPermission()
}
```

Same logic applies to non-OS asks: connecting a bank account, granting a repo scope, importing a mailbox. State the specific capability unlocked, the narrowest scope you can operate on, and what you will not do.

**How it fails:** priming for a permission the product does not yet need, which reads as a grab; priming with vague benefit copy ("to improve your experience"); re-priming after a decline until the user is annoyed enough to uninstall.

### 8. Treat empty states as the teaching surface, not a dead end

Every list, board, inbox, and dashboard has a zero-item state, and for a new user that is most of the product. A screen that says "No items yet" is a wall. The same screen can be the best tutorial you will ever ship, because the user is *looking at the exact place the thing goes*.

An empty state should carry, in order: what belongs here and why it is useful, the single primary action to create the first one, a lower-commitment path (import, use a template, load a sample), and — if the thing arrives from elsewhere rather than being created — an explanation of what triggers it. Use the real component, styled as a ghost, so the user learns the shape.

The equivalent for products where value is gated on time or other people: say honestly what has to happen and when, and give them a job to do meanwhile. "Your first sync completes in about an hour. Invite the two teammates who'll be reviewing this." An honest wait with a task beats a fake progress animation.

### 9. For tools people were told to use, optimise for competence, not delight

When a field technician, nurse, or warehouse lead is handed an app by their employer, the motivation is already supplied — externally. Self-determination theory (Deci & Ryan) is the useful frame: with autonomy removed, the lever you still control is **competence**, and secondarily relatedness. Delight-oriented consumer patterns land badly here; the user did not opt in and reads celebration animations as the product wasting their shift.

The core inversions:

- **The value moment is "I completed my first real task correctly, without asking anyone."** Not "I saw the value prop." Measure time-to-first-successful-task and the support-contact rate in week one.
- **They will use it under conditions your laptop does not simulate:** gloves, sunlight, no signal, one hand, a queue of people waiting. Onboarding that requires a stable connection or a two-handed gesture fails on the loading dock.
- **Speed compounds and is the whole argument.** A task done 40 times a shift justifies a keyboard-first path and permanent shortcut hints; onboarding's job is to teach the fast path early, before the slow path calcifies into habit.
- **Progress belongs to the supervisor as well.** Rollout owners need to see who is stuck, on which step. Build that view; it is the difference between a rollout and a mandate.
- **Skip gamification.** Points and streaks on mandated work are widely resented and can crowd out the professional pride that is actually motivating the person.
- **Re-onboarding is not optional** for tools used episodically, and the workforce turns over. In-context help must be permanent furniture, findable at 2am by someone who has never seen the app.

Read `references/mandated-tools.md` when the product is internal, B2B-deployed, or frontline — it covers rollout sequencing, champions, training-material interplay, and measurement when churn is unavailable as a signal.

## Worked example: a generic 5-step wizard, restructured

**Product:** team expense tracking. Value moment: *the user sees a categorised expense they submitted appear in a report.*

**Before — the standard wizard.** Every step serves the company; nothing serves the user.

| Step | Ask | Serves |
|---|---|---|
| 1 | Email, password, verify email before continuing | Auth |
| 2 | Company name, size, industry, logo upload | Sales segmentation |
| 3 | Invite teammates (min 1 to continue) | Growth loop |
| 4 | Connect bank / accounting integration (OAuth) | Data completeness |
| 5 | 6-slide feature tour | Marketing |

Time-to-value: unbounded — a user who cannot get IT approval for the OAuth step in step 4 never reaches value at all. The email verification in step 1 sends them to another app before they have any reason to come back.

**After — value-first.** Same information eventually collected; the order and the mandate change.

1. **Land straight in the product.** Anonymous session, no account. One control: "Snap or drop a receipt." Drag-drop, paste, or camera.
2. **Deliver value immediately.** OCR runs; the merchant, amount, date and category come back pre-filled and editable. This is the activation event — fire `first_expense_categorised`. Elapsed: seconds. The user has seen the actual product do the actual job with their actual receipt.
3. **Ask for the account with a reason attached.** "Save this expense to your account." The claim path migrates the anonymous session so the receipt is not lost. Email verification becomes a non-blocking banner, not a gate.
4. **Ask for one investment with same-session payoff.** Workspace name, pre-filled from the email domain (`@acme.com` → "Acme"), confirmed with one tap. It appears in the header immediately. That is the IKEA-effect move, sized to a single tap.
5. **Seed the checklist non-empty.** "Submit your first report — 2 of 5 done": *account created* ✓, *first expense added* ✓, then *set your approver*, *connect your bank*, *invite your team*. Real completions, not padding.
6. **Defer and prime the heavy asks.** The bank connection now appears in-context, on the second visit, primed with the specific benefit: "Connect your card to skip photographing receipts — we'll match transactions automatically. Read-only access." Invites move to the moment the user hits a submit-for-approval screen and genuinely needs an approver — the ask now serves them, not the growth team.
7. **Collect segmentation last, honestly.** Company size and industry become a dismissible one-line prompt after activation, or are inferred from the domain and never asked.
8. **Delete the tour.** Step 2 was the tour.

**What changed structurally:** the wizard's five gates became one value moment plus four *invitations*, each triggered by a moment where the user wants the thing it unlocks. Nothing was removed from the roadmap; everything moved behind proof.

## Anti-patterns

- **"Onboarding completion" as the KPI.** It rises when you make the wizard shorter and easier to click through, whether or not anyone got value. Judge onboarding on downstream retention of the activated cohort, always.
- **Email verification as a hard gate.** It sends a user with live intent into a different application. Verify asynchronously; gate only the specific actions that genuinely require a verified address.
- **The tour that is a tour.** A carousel or a scripted click-path over fake data. People dismiss it, and the ones who don't, don't retain it. Replace it with a reduced-surface real task.
- **The fake progress bar.** Ticking a checklist item the user did not do to make the bar look fuller. Endowed progress works by moving the starting line honestly; users notice invented steps and it costs you more than the bar gains.
- **Cold OS permission prompts on app launch.** A permanent "no" traded for a one-time convenience of not writing a primer screen.
- **Sample data that becomes the user's problem.** Demo projects the user must find and delete, or worse, cannot distinguish from their own. If you seed samples, label them and offer one-click removal.
- **Justifying step counts with Miller's 7±2.** Miller (1956) measured short-term recall for lists of digits, not tolerance for wizard steps. The right number of steps is however many are on the value path, which is usually one or two.
- **Quoting an abandonment statistic with no source.** "X% of users abandon after N seconds" circulates constantly with no attributable study behind it. Measure your own funnel; you have the data and it is about *your* users.
- **Onboarding an invited teammate as if they were a stranger.** They arrive with a workspace, data, and a colleague's endorsement. Land them directly in the thing they were invited to, with the inviter's name visible.
- **Asking for a credit card before value, in a "free trial".** If the product is good, the card converts better after the value moment; before it, the ask is doing the work the product should be doing.
- **Front-loading all the asks "because we lose them later".** Losing them later is information: it means the value moment did not land. Front-loading hides the signal without fixing the cause.

## Ship checklist

Run this against the screen or PR before merging.

- [ ] I can state this product's activation moment in one concrete sentence, and there is a **product-state** event that fires on it.
- [ ] I know the current time-to-value in seconds and taps, and this change reduces it (or I know why it doesn't).
- [ ] Every field asked before the value moment changes what the next screen shows. Anything else is deferred or inferred.
- [ ] No account, credit card, or email verification blocks the first value moment — or there is a specific legal/technical reason it must.
- [ ] No OS permission dialog fires without an in-app primer first, with a free "Not now".
- [ ] Every default that can be inferred (timezone, locale, currency, org name, plan) is inferred, and every unavoidable question has the modal answer pre-selected.
- [ ] Any checklist starts with genuinely-completed items already checked, and contains no step this user cannot complete.
- [ ] Every empty state on the path names what belongs there, gives one primary action, and offers a lower-commitment alternative.
- [ ] The first real task works with the advanced surface hidden, and every first-session action is undoable.
- [ ] Invited users get a different, shorter path than cold arrivals.
- [ ] Slow work starts in the background as soon as its inputs exist, and any unavoidable wait states what is being built.
- [ ] If usage is mandated: tested one-handed, offline, and on the oldest device in the fleet; rollout owner has a per-user progress view; no gamification.
- [ ] There is a retention-by-activation cohort chart, and this change is behind an experiment or at minimum a marked release so the chart is readable afterwards.

## Sources

- **Activation as a funnel stage** — Dave McClure, "Startup Metrics for Pirates" (AARRR), 2007.
- **Behavioural activation metrics, and their limits** — Facebook growth-team practice as recounted by Chamath Palihapitiya. The widely-quoted "7 friends in 10 days" is a correlational observation and was described by its own authors as a rallying heuristic; treat any such "magic number" as a hypothesis requiring a causal test.
- **Response time and productivity** — Walter J. Doherty & Ahrvind J. Thadani, "The Economic Value of Rapid Response Time", *IBM technical report GE20-0752-0, November 1982*, 1982. The ~400ms figure is from mainframe terminal work; the mechanism generalises, the specific number should not be treated as a universal constant.
- **Registration walls / deferred signup** — Jared Spool, "The $300 Million Button", User Interface Engineering. Single client, self-reported, unpublished; an existence proof about the cost of one obstacle, not a replicable effect size. Same caveat for the Expedia "Company field" case (~$12M/year, company-reported, popularised via Silicon.com, 2010).
- **Minimalist instruction, training wheels, learning by doing** — John M. Carroll, *The Nurnberg Funnel: Designing Minimalist Instruction for Practical Computer Skill*, MIT Press, 1990 (IBM Watson Research Center).
- **Skip onboarding instruction where design can carry it** — Alita Kendrick, "Onboarding: Skip It When Possible", Nielsen Norman Group, 2021.
- **Endowed progress** — Joseph C. Nunes & Xavier Drèze, "The Endowed Progress Effect: How Artificial Advancement Increases Effort", *Journal of Consumer Research* 32(4), 2006. Field experiment, car-wash loyalty cards; ~34% vs ~19% completion. Extrapolation to software onboarding checklists is plausible but not demonstrated — experiment before you rely on it.
- **Goal gradient** — Clark Hull, 1932 (animal learning); resurrected for humans by Ran Kivetz, Oleg Urminsky & Yuhuang Zheng, "The Goal-Gradient Hypothesis Resurrected", *Journal of Marketing Research* 43(1), 2006; café-card field data, ~20% reduction in inter-purchase interval from first stamp to last.
- **IKEA effect** — Michael I. Norton, Daniel Mochon & Dan Ariely, "The IKEA Effect: When Labor Leads to Love", *Journal of Consumer Psychology* 22(3), 2012. Critical boundary condition from the original paper: the effect requires *successful completion* — failed or destroyed labour produces no valuation premium. Conceptual replication supporting the effect and identifying psychological ownership as mechanism: Sarstedt et al.
- **Permission priming** — Brenden Mulligan, "The Right Way to Ask Users for iOS Permissions", TechCrunch / Medium, 2014 (Cluster). Company-reported figures; direction is well-supported by the structural argument (OS denials are near-permanent), the specific percentages are not independently verified.
- **Motivation under mandate** — Edward Deci & Richard Ryan, self-determination theory (autonomy / competence / relatedness); the relevant reading here is that with autonomy externally removed, competence is the lever that remains.

**Claims deliberately not made here:** any "X% of users abandon after N seconds" figure (no attributable source exists for the ones in circulation); specific tour/tooltip engagement percentages attributed to NN/g, Amplitude or Mixpanel that circulate in vendor blogs but appear in no publication by those organisations; the Zeigarnik effect as a justification for progress indicators (weak and inconsistent replication); ego depletion as a model of onboarding fatigue (largely failed replication — do not build on it); Miller's 7±2 as a constraint on step or menu counts (Miller measured digit-span recall, not navigation).

## Further reading in this skill

- `references/mandated-tools.md` — read when the product is internal, B2B-deployed, or frontline: onboarding when the user did not choose the tool, rollout sequencing, and what to measure when churn is not available as a signal.
- `references/instrumenting-activation.md` — read when you need to actually find, validate, and instrument the activation metric: candidate generation, the correlation-vs-causation test, event schema, and the cohort views that make onboarding work legible.
