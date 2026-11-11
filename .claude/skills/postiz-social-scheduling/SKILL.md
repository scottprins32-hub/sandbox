---
name: postiz-social-scheduling
description: Decides whether and how to self-host Postiz (gitroomhq/postiz-app), the AGPL social media scheduler, covering the Docker Compose stack with Temporal, the developer app each network needs (X, Meta, TikTok, YouTube, Reddit, Bluesky), the TikTok audit and Meta review traps, the public API and CLI, and the placeholder secrets to replace. Use this whenever the user wants to schedule or automate posts across social networks, replace Buffer or Hootsuite for free, post from scripts or an AI agent, or mentions Postiz - even if they never name it. Lists what was not verified, including several providers and the MCP setup.
---

# Postiz (self-hosted social scheduler)

Schedules and automates posts across many networks. AGPLv3; the README says features are not gated and self-hosted channels, posts and team members are unlimited. Read 2026-11-11: README, LICENSE, `.env.example`, `docker-compose.yaml`, SECURITY.md, the releases page and docs.postiz.com (quickstart, installation, config reference, five provider pages, public API, CLI). **Not fetched:** the LinkedIn, Threads, Pinterest, Mastodon, Instagram Standalone and Bluesky provider pages, the MCP, AI and telemetry pages, and the separate `postiz-docker-compose` repo. Nothing was installed or run. Latest release seen: v2.25.3 (24 Oct), whose notes fix two security vulnerabilities; about 41.3k stars.

## Decide first

1. **Real cost is the developer apps, not Postiz.** Each network needs its own app, review and sometimes paid API access. Ten networks need no developer app (Bluesky, Lemmy, Nostr, Medium, Dev.to, Hashnode, WordPress, Listmonk, Moltbook, Skool): connect by credentials or an app password.
2. **Hosted cloud vs self-host:** the cloud has pre-approved provider apps, AI quotas and a hosted MCP; self-hosting means you register every app and bring your own AI keys (README table).
3. **Server size:** floor 2 vCPU, 2 GB RAM, 20 GB disk; recommended 4 vCPU, 8 GB, 50 GB. Needs PostgreSQL 14+, Redis 6+ and **Temporal** (required since v2.12.0), HTTPS in production (secure cookies), and outbound access to the networks' APIs.
4. **AGPL:** modify it and expose it over a network, and you must offer users the source.

## Install (docs)

```bash
git clone https://github.com/gitroomhq/postiz-docker-compose   # read it first
# set variables, then:
docker compose up          # app on :4007, Temporal UI on :8080
```

The docs say the canonical compose file is in the separate compose repo; the main repo's `docker-compose.yaml` runs the same stack (Postiz, Postgres 17, Redis 7.2, Temporal with Elasticsearch and its own Postgres, a Spotlight debug container). After changing variables: `docker compose down` then `up`.

## Required settings (names only)

`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` (rotating it logs everyone out), `FRONTEND_URL` (must exactly match the URL you browse), `NEXT_PUBLIC_BACKEND_URL`, `BACKEND_INTERNAL_URL`, `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`. Then `STORAGE_PROVIDER` (`local` or `cloudflare` R2), email (`EMAIL_PROVIDER`, `RESEND_API_KEY` or SMTP vars), and per-network keys. OAuth redirect URIs follow `{FRONTEND_URL}/integrations/social/{provider}`; provider ids are not always obvious (Farcaster is `wrapcast`, Google My Business is `gmb`). Every platform shows in the Add Channel dialog whether or not its keys are set; an unconfigured one just fails.

## Per network (docs pages read)

- **X:** app type must be **Native App** with Read and Write, or auth fails with error 32. `X_API_KEY`, `X_API_SECRET`. The API tier needed was not stated.
- **Facebook and Instagram:** Meta app under a business portfolio, advanced permissions (`pages_manage_posts` and others), **App Mode must be Live** or posts are visible only to you. Business verification is needed for public apps; not needed for personal use. `FACEBOOK_APP_ID/SECRET`.
- **TikTok:** needs a verified public HTTPS site. **Until the app passes audit, posts are forced to `SELF_ONLY` and limited to 5 users per 24 hours.** TikTok pulls media from a public HTTPS URL, so local uploads and `localhost` fail: use R2 or a reverse proxy. `TIKTOK_CLIENT_ID/SECRET`.
- **YouTube:** Google Cloud OAuth client, three YouTube APIs enabled, yourself as test user; Brand accounts need an External app and up to 5 hours to propagate. Daily upload quota applies (figure not verified).
- **Reddit:** a "web app" at reddit.com/prefs/apps. **Not read:** LinkedIn, Threads, Pinterest, Mastodon.

## API, CLI and agents

- Public API: an API key in a raw `Authorization` header (no Bearer); OAuth2 tokens start `pos_`. Cloud base `https://api.postiz.com/public/v1`; the self-hosted base was not shown. Create-post is rate limited (docs say 90 per hour; the compose file sets `API_LIMIT: 30`). Endpoints include `/posts`, `/upload`, `/integrations`.
- CLI: `npm install -g postiz`; `postiz auth:login` (device flow via cli-auth.postiz.com) or `POSTIZ_API_KEY` with `POSTIZ_API_URL` for your server. JSON output.
- An agent skill is offered via `npx skills add gitroomhq/postiz-agent`; read it before installing. A self-hosted MCP connector exists (v2.25.0 notes); its setup was not read.

## Harden before exposing

- The compose file has a **placeholder `JWT_SECRET`**, literal Postgres passwords (`postiz-user/postiz-password`, `temporal/temporal`), `DISABLE_REGISTRATION: 'false'` (the first signup becomes the owner: create it, then set `DISABLE_REGISTRATION=true`, which also disables OIDC sign-in), and publishes ports 4007, 8969 (Spotlight), 7233 and 8080 (Temporal). Elasticsearch runs with security off; whether the Temporal UI has auth is unverified: do not expose those ports.
- The image tag is `:latest` and the last three releases were security fixes; SECURITY.md supports only the latest release. Pin and upgrade promptly.
- Do not set `STRIPE_PUBLISHABLE_KEY`: it "switches the whole application into billed mode". `DISABLE_SSRF_PROTECTION` is global; leave it off.
- Telemetry vars (Sentry, PostHog, GTM, Pixel) are unset in the examples; whether anything is sent by default was not verified. The CLI login uses Postiz's server.

## Doc inconsistencies

`.env.example` says Cloudflare storage is needed for avatars, while compose uses local; docs call some variables "Removed" that the compose file still sets; platform counts differ (14, 28, 32, 34).

## Ship checklist

- [ ] Each target network's app created, reviewed where required, and redirect URI exact.
- [ ] TikTok audit and Meta Live mode understood before promising scheduled posts.
- [ ] Secrets replaced, registration closed after the owner exists, extra ports firewalled, TLS in front.
- [ ] A test post published to a throwaway account on each network.
- [ ] Image pinned; backups of the Postgres volumes.
