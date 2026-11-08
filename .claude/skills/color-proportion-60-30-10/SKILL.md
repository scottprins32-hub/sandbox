---
name: color-proportion-60-30-10
description: Applies the 60/30/10 colour proportion rule to a website or app - roughly 60% of the painted surface in a dominant neutral, 30% in a secondary colour, 10% in one accent - by assigning each share to design tokens, deciding where the rule bends for dense apps, dark mode and dashboards, and measuring the real proportions from a screenshot. Use this whenever the user mentions 60/30/10, 60-30-10, a dominant/secondary/accent palette, "how much of each colour", an accent colour that is everywhere, a page that feels garish, flat or unfocused, or is choosing where brand colour should and should not appear - even if they never name the rule.
---

# 60/30/10 colour proportion

A proportion rule for deciding **how much** of a screen each colour owns, not which colours to pick. It answers a question the palette skills leave open: you have a neutral, a secondary and an accent - where does each one go, and how much of it? Without it, the accent drifts onto every link, badge and border until nothing reads as the primary action.

## What it is, honestly

- **Dominant ~60%**: the colour of the page itself, usually a neutral. Quiet by design; it is the ground everything else sits on.
- **Secondary ~30%**: supporting surfaces that separate regions - cards, sidebars, nav, footers, section bands.
- **Accent ~10%**: the one colour meant to be noticed - the primary action, key links, focus, the thing you want found.

**Status: a heuristic, not a law.** It comes from interior-design practice. I could find no credited originator and no study that tests it; sources that repeat it call it a guideline and say 40/20 is fine. What it plausibly encodes is a clear dominant colour reading as order, and an accent signalling only while it is rare. The second leans on the isolation effect, which the catalogue (`ux-psychology/references/principles.md`) grades robust only as a *memory* effect; that people therefore *click* the rare colour is an extrapolation, so test it on your own screen. Treat 60/30/10 as a starting ratio to adjust by measurement, never as a requirement to hit.

## When this is the right skill

- Choosing how a new palette is applied across a page or app.
- "The accent is everywhere", "nothing stands out", "it feels busy / garish / flat".
- Deciding whether a hero, sidebar or footer should carry brand colour.
- Auditing an existing screen's colour balance.

Go elsewhere for: generating the ramps, semantic tokens and dark-mode values (`color-and-theming`); why contrast steers the eye and which element should be loudest (`attention-and-hierarchy`); text-over-image contrast (`depth-and-overlays`); what the proportions become on paper (`print-and-physical-artefacts`).

## Decide first

1. **Density.** A marketing page can reach 60/30/10. A dense tool is mostly neutral, so its split is nearer **80-85 / 12-18 / 2-5** (my judgement from how such screens are built, not a published figure): the accent must be rarer, because its job is to mark the few actions on a screen full of data. Pick the density from `ui-craft` before choosing numbers.
2. **What counts as "area".** Measure painted surface, with text counted as part of the surface it sits on. Counting the number of colours, or the number of components, is the common mistake: a thin accent border on every card can still be 10% of the *components* and 1% of the *area*.
3. **What is outside the rule.** Status colours (error, warning, success), data-visualisation series, photographs and brand logos are not "accent". They carry meaning of their own; do not spend or reduce the 10% for them.

## The moves

### 1. Assign each share to a token role

| Share | Role | Typical tokens (see `color-and-theming`) | Lives on |
|---|---|---|---|
| ~60% dominant | the ground | `--color-surface`, with text on it `--color-text-primary` | page background, main content area |
| ~30% secondary | structure | `--color-surface-raised`, `--color-surface-sunken`, a brand-tinted neutral | cards, sidebar, header, footer, section bands, table headers |
| ~10% accent | the signal | `--color-action`, `--color-brand` | primary button, active nav item, key link, focus ring, one chart highlight |

Components reference tokens by role, never a raw hex, so the proportion is a property of the token assignment and survives a rebrand. The cheapest enforcement is a rule that **only** `--color-action` may paint a primary button, so a second accent cannot appear by accident.

### 2. One accent, used for one meaning

The accent works because it is rare and consistent. Use the same accent for "the thing to do", not also for decoration, headings, icons and borders. If a second saturated colour is needed, it is almost always a status colour (outside the rule) or a sign the secondary has become a competing accent. Count the saturated hues on the screen: more than one outside status and data means the 10% is split and neither half signals.

### 3. Let the secondary do the structural work, quietly

Secondary surfaces should differ from the dominant by lightness, not hue strength, so regions separate without competing with the accent. A tint of the brand hue at low chroma is the usual answer. If the secondary is as saturated as the accent, the screen has no dominant signal.

