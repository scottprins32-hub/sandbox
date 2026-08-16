# Onboarding tools people were told to use

Read this when the end user did not choose the product: internal tools, B2B software bought by a manager and deployed to a team, and frontline apps handed to field technicians, drivers, nurses, warehouse staff, retail associates or inspectors.

Almost every published onboarding pattern assumes a voluntary user who will leave if bored. That assumption inverts here, and inverting it changes what you build.

## What changes when usage is mandated

| Voluntary consumer product | Mandated tool |
|---|---|
| User can leave; retention is the signal | User cannot leave; retention says nothing |
| Motivation must be created | Motivation is supplied externally, by the employer |
| Success = delight, habit | Success = competence, speed, low error rate |
| Failure shows up as churn | Failure shows up as shadow spreadsheets, workarounds, support tickets, and data quality collapse |
| The user is the buyer | Buyer and user are different people with different value moments |
| Onboard once | Re-onboard constantly — turnover, episodic use, seasonal staff |

The single most important consequence: **you have no churn signal, so you must instrument the failure modes directly.** A mandated tool with terrible onboarding looks identical in a DAU chart to one with excellent onboarding. It looks very different in support volume, task completion time, error/correction rate, and the number of people who quietly kept using the old process.

## The frame: competence, not delight

Self-determination theory (Deci & Ryan) distinguishes autonomy, competence and relatedness. A mandated tool has already removed autonomy — the person did not choose this and cannot opt out. Trying to manufacture autonomy with customisation options or playful copy is at best noise; at worst it reads as the software wasting time the user does not have.

What you can still give them is **competence**: the feeling of being good at their job, fast, and not looking foolish in front of a colleague or customer. Every onboarding decision should be tested against "does this get them to confident, unassisted, correct task completion sooner?"

The secondary lever is **relatedness** — but the useful version is professional, not social. A named human to ask, a visible peer who already knows the tool, a shared team view of who is up and running. Not badges.

## The value moment for a mandated user

State it as: *the first time they complete a real task, correctly, without asking anyone for help.*

Not "saw the dashboard". Not "finished the tutorial". A real unit of their actual job — one inspection logged, one delivery confirmed, one patient note filed, one invoice coded — completed unassisted and accepted by the system.

Instrument that. `first_unassisted_task_completed`, with the task type, elapsed time from first login, and whether a help surface or support contact intervened.

## Design moves

### Teach the fast path first, before the slow path calcifies

For a task performed dozens of times per shift, the difference between the discoverable path (menu → submenu → dialog) and the expert path (keyboard shortcut, barcode scan, swipe) compounds enormously across a year. Users who learn the slow path first rarely migrate, because the slow path works and they are busy.

So onboarding's job is not only "can they do it" but "did they learn the good way". Teach the shortcut *as* the primary instruction, with the menu path as the fallback, not the reverse. Where an expert path exists for a task the user just did the slow way, surface it inline and immediately: "Next time, scan the barcode instead — it skips these three fields."

### Design for the actual physical conditions

Your development machine simulates none of these. Onboarding that assumes them fails on the first shift.

- **Connectivity is not guaranteed.** Loading docks, basements, lifts, rural routes, hospital interiors. First-run must work offline or degrade to a clearly-explained queued state. An onboarding flow that requires a round trip per step is unusable.
- **Hands and gloves.** Touch targets sized for gloved fingers; no precision drag, no long-press-only actions, no gestures requiring two hands while the other holds a package.
- **Light.** Direct sunlight destroys low-contrast UI. Test the first-run screens outdoors or at maximum brightness with a washed-out simulation.
- **Interruption.** A queue of customers, a radio call, a patient. Every onboarding step must be resumable from exactly where it stopped, with no data loss and no restart-from-step-one.
- **Device fleet.** Frontline hardware is often old, cheap, or ruggedised with a small screen. Onboarding must be tested on the worst device in the fleet, not the newest.
- **Shared devices.** A tablet handed between shifts means "first run" happens repeatedly for different people, and personalisation keyed to the device is wrong.

### Two audiences, two flows

The buyer/admin and the end user need entirely different first-run experiences.

**Admin / rollout owner** needs: configuration, permissions, integration with the identity provider, a way to import the org structure, a pilot group, and above all **visibility into who on their team is stuck and where**. Build the per-user onboarding progress view. Without it, the rollout owner's only tool is nagging, and their perception of your product is formed by how much nagging it required.

**End user** needs: to do their job today. They should not see configuration, billing, plan limits, or anything the admin already decided.

A common bug: a new seat-holder joining an existing workspace gets the workspace-creation flow. Detect the invited/provisioned case and route it to a first-task flow inside the workspace that already exists.

