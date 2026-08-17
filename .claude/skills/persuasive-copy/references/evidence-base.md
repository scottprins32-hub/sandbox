# Evidence base

The apparatus behind the moves in `persuasive-copy/SKILL.md`: what each study actually measured, how large the
effect was, and where it has failed to replicate. The skill carries the operational verdict at the point of
use; this file is what you bring to an argument — a design review where someone quotes a number, a stakeholder
who wants the percentage in a deck, or a decision about whether a technique is worth building at all.

Read it when you need to defend or refuse a claim. You do not need it to name a button.

## Framing

- **Tversky & Kahneman (1981), "The Framing of Decisions and the Psychology of Choice", *Science*.** The
  Asian-disease problem: identical outcomes described as lives saved versus lives lost flipped the majority
  preference between a sure and a risky option.
- **Typology: Levin, Schneider & Gaeth (1998).** Three kinds — attribute framing (the same attribute stated
  positively or negatively), goal framing (an action described as achieving a gain or avoiding a loss), and
  risky-choice framing (the original). Attribute framing is the most reliable and the most relevant to product
  copy; goal framing is reliably the weakest; risky-choice framing is rarely what a UI is doing.
- **Replication.** The risky-choice effect replicated in Many Labs 1 (Klein et al., 2014) at roughly half the
  original effect size.
- **Goal framing is small.** O'Keefe & Jensen's meta-analyses of health messaging — 93 studies, N≈21,656 for
  prevention behaviours (2007); 53 studies, N≈9,145 for detection (2009) — found gain/loss differences that
  were statistically significant but tiny, on the order of r ≈ .03, with the direction flipping between
  prevention and detection contexts.

**What this licenses:** getting the frame right because it is free. Not a forecast that reframing a CTA as a
loss will move a conversion rate.

## Loss aversion

**Kahneman & Tversky (1979), prospect theory.** Losses loom larger than equivalent gains. The direction is
well supported in risky-choice and endowment paradigms; the generality and the magnitude are actively
disputed. **Gal & Rucker (2018), *Journal of Consumer Psychology*** argued the evidence does not support
losses being systematically more impactful, provoking a large commentary set on both sides (e.g. Simonson,
2018); Kahneman has granted the effect is context-dependent rather than a law of human nature.

**No multiplier is quoted here.** The "losses hurt twice as much" coefficient is a parameter fitted to
specific gambling experiments, not a property of your checkout. `habit-loop-design` move 8 applies the same
qualitative reading to streaks.

## Anchoring and pricing presentation

- **Anchoring — Tversky & Kahneman (1974), *Judgment under Uncertainty*.** An initial number becomes the
  reference against which subsequent judgments are adjusted, and the adjustment is systematically
  insufficient. It works with transparently irrelevant anchors and survives warning the subject. Among the
  strongest replications in Many Labs 1 (Klein et al., 2014), which puts it in a different evidential class
  from most of what circulates in growth blogs.
- **Temporal / per-unit reframing — Gourville (1998), "Pennies-a-Day", *Journal of Consumer Research*.**
  Reframing an aggregate cost as a small ongoing one can raise willingness to pay by making the amount
  comparable to trivial daily expenses. It fails once the daily figure is large enough that the comparison
  stops being trivial, and reads as evasive when the total is hidden.
- **Decoy / attraction effect — Huber, Payne & Puto (1982).** Adding a dominated third option to shift share
  toward a target. **Mixed replication record:** Frederick, Lee & Baskin (2014) and Yang & Lynn (2014) largely
  failed to find it with realistic stimuli and real products, as opposed to the abstract numeric attributes of
  the original studies.
