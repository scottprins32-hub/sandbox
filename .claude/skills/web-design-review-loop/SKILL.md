---
name: web-design-review-loop
description: Reviews and improves a web page or UI by looking at it instead of reasoning about it - screenshots at several widths and both colour schemes, a machine audit (horizontal scroll, text contrast, tap-target size, accessible names, visible keyboard focus, alt text), a blurred squint image to check hierarchy, a scored read-through with anchors, fixes, and a hard iteration budget. Use this whenever the user asks to polish, review, critique or QA a page, landing page, dashboard or component, says it "looks off" or is "not responsive", wants a design checked before shipping, or after any significant UI change - even if they never say "audit". Includes a tested Playwright script and the findings it produced on a real page.
---

# The web design review loop

Design advice written without looking at the result drifts. This skill is the loop that makes you look: **render, measure, squint, judge, fix, stop**. It does not hold the design values; it checks that they were applied. For the values themselves go to `typography-system`, `spacing-and-layout`, `color-and-theming`, `attention-and-hierarchy` and `ui-signifiers-and-states`, with `ui-craft` as their router. The script was run for this skill on a real page and found real defects (below).

## The loop

1. **Shoot.** `node scripts/shoot.mjs "file://$PWD/index.html" --out review` (needs Node, Playwright and ffmpeg). It captures `<scheme>-<width>.png` for widths 375, 768 and 1440 in light and dark, a blurred greyscale `-squint.png` of each, and `audit.json`. A server URL works too.
2. **Read the machine findings.** MUST items block shipping; SHOULD items are judgement calls. The script exits 1 on a MUST.
3. **Look.** Open the screenshots yourself, phone width first. Then the squint images (step 4).
4. **Squint.** In the blurred image, can you still tell what the page is, where the one primary action is, and what is the most important number or heading? If three things compete, or nothing stands out, the hierarchy is wrong whatever the individual styles say.
5. **Score by anchors**, 1 to 5 per dimension, naming the evidence (a region of a screenshot) for every score under 4:
   - **Hierarchy:** 1 = no clear first read, 3 = clear but cluttered, 5 = one obvious entry point and a clear second.
   - **Type:** one scale, measure near 65 characters, numbers aligned where compared.
   - **Space:** groups read as groups; spacing steps from a scale; no cramped or stranded elements.
   - **Colour:** a dominant neutral, one accent doing a job, status colours not carrying meaning alone.
   - **States and access:** every interactive element has rest, hover, focus-visible, disabled and error states, a name and a target of 44 px or more.
   - **Responsive:** nothing scrolls sideways; touch targets and the primary content survive 375 px.
   - **Motion:** present only where it explains something; respects reduced motion.
   - **Honesty of content:** real content, claims that can be checked, estimated and synthetic things labelled as such.
   Have a second reader re-score from the screenshots alone, with no access to your reasoning. Distrust a page that scores itself 5 everywhere.
6. **Fix the worst thing first**, re-run from step 1.
7. **Stop** when there is no MUST finding and no score under 3, or after **three rounds**, or when a round changes nothing. Report what remains.

## What the audit checks

Horizontal scroll and elements wider than the viewport; text contrast (WCAG 4.5:1, or 3:1 for large text) computed against the resolved background, skipping gradients and images; interactive targets under 24 px (MUST) or 44 px (SHOULD); controls with no accessible name; images without `alt`; heading order and the number of `h1`; a keyboard Tab sweep that requires a visible focus indicator on every stop; console errors and failed requests. In a published artifact the host provides the viewport meta and the language, so `no-lang` and `no-viewport-meta` can be ignored there.

## What it found on its first real page

A synthetic-data demo ("Pitch Lab") was audited for this skill. It reported:
- **Low contrast on a small label:** the accent colour on the page background measured 4.33:1 against the 4.5:1 needed. The fix was a darker text-only accent token (5.55:1), keeping the brighter accent for fills. That is a common trap: an accent that works as a button background fails as small text.
- **A 32 px slider** (SHOULD under 44 px) raised to 44 px.
- By eye, at phone width the figure on a 16:9 stage was too small to read, so the stage became 4:3 below 560 px. No script would have caught that: it is why step 3 exists.
- The squint image showed the right entry points: the title, the stage and the four headline numbers.
- **A false positive in the audit itself.** Once a `<video controls>` was added, the keyboard sweep flagged "focus not visible": Tab was moving through the player's built-in buttons, which draw their own focus ring inside a shadow tree, while the video element showed no outline. The script now exempts native media controls, and ignores a media request the browser cancels. When the audit contradicts what you can see, debug the audit before changing the page.

## Limits

- Contrast is computed from CSS colours; text over images, gradients or canvas is skipped and must be judged by eye.
- The focus sweep checks for an outline or a shadow, not that the indicator is clearly visible.
- No screen reader, no zoom to 400%, no forced-colours check, no Safari or Firefox. The audit is the floor, not a conformance claim.
- Scores are judgement. Treat them as a way to find the weakest dimension, not as a number to report.

## Not verified

Other pages than the one it was developed on; very long pages (full-page screenshots get large); pages that need a login.

## Ship checklist

- [ ] Reviewed at 375, 768 and 1440 px, in light and dark, by eye as well as by script.
- [ ] No MUST finding; each SHOULD finding either fixed or reasoned away.
- [ ] Squint test passed: one clear entry point.
- [ ] Every score under 4 names its evidence; a second reader re-scored.
- [ ] Stopped within three rounds and listed what remains.
