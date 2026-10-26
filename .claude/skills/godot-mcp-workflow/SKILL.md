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

## Tools (14, per the README)

`launch_editor`, `run_project`, `get_debug_output`, `stop_project`, `get_godot_version`, `list_projects`, `get_project_info`, `create_scene`, `add_node`, `load_sprite`, `export_mesh_library`, `save_scene`, `get_uid`, `update_project_uids`. The last two need **Godot 4.4+**. The project path must contain a `project.godot`.

## The loop

1. `get_project_info` to learn the structure; do not guess scene paths.
2. Make one change.
3. `run_project` (debug mode), let it run long enough to hit the code path, then `get_debug_output`.
4. If there is an error, read the **file and line it names**, fix that, `stop_project`, repeat.
5. When the output is clean, play-test the behaviour you changed; "no errors" is not "works".

## What it does not do

The tool list has no input simulation, screenshotting or node-property editing beyond what `create_scene` / `add_node` take. Gameplay correctness (does the jump feel right, is the level winnable) still needs a human or a test you write.

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
