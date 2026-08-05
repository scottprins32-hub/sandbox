# Scara

Building-services operations platform for a two-person cleaning startup in
Giroc, Timiș. One app, seven modules: **Simulator** (financial what-if
machine), **Atlas** (expansion research), **Ops** (the daily operating
system, including field prospecting and the compliance calendar),
**Services** (the audited task catalogue), **Portal** (cleaner-facing,
Romanian), a **public lead-gen page**, and a **per-building public status
page** residents reach from a QR on the notice board.

The product's core idea: sell cleaning with *proof* — timestamped photos at
every visit, a signed monthly proces-verbal, control walks over QR
checkpoints, and response commitments whose real monthly counts are
published on each building's public page.

## Quick start

```bash
npm i
npm run seed     # loads the demo world (4 buildings on Strada Fântânii, 2 cleaners, 2 weeks of history)
npm run dev
```

Open http://localhost:3000:

| URL | What | Language |
|---|---|---|
| `/` | Public lead-gen page (no passcode) | Romanian |
| `/b/<code>` | A building's public status page (no passcode) — visits, task table, live commitment counts, report-an-issue. Enable per building from Ops → its building page | Romanian |
| `/sim` | Simulator — sliders for price/buildings/team, VAT gauge, 24-month chart | English |
| `/atlas` | Commune cards, prospect pipeline (after first contact), document shelf | English |
| `/ops` | Today (Route / Money / Problems), buildings, visits, protocols, payroll, leads | English |
| `/ops/teren` | Field prospecting: routes, offline building capture, notice-board contacts with the GDPR duties built in | Romanian (used on the street) |
| `/ops/compliance` | The obligations calendar: what is due, who may perform it, what is on file | English |
| `/ops/offers` | Build a priced ofertă for one building, generate the Romanian PDF | English UI, Romanian PDF |
| `/compliance` | The legal obligations catalogue, with citations and fine ranges | English |
| `/services` | The 58-task service catalogue with market-coverage data | English |
| `/portal` | Cleaner portal. Demo login: phone `0721111111`, PIN `1111` (Ioana) | Romanian |

Printables live on each Ops building page: the A4 maintenance schedule, the
A6 visit cards (4-up), the A5 named-cleaner notice (consent-gated), and the
checkpoint QR sheet. The schedule and cards carry the building's public-page
QR once that page is switched on — never before, so no printed code can 404.

The header's role switcher simulates identities (Scott/admin, Adina/ops, or a
cleaner) — there is no real auth in v1, by design.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | dev server (local SQLite at `.data/scara.db`, auto-migrated) |
| `npm run seed` | migrate + wipe + load the demo world (also from Ops → Settings in dev) |
| `npm run check` | typecheck + lint + unit tests — keep this green |
| `npm run test` | Vitest: finance fixtures (spec §5) + repo org-scoping tests |
| `npm run e2e` | Playwright smoke flows (build first: `npm run build`) |
| `npm run db:migrate` | apply migrations to whatever DB the env points at |

## Selling with it

`/ops/offers` is the sales screen. Enter a building's floors, apartments and
residents, and it prices the quote live against three reference points: your
own direct cost, the like-for-like market rate, and the Fântânii contract. It
blocks nothing, but it says plainly when a price is below cost, under the
recommended floor, or more than 2x market (which is fine with a captive
landlord and loses the room with an association).

Generating an offer produces a Romanian PDF and records what you quoted. If
you started from a prospect, that prospect moves to **ofertă trimisă**
automatically, so the pipeline never drifts from reality. The document
argues, it does not just quote: the full task table ("Ce facem, și cât de
des"), the 23 operations at most two of twenty surveyed firms publish (each
with its reason), the building's own legal obligations with citations, the
response commitments, and the honest "ce nu facem" boundaries.

Hand the **sample proces-verbal** over with every offer. It is on the same
screen, watermarked MODEL, and it is the clearest way to show what "curățenie
cu dovadă" actually means. Read the sales findings at the top of
`DECISIONS.md` before your first association meeting.

## Stack and layout

Next.js 15 (App Router) + TypeScript strict + Tailwind v4. Drizzle ORM over
SQLite: **better-sqlite3 locally, Turso (libSQL) in production**, chosen by
env. Files (photos, PDFs, documents) go through `src/server/storage.ts`:
local disk in dev, Cloudflare R2 in production, chosen by env.

```
src/lib/constants.ts     ← every business number, sourced (spec §4). Nothing else hardcodes money.
src/lib/finance/         ← the pure math: payroll models, unit economics, projection, VAT. Unit-tested.
src/lib/compliance/      ← the obligations catalogue: citations, fines, cadences. Unit-tested.
src/lib/services/        ← the 58-task catalogue with competitor-coverage audit data.
src/lib/commitments.ts   ← the §C4 response promises and how each is measured (or honestly isn't).
src/lib/prospecting/     ← field routes, scorecard, GDPR constants.
src/server/db/           ← Drizzle schema + driver selection. UI never imports this directly.
src/server/repo/         ← ALL database access. Every function takes org_id (multi-tenant seam).
src/server/pdf/          ← every printed document (pdf-lib + bundled Instrument Sans for ș/ț)
src/app/(public)/        ← lead-gen page + /b/<code> building status page, no passcode
src/app/(app)/           ← sim, atlas, ops, compliance, services (passcode-gated)
src/app/(portal)/        ← cleaner portal (Romanian)
src/seed/                ← the demo world
```

All money is stored and computed in **bani** (integer). Dates are stored UTC
and displayed in Europe/Bucharest.

## Environment

Copy `.env.example` to `.env`. Everything is optional in dev:

- `SCARA_PASSCODE` — the shared gate for all non-public routes. Unset = open
  (so a fresh clone runs); **set it in production**.
- `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` — switch the DB to Turso.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` —
  switch file storage to Cloudflare R2.

## Deploying (Vercel free tier)

1. Push this repo to GitHub and import it in Vercel (framework auto-detects).
2. Create a free Turso database: `turso db create scara`, then
   `turso db show scara --url` and `turso db tokens create scara`. Set both
   values in Vercel env (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).
3. Run migrations + seed against it once, from your machine:
   `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run seed`
4. Create a Cloudflare R2 bucket (free tier), an API token with object
   read/write, and set the four `R2_*` vars in Vercel.
5. Set `SCARA_PASSCODE`.
6. Deploy. The same app serves all five modules from one URL.

## Where decisions live

- `DECISIONS.md` — assumption log + notes the founders must take to the
  accountant (part-time floor value, the platform-fee tax note).
- `FRANCHISE_LATER.md` — the deliberately-unbuilt 5-step path to
  multi-city (each future city = one `org`; the seams are already in).
- The spec's DO-NOT-BUILD list is binding: no payments, no invoices, no gig
  mechanics, no GPS tracking, no AI features. Boring reliability is the
  product.