### 4. Check contrast on every surface the accent lands on

The accent sits on the dominant, the secondary and sometimes a darker panel, and it has to clear its floor on all of them (WCAG 1.4.3 for text, 1.4.11 for component boundaries). Computed for `#1D4ED8`:

| Accent on | Contrast |
|---|---|
| white `#FFFFFF` | 6.70:1 |
| dominant `#F8F9FB` | 6.36:1 |
| secondary `#EEF1F6` | 5.92:1 |
| darker panel `#E5E9F0` | 5.50:1 |
| white label *on* the accent fill | 6.70:1 |

A lighter blue such as `#3B82F6` fails as text (3.68:1 on white, 3.25:1 on the secondary) though it passes 3:1 for a button boundary. A bright accent is often chosen for its 10% presence and then fails as small link text; pick a darker step for text use. Never let colour be the only signal (1.4.1): pair the accent with an underline, icon or label.

### 5. Dark mode keeps the proportions, changes the values

Same split, re-derived: the dominant is the dark ground, the secondary is the *lighter* raised surfaces (elevation inverts in dark mode, see `depth-and-overlays`), and the accent is lightened and desaturated so it does not vibrate on the dark ground. Re-check the contrast table above against the dark surfaces; do not reuse the light numbers.

### 6. Know where to break it on purpose

- A full-bleed hero, a pricing-page band or a splash screen in the brand colour is a deliberate 60% accent for a moment. Fine, if the rest of the page returns to the ratio and the call to action does not disappear into the same colour.
- Print and monochrome output turn the colours into ink coverage; handle it in `print-and-physical-artefacts`.
- Heavy photography makes the "colour" proportion mostly the photo's. Constrain the UI around it to the neutral and the accent.

## Measure it, do not eyeball it

`scripts/measure_proportions.py` assigns each pixel of a screenshot to the nearest role colour and reports the shares. Use `uv` for a clean Pillow (the system one may be broken or missing):

```bash
uv run --no-project --with pillow python -I scripts/measure_proportions.py shot.png \
  --dominant '#F8F9FB' --secondary '#EEF1F6' --accent '#1D4ED8'
```

Take the screenshot at the real viewport (Playwright `page.screenshot({ fullPage: true })`, or the browser's own). Read the output carefully:

- Anti-aliased text edges, photos and status colours fall into `other`. Read the roles as shares of *painted surface*, and check how much is `other`: a high `other` means a photo or chart dominates and the ratio is not what governs the page.
- It uses flat-colour matching. A gradient or a shadow-heavy surface will leak into `other`; raise `--tolerance` a little, and keep it below half the distance between your two closest role colours (the script warns).
- Verified on a synthetic 60/30/10 image (reported 60.0 / 30.0 / 10.0) and for the failure case where no colour matches. Not yet tried on real screenshots, so sanity-check the first one by eye.

## Anti-patterns

- **Counting colours instead of area.** "We use three colours" says nothing about proportion.
- **The accent on everything** - links, icons, headings, borders, badges. It stops meaning "act" and the real call to action loses salience.
- **Two competing accents**, usually a brand colour plus a trendy highlight. Pick one; make the other a status colour or remove it.
- **A saturated brand colour as the 60%** on a text-heavy page. Large saturated areas behind body text hurt legibility and tire the eye; this is judgement, not a measured rule, but it is rarely a good trade.
- **Treating 60/30/10 as a target** and adding colour to hit it. The rule limits the accent; it never obliges you to use 10% of anything.
- **Reusing the light-mode numbers in dark mode** without recomputing contrast.

## Ship checklist

- [ ] Three roles named, each mapped to tokens; no component uses a raw hex.
- [ ] Density chosen first; the target split matches it (marketing ~60/30/10, dense tool ~80+/15/<5).
- [ ] Only the action token paints primary actions.
- [ ] Saturated hues on the screen, excluding status and data: exactly one.
- [ ] Accent contrast computed on the dominant, secondary and any darker panel, for text (4.5:1) and boundaries (3:1).
- [ ] Meaning never carried by the accent alone (underline, icon or label too).
- [ ] Dark mode re-derived and re-checked, not copied.
- [ ] Proportions measured from a real-viewport screenshot; the `other` share noted.

## Sources

- **No primary source found** for 60/30/10 itself: sources repeating it name no originator and cite no study, and call it a guideline. Treat the numbers as convention.
- **Isolation (Von Restorff) effect**, with its evidence grade and the warning against stretching it to click behaviour: `ux-psychology/references/principles.md`.
- **WCAG 2.2** 1.4.3 and 1.4.11 contrast, 1.4.1 use of colour. Contrast figures above computed with the WCAG relative-luminance formula.
