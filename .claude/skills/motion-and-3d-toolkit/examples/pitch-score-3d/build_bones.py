#!/usr/bin/env python3
"""Anatomical bone layer for the X-ray view, from BodyParts3D (DBCLS).

  build_bones.py BP3D_OBJ_FOLDER INDEX_JSON OUT_bones.json [--faces 130000]

Licence: the DBCLS licence page (updated 2025-02-27) states CC BY 4.0 with the credit
"BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International";
the 2013 OBJ headers still name CC BY-SA 2.1 Japan. Get written confirmation from DBCLS before shipping.

What it does: reads the bones (no cartilage, discs, soft tissue), simplifies them, finds joint centres in the
model itself (femoral and humeral heads, knee, ankle, elbow, wrist, neck base, head centre), groups bones into
rigid segments and stores each segment's geometry in its own rest frame, so the page can move each segment
with the athlete's tracked joints. A template skeleton of one adult male, scaled per segment: it shows where
bones typically sit, not the athlete's own bones."""
import json, sys, re, base64, argparse
import numpy as np, fast_simplification

def load(path):
    V, F = [], []
    for line in open(path, errors='replace'):
        if line.startswith('v '): V.append([float(x) for x in line.split()[1:4]])
        elif line.startswith('f '): F.append([int(t.split('/')[0]) - 1 for t in line.split()[1:4]])
    return np.array(V, float) / 1000.0, np.array(F, np.int64)       # mm -> m

SEG_RULES = [  # (segment, regex on English name), first match wins; side is resolved from the name
    ('thigh', r'femur|patella'), ('shank', r'tibia|fibula'),
    ('foot', r'calcaneus|talus|navicular|cuboid|cuneiform|metatarsal|toe'),
    ('uarm', r'humerus'), ('farm', r'radius|ulna|capitate|hamate|lunate|pisiform|scaphoid|trapezi|trapezoid|triquetral|metacarpal|finger|thumb'),
    ('girdle', r'clavicle|scapula'), ('pelvis', r'hip bone|sacrum|coccyx'), ('lumbar', r'lumbar vertebra'),
    ('thorax', r'thoracic vertebra|rib|sternum|manubrium|xiphoid'), ('neckv', r'cervical vertebra|^atlas$|^axis$|hyoid'),
    ('head', r'frontal bone|parietal bone|occipital bone|temporal bone|sphenoid|ethmoid|mandible|maxilla|zygomatic|nasal bone|lacrimal bone|palatine|vomer')]
