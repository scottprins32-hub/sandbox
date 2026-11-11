---
name: auto-editor-silence-cutting
description: Cuts silences and dead sections out of video and audio with Auto-Editor (WyattBlue/auto-editor), a public-domain command-line tool, choosing the edit method, threshold, margin and silent-part speed, previewing the result, and exporting the timeline to Premiere, DaVinci Resolve, Final Cut Pro, Shotcut or Kdenlive. Use this whenever the user wants to remove pauses, dead air or ums from a talking-head video, tighten a podcast or screen recording, speed up silent parts, or mentions Auto-Editor or "auto edit" - even if they never name the tool. Covers install (no longer on pip), the licence-key gate, and flags verified from its docs.
---

# Auto-Editor (automatic silence cutting)

A command-line editor that analyses loudness (or motion, subtitles, black frames) and cuts or speeds up the inactive parts. Written in Nim, public domain (Unlicense). Read 2026-11-11 from its README, LICENSE, auto-editor.com docs (install, options, edit methods, cookbook, actions, ranges, subcommands, supported media) and the releases page. Latest release seen: 31.8.0 (30 Oct, year inferred 2026). **Nothing here was run.** The docs site may lag the binary: confirm with `auto-editor --version` and `--help`.

## Install

- **Official binary** from GitHub Releases (Windows, macOS, Linux): rename to `auto-editor`, `chmod +x`, run `./auto-editor --help`. Binaries are unsigned, so expect "unknown developer" warnings; check the release's own checksums if offered.
- macOS: `brew install auto-editor`. Arch: `yay -S auto-editor`.
- **The CLI is no longer published on pip**, and apt packages are "very old": do not use either.
- ffmpeg appears to be bundled in the release binaries (release notes mention bundled FFmpeg 9.x); that was inferred, not stated outright.
- Optional: yt-dlp on PATH lets a URL be an input.

## The default and the loop

```bash
auto-editor video.mp4 --preview            # stats only, nothing rendered
auto-editor video.mp4 -o trimmed.mp4       # default: audio loudness, threshold 0.04, margin 0.2s
auto-editor video.mp4 --margin 0.5sec      # more breathing room around speech
auto-editor video.mp4 -w:0 speed:8         # keep silence but play it 8x, instead of cutting
auto-editor video.mp4 --edit audio:-18dB   # threshold in dB (the unit is case-sensitive) or audio:6%
```

Always `--preview` first, then render, then **watch the result**: a number that cuts well on one voice can chop breaths or keep a noisy room on another. Tune `threshold` and `--margin` per recording.

## Edit methods (`--edit`, default `audio`)

- `audio:threshold=…,stream=…,channel=…`; `motion:threshold=2%` (defaults: threshold 0.02, width 400, blur 9); `subtitle` and `regex` (cut by subtitle text); `word`; `blackdetect` (wrap in `not` to cut black frames).
- Combine with parentheses: `--edit "(or audio:0.03 motion:0.06)"`; operators `or and xor not`.
- Actions: `-w:0` is `--when-inactive` (default `cut`), `-w:1` is `--when-active` (default `nil`). `speed` keeps pitch; `varispeed` changes it. Podcast example from the docs: `auto-editor podcast.mp3 -w:0 cut -w:1 speed:1.15`.
- `--smooth` (default `0.2s,0.1s`) removes tiny cuts and clips; `--smooth 0` turns it off.
- Range overrides: `--cut start,30sec -30sec,end`, `--keep`, `--set-speed-for-range 2,0,30`.
- Cutting by what was said: `auto-editor whisper video.mp4 ggml-medium.en.bin --format srt -o video.srt` then `--edit subtitle`. This needs ffmpeg's whisper filter and a ggml model (see `whisper-cpp-transcription`).
- `--transition dissolve:0.5sec` adds dissolves (version 31.3.0 and later; some formats drop them).

## Export to an editor

`--export premiere | resolve | final-cut-pro | shotcut | kdenlive | edl | clip-sequence`. Release 31.8.0 warns when the target format cannot hold some actions or tracks, so read the warnings. Example: `auto-editor video.mp4 --export resolve -o interview.fcpxml`.

## Rendering options

`-crf` (0 to 63, lower is better), `-c:v`, `-b:v`, `-c:a` (opus is the best-quality audio encoder in the table, `aac` is also fine), `--audio-normalize ebu|peak`, `--frame-rate`. Partial lossless rendering is on by default for H.264, HEVC and VP9 (`--no-partial-lossless` to turn off). Progress goes to stderr and stdout carries data only (31.7.2 and later), which matters when scripting.

## Other subcommands

`info FILE [--json]` (fps, codecs, duration), `levels FILE` (raw loudness values: use it to pick a threshold), `subdump`, `desc`, `whisper`, `cache`.

## Gotchas

- **Licence gate (31.4.0):** unlicensed single-source rendering is supported up to 3200×1800; higher resolutions and multi-source timeline exports need a licence key (`--license-key`). The code is public domain, but the release binaries "may be under various open source licenses" (README).
- Media with only subtitle or data streams, or longer than 24 hours, is not supported.
- Variable-frame-rate behaviour is not documented in anything read; check a VFR phone recording for audio drift after cutting.
- Unknown audio codecs report an error (31.8.0); audio streams no decoder can read are skipped (31.6.0).
- Cuts follow the audio, so music beds or room noise keep "silence" from registering. Raise the threshold or use `levels`.

## Not verified

Any actual run, VFR handling, the v1/v2/v3 timeline formats, the cache subcommand, the exact ffmpeg bundling, the year of the 31.8.0 release.

## Ship checklist

- [ ] Version checked and the docs match it.
- [ ] `--preview` run and the cut count looks sane.
- [ ] Output watched end to end for chopped words and clipped breaths.
- [ ] Resolution within the unlicensed limit, or a key obtained.
- [ ] For an editor handoff: the export warnings read and the timeline opened in the editor.
