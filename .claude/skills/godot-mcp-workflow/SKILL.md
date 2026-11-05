---
name: godot-mcp-workflow
description: Connects Claude Code to Godot with the Coding-Solo/godot-mcp MCP server so it can launch the editor, run a project in debug mode, read console errors, and create scenes and nodes, then runs the run-read-fix loop. Use this whenever the user is building or debugging a Godot project with Claude, wants Claude to run the game and fix its own errors, asks about godot-mcp, GODOT_PATH, run_project or get_debug_output, or needs to create scenes, add nodes or load sprites programmatically - even if they just say "make this Godot game work".
---

# Godot MCP workflow

The point is the loop: **run the project, read the debug output, fix the code, run again**. Scene-building tools are secondary.

## Install

Requirements: Godot installed, Node.js >= 18, an MCP-capable client.

```bash
claude mcp add godot -- npx @coding-solo/godot-mcp
# if Godot is not auto-detected, or you want server logs:
claude mcp add godot -e GODOT_PATH=/path/to/godot -e DEBUG=true -- npx @coding-solo/godot-mcp
```

From source: `git clone https://github.com/Coding-Solo/godot-mcp.git && cd godot-mcp && npm install && npm run build`, then point the client at `build/index.js`. Check `/mcp` in Claude Code to confirm the server is connected before relying on it.

**Package-name mismatch:** the README's install commands use the scoped `@coding-solo/godot-mcp`, but `package.json` names the package `godot-mcp` (version 0.1.1). Run `npm view @coding-solo/godot-mcp` first and confirm the publisher before `npx` executes anything.

## Tools (14, confirmed from `src/index.ts`)

| Tool | Required params | Notes |
|---|---|---|
| `launch_editor` | `projectPath` | |
| `run_project` | `projectPath` | optional `scene` |
| `get_debug_output` | none | stdout/stderr text of the running project |
| `stop_project` | none | |
| `get_godot_version` | none | |
| `list_projects` | `directory` | optional `recursive` |
| `get_project_info` | `projectPath` | |
| `create_scene` | `projectPath`, `scenePath` | optional `rootNodeType` |
| `add_node` | `projectPath`, `scenePath`, `nodeType`, `nodeName` | optional `parentNodePath`, `properties` (set on the new node) |
| `load_sprite` | `projectPath`, `scenePath`, `nodePath`, `texturePath` | sets a texture on an existing Sprite2D |
| `export_mesh_library` | `projectPath`, `scenePath`, `outputPath` | optional `meshItemNames` |
| `save_scene` | `projectPath`, `scenePath` | optional `newPath` |
| `get_uid` | `projectPath`, `filePath` | Godot 4.4+ |
| `update_project_uids` | `projectPath` | Godot 4.4+ |

The project path must contain a `project.godot`. Only the UID tools have a stated Godot minimum (4.4); no overall minimum is stated. The scene operations run through `src/scripts/godot_operations.gd`, which was not read, so their edge-case behaviour (existing nodes, overwrites) is unverified: inspect the saved `.tscn` after each change.

## The loop

1. `get_project_info` to learn the structure; do not guess scene paths.
2. Make one change.
3. `run_project` (debug mode), let it run long enough to hit the code path, then `get_debug_output`.
4. If there is an error, read the **file and line it names**, fix that, `stop_project`, repeat.
5. When the output is clean, play-test the behaviour you changed; "no errors" is not "works".

## What it does not do

Confirmed from source: **no tool sends input** (keyboard, mouse, simulated), **none takes screenshots**, and there is **no generic "set property on an existing node" tool**; the only output channel is the text from `run_project` + `get_debug_output`. Gameplay correctness (does the jump feel right, is the level winnable) still needs a human or a test you write.

## Failure modes

- Godot not found -> set `GODOT_PATH`.
- Build fails -> run `npm install` first.
- UID errors on older Godot -> those tools require 4.4+.
- A run that never exits -> call `stop_project` before starting another.

## Ship checklist

- [ ] `/mcp` shows `godot` connected.
- [ ] A deliberately broken line produces an error in `get_debug_output` and Claude fixes it.
- [ ] Godot version recorded; UID tools not used below 4.4.
- [ ] Changes verified by running, not just by a clean log.
