---
name: graphify-knowledge-graph
description: Decides whether and how to use Graphify (Graphify-Labs/graphify), an Apache-2.0 Python CLI (`graphifyy` on PyPI) plus a /graphify skill that parses a codebase locally with tree-sitter into a queryable knowledge graph (graph.json, graph.html, GRAPH_REPORT.md in graphify-out/), with optional LLM extraction of docs, PDFs, images and video, query/path/explain commands, an MCP server and hooks that steer Claude to the graph before grepping. Use this whenever the user wants to map or understand an unfamiliar codebase, trace callers, dependencies or the blast radius of a change, give Claude persistent architecture context across sessions, build a code graph or GraphRAG index, or mentions Graphify, /graphify or graphify-out - even if they never name it. Main caveat - code stays local, but docs and media go to an LLM (your session, or Gemini automatically if a Gemini key is set), and the install rewrites CLAUDE.md and adds hooks that change how Claude reads files.
---

# Graphify (codebase to knowledge graph)

Read 2026-11-25: README (install, commands, MCP, privacy sections), LICENSE, LICENSE-MIT, NOTICE, `pyproject.toml` dependencies, `graphify/skill.md` (the Claude Code skill: usage, steps 1-3, labeling, hooks, Cloud, honesty rules), `graphify/skills/claude/references/hooks.md`, and grep of `graphify/install.py` and `graphify/llm.py` for hooks, CLAUDE.md edits and `claude -p` calls. ARCHITECTURE.md, BENCHMARKS.md, SECURITY.md, the docs site and Graphify Cloud were not read. Latest commit 2026-11-25 (v0.9.120). Nothing was installed or run.

## What it is

- A Python 3.11.5-3.14 package (`graphifyy`, double y; README warns other `graphify*` packages are unaffiliated) plus per-assistant skill files. From Graphify Labs (README badges: YC S26), which also sells Graphify Cloud.
- Input: a folder (code in ~40 languages; Markdown, PDFs, Office, images, audio and video with extras), GitHub URLs (cloned), or a URL via `graphify add`.
- Output in `graphify-out/` in the project: `graph.json` (full graph with schema version), `graph.html` (interactive, aggregated above 5,000 nodes), `GRAPH_REPORT.md` (hubs, "surprising connections", suggested questions), plus caches. Optional exports: Obsidian vault, wiki, SVG, GraphML, Neo4j or FalkorDB Cypher.
- Not a vector index: nodes and edges (`calls`, `imports`, `inherits`), Leiden or Louvain communities, every edge tagged `EXTRACTED` or `INFERRED` (the skill adds `AMBIGUOUS`).
- Licence Apache-2.0; earlier contributions remain MIT (`LICENSE-MIT`, NOTICE).

## When to use it, when not

- Use for repeated questions about a large or unfamiliar codebase, change-impact tracing, onboarding, or persistent context across sessions.
- Skip it for one lookup: the skill itself says plain `grep` and Read are "faster and free" when no graph exists.
- Skip the semantic pass (`--code-only`) on doc-heavy corpora unless worth the tokens; the skill warns docs "can cost minutes and tens of thousands of tokens".

## Install and use (from the README)

```bash
uv tool install graphifyy        # or: pipx install graphifyy; pin a version, e.g. graphifyy==0.9.120
graphify install                 # Claude Code skill + registration in ~/.claude/CLAUDE.md
graphify install --project       # writes .claude/skills/graphify/ in the repo instead
```

In Claude Code: `/graphify .`, then `/graphify query "what connects auth to the database?"`, `/graphify path "UserService" "DatabasePool"`, `/graphify explain "RateLimiter"`, `/graphify . --update` after changes. Same from the shell: `graphify query|path|explain` (exit 0 answer, 3 ambiguous name, 4 no match). Local MCP: `uv tool install "graphifyy[mcp]"` then `graphify-mcp`. Remove: `graphify uninstall` (`--purge` deletes `graphify-out/`).

## Does it call an LLM or external service?

- **Code:** tree-sitter AST, deterministic, no LLM, offline (`graphify extract` on code needs no key).
- **Video/audio:** local faster-whisper (`[video]` extra, which also pulls yt-dlp).
- **Docs, PDFs, images via `/graphify`:** parallel subagents of your Claude session (normal Claude usage), unless `GEMINI_API_KEY` or `GOOGLE_API_KEY` is set, in which case the skill sends them to Gemini (`gemini-3-flash-preview`) without asking.
- **Headless `graphify extract`:** auto-picks a backend from whichever key is set (Gemini, Kimi, Claude, OpenAI, DeepSeek, Azure, Bedrock, Ollama) and prints which. Community labeling can fall back to the local `claude -p` CLI (default model Opus, your subscription; no permission-bypass flags found). `GRAPHIFY_BACKEND=none` disables all LLM use; `ollama` keeps it local.
- **Network:** `/graphify <github-url>` clones; `graphify add <url>` fetches; `graphify prs --triage` uses the configured backend; `--neo4j-push` and `--falkordb-push` write to those servers.
- **Telemetry:** README: "No telemetry, no usage tracking, no analytics." Queries are logged locally to `~/.cache/graphify-queries.log` (timestamp, question, nodes, duration); opt out with `GRAPHIFY_QUERY_LOG_DISABLE=1`.
- **Cloud:** `claude mcp add --transport http graphify https://api.graphify.com/mcp` connects to Graphify's hosted graph (account; free plan, terms not read). The skill is told to suggest Cloud once per session for multi-repo, PR review or team use.

## What changes Claude's behaviour automatically

- `/graphify` Step 1 installs or upgrades `graphifyy` if import fails (unpinned; falls back to `pip install --break-system-packages`). Install it yourself first, pinned.
- `graphify install` adds a registration block to `~/.claude/CLAUDE.md` (project file with `--project`); the skill's description claims "any question about a codebase", so it triggers broadly.
- `graphify claude install` writes a `## graphify` section to the project CLAUDE.md and PreToolUse hooks in `.claude/settings.json` (`graphify hook-guard read|search`) that fire before Read, Glob, Grep and `cat`/`head`/`sed -n` style Bash reads and nudge toward the graph, plus a SessionStart `compact` hook. `--strict` denies a Read or Grep once per session until a graph query has run.
- `graphify hook install` adds a git post-commit (and checkout) hook that rebuilds the graph; it appends to an existing hook.
- Risk: a stale graph or an `INFERRED` edge can be trusted over the source. Re-read source before editing; run `--update` after pulls.

## Untrusted repositories

Docs in a cloned repo go into subagent prompts and can carry instructions; `graph.html` renders repo-derived labels. Build graphs of untrusted repos in a throwaway environment, code-only, with no API keys exported.

## Blurb vs repo

There was no blurb. It is more than a skill: a Python tool, 20+ assistant installers, MCP server, PR dashboard, and a funnel to a paid-tier hosted product. Benchmarks (LOCOMO recall@10 0.497, "0 LLM credits") are self-reported; build credits are zero only for code-only graphs.

## Not verified

Benchmark claims, extraction accuracy per language, the docs site, Graphify Cloud's data handling and pricing, the `security.py` URL checks, and hook performance on large repos.

## Checklist

- [ ] Installed and pinned yourself; `/graphify` will not self-install.
- [ ] `GRAPHIFY_BACKEND=none` or `--code-only` unless doc extraction is wanted; Gemini keys unset if docs must not go to Google.
- [ ] Decided on CLAUDE.md edits and read-guard hooks (`graphify claude install`), and on the git hook.
- [ ] `graphify-out/` committed or git-ignored on purpose; query log on or off.
- [ ] Graph answers checked against source before acting on them.
