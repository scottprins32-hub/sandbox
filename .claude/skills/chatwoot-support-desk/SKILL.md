---
name: chatwoot-support-desk
description: Decides whether and how to self-host Chatwoot, the open-source shared inbox and live-chat desk used as a free alternative to Intercom or Zendesk, covering the Docker and Linux install, the channels (website chat, email, social, WhatsApp), the MIT-versus-enterprise licence split and the security settings that matter. Use this whenever the user wants a free or self-hosted customer-support inbox, live chat widget, helpdesk or Intercom replacement, or mentions Chatwoot - even if they never name it. Lists what was not verified, including the channel guides and backups.
---

# Chatwoot (self-hosted support desk)

An omnichannel inbox: website live chat, email, Facebook, Instagram, Twitter, WhatsApp, Telegram, Line and SMS in one place (README). Read 2026-11-11 from the repo (`develop`): README, LICENSE, `enterprise/LICENSE`, `.env.example`, `docker-compose.production.yaml`, `SECURITY.md`, and the Docker and Linux pages of developers.chatwoot.com. Nothing was installed or run. Version in `package.json`: 4.19.1.

## Decide first

1. **Licence is split.** Root is MIT, but everything under `enterprise/` needs the Chatwoot Enterprise licence and a paid subscription "in production"; dev and test are free. Which features live there was not documented in anything read. The docs say the Docker tag `latest-ce` is the CE build, which implies the default `latest` tag is not; that is an inference. Choose the CE tag if you want only MIT code.
2. **Size:** minimum 2 cores, 4 GB RAM, 20 GB SSD; recommended 4+ cores, 8 GB, 50 GB (docs). Postgres 12+ and Redis 6+ (compose uses pgvector pg16 and Redis).
3. **Can you run a server with email and a domain?** You need a reverse proxy with TLS; containers bind only to localhost.
4. **Support lifecycle:** SECURITY.md supports only `latest`, so plan to keep upgrading.

## Install (Docker, from the docs)

```bash
wget -O .env https://raw.githubusercontent.com/chatwoot/chatwoot/develop/.env.example
wget -O docker-compose.yaml https://raw.githubusercontent.com/chatwoot/chatwoot/develop/docker-compose.production.yaml
# edit: SECRET_KEY_BASE, POSTGRES_PASSWORD (must match in BOTH files), REDIS_PASSWORD, FRONTEND_URL, FORCE_SSL=true
docker compose run --rm rails bundle exec rails db:chatwoot_prepare
docker compose up -d
curl -I localhost:3000/api      # expect 200
```

Put Nginx in front with `underscores_in_headers on;` (the API needs it). A Linux-VM script exists (`get.chatwoot.app/linux/install.sh`, sets up Nginx and Let's Encrypt, adds `cwctl`); it was not read, so read it before running it.

## Settings that matter

- `SECRET_KEY_BASE`; the three `ACTIVE_RECORD_ENCRYPTION_*` keys are needed for MFA.
- `ENABLE_ACCOUNT_SIGNUP` (example false), `FORCE_SSL` (example false: set true behind HTTPS), `SAFE_FETCH_ALLOW_PRIVATE_NETWORK` (keep false), `ENABLE_RACK_ATTACK`.
- Mail: outbound `SMTP_*` and `MAILER_SENDER_EMAIL` (the example ships port 1025 for mailhog); inbound `RAILS_INBOUND_EMAIL_SERVICE` (relay, mailgun, mandrill, postmark, sendgrid, ses) and `RAILS_INBOUND_EMAIL_PASSWORD`.
- `.env.example` ships `RAILS_ENV=development` (compose overrides it) and `ENABLE_PUSH_RELAY_SERVER=true`: mobile push goes through Chatwoot's servers by default.
- Error trackers (Sentry, APM) are commented out. The front end lists Sentry and Amplitude packages; whether they are active was not verified.

## Channels

Env names exist for Facebook/Instagram, Twitter and Slack. For WhatsApp, Telegram, Line and SMS nothing in `.env.example` or the pages read says how to connect them, so read the channel guides on the docs site first. IMAP setup was not read either.

## Upgrade and backup

Upgrade: `docker compose pull`, `docker compose up -d`, then `db:chatwoot_prepare`; an old install must step through intermediate tags. No backup procedure was found; the data is in the named volumes `postgres_data`, `redis_data` and `storage_data`, so back those up and test a restore.

## Doc inconsistencies

README says stable is "v1.x.x" tags (stale; version is 4.x). The Linux upgrade page installs Ruby 3.3.3 but `.ruby-version` says 3.4.4. Postgres password appears in two files and must be kept in sync by hand.

## Not verified

Enterprise feature list, Captain (AI) licence status, channel guides, backups, Helm/cloud guides, repo activity.

## Ship checklist

- [ ] Image tag chosen on purpose (`latest-ce` for MIT-only).
- [ ] Secrets set, signup and SSL settings reviewed, Postgres password matches in both files.
- [ ] TLS proxy in front; port 3000 not public.
- [ ] A real inbound email and a widget message round-trip tested.
- [ ] Volumes backed up and a restore tried.
