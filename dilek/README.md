# Dilek Chicken: website redesign

A redesign of [dilek-chicken.nl](https://dilek-chicken.nl): static HTML, one CSS file and one small script, with no frameworks. The page URLs match the current site (`/menu/`, `/catering/`, `/vacatures/`, `/contact/`), so the switch-over needs no redirects.

**Idea:** *het spit staat nooit stil* (the spit never stops). On the homepage the headline sits on a rotisserie drum that turns. Each phrase is skewered on a steel rod, the drum turns one phrase every few seconds, scrolling spins it, and it settles when you stop. The subpage titles use the same skewer and click into place when the page loads. Everything else is kept quiet and fast. Prices are never hidden behind an animation.

The spit is one system with three outputs:
- **The drum.** It turns on its own, on scroll, or by hand: drag it with a mouse and fling it, and it coasts and lands on a phrase.
- **The heat.** A WebGL heat haze with rising embers sits over the grill photo and flares up when the spit spins fast.
- **The sound (optional).** The sizzle is synthesized in the browser, its crackle speeds up with the heat, and it clicks as each phrase lands. It is off by default.

Page changes reuse the idea: the old page tips away and the new one turns in, using the browser's native view transitions.

## Preview

Online: **https://scottprins32-hub.github.io/sandbox/dilek/** (GitHub Pages, `gh-pages` branch). Every preview page is noindex, so it can't compete with the real site in search results.

Locally:

```bash
cd dilek && python3 -m http.server 8000   # open http://localhost:8000
```

To republish the online preview after a change, build it into a checkout of `gh-pages`, then commit and push that branch:

```bash
git worktree add ../ghp gh-pages
python3 dilek/tools/build.py --preview https://scottprins32-hub.github.io/sandbox/dilek/ --out ../ghp/dilek
```

## Editing

Page bodies live in `src/*.html`. Prices, opening hours, addresses and catering packages live only in `tools/build.py`. After any change:

```bash
python3 dilek/tools/build.py
```

This rewrites the HTML pages, `sitemap.xml` and the structured data Google reads (restaurants, opening hours, menu). Do not edit the generated `index.html` files by hand. To regenerate the share image, serve the folder and screenshot `tools/og.html` at 1200×630.

## What's in it

- **Live opening status** for each location (Amsterdam time), plus a summary line in the hero ("Nu open in Osdorp …").
- **"Welke is het dichtst bij mij?"** sorts the locations by distance. The browser only asks for location after a tap, and nothing leaves the device.
- **Catering "bon":** the form writes a live receipt as you fill it in. Submitting opens the visitor's mail app with the request filled in. No backend is needed, and nothing pretends to have been sent.
- Full menu with prices, each category with its own section and sticky category chips.
- Mobile action bar with the main action for each page (route, call, request, apply).
- Self-hosted fonts (Archivo + DM Mono, OFL). No Google requests, no cookies, no trackers.
- AVIF images with WebP fallback, in two sizes each, with width and height set so nothing shifts. Photos open up as they scroll in, using CSS scroll-driven animation (no JS).
- **Heat haze policy:** it only runs on desktops with a real GPU. Phones, Save-Data users and software WebGL (VMs, headless browsers) get the plain photo. It renders at about 30 fps while the spit is idle, and it stops when off-screen, paused or in a background tab. Add `?heat=1` to the URL to force it on for a demo.
- The Archivo font is subset to the glyphs and weight/width ranges the site uses (90 KB → 55 KB).
- Accessibility: skip link, visible focus, one `h1` per page, real links, alt text, reduced-motion substitutes, and a pause control for the turning spit and the heat. With reduced motion on, the drum, heat, sound, page transitions and photo reveals all switch off. axe reports no violations on any page at 390px and 1440px.

**Lighthouse** (production build behind gzip, Lighthouse 12; the online preview's noindex lowers its SEO score):

| | Performance | Accessibility | Best practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Phone (home) | 97 | 100 | 100 | 100 | 2.5 s | 0.015 |
| Phone (menu, catering, vacatures, contact) | 98–100 | 100 | 100 | 100 | 1.7–2.3 s | 0 |
| Desktop (all five pages) | 100 | 100 | 100 | 100 | 0.5–0.6 s | 0 |

## Before launch

- [ ] **Allergen information** (EU 1169/2011): replace the stub on `/menu/`.
- [ ] **Privacy statement**: replace the stub on `/privacy/` with approved wording (retention period, rights, contact).
- [ ] **Confirm facts** taken from the current site: all prices, opening hours, "4,8 / 2.500+ reviews" (and link to the source), "#1 bestseller", "gratis bezorging" (and the delivery area), "100% halal", "sinds 2014".
- [ ] **Reviews**: confirm the three reviewers agree to being quoted by name (they appear on the current site).
- [ ] **"Eerst proeven"** step: based on customer reviews. Confirm with the owners that it is still common.
- [ ] **Westpoort postcode**: the site says 1046 BB, OpenStreetMap lists 1043. Confirm.
- [ ] **Photos and logo**: taken from the current site. Get the originals and usage rights from the client or photographer, plus a vector logo (the icons are upscaled from a 1024px PNG).
- [ ] **Catering form**: works through `mailto:`. For delivery without a mail app, connect a form service (e.g. Formspree or Basin) [confirm: price].
- [ ] Run Lighthouse on the live host (targets: LCP < 2.5 s, CLS < 0.05, INP < 200 ms). Not yet measured.
