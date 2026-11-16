"""The nine attractors of the programme (Motion Studio coach_rules.PROGRAMME_ATTRACTORS), each with a measurable proxy
from 3D joints. The programme defines the attractors as what a coach sees; it gives no numbers. Every proxy and range
below is this demo's own starting point, to be calibrated with the coaches, not validated and not the programme's.

compute(G, names, rate, fc, pk, throws) -> list of dicts. G: (frames, points, 3) in the page's axes
(x along the throw, y up, z = x cross y), metres, gaps filled. Frames are absolute trial frames."""
import numpy as np

NAMES = {'wave': 'Proximal-Distal (Wave Integrity)', 'lock': 'Hip Lock', 'hinge': 'Rotation Around the Hip', 'close': 'Pelvic Closure',
         'socket': 'Rotation Around the Shoulder', 'pop': 'Chest Out', 'slack': 'Slack Management', 'sagittal': 'Sagittal Stability', 'head': 'Head Stillness'}
GOOD = {'wave': 'Hip first, then knee, then ankle.',
        'lock': 'At footplant the back hip is turned in, knee and ankle extended.',
        'hinge': 'At footplant the front hip holds its place; the pelvis turns around it.',
        'close': 'The pelvis brakes and the trunk speeds up off it.',
        'socket': 'The trunk turns around the front shoulder, which stays in place.',
        'pop': 'Long trunk, chest forward while turning.',
        'slack': 'Trunk at the right length as the back hip starts to turn: not hanging back, not tipping forward.',
        'sagittal': 'No folding at the waist.',
        'head': 'The head keeps its line and speed through footplant.'}
ORDER = ['wave', 'slack', 'lock', 'head', 'hinge', 'close', 'socket', 'pop', 'sagittal']

def _ang(a, b, c):
    u, v = a - b, c - b; return float(np.degrees(np.arccos(np.clip(u @ v / (np.linalg.norm(u) * np.linalg.norm(v)), -1, 1))))

def compute(G, names, rate, fc, pk, throws='R'):
    ix = {n: i for i, n in enumerate(names)}; J = lambda n: G[:, ix[n]]
    T, L = throws, ('L' if throws == 'R' else 'R'); head = 'headc' if 'headc' in ix else 'Head'
    f = lambda s: max(1, int(round(s * rate)))
    mid = (J('RHip') + J('LHip')) / 2; neck = J('Neck') if 'Neck' in ix else (J('RShoulder') + J('LShoulder')) / 2
    out = []
    def add(key, moment, proxy, value, unit, low, high, min_fps, at, kind='range', trail=None, extra=None, measurable=True, why=''):
        d = dict(key=key, name=NAMES[key], good=GOOD[key], moment=moment, proxy=proxy, value=None if value is None else round(float(value), 1), unit=unit,
                 low=low, high=high, kind=kind, minFps=min_fps, at=int(at), measurable=measurable, why=why)
        if trail: d['trail'] = trail
        if extra: d.update(extra)
        out.append(d)
    # wave: forward-motion onset of hip, knee, ankle of the stride leg between peak knee lift and foot contact
    seg = slice(pk, fc + 1); onsets = {}
    for n, P in (('hip', mid), ('knee', J(L + 'Knee')), ('ankle', J(L + 'Ankle'))):
        vx = np.gradient(P[seg, 0]) * rate; thr = 0.3 * np.nanmax(vx); k = np.argmax(vx > thr) if np.any(vx > thr) else len(vx) - 1
        onsets[n] = pk + int(k)
    pairs = int(onsets['hip'] <= onsets['knee']) + int(onsets['knee'] <= onsets['ankle']) + int(onsets['hip'] <= onsets['ankle'])
    add('wave', 'STRIDE', 'Order in which hip, knee and ankle of the stride leg start moving forward', pairs, 'of 3 in order', 3, 3, 25, fc, kind='count',
        extra=dict(onsets={k: v - pk for k, v in onsets.items()}))
    # slack: trunk tilt in the throwing plane just before foot contact (+ forward, - hanging back)
    a = fc - f(.1); t = neck[a] - mid[a]
    add('slack', 'BEFORE FOOT CONTACT', 'Trunk tilt along the throw 0.1 s before foot contact (+ forward, - back)', np.degrees(np.arctan2(t[0], t[1])), '°', -10, 10, 25, a)
    # lock: back-leg extension at foot contact (the internal rotation of the hip is not visible in these points)
    add('lock', 'FOOT CONTACT', 'Back-leg hip-knee-ankle angle at foot contact (rotation of the hip itself is not visible)',
        _ang(J(T + 'Hip')[fc], J(T + 'Knee')[fc], J(T + 'Ankle')[fc]), '°', 150, 180, 25, fc)
    # head: how far the head leaves its line through foot contact (sideways range or drop)
    h = J(head)[fc - f(.1):fc + f(.1) + 1]
    add('head', 'FOOT CONTACT', 'Head sideways range or drop, 0.1 s either side of foot contact', 100 * max(np.ptp(h[:, 2]), max(0., h[0, 1] - h[:, 1].min())), 'cm', 0, 6, 25, fc,
        trail=[fc - f(.1), fc + f(.1)])
    # hinge: front-hip travel after foot contact while the pelvis turns
    b = fc + f(.1); hp = J(L + 'Hip')
    add('hinge', 'AFTER FOOT CONTACT', 'Front-hip travel over the ground in the 0.1 s after foot contact', 100 * np.linalg.norm((hp[b] - hp[fc])[[0, 2]]), 'cm', 0, 8, 30, b, trail=[fc, b])
    # close: pelvis turning speed should peak before the trunk's
    def yaw(Pa, Pb): v = Pa - Pb; return np.unwrap(np.arctan2(v[:, 2], v[:, 0]))
    w0, w1 = max(0, fc - f(.05)), min(len(G) - 1, fc + f(.25))
    pel = np.abs(np.gradient(yaw(J('RHip'), J('LHip'))[w0:w1 + 1])) * rate; tru = np.abs(np.gradient(yaw(J('RShoulder'), J('LShoulder'))[w0:w1 + 1])) * rate
    add('close', 'ROTATION', 'Time from the pelvis turning-speed peak to the trunk peak', 1000 * (np.argmax(tru) - np.argmax(pel)) / rate, 'ms', 15, 80, 100, fc + f(.1))
    # socket: front-shoulder travel from foot contact to about release
    c = fc + f(.15); sh = J(L + 'Shoulder')
    add('socket', 'ROTATION', 'Front-shoulder travel over the ground from foot contact to 0.15 s after', 100 * np.linalg.norm((sh[c] - sh[fc])[[0, 2]]), 'cm', 0, 15, 30, fc + f(.1), trail=[fc, c])
    # pop: trunk keeps its length while it turns
    base = np.median(np.linalg.norm(neck[pk - f(.3):pk + 1] - mid[pk - f(.3):pk + 1], axis=1))
    ln = np.linalg.norm(neck[fc:c + 1] - mid[fc:c + 1], axis=1)
    add('pop', 'ROTATION', 'Shortest trunk length (mid-hip to neck) while turning, as % of its length at leg lift', 100 * ln.min() / base, '%', 97, 103, 25, fc + int(np.argmin(ln)))
    # sagittal: folding at the waist needs the pelvis's own tilt, which hip and shoulder points do not give
    add('sagittal', 'ROTATION', 'Waist folding needs pelvis tilt; hip and shoulder points do not give it', None, '', None, None, 0, fc + f(.1), measurable=False,
        why='needs markers on the pelvis (or a body model) to see the waist fold')
    return sorted(out, key=lambda d: ORDER.index(d['key']))
