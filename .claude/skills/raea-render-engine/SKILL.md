---
name: raea-render-engine
description: Decides whether and how to use raea (Render Anything Engine, shinyobjectz/raea), a Rust and Bevy engine where an agent writes videos, motion graphics, 3D scenes or games as React/TypeScript, renders them on the local GPU, and checks the result with `raea check`. Use this whenever the user wants Claude to produce a rendered video, motion-graphics clip, animated explainer or small 3D scene as code, mentions raea or "render anything", asks for a render-check-fix loop on generated video, or is choosing between code-driven rendering and a generative video model - even if they never name the repo. Covers the safe install, the licence, and the pre-release caveats.
---

# raea (Render Anything Engine)

A code-first renderer: you write a composition in TSX, `raea render` turns it into MP4 or a PNG frame on the local GPU, and `raea check` flags problems an agent can then fix. Everything below is from the repo's own files, read 2026-11-09: README, `Cargo.toml`, LICENSE, the two install scripts, `.claude-plugin/`, `SECURITY.md`, `NOTICE`, `docs/settings.md`, `rust-toolchain.toml`, and the `raea-skills` repo. Claims marked "README" were not checked against the code.

## Decide first

1. **Is the output deterministic and editable?** raea is for work you want as source: exact text, brand colours, timing, charts, simple 3D. If you want photoreal footage or a person on screen, use a generative video model instead; raea does not generate imagery from a prompt. If what you need is a 3D object as a file (GLB, STL, URDF, USD) rather than a rendered clip, use `sand3d-modeling`.
2. **Is a GPU available?** Required (README: "rendered on your own GPU"; no model named). macOS Apple Silicon, Linux x86_64, and Windows x86_64 ("new and least tested").
3. **Can you live with canary software?** The README says it "changes daily" and to "expect breaking changes, rough edges and gaps in the docs"; recent commits include "work in progress, parked" items. Pin a commit for anything you need to reproduce.
4. **Is the licence acceptable?** **FSL-1.1-ALv2**, not OSI open source: any use except a "Competing Use" (a commercial product or service that substitutes for raea or offers substantially similar functionality). Internal use, education and research are allowed. Each version converts to Apache-2.0 two years after its release. Read `LICENSE` before building a product on it.

## Install safely

The README's installer is `curl -fsSL https://raea.io/install | sh` (and `irm https://raea.io/install.ps1 | iex` on Windows). What the scripts actually do, read from their source:

- Download a release tarball from GitHub and verify it against a **SHA-256 file fetched from the same release**. That catches a corrupt download, not a tampered release: there is no signature check.
- Replace `~/.raea/bin` and `~/.raea/share` (`rm -rf` first), and link `~/.local/bin/raea`.
- Copy each bundled skill into **`~/.claude/skills/<name>`, deleting any existing folder of the same name first**, which changes what your agent loads. `RAEA_NO_SKILLS` skips this.
- POSIX: does not edit shell rc files (it only prints a suggested PATH line). macOS: strips the quarantine flag from the whole install. **Windows: permanently prepends to your User PATH.**
- Run nothing from the download itself.

So:

- Download the script, read it, and run it as a separate step; do not pipe it to a shell. Back up any skill in `~/.claude/skills` that shares a name with raea's.
- Prefer building from source, which the README documents:
  ```bash
  git clone https://github.com/shinyobjectz/raea && cd raea
  cargo build --release -p raea-cli --no-default-features
  for d in sdk/raea sdk/react/js sdk/react/tw; do (cd $d && bun install); done
  ```
  Needs Rust **1.99.1** (pinned in `rust-toolchain.toml`; rustup installs it inside the checkout), bun, CMake, and per-OS system packages listed in the README (Linux: ALSA, fontconfig, udev, xkbcommon, Vulkan, NASM). `--no-default-features` excludes the hosted Content Credentials signing service that the default build includes (README).
- Set **`RAEA_OFFLINE=1`** to refuse network use. `docs/settings.md` defines it: no uncached remote URLs, no model or sample downloads, no `fetch()`/WebSocket from a composition, no `raea gen`; what is on disk keeps working. Settings are read from the environment, then `~/.raea/env`. Note the defaults that *do* use the network: audio models install on first use (`RAEA_AUDIO_AUTOSETUP=0` turns that off; the TokenSynth cache is about 6 GB), and `raea check` can call a judge model on Cloudflare Workers AI if `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` are set. "No telemetry" and the hosted Content Credentials signing service appear only in the README; no doc or source read here confirms either.
- **The Claude Code plugin** (`/plugin marketplace add shinyobjectz/raea`) declares only a skills path: no hooks, MCP servers, commands or agents. Its bundled `raea` skill adds a hook only if you opt in (`raea skills install --agent claude --pin quieter` adds one that runs `raea check --quick` after a save).
- **The separate `raea-skills` repo is different.** Its `.claude/settings.json` has an automatic `PreToolUse` hook (`monty guard`) on every write or edit, and its `.mcp.json` starts an MCP server through `uvx` from **another repo's unpinned `main` branch**. These load only if you open Claude Code inside a checkout of that repo, so don't, unless you have read them.
- Plugins you load into a composition (`RAEA_PLUGINS`, `~/.raea/plugins`) run inside the engine; the raea skill says feed artifacts run sandboxed, which was not checked.

## The loop

Commands the README names: `raea init`, `raea render FILE -o OUT` (`-o frame.png --frame 45` for a still), `raea play`, `raea check FILE.mp4`, `raea guide`, `raea context PROJECT`, `raea skills install --agent NAME`, plus `raea cut`, `raea gen`, `raea export-game`, `raea sao`, `raea tokensynth`. Run `raea --help` for the live list; the CLI changes daily.

