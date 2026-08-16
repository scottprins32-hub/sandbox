# Webfont loading without moving the page

The full recipe behind move 9 in SKILL.md. Read this when adding a webfont, debugging a page that jumps when
text renders, or deciding whether to use a webfont at all.

The cost of a webfont is not the download. It is that **text has to render twice** — once in a fallback,
once in the real face — and unless the two have identical line-box metrics, everything below the text moves
on the second render. That shift is what users perceive as a page "jumping", and it is what
Cumulative Layout Shift measures.

---

## 0. Decide whether you need one

The system stack costs zero bytes, has no loading state, cannot shift the layout, and ships every weight plus
tabular figures on every platform:

```css
--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

`system-ui` resolves to San Francisco on Apple platforms, Segoe UI Variable on Windows, Roboto on Android,
and whatever the distribution set on Linux. The listed fallbacks after it cover the handful of Linux and
older-Android configurations where `system-ui` resolves to something with poor coverage.

The real cost of the system stack is not aesthetic timidity. It is that **the same page is a different
typeface on every platform**, with different x-heights, different advance widths and different vertical
metrics — so your measure, your button widths and your vertical rhythm all differ per OS, and a design
signed off on a Mac is not the design a Windows user sees. For an internal console that is an acceptable
trade. For a brand surface it usually is not.

Middle path that often wins: system stack for the product UI, one webfont for marketing and the logotype.

---

## 1. Self-host, WOFF2 only

Cross-site font caching has been dead since browsers partitioned their HTTP caches (Chrome 86 and
equivalents in Safari and Firefox). A font fetched from a third-party host is **not** reused across sites any
more, so what you buy from `fonts.googleapis.com` is an extra DNS lookup plus TLS handshake on the critical
path, a stylesheet request that must resolve before the font request even starts, and no control over
`font-display` beyond a query parameter.

Download the files, put them on your own origin, serve them with a long `Cache-Control: max-age=31536000,
immutable` and a hashed filename.

WOFF2 is supported by every browser in current use. Shipping WOFF, TTF or EOT fallbacks doubles or triples
the payload to serve nobody. Delete them.

---

## 2. Subset

Latin-only subsetting typically takes a face from 150–300KB to **15–25KB** per style. This is the single
largest win available and most projects skip it.

With `fonttools` (`pip install fonttools brotli`):

```bash
pyftsubset Inter-Variable.ttf \
  --output-file=inter-var-latin.woff2 \
  --flavor=woff2 \
  --layout-features="kern,liga,calt,tnum,lnum,ss01" \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,\
U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
  --desubroutinize \
  --drop-tables+=DSIG
