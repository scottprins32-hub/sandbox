---
name: remotion-react-video
description: Makes videos with React code using Remotion (remotion-dev/remotion): project setup, compositions driven by useCurrentFrame, interpolate and spring, rendering to MP4 or stills, audio, fonts, captions, cloud rendering, and the licence and per-seat or per-render pricing that applies to companies and to Claude Code users. Use this whenever the user wants programmatic or templated video in React, animated explainers, social clips from data, batch-rendered videos, or mentions Remotion - even if they never name it. Flags that Remotion is source-available, not open source, and says when to use raea-render-engine instead.
---

# Remotion (videos as React code)

"Make videos programmatically with React." Read 2026-11-11 from the README, LICENSE.md, the license FAQ, pricing and terms pages, and many docs pages (CLI, config, core API, media, fonts, delayRender, AI skills, Lambda, Cloud Run). The Composition, AbsoluteFill, Sequence, captions and OffthreadVideo reference pages and the cloud setup pages were not read. Latest release seen: v4.0.542 (9 Nov). Nothing was installed or rendered.

## Decide first: the licence is not open source

Remotion is source-available. The FAQ says "it is not open source software." Terms for v5.0 are announced and "will slightly change" the licence.

- **Free:** individuals, for-profit organisations with up to 3 people, non-profits (with exceptions such as government and educational bodies), and evaluation. Free use covers commercial work.
- **Company licence when headcount reaches 4**, counting all personnel including part-timers and contractors:
  - Remotion for Creators: $25 per seat per month. A seat is anyone who writes Remotion code themselves **or uses agentic coding tools such as Claude Code**.
  - Remotion for Automators: $0.01 per render, billed in 1000-render ($10) increments, minimum $100 per month; Enterprise from $500 a month.
- **Automation counts:** owning code that calls `renderMedia`, `renderStill`, `npx remotion render`, Lambda or Cloud Run renders, or uses `<Player>` is "automation". Previews in Studio do not count as renders.
- Services may generate Remotion code with AI and render it for customers, but users may not upload their own Remotion code to a rendering service.
- **Telemetry:** client-side render telemetry is on and "cannot be disabled"; Automators will have mandatory server-side telemetry from v5.0.
- Codec patents are not covered by the licence. FFmpeg is bundled under GPLv2+.

If the user has a team of four or more, or runs it in a product, this decision comes before any code.

## Remotion or raea?

Both are code-to-video. Remotion has a large ecosystem, the Studio, captions, Lambda rendering and official agent skills, but is a Node and headless-Chrome pipeline under the licence above. `raea-render-engine` is Rust, GPU-based, canary and FSL-licensed. Pick on licence, platform and how much you need the Remotion ecosystem.

## Start

```bash
npx create-video@latest --yes --blank my-video && cd my-video
npx remotion skills add          # official agent skills (also: npx skills add remotion-dev/skills)
npm run dev                      # Studio
```

Needs Node 16+ (or Bun 1.0.3+), macOS 15+, Linux with glibc 2.35 or newer (no Alpine or nixOS). Chrome Headless Shell and FFmpeg ship with Remotion; on Linux the shared libraries listed in the docs are needed.

## The core (verified from the docs)

```tsx
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
export const FadeIn = () => {
  const frame = useCurrentFrame();            // 0-indexed; relative to the parent Sequence
  const opacity = interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', fontSize: 80}}><div style={{opacity}}>Hello</div></AbsoluteFill>;
};
// registered with: <Composition id="FadeIn" component={FadeIn} durationInFrames={60} fps={30} width={1280} height={720} />
```

- **Everything must be a function of the frame.** CSS animations, transitions, `@keyframes` and `setTimeout` do not work, because each frame renders independently.
- `interpolate` defaults to `extend`, so values run past their range: clamp both sides.
- `spring({frame, fps, config: {damping, stiffness}})` for natural motion; delay with `frame - n` or `delay`.
- `<Sequence from durationInFrames>` offsets time for its children.
- Images: `<Img src={staticFile('a.png')} />`, which waits for loading. Video and audio: `<Video>` and `<Audio>` from `@remotion/media` (`<OffthreadVideo>` from `remotion` is the fallback). Put files in `public/`.
- Async work: `delayRender()` then `continueRender(handle)` (30 s default timeout, `cancelRender` on error); never call it at module level; prefer `calculateMetadata()` for fetching data.
- Fonts: `@remotion/google-fonts` `loadFont(...)` or `@remotion/fonts` with `staticFile`.

## Render

```bash
npx remotion compositions
npx remotion still FadeIn out/frame.png --frame=30     # look at a still first
npx remotion render FadeIn out/fadein.mp4 --props=./props.json
```

Flags: `--codec` (h264 default; h265, vp8, vp9, av1, prores, gif, mp3, aac, wav and more), `--crf` (defaults: h264 18, h265 23, vp8 9, vp9 28, av1 30), `--frames=0,30-59`, `--concurrency`, `--scale`, `--muted`, `--timeout`. Inline JSON in `--props` is not supported on Windows shells: use a file. Settings can live in `remotion.config.ts`; CLI flags override it.

## Cloud

Lambda: pay per render, 15-minute function limit (about 32 minutes of Full HD at the default disk), AV1 unavailable, needs an AWS account and an Automators licence. Cloud Run: "Alpha status and not actively being developed." Cloud costs are billed by the provider, not Remotion.

## Working with Claude Code

Official skills cover best practices, creation, render, captions, markup and more (`/remotion-best-practices`, `/remotion-create`, `/remotion-render`, `/remotion-captions`, `/remotion-license` and others). Review a skill before installing it. An MCP server was not found in the pages read.

## Not verified

The Composition, Sequence and AbsoluteFill reference pages, captions and `@remotion/captions` details, Lambda and Cloud Run setup, Remotion 5.0 terms, any actual render.

## Ship checklist

- [ ] Headcount and automation use checked against the licence; seat or render licence bought if needed.
- [ ] Every animated value derives from `useCurrentFrame`; extrapolation clamped.
- [ ] A still checked before the full render; the full render watched.
- [ ] Fonts and images load before the frame (no flicker).
- [ ] Telemetry accepted, or another tool chosen.
