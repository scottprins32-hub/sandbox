---
name: superpowers-workflow
description: Decides whether and how to adopt Superpowers (obra/superpowers, plugin superpowers@claude-plugins-official, MIT), Jesse Vincent's 15-skill methodology that makes Claude brainstorm intent, write a bite-sized plan, work in a git worktree, run strict TDD, execute the plan through fresh subagents with a review after each task, and finish the branch, all triggered automatically by a SessionStart bootstrap. Use this whenever the user wants Claude to plan before coding, run a multi-hour plan autonomously with subagents, dispatch parallel agents on independent bugs, enforce red-green TDD or verification before "done", or mentions Superpowers, brainstorming, writing-plans, subagent-driven-development or "you have superpowers" - even if they never name the repo. Main caveat - its bootstrap tells Claude to invoke any skill with even a 1% chance of applying before any reply, which makes every task, and every other installed skill, heavier.
---

# Superpowers

Read 2026-11-25 at commit 22f0b46 (2026-11-03, version 7.0.2): README, LICENSE, `RELEASE-NOTES.md` (v7.0.2), `.claude-plugin/plugin.json` and `marketplace.json`, `package.json`, `hooks/hooks.json`, `hooks/session-start`, `hooks/run-hook.cmd`, all 15 `skills/*/SKILL.md` frontmatter, the bodies of using-superpowers and its `claude-code-tools.md`, parts of brainstorming, subagent-driven-development, dispatching-parallel-agents, using-git-worktrees, finishing-a-development-branch, writing-plans, test-driven-development, diagnosing-superpowers, and the scripts in brainstorming, executing-plans and subagent-driven-development (headers, writes, network). Nothing was installed or run.

## What it is

A process, written as skills, plus one hook that loads the router into every session. The README's basic workflow: brainstorming, using-git-worktrees, writing-plans, subagent-driven-development (or executing-plans), test-driven-development, requesting-code-review, finishing-a-development-branch. "Mandatory workflows, not suggestions." It is maintained by Prime Radiant, which offers paid enterprise support.

## What is inside (counted from the files)

