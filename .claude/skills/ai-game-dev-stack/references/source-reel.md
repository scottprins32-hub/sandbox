# Source reel, checked against the READMEs

An Instagram Reel (about 66 s, vertical) lists five repos for building a game with Claude Code. Observed by downloading the clip, sampling one frame per second, and transcribing the audio locally. Coverage: every second sampled; fast cuts between samples could be missed. The on-screen repo URLs were read from the frames, not from speech.

| Time | Repo shown on screen | Claim in the reel |
|---|---|---|
| 0:07 | Donchitos/Claude-Code-Game-Studios | "Full studio in a box", 49 agents, creative director, designers, programmers, QA, one session |
| 0:24 | Natfii/UnrealClaude | Places actors, edits Blueprints, builds levels in the editor |
| 0:33 | Coding-Solo/godot-mcp | Builds the scene, plays the game, reads the error, fixes it itself |
| 0:43 | ace-step/ACE-Step-1.5 | Describe the vibe, full soundtrack "in under 10 seconds" |
| 0:52 | NVIDIA/Audio2Face-3D | Voice line in, character face moves and lip-syncs |

READMEs read on 2026-10-26.

- **49 agents:** confirmed (the README also lists 74 skills and 15 hooks, with an inconsistency in how hooks are counted).
- **"Builds levels":** the README lists level management, but also says Blueprint editing has "few bugs" and should not be fully relied on.
- **"Under 10 seconds":** the README gives this for an RTX 3090 and under 2 s on an A100, as the authors' own figures, with no stated methodology.
- **Lip-sync:** confirmed. The README is a hub page; GPU and input-format requirements live in the linked repos.
- **Not mentioned in the reel:** UE version mismatch, ACE-Step weights licence, Audio2Emotion/dataset licence limits, and UnrealClaude's default `--skip-permissions`.
