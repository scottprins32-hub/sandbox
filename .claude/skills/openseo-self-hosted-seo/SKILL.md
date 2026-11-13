---
name: openseo-self-hosted-seo
description: Decides whether and how to deploy OpenSEO (every-app/open-seo), the MIT SEO toolkit pitched as a free Semrush and Ahrefs alternative, covering the Docker and Cloudflare Workers deploys, that its keyword, backlink and rank data is bought from DataForSEO, the Google Search Console connection, the first-visitor-is-admin trap, and what it does not prove versus the paid tools. Use this whenever the user wants keyword research, rank tracking, backlink or site-audit tooling, a Semrush or Ahrefs replacement, or mentions OpenSEO or DataForSEO - even if they never name it. Says who pays for the data and what the docs do not claim.
---

# OpenSEO (self-hosted SEO)

Features: keyword research, rank tracking, competitor insights, backlinks, site audits, AI visibility, local SEO (beta), Search Console and Analytics dashboards, plus an MCP server and agent skills. MIT licence, TypeScript on Cloudflare Workers or a Docker image. Read 2026-11-13: README, LICENSE, `.env.example`, `package.json`, SECURITY.md and the local, Docker, Cloudflare, DataForSEO and Search Console docs, plus the releases page. Latest release seen: v0.1.27 (11 Nov, year inferred); about 27.6k stars as shown; very active. The operations and telemetry doc, Postgres and Maps docs, the threat model and the code were not read. Nothing was deployed.

## The key fact: the data is rented

The software is free, the data is not. Keyword, backlink and rank data comes from **DataForSEO**, so you need an account and API key (`DATAFORSEO_API_KEY`, base64 of login:password): pay-as-you-go, $1 free credit for new accounts, **$50 minimum top-up** (per-call prices not verified). Rank checks read each keyword several times and "cost more and can take up to 2 hours". The docs state no index size, backlink freshness, or comparison with Semrush or Ahrefs data quality: "alternative to Semrush and Ahrefs" is a marketing claim, and coverage depends on DataForSEO. Sign-up links in the docs carry an affiliate parameter.

Other sources: site audits use its own crawler (public sites only, ports 80 and 443, up to 10,000 pages or 1,000 with JS rendering, which needs a Context.dev key); Search Console and GA4 come from your own Google account via OAuth and cost nothing; AI visibility and chat use OpenRouter or an OpenAI-compatible server (`OPENROUTER_API_KEY`); Local SEO uses a Google Maps key. Self-hosters pay these providers directly, "with no OpenSEO markup" (docs). The hosted service at openseo.so is $10 a month and adds a 28% markup on DataForSEO requests (README: vendor claims).

## Deploy

- **Docker** (needs 4 GiB for Docker; runtime 1 to 2 GiB):
  ```bash
  git clone https://github.com/every-app/open-seo.git && cd open-seo
  export COMPOSE_FILE=deploy/standalone/compose.yaml
  cp deploy/standalone/.env.example deploy/standalone/.env   # set STORAGE_SECRET_KEY and DATAFORSEO_API_KEY
  docker compose pull && docker compose up -d && docker compose logs -f init   # then http://localhost:3001
  ```
  Back up the Docker `config` volume (it holds generated secrets). The update flow runs a backup script first.
- **Cloudflare Workers:** Node 22.6+, pnpm, a Cloudflare account with R2 enabled (a payment method is required even on the free tier): `pnpm install`, `pnpm alchemy login deploy/alchemy/alchemy.run.ts`, `pnpm alchemy cloudflare bootstrap`, `cp deploy/.env.selfhost.example .env.selfhost`, `pnpm deploy:selfhost --yes`. On the free plan site audits stop at about 40 pages. The teardown command deletes D1, KV and R2 data.
- **Local dev:** Node 20+, `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm run db:migrate:local`, and `AUTH_MODE=local_noauth` (no login by design: never expose it).

## Traps

- **The first visitor becomes admin.** Create the admin account immediately after deploying, or anyone who finds the URL can claim it. Teammates join by invitation links and there is no email delivery; they share one workspace.
- Auth modes: `cloudflare_access` (default), `local_noauth`, `hosted`, `password` (standalone Docker), `everyapp`. Sign in with Google is not offered for the Docker setup; Google is only for Search Console.
- **Search Console:** create a Google Cloud project, enable the Search Console API, an External consent screen with test users, and **publish the app** or refresh tokens expire after 7 days. The redirect URI must exactly equal `<origin>/api/gsc/oauth/callback` (GA4: `/api/ga4/oauth/callback`). Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and a `BETTER_AUTH_SECRET` of at least 32 characters. Google will show an unverified-app warning.
- `deploy:prod` and `deploy:web` in `package.json` hard-code the upstream author's repository: forks must change them.
- The MCP endpoint is `/mcp`; clients sign in with the account or an API key.
- Telemetry: PostHog and Loops variables exist for hosted mode; whether a self-host sends anything was not verified. Security reports go to security@openseo.so.

## Not verified

DataForSEO prices and the exact endpoints used, actual data quality, telemetry on self-hosts, openseo.so pricing, the Postgres option.

## Ship checklist

- [ ] DataForSEO account funded, and the real per-feature cost estimated before committing.
- [ ] Admin account created at once; `local_noauth` not exposed.
- [ ] Google OAuth app published, redirect URI exact.
- [ ] Config volume or D1, KV and R2 backed up.
- [ ] Rankings and keywords spot-checked against a source you trust before acting on them.
