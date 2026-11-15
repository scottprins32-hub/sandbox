"""Step 9: build index.html (the Geometry Lab report) from the result files. Stdlib only. Usage: 09_report.py EXAMPLE_DIR [POSE_JSON TRUTH_CAMERAS_JSON]"""
import json, sys, math
from pathlib import Path
E = Path(sys.argv[1]); R = E / "results"
chk = json.load(open(R / "calibration_check.json")); ses = json.load(open(R / "session_results.json")); val = json.load(open(R / "validation_table.json"))
fo = json.load(open(E / "fiftyone" / "review_summary.json")); cv = json.load(open(E / "cvat" / "roundtrip.json")); rt = json.load(open(E / "fiftyone" / "roundtrip.json"))
cams = path = None
if len(sys.argv) > 3:
    cams = json.load(open(sys.argv[3]))["cameras"]; pz = json.load(open(sys.argv[2]))["subjects"][0]["joints"]["P"]
    path = [(p[0] - 0.75, -p[2]) for p in pz]
SC = {"A_clean": "A  Clean session", "B_cam3_knocked_1deg": "B  Camera 3 knocked 1°", "C_cam1_late_2frames": "C  Camera 1 two frames late"}
PIPES = [("naive", "plain triangulation"), ("ransac", "aniposelib RANSAC"), ("screened", "residual screening"), ("repaired", "diagnosed repair")]
f1 = lambda v: f"{v:.1f}"

def rig_svg():
    s = ['<svg viewBox="0 0 400 340" role="img" aria-label="Top view of four cameras on a ring of 6 metres around the mound, the board path and the pitcher path">']
    cx, cy, k = 200, 160, 25
    s.append(f'<circle cx="{cx}" cy="{cy}" r="{6*k}" class="ring"/><circle cx="{cx}" cy="{cy}" r="{1.3*k}" class="board"/>')
    s.append(f'<text x="{cx}" y="{cy-1.3*k-5}" class="lab mid">board path 1.3 m</text><text x="{cx}" y="{cy+6*k+22}" class="lab mid">ring 6 m, cameras 1.6 m high</text>')
    if path:
        pts = " ".join(f"{cx+x*k:.1f},{cy+y*k:.1f}" for x, y in path); s.append(f'<polyline points="{pts}" class="path"/>')
        s.append(f'<text x="{cx+0.2*k}" y="{cy+0.9*k}" class="lab acc">pitcher (S01)</text>')
    if cams:
        for c in cams:
            R = c["R"]; t = c["t"]; x = -(R[0][0]*t[0]+R[1][0]*t[1]+R[2][0]*t[2]); y = -(R[0][1]*t[0]+R[1][1]*t[1]+R[2][1]*t[2])
            px, py = cx+x*k, cy+y*k; ang = math.atan2(cy-py, cx-px); a = math.degrees(ang)
            bad = c["id"] == 3
            s.append(f'<g transform="translate({px:.1f},{py:.1f}) rotate({a:.1f})"><path d="M10,0 L-8,-7 L-8,7 Z" class="cam{" bad" if bad else ""}"/></g>')
            ox = 14 if px < cx else -14; anchor = "start" if px < cx else "end"
            s.append(f'<text x="{px+ox*0.0+(-14 if px<cx else 14):.1f}" y="{py+(-9 if py<cy else 16):.1f}" class="lab {"warn" if bad else ""}" text-anchor="{"end" if px<cx else "start"}">cam {c["id"]}{" · knocked" if bad else ""}</text>')
    s.append('</svg>'); return "".join(s)

def drop_svg():
    rows = []
    for sc, row in ses["scenarios"].items():
        d = row["drop_one"]; base = d["baseline_px"]; W = 15.0; h = ['<svg viewBox="0 0 320 150" class="mini" role="img" aria-label="residual without each camera">']
        for i, v in enumerate(d["without_cam_px"]):
            y = 12 + i * 26; w = 180 * v / W; fl = d["flagged_camera"] == i
            h.append(f'<text x="0" y="{y+12}" class="lab">w/o cam {i}</text><rect x="62" y="{y}" width="{w:.1f}" height="16" class="bar{" hot" if fl else ""}"/><text x="{62+w+6:.1f}" y="{y+12}" class="num">{v:.1f} px</text>')
        bx = 62 + 180 * base / W; h.append(f'<line x1="{bx:.1f}" y1="4" x2="{bx:.1f}" y2="116" class="base"/><text x="{bx:.1f}" y="132" class="lab mid">all four: {base:.1f} px</text></svg>')
        flag = d["flagged_camera"]; sig = row.get("signature")
        cap = "no camera stands out" if flag is None else f"camera {flag} flagged; wrist lag {sig['wrist_x_lag_samples_median']:+.0f} frames, residual-speed corr {sig['residual_vs_speed_corr']:.2f}"
        rows.append(f'<figure><figcaption><b>{SC[sc]}</b></figcaption>{"".join(h)}<p class="cap">{cap}. Repair: {row.get("repair", "none needed")}.</p></figure>')
    return "".join(rows)

