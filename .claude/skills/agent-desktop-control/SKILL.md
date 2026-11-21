---
name: agent-desktop-control
description: Decides whether and how to let an AI agent operate desktop apps with agent-desktop (vercel-labs/agent-desktop), the Apache-2.0 CLI, MCP server and C library that reads the operating system accessibility tree as JSON with a ref per button, instead of screenshots, on macOS, Windows and Linux. Use this whenever the user wants Claude or any model to click, type in or control a native app, automate a desktop workflow, use "computer use" cheaply, give a non-vision model desktop control, or mentions agent-desktop - even if they never name it. Main caveat - it is real control of your logged-in desktop, and everything it reads goes into the transcript sent to whichever model drives it.
---

# agent-desktop (accessibility-tree computer use)

"Computer use for AI agents: see and operate desktop apps on macOS, Windows, and Linux through the OS accessibility tree." Read 2026-11-21: README, LICENSE, SECURITY.md, CONCEPTS.md, CHANGELOG.md (top), `docs/faq.md`, `npm/package.json`, `npm/scripts/postinstall.js` (download and checksum parts), `skills/agent-desktop/SKILL.md`, `skills/agent-desktop-macos/SKILL.md`, `skills/jev-desktop/SKILL.md`. Version 1.3.1 (2026-11-13); latest commit 2026-11-17. The docs site agent-browser.dev was not read. Nothing was installed or run.

## What it is

A Rust binary. `snapshot` returns an app's UI as JSON with a ref such as `@s8f3k2p9:e8` for each actionable element; `click`, `type`, `set-value`, `toggle` and about 50 more commands act on a ref; you snapshot again to verify. "The loop lives in your agent; agent-desktop has no model inside." Headless by default: ref actions go through the accessibility API without moving the pointer; `--headed` allows physical keyboard and mouse input. Also: `screenshot`, clipboard, notifications, launch and close apps, window moves, `batch`, sessions and traces, and `agent-desktop mcp` (every command as an MCP tool over stdio).

## When to use it, when not

- Use for native apps with a good accessibility tree (Finder, Settings, TextEdit, many Windows and GTK apps), repeatable UI chores, and testing your own app's accessibility.
- Not for web pages: the FAQ says use agent-browser instead. Not for canvas apps, games or anything that "publishes no accessibility tree" (it is "not visible to agent-desktop").
- Not on a machine holding things the agent must not touch (mail, banking, admin consoles) unless it runs in a sandbox or a separate user account.

## Setup (from the README)

```bash
npm install -g agent-desktop          # postinstall downloads the native binary from GitHub Releases, checks sha256
# or: brew install agent-desktop      # macOS and Linux
agent-desktop status                  # platform, permissions, supported surfaces
agent-desktop permissions --guide     # macOS: walks through the Accessibility grant
agent-desktop skills get desktop      # usage guide matching the binary version
agent-desktop skills get platform
```

To avoid the install-time download, `AGENT_DESKTOP_SKIP_DOWNLOAD=1` and fetch the archive yourself; the installer prints `sha256sum` and `gh attestation verify <archive> --repo vercel-labs/agent-desktop` steps. Requirements: macOS 13+, Windows 10 1809+, Ubuntu 24.04+ (X11 or Wayland). MCP config from the README:

```json
{ "mcpServers": { "agent-desktop": { "command": "agent-desktop", "args": ["mcp"] } } }
```

Global flags given to `mcp` (`--session`, `--headed`, `--trace`) apply to every call, so do not register it with `--headed` by default.

Loop: `agent-desktop snapshot --app Finder -i`, then `agent-desktop click @<snapshot>:e8`, then snapshot again. Bare `@e8` is rejected; on `STALE_REF` or `AMBIGUOUS_TARGET` take a new snapshot. Retry only when `error.disposition.retry` is `safe`. For dense apps use `snapshot --skeleton ... --compact`, then `--root <ref>`.

## Licence

Apache-2.0, the whole repository; FAQ: "Yes. It is licensed under Apache-2.0." No paid tier in the repo. The optional JEV helper needs a third-party `TYPESAFE_API_KEY` (paid service, terms not read).

## What goes where

- The CLI itself "does not require a remote model service". A text search of the source found no network telemetry (the word appears only for local logging); the docs site app uses Vercel Analytics. Not proven by running it.
- Everything a snapshot, `get`, `clipboard-get`, `list-notifications` or `screenshot` returns lands in the agent's context and goes to the model provider driving it. With a cheap hosted model (the creator's example is DeepSeek), window titles, document text, chat messages and clipboard contents go to that provider.
- JEV helper (`skills/jev-desktop`, repo clone only): sends "your goal and screen descriptions" to `api.typesafe.ai` by default, or to OpenRouter if configured.
- Local files: traces under the session directory; `session start --screenshots` and `--debug --screenshot PATH.html` keep unredacted screenshots. FAQ: "Redaction does not make a screenshot safe to publish."

## Traps

- Permissions are broad: on macOS the Accessibility grant goes to the launching app (Terminal, iTerm2, VS Code), so every process started from it inherits control. Screen Recording is only needed for screenshots; do not grant it unless used.
- Prompt injection: text on screen (an email, a chat, a web view) can tell the model to click or type something. Keep a human confirmation before send, delete, pay, or any setting change.
- `--headed` and raw `--xy` coordinates have no element identity; on Windows `SendInput` types into whatever window is in front.
- Secrets: password fields marked secure are kept out of output, but text passed to `type` appears in process arguments unless you use `--stdin`; batch JSON always does.
- Isolation: `agent-desktop sandbox` exists only for macOS (a VM on Apple Silicon, set up by hand once). Windows and Linux have no provider; use your own VM or container.
- It refuses to close protected OS processes, but any other app can be closed.

## Creator's claims vs the repo

- "Gives any model... computer control with a list of buttons instead of screenshots" (creator): matches the design; refs come from the accessibility tree, not pixels. It is model-agnostic because it has no model; the repo never mentions DeepSeek and has no model-level benchmarks (`benchmarks/` holds locator-resolution tests only), so how well a small model drives it is unverified. It also has a `screenshot` command and fails on apps without an accessibility tree.

## Not verified

Behaviour on real apps, the agent-browser.dev docs, the `macos` sandbox provider, Linux Wayland headed input, token sizes of snapshots, and any model's success rate.

## Use checklist

- [ ] Task is a native app with an accessibility tree, not a web page.
- [ ] Running in a sandbox, VM or separate account, or the user accepts control of this desktop.
- [ ] Model provider is acceptable for everything visible on screen.
- [ ] Headless default kept; `--headed` only per command when needed.
- [ ] Human confirmation set for irreversible actions; traces and screenshots kept private.
