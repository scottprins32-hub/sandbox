---
name: depth-and-overlays
description: Settles the actual values for depth — a named elevation scale with layered box-shadow specs, shadow colour derived from the surface, inset shadows for wells and pressed states, borders vs shadows vs surface-shift as three different depth signals, dark-mode depth where shadows stop working, and text over photography with a *computed* contrast guarantee rather than an eyeballed one. Use this whenever the user is building or reviewing cards, modals, dropdowns, popovers, tooltips, sticky bars, drag states, hero sections, image banners, cover art, or anything with a `box-shadow`, `backdrop-filter` or gradient overlay — even if they never say "elevation", "shadow" or "depth". Also use it for symptoms like "the shadows look cheap/muddy/harsh", "this looks flat", "the card disappears in dark mode", "my modal doesn't feel on top", "the text on our hero image is hard to read", "how do I put text on a photo", "should this be a border or a shadow", or any glassmorphism / frosted-panel request. If a diff contains a `box-shadow` with an X offset or an `rgba(0,0,0,…)` scrim, this skill owns it.
---

# Depth and overlays

This skill settles two questions with numbers. **How far above the page is this element, and what shadow says so?** And **how do you put text on an image you have never seen and still guarantee it is readable?** Without a decided elevation scale you get a codebase where every card invented its own shadow, nothing reads as consistently stacked, and a dropdown sits under a card in the depth model while sitting over it in the DOM. Without a computed contrast floor on imagery, you get white headlines that were checked against one stock photo and fail the moment a user uploads a picture of snow.

`attention-and-hierarchy` owns why a luminance gradient draws the eye and how figure/ground separation works perceptually. Read it for the mechanism. Read this for the pixels.

## When this is the right skill

- Defining shadows for a design system, or auditing a codebase where every component invented its own.
- Cards, panels, modals, dialogs, sheets, dropdowns, popovers, tooltips, toasts, sticky headers, FABs, drag ghosts — anything that must be understood as *above* something else.
- "Looks flat", "looks cheap", "muddy", "harsh"; dark mode where cards vanish or shadows become halos.
- Text over photography, video, gradients, or user-uploaded/CMS imagery — heroes, cover images, card thumbnails with overlaid titles, article headers. Frosted-glass panels and translucent bars.
- Deciding whether a boundary should be a border, a shadow, or a background step.

Go elsewhere when: the question is **which colour the surfaces are** or the dark-theme surface ladder itself (`color-and-theming` — it owns the tokens, this skill owns the shadows that sit on them); **how much space** inside or around the elevated thing (`spacing-and-layout`); **which of eight states** a pressed control has and what else changes (`ui-signifiers-and-states` — this skill supplies the depth values for the pressed and dragging states it specifies); **how the elevation animates** on hover or open (`design-motion-principles`); whether the whole thing looks generic or AI-shaped (`taste-frontend-design`); **whether the eye lands in the right place** (`attention-and-hierarchy`). `ui-craft` routes the whole craft set.

## Decide first

Five answers determine every number below.

1. **Is your depth model stacked or flat?** A stacked system (cards over a page, menus over cards, modals over everything) needs a 5–6 step elevation scale and shadows do real work. A flat system separates regions with borders and surface steps and may legitimately ship **zero** shadows. Linear, Notion and most dense data tools are closer to flat than the average Bootstrap page. Decide before you write a single `box-shadow`; retrofitting a flat system with shadows is easy, stripping shadows out of one that leaned on them is not.
2. **Light, dark, or both.** Shadows carry elevation in light mode and almost nothing in dark mode, where lightness carries it instead. If you support both, elevation must be expressed as a *pair* of tokens — a surface step and a shadow — from the first commit, or the dark theme becomes a rewrite.
3. **What surfaces will elevated things land on?** List them: page background, a tinted section, a saturated brand block, a photograph, a dark theme base. A shadow tuned on white and never checked on `#E7EAF0` is the single most common reason a system "works in Figma and looks off in the app".
4. **Density.** A dashboard with 40 cards on screen cannot afford 40 shadows — the page turns to mud, and each shadow costs fill rate. Dense surfaces should use borders and surface steps and reserve shadow for things that genuinely float. Marketing surfaces can spend it.
5. **Does imagery come from you or from users?** Art-directed imagery you control can be checked by eye. CMS or user-uploaded imagery cannot — the contrast must be **structurally guaranteed**, which changes the technique from "pick a scrim that looks nice on this photo" to "compute the minimum alpha that survives a white image".

**Law, convention, taste.** Each move is tagged. *Law* means a WCAG success criterion or specified browser behaviour — comply or ship a defect. *Convention* means a widely-shared pattern with a real rationale you may deviate from deliberately. *Taste* means judgment you are entitled to disagree with.

## The moves

### 1. If the shadow is the first thing you notice, it is wrong — *taste, with a testable mechanism*

This is the whole quality bar in one sentence, and it generalises: craft is felt, not seen.

The mechanism is worth knowing so you can apply it elsewhere. A shadow is a low-frequency luminance gradient. Low-frequency gradients are processed as *depth* — pre-consciously, without competing for attention. But a shadow that is dark and tight (high alpha, small blur) produces a **luminance edge**, and edges are exactly what preattentive vision extracts as shape. At that point the shadow has stopped being depth and become a drawn outline sitting next to your content, competing with it. So the operational rule: **no shadow layer may produce a perceptible edge.**

