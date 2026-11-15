"""Small numpy helpers shared by the Geometry Lab steps. Axis conventions are explicit on purpose."""
import numpy as np, cv2

# Arrays are always (cameras, points, 2) for 2D and (points, 3) for 3D. Missing observation = NaN, never 0.
def umeyama(src, dst):
    """Least-squares similarity dst ~ s*R@src + t (Umeyama 1991). Returns s, R, t."""
    mu_s, mu_d = src.mean(0), dst.mean(0)
    S, D = src - mu_s, dst - mu_d
    U, sig, Vt = np.linalg.svd(D.T @ S / len(src))
    E = np.eye(3); E[2, 2] = np.sign(np.linalg.det(U) * np.linalg.det(Vt))
    R = U @ E @ Vt
    s = np.trace(np.diag(sig) @ E) / S.var(0).sum()
    return s, R, mu_d - s * R @ mu_s

def rodrigues(r): return cv2.Rodrigues(np.asarray(r, float))[0]
def rvec(R): return cv2.Rodrigues(np.asarray(R, float))[0].ravel()

def project(cam, X):
    """Project world points X (n,3) with a dict camera {K, dist, R(3x3 or rvec), t}. Distortion applied."""
    R = np.asarray(cam["R"], float); R = rodrigues(R.ravel()) if R.size == 3 else R
    p, _ = cv2.projectPoints(np.asarray(X, float).reshape(-1, 1, 3), rvec(R), np.asarray(cam["t"], float),
                             np.asarray(cam["K"], float), np.asarray(cam["dist"], float))
    return p.reshape(-1, 2)

def cam_center(cam):
    R = np.asarray(cam["R"], float); R = rodrigues(R.ravel()) if R.size == 3 else R
    return -R.T @ np.asarray(cam["t"], float)

def points_from_df(df, key=("sync_index", "keypoint_id"), ncam=4):
    """(cams, points, 2) array with NaN where a camera did not see a point, plus the point keys."""
    keys = sorted(set(map(tuple, df[list(key)].to_numpy())))
    idx = {k: i for i, k in enumerate(keys)}
    P = np.full((ncam, len(keys), 2), np.nan)
    for c, a, b, x, y in df[["cam_id", key[0], key[1], "img_loc_x", "img_loc_y"]].itertuples(index=False):
        P[int(c), idx[(a, b)]] = (x, y)
    return P, keys

def align_cameras_to_truth_frame(cams, s, R, t):
    """Re-express cameras (estimated gauge) in the truth frame, given X_truth = s*R@X_est + t."""
    out = []
    for c in cams:
        Rc = np.asarray(c["R"], float); Rc = rodrigues(Rc.ravel()) if Rc.size == 3 else Rc
        tc = np.asarray(c["t"], float)
        # x_cam = Rc X_est + tc, X_est = R^T (X_truth - t)/s  ->  s*x_cam = Rc R^T X_truth - Rc R^T t + s*tc
        R2 = Rc @ R.T; t2 = s * tc - R2 @ t
        d = dict(c); d["R"] = R2; d["t"] = t2; out.append(d)
    return out

def rot_angle_deg(Ra, Rb):
    c = (np.trace(Ra.T @ Rb) - 1) / 2
    return float(np.degrees(np.arccos(np.clip(c, -1, 1))))