- **15 skills**, all model-invoked (none set `disable-model-invocation`): Testing 1 (`test-driven-development`); Debugging 3 (`systematic-debugging`, `verification-before-completion`, `diagnosing-superpowers`); Collaboration 9 (`brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `requesting-code-review`, `receiving-code-review`, `using-git-worktrees`, `finishing-a-development-branch`); Meta 2 (`writing-skills`, `using-superpowers`).
- **No slash commands, no agent files, no MCP.** Reviewer and implementer prompts are templates inside skills (`requesting-code-review/code-reviewer.md`, `subagent-driven-development/*-prompt.md`).
- **1 hook** (SessionStart). Scripts inside skills: a zero-dependency local brainstorm web server, 4 SDD helpers (`sdd-workspace`, `task-brief`, `review-package`, `sdd-repo`), 2 executing-plans helpers, `find-polluter.sh` for test pollution, a Graphviz renderer for writing-skills.
- Adapters for about 16 other agents; plugin tests in `tests/`; behaviour evals live in a separate repo.

## Most worth using (from the repo, one line each)

- `brainstorming`: asks why first, one question at a time, only questions that change what gets built; small changes agreed in chat, projects get a committed design doc.
- `writing-plans`: tasks of 2-5 minutes with exact paths, code and verification, saved to `docs/superpowers/plans/`.
- `subagent-driven-development`: a fresh subagent per task, then spec and quality review, with explicit model choice per role (cheap for mechanical tasks).
- `systematic-debugging`: four-phase root-cause process with root-cause tracing and condition-based waiting.
- `verification-before-completion`: run the check and read its output before claiming success.
- `dispatching-parallel-agents`: one subagent per independent failure, all dispatched in one message.

## Install (commands from the README)

```
/plugin install superpowers@claude-plugins-official
```

Or the author's marketplace, which also lists related plugins:

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

There is no subset option. To take only a few skills, clone and copy folders into `.claude/skills/`; without the hook they still trigger by description. Copy `subagent-driven-development` whole (its prompts, `references/` and `scripts/`), and `executing-plans` only together with it: its helpers call `../../subagent-driven-development/scripts`. Skills cross-reference each other as `superpowers:<name>`, so a copy outside the plugin may need those names edited.

## What runs automatically

- **SessionStart** (startup, clear, compact; synchronous): `run-hook.cmd` finds bash (or zsh) and runs `hooks/session-start`, which reads `skills/using-superpowers/SKILL.md` and injects it inside `<EXTREMELY_IMPORTANT>` tags. No child processes, no network, no file writes, no permission changes. That is the only hook.
- The injected text says: "If you think there is even a 1% chance a skill might apply ... you ABSOLUTELY MUST invoke the skill", before any reply including clarifying questions, and "Before entering plan mode ... invoke the brainstorming skill first". It also says CLAUDE.md and direct user requests take precedence, and tells subagents to ignore it.

What the skills do when they fire:

- **Visual companion** (optional part of brainstorming, offered to you first): `start-server.sh` runs a Node server on 127.0.0.1, random port, token in the URL and an HttpOnly cookie, 4-hour idle timeout; files go to `/tmp/brainstorm-<id>` or `.superpowers/brainstorm/`. `--host 0.0.0.0` exposes it to the network. **Telemetry:** the page loads the Prime Radiant logo from `primeradiant.com` with the Superpowers version in the query string. Off with `SUPERPOWERS_DISABLE_TELEMETRY`, `DISABLE_TELEMETRY` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`.
- **Repo writes and commits:** design docs to `docs/superpowers/specs/` (committed), plans to `docs/superpowers/plans/`, SDD workspace in `.superpowers/sdd/<plan>/` (git-ignored by its own `.gitignore`), worktrees in `.worktrees/`; if that is not ignored, `using-git-worktrees` adds it to `.gitignore` **and commits**. TDD tells the agent to **delete code written before its test**. `finishing-a-development-branch` offers merge, push and PR, or discard (force-delete) only on explicit request; it forbids `--force` on its own initiative.
- **Autonomy:** SDD tells the controller to record "Rulings" and keep going rather than stop to ask; the README says runs of "a couple hours" are common. Implementers run one at a time (the skill says never in parallel, to avoid conflicts), each with a review, so cost grows per task.
- `diagnosing-superpowers` reads session transcripts; it builds a scrubbed bug-report bundle and searches GitHub issues only after you approve.

## Conflicts with an existing .claude setup

- The 1% rule applies to every installed skill, not just Superpowers', so a large `.claude/skills/` gets invoked far more often. Say in `CLAUDE.md` when to skip skills; the bootstrap defers to it.
- It reroutes the built-in plan mode through brainstorming. `requesting-code-review` overlaps the built-in `code-review` and `simplify`.
- Run one framework: not with `agent-skills-engineering-lifecycle`, `mattpocock-skills-selection` or `everything-claude-code-selection` (competing routers, TDD rules and plan formats). `ponytail-minimal-code` pulls the opposite way on process.
- Creates `docs/superpowers/`, `.superpowers/` and `.worktrees/` in your repo.

## Context cost

Every startup, `/clear` and compaction: the bootstrap, about 3,200 characters (roughly 800 tokens). Descriptions of 15 skills: about 2,300 characters (roughly 600 tokens). Bodies total about 22,000 words; with supporting files, writing-skills is about 14,500, brainstorming 10,000, subagent-driven-development 10,000. A full SDD run adds a subagent context plus a review per task; `claude-code-tools.md` describes an opt-in cheaper setup with one mid-tier orchestrator subagent.

## Licence

MIT, copyright 2025 Jesse Vincent (`LICENSE`, `plugin.json`).

## When it helps, when it is overkill

- **Helps:** a new feature or project you can describe but have not designed; long plans you want run unattended with review gates; agents that claim "done" without running tests; several unrelated failing tests at once.
- **Overkill:** quick questions, one-line fixes, exploratory spikes, or repos where you do not want worktrees and committed docs. The bootstrap's own table rejects "The skill is overkill", so you must say so in `CLAUDE.md` or the prompt.

## Not verified

The release notes' eval numbers (blind-graded brainstorming conversations) and the "couple hours autonomously" claim; the evals repo was not read. How the official marketplace pin tracks releases. The Superpowers marketplace's other plugins. The brainstorm server's auth beyond reading its header and token code. Only one commit was in the shallow clone.

## Checklist

- [ ] The task is big enough for brainstorm, plan, worktree, TDD and review; otherwise use one skill or none.
- [ ] `CLAUDE.md` says when to skip skills, so the 1% rule does not hit small tasks.
- [ ] `SUPERPOWERS_DISABLE_TELEMETRY=1` set if the visual companion must not contact primeradiant.com; never `--host 0.0.0.0` on a shared network.
- [ ] Agreed whether `docs/superpowers/`, `.superpowers/` and `.worktrees/` (and the `.gitignore` commit) are fine in this repo.
- [ ] One workflow framework installed, not two.
