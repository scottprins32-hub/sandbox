---
name: everything-claude-code-selection
description: Picks a small, safe subset of Everything Claude Code (affaan-m/everything-claude-code, now affaan-m/ECC, plugin ecc@ecc), the MIT-licensed bundle of 328 skills, 72 subagents, 99 commands, 28 hook entries and 121 rule files, and says what its hooks record, block and rewrite before anyone installs it. Use this whenever the user wants to install ECC or "all the skills", asks which Claude Code skills, agents or hooks are worth having, wants session memory, continuous learning, cost tracking or guardrail hooks, or mentions ECC, ecc-universal, GateGuard, AgentShield or instincts - even if they never name the repo. Main caveat - the default plugin install turns on hooks that log every tool call and Bash command under your home directory and probe MCP servers, and loads all 328 skill descriptions.
---

# Everything Claude Code (ECC)

Read 2026-11-21 at commit 4adeee6 (2026-11-19, version 2.2.3): README (install, advanced install, token optimisation, requirements, security), LICENSE, `.claude-plugin/plugin.json`, `.mcp.json`, `hooks/hooks.json` and `hooks.metadata.json`, `manifests/install-profiles.json`, `install-modules.json`, `context-profiles/lean@1.json`, `install.sh`, agent and skill frontmatter, `rules/common`. Hook scripts in `scripts/hooks/`: the dispatchers and every hook they call were read for headers, file writes, network and spawn calls; `observe.sh` and the observer scripts of `skills/continuous-learning-v2` were read in part. Nothing was installed or run.

## What it is

One maintainer's whole harness, packaged for Claude Code, Codex, Cursor, Gemini, OpenCode and others. Skills and agents are Markdown; the hook runtime is about 650 KB of Node.js plus Bash and Python. The plugin is MIT; ECC Pro (a hosted GitHub App, from $19 per seat a month for private repos) is a separate paid product.

## What is inside (counted from the files)

- **328 skills** (`skills/*/SKILL.md`, matching the README). The install manifest groups them into about 28 modules; the largest are framework-language 76, workflow-quality 53, agentic-patterns 39, security 24, operator-workflows 21, devops-infra 19, business-content 14, research-apis 11, media-generation 11. Also database, Swift/Apple, ML, supply chain, prediction markets. 25 skills ship their own scripts.
- **72 agents**: 62 `model: sonnet`, 4 opus, 6 haiku; mostly per-language reviewers and build fixers plus planner, architect, security-reviewer, tdd-guide.
- **99 commands** (`commands/*.md`), called "legacy shims" as ECC moves to skills.
- **Rules**: 121 files in 23 folders (common plus 22 languages and frameworks); 111 are scoped with `paths:` frontmatter, `rules/common` (10 files, ~2,900 words) is not. The plugin cannot ship rules; you copy them.
- **Hooks**: 28 entries on 8 events, two of them dispatchers that run about 20 more sub-hooks.

## Pick by task (start here, not with the catalog)

The README says "Start with the workflow you need, not the full catalog", and the repo's own proposed `lean@1` profile loads 3 skills eagerly (`configure-ecc`, `context-budget`, `ecc-guide`) with an 8,000-token budget. That agrees with the creator's point that a handful (he tested "all 314 skills against just 7") beats the lot. Useful ones (one line each, from their files):

- `tdd-workflow`: failing test first, smallest change to green, then refactor (asks for 80% coverage).
- `verification-loop`: build, types, lint, tests, security grep, diff review, PASS/FAIL report.
- `search-first`: look for an existing package, MCP server or skill before writing code.
- `strategic-compact`: when to compact (after research, after a milestone) and when not (mid-implementation).
- `context-budget`: check the context meter and audit what is loaded.
- Agents `code-reviewer`, `build-error-resolver`, `planner`; rules `rules/common` plus one language pack.

ECC's `security-review` skill shares a name with the built-in `security-review`, and its `/code-review` and `/plan` commands can clash with built-in names when copied into `~/.claude/commands/` (the plugin namespaces them as `/ecc:...`). Overlapping skills here: `code-review`, `simplify`, `agent-skills-engineering-lifecycle` (run one framework's router, not both).

## Install a subset (commands from the README)

Lowest risk, no code runs: clone, read, then copy folders.

```bash
git clone https://github.com/affaan-m/ECC.git && cd ECC
mkdir -p ~/.claude/skills && cp -r skills/search-first ~/.claude/skills/
mkdir -p ~/.claude/rules/ecc && cp -R rules/common ~/.claude/rules/ecc/
```

Use `.claude/skills/` and `.claude/rules/ecc/` in the project instead of `~` to keep it to one repo. Copy whole rule folders so relative links work. Do not nest skills under `~/.claude/skills/ecc/`.

