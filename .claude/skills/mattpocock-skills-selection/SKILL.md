---
name: mattpocock-skills-selection
description: Picks which of Matt Pocock's skills (mattpocock/skills, plugin mattpocock-skills, MIT) to use - 27 promoted skills, 16 typed-only and 11 the model can call, for grilling a plan, a shared GLOSSARY.md and ADRs, spec and tracer-bullet tickets on GitHub, GitLab or local files, TDD, bug diagnosis, deep-module architecture review and two-axis code review - and how to install all or a few without surprises. Use this whenever the user wants Claude to interview them before building, align on terminology, turn a chat into a spec or issues, review a branch against its spec, find architecture "deepening" opportunities, or mentions Matt Pocock, /grill-me, /grill-with-docs, /to-spec, /to-tickets, /wayfinder or /implement-spec - even if they never name the repo. Main caveat - the issue-tracker skills create and close real GitHub or GitLab issues and labels, and its code-review, research and prototype skills share names with Claude Code built-ins.
---

# Matt Pocock's skills

Read 2026-11-25 at commit 6f7f783 (2026-11-25, plugin version 1.3.2): README, LICENSE, CLAUDE.md, SCOPE.md, `.claude-plugin/plugin.json` and `marketplace.json`, `package.json`, `.agents/invocation.md`, `.agents/adr/0002-ship-as-a-claude-code-plugin.md`, all 9 `.out-of-scope/*.md` names and `harness-name-collisions.md`, `question-limits.md` in full, frontmatter of every `SKILL.md`, bodies of grilling, grill-me, grill-with-docs, implement, implement-spec, code-review (part), improve-codebase-architecture (part), setup-matt-pocock-skills, research, handoff, `issue-tracker-github.md`, the 4 repo `scripts/` and the 3 scripts inside skills. Nothing was installed or run.

## What it is

Plain Markdown skills, no hooks, no commands folder, no subagent definitions, no MCP. The author pitches them as small and composable, against frameworks that "own the process" (GSD, BMAD, Spec-Kit). The leaderboard's "design codebases and review implementations" covers part of it; the README's headline is alignment (grilling sessions and a shared domain language), and much of the pack is an issue-tracker workflow (spec, tickets, triage).

## What is inside (counted from the files)

- **39 `SKILL.md` files** in 4 buckets: engineering 20, productivity 7, misc 4, in-progress 8. The plugin ships exactly the **27 promoted** ones (engineering + productivity); misc is frozen, in-progress is beta and not shipped.
- **16 user-invoked** (`disable-model-invocation: true`, run only when typed): ask-matt (router), grill-with-docs, triage, improve-codebase-architecture, setup-matt-pocock-skills, to-spec, to-tickets, wayfinder, implement, implement-spec, retro, grill-me, handoff, teach, to-questionnaire, wait-what.
- **11 model-invoked** (Claude may call them): diagnosing-bugs, tdd, prototype, research, domain-modeling, codebase-design, code-review, pr, wizard, grilling, writing-for-agents. User-invoked skills orchestrate by calling these through the Skill tool (for example `grill-me` is one line: call `grilling`).
- 3 bundled script templates: a human-in-the-loop repro script and a bash "wizard" template (the agent copies and edits them), and, in misc, a git guardrail hook.

## Most worth using (from the repo, one line each)

- `/grill-me` and `/grill-with-docs`: rounds of numbered questions with a recommended answer each, until every branch of the design is settled; the second also updates `GLOSSARY.md` and ADRs in `docs/adr/`. The author's most popular.
- `tdd`: red-green-refactor one vertical slice at a time, with notes on good tests and mocking.
- `diagnosing-bugs`: build a loop that goes red on this bug first, then minimise, hypothesise, instrument, fix, regression-test.
- `code-review`: Standards (repo docs plus a Fowler smell baseline) and Spec (does it match the issue) as two fresh parallel subagents over `git diff <point>...HEAD`.
- `/improve-codebase-architecture`: finds shallow modules in recently changed areas, writes an HTML report to your temp dir and opens it, then grills one candidate. A survey, not a refactor.
- `/to-spec` then `/to-tickets`: turn the conversation into a spec and dependency-ordered tickets.
- `/handoff`: summary for a fresh session, saved to the OS temp dir with secrets redacted.

## Install (commands from the README)

Whole set, from Anthropic's official marketplace (auto-updates by default, pinned to a commit the listing moves):

```bash
claude plugin install mattpocock-skills@claude-plugins-official
```

In a session, `/plugin install mattpocock-skills@claude-plugins-official`. The repo's own `.claude-plugin/marketplace.json` is kept as a fallback for forks or unreleased commits.

