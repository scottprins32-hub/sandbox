# Typographic details, internationalisation, and optical corrections

The small stuff behind move 10 in SKILL.md. Individually cheap, cumulatively the difference between a UI
that looks made and one that looks emitted. Almost all of it is *taste* rather than law, with the WCAG items
flagged.

---

## Punctuation

Use the real characters. Straight quotes are a typewriter artefact that survived into computing because ASCII
had no room for the correct ones.

| Wrong | Right | Character | Use |
|---|---|---|---|
| `"quote"` | `“quote”` | U+201C / U+201D | Quotation |
| `'quote'` | `‘quote’` | U+2018 / U+2019 | Nested quotation |
| `don't` | `don’t` | U+2019 | Apostrophe — same glyph as the closing single quote |
| `1990-1995` | `1990–1995` | U+2013 en dash | Ranges, and compound adjectives |
| `wait - actually` | `wait — actually` | U+2014 em dash | Parenthetical break |
| `1920x1080` | `1920×1080` | U+00D7 | Dimensions, multiplication |
| `...` | `…` | U+2026 | Ellipsis (one character, kerns correctly) |
| `-5` | `−5` | U+2212 minus | Negative numbers in data displays |
| `(c)` `(tm)` | `©` `™` | U+00A9 / U+2122 | |

**Never in code blocks, inputs, or anything the user will copy and paste.** A curly quote inside a shell
command or a JSON snippet is a bug, and "smart quotes" in a code editor is a support ticket. Scope any
typographic substitution to prose containers only.

**Non-breaking characters where a line break would be wrong**: `10&nbsp;GB`, `Figure&nbsp;3`,
`€&nbsp;49`, `Dr.&nbsp;Chen`. A number separated from its unit across a line break reads as two facts.

Quote marks are language-specific: German uses „low-high“, French uses « guillemets » with spaces, Japanese
uses 「corner brackets」. Setting `lang` on `<html>` (or on the element, for mixed-language pages) is what
lets the browser, the OS and screen readers get this right.

---

## Optical alignment

CSS aligns boxes; the eye aligns shapes. Where the two disagree, trust the eye — this is the one legitimate
category of exception to a spacing or type scale.

- **Hanging punctuation.** A pull quote or a list item beginning with `“` looks indented because the quote
  mark is mostly white space. `hanging-punctuation: first last;` where supported; otherwise a negative
  `text-indent` of roughly `-0.4em` on the first line.
- **Optical centring in a button.** A CSS line box includes ascender and descender space, so text centred by
  `line-height` sits a pixel or two low. `text-box: trim-both cap alphabetic` fixes it at the source
  (Chromium and Safari; not yet Baseline — progressive enhancement). Without it, 1px of `padding-bottom`
  reduction on the label is a legitimate correction.
- **Icon next to text.** Align to the cap height or the x-height of the adjacent text, not to the line box.
  A 16px icon next to 16px text usually needs to sit about 1px above the box centre because the box includes
  descender space the icon does not use.
- **Numerals in a heading next to letters.** Lining figures sit at cap height and can look large beside
  lowercase; that is correct and should not be "fixed".

---

## Wrapping, breaking, and overflow

```css
/* Prose: prevent orphans and short last lines. Progressive enhancement. */
p { text-wrap: pretty; }

/* Short blocks: even out the lines. Capped at ~6 lines in Chromium, ~10 in Firefox,
   so it silently no-ops on a paragraph — that is by design, use `pretty` there. */
h1, h2, h3, h4, figcaption, blockquote, .card-title { text-wrap: balance; }

/* Unbreakable strings: URLs, emails, IDs, hashes, German compounds. */
.breakable { overflow-wrap: break-word; hyphens: auto; }

/* Never break these mid-token — the user has to read them exactly, so let them overflow. */
.code-inline, .token, .serial { overflow-wrap: normal; word-break: keep-all; }

/* Want the token to scroll inside its column instead? It has to stop being an inline box first. */
.token--scroll { display: inline-block; max-inline-size: 100%; overflow-x: auto; vertical-align: text-bottom; }
```

`overflow` does not apply to non-replaced inline boxes, so `overflow-x: auto` on an inline `<code>` or
`<span>` is inert — the string overflows regardless, which is what the `keep-all` rule wants anyway.
`.token--scroll` works only because `inline-block` makes it a block container. The `vertical-align` there is
not decoration: an inline-block whose `overflow` is not `visible` takes its bottom margin edge as its baseline
instead of its last line box, so without it the token sits visibly high in the surrounding text.

`hyphens: auto` requires `lang` to be set correctly on the element or an ancestor — without it the browser
has no dictionary and does nothing. It matters most in narrow columns and in languages with long compounds.

**Never justify text on the web** (`text-align: justify`). Browser line-breaking has neither the hyphenation
quality nor the paragraph-level optimisation that makes justification work in print, so you get rivers of
white space. WCAG 2.2 SC **1.4.8** (AAA) asks explicitly that text not be justified.

