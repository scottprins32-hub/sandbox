---
name: ux-psychology
description: Applies behavioural science to interface and product decisions — attention, cognitive load, motivation, choice architecture, habit formation and persuasion — and routes to the specialist skill for the job. Start here for any UI, UX, frontend, landing page, signup flow, onboarding, form, pricing page, notification, dashboard or app-screen work, and for questions like "why do users drop off here", "how do we get people to come back", "why isn't this converting", "make this feel faster", or "is this a dark pattern". Use it even when the user never says the words psychology, UX or design — if a human is going to look at it and decide something, this applies.
---

# UX psychology

Interfaces do not fail because they are ugly. They fail because they ask a human to do something their
attention, memory, or motivation was never going to supply. This skill set turns that into engineering:
diagnose which human constraint is actually binding, then apply the specific technique that relieves it.

The trap this skill exists to prevent: almost all popular "apps people can't stop using" material is derived
from consumer social apps competing for **discretionary attention**. Most software is not that. Ship a
variable-reward loop into a field worker's tool and you have made their job worse. **Diagnose the product
before you reach for a technique.**

## Diagnose first

Answer these five before opening any sibling skill. They change the advice more than anything else will.

1. **Is use voluntary or assigned?** Someone who chose your product needs a reason to return. Someone handed
   it by their employer needs competence and speed. Engagement mechanics aimed at the second group read as
   condescension and get routed around.
2. **Does the user want to be in here, or out fast?** Time-in-app is a success metric for a feed and a
   failure metric for an expense report. Know which you are building before you optimise anything.
3. **How often is it used?** Daily use can build a habit and can assume learned navigation. Quarterly use
   cannot — it must be re-learnable from scratch, every time, by someone who has forgotten everything.
4. **Who pays, and do they use it?** When buyer and user differ, the interface gets optimised for the demo
   and the user pays for it in daily friction. Design for the user; sell with the demo.
5. **What is the one moment where value becomes real?** Everything before it is cost. Everything after it is
   retention. If you cannot name that moment, stop and find it — it is the single most load-bearing fact
   about your product.

### Product archetypes

| Archetype | Example | Optimise | Do NOT reach for |
|---|---|---|---|
| Consumer discretionary | Social, media, games | Habit loops, variable reward, session quality | — (but the ethics gate binds hardest here) |
| Transactional / conversion | Lead-gen page, checkout, booking | Friction removal, copy, attention hierarchy, trust | Habit mechanics, streaks, gamification |
| Professional daily tool | Admin console, CRM, ops dashboard | Speed, recall-free navigation, error recovery, keyboard paths | Tours, celebration animations, engagement nudges |
| Assigned / field tool | Worker portal on a phone, in the field | Legibility in bad conditions, offline tolerance, forgiving input, plain language | Anything that spends the user's attention for the company's benefit |
| Infrequent high-stakes | Tax, insurance claim, medical intake | Anxiety reduction, error prevention, progress clarity, recoverability | Urgency, scarcity, minimalism that hides state |
| Public info page | Status page, residents' page, docs | Instant comprehension, zero account friction, scannability | Signup walls, engagement capture, notification prompts |

Most real products are several of these at once. A platform can have a marketing page (transactional), an
internal console (professional daily), and a worker portal (assigned) — and each surface needs a different
posture. Diagnose per surface, not per product.

## Route to the right skill

Work in this order when building something new. Each row is a sibling skill in this directory.

| Order | Skill | Use when |
|---|---|---|
| 1 | `attention-and-hierarchy` | Laying out a screen. Where does the eye go, what is the one loudest thing, does the structure read before the content does. |
| 2 | `friction-and-flow` | Anyone must complete a task: forms, signup, checkout, multi-step flows, choice-heavy screens. Also owns **perceived performance** — waiting is friction. |
| 3 | `list-and-queue-design` | The list, table or work queue someone lives in all day: default sort, row actions, columns, bulk operations, filter state, pagination, and queue mechanics. The dominant surface of any internal tool and the one most often built by accident. |
| 4 | `persuasive-copy` | Writing any user-visible words: CTAs, labels, errors, empty states, pricing, confirmations. Cheapest lever in the set; usually the most neglected. |
| 5 | `onboarding-activation` | A new user's first run. Getting from arrival to the value moment before patience runs out. |
| 6 | `habit-loop-design` | Retention — why they come back tomorrow. Triggers, rewards, investment, streaks, notifications. **Read the ethics skill alongside it, not after.** |
| 7 | `decision-screen-design` | The moment of commitment: paywalls, plan comparison, price display, listing, booking and checkout summary screens. Owns the question-audit method — every element makes the user ask something, and the question decides whether they act. |
| 8 | `ethical-persuasion-audit` | Before shipping anything from rows 4–7, and any time a flow involves consent, cancellation, billing, urgency, reference pricing, or a default that benefits you. Also the legal layer (EU DSA/GDPR/UCPD/Omnibus, FTC/ROSCA, WCAG). |
| 9 | `behavioral-metrics` | Deciding whether any of it worked, and catching the backfire. Instrumentation, activation, retention curves, guardrail metrics, honest A/B testing. |

