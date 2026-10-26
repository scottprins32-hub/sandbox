---
name: ace-step-game-music
description: Generates game soundtracks and loops locally with ACE-Step 1.5, an open-source text-to-music model, via its Gradio UI or REST API, choosing the model tier from available VRAM and writing captions, lyrics and duration. Use this whenever the user needs game music, a theme or battle track, looping background audio, a soundtrack from a text description, a LoRA trained on a few songs, or asks about ACE-Step - even if they just say "make music for my game". Flags the unstated weights licence.
---

# ACE-Step 1.5 for game music

A language model plans the song, a diffusion transformer renders it. Text-to-music, cover, repaint, track separation and LoRA training. README read 2026-10-26.

## Decide first

1. **Hardware.** Tier by VRAM (the UI auto-configures): <=6 GB 2B turbo, no LM, INT8 + CPU offload; 6-8 GB adds the 0.6B LM; 8-16 GB 2B with 0.6B/1.7B LM; 16-24 GB XL options; >=24 GB XL sft with the 4B LM. The abstract's "under 4 GB" is optimistic; plan for 6-8 GB. Python 3.11-3.12. CUDA recommended; MPS, ROCm, XPU and CPU also work, slower.
2. **Licence.** Code is MIT. **The README states no licence or commercial-use terms for the model weights.** Read the Hugging Face model pages before shipping generated music. Also: the README asks users to verify originality, disclose AI involvement and get permission for protected styles.
3. **Speed claims** (under 10 s per song on an RTX 3090, under 2 s on an A100) are the authors' own, hardware-dependent and without stated methodology. Do not promise them.

## Install and run

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh     # macOS/Linux
git clone https://github.com/ACE-Step/ACE-Step-1.5.git && cd ACE-Step-1.5
uv sync
uv run acestep         # Gradio UI, http://localhost:7860 (models download on first run)
uv run acestep-api     # REST API, http://localhost:8001
```

CLI details are in `docs/en/CLI.md` and the Python API in `docs/en/INFERENCE.md`. Verify the exact request schema there before scripting the API.

## Writing a game track

- **Caption**: style tags plus mood and instrumentation ("cozy pixel village, upbeat 8-bit, chiptune, major key"). The LM can expand tags automatically.
- **Duration**: 10 s to 600 s. Generate loop stems at 30-90 s and loop in the engine; do not expect seamless loops by default, and check the join.
- **Metadata**: BPM, key/scale and time signature can be set; fix them when tracks must crossfade.
- **Instrumental**: leave lyrics empty or mark instrumental per the docs.
- **Batch**: up to 8 variations at once; generate several and choose.
- **Steps**: 8 for turbo models, 50 for base/sft.
- **LoRA**: about 8 songs, about 1 hour on a 12 GB RTX 3090 (README figure), via the Gradio LoRA Training tab. Only train on audio you have rights to.

## Verify before it goes in the game

Listen on the target speakers; check loudness consistency across tracks; check the loop point; record model, version, caption, seed and date next to each file.

## Ship checklist

- [ ] VRAM tier matches the hardware.
- [ ] Weights licence read and the result recorded in the repo.
- [ ] Loop point and loudness checked per track.
- [ ] Provenance (model, caption, seed) stored with each asset.
- [ ] AI-generation disclosed where the store or licence requires it.