Two tests. **The kill test:** apply `* { box-shadow: none !important }`. If the layout becomes ambiguous — you can no longer tell what is on top of what — the shadows are load-bearing. If it just looks flatter and stays perfectly clear, they were decoration, and decoration that vanishes in forced-colors mode (move 8) at that. **The squint test:** blur a screenshot by 4px; if the shadow still reads as a distinct dark shape rather than a soft ground, it is too dark or too tight.

**Tuning a new level without guessing:** set y-offset to roughly ¼ of the height you want the element to read as (a resting card `y: 1`, a modal `y: 6–8`); set blur to **2–3× the offset**, because blur is the variable that reads as *softness of the light* and soft is the default in every real interior; raise alpha until you can just perceive the lift, then back off one step — correct is **4–10%** per layer, not 20–40%; then add the contact and ambient layers from move 3.

How it fails: someone reaches for `0 4px 8px rgba(0,0,0,0.4)`. 40% alpha at 8px blur has a visible boundary, so every card gets a grey halo and the page reads as a stack of stickers.

### 2. Offset Y only — and the honest reason — *convention*

Every shadow in a system offsets on Y. `box-shadow: 3px 3px 6px …` reads as broken.

The folklore reason is "light comes from above". The accurate version is more interesting and gives you the boundary of the rule: the visual system carries a **light-from-above prior** — it resolves ambiguous shading by assuming a single overhead source (Ramachandran, *Perception of shape from shading*, Nature 331, 1988). Sun & Perona (*Where is the sun?*, Nature Neuroscience 1998) found the assumed direction is actually slightly **above-left**, which means a small positive X offset is not perceptually wrong at all.

So the real rule is not "X offsets are illegal". It is: **one light source, declared once, obeyed by every shadow in the product.** Y-only is the safe default because it is what every other product does, so it never reads as a mistake, and because it survives right-to-left mirroring without a second token set. If you commit to an above-left source, every shadow gets the same X sign and the same ratio, and you flip the sign under `[dir="rtl"]`. Mixed X offsets across components is the failure, not X offsets as such.

How it fails: a designer nudges one card's shadow to `4px 4px` because it looked better in isolation, and now that card is lit by a different sun than the modal above it.

### 3. Layer two or three shadows — the biggest single quality jump available — *convention*

One `box-shadow` cannot look real, because real shadows are not one thing. An area light source produces an **umbra** (fully occluded, tight, dark, right under the object), a **penumbra** (partially occluded, wider, softer), and an **ambient occlusion** term (broad, very faint, from indirect light). A single box-shadow is a single blur at a single opacity and can represent exactly one of those.

Stacking two or three with increasing blur and *slowly* increasing alpha approximates the falloff, and it is the change that most reliably moves a UI from "looks like a tutorial" to "looks made". Material Design's elevation system is built exactly this way — MDC's Sass ships three layers per level with fixed opacities of **0.20 umbra / 0.14 penumbra / 0.12 ambient**; Material 3 simplified to two.

```css
/* One shadow — a grey halo with an edge */
box-shadow: 0 4px 12px rgb(15 23 42 / 0.25);

/* Three layers — contact, body, ambient. Same visual weight, no edge. */
box-shadow:
  0  1px  1px  0    rgb(15 23 42 / 0.04),   /* contact: where it touches   */
  0  4px  8px  -2px rgb(15 23 42 / 0.06),   /* body: the readable lift     */
  0 12px 20px -6px rgb(15 23 42 / 0.09);    /* ambient: broad, almost gone */
```

**The geometry rules that make layering work:**

- **Blur ≈ 2–3× the Y offset** on every layer, and **negative spread ≈ −⅓ to −½ of the blur** on the wide layers. Without the spread, a 40px blur smears 20px out of *every* side and the element sits in fog; with it, the shadow stays under the element where gravity put it.
- **No shadow above the element.** CSS Backgrounds 3 §6.1.2 specifies the blur as approximating a Gaussian with standard deviation equal to *half* the blur radius, centred on the shadow's edge — so a layer extends `blur/2` beyond its spread-adjusted rect, and its topmost pixel sits at `offsetY − spread − blur/2` below the element's top edge. Keep that **≥ 0** on the wide layers: `0 12px 20px -6px` gives `12 − (−6) − 10 = 8px`, safely below. The tight contact layer may bleed a pixel above — omnidirectional ambient occlusion is real and reads correctly.
- **Alpha rises slowly, blur rises fast.** Across a 5-level scale blur goes 2px → ~56px (28×) while total alpha goes ~5% → ~16% (3×). Getting this backwards — dark shadows for high elevation — is what "harsh" means.

How it fails: teams add layers but keep each layer's alpha at what they used for the single shadow. Three layers at 25% is not subtle, it is 75%. When you split a shadow, split the alpha.

### 4. Ship an elevation *scale*, not shadows — *convention*

Six levels is enough for anything. Each level is a token; components reference the token and never a literal. The scale must be **ordered the same way as your z-index scale** — if a popover has a lighter shadow than the card it opens over, the depth model contradicts the stacking model and the UI feels wrong for a reason nobody can name in review.

