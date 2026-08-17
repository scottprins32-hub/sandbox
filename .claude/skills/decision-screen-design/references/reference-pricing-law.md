# Reference pricing: which instrument binds, per market

Read this when a screen shows a struck-through price, a `-31%` badge, a "was/now" comparison, or any claim
that the price is lower than it was. `SKILL.md` move 12 carries the engineering rule — *a strikethrough price
must be a price you actually charged, and the reference period must be checkable from your own data* — and
that rule is deliberately stricter than any single market requires, so you can build it once. This file is
the analysis behind it: what actually binds, on which product category, and where the common citation is the
wrong instrument.

Requirements differ by market, by product category and by whether you are the seller or the platform, and
they change. Verify the current text before launch, date the check, and route anything contested to counsel
rather than to a code review. This is not legal advice.

## EU — Article 6a, and the scope question that decides whether it applies at all

Article 6a of the Price Indication Directive (98/6/EC), inserted by the Omnibus Directive (EU) 2019/2161 and
applicable from 28 May 2022, requires that **any announcement of a price reduction indicates the prior
price**, and defines the prior price as **the lowest price the trader applied during a period of at least 30
days before the reduction**.

**Check the scope before you cite it.** The Price Indication Directive governs *goods*. The Commission's
guidance on Article 6a (OJ C 526, 29 December 2021) reads the Directive's "products" as excluding services —
digital services included — and digital content. That matters enormously for the screens this skill is about:
subscriptions, SaaS plans, game paywalls and hotel bookings are mostly services and digital content, and
therefore mostly **outside** Article 6a. Citing it at a booking listing is citing the wrong instrument, and a
reviewer who knows that will discount everything else in the argument.

**What binds instead, for services and digital content:** the UCPD (2005/29/EC) misleading-actions
prohibition, plus any national reference-pricing regime. A made-up "was" price is unlawful there too — it is
a false statement about price, which is the textbook misleading action — but the 30-day-low *arithmetic* is
not imposed on you, so the reference price you must be able to defend is the one you can show you charged,
not one derived by a formula the Directive gives you. The CPC network's coordinated action produced EU-wide
commitments from Booking.com and Expedia covering precisely discounts, reference prices and availability
claims, so enforcement interest in services pricing is real without Article 6a.

**The reduction must be computed on the prior price, not merely shown beside it.** The CJEU held so in
**C-330/23 (*Aldi Süd*, 26 September 2024)**: a percentage or "was/now" announced in an advertisement is
determined on the basis of the lowest price applied in the 30 days before the reduction, and mentioning that
lowest price somewhere in the advertisement does not cure a percentage calculated from a higher one. So a
`-31%` badge computed from €129 when €99 was your lowest price in the previous 30 days is not a presentation
choice; it is the thing the rule prohibits — against €99 the badge reads −10%.

**Member-state options.** Article 6a permits specific national regimes for goods liable to deteriorate or
expire rapidly, for goods on sale for less than 30 days, and for progressive reductions. National
implementation therefore varies within the EU; treat "EU" as a set of markets, not one.

**Adjacent Omnibus duties that land on the same screens.** Transparency on ranking parameters and paid
placement, and on review authenticity — which is where `Most popular`, `Recommended` and star ratings live —
plus drip pricing as a misleading omission under UCPD Art. 7, assessed case by case rather than sitting on
the Annex I blacklist, and as a Consumer Rights Directive Art. 6 total-price problem.

## US — no reference-price formula, and an active deception theory

FTC Act §5 covers unfair or deceptive acts and practices, and the FTC has pursued deceptive reference-pricing
and fee-concealment cases under it. There is no federal 30-day-low arithmetic; the question asked is whether
the comparison misleads, which a "was" price nobody ever paid does. Several states run their own
reference-pricing and junk-fee statutes with their own definitions.

The FTC's **Rule on Unfair or Deceptive Fees (16 CFR Part 464)**, effective 12 May 2025, is a different
instrument aimed at totals rather than discounts: clear and conspicuous disclosure of the total price
including all mandatory fees whenever a price is offered, displayed or advertised for **live-event tickets
and short-term lodging**, binding platforms and resellers as well as the venue or hotel. `SKILL.md` move 10
owns the screen consequence.

Enforcement outcomes are jurisdiction- and date-specific and are the fastest way for a document like this to
become wrong. Work from the current text per market.

## What to build

| Market and category | What binds | What you ship |
|---|---|---|
| Goods, EU | PID Art. 6a + *Aldi Süd* | Prior price = lowest charged in ≥30 days; percentage computed from it |
| Services and digital content, EU | UCPD misleading actions; national regimes | Reference price = a price you actually charged, evidenced from price history |
| US | FTC Act §5; state statutes; fee rule for tickets and lodging | Same, plus total-inclusive pricing on the covered categories |
| Everywhere else | Local law, plus the same deception theory in most regimes | The strict version |

One implementation satisfies every row: derive the reference price by query from a price-history table, take
the lowest in at least the prior 30 days, compute the percentage from it, and render the price alone when no
qualifying prior price exists. A per-market conditional in pricing code is how mistakes ship.

## Sources

- **Directive 98/6/EC Art. 6a**, inserted by Directive (EU) 2019/2161 (Omnibus), applicable from 28 May 2022.
- **Commission Notice — guidance on the interpretation and application of Article 6a of Directive 98/6/EC**,
  OJ C 526, 29 December 2021: the PID, Art. 6a included, does not apply to services or digital content.
- **CJEU C-330/23** (*Verbraucherzentrale Baden-Württemberg v Aldi Süd*, 26 September 2024): a price
  reduction announced in an advertisement must be determined on the basis of the lowest price applied in the
  30 days before the reduction.
- **UCPD 2005/29/EC** as amended by (EU) 2019/2161, misleading actions and omissions; **Consumer Rights
  Directive 2011/83/EU** for total-price disclosure and the order-button requirement.
- **CPC coordinated action** on online travel platforms, producing commitments from Booking.com and Expedia
  on discounts, reference prices and availability claims.
- **FTC Act §5**; **FTC Rule on Unfair or Deceptive Fees, 16 CFR Part 464**, effective 12 May 2025.

**Deliberately not stated here:** any fine figure for a specific pricing pattern, and any claim about how
national regimes differ in detail — those are per-market questions with dated answers, and this file would be
wrong about them within a year.
