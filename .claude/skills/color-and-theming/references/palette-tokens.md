# Palette tokens: full ramps, the generator, and migration

Read this when setting up a project's colour tokens, auditing an existing palette, or checking a specific
value. Everything here is generated from the ladder in SKILL.md move 2 and measured with the WCAG 2.x
relative-luminance formula, so any number can be re-derived and argued with rather than taken on trust.

Contrast columns throughout are against `#FFFFFF` (the light base surface) and `#15171C` (the dark base
surface). AA floors: **4.5:1** body text, **3:1** large text and UI component boundaries.

## The generator

Runnable with `node ramp.mjs`, no dependencies. Use it to regenerate a ramp for any brand hue, and to build
the contrast unit test in the last section.

```js
// ramp.mjs — 11-step OKLCH ramp, gamut-clamped to sRGB, with WCAG ratios.
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const L = [0.97, 0.94, 0.89, 0.82, 0.735, 0.655, 0.58, 0.505, 0.435, 0.375, 0.265];
const C = [0.05, 0.11, 0.22, 0.42, 0.68, 0.90, 1.00, 0.95, 0.80, 0.62, 0.40];

const oklchToLinear = (l, c, h) => {
  const a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [ 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
          -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
          -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_];
};
const inGamut = (l, c, h) => oklchToLinear(l, c, h).every(v => v >= -1e-4 && v <= 1 + 1e-4);

// Binary-search the largest in-gamut chroma. Clamping beats letting the browser clip a channel,
// which is what makes hand-authored bright steps look flat and plasticky.
const clampChroma = (l, c, h) => {
  if (inGamut(l, c, h)) return c;
  let lo = 0, hi = c;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; inGamut(l, mid, h) ? lo = mid : hi = mid; }
  return lo;
};
const toHex = (l, c, h) => '#' + oklchToLinear(l, clampChroma(l, c, h), h)
  .map(v => { const s = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
              return Math.round(Math.min(1, Math.max(0, s)) * 255).toString(16).padStart(2, '0'); })
  .join('').toUpperCase();

const lin = c => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const lum = hex => { const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255); };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
                                 return (x + 0.05) / (y + 0.05); };

export const ramp = (hue, peakChroma) => STEPS.map((step, i) => ({
  step, hex: toHex(L[i], peakChroma * C[i], hue),
  css: `oklch(${L[i]} ${clampChroma(L[i], peakChroma * C[i], hue).toFixed(3)} ${hue})`,
}));
```

**Finding the hue and peak chroma for an existing brand hex.** Convert the brand colour to OKLCH (DevTools'
colour picker will show it, or use `culori` / `colorjs.io`), take its `h`, and set peak chroma to the largest
in-gamut chroma near lightness 0.58 — roughly 0.24 for blues and violets, 0.22 for reds and magentas, 0.17 for
greens and yellows. Then check where the brand hex itself lands on the generated ramp; usually it is a 500 or
600, which tells you immediately that it is not your text colour.

## The step → role contract

Fix this once and compliance becomes a naming question. Steps refer to the ladder above.

| Step | Light theme role | Dark theme role |
|---|---|---|
| 50 | page wash, subtle zebra striping | — |
| 100 | hover fill on a wash, selected row | — |
| 200 | decorative border, chip background | — |
| 300 | disabled fill, divider on a wash | **high-emphasis coloured text** (≈10:1) |
| 400 | large decorative marks | **body text, links, meaningful icons** (7.2–8.2:1) |
| 500 | UI boundaries pass only for some hues — measure | large text, secondary coloured text (5.2–6.2:1) |
| 600 | **large text, solid fills, input borders, focus rings** (4.0–4.8:1) | solid fills, hover states |
| 700 | **body text, links, meaningful icons** (5.5–6.6:1) | pressed states |
| 800 | pressed states, high-emphasis text | wash border |
| 900 | rare — maximum-emphasis text | wash background |
| 950 | — | deep wash, sunken surfaces |

