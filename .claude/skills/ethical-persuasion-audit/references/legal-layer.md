# The legal layer

Read before shipping consent, checkout, subscription, cancellation or advertising code into a regulated
market, or when you need to cite a specific obligation in an escalation.

**This is an engineering reference, not legal advice.** It describes obligations, not outcomes. Scope,
thresholds, exemptions, commencement dates and enforcement priorities differ by jurisdiction and change
frequently — this area is under active reform on both sides of the Atlantic. Verify current requirements for
every market you serve before launch, and route contested questions to counsel rather than settling them in a
code review.

Two structural facts that catch teams out:

1. **The law follows the user, not your incorporation.** A US company serving EU consumers is inside the EU
   consumer and data regimes. "We're not an EU company" is not a defence.
2. **Regimes stack.** One cookie banner can simultaneously engage the ePrivacy consent rule, GDPR's
   definition of consent, the UCPD's misleading-practice rules, and — if you are a platform — DSA Art. 25.
   Satisfying one does not discharge the others.

---

## EU: Digital Services Act (Regulation (EU) 2022/2065)

**Art. 25(1)** is the first EU provision written directly at interface design: providers of **online
platforms** shall not design, organise or operate their online interfaces in a way that deceives or
manipulates recipients of the service, or in a way that otherwise materially distorts or impairs their
ability to make free and informed decisions.

**What "online platform" means.** Roughly, a hosting service that stores information provided by users and
disseminates it to the public at their request — marketplaces, social products, app stores, review sites,
forums, content-sharing sites. A plain B2B SaaS dashboard or a shop selling its own goods is generally not
one, though it remains fully inside the UCPD and GDPR. Certain obligations do not apply to micro and small
enterprises; do not assume you qualify without checking the definitions.

**Art. 25(2)** excludes practices already covered by the UCPD or GDPR — which means those regimes remain the
operative ones for most commercial and consent patterns, and Art. 25 fills the gap rather than replacing them.

**Art. 25(3)** contemplates guidance on specific patterns, and the categories named in the DSA's recitals and
in that provision are a useful checklist of what the legislator had in mind:

- giving more prominence to one choice than another when asking for a decision;
- repeatedly requesting a choice the user has already made;
- making the procedure for terminating a service more difficult than subscribing to it;
- default settings that are hard to change and unreasonably bias the decision.

Recital 67 gives further examples, including difficulty cancelling a subscription and false urgency or
countdown timers.

**Engineering read:** if you are a platform, the four bullets above are effectively named findings. Design so
that none of them describes your interface.

## EU: Unfair Commercial Practices Directive (2005/29/EC), as amended by the Omnibus Directive (2019/2161)

The general consumer-protection backstop, and in practice the widest net. It prohibits:

- **Misleading actions** — false information, or true information presented deceptively, that causes the
  average consumer to take a decision they would not otherwise have taken.
- **Misleading omissions** — hiding or obscuring material information the consumer needs to decide, including
  by burying it or presenting it in an untimely or unclear way. **This is the hook for drip pricing and
  hidden fees.**
- **Aggressive practices** — harassment, coercion or undue influence that impairs freedom of choice.
  Persistent nagging and obstruction live here.
- **Annex I: practices unfair in all circumstances**, no case-by-case assessment needed. Relevant entries
  include bait advertising, falsely stating a product will be available only for a very limited time in order
  to force an immediate decision, describing something as "free" when it is not, using editorial content to
  promote a product without disclosing the payment (advertorial), and persistent unwanted solicitations.

**The Omnibus amendments** added, among others: disclosure of the main parameters determining ranking and of
paid placement in search results; disclosure of whether and how a trader ensures reviews come from actual
purchasers; a prohibition on submitting or commissioning fake reviews and on misrepresenting reviews;
disclosure of personalised pricing based on automated decision-making; and rules on how a prior price must be
derived when announcing a price reduction (via the Price Indication Directive). Member States' penalty regimes
include turnover-based maxima for widespread infringements.

**Engineering read:** every dynamic claim on a page — scarcity, urgency, popularity, "was" prices, ranking
order, review scores — must be true when the code runs, and anything paid must be labelled.

## EU: GDPR (Regulation (EU) 2016/679) and the ePrivacy consent rule

**Art. 4(11)** — consent is a *freely given, specific, informed and unambiguous* indication of the data
subject's wishes by which they signify agreement **by a statement or by a clear affirmative action**.

**Art. 7** —
- (1) you must be able to *demonstrate* consent was given, which means logging what was shown and what was
  chosen, with a version identifier for the notice;
- (2) a consent request bundled with other matters must be clearly distinguishable, intelligible, in plain
  language;
- (3) **withdrawal must be as easy as giving consent**, and the user must be told so before consenting;
- (4) whether consent is freely given depends on, among other things, whether service is made conditional on
  consent to processing that is not necessary for that service.

**Recital 32** — silence, pre-ticked boxes, and inactivity **do not** constitute consent. **Recital 43** —
consent is presumed not freely given where there is a clear imbalance, or where separate consents are not
allowed for separate operations.

