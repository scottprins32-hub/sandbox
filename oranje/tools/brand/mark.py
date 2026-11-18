# The Oranje mark: the O of Oranje drawn as the app's strain dial.
# A 270-degree ring, open at the bottom like the dial, filled orange to the
# current strain, with a cream knob where the reading stands.
import math

NAVY = '#04102B'
NAVY_2 = '#0B1F55'
TRACK_ON_NAVY = '#1A2F68'
CREAM = '#F6F3EC'
INK = '#0C1C48'
TRACK_ON_CREAM = '#DCD3C2'
PEACH, ORANGE, EMBER = '#FFB36B', '#FF6A00', '#F0461E'

A0, SWEEP = -135, 270


def polar(cx, cy, r, deg):
    a = math.radians(deg - 90)
    return cx + r * math.cos(a), cy + r * math.sin(a)


def arc(cx, cy, r, a0, a1):
    x0, y0 = polar(cx, cy, r, a0)
    x1, y1 = polar(cx, cy, r, a1)
    large = 1 if abs(a1 - a0) > 180 else 0
    return f'M{x0:.2f} {y0:.2f}A{r} {r} 0 {large} 1 {x1:.2f} {y1:.2f}'


def mark(cx=256, cy=262, r=150, w=48, value=0.70, on='navy', uid='o', pennant=False, ticks=False, knob_r=None):
    """SVG fragment (no <svg> wrapper) for the dial-O, centred on cx, cy."""
    end = A0 + SWEEP * value
    track = TRACK_ON_NAVY if on == 'navy' else TRACK_ON_CREAM
    knob_fill = CREAM if on == 'navy' else INK
    gap = NAVY if on == 'navy' else CREAM
    gx0, gy0 = polar(cx, cy, r, A0)
    gx1, gy1 = polar(cx, cy, r, end)
    kx, ky = polar(cx, cy, r, end)
    kr = knob_r or w * 0.62
    parts = [
        f'<defs><linearGradient id="{uid}-heat" gradientUnits="userSpaceOnUse" x1="{gx0:.1f}" y1="{gy0:.1f}" x2="{gx1:.1f}" y2="{gy1:.1f}">'
        f'<stop offset="0" stop-color="{PEACH}"/><stop offset=".55" stop-color="{ORANGE}"/><stop offset="1" stop-color="{EMBER}"/></linearGradient></defs>',
        f'<path d="{arc(cx, cy, r, end, A0 + SWEEP)}" fill="none" stroke="{track}" stroke-width="{w}" stroke-linecap="round"/>',
        f'<path d="{arc(cx, cy, r, A0, end)}" fill="none" stroke="url(#{uid}-heat)" stroke-width="{w}" stroke-linecap="round"/>',
    ]
    if ticks:
        for v in (0, 10, 14, 18, 21):
            a = A0 + SWEEP * v / 21
            x1, y1 = polar(cx, cy, r - w / 2 - 16, a)
            x2, y2 = polar(cx, cy, r - w / 2 - 34, a)
            parts.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{knob_fill}" stroke-opacity=".55" stroke-width="7" stroke-linecap="round"/>')
    parts.append(f'<circle cx="{kx:.2f}" cy="{ky:.2f}" r="{kr + w * 0.16:.2f}" fill="{gap}"/>')
    parts.append(f'<circle cx="{kx:.2f}" cy="{ky:.2f}" r="{kr:.2f}" fill="{knob_fill}"/>')
    if pennant:
        # the oranjewimpel: a short pole off the knob with an orange pennant
        px, py = kx, ky - kr
        top = py - w * 1.15
        parts.append(f'<path d="M{px:.1f} {py:.1f}V{top:.1f}" stroke="{knob_fill}" stroke-width="{w * .2:.1f}" stroke-linecap="round"/>')
        parts.append(f'<path d="M{px:.1f} {top:.1f}l{w * 1.05:.1f} {w * .27:.1f}-{w * 1.05:.1f} {w * .27:.1f}z" fill="{ORANGE}"/>')
    return '\n'.join(parts)


def tile(size=512, inner=None, radius=0.22, bleed=False):
    """A navy app-icon tile; `inner` is the SVG drawn on it (in 512 units)."""
    rr = 0 if bleed else 512 * radius
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="{size}" height="{size}">'
            f'<defs><radialGradient id="tile-g" cx="28%" cy="18%" r="95%"><stop offset="0" stop-color="{NAVY_2}"/><stop offset=".6" stop-color="#061536"/><stop offset="1" stop-color="{NAVY}"/></radialGradient></defs>'
            f'<rect width="512" height="512" rx="{rr}" fill="url(#tile-g)"/>{inner}</svg>')