Two exceptions the table cannot smooth over, both from WCAG's luminance weighting rather than from the ramp:

- **Green and amber at step 600 do not reach 4.5:1** (green 4.00, amber 4.37). They need 700 for body text.
- **A solid fill carrying a white label** needs lightness ≈0.545 for green and ≈0.56 for blue/amber, rather
  than the 0.58 that works for red. Amber cannot carry a white label at all at a usable saturation — invert to
  dark ink on a bright fill.

## Full ramps

Neutral, at peak chroma 0.03 (hue 264, cool). Swap the hue for a warm (70), green (150) or plum (320) tint;
keep the chroma. For pure grey use chroma 0.

| Step | OKLCH | Hex | on #FFF | on #15171C |
|---|---|---|---|---|
| 50 | `oklch(0.970 0.002 264)` | `#F4F5F6` | 1.09 | 16.43 |
| 100 | `oklch(0.940 0.003 264)` | `#EAEBED` | 1.19 | 15.03 |
| 200 | `oklch(0.890 0.007 264)` | `#D8DBDF` | 1.39 | 12.91 |
| 300 | `oklch(0.820 0.013 264)` | `#C0C4CD` | 1.75 | 10.26 |
| 400 | `oklch(0.735 0.020 264)` | `#A3A9B6` | 2.36 | 7.61 |
| 500 | `oklch(0.655 0.027 264)` | `#8891A2` | 3.17 | 5.65 |
| 600 | `oklch(0.580 0.030 264)` | `#717B8D` | 4.27 | 4.20 |
| 700 | `oklch(0.505 0.028 264)` | `#5D6575` | 5.86 | 3.06 |
| 800 | `oklch(0.435 0.024 264)` | `#4A515F` | 7.97 | 2.25 |
| 900 | `oklch(0.375 0.019 264)` | `#3C414B` | 10.24 | 1.75 |
| 950 | `oklch(0.265 0.012 264)` | `#22252B` | 15.36 | 1.17 |

Brand / info (hue 264, peak chroma 0.24):

| Step | OKLCH | Hex | on #FFF | on #15171C |
|---|---|---|---|---|
| 50 | `oklch(0.970 0.012 264)` | `#F1F5FE` | 1.09 | 16.42 |
| 100 | `oklch(0.940 0.026 264)` | `#E2EBFD` | 1.20 | 14.97 |
| 200 | `oklch(0.890 0.053 264)` | `#C9DBFF` | 1.39 | 12.86 |
| 300 | `oklch(0.820 0.090 264)` | `#A7C4FF` | 1.75 | 10.23 |
| 400 | `oklch(0.735 0.136 264)` | `#7DA7FF` | 2.37 | 7.55 |
| 500 | `oklch(0.655 0.183 264)` | `#558AFF` | 3.25 | 5.52 |
| 600 | `oklch(0.580 0.229 264)` | `#2F6BFF` | 4.50 | 3.99 |
| 700 | `oklch(0.505 0.228 264)` | `#1B52E4` | 6.22 | 2.88 |
| 800 | `oklch(0.435 0.192 264)` | `#1642B8` | 8.38 | 2.14 |
| 900 | `oklch(0.375 0.149 264)` | `#15388E` | 10.56 | 1.70 |
| 950 | `oklch(0.265 0.096 264)` | `#0C2153` | 15.46 | 1.16 |

Accent (hue 320, peak chroma 0.22) — an optional second hue to stop a one-colour design going monotonous.
Reserve it for a genuinely different role (illustration, a secondary CTA, a data highlight), never as a second
"primary", or you lose the reserved-colour signal entirely.

