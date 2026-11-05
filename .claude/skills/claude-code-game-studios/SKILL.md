---
name: claude-code-game-studios
description: Sets up and drives Donchitos/Claude-Code-Game-Studios, a template that turns one Claude Code session into a game studio of 49 agents, 74 slash-command skills and 15 hooks with approval gates. Use this whenever the user wants structured game development in Claude Code - brainstorming a design, writing GDDs, sprint and story planning, engine setup, design or code review gates, release checklists - or mentions "game studio", /start, /brainstorm, /setup-engine, or running a game project with directors and department leads, even if they never name the repo.
---

# Claude Code Game Studios

A template, not a game. It gives one session roles and review gates; **you still decide**: agents propose options, draft, and wait for approval. Source README read 2026-10-26; re-check it for anything newer.

## Decide first

- **Is the project big enough?** For a weekend prototype the process weight costs more than it returns. Use `modes.rigor=minimal` (the default) or skip the template and use `godot-mcp-workflow` directly.
- **Which engine?** The template ships specialists for Godot 4, Unity and Unreal Engine 5. `/setup-engine godot 4.7` style commands choose one.
- **Platform:** primary development was on Windows with Git Bash; macOS and Linux are described as tested. `notify.sh` is a no-op outside Windows.

## Install

```bash
git clone https://github.com/Donchitos/Claude-Code-Game-Studios.git my-game
cd my-game
claude            # from the folder containing CLAUDE.md and project.yaml
```

Start Claude Code **from the project root**. From a subfolder, the project's hooks, deny rules and ask-first permission mode are skipped. Requirements: Git, Claude Code, Python 3 (every skill and hook reads `project.yaml`; without it settings silently fall back to defaults), Bash, and `jq` recommended.

## The minimal path

`/start` -> `/setup-engine` -> `/brainstorm` -> `/create-stories` -> `/dev-story` <-> `/story-done`

`/start` asks where you are and routes you. For an existing project use `/adopt` or `/project-stage-detect`.

## Rigor modes (`project.yaml`)

| `modes.rigor` | Effect |
|---|---|
| `minimal` (default) | No GDDs required, terse docs, solo review |
| `standard` | Five required GDD sections, lean review |
| `full` | All eight GDD sections, full director review |

Inspect or change with `/settings`, `/settings modes.rigor=full` (team-wide) or `/settings --local ...` (personal, `project.local.yaml`).

## Commands worth knowing

Design `/brainstorm`, `/map-systems`, `/design-system`; planning `/create-epics`, `/create-stories`, `/sprint-plan`; build `/dev-story`, `/prototype`, `/vertical-slice`; checks `/code-review`, `/design-review`, `/gate-check`, `/qa-plan`, `/smoke-check`; release `/release-checklist`, `/changelog`, `/patch-notes`; team runs `/team-combat`, `/team-ui`, `/team-qa`, etc. Run `/help` for the full list rather than trusting this summary.

## What it changes (read from `.claude/settings.json`, hooks and agent files)

- **Permissions:** `defaultMode: default`; 3 allow rules (`dir`, `python -m pytest`, `py -m pytest`) and about 110 deny rules: recursive-force `rm`, force `git push`, `git reset --hard`, forced `git clean`, `sudo`, `chmod 777`, reading or editing `.env*`, editing `.uasset`/`.umap`, plus PowerShell equivalents. No `ask` rules.
- **Hooks wired in settings:** SessionStart (`session-start.sh`, `detect-gaps.sh`); PreToolUse on Bash/PowerShell (`validate-commit.sh`, `validate-push.sh`), on Write/Edit (`validate-registry.sh`, `validate-write.sh`), on Read (`validate-read.sh`); PostToolUse (`validate-assets.sh`, `validate-skill-change.sh`); Notification, PreCompact, Stop (async), SubagentStart/Stop. Only `session-start.sh` and `validate-commit.sh` were read.
- **`validate-commit.sh`** blocks (exit 2) only when staged JSON under the data folders is invalid or Python 3 is missing; everything else is advisory (missing GDD sections, hardcoded gameplay numbers, TODO/FIXME without an owner).
- **`session-start.sh`** prints a context banner (branch, last 5 commits, review mode, schema errors, sprint, open bugs); its update check uses a cache, no network call.
- **Agent files** are Claude Code subagents: frontmatter `name`, `description`, `tools`, `model`, `maxTurns`, `memory: project`, `disallowedTools`. `creative-director` is `model: opus`, has `Bash` disallowed, and must get user approval before writing documents. **Skills** carry `user-invocable`, `allowed-tools`, `model: sonnet`, and a `!` line that runs `yaml-helper.sh resolve_config` at invocation.
- **`project.yaml`** ships almost empty (`schema_version: 1`, `framework.version: 1.2.0`); its comments say the review/workflow/density/QA/granularity/team knobs must not be seeded there. Per-developer overrides go in gitignored `project.local.yaml`. Skill fallbacks stated: workflow `minimal`, review mode `solo`, automation `collaborative`, docs density `terse`. The README calls the process-weight setting `modes.rigor`; the files use `modes.workflow` / `modes.review_mode`, so use `/settings` to see the live names.
- **Engines:** `/setup-engine` names Godot, Unity and Unreal; its version step searches the web and probes the installed binary instead of pinning a version.

## Caveats from the README

- Hook counts are inconsistent in the docs (15 vs 18 scripts); do not depend on an exact figure.
- `git` deny rules match anywhere after `git`, so `git commit -m "push + pull"` is denied. Reword messages.
- `guided` / `autonomous` modes, and Claude Code auto mode, trade away confirmation prompts. The safety model changes; read `.claude/settings.json` first.
- The author's claim that `standard` rigor produced the lowest-ranked game comes from their own four-game experiment; do not treat it as evidence.

## Ship checklist

- [ ] Session started from the project root.
- [ ] `python3` available (check before trusting `/settings` output).
- [ ] Rigor level chosen on purpose and written to `project.yaml`.
- [ ] `.claude/settings.json` and hooks read before first run.
- [ ] Engine set with `/setup-engine` before any `/dev-story`.
