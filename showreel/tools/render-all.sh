#!/usr/bin/env bash
# Full build: glyph data → soundtrack → two parallel lossless render lanes → one
# H.264 master with audio. Usage: tools/render-all.sh [out.mp4]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-claude-showreel.mp4}"
FF="${FFMPEG:-$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')}"
mkdir -p render/parts

python3 tools/build_glyphs.py
python3 audio/synth.py > /dev/null

# Two lanes: 2D-heavy chapters in one browser, raymarch/shader chapters in the
# other (software GL wants every core it can get; 2D canvas is single-threaded).
render() { node tools/render.mjs --video "render/parts/$1.mkv" --lossless --from "$2" --to "$3" > "render/parts/$1.log" 2>&1; }
( render a1 0 450 && render a2 675 900 ) &
lane_a=$!
( render b 450 675 ) &
lane_b=$!
wait "$lane_a"
wait "$lane_b"

: > render/parts/list.txt
for p in a1 b a2; do echo "file '$p.mkv'" >> render/parts/list.txt; done

"$FF" -y -hide_banner -loglevel error \
  -f concat -safe 0 -i render/parts/list.txt -i assets/soundtrack.wav \
  -vf "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p" \
  -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.2 \
  -x264-params "aq-mode=3:aq-strength=0.9:deblock=-1,-1" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "→ $OUT"