### Onboarding is a rollout, not a screen

The in-app experience is one component of something larger, and if you ignore the rest, the app absorbs blame for the whole.

- **Pilot with a small group first**, chosen for representativeness rather than enthusiasm. Enthusiast pilots hide exactly the problems you need to find.
- **Champions matter more than tutorials.** One competent peer per shift or site who can be asked a question in person outperforms any in-app help. Give champions something extra — early access, a deeper guide, a direct channel.
- **The in-app flow must not contradict the training material** the employer produced. If their laminated card says "press the green button" and you shipped a redesign, you have created a support incident, not an improvement. Coordinate changes to first-run flows with rollout owners the way you would coordinate a breaking API change.
- **Announce the "why" through the employer, not the app.** Users want to know why the old process is being replaced and whether this is surveillance. That answer is not credible coming from the software; it is credible coming from their manager. Give the rollout owner the material to deliver it.

### Permanent, findable, in-context help

Episodic use plus staff turnover means "onboarding" is not a phase. Someone will use this tool for the first time at 2am next February.

- In-context help stays permanently; it is not a dismissible first-run overlay.
- Reachable in one tap from any screen, and scoped to *this* screen.
- Written for someone who has never seen the app and cannot leave the current task to go read a knowledge base.
- Include the escape hatch: who to call, and what to do if the app is not working at all. A frontline worker whose tool fails mid-shift still has a job to finish; if you do not give them a fallback, they will invent one, and their invention becomes permanent.

### Do not gamify

Points, streaks, leaderboards and confetti on mandated work are widely resented. The mechanism to worry about is crowding-out: the person is already motivated by professional competence and doing right by a customer or patient; overlaying a trivial extrinsic scoring layer can undermine that framing and reads as management surveillance dressed as fun. If you want to motivate, show them something real — their own error rate falling, time saved this week, a queue they cleared.

The exception is *feedback*, which is not gamification: confirming clearly that a task was accepted and correct is essential, especially where the consequence is invisible to the user.

## What to measure instead of retention

Build these before the rollout, not after the complaints.

- **Time from first login to first unassisted successful task.** The headline number.
- **Assisted vs unassisted completion** — did they open help, call support, or ask in a channel? Rate of assistance in week one, by task type.
- **Task completion time, tracked over the first 20 repetitions.** A healthy learning curve flattens; one that stays flat and slow means they learned a bad path.
- **Error and correction rate** — records edited shortly after submission, validation failures, rejected entries. This is where bad onboarding actually surfaces.
- **Abandonment mid-task**, by step. In a mandated tool this means they gave up and did it another way.
- **Shadow-process detection.** Ask rollout owners directly whether anyone still maintains a spreadsheet, paper form, or WhatsApp group for this workflow. Its existence is the truest failure signal you have and it will never appear in your analytics.
- **Support ticket volume per new user in week one**, and the top three subjects. Those three subjects are your onboarding backlog.

## Quick checklist

- [ ] Value moment defined as first *unassisted, correct, real* task — and instrumented.
- [ ] First run works offline, one-handed, gloved, in sunlight, on the oldest fleet device.
- [ ] Every step resumable after interruption with zero data loss.
- [ ] Invited/provisioned users routed away from workspace-creation flows.
- [ ] Rollout owner has a per-user progress and stuck-point view.
- [ ] Fast path (shortcut/scan/swipe) taught as primary, not as a later tip.
- [ ] In-context help is permanent, one tap away, and screen-scoped.
- [ ] Offline/failure fallback documented in-app: what to do when the tool doesn't work.
- [ ] No points, streaks, leaderboards or confetti.
- [ ] Changes to first-run flows coordinated with whoever owns the customer's training material.
- [ ] Measuring assistance rate, error/correction rate and week-one ticket subjects — not DAU.

## Sources

- Edward Deci & Richard Ryan, self-determination theory — autonomy, competence, relatedness; the relevant reading is that competence is the remaining lever when autonomy is externally removed.
- John M. Carroll, *The Nurnberg Funnel*, MIT Press, 1990 — minimalist instruction and the training-wheels interface, developed at IBM specifically for workers learning mandated business software. The most directly applicable body of research to this context.
- Crowding-out of intrinsic motivation by extrinsic rewards is a real and long-studied phenomenon (Deci, Koestner & Ryan's meta-analytic work), though the size and conditions are debated. Treat "don't gamify mandated professional work" as a well-founded default rather than a proven law.

Deliberately not claimed: any specific percentage for frontline app abandonment, rollout failure rates, or "X% of enterprise software goes unused" — these figures circulate widely with no traceable source. Measure your own deployment.
