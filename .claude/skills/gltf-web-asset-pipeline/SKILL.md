---
name: gltf-web-asset-pipeline
description: Prepares 3D models and scenes for the web as glTF/GLB - inspecting a file for size, draw calls, unit and naming problems, compressing geometry and textures, naming nodes so code can drive them, loading in three.js, and the patterns for product and garment configurators (share links, decals, pattern pieces, baked cloth) and anatomy or skeleton viewers, with a licence checklist for model assets. Use this whenever the user works with GLB or glTF files, three.js or react-three-fiber, a 3D product or clothing configurator, a virtual try-on, a 3D skeleton or anatomy viewer, or has a model that is too big, too slow or moves the wrong way in the browser - even if they never say "glTF". Includes a tested dependency-free GLB inspector.
---

# glTF web asset pipeline

The reliable web 3D format is glTF, and most problems with it are the same few: too heavy, too many draw calls, units that disagree, nodes with no names, textures uncompressed, a licence nobody read. This skill checks for them. Its inspector was run on a real file; the compression tools it names were **not** run here (see Not verified).

## 1. Inspect first

```bash
python3 scripts/glb_inspect.py model.glb          # sizes by kind, counts, extensions, root scale, joint metadata, WARN lines
python3 scripts/glb_inspect.py --selftest
```

Standard library only; reads the file, never changes it. It is not a validator: run the Khronos glTF Validator for conformance. Exit code 1 means a WARN.

On the baseball-kit model made earlier with `sand3d-modeling` (5.9 MB, 29 meshes, 6 joints) it reported two real problems that had already cost time:
- **5.9 MB of uncompressed geometry.** No `EXT_meshopt_compression`, no quantisation.
- **A root scaled by 0.001.** The model's positions are in millimetres under a root that converts to metres, while the joint limits in `extras` are in metres. A viewer that slides a prismatic joint by its limit moves the part by 1 mm unless it divides by the parent's world scale. The first viewer of that model did exactly that. Whenever a file mixes units, say so in the asset's README and convert in code.

## 2. What to do about each finding

The tools below are the standard open ones; check their current documentation, because commands change.

- **Geometry weight:** meshopt compression with quantisation (`gltfpack -cc`, or glTF-Transform's `optimize`/`meshopt`), or Draco. Meshopt decodes fast and keeps animation data friendly; Draco compresses static meshes harder. The viewer must register the matching decoder (`MeshoptDecoder`, `DRACOLoader`), or the file will not load.
- **Textures:** GPU-compressed KTX2 (`KHR_texture_basisu`; `toktx` or glTF-Transform) instead of PNG or JPEG for large maps. ETC1S is small, UASTC higher quality. A 12-megapixel ceiling for ETC1S was reported by one asset tool's README.
- **Draw calls:** each primitive is roughly one. Merge meshes that share a material, instance repeated parts, and remember the stitching on a baseball is a per-ball mesh unless merged.
- **Names:** every node a script, a configurator, an animation or an MCP tool must find needs a stable name. Add anchors (empty nodes) for joints and attachment points; one anatomy model used 12 position-only joint hotspots for joints that had no mesh.
- **Units and axes:** glTF is metres, Y up. Convert at export, not in the viewer. Record the unit in `asset.extras`.

## 3. Patterns that held up in the repos read

Small, young repos (0 to 20 stars, 2026-10-05 onwards). Treat them as sources of ideas, not dependencies.

- **Garments:** make the UV islands equal the flat pattern pieces, so artwork placed on a piece maps 1:1 onto the fabric (`orelIL123/fashion-builder`). Simulate cloth offline, **bake it as morph targets or an animation**, and play that back in the browser (`stealthcrsh/ai-3d-studio`). Real sewing patterns can come from FreeSewing source (`therebelrobot/dressform`, Unlicense). Check seam lengths match before simulating. The Blender-cloth lab (`parka-oss/prenda3d-lab`) fails on any Blender other than the one it reads memory offsets for.
- **Configurators:** put the configuration in a small JSON object and encode it in the URL hash for share links; project a monogram or logo as a canvas-texture decal; keep prices in data (`inmanjeffrey89-cell/product-configurator-3d`, MIT, primitives only). **Re-price on the server** at checkout: client-side prices can be edited.
- **Skeleton and anatomy viewers:** named glTF nodes per structure, loaded with the meshopt decoder, plus joint anchors (`MervinR07/open-anatomy-3d`: code MIT, models CC BY 4.0, a static relaxed pose, not rigged). A moving pitching skeleton needs the project's own rig or drawn bones.
- **Viewing and trimming files:** a local desktop inspector exists (`cullenwebber/glb-viewer`, macOS, not notarised, no licence found); for a published check, the Khronos validator is enough.

## 4. Licences for assets

- **CC BY** needs attribution in the product. **CC BY-NC** forbids commercial use. **CC0** needs nothing. A repo licence (MIT) does not cover the models inside it: read `LICENSE-MODELS` or the equivalent.
- A scan, photo or avatar of a person is personal data: get permission, and do not publish an athlete's body scan without it.
- Record each asset's source, licence and date in the repo next to the file.

## 5. In three.js

```js
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);   // and a KTX2Loader for KTX2 textures
const gltf = await loader.loadAsync('model.glb');
const joint = gltf.scene.getObjectByName('swivel');               // by name, never by index
```

If a hosting platform will not serve `.glb`, carry the file as base64 in JSON and call `loader.parse` on the decoded bytes. Test on a phone-sized screen: draw calls and texture memory bite there first.

## Not verified

`gltf-transform`, `gltfpack`, `toktx` and the Khronos validator: an attempt to fetch and run them through `npx` was blocked by the environment's safety check, so their commands above come from general knowledge of the tools and must be checked against current docs. The repo claims in section 3 were read from READMEs, not run; all those repos were under a month old.

## Ship checklist

- [ ] `glb_inspect.py` run; each WARN fixed or reasoned away.
- [ ] Units documented and converted in one place; nodes named.
- [ ] Geometry and textures compressed, decoders registered in the viewer.
- [ ] Opens in the Khronos validator without errors, and on a phone.
- [ ] Every asset's licence recorded and any attribution shown.
