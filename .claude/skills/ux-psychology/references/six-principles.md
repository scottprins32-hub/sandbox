# Six conversion principles, mapped and fact-checked

Six principles that circulate widely in product and UX teaching — smart defaults, never start the user at
zero, give value before asking, let users build before they commit, frame the ask as a loss, and control the
first number. The advice is sound. The citations attached to it usually are not: four of the statistics most
often quoted alongside these principles do not survive checking, and repeating them in a design review or a
portfolio interview is the kind of error a senior person catches.

This file keeps each principle with its before/after, maps it to the skill in this set that covers it in
depth, and corrects the attribution.

**Read this when** you are about to cite one of these studies, or someone has just quoted one at you.

---

## 1. Smart defaults

**The rule.** Preselect the most common choice for every field. Turn "fill this out from scratch" into
"scan and adjust what doesn't fit" — a fundamentally easier task.

**Before → after.** A booking screen with five empty fields, every one a decision the user must make before
anything happens → the same five fields, prefilled with the most common values, dates already chosen,
waiting to be corrected rather than composed.

**Why it works.** A default is read as a recommendation. The user infers that someone thought about this
and picked what most people need, so accepting it feels like following advice rather than being lazy.

**The real citation.** The strongest evidence is Johnson & Goldstein (2003, *Science*) on organ-donation
consent: countries with opt-out defaults have recorded-consent rates in the high 90s, opt-in countries a small
fraction of that, with otherwise similar populations. Note the ceiling on that claim — it measures *recorded
consent*, not transplants performed, which depend on family veto and clinical infrastructure. For product
work the cleaner evidence is Madrian & Shea (2001) on automatic enrolment in retirement plans, where the
default moved actual behaviour rather than a register entry. The default effect is one of the most robust
findings in behavioural science. **Evidence: robust.**

**Correction — the "70–90% never change defaults" figure.** No source exists for that range. The closest real number is Jared Spool's survey of Microsoft Word users, where **fewer
than 5% had changed any setting at all**. That is a single informal study of one product, not a general law —
useful as an illustration, not as a statistic to quote. Cite Johnson & Goldstein for the principle, and if
you want a software number, cite Spool's <5% and say where it came from.

**Correction — the jam study.** The choice-overload finding is usually credited to Columbia, which is
roughly fair (Sheena Iyengar was at Columbia, Mark Lepper at Stanford; Iyengar & Lepper, 2000). The numbers
are right: 24 flavours → 3% purchased, 6 flavours → 30%. **But it is almost always stated flatly, and it should
not be.** Scheibehenne, Greifeneder & Todd (2010) meta-analysed 63 conditions across 50 studies and 5,036
participants and found the average choice-overload effect to be **essentially zero (d = 0.02)**. The effect
is real in some conditions and reverses in others; the moderators matter more than the main effect.
**Evidence: contested.**

The practical consequence is not "ignore this" — it's that **the win comes from making choices easier to
evaluate, not merely fewer.** Six well-labelled, well-differentiated options beat six arbitrary ones, and
twenty options in scannable categories can beat six in a flat list. Cutting the option count is a proxy for
the real fix.

**Covered in depth by:** `friction-and-flow` (defaults and choice architecture).

**Watch out.** A default that serves you rather than the user is a deceptive pattern, and pre-ticked consent
is unlawful in the EU under GDPR Art. 4(11)/7. Set the default to what a well-informed user would have
chosen. See `ethical-persuasion-audit`.

---

## 2. Never start the user at zero

**The rule.** Find something the user has already done and count it. Progress shown at 20% instead of 0%
converts better even when the underlying work is identical.

**Before → after.** An onboarding screen reading "0% complete" with five empty steps — which tells the user
*you haven't started and there's a lot ahead* → the same form showing 20%, first step already ticked,
because signing up was reframed as step one rather than treated as a separate prerequisite.

**Why it works.** The goal-gradient effect: effort increases as perceived distance to the goal shrinks.
Moving the starting line moves the whole curve. LinkedIn's profile-strength meter is the canonical product
example — it is never at zero.

**Correction — commonly miscredited to Columbia.** The car-wash experiment is **Nunes & Drèze (2006), "The
Endowed Progress Effect: How Artificial Advancement Increases Effort," *Journal of Consumer Research*
32(4)**. Joseph Nunes was at **USC Marshall**, Xavier Drèze at **UCLA Anderson**. The Columbia attribution appears to be carried over from the jam study, which genuinely is Columbia's. The result is as described: an 8-stamp card starting empty was
completed by **19%** of customers, while a 10-stamp card with 2 stamps pre-applied — identical real effort —
was completed by **34%**. Roughly double. **Evidence: robust**, and the goal-gradient effect it builds on
(Kivetz, Urminsky & Zheng, 2006) replicates well.

