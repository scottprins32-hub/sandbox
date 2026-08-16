# Principle catalogue

The lookup table for this skill set. Use it when you half-remember an effect and need to know whether it is
real before you build on it, or when someone cites a "law" in a design review and you want to check it.

Entries are graded, because this field mixes replicated science with folklore that sounds identical:

| Grade | Means |
|---|---|
| **Robust** | Replicates widely, or is a direct description of how perception/motor control works. Build on it. |
| **Mixed** | Real under specific conditions; the conditions are usually what people drop. Build on it knowing the boundary. |
| **Contested** | Original result is challenged, failed replication, or has a plausible confound. Do not stake a design on it. |
| **Folklore / practitioner heuristic** | No primary study. May still be good advice — sound engineering judgment, just not evidence. |

A grade applies to the *claim as designers usually state it*, not to the underlying psychology. Miller's 7±2
is excellent science about digit span and folklore about menu length; it appears here as the latter.

The **Skill** line points at the sibling skill that covers the principle in depth: `attention-and-hierarchy`,
`friction-and-flow`, `persuasive-copy`, `onboarding-activation`, `habit-loop-design`,
`ethical-persuasion-audit`, `behavioral-metrics`.

---

## Contents

**[Perception & attention](#perception--attention)** — [Preattentive processing](#preattentive-processing) ·
[Gestalt grouping](#gestalt-grouping-principles) · [Von Restorff](#von-restorff-isolation-effect) ·
[Serial position](#serial-position-effect) · [Banner blindness](#banner-blindness) ·
[Inattentional & change blindness](#inattentional-and-change-blindness) · [Scan patterns](#scan-patterns-f-pattern-layer-cake) ·
[Aesthetic-usability](#aesthetic-usability-effect) · [50ms first impression](#the-50-millisecond-first-impression)

**[Memory & cognition](#memory--cognition)** — [Miller's law](#millers-law-7--2) · [Cowan's limit](#cowans-limit-4-chunks) ·
[Chunking](#chunking) · [Cognitive load theory](#cognitive-load-theory) · [Recognition over recall](#recognition-over-recall) ·
[Progressive disclosure](#progressive-disclosure) · [Generation effect](#generation-effect) · [Spacing effect](#spacing-effect) ·
[Picture superiority](#picture-superiority-effect) · [Zeigarnik](#zeigarnik-effect) · [Ovsiankina](#ovsiankina-effect) ·
[Processing fluency](#processing-fluency) · [Curse of knowledge](#curse-of-knowledge) ·
[Paradox of the active user](#paradox-of-the-active-user)

**[Decision & choice](#decision--choice)** — [Framing](#framing-effect) · [Anchoring](#anchoring) ·
[Loss aversion](#loss-aversion) · [Endowment effect](#endowment-effect) · [Default effect](#default-effect) ·
[Status quo bias](#status-quo-bias) · [Choice overload](#choice-overload) · [Decision fatigue](#decision-fatigue) ·
[Ego depletion](#ego-depletion) · [Decoy effect](#decoy-effect-asymmetric-dominance) ·
[Hyperbolic discounting](#hyperbolic-discounting) · [Sunk cost](#sunk-cost-fallacy) · [Charm pricing](#charm-pricing-99-endings)

**[Motivation & reward](#motivation--reward)** — [Fogg behaviour model](#fogg-behaviour-model-bmap) ·
[Self-determination theory](#self-determination-theory) · [Overjustification](#overjustification-effect) ·
[Variable-ratio reinforcement](#variable-ratio-reinforcement) · [Goal gradient](#goal-gradient-effect) ·
[Endowed progress](#endowed-progress-effect) · [IKEA effect](#ikea-effect) ·
[Implementation intentions](#implementation-intentions) · [Fresh start effect](#fresh-start-effect)

**[Social](#social)** — [Social proof](#social-proof-descriptive-norms) · [Authority](#authority) ·
[Reciprocity](#reciprocity) · [Scarcity](#scarcity) · [Commitment & consistency](#commitment-and-consistency-foot-in-the-door) ·
[Bandwagon](#bandwagon-effect) · [False consensus](#false-consensus-effect)

**[Emotion & memory of experience](#emotion--memory-of-experience)** — [Peak-end rule](#peak-end-rule) ·
[Negativity bias](#negativity-bias) · [Labour illusion](#labour-illusion--operational-transparency) ·
[Psychology of waiting](#psychology-of-waiting-lines) · [Halo effect](#halo-effect)

**[Interaction laws](#interaction-laws)** — [Hick's law](#hicks-law) · [Fitts's law](#fittss-law) ·
[Steering law](#steering-law) · [Doherty threshold](#doherty-threshold) ·
[Response-time thresholds](#response-time-thresholds-01--1--10-seconds) · [Jakob's law](#jakobs-law) ·
[Tesler's law](#teslers-law-conservation-of-complexity) · [Postel's law](#postels-law-robustness-principle) ·
[Affordances & signifiers](#affordances-and-signifiers) · [Gulfs of execution & evaluation](#gulfs-of-execution-and-evaluation) ·
[Slips vs mistakes](#slips-vs-mistakes)

**[Traps in your own reasoning](#traps-in-your-own-reasoning)** — [Goodhart's law](#goodharts-law) ·
[Novelty & Hawthorne effects](#novelty-and-hawthorne-effects) · [Survivorship bias in research](#survivorship-bias-in-user-research)

**[Commonly repeated claims that do not hold up](#commonly-repeated-claims-that-do-not-hold-up)**

---

## Perception & attention

### Preattentive processing
**What it says** — A small set of visual features (colour, size, orientation, motion, enclosure, position) is
processed in parallel across the whole visual field before focused attention arrives; a single such difference
"pops out" in roughly constant time regardless of how many distractors there are. Conjunctions of two features
do not pop out — they require serial search.
**Established by** — Treisman & Gelade (1980), feature-integration theory; extended by Wolfe's guided search.
**Use it for** — Choosing what carries emphasis. One preattentive channel per meaning: colour for status,
weight for hierarchy, position for grouping. This is the mechanism under "one loudest thing per screen".
**Evidence** — Robust.
**Watch out** — Pop-out requires a *unique* value. Six differently-coloured chips means no chip pops out. Also,
colour-only encodings fail for colour-blind users and in dark mode — pair colour with shape, icon or text.
**Skill** — `attention-and-hierarchy`

### Gestalt grouping principles
**What it says** — The visual system organises elements into groups automatically by proximity, similarity,
common region, closure, continuity, common fate (shared motion), and uniform connectedness. Grouping is
perceived before content is read.
**Established by** — Wertheimer (1923), Koffka (1935), Köhler; common region added by Palmer (1992), uniform
connectedness by Palmer & Rock (1994).
**Use it for** — Making structure legible without borders. Proximity (spacing) is the cheapest and strongest
grouping tool you have; a label 4px from its field and 24px from the next field needs no box.
**Evidence** — Robust as descriptions of perceptual organisation. The original *explanation* (brain field
forces) is dead; the phenomena are not.
**Watch out** — Proximity beats similarity when they conflict. If your spacing groups a label with the wrong
field, no amount of colour-coding fixes it. Card borders are usually a patch over a spacing bug.
**Skill** — `attention-and-hierarchy`

### Von Restorff (isolation) effect
**What it says** — An item that differs from a homogeneous set is better remembered and attended.
**Established by** — Hedwig von Restorff (1933).
**Use it for** — One visually distinct primary action per view; one highlighted plan in a pricing table.
**Evidence** — Robust for a single isolate in an otherwise uniform set.
**Watch out** — The effect is *relative*, and it dies the moment you have several isolates. Highlighting the
recommended plan works; highlighting three of four plans does nothing. Also, do not encode the isolation
purely in colour, or screen-reader and colour-blind users lose it entirely.
**Skill** — `attention-and-hierarchy`

### Serial position effect
**What it says** — In free recall of a list, items at the start (primacy) and end (recency) are remembered
better than the middle.
**Established by** — Ebbinghaus (1885); formalised by Murdock (1962).
**Use it for** — Ordering items where recall matters — put the most important nav item first and the
next-most last, not in the middle of a long list.
**Evidence** — Robust for the memory phenomenon in list recall.
**Watch out** — The lab task is recall of a memorised list. A visible menu is a *recognition* task with the
items on screen, so the effect is a weak analogy there. Placement in a UI is dominated by scan order,
salience and Fitts distance, not by primacy/recency. Use it for things people must remember later.
**Skill** — `attention-and-hierarchy`

### Banner blindness
**What it says** — Users learn to ignore regions and visual styles associated with advertising — right rails,
top strips, bright rectangular blocks with sales copy — even when those regions contain content they are
actively looking for.
**Established by** — Benway & Lane (1998); repeatedly confirmed in eye-tracking work by Nielsen Norman Group.
**Use it for** — Never put something essential in a shape that looks like an ad. Announcements that must be
seen belong inline in the content flow, in the product's own visual language.
**Evidence** — Robust.
**Watch out** — This generalises past ads. Anything that *looks* like a class of thing users have learned to
skip gets skipped: cookie-banner-shaped alerts, carousel slides, dismissible tip strips. If your important
message is styled like the thing everyone dismisses, it will be dismissed.
**Skill** — `attention-and-hierarchy`

### Inattentional and change blindness
**What it says** — People fail to notice fully visible, unexpected objects while attending to something else,
and fail to notice large changes to a scene that occur during a visual interruption.
**Established by** — Mack & Rock (1998); Simons & Chabris (1999) for inattentional blindness; Simons & Levin
(1997, 1998) for change blindness.
**Use it for** — Never announce state changes by silently mutating a distant part of the screen. A toast in
the corner while the user is typing in the centre is, for a meaningful share of users, invisible. Put
feedback where the eye already is, or make the change persist.
**Evidence** — Robust.
**Watch out** — "But it's right there on the screen" is not a defence in a usability session — it is the
finding. Self-dismissing toasts that carry the only copy of an error message are a reliable bug factory.
**Skill** — `attention-and-hierarchy`

### Scan patterns (F-pattern, layer cake)
**What it says** — Eye-tracking of web reading shows recurring gaze shapes: an F-shaped pattern over dense
unformatted text, a "layer cake" pattern over well-structured pages where the eye moves between headings, and
spotted/committed patterns depending on task.
**Established by** — Nielsen Norman Group eye-tracking studies (Nielsen, 2006 onwards; Pernice, 2017).
**Use it for** — Front-load meaning: first two words of headings and bullets carry the message, because they
are often all that gets read.
**Evidence** — Mixed as a *law*. The patterns are real observations, but the F-pattern is a symptom of poorly
structured content, not a rule of human vision. Give the reader headings, and the pattern changes.
**Watch out** — Do not design *for* an F. Design so the F does not happen: headings, short paragraphs, front-loaded
keywords. The layer cake is the goal state.
**Skill** — `attention-and-hierarchy`

### Aesthetic-usability effect
**What it says** — More attractive interfaces are *perceived* as more usable, and their usability problems are
judged more forgivingly.
**Established by** — Kurosu & Kashimura (1995), ATM layout study; replicated by Tractinsky (1997); Tractinsky,
Katz & Ikar (2000), "What is beautiful is usable".
**Use it for** — Justifying visual polish as functional work, and for interpreting user research: pretty
prototypes attract softer criticism.
**Evidence** — Mixed. The correlation with *perceived* usability, especially before use, is well supported.
Whether beauty improves actual task performance is much weaker, and Hassenzahl (2004) argues the relationship
is largely about hedonic quality rather than usability. Aesthetic goodwill also erodes when a task actually
fails.
**Watch out** — Two failure modes: shipping a beautiful broken thing on the theory that beauty compensates,
and trusting positive feedback on a beautiful prototype. Test usability with tasks and timings, not opinions.
**Skill** — `attention-and-hierarchy`

### The 50-millisecond first impression
**What it says** — People form a stable judgment of a web page's *visual appeal* from a 50ms exposure;
ratings at 50ms correlate strongly with ratings at 500ms and with considered ratings.
**Established by** — Lindgaard, Fernandes, Dudek & Brown (2006), *Behaviour & Information Technology*.
**Use it for** — Above-the-fold visual quality on landing and marketing pages, where the first impression is
the whole first interaction.
**Evidence** — Robust *for the narrow claim*: visual appeal, judged from a screenshot.
**Watch out** — The routine overstatement is "users decide in 50ms whether to trust you / whether your product
works". The study measured aesthetic appeal, not trust, usability or conversion. Related work by Lindgaard's
group (2011) examined how appeal, trust and perceived usability relate — that is a separate, more nuanced
result. Quote the 50ms figure only about appearance.
**Skill** — `attention-and-hierarchy`

---

## Memory & cognition

### Miller's law (7 ± 2)
**What it says** — The span of immediate memory is about seven chunks of information, plus or minus two.
**Established by** — George Miller (1956), "The Magical Number Seven, Plus or Minus Two".
**Use it for** — Chunking things people must *hold in their head*: phone numbers, verification codes, account
numbers. Group digits — `4829 5510` beats `48295510`.
**Evidence** — Robust as a finding about immediate memory span for unrelated items. Folklore as a UI rule.
**Watch out** — This is the single most misapplied number in design. It says nothing about how many items a
*visible* menu should have — reading a menu is recognition with the items on screen, not memory. There is no
evidence base for "max 7 nav items". Miller himself was partly wry about the number. If you need a working-memory
figure, use Cowan's, and use it only for things not on screen.
**Skill** — `friction-and-flow`

### Cowan's limit (~4 chunks)
**What it says** — When rehearsal and chunking strategies are controlled for, the capacity of focused working
memory is closer to three or four items.
**Established by** — Nelson Cowan (2001), "The magical number 4 in short-term memory".
**Use it for** — Any step where a user must carry information *across* a boundary: a code from an email into a
form, a value from one screen into another, a comparison between pages.
**Evidence** — Robust, and the better number than 7±2 when you need one.
**Watch out** — The design conclusion is not "show fewer than four things". It is "make people hold nothing".
Show the order summary next to the address form; keep the code visible; let the comparison be side by side.
**Skill** — `friction-and-flow`

### Chunking
**What it says** — Capacity is measured in chunks, not items, and chunks are built from existing knowledge —
so an expert holds far more raw information in the same span.
**Established by** — Miller (1956); demonstrated dramatically by Chase & Simon (1973) with chess positions.
**Use it for** — Formatting input and output into meaningful groups (card numbers in fours, dates as
segments, long lists into labelled sections), and for explaining why experts and novices need different
information density in the same product.
**Evidence** — Robust.
**Watch out** — Chunking helps only when the grouping matches a structure the user recognises. Arbitrary
grouping adds visual noise without reducing load.
**Skill** — `friction-and-flow`

### Cognitive load theory
**What it says** — Working memory is limited, and load has distinct sources: *intrinsic* (the inherent
difficulty of the task), *extraneous* (imposed by how the material is presented), and germane (effort spent
building understanding). Learning and performance fail when total load exceeds capacity.
**Established by** — John Sweller (1988), in instructional design.
**Use it for** — Triage. You usually cannot reduce intrinsic load — a tax form is genuinely complex — so
attack extraneous load: inconsistent labels, split attention between instructions and inputs, unnecessary
jargon, layout that hides structure.
**Evidence** — Robust for the intrinsic/extraneous distinction and its instructional implications. The
germane-load construct has been contested and reformulated within the field; ignore it for UI purposes.
**Watch out** — "Reduce cognitive load" is often used to justify hiding necessary information, which just
moves load from reading to remembering and searching. Removing a needed field is not a load reduction.
**Skill** — `friction-and-flow`

### Recognition over recall
**What it says** — Recognising the right option from a set is far easier and more reliable than retrieving it
from memory unaided.
**Established by** — A basic finding of memory research; codified for interfaces as Nielsen's sixth usability
heuristic (1994).
**Use it for** — Show options rather than requiring typed magic strings; keep entered data visible on review
steps; put recently-used items where they can be picked; make commands discoverable as well as memorable.
**Evidence** — Robust.
**Watch out** — Recognition costs screen space and scanning time, so it is not free for expert users doing a
task hundreds of times a day — that population wants recall-based shortcuts (typed commands, keyboard paths)
*in addition to*, not instead of, the recognisable path.
**Skill** — `friction-and-flow`

### Progressive disclosure
**What it says** — Show the few options most users need, and move the rest behind a clearly labelled second
layer, so the common case stays simple without removing capability.
**Established by** — Practitioner heuristic; associated with Nielsen and Norman, and with Carroll's minimalist
"training wheels" work (Carroll & Carrithers, 1984) on hiding advanced functions from novices.
**Use it for** — Settings, advanced filters, optional form fields, power features in an otherwise simple flow.
**Evidence** — Mixed / practitioner heuristic. Sound and widely accepted; not a single quantified finding.
**Watch out** — It becomes harmful when what is hidden is *state* rather than *options*. Hiding whether
auto-renew is on, or which filters are active, is concealment, not disclosure. The second layer must be
labelled with what is inside it, not "Advanced".
**Skill** — `friction-and-flow`

### Generation effect
**What it says** — Information you produce yourself is remembered better than the same information you merely
read.
**Established by** — Slamecka & Graf (1978).
**Use it for** — Onboarding that has the user do the real task with their own data instead of watching a tour;
setup that asks the user to name/configure the thing rather than accepting a pre-made template silently.
Retrieval practice (Roediger & Karpicke, 2006) is the close cousin: being asked to produce an answer beats
re-reading it.
**Evidence** — Robust in memory research.
**Watch out** — Generation costs effort, and effort spent before the user has seen any value is the main
cause of onboarding abandonment. Use it for the *first real task*, not for a quiz standing between the user
and the product.
**Skill** — `onboarding-activation`

### Spacing effect
**What it says** — Learning distributed over time produces far better long-term retention than the same total
time massed together.
**Established by** — Ebbinghaus (1885); meta-analysed by Cepeda, Pashler, Vul, Wixted & Rohrer (2006).
**Use it for** — Teaching a product's model over the first several sessions instead of in one welcome modal.
Contextual hints at the moment of relevance beat a front-loaded tour, and they are spaced by construction.
**Evidence** — Robust — one of the best-replicated findings in psychology.
**Watch out** — "Spaced" does not license nagging. Spacing improves retention of things the user is trying to
learn; it does not make unwanted interruptions welcome.
**Skill** — `onboarding-activation`

### Picture superiority effect
**What it says** — Pictures are remembered better than words, plausibly because images get encoded both
visually and verbally.
**Established by** — Paivio & Csapo (1973); dual-coding theory (Paivio).
**Use it for** — Icons paired with labels for repeated-use items; diagrams for structural explanations;
screenshots in empty states showing what the filled state looks like.
**Evidence** — Robust for concrete, distinctive images in memory tasks.
**Watch out** — It does not mean "icon instead of label". Abstract UI glyphs are not the concrete pictures the
research used, and unlabelled icons are a well-documented usability failure. Icon *plus* text is the pattern
the evidence supports.
**Skill** — `attention-and-hierarchy`

### Zeigarnik effect
**What it says** — Interrupted or incomplete tasks are remembered better than completed ones.
**Established by** — Bluma Zeigarnik (1927), in Kurt Lewin's group.
**Use it for** — At most, a soft argument for showing an incomplete profile or setup checklist.
**Evidence** — **Contested.** The replication record is poor: reviews of the follow-up literature find that a
minority of replication attempts reproduced the effect, and later work (e.g. Seifert & Patalano, 1991) found
it depends heavily on interruption type, task involvement and time spent. The narrow memory claim is what
fails; the everyday intuition that unfinished things nag at you is not the thing that was tested.
**Watch out** — Do not justify a design purely with "Zeigarnik". If a completion meter works, it works
through the goal-gradient and endowed-progress effects, which have far better support. Cite those instead.
**Skill** — `onboarding-activation`

### Ovsiankina effect
**What it says** — People spontaneously resume an interrupted task when given the opportunity, even without
being asked.
**Established by** — Maria Ovsiankina (1928), same research group as Zeigarnik.
**Use it for** — Preserving and surfacing partial state: saved drafts, "continue where you left off", an
abandoned cart that still exists. Make resumption possible and one click away.
**Evidence** — Mixed. Better regarded than the Zeigarnik effect, but from the same thin early-20th-century
literature and not extensively re-tested with modern methods.
**Watch out** — The design value here does not depend on the effect being strong: preserving user work is
correct regardless. Build the resume affordance because losing work is bad, not because of a 1928 study.
**Skill** — `onboarding-activation`

### Processing fluency
**What it says** — Information that is easy to process feels more true, more familiar, more likeable and less
risky, and people misattribute that ease to the content itself.
**Established by** — Reber, Winkielman & Schwarz (1998); Schwarz and colleagues on fluency and judgment.
**Use it for** — Plain language, high contrast, familiar layout, short sentences, pronounceable names — all
of which buy perceived trustworthiness on top of comprehension.
**Evidence** — Mixed. Core fluency effects on liking and truth judgments hold up reasonably. The famous
inverse claim — that *disfluent* fonts improve reasoning or learning — did not survive large replications
(Meyer et al., 2015, with thousands of participants). Do not make things harder to read on purpose.
**Watch out** — Fluency is also how misinformation works: repetition breeds familiarity breeds belief. That
cuts both ways ethically — a smooth, familiar-looking flow lowers scrutiny of what is being agreed to, which
is exactly why consent screens must be *hard* to skim past.
**Skill** — `persuasive-copy`

### Curse of knowledge
**What it says** — Once you know something, you cannot accurately model a mind that does not, and you
systematically overestimate how obvious your knowledge is to others.
**Established by** — Camerer, Loewenstein & Weber (1989) for the economic formulation; the widely quoted
tapper/listener study (Newton, 1990) is an unpublished dissertation — cite it as an illustration, not evidence.
**Use it for** — Every label, error message and empty state you write. You are the worst possible judge of
whether your own product's terminology is clear.
**Evidence** — Robust for the core effect (also known as hindsight bias's cousin).
**Watch out** — Internal review cannot detect this by construction — everyone in the room has the knowledge.
The only reliable fix is five minutes with someone who has never seen the product, which is cheaper than any
of the alternatives you will consider instead.
**Skill** — `persuasive-copy`

### Paradox of the active user
**What it says** — Users do not read documentation or tutorials, even when reading would demonstrably save
them time. They start acting immediately and learn from the consequences.
**Established by** — Carroll & Rosson (1987).
**Use it for** — Stop building tours nobody finishes. Put the teaching *inside* the first real action:
sensible defaults, inline hints at the point of use, forgiving errors that explain the model when the user
hits it.
**Evidence** — Robust as a repeatedly observed behaviour pattern.
**Watch out** — The correct response is not "users are lazy, force the tour". It is to accept that the first
action will happen before any reading, and to make that first action survivable and instructive.
**Skill** — `onboarding-activation`

---

## Decision & choice

### Framing effect
**What it says** — Logically equivalent descriptions of the same outcome produce systematically different
choices, depending on whether the outcome is described as a gain or a loss.
**Established by** — Tversky & Kahneman (1981), the "Asian disease" problem.
**Use it for** — Wording of any consequential choice: "Keep my 40% discount" versus "No thanks"; "90% fat
free" versus "10% fat"; retention offers framed around what is already held.
**Evidence** — Robust — risky-choice framing is among the effects that replicated in large multi-lab efforts
(Many Labs, Klein et al., 2014).
**Watch out** — Framing and lying are adjacent. A frame that changes the *decision* while the user still
understands the *facts* is persuasion; one that leaves them mistaken about the facts is deception, and
"confirmshaming" opt-outs ("No, I don't care about saving money") are on the wrong side of the line and
explicitly targeted by EU consumer regulators.
**Skill** — `persuasive-copy`

### Anchoring
**What it says** — An initially presented number pulls subsequent numeric judgments toward itself, even when
the anchor is uninformative.
**Established by** — Tversky & Kahneman (1974).
**Use it for** — Deciding which number the user sees first: list price before discount, annual price before
monthly equivalent, recommended tier before cheaper tiers, a sensible pre-filled quantity or budget.
**Evidence** — Robust for relevant anchors; among the effects that replicated in Many Labs. Effects from
blatantly arbitrary anchors (random spins, ID digits) are weaker and more context-dependent than the pop
version suggests.
**Watch out** — Fake anchors are a compliance problem, not just an ethical one: "was" prices that were never
charged breach EU price-indication rules and attract FTC attention in the US. Anchor with real numbers.
**Skill** — `persuasive-copy`

### Loss aversion
**What it says** — Losses loom larger than equivalent gains, so people work harder to avoid giving something
up than to acquire the same thing.
**Established by** — Kahneman & Tversky (1979), prospect theory.
**Use it for** — Framing retention and completion around what is already the user's: "you'll lose your saved
filters", "your draft will be deleted", "keep your current rate".
**Evidence** — Mixed. The general asymmetry has broad support in risky choice, but Gal & Rucker (2018)
mounted a serious challenge to loss aversion as a general principle, and the folk constant "losses hurt
about twice as much" is not a stable parameter — it varies enormously by domain, magnitude and framing.
**Watch out** — Two abuses. First, manufacturing a loss the user never had ("your discount expires in 10:00"
on a timer that resets) — that is a deceptive pattern. Second, loss framing raises anxiety, which is
counterproductive in high-stakes flows like medical or financial forms where you want calm accuracy.
**Skill** — `persuasive-copy`

### Endowment effect
**What it says** — People value a thing more once they own it, so willingness-to-accept exceeds
willingness-to-pay for the same object.
**Established by** — Thaler (1980); Kahneman, Knetsch & Thaler (1990), the mugs experiments.
**Use it for** — Trials that create real ownership: let the user build a workspace, import data, invite a
colleague, and configure things during the trial. What they have built is what makes the ending expensive.
**Evidence** — Mixed. Plott & Zeiler (2005) showed the classic gap can be eliminated by controlling for
subject misconceptions and procedure, and the debate is not settled. The applied version — people are
reluctant to abandon accumulated work and configuration — is on much safer ground than the mug-trading
theory, and is also plain switching cost.
**Watch out** — Do not hold user data hostage as an ownership lever. Export must stay easy and complete;
GDPR portability makes this legal ground, not just an ethical preference.
**Skill** — `onboarding-activation`

### Default effect
**What it says** — Whichever option is pre-selected is chosen far more often than it would be if the user had
to choose actively, because the default requires no decision, carries an implicit recommendation, and is the
reference point everything else is judged against.
**Established by** — Johnson & Goldstein (2003) on organ-donation opt-in versus opt-out rates across European
countries; Madrian & Shea (2001) on 401(k) automatic enrolment.
**Use it for** — This is the highest-leverage single decision in most flows. Set every default to what a
well-informed user in the common case would choose: sensible plan, sensible notification frequency, sensible
privacy setting.
**Evidence** — Robust, with large field effects.
**Watch out** — Defaults are strongest exactly where users are least sure, which is why using them to
pre-select the outcome that benefits you is both the most tempting and the most punished move in this
catalogue. Pre-ticked consent boxes are invalid under GDPR (confirmed in *Planet49*, CJEU 2019) and
pre-selected paid add-ons breach the EU Consumer Rights Directive. Do not quote a "70–90% of users never
change defaults" figure — that number circulates without a traceable source.
**Skill** — `friction-and-flow` (ethics gate: `ethical-persuasion-audit`)

### Status quo bias
**What it says** — People disproportionately stick with the current state, beyond what preference or
switching cost explains.
**Established by** — Samuelson & Zeckhauser (1988).
**Use it for** — Two directions. Reduce it when you want change: make switching reversible, pre-migrate the
user's data, offer a "try it and switch back anytime" path. Respect it when the user is already served:
do not force a redesign on people mid-workflow without an opt-out period.
**Evidence** — Robust.
**Watch out** — It is the reason "we'll just add a settings toggle" fails as a strategy. Almost nobody visits
settings; the default *is* the product for most users.
**Skill** — `friction-and-flow`

### Choice overload
**What it says** — Too many options can reduce motivation to choose and satisfaction with the choice made.
**Established by** — Iyengar & Lepper (2000), the supermarket jam-tasting study (24 versus 6 jams).
**Use it for** — Pricing pages, plan selection, template galleries, onboarding paths.
**Evidence** — **Mixed, and much weaker than folklore.** Scheibehenne, Greifeneder & Todd (2010) meta-analysed
63 conditions from 50 experiments (N ≈ 5,036) and found a mean effect size close to zero with large
variance. Chernev, Böckenholt & Goodman (2015) found the effect appears reliably only under specific
moderators — high choice-set complexity, difficult decision task, unclear preferences, no articulated goal.
**Watch out** — "Reduce the number of options" is not automatically an improvement, and can hurt when users
have clear, varied preferences (nobody wants a supermarket with three products). The safe reading: the
problem is rarely option *count*, it is the absence of structure — no categories, no comparison, no default,
no recommendation. Add structure before you delete options.
**Skill** — `friction-and-flow`

### Decision fatigue
**What it says** — Making many decisions in sequence degrades decision quality and pushes people toward the
easy default option.
**Established by** — Danziger, Levav & Avnaim-Pesso (2011), the Israeli parole-board study.
**Evidence** — **Contested.** Weinshall-Margel & Shapard (2011) showed case ordering was not random
(represented prisoners went earlier; prisons were processed in blocks), and Glöckner (2016) demonstrated by
simulation that the reported effect magnitude is implausibly large for the proposed mechanism. The authors
maintain the effect survives reanalysis. Treat as unresolved.
**Use it for** — At most, a mild argument for putting the hardest decisions early in a flow and not stacking
twelve consequential choices in a row.
**Watch out** — Do not build a business case on it, and especially do not use it to justify pressuring users
late in a funnel ("they're tired, they'll accept"). That is the manipulative reading of a contested finding.
**Skill** — `friction-and-flow`

### Ego depletion
**What it says** — Self-control draws on a limited resource that is consumed by use, so exerting willpower on
one task reduces it on the next.
**Established by** — Baumeister, Bratslavsky, Muraven & Tice (1998).
**Evidence** — **Contested to failed. Do not build on it.** A 23-lab Registered Replication Report (Hagger et
al., 2016) found an effect indistinguishable from zero, and the literature carries strong evidence of
publication bias. The glucose-restores-willpower variant is in worse shape still.
**Use it for** — Nothing. It is listed here so you can identify it when someone cites it.
**Watch out** — It gets invoked to justify both good advice ("don't put ten decisions in a row") and bad
("hit them with the upsell when they're worn down"). The good advice stands on cognitive load and task
complexity, which are far better supported. Make that argument instead.
**Skill** — `behavioral-metrics` (as a claim to challenge)

### Decoy effect (asymmetric dominance)
**What it says** — Adding a third option that is clearly worse than one existing option but not the other
shifts share toward the option that dominates it.
**Established by** — Huber, Payne & Puto (1982).
**Evidence** — **Mixed to contested.** The effect is reliable with the original paradigm — abstract options
described by two numeric attributes. It largely disappears with realistic stimuli: Yang & Lynn (2014) ran
many attempts across a wide range of real product categories and found reliable effects in only a small
minority; Frederick, Lee & Baskin (2014) documented cases where the decoy *reduced* the target's share
(a repulsion effect). Adding images, qualitative descriptions or more than two attributes tends to kill it.
**Use it for** — Little, in practice. If your pricing page has three tiers, design them so each is genuinely
right for a segment.
**Watch out** — "Add a deliberately bad middle tier to push people to premium" is the canonical bad advice
here. It probably will not work with real products, and if users notice the decoy is fake you have spent
trust for nothing. Comparison clarity beats decoy engineering.
**Skill** — `persuasive-copy`

### Hyperbolic discounting
**What it says** — People discount future rewards steeply and inconsistently, valuing immediate payoffs far
above delayed ones, and reversing their own preferences as the moment approaches.
**Established by** — Ainslie (1975); quasi-hyperbolic (β-δ) model, Laibson (1997).
**Use it for** — Time-to-value budgeting. A benefit that arrives after setup is worth much less than one that
arrives during it, which is why "show value before asking for effort" beats explaining the value first. Also
explains why annual plans need an immediate sweetener, and why "save 2 hours a week" motivates worse than
"see your first result now".
**Evidence** — Robust as a description of intertemporal choice.
**Watch out** — It also predicts users will accept a bad long-term deal for a small immediate gain. If your
conversion depends on that, you are the entity exploiting the bias, and the churn will find you later.
**Skill** — `onboarding-activation`

### Sunk cost fallacy
**What it says** — People continue investing in something because of what they have already spent, even when
the remaining decision should be forward-looking.
**Established by** — Arkes & Blumer (1985).
**Use it for** — Understanding why partially completed setups get finished and why visible investment
increases follow-through. It is the honest half of the endowment/IKEA cluster.
**Evidence** — Robust as a behavioural phenomenon.
**Watch out** — Deliberately engineering sunk cost — making people enter twenty minutes of data before
revealing the price — is a classic deceptive pattern ("drip pricing" / "the sunk-cost funnel"), and hidden
mandatory fees revealed late are actively enforced against by consumer regulators. Show price before effort.
**Skill** — `ethical-persuasion-audit`

### Charm pricing (.99 endings)
**What it says** — Prices ending in 9 sell better than round prices, attributed to left-digit anchoring —
$3.99 is encoded as "three-something".
**Established by** — Anderson & Simester (2003), field experiments in women's-apparel catalogues; left-digit
mechanism explored by Thomas & Morwitz (2005).
**Use it for** — Consumer, discount-positioned price points where "this is a good deal" is the message you
want. Treat the choice of ending as a positioning signal, and make it deliberately either way.
**Evidence** — Mixed, and far weaker than folklore. In Anderson & Simester's experiments $39 outsold both $34
*and* $44 for the same item — but the effect was stronger for new items, and weaker when "Sale" cues were
also present, supporting the interpretation that the 9-ending signals "this is a discount" rather than
tricking arithmetic. That mechanism predicts it does nothing, or backfires, for premium and B2B positioning.
**Watch out** — Do not apply it reflexively to SaaS. $49/mo versus $50/mo is unlikely to move an enterprise
buyer and may cheapen the positioning. Round numbers signal quality and confidence; 9-endings signal deals.
Pick the signal you want.
**Skill** — `persuasive-copy`

---

## Motivation & reward

### Fogg behaviour model (B=MAP)
**What it says** — A behaviour occurs when motivation, ability and a prompt converge at the same moment.
If the behaviour is not happening, one of the three is missing.
**Established by** — BJ Fogg (2009), *A Behavior Model for Persuasive Design*.
**Use it for** — Diagnosis before prescription. It is the fastest triage tool in this set: is the user
unmotivated, unable, or un-prompted? Each has a different fix, and teams reliably reach for the motivation
fix (better copy, bigger incentive) when the real problem is ability.
**Evidence** — Practitioner model, not a validated equation — the multiplicative form is a mnemonic, not a
measured relationship. It is nonetheless the most useful frame available, because it forces the right question.
**Watch out** — Motivation is expensive, volatile and mostly outside your control; ability is engineering and
yours to change. When in doubt, cut steps before writing persuasion.
**Skill** — `habit-loop-design`

### Self-determination theory
**What it says** — Intrinsic motivation depends on three needs: autonomy (I chose this), competence (I'm
getting good at this), and relatedness (this connects me to people I care about). Support them and motivation
sustains itself; undermine them and it collapses.
**Established by** — Deci & Ryan (1985, 2000).
**Use it for** — The difference between a habit loop that serves the user and one that farms them. Autonomy:
real settings, easy exit, no forced paths. Competence: visible skill growth, shortcuts as users improve,
errors that teach. Relatedness: genuine collaboration, not fabricated social pressure.
**Evidence** — Robust; one of the most extensively supported motivation frameworks, across education, work
and health domains.
**Watch out** — Streaks and points can *undermine* autonomy and competence when they become the reason for
acting. Ask what remains if you deleted the points; if the answer is nothing, you built a slot machine.
**Skill** — `habit-loop-design`

### Overjustification effect
**What it says** — Rewarding someone for an activity they already enjoyed can reduce their intrinsic
motivation for it once the reward stops.
**Established by** — Lepper, Greene & Nisbett (1973), the children's drawing study; meta-analysed by Deci,
Koestner & Ryan (1999).
**Use it for** — Deciding whether to gamify. Reward the behaviours people are *not* already motivated to do
(completing a boring setup step), not the ones they love. Informational feedback ("you've reviewed 40 items")
is safer than controlling rewards ("earn 40 points!").
**Evidence** — Mixed leaning robust. The Deci/Ryan meta-analysis finds expected tangible rewards undermine
intrinsic motivation for initially interesting tasks; Cameron, Banko & Pierce (2001) dispute the breadth of
that conclusion. The safe reading: verbal/informational feedback is generally safe, expected tangible
rewards for already-enjoyed behaviour are risky.
**Watch out** — This is why gamification often produces a spike then a deeper trough: you replaced the user's
own reason for acting with yours, and then took yours away.
**Skill** — `habit-loop-design`

### Variable-ratio reinforcement
**What it says** — Rewards delivered on an unpredictable schedule produce higher, more persistent response
rates than predictable ones, and extinguish more slowly.
**Established by** — Ferster & Skinner (1957), operant conditioning schedules.
**Use it for** — Understanding why feeds, notifications and loot boxes are hard to stop checking. Occasionally
useful in legitimate form: the reward for opening a work tool is naturally variable (sometimes there's
something important), and you do not need to manufacture that.
**Evidence** — Robust in operant conditioning. Mixed as an explanation of specific product behaviour — the
mapping from pigeon schedules to human app use is an analogy, not a measured mechanism.
**Watch out** — This is the most abusable entry in the catalogue and the one most likely to attract
regulation (loot-box rules already exist in several jurisdictions). Deliberately withholding available value
to make its arrival unpredictable is manipulation by any reasonable test. Also: stop saying "dopamine hit" —
dopamine tracks prediction error and wanting rather than pleasure (Berridge & Robinson), and the pop version
explains nothing.
**Skill** — `habit-loop-design` (gate with `ethical-persuasion-audit`)

### Goal-gradient effect
**What it says** — Effort increases as perceived distance to a goal decreases — people accelerate near the
finish line.
**Established by** — Hull (1932) in animal learning; demonstrated in consumers by Kivetz, Urminsky & Zheng
(2006) with coffee-shop reward cards.
**Use it for** — Progress indicators on any multi-step flow, ordered so early steps are easy and progress is
visible. Show "2 of 5" rather than an unquantified spinner; show a nearly-complete profile bar.
**Evidence** — Robust in its domain, with supporting field data.
**Watch out** — The gradient only pulls if the goal is one the user actually wants. A progress bar toward
*your* goal ("complete your profile" when the profile benefits your data model) is noise, and a fake progress
bar that jumps to 90% then stalls damages trust for a one-time gain.
**Skill** — `onboarding-activation`

### Endowed progress effect
**What it says** — Giving people artificial head-start progress toward a goal increases the rate at which they
complete it, even when the actual work required is identical.
**Established by** — Nunes & Drèze (2006), *Journal of Consumer Research*. In their car-wash field study,
customers given a 10-stamp card with 2 stamps already applied completed it at about 34%, versus about 19% for
customers given an 8-stamp card with none — same eight purchases required.
**Use it for** — Never start the user at zero. Setup checklists that count account creation and email
verification as completed steps; profiles pre-populated from OAuth data; a workspace that already contains a
sample project.
**Evidence** — Robust — a well-designed field study with lab support. (Note: it is frequently miscredited to
Columbia; Nunes and Drèze were at USC and UCLA respectively.)
**Watch out** — The head start must be real progress, not a lie. Marking a step "complete" that the user has
not done, and that you will then ask them to do, converts the technique into a trust cost.
**Skill** — `onboarding-activation`

### IKEA effect
**What it says** — People value things they built themselves more highly than equivalent things they did not.
**Established by** — Norton, Mochon & Ariely (2012), *Journal of Consumer Psychology*.
**Use it for** — Trials and free tiers where the user configures, customises and populates something before
being asked to pay. Investment creates attachment, and it is also honest: they genuinely have more to lose.
**Evidence** — Mixed. Replicated in several settings, but the original work itself found the effect depends
on *successful* completion — labour that ends in failure or abandonment produces no added value.
**Watch out** — It is not a licence to make setup laborious. Effort only creates attachment when it produces
something the user is proud of. Pointless work produces resentment, and the difference is whether the output
is visibly theirs.
**Skill** — `onboarding-activation`

### Implementation intentions
**What it says** — Specifying *when, where and how* you will act ("when X happens, I will do Y") substantially
increases follow-through compared with holding a goal alone.
**Established by** — Gollwitzer (1999); meta-analysed by Gollwitzer & Sheeran (2006), with a medium-to-large
average effect across nearly a hundred studies.
**Use it for** — Habit formation done honestly. Instead of "we'll remind you daily", ask the user to pick the
moment: "When do you want your summary? — with morning coffee / end of workday". Anchoring a new behaviour to
an existing routine is the single most evidence-backed habit technique available to a product.
**Evidence** — Robust.
**Watch out** — The user must specify it, not you. A default time you chose is a notification schedule, not
an implementation intention, and does not carry the effect.
**Skill** — `habit-loop-design`

### Fresh start effect
**What it says** — Temporal landmarks (new year, new month, birthday, a new job) increase people's willingness
to pursue goals by creating a psychological break with a past self.
**Established by** — Dai, Milkman & Riis (2014), *Management Science*.
**Use it for** — Timing win-back campaigns, plan changes and habit prompts around genuine landmarks — start of
a quarter, a new project, return from leave — rather than at arbitrary intervals.
**Evidence** — Mixed. The original field evidence is reasonable; effect sizes are modest and the broader
literature is still thin.
**Watch out** — Manufacturing fake landmarks ("your new week starts now!") is transparent and cheapens real
ones. Use landmarks that exist in the user's life, not in your cron schedule.
**Skill** — `habit-loop-design`

---

## Social

### Social proof (descriptive norms)
**What it says** — People infer correct behaviour from what similar others do, most strongly under
uncertainty. Descriptive norms ("most people in your situation do X") change behaviour more than abstract
appeals.
**Established by** — Cialdini (1984); sharpened by Goldstein, Cialdini & Griskevicius (2008), where hotel
towel-reuse messages citing what previous guests *in that same room* did outperformed general environmental
appeals.
**Use it for** — Specificity is the whole game. "Used by 12 teams at your company" beats "Join 50,000 users".
Reviews from someone in the reader's segment beat a star average. Named logos beat a count.
**Evidence** — Robust for the mechanism; magnitude varies widely by context.
**Watch out** — Two failure modes. First, the boomerang effect (Schultz et al., 2007): telling people that
most others do the undesirable thing normalises it — "only 12% of users enable 2FA" is an argument against
enabling it. Pair descriptive with injunctive norms. Second, fake or unverifiable social proof (invented
counts, stock-photo testimonials, "18 people are viewing this" fabrications) is unlawful in the EU under the
UCPD and actionable by the FTC in the US.
**Skill** — `persuasive-copy`

### Authority
**What it says** — People defer to credible expertise and to signals of legitimate authority, particularly in
unfamiliar domains.
**Established by** — Cialdini's synthesis; historically anchored to Milgram (1963), whose archives have since
been the subject of serious methodological critique (Perry, 2013) — do not lean on it.
**Use it for** — Credibility signals where the user genuinely cannot evaluate the claim themselves: named
credentials on medical or financial content, security certifications, cited sources, real customer names.
**Evidence** — Mixed. Trust cues demonstrably affect credibility judgments; the strong Milgram-flavoured
"people obey authority" framing is not the finding you want in a product context.
**Watch out** — Borrowed authority (badges nobody verifies, "as seen in" for a passing mention) is cheap and
degrades quickly. Fake trust seals are both a deception issue and, in the EU, a prohibited practice.
**Skill** — `persuasive-copy`

### Reciprocity
**What it says** — Receiving something creates a felt obligation to give something back, even when the initial
gift was unrequested and small.
**Established by** — Regan (1971); field demonstration by Strohmetz, Rind, Fisher & Lynn (2002), where mints
given with the bill increased tips.
**Use it for** — Give value before asking for anything. Let people use the tool before signing up; produce the
report, then ask for the email to save it; answer the question in full before offering the paid product.
**Evidence** — Mixed leaning robust. The mechanism is well supported; the field studies are individually small
and the "2,000% sales lift from free samples" figure that circulates has no locatable source. State it
qualitatively.
**Watch out** — Reciprocity backfires when the "gift" is obviously instrumental. A gated ebook is not a gift,
and everyone knows what it costs. The strongest version is value delivered with no ask attached at all.
**Skill** — `onboarding-activation`

### Scarcity
**What it says** — Perceived limited availability increases desirability.
**Established by** — Worchel, Lee & Adewole (1975), the cookie-jar study — a small sample from a single lab,
not a large evidence base.
**Use it for** — Communicating genuine constraints: real stock levels, a real cohort start date, a real
capacity limit, a promotion with a real end date.
**Evidence** — Mixed. Widely believed, thinly replicated relative to its fame, and heavily confounded with
straightforward information effects (low stock is a real reason to hurry).
**Watch out** — Fabricated scarcity is the most enforced-against deceptive pattern in this catalogue: countdowns
that reset, "only 2 left" on unlimited digital goods, and phantom activity notifications are prohibited under
the EU UCPD and pursued by the FTC. Also, sustained artificial urgency raises anxiety and hurts long-term
trust even when it lifts one funnel step. If it is real, say the constraint plainly; if it is not, do not.
**Skill** — `ethical-persuasion-audit`

### Commitment and consistency (foot-in-the-door)
**What it says** — Agreeing to a small request increases the likelihood of agreeing to a larger related one,
because people act consistently with a self-image they have already enacted.
**Established by** — Freedman & Fraser (1966); meta-analysed by Burger (1999).
**Use it for** — Sequencing asks: one easy question before the long form; a free action before an account; a
small public commitment before a habit ("I'll review weekly").
**Evidence** — Mixed. The effect is real in meta-analysis but small and condition-dependent — it needs the
first request to be actually performed, non-trivial, and related to the second.
**Watch out** — This is the mechanism behind the multi-step form that hides its real length. If someone would
have declined had they seen the full ask up front, you have used the technique against them. Show the shape
of the whole flow.
**Skill** — `friction-and-flow`

### Bandwagon effect
**What it says** — Support for an option increases simply because it is perceived as popular or winning.
**Established by** — No single canonical experiment; the term comes from political-science work on poll
influence, where evidence is mixed and effects are small.
**Use it for** — Very little on its own. Where it applies, it is really social proof with better specificity —
use that entry.
**Evidence** — Mixed / weak.
**Watch out** — "Most popular" badges on pricing pages are usually not measuring popularity at all; they are
a recommendation in disguise. Label them honestly ("Best for teams of 5–20") — a recommendation you can
justify outperforms a popularity claim you cannot substantiate, and unsubstantiated popularity claims are
regulable.
**Skill** — `persuasive-copy`

### False-consensus effect
**What it says** — People overestimate how much others share their beliefs, preferences and behaviours.
**Established by** — Ross, Greene & House (1977).
**Use it for** — Discipline in your own team. Your engineers' mental model of the product is not the users'.
"Everyone knows what a webhook is" is this bias speaking, as is "nobody uses that feature".
**Evidence** — Robust.
**Watch out** — It compounds with the curse of knowledge and with survivorship bias in whoever shows up to
user interviews. The counter is instrumentation and recruiting outside your bubble, not more internal debate.
**Skill** — `behavioral-metrics`

---

## Emotion & memory of experience

### Peak-end rule
**What it says** — Retrospective evaluation of an experience is dominated by its most intense moment and its
ending, with surprisingly little weight given to duration ("duration neglect").
**Established by** — Kahneman, Fredrickson, Schreiber & Redelmeier (1993), cold-pressor experiments;
Redelmeier & Kahneman (1996) with colonoscopy patients, followed by a randomised trial (Redelmeier, Katz &
Kahneman, 2003) where a less painful added ending improved remembered experience.
**Use it for** — Budget your polish at the peak and the end: the moment of highest anxiety (payment, deletion,
submission) and the last thing before the user leaves (confirmation screens, empty search results, error
recovery, the cancellation flow). A tedious middle is more forgivable than a bad ending.
**Evidence** — Mixed leaning robust. The core findings replicate in the pain paradigms; generalisation to
long, multi-session, complex experiences like software use is an extrapolation, not a tested result.
**Watch out** — Do not use it to justify a genuinely painful middle. And note the cancellation flow is an
ending: making it hostile is what people remember and repeat, which is also why the FTC's "click to cancel"
direction and EU withdrawal rules exist.
**Skill** — `friction-and-flow`

### Negativity bias
**What it says** — Negative events, information and impressions have greater psychological weight than
equivalent positive ones, and take more positives to offset.
**Established by** — Baumeister, Bratslavsky, Finkenauer & Vohs (2001), "Bad is stronger than good";
Rozin & Royzman (2001).
**Use it for** — Prioritisation. One data-loss incident, one confusing error, one billing surprise outweighs
many small delights. Fixing the worst moment beats adding a new nice one — and error messages deserve as much
writing effort as the marketing page.
**Evidence** — Robust across a wide range of domains.
**Watch out** — It also means negative framing lands harder than you intend. Warning copy written for
emphasis ("You will permanently lose everything!") can produce anxiety and abandonment in flows where you
wanted care, not fear.
**Skill** — `persuasive-copy`

### Labour illusion / operational transparency
**What it says** — Showing the work being done on a user's behalf increases perceived value and satisfaction,
sometimes even when it makes the wait longer.
**Established by** — Buell & Norton (2011), *Management Science*, using a travel-search site that displayed
which airlines it was querying; extended to service settings by Buell, Kim & Tsay (2017).
**Use it for** — Non-trivial operations: show "Checking 43 sources… analysing… formatting" rather than a
featureless spinner. It converts dead time into evidence of value and reduces perceived duration.
**Evidence** — Mixed. The effect is real and replicated in several settings but bounded — it reverses when
waits get long, and the original work found the benefit does not extend indefinitely.
**Watch out** — Two lines not to cross. Do not fabricate work that is not happening (that is deception, and it
is discoverable). Do not add real delay to seem more valuable when the user's goal is speed — a professional
tool used fifty times a day should be instant, and the labour illusion is for the one-off computation, not
the routine action.
**Skill** — `friction-and-flow`

### Psychology of waiting lines
**What it says** — Perceived wait time is largely independent of actual wait time. Occupied time feels
shorter than unoccupied; unexplained waits feel longer; uncertain waits feel longer than known-length ones;
unfair waits feel longest of all; and anxiety inflates all of them.
**Established by** — David Maister (1985), *The Psychology of Waiting Lines* — a practitioner synthesis, later
supported by operations-management research including Buell's work above.
**Use it for** — Loading states. Determinate progress beats indeterminate; a stated estimate beats silence;
skeleton screens that show incoming structure beat a spinner; optimistic UI removes the wait from the user's
critical path entirely.
**Evidence** — Mixed / practitioner heuristic with converging support. The individual claims are well
observed; the framework is not a single study.
**Watch out** — A fake progress bar that stalls at 95% is worse than an honest spinner, because it converts
an uncertain wait into a *broken* one. If you cannot estimate, say what you are doing instead of pretending
to measure.
**Skill** — `friction-and-flow`

### Halo effect
**What it says** — A judgment on one salient attribute bleeds into unrelated judgments about the same object
or person, without the judge being aware of it.
**Established by** — Thorndike (1920); demonstrated with awareness probes by Nisbett & Wilson (1977).
**Use it for** — Explaining why visual quality, load speed and copy tone move trust ratings for features that
did not change, and why a single flagship feature can carry perception of a whole product.
**Evidence** — Robust.
**Watch out** — It contaminates your research. Users rating a polished prototype will rate its *content*
higher too. It also runs in reverse: one visibly broken element lowers confidence in your data handling, your
security and your competence, which is why stale copyright years and broken images cost more than they look.
**Skill** — `attention-and-hierarchy`

---

## Interaction laws

### Hick's law
**What it says** — Decision time increases logarithmically with the number of equally probable alternatives:
RT = a + b·log₂(n + 1).
**Established by** — Hick (1952); Hyman (1953).
**Use it for** — Arguing that adding a tenth option costs less than adding a second — the cost is
logarithmic, not linear — and that *categorising* options collapses one large decision into two small ones.
**Evidence** — Robust within its conditions: a small set of equally probable, well-learned alternatives with
a prepared simple response.
**Watch out** — Those conditions almost never hold in a UI. Reading unfamiliar menu labels is visual search
plus comprehension, which scales roughly linearly, not logarithmically. Hick's law is regularly cited to
justify hiding navigation behind a hamburger; that trade replaces a fast parallel scan with a hidden
sequential one, and usually loses. Use it as intuition about diminishing costs, not as a calculator.
**Skill** — `friction-and-flow`

### Fitts's law
**What it says** — Time to acquire a target is a function of the distance to it and its size:
MT = a + b·log₂(2D/W). Big and near is fast; small and far is slow.
**Established by** — Paul Fitts (1954); adapted for HCI and validated extensively by MacKenzie (1992).
**Use it for** — Touch-target sizing (WCAG 2.2 sets a 24×24 CSS px minimum for pointer targets; platform
guidance is larger, around 44pt on iOS and 48dp on Android), placing primary actions near where the pointer
or thumb already is, keeping destructive actions away from confirming ones, and exploiting screen edges —
edges and corners are effectively infinite in one dimension, which is why OS menu bars work.
**Evidence** — Robust — one of the best-validated quantitative models in HCI.
**Watch out** — It is a *speed* model, not an importance model: making the risky button huge makes it easy to
hit by mistake. The distance term is as important as size, and it is the one people forget — a large button
far from the flow of the eye and hand is not fast. On touch, the effective target is the finger contact
area, so visual size and hit area should be tuned separately (padding, not font-size).
**Skill** — `friction-and-flow`

### Steering law
**What it says** — The time to move through a constrained path (a tunnel) is proportional to its length
divided by its width — steering is much more expensive than pointing.
**Established by** — Accot & Zhai (1997).
**Use it for** — Cascading hover menus, narrow scroll tracks, drag-and-drop corridors and sliders. Diagonal
travel to a submenu across a thin strip is a genuine motor task that fails constantly; add hover tolerance
zones, delay menu dismissal, or use click-to-open instead.
**Evidence** — Robust.
**Watch out** — Steering costs are invisible to a developer with a large screen, a precise mouse and full
motor control. They are severe for touch, trackpads, tremor and low vision. Multi-level hover menus are the
recurring offender.
**Skill** — `friction-and-flow`

### Doherty threshold
**What it says** — When system response drops below about 400ms, user productivity rises sharply, because the
person stays inside a continuous flow of thought rather than context-switching.
**Established by** — Walter Doherty & Ahrvind Thadani (1982), "The Economic Value of Rapid Response Time",
IBM Systems Journal, based on productivity data from IBM mainframe terminal users.
**Use it for** — Setting a budget for interaction feedback: acknowledge input in well under half a second,
even if the real work takes longer. Optimistic UI exists to hit this.
**Evidence** — Mixed. The paper and its productivity data are real; the popular framing — 400ms as a
perceptual threshold beyond which software becomes "addictive" — is a much later gloss on a study of 1980s
mainframe text terminals. Treat 400ms as a good engineering budget, not a discovered constant of the human
nervous system.
**Watch out** — Do not confuse acknowledgement with completion. Sub-400ms should apply to *feedback*
(button state, skeleton, optimistic write); a 5-second server operation is fine if the user was told
immediately that it started.
**Skill** — `friction-and-flow`

### Response-time thresholds (0.1 / 1 / 10 seconds)
**What it says** — Roughly: 0.1s feels instantaneous and needs no indicator; 1s keeps the flow of thought
uninterrupted but is noticeable; beyond about 10s attention leaves the task entirely and the user needs a
progress indicator and a way to do something else.
**Established by** — Robert B. Miller (1968), "Response time in man-computer conversational transactions";
Card, Robertson & Mackinlay (1991); popularised for the web by Nielsen (1993).
**Use it for** — Deciding what feedback each operation needs: nothing, a spinner or skeleton, or a determinate
progress indicator with a cancel path.
**Evidence** — Robust as a durable design heuristic; the specific boundaries are round numbers from older
research, not precise measurements.
**Watch out** — The 10-second limit assumes the user has a reason to wait. On the modern web, tolerance for
an unexplained wait is far lower, and the correct target is almost always "acknowledge immediately, complete
in the background".
**Skill** — `friction-and-flow`

### Jakob's law
**What it says** — Users spend most of their time on other sites, so they expect your site to work the same
way as all the others they know.
**Established by** — Jakob Nielsen (2000) — **practitioner heuristic, no primary study.** Related empirical
work exists on prototypicality and first impressions of web pages, but the "law" itself is an aphorism.
**Use it for** — Not reinventing conventions with no upside: cart icons top-right, logo home-links, underlined
links, standard form controls, expected keyboard shortcuts. Novelty in navigation buys nothing and costs
learning.
**Evidence** — Folklore as a law; sound as advice.
**Watch out** — It is not an argument against ever differing — every improvement was once non-standard. The
question is whether the deviation is where your value lives. Deviate in your core differentiator; conform
everywhere else. Also, "everyone does it" includes deceptive patterns; convention is not a justification.
**Skill** — `friction-and-flow`

### Tesler's law (conservation of complexity)
**What it says** — Every system has an irreducible amount of complexity. The only question is who absorbs it:
the engineer, or the user.
**Established by** — Larry Tesler at Xerox PARC, 1980s — **practitioner heuristic, no primary study.**
**Use it for** — Resisting "simplification" that is really offloading. Address autocomplete, smart date
parsing, automatic timezone detection, and inferring file type all move complexity from the user to your
code, where it is paid once instead of by every user every time.
**Evidence** — Folklore as a law; excellent as a design stance.
**Watch out** — It cuts the other way too: some complexity genuinely belongs to the user because only they
have the information (which of your three accounts to bill). Hiding *that* behind an inference produces
confident wrong behaviour, which is worse than a question.
**Skill** — `friction-and-flow`

### Postel's law (robustness principle)
**What it says** — Be conservative in what you send, liberal in what you accept.
**Established by** — Jon Postel, RFC 760/761 (1980), about TCP/IP implementations — **a protocol design
maxim, not a UX study.**
**Use it for** — Input handling. Accept phone numbers with spaces, dashes and country prefixes; accept dates
in several formats; strip whitespace from pasted codes; accept card numbers with or without spaces.
Normalise silently, echo back what you understood. A validation error for a format you could have parsed is
a self-inflicted wound.
**Evidence** — Practitioner heuristic. Note that the IETF has since partly repudiated it for protocols
(RFC 9413 argues excessive leniency causes long-term interoperability decay). The critique is about protocol
ecosystems, not human input fields, where it remains good advice.
**Watch out** — Liberal acceptance must not become silent misinterpretation. Show the normalised value
("we read this as 4 March 2026") so the user can catch a wrong guess, especially for ambiguous date formats.
**Skill** — `friction-and-flow`

### Affordances and signifiers
**What it says** — An affordance is a possible action offered by the relationship between an object and an
actor; a *signifier* is the perceivable cue that tells the user the action exists. Screens have almost no
real affordances — they run entirely on signifiers.
**Established by** — Gibson (1979) for affordances; Norman (1988) applied it to design and introduced
"signifier" in the 2013 revision precisely because designers had been misusing "affordance" to mean "cue".
**Use it for** — Ensuring interactive things look interactive: buttons that read as pressable, links that are
distinguishable without colour alone, drag handles, focus rings, hover and active states, disabled states
that explain themselves.
**Evidence** — Robust as a conceptual framework; the specific cues are convention-dependent (see Jakob's law).
**Watch out** — Flat and minimal styling regularly strips signifiers to nothing, producing screens where
users cannot tell what is clickable. If a control needs a hover to reveal that it exists, it does not exist
on touch.
**Skill** — `attention-and-hierarchy`

### Gulfs of execution and evaluation
**What it says** — Two gaps separate a user from a system: the gulf of execution (I know what I want but not
how to make the system do it) and the gulf of evaluation (the system did something but I can't tell what, or
whether it worked). Good design narrows both.
**Established by** — Norman (1986), in *User Centered System Design*.
**Use it for** — Diagnosing "confusing" as a specific defect. Execution problems need better signifiers,
labels and discoverability. Evaluation problems need feedback, visible state, and honest system status.
Teams usually fix the first and neglect the second.
**Evidence** — Robust as a framework (the enduring skeleton of Nielsen's heuristics).
**Watch out** — Silent success is an evaluation gulf. If a save produces no visible change, users re-save,
double-submit, or leave believing it failed.
**Skill** — `friction-and-flow`

### Slips vs mistakes
**What it says** — Errors come in two kinds with two different fixes: *slips* (the right intention, wrong
execution — mistyping, misclicking, wrong row) and *mistakes* (the wrong intention, from a wrong mental
model). Slips are fixed by constraints, forgiveness and undo; mistakes are fixed by better feedback and
clearer models.
**Established by** — Norman (1981), "Categorization of action slips"; extended by Reason (1990).
**Use it for** — Deciding between a confirmation dialog and an undo. For slips, undo is strictly better —
confirmations get clicked through reflexively and stop protecting anything, whereas undo restores. For
mistakes, a confirmation that *states what will happen* ("this deletes 340 records in 3 projects") can
actually help, because it corrects the model.
**Evidence** — Robust as a taxonomy, and a foundation of safety-critical design.
**Watch out** — The reflexive-click problem is why "type DELETE to confirm" exists — but reserve it for
genuinely irreversible destruction. Applied to everything, it just trains people to type faster.
**Skill** — `friction-and-flow`

---

## Traps in your own reasoning

### Goodhart's law
**What it says** — When a measure becomes a target, it ceases to be a good measure.
**Established by** — Charles Goodhart (1975), in monetary policy; the popular phrasing is Marilyn Strathern's
(1997). Campbell's law (1979) is the same idea in social measurement.
**Use it for** — Every engagement metric you optimise. Time-in-app rises when the product gets harder to use;
session count rises when you fragment tasks; DAU rises when you nag. Pair each target with a guardrail
(uninstall rate, notification opt-out, refund rate, support contacts, task success time).
**Evidence** — Robust as an observed pattern in organisations.
**Watch out** — It applies to your A/B tests. A variant can win the primary metric by cannibalising a
downstream one that the test was not measuring, and the horizon of most experiments is shorter than the
horizon of trust damage.
**Skill** — `behavioral-metrics`

### Novelty and Hawthorne effects
**What it says** — Behaviour changes because something is new, or because people know they are being
observed — not because the change is better.
**Established by** — Hawthorne studies (Roethlisberger & Dickson, 1939); the original interpretation has been
substantially challenged in re-analyses, though the general "observation changes behaviour" concern stands
on its own in experimental design.
**Use it for** — Interpreting launches. A redesign lifts engagement for two weeks then reverts; a new badge
gets clicked because it is new. Run tests long enough to see the decay, and segment new versus existing users
because they respond in opposite directions to change.
**Evidence** — Mixed as specific named effects, Robust as a methodological caution.
**Watch out** — The mirror image is change aversion: existing users get worse before they get better after a
redesign. Both mean a one-week readout is not a result.
**Skill** — `behavioral-metrics`

### Survivorship bias in user research
**What it says** — The users you can talk to are the ones who did not leave. Feedback channels, interview
recruits and NPS respondents systematically over-represent people the product already works for.
**Established by** — Wald's WWII aircraft-armour analysis (Statistical Research Group, 1943) is the canonical
illustration; the general form is standard selection bias.
**Use it for** — Balancing research. The most valuable interviews are with people who abandoned onboarding,
cancelled, or evaluated and chose a competitor — and they are the hardest to recruit, which is exactly why
nobody does it.
**Evidence** — Robust.
**Watch out** — This is how teams conclude "users love the new flow" from a sample composed entirely of people
who completed the new flow. Instrument the drop-offs; they cannot be interviewed but they can be counted.
**Skill** — `behavioral-metrics`

---

## Commonly repeated claims that do not hold up

Use this section when someone cites folklore in a design review.

**"Users decide in 50 milliseconds whether to trust your site."** Lindgaard et al. (2006) measured judgments
of *visual appeal* from screenshots. Not trust, not usability, not conversion. The appeal finding is solid;
the extension is not.

**"Never more than 7 items in a menu — Miller's law."** Miller (1956) measured immediate memory span for
unrelated items. A visible menu is recognition, not recall. There is no evidence base for a 7-item
navigation limit. If you need a working-memory number for things *not* on screen, Cowan's ~4 is the better one.

**"Three clicks or they leave."** Tested and not supported: Joshua Porter's work at User Interface Engineering
(2003) found no relationship between the number of clicks and task success or satisfaction. Users abandon
when they stop believing they are getting closer, not at a click count.

**"Users don't scroll / everything important must be above the fold."** Long since disproven by scroll-tracking
and eye-tracking data. What matters is whether the top of the page gives a reason to continue.

**"The average human attention span is 8 seconds, less than a goldfish."** Traced to a Statistic Brain page
with no verifiable methodology; journalists (including the BBC in 2017) have tried and failed to find the
underlying study. There is no such measurement, and "attention span" is not a single quantity.

**"It takes 21 days to form a habit."** From a plastic surgeon's clinical anecdote (Maltz, 1960) about
adjustment to appearance, not habit research. Lally et al. (2010) actually measured it: a median around 66
days, with enormous individual range (roughly 18 to 254 days in their sample), depending heavily on behaviour
complexity.

**"Fewer choices always sell more — the jam study proved it."** Iyengar & Lepper (2000) is one study. The
meta-analysis (Scheibehenne, Greifeneder & Todd, 2010; 50 experiments) found a mean effect near zero.
Structure, defaults and comparison aids are what help — not deletion.

**"Ego depletion — users run out of willpower, so ask when they're worn down."** Failed a 23-lab registered
replication (Hagger et al., 2016). Do not design around it, and be suspicious of anyone whose funnel strategy
depends on it.

**"The decoy tier will push people to premium."** Attraction-effect replications with realistic products are
mostly null and sometimes reversed (Yang & Lynn, 2014; Frederick, Lee & Baskin, 2014). Make each tier
genuinely right for someone instead.

**"Losses hurt exactly twice as much as gains."** The ~2× coefficient came from specific gambling paradigms.
It is not a transferable constant, and loss aversion's generality itself is contested (Gal & Rucker, 2018).
Loss framing often helps; the multiplier is not a number you can put in a model.

**"Charm pricing always lifts sales."** Evidence points to a signalling mechanism ("this is a discount"),
which means it can be neutral or harmful for premium and B2B products, and weaker where sale cues already
exist (Anderson & Simester, 2003).

**"Red buttons convert 21% better."** A single 2011 A/B test on one company's page (Performable/HubSpot). It
tested contrast against a green-heavy page, not a property of the colour red. Colour effects are
context-dependent; test your own page or use contrast reasoning.

**"Users only read 20% of the words on a page."** Nielsen's figure is a *model estimate* derived from
time-on-page assumptions, not a direct measurement of reading. Directionally useful, not a statistic to quote.

**"Every 100ms of latency costs X% of revenue."** Latency/conversion correlations from Amazon, Google, Akamai
and the Google/Deloitte "Milliseconds Make Millions" (2020) report are real company analyses, but they are
mostly observational and specific to those businesses and traffic mixes. The direction is reliable; the
magnitude does not transfer to your product. Cite it as "faster converts better", not with someone else's number.

**"Dopamine hits keep users hooked."** Dopamine signals reward *prediction error* and drives wanting rather
than pleasure (Berridge & Robinson's wanting/liking distinction). "Dopamine hit" as an explanation of app
engagement is neuro-flavoured storytelling that predicts nothing you can build against. Describe the schedule
and the reward, not the neurotransmitter.

**"70–90% of users never change the default."** Defaults are genuinely powerful (Johnson & Goldstein, 2003;
Madrian & Shea, 2001), but this specific percentage circulates with no traceable source. State the effect,
not the number.

**"Free samples increase sales by 2,000%."** No locatable source. Reciprocity is real; this figure is not.
