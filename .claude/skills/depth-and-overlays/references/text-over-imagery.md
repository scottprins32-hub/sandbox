# Text over imagery: guaranteeing contrast you cannot see in advance

Read this whenever text lands on a photograph, a video, a gradient, or anything supplied by a CMS or
uploaded by a user. `SKILL.md` moves 10–13 have the headline numbers; this file has the solver, the
recipe library, the responsive geometry, and the pipeline for imagery you have never seen.

The whole problem in one line: **WCAG 1.4.3 binds at the worst pixel under the glyphs, and with
user-supplied imagery you do not know what that pixel is.** Every technique below exists to make the
answer not depend on the image.

---

## 1. The solver

Compositing in CSS is sRGB source-over, so a scrim at alpha α over a background pixel `B` leaves
`B·(1−α) + S·α` per channel. The worst case for light text is a pure white pixel; for dark text, pure
black. Solve for the smallest α that still clears the target ratio against that worst case, and the
guarantee holds for every image forever.

```js
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [hi, lo] = [L(a), L(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Minimum scrim alpha guaranteeing `target` for `text` over ANY image. */
function minAlpha(text = [255, 255, 255], scrim = [0, 0, 0], target = 4.5) {
  const worst = L(text) > 0.5 ? [255, 255, 255] : [0, 0, 0];
  for (let a = 0; a <= 1.0001; a += 0.01) {
    const mix = worst.map((c, i) => Math.round(c * (1 - a) + scrim[i] * a));
    if (ratio(text, mix) >= target) return Math.round(a * 100) / 100;
  }
  return null;                       // this scrim colour can never reach the target
}

minAlpha();                              // 0.54  white text, black scrim, 4.5:1  → ship 0.55
minAlpha([255,255,255], [0,0,0], 3);     // 0.42  white text, large type, 3:1     → ship 0.45
minAlpha([255,255,255], [0,0,0], 7);     // 0.65  white text, AAA                 → ship 0.66
minAlpha([255,255,255], [11,27,52]);     // 0.60  white text, navy #0B1B34 scrim
minAlpha([245,245,245]);                 // 0.56  off-white text costs alpha
minAlpha([17,17,17], [255,255,255]);     // 0.49  dark text, WHITE scrim over any image
```

Reference points from the same maths — the flat backgrounds at which pure white text hits each floor:
`#949494` for 3:1, `#767676` for 4.5:1, `#595959` for 7:1.

**Three things this makes obvious, and all three matter:**

- **Black is the most efficient scrim.** Any tint raises the required alpha, which means it dulls the
  image *more* to buy the same contrast. Tint for brand reasons knowing the cost, not by accident.
- **Off-white text is not free.** `#F5F5F5` costs two extra points of alpha over `#FFFFFF`. Keep hero
  text pure white or re-solve.
- **Dark text over imagery is not cheaper, just differently priced.** A white scrim needs α ≈ 0.49 to
  guarantee `#111111` at 4.5:1 — numerically less than the black scrim's 0.55, but a 49% white veil
  reads as haze or a rendering error, where a dark scrim reads as shade and as an intentional mood.
  That last part is taste rather than law, but it is near-unanimous taste: light text on a darkened
  image is the convention for a reason. If the design needs dark text on a photo, ship a solid panel.

---

## 2. Scrim recipe library

All recipes use the smoothstep falloff so there is no Mach band at the soft end. To regenerate any of
them for a different plateau `P` and maximum alpha `A`, multiply `A` by these factors at nine evenly
spaced positions from `P` to the far end:

```
1.000, 0.957, 0.844, 0.684, 0.500, 0.316, 0.156, 0.043, 0.000
```

**Bottom-anchored** — the default. Text in the lower band, image visible above.

```css
--scrim-bottom: linear-gradient(to top,
  rgb(0 0 0 / 0.62)  0%, rgb(0 0 0 / 0.62) 42%, rgb(0 0 0 / 0.59) 50%,
  rgb(0 0 0 / 0.50) 58%, rgb(0 0 0 / 0.40) 65%, rgb(0 0 0 / 0.29) 72%,
  rgb(0 0 0 / 0.19) 79%, rgb(0 0 0 / 0.09) 86%, rgb(0 0 0 / 0.03) 93%,
  rgb(0 0 0 / 0)   100%);
```

**Top-anchored** — a transparent nav or eyebrow over a hero. Shallower, because nav text is usually
large or iconic; check whether 3:1 or 4.5:1 applies before reusing the alphas.