### The craft layer

This set decides *what a screen should do*. It does not tell you that a shadow is 0 2px 8px at 6% opacity,
or which six states a button needs. That is `ui-craft` and its five specialists — `typography-system`,
`spacing-and-layout`, `color-and-theming`, `depth-and-overlays`, `ui-signifiers-and-states`.

Both layers are needed on real work. Theory without values produces a design review full of adjectives;
values without theory produce a tidy screen that emphasises the wrong thing. Read `attention-and-hierarchy`
for *why the eye goes there* and the craft skills for *the numbers that put it there*.

For **animation and motion craft** specifically, use the `design-motion-principles` skill — this set covers
when to spend motion as attention, not how to tune the easing curve.

For **visual style, taste and anti-slop frontend design**, use `taste-frontend-design`. This set is about
behaviour; that one is about the look.

### Looking up a specific effect

`references/principles.md` is the master catalogue — 71 named principles with who established each
one, what UI decision it should change, how strong the evidence actually is, and the standard misapplication.
Read it when you half-remember an effect and want to know whether it is real before you build on it, or when
someone cites a "law" in a design review and you want to check it.

`references/six-principles.md` is the source framing this set was built from: smart defaults, never start at
zero, give value before asking, let users build before they commit, frame the ask as a loss, and control the
first number — each with its before/after, the skill that owns it, and a correction of the citation. Read it
when you want those six specifically, or before quoting any statistic attached to them. Four of the
commonly repeated numbers in this area do not survive checking, and the corrections are listed there.

## Rules that hold across the whole set

**Diagnose before prescribing.** Find the binding constraint. A conversion problem caused by an unclear value
proposition will not be fixed by a bigger button, and every hour spent on the button is an hour the real
problem survives.

**Cut cost before adding motivation.** The Fogg behaviour model (B=MAP) says behaviour needs motivation,
ability and a prompt together. Motivation is expensive, volatile and mostly outside your control; ability is
yours to engineer. When a behaviour is not happening, make it easier before you try to make it more appealing.
Removing a form field beats writing a better headline more often than anyone expects.

**One loudest thing per screen.** Emphasis is zero-sum. Five primary buttons is zero primary buttons. If
everything is highlighted, the user's visual system does the prioritising for you and it will not pick yours.

**Defaults are the strongest lever you have and the easiest to abuse.** Most people take the default path.
That makes default-setting a genuine design responsibility: set the default to what a well-informed user
would have chosen, not to what your metrics would prefer.

**Reversibility beats confirmation.** An undo is cheaper for the user than a "Are you sure?" dialog, and
safer — confirmation dialogs are clicked through reflexively, which means they stop protecting anything.

**Design for the degraded case.** Your real user is tired, on a cracked phone in bad light, on a slow
connection, interrupted mid-task, reading their second language. That is not an edge case to handle later;
it is the design target. Accessible, legible and forgiving interfaces are better for everyone under load.

**The ethics gate.** Every technique here works on people who did not consent to being studied. Before
shipping any of it, run the three tests in `ethical-persuasion-audit`:
- *Asymmetry* — is opting out exactly as easy as opting in?
- *Transparency* — if you explained the mechanism to the user, would they be fine with it?
- *Retrospect* — in a week, will they be glad they did this?

A technique that fails any of these is a dark pattern regardless of what it does to the metric. In the EU
several of them are also unlawful, which turns an ethics argument into a compliance one — useful when you
need to win the discussion rather than the moral high ground.

**Measure the backfire, not just the win.** Every engagement metric gets paired with a guardrail metric.
Notification opt-out, uninstall, refund and support-contact rates are where manipulation shows up first, and
they are lagging — by the time they move, trust is already spent.

## Working process

For a **new feature or screen**: diagnose the archetype → `attention-and-hierarchy` for layout →
`friction-and-flow` for the task → `persuasive-copy` for the words → `ethical-persuasion-audit` as a gate →
`behavioral-metrics` to instrument before launch, not after.

For a **problem being reported** ("nobody finishes signup", "users churn in week two"): resist the technique
list. Get the funnel data first, find the step that actually leaks, then open the one skill that owns it.
`behavioral-metrics` covers what to do when you do not have enough traffic for a real test — which is most
teams, most of the time.

For a **review of existing work**: run the ship checklists at the bottom of each relevant skill. They are
written to be run against a screen or a pull request rather than read as prose.