| Step | OKLCH | Hex | on #FFF | on #15171C |
|---|---|---|---|---|
| 50 | `oklch(0.970 0.011 320)` | `#F9F3FA` | 1.09 | 16.42 |
| 100 | `oklch(0.940 0.024 320)` | `#F3E6F5` | 1.20 | 14.90 |
| 200 | `oklch(0.890 0.048 320)` | `#E9D1EF` | 1.42 | 12.66 |
| 300 | `oklch(0.820 0.092 320)` | `#DFB1EA` | 1.81 | 9.92 |
| 400 | `oklch(0.735 0.150 320)` | `#D288E3` | 2.51 | 7.15 |
| 500 | `oklch(0.655 0.198 320)` | `#C460DA` | 3.48 | 5.15 |
| 600 | `oklch(0.580 0.220 320)` | `#B03DC9` | 4.82 | 3.72 |
| 700 | `oklch(0.505 0.209 320)` | `#9527AC` | 6.64 | 2.70 |
| 800 | `oklch(0.435 0.176 320)` | `#79218B` | 8.74 | 2.05 |
| 900 | `oklch(0.375 0.136 320)` | `#5F206C` | 11.00 | 1.63 |
| 950 | `oklch(0.265 0.088 320)` | `#37133F` | 15.82 | 1.13 |

Danger (hue 27, peak chroma 0.22):

| Step | OKLCH | Hex | on #FFF | on #15171C |
|---|---|---|---|---|
| 50 | `oklch(0.970 0.011 27)` | `#FDF2F1` | 1.10 | 16.35 |
| 100 | `oklch(0.940 0.024 27)` | `#FBE6E3` | 1.20 | 14.97 |
| 200 | `oklch(0.890 0.048 27)` | `#F9CFCA` | 1.42 | 12.64 |
| 300 | `oklch(0.820 0.092 27)` | `#FAADA4` | 1.81 | 9.89 |
| 400 | `oklch(0.735 0.150 27)` | `#F98075` | 2.51 | 7.15 |
| 500 | `oklch(0.655 0.198 27)` | `#F25149` | 3.47 | 5.16 |
| 600 | `oklch(0.580 0.220 27)` | `#DF2225` | 4.78 | 3.75 |
| 700 | `oklch(0.505 0.206 27)` | `#BE0013` | 6.56 | 2.73 |
| 800 | `oklch(0.435 0.176 27)` | `#9B020E` | 8.72 | 2.06 |
| 900 | `oklch(0.375 0.136 27)` | `#791413` | 10.92 | 1.64 |
| 950 | `oklch(0.265 0.088 27)` | `#470D0B` | 15.79 | 1.14 |

Warning (hue 75, peak chroma 0.17) — note how hard the sRGB gamut clamps this hue: requested chroma at 600 is
0.170 and only 0.122 is available, which is exactly why amber ramps go muddy in the middle.

| Step | OKLCH | Hex | on #FFF | on #15171C |
|---|---|---|---|---|
| 50 | `oklch(0.970 0.009 75)` | `#F9F4EF` | 1.09 | 16.41 |
| 100 | `oklch(0.940 0.019 75)` | `#F3EADE` | 1.19 | 15.06 |
| 200 | `oklch(0.890 0.037 75)` | `#EAD8C0` | 1.39 | 12.88 |
| 300 | `oklch(0.820 0.071 75)` | `#E0BE91` | 1.76 | 10.20 |
| 400 | `oklch(0.735 0.116 75)` | `#D49E4E` | 2.39 | 7.51 |
| 500 | `oklch(0.655 0.138 75)` | `#C18200` | 3.25 | 5.52 |
| 600 | `oklch(0.580 0.122 75)` | `#A46E00` | 4.37 | 4.11 |
| 700 | `oklch(0.505 0.107 75)` | `#885A00` | 5.98 | 3.00 |
| 800 | `oklch(0.435 0.092 75)` | `#6E4800` | 8.11 | 2.21 |
| 900 | `oklch(0.375 0.079 75)` | `#593A00` | 10.34 | 1.73 |
| 950 | `oklch(0.265 0.056 75)` | `#352000` | 15.46 | 1.16 |

