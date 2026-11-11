---
name: appflowy-workspace
description: Sets expectations and a safe path for AppFlowy, the AGPL Flutter and Rust notes-and-docs app pitched as an open-source Notion alternative, including that the old AppFlowy-Cloud server repo is archived, the current self-hosted server is closed source with a one-seat free tier, and local-AI claims are unverified. Use this whenever the user wants a free or self-hosted Notion replacement, a local-first wiki or notes workspace, or mentions AppFlowy or AppFlowy Cloud - even if they never name it. Prevents building the archived server by mistake.
---

# AppFlowy (Notion alternative)

Read 2026-11-11 from the AppFlowy and AppFlowy-Cloud repos (READMEs, LICENSE files, the archived compose and `deploy.env`). Nothing was installed or run. The most important finding: **the self-hosting story in the repo the reel points at is out of date.**

## What is true

- **Client** (`AppFlowy-IO/AppFlowy`): Flutter plus Rust, AGPLv3, for macOS, Windows, Linux, iPhone and Android 10+ (not ARMv7). Download from GitHub releases, FlatHub, Snapcraft, the App Store or Play Store. The README says "We do not claim to outperform Notion in terms of functionality and design, at least for now."
- **Server** (`AppFlowy-IO/AppFlowy-Cloud`): **archived by its owner on 2026-09-11**, read-only. Its README says it "is no longer maintained or in use across any AppFlowy product offerings" and "Do not build the server from this archived appflowy-cloud repository." The current server is a closed-source commercial codebase distributed as Docker images through `AppFlowy-SelfHost-Commercial`.
- **Free self-hosted tier** (README): one user seat per instance, up to 3 guest editors, page publishing. More needs a paid plan.
- The client repo may lag: the Cloud README says active code is being consolidated into private repos and will be merged back "at a later stage".

## Decide first

1. **Just you, offline-ish?** Use the desktop client. Where the desktop app stores data and how it works offline were not stated in anything read.
2. **A team?** The free self-hosted tier is one seat. Plan for a paid licence or pick another tool (see `self-hosted-app-alternatives`).
3. **Need local AI?** Not supported by anything read. The server's AI settings are OpenAI and Azure OpenAI only (`AI_OPENAI_API_KEY`, `AI_AZURE_*`), and with a key set, document content may go to those providers for embeddings. The reel's "works with AI on your computer" claim could not be verified; check the current docs before relying on it.
4. **Migrating from Notion?** No Notion or Markdown import is documented in the files read.

## Self-hosting (only the path the README names)

```bash
git clone https://github.com/AppFlowy-IO/AppFlowy-SelfHost-Commercial
cd AppFlowy-SelfHost-Commercial && cp deploy.env .env && docker compose up -d
```

That repo and its licence agreement were **not read**: read both, plus appflowy.com's self-hosting guide and pricing page, before running anything. From the archived compose, so treat as indicative only: services are nginx, MinIO, Postgres (pgvector), Redis, GoTrue, the cloud app, a worker, search and a web front end. The sample env has placeholder secrets that must be changed, and defaults `GOTRUE_DISABLE_SIGNUP=false` and `GOTRUE_MAILER_AUTOCONFIRM=true`, meaning open signup with no email check.

## Licence notes

AGPL section 13: if you modify it and users use it over a network, you must offer them the source. The restrictions on the free self-hosted tier are commercial terms, not in the AGPL files.

## Not verified

Telemetry in the desktop client, local storage location, offline behaviour, export and import, latest release date, the commercial self-host repo.

## Ship checklist

- [ ] Confirmed the archived `AppFlowy-Cloud` repo is not being built.
- [ ] Commercial self-host repo, licence terms and seat limit read.
- [ ] Secrets replaced; signup and email-confirmation defaults changed.
- [ ] No expectation of local AI or Notion import without checking current docs.
