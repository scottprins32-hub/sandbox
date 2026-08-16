# Localisation and register

Read this before localising an interface, and whenever one product serves both an audience that can leave
(prospects, customers) and an audience that cannot (employees, contractors, benefit claimants, tenants).

The claim this document exists to make: **persuasive copy does not survive literal translation, because
persuasion is carried by the social relationship between writer and reader, and every language encodes that
relationship differently.** A sentence that reads as friendly in English can read as presumptuous,
patronising, or evasive in the target language while being a perfectly accurate translation.

---

## 1. Register is a decision you make whether or not you notice

English has one second person. Romanian, German, French, Spanish, Dutch, Portuguese, Russian, Hindi and many
others have at least two, and the choice is not stylistic — it states what you think your relationship to the
reader is.

| Language | Informal | Formal | Default for a stranger in a service context |
|---|---|---|---|
| Romanian | *tu* (`confirmi`) | *dumneavoastră* (`confirmați`) | Formal, especially for older or working-class readers |
| German | *du* | *Sie* | Formal, though consumer tech has shifted toward *du* |
| French | *tu* | *vous* | Formal — *tu* from a company reads as intrusive |
| Spanish (ES) | *tú* | *usted* | Mixed; *tú* is common in consumer, *usted* in finance/public sector |
| Dutch | *je* | *u* | *u* for institutions, *je* for consumer brands |

A translation memory or an LLM handed breezy English second-person copy will default to the informal, because
that is the closest register match to the *tone* — and thereby quietly make a decision about respect that
nobody in the team reviewed.

**Pick the register per surface, write it into the style guide, and enforce it in review.** It is not a
per-string judgement call; inconsistency within one product reads as sloppiness in a way it never does in
English.

```
Romanian, informal:  "Te rugăm să confirmi programarea."
Romanian, formal:    "Vă rugăm să confirmați programarea."
```

Both are "Please confirm your appointment." Only one is appropriate for a 58-year-old building
superintendent receiving an SMS from a company he did not choose to deal with.

---

## 2. One product, three registers

The common architecture — an internal admin console, a public marketing site, and a portal for the people
whose work the product actually tracks — is three audiences with three relationships. Sharing one voice
across them is the most common localisation failure, and it usually happens because the portal strings were
translated from the marketing strings.

| Surface | Reader | Can they leave? | Register | Test |
|---|---|---|---|---|
| Admin console (often English) | Expert operator, all day | Chose the tool | Terse, imperative, zero personality | Would this label still be right on the 400th read? |
| Public site (localised) | Prospect | Yes | Persuasive, specific, formal address by default | Would a competitor's claim like this be checkable? |
| Worker / citizen portal (localised) | Someone whose pay or housing depends on it | No | Plain, formal, certainty-first, no marketing, no gamification | Would this sentence be fine printed in a letter from an institution? |

The worker-portal test is the useful one. If a sentence would be strange in a formal letter — an exclamation
mark, a "🎉", a "Great job!", a badge, a streak, an upsell — it does not belong there.

```
Worker portal, before (English marketing voice translated literally, informal):
  "Grozav! Ai terminat tura! 🎉 Continuă tot așa!"
  → "Great! You finished your shift! Keep it up!" Reads as a manager patronising an adult.

Worker portal, after (plain, formal, certainty-first):
  "Tura din 14 august a fost înregistrată. Suma de 320 de lei va fi plătită pe 25 august.
   Dacă suma este greșită, contactați-l pe șeful de șantier până pe 20 august."
  → "Your 14 August shift is recorded. 320 lei will be paid on 25 August. If the amount is wrong,
     contact the site manager by 20 August."
```

The reader's four questions, in order: **what am I owed, when do I get it, what do I do next, who do I
contact if it's wrong.** Answer those and delete everything else. Nothing on that surface should be trying to
change their behaviour — they already have to be there.

Corollary: **do not run engagement mechanics on a captive audience.** Streaks, points, celebratory
animations and "you're on a roll!" copy are persuasion aimed at someone who has no choice, which is the
definition of the pattern `ethical-persuasion-audit` exists to catch.

---

## 3. What breaks when persuasive copy is translated

**Idioms and metaphors are the first casualty.** "Get up and running", "hit the ground running", "a
no-brainer", "level up", "under the hood" translate to nonsense or to something oddly literal. Write source
copy that is translatable: concrete verbs, no sports metaphors, no puns in strings that will be localised.

**Humour does not transfer, and it is worst in errors.** A joke that lands in the source language and misses
in the target reads as a broken string, not as a joke.

