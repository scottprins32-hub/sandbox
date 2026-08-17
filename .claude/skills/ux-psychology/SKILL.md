---
name: ux-psychology
description: Applies behavioural science to interface and product decisions — attention, cognitive load, motivation, choice architecture, habit formation and persuasion — and routes to the specialist skill for the job. Start here for any UI, UX, frontend, landing page, signup flow, onboarding, form, pricing page, notification, dashboard or app-screen work — and equally for the surfaces consumer-app advice never covers: a field worker's phone used outdoors, offline or with gloves, a tool someone's employer handed them and they cannot decline, a public no-account page reached from a QR code or a printed URL, a bilingual or second-language interface, a screen that has to survive being printed to paper. Use it for questions like "why do users drop off here", "how do we get people to come back", "why isn't this converting", "make this feel faster", "our workers aren't filling it in", or "is this a dark pattern". Use it even when the user never says the words psychology, UX or design — if a human is going to look at it and decide something, this applies.
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
| Printed artefact | Schedule on a notice board, visit card, QR sheet, PDF offer | Legibility at reading distance, monochrome, survives being photocopied | Anything interactive — there is no hover, no scroll and no undo (`print-and-physical-artefacts`) |

Most real products are several of these at once. A platform can have a marketing page (transactional), an
internal console (professional daily), and a worker portal (assigned) — and each surface needs a different
posture. Diagnose per surface, not per product.

Two of those rows do not map cleanly onto the numbered table below, so name their owners here.

- **Assigned / field tool → `ethical-persuasion-audit` test 5, the subject test, before anything else.** The
  subject of the feature is the worker; the beneficiary is their employer or the employer's customer. Tests
  1–4 assume a person who can walk away and do not bind. Its reciprocity question is the one that decides
  whether the design problem is real: *does the subject get something from this themselves — proof they did
  the work when a complaint is wrong, fewer disputes, faster pay — or does the value flow only upward?* Then
  `ui-craft`'s field-and-outdoor modifier for the legibility and target values, and `list-and-queue-design`
  for the work queue itself.
- **Public info page → `attention-and-hierarchy`** for the one-glance question and scan order, with
  `persuasive-copy` for the words a stranger with no context reads. The arrival is the unusual part: no
  navigation, no account, no session, often a QR code on a notice board, so the page must answer *what is
  this, is it current, who do I tell* in about three seconds. Staleness is a first-class state — "last
  cleaned" is a date that has to degrade honestly rather than go blank — and any live count the page
  publishes goes through `ethical-persuasion-audit` move 4: for every dynamic claim on screen, find the line
  of code that makes it true, or delete the claim.

## Route to the right skill

Work in this order when building something new. Each row is a sibling skill in this directory.

| Order | Skill | Use when |
|---|---|---|
| 1 | `attention-and-hierarchy` | Laying out a screen. Where does the eye go, what is the one loudest thing, does the structure read before the content does. Also owns the **public no-account page** — status page, residents' page, anything reached from a QR code or a printed URL by a stranger with no navigation and three seconds of patience. |
| 2 | `friction-and-flow` | Anyone must complete a task: forms, signup, checkout, multi-step flows, choice-heavy screens. Also owns **perceived performance** — waiting is friction. |
| 3 | `list-and-queue-design` | The list, table or work queue someone lives in all day: default sort, row actions, columns, bulk operations, filter state, pagination, and queue mechanics. The dominant surface of any internal tool and the one most often built by accident. |
| 4 | `persuasive-copy` | Writing any user-visible words: CTAs, labels, errors, empty states, pricing, confirmations. Cheapest lever in the set; usually the most neglected. |
| 5 | `onboarding-activation` | A new user's first run. Getting from arrival to the value moment before patience runs out. |
| 6 | `habit-loop-design` | Retention — why they come back tomorrow. Triggers, rewards, investment, streaks, notifications. **Read the ethics skill alongside it, not after.** |
| 7 | `decision-screen-design` | The moment of commitment: paywalls, plan comparison, price display, listing, booking and checkout summary screens. Owns the question-audit method — every element makes the user ask something, and the question decides whether they act. |
| 8 | `ethical-persuasion-audit` | Before shipping anything from rows 4–7, and any time a flow involves consent, cancellation, billing, urgency, or a default that benefits you. **Also any feature that captures evidence about a person who cannot decline it** — timestamped photos, checkpoint scans, location, activity metrics, quality scores — which is test 5 and nothing else in the set covers it. Also the legal layer (EU DSA/GDPR/UCPD/Omnibus, FTC/ROSCA, WCAG). `decision-screen-design` move 12 owns how a reference price is *displayed* and the Art. 6a mechanics; this skill decides whether the claim is true. |
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
This rule is only worth anything if something checks it, so it has a test: `ui-craft`'s **degraded-case
check** — seven steps, throttled network through to a real phone at low brightness outdoors. Run it per
surface, not per screen; a failure is a token defect and the next screen inherits it.

