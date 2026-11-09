---
name: sand3d-modeling
description: Writes 3D objects as short Python programs with sand3d (Sandflow-ai/sand3d), a library over Blender's bpy built for LLMs - profiles, solids, edits, frames, joints and assemblies - then exports GLB, URDF, USD, OBJ or STL and renders a preview to check the result. Use this whenever the user wants Claude to model a 3D object, part, prop, product mock-up, articulated mechanism or robot-simulation asset as code, asks for a GLB, STL, URDF or USD file, wants a parametric or printable part, mentions sand3d, Sandflow or "3D modeling in Python", or is choosing between writing geometry as code and a generative 3D model - even if they never name the library. Covers the install, the Python-version trap, the rules for assembly programs, and a CPU-only render script.
---

# sand3d (3D modeling in Python, built for LLMs)

You write a short Python program (`import sand3d as s3d`) that says how an object is made, part by part; sand3d builds it in Blender's `bpy` module and exports it. Everything below is from the repo at commit `84c980a` (version 1.6.3, read 2026-11-09) and from running it: README, `docs/api.md`, `docs/guidelines.md`, `pyproject.toml`, `SECURITY.md`, `CONTRIBUTING.md`, the publish workflow, and the library source for imports. Claims marked "README" were not checked.

## Decide first

1. **Is the object something you can describe by how it is made?** sand3d suits hard-surface things: brackets, furniture, appliances, tools, mechanisms, props. It has no sculpting, no constraint solver and no cloth (CONTRIBUTING). For organic shapes, characters or photoreal assets from a prompt, use a generative 3D model or an artist instead.
2. **Do you need the result as source?** The point is an editable, parametric program with named parts and joints. If a one-off mesh is enough and nobody will change it, this is still fine, just less of an advantage.
3. **Do you need exact CAD?** The output is a mesh, not B-rep: no STEP or IGES export. For toleranced manufacturing drawings use real CAD (CadQuery, Onshape). STL for 3D printing works.
4. **Is very new software acceptable?** First public release was 1.6.1 on 2026-11-04; 1.6.3 followed two days later. Semantic versioning, and the stated rule is that "the vocabulary only grows" outside a major version. Pin the version.
5. **Licence:** Apache-2.0 for the library. The five datasets on Hugging Face are CC BY 4.0 (README).

## Install

```bash
uv venv -p 3.13 .venv && uv pip install -p .venv 'sand3d==1.6.3'
```

- **Python 3.13 (bpy 5.2) or 3.11 (bpy 4.5) only.** There is no `bpy` wheel for 3.12, and none for Intel Macs from 5.2 on (use 3.11 there). `pip install` on 3.12 fails to resolve.
- Blender arrives as the `bpy` wheel; no separate Blender install. Measured: 75 s to install, and the environment is about 1 GB.
- **What was checked:** the PyPI 1.6.3 package is byte-identical to `src/sand3d` in the repo at the release commit. The library imports only `bpy`, `bmesh`, `mathutils` and the standard library, with no network, subprocess, `eval` or `exec` calls. PyPI releases come from GitHub trusted publishing, with no stored token. `bpy` itself pulls in `numpy`, `requests`, `cython` and `zstandard`.
- **A sand3d program is ordinary Python with your rights** (SECURITY.md says the same). Read a program before running it, and run model-written or downloaded programs in a sandbox.
- No GPU or display is needed to build, export or render with Cycles on the CPU.

## The loop

1. **Read `references/api.md` first.** It is the whole API (about 3,600 tokens, README), copied from the repo, with six rules of placement and joints at the top. For a newer sand3d, read the upstream file instead.
2. **Write the program by the eight assembly rules** (below).
3. **Build and render a preview, then look at it.** sand3d has no renderer. `scripts/render_preview.py` builds a program's function, frames it, and renders a PNG with Cycles on the CPU:
   ```bash
   .venv/bin/python scripts/render_preview.py PROGRAM.py FUNCTION out.png \
       [--pose JOINT=VALUE ...] [--view AZ,EL] [--zoom F] [--look X,Y,Z] [--size WxH] [--samples N] [--ground "#hex"|none]
   ```
   Render each part's function on its own for a close-up, then the whole assembly. Pose each joint to an end of its range and render again: a wrong axis sign only shows when the joint moves.
