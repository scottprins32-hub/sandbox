"""Step 3 (classic aniposelib env): is the Caliscope calibration good enough, judged on frames it never saw?"""
import json, sys
import numpy as np, pandas as pd
from pathlib import Path
from aniposelib.cameras import CameraGroup
sys.path.insert(0, str(Path(__file__).resolve().parent))  # -I drops the script dir; our own helper lives here
import labgeom as G

d = Path(sys.argv[1])
cg = CameraGroup.load(d / "calibration_estimated.toml")
est = json.load(open(d / "estimated_cameras.json"))["cameras"]
truth = json.load(open(d / "truth_cameras.json"))["cameras"]
W = pd.read_csv(d / "truth_world_points.csv").set_index(["sync_index", "keypoint_id"])
fit = pd.read_csv(d / "fit_points.csv"); held = pd.read_csv(d / "heldout_points.csv")

def tri(df):
    P, keys = G.points_from_df(df)
    X = cg.triangulate(P.copy(), undistort=True)          # (points, 3), estimated gauge
    return P, keys, X

# 1. gauge: the estimate lives in its own frame (camera 0 = origin). Align on the FIT frames only.
Pf, kf, Xf = tri(fit)
XYZ = ["x_coord", "y_coord", "z_coord"]   # named on purpose: positional slicing once picked object_id by mistake
Tf = W.loc[kf, XYZ].to_numpy()
s, R, t = G.umeyama(Xf, Tf)
print(f"gauge alignment from fit frames: scale {s:.5f} (1 = metres), residual after alignment "
      f"{1000*np.linalg.norm((s*Xf@R.T+t)-Tf,axis=1).mean():.2f} mm")

# 2. held-out frames: triangulate, apply the fit-frame alignment, compare with truth
Ph, kh, Xh = tri(held)
Th = W.loc[kh, XYZ].to_numpy()
err = 1000 * np.linalg.norm((s * Xh @ R.T + t) - Th, axis=1)
print(f"HELD-OUT 3D error: median {np.median(err):.2f} mm, p95 {np.percentile(err,95):.2f} mm, max {err.max():.2f} mm (n={len(err)})")

# 3. independent known distance: horizontal neighbours on the board are 0.15 m apart
kk = pd.DataFrame(kh, columns=["sync", "kp"]); kk[["x", "y", "z"]] = s * Xh @ R.T + t
Wx = W.reset_index(); gt_pairs = []
by = kk.set_index(["sync", "kp"])
dists = []
for (sy, kp), row in by.iterrows():
    nb = (sy, kp + 1)
    if nb in by.index and (kp + 1) % 6 != 0:        # charuco 5x7 board has 6 inner corners per row
        dists.append(np.linalg.norm(row[["x","y","z"]].to_numpy(float) - by.loc[nb][["x","y","z"]].to_numpy(float)))
dists = np.array(dists)
print(f"known 0.150 m board spacing, held-out frames: mean {1000*dists.mean():.2f} mm, sd {1000*dists.std():.2f} mm, n={len(dists)}")

# 4. cameras vs truth (only possible because this is synthetic)
aligned = G.align_cameras_to_truth_frame(est, s, R, t)
cam_rows = []
for a, b in zip(aligned, truth):
    Ra = np.asarray(a["R"], float); Rb = G.rodrigues(np.asarray(b["R"], float).ravel()) if np.asarray(b["R"]).size == 3 else np.asarray(b["R"], float)
    cam_rows.append({"cam": a["id"], "centre_err_mm": 1000 * float(np.linalg.norm(G.cam_center(a) - G.cam_center(b))),
                     "rot_err_deg": G.rot_angle_deg(Ra, Rb)})
for r in cam_rows: print("camera", r["cam"], "centre error %.2f mm, rotation error %.4f deg" % (r["centre_err_mm"], r["rot_err_deg"]))

# 5. per-camera 2D residual on held-out frames (aniposelib's own measure)
res = []
for c in range(4):
    e = cg.reprojection_error(Xh, Ph, mean=False)[c]    # (points, 2)
    res.append(np.nanmean(np.linalg.norm(e, axis=1)))
print("held-out reprojection residual per camera (px):", [round(float(x), 3) for x in res])

json.dump({"gauge_scale": s, "heldout_3d_error_mm": {"median": float(np.median(err)), "p95": float(np.percentile(err, 95)), "max": float(err.max()), "n": int(len(err))},
           "known_distance_mm": {"nominal": 150.0, "mean": float(1000*dists.mean()), "sd": float(1000*dists.std()), "n": int(len(dists))},
           "cameras_vs_truth": cam_rows, "heldout_residual_px": [float(x) for x in res]},
          open(d / "calibration_check.json", "w"), indent=1)
json.dump({"s": s, "R": R.tolist(), "t": t.tolist()}, open(d / "gauge_alignment.json", "w"))
json.dump({"cameras": aligned}, open(d / "estimated_cameras_truthframe.json", "w"), default=lambda o: np.asarray(o).tolist())
