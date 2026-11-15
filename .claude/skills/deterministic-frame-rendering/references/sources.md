# Sources

Read on 2026-11-15 from READMEs and skill files through web fetches. Nothing was run, cloned or installed from these repos. The method is restated in this skill's own words and implemented in its own scripts.

| Repo | What it contributed | Licence and cautions |
|---|---|---|
| `Avi130805/webgl2video` | frame *i* depends on *i* alone; the driver asks the page for each frame; resumable segments joined without re-encoding; a QA step for one-frame flashes and cuts; the argument against screen recording | MIT. Its RunPod launcher spends money, and an `LD_PRELOAD` shim for NVENC injects C code into processes: audit before use. Cost and speed figures are the author's |
| `elvarofficial/teardown` | `render(t)` is a pure function of time; one input drives the video, the live page and the score; a contact-sheet review loop | MIT. Needs a Chromium download, ffmpeg and a GPU; installs a global skill |
| `patch-gg/pixelfx` | seeded randomness, a lint step for seams and slow frames, "draft several, look at every contact sheet, fix the worst thing" | MIT. Its publish path pipes an install script to a shell: do not |
| `Felipeex/motion-skill` | safe zones per format, review stills before export, loudness check | **No licence found**: all rights reserved, method only, nothing copied. Downloads executables and a model for voice-over |

Star counts on these repos are very high for their age and could not be verified; none of that was relied on.
