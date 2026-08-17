---
name: habit-loop-design
description: Designs the returning-user loop — why someone comes back tomorrow without being nagged — using Fogg's B=MAP, trigger/action/reward/investment structure, stored value, streaks, and notification budgets, plus honest tests for whether the loop serves the user or just farms them. Use this whenever the user is working on retention, re-engagement, D7/D30, "stickiness", daily active users, streaks, gamification, push notifications, email digests, or win-back flows — even if they never say the word "habit". Also use it when someone proposes adding streaks, badges, points, or notifications to a product, so the loop gets designed rather than bolted on. Also use it to argue the other side: some products should be used rarely and fast, and this skill says how to tell.
---

# Habit Loop Design

This skill answers one question: **why does this person open the product again tomorrow, and should they?** Most retention work skips it. A team notices D7 is bad, bolts on a streak counter, a badge system and three push notifications, gets a two-week engagement bump, and then watches notification opt-outs climb, streaks reset into permanent churn, and the metric settle lower than where it started — because none of it was attached to a reason the user actually had to return. The other half of the failure is the mirror image: a team builds an addictive loop into a product that should be used four times a year in ten minutes flat, and calls the resulting rise in "time in app" a win. Getting this right means deciding what natural rhythm the product has, attaching the loop to a real recurring need, and being able to say out loud what the user gets from the return.

## When this is the right skill

- Retention questions: "users try it once and never come back", D1/D7/D30, churn, DAU/MAU, "how do we make it sticky".
- Someone is about to build streaks, points, badges, leaderboards, levels, or daily challenges.
- Notification, digest, or re-engagement/win-back design — including deciding *not* to send.
- You need to argue that a habit loop is the wrong goal for this product.

Go elsewhere when: the problem is first-run and reaching value the *first* time → **onboarding-activation** (retention cannot fix a product whose value moment nobody reaches). Removing steps inside a single task → **friction-and-flow**. Where the eye lands on one screen → **attention-and-hierarchy**. Wording of the prompt itself → **persuasive-copy**. Whether any of this is defensible → **ethical-persuasion-audit**, which is a *required* companion read before shipping anything in this file. What to instrument and how not to fool yourself → **behavioral-metrics**. Not sure which principle applies → **ux-psychology** (router + full catalog).

## Diagnose first

The single biggest failure in this domain is importing a mechanic that worked on a consumer social app into a product with a completely different usage rhythm. A streak counter in a payroll tool is not a growth lever, it is noise that makes the product look unserious. Answer all six before you design anything.

**1. What is the natural frequency of the underlying need?** Not the frequency you want — the frequency of the human problem. You cannot manufacture a habit out of a quarterly need; you can only manufacture annoyance.

| Natural frequency | What retention actually means | Loop strategy |
|---|---|---|
| Many times a day | Habit is possible and probably correct | Full loop: context cue, fast action, stored value |
| Daily / most days | Habit is possible; forgiveness matters | Loop, but soft streaks and a low-effort minimum session |
| Weekly | Rhythm, not habit | One reliable weekly prompt (digest, review), tied to a fixed day |
| Monthly / quarterly | Scheduled recall | Calendar-shaped reminders, zero gamification |
| Event-driven (a claim, a move, an incident) | Being *found* at the moment of need | SEO/entry points, saved state, fast resumption. No daily loop at all |
| Once, ideally | Task completion speed | Habit is a **failure** metric. See below |

**2. Is usage voluntary?** Mandated software (the CRM your manager checks, the timesheet) already has a prompt — your boss. Adding motivation mechanics on top produces compliance theatre: users doing the minimum action to satisfy the counter. For mandated tools the lever is almost entirely *ability* — make the required action take fifteen seconds instead of five minutes.

**3. Who pays, who uses, who chooses?** In B2B these are three different people. Engagement mechanics aimed at the end user can actively damage the buyer relationship (leaderboards that rank employees by activity get banned by legal or HR). The retention that matters may be admin-level: integrations, data volume, seats in use.

