---
name: firecrawl-web-extraction
description: Decides whether and how to use Firecrawl (firecrawl/firecrawl) to turn websites into clean markdown or structured data for Claude - Firecrawl Local (an AGPL single binary and MCP server), the hosted Firecrawl Cloud API with its keyless free credits, or the self-hosted server - covering scrape, crawl, map, search, the branding format, robots.txt and site terms, and what each mode sends to Firecrawl. Use this whenever the user wants to scrape or crawl a site, read a JavaScript-heavy page, extract a brand's colours, fonts and logo, research competitors' sites, feed web pages to an agent with fewer tokens, or mentions Firecrawl - even if they never name it. Main caveat - the "local" mode still sends some requests to Firecrawl Cloud by default, and the video presenting it was sponsored by Firecrawl.
---

# Firecrawl (web pages to LLM-ready data)

"Knowledge infrastructure to make your agents smarter." Read 2026-11-21: README, LICENSE, SELF_HOST.md, `docker-compose.yaml`, `apps/local/README.md` and `Cargo.toml`, `apps/local/src/main.rs` (MCP launch), SDK `LICENSE` files and `apps/js-sdk/firecrawl/package.json`, `apps/api/src/controllers/v2/types.ts` and `apps/api/src/types/branding.ts` (branding format, robots option), the headers of `apps/api/src/lib/branding/jev.ts` and `llm.ts`, and the `firecrawl-cli` and `firecrawl-workflows` stub READMEs. Latest commit 2026-11-20. Firecrawl's website, docs, pricing and terms were not read. Nothing was installed or run.

Disclosure: the video that recommended this was sponsored by Firecrawl and used an affiliate link. Judge it on the repo, not the pitch.

## Three ways to run it

- **Firecrawl Local** (`apps/local`, v0.1.1): one Rust binary; scrape, crawl, map and batch scrape on your machine, PDFs and Office docs parsed locally, JS pages rendered in your own Chrome. No `json`, `summary`, browser `actions` or `branding`.
- **Firecrawl Cloud** (firecrawl.dev): everything, plus search, structured JSON, screenshots, Interact, Agent and Alexandria ("550+ data providers"). "Firecrawl Keyless" gives "1,000 free credits a month with no API key or signup"; beyond that is paid (pricing not read).
- **Self-hosted server** (`apps/api`): Docker Compose with Playwright, Redis, RabbitMQ, Postgres, FoundationDB. No Alexandria; AI features need your own OpenAI-compatible or Ollama endpoint.

## When to use it, when not

- Use when Claude's own web fetch fails on JS-heavy pages, for crawling a docs site to markdown files, mapping a site's URLs, or extracting brand tokens (Cloud or self-host).
- Not for logged-in, paywalled or personal-data scraping, or sites whose terms forbid it. README: "It is the sole responsibility of end users to respect websites' policies when scraping."
- Prefer Local with `FIRECRAWL_CLOUD=off` for anything private (internal docs, intranet pages).

## Setup (from the repo docs)

```bash
cargo install firecrawl-local                 # needs Rust and a C compiler
firecrawl-local scrape https://example.com --markdown
firecrawl-local crawl https://docs.example.com --limit 50 --out ./pages
firecrawl-local map https://example.com
firecrawl-local init --dry-run                # preview MCP config edits for Claude Code, Cursor, etc.
firecrawl-local serve                         # Firecrawl v2 API on 127.0.0.1:3002, no key for local routes
```

Manual MCP: register `firecrawl-local mcp --public-only` as a stdio server (the repo recommends `--public-only` when the agent reads untrusted sites). Note `mcp` runs `npx -y firecrawl-mcp` from npm on every start (needs Node 22+), unpinned unless you set `FIRECRAWL_MCP_PACKAGE`.

Cloud quick path in the README: `npx -y firecrawl-cli@latest scrape https://firecrawl.dev` and `npx -y firecrawl-cli@latest init --all --browser` (unpinned, edits every agent it finds; the CLI lives in a separate repo, not read). Self-host: follow `SELF_HOST.md` and the external guide; pin a release tag, not `main`.

## Licence and terms

- AGPL-3.0 for the server and Firecrawl Local (`license = "AGPL-3.0"`). SDKs MIT (Sideguide Technologies Inc.). Using it unmodified is fine; modifying it and offering it over a network triggers AGPL source duties.
- Cloud use is governed by Firecrawl's own terms and pricing, not read. Site owners' terms and robots.txt still apply to you.

## What goes where

- Local, default `FIRECRAWL_CLOUD=auto`: search, Alexandria and any page that "refuses your machine" go to Firecrawl Cloud (marked `"source": "firecrawl-cloud"`), and "Cloud calls carry a random install ID and the name of the tool that made them". `search` sends only search; `off` sends nothing (`login` always talks to Firecrawl). In MCP mode the non-scrape tools go to Cloud.
- Cloud: every URL, prompt and returned page goes to Firecrawl. The server's branding code calls TypeSafe's "Jev" model when `TYPESAFE_API_KEY` is set, otherwise a generic LLM, so Cloud branding output passes through a model provider.
- Self-host: pages stay on your infrastructure except calls to whatever LLM endpoint you configure.

## Traps

- Self-host defaults are unsafe off a trusted network: `USE_DB_AUTHENTICATION=false` (the API is "unauthenticated"), the compose file publishes `"${PORT:-3002}:..."` on all interfaces, Postgres password defaults to `postgres`, and there are no persistent volumes. `ADMIN_INTERNAL_PORT` serves admin routes with no key: never publish it.
- Local `scrape`, `crawl` and `mcp` can reach localhost and your private network by default; a page with hidden instructions could steer an agent into internal URLs. Use `--public-only`.
- robots.txt: "By default, Firecrawl respects robots.txt"; the v2 API has `ignoreRobotsTxt` (default false). Do not turn it on for sites you do not own. Local announces itself as `FirecrawlLocal` in its User-Agent.
- Docker with JS rendering: use Playwright's seccomp profile, never `seccomp=unconfined` (Local README).
- Crawls cost Cloud credits per page; set `--limit`.

## Creator's claims vs the repo

- "Full brand extraction" (creator): a `branding` format exists in the v2 API (colour scheme, brand name, logo, fonts, colours, typography), but only on Cloud or the self-hosted server, not Firecrawl Local, and it uses an LLM call.
- "Competitor analysis" (creator): the README points to a separate `firecrawl-workflows` repo for "competitor analysis" workflows; that repo was not read.
- "2,900 tokens instead of 58,000 for the same page" (creator): not in the repo; the README only says agents "spend fewer tokens". Markdown is usually much smaller than raw HTML, but the ratio depends on the page; measure it.

## Not verified

Cloud pricing, terms and data retention, the "96% of the web" coverage claim, the external CLI and MCP packages, the self-host guide on docs.firecrawl.dev, and Alexandria's data sources.

## Use checklist

- [ ] Site terms and robots.txt allow it; no logins, paywalls or personal data.
- [ ] Mode chosen: Local with `FIRECRAWL_CLOUD=off` for private work, Cloud only for public pages.
- [ ] MCP registered with `--public-only`; npm packages pinned where possible.
- [ ] Self-host: authentication, TLS, firewall, real passwords and volumes before leaving localhost.
- [ ] Token savings measured on your own pages before quoting a number.
