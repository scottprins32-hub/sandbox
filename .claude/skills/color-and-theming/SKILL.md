---
name: color-and-theming
description: Settles the actual colour values — brand hue to full 50–950 ramps generated in OKLCH, semantic tokens (surface, surface-raised, border-subtle, text-muted), the contrast number every step must hit, and dark mode as a re-derivation of the palette rather than an inversion. Use this whenever the user is choosing colours, building a palette or design tokens, adding or repairing dark mode, or theming anything — even if they never say "colour", "palette" or "theme" — including "what colour should this button be", "our brand blue fails contrast", "dark mode looks washed out / muddy / harsh / neon", "the cards vanish on the dark background", "this looks garish", "set up design tokens", or any question about hex codes, OKLCH vs HSL, `prefers-color-scheme`, theme toggles, or the flash of the wrong theme on load. Use it alongside `attention-and-hierarchy`, which owns *why* contrast steers the eye; this skill owns the values that make it comply.
---

# Colour and theming

This skill settles what the colours actually are: which eleven steps a hue gets, which step is legal as body
text, which is legal only as a fill, what the dark theme's card background is in hex, and what every token is
called so a component never has to know. Without it you get the standard decay — a brand blue used for text
at 3.7:1, four greys that are all `#D…` something, a dark mode built by swapping black and white that leaves
cards invisible and buttons glowing, and a theme toggle that flashes white for 200ms on every page load.

`attention-and-hierarchy` owns the perception: why contrast is preattentive, why one loud thing wins, why
colour-only encoding fails. Read it for the mechanism. Read this for the values, and for the theming plumbing
that keeps them true in two themes at once.

## When this is the right skill

- Starting a project: choosing a primary, an accent, neutrals, and generating ramps from them.
- Adding dark mode to anything, or fixing a dark mode that looks harsh, muddy, flat or neon.
- A brand colour that fails contrast and someone wants to ship it anyway.
- Naming and structuring colour tokens so components stop hardcoding hexes.
- Symptoms: "looks garish", "looks washed out", "everything is grey", "the card and the page are the same
  colour", "the disabled state is unreadable", "our greens and reds look wrong next to each other".
- Any theme toggle, `prefers-color-scheme` work, or a flash of the wrong theme.

Go elsewhere when: the question is *how much space* between things (`spacing-and-layout`); *which of six
states* a button needs and what changes per state (`ui-signifiers-and-states` — it owns the state matrix and
the `color-mix()` state-layer deltas; this skill owns where `--action` comes from); *shadow specs and layering*
(`depth-and-overlays` — this skill supplies the dark-mode surface ladder that replaces shadow, that one
supplies the shadows); *how the theme transition animates* (`design-motion-principles`); *whether the palette
looks generic or AI-shaped* (`taste-frontend-design`); *categorical and sequential chart palettes*
(`dataviz`). `ui-craft` routes the whole craft set.

## Decide first

Six answers fix every value below. Retrofitting any of them is a token refactor, not a tweak.

1. **Light, dark, or both — decided now.** Dark mode is a re-derivation of the palette, not a filter. If both
   are in scope, every colour decision below gets made twice from the start, which costs almost nothing; bolted
   on later it costs a rewrite of every component that hardcoded a hex.
2. **The brand fixed points.** A brand hue is a constraint, not a palette. Assume it fails text contrast until
   measured — most do (`#3B82F6` is 3.68:1 on white, `#1DB954` is 2.59:1, `#F59E0B` is 2.15:1). Plan for a
   separate accessible variant for text from day one; that is normal practice, not a compromise.
3. **How many hues.** One primary, optionally one accent, one neutral ramp, plus four status hues
   (danger/warning/success/info). Seven ramps is a complete system. More hues is the most common way a palette
   stops meaning anything — if the brand colour is also chart series 1, also "selected", also "new", it has
   stopped signalling.
4. **Surface strategy.** Flat regions separated by borders, or stacked surfaces separated by elevation? This
   decides how many surface steps the dark theme needs (2 for flat, 4–5 for a stacking app with menus, popovers
   and modals over cards).
5. **Existing system?** Radix Colors, Tailwind's default palette, Material 3, or a company system — adopt it
   and extend it. A second parallel colour system in one codebase is worse than an imperfect first one.
6. **Gamut.** sRGB output covers everything. P3 gives more saturated headroom on modern displays but needs an
   sRGB fallback and buys almost nothing for UI colour, which lives at low chroma. Default to sRGB; opt into P3
   deliberately for accent fills only.

**Law, convention, taste.** Each move is tagged. *Law* is a WCAG success criterion or browser behaviour —
comply or ship a defect. *Convention* is a widely shared pattern with a real but non-binding rationale —
deviate deliberately. *Taste* is judgment you may overrule.

## The moves

### 1. Neutrals carry the screen — pick their tint before the brand — *taste, with a mechanism*

Ninety-plus percent of a typical interface is neutral: backgrounds, text, borders, dividers, disabled states.
The brand colour appears on one button. Design the neutrals first and the product looks composed; design the
brand first and the neutrals get chosen by accident.

Pure grey (chroma 0) is a legitimate choice and looks clinical. **Tinting neutrals toward the brand hue at very
low chroma** — 0.002–0.015 in OKLCH — makes the palette feel like one family without anyone being able to name
why. The effect is invisible in isolation and obvious in comparison.

