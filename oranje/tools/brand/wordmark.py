# Outlines "ORANJE" from the app's own Archivo variable font (wide, extra bold)
# into one SVG path, so the wordmark looks identical everywhere without the font.
import json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

import os
font = TTFont(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'fonts', 'Archivo-100-900.woff2'))
inst = instantiateVariableFont(font, {'wght': 800, 'wdth': 125})
gs = inst.getGlyphSet()
cmap = inst.getBestCmap()
upm = inst['head'].unitsPerEm
hmtx = inst['hmtx']
TRACK = 0.02 * upm  # a touch of letter-spacing, as in the app header

text = 'ORANJE'
pen = SVGPathPen(gs)
x = 0
for ch in text:
    g = cmap[ord(ch)]
    # flip y: font units grow upwards, SVG grows downwards
    gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
    x += hmtx[g][0] + TRACK
width = x - TRACK
cap = inst['OS/2'].sCapHeight
out = {'d': pen.getCommands(), 'width': width, 'cap': cap, 'upm': upm}
json.dump(out, open(sys.argv[1], 'w'))
print('width', width, 'cap', cap, 'upm', upm, 'path chars', len(out['d']))
