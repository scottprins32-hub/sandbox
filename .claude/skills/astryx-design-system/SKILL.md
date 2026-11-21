---
name: astryx-design-system
description: Decides whether and how to build UI with Astryx (meta/astryx), Meta's MIT-licensed React 19 + StyleX design system in beta, with 150+ components, seven themes, page templates and an `astryx` CLI plus Claude Code plugin made for agents, and how to set it up without the CLI's surprises. Use this whenever the user wants a ready-made component library or design system for a React app, asks how to stop Claude producing generic or inconsistent UI from raw divs and hex values, wants templates an agent can copy, or mentions Astryx or @astryxdesign - even if they never name it. Main caveat - it is beta (0.7.x), needs React 19, and a global CLI install writes its own skill into ~/.claude/skills and checks npm daily.
---

# Astryx (Meta design system)

"An open source design system that's fully customizable and built for how we build now: by people and the agents working alongside them." Read 2026-11-21: README, LICENSE, CLAUDE.md, `packages/README.md`, `packages/core/README.md` (quick start), `packages/core/package.json`, `packages/cli/package.json` and README, both `scripts/postinstall.mjs`, CLI docs `updates.doc.mjs`, `computer-agent-guide.doc.mjs`, `reference.doc.mjs`, `.claude-plugin/marketplace.json`, `plugins/astryx/` (skill, README, manifest), blog post `astryx-cli-build-command.md`. Last commit 2026-11-20. Nothing was installed or run.

## What it is

- `@astryxdesign/core` (0.7.17): typed React components, theme system, pre-built CSS. No build plugin needed; override with `className` (Tailwind, CSS modules or plain CSS).
- Themes as CSS custom-property overrides: neutral, butter, chocolate, matcha, stone, gothic, y2k. Theme packages ship their own font files (OFL texts included), so pages request no outside fonts.
- `@astryxdesign/cli`: component docs, search, templates, `build "<idea>"` (picks a template to scaffold from), codemods, `swizzle` to eject a component's source.
- Charts (`@astryxdesign/charts`, `@astryxdesign/vega`) are canary only; `lab` is unpublished.
- README claims it grew inside Meta for eight years and powers 13,000+ apps (not verifiable here).

## When to use / not

- Use for a new React 19 app that wants a complete, accessible component set and themes, especially when Claude will write much of the UI.
- Do not switch an existing app's UI stack to it unless asked; its own plugin skill says the same.
- Not for React 18 or older, non-React stacks, or work that needs stable chart components today.

## Setup (exact commands from the README)

```bash
npm install @astryxdesign/core @astryxdesign/theme-neutral @stylexjs/stylex
npm install -D @astryxdesign/cli
npx @astryxdesign/cli init      # prints setup steps, writes the Astryx guide into AGENTS.md / CLAUDE.md
```

CSS imports, in this order (Next.js example): `theme-neutral/fonts.css`, `core/reset.css`, `core/astryx.css`, `theme-neutral/theme.css`, then wrap the app in `<Theme>` from `@astryxdesign/core/theme`. The README recommends a script `"astryx": "node node_modules/@astryxdesign/cli/clients/cli/bin/astryx.mjs"` so agents call the right binary.

Claude Code plugin (a short skill that points Claude at the CLI):

```sh
claude plugin marketplace add meta/astryx
claude plugin install astryx@astryx
```

Agent workflow the plugin prescribes: `astryx build "<idea>"`, then `astryx template <name> <path>`, read `astryx component <Name>` before using a component, and before delivery replace raw `<div>`/`<span>`, imported CSS and hard-coded hex/px with components or tokens, then build the project.

## Traps

- Never run `npx astryx` (unscoped) before the CLI is installed: the CLI README says that name resolves to an unrelated npm package. Always use `@astryxdesign/cli`.
- `init` edits AGENTS.md and CLAUDE.md. Review the diff.
- `npm i -g @astryxdesign/cli`: on first run it writes `~/.agents/skills/astryx/SKILL.md` and always links it into `~/.claude/skills/astryx` (and other agents' folders that exist). Its description triggers on any UI work. Remove it if you don't want that.
- Global installs check the npm registry once a day; `NO_UPDATE_NOTIFIER` or `CI` turns that off.
- When Core is pinned exactly, pin the CLI to the same version (plugin skill rule).
- Astryx prop names differ from other libraries: text in `label` for buttons, badges and tabs; booleans start `is`/`has`; inputs take `value` and `onChange`.
- Postinstall scripts in core and cli only print a one-line "run init" nudge (read, not run).

## Does it remove "AI slop"?

The creator (Jack Roberts video, 2026-11-20) asks this and offers Power Design as a "quick fix". What the repo shows: Astryx does not claim to remove slop. Its fix for poor agent output is good templates to copy (blog post "AI is a copycat so we gave it good examples to copy") plus the token-only rule above. That gives consistent, accessible UI that looks like an Astryx theme; a distinctive look still needs your own theme work. Power Design is a separate skill that emits framework-free HTML and does not use or extend Astryx (see `power-design-skill`).

## What leaves the machine

npm installs; the daily update check; CLI commands you trigger that fetch a URL (blog adapter, theme from an https archive, remote images). A grep found no telemetry, but the CLI was not audited in full.

## Related skills

Token and value decisions: `ui-craft`, `color-and-theming`, `typography-system`, `spacing-and-layout`. Check the result visually with `web-design-review-loop`.

## Not verified

The 150+ component count, accessibility claims, Storybook and docs site (astryx.atmeta.com), bundle size, and how well `astryx build` picks templates.

## Checklist

- [ ] React 19+ and StyleX peer installed; CLI installed scoped, same version as Core.
- [ ] `init` diff to AGENTS.md / CLAUDE.md reviewed.
- [ ] Decided on a global install, knowing it adds `~/.claude/skills/astryx`.
- [ ] CSS imports in the documented order; one theme chosen or customised.
- [ ] Pages scaffolded from templates; no raw hex/px left; project builds.
