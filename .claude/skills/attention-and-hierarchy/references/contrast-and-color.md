# Contrast and colour as hierarchy

Read this when building or auditing a palette, adding a dark theme, choosing chart colours, fixing focus
indicators, or preparing for an accessibility review. The framing throughout: contrast is the only part of
visual hierarchy you can compute, so it is the part you can put in CI and stop arguing about.

## What the standard actually requires

WCAG 2.1 / 2.2, Level AA — this is what regulators, procurement and the EU Accessibility Act enforce. AAA is
a target for specific content, not a general goal (see "Do not chase AAA" below).

| Success criterion | Requirement |
|---|---|
| **1.4.3 Contrast (Minimum)** | 4.5:1 for text; 3:1 for *large* text — ≥18pt (24px), or ≥14pt (18.66px) if bold |
| **1.4.11 Non-text Contrast** | 3:1 for UI component boundaries and states, icons conveying meaning, and graphical objects required to understand content (chart marks, sparkline strokes) |
| **1.4.1 Use of Color** | Colour is never the sole means of conveying information, indicating an action, prompting a response, or distinguishing an element |
| **1.4.6 Contrast (Enhanced), AAA** | 7:1 text / 4.5:1 large text |
| **1.4.12 Text Spacing** | Content must survive user-imposed line-height 1.5, paragraph spacing 2×, letter-spacing 0.12em, word-spacing 0.16em |
| **2.4.7 Focus Visible** | Keyboard focus indicator is visible |
| **2.4.11 Focus Not Obscured (2.2, AA)** | The focused element is not entirely hidden by sticky headers/footers |
| **2.4.13 Focus Appearance (2.2, AAA)** | Indicator ≥2px thick perimeter, ≥3:1 against adjacent colours |

Two exemptions people misread:

- **Disabled controls are exempt from 1.4.3 and 1.4.11.** This is a licence to make disabled states *look*
  disabled, not a licence to ship unreadable ones. Prefer not disabling at all — an enabled control that
  explains why it can't proceed beats a grey ghost the user cannot diagnose.
- **1.4.11 applies to boundaries *required to identify* the component**, not to every line you draw. An input
  field whose border is the only thing marking it as an input needs 3:1. A hairline divider inside a card that
  is already identifiable is decorative and exempt. This is why `#E5E7EB` on white (1.24:1) is fine as a
  divider and a failure as an input outline.

## Build a text ramp that is both compliant and hierarchical

Define exactly three text levels. The constraint that makes it work: **the quietest level still passes 4.5:1**.
If you need a fourth level of quiet, the screen has too much on it — delete or defer instead.

Light theme on `#FFFFFF`:

```
--text-primary:   #111827   17.7:1   headings, values, anything read carefully
--text-secondary: #4B5563    7.6:1   body copy, descriptions
--text-muted:     #6B7280    4.8:1   labels, timestamps, help text — the floor
```

`#9CA3AF` on white is **2.5:1** and fails. It is the most-shipped contrast failure in modern UI, because it
looks correct to a designer on a calibrated display in a dark room and disappears on a laptop in a café.

Dark theme on `#0B0F19`:

```
--text-primary:   #F9FAFB   18.3:1
--text-secondary: #D1D5DB   13.0:1
--text-muted:     #9CA3AF    7.5:1
```

Note what happened: `#9CA3AF` fails in light mode (2.5:1) and passes comfortably in dark (7.5:1), while
`#4B5563` passes in light (7.6:1) and fails in dark (2.5:1). **A dark theme is a second design, not a token
inversion.** Check both.

Two dark-mode craft notes that are not in the spec but matter:

- Avoid pure `#FFFFFF` on pure `#000000`. Maximum contrast on large text areas produces halation for many
  readers, especially with astigmatism. Near-black surface, near-white text.
- Saturated colours that worked on white look neon on near-black. Desaturate and lighten: `#2563EB` reads well
  on white (5.2:1) but wants `#60A5FA` (7.5:1 on `#0B0F19`) in dark.

## Do not chase AAA everywhere

If every text level is at maximum contrast, contrast has stopped carrying hierarchy — you have flattened your
own ladder. Meet AA as the floor, then spend the remaining headroom deliberately: primary text much darker than
secondary, secondary clearly darker than muted, and the gaps large enough to be seen without measuring.

Where AAA genuinely earns its place: long-form reading, medical and financial figures, anything read under bad
conditions, anything an older audience uses. Apply it to those surfaces, not as a global rule.

## Never let colour carry meaning alone

Roughly 8% of men and 0.5% of women of Northern European descent have a red-green colour vision deficiency
(lower in Asian and African populations). But the deeper reason is broader than CVD: colour also fails in
greyscale printing, in bright sunlight, on cheap projectors, in high-contrast OS modes, and for anyone who has
not learned your colour convention.

