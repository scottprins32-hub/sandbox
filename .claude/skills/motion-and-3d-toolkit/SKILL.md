---
name: motion-and-3d-toolkit
description: Router for building, checking and showing motion and 3D work on the web - a synthetic or real pitching skeleton, product or garment 3D, motion graphics, and the evidence behind the numbers. Points to the skill for each job (validating estimated motion, deterministic frame rendering, web design review, glTF asset pipeline, sand3d modelling, raea and Remotion video, whisper transcription, the design and UX layer) and holds a worked example, Pitch Lab, that uses four of them together. Use this whenever the user starts a project that mixes 3D, motion, video and web design, or asks which of these skills to use for a step - even if they name none of them.
---

# Motion and 3D toolkit

Pick by the question, not by the tool.

| The question | Skill |
|---|---|
| Can this estimated angle, event or speed be trusted, and what do I call it? | `estimated-motion-validation` |
| How do I turn a web animation into a frame-exact video, and prove it is stable? | `deterministic-frame-rendering` |
| Is this page actually good at phone width, in dark mode, by keyboard? | `web-design-review-loop` (values live in `ui-craft` and its specialists) |
| My GLB is heavy, slow, mis-scaled, or I need a configurator or a skeleton viewer | `gltf-web-asset-pipeline` |
| I need to write a 3D object as code and export it | `sand3d-modeling` |
| I want a GPU-rendered clip, or video from React | `raea-render-engine`, `remotion-react-video` |
| Transcribe coach voice notes locally | `whisper-cpp-transcription`, `openwhispr-dictation` |
| Why would anyone use it, and is the persuasion honest | `ux-psychology` and `ethical-persuasion-audit` |

## Worked example: Pitch Lab (`examples/pitch-lab/`)

A single page that shows a **synthetic** pitching skeleton with scripted coach notes and the validation evidence for an **estimated** measurement. Nothing in it is a real athlete or a real system, and the page says so.

How the skills were used, in order:

1. **Validation.** `estimated-motion-validation`'s script was self-tested against the Shrout and Fleiss ICC table, then run on seeded synthetic pairs (`pairs.csv`, `series.csv`, results in `validation.json`). The honest result: the estimate is *equivalent on average within ±5°* (and ±3°), yet a single pitch can differ by about 7° (limits of agreement −7.0 to +5.6°), and it lags the reference by 2 samples (33 ms at 60 fps). The page shows both statements.
2. **The page and the video.** One drawing function serves both the interactive viewer and the render. `deterministic-frame-rendering` rendered 150 frames in about 14 s without a GPU, proved the frames identical when rendered twice out of order, and found no frozen frame or flash.
3. **The review.** `web-design-review-loop` found a contrast failure (an orange label at 4.33:1) and a 32 px slider; a look at phone width found a figure too small to read. All fixed, then the audit reported no MUST finding.
4. **The model file.** `gltf-web-asset-pipeline`'s inspector had earlier found the mixed-unit problem in a `sand3d-modeling` export (5.9 MB, root scaled 0.001), which is the reason the guidance on units exists.

Files: `index.html` (open it in a browser; add `?render=1` for the render mode), `validation.json`, `pairs.csv`, `series.csv`, `render.mp4`, `contact-sheet.png`.

## More examples

