---
name: audio2face-character-lip-sync
description: Plans lip-sync and facial animation for voiced 3D game characters with NVIDIA Audio2Face-3D - choosing between the local SDK, the Maya and Unreal Engine plugins, and the NIM microservice, and checking licences and engine-version fit first. Use this whenever the user wants a character's face to move to a voice line, needs blendshape weights from audio, asks about Audio2Face, Audio2Emotion, ACE or MACE, or has dialogue to lip-sync in Unreal or Maya - even if they only say "make the character talk".
---

# Audio2Face-3D character lip-sync

Audio in, facial animation out: lip-sync from phonetics plus emotion inferred from tone, as blendshape weights, mesh deformation or joint transforms. NVIDIA's README is a hub page; details live in the linked repos. Read 2026-10-26.

## Decide first

1. **Do you have a face rig?** It needs blendshapes or joints. A 2D game, or a 3D character with no facial rig, cannot use this.
2. **Which route?**

| Route | Form | Pick when |
|---|---|---|
| SDK | C++ / Python library, real-time inference, NVIDIA GPU with CPU fallback | You embed it in your own runtime |
| Maya plugin (MACE v2.0) | Exports Maya keyframes or FBX | Baked animation for any engine; no Unreal-version dependency |
| Unreal plugin (v2.5) | `.uplugin`, UE **5.5 / 5.6** builds linked (hub page lists 5.4-5.6) | Animation inside Unreal |
| NIM | Docker container, gRPC, multi-stream | Central GPU host serving many clients |

3. **Engine version.** The Unreal plugin does not cover UE 5.7, which UnrealClaude requires. Either bake in Maya and import FBX, or keep the project on 5.5/5.6 and skip UnrealClaude.
4. **Licences** differ by component: SDK, Maya and Unreal plugins MIT; training framework Apache; **NIM under NVIDIA's AI product terms**; models under the "Nvidia Open Model" licence; **Audio2Emotion models may only be used with Audio2Face**; **the Claire sample dataset is evaluation-only**. The plugin download links point at release-candidate builds (v2.5.0rc3).

## Not stated on the hub page

GPU model, VRAM, driver and OS requirements, and the audio input format and sample rate. Read the SDK repo's docs before planning hardware, and test with your actual voice files (format, language, noise).

## Workflow

1. Lock the voice lines first; re-recording invalidates the animation.
2. Run one line through the chosen route; export weights or keyframes.
3. Check the rig mapping. (Practical heuristic, not from NVIDIA's page: when a face looks dead or distorted, suspect mismatched blendshape names or ordering first.)
4. Review mouth shapes at game camera distance and speed; judge on screen, not in the plugin preview.
5. Batch the rest, keeping the model version and settings per file.

## Ship checklist

- [ ] Face rig exists and blendshape names are mapped.
- [ ] Route chosen against the engine version actually in use.
- [ ] Each component's licence recorded, including the Audio2Emotion restriction.
- [ ] Hardware requirements confirmed from the SDK docs.
- [ ] Animation judged at in-game camera distance.
