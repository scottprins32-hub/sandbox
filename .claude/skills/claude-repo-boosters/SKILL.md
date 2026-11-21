---
name: claude-repo-boosters
description: Router for nine free GitHub repos pitched as making Claude "feel like cheating" (a Jack Roberts video, 20 Nov 2026) - a free-tier LLM router, desktop control through the accessibility tree, web-to-markdown extraction, code-made film styles, two engineering-workflow skill packs, an AI-copy checker, Meta's Astryx design system and a brand-styled deck/site skill - saying which sibling skill covers each, what each really does, and which were deliberately left out. Use this whenever the user shares a "best free repos for Claude" list, asks which Claude Code add-ons, skill packs, plugins or MCP tools are worth installing, wants Claude cheaper, faster at UI, better at writing or able to control apps, or names any of these repos - even if they never name the video. Main caveat - several are the creator's own repos or sponsors, and three of the claims in the video are not in the repos.
---

# Claude repo boosters (router)

From "9 Free Repos That Make Claude Feel Like Cheating", Jack Roberts, YouTube, 20 Nov 2026. The video itself could not be downloaded (YouTube bot check); the repo list comes from its description, and every repo was cloned and read on 2026-11-21. Nothing was installed or run. Treat the video's numbers as the creator's own tests, not as measurements.

## Pick by job

| Job | Repo | Skill | Licence, one line | Biggest catch |
|---|---|---|---|---|
| Run an agent on free model tiers | tashfeenahmed/freellmapi | `free-llm-api-router` | MIT; paid live catalog | "claude-*" names map to free non-Claude models; prompts go to whoever serves them |
| Let a model click and type in native apps | vercel-labs/agent-desktop | `agent-desktop-control` | Apache-2.0 | Real control of your logged-in desktop; on-screen text can inject prompts |
| Turn websites into markdown or structured data | firecrawl/firecrawl | `firecrawl-web-extraction` | AGPL-3.0 server, MIT SDKs | Sponsor of the video; "local" mode still calls Firecrawl Cloud by default |
| Make a styled short film in code | lemomo-ai/lemo-opuscar | `lemo-opuscar-film-styles` | MIT code, CC BY-NC style docs | Setup resets to GitHub main on every run; 8 styles need archive footage, 3 need an image generator |
| Make Claude spec, plan, test, review, ship | addyosmani/agent-skills | `agent-skills-engineering-lifecycle` | MIT | Process weight on small fixes; `/review` and `/plan` clash with built-ins |
| Pick from a 328-skill bundle | affaan-m/everything-claude-code (now ECC) | `everything-claude-code-selection` | MIT | Default install turns on hooks that log every tool call and Bash command |
| Check copy for AI-writing patterns | ItsssssJack/SlopMonster | `slop-monster-copy-cleanup` | MIT | 5/5 only means no regex matched; second pass sends the draft to another provider |
| Build React UI from a real design system | meta/astryx | `astryx-design-system` | MIT, beta 0.7.x | React 19 only; global CLI writes into `~/.claude/skills` |
| On-brand HTML deck or site | ItsssssJack/power-design | `power-design-skill` | MIT (text only) | Copies real brands' looks and logos; URL mode needs Firecrawl |
| Run a game project as a studio of agents | Donchitos/Claude-Code-Game-Studios | `claude-code-game-studios` (already here) | see that skill | Too heavy for a prototype |

## Where the repos narrow the video

- **Free LLM API, "87 free providers for $0":** the catalog lists 87, but you reach only the ones you sign up for, and the up-to-date catalog is paid. The README says it is for experiments, not production. The 22-run speed and pass figures are not in the repo.
- **Agent Desktop, "any model":** it works with any model because it contains none. It also has a screenshot command, and apps without an accessibility tree are invisible to it.
- **Firecrawl:** brand extraction exists only on Cloud or self-hosted and uses an LLM call; "2,900 vs 58,000 tokens" is not in the repo, so measure it on your own pages.
- **Lemo-Opuscar, "no camera":** true for most of the 99 styles, not for the documentary ones.
- **Power Design as a "quick fix" for Astryx:** it has no link to Astryx; it is an alternative, not a fix. Six brands its README names have no file.
- **SlopMonster:** detects patterns; the rewriting is done by the agent. Cold-email and refund-reply before/afters are not in the repo.
- **Everything Claude Code, "314 skills vs 7":** the repo now has 328, and its own README agrees you should start small. "The inspector" and "the diary" are not component names in it.

## Deliberately left out

- **Heretic (p-e-w/heretic):** it strips safety refusals out of open-weight models. No skill was written for it.
- **Cardboard:** a hosted, commercial video editor reached through an affiliate link, not an open repo. Nothing to read.
- **Higgsfield and Glaido:** sponsor links, not repos.

## Before installing any of these

1. Read the sibling skill first; each lists what was and was not verified.
2. Install one at a time and see what it changes: skills, hooks, `CLAUDE.md`, `~/.claude/settings.json`.
3. Never pipe an install script to a shell; read it, or use the Docker or plugin route the skill names.
4. Check what leaves the machine: prompts, page text, screen text, drafts.
5. Keep the skill count small; every loaded description costs context on every turn.
