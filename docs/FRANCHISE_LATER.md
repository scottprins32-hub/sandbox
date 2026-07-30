# FRANCHISE_LATER.md

The locked end-state dream (§9 of the build spec) is franchising the playbook
city by city, with the platform as the internal edge nobody external pays for.
The codebase already carries the seams: every table has `org_id`, every repo
function takes and filters by it, `orgs` supports multiple rows, and
`org_settings` holds per-org overrides. **None of the below is built, on
purpose.** This file is the map for when a second city is real.

## The 5 steps to multi-city launch

1. **Real auth + roles.** Replace the shared passcode and role-switcher cookie
   with per-user login (email or phone based). `users` already models id,
   org_id, name, role, locale, pin — auth bolts onto it; `getCurrentOrg()`
   stops returning "the first org" and starts resolving from the session.
   Cleaner PIN login stays as-is; it is already per-org.

2. **Org onboarding checklist.** A script (or admin screen) that creates the
   new org row + org_settings, seeds its checklist template, invites its ops
   lead, and sets org identity (name, CUI) used by the proces-verbal. The seed
   code in `src/seed/seed.ts` is the template for this.

3. **Per-org constants overrides.** `org_settings` JSON already carries
   ronPerEur / partTimeFloorBani / platformFeeBani. Extend it with local
   prices, local overhead, and market data per city so the Simulator and the
   margin badges read the franchise's own numbers instead of the §4 defaults.

4. **Storage namespacing — already done.** Every file key starts with
   `{org_id}/`; photos, protocols and documents are physically separated per
   org today. Nothing to migrate.

5. **Cross-org reporting for the founders.** A founders-only screen that
   aggregates revenue, VAT headroom, protocol compliance and problem counts
   across orgs. This is the ONLY place allowed to query more than one org, and
   it must be built as an explicit exception (a dedicated repo module, not a
   loosened filter).

## What stays forbidden

- No org-switching UI in the operational screens; an operator sees one org.
- No cross-org queries in `src/server/repo/**` — the audit greps for that.
- The DO-NOT-BUILD list in the spec (§9) applies to every franchise city, not
  just the first one.