```css
/* Same lightness, four tints. Chroma is tiny; the difference is still legible as a mood. */
--cool-900:  oklch(0.205 0.012 264);  /* #14171D  blue-tinted, the default "product" grey  */
--warm-900:  oklch(0.205 0.010  70);  /* #1A1612  warm, editorial, easier on long reading  */
--green-900: oklch(0.205 0.010 150);  /* #141815  quiet, unusual, works for finance/health */
--plum-900:  oklch(0.205 0.014 320);  /* #1A151B  dark neutral that is not navy            */
--pure-900:  oklch(0.205 0     264);  /* #171717  no tint — deliberate, not a default      */
```

The failure: neutrals tinted *too far*. Above ~0.02 chroma they read as a colour, fight the brand hue, and make
the whole screen look tinted rather than composed.

### 2. Generate ramps in OKLCH, and know the real reason HSL fails — *convention, with measurements*

Each hue gets an 11-step ramp (50–950): 50–200 for washes and hover fills, 300–500 for borders and dark-mode
text, 600–700 for solid fills and light-mode text, 800–950 for pressed states and dark-mode washes. That is
what every shipping design system does, and the step numbers are worth adopting purely because everyone reads
them the same way.

Generate with **fixed OKLab lightness per step**, a chroma curve that peaks mid-ramp, and a roughly constant
hue:

```css
@theme {                       /* Tailwind v4, CSS-first. Plain :root works identically. */
  --color-brand-50:  oklch(0.970 0.012 264);  /* #F1F5FE */
  --color-brand-100: oklch(0.940 0.026 264);  /* #E2EBFD */
  --color-brand-200: oklch(0.890 0.053 264);  /* #C9DBFF */
  --color-brand-300: oklch(0.820 0.090 264);  /* #A7C4FF */
  --color-brand-400: oklch(0.735 0.136 264);  /* #7DA7FF */
  --color-brand-500: oklch(0.655 0.183 264);  /* #558AFF */
  --color-brand-600: oklch(0.580 0.229 264);  /* #2F6BFF  ← chroma peak */
  --color-brand-700: oklch(0.505 0.228 264);  /* #1B52E4 */
  --color-brand-800: oklch(0.435 0.192 264);  /* #1642B8 */
  --color-brand-900: oklch(0.375 0.149 264);  /* #15388E */
  --color-brand-950: oklch(0.265 0.096 264);  /* #0C2153 */
}
```

