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

What the example does **not** show: a real athlete, real pose-estimation output, real speech, a measured accuracy of any actual pipeline. The skeleton is ten hand-authored phase poses blended with cubic curves and two-bone leg IK, an illustration of how such a viewer behaves, not pitching biomechanics.

## Related sets

- Design and UX values: `ux-psychology`, `ui-craft`.
- Game, creator and self-hosted tool sets: `ai-game-dev-stack`, `creator-video-toolkit`, `self-hosted-app-alternatives`.
