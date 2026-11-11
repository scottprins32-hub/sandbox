---
name: creator-video-toolkit
description: Router for the open-source video-creator toolchain from a reel of five GitHub tools: yt-dlp (download), whisper.cpp (transcribe), Auto-Editor (cut silences), Remotion (video from React) and Postiz (schedule posts), plus how they chain into one workflow and which sibling skills cover cutting, rendering and captions. Use this whenever the user is building or planning a creator pipeline, wants to download, transcribe, edit, caption, render and publish video with free tools, or asks which tool does which job - even if they never name a tool. Warns about the licence and account traps in each link.
---

# Creator video toolkit

From a reel (2026-11-11, an Instagram creator's post listing five free tools; the links were behind a comment gate, so repos were matched by name and each was read). The tools are free to use, but "free" differs: three are permissive or public domain, Remotion is source-available and charges companies, and Postiz is free but needs a developer app per network.

| Job | Tool | Skill | Licence in one line |
|---|---|---|---|
| Download media and captions | yt-dlp | `yt-dlp-media-download` | Unlicense |
| Transcribe locally | whisper.cpp | `whisper-cpp-transcription` | MIT |
| Cut silences, export to an editor | Auto-Editor | `auto-editor-silence-cutting` | public domain (release binaries mixed; a licence key above 3200×1800) |
| Make video from code | Remotion | `remotion-react-video` | source-available; company licence from 4 people, Claude Code users count as seats |
| Schedule and post | Postiz | `postiz-social-scheduling` | AGPL; needs a developer app per network |

## A pipeline that fits together

1. **Get the footage** you have the right to use: your own recordings, or `yt-dlp` for permitted sources.
2. **Cut it:** `auto-editor VIDEO --preview`, then render or export the timeline to your editor.
3. **Transcribe:** convert to 16 kHz mono WAV and run `whisper-cli -osrt`. Captions can also drive Auto-Editor (`--edit subtitle`) or Remotion captions.
4. **Add graphics:** a Remotion composition for titles, captions and data visuals, or `raea-render-engine` for a GPU-rendered alternative.
5. **Publish:** Postiz, after the networks' developer apps are approved (TikTok audit, Meta Live mode).

Check each stage's output yourself: watch the cut video, read the transcript, view a still of the graphics, post to a throwaway account first.

## Where it goes wrong

1. **Rights.** Downloading is not permission to republish. Do not bypass DRM or logins. Never use the user's account cookies without explicit approval.
2. **Licences compound.** A team of four building client videos with Remotion needs seat licences; automated renders are billed per render.
3. **Platform gates.** TikTok posts stay private until the app is audited; Meta apps must be Live; X needs the right app type.
4. **Hallucinated captions.** Whisper invents text over silence and music; use VAD and a language flag.
5. **Moving targets.** yt-dlp breaks when sites change (use nightly); Auto-Editor's docs lag its binary; Postiz ships security fixes often.
6. **Ops.** Postiz needs Temporal and a server; secrets in its default compose file are placeholders.

None of the five tools was installed or run for these skills; each skill says what was read and what was not.
