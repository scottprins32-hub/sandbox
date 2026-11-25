---
name: ponytail-minimal-code
description: Decides whether and how to adopt Ponytail (DietrichGebert/ponytail), an MIT-licensed always-on "lazy senior dev" mode that pushes Claude to the smallest complete change (reuse, stdlib, native feature, one line, then minimum code), plus one-shot /ponytail-review, /ponytail-audit (ranked whole-repo quality audit) and /ponytail-debt (a ledger of `shortcut:` comments), and says what its hooks and cost "band" write. Use this whenever the user wants Claude to write less code, stop over-engineering, audit a repo for bugs, bloat or technical debt, track deferred shortcuts, or mentions Ponytail, YAGNI mode, /ponytail ultra or the ponytail band - even if they never name it. Main caveat - the default plugin install injects its ruleset into every session and every subagent, and records a per-task cost row with your first prompt under ~/.config/ponytail/band after every turn.
---

# Ponytail

Read 2026-11-25 at commit ebd8654 (2026-11-22, version 5.3.3): README, INSTALL.md, LICENSE, AGENTS.md, `.claude-plugin/plugin.json` and `marketplace.json`, `skills/plugin.json`, `package.json`, all 6 `skills/*/SKILL.md`, `commands/*.toml`, `hooks/claude-codex-hooks.json`, `hooks/claude-band.json`, every hook script those wire up (`ponytail-activate.js`, `-subagent.js`, `-mode-tracker.js`, `-runtime.js`, `-config.js`, `-instructions.js`, `-map.js`, `-statusline.sh`, `-band-import.js`), `hooks/band/register.tsx` and `metrics.ts` (read in part), `scripts/uninstall.js`, `benchmarks/results/2026-10-07-agentic.md`. Nothing was installed or run.

## What it is

One prompt (`skills/ponytail/SKILL.md`, about 600 words) that tells the agent to be a "lazy senior developer": read the code the change touches, then take the first rung that works (does it need to exist, already in the codebase, stdlib or platform, installed dependency, one readable line, minimum code). It says never to cut validation at trust boundaries, data-loss handling, security or accessibility, to leave one small test for non-trivial logic, and to mark known limits with `shortcut: <limit>, <when to upgrade>`. Everything else in the repo loads that prompt into about 20 agents.

The leaderboard calls it "audit repository quality and track technical debt". That is two of its six skills. Its main job is changing how code gets written in every session, and "debt tracking" is a grep for `shortcut:` comments.

## What is inside (counted from the files)

