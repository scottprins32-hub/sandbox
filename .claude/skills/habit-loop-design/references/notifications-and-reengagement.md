# Notifications and re-engagement: the detailed build

Read this when you are actually writing notification copy, choosing send times, building a digest, or designing a lapse/win-back sequence. `SKILL.md` covers the principle (a channel is a budget, an opt-out is permanent); this covers the implementation.

## 1. Classify every message before you build it

Most notification systems rot because messages of different classes share one pipeline, one permission, and one volume budget. Classify first; the class determines everything else.

| Class | Example | Interruptive? | Batchable? | Can the user turn it off? |
|---|---|---|---|---|
| **Transactional / safety** | Login from new device, payment failed, 2FA | Yes, immediately | Never | No (but never abuse this class) |
| **Directed by a human** | Reply, mention, DM, assignment, share | Yes | Only if bursty | Per-source, yes |
| **User-configured alert** | Price hit, saved search match, build failed, threshold crossed | Yes, at the trigger | Per-rule, user's choice | Yes, per rule |
| **State change on a user's object** | Your export finished, your order shipped, your doc was edited | Usually yes | Often | Yes |
| **Time-based commitment** | Streak about to break, deadline tomorrow, scheduled review | Yes, once | No | Yes |
| **Digest** | Weekly summary, what you missed | No | Is a batch | Yes, with frequency choice |
| **Editorial / recommendation** | "Stories for you", "trending near you" | No | Yes | Yes, and default it off for new users |
| **Product marketing** | New feature, upgrade offer, "we miss you" | No | Yes | Yes, and prefer email over push entirely |

Two rules fall out of the table. **Never smuggle a lower class into a higher one** — a marketing message dressed as a state change ("Your account has a new opportunity!") is the single fastest way to lose the channel, because the user learns your alerts are untrustworthy. And **the classes should not share a budget**: an editorial message must never be able to crowd out a human-directed one.

## 2. Getting permission without burning it

On iOS the OS push prompt is effectively one-shot: decline it and you are into Settings-deep-link territory, which almost nobody does. Web push is similar in practice — a hard denial is sticky per-origin. So the OS prompt is a resource you spend once.

The sequence:

1. **Reach a value moment first.** Never prompt on launch or during signup. The user has no basis to decide and will decline defensively.
2. **Prompt at a moment where the notification is obviously useful** — right after the user creates the thing that will generate notifications. "You'll get a note when someone replies" makes sense one second after they post.
3. **Soft-ask first.** Show your own in-app screen naming exactly what you will send and roughly how often, with "Not now" and "Turn on". Only users who tap "Turn on" ever see the OS dialog. A "Not now" costs you nothing and can be asked again later; an OS denial cannot.
4. **State frequency honestly** in the soft ask. "About 2–3 a week" sets an expectation you can then be held to — which is a constraint worth having.

Soft-ask copy that works, in shape:

```
Know when Sam replies
We'll send a notification when someone replies to your thread or
mentions you. Roughly a few times a week. Nothing else.
                                   [ Not now ]  [ Turn on ]
```

What makes it work: it names a *specific person or object*, states the volume, and explicitly excludes everything else. What breaks it: "Enable notifications to get the most out of AppName" — no content, no promise, no reason.

## 3. Timing

- **Consistency beats optimisation** for recurring messages. A digest that always arrives at 08:30 local becomes part of a routine; a wandering "smart send time" never can.
- **Let the user choose the time** for anything scheduled. It is one control and it converts a guess into a commitment.
- **Send event-driven messages at the event**, not on a schedule. Delaying something you could send now to hit a "better engagement window" is exactly the engineered-variance failure the main skill warns about, and it fails the disclosure test.
- **Quiet hours in the user's local timezone, on by default.** Store the timezone; do not infer it from the last request.
- **The streak/deadline warning is the highest-value scheduled message you will send.** Send it with enough time to act — a warning at 11:50pm is a taunt.
- **Respect the "in a meeting" test.** For each message ask: if this arrived while the user was mid-conversation with their boss, would they be glad or irritated? If irritated, it belongs in a digest.

## 4. Writing the message

The body should let the user decide whether to act **without opening the app**. A notification the user must open just to evaluate is a tax.

| Weak | Strong | Why |
|---|---|---|
| "You have a new notification" | "Sam: can you look at the deploy before 4?" | Names the person, carries the content |
| "Activity in your workspace" | "3 comments on *Q3 pricing*" | Names the object, counts the thing |
| "Your report is ready!" | "March expenses report ready — £4,210 across 38 items" | Delivers value in the message itself |
| "Don't lose your streak!" | "10 minutes left to keep your 14-day streak. One lesson does it." | States the cost, and the action, and how small it is |
| "We miss you 😢" | "Your 3 drafts are still here, and search got 4x faster since June" | A reason to return that isn't emotional pressure |

Mechanics: front-load the distinguishing information (notification centres truncate); no exclamation-mark urgency on things that are not urgent; deep-link to the *object*, never the home screen; and set collapse/thread keys so ten events on one object arrive as one updating notification rather than ten.