```css
:root {
  /* Channels only, so each layer can set its own alpha. See move 5 for the hue. */
  --shadow-hsl: 222 40% 11%;

  --elevation-0: none;                       /* flat: borders/surface do the work   */

  --elevation-1:                             /* resting cards, list rows, inputs    */
    0  1px 1px  0    hsl(var(--shadow-hsl) / 0.05),
    0  2px 4px  -1px hsl(var(--shadow-hsl) / 0.05);

  --elevation-2:                             /* card hover, sticky bar, raised btn  */
    0  1px 1px  0    hsl(var(--shadow-hsl) / 0.04),
    0  2px 4px  -1px hsl(var(--shadow-hsl) / 0.05),
    0  6px 10px -3px hsl(var(--shadow-hsl) / 0.06);

  --elevation-3:                             /* dropdown, popover, tooltip, combobox*/
    0  1px 1px  0    hsl(var(--shadow-hsl) / 0.04),
    0  4px 8px  -2px hsl(var(--shadow-hsl) / 0.06),
    0 12px 20px -6px hsl(var(--shadow-hsl) / 0.09);

  --elevation-4:                             /* modal, dialog, sheet, palette       */
    0  2px 4px  -1px hsl(var(--shadow-hsl) / 0.04),
    0  8px 16px -4px hsl(var(--shadow-hsl) / 0.07),
    0 24px 40px -12px hsl(var(--shadow-hsl) / 0.12);

  --elevation-5:                             /* the thing the user is dragging      */
    0  2px 4px  -1px hsl(var(--shadow-hsl) / 0.05),
    0 12px 24px -6px hsl(var(--shadow-hsl) / 0.09),
    0 32px 56px -16px hsl(var(--shadow-hsl) / 0.16);
}
```

Then map roles to levels once, in a table everyone can read, and never decide per-component again:

| Level | Reads as | Components |
|---|---|---|
| 0 | On the page | Table rows, list items, flat cards in dense views, page sections |
| 1 | Just above | Resting cards, panels, inputs, chips, tiles |
| 2 | Lifted | Card hover, sticky header/footer, segmented-control thumb, raised button |
| 3 | Floating | Dropdown, select menu, popover, tooltip, combobox, date picker, toast |
| 4 | Over everything | Modal, dialog, action sheet, command palette, drawer |
| 5 | In the user's hand | Drag ghost, reorder preview |

Tailwind v4, CSS-first: anything in the `--shadow-*` namespace generates a utility, so these become `shadow-e1` … `shadow-e5`, and `--inset-shadow-*` gives you `inset-shadow-well`.

```css
@import "tailwindcss";
@theme {
  --shadow-e1: 0 1px 1px 0 hsl(var(--shadow-hsl)/0.05), 0 2px 4px -1px hsl(var(--shadow-hsl)/0.05);
  --shadow-e3: 0 1px 1px 0 hsl(var(--shadow-hsl)/0.04), 0 4px 8px -2px hsl(var(--shadow-hsl)/0.06),
               0 12px 20px -6px hsl(var(--shadow-hsl)/0.09);
  --inset-shadow-well: inset 0 1px 2px 0 hsl(var(--shadow-hsl)/0.09);
}
```

Custom-property substitution is lazy, so redefining `--shadow-hsl` under a dark selector changes every level at once without touching the token definitions.

**Hover should move one level, not jump three.** A card at `--elevation-1` hovers to `--elevation-2`. Transition `box-shadow` (and, if the card also lifts, `transform`) — timing and easing belong to `design-motion-principles`. Never animate a shadow by animating `blur`; cross-fade two stacked pseudo-element shadows if you need it cheap.

How it fails: eleven bespoke shadows, no two alike, and a "raised" hover state that is darker than the modal.

### 5. Derive the shadow colour from the surface, not from black — *convention*

`rgba(0, 0, 0, 0.1)` is the default and the reason shadows look dirty on anything that is not white.

The usual explanation ("black shadows turn grey") is imprecise; the honest mechanism is better. Alpha-compositing black over a colour multiplies every channel by `(1 − α)`, preserving hue ratios but dropping luminance — and perceived **colourfulness falls with luminance** (the Hunt effect). So the shaded region under a card on a saturated block loses chroma while everything around it keeps it, and reads as a smudge of dirt. Real shade is not an absence of light; it is a region lit by *ambient* light, which carries the colour of its surroundings. A shadow that keeps hue and chroma and only drops lightness looks like shade because it is behaving like one.

```css
:root {
  /* A very dark, slightly-saturated version of the surface family.
     Neutral surfaces: match the surface hue, chroma ~0.02–0.05.
     Saturated sections: give the section its own --shadow-hsl override. */
  --shadow-hsl: 222 40% 11%;                     /* cool grey page  */
}
.section--brand {
  --shadow-hsl: 265 55% 12%;                     /* violet block    */
}
.section--warm {
  --shadow-hsl: 24 45% 12%;                      /* sand/cream page */
}
```

Modern equivalents, if the rest of your system is in OKLCH (`color-and-theming` owns that decision):

```css
--shadow-color: oklch(0.20 0.045 264);
/* per-layer alpha, relative colour syntax — Chrome 119, Safari 16.4, Firefox 128 */
box-shadow: 0 4px 8px -2px oklch(from var(--shadow-color) l c h / 0.06);
/* or, with wider reach */
box-shadow: 0 4px 8px -2px color-mix(in srgb, var(--shadow-color) 6%, transparent);
```

**Lightness 10–14% with a little chroma is the target.** Going lighter makes the shadow muddy-grey; going to pure black is the failure this move exists to fix. Note that the shadow's hue should follow the **surface it lands on**, not the element casting it — a white card on a violet block casts a violet-black shadow.

