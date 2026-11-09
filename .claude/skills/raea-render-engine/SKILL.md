---
name: raea-render-engine
description: Decides whether and how to use raea (Render Anything Engine, shinyobjectz/raea), a Rust and Bevy engine where an agent writes videos, motion graphics, 3D scenes or games as React/TypeScript, renders them on the local GPU, and checks the result with `raea check`. Use this whenever the user wants Claude to produce a rendered video, motion-graphics clip, animated explainer or small 3D scene as code, mentions raea or "render anything", asks for a render-check-fix loop on generated video, or is choosing between code-driven rendering and a generative video model - even if they never name the repo. Covers the safe install, the licence, and the pre-release caveats.
---

# raea (Render Anything Engine)

A code-first renderer: you write a composition in TSX, `raea render` turns it into MP4 or a PNG frame on the local GPU, and `raea check` flags problems an agent can then fix. Everything below is from the repo's README, `Cargo.toml`, LICENSE and commit page, read 2026-11-09. Nothing was installed or run, and the claims marked "README" were not checked against the code.

## Decide first

1. **Is the output deterministic and editable?** raea is for work you want as source: exact text, brand colours, timing, charts, simple 3D. If you want photoreal footage or a person on screen, use a generative video model instead; raea does not generate imagery from a prompt.
2. **Is a GPU available?** Required (README: "rendered on your own GPU"; no model named). macOS Apple Silicon, Linux x86_64, and Windows x86_64 ("new and least tested").
3. **Can you live with canary software?** The README says it "changes daily" and to "expect breaking changes, rough edges and gaps in the docs"; recent commits include "work in progress, parked" items. Pin a commit for anything you need to reproduce.
4. **Is the licence acceptable?** **FSL-1.1-ALv2**, not OSI open source: any use except a "Competing Use" (a commercial product or service that substitutes for raea or offers substantially similar functionality). Internal use, education and research are allowed. Each version converts to Apache-2.0 two years after its release. Read `LICENSE` before building a product on it.

## Install safely

The README's installer is `curl -fsSL https://raea.io/install | sh` (and `irm https://raea.io/install.ps1 | iex` on Windows). It writes to `~/.raea`, links `~/.local/bin/raea`, and **adds agent skills to `~/.claude/skills`**, which changes what your agent loads. The install script and the plugin files were not read here. So:

- Download the script, read it, and run it as a separate step; do not pipe it to a shell.
- Prefer building from source, which the README documents:
  ```bash
  git clone https://github.com/shinyobjectz/raea && cd raea
  cargo build --release -p raea-cli --no-default-features
  for d in sdk/raea sdk/react/js sdk/react/tw; do (cd $d && bun install); done
  ```
  Needs Rust (version pinned in `rust-toolchain.toml`), bun, CMake, and per-OS system packages listed in the README (Linux: ALSA, fontconfig, udev, xkbcommon, Vulkan, NASM). `--no-default-features` excludes the hosted Content Credentials signing service that the default build includes (README).
- Set **`RAEA_OFFLINE=1`** to refuse network use. The README says there is no telemetry or update check and that network happens only on request (remote URLs, first-use model downloads, `raea gen` with your provider key); that is a README claim, not verified.
- Before enabling the Claude Code plugin (`/plugin marketplace add shinyobjectz/raea`) or the skills submodule, read `.claude-plugin/` and the skills for hooks or auto-run behaviour. Plugins you load into a composition (`RAEA_PLUGINS`, `~/.raea/plugins`) run inside the engine; sandboxing was not checked.

## The loop

Commands the README names: `raea init`, `raea render FILE -o OUT` (`-o frame.png --frame 45` for a still), `raea play`, `raea check FILE.mp4`, `raea guide`, `raea context PROJECT`, `raea skills install --agent NAME`, plus `raea cut`, `raea gen`, `raea export-game`, `raea sao`, `raea tokensynth`. Run `raea --help` for the live list; the CLI changes daily.

1. Write the composition (`registerRoot(() => <Composition id=… width={1920} height={1080} fps={30} durationInFrames={90} … />)` with `import {...} from "raea"`).
2. **Render a still first**, a frame or two, and look at it before rendering the whole clip.
3. Render the video, then `raea check` it; the README says it checks clipped text, contrast, loudness and freezes.
4. Fix what the check reports, re-render, repeat. A clean check is not a good video: watch it.

raea ships its own craft guides and agent skills (`raea guide`, `raea skills install`). Use those for composition API and craft detail rather than relying on this skill, which deliberately does not duplicate them.

## Failure modes

- A breaking change after you update: pin the commit and re-run your known-good render before upgrading.
- Windows builds: treat as least tested, and the installer needs the Visual C++ Redistributable and a DirectX 12 or Vulkan driver.
- Work-in-progress features seen in recent commits (for example `raea render --layers`, source stamps) are not documented and may change or vanish.

## Not read

`docs/settings.md`, `SECURITY.md`, `CONTRIBUTING.md`, `NOTICE`, the install scripts, `.claude-plugin/`, the `raea-skills` submodule, and any source code. Repo metadata when read: about 1.5k stars, 109 forks, 12 open issues, last commit 2026-11-09.

## Ship checklist

- [ ] Licence read, and the intended use is not a "Competing Use".
- [ ] Install script and plugin/skills files read before running or enabling them.
- [ ] Commit pinned; `RAEA_OFFLINE=1` set unless a network step is needed.
- [ ] A still frame inspected before the full render.
- [ ] `raea check` clean and the video actually watched.
