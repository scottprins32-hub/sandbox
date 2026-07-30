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
