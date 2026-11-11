---
name: whisper-cpp-transcription
description: Runs fast local speech-to-text with whisper.cpp (ggml-org/whisper.cpp), the MIT C/C++ port of OpenAI Whisper, covering the build for CPU, Metal, CUDA, Vulkan and Core ML, model choice by size and language, the exact CLI flags for text, SRT, VTT and JSON, the hallucination-on-silence fixes, VAD, and the local HTTP server. Use this whenever the user wants to transcribe audio or video on their own machine, make subtitles or captions, get word timestamps, avoid cloud transcription, or mentions whisper.cpp, ggml or whisper-cli - even if they never name it. Lists doc traps such as -ojson not existing and -l defaulting to English.
---

# whisper.cpp (local transcription)

Plain C/C++ inference of OpenAI's Whisper on the ggml library, MIT-licensed, no cloud. Read 2026-11-11 from the README, LICENSE, `models/README.md`, the CLI and server READMEs and the tags page. Latest tag seen: v1.9.5 (6 Oct 2026). **Nothing was built or run here**; the Makefile, download script and release assets were not read. This session transcribed audio with `faster-whisper` (a different project, installed through uv) rather than whisper.cpp; both load the same Whisper models, so they are interchangeable for most jobs.

## Build

```bash
cmake -B build && cmake --build build -j --config Release     # CPU; binary: ./build/bin/whisper-cli
cmake -B build -DGGML_VULKAN=1       # Vulkan GPU
cmake -B build -DGGML_CUDA=1         # NVIDIA GPU
cmake -B build -DWHISPER_COREML=1    # Core ML encoder on Apple Silicon (needs a generated model, below)
```

On Apple Silicon the README says inference "runs fully on the GPU via Metal", but the pages read gave no Metal build flag. Other backends listed: OpenVINO (`-DWHISPER_OPENVINO=1`), ROCm (`-DGGML_HIP=1`), OpenBLAS, CANN, MUSA, Ryzen AI NPU. Docker images: `ghcr.io/ggml-org/whisper.cpp:main` (with ffmpeg) plus `-cuda`, `-musa` and `-vulkan` tags. **Doc trap:** the README's RTX 5000 CUDA example uses architecture `86`, which looks wrong for that card: check before copying.

Core ML needs `pip install ane_transformers openai-whisper coremltools` and `./models/generate-coreml-model.sh base.en`; the README claims more than 3x speed over CPU for the encoder, and says the first run is slow.

## Models

```bash
sh ./models/download-ggml-model.sh base.en        # -> models/ggml-base.en.bin
```

| model | disk | memory (README table) |
|---|---|---|
| tiny | 75 MiB | about 273 MB |
| base | 142 MiB | about 388 MB |
| small | 466 MiB | about 852 MB |
| medium | 1.5 GiB | about 2.1 GB |
| large-v3 | 2.9 GiB | about 3.9 GB ("large") |
| large-v3-turbo | 1.5 GiB | not listed |

Names ending `.en` are English-only; everything else is multilingual. Quantized `-q5_0` variants exist for large-v2, large-v3 and turbo (turbo q5_0 is 547 MiB). Make your own with `./build/bin/quantize in.bin out-q5_0.bin q5_0`. `small.en-tdrz` supports experimental tinydiarize speaker turns, English only. No accuracy numbers are given in the README.

## Transcribe

```bash
ffmpeg -i input.mp4 -ar 16000 -ac 1 -c:a pcm_s16le audio.wav      # the documented conversion
./build/bin/whisper-cli -m models/ggml-base.en.bin -f audio.wav -osrt -of out
```

- The README says the CLI "currently runs only with 16-bit WAV files", but the CLI help lists flac, mp3, ogg and wav, and a build with `-DWHISPER_COMMON_FFMPEG=yes` accepts other containers. Converting to 16 kHz mono WAV always works.
- Outputs: `-otxt`, `-osrt`, `-ovtt`, `-ocsv`, `-olrc`, `-oj` (JSON), `-ojf` (full JSON), `-of NAME` (no extension). **`-ojson` is not a flag; use `-oj`.**
- **`-l` defaults to `en`**: for other languages pass `-l xx` or `-l auto`. `-tr` translates to English. `-t N` threads (default 4).
- Word timestamps: `-ml 1` (marked experimental). `-owts` makes a karaoke script.
- `-np` and `-nt` reduce output noise; `-ng` forces CPU.

## Hallucinations on silence or music

Whisper can invent "phantom text" (often CJK) over silence or music. The CLI README's mitigations: set `-l` instead of auto-detect, use VAD, tighten `-et` and `-lpt`, try `-sns`, `-nf` or `--suppress-regex`.

```bash
sh ./models/download-vad-model.sh silero-v6.2.0
./build/bin/whisper-cli -m models/ggml-base.en.bin -f audio.wav --vad --vad-model models/silero-v6.2.0-ggml.bin
```

Long files have no documented limit or chunking guidance: test a full-length file, and consider cutting silence first (see `auto-editor-silence-cutting`) or splitting.

## Server

`./build/bin/whisper-server` listens on `127.0.0.1:8080` (`/inference`), with `--convert` to let it use ffmpeg:

```bash
curl 127.0.0.1:8080/inference -H "Content-Type: multipart/form-data" -F file="@audio.wav" -F response_format="json"
```

The README warns not to run it with admin privileges, to sandbox it, and to validate inputs. Its defaults differ from the CLI (`-bo 2`, `-bs -1`, flash attention off). The response schema was not shown.

## Limits

Inference only. No general diarization (only the stereo `-di` and tinydiarize). Word timestamps and tinydiarize are experimental. Bindings exist for Rust, Go, Java, Ruby, Swift, .NET, JavaScript and others; Python ones are third-party forks of unknown upkeep.

## Not verified

Metal flag, prebuilt binaries, turbo's memory, quantisation methods beyond q5_0, long-audio behaviour, accuracy and speed on your hardware, the ANEForge third-party speed claim.

## Ship checklist

- [ ] Input converted to 16 kHz mono WAV, or ffmpeg support built in.
- [ ] Right model size and `.en` vs multilingual; `-l` set explicitly.
- [ ] VAD on for recordings with silence or music; a full-length file spot-checked for invented text.
- [ ] Output format flag correct (`-oj`, not `-ojson`) and the file opened.
- [ ] Server not exposed beyond localhost.