- **6 skills**, none with `disable-model-invocation`, so all can fire on their own: `ponytail` (the mode; levels lite, full (default), ultra, off), `ponytail-review` (diff review that also reads untouched callers: bugs, security, load, untested risk, speed, what to cut), `ponytail-audit` (whole repo: map entry points and load first, then at most 20 numbered findings in Must / Should / Nice, each with What this is, Problem, Fix, If we skip it; ends with Verdict and Not checked; changes no code), `ponytail-debt` (`git grep` for `shortcut:` and `ponytail:` comments, flags ones with no upgrade trigger), `ponytail-gain` (prints the author's benchmark numbers), `ponytail-help`.
- **3 Claude Code hooks** (SessionStart, SubagentStart, UserPromptSubmit) plus a **"band" UI module** (`hooks/band/register.tsx`, needs Claude Code 2.1.290+) that shows cost, tokens, agent time, code reuse and last test result above the prompt, and a local HTML **board**.
- Rule-file copies for Cursor, Windsurf, Cline, Copilot, Kiro, Qoder; 6 Gemini `.toml` commands; 11 before/after examples; a promptfoo and agentic benchmark suite; 23 test files.

## Install (commands from the repo)

Full plugin, as two separate prompts (INSTALL.md says one combined prompt fails):

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Needs `node` on the non-interactive PATH for the hooks. Lower-risk subsets:

- **Audit or review only, no always-on mode, no hooks:** clone, read, and copy `skills/ponytail-audit/` (and `ponytail-review/`, `ponytail-debt/`) into `.claude/skills/`. Each is self-contained. Consider adding `disable-model-invocation: true` to your copy so it runs only when typed.
- **Mode without hooks:** copy `AGENTS.md` (32 lines) into the project or paste it into `CLAUDE.md`. No level switching, no band.
- `npx skills add DietrichGebert/ponytail --skill '*'` copies all six skills through the third-party skills CLI (runs npm code; skills only, no hooks).

Uninstall: run `node scripts/uninstall.js` **before** `/plugin remove ponytail` (the script is a plugin file). It removes flags, config, the statusline copy and its `statusLine` entry. It does **not** remove `~/.config/ponytail/band/`; delete that by hand.

## What runs automatically (plugin default)

- **SessionStart** (startup, resume, clear, compact): writes the mode to `~/.claude/.ponytail-active` and `~/.claude/ponytail-modes/<sha256 of project path>`; injects the level-filtered ruleset plus a **codebase map** (`git ls-files`, reads up to 4,000 source files' first 64 KB, lists top-level functions and exports, 2,000-character budget, 3 s limit; `PONYTAIL_MAP=0` turns it off). If you have no `statusLine`, it copies `ponytail-statusline.sh` into `~/.claude/` and tells Claude to "proactively offer" to add a `statusLine` to `~/.claude/settings.json`. Accepting edits your global settings.
- **SubagentStart:** injects the same ruleset into every subagent, including other plugins' and read-only search agents. Scope it with `PONYTAIL_SUBAGENT_MATCHER` (regex on agent type).
- **UserPromptSubmit:** watches for `/ponytail ...`, "stop ponytail" or "normal mode" and switches the level; `/ponytail default <level>` writes `~/.config/ponytail/config.json`; `/ponytail band import` starts a detached Node process that reads your past Claude Code transcripts in `~/.claude/projects/` and adds cost estimates to the board.
- **Band module** (runs inside Claude Code on session start, every tool call, every turn): `git grep` over the repo for definitions, tracks reused vs new functions from your Edit/Write calls, detects test commands. After **every turn**, with plugin option `ledger` on by default, it writes a row (project, task name taken from your first prompt's first 60 characters, cost, tokens, turns, tests, model) to `~/.config/ponytail/band/<project>.csv` and rebuilds `board.html`; the board button opens it with `xdg-open` / `open` / `start`.
- **Network:** none by default. Only if you set the optional `webhookUrl` does each turn's row (with task names unless `sendNames` is off) POST to that URL, HTTPS only, with an optional Bearer token stored as a sensitive plugin option.
- No telemetry, no self-update code, nothing auto-approves permissions, and no hook blocks a tool call. Plugin updates come through the marketplace.

## Conflicts with an existing .claude setup

- Always-on and opinionated: it changes every reply (each ends with what was skipped or not checked) and pushes back on requests at `ultra`. It can fight a project's own CLAUDE.md conventions or another always-on framework; the README's fix is to override in `CLAUDE.md`.
- `ponytail-review` auto-triggers on "review this" / "code review", overlapping the built-in `code-review` and `simplify`; type the one you mean.
- An existing `statusLine` is left alone, but other plugins' subagents get the ruleset too.
- Do not stack with another "write less" or lifecycle pack (`agent-skills-engineering-lifecycle`, `everything-claude-code-selection`, Superpowers): their TDD and planning steps pull the other way.

## Context cost

Every session start, clear and compaction: ruleset (up to ~3,500 characters) plus map (up to 2,000), roughly 1,400 tokens, and the ruleset again per subagent. Six skill descriptions add about 1,600 characters. The audit and review bodies are about 900 words each, loaded only when used. A real audit reads a lot of code, so it costs what any whole-repo read costs.

## Licence

MIT, copyright 2026 DietrichGebert (`LICENSE`, `package.json`). Keep the notice if you copy skills.

## When it helps, when it is overkill

- **Helps:** agents that add libraries, wrappers and config nobody asked for; a codebase drowning in near-duplicate helpers; a one-off "what should we fix first" audit with plain-English findings; teams that want deferred shortcuts written down.
- **Overkill or wrong:** greenfield architecture work where you want options explored; learning code, where shortest is not clearest; projects that need a full spec and test lifecycle (use `agent-skills-engineering-lifecycle`); a security review (use built-in `security-review`; the audit's security pass is one of six lenses). If you only want the audit, copy that one skill.

## Not verified

The README numbers (-53% code, -45% tokens, 98% vs 68% risky logic tested) come from the author's own benchmark, 39 tasks with Opus 5.5 and model-graded judging; not reproduced. Whether the band's module API (`import ... from 'claude-code'`, `hooks/claude-band.json` `modules`) loads on your Claude Code version. Whether `/ponytail-audit` finds what it claims on a large repo. Sponsor (GreenPT) and the ponytail.dev waitlist were not looked at. Only one commit was in the shallow clone, so history was not checked.

## Checklist

- [ ] Decided between the always-on mode (plugin) and only the audit/review/debt skills (copy).
- [ ] If plugin: `ledger` option set as wanted, `webhookUrl` left empty unless a team board needs it, `PONYTAIL_SUBAGENT_MATCHER` set if search agents should stay neutral.
- [ ] Declined or reviewed the statusline offer before it touches `~/.claude/settings.json`.
- [ ] Built-in `code-review` / `security-review` still used where they fit.
- [ ] On removal: `node scripts/uninstall.js` first, then `rm -r ~/.config/ponytail/band`.
