"""Step 8: judge the peak hip-shoulder separation with the estimated-motion-validation script (bound +-5 deg chosen BEFORE looking, control = mean of ref).
Reads val_<scenario>_<pipeline>.csv (5-frame-median peak) and val_<scenario>_<pipeline>_naive.csv (raw maximum)."""
import json, subprocess, sys
from pathlib import Path
d = Path(sys.argv[1]).resolve(); M = sys.argv[2]; res = json.load(open(d / "session_results.json"))
def run(*a): return json.loads(subprocess.run([sys.executable, "-B", M, *a], capture_output=True, text=True, check=True).stdout)
rows = []
for sc, row in res["scenarios"].items():
    for pipe in ("naive", "ransac", "screened", "repaired"):
        if pipe not in row: continue
        for kind, fn in (("5-frame median peak", f"val_{sc}_{pipe}.csv"), ("raw maximum", f"val_{sc}_{pipe}_naive.csv")):
            f = d / fn
            a = run("agree", str(f)); e = run("equiv", str(f), "--bound", "5"); k = run("skill", str(f), "--control", "mean")
            rows.append({"scenario": sc, "pipeline": pipe, "metric": kind, "n": a["n"], "bias_deg": a["bias"], "loa_low": a["loa_low"], "loa_high": a["loa_high"], "mae_deg": a["mae"],
                         "icc31": a["ICC(3,1)"], "icc21": a["ICC(2,1)"], "tost_5deg_equivalent": e["equivalent"], "tost_ci90": e["ci90"], "skill_vs_mean": k.get("skill"), "skill_ci": k.get("ci95") or k.get("ci"),
                         "joint_err_mm_median": row[pipe]["joint_err_mm_median"], "wrist_at_release_err_mm_median": row[pipe]["wrist_at_release_err_mm_median"]})
json.dump({"label": res["label"], "bound_deg": 5, "rows": rows}, open(d / "validation_table.json", "w"), indent=1)
for r in rows:
    print("%-22s %-9s %-19s n=%d bias %+5.1f LoA [%+6.1f,%+6.1f] ICC31 %.2f TOST5 %-5s skill %s | joint %5.1f mm wrist@rel %5.1f mm" % (
        r["scenario"], r["pipeline"], r["metric"], r["n"], r["bias_deg"], r["loa_low"], r["loa_high"], r["icc31"], r["tost_5deg_equivalent"],
        None if r["skill_vs_mean"] is None else round(r["skill_vs_mean"], 2), r["joint_err_mm_median"], r["wrist_at_release_err_mm_median"]))