EXCLUDE = r'cartilage|disk|artery|vein|nerve|muscle|ligament|tract|gland|lobe|lobule|canaliculus|lake|sac|duct|tributary|levator'

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('folder'); ap.add_argument('index'); ap.add_argument('out'); ap.add_argument('--faces', type=int, default=130000)
    a = ap.parse_args(); idx = json.load(open(a.index)); bones = {}
    for it in idx:
        n = it['name'] or ''
        if re.search(EXCLUDE, n, re.I): continue
        for seg, rx in SEG_RULES:
            if re.search(rx, n, re.I):
                side = 'L' if re.search(r'\bleft\b', n, re.I) else ('R' if re.search(r'\bright\b', n, re.I) else '')
                if seg in ('thigh', 'shank', 'foot', 'uarm', 'farm', 'girdle') and not side: break
                if n in bones: break          # duplicate parts (e.g. two hyoid files): keep one
                V, Fc = load(f"{a.folder}/{it['file']}"); limb = seg in ('thigh', 'shank', 'foot', 'uarm', 'farm', 'girdle')
                bones[n] = dict(seg=seg + side if limb else seg, V=V, F=Fc); break
    M = lambda n: bones[n]['V']
    def top(V, d): return V[V[:, 2] > V[:, 2].max() - d]
    def bot(V, d): return V[V[:, 2] < V[:, 2].min() + d]
    def head_centre(V, d=.055, w=.045):           # femoral or humeral head: the medial end of the top of the bone
        T = top(V, d); ax = np.abs(T[:, 0]); return T[ax < ax.min() + w].mean(0)
    L = {}
    for s, side in (('R', 'Right'), ('L', 'Left')):
        L['hip' + s] = head_centre(M(f'{side} femur')); kf = bot(M(f'{side} femur'), .025).mean(0); kt = top(M(f'{side} tibia'), .02).mean(0)
        L['knee' + s] = (kf + kt) / 2; L['ankle' + s] = M(f'{side} talus').mean(0); L['toe' + s] = M(f'Distal phalanx of {side.lower()} big toe').mean(0)
        L['sh' + s] = head_centre(M(f'{side} humerus'), .045, .04); L['elb' + s] = bot(M(f'{side} humerus'), .025).mean(0)
        L['wr' + s] = (bot(M(f'{side} radius'), .012).mean(0) + bot(M(f'{side} ulna'), .012).mean(0)) / 2
    L['neck'] = (top(M('Manubrium'), .01).mean(0) + M('Seventh cervical vertebra').mean(0)) / 2
    L['head'] = np.concatenate([M(n) for n in ('Frontal bone', 'Occipital bone', 'Left parietal bone', 'Right parietal bone', 'Sphenoid bone')]).mean(0)
    L['midhip'] = (L['hipR'] + L['hipL']) / 2; lat = np.array([1., 0, 0]); up = np.array([0, 0, 1.])
    def frame(O, A, r):
        y = A - O; length = np.linalg.norm(y); y = y / length; x = r - (r @ y) * y; x /= np.linalg.norm(x); z = np.cross(x, y)
        return dict(O=O.tolist(), X=x.tolist(), Y=y.tolist(), Z=z.tolist(), len=float(length))
    # rest frames; the page builds the same frames from the athlete's joints (see template_xray.html)
    RF = {}
    for s, o in (('R', 'L'), ('L', 'R')):
        out = 1. if s == 'L' else -1.   # +x is the body's left in BodyParts3D
        RF['thigh' + s] = frame(L['hip' + s], L['knee' + s], out * lat); RF['shank' + s] = frame(L['knee' + s], L['ankle' + s], L['toe' + s] - L['ankle' + s])
        RF['foot' + s] = frame(L['ankle' + s], L['toe' + s], L['knee' + s] - L['ankle' + s])
        RF['uarm' + s] = frame(L['sh' + s], L['elb' + s], lat); RF['farm' + s] = frame(L['elb' + s], L['wr' + s], lat)   # elbow-plane normal, see the page
        RF['girdle' + s] = frame(L['neck'], L['sh' + s], up)
    RF['pelvis'] = frame(L['midhip'], L['neck'], lat); RF['thorax'] = frame(L['neck'], L['midhip'], lat); RF['head'] = frame(L['neck'], L['head'], lat)
    total = sum(len(b['F']) for b in bones.values()); keep = min(1., a.faces / total); segs = {}
    for n, b in bones.items():
        V, Fc = b['V'], b['F']
        if keep < .98 and len(Fc) > 300:
            V, Fc = fast_simplification.simplify(V.astype(np.float32), Fc.astype(np.int32), target_reduction=1 - max(keep, 300 / len(Fc)))
        seg = b['seg']; base = seg if seg in RF else ('pelvis' if seg == 'lumbar' else 'thorax' if seg == 'neckv' else seg)
        f = RF[base]; R = np.stack([f['X'], f['Y'], f['Z']]); loc = (np.asarray(V, float) - np.array(f['O'])) @ R.T
        d = segs.setdefault(seg, dict(base=base, P=[], I=[], n=0, bones=[]))
        d['P'].append(loc); d['I'].append(np.asarray(Fc) + d['n']); d['n'] += len(loc); d['bones'].append(n)
    out = dict(source='BodyParts3D 4.0 (DBCLS), partof set, simplified', credit='BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
               licence_note='DBCLS licence page (2025-02-27): CC BY 4.0. The 2013 OBJ headers name CC BY-SA 2.1 Japan; confirm with DBCLS before shipping.',
               rest=RF, landmarks={k: np.round(v, 4).tolist() for k, v in L.items()}, segments={})
    for seg, d in segs.items():
        P = np.concatenate(d['P']).astype(np.float32); I = np.concatenate(d['I']).astype(np.uint32 if d['n'] > 65535 else np.uint16)
        out['segments'][seg] = dict(base=d['base'], bones=d['bones'], vertices=len(P), faces=len(I), i32=bool(d['n'] > 65535),
                                    pos=base64.b64encode(P.tobytes()).decode(), idx=base64.b64encode(I.tobytes()).decode())
    json.dump(out, open(a.out, 'w'), separators=(',', ':'))
    print(len(bones), 'bones,', sum(s['faces'] for s in out['segments'].values()), 'faces in', len(segs), 'segments')
    for k in ('hipR', 'kneeR', 'ankleR', 'toeR', 'shR', 'elbR', 'wrR', 'neck', 'head'): print(k, np.round(L[k] * 1000).astype(int).tolist(), 'mm')
    for k in ('thighR', 'shankR', 'uarmR', 'farmR', 'thorax', 'pelvis'): print(k, 'rest length %.3f m' % RF[k]['len'])

if __name__ == '__main__':
    main()