How it fails: one global black shadow token, applied over a coloured hero section, which then looks like someone smeared a thumb on the screen.

### 6. Check every level against the darkest and lightest surface it can land on — *craft*

A shadow is a *relative* darkening, so its visibility depends entirely on what is underneath — and none of that is captured by looking at the token value. The same 6% shadow is clear on `#FFFFFF`, weaker on `#EEF1F5` (less headroom below it), muddy on a saturated block (move 5), **invisible** on `#15171C` (move 9), and pure noise on a photograph — a card over imagery needs a border or a light ring, never a shadow.

The deliverable that prevents this: an **elevation sheet** — one page or Storybook story rendering all six levels as identical swatches, repeated on every surface in your system: white, page background, sunken surface, the two most saturated brand blocks, one photo, and the dark theme base. Ten minutes to build, and it catches the bug permanently.

Two rules fall out of it. **Overlapping shadows double** — two elevated cards whose shadows meet produce a darker band between them, so keep resting elevation low enough that overlap is imperceptible or the gap ≥ the lateral reach (`blur/2 − spread`). And **`--shadow-hsl` is a per-section override, not a global**: set it on the section, let the cards inherit.

### 7. Inset shadows: wells, pressed states, and the raised button — *craft*

`inset` inverts the light model: the shadow falls *inside* the box, so the top edge is dark and the element reads as recessed.

```css
/* A well / sunken region — search fields, code blocks, progress tracks, drop zones */
.well {
  background: var(--color-surface-sunken);            /* the surface step does most of it */
  box-shadow: inset 0 1px 2px 0 hsl(var(--shadow-hsl) / 0.09);
  border: 1px solid var(--color-border-subtle);
}

/* Pressed: drop one elevation level AND move 1px down. Both, or it reads as a colour change. */
.btn { box-shadow: var(--elevation-1); transition: box-shadow 90ms, transform 90ms; }
.btn:active { box-shadow: var(--elevation-0); transform: translateY(1px); }
```

The **raised (physical) button** is three cues at once — a lit top edge, a shaded bottom edge, and a cast shadow:

```css
.btn--raised {
  background-image: linear-gradient(to bottom, rgb(255 255 255 / 0.10), rgb(255 255 255 / 0));
  box-shadow:
    inset 0  1px 0 0 rgb(255 255 255 / 0.18),        /* top edge catches the light */
    inset 0 -1px 0 0 hsl(var(--shadow-hsl) / 0.22),  /* bottom edge in its own shade */
    0 1px 2px 0 hsl(var(--shadow-hsl) / 0.16);       /* cast onto the page */
}
.btn--raised:active {
  background-image: none;
  box-shadow: inset 0 1px 2px 0 hsl(var(--shadow-hsl) / 0.22);   /* the whole face sinks */
  transform: translateY(1px);
}
```

This is a deliberate stylistic commitment, not a neutral default: legible and satisfying, and it dates a UI fast if applied everywhere. Use it on one control — usually the primary action — and let everything else stay flat. `taste-frontend-design` owns that judgment; `ui-signifiers-and-states` owns the rest of the state matrix these values plug into.

**Keep inset tokens separate from elevation tokens.** `box-shadow` is a single property, so a component needing both a cast shadow and an inset highlight must compose them in one declaration — store `--elevation-2` and `--edge-highlight` separately and concatenate at the use site.

### 8. Border, shadow, or surface step — three signals, three costs — *craft, with one law*

These are not interchangeable, and picking the wrong one is why a screen "looks unfinished" or "looks like a cage".

| Signal | Says | Costs | Choose it when |
|---|---|---|---|
| **1px border** | *This is a distinct region* | Adds ink. Many bordered boxes read as a cage; nested borders stack to visual 2px | Dense UI, tables, inputs, dark mode, anything printed, low-end devices, forced-colors |
| **Shadow** | *This is above that* | Fill-rate on large blurs; invisible on dark; noise over imagery; **removed entirely in forced-colors** | Overlays that must be understood as floating: menus, modals, drags |
| **Surface step** | *This is a different layer* | Needs ≥ ~1.1:1 luminance step to be perceptible; cannot express *how far* above | Stacked panels, wells, dark mode, anywhere you want zero extra edges |

**The law.** In forced-colors mode (Windows High Contrast and equivalents), CSS Color Adjustment forces `box-shadow` and `text-shadow` to `none`, and forces non-`url()` `background-image` — which includes every gradient — to `none`. A card, menu or modal whose only boundary is a shadow therefore **disappears completely** for those users, and a gradient scrim over a photo vanishes while the photo remains. This is not a nicety; it is a whole class of users seeing an unbounded, illegible screen.

```css
/* Every shadow-only container gets a real boundary when shadows are taken away. */
@media (forced-colors: active) {
  .card, .menu, .dialog { border: 1px solid CanvasText; }
  .scrim-text        { background-color: Canvas; color: CanvasText; }  /* opaque panel */
}
```

Test it: Windows Settings → Accessibility → Contrast themes, or Chrome DevTools → Rendering → *Emulate CSS media feature forced-colors*.

**When a 1px border is simply the better answer:** more than ~8 elevated boxes visible at once; any table or list; any dark theme; any surface where the element sits on imagery; and any component whose job is *containment* rather than *floating*. A resting card almost never needs to float. Give it `--elevation-1` **and** a `--color-border-subtle` hairline, and it survives every rendering context you do not control.

### 9. In dark mode, lightness carries elevation and shadow changes job — *craft*

