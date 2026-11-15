"""Step 2 (Caliscope env): calibrate a synthetic 4-camera rig around a pitching mound.

SYNTHETIC. Truth cameras exist only because we built them; real calibration has no truth.
Calibrate on even sync indices, keep odd ones for a held-out check (done in step 3).
"""
import json, sys, copy
import numpy as np
import pandas as pd
from pathlib import Path
from caliscope.api import calibrate_extrinsics, CameraArray
from caliscope.core.point_data import ImagePoints
from caliscope.synthetic.camera_synthesizer import CameraSynthesizer, strip_extrinsics
from caliscope.synthetic.scene_factories import SyntheticScene, double_sided_charuco_board, Trajectory

out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
SEED = 7
truth = CameraSynthesizer().add_ring(n=4, radius=6.0, height=1.6, angular_offset_deg=45).build()
board = double_sided_charuco_board(rows=5, cols=7, square_size=0.15)
# The board must be waved through the WHOLE volume the pitcher uses (0..2 m high), tilted and turned.
# A flat horizontal orbit leaves height unconstrained: Caliscope itself gates intrinsic refinement on that.
from caliscope.synthetic.se3_pose import SE3Pose
N = 80; poses = []
for i in range(N):
    th = 2 * np.pi * i / N
    pos = np.array([1.3 * np.cos(th), 1.3 * np.sin(th), 1.0 + 0.8 * np.sin(2 * th + 0.4)])
    tilt = SE3Pose.from_axis_angle(np.array([1.0, 0, 0]), np.radians(40) * np.sin(3 * th), np.zeros(3))
    spin = SE3Pose.from_axis_angle(np.array([0, 0, 1.0]), 2 * th, pos)
    poses.append(spin.compose(tilt))
traj = Trajectory(poses=tuple(poses), origin_frame=0)
scene = SyntheticScene.single(camera_array=truth, calibration_object=board, trajectory=traj,
                              pixel_noise_sigma=0.6, random_seed=SEED)
df = scene.image_points_noisy.df
print("observations", len(df), "sync frames", df.sync_index.nunique(), "cams", sorted(df.cam_id.unique()))

fit = df[df.sync_index % 2 == 0].reset_index(drop=True)
held = df[df.sync_index % 2 == 1].reset_index(drop=True)
cams_in = strip_extrinsics(scene.intrinsics_only_cameras() if callable(scene.intrinsics_only_cameras) else scene.intrinsics_only_cameras)
run = calibrate_extrinsics(ImagePoints(fit), cams_in, None, refine_intrinsics=True)
est = run.capture_volume.camera_array
print("synthesized intrinsics for cams:", sorted(run.synthesized_cam_ids), "| refinement gated:", run.intrinsic_refinement_gated)
est.to_aniposelib_toml(out / "calibration_estimated.toml")
est.to_toml(out / "calibration_estimated_caliscope.toml")

def cam_dict(c):
    R = np.asarray(c.rotation, float); R = R if R.shape == (3, 3) else None
    return {"id": int(c.cam_id), "size": list(map(int, c.size)), "K": np.asarray(c.matrix, float).tolist(),
            "dist": np.asarray(c.distortions, float).tolist(), "R": np.asarray(c.rotation, float).tolist(),
            "t": np.asarray(c.translation, float).tolist()}
json.dump({"label": "SYNTHETIC truth rig (exists only because we built it)", "cameras": [cam_dict(c) for c in truth.cameras.values()]},
          open(out / "truth_cameras.json", "w"), indent=1)
json.dump({"cameras": [cam_dict(c) for c in est.cameras.values()]}, open(out / "estimated_cameras.json", "w"), indent=1)
scene.world_points.df.to_csv(out / "truth_world_points.csv", index=False)
fit.to_csv(out / "fit_points.csv", index=False); held.to_csv(out / "heldout_points.csv", index=False)
print("board: 5x7 squares of 0.15 m; fit sync frames", fit.sync_index.nunique(), "held-out", held.sync_index.nunique())
print("per-camera calibration error (caliscope):", {k: getattr(c, 'error', None) for k, c in est.cameras.items()})
print("RMSE report:", getattr(run.capture_volume, "reprojection_report", None) and run.capture_volume.reprojection_report)