```

Notes on the flags:

- **Keep `tnum` and `lnum`** in `--layout-features` or `font-variant-numeric: tabular-nums lining-nums`
  silently stops working — a common and infuriating self-inflicted bug.
- **Keep `kern`, `liga`, `calt`.** Dropping kerning is visible immediately in headings.
- **Drop `opsz` at your peril** — if the face has an optical-size axis, `--drop-tables` or an aggressive
  instancing step can remove it, and you lose the automatic correction described in move 3.
- The unicode range above is the standard "latin" subset. Add `U+0100-024F,U+0259,U+1E00-1EFF` for
  latin-ext if you support Polish, Czech, Turkish, Vietnamese or Romanian.

Then declare the subsets so the browser only fetches the ones a page needs. **`unicode-range` does not
subset anything** — it is a hint about which of your already-subsetted files to download:

```css
@font-face {
  font-family: "InterVariable";
  src: url("/fonts/inter-var-latin.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
                 U+2000-206F, U+2074, U+20AC, U+2122, U+2212, U+FEFF, U+FFFD;
}

@font-face {
  font-family: "InterVariable";
  src: url("/fonts/inter-var-latin-ext.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0100-02AF, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
```

---

## 3. Variable or static?

**Break-even is around three weights.** A variable font carries the interpolation machinery for the whole
axis range, so at one or two weights the static files are smaller; at three or more the variable file wins,
and it wins by more as you add weights and as the glyph set grows.

- Using 400 + 600 + 700, or any weight range at all: **variable**.
- Using exactly 400 + 700 and nothing else, ever: **statics**, and check.
- Using 400 only: statics, obviously.

Weigh the actual files rather than trusting the rule; it depends on the face's axis count and glyph coverage.

The other argument for variable: it removes the synthetic-bold class of bug entirely. With
`font-weight: 100 900` declared, `font-weight: 550` is a real interpolated weight rather than a browser
guess, so a designer asking for "a bit bolder" is a token change rather than a new file.

Instance a variable font down if you only need part of the range:

```bash
fonttools varLib.instancer Inter-Variable.ttf wght=300:700 --output=Inter-300-700.ttf
```

---

## 4. `font-display` — pick the trade you want

The spec defines a **block period** (font not loaded → render invisible) and a **swap period** (font not
loaded → render fallback, swap in when it arrives).

| Value | Block | Swap | What the user sees | Use when |
|---|---|---|---|---|
| `block` | short | infinite | Invisible text, then the font. FOIT. | Icon fonts only, and you should not have one |
| `swap` | extremely small | infinite | Fallback immediately, swaps whenever the font lands | **Default choice.** Text is always readable |
| `fallback` | extremely small | short | Fallback immediately; swaps only if the font arrives quickly | Brand matters but a late swap is worse than none |
| `optional` | extremely small | none | Fallback for this page view; font used only if already cached | **Layout stability outranks brand.** Best CLS |
| `auto` | UA-defined | UA-defined | Usually behaves like `block` | Never — you have made no decision |

`swap` guarantees text is never invisible, which is the accessibility-relevant property: with `block`, a
slow connection shows a page with no readable text at all. The cost of `swap` is the visible reflow, which
step 5 removes.

`optional` is the strongest CLS answer and the one to reach for on a content site where a first-visit
fallback render is acceptable: the font downloads in the background, gets cached, and every subsequent page
view uses it with no shift at all.

---

## 5. Preload the critical files, with `crossorigin`

Only the files actually used above the fold. Preloading everything prioritises nothing and delays the
resources that matter.

```html
<link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>
```

**`crossorigin` is mandatory even for same-origin fonts.** Fonts are fetched in CORS anonymous mode; a
preload without it is treated as a different request than the font request, so the file downloads twice and
the preload has made things strictly worse. This is the single most common font-preload mistake.

Preloading `latin-ext` when your page is English is also a waste — preload matches your `unicode-range`
split, not your `@font-face` count.

---

## 6. Metric-match the fallback — the actual fix for font-swap shift

This is the step almost everyone skips, and it is what turns `swap` from "readable but jumpy" into
"readable and stable".

Declare a second `@font-face` that wraps a **local system font** and overrides its vertical metrics and scale
so its line box is identical to the webfont's. The swap then changes the glyph shapes and moves nothing.

```css
@font-face {
  font-family: "Inter Fallback";
  src: local("Arial");           /* or local("Helvetica Neue"), local("Segoe UI"), local("Roboto") */
  size-adjust: 107.12%;          /* scales the fallback so its x-height/width matches */
  ascent-override: 90.2%;        /* as a percentage of the em, matching the webfont's ascent */
  descent-override: 22.48%;
  line-gap-override: 0%;
}

:root {
  --font-sans: "InterVariable", "Inter Fallback", system-ui, sans-serif;
}
```

**Generate the numbers; do not invent them.** They are derived from the two fonts' `unitsPerEm`, `hhea`/`OS/2`
ascent and descent, and average character width. Tools that do it for you:

- **Fontaine** (npm, framework-agnostic Vite/PostCSS plugin) — rewrites your `@font-face` rules with
  overrides automatically.
- **`next/font`** — does this by default for both Google and local fonts. If you are on Next.js, this is
  already handled and you should not hand-roll it.
- **Malte Ubl's fallback-font generator** and equivalents — paste a font, get the override block.

`size-adjust` is the coarse control (overall scale); `ascent-override` / `descent-override` /
`line-gap-override` set the line box precisely. `font-size-adjust: from-font` is a related, simpler tool that
matches x-height only — useful when you cannot compute full overrides, weaker than doing so.

Verification: load the page with the font request blocked in devtools, screenshot; unblock, screenshot;
diff. If any baseline moved, the overrides are wrong.

---

## 7. The monospace `font-size` quirk

Browsers apply a **separate default font size to the `monospace` generic family** — historically 13px where
the default is 16px. So `code { font-family: monospace; font-size: 1em; }` renders at 13px, not 16px, and
the `1em` looks like it did nothing.

Two fixes:

```css
/* Preferred: set an explicit size, so you never depend on the generic's default. */
code, pre, kbd, samp {
  font-family: var(--font-mono);
  font-size: 0.9375em;   /* 15/16 — mono faces read larger than sans at equal size */
}

/* The classic hack: repeating the generic sidesteps the special-casing. */
code { font-family: monospace, monospace; }
```

The `0.9375em` (not `rem`) is deliberate: inline code should track the size of the text it sits in, so it
stays proportional inside a heading and inside a caption. Block `<pre>` can use `rem`.

Also set `font-variant-ligatures: none` on code unless you specifically want programming ligatures — and
never on password fields, ID strings or anything the user must transcribe character by character.

---

## 8. Measuring what you are actually paying

- **CLS from fonts** shows up in Chrome DevTools → Performance → Layout Shifts, and in Lighthouse's
  "Avoid large layout shifts". The shift is attributed to the elements below the text, which is why it is
  often misdiagnosed as an image problem.
- **Font bytes and timing**: DevTools → Network, filter by Font. Check total size, and check whether the font
  request starts before or after the CSS resolves (preload moves it earlier).
- **The swap moment**: throttle to Slow 3G and watch. If text is invisible at any point, `font-display` is
  wrong. If text visibly reflows, the metric overrides are missing or wrong.
- **Budget**: two files and roughly 50KB total is a healthy target for a marketing page — one variable file
  covering the weight range, plus italic if genuinely used. Five static weights at 25KB each is 125KB spent
  on something the user cannot name.

---

## 9. Quick audit

- [ ] Fonts self-hosted, not `fonts.googleapis.com` or another third-party origin.
- [ ] WOFF2 only; no WOFF/TTF/EOT fallbacks.
- [ ] Subsetted, with `tnum`/`lnum`/`kern`/`liga` retained in the layout features.
- [ ] `unicode-range` declared per subset file.
- [ ] Variable font if using three or more weights; statics verified smaller if not.
- [ ] `font-display: swap` (or `optional` where stability wins).
- [ ] Only above-the-fold files preloaded, each with `crossorigin`.
- [ ] A metric-matched fallback `@font-face` exists, with generated (not guessed) override values.
- [ ] Only loaded weights are used; `font-synthesis: none` in development shows no fake bolds.
- [ ] Monospace elements have an explicit `font-size`.
- [ ] Blocked-font screenshot and loaded-font screenshot show no baseline movement.
- [ ] Total font payload under budget, and every file justified by something on the page.
