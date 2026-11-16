#!/usr/bin/env python3
"""Fill template.html with ranges.js, a motion.json and a labels.json. Usage: assemble.py motion.json labels.json out.html"""
import json, sys
from pathlib import Path
here = Path(__file__).resolve().parent
motion, labels, out = sys.argv[1:4]; L = json.load(open(labels))
t = (here / 'template.html').read_text()
for k in ('TITLE', 'ARIA', 'CHIP_SIDE', 'H1', 'INTRO_HTML', 'NOTES_HTML'):
    t = t.replace('__' + k + '__', L['page'][k.lower()])
t = t.replace('/*__RANGES__*/', (here / 'ranges.js').read_text()).replace('/*__MOTION__*/', Path(motion).read_text()).replace('/*__LABELS__*/', json.dumps(L['reel']))
Path(out).write_text(t); print('wrote', out, len(t), 'bytes')
