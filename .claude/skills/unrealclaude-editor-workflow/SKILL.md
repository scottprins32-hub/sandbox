---
name: unrealclaude-editor-workflow
description: Installs and uses Natfii/UnrealClaude, a plugin that puts the Claude Code CLI inside the Unreal Engine 5.7 editor with an MCP server for actors, levels, Blueprints, materials and assets. Use this whenever the user works in Unreal Engine with Claude, asks about UnrealClaude, the editor MCP server on port 3000, the Claude Assistant panel, unreal_get_ue_context, or wants Claude to place actors, edit Blueprints or build a level - even if they only say "let Claude work in my Unreal project". Covers the security defaults that need changing.
---

# UnrealClaude

Editor-integrated Claude Code for **Unreal Engine 5.7 only** (Windows, Linux, macOS Apple Silicon). MIT. README read 2026-10-26.

## Decide first

- **Engine version must be 5.7.** On 5.4-5.6, this is the wrong tool. If you also want NVIDIA's Audio2Face Unreal plugin (5.4-5.6), see `ai-game-dev-stack` "Version trap".
- **Is it a trusted machine?** Defaults are permissive; see Security.

## Install (build from source, no prebuilt binaries)

1. `npm install -g @anthropic-ai/claude-code` then `claude auth login`.
2. `git clone --recurse-submodules https://github.com/Natfii/UnrealClaude.git` (or `git submodule update --init`).
3. Build with `RunUAT BuildPlugin` (`RunUAT.bat` on Windows, `RunUAT.sh` elsewhere), `-TargetPlatforms=Win64|Linux|Mac`.
4. Copy the output to `YourProject/Plugins/UnrealClaude/` (recommended).
5. `npm install` inside `Resources/mcp-bridge`.
6. Open the editor, **Tools > Claude Assistant**.

## Check it works

The MCP server starts with the editor on **port 3000**. `curl http://localhost:3000/mcp/status` should return project info as JSON. The log category `LogUnrealClaude` should show "MCP Server started" and "Registered X MCP tools". Port 3000 must be free.

## Tools

Categories: actors, level management, Blueprints, Animation Blueprint state machines, assets, characters, materials, Enhanced Input, utilities, async task queue. Named: `unreal_status`, `unreal_get_ue_context` (UE 5.7 API docs by category or keyword; use it before writing engine code from memory). Parameter docs live in the separate ue5-mcp-bridge repo.

## Working rules

- Start each task with `unreal_status`, then `unreal_get_ue_context` for any engine API you are about to use.
- **Blueprint editing is the weak spot**: the README says it has "few bugs" and should not be fully relied on. Inspect the Blueprint after every edit.
- Keep long operations on the async task queue; they time out otherwise.

## Security (change before real use)

- Tools run with `--skip-permissions` by default and the default allowed tools include `Bash` and `Write`.
- `execute_script`, `run_console_command`, `cleanup_scripts`, `get_script_history` are hidden from the model by default but callable by exact name (`HIDDEN_TOOL_NAMES` in `tool-router.js`). Un-hiding `run_console_command` allows arbitrary code through the Python interpreter.
- "Auto-approve script execution" defaults OFF. Leave it off unless the connected client is trusted.

## Known problems

Slow responses in large projects; heavy global Claude Code plugin setups can add 3+ minutes; projects in OneDrive or Dropbox hang (watchdog warns after 60 s); Live Coding is the C++ script compile path.

## Ship checklist

- [ ] Engine is 5.7.
- [ ] `/mcp/status` returns JSON; port 3000 free.
- [ ] Default permissions reviewed and tightened.
- [ ] Hidden tools left hidden.
- [ ] Every Blueprint edit inspected by a human.
- [ ] Project not in a cloud-synced folder.
