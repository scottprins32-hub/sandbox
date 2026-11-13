---
name: open-generative-ai-studio
description: Evaluates and sets up Open Generative AI (Anil-matcha/Open-Generative-AI), an MIT desktop and web studio for AI images, video and lip sync pitched as an open-source Higgsfield alternative, and says plainly that its cloud models are routed through the paid Muapi.ai service, what runs locally, what the "uncensored" and "data stays local" claims actually mean, and the unsigned installers. Use this whenever the user wants a free or open-source AI image and video generation studio, a Higgsfield, Freepik or Krea alternative, or mentions Open Generative AI or Muapi - even if they never name it. Separates the verified code path from README marketing.
---

# Open Generative AI (image and video studio)

Read 2026-11-13 from the original repo (`Anil-matcha/Open-Generative-AI`; many copies and forks exist, so check you have this one): README, LICENSE, `package.json`, releases, the commit list and the client code `packages/studio/src/muapi.js`. Nothing was installed or run. The Dockerfile, `models.js`, the Electron main process and `docs` were not read; `.env.example` does not exist.

## What it really is

A front end (Electron desktop app, plus a Next.js web build) for **Muapi.ai**: generation requests go to `https://api.muapi.ai` with your key in an `x-api-key` header, then the app polls for results. The model catalogue is a list of names and endpoints. That makes it a client for a paid hosted service, not a self-contained generator. You need a Muapi key; presumably Muapi bills you (its pricing was not read). Whether the repo owner runs Muapi is not confirmed, but the README pushes "Powered by Muapi.ai" and a paid white-label reseller plan from $49 a month.

- **Licence:** MIT, copyright "Open Generative AI Contributors". Stack per `package.json` is Next 15, React 19 and Electron 33, not the Next 14 and React 18 the README says.
- **Activity:** very active (commits through 12 Nov 2026), but many commits are README and video-link edits. Latest release v2.0.0 (May). About 34.5k stars as shown on the page.

## Local generation (desktop app only)

- Bundled `stable-diffusion.cpp` engine for image models (Z-Image, Dreamshaper 8, Realistic Vision, Anything v5, SDXL), weights downloaded from Hugging Face.
- Video and larger image models (Wan 2.1 and 2.2, Hunyuan, LTX-2, Flux.1 Dev, Qwen Image) need **Wan2GP**, which you install yourself and which needs a CUDA or ROCm GPU.
- "Local inference is only available in the desktop app. The hosted web version always uses cloud APIs." If you want no key, say so at first launch and use only these local models.
- If you enable Wan2GP's MCP server on `0.0.0.0`, it can be exposed on your network; the README points to Wan2GP's authentication doc.

## Claims that do not hold up

- **Model count:** "600+", "400+", "200+" and "420+" all appear in the README. The category table sums to about 400.
- **"Your data stays local":** false in cloud mode. Prompts, parameters and uploaded images, video and audio are posted to Muapi (`/api/v1/upload_file`), and generation history is stored on Muapi (`/api/v1/history`). The key sits in browser localStorage and is sent only to Muapi.
- **"Uncensored", "no content filters":** the README never defines it. In the client code there is no switch for any filter; for hosted models any moderation is applied by Muapi or the upstream provider. So the claim cannot be verified, and do not promise users unrestricted output. Follow each provider's usage rules; do not use any tool to produce content that is illegal or non-consensual.
- "Cost: free" ignores the Muapi bill.

## Install

```bash
git clone --recurse-submodules https://github.com/Anil-matcha/Open-Generative-AI.git
cd Open-Generative-AI && npm run setup     # submodules, install, build packages; plain npm install is not enough
npm run electron:dev                       # desktop app (recommended)   |   npm run dev -> http://localhost:3000 (cloud only)
```

Node 18+. Prebuilt v2.0.0 installers (Windows `.exe`, macOS `.dmg` for arm64 and Intel, Linux AppImage and `.deb`) are **unsigned**: Windows SmartScreen warns, macOS Gatekeeper blocks until you strip quarantine as the README describes, Ubuntu 24.04 may need an AppArmor workaround. No checksums are published. Building from source is the safer route, since the release binaries were not compared with the source. Telemetry was not found in `muapi.js` but the rest of the code was not read.

## Features listed

Image and video generation, multi-reference image editing, lip sync (image or video plus audio), upscaling, background removal, body swap, clipping, audio, cinema camera presets, node-based workflows and agent studios. None was exercised.

## Not verified

Muapi pricing and ownership, whether binaries match the source, the Docker files, actual model counts, telemetry outside the client file.

## Ship checklist

- [ ] The user knows cloud models bill a Muapi account and send their prompts and media to it.
- [ ] Local models chosen when no key or no upload is wanted.
- [ ] Built from source or the unsigned installer risk accepted.
- [ ] Provider terms followed; no promise of unfiltered output.
