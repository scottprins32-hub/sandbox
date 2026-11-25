---
name: impeccable-frontend-audit
description: Decides whether and how to use Impeccable (pbakaus/impeccable), an Apache-2.0 design skill for coding agents with one `/impeccable` skill and 24 commands (critique, audit, polish, bolder, quieter, typeset, layout, colorize, harden, live and more), a deterministic "AI slop" detector CLI, edit-time hooks and a downloaded Rust engine binary, and which parts to install. Use this whenever the user wants a frontend critiqued, audited or polished, asks to stop UI looking generic or AI-made, wants a design lint in CI, mentions /impeccable, DESIGN.md or PRODUCT.md, or names Impeccable - even if they never name it. Main caveat - the installer adds hooks that run a downloaded binary on every edit, the skill contacts impeccable.style each session, and live mode's Apply can launch `claude` or `codex` with permissions bypassed.
---

# Impeccable (design commands and slop detector)

Read 2026-11-25: README, LICENSE, NOTICE.md, `.claude-plugin/` manifests, `.claude/settings.json`, `plugin/hooks/hooks.json`, `.claude/skills/impeccable/SKILL.md`, `reference/craft-floor.md`, the headings of `reference/audit.md` and `critique.md`, one agent file in `.claude/agents/`, the launcher `scripts/impeccable` and `engine-checksums.txt`, `docs/RUNTIME-ENV.md` (account, health upload, Pro), and grep of `crates/` for network endpoints and the update check. About 5,000 files; the Rust crates, extension, live-mode scripts and website were sampled only. Latest commit 2026-11-24 (skill 4.11.0, engine 0.1.30). Nothing was installed or run.

## What it is

- One skill, `impeccable`, routing 24 sub-commands to playbooks in `reference/`; five subagents (finish, motion, documenter, asset producer, manual-edit applier); a hook; a Rust engine binary (`impeccable`) with `detect`, `shot` (screenshots), `context`, `live` and more; a Chrome extension and a VS Code extension.
- Started from Anthropic's `frontend-design` skill (README). iOS and Android references derive from ehmo's MIT `platform-design-skills`.
- Licence Apache-2.0; `extension/walks/consent-rules.js` is MPL-2.0 (DuckDuckGo autoconsent). Free to use. An optional sign-in and a paid "Pro" rule pack exist (`impeccable login`, impeccable.style/pricing; pricing not read).

## Commands by category (README grouping)

- **Steer:** `bolder`, `quieter`, `distill`, `colorize`, `typeset`, `layout`, `animate`, `delight`, `overdrive`.
- **Review:** `critique` (scored UX review against heuristics, P0-P3 issues, persona red flags), `audit` (accessibility, performance, theming, responsive, implementation integrity, health score).
- **Finish:** `polish`, `harden` (errors, i18n, overflow, edge cases), `clarify` (UX copy), `adapt` (devices; native variant), `optimize` (performance), `onboard` (first run, empty states).
- **Iterate live:** `live` (pick an element in your running dev server, cycle variants, write back), `generate` (variants of a named element).
- **Plan and set up:** `shape` (UX plan before code), `init` (writes `PRODUCT.md`), `document` (writes `DESIGN.md`), `extract` (patterns into a design system). `craft` is a deprecated alias, so 23 do real work.
- Also `hooks`, `doctor`, `pin`, `foundations`. Bare `/impeccable` shows a menu and never auto-runs a command.

## How it works

- `init` interviews you once and writes `PRODUCT.md`; every later command runs `impeccable context` first, which loads `PRODUCT.md`, `DESIGN.md` and a per-surface brief. Working files go in `.impeccable/` (README lists which to commit and a `.gitignore` block).
- Four "modes" set ambition: Persuade (landing, pricing), Operate (app UI), Read (docs), Experience (portfolios). Bold on Persuade, restraint on Operate and Read.
- Verifies by screenshot (`impeccable shot`) and batches fixes per look. `craft-floor.md` is read before any UI edit.
- Detector: README says "62 deterministic rules", "No LLM, no API key". Source files get pattern rules; contrast and tiny-text rules need a rendered URL. Outputs `--json`, `--github`, `--sarif`; exit 2 = findings, 1 = scan failed.

## Distilled rules worth keeping (attributed to `craft-floor.md`)

