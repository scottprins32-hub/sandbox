# Contrast and colour as hierarchy

Contrast is the only part of visual hierarchy you can compute, which makes it the part you can put in CI and
stop arguing about. This file is the argument: why a luminance difference is read before anything else on a
screen, what the standard actually requires, and how to spend the headroom above the floor as *rank* rather
than as compliance.

It deliberately ships no palette. Ramp values, semantic tokens and both themes belong to `color-and-theming`;
focus-ring specs and the rest of the state matrix to `ui-signifiers-and-states`; chart and categorical palettes
to `dataviz`. Take the reasoning from here and the numbers from there — one set of values, in one place.

**Read this when** you are ranking things by contrast, arguing about whether a grey is legible, preparing for
an accessibility review, or deciding what a colour is allowed to mean.

## Why contrast steers the eye at all

The visual system does not measure absolute lightness; it measures differences. Early visual processing is
built on centre–surround comparison, so what reaches attention is edges and ratios rather than values. This is
why the same grey reads as light on a dark card and dark on a white one, and why a contrast ratio is
meaningless until you name the surface behind it.

Two consequences run through everything below.

- **Luminance difference is preattentive** — intensity is one of the features resolved in parallel across the
  whole field (move 1 in SKILL.md). A block of text one clear step darker than its neighbours is ranked before
  a single word is decoded. It is the fastest hierarchy channel you have, and it costs no space and no extra
  mark on the screen.
- **It is therefore zero-sum, like every salience channel.** Rank is carried by the *gaps* between your levels,
  not by how dark the darkest one is. Push every level towards maximum and you have spent the channel and
  ranked nothing.

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
  is already identifiable is decorative and exempt. This is why a 1.2:1 hairline is fine as a divider and a
  failure as an input outline.

## Three text levels, and the quietest one still passes

Define exactly three levels of text — primary, secondary, muted — and hold one constraint: **the quietest
level still clears 4.5:1 on every surface it can land on.** Three is not arbitrary. It is about as many steps
as a reader ranks reliably from lightness alone without measuring, and a fourth level always ends up below the
floor. If you need a fourth degree of quiet, the screen has too much on it — delete or defer instead.

Two rules make the ladder real rather than nominal:

- **Check each text level against every surface it appears on**, not just the page background. Muted text
  measured only against white is the classic false pass: the same value on a tinted card, a well or a hover
  row drops below 4.5:1 while the audit still reports green.
- **Make the steps unmistakable.** If primary and secondary differ by half a step, you have three tokens and
  one rank. Auditors read ratios; users read gaps.

The measured values for all three levels, in both themes, with the surfaces each is guaranteed against:
`color-and-theming` and `color-and-theming/references/palette-tokens.md`.

## Do not chase AAA everywhere

If every text level is at maximum contrast, contrast has stopped carrying hierarchy — you have flattened your
own ladder. Meet AA as the floor, then spend the remaining headroom deliberately: primary text much darker than
secondary, secondary clearly darker than muted, and the gaps large enough to be seen without measuring.

Where AAA genuinely earns its place: long-form reading, medical and financial figures, anything read under bad
conditions, anything an older audience uses. Apply it to those surfaces, not as a global rule.

## A dark theme re-ranks the ladder

Rank order does not survive inversion. Contrast against a near-black surface does not mirror contrast against
white, so the levels reshuffle rather than swap: a grey that fails badly as muted text in light mode can be
comfortably readable in dark, and a grey that carries secondary text in light can fail outright in dark. **A
dark theme is a second design, not a token inversion** — audit the ladder twice, as two ladders. How to
re-derive the ramp for dark instead of inverting it is `color-and-theming`'s move on dark mode.

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
- **Charts.** Multi-series lines distinguished only by hue. Use direct labels at the line ends, distinct
  markers, or dash patterns, and vary lightness as well as hue so the set survives greyscale. For sequential
  data, a ramp that is monotonic in lightness (viridis, cividis) survives greyscale and most CVD types where a
  red-to-green ramp does not. Series palettes and their construction: `dataviz`.
- **Diffs and status tables.** Add `+`/`−`, or an icon column, or a text status word.
- **Maps and heatmaps.** Same rule as charts — lightness must do the work hue is getting credit for.

## Focus is the keyboard user's hierarchy

Everything above assumes the eye chooses where to go. For a keyboard user the focus ring *is* the eye, and
`outline: none` with no replacement deletes the hierarchy entirely for that user — the single most damaging
line of CSS in frontend. Two facts that are hierarchy problems rather than styling ones: the ring must clear
3:1 against whatever sits behind it *at the moment it renders* (1.4.11), which one ring colour rarely manages
on both light and dark surfaces; and the focused element must not be covered by a sticky header or footer as
the user tabs (2.4.11). The ring CSS, the two-tone construction that survives both themes, and the other nine
states: `ui-signifiers-and-states`.

## Checking it automatically

- **In the browser:** Chrome DevTools shows the contrast ratio in the colour picker and flags AA/AAA; the
  Rendering panel emulates protanopia, deuteranopia, tritanopia and achromatopsia. Firefox's Accessibility
  inspector has a "check for issues → contrast" sweep across a whole page.
- **In CI:** `axe-core` (via `@axe-core/playwright`, `jest-axe`, or `cypress-axe`) catches contrast, missing
  labels, and colour-only errors on rendered pages. Pa11y and Lighthouse's accessibility audit are workable
  alternatives. Automated tools catch roughly a third of real accessibility issues — they are a floor and a
  regression guard, not an audit.
- **On the palette itself:** compute ratios for every text-token × surface-token pair as a unit test, so a
  palette change cannot silently break a theme. A runnable version, with the luminance formula and the fixture
  covering both themes, is in `color-and-theming/references/palette-tokens.md` under "The contrast unit test" —
  use that one rather than writing a second.
- **By hand:** the one check worth doing manually every time is the *lightest text on the lightest surface* in
  each theme. That pair is where the failure lives, and it is the pair a page-level automated sweep misses when
  the combination does not happen to render on the page it crawled.

## The APCA caveat

The WCAG 2.x ratio is a simple luminance formula and is known to misjudge some real-world legibility —
particularly light-on-dark pairs and very thin or very large type. APCA (Accessible Perceptual Contrast
Algorithm) models this better and is a candidate method for WCAG 3, not a conformance standard;
`color-and-theming` tracks its current standards status.

The practical position: **WCAG 2.x is what is legally enforced and what auditors test against, so meet it.**
Use APCA, if you use it, as a supplementary signal that catches things 2.x misses — never as a justification
for shipping something that fails 2.x. And in either case, look at the screen in dark mode with your own eyes;
both formulas are proxies for a judgement neither of them fully captures.
