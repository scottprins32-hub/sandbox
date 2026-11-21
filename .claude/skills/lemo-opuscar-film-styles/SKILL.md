---
name: lemo-opuscar-film-styles
description: Decides whether and how to use Lemo-Opuscar (lemomo-ai/lemo-opuscar), a Claude Code plugin with 99 film styles (watercolor, ukiyo-e, newsreel, LiDAR survey, pixel RPG and more) where the agent writes, draws, scores, narrates and renders a short film in code with canvas/WebGL, TTS and sample-library music, including install, prerequisites, what goes online and the split MIT / CC BY-NC licence. Use this whenever the user wants a styled explainer, promo, short or animated film made by Claude without a camera or video generator, asks for "a film in the X style", wants a distinctive look instead of generic AI video, or mentions Lemo-Opuscar or OPUSCAR 98 - even if they never name it. Main caveat - the style prompts and guides are non-commercial (CC BY-NC) outside making your own films, and the setup script pulls and resets the library from GitHub main on every run.
---

# Lemo-Opuscar (film styles made in code)

"99 film styles for your coding agent. Pick one, bring your story, and the agent makes the film, entirely in code." Read 2026-11-21: README, LICENSE, `REUSE.toml` (skimmed), `package.json`, `requirements*.txt`, `.claude-plugin/marketplace.json`, `plugin/skills/lemo-opuscar/SKILL.md` and `scripts/setup.sh`, `TECHNIQUE.md` §1 and §4, `AGENTS.md` and `DIRECTOR.md` (grepped), `core/README.md` and `core/image/gen_image.py` (headers), `tools/fetch.sh`, `styles/README.md`, `styles/newsreel/STYLE.md`. Version 2.0.0, last commit 2026-11-20. Nothing was installed or run.

## What it is

- A library of style prompts (`styles/<slug>/STYLE.md`, 99 folders in 15 categories) plus guides the agent follows: `DIRECTOR.md` (story, sound, rhythm), `TECHNIQUE.md` (frame-by-frame render, voice, music, mix), `AGENTS.md` (workflow), `MY-STYLES.md` (make your own style).
- A toolkit in `core/`: Playwright headless Chromium renders HTML/canvas/three.js pages frame by frame, Python does sound effects, mixing and subtitles, ffmpeg muxes (two-pass loudnorm to -14 LUFS). Default 1920x1080 at 24 fps.
- Narration is TTS (Kokoro offline for English; edge-tts, an online Microsoft service, for Chinese) or the user's own recording. Music is composed from free sample libraries downloaded from the repo's GitHub release.
- Each style has a demo film; the feature film OPUSCAR 98 uses a separate set of 98 per-film style prompts.

## When to use / not

- Use for a 30-90 second explainer, launch film, history piece or music-video-like short where a strong, specific look matters and there is no footage.
- Expect about 30-60 minutes of agent time and "a fair amount of tokens" per film (README). The README recommends Claude with `/effort high`.
- Not for trimming or converting existing video (its own skill says so): see `auto-editor-silence-cutting` or `creator-video-toolkit`.
- For a React-component video pipeline use `remotion-react-video`; for the frame-exact capture method on your own page use `deterministic-frame-rendering`.

## Setup (from the README)

Prerequisites the user installs: Node 20+, ffmpeg 7+ (Ubuntu 24.04's 6.1 is too old; 6.x breaks `mux.sh`), Python 3.11+ or uv. The voice tier needs Python 3.11-3.13 (kokoro-onnx).

```sh
claude plugin marketplace add lemomo-ai/lemo-opuscar
claude plugin install lemo-opuscar@lemolab
# then in Claude Code: /lemo-opuscar:lemo-opuscar   (or "Make a film in the watercolor style about ...")
```

Or clone and run Claude inside it (films go in `films/<name>/`). Package tiers, installed by `setup.sh deps [voice] [music]`: core about 350 MB (npm, Chromium headless shell, Python venv), voice about 0.55 GB plus a Whisper model, music about 140 MB; sample libraries 70-400 MB each, about 1.4 GB for all.

## What goes online

- `setup.sh` clones the library to `~/lemo-opuscar` and, on every later run, fetches `main` and runs `git reset --hard` on it (only for the clone it created and marked `lemo.managed`). That is unpinned code executed on each film. To pin, clone yourself at a known commit and set `LEMO_OPUSCAR_HOME` to it; the script uses an existing clone as it is.
- npm, PyPI, Playwright's Chromium download, GitHub release assets (`tools/fetch.sh`, checksummed).
- Chinese narration text goes to Microsoft via edge-tts.
- Three styles marked ✦ (Manga Panels, Text Flash Cuts, Comic History Cartoon) cannot start without an image generator: the user's signed-in Codex CLI (`gen_image.py` drives `codex exec`) or another tool. Prompts and reference images go to that service.
- Edit & Documentary styles (8) and data styles use real archive footage, documents, satellite imagery or scans that the agent finds and downloads; check each source's licence.

## Licence (read `LICENSE`, it is file by file)

- Code (`core/`, `tools/`, `styleboard/`, `plugin/`, demo code): MIT.
- Every Markdown file, including each `STYLE.md` and the guides, and the image prompts: CC BY-NC 4.0, plus an extra grant to read, follow and adapt them to make your own films, commercial and client films included. Selling them or putting them into a product or service run for commercial advantage needs a commercial licence (email in `LICENSE`).
- Demo films, posters and stills: CC BY 4.0, except Clawd (Anthropic's character), six TTS narration tracks, third-party logos and interfaces, and re-created scenes from real films.
- Films you make are yours, no credit required; third-party material in them keeps its terms. Versions before 2.0.0 keep their earlier licence (not checked).
- So: do not copy `STYLE.md` text into another skill, template pack or paid tool.

## Traps

- Running two `setup.sh deps` at once is guarded by a lock folder; a stale `~/lemo-opuscar/.lemo-deps.lock` may need removing.
- Some styles need extra packages (LiDAR reader, CAD importer); the guides say install them into the project folder, never into the library venv.
- Your own styles live in `~/lemo-my-styles/` and survive uninstall; delete them yourself.
- "Made in code" covers the drawing; documentary styles still depend on footage someone filmed.

## Creator's claims (Jack Roberts video, 2026-11-20) vs the repo

- "99 film styles": matches (99 style folders, 15 categories).
- "Made in code with no camera": true for most styles (canvas/WebGL, TTS, samples, "No video generation, no stock footage"), but the 8 Edit & Documentary styles are cut from real archive footage and 3 styles need an AI image generator.
- "Unique styles beat AI slop": an opinion; the repo is tuned for Claude and warns other models "may not reproduce the styles well".
- "The catch": the repo's own catches are time and tokens per film, Node/ffmpeg 7/Python prerequisites, the ✦ image-generator dependency and the non-commercial docs licence.

## Not verified

Film quality and render times, the gallery site, Windows support, whether documentary material sources are licensed as claimed, the commercial licence terms, and REUSE.toml file by file.

## Checklist

- [ ] Node 20+, ffmpeg 7+, Python 3.11+ present; disk space for the tiers you need.
- [ ] Decided: auto-updating plugin clone, or your own pinned clone via `LEMO_OPUSCAR_HOME`.
- [ ] Style is not ✦, or the user has an image generator and accepts sending prompts to it.
- [ ] Narration plan: Kokoro offline, edge-tts online, or own voice.
- [ ] Third-party footage, data and samples listed in the film's `CREDITS` with licences.
- [ ] No reuse of the style docs outside making films unless a commercial licence is in place.
