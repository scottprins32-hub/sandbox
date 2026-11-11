---
name: cap-screen-recording
description: Decides whether and how to use Cap (CapSoftware/Cap), the open-source Loom alternative for screen recordings with instant share links or a local editor, including the AGPL versus MIT licence split, the self-hosting Docker stack, and the personal-use-only free tier. Use this whenever the user wants to record and share screen walkthroughs, replace Loom, self-host a screen-recording share server, or mentions Cap - even if they never name it. Flags placeholder secrets in the default compose file and what needs a paid plan.
---

# Cap (open-source screen recorder)

"The open source alternative to Loom." Read 2026-11-11: README, LICENSE, `licenses/LICENSE-MIT`, `docker-compose.yml`, `docker-compose.template.yml`, cap.so docs (self-hosting, installation) and the pricing page. `.env.example` and `SECURITY.md` returned 404. Nothing was installed or run.

## Modes

- **Instant:** uploads while you record, gives a share link as soon as you stop.
- **Studio:** records locally, opens an editor, then you export or share.
- Sharing can be public or private with passwords and your own domain (README); the hosted free tier lists 25 cloud links a month, up to 5 minutes each.

## Licence and commercial use (two separate questions)

- Source: root LICENSE says everything is **AGPLv3** except the `cap-camera*` and `scap-*` crates (MIT) and third-party parts under their own licences. Running it unmodified is fine; modifying and offering it over a network triggers AGPL source-offer duties. Subfolder licences were not checked.
- Product terms: the pricing page says "The free version is for personal use only" and shows "Commercial usage: Not included"; a Desktop License is $29 per year or $58 once, and Cap Pro is $12 per user per month. The commercial-licence page was not read, and the pricing page contradicts itself on whether unlimited local recording is free. Settle this before using it for work.

## Install the desktop app

macOS (Apple Silicon and Intel `.dmg`), 64-bit Windows `.exe`, and a 64-bit Linux `.deb`, from cap.so/download (not fetched). macOS needs Screen and System Audio Recording, Microphone and Camera permissions.

## Self-host (docs)

```bash
git clone https://github.com/CapSoftware/Cap.git && cd Cap
docker compose up -d          # web UI on http://localhost:3000
docker compose logs cap-web   # sign-in codes appear here when email is not set
```

Stack: `cap-web`, a media server built from source, MySQL 8 and MinIO. In the desktop app set Settings, Cap Server URL. For an external S3 bucket the docs say to set CORS for your Cap URL and expose the `ETag` header, or web and extension uploads fail. "We do not offer direct support for self-hosted deployments."

**Before exposing it:** the default compose file "includes placeholder secrets that are visible in the public repository". Replace `NEXTAUTH_SECRET`, `DATABASE_ENCRYPTION_KEY`, `MEDIA_SERVER_WEBHOOK_SECRET` and the MySQL and MinIO passwords (`openssl rand -hex 32`). Do not start from `docker-compose.template.yml`: it says it is not for production. Never run `docker compose down -v` to fix a migration error: it deletes the MySQL and MinIO volumes. Videos default to public (`CAP_VIDEOS_DEFAULT_PUBLIC` true).

## What goes where

Recordings sit in the S3-compatible bucket; MySQL holds metadata. Transcription with `ASSEMBLY_API_KEY` sends audio to AssemblyAI; AI summaries use whichever LLM key you set. Hosted Pro features (viewer analytics, custom domains, auto titles) vs self-host parity is a marketing claim ("self-host to maintain all features") that was not verified. Desktop-app telemetry was not verified; the README says Tinybird is used for viewer analytics.

## Not verified

SOC 2, ISO and HIPAA claims and the "80,000+ users" figure on the pricing page; Railway template; trusted-proxy auth doc; latest release (commits were dated 2026-11-10 and 11, about 24.8k stars).

## Ship checklist

- [ ] Licence use confirmed: personal vs commercial, and the AGPL duties if you modify it.
- [ ] Secrets replaced; compose file is the main one, not the template.
- [ ] Default-public setting changed if recordings are private.
- [ ] A recording uploaded and played back through the share link.
- [ ] Volumes backed up.
