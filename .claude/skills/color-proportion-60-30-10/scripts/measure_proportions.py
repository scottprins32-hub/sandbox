#!/usr/bin/env python3
"""Measure how much of a screenshot is painted in each colour role.

    python3 -I measure_proportions.py shot.png --dominant '#F8F9FB' \
        --secondary '#EEF1F6' --accent '#1D4ED8' [--tolerance 18] [--width 400]

Each pixel is assigned to the nearest role colour if it is within --tolerance
(Euclidean distance in 0-255 RGB), else to "other". Anti-aliased text edges and
photos land in "other", so read the role shares as shares of *painted surface*,
not of every pixel. Needs Pillow only.
"""
import argparse, math, sys
from PIL import Image

def hex_rgb(s):
    s = s.lstrip('#')
    if len(s) == 3: s = ''.join(c * 2 for c in s)
    if len(s) != 6: raise argparse.ArgumentTypeError(f'bad hex colour: {s}')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))

p = argparse.ArgumentParser()
p.add_argument('image')
p.add_argument('--dominant', type=hex_rgb, required=True)
p.add_argument('--secondary', type=hex_rgb, required=True)
p.add_argument('--accent', type=hex_rgb, required=True)
p.add_argument('--tolerance', type=float, default=18.0)
p.add_argument('--width', type=int, default=400, help='downscale width for speed')
a = p.parse_args()

img = Image.open(a.image).convert('RGB')
h = max(1, round(img.height * a.width / img.width))
img = img.resize((a.width, h), Image.NEAREST)  # NEAREST: do not invent blended colours
roles = {'dominant': a.dominant, 'secondary': a.secondary, 'accent': a.accent}
names = list(roles)
close = min(math.dist(roles[x], roles[y]) for i, x in enumerate(names) for y in names[i + 1:])
if close < 2 * a.tolerance:
    print(f'warning: two role colours are only {close:.1f} apart; pixels between them may be '
          f'misassigned. Use --tolerance below {close / 2:.1f} (flat UI colours match exactly).', file=sys.stderr)
counts = dict.fromkeys(list(roles) + ['other'], 0)
for n, px in img.getcolors(maxcolors=a.width * h):
    best, bd = 'other', a.tolerance
    for name, rgb in roles.items():
        d = math.dist(px, rgb)
        if d <= bd: best, bd = name, d
    counts[best] += n
total = sum(counts.values()); roled = total - counts['other']
print(f"{'role':10} {'% of all':>9} {'% of roled':>11}")
for k, v in counts.items():
    r = f"{100 * v / roled:10.1f}%" if k != 'other' and roled else f"{'':>11}"
    print(f"{k:10} {100 * v / total:8.1f}% {r}")
if roled == 0: sys.exit('no pixel matched any role colour; raise --tolerance or check the hex values')
