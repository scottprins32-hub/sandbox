"""Step 5 (aniposelib env): clean 2D reference for the review step = truth skeleton projected through the cameras the session really had
(for scenario B that includes the knocked camera 3). Synthetic stand-in for reviewed CVAT labels."""
import sys, numpy as np
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here)); sys.argv = [sys.argv[0], sys.argv[1], "1"]
import importlib.util
spec = importlib.util.spec_from_file_location("ps", here / "04_pitch_session.py"); ps = importlib.util.module_from_spec(spec); spec.loader.exec_module(ps)
G = ps.G; cams = ps.bump(ps.truth, 3, 1.0)
ref = np.stack([G.project(c, ps.X[0].reshape(-1, 3)).reshape(ps.NF, ps.NJ, 2) for c in cams])     # (cam, frame, joint, 2) px
np.savez_compressed(Path(sys.argv[1]) / "reference_2d_B.npz", reference=ref, size=np.array([1920, 1080]), joints=np.array(ps.J))
print("reference", ref.shape)
