---
name: openwhispr-dictation
description: Sets up and troubleshoots OpenWhispr (OpenWhispr/openwhispr), the MIT desktop dictation app that types speech into any app, as a free alternative to Wispr Flow: install per platform, the macOS and Linux permission traps, local versus cloud transcription, what actually leaves the machine, its CLI and MCP server, and the free-versus-paid split. Use this whenever the user wants voice dictation into any app, local or offline speech-to-text for typing, meeting transcription with notes, a Wispr Flow replacement, or mentions OpenWhispr - even if they never name it. Corrects the "no telemetry" framing and warns about the MCP self-setup key.
---

# OpenWhispr (voice dictation)

Press a hotkey, speak, and the text is pasted at the cursor. MIT licence, Electron app for macOS, Windows and Linux (x86-64 only on Linux). Read 2026-11-13 from the README, LICENSE, SECURITY.md, the releases page, `docs/network-allowlist.md`, docs.openwhispr.com (quickstart, macOS, Linux), the pricing page and the MCP and CLI repos. Latest release seen: v1.11.0 (29 Oct 2026). Nothing was installed or run; parts of the releases page were read as a summary. The system requirements, Windows install and permissions, data-storage, privacy and trust pages were not fetched.

## Install

- macOS 12+: `.dmg` (signed and notarised), or the community cask `brew install --cask openwhispr`.
- Windows: the `.exe` installer (the portable exe was discontinued in 1.10.3).
- Linux: `.AppImage`, `.deb` (`sudo apt install ./OpenWhispr-*-linux-x64.deb`), `.rpm` or `.tar.gz`. AppImage and tar.gz cannot do browser sign-in; email-code sign-in still works.
- From source: Node 24+, `npm install`, `npm run dev`.

## Permissions and hotkeys (where it breaks)

- **macOS:** Microphone is required. Accessibility is required to paste automatically; without it the text only lands on the clipboard. After an update or reinstall Accessibility can look granted while pasting fails: use the app's "Reset accessibility permissions" in Troubleshooting. System Audio is only for recording meeting participants. Whether Input Monitoring is needed was not stated.
- **Linux:** X11 paste works without setup. Wayland paste needs `/dev/uinput` (`sudo usermod -aG input $USER`, then log out and in) or a helper (`wtype`, `ydotool` with `ydotoold`, `wl-clipboard`); otherwise it falls back to clipboard mode and you press Ctrl+V. Terminals need Ctrl+Shift+V (the app handles this); hold-to-talk on most desktops except GNOME 48+ needs the `input` group, otherwise use tap mode.
- Default dictation hotkeys: macOS Globe (fn), Windows Ctrl+Win, Linux F8 on GNOME or X11 and Ctrl+Super on KDE Wayland or Hyprland. Change them in Settings, Hotkeys.

## Local versus cloud (and what leaves the machine)

- **Local models:** Orukeet (recommended, about 672 MB), Whisper, NVIDIA Parakeet, Nemotron, Cohere Transcribe, with GPU acceleration on Metal, CUDA or Vulkan and a CPU fallback. No internet is needed after the model download (from Hugging Face; engines from GitHub). A size table and hardware requirements were not read.
- **Cloud is the default after onboarding.** Signing in sends audio to `api.openwhispr.com` and live streaming to Deepgram, OpenAI Realtime, AssemblyAI or Gemini Live. The homepage says recordings are deleted once transcribed: not verified.
- **Bring your own key** (OpenAI, Azure, Anthropic, Gemini, Groq, Mistral, OpenRouter, Tinfoil, Deepgram, AssemblyAI) calls those providers only when configured. Exactly which text goes to the reasoning provider during cleanup was not verified.
- **The README's "no telemetry" is narrower than it sounds.** Even local-only users get a model-registry check from `raw.githubusercontent.com` at launch and every 15 minutes (off via Settings, Privacy, "Model list updates" or `OPENWHISPR_MODEL_REGISTRY_MODE=bundled`) and auto-update from GitHub. Say "local dictation works offline", not "no network".
- Secrets use the OS keychain via Electron `safeStorage`; on Linux without a keyring they fall back to plaintext.

## Other features

AI cleanup and per-app tone, a voice assistant hotkey (speech as a command, edits selected text), a free auto-learning custom dictionary, snippets, meeting capture (Zoom, Teams, FaceTime; diarization; calendar), notes and audio or YouTube import. On Intel Macs live speaker identification is unavailable.

## Free versus paid

Free: unlimited local dictation, unlimited cloud transcription with your own keys, dictionary, 2,000 cloud words a week, 5 meeting hours a month, local-only CLI. Pro (about $6.67 a month annually) adds unlimited cloud transcription, agent mode, sync, API and MCP and the iOS app; Business and Enterprise add team and admin features. Marketing claims ("150k+ users", SOC 2, HIPAA) were not verified.

## CLI and MCP

- CLI: `npm i -g @openwhispr/cli` (Node 20+); `openwhispr auth login` with an `owk_live_...` key; `openwhispr transcribe file.m4a` uses the running desktop app locally for free; `--remote` uses the paid cloud. The config file at `~/.openwhispr/cli-config.json` holds the API key in plaintext.
- MCP (hosted at `https://mcp.openwhispr.com/mcp`): `claude mcp add openwhispr --transport http https://mcp.openwhispr.com/mcp --header "Authorization: Bearer owk_live_YOUR_KEY"`. 21 tools over notes, transcriptions, dictionary and snippets; create the key with only the scopes needed.
- **Caution:** the MCP README describes an agent self-setup flow that creates an account and API key from an emailed code. Do not run it on the user's behalf without their say-so, and scope any key narrowly.

## Not verified

Model sizes, system requirements, Windows permissions, the API reference, what text cleanup sends, deletion and retention claims.

## Ship checklist

- [ ] Local or cloud chosen on purpose; the first-run default of cloud understood.
- [ ] Model-registry check and auto-update decisions made.
- [ ] Permissions granted and a paste tested in the target apps (terminal, browser, editor).
- [ ] Any API key or MCP key scoped narrowly and stored privately.
