# Writes every Oranje brand file as SVG into oranje/brand/ (PNG renders follow
# in render.cjs), and the app's own icons into oranje/icons/.
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mark as M

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'brand')
ICONS = os.path.join(HERE, '..', '..', 'icons')
os.makedirs(OUT, exist_ok=True)
WM = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wordmark.json')))

M.TRACK_ON_NAVY = '#24407F'
MARK = dict(w=62, r=146)          # variant D
CX, CY = 256, 262
OUTER = MARK['r'] + MARK['w'] / 2  # ring's outer radius


def write(name, svg, folder=OUT):
    open(os.path.join(folder, name), 'w').write(svg)


def svg(viewbox, body, w=None, h=None):
    size = f' width="{w}" height="{h}"' if w else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}"{size}>{body}</svg>\n'


# 1. the mark alone, transparent, for dark and for light backgrounds
crop = f'{CX - OUTER - 8:.0f} {CY - OUTER - 8:.0f} {2 * OUTER + 16:.0f} {2 * OUTER + 16:.0f}'
write('oranje-mark-dark-bg.svg', svg(crop, M.mark(cx=CX, cy=CY, uid='m', on='navy', **MARK)))
write('oranje-mark-light-bg.svg', svg(crop, M.mark(cx=CX, cy=CY, uid='m', on='cream', **MARK)))

# 2. app icon: rounded navy tile; and full-bleed square for Google and maskable icons
icon = M.tile(512, M.mark(cx=CX, cy=CY, uid='i', **MARK))
write('oranje-icon.svg', icon)
write('icon.svg', icon, ICONS)
square = M.tile(512, M.mark(cx=CX, cy=CY, uid='s', **MARK), bleed=True)
write('oranje-icon-square.svg', square)
# maskable: launchers crop to a circle or squircle; keep the mark inside the 80 % safe zone
safe = f'<g transform="translate(256 256) scale(.8) translate(-256 -256)">{M.mark(cx=CX, cy=CY - 6, uid="k", **MARK)}</g>'
write('oranje-icon-maskable.svg', M.tile(512, safe, bleed=True))

# 3. horizontal lockup: mark + wordmark, cap height centred on the ring
CAP_H = 190
k = CAP_H / WM['cap']
GAP = 64
mx0 = CX - OUTER
wx = CX + OUTER + GAP
baseline = CY + CAP_H / 2
word_w = WM['width'] * k
PAD = 40
vb = f'{mx0 - PAD:.0f} {CY - OUTER - PAD:.0f} {wx + word_w - mx0 + 2 * PAD:.0f} {2 * OUTER + 2 * PAD:.0f}'


def lockup(on, uid, bg=None):
    ink = M.CREAM if on == 'navy' else M.INK
    x, y, w, h = [float(v) for v in vb.split()]
    back = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    word = f'<path transform="translate({wx:.1f} {baseline:.1f}) scale({k:.5f})" d="{WM["d"]}" fill="{ink}"/>'
    return svg(vb, back + M.mark(cx=CX, cy=CY, uid=uid, on=on, **MARK) + word)


write('oranje-logo-dark-bg.svg', lockup('navy', 'ld'))
write('oranje-logo-light-bg.svg', lockup('cream', 'll'))
write('oranje-logo-on-navy.svg', lockup('navy', 'ln', bg=M.NAVY))
write('oranje-logo-on-cream.svg', lockup('cream', 'lc', bg=M.CREAM))

# 4. share image (WhatsApp, iMessage, socials): 1200 x 630
og_k = 74 / WM['cap']
og = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<defs><radialGradient id="og-bg" cx="22%" cy="20%" r="100%"><stop offset="0" stop-color="#132a6b"/><stop offset=".55" stop-color="#071538"/><stop offset="1" stop-color="{M.NAVY}"/></radialGradient></defs>
<rect width="1200" height="630" fill="url(#og-bg)"/>
<g transform="translate(748 58) scale(1.0)">{M.mark(cx=256, cy=262, uid="og", **MARK)}</g>
<path transform="translate(82 292) scale({og_k:.5f})" d="{WM["d"]}" fill="{M.CREAM}"/>
<text x="82" y="364" font-family="Archivo, Helvetica Neue, Arial, sans-serif" font-size="34" font-weight="500" fill="{M.CREAM}" fill-opacity=".72">Strain, recovery en slaap</text>
<text x="82" y="408" font-family="Archivo, Helvetica Neue, Arial, sans-serif" font-size="34" font-weight="500" fill="{M.CREAM}" fill-opacity=".72">voor je Fitbit Air.</text>
<rect x="82" y="456" width="64" height="8" rx="4" fill="{M.ORANGE}"/>
</svg>
'''
write('oranje-share.svg', og)
print('svgs written; lockup viewBox', vb)
