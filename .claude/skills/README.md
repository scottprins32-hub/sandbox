# UX psychology skill set

Eight skills that turn behavioural science into interface decisions. They are project-agnostic — written to
be copied into any future website or app repo, not tied to this codebase.

Claude loads these automatically when a task matches a skill's `description`. You can also invoke one
directly by name.

## The set

| Skill | The question it answers |
|---|---|
| **ux-psychology** | Router and master principle catalogue. **Start here.** Forces a product diagnosis before any technique gets picked, then points at the right specialist. |
| **attention-and-hierarchy** | Where does the eye go on this screen, and is that where it needs to be? Preattentive features, Gestalt grouping, whitespace, scan patterns, contrast and accessibility as hierarchy tools. |
| **friction-and-flow** | Why do people abandon a flow they meant to finish? Cognitive load, Hick's/Fitts's laws, form design, defaults and choice architecture, and perceived performance — because waiting is friction. |
| **persuasive-copy** | Does the wording change the decision? Framing, anchoring, social proof, CTA labels, error messages, pricing presentation. Cheapest lever in the set. |
| **onboarding-activation** | How fast does a new user reach the moment the product's value becomes real? Time-to-value, progressive disclosure, endowed progress, deferred signup, empty states that teach. |
| **habit-loop-design** | Why would they come back tomorrow? Fogg's B=MAP, the Hook model, variable reward, investment and stored value, streaks, notification design — and an honest account of when a habit loop is the wrong goal entirely. |
| **ethical-persuasion-audit** | Is this persuasion or manipulation, and is it legal? Deceptive-pattern taxonomy with fixes, plus the EU (DSA, GDPR, UCPD, CRD) and US (FTC, ROSCA) layer most developers don't know is enforced. |
| **behavioral-metrics** | Did any of it work, and what did it break? Activation definition, retention curves, guardrail metrics, honest A/B testing, and what to do when you don't have the traffic for one. |

## How to use them

**Building something new** — read `ux-psychology` first. Its diagnosis step (voluntary or assigned use? in
fast or out fast? how often? who pays? where is the value moment?) determines which of the others apply.
Skipping it is how consumer-app engagement mechanics end up in a tool someone's employer handed them.

**Fixing something broken** — go to `behavioral-metrics` to find where the funnel actually leaks before
reaching for techniques. The most common failure in this domain is optimising a step that wasn't the problem.

**Reviewing a PR** — each skill ends with a ship checklist written to be run against a screen or a diff.

**Shipping anything persuasive** — `ethical-persuasion-audit` is a gate, not an appendix. Several patterns it
covers are unlawful in the EU, which is often the more useful argument to have in a review.

## The source framing

This set was built from a video teaching six principles: smart defaults, never start the user at zero, give
value before asking, let users build before they commit, frame the ask as a loss, and control the first
number. All six are covered, distributed across the skills that own them.
`ux-psychology/references/six-principles.md` keeps that framing intact — each principle with its before/after
example, the skill that covers it in depth, and a corrected citation.

Four statistics the video quotes did not survive checking: the car-wash loyalty study is Nunes & Drèze (USC
and UCLA), not Columbia; the jam study's choice-overload effect averages near zero across 50 replications;
the "70–90% never change defaults" and "free samples increase sales 2,000%" figures have no locatable source.
The advice holds regardless — the corrections are in that file so the numbers don't get repeated in a design
review or an interview.

## Evidence quality

These skills cite named researchers and studies, and deliberately flag the findings that are contested or
that failed replication rather than repeating them as fact. Ego depletion, the Zeigarnik effect, the decoy
effect, choice overload and charm pricing all carry caveats; `ux-psychology/references/principles.md` grades
every entry as Robust / Mixed / Contested / Folklore and closes with a list of commonly repeated claims that
don't hold up — useful when someone cites folklore in a design review.

Where a claim could not be attributed to a source, it is stated qualitatively rather than with an invented
number.

## Portability

Copy the whole `.claude/skills/` directory into another repo and it works there unchanged. Nothing in these
skills depends on this project's stack; code examples use React/Tailwind for illustration only.
