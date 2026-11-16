#!/usr/bin/env python3
"""Fill a template with attractors.js, a motion.json and a labels.json (and an xray.json for the X-ray page).
Usage: assemble.py motion.json labels.json out.html [xray.json]"""
import json, sys
from pathlib import Path
here = Path(__file__).resolve().parent
motion, labels, out = sys.argv[1:4]; xray = sys.argv[4] if len(sys.argv) > 4 else None; L = json.load(open(labels))
t = (here / ('template_xray.html' if xray else 'template.html')).read_text()
for k in ('TITLE', 'ARIA', 'CHIP_SIDE', 'H1', 'INTRO_HTML', 'NOTES_HTML'):
    t = t.replace('__' + k + '__', L['page'][k.lower()])
mo = json.loads(Path(motion).read_text())
if xray:
    mo['insets'] = {}          # the X-ray page shows the full videos instead of thumbnails
t = t.replace('/*__RANGES__*/', (here / 'attractors.js').read_text()).replace('/*__MOTION__*/', json.dumps(mo, separators=(',', ':'))).replace('/*__LABELS__*/', json.dumps(L['reel']))
if xray:
    t = t.replace('/*__XRAY__*/', Path(xray).read_text())
Path(out).write_text(t); print('wrote', out, len(t), 'bytes')