def pipe_svg():
    out = []
    M = 210.0
    for sc, row in ses["scenarios"].items():
        h = [f'<svg viewBox="0 0 420 118" class="wide" role="img" aria-label="wrist error at release, {SC[sc]}">']
        for i, (k, name) in enumerate(PIPES):
            y = 6 + i * 27
            if k not in row: h.append(f'<text x="0" y="{y+13}" class="lab">{name}</text><text x="128" y="{y+13}" class="lab">no fault found, nothing to repair</text>'); continue
            v = row[k]["wrist_at_release_err_mm_median"]; w = 250 * v / M; best = k == "repaired" or (k == "naive" and sc == "A_clean")
            h.append(f'<text x="0" y="{y+13}" class="lab">{name}</text><rect x="128" y="{y}" width="{max(w,2):.1f}" height="18" class="bar{" hot" if k=="repaired" else ""}"/><text x="{128+w+6:.1f}" y="{y+13}" class="num">{v:.0f} mm</text>')
        h.append("</svg>"); out.append(f'<figure><figcaption><b>{SC[sc]}</b></figcaption>{"".join(h)}</figure>')
    return "".join(out)

def table():
    r = ['<div class="scroll"><table><thead><tr><th>Scenario</th><th>Pipeline</th><th>Peak taken as</th><th class="n">Bias °</th><th class="n">95% limits °</th><th class="n">ICC(3,1)</th><th>±5° equivalent</th><th class="n">Joint error mm</th></tr></thead><tbody>']
    for x in val["rows"]:
        if x["metric"] == "raw maximum" and x["pipeline"] != "naive": continue
        cls = ' class="bad"' if x["metric"] == "raw maximum" else ""
        r.append(f'<tr{cls}><td>{SC[x["scenario"]].split("  ")[0]}</td><td>{x["pipeline"]}</td><td>{x["metric"]}</td><td class="n">{x["bias_deg"]:+.1f}</td><td class="n">{x["loa_low"]:+.0f} to {x["loa_high"]:+.0f}</td><td class="n">{x["icc31"]:.2f}</td><td>{"yes" if x["tost_5deg_equivalent"] else "no"}</td><td class="n">{x["joint_err_mm_median"]:.1f}</td></tr>')
    r.append("</tbody></table></div>"); return "".join(r)