## 5. Volume budget, in code

Enforce the budget in the send path, not in a policy doc, or it will erode one experiment at a time.

```ts
type Priority = "transactional" | "human" | "alert" | "state" | "digest" | "editorial";

const WEEKLY_BUDGET: Record<Priority, number | "unlimited"> = {
  transactional: "unlimited",   // safety and money, never throttled
  human:         "unlimited",   // the user's actual correspondents
  alert:          "unlimited",  // the user configured these themselves
  state:          10,
  digest:          2,
  editorial:       1,           // and default-off for new users
};

async function send(userId: string, msg: Message) {
  if (inQuietHours(userId, msg) && msg.priority !== "transactional") {
    return defer(userId, msg);        // hold to the next allowed window
  }
  const budget = WEEKLY_BUDGET[msg.priority];
  if (budget !== "unlimited" && (await sentThisWeek(userId, msg.priority)) >= budget) {
    return drop(userId, msg, "budget");   // log it: budget drops are a product signal
  }
  return deliver(userId, msg);
}
```

Log every budget drop with its class. A rising drop rate for `editorial` means someone is over-sending; a rising drop rate for `state` means your product is too chatty about its own internals.

## 6. Preference centre

Granular controls are the pressure-release valve that prevents an annoyance from becoming a total opt-out. Ship them before you ship your second notification type, not after complaints.

- One row per *message class* the user recognises, in their language ("Replies and mentions", "Price alerts", "Weekly summary") — not per internal event name.
- Per-channel toggles (push / email / in-app) per class, because the right channel differs: human-directed goes to push, digests go to email.
- A frequency selector on digests (daily / weekly / off), not just on/off.
- A visible "pause all for 7 days" — which recovers users who would otherwise nuke the channel permanently during a busy week.
- The unsubscribe link in email goes to the preference centre *and* honours one-click list-unsubscribe headers. Making unsubscribe hard converts an opt-out into a spam complaint, which costs you deliverability for every other user.

## 7. The lapse ladder

Segment by *why* they left; the three groups need opposite treatment.

**A. Never activated** (signed up, never reached the value moment). This is not a re-engagement problem, it is an activation problem — → `onboarding-activation`. The only useful message here removes the specific blocker they hit ("you stopped at connecting your calendar — here's the 30-second version, or skip it and use it manually").

**B. Activated, then lapsed.** These are your real re-engagement targets, and the lever is their **stored value**, specifically enumerated. Not "come back to AppName" but "your 12 saved searches are still running; 4 have new matches."

A ladder with decreasing frequency and a hard stop:

| When | Message | Content |
|---|---|---|
| Day 3–7 of silence | 1 | Their stored value + one concrete new thing waiting for them |
| Day ~21 | 2 | What changed since they left, if anything genuinely did |
| Day ~60 | 3 | One honest question: "what stopped working for you?" with a real reply path |
| After that | 0 | Stop. Tell them you're stopping and how to come back |

**C. Deliberate quitters** (cancelled, uninstalled, said no). Ask once, at the moment of leaving, what went wrong. Then stop. Continued contact converts a neutral ex-user into a detractor.

## 8. Win-back that isn't insulting

A win-back needs a *reason the situation changed*. Rank these by honesty:

1. **You fixed the thing they complained about.** If you have their churn reason, this is the only message worth sending: "you left because imports were slow — they're now under a minute." Highest response rate and it is simply true.
2. **Their stored value produced something new** without them. A saved search matched; a collaborator did something; a report they set up ran.
3. **A material product change** in the area they used.
4. **A discount.** Last resort. It trains price-waiting, insults users who stayed, and if a discount is the only reason to return, the product problem is still there.

Never: guilt ("we miss you"), fake urgency ("your account will be deleted" when it won't), anthropomorphised sadness, or streak-shame after a break.

## 9. Sunset policy

Write it down and enforce it in code: after N consecutive ignored messages in a class (no open, no click, no session), stop sending that class and tell the user once — "we've paused the weekly summary since you haven't been opening it; turn it back on here."

This is not just courtesy. It protects email deliverability (engagement is a primary sender-reputation input, so sending to dead addresses degrades inbox placement for your *active* users), it keeps push opt-out rates down, and it leaves the door open for a return on the user's own terms — which is the only kind of return that turns into a habit.

## 10. Instrumentation

Per class, per cohort, tracked as a standing dashboard (→ `behavioral-metrics` for experiment design):

- Delivery → open → **action taken** (opens without action mean the message was misleading, not effective).
- Opt-out rate per class, and OS-level push disable rate. Treat OS-level disable as a **permanent** loss when computing the value of a send.
- Uninstall / unsubscribe rate against send volume, per cohort — this is the Wohllebe et al. (2021) effect, and it is measurable on your own product.
- Share of sessions that are notification-attributed vs. direct, by cohort age. Falling notification dependence over a cohort's life is the signature of a real habit; flat or rising dependence means you have a channel, not a habit.
- Budget-drop counts per class (see §5).
