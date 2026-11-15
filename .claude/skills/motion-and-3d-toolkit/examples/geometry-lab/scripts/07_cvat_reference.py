"""Step 7 (any Python with numpy): the labelling spec and a COCO-keypoints file in the shape CVAT imports and exports.

NOT RUN AGAINST A CVAT SERVER (none is deployed here; `pip install cvat-sdk` does not install one). What IS checked: our own writer and
parser agree, left/right names survive, visibility codes stay in {0,1,2}, frame ids are unique and equal to the source frame index."""
import json, sys
import numpy as np
from pathlib import Path
d = Path(sys.argv[1]).resolve(); out = Path(sys.argv[2]).resolve(); out.mkdir(parents=True, exist_ok=True)
R = np.load(d / "reference_2d_B.npz"); ref = R["reference"]; W, H = [int(v) for v in R["size"]]
J = [str(j) for j in R["joints"]]
NAME = {"P": "pelvis", "hipR": "hip_right", "hipL": "hip_left", "S": "chest", "shR": "shoulder_right", "shL": "shoulder_left", "eR": "elbow_right", "wR": "wrist_right",
        "eL": "elbow_left", "wL": "wrist_left", "kR": "knee_right", "aR": "ankle_right", "kL": "knee_left", "aL": "ankle_left", "head": "head", "neck": "neck"}
names = [NAME[j] for j in J]
BONES = [("pelvis", "chest"), ("chest", "neck"), ("neck", "head"), ("hip_left", "hip_right"), ("shoulder_left", "shoulder_right"),
         ("shoulder_right", "elbow_right"), ("elbow_right", "wrist_right"), ("shoulder_left", "elbow_left"), ("elbow_left", "wrist_left"),
         ("hip_right", "knee_right"), ("knee_right", "ankle_right"), ("hip_left", "knee_left"), ("knee_left", "ankle_left")]

spec = {"_note": "Labelling spec, written from the CVAT skeleton-label shape but not imported into a CVAT server here.",
        "labels": [{"name": "pitcher", "type": "skeleton", "sublabels": [{"name": n, "type": "points", "attributes": []} for n in names]}],
        "rules": {"left_right": "Anatomical side of the athlete, never the side of the image. A mirrored or cropped view does not rename a joint.",
                  "visibility": {"2": "visible (labelled where it is)", "1": "occluded (labelled where it must be; never silently dropped)", "0": "not in frame / not labelled"},
                  "frame_id": "Source video frame index, immutable. Never renumber after trimming or sub-sampling.",
                  "interpolation": "Interpolated keyframes are a proposal. Mark frames a human reviewed; evaluate only on those.",
                  "split": "Hold out whole recordings (and annotators where possible); do not tune a tracker on the frames you score."}}
json.dump(spec, open(out / "labels_spec.json", "w"), indent=1)

CAM = 3; frames = list(range(0, ref.shape[1], 3))
def build(vis_override=None):
    imgs, anns = [], []
    for k, f in enumerate(frames):
        imgs.append({"id": f, "file_name": f"cam{CAM}_f{f:02d}.png", "width": W, "height": H, "source_frame": f})
        kps = []
        for j in range(len(J)):
            x, y = ref[CAM, f, j]; v = 2 if (0 <= x < W and 0 <= y < H) else 0
            if vis_override and (f, j) in vis_override: v = vis_override[(f, j)]
            kps += [round(float(x), 2) if v else 0, round(float(y), 2) if v else 0, v]
        anns.append({"id": k + 1, "image_id": f, "category_id": 1, "keypoints": kps, "num_keypoints": sum(1 for v in kps[2::3] if v > 0), "iscrowd": 0,
                     "attributes": {"synthetic": True, "reviewed": False, "source": "synthetic_truth_not_human_labelled"}})
    return {"info": {"description": "SYNTHETIC reference labels (truth projection). Not human-labelled, not an athlete."}, "images": imgs, "annotations": anns,
            "categories": [{"id": 1, "name": "pitcher", "keypoints": names, "skeleton": [[names.index(a) + 1, names.index(b) + 1] for a, b in BONES]}]}

coco = build(); json.dump(coco, open(out / "reference_cam3.coco.json", "w"))
# fixture with deliberate occluded / not-in-frame states, to prove the codes survive a write/read cycle
fx = build({(3, J.index("wR")): 1, (3, J.index("eR")): 1, (6, J.index("aL")): 0}); json.dump(fx, open(out / "fixture_visibility.coco.json", "w"))

def check(c):
    cats = c["categories"][0]["keypoints"]; ids = [i["id"] for i in c["images"]]
    return {"unique_frame_ids": len(ids) == len(set(ids)), "id_equals_source_frame": all(i["id"] == i["source_frame"] for i in c["images"]),
            "visibility_codes_valid": all(v in (0, 1, 2) for a in c["annotations"] for v in a["keypoints"][2::3]),
            "left_right_names_present": all(n in cats for n in ("shoulder_left", "shoulder_right", "hip_left", "hip_right", "wrist_left", "wrist_right")),
            "points_inside_image": all(0 <= a["keypoints"][i] < W and 0 <= a["keypoints"][i + 1] < H for a in c["annotations"] for i in range(0, len(a["keypoints"]), 3) if a["keypoints"][i + 2] > 0),
            "num_keypoints_consistent": all(a["num_keypoints"] == sum(1 for v in a["keypoints"][2::3] if v > 0) for a in c["annotations"])}
res = {"reference": check(json.load(open(out / "reference_cam3.coco.json")))}
back = json.load(open(out / "fixture_visibility.coco.json")); res["fixture"] = check(back)
a3 = next(a for a in back["annotations"] if a["image_id"] == 3)["keypoints"]; a6 = next(a for a in back["annotations"] if a["image_id"] == 6)["keypoints"]
res["fixture"]["occluded_kept"] = a3[J.index("wR") * 3 + 2] == 1 and a3[J.index("eR") * 3 + 2] == 1
res["fixture"]["not_in_frame_kept"] = a6[J.index("aL") * 3 + 2] == 0
res["all_ok"] = all(all(v.values()) for v in (res["reference"], res["fixture"]))
res["not_tested"] = "import into a running CVAT server; CVAT interpolation; annotator agreement (no human labels exist here)"
json.dump(res, open(out / "roundtrip.json", "w"), indent=1); print(json.dumps(res, indent=1))