The lightness ladder is `0.97 0.94 0.89 0.82 0.735 0.655 0.58 0.505 0.435 0.375 0.265`; chroma is a bell
peaking at 600 (multipliers `0.05 0.11 0.22 0.42 0.68 0.90 1.00 0.95 0.80 0.62 0.40` of the hue's maximum).
Reuse that ladder for every hue and the ramps stay in register: **step 700 of any hue lands within a narrow
contrast band on white.** Measured across five hues on this ladder, step 700 gives 5.47–6.56:1 and step 600
gives 4.00–4.78:1. The chroma values above are already **clamped into the sRGB gamut**, which is why they are
lower than the bell curve asks for at 300–500 — and why the peak differs per hue: at lightness 0.58 sRGB
affords roughly **0.23 for blue, 0.22 red, 0.16 green, 0.12 amber**. That last number is the whole reason amber
ramps go muddy in the middle. Clamp deliberately rather than letting the browser clip a channel, which is what
produces the flat, plasticky bright steps.

**Why not HSL, honestly.** The usual claim — "HSL ramps have uneven steps" — is only mildly true within a
single hue. Measured on `hsl(220 90% L)` from 95% to 15%, the perceived lightness steps vary by about 30% and
the perceived hue drifts ~5°. Noticeable, not fatal. The two failures that actually matter:

- **Across hues, HSL lightness means nothing.** At the same declared `50%` lightness, contrast against white
  ranges from **1.34:1** for yellow to **9.04:1** for blue — a 6.7× spread. Their perceived (OKLab) lightness
  is 0.895 and 0.435. So a palette built as "all my 500s are `hsl(H 80% 50%)`" has a yellow that is invisible
  on white and a blue that is nearly black, at the same nominal step. At a fixed OKLab lightness of 0.62 the
  same six hues span **3.39–3.93:1** — a 1.16× spread. That is the whole argument.
- **HSL shifts hue as it lightens.** `hsl(240 100% 50%)` sits at OKLCH hue 264; `hsl(240 100% 85%)` sits at
  hue 284. Lighten a saturated blue in HSL and it turns lavender, which is why hand-made HSL tints of a blue
  brand never quite look like the brand.

`oklch()` is supported in Chrome 111, Safari 15.4 and Firefox 113, and has been Baseline "widely available"
since May 2023. Keep hex fallbacks in comments so a human can read the file, and use `color-mix(in oklab, …)`
for derived values rather than hand-picking near-neighbours.

How it fails: authoring OKLCH values by eye without checking gamut. Chroma 0.24 at lightness 0.82 does not
exist in sRGB; the browser clamps silently and your 300 step is not the colour you wrote.

### 3. Make contrast a constraint on the ramp, not a check afterwards — *law*

Decide, once, which step is legal where. Then compliance is a naming question rather than an audit.

**The exact requirements.** WCAG 2.2 **1.4.3 Contrast (Minimum), AA**: 4.5:1 for text, 3:1 for *large* text,
defined as ≥18pt (24px) or ≥14pt (18.66px) bold. **1.4.11 Non-text Contrast, AA**: 3:1 for the visual
boundaries of UI components required to identify them, for their states, and for graphical objects required to
understand the content. **1.4.6 (AAA)** is 7:1 / 4.5:1. Disabled controls are exempt from both — that is a
licence to look disabled, not to be unreadable.

The contract, measured on the ladder in move 2:

| Use | Step on white/light | Step on a dark surface (L≈0.21) | Measured range |
|---|---|---|---|
| Body text, links, icons with meaning | **700** | **400** | 5.47–6.56:1 / 7.15–8.01:1 |
| Large text (≥24px, or ≥18.66px bold) | **600** | **500** | 4.00–4.78:1 / 5.16–6.04:1 |
| Solid fill with a white label | **600–700**, hue-dependent | — | see below |
| Input borders, focus rings, meaningful icons | **600** | **500** | ≥3:1 |
| Decorative dividers, wash backgrounds | 50–200 | 800–950 | no floor |

**Two traps this table exposes, both verified:**

- **Green and amber run bright.** WCAG relative luminance weights green at 0.7152, so a green at the same
  perceptual lightness as a red has more luminance and less contrast on white. Step 600 gives 4.78:1 for red
  and only **4.00:1** for green — a fail for body text at the same nominal step. Green and amber need step 700
  for text, and a solid green button carrying a white label needs lightness ≈0.545 (`#00873C`, 4.63:1) rather
  than the 0.58 that works for red.
- **A dark theme is not covered by a light-theme pass.** The light action colour `#2F6BFF` scores 3.99:1 on a
  `#15171C` surface — legal as a fill boundary, illegal as text. Every pair gets measured in both themes.

**Automate it.** Compute the ratio for every text-token × surface-token pair as a unit test so a palette edit
cannot silently break a theme. The relative-luminance formula from WCAG:

```js
const lin = c => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
                          return (x + 0.05) / (y + 0.05); };
```

**The honest caveat.** WCAG 2.x contrast is a simple luminance ratio that ignores font size and weight, and it
is a known-imperfect model of legibility — it is least trustworthy for light-on-dark pairs, thin weights, and
highly saturated hues. APCA models these better and is the most developed candidate for WCAG 3, but as of April
2026 the WCAG 3 contrast algorithm is still undetermined — visual contrast was moved *out* of the WCAG 3
Working Draft in 2023 for further evaluation, and WCAG 3 is not expected to be a Recommendation before 2028.
Practical position: **WCAG 2.x is what is enforced, so meet it; treat a 4.5:1 pass as a floor, not proof.**
A 300-weight sans at 4.6:1 on a saturated background passes and is still hard to read. Look at it.

### 4. The brand colour is rarely the text colour — ship an accessible variant — *law meets brand*

Measured on white: `#3B82F6` 3.68:1, `#2563EB` 5.17:1, `#F97316` 2.80:1, `#06B6D4` 2.43:1, `#1DB954` 2.59:1.
Most brand colours are chosen for a logo on a billboard, where contrast rules do not apply.

Split the role rather than arguing with the brand team:

```css
:root {
  --brand:        oklch(0.655 0.216 264);  /* #558AFF  logo, large marks, decorative fills   */
  --color-action: oklch(0.505 0.228 264);  /* #1B52E4  buttons and links — 6.22:1 on white   */
  --color-on-action: oklch(0.99 0 0);      /*          white label on the fill — 6.22:1      */
}
```

Same hue, same family, one is legal as text. This is standard practice in every mature design system, not a
dilution of the brand.

Three specifics that get missed:

- **The button has two contrast requirements**, not one: the label against the fill (4.5:1, or 3:1 if the label
  is large) *and*, if the fill is the only thing identifying the control, the fill against the page (3:1,
  1.4.11). A pale tinted button on white can pass the label test and fail the boundary test.
- **Amber cannot carry a white label.** Getting `#F59E0B`-family amber to 4.5:1 with white forces it to
  `#9C6900`, which is mud. Invert instead: keep the bright fill (`oklch(0.80 0.17 75)` = `#FCAB00`) and use
  near-black ink — 8.60:1 — then add a border, because that fill is only 1.92:1 against a white page.
- **Ghost and outline buttons** derive from `--color-action` and inherit its problems: a 3:1 border is the
  requirement, and the label still needs 4.5:1 against the *page*, not against the border.

### 5. Semantic colour is a convention worth following, not psychology — *convention + law*

Blue = informational/trust, red = danger, amber = warning, green = success is the **Western software
convention**. Follow it: consistency inside a product is worth far more than novelty, and users arrive already
trained by every other application they use.

Do not repeat the psychology story. Colour-meaning is culturally contingent and context-dependent — red signals
prosperity and good fortune across much of East Asia, white is a mourning colour in several cultures, and
research does not support universal emotional mappings from hue. In finance, red/green for down/up inverts in
several East Asian markets. **State it as a convention you are adopting for internal consistency, and localise
where the domain demands it.**

The engineering consequence is not cultural, it is **WCAG 1.4.1 Use of Color (Level A)**: colour must never be
the sole means of conveying information, indicating an action, prompting a response, or distinguishing an
element. Roughly 8% of men (about 1 in 12) and 0.5% of women of Northern European descent have a colour-vision
deficiency, most commonly on the **red/green axis** — the exact axis this convention depends on. Colour also
fails in greyscale print, in sunlight, on a projector, and in forced-colors mode.

Every status gets **colour + one of: icon, text label, shape, or position.**

```jsx
// Fails 1.4.1 — hue is the whole message.
<span className="text-red-600">Payment failed</span>

// Passes — icon, word, and colour as reinforcement.
<p className="text-danger flex items-center gap-2">
  <AlertCircleIcon aria-hidden />
  <span><strong>Error:</strong> card declined — check the expiry date.</span>
</p>
```

Each status ships as a **set of four tokens**, not one hex: a wash background, a border, a text/icon value that
passes 4.5:1 on both the wash and the page, and a solid fill for buttons and badges. Values with measured
ratios are in the token set below and in `references/palette-tokens.md`.

### 6. Dark mode is a re-derivation of the palette, not an inversion — *the substantive move*

Inverting lightness produces the four classic defects: a page that glares, colours that vibrate, borders that
slice, and cards that disappear. Each has a specific fix and a specific number.

**6a. Not pure black.** Use a very dark neutral around **OKLab lightness 0.16–0.22** (`#15171C` at 0.205) for
the base surface. Pure `#000` gives you nowhere to go *below* the surface, makes every shadow invisible, and on
OLED produces visible smearing during scroll as pixels switch fully off and on.

**6b. Not pure white text.** Use **lightness 0.94–0.96** (`#EFF0F3`) — 15.7:1 on that base surface, still far
past AA. `#FFF` on `#000` is 21:1 and is the wrong target: at maximum luminance difference on large text areas,
light scatter in the eye spreads the glyph edges (halation), which readers with astigmatism report as bloom or
doubling. Reserve the top of the range for the rare element that must shout.

While you are here: **do not tell users dark mode is easier on their eyes.** The research points the other way
for most sighted readers — Buchner & Baumgartner (2007, *Ergonomics*) found a consistent *positive polarity*
advantage (dark text on light) in proofreading, independent of ambient illumination and of chromaticity, and
attributed it to pupil constriction under a bright background producing a sharper retinal image. Dark mode is a
genuine accommodation for photophobia, some low-vision conditions and night use, and a strong preference for
many people. Ship it because users want it and some need it. Ship light mode just as carefully.

**6c. Desaturate and lighten every hue.** A colour tuned against white vibrates against near-black. Two things
are happening: the pupil is wider in a dark surround, so more light scatters and saturated edges bloom; and the
eye focuses different wavelengths at slightly different depths (longitudinal chromatic aberration), which is
most pronounced for saturated blues and violets and is why they appear to float against dark. Move down the
ramp by roughly **two to three steps and cut chroma by 30–40%**:

| Role | Light theme | Dark theme |
|---|---|---|
| Action fill | `oklch(0.505 0.228 264)` `#1B52E4` | `oklch(0.72 0.145 264)` `#76A2FF`, near-black ink (7.65:1) |
| Link / action text | `oklch(0.505 0.228 264)` 6.22:1 on white | `oklch(0.78 0.12 264)` `#93B7FF`, 8.93:1 |
| Danger text | `#BE0013` 6.56:1 on white | `#FAADA4` 9.89:1 on surface |

**6d. Lower border contrast, don't raise it.** On light surfaces a border is *darker* than its background; on
dark surfaces it is *lighter*, and the same nominal difference reads far harsher because the surround is dim.
Dark borders sit at a smaller delta:

```css
/* light: subtle 1.25:1, default 1.49:1, strong 3.12:1 (input outlines — meets 1.4.11) */
/* dark:  subtle 1.32:1, default 1.75:1, strong 4.18:1 on base, 3.35:1 on the overlay surface */
```

The catch: a dark `--border-strong` must clear 3:1 against the *highest* surface it can land on, not the base.
At lightness 0.52 it passes on the base (3.25:1) and fails on a raised card (2.95:1). Set it at **0.58**.

**6e. Elevation inverts — surfaces get lighter as they rise.** In light mode depth comes from shadow: the
higher the element, the darker and more diffuse the shadow. On a near-black surface a black shadow is nearly
invisible, so the same card renders as a flat patch — this is the "where did my card go" bug. Dark mode
expresses elevation as **lightness**: each level up is a lighter surface.

```css
/* Each step is +0.04 OKLab lightness — measured 1.08–1.15:1 against the step below. */
--surface-sunken:  oklch(0.165 0.008 264);  /* #0C0E13  wells, code blocks, table headers */
--surface:         oklch(0.205 0.010 264);  /* #15171C  page                              */
--surface-raised:  oklch(0.245 0.011 264);  /* #1E2025  cards, panels                     */
--surface-overlay: oklch(0.285 0.012 264);  /* #282A2F  menus, popovers, modals           */
```

That ~1.1:1 per step is the whole budget. Below ~1.05:1 the level is invisible; above ~1.25:1 the surface stops
reading as elevation and starts reading as a different component with a background colour. Chroma rises very
slightly with lightness so the tint stays visible as the surface brightens.

This is Material's approach, in both of its forms: Material 2 composited a white overlay over a `#121212`
surface at increasing opacity per elevation (0% at 0dp up to 16% at 24dp — a card at 1dp is 5%, a bottom app
bar at 8dp is 12%); Material 3 replaced the overlay with explicit tonal tokens —
`surface-container-lowest / low / … / highest` — which is the same idea as named steps rather than computed
opacity. Prefer explicit tokens: an overlay computed from opacity composites unpredictably over anything that
is not the base surface. Keep shadows in dark mode as a *secondary* cue only, deepened and tightened;
`depth-and-overlays` owns those specs.

**6f. Tint the dark neutrals.** A dark theme built on pure grey looks like a terminal, and one built on navy
looks like every other dashboard. The tint options in move 1 apply here and are more visible in dark than in
light — warm grey (`h≈70`), deep green (`h≈150`) and plum (`h≈320`) all read as deliberate.

### 7. The token set — semantic names, both themes, components see only roles

This is the deliverable. Components reference **only** the `--color-*` semantic tokens; ramps stay in the
primitive layer. Written with `light-dark()`, so every colour is defined once and all three theme states fall
out of `color-scheme` in three lines. If you need to support browsers older than Chrome 123 / Safari 17.5, move
8 has the equivalent two-block media-query form.

```css
:root {
  color-scheme: light dark;                     /* default state: follow the system */

  /* ── surfaces ── elevation is a surface token, not a shadow token ──────────── */
  --color-surface-sunken:  light-dark(oklch(0.975 0.003 264), oklch(0.165 0.008 264));
  --color-surface:         light-dark(oklch(1     0     0  ), oklch(0.205 0.010 264));
  --color-surface-raised:  light-dark(oklch(1     0     0  ), oklch(0.245 0.011 264));
  --color-surface-overlay: light-dark(oklch(1     0     0  ), oklch(0.285 0.012 264));

  /* ── text ─────────────────────────────────────────────────────────────────── */
  --color-text-primary:    light-dark(oklch(0.24 0.015 264), oklch(0.955 0.004 264));
  --color-text-secondary:  light-dark(oklch(0.44 0.015 264), oklch(0.835 0.004 264));
  --color-text-muted:      light-dark(oklch(0.55 0.015 264), oklch(0.715 0.004 264));
  --color-text-disabled:   light-dark(oklch(0.70 0.015 264), oklch(0.580 0.004 264));

  /* ── borders ── only -strong is legal as a control boundary (1.4.11) ───────── */
  --color-border-subtle:   light-dark(oklch(0.925 0.012 264), oklch(0.300 0.012 264));
  --color-border:          light-dark(oklch(0.870 0.012 264), oklch(0.375 0.012 264));
  --color-border-strong:   light-dark(oklch(0.660 0.012 264), oklch(0.580 0.012 264));

  /* ── interactive ──────────────────────────────────────────────────────────── */
  --color-action:          light-dark(oklch(0.505 0.228 264), oklch(0.72 0.145 264));
  --color-on-action:       light-dark(oklch(0.99  0     0  ), oklch(0.17 0.010 264));
  --color-action-text:     light-dark(oklch(0.505 0.228 264), oklch(0.78 0.120 264));
  --color-focus-ring:      light-dark(oklch(0.580 0.200 264), oklch(0.78 0.140 264));

  /* ── status: wash / border / text / solid, per hue ─────────────────────────── */
  --color-danger-wash:     light-dark(oklch(0.965 0.013 27), oklch(0.245 0.066 27));
  --color-danger-border:   light-dark(oklch(0.720 0.110 27), oklch(0.440 0.132 27));
  --color-danger-text:     light-dark(oklch(0.505 0.209 27), oklch(0.820 0.092 27));
  --color-danger-solid:    light-dark(oklch(0.580 0.220 27), oklch(0.580 0.200 27));

  --color-warning-wash:    light-dark(oklch(0.965 0.010 75), oklch(0.245 0.051 75));
  --color-warning-border:  light-dark(oklch(0.720 0.085 75), oklch(0.440 0.102 75));
  --color-warning-text:    light-dark(oklch(0.505 0.162 75), oklch(0.820 0.071 75));
  --color-warning-solid:   light-dark(oklch(0.800 0.170 75), oklch(0.780 0.150 75));

  --color-success-wash:    light-dark(oklch(0.965 0.010 150), oklch(0.245 0.051 150));
  --color-success-border:  light-dark(oklch(0.720 0.085 150), oklch(0.440 0.102 150));
  --color-success-text:    light-dark(oklch(0.505 0.162 150), oklch(0.820 0.071 150));
  --color-success-solid:   light-dark(oklch(0.545 0.170 150), oklch(0.620 0.150 150));

  --color-info-wash:       light-dark(oklch(0.965 0.014 264), oklch(0.245 0.072 264));
  --color-info-border:     light-dark(oklch(0.720 0.120 264), oklch(0.440 0.144 264));
  --color-info-text:       light-dark(oklch(0.505 0.228 264), oklch(0.820 0.101 264));
  --color-info-solid:      light-dark(oklch(0.560 0.240 264), oklch(0.620 0.180 264));
}

:root[data-theme="light"] { color-scheme: light; }   /* explicit override, both directions */
:root[data-theme="dark"]  { color-scheme: dark;  }
```

The pairs that decide whether this set is compliant — full matrix in `references/palette-tokens.md`:

| Token | Light hex / ratio | Dark hex / ratio |
|---|---|---|
| `surface` → `raised` → `overlay` | `#FFFFFF`, shadow does the work | `#15171C` → `#1E2025` → `#282A2F`, ~1.1:1 per step |
| `text-primary` | `#1C1F27` 16.47 on white | `#EFF0F3` 15.73 base / 14.29 raised |
| `text-muted` (the quietest legal text) | `#6D727B` 4.84 white / **4.51 sunken** | `#A2A3A6` 7.11 base / **5.70 overlay** |
| `border-strong` (control boundaries) | `#8E929A` **3.12** on white | `#777A82` 4.18 base / **3.35 overlay** |
| `action` fill / `action-text` | `#1B52E4` white label 6.22 / link 6.22 | `#76A2FF` dark ink 7.65 / `#93B7FF` 8.93 |
| `danger` / `warning` / `success` / `info` text | 6.56 / 5.98 / 5.47 / 6.22 on white | 9.89 / 10.19 / 10.58 / 10.23 on surface |
| `danger` / `success` solid, white label | 4.78 / 4.63 | — |
| `warning` solid `#FCAB00`, dark ink | 8.60 — but 1.92 vs page, **needs a border** | — |

Two values are set by their worst case rather than by taste: `text-muted` sits at lightness 0.55 rather than
0.56 only because 0.56 scores 4.32:1 on the sunken surface and fails; dark `border-strong` sits at 0.58 rather
than 0.52 only because 0.52 scores 2.95:1 on a raised card and fails. A check-it-afterwards workflow finds
neither, because both pass on the surface you happen to test first.

**Naming rules that keep this honest:**

- Name by **role, never appearance**. `--color-border-subtle` survives dark mode; `--color-border-light-grey`
  becomes a lie the moment the theme flips.
- **Never `--color-text-on-dark`.** That is a theme name inside a token name — the whole point is that the
  token means the same thing in both themes.
- **Components reference semantic tokens only.** `grep` for primitive names (`--brand-600`, `blue-500`,
  `#[0-9a-f]{6}`) in component files as a lint rule; every hit is a component that will not theme.
- **Elevation is a surface token, not a shadow token**, so the same component markup works in both themes:
  `background: var(--color-surface-raised)` plus a shadow that is heavy in light and near-nil in dark.

### 8. Three states — light, dark, and follow-system — and the flash — *craft, with one law*

Users need three options, not two: explicit light, explicit dark, and "follow my system" as the default. The
common bug is a toggle that handles only two, so a user who never touched it gets whatever the CSS hardcoded.

**`color-scheme` is the switch, and it is not optional.** Beyond driving `light-dark()`, it tells the browser
to render form controls, scrollbars, the caret and the default canvas in the matching scheme. Without it you
get light-mode native selects on a dark page and a white scrollbar beside a black column. Three states, three
declarations — this is the whole mechanism behind the token set in move 7:

```css
:root                     { color-scheme: light dark; }  /* no attribute → follow the system */
:root[data-theme="light"] { color-scheme: light; }       /* force light on a dark system     */
:root[data-theme="dark"]  { color-scheme: dark;  }       /* force dark on a light system     */
```

**The media-query form**, for deeper browser compatibility or a token file you would rather not write with
`light-dark()`. Define the complete light palette on bare `:root`; redefine only the changed tokens in two dark
blocks — a media query guarded against an explicit light override, and an explicit dark attribute. **Never give
a colour its only definition inside a media query**, or it is undefined for everyone not in that state.

```css
:root { color-scheme: light; /* full light palette — the default and the universal fallback */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { color-scheme: dark; /* dark values */ }
}
:root[data-theme="dark"] { color-scheme: dark; /* the same dark values, repeated */ }
```

CSS cannot union a plain selector with one inside a media query, so those two dark blocks are genuinely
duplicated. Emit them from one source — a Sass mixin, a PostCSS plugin, or your token pipeline — rather than
maintaining two hand-edited copies that will drift. Avoiding that duplication is the main reason move 7 uses
`light-dark()`.

**The flash of wrong theme.** The stored preference lives in `localStorage`, which JavaScript reads — and if
that JavaScript runs after first paint, the page renders in the wrong theme and snaps. It is worst in SSR and
static frameworks, where the server has no idea what the user chose. The only reliable fix is a **small
synchronous script in `<head>`, before any stylesheet that depends on the attribute**:

```html
<script>
  // Must be inline, synchronous, and in <head>. Any defer/async reintroduces the flash.
  try {
    var t = localStorage.getItem('theme');            // 'light' | 'dark' | null (= system)
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
```

Then the toggle writes the attribute and the storage together, and removing the attribute returns to system:

```js
function setTheme(mode) {                    // 'light' | 'dark' | 'system'
  const root = document.documentElement;
  if (mode === 'system') { delete root.dataset.theme; localStorage.removeItem('theme'); }
  else { root.dataset.theme = mode; localStorage.setItem('theme', mode); }
}
```

Expose all three in the UI, and label the third **"System"** rather than "Auto" — it tells the user where the
setting comes from.

Note what this structure buys: users on "follow system" — the majority, since it is the default — resolve
entirely in CSS and cannot flash at all. Only users with a stored explicit override depend on that script.

**Two more that get forgotten.** `<meta name="theme-color">` colours mobile browser chrome and needs a `media`
attribute per scheme, or the address bar stays light behind a dark page. The `media` form follows the *system*,
so `setTheme()` must also rewrite the tag's `content` when the user overrides. And any animated theme
transition must respect `prefers-reduced-motion` — a full-page colour crossfade is exactly the kind of
large-area change that triggers discomfort (`design-motion-principles` owns the timing).

```html
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#15171C" media="(prefers-color-scheme: dark)">
```

**The `light-dark()` support caveat.** Chrome 123 (Mar 2024), Firefox 120 (Nov 2023), Safari 17.5 (May 2024);
Baseline newly available, reaching "widely available" only in **November 2026**. That is comfortable for most
products in 2026 and not for all of them. If your support matrix reaches further back, either use the
media-query form above or declare a plain fallback immediately before each token, which older engines keep and
newer ones override:

```css
--color-surface: #FFFFFF;                                         /* older engines stop here */
--color-surface: light-dark(oklch(1 0 0), oklch(0.205 0.01 264));
```

`references/theme-switching.md` has the framework-specific versions (React/Next.js/SSR), forced-colors mode,
images and charts in dark mode, and print.

## Anti-patterns

- **Dark mode by inversion** — `filter: invert(1)`, or swapping the ramp end-for-end. Photographs go negative,
  shadows become glowing halos, and hue relationships break.
- **`#000` background with `#FFF` text.** 21:1, halation, no room below the surface, OLED smearing.
- **Shadows as the only elevation cue in dark mode.** The card disappears. Surfaces get lighter as they rise.
- **Reusing light-mode saturated colours on dark.** They vibrate, and they often fail contrast anyway — the
  light action blue scores 3.99:1 on the dark surface.
- **Borders at the same contrast in both themes.** Light-mode-subtle is dark-mode-harsh.
- **A colour defined only inside `@media (prefers-color-scheme: dark)`.** Anything not redefined in the light
  block is now undefined for most users.
- **Components hardcoding hexes or primitive tokens.** `bg-blue-600` in a component file is an opt-out from
  theming; it will be missed in the dark pass.
- **Token names that describe appearance** — `--grey-light`, `--color-text-on-dark`, `--dark-card-bg`.
- **Building ramps in HSL.** Fine for a single tint; catastrophic across hues — 1.34:1 to 9.04:1 at the same
  declared lightness.
- **Colour as the only status signal.** Red border with no icon and no message fails 1.4.1 for ~1 in 12 men.
- **Amber text on white.** `#F59E0B` is 2.15:1. Amber is a fill colour with dark ink, or a much darker text.
- **A grey input border at `#D1D5DB` (1.47:1) or `#E5E7EB` (1.24:1).** If the border is the only thing marking
  the field as an input, that is a 1.4.11 failure. Needs ~3:1.
- **Muted text checked only against white.** `#70757E` is 4.63:1 on white and **4.32:1** on a `#F6F7F9` card —
  a fail. Test the quietest text against the lightest surface it can land on.
- **Setting the theme attribute in `useEffect` or a deferred script.** That is the flash of wrong theme.
- **Omitting `color-scheme`.** Native controls, scrollbars and the caret stay in the wrong scheme.
- **Chasing AAA everywhere.** If every text level is maximum contrast, contrast no longer carries hierarchy.
- **More than two brand hues.** The reserved colour stops meaning "act here".

## Ship checklist

Run against the palette file and the rendered screen, in both themes.

- [ ] Every colour in component code is a semantic `--color-*` token; no hexes, no primitive ramp names.
- [ ] Ramps generated at fixed OKLab lightness per step, chroma clamped into gamut, hue constant.
- [ ] Body text ≥4.5:1 and large text ≥3:1 on **every** surface it can appear on, in both themes (1.4.3).
- [ ] Input borders, focus rings, meaningful icons and control states ≥3:1 against their adjacent colour
      (1.4.11) — including on the *raised* and *overlay* surfaces, not just the base.
- [ ] Solid buttons pass twice: label vs fill, and fill vs page if the fill identifies the control.
- [ ] Green and amber steps checked individually — they fail at the step where red and blue pass.
- [ ] No status, state, required field, chart series, diff or selection carried by colour alone (1.4.1);
      verified by desaturating a screenshot.
- [ ] Focus ring visible against every surface it can land on, `:focus-visible` not `:focus` (2.4.7), and not
      obscured by sticky bars (2.4.11).
- [ ] Dark theme: base surface lightness 0.16–0.22, primary text 0.94–0.96, neither pure black nor pure white.
- [ ] Dark surfaces get lighter with elevation, ~1.1:1 per step; cards visible with shadows disabled.
- [ ] Dark-theme hues desaturated and lightened, not reused from light.
- [ ] Dark borders at lower contrast than their light counterparts; `border-strong` still ≥3:1 on the topmost
      surface.
- [ ] All three theme states work: explicit light, explicit dark, and follow-system as the default.
- [ ] `color-scheme` set per theme; native selects, scrollbars and the caret match.
- [ ] Inline synchronous head script sets the theme before first paint; no flash on hard reload in either
      system setting.
- [ ] `<meta name="theme-color">` per scheme; any theme transition respects `prefers-reduced-motion`.
- [ ] Contrast unit test covers every text-token × surface-token pair, in both themes, and fails CI.
- [ ] Checked in a CVD simulator (Chrome DevTools Rendering panel: protanopia, deuteranopia, tritanopia,
      achromatopsia) and in greyscale.
- [ ] Checked under `forced-colors: active` — nothing whose only boundary was a background or a shadow has
      disappeared; focus and selection use system colour keywords.

## Sources

- **WCAG 2.2** (W3C Recommendation) — the law-like layer. **1.4.1 Use of Color** (A); **1.4.3 Contrast
  (Minimum)** (AA — 4.5:1 text, 3:1 large text, large defined as ≥18pt/24px or ≥14pt/18.66px bold);
  **1.4.11 Non-text Contrast** (AA — 3:1 for UI component boundaries required for identification, their
  states, and graphical objects required to understand content); **1.4.6 Contrast (Enhanced)** (AAA — 7:1 /
  4.5:1); **2.4.7 Focus Visible** (AA); **2.4.11 Focus Not Obscured (Minimum)** (AA, new in 2.2). Disabled
  controls are explicitly exempt from 1.4.3 and 1.4.11.
- **WCAG 3 / APCA status** — visual contrast was moved out of the WCAG 3 Working Draft in July 2023 for further
  evaluation; as of April 2026 the WCAG 3 contrast algorithm remains undetermined and APCA is a candidate
  method rather than an adopted standard. WCAG 3 is not expected to reach Recommendation before 2028. Meet
  WCAG 2.x; use APCA as a supplementary signal only.
- **CSS Color Module Level 4** — `oklch()` / `oklab()`, based on Björn Ottosson's Oklab (2020). Support:
  Safari 15.4, Chrome 111, Firefox 113; Baseline widely available since May 2023. **CSS Color Level 5** —
  `color-mix()`. **CSS Color Adjust Level 1** — the `color-scheme` property. `light-dark()`: Chrome 123
  (Mar 2024), Firefox 120 (Nov 2023), Safari 17.5 (May 2024); Baseline widely available from November 2026.
- **Material Design** — Material 2 dark theme: `#121212` base surface with white elevation overlays from 0% at
  0dp to 16% at 24dp (1dp card = 5%, 8dp bar = 12%). Material 3 replaced computed overlays with explicit tonal
  `surface-container-lowest / low / … / highest` tokens and expresses elevation primarily through surface tint
  rather than shadow. The surface ladder in move 6e is this skill's simplification of that approach.
- **Apple Human Interface Guidelines** — semantic system colours and elevated background variants for dark
  mode; the platform position that dark mode is a user preference to be supported, not a default to be pushed.
- **Text–background polarity** — Buchner, A. & Baumgartner, N. (2007), "Text–background polarity affects
  performance irrespective of ambient illumination and colour contrast", *Ergonomics* 50(7). Consistent
  positive-polarity (dark-on-light) advantage in proofreading, attributed to pupil constriction under higher
  background luminance producing a sharper retinal image. This is the honest counterweight to "dark mode is
  better for your eyes".
- **Colour-vision deficiency prevalence** — approximately 8% of men and 0.5% of women of Northern European
  descent, predominantly red–green; prevalence is lower in other populations. Used here only to justify
  redundant encoding, which 1.4.1 requires regardless.
- **Colour and culture** — the blue/red/amber/green mapping is a Western software convention. Cross-cultural
  colour-meaning associations vary substantially (red as prosperity across much of East Asia; white as a
  mourning colour in several cultures; inverted up/down market colours in several East Asian exchanges), and
  the literature does not support universal emotional mappings from hue. Treat the mapping as an internal
  consistency contract that may need localising.
- **Affordances and signifiers** — Donald Norman, *The Design of Everyday Things* (revised ed., 2013), for why
  a colour difference alone is a weak signifier: it carries no information about what will happen.
- **Design-system palettes worth reading before inventing one** — Radix Colors (12-step scales with explicitly
  assigned roles per step and paired light/dark scales), Tailwind v4 (OKLCH-authored default palette),
  IBM Carbon and USWDS (both publish contrast-tested pairings rather than raw hexes).
- **Measurements in this file** were computed from the Oklab↔sRGB matrices and the WCAG relative-luminance
  formula, not quoted from secondary sources; the generator is in `references/palette-tokens.md` so any value
  here can be re-derived and challenged.

**Claims deliberately not made:** that any hue reliably produces an emotion; that dark mode reduces eye strain
for general users; that OKLCH ramps are automatically accessible (they are perceptually even, which is a
different property — green and amber still fail at steps where blue passes); that a 4.5:1 pass proves
legibility; that P3 improves UI colour meaningfully; and any specific conversion figure attached to a button
colour, which circulates widely with no locatable primary source.

## Further reading in this skill

- `references/palette-tokens.md` — read when setting up or auditing a palette: the full 50–950 ramps for six
  hues with hex fallbacks, the complete measured contrast matrix for every text × surface pair in both themes,
  the ramp generator (Python and JS), a Tailwind v4 `@theme` version of the whole token set, and a staged
  migration recipe for a codebase already full of hardcoded hexes.
- `references/theme-switching.md` — read when implementing or debugging a theme toggle: the three-state
  pattern in vanilla JS, React and Next.js/SSR, the flash-of-wrong-theme fix in each, cross-tab and
  system-change synchronisation, `forced-colors` / Windows High Contrast mode, images, illustrations, charts
  and syntax highlighting in dark mode, iframes and embeds, and print styles.