```css
--scrim-top: linear-gradient(to bottom,
  rgb(0 0 0 / 0.55) 0%, rgb(0 0 0 / 0.55) 18%, rgb(0 0 0 / 0.46) 28%,
  rgb(0 0 0 / 0.34) 38%, rgb(0 0 0 / 0.20) 48%, rgb(0 0 0 / 0.09) 58%,
  rgb(0 0 0 / 0.02) 68%, rgb(0 0 0 / 0)    78%);
```

**Dual-ended** — nav at the top, caption at the bottom, image breathing in the middle. Two stacked
backgrounds, not one gradient, so each band can be tuned independently.

```css
background-image: var(--scrim-top), var(--scrim-bottom);
```

**Side-anchored** — text in the left third of a wide hero. `linear-gradient()`'s side keywords are physical
only: there is no `to inline-end`, and writing one invalidates the whole declaration. Flip it on direction
instead — `[dir="rtl"] { --scrim-inline: linear-gradient(to left, …) }` — or the scrim lands on the wrong
side in Arabic.

```css
--scrim-inline: linear-gradient(to right,
  rgb(0 0 0 / 0.66) 0%, rgb(0 0 0 / 0.66) 34%, rgb(0 0 0 / 0.63) 42%,
  rgb(0 0 0 / 0.54) 50%, rgb(0 0 0 / 0.41) 58%, rgb(0 0 0 / 0.26) 66%,
  rgb(0 0 0 / 0.13) 74%, rgb(0 0 0 / 0.04) 82%, rgb(0 0 0 / 0) 90%);
```

**Radial vignette** — centred text on a full-bleed image. The trap: a radial scrim's alpha at the
*corners of the text block* is lower than at its centre, so solve for the corner, not the middle.

```css
--scrim-radial: radial-gradient(ellipse 90% 70% at 50% 50%,
  rgb(0 0 0 / 0.60) 0%,  rgb(0 0 0 / 0.60) 45%, rgb(0 0 0 / 0.57) 52%,
  rgb(0 0 0 / 0.49) 59%, rgb(0 0 0 / 0.37) 66%, rgb(0 0 0 / 0.23) 73%,
  rgb(0 0 0 / 0.11) 80%, rgb(0 0 0 / 0.03) 88%, rgb(0 0 0 / 0) 100%);
```

**Solid panel** — the answer whenever the design permits it. No maths, no worst case, survives image
failure and forced-colors, and reads as deliberate rather than as a photographic effect.

```css
.hero__panel {
  background: var(--image-ground, #15171C);          /* SKILL.md move 10; or a light surface, with dark text */
  padding: var(--space-lg);                          /* spacing-and-layout's scale */
  border-radius: 8px;                                /* your system's panel radius */
}
```

**Text-shadow / stroke** — belt and braces only, layered *on top of* a guaranteed scrim. It is deleted
in forced-colors mode and credited by no checker.

```css
.hero__title { text-shadow: 0 1px 3px rgb(0 0 0 / 0.55), 0 1px 12px rgb(0 0 0 / 0.35); }

/* Outlined text, stroke painted behind the fill so letterforms stay their designed weight. */
.hero__title--stroked {
  paint-order: stroke fill;
  -webkit-text-stroke: 3px rgb(0 0 0 / 0.6);
}
```

---

## 3. Responsive geometry — where the guarantee usually breaks

The plateau is a percentage of the container. The text block is a number of lines. Those two scale
differently, and the mismatch is the most common way a correct scrim becomes an incorrect one.

A 16:9 hero at 1440px is 810px tall and its two-line headline occupies the bottom 30%. The same hero
at 390px is 219px tall, the headline wraps to four lines, and it now occupies the bottom **65%** —
well past a plateau tuned at 42%, so the top two lines sit in the falloff at 2–3:1.

Three ways to fix it, best first:

1. **Anchor the scrim to the content, not the container.** Put the scrim on the text block's own
   wrapper with a fixed pixel plateau plus a fade, using `padding-block-start` to give the fade room.
   The scrim then grows with the text automatically.

   ```css
   .hero__body {
     padding-block: 6rem var(--space-lg);        /* the fade lives in the top padding */
     background: linear-gradient(to top,
       rgb(0 0 0 / 0.62) 0, rgb(0 0 0 / 0.62) calc(100% - 6rem),
       rgb(0 0 0 / 0.50) calc(100% - 4.6rem), rgb(0 0 0 / 0.29) calc(100% - 3.1rem),
       rgb(0 0 0 / 0.09) calc(100% - 1.5rem),   rgb(0 0 0 / 0) 100%);
   }
   ```

2. **Container queries on the plateau.** `@container (max-width: 480px) { --scrim-plateau: 70%; }`.
   Use container queries, not media queries — the same hero renders at three widths in a grid.

