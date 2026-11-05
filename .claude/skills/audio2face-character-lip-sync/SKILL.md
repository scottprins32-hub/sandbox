---
name: audio2face-character-lip-sync
description: Plans lip-sync and facial animation for voiced 3D game characters with NVIDIA Audio2Face-3D - choosing between the local SDK, the Maya and Unreal Engine plugins, and the NIM microservice, and checking licences and engine-version fit first. Use this whenever the user wants a character's face to move to a voice line, needs blendshape weights from audio, asks about Audio2Face, Audio2Emotion, ACE or MACE, or has dialogue to lip-sync in Unreal or Maya - even if they only say "make the character talk".
---

# Audio2Face-3D character lip-sync

Audio in, facial animation out: lip-sync from phonetics plus emotion inferred from tone, as blendshape weights, mesh deformation or joint transforms. NVIDIA's org README is a hub page; the SDK, Samples and model-card details below come from the linked repos (read 2026-11-05).

## Decide first

1. **Do you have a face rig?** It needs blendshapes or joints. A 2D game, or a 3D character with no facial rig, cannot use this.
2. **Which route?**

| Route | Form | Pick when |
|---|---|---|
| SDK | C++ / Python library, real-time inference, NVIDIA GPU with CPU fallback | You embed it in your own runtime |
| Maya plugin (MACE v2.0) | Exports Maya keyframes or FBX | Baked animation for any engine; no Unreal-version dependency |
| Unreal plugin (core ACE + Models plugins, zip download) | v2.5.0rc3 for UE **5.5 / 5.6**, v2.4.0 for 5.4; release-candidate builds | Animation inside Unreal |
| NIM | Docker container, gRPC, multi-stream | Central GPU host serving many clients |

3. **Engine version.** The Unreal plugin does not list UE 5.7 (no NVIDIA source read mentions it, and none says it is unsupported), which UnrealClaude requires. Either bake in Maya and import FBX, or keep the project on 5.5/5.6 and skip UnrealClaude.
4. **Licences** differ by component: SDK, Maya and Unreal plugins MIT; training framework Apache; **NIM under NVIDIA's AI product terms**; models under the "Nvidia Open Model" licence; **Audio2Emotion models may only be used with Audio2Face**; **the Claire sample dataset is evaluation-only**. The plugin download links point at release-candidate builds (v2.5.0rc3).

## Requirements and I/O (from `NVIDIA/Audio2Face-3D-SDK`)

- **OS:** Windows 10/11 or Linux (Ubuntu 20.04+). **GPU:** NVIDIA with CUDA 12.8.0+ support; 4 GB+ GPU memory and 8 GB+ RAM recommended; 10 GB+ disk. Build needs CUDA >= 12.8 and < 13.0 (12.9 recommended), TensorRT >= 10.13 and < 11.0, CMake, and a C++ toolchain (MSBuild/VS 2022+ on Windows).
- **Input:** audio as an array of floats, **resampled to 16 kHz** (model card); the SDK takes it through an accumulator (`Accumulate()`, then `Close()` at end of stream). Accepted file formats and channel count are not stated.
- **Output:** skin vertex positions, tongue geometry, jaw transform and eye rotation. A solver can convert geometry to blendshape weights for an existing rig. The NIM microservice states ARKit blendshapes as its output; the SDK docs list no ARKit channel names. Maya ACE exports Maya keyframes or FBX.
- **Models:** Audio2Face models are ONNX, converted to TensorRT; the v3.0 model card states the licence `nvidia-open-model-license` and "ready for commercial/non-commercial use". **Audio2Emotion models are gated on Hugging Face (licence click-through, token, `hf auth login`, then `download_models.sh`/`.bat`).**
- **Repos:** SDK `Audio2Face-3D-SDK` (MIT); `Audio2Face-3D-Samples` (Apache 2.0, covers the NIM); the Unreal plugin is **not a GitHub repo** but zip downloads from developer.nvidia.com: core ACE plugin plus a separate Models plugin, v2.5.0rc3 for UE 5.5 and 5.6, v2.4.0 for 5.4.
- **Not stated anywhere read:** NVIDIA driver version, NIM hardware requirements, and **any UE 5.7 support**. The Maya-ACE and training-framework repos were not read.

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