4. **Fix and repeat.** Errors name the mistake and the line (examples below).
5. **Export:** `s3d.export(root, "name.glb")`, or `.urdf`, `.usda`, `.obj`, `.stl`. Lengths come out in metres. For `.usd`, `.usdc` or `.usdz`, convert the `.usda` with USD's own tools.

## The eight rules for an assembly program

From `docs/guidelines.md`, which draws them from a review of generated programs and says they "have not been tested as a prompt". Read that file for the worked right and wrong examples.

1. **The first function is the table of contents.** Named after the object, it builds no geometry: it calls the parts, places them, declares the joints, and returns `s3d.assembly(...)`.
2. **One function per distinct part**, built about its own origin, returning one object. Fused pieces: `join`. Separate pieces that move together: `group`. Pieces that move against each other: `joint`.
3. **Name each dimension once** as a keyword argument, and derive the rest from it. Aim for about 15 numbers a part.
4. **Place each part once, in its parent's frame.** Prefer a frame (`ob.face("+Z")`, `bbox`, `local`) over coordinates.
5. **Repeat with frames, mirror with a copy:** `on=s3d.grid(...)`, `ring(...)`, `along(...)`; the other side is `s3d.transform(s3d.copy(part), mirror="x")`. No cos and sin in a loop for copies.
6. **Use the verb that names the shape:** `revolve`, `shell`, `hole`, `wire`, `loft` with `station`. No `bpy` or `bmesh` in a program.
7. **Set materials** with `s3d.material(ob, kind, color="#rrggbb")` when appearance matters, before the part is repeated.
8. **One frame per joint:** `f = s3d.local(parent, x, y, z)`, then the same `f` goes to `s3d.at(child, on=f)` and `s3d.joint(name, child, f, ...)`. Build at rest; do not `pose` inside the program.

## What running it showed

Found by writing and running `examples/baseball_kit.py`, not from the docs.

- **Frame axes on a side-facing frame are easy to get backwards.** On a frame whose normal is horizontal, its Y is up and its X is `Z × normal`. A `rect(w, d)` extruded on such a frame has `d` vertical, and `.move(y=...)` moves up. The first draft had a tall plate lying sideways; the render showed it at once.
- **Solids start on z = 0**, a sphere included: its centre is at `d / 2`, not the origin.
- **Every copy made by `on=[frames]` is its own mesh.** Two baseballs with 88 stitches each gave 205 mesh files beside the URDF. `s3d.merge(seam, ticks)` (no boolean) cut that to 29, but the GLB grew from 2.5 MB to 5.9 MB, because the copies no longer share one mesh. Merge for simulators, keep copies for small web files.
- **Sub-assemblies nest.** `s3d.at(sub_assembly(), x=...)` accepts what `s3d.assembly` returns, and joints declared inside it keep working.
- **Anything can ride a joint.** The pitched ball is a prismatic joint from the machine to the plate, so `pose` moves it. `follows="wheel_top_spin", ratio=-1` makes the second wheel counter-rotate and exports as a URDF `<mimic>`.
- **What the files carry:** the GLB puts each joint in its node's `extras.s3d_joint` (type, axis, limits in metres and radians, mimic), in glTF's Y-up axes, on a node named after the joint whose child is the moving part. **The GLB mixes units:** node positions stay in the program's unit (millimetres) under a root scaled by 0.001, while the joint limits are in metres. A viewer that slides a prismatic joint must divide by the parent's world scale; the first draft of `examples/viewer.html` moved the ball 1 mm instead of 1 m. The axis is in the joint node's own frame. The URDF has one link per moving part and limits with `effort="0" velocity="0"`: sand3d does not state masses, inertias or drives, so add them before simulating dynamics.
- **The Blender scene is in the program's unit.** In millimetres the scene is 1000 times "too big" for Blender's defaults, so a hand-written camera needs its clip range raised. The render script handles this.
- **Builds are deterministic** (checked): two fresh processes gave identical SHA-256 for the STL, GLB and URDF. `s3d.fingerprint()` and `s3d.__version__` identify the library that built a file.
- **Harmless noise:** `Draco is not available` and `MeshOptimizer is not available` on stderr (the GLB is simply uncompressed), plus glTF `INFO` lines. Filter them.
- **Errors are specific.** Seen: `at: 't' was used up by cut(a, ...) on line 8 ... pass s3d.copy(t)`; `pose 'j': 120° is outside its range (0, 90)`; `a has no edge named ['rim']; its edge names: [...]`; `at: 'b' moves by its joint 'j' ... s3d.transform it`; `at() on line 20 placed a profile that nothing used; write p = s3d.at(p, ...)`. Read the message before changing the program.
- **Speed, 4 CPU cores, no GPU:** the kit (29 meshes, 6 joints) builds and exports four formats in about 7 s. A 1280×720 preview at 32 samples takes about 15 s. The 90-frame animation at 960×540 and 24 samples took 10 min 49 s, while other renders shared the CPU.