- Body text at least 4.5:1, large text 3:1; secondary text on coloured surfaces is tinted from that hue, never grey.
- Shadows carry an offset and soft blur; a zero-offset coloured halo is decoration.
- Measure 65-75ch; more space above a heading than below; check hover, disabled, loading, error and empty states.
- Category defaults to avoid unless the brief asks: same-size icon-heading-text card grids, nested cards, gradient text, decorative glass, a coloured bar down one side of a rounded box, emoji as icons. It bans eyebrow labels above headings outright.
- A pinned brief beats its taste rules ("The brief wins").

## Overlap with existing skills (use the specialist for values)

- `critique` overlaps `web-design-review-loop` (screenshots, machine audit, scored read-through) and `attention-and-hierarchy` (where the eye lands). Pick one review loop per task.
- `typeset` overlaps `typography-system`; `colorize` and `audit`'s theming overlap `color-and-theming`; `layout` overlaps `spacing-and-layout`; `extract` and `document` overlap the token layer in `ui-craft`.
- New landing pages and "build in a brand's look" overlap `power-design-skill`; a ready component library is `astryx-design-system` instead.
- Where its bans conflict with a project's own `DESIGN.md` or the skills above (eyebrows, accent bars), the project's written decision wins.

## Install (from the README)

```bash
npx impeccable install                      # detects tools, asks project or global, offers the hook
npx impeccable install --providers=claude --scope=project
/plugin marketplace add pbakaus/impeccable  # Claude Code plugin route, then /plugin
npx impeccable detect src/                  # detector only, no agent
```

No-hook route: copy `.claude/skills/impeccable` from a commit you have read into your project (`mkdir -p .claude/skills && cp -r .claude/skills/impeccable your-project/.claude/skills/`); this skips the hook and subagents. Then `/impeccable init`, then a narrow target: `/impeccable critique the pricing cards`.

## What runs automatically

- Hooks (installer or plugin): SessionStart, PostToolUse on every `Edit|Write`, and Stop (30 s "deep pass"), each running the engine. README: in Claude Code these "run even when you deny the model's own commands", so the first edit can download the engine. Turn off with `/impeccable hooks off` or `--settings '{"disableAllHooks": true}'`.
- Engine: the launcher downloads `impeccable-<os>-<arch>` from GitHub releases into `~/.impeccable/bin/` on first use and checks SHA-256 against `engine-checksums.txt`. An upgrade by file copy can leave an old binary in place.
- The repo's own `.claude/settings.json` has the same hooks: opening the clone itself in Claude Code runs them.
- Live mode Apply: if no chat session polled in the last minute it runs `codex` or `claude` from PATH "with approvals, permission checks, and sandboxing off", inheriting your environment, and runs your `package.json` script `impeccable:manual-edit-validate`. Set `IMPECCABLE_LIVE_COPY_AGENT=chat` (or `off`) before starting live mode, and only on local checkouts.

## Data leaving the machine

- Every new design: one GET to `impeccable.style/api/roll` (scope, mode, a seed key, a counter) for visual directions; telemetry-off does not stop it. With telemetry on, which direction you picked is recorded. Off: `npx impeccable telemetry off`, `DO_NOT_TRACK=1`, or `"telemetry": false` in `.impeccable/config.json`.
- `context` checks impeccable.style for a newer version (cached in `~/.impeccable/update-check.json`).
- Signed in with telemetry on, full `detect` runs of a git repo upload rule counts and the repo's name to your account. README: project files, code and `PRODUCT.md` "are never sent"; the privacy page was not read.
- URL scans use your installed Chrome or Edge; the extension overlays findings on any site.

## Blurb vs repo

"Audit UX and refine frontend design" undersells it: it also builds new pages (optionally from generated image comps), runs a live in-browser variant editor, ships CI and browser tooling, and has an account and paid tier.

## Not verified

Rule count and accuracy, the before/after README images, Pro pricing and contents, the privacy page, the extension, and whether the hook's 5 s budget holds on large projects.

## Checklist

- [ ] Decide on the hook before installing; manual copy if you want none.
- [ ] Telemetry off if needed; accept the roll request or work offline (degraded).
- [ ] `IMPECCABLE_LIVE_COPY_AGENT=chat` before any `live` session.
- [ ] Narrow targets; one review loop per task; project `DESIGN.md` beats its bans.