kd = chk["known_distance_mm"]; cm = chk["cameras_vs_truth"]; ho = chk["heldout_3d_error_mm"]
html = f'''<title>Geometry Lab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
/* Layout: one reading column with figures that break out to a two-up grid; engineering-notebook feel, one accent (teal), amber only for faults. */
:root{{--bg:#f2f5f6;--panel:#ffffff;--ink:#12202a;--muted:#55646f;--line:#d3dce1;--acc:#0b6b73;--acc-ink:#ffffff;--warn:#a8480a;--bar:#9fb2bb;
--display:"Space Grotesk",system-ui,sans-serif;--body:"Inter",system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,Menlo,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#0d1418;--panel:#141d23;--ink:#e4ecf0;--muted:#92a3ae;--line:#26343d;--acc:#52c4cc;--acc-ink:#06191b;--warn:#f0a24a;--bar:#4a5f6a;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#0d1418;--panel:#141d23;--ink:#e4ecf0;--muted:#92a3ae;--line:#26343d;--acc:#52c4cc;--acc-ink:#06191b;--warn:#f0a24a;--bar:#4a5f6a;color-scheme:dark}}
*{{box-sizing:border-box}} body{{background:var(--bg);color:var(--ink);font:400 16px/1.6 var(--body);padding-block:32px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
main{{max-width:980px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:40px}} h1,h2{{font-family:var(--display);text-wrap:balance;margin:0}} h1{{font-size:clamp(34px,6vw,56px);line-height:1.05;letter-spacing:-.02em}}
h2{{font-size:24px;line-height:1.2;margin-bottom:6px}} p{{margin:0 0 12px;max-width:68ch}} .lede{{font-size:18px;color:var(--muted);max-width:60ch}}
.chip{{display:inline-block;font:600 12px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;border:1.5px solid var(--warn);color:var(--warn);padding:6px 10px;border-radius:4px}}
.stats{{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:16px 0}} .stat{{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:14px 16px;min-width:0}}
.stat b{{display:block;font:600 26px/1.1 var(--mono);font-variant-numeric:tabular-nums;color:var(--acc)}} .stat span{{font-size:13px;color:var(--muted)}}
.two{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:start}} @media(max-width:760px){{.two{{grid-template-columns:minmax(0,1fr)}}}}
figure{{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:14px;min-width:0}} figcaption{{font-size:14px;margin-bottom:8px}} .cap{{font-size:13px;color:var(--muted);margin:8px 0 0}}
svg{{width:100%;height:auto;display:block}} .lab{{font:400 11px var(--mono);fill:var(--muted)}} .lab.mid{{text-anchor:middle}} .lab.acc{{fill:var(--acc)}} .lab.warn{{fill:var(--warn)}}
.num{{font:600 11px var(--mono);fill:var(--ink)}} .bar{{fill:var(--bar)}} .bar.hot{{fill:var(--acc)}} .base{{stroke:var(--warn);stroke-dasharray:3 3;stroke-width:1.2}}
.ring{{fill:none;stroke:var(--line);stroke-width:1.5}} .board{{fill:none;stroke:var(--muted);stroke-dasharray:4 4}} .path{{fill:none;stroke:var(--acc);stroke-width:2.5}}
.cam{{fill:var(--ink)}} .cam.bad{{fill:var(--warn)}} .scroll{{overflow-x:auto;border:1px solid var(--line);border-radius:6px;background:var(--panel)}}
table{{border-collapse:collapse;width:100%;font-size:13px;min-width:720px}} th,td{{padding:8px 10px;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap}} th{{font:600 11px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}}
td.n,th.n{{text-align:right;font-variant-numeric:tabular-nums;font-family:var(--mono)}} tr.bad td{{color:var(--warn)}} .skills{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:0;list-style:none;margin:12px 0 0}}
.skills li{{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:12px 14px;font-size:14px}} .skills code{{font:600 12px var(--mono);color:var(--acc)}} ul.plain{{margin:0;padding-left:20px;max-width:68ch}} ul.plain li{{margin-bottom:8px}}
code{{font:400 .9em var(--mono)}} .limits{{border-left:4px solid var(--warn);padding:4px 0 4px 16px}}
</style>
<main>
<header><span class="chip">Synthetic · estimated · not athlete data</span><h1 style="margin-top:16px">Geometry Lab</h1>
<p class="lede">A four-camera rig is calibrated, used on a synthetic pitching session, made to fail in two realistic ways, diagnosed from its own residuals and judged with the validation script. Four global skills and one of mine ran together.</p></header>

<section><h2>Calibration, judged on frames it never saw</h2>
<p>Caliscope calibrated the rig from half of a ChArUco board sequence (5×7 squares of 0.150 m). The other half stayed out. aniposelib then triangulated those frames from the exported TOML.</p>
<div class="stats"><div class="stat"><b>{ho["median"]:.1f} mm</b><span>median 3D error on {ho["n"]} held-out points (p95 {ho["p95"]:.1f})</span></div>
<div class="stat"><b>{kd["mean"]:.1f} mm</b><span>board spacing that is truly 150 mm, sd {kd["sd"]:.1f}, n={kd["n"]}</span></div>
<div class="stat"><b>&lt;{max(c["centre_err_mm"] for c in cm):.1f} mm</b><span>camera position error against the synthetic truth</span></div>
<div class="stat"><b>&lt;{max(c["rot_err_deg"] for c in cm):.3f}°</b><span>camera rotation error against the synthetic truth</span></div></div>
<div class="two"><figure>{rig_svg()}<p class="cap">Top view, metres. The cameras are synthetic and the truth only exists because we built it.</p></figure>
<div><p>The first board path was flat. Held-out points landed at 2.5 mm, yet Caliscope reported that intrinsic refinement was gated off for lack of depth range. The board now travels up to 1.8 m, tilts and turns, so the pitcher's height is covered.</p>
<p>Intrinsics are the synthetic ones and stayed fixed (the depth ratio is still 1.7 against Caliscope's gate of 2.0). A real rig needs a separate lens calibration, and a new calibration cannot recover the lens state of an old recording.</p>
<p>My first check selected the wrong columns of the truth table and still reported a good fit, because the board path was flat and a permuted axis fits a flat cloud. The cameras compared against truth exposed it. Named columns fixed it.</p></div></div></section>

<section><h2>Two faults, two signatures</h2>
<p>The session has detector noise (1.5 px), 8% dropouts and left/right swaps of hips and shoulders in about 1% of observations. On top of that: camera 3 is knocked by 1° after calibration (B), or camera 1 runs two frames late (C). For each camera the rig triangulates without it and measures how well the other three agree.</p>
<div class="two">{drop_svg()}</div>
<p>Dropping the right camera makes the rest agree. Residual against joint speed did not separate the two faults (0.70 and 0.67). The wrist-track lag from <code>motion_validate.py</code> did: 0 frames for B, +2 for C. B was repaired by excluding the camera, C by shifting its stream.</p></section>

<section><h2>What the repair buys</h2>
<p>Median wrist error at the release frame, over {ses["n_subjects"] if "n_subjects" in ses else 30} synthetic pitchers.</p>
<div class="two">{pipe_svg()}</div>
<p>aniposelib's RANSAC also brings the wrist down in both faults (12 and 9 mm) without diagnosing anything, but in B its angle then fails the ±5° test (bias +6.3°). Plain residual screening made C worse at the wrist (205 mm); I did not test why, and discarding the camera's good frames together with the late ones is only a guess.</p></section>

<section><h2>Can the angle be believed?</h2>
<p>Peak hip-shoulder separation per pitcher against the synthetic truth, judged with the validation skill. The ±5° bound was fixed before the run; the reference is the skeleton itself, so this tests the geometry and nothing about real pitchers.</p>
{table()}
<ul class="plain" style="margin-top:16px"><li><b>The raw maximum is useless.</b> One left/right swap in one frame sets the peak. ICC drops to 0.05 to 0.09 and the bias is +53° to +67°. A 5-frame median first brings it to ICC 0.94 on the clean session.</li>
<li><b>Equivalent on average is not equivalent per pitch.</b> Scenario B after repair passes ±5° on the mean, with limits of agreement of −13.5° to +18.4° and ICC 0.65.</li>
<li><b>Fixing the camera made the angle look worse.</b> Joint positions improved from 53 to 8 mm, while the repaired angle scatters more than the contaminated one (ICC 0.65 against 0.84). With three cameras the hips and shoulders are less constrained. That explanation was not tested separately. Which pipeline is better depends on whether the purpose is the angle or the release position.</li></ul></section>

<section><h2>Review and labels</h2>
<div class="two"><div><p><b>FiftyOne</b> (local, community): {fo["n_samples"]} frames of camera 0 and camera 3, with the reference, the detector and two predictions in separate fields. Failures were tagged: {", ".join(f"{v} {k.replace('_',' ')}" for k, v in fo["failure_counts"].items())}. Three saved views and the dataset schema were exported, and re-importing the export reproduced all fields ({"passed" if rt["roundtrip_ok"] else "FAILED"}). The app UI was not launched.</p>
<p>In camera 3's own image, the repaired 3D lands {fo["mean_err_px_by_camera"]["3"]["repaired"]:.0f} px from the reference and the contaminated one {fo["mean_err_px_by_camera"]["3"]["naive"]:.0f} px. The repaired result is right in the world; the stale calibration places it wrongly in the image of the camera that moved. In camera 0 the repaired result is better ({fo["mean_err_px_by_camera"]["0"]["repaired"]:.1f} against {fo["mean_err_px_by_camera"]["0"]["naive"]:.1f} px). The image of the suspect camera is the wrong yardstick.</p></div>
<div><p><b>CVAT</b>: a skeleton label spec with anatomical left and right, visibility codes 0/1/2 and immutable source frame ids, plus the reference as COCO keypoints. A write-and-read check of unique frame ids, valid codes, left/right names and preserved occluded and not-in-frame states: {"passed" if cv["all_ok"] else "FAILED"}. No CVAT server exists here, so importing the files into one is untested, and so is interpolation. The reference is the synthetic truth, not human labels.</p></div></div>
<ul class="skills"><li><code>caliscope-calibration</code><br>calibration, held-out check, TOML export</li><li><code>aniposelib-geometry-check</code><br>triangulation, residuals, bad-view diagnosis</li><li><code>fiftyone-tracking-review</code><br>separate reference and prediction fields</li><li><code>cvat-reference-labeling</code><br>label spec, visibility, frame ids</li><li><code>estimated-motion-validation</code><br>agreement, TOST, lag, skill</li></ul></section>

<section class="limits"><h2>What this does not show</h2>
<ul class="plain"><li>Nothing here is a real camera, lens or athlete. A zero-ish residual on synthetic data is software geometry only.</li>
<li>The classic aniposelib 0.8.0 ran. The PyTorch variant was not tested.</li>
<li>The detector is the truth plus noise, dropouts and swaps. A real pose model has correlated errors this does not have.</li>
<li>Timing was a whole-frame offset. Sub-frame offsets and drift were not simulated.</li>
<li>30 pitchers that share one skeleton with scaled twist, lean and arm swing; the spread between them is invented.</li></ul></section>
</main>
'''
(E / "index.html").write_text(html); print("wrote", E / "index.html", len(html))
