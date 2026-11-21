---
name: slop-monster-copy-cleanup
description: Runs and judges SlopMonster (ItsssssJack/SlopMonster), a free MIT tool that scores English copy out of 5 for common AI-writing patterns with a standard-library Python regex checker, plus an editing workflow and an optional second editing pass by a different model family through the Codex or Claude CLI. Use this whenever the user wants to de-slop, humanise or tighten AI-written copy (landing pages, READMEs, emails, scripts), asks "does this sound like AI", wants a CI check on marketing copy, or mentions SlopMonster or deslop.py - even if they never name it. Main caveat - a 5/5 score only means no listed regex matched; it cannot judge clarity or truth, and the second pass sends the whole draft to another AI provider.
---

# SlopMonster (AI-copy checker and edit loop)

"SlopMonster checks English writing for common AI writing patterns and provides instructions for editing the draft." Read 2026-11-21: README, LICENSE, SKILL.md, `tools/deslop.py` (rule tables and argument handling), `tools/cleanse.sh`, `prompts/cleanse.txt`, `.github/workflows/slop.yml`, `references/sources.md`, `examples/ridgeline-roofing.md` and `examples/jasper-live-run.md` (heads). Last commit 2026-09-26, by the creator. Nothing was installed or run.

## What it is

- `tools/deslop.py` (365 lines, Python 3 standard library only, no API key) scores five categories, one point each: vocabulary (for example `delve`, `seamless`, `leverage`), sentence patterns (`not just X, but Y`, stacked hedges, self-answering questions), punctuation density (em dashes, stacked hyphenated compounds, semicolons), three-item lists, and possible unsupported proof (a number near `users`, `customers`, `teams` and similar). Exit 0 only at 5/5.
- `SKILL.md`: a four-step edit (context, rewrite, second-model pass, re-check).
- `tools/cleanse.sh` plus `prompts/cleanse.txt`: sends the draft to a rival model family's CLI.
- References: a pattern catalogue drawn from Wikipedia's "Signs of AI writing" and four open-source humaniser repos, and editing principles.

## Setup and use (commands from the README)

```bash
git clone https://github.com/ItsssssJack/SlopMonster
cd SlopMonster
python3 tools/deslop.py --text "It's not just a tool, it's a game-changing journey."   # 3/5, exit 1
python3 tools/deslop.py README.md          # Markdown: skips code, images, struck-through text
python3 tools/deslop.py index.html          # strips tags, script and style; hidden CSS text still counts
python3 tools/deslop.py index.html --allow-proof   # keep proof warnings, drop their penalty
DESLOP_WRITER=claude tools/cleanse.sh draft.md > cleansed.md 2> notes.txt
```

As a Claude Code skill: copy the folder to `~/.claude/skills/slopmonster/` and call `/slopmonster`. Pin to a commit (`3fc9787` when read). The checker alone is safe to run on any file: it reads only.

## What leaves the machine

- `deslop.py`: nothing.
- `cleanse.sh`: the whole prompt plus draft goes to the provider behind the CLI it finds. With `DESLOP_WRITER` unset or `claude`, it uses `codex exec --sandbox read-only` (OpenAI). With `DESLOP_WRITER=gpt`, it uses `claude -p` (Anthropic). It uses the CLI's configured model; the header comment's "GPT-5.6" is not pinned. If only the same-family CLI exists it prints the prompt and exits 127; a timeout (default 180 s, `TIMEOUT=`) exits 124.
- The draft is passed as one command-line argument, so it is visible in the process list and a very long document may hit the system's argument limit (read from the code, not tested). Do not send confidential drafts this way without the user's say-so.

## Are its rules sound?

Yes, mostly, and honestly framed. The README and SKILL.md say a pass is not proof of quality or human authorship, that the checker misses bad writing and flags fine writing, and that a second model is "another editing pass", not a guaranteed improvement. Its best rule: never invent statistics, testimonials or results; flag gaps as `[needs number]`. That matches `persuasive-copy`, which should own the actual rewrite.

Short distillation (after SlopMonster's SKILL.md): set reader and format first, fix structure before words, keep facts and the author's position, do not fake personality with fragments or opinions, and re-read the whole thing after any automated pass.

## Traps

- False positives: exact-match words such as `landscape`, `journey` and `crafted` fire on literal use too, despite the code comment; `robust`, `transformation`, `3 projects` and `2 teams` also trigger. Read each match before editing.
- English only; other languages score 5/5 by default.
- Never hide prose in code formatting or strikethrough to raise the score (SKILL.md forbids it; the parser would reward it).
- `--allow-proof` only after the user has evidence for the number.
- If the cleanse output lacks the `<<<SLOPMONSTER-NOTES>>>` marker, change notes may be mixed into the copy.
- The CI example fails the job below 5/5; blocking merges still needs your own branch rules.

## Creator's claims (Jack Roberts video, 2026-11-20) vs the repo

- "Free tool that cleans up AI copy": the checker detects; the cleaning is done by the agent following SKILL.md and an optional second model.
- Before/after for a landing page: present (`examples/ridgeline-roofing.md`, plus a Jasper homepage excerpt run). Before/afters for a cold email and a refund reply: not in the repo (no file mentions either); they may exist only in the video.

## Not verified

Detection accuracy on real copy, the regression tests (not run), the four upstream humaniser repos' licences, and whether the Ridgeline Roofing business facts are real.

## Checklist

- [ ] Reader, format and purpose stated before editing.
- [ ] `deslop.py` run; each match read, not blindly replaced.
- [ ] User agreed before any draft went to another provider via `cleanse.sh`; exit status checked.
- [ ] Facts, numbers, links and commands compared against the original.
- [ ] No invented proof; unresolved `[needs ...]` placeholders reported.
- [ ] Final human read even at 5/5.
