"""Step 4 (classic aniposelib env): a synthetic pitching session seen by the calibrated 4-camera rig.

SYNTHETIC. Truth = the Pitch Lab skeleton. 'Detector' = truth projection + noise + dropouts + left/right swaps.
Scenarios: A clean | B camera 3 knocked after calibration | C camera 1 stream 2 frames late.
"""
import json, sys, time
import numpy as np, pandas as pd
from pathlib import Path
from aniposelib.cameras import CameraGroup
sys.path.insert(0, str(Path(__file__).resolve().parent))  # -I drops the script dir; our own helper lives here
import labgeom as G

d = Path(sys.argv[1]); NSUB = int(sys.argv[2]) if len(sys.argv) > 2 else 40
pose = json.load(open(d / "pose.json")); subs = pose["subjects"][:NSUB]; NF = pose["n_frames"]
J = ["P","hipR","hipL","S","shR","shL","eR","wR","eL","wL","kR","aR","kL","aL","head","neck"]; NJ = len(J)
SWAP = [("hipR","hipL"),("shR","shL")]                  # the anatomy errors that matter for hip-shoulder separation
truth = json.load(open(d / "calib" / "truth_cameras.json"))["cameras"]
est = json.load(open(d / "calib" / "estimated_cameras_truthframe.json"))["cameras"]

def to_world(a):                                       # Pitch Lab (x fwd, y up, z lateral) -> z-up world, proper rotation (det +1)
    a = np.asarray(a, float); return np.stack([a[..., 0] - 0.75, -a[..., 2], a[..., 1]], -1)
X = np.array([[ [to_world(s["joints"][j][f]) for j in J] for f in range(NF)] for s in subs])   # (sub, frame, joint, 3)

def group(cams):
    dicts = [{"name": f"cam_{c['id']}", "size": c["size"], "matrix": np.asarray(c["K"]).tolist(), "distortions": np.asarray(c["dist"]).tolist(),
              "rotation": G.rvec(np.asarray(c["R"]) if np.asarray(c["R"]).size == 9 else G.rodrigues(np.asarray(c["R"]).ravel())).tolist(),
              "translation": np.asarray(c["t"], float).tolist()} for c in cams]
    return CameraGroup.from_dicts(dicts)

def bump(cams, cam_id, deg):
    out = [dict(c) for c in cams]; c = out[cam_id]
    R = np.asarray(c["R"], float); R = R if R.size == 9 else G.rodrigues(R.ravel()); R = R.reshape(3, 3)
    a = np.radians(deg); D = np.array([[np.cos(a), 0, np.sin(a)], [0, 1, 0], [-np.sin(a), 0, np.cos(a)]])   # about the camera's own y axis
    c["R"] = D @ R; c["t"] = D @ np.asarray(c["t"], float); return out

def observe(cams, rng, lag_cam=None, lag=0, sigma=1.5, drop=0.08, swap=0.04):
    """-> P (sub, cam, frame, joint, 2) with NaN for dropouts. Also returns the mask of swapped observations."""
    P = np.full((len(subs), 4, NF, NJ, 2), np.nan); W = np.zeros(P.shape[:4], bool)
    for ci, c in enumerate(cams):
        for si in range(len(subs)):
            Xs = X[si]
            if lag_cam == ci and lag:                 # this camera's stream is `lag` frames late: frame f shows the world of f-lag
                idx = np.clip(np.arange(NF) - lag, 0, NF - 1); Xs = Xs[idx]
            p = G.project(c, Xs.reshape(-1, 3)).reshape(NF, NJ, 2) + rng.normal(0, sigma, (NF, NJ, 2))
            for f in np.where(rng.random(NF) < swap)[0]:      # detector swaps left/right on hips and shoulders in this frame
                for a, b in SWAP:
                    ia, ib = J.index(a), J.index(b); p[f, [ia, ib]] = p[f, [ib, ia]]; W[si, ci, f, [ia, ib]] = True
            p[rng.random((NF, NJ)) < drop] = np.nan
            P[si, ci] = p
    return P, W

def triangulate(cg, P, mode, drop_cam=None):
    """P (sub,cam,frame,joint,2) -> (sub,frame,joint,3). mode: plain | ransac. drop_cam: ignore that camera entirely."""
    n = P.shape[0] * NF * NJ
    flat = P.transpose(1, 0, 2, 3, 4).reshape(4, n, 2).copy()
    if drop_cam is not None:                       # a fully-NaN camera breaks triangulate_ransac, so really remove it
        keep = [k for k in range(4) if k != drop_cam]; cg = cg.subset_cameras(keep); flat = flat[keep]
    if mode == "plain":
        out = cg.triangulate(flat, undistort=True)
    else:
        # aniposelib's ransac crashes on points seen by no camera and returns nonsense for points seen by one, so triangulate only
        # points with >= 2 cameras and leave the rest NaN (a missing value stays missing; it is never invented).
        seen = (~np.isnan(flat[..., 0])).sum(0) >= 2; out = np.full((flat.shape[1], 3), np.nan)
        out[seen] = cg.triangulate_ransac(flat[:, seen].copy(), undistort=True, min_cams=3 if drop_cam is None else 2)[0]
    return out.reshape(P.shape[0], NF, NJ, 3)

