---
name: power-design-skill
description: Decides whether and how to use Power Design (ItsssssJack/power-design), a free MIT Claude Code skill that writes a single-file HTML slide deck or responsive website in a brand's look, from 72 pre-written brand style files or a Firecrawl scrape of a URL, checked against 20 slide rules and 20 web rules. Use this whenever the user wants an on-brand deck or landing page from Claude, asks for a site "in Stripe's / Linear's style", wants slides that don't look AI-made, or mentions Power Design or Jack Roberts' design skill - even if they never name it. Main caveat - URL extraction needs a Firecrawl API key and sends the URL to Firecrawl, and copying a real company's look and logo is fine for a mock-up but not for publishing as your own.
---

# Power Design (brand-styled decks and sites)

"A Claude skill for decks *and* websites that don't look like AI made them." Read 2026-11-21: README, LICENSE, SKILL.md, `lib/extract-brand.md`, `brands/_template.md`, `brands/stripe/brand-style.md` (head), `principles/design-principles.md` (TL;DR and headings), the brand folder list. Last commit 2026-08-10, by the creator. Nothing was installed or run.

## What it is

- A prompt-only skill: `SKILL.md` (182 lines), two rulebooks (`principles/design-principles.md` for slides, `principles/web-principles.md` for web, about 1,075 lines together), `lib/extract-brand.md`, and `brands/<name>/brand-style.md`.
- Flow: asks deck or website, then brand (paste a URL, pick from the library, or a neutral default), a short brief, then writes `~/Desktop/<topic>-slides.html` or `~/Desktop/<name>-site.html` and opens it in the browser.
- No code, no scripts, no dependencies of its own.

## Setup (from the README)

```bash
git clone https://github.com/ItsssssJack/power-design ~/.claude/skills/power-design
# then: "use power-design - make me a deck for stripe.com about our new product launch"
```

Pin it by checking out a commit (`f0c4143` was current when read); it is the creator's own repo and updates are unreviewed.

## Brand extraction and data

- A pasted URL goes to Firecrawl (MCP server or `curl` to `api.firecrawl.dev/v1/scrape` with `$FIRECRAWL_API_KEY`) asking for `branding`, `screenshot`, `rawHtml`, `links`. Firecrawl is a paid service; `extract-brand.md` says the free tier covers about 500 scrapes a month (not checked). Without a key, use the library or the default style.
- The skill saves a new `brands/<slug>/brand-style.md` inside the skill folder.
- The generated HTML may load Google Fonts and simpleicons CDN images, so anyone opening it contacts those hosts.

## Licence

MIT, © 2026 Jack Roberts. The `brands/` files are forked from VoltAgent/awesome-design-md (MIT, "with permission and credit"); original text keeps its copyright. MIT covers the text only: brand names, logos and proprietary fonts (for example Stripe's `sohne-var`) are not licensed by anyone here.

## Are the rules sound?

Mostly sensible defaults, stated more firmly than the evidence supports. SKILL.md calls all 20 slide rules "non-negotiable".

- Solid, and match the standards they cite: contrast of at least 4.5:1, never colour alone, body text of at least 16px with 44px tap targets, visible focus states, reserved media space (CLS), `prefers-reduced-motion`, labelled forms, one `<h1>` and landmarks.
- House style presented as research: 40% or more whitespace, 8pt spacing, related items within 16px and unrelated ones 48px or more apart, a maximum of 4 type sizes, a data-ink ratio of at least 80% (Tufte gave no number), 60-30-10 credited to Itten, Miller's 7±2 used for slide chunks, and the F-pattern used as a layout rule when NN/g describes it as a scanning habit. Use these as starting points and break them when the content needs it.
- Brand logo on every slide by default (rule #21).

Short distillation (after Power Design's SKILL.md): pick the medium first, take six brand values (background, foreground, accent, display font, radius, one voice sample), one accent, one primary action per view, and run its pre-emit checklist before saving.

## Traps

- README lists brands that have no file: OpenAI, DeepSeek, GitHub, YouTube, Sony, Slack. There are 72 brand folders (plus `_template.md`), which matches the "72" claim.
- Building "in stripe.com's style" with Stripe's logo is fine for a pitch to Stripe or an internal mock-up. Publishing it as your own product can mislead people and infringe trade marks. Replace logo, name and proprietary fonts with your own.
- Proprietary fonts named in brand files need a licence; use the fallbacks the template asks for.
- Writes to `~/Desktop` by default; say where the file should go.
- `email-assets/` holds unrelated icon PNGs ("Kestrel" welcome email).

## Creator's claims vs the repo

The creator (Jack Roberts video, 2026-11-20) offers it as a "quick fix" after asking whether Astryx removes AI slop. The repo has no link to Astryx: it emits framework-free HTML (or another stack if asked) and points to a sister repo, `power-design-web`, for build-stack depth. It is an alternative to a design system, not a patch for one. "Don't look like AI made them" is a goal; nothing in the repo measures it.

## Not verified

Output quality, the Vercel showcase site, the `power-design-web` repo, the community link (bit.ly), Firecrawl pricing, and the accuracy of brand files against the live sites.

## Related skills

`color-proportion-60-30-10`, `typography-system`, `spacing-and-layout`, `color-and-theming`, `attention-and-hierarchy`; review the page with `web-design-review-loop`. For a full component system see `astryx-design-system`; for Firecrawl modes, keys and what it sends see `firecrawl-web-extraction`.

## Checklist

- [ ] Clone pinned to a commit you read.
- [ ] Firecrawl key available, or library/default brand chosen.
- [ ] Brand use is legitimate: own brand, client brand with permission, or a clearly internal mock-up.
- [ ] Proprietary fonts replaced or licensed; logo choice confirmed.
- [ ] Output checked at 320-1440px and in both colour schemes; contrast and focus verified, not assumed.
