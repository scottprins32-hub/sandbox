#!/usr/bin/env python3
"""Check a rendered video for frozen stretches, flashes and cuts, using only ffmpeg.

    python3 frame_qa.py video.mp4 [--freeze-frames 6] [--flash 18] [--json]

Frozen: consecutive frames with (almost) no pixel difference, for at least --freeze-frames frames in a row.
Flash:  the mean luma jumps by more than --flash (0-255 scale) and returns within 3 frames: a short glitch.
Cut:    a luma jump that does not return within 3 frames. A deliberate scene change is a cut; check that it is one.
Exit code 1 if a frozen stretch or a flash is found.
"""
import argparse, json, re, subprocess, sys


def series(path, vf, key):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', vf + f',metadata=print:key={key}:file=-', '-f', 'null', '-'],
                       capture_output=True, text=True)
    if p.returncode != 0: sys.exit(p.stderr)
    return [float(m.group(1)) for m in re.finditer(re.escape(key) + r'=([0-9.]+)', p.stdout)]


def runs(flags, minimum):
    out, start = [], None
    for i, f in enumerate(flags + [False]):
        if f and start is None: start = i
        if not f and start is not None:
            if i - start >= minimum: out.append((start, i - 1))
            start = None
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('video'); ap.add_argument('--freeze-frames', type=int, default=6)
    ap.add_argument('--flash', type=float, default=18.0); ap.add_argument('--eps', type=float, default=0.02)
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    luma = series(a.video, 'signalstats', 'lavfi.signalstats.YAVG')
    diff = series(a.video, 'tblend=all_mode=difference,signalstats', 'lavfi.signalstats.YAVG')   # diff[i] = |frame i - frame i-1|
    frozen = runs([d < a.eps for d in diff[1:]], a.freeze_frames)
    frozen = [(s + 1, e + 1) for s, e in frozen]
    flashes, cuts, skip = [], [], -1
    for i in range(1, len(luma) - 1):
        if i <= skip or abs(luma[i] - luma[i - 1]) <= a.flash: continue
        back = next((k for k in range(1, 4) if i + k < len(luma) and abs(luma[i + k] - luma[i - 1]) < a.flash / 2), None)
        if back:
            flashes.append(i); skip = i + back      # a flash is a short excursion that returns: report its first frame once
        else:
            cuts.append(i)
    res = {'frames': len(luma), 'frozen_runs': [{'from': s, 'to': e, 'length': e - s + 1} for s, e in frozen], 'flash_frames': flashes, 'cuts': cuts,
           'mean_luma_range': [round(min(luma), 1), round(max(luma), 1)]}
    if a.json: print(json.dumps(res, indent=2))
    else:
        print(f"{res['frames']} frames, luma {res['mean_luma_range'][0]} to {res['mean_luma_range'][1]}")
        print('frozen runs:', res['frozen_runs'] or 'none'); print('flash frames:', flashes or 'none'); print('cuts:', cuts or 'none')
    sys.exit(1 if frozen or flashes else 0)


if __name__ == '__main__':
    main()
