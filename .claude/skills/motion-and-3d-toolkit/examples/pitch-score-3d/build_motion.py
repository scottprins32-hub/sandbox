#!/usr/bin/env python3
"""Convert Motion Studio outputs into motion.json for the Pitch Score 3D page (joints, biomech metrics, attractor proxies). Reads only; never writes into Motion Studio.

  build_motion.py --trial trial.js --biomech biomech.json --out motion.json
      [--twocam-log twocam_log.json] [--release-frame N --release-note TEXT]
      [--video LABEL:VIDEO.mp4:PX.trc:OFFSET ...]   (trial frame f shows video frame f + OFFSET)

Output joints are in the page's axes: x along the throw, y up, z = x cross y (a proper rotation of the trial's z-up
frame), metres, origin at the rubber and the floor. 'observed' marks which joints the trial really had in each frame;
the display fills gaps and applies a 3-frame median, the metrics are taken from biomech.json unchanged."""
import argparse, base64, json, sys
import numpy as np

def load_js(path):
    t = open(path, encoding='utf-8').read(); return json.loads(t[t.index('{'):t.rindex('}') + 1])

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--trial', required=True); ap.add_argument('--biomech', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--twocam-log'); ap.add_argument('--release-frame', type=int); ap.add_argument('--release-note', default='')
    ap.add_argument('--video', action='append', default=[]); ap.add_argument('--pad-s', type=float, default=0.8)
    a = ap.parse_args()
    trial, bio = load_js(a.trial), json.load(open(a.biomech))
    if not bio.get('available'):
        sys.exit('biomech.json has no read-out: ' + str(bio.get('reason')))
    names = trial['points']; rate = float(trial['rate'])
    F = np.array([[[np.nan if c is None else c for c in p] for p in f] for f in trial['frames']], float)
    ix = {n: names.index(n) for n in names}; ev = {e['key']: e for e in bio['events']}
    fc = ev['foot_contact']['frame']; pk = ev['peak_knee_height']['frame']
    br, br_src = ev['release']['frame'], 'biomech'
    if a.release_frame is not None: br, br_src = a.release_frame, 'given: ' + a.release_note
    w0 = max(0, int(pk - a.pad_s * rate)); w1 = min(len(F) - 1, int(br + a.pad_s * rate))
    T = bio.get('throws', 'R'); drive = T + 'Ankle'
    hip = F[:, ix['Hip']] if 'Hip' in ix else (F[:, ix['RHip']] + F[:, ix['LHip']]) / 2
    d = np.nanmean(hip[fc - 2:fc + 1], 0) - np.nanmean(hip[w0:w0 + 3], 0); d[2] = 0; ex = d / np.linalg.norm(d)
    ey = np.array([0, 0, 1.]); ez = np.cross(ex, ey); G = F @ np.stack([ex, ey, ez]).T
    seen = np.isfinite(G).all(-1)
    for k in range(G.shape[1]):                      # fill gaps for display only
        for c in range(3):
            v = G[:, k, c]; ok = np.isfinite(v)
            if ok.sum() > 1: G[:, k, c] = np.interp(np.arange(len(v)), np.where(ok)[0], v[ok])
    G = np.stack([np.median(G[max(0, i - 1):i + 2], 0) for i in range(len(G))])
    feet = [n for n in ('LHeel', 'RHeel', 'LBigToe', 'RBigToe', 'LAnkle', 'RAnkle') if n in ix]
    floor = np.nanpercentile(np.min([G[w0:w1, ix[n], 1] for n in feet], 0), 3)
    G[..., 0] -= G[w0, ix[drive], 0] + 0.05; G[..., 1] -= floor; G[..., 2] -= G[w0, ix['Hip'] if 'Hip' in ix else ix['RHip'], 2]
    sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent)); import attractors as AT
    attr = AT.compute(G, names, rate, fc, pk, T)
    for d in attr:
        d['at'] -= w0
        if 'trail' in d: d['trail'] = [t - w0 for t in d['trail']]
    head = 'headc' if 'headc' in ix else 'Head'
    need = ['RHip', 'LHip', 'RKnee', 'LKnee', 'RAnkle', 'LAnkle', 'RShoulder', 'LShoulder', 'RElbow', 'LElbow', 'RWrist', 'LWrist', 'Neck', head, 'RBigToe', 'LBigToe', 'RHeel', 'LHeel']
    sl = slice(w0, w1 + 1); joints, observed = {}, {}
    for n in need:
        if n in ix:
            joints[n] = np.round(G[sl, ix[n]], 4).tolist(); observed[n] = seen[sl, ix[n]].astype(int).tolist()
    for n, (base, fwd) in {'RBigToe': ('RAnkle', .15), 'LBigToe': ('LAnkle', .15), 'RHeel': ('RAnkle', -.06), 'LHeel': ('LAnkle', -.06)}.items():
        if n not in joints:                           # a marker set without feet: a plain foot, marked unseen
            j = np.array(joints[base]); j[:, 0] += fwd; j[:, 1] = np.maximum(j[:, 1] - .05, .02); joints[n] = np.round(j, 4).tolist(); observed[n] = [0] * len(j)
    body = np.concatenate([np.array(joints[n]) for n in need if n in joints])
    out = dict(label=trial.get('source_label') or trial.get('source', ''), source=trial.get('source', ''), rate=rate, n=w1 - w0 + 1, window=[w0, w1], throws=T, head=head,
               events=dict(peak_knee_height=pk - w0, foot_contact=fc - w0, release=br - w0), release_source=br_src,
               metrics=[m for m in bio['metrics'] if m.get('reference')], attractors=attr, biomech_quality=bio.get('quality'), height_m=bio.get('height_m'),
               focus=np.round([np.median(body[:, 0]), .95, np.median(body[:, 2])], 3).tolist(), joints=joints, observed=observed, insets={})
    if a.twocam_log:
        rep = json.load(open(a.twocam_log))['report']; out['report'] = {k: rep[k] for k in ('lag_s', 'body_reproj_px', 'rubber_reproj_px', 'limb_spread_pct', 'rejected_pct') if k in rep}
    if a.video:
        import cv2
        sys.path.insert(0, '/home/user/modernpitching-motion-studio/backend/pipeline'); from trc import read_trc   # read-only import of Motion Studio's TRC reader
        for spec in a.video:
            label, vid, trc, off = spec.split(':'); off = float(off); _, _, X = read_trc(trc)
            idx = [int(round(f + off)) for f in range(w0, w1 + 1)]; pts = X[[i for i in idx if 0 <= i < len(X)]].reshape(-1, 2); pts = pts[np.isfinite(pts).all(1)]
            cap = cv2.VideoCapture(vid); Wv, Hv = cap.get(cv2.CAP_PROP_FRAME_WIDTH), cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
            (x1, y1), (x2, y2) = np.percentile(pts, 1, 0), np.percentile(pts, 99, 0); cxp, cyp = (x1 + x2) / 2, (y1 + y2) / 2
            h = min(Hv, max((y2 - y1) * 1.35, (x2 - x1) * 1.35 * 9 / 16)); w = min(Wv, h * 16 / 9); h = w * 9 / 16
            cxp = min(max(cxp, w / 2), Wv - w / 2); cyp = min(max(cyp, h / 2), Hv - h / 2); frames = []
            for i in idx:
                cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, i)); ok, im = cap.read()
                if not ok: frames.append(frames[-1] if frames else ''); continue
                crop = cv2.resize(im[int(cyp - h / 2):int(cyp + h / 2), int(cxp - w / 2):int(cxp + w / 2)], (288, 162), interpolation=cv2.INTER_AREA)
                frames.append('data:image/jpeg;base64,' + base64.b64encode(cv2.imencode('.jpg', crop, [cv2.IMWRITE_JPEG_QUALITY, 72])[1]).decode())
            out['insets'][label] = dict(label=label.upper() + ' PHONE', frames=frames)
    json.dump(out, open(a.out, 'w'), separators=(',', ':'))
    print('window', w0, w1, '| events', out['events'], '| release', br_src, '| metrics', len(out['metrics']), '| insets', list(out['insets']))

if __name__ == '__main__':
    main()