The rule is **redundant encoding**: colour plus at least one of shape, icon, position, pattern, or text.

```jsx
// Bad — hue is the entire signal
<span className="text-red-600">{delta}%</span>

// Good — hue, glyph, sign, and an accessible text label
<span className="text-red-700">
  <ArrowDownIcon aria-hidden />
  <span>−{Math.abs(delta)}%</span>
  <span className="sr-only">decrease versus last week</span>
</span>
```

Specific places colour-only encoding hides:

- **Form validation.** A red border with no message and no icon. Error text next to the field is the fix; the
  colour is the accent, not the message.
- **Required fields.** A red asterisk is fine only if the legend is present and the field also carries
  `required` / `aria-required`.
- **Links in body text.** A blue word among black words is colour-only. Underline it, or ensure ≥3:1 against
  the surrounding text *and* add a non-colour cue on hover and focus (WCAG technique G183).
- **Charts.** Multi-series line charts distinguished only by hue. Use direct labels at the line ends, distinct
  markers, or dash patterns. For categorical series, vary lightness as well as hue so the set survives
  greyscale.
- **Diffs and status tables.** Add `+`/`−`, or an icon column, or a text status word.
- **Maps and heatmaps.** Use a sequential ramp that is monotonic in lightness, so it survives greyscale and
  most CVD types. Viridis and Cividis are built for this; red-to-green ramps are the classic failure.

## Focus indicators

Keyboard focus is a hierarchy problem as much as a compliance one — it is the "you are here" of non-mouse
navigation, and `outline: none` with no replacement is the single most damaging line of CSS in frontend.

```css
/* Visible on any background, and only for keyboard interaction */
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: inherit;
}
```

- The ring needs ≥3:1 against the adjacent background (1.4.11). A single ring colour rarely achieves this on
  both light and dark surfaces — either define a per-theme token, or use a two-tone ring (a dark outline with a
  light `box-shadow` halo, or vice versa) so one of the two always contrasts.
- Use `:focus-visible`, not `:focus`, so mouse users don't see rings on click while keyboard users keep them.
- `outline-offset` matters: an outline flush against a filled button is much harder to see than one with 2px of
  breathing room.
- Check that sticky headers and footers do not cover the focused element when tabbing (2.4.11).

## Colour tokens that stay honest

Structure the palette so that misuse is visible in code review:

- **Separate role tokens from palette tokens.** `--color-blue-600` is a palette value; `--color-action` is a
  role. Components reference roles only. This is what lets you reserve the brand colour for interactive
  elements — the rule from move 1 in SKILL.md — and detect violations by grepping for palette tokens in
  component files.
- **Status colours come in pairs**: a text/icon value that passes 4.5:1 on the surface, and a background wash
  that the text passes against. `#16A34A` is 3.3:1 on white — usable as a 3:1 graphical mark or large text,
  not as body text. Success *text* needs a darker green.
- **Amber is a trap.** `#F59E0B` is 2.15:1 on white. Warning text in amber almost always fails; use a dark
  amber for the text and reserve the bright value for the icon or the fill.
- **Document the reserved colour.** One colour means "act here". If it also means "brand" and "chart series 1"
  and "selected row", it means nothing.

## Checking it automatically

- **In the browser:** Chrome DevTools shows the contrast ratio in the colour picker and flags AA/AAA; the
  Rendering panel emulates protanopia, deuteranopia, tritanopia and achromatopsia. Firefox's Accessibility
  inspector has a "check for issues → contrast" sweep across a whole page.
- **In CI:** `axe-core` (via `@axe-core/playwright`, `jest-axe`, or `cypress-axe`) catches contrast, missing
  labels, and colour-only errors on rendered pages. Pa11y and Lighthouse's accessibility audit are workable
  alternatives. Automated tools catch roughly a third of real accessibility issues — they are a floor and a
  regression guard, not an audit.
- **On the palette itself:** compute ratios for every text-token × surface-token pair as a unit test, so a
  palette change cannot silently break a theme. The relative-luminance formula is short enough to inline:

  ```js
  const lin = c => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  ```
- **By hand:** the one check worth doing manually every time is the *lightest text on the lightest surface* in
  each theme. That pair is where the failure lives.

## The APCA caveat

The WCAG 2.x ratio is a simple luminance formula and is known to misjudge some real-world legibility —
particularly light-on-dark pairs and very thin or very large type. APCA (Accessible Perceptual Contrast
Algorithm) models this better and is a candidate method being developed for WCAG 3.

The practical position: **WCAG 2.x is what is legally enforced and what auditors test against, so meet it.**
Use APCA, if you use it, as a supplementary signal that catches things 2.x misses — not as a justification for
shipping something that fails 2.x. And in either case, look at the screen in dark mode with your own eyes; both
formulas are proxies for a judgement neither of them fully captures.
