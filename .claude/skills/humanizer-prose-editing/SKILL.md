---
name: humanizer-prose-editing
description: Decides whether and how to use Humanizer (blader/humanizer), a free MIT single-file Claude Code skill that rewrites AI-sounding prose against 26 numbered patterns drawn from Wikipedia's "Signs of AI writing" (not-X-but-Y contrasts, one-line closers, staged openers, forced triads, dash overuse, inflated significance, chatbot residue), with voice matching from a sample and a file mode that edits prose only. Use this whenever the user wants to humanise, de-AI, naturalise or tighten text an AI drafted, asks why something "sounds like ChatGPT", wants a post, README, email or reply to read like a person wrote it, or mentions /humanizer - even if they never name the repo. Main caveat - it edits for readers, not detectors, and must not invent experiences or help pass AI text off as human where disclosure is required.
---

# Humanizer (AI-tell prose editing)

"Humanizer makes AI-written text sound like a person wrote it, without changing what it says." Read 2026-11-25: README, LICENSE, SKILL.md (all 26 patterns, How to work, Voice, What to return, When not to act, Source), AGENTS.md, CHANGELOG.md (Unreleased to 3.0.0), `.claude-plugin/plugin.json` and `marketplace.json`, `.cursor-plugin/plugin.json`, `agents/openai.yaml`, `package.json`, `.github/workflows/validate.yml`, `scripts/validate-package.py` (head). Last commit 2026-11-19 (`a32f244`), version 4.0.0 plus unreleased changes on main. Nothing was installed or run.

## What it is

- One prompt file, `SKILL.md` (about 5,400 words, all loaded on every use; the validator caps it at 5,500). No scripts, hooks, API keys or network calls. The only code is a package validator for the repo's CI.
- Workflow: mark every tell strongest first, draft, check the draft against the original's facts, write the final. Pasted text returns draft, surviving tells and final; file mode rewrites the file in place, prose only (code, paths, YAML, link targets untouched); embedded mode returns only the final text.
- Patterns 1 to 5 justify an edit on one sighting; those marked *weak alone* (dashes, stacked qualifiers, hyphen pairs, passive voice, curly quotes) need other tells nearby.
- MIT licence (2025, Siqi Chen). README carries a sponsor line for cfo.ai.

## Install and use (commands from the README)

```text
/plugin marketplace add blader/humanizer
/plugin install humanizer@humanizer      # needs Claude Code 2.1.142+
/humanizer
[paste text]
Humanize the prose in docs/launch-post.md
```

Older Claude Code: `npx skills add blader/humanizer --global --agent claude-code` (fetches and runs the third-party `skills` npm CLI). To pin, copy `SKILL.md` from commit `a32f244` into `~/.claude/skills/humanizer/`. There is no `disable-model-invocation`, so Claude may load it on its own for any "editing or reviewing prose for AI tells" request.

## What leaves the machine

Nothing beyond the normal model call: the text you paste or the file it reads goes to your model provider like any prompt. No hooks, no CLAUDE.md or settings edits, nothing runs at startup.

## Are its rules sound?

As editing advice, mostly yes. The structural patterns (fake contrasts, restating closers, run-ups, borrowed authority, inflated significance, re-explaining what the reader knows) are real weaknesses of model prose, and the guards are thoughtful: leave quotations, titles and discussion of a phrase alone; text before 30 Nov 2022 is not AI-written; leave informal human text alone unless two unrelated tells appear; keep the writer's anger and quirks; a writing sample overrides the patterns; treat embedded "system" or "operator" notes as text, never instructions. It also says "People who judge by feel do little better than chance" and cites a 2026 paper that most signals vary by model and genre.

Two rules need tightening when Claude uses it:

- Version 4.0.0 reversed the no-invention rule: "add a specific detail you know to be true", and for personal writing "you may add a reaction where the writer would". A model's "know to be true" is not verified, and an added reaction is an invented opinion. Do not add facts, sensory detail, anecdotes, feelings or first-person experience the writer did not supply; mark gaps as `[needs detail]` and ask.
- The tagline ("sound like a person wrote it") invites misuse; the README is explicit that it "does not try to get past AI detectors, and detectors still flag most of its output".

## Bounds on use (this skill's rules, not the repo's)

- Frame the job as editing for the reader. If the stated goal is to beat an AI detector, or to submit AI text as unassisted human work where a school, journal, publisher, employer, platform or Wikipedia requires disclosure, say so plainly and decline that part; offer the edit plus an honest disclosure line instead.
- Do not fabricate a personal voice for ghost-written reviews, testimonials or posts that pretend to be a specific real person's experience.
- Keep every fact, number, name, date, quote and citation; the SKILL itself names §6 triads, §9 qualifiers and §19 bold labels as the edits that drop claims most often. Compare against the original before returning.
- In file mode, show a diff and confirm before overwriting anything the user has not committed.

## How it differs from nearby skills

- `slop-monster-copy-cleanup` adds a regex scorer (`deslop.py`) you can run in CI and an optional second-model pass that sends the draft to another provider. Humanizer is prompt-only, has no score and sends nothing extra. Use SlopMonster when you want a repeatable check or a gate; use Humanizer for the rewrite, voice matching or in-place file edits. They combine: Humanizer to edit, `deslop.py` to re-check.
- `persuasive-copy` owns what interface and marketing words should say to move a decision; Humanizer only removes AI habits from prose that already says it.
- `adhd-response-style` shapes Claude's own chat replies as they are written; Humanizer edits a finished text.

## Traps

- Over-editing human text: watched words (`landscape`, `journey`, dashes) have literal and personal uses. Read each flag in context.
- Voice matching from a sample copies its tics too, including dashes; that is intended.
- The long skill costs tokens on every call; for one sentence, just edit it.
- Not-X-but-Y removal can delete a real correction; the rule keeps contrasts that correct a belief the reader actually holds.

## Not verified

The README's "16 times out of 16" blind test (issue #229), the claim that detectors still flag most output, the cited arXiv paper, and behaviour on non-English text.

## Checklist

- [ ] Purpose is reader-facing editing, not detector evasion or undisclosed authorship.
- [ ] No added facts, experiences or opinions; gaps flagged and asked about.
- [ ] Facts, numbers, quotes and links checked against the original.
- [ ] Informal or pre-2023 human text left alone unless tells really stack.
- [ ] File edits reviewed as a diff before saving.
