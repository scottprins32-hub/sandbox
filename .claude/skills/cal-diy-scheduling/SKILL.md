---
name: cal-diy-scheduling
description: Decides whether and how to self-host Cal.diy (calcom/cal.diy), the MIT-licensed community fork of Cal.com, as a free alternative to Calendly, including the Docker install, Google Calendar and Outlook OAuth setup, and the hardening it needs. Use this whenever the user wants a free or self-hosted booking page, meeting scheduler or Calendly replacement, mentions Cal.diy or Cal.com self-hosting, or needs bookings synced to Google Calendar or Outlook - even if they never name the repo. Flags the README's "personal, non-production" warning and where its claims do not match its own files.
---

# Cal.diy (self-hosted scheduling)

Cal.diy is a fork of Cal.com "with all enterprise/commercial code removed", MIT-licensed, with no hosted version: you run it yourself. Everything here was read 2026-11-11 from the repo's README, LICENSE, `.env.example`, `docker-compose.yml`, `Dockerfile`, `package.json` and `SECURITY.md`. Nothing was installed or run. Claims marked "README" were not checked against the code.

## Decide first

1. **Personal or small use?** The README's own warning says "Use at your own risk... strictly recommended for personal, non-production use", and for commercial or enterprise scheduling to "use Cal.com, not Cal.diy". For a business booking flow, take that seriously.
2. **What was removed:** Teams, Organizations, Insights, Workflows and SSO/SAML (README). If you need those, this is the wrong tool.
3. **Do you need a server?** Yes: Node, PostgreSQL, a public HTTPS URL for OAuth callbacks, and SMTP for email. A hosted free tier of a different product may be less work than running this.
4. **Licence:** MIT, copyright Cal.com, Inc. No extra terms found in the LICENSE file.

## Install (Docker, from the README)

```bash
git clone --recursive https://github.com/calcom/cal.diy.git && cd cal.diy
cp .env.example .env
openssl rand -base64 32      # NEXTAUTH_SECRET
openssl rand -base64 24      # CALENDSO_ENCRYPTION_KEY (README: 32 bytes for AES256)
docker compose up -d         # Postgres + app + Prisma Studio; then http://localhost:3000
```

A setup wizard asks for the first user. Update with `docker compose down; docker compose pull; docker compose up -d`. Building from source needs `DOCKER_BUILDKIT=0` and a running database. The Dockerfile uses `node:22`; the README says Node >=18 and PostgreSQL >=13; `package.json` requires Yarn >=4.12 (the README only says "Yarn (recommended)").

## Calendar setup (README)

- **Google:** Cloud Console project, enable Google Calendar API, OAuth consent screen, scopes `calendar.events` and `calendar.readonly`, add test users, create a Web Application OAuth client with redirect URIs `<URL>/api/integrations/googlecalendar/callback` and `<URL>/api/auth/callback/google`, paste the downloaded JSON into `GOOGLE_API_CREDENTIALS`, run `yarn seed-app-store` in `packages/prisma`. Whether Google demands app verification before outside users can connect was not verified.
- **Outlook:** Azure app registration (multitenant), redirect `<URL>/api/integrations/office365calendar/callback`, set `MS_GRAPH_CLIENT_ID` and `MS_GRAPH_CLIENT_SECRET`. Those two names are in the README but were not in `.env.example`.
- Required env: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_WEBAPP_URL`, `NEXTAUTH_SECRET`, `CALENDSO_ENCRYPTION_KEY`, and `EMAIL_SERVER_*` and `EMAIL_FROM` for mail.

## Harden before exposing it

- `docker-compose.yml` hard-codes a database user and password and publishes port 3000 on all interfaces; change the password and put a TLS proxy in front. Prisma Studio is bound to localhost and the compose comment says to remove it in production.
- `.env.example` ships a non-empty `CRON_API_KEY`: replace it. The README and Dockerfile default the two secrets to the literal `secret`: never keep that.
- The README's seeded `yarn dx` logins are dev-only.
- Do not use `NODE_TLS_REJECT_UNAUTHORIZED=0` except behind a TLS-terminating balancer you understand.

## Where the README and the files disagree

- README: "no license key required" and EE features removed. But the compose file's `calcom-api` service passes `CALCOM_LICENSE_KEY`, Stripe and team-billing variables, and `.env.example` still has SAML, Organizations (with a per-seat price), Insights and workflow-email variables. Expect leftover plumbing, and test that your use works without a licence.
- Telemetry looks on by default; set `CALCOM_TELEMETRY_DISABLED=1`. Many analytics and support-widget variables exist, empty by default; whether empty means inert was not verified. The compose image comes through a Scarf gateway (`calcom.docker.scarf.sh`).
- Redis starts in compose but the README never mentions it.

## Not checked

Last commit date, the telemetry code and endpoint, the `docs/` folder, app-store READMEs, whether any of this runs. Stars about 49.9k (seen on the repo page).

## Ship checklist

- [ ] Personal or low-stakes use confirmed, or Cal.com chosen instead.
- [ ] Secrets regenerated; compose password, `CRON_API_KEY` changed; port not exposed without TLS.
- [ ] Telemetry disabled if you want it off.
- [ ] A booking made end to end and checked on the real calendar, with the confirmation email received.
- [ ] Backups of the Postgres volume.