**Covered in depth by:** `onboarding-activation`.

**Watch out.** The endowment must be honest. Crediting a step the user genuinely completed is framing;
inventing progress that doesn't exist, then revealing hidden steps later, trains users to distrust every
progress indicator you ship. Progress bars that lie are a one-time trick with a permanent cost.

---

## 3. Give value before asking for anything

**The rule.** Deliver something genuinely useful first, then ask. Don't hold results hostage behind a signup
wall.

**Before → after.** The user enters a URL, waits for a scan, and gets blurred results behind a lock —
"create an account to see your report" → the user gets the actual report: what's wrong, what passed, enough
to act on. The prompt comes after: *want the complete breakdown with step-by-step instructions? Save your
report.*

**Why it works.** Reciprocity — receiving creates an unconscious sense of obligation. Cialdini's *Influence*
(1984) treats it as among the most powerful levers in persuasion; Regan (1971) is the classic lab
demonstration. **Evidence: robust.** The usual framing — a restaurant asking for your credit card before
showing you the menu — is a good one, and the blurred-results pattern really is that.

**Correction — the "free samples increase sales 2,000%" figure.** Not a study, and not a sourceable number. The most-cited real figures come from sampling firm Interactions via *The Atlantic* (2014):
**beer +71%, wine +300%, cosmetics +500%, frozen pizza +600%**. Those are trade figures, not peer-reviewed,
and they are a decade old. The 2,000% appears to be a loose retelling. State the mechanism, not the number.

**Covered in depth by:** `onboarding-activation` (deferred signup, time-to-value) and `persuasive-copy`
(reciprocity as a copy lever).

**Watch out.** The gift has to be real. A "free report" that's actually a teaser is the blurred-results
pattern wearing a different hat, and users detect it immediately. The test: could the user close the tab
right now and still be better off than when they arrived? If not, you haven't given anything.

---

## 4. Let users build before they commit

**The rule.** Let the user create, choose and customise before you ask them to sign up. The button should say
*Continue*, not *Sign up*, because by then it doesn't feel like submitting a form — it feels like saving
something they made.

**Before → after.** Email, password, Sign up — a screen containing nothing that belongs to the user, so
closing the tab costs them nothing → a flow where they've already picked a name, a title, a colour palette,
a card design. Every choice makes the thing more theirs, and the tab now costs something to close.

**Why it works.** The IKEA effect: people value what they built more than an identical thing someone else
made (Norton, Mochon & Ariely, 2012, *Journal of Consumer Psychology*). **Evidence: robust** in the original
studies, though effect sizes vary and it depends on the build succeeding — people who fail to complete the
assembly show no such boost. The weaker sibling, the endowment effect (Kahneman, Knetsch & Thaler, 1990),
needs only a sense of ownership, not labour.

Duolingo is the canonical product example: you pick a language, set a goal and complete a first
lesson before an account is ever mentioned.

**Covered in depth by:** `onboarding-activation`.

**Watch out.** There's a line between investment and busywork. Every pre-signup step must produce something
the user can see and would miss. Five configuration questions that generate nothing visible are just a
longer signup form, and they convert worse, not better — you've added cost without adding ownership.

---

## 5. Frame the ask as a loss, not a gain

**The rule.** People work harder to avoid losing something than to gain the equivalent. An upgrade screen
that lists what the user could gain is using the weaker motivator; one that makes concrete what they're
about to lose is using the stronger one.

**Before → after.** "Upgrade now" with a feature list and a costless "Maybe later" — nothing changes if the
user leaves, so the screen has no psychological weight → the same offer expressed as what's at stake, with
the user's actual files named, and a dismissal option that states the consequence rather than hiding it.

**Why it works.** Prospect theory (Kahneman & Tversky, 1979) and status quo bias (Samuelson & Zeckhauser,
1988). People defend what they already have.

