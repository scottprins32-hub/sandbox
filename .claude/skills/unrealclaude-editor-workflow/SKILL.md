---
name: unrealclaude-editor-workflow
description: Installs and uses Natfii/UnrealClaude, a plugin that puts the Claude Code CLI inside the Unreal Engine 5.7 editor with an MCP server for actors, levels, Blueprints, materials and assets. Use this whenever the user works in Unreal Engine with Claude, asks about UnrealClaude, the editor MCP server on port 3000, the Claude Assistant panel, unreal_get_ue_context, or wants Claude to place actors, edit Blueprints or build a level - even if they only say "let Claude work in my Unreal project". Covers the security defaults that need changing.
---

# UnrealClaude

Editor-integrated Claude Code for **Unreal Engine 5.7 only** (`.uplugin` declares `EngineVersion` 5.7.0, plugin version 1.5.1; default branch is `master`, not `main`) (Windows, Linux, macOS Apple Silicon). MIT. README read 2026-10-26.

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

The README says "20+" tools; the bridge repo (`Natfii/ue5-mcp-bridge`) README lists 29 with an `unreal_` prefix:

- **Context:** `unreal_status`, `unreal_get_ue_context` (UE 5.7 API docs by category or query).
- **Level/actors:** `unreal_open_level`, `unreal_spawn_actor`, `unreal_get_level_actors`, `unreal_set_property`, `unreal_move_actor`, `unreal_delete_actors`, `unreal_get_output_log`, `unreal_capture_viewport` (viewport screenshot).
- **Assets:** `unreal_asset_search`, `unreal_asset_dependencies`, `unreal_asset_referencers`.
- **Blueprints:** `unreal_blueprint_query` (list, inspect, get_graph), `unreal_blueprint_modify` (create, add variables/functions/nodes, connect pins), `unreal_anim_blueprint_modify` (state machines, transitions, animations).
- **Other domains:** `unreal_character`, `unreal_character_data`, `unreal_material`, `unreal_enhanced_input`.
- **Hidden by default:** `unreal_run_console_command`, `unreal_execute_script`, `unreal_cleanup_scripts`, `unreal_get_script_history`, and the async-queue tools `unreal_task_submit/status/result/list/cancel`.

**The two sources disagree on names.** `tool-router.js` uses unprefixed names (`spawn_actor`, `blueprint_query`) and exposes the domain tools through one router tool, `unreal_ue`, with required `domain` (blueprint | anim | character | enhanced_input | material | asset) and `operation` fields plus an optional `params` object (its header notes a token budget cut from 28 tools to 16). Read the tool list your running server actually returns, not the README table. Blueprint and anim operations take a full `blueprint_path`; character data uses `asset_path`/`table_path`; material uses `material_path` + `actor_name`. No C++ source was checked.

## Working rules

- Start each task with `unreal_status`, then `unreal_get_ue_context` for any engine API you are about to use.
- **Blueprint editing is the weak spot**: the README says it has "few bugs" and should not be fully relied on. Inspect the Blueprint after every edit.
- Long operations use an async task queue (README: "won't timeout"). Its `task_*` tools are hidden internal plumbing, so let the router drive them rather than calling them yourself. The only hang guard documented is a watchdog that warns after 60 s.

## Security (change before real use)

- The command the README shows the plugin executing is `claude -p --skip-permissions ...`, and by default Claude is given `Read`, `Write`, `Edit`, `Grep`, `Glob` and `Bash`. The README does not explain the flag; treat the editor session as having shell and file-write access.
- Script execution is gated by a permission dialog.
- `HIDDEN_TOOL_NAMES` in `tool-router.js` is `task_submit`, `task_status`, `task_result`, `task_list`, `task_cancel`, `execute_script`, `cleanup_scripts`, `get_script_history`, `run_console_command`: "callable but never listed", so a model that guesses the exact name can still call them. The file's own comment says `run_console_command` can launch Python (`py ...`), i.e. arbitrary code. Un-hiding `run_console_command` allows arbitrary code through the Python interpreter.
- "Auto-approve script execution" defaults OFF. Leave it off unless the connected client is trusted.

## Licences and prerequisites

Plugin: MIT (`UnrealClaude/LICENSE`, in the plugin subfolder). The bridge README says **MIT with Attribution** (credit "UE5 MCP Server", disclose it if you build another integration on it); its LICENSE file was not read. `.uplugin` dependencies: `EditorScriptingUtilities` (optional) and `EnhancedInput`; `PythonScriptPlugin` is not listed even though scripts can be Python. No Visual Studio version is stated. Linux/macOS have separate INSTALL files in the repo that were not read.

## Known problems

Slow responses in large projects; heavy global Claude Code plugin setups can add 3+ minutes; projects in OneDrive or Dropbox hang (watchdog warns after 60 s); Live Coding is the C++ script compile path.

## Ship checklist

- [ ] Engine is 5.7.
- [ ] `/mcp/status` returns JSON; port 3000 free.
- [ ] Default permissions reviewed and tightened.
- [ ] Hidden tools left hidden.
- [ ] Every Blueprint edit inspected by a human.
- [ ] Project not in a cloud-synced folder.