**Superlatives carry different legal weight.** "Best", "number one", "leading" are constrained comparative
advertising claims in several EU jurisdictions, and the substantiation standard is not the same as the US
one. Move claims toward the specific, verifiable form (move 2 in `SKILL.md`) and the problem mostly
disappears.

**Urgency reads differently.** Scarcity copy that is merely aggressive in one market reads as a scam signal
in another. And it is blacklisted under the EU UCPD when false regardless of market (see `SKILL.md` move 7).

**Politeness formulas are not one-to-one.** English "please" is grammatically light; in some languages the
equivalent construction is heavier and using it on every button makes the interface grovel. Conversely, some
languages expect a politeness marker where English uses a bare imperative, and dropping it reads as an order.

**Names, addresses, and honorifics.** Do not assume first/last name order, that everyone has both, that a
name fits your character limit, or that a title is safe to guess. Where a greeting matters, prefer a neutral
one over a wrongly gendered or wrongly familiar one.

---

## 4. Mechanics that break strings

**Never concatenate sentence fragments.** Gender, case, number and word order do not survive it.

```js
// Broken — the adjective, article and word order all depend on the noun in most languages
`${count} ${itemType} ${wasDeleted}`
t('deleted_prefix') + name + t('deleted_suffix')

// Correct — one message, one placeholder set, translator sees the whole sentence
t('items.deleted', { count, name })
// en: "{count, plural, one {# photo} other {# photos}} deleted from “{name}”"
// ro: "{count, plural, one {# fotografie} few {# fotografii} other {# de fotografii}}
//      au fost șterse din „{name}”"
```

**Use ICU plural categories, never `count === 1`.** Languages have between one and six plural forms.
Romanian has three: `one` (1), `few` (0 and numbers whose last two digits are 01–19), and `other`
(everything else — and `other` additionally requires the particle *de*):

```
1 zi        2 zile        19 zile        20 de zile        101 zile        120 de zile
```

A hand-rolled `count === 1 ? singular : plural` produces "20 zile", which is simply wrong, on every screen
that shows a count. The same applies to ordinals, gendered agreement, and any string where a number and a
noun meet.

**Never interpolate a translated fragment into a translated sentence.** `t('you have {x}', {x: t('3_items')})`
is the same bug wearing a different hat.

**Text expands.** Target strings routinely run longer than English, and short source strings expand
proportionally most — W3C's internationalisation guidance is the reference. Practical consequences: never
size a button to its English label, never rely on a fixed-width table header, test the longest supported
language in CI, and prefer wrapping over truncation for anything the user must read to decide.

**Dates, numbers, currency, addresses.** Format via `Intl`, never by hand. Romanian uses `.` for thousands
and `,` for decimals (`1.234,56 lei`) and lowercase month names (`14 august 2026`); guessing DD/MM vs MM/DD
is a real financial error, not a cosmetic one.

```js
new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(1234.56) // "1.234,56 RON"
new Intl.DateTimeFormat('ro-RO', { dateStyle: 'long' }).format(d)                      // "14 august 2026"
```

**Bidirectional and script issues.** If Arabic or Hebrew is on the roadmap, use logical CSS properties
(`margin-inline-start`, not `margin-left`) from the start; retrofitting is expensive. Line-break and
line-height behaviour differs for CJK.

**Mixed-language pages read as broken, not multilingual.** An untranslated English string inside a Romanian
page is interpreted as a bug — and it is worst exactly where trust is thinnest: errors, payment strings,
consent text, and anything about money or deadlines. Fail the build on missing keys in critical namespaces
rather than falling back silently to English.

---

## 5. Review process

- **Write source copy for translation**: short sentences, no idioms, no fragment concatenation, every string
  carrying a translator comment explaining context and who reads it. `Save` alone is untranslatable —
  is it a verb on a button or a noun in a heading?
- **Localise, don't translate, anything persuasive.** Marketing headlines, value propositions, CTAs and
  pricing pages should be *rewritten* in the target language by someone who knows the market, using the
  source as a brief. Everything else can be translated.
- **Have a native speaker of the target register review** anything that asks for money, consent, or personal
  data, and anything a captive audience reads. Not just a native speaker — someone who knows how an
  institution is expected to address that reader.
- **Screenshot review, not spreadsheet review.** Strings approved in a spreadsheet break in place: they
  overflow, they collide, the formality drifts between adjacent buttons.
- **Check numbers with the real formatter and real data.** Test 0, 1, 2, 19, 20, 21, 100, 101 for any
  language with a `few` category.
- **Keep one glossary of product terms per language**, with the decided translation for every concept, and
  enforce it. Elegant variation is a defect in every language, and worse in the ones where the reader is
  already carrying more grammatical load.