**Correction — two claims that are routinely overstated.** Kahneman's 2002 Nobel was awarded for integrating psychological research
into economics broadly, not "for proving loss aversion"; Tversky had died in 1996 and was ineligible. And
the "**twice** as powerful" figure is the λ ≈ 2.25 estimate from Tversky & Kahneman (1992) — a parameter
fitted in a specific lab paradigm, not a universal constant. Gal & Rucker (2018), "The Loss of Loss
Aversion," argues the magnitude and generality are substantially overstated. **Direction: robust.
Magnitude: contested.** Say "losses tend to motivate more strongly than equivalent gains" and you're on
solid ground; say "exactly twice" and someone who has read the literature will correct you.

**Covered in depth by:** `persuasive-copy` (framing) and `habit-loop-design` (streaks as loss aversion).

**⚠ Watch out — this is the principle in the set most likely to get you in legal trouble.** This framing's
example adds a countdown timer to a screen listing files the user is about to lose. Two hard lines:

- **A countdown that isn't real is unlawful in the EU** (Unfair Commercial Practices Directive as amended by
  the Omnibus Directive) and actionable under FTC Act §5. If the deadline doesn't exist, don't render one.
- **Restricting access to a user's own data to force an upgrade** is closer to obstruction than persuasion.
  Naming files they'll lose access to is honest *if the loss is a real consequence of the plan they chose*.
  Manufacturing that loss to create leverage is a different thing entirely.

Run the asymmetry, transparency and retrospect tests in `ethical-persuasion-audit` on any loss-framed screen
before it ships. Loss framing is legitimate; loss *manufacturing* is not.

---

## 6. Control the first number

**The rule.** The same price feels expensive or trivial depending on what the user saw immediately before.
Choose what that is.

**Before → after.** A $50/month protection plan shown alone on a pricing page — the user does the arithmetic,
gets $600/year, and declines → the same $50 shown directly beneath the $1,900 laptop they just added to the
cart, labelled *just 2.6%*. Nothing about the offer changed; the comparison did.

**Why it works.** Anchoring (Tversky & Kahneman, 1974) and the contrast effect: judgment is relative to the
most recent reference point, not absolute. Restaurants price one very expensive steak to make the mid-tier
look reasonable; estate agents show the overpriced house first. **Evidence: robust for anchoring**, one of
the most replicated findings in the field.

**Covered in depth by:** `persuasive-copy` (anchoring and pricing presentation).

**Watch out.** This area also shades into decoy pricing — a tier that exists only to make another look
better. **Decoy/asymmetric-dominance replications are mixed**, so build pricing on anchoring and clear
value differentiation rather than on a decoy tier, and don't promise a stakeholder a decoy will work.
Anchoring against a *fabricated* "was" price is a different matter again: fake reference pricing is
regulated in both the EU and US.

---

## Summary of corrections

| Commonly said | Actually |
|---|---|
| Car-wash loyalty study was Columbia | **Nunes (USC) & Drèze (UCLA), 2006.** Columbia is the jam study. 19% → 34% completion. |
| Jam study proves fewer choices convert better | Real numbers (3% vs 30%), but **Scheibehenne et al. (2010) meta-analysis: average effect ≈ zero (d = 0.02)** across 50 studies. Contested. |
| 70–90% of users never change defaults | **Unsourced.** Nearest real figure: Spool's <5% of Word users changed any setting. Cite Johnson & Goldstein (2003) for the principle. |
| Free samples increase sales 2,000% | **Unsourced.** Interactions/*The Atlantic* (2014) trade figures: beer +71%, wine +300%, pizza +600%. |
| Kahneman won a Nobel for proving loss aversion | Nobel (2002) was for integrating psychology into economics generally. Tversky died in 1996, ineligible. |
| Losing hurts exactly twice as much as gaining feels good | λ ≈ 2.25 from a specific 1992 lab paradigm. Direction robust; **magnitude contested** (Gal & Rucker, 2018). |

The *advice* survives all six corrections — the before/afters are sound and worth building from.
What doesn't survive is the confident statistics. Use the mechanisms, drop the numbers.

## What this framing leaves out

These six are all acquisition- and conversion-facing. Four things this skill set adds that you'll
need for real products:

- **Retention beyond the first session** — the framing stops at signup. `habit-loop-design`.
- **Whether any of it worked** — none of these techniques come with a way to detect the backfire.
  `behavioral-metrics`, especially guardrail metrics.
- **Where the eye actually goes** — every before/after assumes the user sees the change.
  `attention-and-hierarchy`.
- **Product type** — all six examples are consumer or transactional. Applied unchanged to an internal
  console or a tool someone's employer handed them, several of them make the product worse. The diagnosis
  step in `ux-psychology` is there for exactly this.
