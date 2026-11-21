---
name: agent-skills-engineering-lifecycle
description: Decides whether and how to adopt addyosmani/agent-skills, an MIT-licensed pack of 26 engineering-workflow skills (spec, plan, build, test, review, ship), 10 slash commands and 5 reviewer subagents, and which subset to install for the task at hand. Use this whenever the user wants Claude to work in a more disciplined, senior-engineer way - spec before code, small planned tasks, TDD, five-axis review, pre-launch go/no-go - or mentions Addy Osmani's Agent Skills, /spec, /plan, /build auto or /ship, even if they never name the repo. Main caveat - the full lifecycle adds steps and tokens a small fix does not need, and its /review and /plan collide with built-in commands.
---

# Addy Osmani's Agent Skills

Read 2026-11-21 at commit 8c99fa3 (2026-11-18, plugin version 0.6.17): README, LICENSE, `.claude-plugin/plugin.json` and `marketplace.json`, all 10 `.claude/commands/*.md`, the 5 `agents/*.md`, every script in `hooks/` with `SDD-CACHE.md` and `SIMPLIFY-IGNORE.md`, the three scripts bundled inside skills, skill frontmatter, `docs/getting-started.md`, `docs/adoption-guide.md`, `docs/comparison.md`. Nothing was installed or run.

## What it is

Markdown workflows, not code. Each `SKILL.md` has steps, a "rationalizations" table (excuses an agent uses to skip a step, with rebuttals), red flags and evidence required before calling it done. The README's lifecycle is Define, Plan, Build, Verify, Review, Ship, and it cites *Software Engineering at Google* as the source of many rules (Hyrum's Law, Beyonce Rule, Chesterton's Fence, ~100-line changes).

## What is inside (counted from the files)

- **26 skills** in `skills/`: 1 router (`using-agent-skills`); Define 4 (`interview-me`, `idea-refine`, `spec-driven-development`, `constraint-driven-development`); Plan 1; Build 7 (incremental, TDD, context-engineering, source-driven, doubt-driven, frontend-ui, api-and-interface-design); Verify 2 (browser DevTools, debugging); Review 5 (code-review, simplification, security, performance, accessibility); Ship 6 (git, CI/CD, deprecation, docs/ADRs, observability, launch).
- **10 Claude commands** in `.claude/commands/`: `/spec /plan /build /test /constraints /review /webperf /a11y /code-simplify /ship`. All set `disable-model-invocation: true`, so they run only when typed.
- **5 subagents** in `agents/`: code-reviewer, test-engineer, security-auditor, web-performance-auditor, accessibility-auditor. No `tools` or `model` lines, so they inherit the session's tools and model.
- **7 shared checklists** in `references/`, plus Gemini, Codex, Antigravity and Copilot adapters and an eval suite (26 case files) for contributors.

## When to use it, and when not

- **Use** for a new feature or project, risky changes, unfamiliar or untested code, or when an agent keeps skipping tests and review.
- **Skip or trim** for typos, one-line fixes and throwaway scripts. The router says "When in doubt, start with a spec" and the adoption guide calls skipping `/spec` for a prototype an anti-pattern, so it leans towards process. The creator's caveat (it is slower on simple jobs) is consistent with that; the repo has no measurement of it.
- **Brownfield order** (adoption guide): `context-engineering` first, then `code-review-and-quality`, `debugging-and-error-recovery`, `doubt-driven-development`; tests before change; full lifecycle only for new features.
- For a one-off review of a diff, the built-in `code-review`, `simplify` and `security-review` are enough; this pack adds the process around them.

## Install a subset (commands from the README)

Whole pack as a Claude Code plugin (all 26 skills, 10 commands, 5 agents; no hooks):

```
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```

One skill at a time through Vercel's third-party `skills` CLI (this runs npm code):

```bash
npx skills add addyosmani/agent-skills --list
npx skills add addyosmani/agent-skills --skill test-driven-development
```