**ePrivacy Directive Art. 5(3)** — storing information on, or gaining access to information already stored on,
a user's terminal equipment requires consent unless strictly necessary to provide the service the user
requested. **This covers `localStorage`, `sessionStorage`, SDK identifiers, pixels, device fingerprinting and
session-replay tooling — not just things called "cookies"** — and it applies regardless of whether you regard
the stored value as personal data. Consent must be obtained *before* the storage or access occurs.

**Regulator guidance you can cite by name:**
- **EDPB Guidelines 05/2020 on consent.**
- **EDPB Guidelines 03/2022 on deceptive design patterns in social media platform interfaces** (revised
  version adopted 2023) — a pattern-by-pattern taxonomy written by the regulators themselves.
- **EDPB Cookie Banner Taskforce report (2023)** — the practices national DPAs flagged as non-compliant,
  including no reject option on the first layer, deceptive button contrast, pre-ticked boxes, and
  "legitimate interest" sliders defaulted on.

The consistent regulator position: **if accepting takes one click, refusing must take one click, on the same
layer.** CJEU case law has confirmed that a pre-ticked checkbox is not valid consent for storing cookies.

**Engineering read:** consent is a state you must be able to prove, refuse, and revoke as cheaply as it was
granted; and nothing non-essential fires before it. Verify the last part in devtools with a clean profile,
not by reading the code — tag managers routinely fire things the application code does not.

## EU: Consumer Rights Directive (2011/83/EU)

Governs distance and off-premises contracts with consumers.

- **Pre-contractual information (Art. 6)** — before the consumer is bound: main characteristics, identity of
  the trader, total price inclusive of taxes and all additional charges (or how it will be calculated),
  duration, minimum term, and the conditions and procedure for exercising the right of withdrawal.
- **The order button (Art. 8(2))** — where placing the order entails an obligation to pay, the trader must
  make that clear, and the button must be labelled unambiguously — "order with obligation to pay" or a
  corresponding formulation that leaves no doubt. **If this is not complied with, the consumer is not bound
  by the contract or order.** "Continue", "Complete", "Register" and similar generic labels are the classic
  failure. Include the amount and, for subscriptions, the cadence.
- **No default extras (Art. 22)** — any payment additional to the main contractual obligation requires the
  consumer's *express* consent. A pre-ticked box or an opt-out default does not qualify, and where one is
  used the consumer is entitled to reimbursement.
- **Right of withdrawal (Arts. 9–11)** — a 14-day cooling-off period for distance contracts, with defined
  exceptions (for example certain digital content supplied with the consumer's prior express consent and
  acknowledgement, custom goods, and some others — check the list for your product). If you fail to inform
  the consumer of the right, **the withdrawal period is extended substantially** — up to twelve months on
  top. A model withdrawal form must be provided, and you may not require the consumer to use only your own
  form.

**Engineering read:** the checkout summary and the final button are legal artefacts. Put the all-in total and
the obligation-to-pay wording in the same component, and keep the withdrawal information in the order
confirmation email, not only in linked terms.

## EU: accessibility

- **European Accessibility Act (Directive (EU) 2019/882)** extends accessibility requirements to a set of
  consumer-facing products and services, including e-commerce, consumer banking, e-books, and elements of
  transport and telecoms. Obligations began applying in 2025; micro-enterprises providing services are
  relieved of some requirements, and there are transition provisions. Verify scope for your product.
- **EN 301 549** is the harmonised European standard for ICT accessibility and the technical reference for
  the EAA. It has tracked **WCAG 2.1 AA** for web content; **WCAG 2.2 AA** (W3C Recommendation, 2023) is a
  superset, so building to 2.2 AA covers 2.1 AA and future-proofs.
- Individual Member States also have public-sector accessibility obligations under Directive (EU) 2016/2102.

## EU: what is coming

The Commission has signalled a **Digital Fairness** initiative aimed specifically at dark patterns, addictive
design, personalisation and influencer marketing, following a fitness check of existing consumer law that
found gaps in the digital environment. Treat today's rules as a floor rather than a ceiling, and check the
current status before assuming a pattern that is merely frowned upon today will stay that way.

## UK

Broadly parallel to the EU on data (UK GDPR + PECR) but diverging on consumer law. The **Digital Markets,
Competition and Consumers Act 2024** regime covers unfair commercial practices, including provisions
addressing fake reviews and price transparency in drip-pricing scenarios, with direct enforcement powers for
the CMA. The **ICO's Age Appropriate Design Code (Children's Code)** applies to services likely to be accessed
by children and includes explicit provisions against nudging children toward less protective settings.
Commencement of individual DMCC provisions has been staged — verify current status.

## US: FTC Act §5, ROSCA, and the negative-option rulemaking

- **FTC Act §5** prohibits unfair or deceptive acts or practices. "Deceptive" turns on a representation,
  omission or practice likely to mislead a consumer acting reasonably, that is material. "Unfair" turns on
  substantial injury not reasonably avoidable and not outweighed by benefits. The FTC's staff report
  **"Bringing Dark Patterns to Light" (2022)** sets out how the Commission maps interface patterns onto this.