## Example

`examples/baseball_kit.py` is a baseball practice kit in about 150 lines: a regulation home plate, a 34-inch bat (one `revolve` of a spline), baseballs whose seam is a `wire` along a 3D spline loop with 88 stitches placed by `along`, a batting tee, and a two-wheel pitching machine on a tripod. Six joints: the tee slides, the machine swivels and tilts, the wheels counter-rotate, and the pitched ball travels to the plate. It follows the eight rules, with one exception: `batting_tee` and `pitching_machine` are sub-assemblies that declare their own joints, so each can be built and rendered alone. Sizes are regulation where the rules give one and plausible otherwise; it is an illustration, not a product drawing.

```bash
.venv/bin/python examples/baseball_kit.py out_dir     # baseball_kit.glb, .urdf, .usda, .stl
.venv/bin/python scripts/render_preview.py examples/baseball_kit.py baseball_kit hero.png \
    --view 238,13 --look 850,0,650 --ground "#b9805a" --pose pitch_flight=950 --pose tilt=6
.venv/bin/python scripts/render_preview.py examples/baseball_kit.py baseball ball.png --view 30,20 --size 800x800
```

`examples/baseball_kit_animate.py` poses the joints frame by frame and renders each frame; join them with ffmpeg. `examples/renders/` holds the results: `hero.jpg`, `closeups.jpg` (ball, machine posed, bat) and `baseball_kit.mp4`.

`examples/viewer.html` is a web page that loads the GLB with three.js, builds a slider for each joint from `extras.s3d_joint`, and moves the parts live. It expects `baseball_kit.glb.json`, `hero.jpg` and `baseball_kit.mp4` beside it. It was tested in headless Chromium at desktop and phone widths, then published as a Claude artifact.

The model is wrapped as base64 in JSON because Claude artifacts do not serve `.glb` files (the publish was refused), and the page decodes it and hands the bytes to `GLTFLoader.parse`. To make the wrapper:

```bash
python3 -c "import base64,json,sys; json.dump({'glb': base64.b64encode(open(sys.argv[1],'rb').read()).decode()}, open(sys.argv[1]+'.json','w'))" baseball_kit.glb
```

The page uses three.js 0.147.0, the last release line with plain-script builds of the loader and controls, which is what a page limited to CDN script tags needs.

## Claims not checked

- "2 to 6× fewer tokens than Blender Python, CadQuery or FeatureScript" (README). The repo's `docs/readme/tokens.md` gives the method: the authors' own sand3d programs, counted with `o200k_base`, code only, over 30, 17, 13 and 12 objects. Their measurement, not reproduced here.
- The Hugging Face datasets, the explorer and the docs site were not opened.
- bpy 4.5 on Python 3.11, macOS and Windows were not run. Everything here ran on Linux x86_64, Python 3.13, bpy 5.2.3.
- The repo's own test suite and its example programs (`programs/`, `docs/examples/`) were read but not executed.

## Related

- For a rendered video or motion graphic written as code, see `raea-render-engine`.
- For getting a model into a game (Godot, Unreal), see `ai-game-dev-stack`; a sand3d GLB is one way to make the props.

## Ship checklist

- [ ] Python 3.13 or 3.11, never 3.12; `sand3d` version pinned.
- [ ] The program was read before it was run, and untrusted programs run in a sandbox.
- [ ] First function is the object's head; one function per part; no `bpy` in the program.
- [ ] Every part rendered and looked at, then the whole assembly.
- [ ] Every joint posed to both ends of its range and rendered: the axis sign is right and nothing tears off.
- [ ] Mesh count checked for the target (merge repeated details for URDF; keep copies for a small GLB).
- [ ] For simulation: masses, inertias and drive limits added, since the URDF has none.
- [ ] Export opened in the tool that will use it.