A subset, as editable copies you update by hand (third-party skills CLI; runs npm code):

```bash
npx skills@latest add mattpocock/skills -a <agent>
```

It asks which skills to take; include `setup-matt-pocock-skills` if you want the tracker flows. Pick one route: the README warns both together give every skill twice. No-code route: copy `skills/<bucket>/<name>/` into `.claude/skills/`, plus any model-invoked skill it calls (`grill-with-docs` needs `grilling` and `domain-modeling`; `implement` needs `tdd` and `code-review`; `improve-codebase-architecture` needs `codebase-design` and `grilling`). `scripts/link-skills.sh` symlinks everything into `~/.claude/skills` and `~/.agents/skills`; it is marked maintainer-only.

## What runs automatically

**Nothing.** No hooks, no settings changes, no telemetry. What the skills do when invoked:

- `/setup-matt-pocock-skills` (once per repo) edits `CLAUDE.md` or `AGENTS.md` (adds an `## Agent skills` block after showing a draft), writes `docs/agents/issue-tracker.md`, `domain.md`, `triage-labels.md`, and on GitHub or GitLab **creates labels** with `gh label create` / `glab label create`.
- `to-spec`, `to-tickets`, `triage`, `wayfinder` **create, comment on, label, assign and close real issues** through `gh` or `glab` (or local Markdown files if you chose that). That is data leaving the machine to your tracker.
- `implement` commits to the current branch. `implement-spec` creates an integration branch, runs background implementer subagents each in its own worktree, merges them with a merger subagent, may open a draft PR, then cleans up worktrees. Many subagents means many tokens.
- `research` runs a background agent that reads primary sources (web) and writes a cited Markdown file into the repo.
- `code-review`, `grilling` and `improve-codebase-architecture` start fresh-context subagents.
- misc `git-guardrails-claude-code` (not in the plugin) writes a PreToolUse hook that blocks `git push`, `reset --hard`, `clean -f`, `branch -D` into project or global `settings.json`, after asking which.

## Conflicts with an existing .claude setup

- `code-review` collides with the built-in `code-review`; `research` and `prototype` with built-in names in some harnesses. The author will not rename (`.out-of-scope/harness-name-collisions.md`); use `/mattpocock-skills:code-review`. Built-in `code-review` hunts bugs; this one checks standards and spec, so they complement each other.
- Writes `GLOSSARY.md`, `docs/adr/`, `docs/agents/` and edits `CLAUDE.md`. Agree locations first if the repo has its own conventions.
- `ask-matt` is a router over its own skills; do not also run another framework's router (`agent-skills-engineering-lifecycle`, `superpowers-workflow`, `everything-claude-code-selection`). One TDD and one planning flow per session.
- Grilling has no question cap by design (`question-limits.md`); say "wrap up" to stop it.

## Context cost

Always-on: descriptions of the 11 model-invoked skills, about 2,200 characters (roughly 550 tokens). The 16 user-invoked descriptions (about 1,700 characters) should only show in the slash menu. Bodies total about 20,000 words (model-invoked 8,400, user-invoked 12,000); the biggest are wayfinder (~2,100), ask-matt (~1,950), writing-for-agents (~1,800), teach (~1,500). `implement-spec` and `code-review` multiply cost through subagents.

## Licence

MIT, copyright 2026 Matt Pocock. `pr` credits a skill by Dex Horthy (Humanlayer); its licence was not checked.

## When it helps, when it is overkill

- **Helps:** vague feature requests, a team with an issue tracker that wants specs and tickets the agent can work from, a codebase whose jargon keeps confusing the agent, a branch review that must check against the spec.
- **Overkill:** a typo or one-line fix; solo scripts with no tracker; anyone who does not want issues filed. Use `grill-me`, `tdd` or `diagnosing-bugs` alone instead of the full spec-to-implement chain.

## Not verified

Whether the skills improve outcomes (no evals in the repo). Whether Claude Code keeps user-invoked descriptions out of model context in your version. The official marketplace pin's current commit. The newsletter and aihero.dev docs pages. The in-progress skills (software-factory, chief-of-staff and others) beyond their frontmatter. Only one commit was in the shallow clone.

## Checklist

- [ ] Chose one route (official plugin or skills CLI copies), not both.
- [ ] Picked the 2-5 skills the task needs, with the model-invoked skills they call.
- [ ] Before `/setup-matt-pocock-skills`: decided tracker (local files if issues must not be created), and reviewed the CLAUDE.md draft.
- [ ] Used `/mattpocock-skills:code-review` explicitly when the built-in is also installed.
- [ ] Budgeted tokens before `/implement-spec`; worktrees cleaned up afterwards.
