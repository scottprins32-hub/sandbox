---
name: free-llm-api-router
description: Decides whether and how to run FreeLLMAPI (tashfeenahmed/freellmapi), the MIT-licensed self-hosted router that stacks free LLM tiers from many providers behind one OpenAI- and Anthropic-compatible endpoint, including pointing Claude Code, Codex or other agents at it, the Docker install, the paid live-catalog upsell and each provider's terms. Use this whenever the user wants to run Claude Code or another coding agent for free, pool free API tiers, get a "free OpenAI/Claude API", cut LLM costs to zero, or mentions FreeLLMAPI, free providers or free model routing - even if they never name it. Main caveat - the "Claude" model names map to whatever free model is up, not Claude, and prompts go to whichever upstream provider serves them, under that provider's terms.
---

# FreeLLMAPI (free-tier LLM router)

"87 free LLM providers. 1,313 free model endpoints. One OpenAI-compatible endpoint." Read 2026-11-21: README, LICENSE, SECURITY.md, root and `cli/` `package.json`, `docs/en/install/01-install.md`, `docs/en/architecture/00-high-level-index.md` (limitations and ToS review), `docs/en/architecture/05-catalog-sync.md`, `docs/en/clients/01-agent-clients.md`, the Anthropic section of `docs/en/api/01-rest-api.md`, and `server/src/services/catalog-sync.ts` to check what the catalog fetch sends. Latest commit 2026-11-21 (shallow clone). Nothing was installed or run.

## What it is

An Express server plus React dashboard (Node 20+, SQLite) that you run yourself. You add your own API key for each free provider; the router picks a model per request, fails over on 429/5xx (up to 20 attempts), tracks RPM/RPD/TPM/TPD per key, and answers on `/v1/chat/completions`, `/v1/responses`, `/v1/messages` (Anthropic wire format), `/v1beta` (Gemini) and more. Keys are AES-256-GCM encrypted in SQLite. Desktop app (macOS, Windows), Docker image, and an `npx freellmapi` CLI that writes agent configs.

## When to use it, when not

- Use for personal experiments, prototyping, cheap batch text jobs, or trying an agent harness against open models.
- Not for production or client work. README: "This project is for personal experimentation and learning, not production... swap in a paid API before you ship."
- Not for anything confidential: you do not control which provider gets each prompt, and it can change mid-conversation.
- Not as "free Claude". The Keys, Anthropic tab maps `opus`, `sonnet`, `haiku` and `default` to `auto` or a model you pin; `claude-sonnet-4-5` in a request is served by a free model. The `X-Routed-Via` header says which one.

## Setup (from the docs; read the script first, do not pipe it)

The README offers `curl -fsSL https://freellmapi.co/install.sh | bash`. Do not run that; use the Docker Compose path instead:

```bash
git clone https://github.com/tashfeenahmed/freellmapi.git && cd freellmapi
ENCRYPTION_KEY="$(openssl rand -hex 32)"
printf "ENCRYPTION_KEY=%s\nPORT=3001\n" "$ENCRYPTION_KEY" > .env
docker compose up -d                 # dashboard and API on http://localhost:3001 (bound to 127.0.0.1)
docker compose logs -f freellmapi    # password-reset codes are printed here
```

Then open the dashboard, add provider keys on **Keys**, order the **Fallback Chain**, copy the unified `freellmapi-...` key. Back up `.env`: losing `ENCRYPTION_KEY` makes stored keys unreadable.

Claude Code (it wants the server root, not `/v1`; desktop app uses `http://127.0.0.1:31415`):

```bash
export ANTHROPIC_BASE_URL=http://localhost:3001
export ANTHROPIC_AUTH_TOKEN=<unified-key>
claude
# or let the CLI merge the config, preview first:
npx freellmapi setup-claude --url http://localhost:3001 --dry-run
```

`npx freellmapi` fetches the `freellmapi` npm package (0.8.2 in this checkout); pin a version if you use it. The docs also note Claude Code's auto-mode classifier gets no server-side checks through this gateway, and suggest `CLAUDE_CODE_AUTO_MODE_SERVER=0`; the classifier calls then use your free pool too.

## Licence and terms (two separate things)

- Code: MIT (Copyright 2026 Tashfeen Ahmed). CLI package also MIT.
- Product: the router is free; a **Premium** live catalog is "$19/year or $49 once". Free installs get a monthly snapshot, "about 303 models behind". Nothing in the router is locked.
- Upstream: "Your relationship with each upstream provider is governed by the terms you accepted... you're responsible for complying with them." The repo's own May 2026 review covers only 13 providers: Cohere "Avoid" (forbids personal use), Google Gemini, NVIDIA NIM ("evaluation only, not production") and Z.ai "Caution", Cloudflare "Ambiguous". Its rules: one account per provider, no reselling, no sharing the endpoint with other people. The other ~74 providers have no review in the repo.

## What goes where

- Prompts, files and tool output: to whichever upstream provider serves the request, under that provider's free-tier data terms. The repo does not document whether free tiers keep or train on prompts; check each one you enable, and disable those you would not send code to.
- freellmapi.co: the router fetches a signed catalog twice a day. In `catalog-sync.ts` the request carries the last applied version and, if set, the premium licence key (and your IP). README: "The catalog server never sees your prompts, completions, or provider keys." `CATALOG_BASE_URL` can point elsewhere.
- Local: SQLite DB (keys encrypted), logs, and, if `FREELLMAPI_CONTEXT_HANDOFF` is on, recent messages in memory for 3 hours.

## Traps

- Exposure: single-user, no multi-tenant auth. `HOST_BIND=0.0.0.0` only on a trusted LAN; never put it on the internet. Never put the unified key in a URL; use the revocable URL tokens if a client cannot send headers.
- Quality drifts down through the day as top models hit daily caps, then resets at UTC midnight (docs). Latency is "highly variable". Re-run evaluations at different times.
- Mid-task model switches: an agent can change model partway through a long job; tool-call formats are "rescued" from plain text, which can fail silently.
- Windows `.exe` on Releases is unsigned; the Microsoft Store build is signed.
- Some free tiers need extra account binding (ModelScope "needs Aliyun cn binding"), and each provider needs its own signup and key.

## Creator's claims vs the repo

- "Runs the Claude Code harness on 87 free providers for $0" (creator): the catalog does list 87 providers, but you only reach the ones you sign up for and add keys to, the models are not Claude, and the fresh catalog costs money. Mostly consistent, overstated.
- Creator's 22 runs (all small jobs passed, 2.6 to 4.6x slower, 2 of 3 big jobs passed): not in the repo; consistent with its own limitations list, but unverified here.

## Not verified

The install script contents, the hosted catalog and pricing pages, the desktop app's network behaviour, provider ToS beyond the repo's table, the 10.1 billion tokens figure, and any real routing quality.

## Use checklist

- [ ] Personal, non-production, non-confidential use only.
- [ ] Each enabled provider's terms and data-use policy read; Cohere and other flagged ones off.
- [ ] Docker Compose path used, not the pipe-to-bash one-liner; `ENCRYPTION_KEY` backed up.
- [ ] Bound to localhost; unified key kept out of URLs and repos.
- [ ] `X-Routed-Via` checked so you know which model did the work.