- **`examples/validation-lab/`**: an interactive lab. Make a simulated estimate worse (gain error, constant offset, random error, timing lag) and watch which statistics notice. `stats.js` is a JavaScript port of the deterministic statistics; `node crosscheck.mjs` compares it with the Python script on the same files and passes on every value (bias, MAE, limits of agreement, Pearson r, ICC(3,1) and ICC(2,1), TOST p-values and intervals, skill, lag). The bootstrap interval is not ported, because the Python random stream cannot be reproduced. What the presets teach: a constant offset leaves Pearson r and ICC(3,1) at 0.94 while ICC(2,1) drops to 0.48; "right ranking, wrong values" keeps r at 0.91 but only 23% of pitches fall inside ±5°; and an estimate that is **5 samples (83 ms) late** still scores 98% of pitches inside the bound, because amplitude statistics cannot see timing.
- **`examples/pitch-score-3d/`**: the phone-to-3D score done properly. A three.js mannequin (lit, shadowed, built from primitives, so no third-party model licence) is driven frame by frame by real 3D joints, and body parts the cameras did not see in that frame turn see-through. `ranges.js` takes the structure of a phone-to-3D swing app (a card per phase, green/amber/red, one cue, a 0-100 score with phase bars) and fills it with Motion Studio's pitching ranges and sources; a phase is only scored when the frame rate can resolve it (stride and rotation 25 fps, arm at foot contact 45, release 100), and no total is shown with fewer than three scored phases (`node --test ranges.test.mjs`, 7 tests). `build_motion.py` turns Motion Studio outputs (`trial.js`, the biomech read-out, the twocam log, the phone videos) into one `motion.json` and only reads Motion Studio; `assemble.py` fills `template.html`. The committed page runs on the scripted Pitch Lab pitcher at 120 fps (`export_synthetic.mjs`), analysed by Motion Studio's unmodified `biomech.py`. It was also run on a real two-phone throw, kept private and out of the repo: there `biomech.py` declines 30 fps, so a scratch copy with that gate lifted supplied the foot-contact values, and the arm and release phases stayed unscored.
- **`examples/pitch-score/`**: a 30-second 9:16 reel and an interactive page showing how a phone-to-3D "swing score" app could look for pitching: a simulated phone view, a shaded 3D mannequin, five phase cards (lead knee height, stride from the rubber, hip-shoulder separation, elbow angle, trunk lean), each with a target band and an illustrative estimate range, then a score. Every value is computed from the Pitch Lab skeleton (score 64/100 for that scripted pitcher); the ranges and weights are placeholders except hip-shoulder separation, which uses Motion Studio's 35-65°. Two lessons from building it: a metric definition can be wrong for the data (leg lift as a thigh angle read -41° here; stride measured ankle to ankle read 68% against 86% from the rubber), and a page-level helper named `frame` silently replaced the skeleton's own `frame()` function.
- **`examples/geometry-lab/`**: a four-camera rig run end to end with the global skills `caliscope-calibration`, `aniposelib-geometry-check`, `fiftyone-tracking-review` and `cvat-reference-labeling`, judged with `estimated-motion-validation`. Everything is synthetic. Calibration was checked on held-out frames (median 2.6 mm, camera positions within 1 mm of the synthetic truth); a camera knocked by 1° and a camera two frames late were each found by dropping one camera at a time, and the wrist-track lag told geometry from timing. Findings worth knowing: the raw peak hip-shoulder angle is destroyed by one left/right swap (ICC 0.05, a 5-frame median gives 0.94); fixing the bad camera improved wrist position (46 to 8 mm) but made the angle agree worse (ICC 0.84 to 0.65); the image of the camera you distrust is the wrong yardstick. Not run: a CVAT server, the FiftyOne app, the PyTorch aniposelib variant. `scripts/` rebuilds it step by step; `index.html` is the report.
- **`examples/review-before-after/`**: a deliberately flawed page (`before.html`) and its fixed version (`after.html`), with the audit output for both. The audit found 6 MUST items at 375 px and 5 at 1440 px before (page 1160 px wide in a 375 px viewport, 17 text nodes under 4.5:1, with the lowest at 1.61:1, targets under 24 px, an input without a name, an image without alt, no visible focus) and none after.
- **`examples/pitch-lab/render-vertical.mp4`**: the same page rendered at 720×1280 (90 frames in 7.6 s). The determinism check and the QA passed, and rendering the landscape video again gave a byte-identical file. A new aspect ratio still needed its own framing: the first vertical render was technically clean but showed a small figure off to one side.
- The GLB inspector on two exports of the same baseball model: 205 meshes and 2.5 MB when unmerged against 29 meshes and 5.9 MB when merged. Merging cut draw calls and grew the file, because shared geometry was no longer instanced. Both exports carry the same root scale of 0.001 and no compression.

What the example does **not** show: a real athlete, real pose-estimation output, real speech, a measured accuracy of any actual pipeline. The skeleton is ten hand-authored phase poses blended with cubic curves and two-bone leg IK, an illustration of how such a viewer behaves, not pitching biomechanics.

## Related sets

- Design and UX values: `ux-psychology`, `ui-craft`.
- Game, creator and self-hosted tool sets: `ai-game-dev-stack`, `creator-video-toolkit`, `self-hosted-app-alternatives`.
