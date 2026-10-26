---
name: ai-game-dev-stack
description: Routes an AI-assisted game build across five open-source tools - Claude Code Game Studios (agents and process), Godot MCP or UnrealClaude (engine control), ACE-Step 1.5 (music) and NVIDIA Audio2Face-3D (character lip-sync) - and says which to pick, in what order, and what to verify first. Use this whenever the user wants to build, prototype or scaffold a game with Claude Code, asks how to get art, code, music and animation from AI, mentions Godot, Unreal, game jams, a "game studio" setup, or game soundtrack and lip-sync tooling, even if they never name these repos.
---

# AI game-dev stack

Five tools cover four jobs. Pick per job, not all five: each one adds install weight, a licence to read and a trust decision.

| Job | Tool | Skill | Use when |
|---|---|---|---|
| Process, roles, review gates | Donchitos/Claude-Code-Game-Studios | `claude-code-game-studios` | You want structure around a longer project, not a one-file prototype |
| Engine control (2D / small 3D) | Coding-Solo/godot-mcp | `godot-mcp-workflow` | Godot project; Claude should run it and fix its own errors |
| Engine control (Unreal) | Natfii/UnrealClaude | `unrealclaude-editor-workflow` | Unreal Engine **5.7**, work happens inside the editor |
| Music | ace-step/ACE-Step-1.5 | `ace-step-game-music` | Soundtrack or loops generated locally from a text description |
| Character face animation | NVIDIA/Audio2Face-3D | `audio2face-character-lip-sync` | Voiced characters with a 3D face rig |

## Decide first

1. **Which engine?** Godot is the shortest path (one `npx` command, MIT, small). Unreal means building a plugin from source against 5.7 only. Do not run both.
2. **Is the game voiced and 3D?** If not, skip Audio2Face entirely. It needs a face rig with blendshapes or joints.
3. **Does it ship?** Then read the licence section of each tool you adopt before generating assets. See "Licences" below.
4. **Prototype or project?** A weekend prototype wants one engine tool and nothing else. The studio template pays off only when there are enough decisions that you want review gates.

## Version trap

UnrealClaude supports **UE 5.7 only**. NVIDIA's Audio2Face-3D Unreal plugin is listed for **UE 5.4-5.6** (v2.5 plugin links to 5.5 and 5.6 builds). The two do not currently overlap on one engine version. If you want both, decide which matters more, or export animation from Audio2Face (Maya / FBX route) instead of using its Unreal plugin.

## Order of work

1. Pick engine and scaffold the project.
2. Get the **run -> read error -> fix** loop working before adding assets. That loop is the real value of the engine tools.
3. Add music last-but-one: it is cheap to regenerate, so do not tune it early.
4. Add face animation only when voice lines are final; re-recording invalidates it.

## Licences (verify, do not assume)

- Code: Game Studios, godot-mcp, UnrealClaude are MIT; ACE-Step code is MIT; Audio2Face SDK and plugins MIT, training framework Apache.
- **ACE-Step model weights: the README does not state a licence or commercial-use terms.** Read the Hugging Face model card before shipping generated music.
- **Audio2Face models** use NVIDIA's "Nvidia Open Model" licence; the **Audio2Emotion models may only be used with Audio2Face**; the **sample dataset is evaluation-only**; the **NIM container** is under NVIDIA's AI product terms, not MIT.

## Trust before you run

These repos install hooks, agents, plugins or MCP servers that execute with your permissions. Read what they add (`.claude/settings.json`, hooks, `tool-router.js`) before the first run. Do not set auto-approve or `--skip-permissions` flags on a machine you would not want a script to reach.

## What the source reel claims vs. the READMEs

See `references/source-reel.md`. Short version: the reel is accurate on counts (49 agents) and the ACE-Step speed (authors' own RTX 3090 figure), but says "builds levels" for Unreal where the README warns Blueprint editing has bugs, and omits the 5.7 / 5.6 mismatch above.

## Verification status

Each tool skill was checked against the repo README (and, for ACE-Step, `docs/en/INFERENCE.md`) on 2026-10-26. Nothing here was installed or run. Statements marked as judgement are mine, not the projects'. Re-read the README before relying on any version, flag or requirement.

## Ship checklist

- [ ] One engine tool chosen; the other is not installed.
- [ ] Each adopted repo's licence read, with weights/model terms checked separately from code.
- [ ] Hooks / plugin scripts reviewed before first run.
- [ ] Run-and-fix loop demonstrated on a deliberate error.
- [ ] Generated music and face data recorded with source, model version and licence in the repo.