3. **Cap the headline.** A `max-width` in `ch` and a hard line limit keeps the text band predictable.
   Weakest option, because a long CMS title will still overflow the assumption.

**Also check:** 200% browser zoom and the WCAG 1.4.12 text-spacing override both grow the text block
without growing the container. Run both against every hero. And never give the text container a fixed
`height` — `min-height` only, or the override clips (1.4.12).

---

## 4. Imagery you have never seen: the pipeline

For CMS and user-uploaded images, the guarantee is an engineering property of the pipeline, not a
design decision made once in Figma.

**At upload / ingest, on the server:**

- **Extract a dominant colour** and store it on the record. Use it as the container's
  `background-color` so the layout is legible before decode and after a failed request. Darken it to
  ≤ the `#767676` luminance ceiling first, so it never becomes the thing that breaks contrast, and
  fall back to `--image-ground` (SKILL.md move 10) whenever extraction fails or the record predates it.
- **Probe the text region's luminance.** Downscale to ~32px wide, sample the band where text will
  land, take the **99th-percentile** luminance (not the mean — a small blown-out highlight behind one
  word is exactly the failure case). Store it.
- **Store a per-image scrim alpha**, computed by the solver against that probe. Clamp it to
  `[the guaranteed floor, 0.85]`. The floor means a dark image never drops below safety; the probe
  means a bright image gets extra protection rather than the same protection.
- **Store an editor-set focal point** as `object-position` percentages, so `object-fit: cover` does not
  crop the subject out at narrow widths.

```html
<article class="hero" style="--focal: 62% 28%; --scrim-max: .68; background-color:#1B2430">
```

**If you have no server-side pipeline**, do not fall back to eyeballing. Ship the fixed guaranteed
floor from the solver for every image. It over-darkens some photos. That is the correct trade: a
slightly flat photo is a design compromise, unreadable text is a defect and an accessibility failure.

**What not to do:** compute the scrim in the browser by drawing the image to a canvas and reading
pixels. It is a tainted-canvas problem for cross-origin images, it runs after the image has already
been shown, and it produces a visible flash of the wrong scrim.

---

## 5. Video, and the loading / failure / forced-colors matrix

**Video backgrounds** follow every rule above plus three:

- The `poster` frame must satisfy the guarantee too — it is the frame most users actually see.
- The scrim must survive the *brightest frame* in the loop, not the first frame. Probe the whole clip,
  or use the fixed floor.
- `@media (prefers-reduced-motion: reduce)` must pause or replace the video with the poster
  (`design-motion-principles` owns the motion rule; the contrast requirement is unchanged either way).

**State matrix.** Walk each row against every hero before shipping.

| State | What the user sees | Requirement |
|---|---|---|
| Image loaded | Photo + scrim + text | Guaranteed alpha across the whole text band |
| Image decoding | Container background + scrim + text | Container `background-color` dark enough on its own |
| Image 404 / blocked / `Save-Data` | Container background + scrim + text | Same — this is why the container colour is not optional |
| `forced-colors: active` | Photo, **no** scrim (gradients forced to `none`), **no** text-shadow | An opaque `Canvas` panel behind the text, declared in the media query |
| `prefers-reduced-transparency` | Chromium/Edge only | Swap translucent panels for opaque; do not depend on it |
| Print | Often no background images at all | `@media print` — dark text, no scrim, or hide the image |
| Text selected | Selection highlight over the scrim | Check `::selection` contrast; the UA default may fail on a dark scrim |

```css
@media (forced-colors: active) {
  .hero__scrim { display: none; }                 /* it is already none; be explicit */
  .hero__body  { background-color: Canvas; }
  .hero__title { color: CanvasText; }
}
@media print {
  .hero__img, .hero__scrim { display: none; }
  .hero__title { color: #000; }
}
```

---

## 6. Verification

Three checks, all cheap, in the order that catches the most bugs first.

1. **The white-image test.** Swap the image for a solid `#FFFFFF` PNG. Screenshot. Sample the lightest
   pixel under the glyphs with any eyedropper and run it through the solver's `ratio()`. If that
   passes, every image passes. This one check subsumes almost all of the others.
2. **The snowfield test.** Keep a fixture set of four adversarial images — a snowfield, a white studio
   background, a blown-out sky, and a high-contrast black-and-white pattern — and render every hero
   variant against all four in CI screenshots.
3. **The band test.** Not just the worst pixel but the worst *line*: check the top line of the headline
   and the bottom line of any supporting text, since those sit nearest the falloff.

Automated contrast checkers cannot evaluate text over an image — they read the computed
`background-color`, find `transparent`, and either skip the element or report against the wrong value.
A green axe run over a hero section means nothing. The white-image test is the substitute, and it needs
to be someone's explicit job.
