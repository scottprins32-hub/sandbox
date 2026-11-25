---
name: diagram-design-skill
description: Decides whether and how to use Diagram Design (cathrynlavery/diagram-design), a free MIT Claude Code skill and plugin that writes one self-contained HTML file with inline SVG in an editorial style (one accent, hairlines, no shadows, 4px grid) across 52 diagram and chart types, redraws draw.io, Mermaid, Excalidraw and PlantUML files, can take a palette and fonts from your website, and exports SVG, PNG or PDF. Use this whenever the user wants an architecture diagram, flowchart, sequence, state machine, ER or schema, swimlane, Gantt, Wardley map, journey, quadrant or similar for a blog, doc, slide or social card, wants an existing Mermaid or draw.io diagram made presentable, or mentions Diagram Design or diagramdesign.dev - even if they never name it. Main caveat - one sentence does not get you a finished picture; it asks style questions first, its output is not a diffable or editable diagram source, and PNG checks need Playwright.
---

# Diagram Design (editorial HTML/SVG diagrams)

"An agent skill that draws diagrams as one self-contained HTML + SVG file, in your brand." Read 2026-11-25: README (install, compare, onboarding, export, "It's working if", "When not to use"), LICENSE, THIRD_PARTY_LICENSES.md, PRIVACY.md, AGENTS.md, CLAUDE.md, CHANGELOG.md (head), `.claude-plugin/plugin.json` and `marketplace.json`, `skills/diagram-design/SKILL.md` (all), `references/onboarding.md` (head), `references/profiles.md` (grep), `commands/doctor.md`, imports and network use of every file in `skills/diagram-design/scripts/`, `export_png.py` in full. Not read: the 52 type references, templates and examples. Head commit 2026-11-25 (`b228c5d`, a bot bumping the version to 2.6.179). Nothing was installed or run.

## What it is

- A 387-line SKILL.md that routes to one of 52 type references, plus templates, 87 monochrome icons, and nine Python scripts: four import extractors, `self_check.py` (accessibility and single-file checks), `verify_geometry.py` (connector rules), and SVG, PNG and PDF exporters. All scripts are standard library except PNG and PDF export, which need Playwright and Chromium.
- Seven plugin commands: `/diagram-design:export-diagram`, `import-drawio`, `import-mermaid`, `import-excalidraw`, `import-plantuml`, `profile`, `doctor` (read-only diagnostics).
- MIT licence (2025, Cathryn Lavery). Bundled icons are MIT (Tabler, log-z, Devicon) and CC0 (Simple Icons); brand logos stay their owners' trademarks.

## Install and use (commands from the README)

```text
/plugin marketplace add cathrynlavery/diagram-design
/plugin install diagram-design@diagram-design
```

Or `npx skills add cathrynlavery/diagram-design` (skill only, no commands), or clone and `ln -s ~/code/diagram-design/skills/diagram-design ~/.claude/skills/diagram-design` for an editable copy. PNG export and the render-and-look step need `pip install playwright && playwright install chromium`; ask before installing. Versions bump on every merge (2.6.179 when read); auto-update is off by default, so pin or update deliberately.

Then ask in plain words: "Make me an architecture diagram of my app: frontend, backend, database, Redis cache."

## What it does before drawing

1. First diagram in a project with the shipped style guide: it stops and asks whether to onboard a brand (URL, installed skill, local folder, pasted tokens, default, or saved profile).
2. It states type, size preset and what the complexity budget will cut (max 9 nodes, 12 arrows, 2 accent elements), and waits for a redirect if the user is there.
3. It copies a template, draws, runs `self_check.py` and `verify_geometry.py`, renders a scratch PNG at scale 1 and names defects, fixing at most twice. Without Playwright it must say "automated checks passed; not visually reviewed".

## What runs and what leaves the machine

- No hooks, no startup scripts, no CLAUDE.md or settings edits. Repo `CLAUDE.md` only points at AGENTS.md for contributors.
- Writes: onboarding rewrites the installed `references/style-guide.md` (after a diff and approval; package updates may overwrite it), profiles go to `~/.diagram-design/profiles/`, and a `.diagram-design` marker in the project only with consent.
- Network: generated files, SVG export and the headless PNG render load Instrument Serif, Geist and Geist Mono from Google Fonts (Google sees IP and browser, not the diagram). Ask for system fonts to make zero requests. URL onboarding fetches the site you name, after an explicit trust prompt. No telemetry, no API keys, no paid service (PRIVACY.md).

## Are its rules sound?

Yes for publication diagrams. "The highest-quality move is usually deletion", "would a table or paragraph do this?", one or two accent elements, orthogonal connectors with masked labels, an accessible SVG contract (`role="img"`, `<title>` and `<desc>`), and "Redraw, never convert" with a fidelity ledger of what an import merged or dropped are good discipline. It treats labels inside imported files as untrusted data. The README is candid: output depends on the model, layouts vary between runs, and "For docs that live in Git and change every sprint, Mermaid is still the better fit."

## Blurb vs repo

"Turns one sentence into a clean, designed diagram": the sentence starts it, but the skill deliberately pauses for a style choice on first use and states a plan before drawing. Output is an HTML page; a PNG or SVG needs an explicit export ("never produce export files unprompted"). "Clean" is enforced by budget and checks, but visual review is skipped without Playwright.

## How it differs from nearby skills

- `artifact-diagramming`: for a diagram inside a published Claude Artifact, in both light and dark themes, explaining a mechanism. Use it there; use Diagram Design for a standalone branded file for a blog, doc or slide.
- `anthropic-skills:graphviz-diagrams`: editable DOT source and automatic layout, good for large or changing graphs and repeatable output. Diagram Design hand-places a small diagram and gives no editable source.
- `dataviz`: owns charts from data. Diagram Design's bar, line, scatter and heatmap types are editorial figures; for real datasets or dashboards prefer `dataviz`.
- `power-design-skill` makes whole branded decks and sites; `typography-system` and `ui-craft` set product tokens. None draws diagrams.
- Mermaid in Markdown stays best for diagrams reviewed in pull requests.

## Not verified

Output quality on any type, the CI contrast and geometry gates, Windows behaviour, the website gallery, the Claude Desktop ZIP builder, and whether onboarding's colour extraction picks sensible roles.

## Checklist

- [ ] A paragraph or table would not do the job better.
- [ ] Style choice made (brand, default or profile); any URL fetch confirmed.
- [ ] Plan stated: type, size, cuts.
- [ ] `self_check.py` and `verify_geometry.py` passed; PNG looked at, or "not visually reviewed" reported.
- [ ] Imports report what was merged or dropped; nothing invented.
- [ ] System fonts used if the file must work offline or make no Google request.