On a `#15171C` surface a black shadow does nothing: there is no luminance below the background to remove. Elevation moves to the surface ladder — each level up is a **lighter** surface, roughly 1.1:1 per step. `color-and-theming` owns those tokens (`--color-surface-sunken / surface / surface-raised / surface-overlay`) and the reasoning; do not duplicate them here.

What this skill owns is what happens to the shadows:

```css
:root[data-theme="dark"] {
  --shadow-hsl: 222 60% 2%;          /* darker than the darkest surface, or it does nothing */

  /* Shadows stop meaning "height" and start meaning "separate from what is behind me".
     Higher alpha, tighter blur, and only on things that genuinely overlay content. */
  --elevation-1: none;                                              /* surface step is enough */
  --elevation-3:
    0 4px 10px -2px hsl(var(--shadow-hsl) / 0.50),
    0 10px 22px -6px hsl(var(--shadow-hsl) / 0.40);
  --elevation-4:
    0 8px 20px -4px hsl(var(--shadow-hsl) / 0.60),
    0 24px 48px -12px hsl(var(--shadow-hsl) / 0.50);

  /* The most effective dark-mode depth cue after the surface step: a lit top edge. */
  --edge-highlight: inset 0 1px 0 0 rgb(255 255 255 / 0.06);
}
```

Three rules:

- **Never use a light-coloured shadow to fake elevation in dark mode.** A white or coloured glow reads as *emission* — the element is lit up, not raised. It is the tell of a dark theme that was derived by inversion.
- **The 1px top highlight is worth more than the shadow.** `inset 0 1px 0 rgb(255 255 255 / 0.04–0.08)` mimics the raised edge catching ambient light. Combined with a surface step it produces convincing depth with no blur cost at all.
- **Test with shadows disabled.** If a dark-theme card is invisible under `box-shadow: none`, elevation is still living in the shadow and the dark theme is not done.

### 10. Text on imagery: compute the guarantee, do not eyeball it — *law*

WCAG **1.4.3 Contrast (Minimum)** applies to text over a photograph exactly as it applies to text on a flat colour: **4.5:1** for body text, **3:1** for large text (≥24px regular or ≥18.66px bold). There is no photography exemption. Since the background varies per pixel, the requirement binds at the **worst pixel under the glyphs** — for light text, the *lightest* pixel; for dark text, the *darkest*.

That is unknowable for CMS or user-uploaded imagery. So the contrast must be produced by something you control. **Ladder of techniques, best first:**

1. **Put the text beside the image, not on it.** Zero risk, zero cost, and it usually reads better. Try this before anything below.
2. **A solid or near-solid panel** behind the text (≥90% opaque). Guaranteed by construction, survives image failure and forced-colors, needs no maths.
3. **A gradient scrim with a computed minimum alpha** across the entire text band (move 11).
4. **A `backdrop-filter` panel whose tint carries the guarantee** (move 12).
5. **`text-shadow` or a text stroke** — an *addition* to one of the above, never the guarantee. No automated checker credits it, no WCAG technique defines how to measure it, and forced-colors deletes it.

**The number you need.** Compositing in CSS is sRGB source-over, so a black overlay at alpha α over the worst case (a pure white image) leaves `(1 − α) × 255` per channel. Solving 1.4.3 against white text:

| Requirement | Worst-case background must be ≤ | Minimum α of a **pure black** overlay |
|---|---|---|
| 3:1 (large text, ≥24px / ≥18.66px bold) | `#949494` | **0.42** — use 0.45 |
| 4.5:1 (body text) | `#767676` | **0.54** — use 0.55 |
| 7:1 (AAA) | `#595959` | **0.65** — use 0.66 |

Round up and treat those as floors. Two adjustments:

- **Tinting the scrim costs you alpha.** Black is the most efficient scrim per unit of image dulled. A dark navy `#0B1B34` needs **α ≈ 0.60** to reach the same 4.5:1 that black reaches at 0.55, because the scrim's own luminance adds back in. Recompute for any non-black scrim rather than assuming.
- **Off-white text costs you alpha too.** These assume pure `#FFFFFF`. `#F5F5F5` pushes the 4.5:1 floor to about 0.56. Keep text over imagery pure white, or recompute.

**The failure case nobody handles: the image does not load.** A black gradient scrim over a container with no background is transparent-over-white when the `<img>` 404s, is still decoding, or is blocked. White headline, white background, zero contrast. **Set the container's `background-color` to a dark colour** — the brand's darkest surface, or a server-extracted dominant colour — so failure degrades to legible rather than to blank.

### 11. Gradient scrims: the geometry and the two banding artefacts — *craft*

A **flat** full-bleed scrim at 0.55 is legal and ugly: it dulls the entire photograph to buy contrast in the 30% of it where text actually sits. A **gradient** scrim spends opacity only where it is needed.

The rule that turns this from decoration into a guarantee: **the scrim must be at or above the computed floor across the whole text band, not merely at the very edge.** Measure where the text block starts and ends as a percentage of the container, then hold the plateau to just past the top of the text before easing out.