Installer routes (these run ECC's Node code; `install.sh` first runs `npm install --ignore-scripts`):

```bash
node scripts/ecc.js consult "security reviews" --target claude   # suggests components
./install.sh --target claude --skills tdd-workflow,security-review
npx ecc-universal@2.2.3 install --profile minimal --target claude # no hook runtime
./install.sh --profile core --no-hooks --target claude
npx ecc-universal@2.2.3 uninstall --dry-run
```

The native plugin (`/plugin marketplace add https://github.com/affaan-m/ECC`, `/plugin install ecc@ecc`) installs **all** skills, agents and commands and the hooks, with `hooks_enabled` true and profile `standard` by default. Pick one route per harness; stacking plugin and manual install duplicates hooks.

## Hooks: what runs automatically (plugin default, profile `standard`)

Switches: `ECC_HOOK_PROFILE=minimal|standard|strict`, `ECC_DISABLED_HOOKS=<ids>`, plugin option `hooks_enabled`. No hook returns a permission "allow"; nothing found auto-approves tools.

**Writes outside the project:**
- `observe.sh` (every tool call, before and after): appends tool input and output, first 5,000 characters each with regex secret-scrubbing, to `~/.local/share/ecc-homunculus/<project>/observations.jsonl`. Off in `minimal` or with `ECC_SKIP_OBSERVE=1`.
- Bash command log: every Bash command, redacted, to `~/.claude/bash-commands.log` and `cost-tracker.log`.
- Stop hooks: session summaries from the transcript to `~/.claude/session-data/`; token costs to `~/.claude/metrics/costs.jsonl`; tool usage to `~/.claude/metrics/tool-usage.jsonl`; `/tmp/ecc-metrics-<session>.json`; GateGuard state in `~/.gateguard`. Session, cost and metrics hooks also run in `minimal`.
- SessionStart puts the latest summary (last 7 days) and up to 6 learned "instincts" back into context, up to 8,000 characters (`ECC_SESSION_START_CONTEXT=off` to stop). Anything recorded earlier, including text from a hostile file, can come back as context.

**Network and processes:**
- `mcp-health-check` (before every `mcp__` call): sends an HTTP request with your configured headers to each MCP URL in `~/.claude.json`, or **starts the stdio server command** to probe it; blocks calls to servers it marks unhealthy. Project-level MCP configs are skipped unless `ECC_MCP_ALLOW_WORKSPACE_PROBE=1`.
- Continuous-learning observer: off by default (`config.json` `enabled: false`). If turned on, it starts a background `claude --model haiku --print --allowedTools Read,Write` every 5 minutes, told not to ask permission, which sends observations to the API and spends tokens.
- `plan-canvas-pending` talks only to 127.0.0.1. At Stop, where the project has a Biome or Prettier config, it runs the formatter with `--write` on JS/TS files edited that turn (**rewriting them**), and `npx tsc --noEmit` where there is a `tsconfig.json`.

**Blocks or rewrites:** GateGuard denies the first Edit/Write of each file until Claude answers fact questions, and gates destructive shell commands; `config-protection` blocks edits to existing lint and formatter configs; `block-no-verify` stops `git --no-verify`; `auto-tmux-dev` rewrites `npm run dev` and similar into a detached tmux session, killing any same-named session.

Opening Claude Code inside the clone also offers its project `.mcp.json` (`npx -y chrome-devtools-mcp@1.10.1`).

## Traps

- README's token advice sets `"model": "sonnet"` and `CLAUDE_CODE_SUBAGENT_MODEL=haiku` in `~/.claude/settings.json`, changing every project. Do not paste it in unasked.
- `/project-init` may propose allow rules such as `npm run *`; review them. `/multi-*` commands need a separate third-party runtime; `/astra-review` sends your diff to OpenAI through Codex CLI.
- The repo has been renamed (`affaan-m/ECC`); the README warns about malware in unofficial mirrors.
- Counts move fast: 328 skills now, 281 at v2.0.0, 314 in the creator's video.

## Licence

MIT, copyright 2026 Affaan Mustafa. Skills taken from outside sources may carry their own terms; not checked per skill.

## Not verified

Whether the plugin's empty `mcpServers` stops Claude Code loading the root `.mcp.json`; whether the installer filters `rules/` by language; whether `npx tsc` can download a package in a non-interactive Stop hook; how Claude Code trims 328 descriptions (about 104,000 characters, roughly 26,000 tokens before any trimming). The creator's "inspector" and "diary": no component has those names. Closest are AgentShield (`/security-scan`) or GateGuard, and session summaries plus continuous learning; the long-form guide links a "claude_diary" session-reflection article. AgentShield, ECC Pro and the 650 KB of hook code beyond the paths above were not audited.

## Checklist

- [ ] Chose 3-10 skills for the task; copied them rather than installing everything.
- [ ] If hooks are wanted: profile chosen, `ECC_DISABLED_HOOKS` set for observe and command logging if data should not be kept, `~/.local/share/ecc-homunculus` and `~/.claude/session-data` reviewed.
- [ ] Only one install route per harness; no duplicate hooks in `settings.json`.
- [ ] Name clashes with built-in `/code-review`, `/plan`, `security-review` handled.
- [ ] `settings.json` model and permission changes read before accepting.
