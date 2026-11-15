#!/usr/bin/env python3
"""Inspect a .glb without any dependency and say what will hurt on the web.

    python3 glb_inspect.py model.glb [--json]
    python3 glb_inspect.py --selftest

Reports sizes by kind (geometry, images, animation), counts (nodes, meshes, primitives = draw calls, materials, textures),
the extensions in use, the root transform, joint metadata in node extras, and warnings for the usual mistakes.
Exit code 1 if a WARN is raised. It reads the file; it never modifies it, and it is not a validator
(use the Khronos glTF Validator for conformance).
"""
import json
import struct
import sys
from collections import Counter


def read_glb(path):
    data = open(path, 'rb').read()
    magic, version, length = struct.unpack_from('<4sII', data, 0)
    if magic != b'glTF' or version != 2: raise SystemExit('not a glTF 2.0 binary (.glb)')
    off, doc, bin_len = 12, None, 0
    while off < len(data):
        clen, ctype = struct.unpack_from('<I4s', data, off)
        body = data[off + 8: off + 8 + clen]
        if ctype == b'JSON': doc = json.loads(body.decode('utf8').rstrip(' \0'))
        elif ctype == b'BIN\0': bin_len = clen
        off += 8 + clen            # chunk lengths are already padded to 4 bytes by the format
    if doc is None: raise SystemExit('no JSON chunk')
    return doc, len(data), bin_len


def analyse(doc, size, bin_len):
    views, acc = doc.get('bufferViews', []), doc.get('accessors', [])
    by = Counter()
    used = set()
    for img in doc.get('images', []):
        if 'bufferView' in img: by['images'] += views[img['bufferView']]['byteLength']; used.add(img['bufferView'])
    for mesh in doc.get('meshes', []):
        for pr in mesh.get('primitives', []):
            for a in list(pr.get('attributes', {}).values()) + ([pr['indices']] if 'indices' in pr else []):
                v = acc[a].get('bufferView'); 
                if v is not None and v not in used: by['geometry'] += views[v]['byteLength']; used.add(v)
            for t in pr.get('targets', []):
                for a in t.values():
                    v = acc[a].get('bufferView')
                    if v is not None and v not in used: by['morph targets'] += views[v]['byteLength']; used.add(v)
    for an in doc.get('animations', []):
        for s in an.get('samplers', []):
            for a in (s['input'], s['output']):
                v = acc[a].get('bufferView')
                if v is not None and v not in used: by['animation'] += views[v]['byteLength']; used.add(v)
    by['other'] = sum(v['byteLength'] for i, v in enumerate(views) if i not in used)
    prims = sum(len(m.get('primitives', [])) for m in doc.get('meshes', []))
    verts = sum(acc[pr['attributes']['POSITION']]['count'] for m in doc.get('meshes', []) for pr in m.get('primitives', []) if 'POSITION' in pr.get('attributes', {}))
    nodes = doc.get('nodes', [])
    scene = doc.get('scenes', [{}])[doc.get('scene', 0)] if doc.get('scenes') else {}
    roots = [nodes[i] for i in scene.get('nodes', [])]
    root_scale = [r.get('scale') for r in roots if r.get('scale')]
    joints = [(n.get('name'), n['extras']['s3d_joint']) for n in nodes if isinstance(n.get('extras'), dict) and 's3d_joint' in n['extras']]
    ext_used, ext_req = doc.get('extensionsUsed', []), doc.get('extensionsRequired', [])
    mats = doc.get('materials', [])
    rep = {'file_bytes': size, 'bin_bytes': bin_len, 'by_kind': dict(by), 'nodes': len(nodes), 'meshes': len(doc.get('meshes', [])), 'primitives': prims,
           'vertices': verts, 'materials': len(mats), 'textures': len(doc.get('textures', [])), 'images': len(doc.get('images', [])),
           'skins': len(doc.get('skins', [])), 'animations': len(doc.get('animations', [])), 'extensions_used': ext_used, 'extensions_required': ext_req,
           'root_scale': root_scale, 'joint_nodes': len(joints), 'generator': doc.get('asset', {}).get('generator')}
    warn, note = [], []
    geo = by.get('geometry', 0) + by.get('morph targets', 0)
    compressed = any(e in ext_used for e in ('EXT_meshopt_compression', 'KHR_draco_mesh_compression'))
    if geo > 500_000 and not compressed: warn.append(f'{geo/1e6:.1f} MB of uncompressed geometry: apply meshopt (EXT_meshopt_compression) or Draco, and quantise')
    if by.get('images', 0) > 1_000_000 and 'KHR_texture_basisu' not in ext_used: warn.append(f"{by['images']/1e6:.1f} MB of PNG/JPEG textures: GPU-compressed KTX2 (KHR_texture_basisu) cuts download and VRAM")
    if prims > 100: warn.append(f'{prims} primitives means about that many draw calls: merge meshes that share a material, or instance them')
    if len(set(m.get('name', i) for i, m in enumerate(mats))) < len(mats): note.append('duplicate material names: usually duplicated materials; deduplicate')
    if root_scale and any(abs(s[0] - 1) > 1e-6 for s in root_scale):
        warn.append(f'scene root scaled by {root_scale[0]}: positions inside are in another unit. Anything that moves nodes (joints, animations, a viewer slider) must convert units')
    if verts and prims and verts / prims < 60: note.append(f'average {verts//prims} vertices per primitive: many tiny meshes')
    unnamed = sum(1 for n in nodes if not n.get('name'))
    if unnamed: warn.append(f'{unnamed} unnamed nodes: name every node a script, a configurator or an animation must find')
    if ext_req and not set(ext_req) <= {'KHR_materials_pbrSpecularGlossiness'} and compressed: note.append('required extensions: the viewer needs the matching decoder (' + ', '.join(ext_req) + ')')
    if joints: note.append(f'{len(joints)} joints in node extras (s3d_joint): ' + ', '.join(f'{n}:{j.get("type")}' for n, j in joints[:6]))
    if doc.get('skins') and not doc.get('animations'): note.append('has skins but no animations: poses will come from code')
    return rep, warn, note