Success (hue 150, peak chroma 0.17):

| Step | OKLCH | Hex | on #FFF | on #15171C |
|---|---|---|---|---|
| 50 | `oklch(0.970 0.009 150)` | `#F1F7F2` | 1.09 | 16.50 |
| 100 | `oklch(0.940 0.019 150)` | `#E3EFE5` | 1.18 | 15.15 |
| 200 | `oklch(0.890 0.037 150)` | `#CAE2CE` | 1.37 | 13.05 |
| 300 | `oklch(0.820 0.071 150)` | `#A4D2AC` | 1.69 | 10.58 |
| 400 | `oklch(0.735 0.116 150)` | `#70BE82` | 2.24 | 8.01 |
| 500 | `oklch(0.655 0.153 150)` | `#39AA5C` | 2.97 | 6.04 |
| 600 | `oklch(0.580 0.160 150)` | `#009342` | **4.00** | 4.48 |
| 700 | `oklch(0.505 0.139 150)` | `#007A36` | 5.47 | 3.28 |
| 800 | `oklch(0.435 0.120 150)` | `#00622A` | 7.55 | 2.37 |
| 900 | `oklch(0.375 0.103 150)` | `#004F21` | 9.81 | 1.83 |
| 950 | `oklch(0.265 0.068 150)` | `#042E12` | 14.95 | 1.20 |

## Tailwind v4, CSS-first

`@theme` generates utilities from the token names, so `bg-surface-raised`, `text-muted`, `border-strong` and
`ring-focus` all exist without a config file. Keep the primitives out of `@theme` if you want them
unavailable as utilities — that is a cheap way to enforce "components use roles only".

```css
@import "tailwindcss";

@theme {
  /* semantic layer — the only names components may use */
  --color-surface-sunken:  light-dark(oklch(0.975 0.003 264), oklch(0.165 0.008 264));
  --color-surface:         light-dark(oklch(1     0     0  ), oklch(0.205 0.010 264));
  --color-surface-raised:  light-dark(oklch(1     0     0  ), oklch(0.245 0.011 264));
  --color-surface-overlay: light-dark(oklch(1     0     0  ), oklch(0.285 0.012 264));

  --color-primary:   light-dark(oklch(0.24 0.015 264), oklch(0.955 0.004 264));
  --color-secondary: light-dark(oklch(0.44 0.015 264), oklch(0.835 0.004 264));
  --color-muted:     light-dark(oklch(0.55 0.015 264), oklch(0.715 0.004 264));

  --color-border-subtle: light-dark(oklch(0.925 0.012 264), oklch(0.300 0.012 264));
  --color-border:        light-dark(oklch(0.870 0.012 264), oklch(0.375 0.012 264));
  --color-border-strong: light-dark(oklch(0.660 0.012 264), oklch(0.580 0.012 264));

  --color-action:      light-dark(oklch(0.505 0.228 264), oklch(0.72 0.145 264));
  --color-on-action:   light-dark(oklch(0.99  0     0  ), oklch(0.17 0.010 264));
  --color-action-text: light-dark(oklch(0.505 0.228 264), oklch(0.78 0.120 264));
  --color-focus:       light-dark(oklch(0.580 0.200 264), oklch(0.78 0.140 264));
  /* …status quads as in SKILL.md move 7 */
}

@layer base {
  :root                     { color-scheme: light dark; }
  :root[data-theme="light"] { color-scheme: light; }
  :root[data-theme="dark"]  { color-scheme: dark; }
  body { background: var(--color-surface); color: var(--color-primary); }
  :focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
}
```

Usage stays theme-agnostic — `class="bg-surface-raised text-primary border border-subtle"` is correct in both
themes with no `dark:` variants anywhere. **A component file containing `dark:` colour variants is a component
that opted out of the token system**; the only legitimate `dark:` usages are non-colour ones (a different
image asset, a shadow that must differ structurally).