```css
/* Text occupies the bottom 0–40%. Plateau to 42%, then ease to nothing by 100%.
   Stops follow a smoothstep curve, so the ramp has no slope discontinuity at either end. */
:root {
  --scrim-bottom: linear-gradient(to top,
    rgb(0 0 0 / 0.62)  0%, rgb(0 0 0 / 0.62) 42%, rgb(0 0 0 / 0.59) 50%,
    rgb(0 0 0 / 0.50) 58%, rgb(0 0 0 / 0.40) 65%, rgb(0 0 0 / 0.29) 72%,
    rgb(0 0 0 / 0.19) 79%, rgb(0 0 0 / 0.09) 86%, rgb(0 0 0 / 0.03) 93%,
    rgb(0 0 0 / 0)   100%);
}
.hero__scrim { position: absolute; inset: 0; pointer-events: none; background: var(--scrim-bottom); }
```

**Write the terminal stop as `rgb(0 0 0 / 0)`, not `transparent`.** Gradient interpolation is specified in premultiplied alpha, so modern engines handle `transparent` correctly, but writing the explicit colour costs nothing and removes any doubt about a legacy engine fading through grey.

**Artefact one: Mach banding at the ends.** A plain two-stop `linear-gradient(to top, rgb(0 0 0/0.62), transparent)` has a linear alpha ramp, which means the *slope* changes abruptly at both ends. Lateral inhibition in the retina amplifies discontinuities in the first derivative into an apparent bright or dark line — a **Mach band** — so you see a hard edge where the scrim "starts", even though nothing in the pixel values is a step. The multi-stop eased ramp above fixes it by approaching zero with zero slope.

A CSS **interpolation hint** — a bare percentage between two colour stops — is the one-line version: `linear-gradient(to top, rgb(0 0 0/0.62) 0 42%, 62%, rgb(0 0 0/0) 100%)`. Be clear about what it does: it moves the *midpoint* of the transition, which is useful for tuning where the falloff sits. It does **not** remove the end discontinuity, so it does not fix Mach banding. Use it to shape, use the multi-stop ramp to smooth.

**Artefact two: quantisation banding.** Distinct contour steps across a large, shallow gradient. Different cause — 8 bits per channel cannot represent enough intermediate values across 500px of near-flat ramp — and **more stops do not fix it**. It shows worst over flat skies, solid brand blocks and other gradients; photographic grain already dithers it away. The fix is noise:

```css
.hero__scrim::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

Rasterise it once and never animate it — `feTurbulence` is expensive to generate, cheap to reuse.

`references/text-over-imagery.md` has the scrim recipe library (bottom, top, corner, radial, edge-to-edge, dual-ended), the alpha-solver script for arbitrary scrim and text colours, and the CMS/user-upload pipeline.

### 12. `backdrop-filter` panels: blur removes detail, not luminance — *craft*

The modern alternative to a scrim is a translucent panel that blurs what is behind it. The insight that makes it work — and that most implementations get wrong:

**Blur destroys high-frequency detail. It does not change mean luminance.** So it solves "the text is sitting on a busy texture and the letterforms are hard to parse", and it does *nothing* for "white text over a bright sky". A blurred white background is still white. **The tint carries the contrast guarantee; the blur only buys legibility of form.** Every number from move 10 applies unchanged to the tint.

```css
.glass {
  /* the guarantee — a full-strength scrim alpha, not a decorative 15% */
  background-color: rgb(0 0 0 / 0.55);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
          backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid rgb(255 255 255 / 0.12);       /* an edge, so the panel has a boundary */
}