**`text-overflow: ellipsis` needs three declarations, not one**, and it only works on a single line:

```css
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
```

`min-width: 0` is the one everybody forgets — a flex or grid child defaults to `min-width: auto`, refuses to
shrink below its content, and pushes the layout wide instead of truncating. For multi-line clamping use
`-webkit-line-clamp` with `display: -webkit-box`, and always expose the full text somewhere (a `title`
attribute is a weak answer on touch; a details view or tooltip is better). Truncating text a user needs is a
content problem being solved with CSS.

---

## OpenType features worth knowing

```css
/* Inputs and anything transcribed character-by-character. */
input, .serial, .otp { font-variant-ligatures: none; font-variant-numeric: slashed-zero; }

/* Real small caps if the font has them; otherwise render normal rather than fake. */
.smallcaps { font-variant-caps: small-caps; font-synthesis-small-caps: none; letter-spacing: 0.06em; }

/* Stylistic sets — face-specific. Inter's ss01 gives a single-storey `a`; check before using. */
.brand { font-feature-settings: "ss01" 1; }
```

- **Do not fake small caps.** Without a real small-cap set, browsers scale capitals down, producing letters
  whose strokes are too light for the surrounding text. `font-synthesis-small-caps: none` makes the absence
  visible instead of subtly wrong.
- **Fake bold and fake italic** have the same problem, at greater cost. `font-synthesis: none` in development
  turns any weight or style you did not load into plain regular, which is obvious in review.
- **Ligatures** (`liga`, `calt`) should stay on for prose and off for anything transcribed. Programming
  ligatures (`=>` becoming an arrow) are a personal preference in an editor and a mistake in a UI that shows
  code to someone else.
- Prefer the high-level `font-variant-*` properties over `font-feature-settings`. The low-level property is
  not additive: a second `font-feature-settings` declaration resets every feature the first one set.

---

## Internationalisation

- **String length.** German runs 10–35% longer than English and its compounds do not break; Finnish and
  Russian are similar; CJK is much shorter. Design every label, button and tab so it can grow 40% without
  the layout failing, and never size a control to fit its English string exactly.
- **Measure for CJK** is roughly **40 characters**, not 75 — WCAG 1.4.8 states this explicitly. CJK also
  wants looser leading (1.7–1.8) because the glyphs fill the em box.
- **Logical properties.** Use `margin-inline`, `padding-inline`, `text-align: start` / `end`, and
  `border-inline-start` so Arabic and Hebrew work without a second stylesheet. `text-align: left` on a label
  is a bug waiting for a locale.
- **Fallback fonts per script.** Your Latin webfont has no Arabic, Thai or CJK glyphs. Either declare
  script-specific `@font-face` rules with `unicode-range`, or let the system font handle those ranges — but
  check what it actually renders, because a missing glyph shows as a tofu box.
- **`font-size` for CJK often needs to be a step larger** than the Latin equivalent to be equally legible;
  the glyphs are more complex at the same em size.
- **Never concatenate translated strings.** Word order differs. Use whole-sentence templates with
  placeholders.

---

## Dark mode

Type is not theme-neutral. Light glyphs on a dark background bloom — the bright area spreads perceptually
into the dark one — so identical type looks heavier in dark mode.

- A 400 weight that reads correctly on white can look slightly bold on black. If the face is variable, 350
  on dark surfaces is a legitimate correction. This is *taste*, and it is the one weight adjustment worth
  making per theme.
- **Avoid pure white text on pure black.** Maximum contrast maximises the blooming and causes halation for
  readers with astigmatism. `oklch(0.95 0 0)` on `oklch(0.18 0.01 250)` is more comfortable than `#fff` on
  `#000` and still clears 4.5:1 comfortably. `color-and-theming` owns the ramp; this is the typographic
  reason it should not end at the extremes.
- Check tracking in both themes. Tight tracking that looks crisp on white can look congested on dark,
  because the blooming closes the counters.

---

## Text over images and video

`depth-and-overlays` owns the technique. The typographic constraints:

- Contrast must be met against the **worst** pixel behind any glyph, not the average. A scrim, a gradient,
  or a solid panel is the only reliable answer; `text-shadow` is a decoration, not a contrast mechanism.
- Never rely on the image. Images fail to load, get replaced by a CMS editor, and change on resize.
- If the text must sit directly on imagery, increase weight by one step and size by one step before
  increasing contrast — heavier, larger type at 4.5:1 is far more readable than thin type at 7:1.

---

## Email

Different rules, because email clients are not browsers.

- Webfonts are unreliable — Gmail, Outlook desktop and several others strip or ignore `@font-face`. Design
  for the fallback and treat the webfont as a bonus.
- Outlook's Word rendering engine ignores much of modern CSS. Keep to `font-family`, `font-size` in `px`,
  `line-height` in `px` (the one place unitless fails), `color`, and table layout.
- Minimum 14px body, 16px preferred; many email readers are older and reading on a phone.
- The dark-mode inversion in some clients rewrites your colours. Test, and avoid relying on a specific
  background behind text.
