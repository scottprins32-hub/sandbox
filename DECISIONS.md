# DECISIONS.md

Assumption log per the build spec §1.4: when the spec is silent, the boring,
reversible option is chosen and recorded here. Notes the spec explicitly asked
to carry live here too.

## Notes for the founders (carried from the spec)

- **2026-07-30 — Partnership money flow (§2, spec-mandated note):** the operating
  company is hers (Romanian SRL); Scott is paid a monthly platform/services fee
  invoiced by his own entity to her company (cross-border B2B; nothing in writing
  yet). Under the micro-enterprise regime her company pays 1% tax on REVENUE, so
  the fee does not reduce her tax; it only moves cash. An EU cross-border B2B
  service fee typically reverse-charges VAT. **Accountant confirms both.** The fee
  amount lives in Settings and shows as a cost line in the Simulator.
- **2026-07-30 — Part-time floor value (§4):** using 1,513.75 lei/month
  (35% × 4,325). One research pass computed 1,444 on a reduced base; accountant to
  confirm. Exposed in the Simulator's constants drawer.

## Sales findings the founders should read

- **2026-07-31 — The published competitor rate is below our direct cost.**
  Building the offer generator surfaced this and it changes the pitch. A
  competitor's published list price for a 3-floor block interpolates to ~325
  lei/month. Scara's *direct* cost for that same block at 2 visits/week is
  515.25 lei (labour 420.25 + consumables 50 + travel 45). Nobody serves a
  block twice a week, on declared wages, for 325 lei. Whoever quotes that is
  either cleaning far less often or not declaring the labour, which in Timiș
  (Romania's #1 county for undeclared-work enforcement, 40,000 lei per person)
  is the association's risk, not just theirs. The offer screen says this in
  plain language whenever it applies, because it is the argument for the price.
- **2026-07-31 — Do not take 3,566 lei into a competitive pitch.** That number
  is what a captive landlord pays (5.1x the researched 700 lei market rate for
  a 3-floor block at 2x/week). The offer builder flags any quote above 2x
  market, per the §6 guardrail. For a fresh association, the tool's recommended
  opening price is max(1.5 x direct cost, market rate).

## Compliance layer (add-on)

- **2026-08-02 — The catalogue holds 26 records, not 24.** The add-on's Section A
  definition of done says "24 records present", but its own tables specify 26
  (3 DDD + 6 fire + 3 gas + 3 structure + 6 waste + 5 conditional). Per the rule
  that the legal data is research output and must not be "improved", all 26 are
  entered verbatim and the test asserts 26. No record was dropped to match a
  count.
- **2026-08-02 — DDD cadence set to the stricter quarterly.** The table gives
  "3/year national; Timișoara requires quarterly" and the verification note says
  to apply the strictest until legal confirmation, so `ddd_dezinsectie` encodes
  4/year with both figures in `sourceNote` and the note preserved.
- **2026-08-02 — Performer inferred for five records, flagged as inferred.** The
  conditional table (lift, PRAM, playground, lead inventory) gives no performer
  column. Where an authorisation is named in the statute (ISCIR, authorised
  electrical lab) the record is `authorised_third_party`; `plumb_inventar` is
  `us` because the cited text requires only inventory and reporting. Each says
  so in `sourceNote` or `needsVerification` rather than presenting the inference
  as research.
- **2026-08-02 — Additive columns on `buildings`** (`has_gas`, `has_lift`,
  `has_basement`, `has_playground`), permitted by add-on §1.2. They drive which
  obligations apply. Existing rows default to false; the seed sets gas and
  basement true for the Fântânii blocks.
- **2026-08-02 — `igienizare`, never `dezinfecție`, for the bin service** (§2.2).
  The service line is `igienizare_pubele`. `ddd_dezinfectie` in the catalogue is
  the legal obligation itself, marked `authorised_third_party`: the company
  coordinates it and never performs it.
- **2026-08-02 — The compliance calendar defaults to one building.** Org-wide it
  renders 23 obligations × every building (a 21,000px page). §4 describes it as
  a per-building screen, so it opens on the first building with an explicit
  "toate imobilele" option.
- **2026-08-02 — Largest-exposure list deduplicates by obligation.** Across four
  buildings the same uncovered obligation filled the widget with repeats of one
  name; it now shows each named risk once with the count of buildings affected.

## Design system (uploaded Procesverbal_Scara.html)

- **2026-08-04 — Tokens extracted and applied everywhere.** Ink #1E1B15, paper
  #F7F5F0, green #2E6B4F / deep #1F4A37, lines #E2DED4 / #CFC9BB, rust #9C3B25,
  amber #7C5A17; Instrument Sans (text) + Space Grotesk (display numbers).
  Documents implement the template in `src/server/pdf/theme.ts`; the web app's
  CSS palette was aligned to the same values.
- **2026-08-04 — The website ships the design typefaces too** (superseding the
  earlier system-font-stack note, at the founder's request). Instrument Sans
  and Space Grotesk load via `next/font/local` from the same TTFs the PDFs
  embed — still hermetic, no network fetch at build time. Space Grotesk
  carries display headlines and the big stat numbers, matching the template's
  stat boxes.
- **2026-08-04 — Ligatures disabled in PDFs.** pdf-lib mis-advances
  multi-codepoint glyphs: every "fi" ("Verificat", "Beneficiarul") rendered
  broken with two independent Instrument Sans builds. `liga/rlig/calt` are
  disabled at embed time; verified clean rendering and text extraction.
- **2026-08-04 — Photo annex wording kept honest.** The template's footer says
  photos are "anexate acestui document"; generated protocols do not embed the
  photos, so the footer states they are available in the app instead. The
  template's "Recuperată" status is not rendered either — the data model has no
  recovery link between visits, and inventing one on a signed document would be
  false. Missed-then-recovered shows as one Ratată row plus the recovery
  sentence in Observații.
- **2026-08-04 — Space Grotesk source.** The @expo-google-fonts build fails
  fontkit parsing; the bundled TTFs come from the typeface's official 2.0.0
  release instead. Instrument Sans comes from fonts.gstatic.com statics (full
  Romanian diacritic coverage verified in the test suite's generated PDFs).

## Compliance layer, phases 8-9

- **2026-08-04 — Walk evidence is stamped server-side.** Every checkpoint scan
  and finding gets the server's clock (§5: never trust client clocks). A
  mutation replayed from the offline queue is stamped when it lands — the
  honest time for a record that says "this reached us". Walk and finding ids
  are client-generated so replays are idempotent, never duplicated.
- **2026-08-04 — QR codes deep-link; in-app scanning is the phone camera.**
  The printed code encodes `/portal/tur?c={code}`; the native camera opens it
  and the app drops the cleaner into the right walk. No in-app camera-decode
  library — the walk screen lists every checkpoint as a tappable row, which is
  also the required camera-fails fallback, so hardware never blocks the record.
- **2026-08-04 — The monthly document upgrades itself.** With control walks in
  the month it renders as Raport lunar de control și întreținere (sections
  1-5, photo annex, the §5 disclaimer footer); with none it stays the plain
  proces-verbal, so buildings that only buy cleaning see no change. The photo
  annex is capped at 40 photos to keep the file bounded; visits and walks
  beyond the cap remain in the app.
- **2026-08-04 — `annual_reports` table added.** The add-on's schema list has
  no home for generated annual PDFs; the document shelf needs them per
  building-year. Additive table (building_id, year, pdf_file_key), one row per
  building-year, regeneration replaces the file.
- **2026-08-04 — Certificate upload records execution when there is none.**
  "Încarcă document" attaches the file to the obligation's most recent event.
  With no history at all it records the execution too (a certificate in hand
  is evidence the work happened) — that moves last-done and next-due exactly
  like Marchează efectuat.
- **2026-08-04 — Simulator attach rates model revenue only.** The three
  recurring per-building lines (control walk, compliance calendar, green
  space) carry no marginal cost model: the walk rides on a normal cleaning
  visit and coordination time sits in overhead, and inventing a cost model the
  research does not give would be false precision. The caption says so.
  Per-apartment and per-job lines are excluded — their monthly value depends
  on data the Simulator does not model.
- **2026-08-04 — Offer exposure sums the whole applicable subset.** A prospect
  has no compliance history in our system, so "Expunere maximă conform legii"
  on the ofertă is the sum of statutory maximums for every applicable
  obligation, labelled as informational statutory maximums (§2.6), never a
  prediction.

## Growth add-on (add-on 2)

- **2026-08-04 — The base package takes 109 minutes a visit, not 90.** The task
  catalogue's every-visit tasks for a standard 3-floor walk-up (no lift) sum to
  109 minutes — **21% above the 1.5 h the finance module prices on**, just
  outside the 20% band the add-on set as its alarm. The catalogue is the
  audited data, so the number stands and the test prints it loudly on every
  run. This is a real decision for the founders, not a rounding error: either
  trim the base package, or raise `hoursPerVisit`, which raises labour cost and
  therefore the price floor (labour is derived, not assumed — see the §5.2
  note). Nothing was silently adjusted to make the assumption hold.
- **2026-08-04 — `uniqueVsMarket()` returns 23 tasks, not "roughly a dozen".**
  The add-on's §5 predicts about twelve; applying its own rule
  (`competitorCoverage <= 2`) to its own audit tables yields 23. The data wins
  over the summary, as with the 24-vs-26 obligations count. Every task §5 names
  is present except lift doors on each floor, which the audit itself puts at 3
  firms, above the threshold. The offer lists all 23 — a longer list of things
  no competitor publishes is a stronger section, not a weaker one.
- **2026-08-04 — `appliesIf` added to the task type.** The add-on's type block
  omits it but its own lift table says "appliesIf the building has one" and
  `tasksForPackage(buildingFlags)` must filter by has_lift / has_basement /
  has_green. Four values: `has_lift`, `has_basement`, `has_green`,
  `has_parking`.

## Fixes

- **2026-08-04 — The admin app is English again.** The compliance add-on was
  written Romanian-first and leaked into the `(app)` routes, against the §0
  language rule (English admin; Romanian Portal, public page and documents).
  Every admin string is now English, driven off label maps so the two
  languages cannot drift: `CATEGORY_LABEL_EN`, `STATUS_LABEL_EN`,
  `PERFORMER_LABEL_EN`, `TREND_LABEL_EN`, plus `nameEn` on elements and
  `labelEn`/`definitionEn` on the condition scale. `trendLabel` became
  `trendKey` returning a key, so the admin renders English and the annual
  report Romanian from one source.
- **2026-08-04 — The catalogue's research notes are English too**, at the
  founder's request, superseding the "keep the research prose Romanian" call
  above. All 57 `fineNote` / `salesNote` / `needsVerification` / `sourceNote`
  strings were translated. Citations, act names, fine ranges, dates and
  deadlines are carried over verbatim, and every hedge kept its force
  ("De confirmat" → "To be confirmed", "Surse contradictorii" → "Sources
  conflict"). Verified mechanically (no number or citation lost against the
  pre-translation file) and by three independent reviewers, which caught three
  real errors: "la maximum 3 ani" had become "at most every 3 years", reversing
  a mandatory maximum interval into a permissive frequency cap; `proces-verbal`
  had become "protocol", which in English reads as a procedure rather than the
  signed record of work done; and `buletin` had become "certificate",
  overstating what an emergency-lighting test produces. All three are fixed.
  The notes are admin-only — the type now says so, because piping them into a
  Romanian client document would print English at a client.

- **2026-08-04 — Four kinds of Romanian deliberately stay in the admin.**
  (1) Data written by people — a tenant's issue, a cleaner's finding, a
  contractor's name — is real content, not UI, and translating it would
  misrepresent what the app stores. (2) Text destined for a Romanian reader:
  the copy-paste owner message and the printed QR cards, both now under
  English labels. (3) The Romanian legal name of each obligation, shown beside
  its citations, because that is the term you quote to a contractor or an
  inspector. (4) Catalogue research prose (`fineNote`, `salesNote`,
  `needsVerification`), which §1.4 of the add-on forbids "improving" — the
  labels around it are English.

- **2026-08-04 — Page routes normalise to lowercase.** Reported as "after
  entering the correct password I am rerouted to a 404". The Vercel runtime
  logs told the whole story: `GET /SIM 307` → `POST /gate 303` (passcode
  accepted) → `GET /SIM 404`. A phone keyboard capitalises the first letter of
  a typed address, Next routes are case-sensitive, and the gate faithfully
  returned the founder to the path they had asked for. Middleware now 308s any
  mixed-case page path to its lowercase form, before the passcode check, so it
  works signed in or out. `/api/*` is deliberately excluded: file keys are
  case-sensitive and one of them is `raport-anual-PROIECT-{year}-{id}.pdf`.

- **2026-08-04 — The passcode gate is server-rendered and works without
  JavaScript.** Reported as "on /sim I can't enter a password". The form read
  `useSearchParams()` inside a `<Suspense>` boundary with no fallback, so Next
  excluded it from the server HTML entirely: `curl /gate` returned zero
  `<form>` elements and the input appeared only after the client chunk
  hydrated. On a slow phone the page was a heading and nothing else. It is now
  a plain server-rendered form posting to a server action — verified working
  with JavaScript disabled. The `next` parameter is validated server-side
  (`//evil.com` and absolute URLs fall back to `/sim`), closing an open
  redirect the client version also had. `e2e/gate.spec.ts` asserts on the raw
  HTML so a client-only regression fails the suite.

## Founder overrides of the spec

- **2026-08-04 — The free-month guarantee is removed, at the founder's
  request.** The original spec (§9) mandated three public-page promises, the
  third being "o lună gratuită dacă nu suntem la nivel". It is gone from the
  public page and from the ofertă's "Ce primiți" list. Nothing else referenced
  it, so no contract or document text needed changing. The public page now
  carries two promises (dated photos, signed monthly proces-verbal); both are
  things the product actually produces, which was the point of that section.

## Build decisions

- **2026-07-30 — Autonomous session, plan approval:** built in a remote
  Claude Code session with no live user to approve the plan mid-run. The §1
  process contract was adapted: the plan was produced first, logged, and executed
  phase-by-phase with one commit per phase, so each phase's stop-point summary is
  reviewable in the final report and in git history.
- **2026-07-30 — Vercel deploy step:** this environment has no Vercel
  credentials, so deploys cannot be triggered from here. The repo is
  Vercel-ready (no writable-filesystem assumptions in prod paths; Turso/R2
  env-gated). Connecting the GitHub repo to Vercel is a one-time manual step,
  documented in README.
- **2026-07-30 — Open gate when SCARA_PASSCODE unset:** acceptance script #1
  requires a fresh clone to run with `npm i && npm run seed && npm run dev` and
  nothing else, so the passcode middleware only engages when SCARA_PASSCODE is
  set. Production (Vercel) must set it; README says so.
- **2026-07-30 — Fixture inconsistency in §5.2 (labour per building):** deriving
  strictly from §4 constants, labour = 13.0 h × (4,418 ÷ 166.667 ÷ 0.82 =
  32.3268 lei/h) = **420.25 lei**, direct 515.25, margin 3,050.75 (85.55%). The
  fixture table's 420.33/515.33/3,050.67 cannot be reproduced from the stated
  constants by any rounding order (it implies employer cost ≈ 4,418.9 lei). Per
  §1.6 the constants are the source of truth, so the implementation derives
  exactly and the unit tests assert the derived values, with the fixture-table
  values noted in the test file. Every other §5.2 fixture reproduces exactly.
- **2026-07-30 — Franchise-seams audit (§9, Phase 4):** all 59 exported repo
  functions across 14 modules take `orgId: string` and filter on it (verified
  by grep + per-file count); every `.from(schema.*)` read carries an org
  condition; `src/server/repo/repo.test.ts` asserts a cross-org read by id
  returns null; file keys are namespaced `{org_id}/...`; `orgs` supports
  multiple rows; org identity (name/CUI) drives the proces-verbal. The 5-step
  multi-city path is docs/FRANCHISE_LATER.md, deliberately unbuilt.
- **2026-07-30 — Public page copy, em-dash:** the spec's hero sub-line contained
  an em-dash; house design rules ban it in visible copy, so it was restructured
  with a comma, meaning unchanged. The §8-mandated seed client name
  "Proprietar privat — 4 clădiri" was kept verbatim (spec data, not copy).
- **2026-07-31 — Ofertă is not an invoice (§9 DO-NOT-BUILD #4):** the offer PDF
  is a commercial proposal. It carries no invoice series, no fiscal VAT
  breakdown and no payment instructions, and it states on its face that it is
  not a factură fiscală. Invoicing stays in dedicated e-Factura tools.
- **2026-07-31 — Sample proces-verbal is watermarked MODEL:** a specimen handed
  to a prospect must never be mistakable for a record of work delivered, so it
  carries a diagonal MODEL watermark, a caption saying it does not attest to
  services performed, and obviously placeholder names.
- **2026-07-31 — Seed guarantees a route today:** recurring visits fall on
  Mon/Thu, so the demo world looked empty when opened on other weekdays (found
  when the session date rolled to a Friday and two e2e specs broke). The seed
  now backfills today's route on any weekday.
- **2026-07-30 — Pinned scenario storage:** localStorage in Phase 1 per §10;
  kept on localStorage after Phase 2 too (single-device founders' tool; boring
  and reversible — a `scenarios` table can be added later without migration
  pain).