**4. Name the core value moment in one sentence.** "The user sees the transaction they were looking for." "The user's teammate replies." "The user's build goes green." If you cannot write this sentence, stop — you are about to build a loop around nothing. Everything downstream (the prompt's timing, what the reward is, what gets stored) is derived from this sentence.

**5. Is repeat use a proxy for value, or a substitute for it?** Ask: *would this user pay to get the same outcome with fewer sessions?* If yes — and for most tools the answer is yes — then sessions are a cost you impose, not a benefit you deliver, and your loop should reduce them while raising outcomes.

**6. Does a stable context recur in the user's life?** Habits are cue-driven: they form when a behaviour is repeated in a consistent context until the context alone triggers the response (Wood & Neal, 2007; Wood, Quinn & Kashy, 2002, found a large share of everyday behaviour is repeated in stable settings). If there is no recurring cue — no fixed time, place, preceding app, inbound message, or calendar event — there is nothing for the habit to attach to, and your notification will be the only cue forever. That is not a habit; that is a subscription to interruption.

### When a habit loop is the wrong goal

Tax software, insurance claims, visa applications, a field-ops app used once per site visit, a bereavement service, an incident response console. For these, "time in app" and "sessions per week" are **failure** metrics. The right targets:

- Time from entry to task completion (down).
- Completion rate without support contact (up).
- Return visits *caused by the product* — re-dos, corrections, "where did my thing go" — (down), while return visits caused by a genuine new need are neutral.
- Confidence at exit: "do you believe this is done correctly?"

The retention model for these products is **recall at the moment of need**, not daily presence: be findable, remember the user's state perfectly so resumption is instant, and send exactly one prompt when their real deadline approaches. If someone asks you to add streaks to a product in this class, the correct response is to redirect the conversation to task-completion speed.

## Serving the user vs. farming them: tests you can run

Everything in "The moves" works on a human whether or not the product is good for them. That is precisely why the mechanism is dangerous and why this section comes before the techniques. Run these tests on any mechanic you are about to ship; they are concrete enough to put in a PR description.

1. **The disclosure test.** Write a one-sentence card explaining the mechanic and its intent, in your own honest words, and imagine showing it in-product: *"We hold your notifications until 7pm because that's when you're most likely to reopen the app."* If you would not ship the card, do not ship the mechanic. Loops that serve users survive disclosure — "we remind you at 7pm because that's when you told us you study" is fine to say out loud.
2. **The removal test.** If you deleted this mechanic tomorrow, does the *user* lose something, or do only your *metrics* lose something? A saved-search alert fails deletion for the user. A randomised reward drop usually only fails for you.
3. **The regret test.** Ask real users, unprompted by the mechanic: "in the past week, was any of the time you spent here time you'd rather have spent otherwise?" Track regretted-session rate as a standing counter-metric next to DAU. A loop that raises engagement and regret together is extraction, and you now have the number to say so.
4. **The speed test.** For anything tool-shaped: is a power user getting through their job *faster* this quarter than last, while producing more? Session length rising with flat outcomes means you built friction and called it engagement.
5. **The exit test.** Can a user leave with everything they put in, in one obvious action? Stored value is the best retention there is *and* becomes a hostage situation the moment it can't be exported. A moat you'd be embarrassed to describe to the user is a trap.
6. **The stated-desire test.** Do users say they want to use this more, or less? Net "I wish I spent less time here" from your own most engaged cohort is the clearest possible signal that you built a compulsion loop, and it usually shows up in app store reviews long before it shows up in churn.

Before shipping any of the moves below, read **ethical-persuasion-audit** and run its checklist. This is not a formality: several of these techniques are the same mechanisms used by gambling machines, and the difference between a good product and a predatory one is entirely in the details of how they are applied.

## The moves

Ordered by leverage. The first two are worth more than the rest combined and are the ones teams skip.

### 1. Make the behaviour easier before you try to make it more motivating

**Fogg Behavior Model, B=MAP** (BJ Fogg, Stanford; published as B=MAT in *Persuasive '09*, later renamed "prompt"; developed in *Tiny Habits*, 2019). A behaviour happens when **M**otivation, **A**bility and a **P**rompt converge in the same moment. It is a convergence condition, not an arithmetic formula: if any one is absent, nothing happens.

The practical consequence is the whole point. **Motivation is expensive, volatile and not yours to control. Ability is cheap, durable and entirely under your control.** Almost every team reaches for motivation (rewards, copy, nagging) when the cheaper win is cutting the action down until it fits inside the motivation the user already has.

Fogg's six components of ability — time, money, physical effort, mental effort, social deviance, non-routine-ness — are the audit list. Walk the returning action against each:

- **Time**: what is the shortest possible useful session? Design a *minimum viable session* that delivers real value in under ~30 seconds, and make that the default landing state.
- **Mental effort**: does the returning user have to remember anything (where they were, what the numbers mean, what they were going to do next)? Store it and show it.
- **Physical effort**: taps to value from a cold start, including auth. Persistent sessions, biometric unlock, deep links from notifications that land on the *thing*, not the home screen.
- **Social deviance**: does the action require the user to do something their colleagues don't do? That is an ability problem, not a motivation problem.
- **Non-routine**: does the action look different every time? Consistency is an ability lever.

```
Bad returning experience:  open app → splash → home dashboard → nav to project
                           → find the thread → re-read to remember context → act
Good returning experience: open app → the exact thing you were doing, with a
                           one-line "since you left: …" and the next action focused
```

**Fails when**: you make the action so trivial it no longer contains value (a "daily check-in" button that does nothing is high ability, zero worth), or when ability is already high and the true blocker is that the user does not want the outcome — in which case no amount of streamlining helps and you have a product problem, not a loop problem.

### 2. Anchor the loop to a cue in the user's life, not to your notification

Habits are context-cued (Wood & Neal, 2007). The goal is that something *in the user's existing day* triggers the thought of your product. Until that happens, you are renting attention from the OS notification centre and paying rent forever.

Find the cue, then put a surface *inside* it:

| Cue in the user's day | Surface that lives there |
|---|---|
| Morning coffee, phone in hand | Home-screen widget with live content, not a launcher |
| Opening the laptop / new tab | Browser extension, new-tab page, desktop menu-bar item |
| Standup, Monday planning | Scheduled Slack/Teams digest at that exact time |
| An inbound email or ticket | Reply-to-act email, forwarding address, inbox integration |
| A recurring meeting | Calendar attachment / auto-created agenda doc |
| Finishing a task in another tool | Webhook-driven prompt from the tool they already use |

Two things follow. First, **the best prompt is one the user already receives from the world** — a teammate's comment, a price hit, a build failure — because it is inherently relevant and inherently timed. Second, **consistency of timing beats cleverness**: a digest that always arrives at 08:30 becomes part of the routine; a "smart" send-time that wanders never does.

On timelines: Lally et al. (2010, *European Journal of Social Psychology*) tracked people forming daily habits and found a median of about 66 days to reach near-asymptotic automaticity, with an enormous range (roughly 18–254 days) — and, importantly, **missing a single day did not measurably damage the trajectory**. The popular "21 days" figure is folklore from a 1960 surgery anecdote (Maltz), not a finding. Two design consequences: your habit-formation window is months, not a two-week campaign; and one missed day is not a failure event, which is the empirical basis for streak forgiveness in move 8.

**Fails when**: no stable cue exists (see Diagnose #6), or when you attach to a cue the user resents being interrupted at. Also fails when the surface you build in the cue duplicates rather than replaces effort — a widget that just says "open the app" is a launcher, not a cue.

### 3. Use the Hook model as a build checklist, and know what it is

**The Hook model** (Nir Eyal, *Hooked*, 2014): trigger → action → variable reward → investment, repeating. Be clear-eyed: this is a practitioner synthesis of older research (Fogg's model, operant conditioning, behavioural economics), not itself a peer-reviewed finding. Its value is as a checklist — each of the four stages maps onto something you can actually build, and most broken loops are missing one specific stage.

- **Trigger.** External at first (notification, email, someone shares a link), internal eventually (an emotion or situation: bored in a queue; unsure what an error means; a thought you'll lose unless you capture it now). The single sentence to write down: *"When the user feels/encounters ______, they think of us."* If you can't fill that blank, you have no internal trigger and no path off notification dependence.
- **Action.** The simplest behaviour done in anticipation of reward. Optimise via move 1.
- **Variable reward.** See moves 4 and 5.
- **Investment.** Something the user puts in that makes the *next* cycle better for them. See move 6. This is the stage teams most often omit, and it is the one that turns a loop into a moat.

**Graduation from external to internal triggers** is the measurable goal of the first year. Instrument it: what fraction of sessions are *unattributed direct opens* versus notification/email-attributed, and is that fraction trending up per cohort? A product whose notification-attributed share is flat or rising after twelve months has not built a habit; it has built a dependency on the OS. The honest stress test is a holdout cohort with all discretionary notifications suppressed — if their sessions collapse, you have your answer. (**behavioral-metrics** covers holdout design.)

**Fails when**: applied as a moral licence ("we're just hooking users") rather than a checklist, and when teams build the trigger and reward stages while skipping investment — which produces a product that is fun for three weeks and empty in month two.

### 4. Variable reward: the honest version of the mechanism

**Variable-ratio reinforcement** (Ferster & Skinner, *Schedules of Reinforcement*, 1957): responses reinforced on an unpredictable schedule are produced at high, persistent rates and are markedly resistant to extinction — far more so than reliably reinforced responses. The neural account: dopamine neurons encode **reward prediction error** — the gap between expected and actual outcome — rather than pleasure itself (Schultz, Dayan & Montague, 1997). And "wanting" is dissociable from "liking" (Berridge & Robinson): a system can be driven to seek something it does not enjoy.

Say the uncomfortable part plainly: **this is the mechanism slot machines run on.** Pull-to-refresh, an unpredictable feed, and a lever-pull are, structurally, the same thing. The neuroscience is also why the pop-psych framing ("dopamine hit") is wrong in a way that matters — the driver is *unpredictability*, not pleasure, which is exactly why a compulsive loop can be joyless.

The design question is therefore not "should there be variance" but **where the variance comes from**:

- **Honest variance** is the world's real variance surfacing on your schedule. New posts from people the user chose to follow. Search results whose quality genuinely differs. A price alert that sometimes fires. Whether the build passed. The user cannot predict it because *reality* is unpredictable.
- **Engineered variance** is variance you manufacture from information you already have. Delaying a notification you could send now. Randomising which of the user's own items you show. Loot boxes, mystery rewards, drip-fed content the user has already earned.

**The test:** if you removed the variance entirely — every session delivered everything available, immediately, in a predictable order — would the product be *worse for the user*? If yes, the variance is honest and it comes from the domain. If the only loss is engagement, you built a slot machine and you should delete it.

**Decay is guaranteed.** Prediction error shrinks as outcomes become predictable, and novelty habituates. Every variable-reward system loses potency; teams then respond by increasing the dose (more notifications, bigger jackpots, faster feeds), which is the road to the anti-patterns section. The only durable answer is that variable reward is a *maintenance* mechanism sitting on top of a real value engine, never a replacement for one. Budget for the loop's supply of genuinely new value — new content, new counterparties, new results — the same way you budget for infrastructure.

**Fails when**: variance is applied to something the user needs deterministically (never randomise notification delivery for a security alert, a payment, or a message from a human), and in any regulated or vulnerable context — financial, health, minors — where engineered variance is a compliance problem as well as an ethical one.

### 5. Pick the right reward type: tribe, hunt, or self

Eyal's taxonomy, grounded in older motivational work, is the most useful part of *Hooked*:

- **Rewards of the tribe** — social: reply, reaction, mention, being seen, reciprocity (Cialdini). Powerful and the most easily abused (see anti-patterns).
- **Rewards of the hunt** — resources or information: a feed of finds, search results, a deal, a lead, a fact you needed.
- **Rewards of the self** — mastery, competence, completion, control. Grounded in self-determination theory (Deci & Ryan): people are durably motivated by **autonomy, competence and relatedness**, and rewards that signal *competence gained* hold up far better than rewards that just signal *activity performed*.

Choose by product shape, and get this wrong and the whole loop reads as fake:

| Product | Right reward | Wrong reward |
|---|---|---|
| Social / community | Tribe | Self ("you posted 5 days in a row!") feels hollow |
| Marketplace, feed, search, monitoring | Hunt | Tribe (nobody wants a leaderboard of shoppers) |
| Learning, fitness, writing, finance, dev tools | Self | Tribe leaks private information and shames |
| Team collaboration tool | Tribe (real teammates only) | Self-improvement badges read as childish at work |

For rewards of the self, the specific thing to build is **evidence of competence**, not points: "you now handle these in 40 seconds; three months ago it was four minutes." That is a reward the user can feel, and it is true.

**Fails when**: you bolt social rewards onto a solitary tool, or manufacture a tribe out of strangers (a leaderboard of people the user has no relationship with produces comparison anxiety and no relatedness). Also fails when a self-reward is measuring your activity rather than their outcome.

### 6. Investment and stored value: the only moat that is also a gift

The strongest, most defensible and most user-aligned form of retention is that **the product is materially better for this user than for a new one, because of what they put into it.** Unlike a streak, stored value does not punish absence — it rewards presence, and it is still there when the user comes back after three months.

The mechanism is the **endowment effect** — people value what they possess more than the identical thing unpossessed (Kahneman, Knetsch & Thaler, 1990). Applied to retention it is the safest reading of that literature: the workspace, history and configuration a returning user already owns are worth more to them than the same thing offered fresh, which is plain switching cost as much as it is a bias. Its first-run counterpart, the IKEA effect — with the boundary condition that the labour must have *succeeded* before it produces any ownership at all — is `onboarding-activation` move 6.

The categories, roughly in order of durability:

1. **Data** — documents, transactions, photos, logs, history.
2. **Configuration** — rules, filters, saved views, integrations, keyboard shortcuts, automations.
3. **Learned behaviour by the system** — recommendations, autocomplete, models tuned to this user.
4. **Social graph** — followers, teammates, connections, shared spaces.
5. **Reputation** — reviews, badges that others can see, seniority.
6. **The user's own learned skill** — muscle memory for your interface. Real, and the reason not to redesign gratuitously.

The engineering discipline is one question after every meaningful action: **did this leave something behind that makes tomorrow better for this user?** If a user completed a task and the product learned nothing, you burned a cycle.

```ts
// Not investment: the action leaves nothing behind.
await runSearch(query);

// Investment: the same action, storing value the user gets back later.
await runSearch(query);
await recentSearches.push(query);              // resumption
await maybeOfferSavedSearch(query, {           // configuration, opt-in
  when: userHasRunSimilarQueries(query, 3),    // ask only once it's clearly useful
});
```

Then **show the accumulation**, because unseen stored value does not create felt ownership: "12 saved searches", "your 340 notes", "connected to 4 tools". Front-load it too — day-one import of contacts, files, or history creates stored value before the user has earned it, which is why import wizards outperform empty states (see **onboarding-activation**).

**Fails when**: the investment is work for you rather than value for them (asking users to tag things that only improve your data quality), when accumulated value becomes a lock-in the user cannot escape — **ship export, always** — and when you confuse accumulation with clutter. A thousand un-triaged items is not stored value, it is a debt you handed the user.

### 7. Progress, goal gradient, and resumption

**The goal-gradient effect** (Hull, 1932; Kivetz, Urminsky & Zheng, 2006, *JMR*): effort accelerates as a
goal gets closer. `onboarding-activation` move 5 owns this and endowed progress in full — the study figures,
the seeding technique, and the honesty constraint. What is specific to *retention* is the third bullet:

- **Pre-credit real progress**, and **show remaining rather than done** near the end ("2 steps left" beats
  "80%" where the gradient does the work). Both belong to first-run; see `onboarding-activation`.
- **Resumption over restart — this is the retention move.** A returning user after three days should land
  exactly where they were, with a one-line delta of what changed while they were gone. First-run progress
  gets someone through setup once; resumption is what makes session forty cheap, and it is the reason a
  returning user opens the app instead of deciding to deal with it later.

A caveat worth knowing because the folklore version is everywhere: the **Zeigarnik effect** (better *memory* for interrupted tasks) has a poor replication record — a 2025 meta-analysis (Ghibellini & Meier, *Humanities and Social Sciences Communications*) found no reliable memory advantage for unfinished tasks. What *did* hold up in the same analysis is the related **Ovsiankina effect**: people spontaneously resume interrupted tasks at a high rate, roughly two-thirds across studies, with no prompt and no reward. The safe reading for product work: **"make it trivial to resume what you started" is well supported; "engineer a cliffhanger so they can't stop thinking about it" is not.** Design for resumption, not for nagging incompleteness.

**Fails when**: the progress is fake and the user can tell (a bar that jumps to 90% and sits there destroys trust in every other number you show), when progress is toward a goal *you* chose rather than one they set, and when a completion meter turns into a permanent guilt object — always let a checklist be dismissed for good.

### 8. Streaks: loss aversion with a safety valve

Streaks work because an accumulated count becomes a possession, and people protect possessions. The usual citation is loss aversion (Kahneman & Tversky, 1979). Flag it honestly: the *magnitude and universality* of loss aversion is genuinely contested — Gal & Rucker (2018, *Journal of Consumer Psychology*) argue the evidence does not support a general tendency for losses to loom larger, and that the effect is highly context-dependent. **The safe reading**: people act to protect a position they feel they own and have worked for. Do not build on precise multipliers ("losses hurt 2.5x") or on loss framing as a universal lever.

The most-documented industrial example is Duolingo. Jorge Mazal (former CPO, writing in Lenny's Newsletter, 2023) describes the streak as one of their most powerful engagement mechanics; the first big win was a **streak-saver notification** warning users about to lose a streak, followed by changes to streak freezes, and the share of DAU with a 7+ day streak roughly tripled to more than half of DAU. Note the honest framing: their ~4.5x DAU growth came from many bets over about four years, not from streaks alone, and Duolingo is a daily-practice product — the mechanic fits the domain. Do not import the number; import the shape.

**The two failure modes are both about the reset cliff.** All-or-nothing streaks produce (a) *streak anxiety* — users protecting a number rather than pursuing a goal, doing hollow minimum actions — and (b) a churn cliff, where breaking a 200-day streak makes returning feel pointless and the user leaves permanently. Lally's finding that a single missed day did not damage habit formation is the empirical case for forgiveness: a broken streak is a product-imposed catastrophe, not a real one.

Build forgiveness in from the start:

```ts
// Streak rules that keep the motivation and remove the cruelty.
type StreakState = { current: number; best: number; freezes: number };

function onDayBoundary(s: StreakState, activeYesterday: boolean): StreakState {
  if (activeYesterday) return { ...s, current: s.current + 1,
                                best: Math.max(s.best, s.current + 1) };
  if (s.freezes > 0)   return { ...s, freezes: s.freezes - 1 };   // silent save
  return { ...s, current: 0 };                    // `best` survives — always
}
```

Beyond the code: **earn freezes through use** rather than only selling them (paid-only forgiveness turns the anxiety into a revenue stream, which fails the disclosure test). Warn *before* the break, not after — the streak-saver prompt is the highest-value notification in the whole system because it is genuinely wanted. Offer one cheap repair on return. Keep `best` visible forever so a reset is a setback rather than an erasure. And for products with a weekly rather than daily rhythm, **count "weeks with 3+ sessions" instead of consecutive days** — same possession psychology, no artificial daily obligation.

**Fails when**: the product has no daily need (a streak on a tax tool is absurd), when the streak gates functionality rather than decorating it, when the copy shames ("you let your streak die"), and when the streak becomes the goal — watch for users whose streak is long and whose *outcome* metrics are flat, which means they are farming the counter.

### 9. Prompts you are allowed to send

An external prompt is a loan against a channel the user can close permanently, and **an OS-level notification opt-out is effectively forever** — you have no way to ask again. Treat channel access as a budget, not a tap.

The governing rule for every message: **send only what the user would have wanted to know had they thought of it.** The concrete version — a notification passes if it references (a) a specific object the user owns or follows, or (b) a specific person, and it is timely. Broadcast messages about your product ("check out our new feature", "we miss you") fail on both.

Evidence for spending the budget carefully: Wohllebe et al. (2021, *Innovative Marketing* 17(2)) ran five push frequencies across roughly 17,500 retail-app users over seven weeks and found that as generic, non-personalised push frequency rose, **uninstalls rose and direct open rates fell** — you pay twice. The opposite extreme is not free either: Pielot & Rello (2017), who had people disable notifications for 24 hours, found participants felt less distracted but more anxious about missing things and less connected. Notifications carry real value; the answer is selectivity, not silence.

Build these, in order:

- **Ask for permission after the first value moment**, never on launch, and precede the OS dialog with your own explanatory screen naming what you'll send and letting the user decline *without* burning the one-shot OS prompt.
- **Per-type controls from day one** — the user should be able to keep "someone replied to you" and kill "weekly summary" without an all-or-nothing decision. Granular controls are what stop an annoyance from becoming a permanent opt-out.
- **A volume budget per user per week**, enforced in code, with priority ranking so that a high-value alert can displace a low-value one rather than stacking on top of it.
- **Batch and digest** anything not individually time-critical, at a fixed, user-chosen time.
- **Deep-link to the object**, never the home screen. A prompt that costs the user a navigation task teaches them prompts are expensive.
- **Quiet hours in the user's timezone**, enforced by default.

Detailed notification taxonomy, permission-priming copy, digest composition, timing, lapse ladders, and win-back sequences are in `references/notifications-and-reengagement.md` — read it when you are actually writing the messages or building the re-engagement schedule.

On **re-engagement**, the essential move is to segment by *why* they left, because the three groups need opposite things: users who never reached value are an activation problem (→ **onboarding-activation**), users who activated and lapsed should be reminded of their **stored value** specifically ("your 3 drafts and 12 saved searches are here") rather than of your product generally, and users who deliberately quit should be asked once and then left alone. Run a decreasing-frequency ladder with a hard stop, and honour a sunset policy — after N ignored messages, stop, and tell them you're stopping. Sending forever costs deliverability, brand, and the chance that they return on their own.

**Fails when**: notification-attributed sessions are the majority of your DAU and you interpret that as a habit; when engagement targets are set on a channel, which reliably produces send-volume creep; and when "personalisation" means inserting a first name into a broadcast.

## Anti-patterns

- **Gamification veneer.** Points, badges and leaderboards layered over a task nobody wants to do more of. Worse than useless where the behaviour was already intrinsically motivated: tangible, performance-contingent rewards can undermine intrinsic motivation (Deci, Koestner & Ryan, 1999 meta-analysis — disputed by Cameron & Pierce, so treat it as a real risk rather than a certainty). Safe reading: adding extrinsic rewards to something people already enjoy is risky; to something tedious and mandated, it is roughly harmless and roughly useless. Fix the underlying task instead.
- **The notification *is* the loop.** If suppressing discretionary notifications for a holdout cohort collapses their usage, you have a distribution channel, not a habit. Measure this deliberately, at least annually.
- **Streaks on a product with no daily need**, or streaks that gate value rather than decorate it.
- **Optimising session length or sessions-per-day in a tool.** You will succeed, and the way you succeed is by making the product slower. Pair every engagement metric with a task-completion-speed metric (→ **behavioral-metrics**).
- **Manufactured scarcity and withheld information** — countdown timers on things that don't expire, "3 people are viewing this" that isn't measured, holding a notification you could have sent immediately.
- **Badge inflation.** A red dot on everything trains users to ignore red dots, and then you have no way to signal anything urgent. Badge only user-addressed, actionable things; never badge marketing.
- **Punishing absence.** Decaying points, expiring accumulated value, "your progress will be lost". Loss framing applied to something the user *earned* reads as extortion and is the fastest route to a one-star review.
- **Social pressure that leaks.** Telling a user's contacts that they've been inactive, or making a private habit (language study, finances, health) visible by default. Tribe rewards require consent about the tribe.
- **Infinite feed on a finite job.** If the user's task can be complete, let it be complete. "You're all caught up" is a feature: it builds trust that the product respects the user's time, and trust is what makes them come back voluntarily.
- **Building the loop before the value moment exists.** Retention mechanics on a product nobody has found value in yet just make the churn better-instrumented.
- **Building on ego depletion.** The "willpower is a depleting resource" literature largely failed to replicate in large multi-lab attempts. Do not design mechanics whose rationale is that the user's self-control is used up by evening.

## Ship checklist

Run against the screen, PR, or spec:

- [ ] The core value-moment sentence is pasted in the PR description, and the event that fires on it appears in this diff.
- [ ] The PR names which row of the frequency table (Diagnose #1) this product sits in, and the mechanic being shipped is the one in that row's "Loop strategy" cell.
- [ ] The returning-user path lands on the thing they were doing, not a home screen, in under three actions.
- [ ] A useful session is possible in under ~30 seconds.
- [ ] Notification-attributed sessions as a share of total is on a dashboard with the value from 90 days ago beside it, and the share is not rising.
- [ ] Any variance in the reward comes from the world, not from a scheduler I wrote. (Removal test run.)
- [ ] The diff writes at least one durable record on the user's behalf — point at the persist call — and a screenshot shows where the accumulated count is displayed back to them.
- [ ] Stored value is exportable in one obvious action.
- [ ] Any streak has: forgiveness earned through use, a warning before the break, a persistent `best`, and no shaming copy.
- [ ] Every notification references a specific object or person, deep-links to it, respects a weekly volume budget and quiet hours, and has a granular off switch.
- [ ] Push permission is requested after first value, behind a self-explaining pre-prompt.
- [ ] Engagement metrics are paired with a counter-metric: task-completion speed, regretted-session rate, or notification opt-out rate.
- [ ] The disclosure sentence for this mechanic is pasted verbatim in the PR description, and a reviewer who is not the author has signed that they would ship it in-product.
- [ ] **ethical-persuasion-audit** has been run on anything involving variable reward, streaks, social pressure, or loss framing.

## Sources

- **Fogg, B.J. (2009), "A Behavior Model for Persuasive Design," *Persuasive '09*; *Tiny Habits* (2019).** B=MAP: behaviour requires motivation, ability and a prompt to converge. The six ability factors. Originally published as B=MAT ("trigger").
- **Wood, W. & Neal, D. (2007), *Psychological Review*; Wood, Quinn & Kashy (2002), *JPSP*.** Habits as context-cued automatic responses; much of everyday behaviour is repeated in stable settings.
- **Lally, P. et al. (2010), *European Journal of Social Psychology*.** Median ~66 days to near-automaticity, range roughly 18–254, among the subset who succeeded; missing a single day did not measurably impair formation. The "21 days" figure is from Maxwell Maltz's 1960 *Psycho-Cybernetics* anecdote, not research.
- **Eyal, N. (2014), *Hooked*.** Trigger → action → variable reward → investment; tribe/hunt/self reward taxonomy. Practitioner synthesis, not peer-reviewed research — use as a checklist.
- **Ferster, C. & Skinner, B.F. (1957), *Schedules of Reinforcement*.** Variable-ratio schedules produce high, persistent, extinction-resistant responding.
- **Schultz, W., Dayan, P. & Montague, P.R. (1997), *Science*.** Dopamine neurons signal reward *prediction error*, not pleasure. **Berridge & Robinson**: "wanting" is dissociable from "liking".
- **Deci & Ryan, self-determination theory.** Autonomy, competence, relatedness as durable motivators. **Deci, Koestner & Ryan (1999)** meta-analysis on extrinsic rewards undermining intrinsic motivation — contested by **Cameron & Pierce**; treat as a risk, not a law.
- **Kahneman, Knetsch & Thaler (1990), *JPE*.** Endowment effect; the gap is contested (Plott & Zeiler, 2005), but the applied reading — reluctance to abandon accumulated work and configuration — is safe ground. The IKEA effect and its successful-labour boundary condition are cited in `onboarding-activation`.
- **Hull, C. (1932)**; **Kivetz, Urminsky & Zheng (2006), *JMR*** (café loyalty-card field study). Goal-gradient effect. **Nunes & Dreze (2006), *JCR*** — endowed progress, the car-wash study.
- **Ghibellini & Meier (2025), *Humanities and Social Sciences Communications*.** Meta-analysis: no reliable memory advantage for unfinished tasks (Zeigarnik does not replicate); spontaneous resumption of interrupted tasks (Ovsiankina) does hold, at roughly two-thirds across studies.
- **Kahneman & Tversky (1979), *Econometrica*** — prospect theory / loss aversion. **Gal & Rucker (2018), *Journal of Consumer Psychology*** — argue loss aversion is not a general law and is highly context-dependent. Use the qualitative reading only.
- **Mazal, J. (2023), "How Duolingo reignited user growth," Lenny's Newsletter.** Streak-saver notification as first big win; 7+ day streak share of DAU roughly tripled to over half; ~4.5x DAU over about four years attributed to many bets collectively.
- **Wohllebe, A. et al. (2021), *Innovative Marketing* 17(2), 102–111.** ~17,500 retail-app users, five push frequencies over seven weeks: higher generic push frequency raised uninstalls and lowered direct open rates.
- **Pielot & Rello (2017), MobileHCI, "Productive, Anxious, Lonely."** 24 hours without notifications: less distraction, more anxiety about missing information.
- **Ego depletion** — large-scale multi-lab replication attempts largely failed. Do not design on it.

Deliberately not quoted here: any "X% of users churn after N days", any isolated lift figure for streak-freeze features, and any "average user checks their phone N times a day" statistic. These circulate widely without traceable primary sources. Measure your own product instead (→ **behavioral-metrics**).