**The ethics gate.** Every technique here works on people who did not consent to being studied. Before
shipping any of it, run the five tests in `ethical-persuasion-audit`:
1. *Asymmetry* — is opting out exactly as easy as opting in? Count clicks, screens and reading level in both
   directions.
2. *Transparency* — if you explained the mechanism on screen, in plain words, as it happened, would they be
   fine with it? Write the sentence and read it back.
3. *Retrospect* — in a week, will they be glad they did this?
4. *Evidence* — what already happened. Refunds, abandoned cancellations, "I didn't mean to" tickets, consent
   withdrawn shortly after it was given, and the gap between opt-in rate and use of the opted-into thing. A
   high opt-in paired with near-zero use is a confession, not a win.
5. *Subject* — is the person this feature acts on the same person it benefits, and can they decline it?

Tests 1–4 assume someone who can walk away. When the answer to either half of the subject test is no — a
worker handed a tool by their employer, a resident whose building signed the contract, a patient, a child —
they do not bind, because consent and opt-out were never available. **Run test 5 in their place**, and run
its five questions in full: disclosure in the subject's own language, reciprocity, access and contest,
proportionality, and purpose limitation enforced in code.

A technique that fails any applicable test is a dark pattern regardless of what it does to the metric. In the
EU several of them are also unlawful, which turns an ethics argument into a compliance one — useful when you
need to win the discussion rather than the moral high ground.

**When a mandated behaviour is not happening, run the reciprocity question before the friction analysis.**
Someone required to do something and not doing it may be blocked, or may be responding rationally to a
feature that takes from them and returns nothing. Only the first of those is fixed by a bigger button, and
diagnosing it as friction when it is extraction burns a sprint and confirms the worker's read of the
product. `ethical-persuasion-audit` test 5 asks the question; `friction-and-flow` takes over once the answer
is yes, they do get something from it.

**Measure the backfire, not just the win.** Every engagement metric gets paired with a guardrail metric.
Notification opt-out, uninstall, refund and support-contact rates are where manipulation shows up first, and
they are lagging — by the time they move, trust is already spent.

## Working process

For a **new feature or screen**: diagnose the archetype → `attention-and-hierarchy` for layout →
`friction-and-flow` for the task → `persuasive-copy` for the words → `ethical-persuasion-audit` as a gate →
`behavioral-metrics` to instrument before launch, not after.

For a **problem being reported** ("nobody finishes signup", "users churn in week two"): resist the technique
list. Get the funnel data first, find the step that actually leaks, then open the one skill that owns it.
If your whole user base fits in a spreadsheet screenful, there is no funnel to read and the honest move is to
go and watch two of them do it — start at `behavioral-metrics` moves 7 and 8, which say exactly that and say
which small-n methods beat a weak test.

For a **review of existing work**: run the ship checklists at the bottom of each specialist skill. They are
written to be run against a screen or a pull request rather than read as prose. Run the diagnosis checklist
below first — most review findings are downstream of a diagnosis nobody made.

## Diagnosis checklist

This router owns no layer of its own, so it has a gate rather than a ship checklist: it runs before the
specialists, not against a diff. (`ui-craft`'s is the other kind — it checks the seams between the five craft
layers.) Every line below must be answerable in one sentence, out loud, before anyone opens a specialist.

- [ ] The archetype is named, **per surface**, from the table above. A product with a marketing page, a
      console and a worker portal has three answers, not one.
- [ ] Use is classified voluntary or assigned, and nothing aimed at discretionary attention — streaks,
      variable reward, celebration animation, engagement nudges — is proposed for an assigned surface.
- [ ] The value moment is written as one concrete sentence: *the moment value becomes real is when \_\_\_*.
      If it cannot be written, stop; every downstream decision is a guess.
- [ ] The binding constraint is named as attention, comprehension, motivation, ability or trust — and the
      proposed fix acts on that one. A bigger button does not fix an unclear proposition.
- [ ] The ethics gate ran on the spec, not the built screen, and the subject test ran if the person the
      feature acts on cannot decline it.
- [ ] The guardrail metric exists before the change ships, not after (`behavioral-metrics`), or it is
      recorded that there is no traffic to read and which qualitative method replaces it.
