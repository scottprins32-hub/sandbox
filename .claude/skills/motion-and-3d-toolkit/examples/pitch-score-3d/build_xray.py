#!/usr/bin/env python3
"""X-ray data: put the 3D mannequin back on the phone videos it came from. Reads Motion Studio's twocam outputs only.

  build_xray.py --motion motion.json --trc twocam_3d.trc --log twocam_log.json --out xray.json
      --video LABEL:VIDEO.mp4:PX.trc:OFFSET:CAMERA_INDEX ...   (trial frame f shows video frame f + OFFSET)

The camera of each view comes from twocam's projection matrix (P = K[R|t], focal lengths assumed by twocam).
motion.json holds the joints in the page's axes; a least-squares similarity maps them back onto twocam's 3D,
and the report gives how far each step lands from the 2D points the tracker saw."""
import argparse, base64, json, sys
import numpy as np, cv2

def read_trc3d(p):
    L = open(p).read().splitlines(); names = [x for x in L[3].split('\t')[2::3] if x.strip()]; rows = []
    for l in L[5:]:
        if l.strip():
            v = l.split('\t'); rows.append([float(x) if x.strip() not in ('', 'nan') else np.nan for x in v[2:2 + 3 * len(names)]])
    return names, np.array(rows).reshape(len(rows), len(names), 3)

def umeyama(src, dst):
    ms, md = src.mean(0), dst.mean(0); S, Dd = src - ms, dst - md
    U, sig, Vt = np.linalg.svd(Dd.T @ S / len(src)); E = np.eye(3); E[2, 2] = np.sign(np.linalg.det(U) * np.linalg.det(Vt))
    R = U @ E @ Vt; s = np.trace(np.diag(sig) @ E) / S.var(0).sum(); return s, R, md - s * R @ ms

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--motion', required=True); ap.add_argument('--trc', required=True); ap.add_argument('--log', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--video', action='append', required=True); ap.add_argument('--panel', default='720x405'); ap.add_argument('--quality', type=int, default=62)
    a = ap.parse_args(); pw, ph = map(int, a.panel.split('x'))
    mo = json.load(open(a.motion)); names, Xw = read_trc3d(a.trc); log = json.load(open(a.log)); Ps = [np.array(p) for p in log['geometry']['projections']]
    w0, w1 = mo['window']; src, dst = [], []
    for n, arr in mo['joints'].items():
        if n not in names: continue
        A = np.array(arr); B = Xw[w0:w1 + 1, names.index(n)]; ok = np.array(mo['observed'][n], bool) & np.isfinite(B).all(1)
        src.append(A[ok]); dst.append(B[ok])
    src, dst = np.concatenate(src), np.concatenate(dst); s, R, t = umeyama(src, dst)
    res = np.linalg.norm(src @ (s * R).T + t - dst, axis=1)
    out = dict(reel_to_world=dict(s=float(s), R=R.tolist(), t=t.tolist()), fit_cm=dict(median=round(100 * float(np.median(res)), 1), p90=round(100 * float(np.percentile(res, 90)), 1)), cams=[])
    sys.path.insert(0, '/home/user/modernpitching-motion-studio/backend/pipeline'); from trc import read_trc   # read-only import of Motion Studio's TRC reader
    for spec in a.video:
        label, vid, trc, off, ci = spec.split(':'); off = float(off); P = Ps[int(ci)]
        K, Rc, _, *_ = cv2.decomposeProjectionMatrix(P); K = K / K[2, 2]; M = np.linalg.inv(K) @ P; sc = np.cbrt(np.linalg.det(M[:, :3])); M = M / sc
        Rc, tc = M[:, :3], M[:, 3]
        _, _, Y = read_trc(trc); idx = [int(round(f + off)) for f in range(w0, w1 + 1)]
        pts = Y[[i for i in idx if 0 <= i < len(Y)]].reshape(-1, 2); pts = pts[np.isfinite(pts).all(1)]
        cap = cv2.VideoCapture(vid); Wv, Hv = cap.get(cv2.CAP_PROP_FRAME_WIDTH), cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        (x1, y1), (x2, y2) = np.percentile(pts, 1, 0), np.percentile(pts, 99, 0); cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        h = min(Hv, max((y2 - y1) * 1.3, (x2 - x1) * 1.3 * ph / pw)); w = min(Wv, h * pw / ph); h = w * ph / pw
        cx = min(max(cx, w / 2), Wv - w / 2); cy = min(max(cy, h / 2), Hv - h / 2); X0, Y0 = cx - w / 2, cy - h / 2; k = pw / w
        Kp = np.diag([k, k, 1.]) @ np.array([[1, 0, -X0], [0, 1, -Y0], [0, 0, 1.]]) @ K
        frames = []
        for i in idx:
            cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, i)); ok, im = cap.read()
            if not ok: frames.append(frames[-1] if frames else ''); continue
            crop = cv2.resize(im[int(Y0):int(Y0 + h), int(X0):int(X0 + w)], (pw, ph), interpolation=cv2.INTER_AREA)
            frames.append('data:image/jpeg;base64,' + base64.b64encode(cv2.imencode('.jpg', crop, [cv2.IMWRITE_JPEG_QUALITY, a.quality])[1]).decode())
        # check below: mannequin joints -> world -> this camera, against the tracker's 2D points
        cams = dict(label=label, K=Kp.tolist(), R=Rc.tolist(), t=tc.tolist(), size=[pw, ph], crop=[round(X0), round(Y0), round(w), round(h)], frames=frames)
        Pw = K @ np.hstack([Rc, tc[:, None]]); errs = []
        n2, _, Y2 = read_trc(trc)
        for n, arr in mo['joints'].items():
            if n not in n2: continue
            A = np.array(arr) @ (s * R).T + t
            for f in range(len(A)):
                g = int(round(w0 + f + off))
                if 0 <= g < len(Y2) and mo['observed'][n][f] and np.isfinite(Y2[g, n2.index(n)]).all():
                    hh = Pw @ np.r_[A[f], 1]; errs.append(np.linalg.norm(hh[:2] / hh[2] - Y2[g, n2.index(n)]))
        cams['check_px'] = dict(median=round(float(np.median(errs)), 1), p90=round(float(np.percentile(errs, 90)), 1), n=len(errs))
        out['cams'].append(cams); print(label, 'crop', cams['crop'], 'mannequin-on-video px', cams['check_px'])
    json.dump(out, open(a.out, 'w'), separators=(',', ':')); print('reel->world scale %.3f, fit %s cm' % (s, out['fit_cm']))

if __name__ == '__main__':
    main()