def flat_obs(P): return P.transpose(1, 0, 2, 3, 4).reshape(4, -1, 2).copy()

def screened(cg, P, drop_cam=None, thr=8.0, rounds=3):
    """Plain triangulation + residual screening: while a point's worst camera residual exceeds thr px and >=3 cameras see it, discard that one view.
    thr = 8 px is about 5 sigma of the 1.5 px detector noise used here. Returns (X3, n_views_rejected)."""
    flat = flat_obs(P); cgx = cg
    if drop_cam is not None:
        keep = [k for k in range(4) if k != drop_cam]; cgx = cg.subset_cameras(keep); flat = flat[keep]
    nrej = 0
    for _ in range(rounds):
        X3 = cgx.triangulate(flat.copy(), undistort=True)
        e = np.linalg.norm(np.asarray(cgx.reprojection_error(X3, flat, mean=False)), axis=-1); e = np.nan_to_num(e, nan=0.0)
        seen = (~np.isnan(flat[..., 0])).sum(0); bad = (e.max(0) > thr) & (seen >= 3)
        if not bad.any(): break
        idx = np.where(bad)[0]; flat[e.argmax(0)[idx], idx] = np.nan; nrej += len(idx)
    X3 = cgx.triangulate(flat.copy(), undistort=True)
    return X3.reshape(P.shape[0], NF, NJ, 3), nrej

def drop_one(cg, P):
    """Residual (px, median over the OTHER cameras) after triangulating without camera c. A faulty camera is the one whose removal
    makes the rest agree; with a healthy rig all four numbers sit near the all-cameras baseline."""
    flat = flat_obs(P)
    def resid(fl, skip=None):
        X3 = cg.triangulate(fl.copy(), undistort=True); e = cg.reprojection_error(X3, fl, mean=False)
        return float(np.nanmedian([np.nanmedian(np.linalg.norm(e[c], axis=1)) for c in range(4) if c != skip]))
    base = resid(flat); out = []
    for c in range(4):
        fl = flat.copy(); fl[c] = np.nan; out.append(resid(fl, skip=c))
    return base, out

def flagged_camera(base, without, ratio=0.6):
    c = int(np.argmin(without)); return c if without[c] < ratio * base else None

def loo_series(cg, P, c):
    """Per-frame residual of camera c against the 3D from the other cameras, and the observed vs projected wrist-x series (px)."""
    X3 = triangulate(cg, P, "plain", drop_cam=c)                       # (sub, frame, joint, 3) without camera c
    pr = cg.cameras[c].project(X3.reshape(-1, 3)).reshape(P.shape[0], NF, NJ, 2)
    obs = P[:, c]; err = np.linalg.norm(pr - obs, axis=-1)             # (sub, frame, joint)
    speed = np.linalg.norm(np.diff(X3, axis=1, prepend=X3[:, :1]), axis=-1)  # m per frame
    return X3, pr, obs, err, speed

def interp(v):
    v = np.asarray(v, float); ok = ~np.isnan(v)
    return np.interp(np.arange(len(v)), np.where(ok)[0], v[ok]) if ok.sum() > 1 else v

def separation(X3, smooth=5):
    """Peak hip-shoulder separation (deg) per subject, horizontal plane. Returns (naive raw peak, defensible filtered peak, series)."""
    def ang(a, b): v = X3[:, :, J.index(a)] - X3[:, :, J.index(b)]; return np.degrees(np.arctan2(v[..., 1], v[..., 0]))
    diff = ang("shR", "shL") - ang("hipR", "hipL"); diff = (diff + 180) % 360 - 180
    raw = np.nanmax(np.abs(diff), axis=1)
    sm = pd.DataFrame(np.abs(diff).T).rolling(smooth, center=True, min_periods=1).median().to_numpy().T   # kills 1-3 frame left/right swaps
    return raw, np.nanmax(sm, axis=1), diff