1. Write the composition (`registerRoot(() => <Composition id=… width={1920} height={1080} fps={30} durationInFrames={90} … />)` with `import {...} from "raea"`). Shapes and text are plain `div`s with `style` objects; animate with `useCurrentFrame()` + `interpolate`/`spring`, and time scenes with `<Sequence from=… layout="none">`. **Pass `{ extrapolateRight: "clamp" }` to `interpolate`**: the default is `"extend"`, so the root README's hello example keeps raising opacity past 1 after its last keyframe. `registerRoot` may be called once, and the registry does not look inside components that use hooks, so keep `<Composition>` at the top of the root. **The JS runtime has no `Intl`**: `toLocaleString()`, `Intl.NumberFormat` and locale date formatting typecheck but throw `ReferenceError: Intl is not defined` at render time (seen on commit b85409d), so format numbers and dates by hand.
2. **Render a still first**, a frame or two, and look at it before rendering the whole clip.
3. Render the video, then `raea check` it (needs `ffprobe` on PATH). From `apps/check/src/lib.rs`: on the file alone it checks loudness and true peak, sound that stops dead, freezes, flashing, dark-area blotching and a placeholder brand kit. **Text checks (clipped text, text in platform UI zones, too briefly on screen, caption contrast) need `--manifest render.json`**; voice-versus-bed checks need `--words`. Issues are ranked P0 (breaks the piece) to P3; exit code 1 means a P0 or P1 was found; `-o check.json` writes them as JSON.
4. Fix what the check reports, re-render, repeat. A clean check is not a good video: watch it.

raea ships its own craft guides and agent skills (`raea guide`, `raea skills install`). Use those for composition API and craft detail rather than relying on this skill, which deliberately does not duplicate them.

## Example

`examples/pitch-breakdown.tsx` is a 5-second baseball graphic: a pitch flies from release into a strike zone with an impact ring, then velocity, spin and break cards spring in with counting numbers. The numbers are illustrative for a fictional pitcher. It uses only exports confirmed in the SDK source, follows the 60/30/10 colour split (`color-proportion-60-30-10`), and every text colour clears 4.5:1 (lowest: the orange figures on the panels, 5.20:1). It **typechecks with zero errors** against raea's own `tsconfig.check.json`, with the check confirmed to cover the file by planting two wrong props and seeing both rejected.

**Rendered on a machine with no GPU** (2026-11-09, commit b85409d). The release build of `raea-cli` with `--no-default-features` took 26 minutes on 4 cores. Rendering then ran on Mesa's software Vulkan driver (lavapipe/llvmpipe; on Debian/Ubuntu, `mesa-vulkan-drivers`, plus `vulkan-tools` to see it with `vulkaninfo`), which the docs do not mention. The first render refused at frame 100 with the `Intl` error above. Once that was fixed, a still took about 9 s wall-clock (284 ms a frame in React and bevy_ui): `examples/pitch-breakdown-frame100.png`. Bevy prints hundreds of harmless `CommandQueue has un-applied commands` warnings, so filter them out. Each render also prints an EXPOSURE line; on this deliberately dark design it warns "-2.9 stops under mid grey", which is advice, not a failure. The full 150-frame mp4 (H.264 via OpenH264, 1920×1080, 30 fps, 520 KB) rendered in about 10.6 s at about 65 ms a frame, so the CPU path is usable for short motion graphics.

**The check loop, as it actually ran:**

- `raea check` on the file alone said "nothing to fix", but it only ran freeze, flashing and blotching. There is no audio, so loudness was skipped.
- Re-rendering with `--manifest render.json` (a `raea render` flag) and checking with `--manifest render.json --shape 16:9` found three issues:
  - Two P1 safe-area issues: the title sat at 96 px from the top, and the last card ended near y=983. The UI zones are 120 px top and bottom, 60 px at the sides.
  - One P2: "964 rpm" was on screen for 0.2 s, an in-between value of the count-up.
- Moving the title to 130 and tightening the cards cleared both P1s, and the check exits 0.
- The P2 remains. Any count-up animation will trip it, because its in-between values are not meant to be read; leave it, or drop the count-up if it has to be clean.

**Lessons:**

- A file-only check can look clean while the text checks never ran.
- After the check passed, a contact sheet of every 10th frame (`examples/pitch-breakdown-contact-sheet.png`) was the "actually watch it" step. The finished render is `examples/pitch-breakdown.mp4`.

## Failure modes

- A breaking change after you update: pin the commit and re-run your known-good render before upgrading.
- Windows builds: treat as least tested, and the installer needs the Visual C++ Redistributable and a DirectX 12 or Vulkan driver.
- Work-in-progress features seen in recent commits (for example `raea render --layers`, source stamps) are not documented and may change or vanish.

## Not read

`CONTRIBUTING.md`, the engine and CLI source, the `raea-skills` repo's `scripts/`, `.github/`, `justfile`, `.monty/` and reference guides. `SECURITY.md` only says to report vulnerabilities privately through GitHub's Security tab. Repo metadata when read: about 1.5k stars, 109 forks, 12 open issues, last commit 2026-11-09.

## Ship checklist

- [ ] Licence read, and the intended use is not a "Competing Use".
- [ ] Install script read and run as its own step, not piped; same-named skills in `~/.claude/skills` backed up.
- [ ] Claude Code not opened inside a `raea-skills` checkout unless its hook and MCP server were read.
- [ ] Commit pinned; `RAEA_OFFLINE=1` set unless a network step is needed.
- [ ] A still frame inspected before the full render.
- [ ] Rendered with `--manifest render.json` and checked with the same `--manifest` (plus `--shape`/`--platform`), so the text, safe-area and contrast checks actually ran.
- [ ] `raea check` clean and the video actually watched.
- [ ] No `Intl`/`toLocaleString` in the composition.