- **Compromise effect — Simonson (1989).** Middle options gaining share. Has held up better than the decoy.
- **Charm pricing — Anderson & Simester (2003), "Effects of $9 Price Endings on Retail Sales", *QME*.** Real
  catalogue field experiments where $9 endings increased demand: in one test the same item sold 21 units at
  $39 against 16 at $34 and 17 at $44. Note the unit counts — small samples. The effect was stronger for new
  items and interacted with other discount cues. Left-digit mechanism: **Thomas & Morwitz (2005)**. The
  blanket rule "always end in 9" is not supported; the evidence points at a *signalling* mechanism ("this is
  a discount"), which is why a $9 ending works against premium and enterprise positioning.

## Social proof

- **Field magnitude — Allcott (2011), *Journal of Public Economics*.** Evaluated OPOWER Home Energy Reports,
  which compare a household's usage to its neighbours', across 17 randomised field experiments and ~600,000
  households: average **2.0%** reduction, range 1.4–3.3%. Real, replicated, cheap — and not a doubling.
- **Provincial norms — Goldstein, Cialdini & Griskevicius (2008), *JCR*.** A descriptive-norm card ("the
  majority of guests reuse their towels") produced more reuse than a standard environmental appeal (44.1% vs
  35.1%), and a *provincial* norm naming guests in this room did better still (49.3%). **Failed to reproduce**
  in Bohner & Schlüter (2014), *PLOS ONE*, N=724 and N=204: the standard message performed as well or better
  and the room-level norm was inconsistent. Baseline reuse in the German hotels was 70–90% against 35–50% in
  the US, so a ceiling effect is a plausible explanation — but the honest summary is that the provincial-norm
  result is not settled. Cite the mechanism, never the percentages.
- **Boomerang / descriptive-norm backfire — Schultz, Nolan, Cialdini, Goldstein & Griskevicius (2007),
  *Psychological Science*.** Households shown the neighbourhood average moved toward it from both directions:
  heavy users reduced, light users *increased*. Adding an injunctive cue — approval or disapproval of the
  behaviour — eliminated the increase.
- **Cialdini, *Influence*,** for the underlying principle: under uncertainty people take others' behaviour as
  evidence about what is correct.

## Credibility and reciprocity

- **Source credibility — Hovland & Weiss (1951), "The Influence of Source Credibility on Communication
  Effectiveness".** The identical message produced different opinion change depending on the source it was
  attributed to. Credibility decomposes into expertise and trustworthiness, judged separately.
- **Reciprocity — Regan (1971), the Coke study; Strohmetz, Rind, Fisher & Lynn (2002), "Sweetening the Till",
  *Journal of Applied Social Psychology*.** Small field studies, largest lift where the gift felt
  personalised. Direction only; the percentages are not worth quoting. This is the corpus's canonical
  treatment of reciprocity — `ux-psychology/references/principles.md` points here for it.
- **Reasons / "because" — Langer, Blank & Chanowitz (1978).** Compliance with a line-cutting request rose when
  any reason followed "because", including a contentless one. Two limits that get dropped in retelling: the
  effect held for a *small* request and disappeared for a large one (20 pages), and it is routinely
  over-generalised into "just add the word because".

## Scarcity

**Worchel, Lee & Adewole (1975), the cookie-jar experiment.** Cookies from a nearly-empty jar were rated more
desirable than identical cookies from a full one, and most desirable when the scarcity had just been created
by demand. Scarcity is read as a signal both of value and of a closing option.

The legal layer that constrains acting on this — UCPD Annex I point 7, FTC Act §5, and the enforcement record
— belongs to `ethical-persuasion-audit/references/legal-layer.md`. That file also states the corpus position
on naming company-specific enforcement amounts: don't, because outcomes are jurisdiction- and date-specific
and frequently appealed.

## Writing, errors and endings

- **Writing for the web — Morkes & Nielsen (1997), NN/g.** The same site rewritten five ways; concise text,
  scannable layout and objective (non-promotional) language each improved a composite usability score, with
  the combination best of all. What it is before you quote the famous "124%": one small study (n=51), a
  composite metric, and 1997. Direction safe, number not a constant.
- **Error-message guidance — Nielsen's usability heuristics (1994), heuristic 9:** express errors in plain
  language, indicate the problem precisely, suggest a solution.
- **Peak-end rule — Kahneman, Fredrickson, Schreiber & Redelmeier (1993); Redelmeier & Kahneman (1996), the
  colonoscopy field study.** Remembered experience is dominated by its most intense moment and its ending, and
  is surprisingly insensitive to duration. Well supported as a description of remembered utility in its
  original paradigms. "End on a high note" is a loose extrapolation from it, and does not license
  manufacturing a celebration on a task someone performs forty times a day.

## Plain language

- **Oppenheimer (2006), *Applied Cognitive Psychology*.** Four experiments manipulating vocabulary complexity;
  needlessly complex writing consistently *lowered* the judged intelligence of the author, mediated by
  fluency.
- **The neighbourhood is shaky.** The best-known adjacent claim — that hard-to-read fonts improve reasoning
  (Alter et al., 2007) — failed a large multi-lab replication (Meyer et al., 2015). Lean on the plain-language
  finding, not on fluency as a universal dial.
- **Expert preference — Trudeau (2012), *The Public Speaks*, N=376.** Preference for plain English over legal
  jargon rose with the reader's expertise and with the complexity of the issue. A preference survey rather
  than a comprehension test, so hold it lightly; the mechanism — an expert under time pressure skims for the
  decision-relevant token, and dense prose defeats skimming — is what carries the advice.

## First-person CTA copy

**Michael Aagaard / ContentVerve, via Unbounce (c. 2013).** One landing-page A/B test, one page, reported
+90% CTR, quoted everywhere and replicated nowhere checkable. The mechanism is plausible — the label reads as
the user's own sentence about their own outcome — and the circulating number is not. This is the corpus's
canonical treatment; `decision-screen-design` and `ux-psychology` both point here rather than restating it.

## Claims deliberately not made

Numbers that could not be traced to a named source are stated qualitatively in this skill rather than
invented. In particular: no "X% of users abandon after N seconds" figure appears anywhere in this skill,
because none of the widely circulated ones has a locatable origin — see
`ux-psychology/references/principles.md` §Commonly repeated claims that do not hold up, which is the entry
this refusal defers to. No loss-aversion multiplier. No conversion lift attributed to a first-person CTA. No
fine attributed to a named company for a named pattern.
