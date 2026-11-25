---
name: adhd-response-style
description: Decides whether and how to use i-have-adhd (ayghri/i-have-adhd), a free MIT Claude Code plugin whose one skill reshapes chat replies to be action-first - next action on line one, numbered steps, one closing next step, progress restated each turn, no preamble or closers, lists capped at five - with an opt-in always-on SessionStart hook. Use this whenever the user says they have ADHD or lose track of long replies, asks for shorter, more actionable or less waffly answers, wants "just tell me what to do", asks about /i-have-adhd or "stop adhd mode", or wants a response-style plugin or output style for Claude Code - even if they never name the repo. Main caveat - two rules push the model to state a cause and a time estimate even without evidence, so keep uncertainty and warnings that brevity would cut.
---

# i-have-adhd (action-first reply style)

"A skill for your coding assistant that stops it from burying the answer. Action first. Steps numbered." Read 2026-11-25: README, INSTALL.md (Claude Code section), AGENTS.md, CONTRIBUTING.md (grep), LICENSE, `skills/i-have-adhd/SKILL.md`, `hooks/hooks.json`, `hooks/always-on.sh`, `hooks/always-on.mjs`, `.claude-plugin/plugin.json` and `marketplace.json`, `.github/workflows/claude.yml`, `evals/README.md`, `evals/rubric.md`, `evals/RESULTS.md`, `evals/cases.jsonl` (grep). Last commit 2026-10-11 (`1ecea19`), plugin version 0.4.1. Nothing was installed or run.

## What it is

- One prompt file, `skills/i-have-adhd/SKILL.md` (about 150 lines), with ten rules, six override cases and a pre-send deletion check. No code runs when you use the skill itself.
- Frontmatter sets `disable-model-invocation: true`: Claude never picks it up on its own; the user types `/i-have-adhd`, and it stays on for the session until "stop adhd mode" or "normal mode".
- Adapters for about a dozen other agents (Codex, Gemini, Pi, OpenCode, Cursor and more) carry the same rules; the Cursor copy is byte-identical.
- An eval harness (`scripts/run_evals.py`, `judge.py`) that calls the `claude` or `codex` CLI. Running it costs money (the recorded run reports $3.59).
- MIT licence (2026, Ayoub Ghriss). Credits *The Adult ADHD Tool Kit* (Ramsay and Rostain) as a loose basis.

## Install and use (commands from INSTALL.md)

```bash
claude plugin marketplace add ayghri/i-have-adhd
claude plugin install i-have-adhd@i-have-adhd
# then type /i-have-adhd in a session; "stop adhd mode" turns it off
claude plugin disable i-have-adhd            # keep installed, turn off
claude plugin uninstall i-have-adhd && claude plugin marketplace remove i-have-adhd
touch ~/.claude/.i-have-adhd-always          # optional: always on
rm ~/.claude/.i-have-adhd-always             # back to on demand
```

The marketplace tracks the repo's main branch. To pin, clone at `1ecea19` and copy only `skills/i-have-adhd/` into `~/.claude/skills/`: you get the skill without the hook.

## What runs automatically, and what leaves the machine

- Installing the plugin registers a `SessionStart` hook (matcher `startup|resume|clear|compact`) that runs `node -e ...` every session. It does nothing unless `~/.claude/.i-have-adhd-always` (or `$CLAUDE_CONFIG_DIR/...`) exists; then it prints the whole SKILL.md body into context, in every project. It needs Node; failures exit silently. No CLAUDE.md edits, no output style.
- Nothing is sent anywhere by the skill or hook. The evals send prompts to Anthropic or OpenAI through your CLI login.
- `.github/workflows/claude.yml` is the maintainer's own CI (Claude replying to `@claude` comments on the repo). It does not run on your machine.

## Are its rules sound?

Mostly yes, and the author has guarded the worst trade-offs. The good parts: lead with the answer, number real steps, cut "Great question" and "Hope this helps", report errors with location, cause and fix, confirm before destructive commands, and stop after three failed fixes to name the doubtful assumption. Rule 9 explicitly says the five-item cap shapes display only and must never drop relevant items; the pre-send check keeps a hedge "that carries real uncertainty"; "explain" requests get full explanations.

Weak spots to correct for when it is on:

- Rule 8 (cause, then fix) and rule 6 (concrete time estimates) push the model to sound certain. The repo's own eval found the one consistent regression here: a reply that "asserts 'missing auth header' as the definitive cause... without any evidence". Say "unknown cause; next check is X" when that is the truth, and give a range or no estimate rather than an invented one.
- Rule 4 (suppress tangents) must not defer a security hole, data-loss risk or broken assumption found in passing. State those now, in one line.
- "Persistence: if you are unsure whether they still apply, they do" makes it sticky. Apply it to replies to the user, not to documents, PR descriptions, commit messages or emails written for other readers.

On ADHD itself: the tone is respectful and non-clinical, the README says "No ADHD diagnosis needed", CONTRIBUTING forbids implying it diagnoses ADHD, and a test case checks that. The "five facts" (small working memory, starting is hardest, time estimates feel uniform, "dopamine is scarce") are popular simplifications of real findings, stated as universal. Not every person with ADHD wants this format, and many people without ADHD do. Do not mention or infer a diagnosis because the mode is on.

## Evidence (self-reported, not verified)

`evals/RESULTS.md`: 14 cases, 3 trials, model `claude-opus-4-8`, judged blind by the same model. Weighted score 4.045 to 4.473; correctness 4.33 to 4.52; blockers 7 to 3; candidate lost 2 of 14 cases. The author's own release gate FAILED, and the file says three trials is few and one model judged its own family. Useful as a sign it does not obviously cost accuracy, no more.

## Blurb vs repo

"Make agent responses concise, structured, and action-first" is fair. The repo says the aim is "not just brief": explanations can run long on request. It is framed for ADHD readers, which the blurb omits.

## How it differs from nearby skills

- `humanizer-prose-editing` and `slop-monster-copy-cleanup` edit a piece of text after it is written; this shapes Claude's own live replies. Humanizer's chatbot-residue and re-explaining patterns overlap with rule 10, but neither touches step numbering or progress state.
- `persuasive-copy` owns words inside a product (buttons, errors, empty states), not chat replies.
- Pick this when the person reading the chat is the problem to solve; pick the others when the output is a document for someone else.

## Not verified

Behaviour in a real session, the eval numbers, the non-Claude adapters, the translations, and whether the hook stays silent on Windows without Node.

## Checklist

- [ ] User chose on-demand or always-on knowingly; flag file location stated.
- [ ] Replies still carry real uncertainty, warnings and safety confirmations.
- [ ] No invented cause or time estimate.
- [ ] Documents for other readers written in their normal style, not ADHD mode.
- [ ] "stop adhd mode" honoured at once.