/* No support → the tint must do all the work, so raise it. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background-color: rgb(0 0 0 / 0.72); }
}

/* User asked for less transparency. Honour it — but see the caveat below. */
@media (prefers-reduced-transparency: reduce) {
  .glass { background-color: var(--color-surface-inverse); backdrop-filter: none; }
}
@media (forced-colors: active) {
  .glass { background-color: Canvas; color: CanvasText; border-color: CanvasText; }
}
```

**Values.** `blur(12px)`–`blur(24px)` for a panel. Below 8px reads as a rendering glitch rather than a material; above ~40px the backdrop carries no information and you have paid a lot for a flat tint. `saturate(1.3–1.5)` restores the chroma that blur plus a dark tint drains — this is what makes Apple's materials look alive rather than grey.

**The backdrop-root trap.** `backdrop-filter` samples the *backdrop root*, and an ancestor with `opacity < 1`, `filter`, `mask`, `clip-path`, `mix-blend-mode`, `backdrop-filter`, or `will-change` for any of those establishes a new one. A frosted header that looks like it is blurring nothing almost always has such a parent. `backdrop-filter` is Baseline (newly available, September 2024); ship `-webkit-` for older iOS.

**`prefers-reduced-transparency` is an enhancement, not a guarantee.** It is Chromium/Edge 118+ only — Firefox has it behind a flag, and Safari and iOS Safari do not support it at all, which is precisely where Apple's own "Reduce Transparency" setting lives. The users most likely to have asked for it are on the browsers that will not tell you, so the transparent state must be legible on its own.

**Performance.** The backdrop is re-sampled and re-blurred whenever anything behind it changes — for a sticky blurred header over a scrolling page, that is every frame across the full viewport width. Cost scales with blurred **area × radius** and lands hardest on low-end Android and older iPads. Blur the smallest area that works, keep the radius ≤ 20px, never animate the radius (cross-fade a pre-blurred layer instead), and profile on a real budget device rather than a laptop where everything is 60fps. Large `box-shadow` blur radii spend the same fill rate — a 56px shadow on 40 cards is a measurable scroll regression.

### 13. Before and after: a hero card with text over a photo

**Before** — every failure in this skill, in nine lines:

```css
.hero {
  background: url(/hero.jpg) center / cover;
  border-radius: 12px;
  box-shadow: 3px 3px 12px rgb(0 0 0 / 0.4);
}
.hero::before { content: ""; position: absolute; inset: 0; background: rgb(0 0 0 / 0.35); }
.hero h2 { color: #fff; text-shadow: 1px 1px 3px #000; }
```

What is wrong, itemised: an **X offset** nothing else in the system has (move 2); a **single dark tight shadow** at 40% that reads as an outline (moves 1, 3); a **flat scrim** that dulls the whole photograph (move 11) and, at 0.35, delivers **2.43:1** against a white image — a straight 1.4.3 failure, short even of the 3:1 large-text floor (move 10); **`text-shadow` as the guarantee**, which measures nothing and is deleted in forced-colors (moves 8, 10); and **no container background**, so a failed image request leaves white text on white (move 10).

**After:**

```css
.hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-inverse);   /* legible if the image never arrives */
  box-shadow: var(--elevation-2);
  border: 1px solid var(--color-border-subtle);     /* survives forced-colors and dark mode */
}
.hero__img {
  position: absolute; inset: 0; z-index: -2;
  width: 100%; height: 100%;
  object-fit: cover;
  object-position: var(--focal, 50% 50%);           /* editor-set focal point */
}
.hero__scrim {
  position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background: var(--scrim-bottom);                  /* eased, plateaus at 0.62 across the text */
}
.hero__body { position: relative; padding: var(--space-lg); }   /* occupies the bottom ~40% */
.hero__title { color: #fff; }                                   /* 4.5:1 guaranteed by the scrim */

@media (forced-colors: active) {
  .hero__body { background-color: Canvas; }
  .hero__title { color: CanvasText; }
}
```

The plateau is 0.62 rather than the bare 0.55 floor deliberately: it scores **6.19:1** against a pure-white image, which leaves headroom for an off-white text token, a slightly lighter brand scrim, or a headline that wraps one line further up than the design assumed.

Verify it, do not trust it: screenshot over a **pure white** test image and sample the lightest pixel under the headline. That one check is the difference between a scrim that looks right and one that is right.

## Anti-patterns

- **`box-shadow: 0 4px 8px rgba(0,0,0,0.4)`** or anything else dark-and-tight. An outline, not depth.
- **X and Y offsets that disagree across components.** One sun, or no sun.
- **A single shadow layer everywhere**, or three layers that each kept the single layer's 25% alpha.
- **A global black shadow token used over coloured sections.** Muddy. Override `--shadow-hsl` per section.
- **A shadow that only ever got looked at on white**, and **elevation that contradicts z-index**.
- **Shadow as the sole boundary.** Deleted in forced-colors; invisible in dark mode. Pair with a border.
- **White or coloured glow to fake dark-mode elevation.** Reads as emission. Use a lighter surface.
- **A flat full-bleed scrim.** Pays contrast cost across the whole image to buy it in one corner.
- **A scrim opacity chosen by looking at one photograph.** The next photo is a snowfield.
- **A scrim that reaches full strength only at the very edge**, so the headline's top line sits at 2:1.
- **`text-shadow` as the contrast strategy.** Not measurable, not credited, gone in forced-colors.
- **`backdrop-filter: blur()` with a 10% tint**, on the theory that blur creates contrast. It does not.
- **Animating `backdrop-filter` blur radius**, or applying it full-viewport behind a scrolling page.
- **A gradient scrim over a container with no `background-color`.** Fails open when the image fails.
- **Shadows on every card in a dense list.** 40 shadows is a grey page and a fill-rate bill. Borders.

## Ship checklist

Run against the screen or the PR diff.

- [ ] Every `box-shadow` in the diff comes from an elevation token; no literals in components.
- [ ] Every shadow offsets on Y only — or every shadow shares one declared X sign and ratio.
- [ ] Every level above 0 has ≥2 layers, blur ≈ 2–3× the offset, negative spread on the wide layers, and per-layer alpha in the 4–16% range in light mode.
- [ ] Shadow colour comes from `--shadow-hsl` at lightness ~10–14%, not `rgba(0,0,0,…)`; saturated sections override it.
- [ ] Elevation order matches z-index order — the modal outranks the popover, which outranks the card.
- [ ] The elevation sheet has been rendered on white, page, sunken, the brand blocks, a photo, and the dark base.
- [ ] Dark theme: elevation lives in the surface ladder; cards stay visible with `box-shadow: none`; no light glow.
- [ ] Every shadow-only container also has a border, or a `@media (forced-colors: active)` rule that gives it one (`box-shadow`, `text-shadow` and gradients are all forced to `none` there).
- [ ] Text over imagery: the scrim's minimum alpha across the **whole text band** meets the computed floor — **0.55** black for 4.5:1 body, **0.45** for 3:1 large text; recomputed if the scrim is tinted or the text is not pure white (WCAG 1.4.3).
- [ ] Verified by screenshotting over a **pure white** test image and sampling under the glyphs, not by eye on the art-directed photo.
- [ ] The image container has a dark `background-color`, so a failed or slow image still leaves legible text.
- [ ] Gradient scrims use a multi-stop eased ramp (no Mach band at the top edge), an explicit `rgb(0 0 0 / 0)` terminal stop, and a noise overlay if quantisation banding shows on flat areas.
- [ ] `backdrop-filter` panels carry contrast in the tint, ship `-webkit-`, have an `@supports` fallback that raises the tint, honour `prefers-reduced-transparency` without depending on it, and are not full-viewport behind a scroll region. Profiled on a low-end device.
- [ ] Focus rings on elevated surfaces clear 3:1 against the surface they land on (WCAG 1.4.11) — including over a scrim on a photo.
- [ ] Elevation changes on hover/press respect `prefers-reduced-motion` for the transform component (`design-motion-principles`).
- [ ] Nothing in the depth system carries meaning by shadow alone (WCAG 1.4.1) — "selected" is not "has a shadow".

## Sources

- **WCAG 2.2** (W3C Recommendation) — SC **1.4.1 Use of Color** (A); SC **1.4.3 Contrast (Minimum)** (AA — 4.5:1 body, 3:1 for large text defined as ≥18pt/24px, or ≥14pt/18.66px bold), which applies to text over images and gradients with no exemption, evaluated against the worst-case background under the text; SC **1.4.6 Contrast (Enhanced)** (AAA, 7:1); SC **1.4.11 Non-text Contrast** (AA, 3:1 for UI component boundaries and meaningful graphics). WCAG defines no measurement method for `text-shadow`, which is why it cannot be the guarantee.
- **CSS Backgrounds and Borders Module Level 3**, §6.1.2 *Blurring Shadow Edges* — the blur must approximate a Gaussian blur with standard deviation equal to **half** the blur radius, producing a transition the length of the blur radius, centred on the shadow's edge. This is where `blur/2` in the geometry rules comes from.
- **CSS Color Adjustment Module Level 1** — forced colors mode. `box-shadow` and `text-shadow` are forced to `none`; non-`url()` `background-image` values, including all gradients, are forced to `none`. The basis for move 8's law.
- **CSS Images Module Level 3** — gradient colour interpolation in premultiplied alpha; colour interpolation hints (the bare-percentage midpoint) and what they do and do not change. **CSS Color Levels 4 and 5** — space-separated `hsl()`/`rgb()` with slash alpha, `color-mix()`, relative colour syntax (`oklch(from …)`; Chrome 119, Safari 16.4, Firefox 128).
- **`backdrop-filter`** — Baseline *newly available* since September 2024; backdrop-root establishment by ancestors with `opacity < 1`, `filter`, `mask`, `clip-path`, `mix-blend-mode`, `backdrop-filter`, or `will-change` for those (MDN). **`prefers-reduced-transparency`** — Chrome/Edge 118+; Firefox implemented but disabled by default; Safari and iOS Safari unsupported (~73% of global usage). Enhancement only.
- **Material Design** — the elevation model this skill's layering follows. Material 2 / MDC composed each level from three shadows at fixed opacities: `$shadow-key-umbra-opacity: 0.20`, `$shadow-key-penumbra-opacity: 0.14`, `$shadow-ambient-shadow-opacity: 0.12`. Material 3 reduced this to two layers per level and moved primary elevation expression to surface tint. The tokens in move 4 are this skill's scale — softer than Material's — not a quotation of it.
- **Apple Human Interface Guidelines** — materials and vibrancy: a translucent material conveys layering and lets context through, with legibility preserved by the material rather than by what is behind it; the platform "Reduce Transparency" setting.
- **Light-from-above prior** — V. S. Ramachandran, "Perception of shape from shading", *Nature* 331 (1988); **assumed direction** — Y. Sun & P. Perona, "Where is the sun?", *Nature Neuroscience* 1 (1998), finding an above-left bias. Together these justify move 2's actual rule (one committed light source) rather than the folk version (X offsets are forbidden).
- **Mach bands** — Ernst Mach (1865); the lateral-inhibition account is standard in vision science (Ratliff, *Mach Bands*, 1965). The mechanism behind the visible edge on a two-stop linear scrim. **The Hunt effect** — perceived colourfulness rises with luminance (Fairchild, *Color Appearance Models*); why a pure-black shadow over a saturated surface reads as dirt rather than shade.
- **Donald Norman, *The Design of Everyday Things*** (revised ed., 2013) — signifiers. Elevation is a weak signifier of interactivity and a strong one of layering; move 8's table is that distinction applied.

**Claims deliberately not made here:** that any specific blur/alpha pair is "correct" (the tuning procedure in move 1 is judgment, and the tokens in move 4 are one defensible scale among many); that layered shadows are physically accurate (they approximate umbra/penumbra, they do not simulate it); that `backdrop-filter` has a measurable frame-cost figure (it is entirely device- and area-dependent — profile, do not quote); and any percentage claim about shadows improving comprehension or click-through, which circulate widely with no locatable primary source.

## Further reading in this skill

- `references/elevation-tokens.md` — read when setting up or migrating a project: complete light and dark token files for three system styles (flat/bordered, soft-shadow product, dark-first), the Tailwind v4 `@theme` version, a per-component elevation assignment table, a comparison against Material and Tailwind's default `shadow-*` scale, and a lint rule plus staged migration for a codebase already full of bespoke shadows.
- `references/text-over-imagery.md` — read whenever text lands on a photo, video or gradient: the alpha-solver for arbitrary scrim and text colours with a runnable script, the scrim recipe library (bottom, top, corner, radial, dual-ended, side-anchored), responsive text-band geometry across aspect ratios, the CMS and user-upload pipeline (dominant-colour extraction, server-side luminance probing, editor focal points), video backgrounds and posters, and the loading/failure/forced-colors matrix.