def selftest():
    """Build a tiny valid GLB in memory (one triangle, a root scaled 0.001, one unnamed node) and check what is reported."""
    import os, tempfile
    pos = struct.pack('<9f', 0, 0, 0, 1, 0, 0, 0, 1, 0)
    doc = {'asset': {'version': '2.0', 'generator': 'selftest'}, 'scene': 0, 'scenes': [{'nodes': [0]}],
           'nodes': [{'name': 'root', 'scale': [.001] * 3, 'children': [1]}, {'mesh': 0}], 'meshes': [{'primitives': [{'attributes': {'POSITION': 0}}]}],
           'accessors': [{'bufferView': 0, 'componentType': 5126, 'count': 3, 'type': 'VEC3', 'min': [0, 0, 0], 'max': [1, 1, 0]}],
           'bufferViews': [{'buffer': 0, 'byteLength': len(pos)}], 'buffers': [{'byteLength': len(pos)}]}
    js = json.dumps(doc).encode(); js += b' ' * (-len(js) % 4)
    blob = struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(pos) + 0, b'BIN\0') + pos
    glb = struct.pack('<4sII', b'glTF', 2, 12 + len(blob)) + blob
    path = os.path.join(tempfile.mkdtemp(), 't.glb'); open(path, 'wb').write(glb)
    rep, warn, note = analyse(*read_glb(path))
    assert rep['primitives'] == 1 and rep['vertices'] == 3 and rep['by_kind'].get('geometry') == len(pos), rep
    assert any('scaled' in w for w in warn) and any('unnamed' in w for w in warn), warn
    print('selftest ok: parsed a synthetic GLB, found the root scale and the unnamed node')


def main():
    if '--selftest' in sys.argv: return selftest()

    if len(sys.argv) < 2 or sys.argv[1] in ('-h', '--help'): print(__doc__); sys.exit(2)
    doc, size, bin_len = read_glb(sys.argv[1])
    rep, warn, note = analyse(doc, size, bin_len)
    if '--json' in sys.argv: print(json.dumps({**rep, 'warn': warn, 'note': note}, indent=2)); sys.exit(1 if warn else 0)
    mb = lambda b: f'{b/1e6:.2f} MB'
    print(f"{sys.argv[1]}: {mb(size)} total, generator {rep['generator']}")
    print('  by kind:', ', '.join(f'{k} {mb(v)}' for k, v in sorted(rep['by_kind'].items(), key=lambda kv: -kv[1]) if v))
    print(f"  {rep['nodes']} nodes, {rep['meshes']} meshes, {rep['primitives']} primitives, {rep['vertices']:,} vertices, {rep['materials']} materials, {rep['textures']} textures, {rep['animations']} animations, {rep['skins']} skins")
    print('  extensions:', rep['extensions_used'] or 'none', '| required:', rep['extensions_required'] or 'none', '| root scale:', rep['root_scale'] or 'none')
    for w in warn: print('  WARN', w)
    for n in note: print('  note', n)
    if not warn: print('  no warnings')
    sys.exit(1 if warn else 0)


if __name__ == '__main__':
    main()