## Migrating a codebase full of hardcoded hexes

Do not attempt a big-bang palette swap; it produces a PR nobody can review.

1. **Inventory.** `rg -o '#[0-9a-fA-F]{3,8}\b' src | sort | uniq -c | sort -rn`. Expect 40–200 distinct values
   where you thought there were 12. Cluster them by OKLCH lightness — near-duplicates within ~0.03 lightness
   are the same intended colour typed three ways.
2. **Map, don't match.** For each cluster, decide the *role* it was serving, then point it at a semantic token.
   Resist preserving exact hexes; the whole point is to collapse the near-duplicates.
3. **Introduce the token layer alongside the old values,** with the semantic tokens defined for the light
   theme only. Nothing changes visually. Land it.
4. **Codemod the leaves first** — buttons, badges, inputs — where the mapping is unambiguous. One component
   family per PR.
5. **Add the lint rule as soon as the leaves are clean**, so new violations cannot land while you work through
   the rest:

   ```jsonc
   // .eslintrc — or a rg-based CI grep, which works everywhere
   // Ban raw colours and primitive ramp names in component files.
   //   rg -n '#[0-9a-fA-F]{6}|--(brand|neutral|blue|grey|gray)-[0-9]{2,3}' src/components && exit 1
   ```
   Stylelint's `declaration-property-value-allowed-list` can restrict `color`, `background-color`,
   `border-color` and `fill` to `var(--color-*)` and the keywords, which is the tighter version.
6. **Only then add the dark values.** Doing it in this order means dark mode is a one-file change; doing it
   first means auditing every component twice.
7. **Delete the old variables** and fail CI on their reappearance.

## The contrast unit test

The single highest-value test in a design system: it makes a palette edit that breaks a theme fail in CI
rather than in an accessibility audit six months later.

```js
import { ratio } from './ramp.mjs';
import { test, expect } from 'vitest';

// Resolved hexes per theme — export these from the same source that generates the CSS.
const THEMES = {
  light: { surfaces: { base: '#FFFFFF', sunken: '#F6F7F9' },
           text: { primary: '#1C1F27', secondary: '#4E535B', muted: '#6D727B' },
           bounds: { borderStrong: '#8E929A', focus: '#3A70EE' } },
  dark:  { surfaces: { base: '#15171C', raised: '#1E2025', overlay: '#282A2F' },
           text: { primary: '#EFF0F3', secondary: '#C7C9CB', muted: '#A2A3A6' },
           bounds: { borderStrong: '#777A82', focus: '#93B7FF' } },
};

for (const [theme, t] of Object.entries(THEMES)) {
  // Every text token against every surface it can land on — 1.4.3.
  for (const [sName, s] of Object.entries(t.surfaces))
    for (const [tName, c] of Object.entries(t.text))
      test(`${theme}: text-${tName} on surface-${sName} ≥ 4.5:1`, () => {
        expect(ratio(c, s)).toBeGreaterThanOrEqual(4.5);
      });

  // Boundaries and focus rings — 1.4.11. The overlay surface is the one that fails.
  for (const [sName, s] of Object.entries(t.surfaces))
    for (const [bName, c] of Object.entries(t.bounds))
      test(`${theme}: ${bName} on surface-${sName} ≥ 3:1`, () => {
        expect(ratio(c, s)).toBeGreaterThanOrEqual(3);
      });
}
```

Deliberately excluded from the loop: `text-disabled` (exempt from 1.4.3 and 1.4.11) and the decorative border
tokens (`border-subtle`, `border`), which are not required to identify any component. Excluding them is a
decision to document in the test file, not a hole to leave silent — if `border-subtle` ever becomes the only
thing marking an input, the exclusion becomes a bug.

Pair this with `axe-core` in an end-to-end run against rendered pages in both themes. Automated tooling
catches roughly a third of real accessibility issues; the token test catches palette regressions, axe catches
composition mistakes, and neither replaces looking at the screen.