- **Disclosure guidance** — the FTC's `.com Disclosures` guidance is the reference for "clear and
  conspicuous": proximity to the claim, prominence, no burying in hyperlinks or hover text, and it must work
  on the device the consumer actually uses.
- **Endorsements and reviews** — the FTC's Endorsement Guides and its rule on consumer reviews and
  testimonials address fake and AI-generated reviews, buying positive or negative reviews, undisclosed
  insider reviews, review suppression, and misleading review widgets. Disclosure of material connections must
  be clear and adjacent.
- **ROSCA (Restore Online Shoppers' Confidence Act, 15 U.S.C. §8401 et seq.)** governs online negative-option
  sales. Three requirements: **clearly and conspicuously disclose all material terms before obtaining billing
  information; obtain the consumer's express informed consent; and provide simple mechanisms to stop
  recurring charges.** The FTC has brought significant enforcement actions against large subscription
  businesses under this.
- **The Negative Option Rule ("click to cancel")** — the FTC's amended rule was **vacated on procedural
  grounds by a federal appellate court in 2025**, shortly before it was to take effect, and the FTC
  subsequently restarted rulemaking. **This changed nothing about ROSCA, §5, or state law.** Enforcement on
  cancellation friction continued through the vacatur. Build as though click-to-cancel is required, because
  in substance it is, and check the status of any successor rule before launch.
- **State auto-renewal laws** — many states have their own, and several require that a subscription entered
  into online can be cancelled online, in the same medium, without talking to anyone. California's automatic
  renewal law is the most developed and has been amended to strengthen online cancellation. These apply
  independently of the federal position.

## US: privacy and dark patterns

- **CCPA as amended by the CPRA** defines a **"dark pattern"** in statute as a user interface designed or
  manipulated with the substantial effect of subverting or impairing user autonomy, decision-making or
  choice, and provides that **agreement obtained through a dark pattern does not constitute consent.**
- The implementing regulations require **symmetry in choice**: the path to the more privacy-protective option
  must not be longer, more difficult or more time-consuming than the path to the less protective one. Cited
  examples of asymmetry include an opt-out that takes more steps than opting back in, and a banner offering
  "Accept All" against a "Preferences" link rather than "Decline All".
- **CPPA Enforcement Advisory 2024-02** makes the crucial point explicitly: **dark patterns are assessed by
  effect, not intent.** You do not need to have meant to deceive.
- Several other US state privacy statutes (Colorado, Connecticut and others) carry comparable dark-pattern
  language and consent definitions.
- **COPPA** applies to services directed to children under 13, with parental-consent requirements; several
  states have enacted age-appropriate design requirements, some of which have been challenged in court.

---

## Mapping obligations to code

| Interface decision | Regimes engaged |
|---|---|
| Cookie/consent banner | ePrivacy Art. 5(3); GDPR 4(11), 7; EDPB guidance; DSA 25 if a platform; CCPA/CPRA symmetry |
| Pre-ticked anything | GDPR Recital 32; CRD Art. 22 for paid extras; CPRA consent definition |
| Final checkout button | CRD Art. 8(2); UCPD misleading omission; ROSCA disclosure if recurring |
| Fees revealed late | UCPD misleading omission; CRD Art. 6 total price; FTC §5; UK DMCC drip pricing |
| Countdown timer | UCPD Annex I false limited-availability; DSA recital 67; FTC §5 |
| "Only 3 left" | UCPD misleading action; FTC §5 |
| Reviews and testimonials | UCPD as amended by Omnibus; FTC endorsement/review rules |
| Sponsored placement | UCPD Annex I advertorial + Omnibus ranking transparency; FTC `.com` disclosures |
| Trial → paid conversion | ROSCA; CRD pre-contractual info + withdrawal; state auto-renewal laws |
| Cancellation flow | ROSCA simple mechanism; state auto-renewal laws; DSA 25 termination-harder-than-subscription; UCPD aggressive practice |
| Re-asking a declined permission | DSA 25 repeated requests; GDPR freely-given |
| Keyboard-inaccessible consent control | EAA / EN 301 549 / WCAG; and it fails the GDPR unambiguous-consent test for that user |

## The engineering posture that survives all of it

Build the strictest version once, globally, instead of maintaining per-jurisdiction variants:

- equal-weight, one-click Accept and Reject on the first layer, nothing non-essential firing before choice;
- consent state logged with the notice version, and revocable from account settings in one step;
- all-in pricing shown before effort is invested;
- an order button that names the amount and the obligation;
- self-serve cancellation in the same medium as signup, plus a pre-charge reminder;
- every dynamic claim backed by a real value at runtime;
- WCAG 2.2 AA on the whole consent/checkout/cancellation path.

That configuration is simpler to maintain than geo-forked flows, and it is the one you would have been asked
to build anyway after the first complaint.
