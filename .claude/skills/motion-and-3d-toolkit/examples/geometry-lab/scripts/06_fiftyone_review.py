"""Step 6 (FiftyOne env): put reference and predictions side by side, find where and why they disagree, export for reproducibility.

SYNTHETIC fixtures. The 'reference' stands in for reviewed CVAT labels; it is NOT human-labelled and NOT an athlete.
Reference and each prediction live in separate fields so they can never overwrite each other."""
import json, sys, os
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw
d = Path(sys.argv[1]).resolve(); out = Path(sys.argv[2]).resolve(); out.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(Path(__file__).resolve().parent)); import labgeom as G
os.environ["FIFTYONE_DATABASE_DIR"] = str(d / "fo_db"); os.environ["FIFTYONE_DO_NOT_TRACK"] = "true"
import fiftyone as fo

S = np.load(d / "session_subject0.npz"); R = np.load(d / "reference_2d_B.npz")
J = [str(j) for j in S["joints"]]; W, H = [int(v) for v in R["size"]]
ref = R["reference"]; sc = "B_cam3_knocked_1deg"; obs = S[f"{sc}__obs"]
est = json.load(open(d / "calib" / "estimated_cameras_truthframe.json"))["cameras"]
def reproj(X3): return np.stack([G.project(c, X3.reshape(-1, 3)).reshape(X3.shape[0], X3.shape[1], 2) for c in est])
pred = {"naive": reproj(S[f"{sc}__naive__X3"]), "repaired": reproj(S[f"{sc}__repaired__X3"])}
SW = [(J.index("hipR"), J.index("hipL")), (J.index("shR"), J.index("shL"))]

def kp(arr, label, **attrs):
    pts = [(float(x) / W, float(y) / H) if np.isfinite(x) else (float("nan"), float("nan")) for x, y in arr]
    return fo.Keypoints(keypoints=[fo.Keypoint(label=label, points=pts, joints=J, **attrs)])

def image(path, cam, f):
    im = Image.new("RGB", (960, 540), (24, 28, 34)); dr = ImageDraw.Draw(im)
    for x in range(0, 960, 80): dr.line([(x, 0), (x, 540)], fill=(34, 40, 48))
    for y in range(0, 540, 80): dr.line([(0, y), (960, y)], fill=(34, 40, 48))
    dr.text((14, 12), f"SYNTHETIC  |  camera {cam}  |  frame {f}", fill=(220, 160, 90)); im.save(path)

ds = fo.Dataset("geometry_lab_review", overwrite=True) if hasattr(fo.Dataset, "overwrite") else fo.Dataset("geometry_lab_review")
samples = []
for cam in (0, 3):
    for f in range(0, ref.shape[1], 3):
        p = out / "images" / f"cam{cam}_f{f:02d}.png"; p.parent.mkdir(exist_ok=True); image(p, cam, f)
        r2, o2 = ref[cam, f], obs[cam, f]
        e = {k: np.linalg.norm(v[cam, f] - r2, axis=1) for k, v in pred.items()}
        missing = int(np.isnan(o2[:, 0]).sum())
        swap = any(np.isfinite(o2[a]).all() and np.isfinite(o2[b]).all() and np.linalg.norm(o2[a] - r2[b]) < np.linalg.norm(o2[a] - r2[a]) and np.linalg.norm(o2[b] - r2[a]) < np.linalg.norm(o2[b] - r2[b]) for a, b in SW)
        en, er = float(np.nanmean(e["naive"])), float(np.nanmean(e["repaired"]))
        failure = "wrong_anatomy" if swap else ("missed_joints" if missing >= 3 else ("geometry" if en > 10 and cam == 3 else "ok"))
        s = fo.Sample(filepath=str(p), tags=[f"cam{cam}"] + (["knocked_camera"] if cam == 3 else []))
        s["camera"], s["frame"], s["subject"], s["scenario"], s["synthetic"] = cam, f, "S01", sc, True
        s["reference"] = kp(r2, "reference", visibility=[2] * len(J), source="synthetic_truth_not_human_labelled")
        s["detector"] = kp(o2, "detector", note="2D detector stand-in: truth + noise + dropouts + L/R swaps")
        s["prediction_naive"] = kp(pred["naive"][cam, f], "naive_4cam")
        s["prediction_repaired"] = kp(pred["repaired"][cam, f], "repaired")
        s["err_naive_px"], s["err_repaired_px"], s["detector_missing"], s["lr_swap"], s["failure"] = en, er, missing, bool(swap), failure
        samples.append(s)
ds.add_samples(samples); ds.persistent = True
ds.save_view("worst_naive", ds.sort_by("err_naive_px", reverse=True).limit(8))
ds.save_view("wrong_anatomy", ds.match(fo.ViewField("lr_swap") == True))
ds.save_view("knocked_camera_only", ds.match_tags("knocked_camera"))

summ = {"n_samples": len(ds), "failure_counts": ds.count_values("failure"),
        "mean_err_px_by_camera": {str(c): {"naive": float(ds.match(fo.ViewField("camera") == c).mean("err_naive_px")), "repaired": float(ds.match(fo.ViewField("camera") == c).mean("err_repaired_px"))} for c in (0, 3)},
        "saved_views": ds.list_saved_views()}
json.dump(summ, open(out / "review_summary.json", "w"), indent=1)
json.dump({k: str(v) for k, v in ds.get_field_schema().items()}, open(out / "dataset_schema.json", "w"), indent=1)
json.dump({v: [{"id": s.id, "file": os.path.basename(s.filepath), "err_naive_px": s.err_naive_px, "failure": s.failure} for s in ds.load_saved_view(v)] for v in ds.list_saved_views()},
          open(out / "review_selections.json", "w"), indent=1)
ds.export(export_dir=str(out / "export"), dataset_type=fo.types.FiftyOneDataset, export_media=True)
# round trip: re-import the export into a fresh dataset and check that nothing was lost or merged
back = fo.Dataset.from_dir(dataset_dir=str(out / "export"), dataset_type=fo.types.FiftyOneDataset, name="geometry_lab_roundtrip", overwrite=True) if True else None
ok = len(back) == len(ds) and set(back.get_field_schema()) == set(ds.get_field_schema())
a, b = ds.first(), back.first()
ok = ok and all(a[f].keypoints[0].label == b[f].keypoints[0].label for f in ("reference", "detector", "prediction_naive", "prediction_repaired"))
json.dump({"roundtrip_ok": bool(ok), "n_back": len(back)}, open(out / "roundtrip.json", "w"))
print(json.dumps(summ, indent=1)[:1500]); print("roundtrip ok:", ok)