No-code route: clone and copy `skills/<name>/` into `.claude/skills/`. The README warns a single-skill copy leaves out the repo-level `references/` folder (issue #361); 12 skills point at it (code-review, TDD, security, performance, accessibility, planning, incremental, shipping, observability, frontend-ui, doubt-driven, the router). Copy the checklist they name into `references/` inside the skill, or paths break silently.

## Hooks and scripts: what runs automatically

**Nothing.** There is no `hooks/hooks.json` and `plugin.json` declares no hooks. The four hook scripts only run if you wire them into settings yourself:

- `session-start.sh`: injects the whole router skill at SessionStart. Its header says not to use it on Claude Code, which already routes skills by description (two routers fight).
- `sdd-cache-pre.sh` / `sdd-cache-post.sh` (WebFetch): **makes network calls** (`curl -I` to every fetched URL) and stores the fetched page text in `.claude/sdd-cache/` inside the project. On a 304 it blocks WebFetch (exit 2) and feeds back the cached text.
- `simplify-ignore.sh` (Read, Edit/Write, Stop): **rewrites source files on disk** while a session runs, swapping `simplify-ignore` blocks for `BLOCK_<hash>` placeholders, with backups in `.claude/.simplify-ignore-cache/`. A crash leaves placeholders in your files (recover with `echo '{}' | bash hooks/simplify-ignore.sh`). If a file is moved, it writes `<file>.recovered` next to the original. Commit before enabling it.

None of them auto-approves permissions. Scripts inside skills: `audit-a11y.sh` runs `npx --yes` for pinned `@axe-core/cli@4.13.0` and `pa11y@9.1.1` (downloads from npm); `idea-refine.sh` only creates `docs/ideas/`; `quality-gate.mjs` reads reports. `doubt-driven-development` can send your code to **Gemini CLI or Codex CLI** for a cross-model review; the skill says to ask the user first and writes the prompt to `/tmp/doubt-prompt.md`.

## Conflicts with an existing .claude setup

- `/review` and `/plan` clash with built-in names; the README says use `/agent-skills:review`. A manual copy of the commands into `.claude/commands/` would shadow or be shadowed.
- `/plan` tells Claude to enter plan mode; `/ship` starts three subagents in parallel; `/build auto` runs every task after one approval (it still tests and commits each task, and stops on failures).
- Do not run this pack's router alongside another framework's (Superpowers, Matt Pocock's skills, or `everything-claude-code-selection`): `docs/comparison.md` says stacked routers fight over command names and TDD rules.
- Skills write `SPEC.md`, `tasks/plan.md`, `CONSTRAINTS.md`, `docs/ideas/` and ADRs into the project. Agree where they go.

## Context cost

Descriptions of all 26 skills total about 10,600 characters (roughly 2,700 tokens) in the always-on skill list. Bodies total about 54,000 words; the biggest are `constraint-driven-development` (~3,700) and `code-review-and-quality` (~3,400), so each one invoked costs several thousand tokens. The adoption guide itself says not to load all 26 into every session.

## Licence

MIT, copyright 2025 Addy Osmani (`LICENSE`); plugin manifests say MIT too. Keep the notice if you copy skills into your own repo.

## Most useful pieces (from the repo, one line each)

- `spec-driven-development`: a short PRD (objective, commands, structure, testing, boundaries) before code.
- `planning-and-task-breakdown`: vertical slices with acceptance criteria and dependency order.
- `test-driven-development`: red-green-refactor and the Prove-It pattern for bugs (failing test first).
- `code-review-and-quality`: five axes with severity labels that separate blocking from non-blocking comments.
- `debugging-and-error-recovery`: reproduce, localize, reduce, fix, guard.
- `doubt-driven-development`: fresh-context adversarial check of a confident claim before it ships.

## Not verified

Whether the skills make output better or the claim that they work "like a senior engineer" (creator's words); the one cited experiment (Om Mishra, Superpowers vs agent-skills) is a single task, which the repo itself says. Whether Claude Code also loads the TOML files under `commands/` that `plugin.json` lists. The `npx skills` CLI itself. Eval results. Only one commit was in the shallow clone, so history and release cadence were not checked.

## Checklist

- [ ] Task is big or risky enough for the lifecycle; for small fixes use one skill or none.
- [ ] Installed only the skills needed, with their `references/` files if copied by hand.
- [ ] One router only; namespaced `/agent-skills:review` used where names clash.
- [ ] Any optional hook read and committed-before-enable; `.claude/sdd-cache/` and `.claude/.simplify-ignore-cache/` in `.gitignore`.
- [ ] User asked before any cross-model review sends code to another provider.