if __name__ == "__main__":
    sys.path.insert(0, "/home/user/sandbox/.claude/skills/estimated-motion-validation/scripts")  # the validation skill script (stdlib only)
    import motion_validate as MV
    cg_est = group(est); out = {"label": "SYNTHETIC session; truth = Pitch Lab skeleton; n_subjects=%d" % len(subs), "frames": NF, "scenarios": {}}
    sep_true_raw, sep_true, _ = separation(X)
    scen = {"A_clean": dict(cams=truth), "B_cam3_knocked_1deg": dict(cams=bump(truth, 3, 1.0)), "C_cam1_late_2frames": dict(cams=truth, lag_cam=1, lag=2)}
    keep = {}
    for name, kw in scen.items():
        t0 = time.time(); r = np.random.default_rng(11)               # same noise stream for every scenario: only the fault differs
        P, Wm = observe(kw["cams"], r, kw.get("lag_cam"), kw.get("lag", 0))
        row = {"observations_missing_pct": float(100 * np.isnan(P[..., 0]).mean()), "swapped_pct": float(100 * Wm.mean())}
        base, without = drop_one(cg_est, P); c = flagged_camera(base, without)
        row["drop_one"] = {"baseline_px": base, "without_cam_px": without, "flagged_camera": c}
        pipes = {}; rej = {}
        pipes["naive"] = triangulate(cg_est, P, "plain")
        pipes["ransac"] = triangulate(cg_est, P, "ransac")          # aniposelib's own robust option, kept for comparison
        pipes["screened"], rej["screened"] = screened(cg_est, P)
        if c is not None:
            X3, pr, obs, err, speed = loo_series(cg_est, P, c)
            ok = ~np.isnan(err) & ~np.isnan(speed)
            row["signature"] = {"camera": c, "residual_vs_speed_corr": float(np.corrcoef(err[ok], speed[ok])[0, 1]),
                                "median_residual_px": float(np.nanmedian(err))}
            wi = J.index("wR"); lags = []
            for si in range(len(subs)):
                a_, b_ = interp(pr[si, :, wi, 0]), interp(obs[si, :, wi, 0])
                if np.isfinite(a_).all() and np.isfinite(b_).all(): lags.append(MV.best_lag(list(a_), list(b_), 6)["lag_samples"])
            row["signature"]["wrist_x_lag_samples_median"] = float(np.median(lags))
            lagfix = int(np.median(lags))
            if abs(lagfix) >= 1 and row["signature"]["residual_vs_speed_corr"] > 0.3:       # speed-dependent -> timing, not geometry
                P2 = P.copy(); idx = np.clip(np.arange(NF) + lagfix, 0, NF - 1); P2[:, c] = P[:, c][:, idx]
                row["repair"] = f"shift camera {c} by {-lagfix} frames (timing)"; pipes["repaired"], rej["repaired"] = screened(cg_est, P2)
            else:
                row["repair"] = f"exclude camera {c} (geometry changed after calibration)"; pipes["repaired"], rej["repaired"] = screened(cg_est, P, drop_cam=c)
        row["views_rejected"] = rej
        for k, X3 in pipes.items():
            e = 1000 * np.linalg.norm(X3 - X, axis=-1); raw, filt, _ = separation(X3)
            row[k] = {"joint_err_mm_median": float(np.nanmedian(e)), "joint_err_mm_p95": float(np.nanpercentile(e, 95)), "wrist_at_release_err_mm_median": float(np.nanmedian(e[:, int(0.85 * (NF - 1)), J.index("wR")])), "nan_pct": float(100 * np.isnan(e).mean()),
                      "separation_raw_mae_deg": float(np.nanmean(np.abs(raw - sep_true_raw))), "separation_filtered_mae_deg": float(np.nanmean(np.abs(filt - sep_true))),
                      "separation_filtered_bias_deg": float(np.nanmean(filt - sep_true))}
            with open(d / f"val_{name}_{k}.csv", "w") as f:
                f.write("subject,ref,est\n")
                for si, sub in enumerate(subs):
                    if np.isfinite(filt[si]): f.write(f"{sub['id']},{sep_true[si]:.4f},{filt[si]:.4f}\n")
            with open(d / f"val_{name}_{k}_naive.csv", "w") as f:
                f.write("subject,ref,est\n")
                for si, sub in enumerate(subs):
                    if np.isfinite(raw[si]): f.write(f"{sub['id']},{sep_true_raw[si]:.4f},{raw[si]:.4f}\n")
        out["scenarios"][name] = row; keep[name] = (P, pipes)
        print(name, f"{time.time()-t0:.0f}s", json.dumps(row, default=float)[:900], flush=True)
    json.dump(out, open(d / "session_results.json", "w"), indent=1)
    s0 = {}
    for name, (P, pipes) in keep.items():           # arrays for the review step: first subject only, 2D in camera 0..3
        s0[name + "__obs"] = P[0]
        for k, X3 in pipes.items(): s0[f"{name}__{k}__X3"] = X3[0]
    clean2d = np.stack([G.project(c, X[0].reshape(-1, 3)).reshape(NF, NJ, 2) for c in truth])
    np.savez_compressed(d / "session_subject0.npz", truth_X=X[0], truth_2d=clean2d, joints=np.array(J), **s0)
