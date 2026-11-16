# Prompt for Motion Studio: X-ray view as the new standard, robust angles, attractor scores, review video and report

Paste everything below the line into a Claude Code session on `scottprins32-hub/modernpitching-motion-studio`.

---

We are making the **X-ray view** the new standard way Motion Studio shows a reconstructed throw, making the angles robust so a 2 to 3 % deviation never flips a verdict, scoring the nine attractors honestly, and producing two outputs after coach review: a short X-ray video the player can be sent, and a separate full report. Work in this repository on a new branch. Do not merge; open a draft pull request when the acceptance checks below pass.

## 0. Reference implementation (read first, do not copy blindly)

A working standalone version exists in the sandbox repository. Attach it read-only (`add_repo scottprins32-hub/sandbox`, branch `claude/ux-psychology-skills-weun8v`) and read:

- `.claude/skills/motion-and-3d-toolkit/examples/pitch-score-3d/build_xray.py`: turns `twocam_log.json` `geometry.projections` into one camera per phone (P = K[R|t], with the crop folded into K), maps the viewer's joint axes back onto `twocam_3d.trc` with a least-squares similarity, and reports how far the drawn skeleton lands from the tracker's 2D points.
- `template_xray.html`: the look. The mannequin is drawn with an additive fresnel shader through each phone's own camera, on top of that phone's video; tracked skeleton lines on top; joints the cameras did not see in that frame are drawn amber and dashed; attractor overlays are drawn in every view.
- `attractors.py` and `attractors.js` (with `attractors.test.mjs`): the nine programme attractors, one joint-based proxy each, start ranges, frame-rate gates, and "no total below five scored".
- `build_motion.py`: how the trial, biomech read-out and events become one data file.

On the reference session (Scott, 1 March 2026, two iPhones, 30 fps) the X-ray landed a median of 1.6 px from the tracked body in the front view and 4.6 px in the side view. Use those as a sanity check for the port.

The reference is a single page that loads three.js from a CDN and embeds video frames. Motion Studio must not do either: use the vendored `frontend/vendor/three.module.js`, the real video elements, and the synchronised canvases in `frontend/frame-presentation.js`.

## 1. The X-ray view as the default presentation

1. **Cameras from the reconstruction.** For every camera in a session, build the camera from the projection matrix the reconstruction already stores (`twocam_log.json` for A and B, the multicam log for extra cameras). Decompose P into K, R, t (normalise K so K[2][2] = 1 and R has determinant +1). Convert OpenCV (x right, y down, z forward) to three.js: view matrix rows = (R0, t0), (−R1, −t1), (−R2, −t2); projection matrix rows = (2fx/w, 0, 1 − 2cx/w, 0), (0, 2fy/h, 2cy/h − 1, 0), (0, 0, −(f+n)/(f−n), −2fn/(f−n)), (0, 0, −1, 0). Put this conversion in a small pure module with a node test that round-trips a known 3D point to its pixel.
2. **One coordinate frame.** `to_viewer.py` rotates and re-ups the reconstruction for the 3D viewer. Export that transform explicitly in `trial.js` (for example `world_from_viewer`: scale, R, t) so the frontend can draw viewer coordinates in each camera without refitting. Until it exists, fit it per session as `build_xray.py` does and report the fit residual.
3. **Draw in every visible camera.** Render the mannequin per camera with scissor/viewport into the camera's own box (respect `camera-viewport.js` zoom and pan), above the video and below the UI. Keep the existing orbit 3D view as a second mode.
4. **Look.** Fresnel X-ray body (additive, depth write off), thin tracked skeleton lines and joint dots, throwing arm in `--mpma-throwing-arm`, unseen joints in `--mpma-uncertain` with dashed lines. Take every colour from the existing `--mpma-*` tokens, light and dark. Add a "Real you" control (how much video shows through) and respect `prefers-reduced-motion`.
5. **Honesty in the view.** Show per camera the median and p90 pixel distance between the drawn skeleton and the tracker's 2D points; above 8 px median, show a visible warning, never hide the view. Keep the existing rule that decorative geometry never changes marker coordinates. Label it: "Template body fitted to tracked points, not a scan and not a medical image."

## 2. Angles that do not flip on 2 to 3 %

Give every number a measured uncertainty, and let only differences larger than that uncertainty change a verdict.

1. **Uncertainty per metric and proxy.** Extend `scripts/reconstruction_check.py` so that, for each biomech metric and each attractor proxy, it computes the value on the synthetic truth and on the reconstruction across all scenes, then the bias and 95 % limits of agreement with `scripts/motion_validate.py agree`. Store the result in a versioned file (for example `backend/pipeline/metric_uncertainty.json`) with the scene set and date. This is the base uncertainty `u0`.
2. **Per-session inflation.** Scale `u0` by what this session shows: frame rate, body reprojection px, limb spread %, rejected %, and the share of unseen frames in the metric's window. Keep the formula simple, documented and tested.
3. **Event-time uncertainty.** Compute every event-based value at the event frame and one frame either side (more at higher fps) and add half the spread to the uncertainty. At 30 fps a value that changes a lot over ±1 frame must say so.
4. **Window median, not a single frame.** Read values as the median over a short window around the event, from data that was only gap-bridged and despiked as `biomech.py` already does.
5. **Three-way verdict.** Clearly inside the range by more than u: in range. Clearly outside by more than u: outside. Within u of an edge: "at the edge, within measurement error", shown neutral, never red. The score uses the distance minus u, floored at 0, so being within the error costs nothing.
6. **Between sessions.** Only call a change real when |Δ| exceeds the combined uncertainty (√(u1² + u2²)); otherwise show "no measurable change". Show values as `value ± u` with the band drawn on the bar.
7. **Several throws.** When a session holds several throws, use the median and add the between-throw spread to u.
8. Tests: a value 2 % outside a range with u = 3 % reads "at the edge"; a change smaller than the combined uncertainty reads "no measurable change"; the inflation only ever increases u.

## 3. Attractor scores, and which ones to trust

1. Port `attractors.py` into `backend/pipeline/` and run it after `biomech.py`. Keep the nine keys and the names in `coach_rules.PROGRAMME_ATTRACTORS`.
2. Move every proxy's start range, frame-rate gate and status into one editable file (for example `attractor_ranges.json`, schema-versioned): `key`, `proxy`, `low`, `high`, `min_fps`, `status` (`draft`, `provisional`, `validated`), `notes`. Coaches change ranges there, and the view and video re-run.
3. **Calibration against the coaches.** The dictation already records attractors per work point with red/amber colours and coach confirmation. Use the confirmed ones as labels. Once an attractor has at least 20 labelled sessions, report per proxy how well it agrees with the coaches (sensitivity, specificity, Cohen's kappa) and propose a range that best separates them. A proxy becomes `validated` only when a coach accepts that proposal.
4. **What counts.** Only `validated` proxies count toward the total; `provisional` ones are shown with that label; `draft` ones only in the coach report. Keep "no total below five counted attractors", the frame-rate gates (close needs 100 fps), and sagittal as "not measured" until a pelvis-tilt source exists.
5. Produce a short table for the coaches: per attractor, its proxy, its current status, its agreement numbers, and what is still missing.

## 4. Two outputs after coach review

1. **Player video (X-ray).** A deterministic 9:16 MP4 rendered from the X-ray view (frame i depends on i alone; render twice to prove it, as `deterministic-frame-rendering` describes). It contains only what the coach confirmed: confirmed observation cards from `coach_workflow`, approved attractor cards, at most three work points, the player text in Dutch, no health, no velocity numbers, and an "estimated" label. Nothing is rendered or exported before the coach approves; export is a deliberate coach action, and sending stays manual.
2. **Full report.** Extend `coach_workflow.report` into a separate report with everything else: all metrics and proxies with `value ± u`, verdicts, not-scored and not-measured items with the reason, quality and reprojection numbers per camera, calibration status per attractor, sources of the reference ranges, and links back to the source frames.

## 5. Ground rules

- Do not break what works: put the X-ray view and the new scoring behind a setting until the tests pass, then make it the default. `node --test tests/*.mjs` and `python -m unittest discover -s tests` must stay green; add tests for the camera conversion, the uncertainty rules, the attractor proxies and the render determinism.
- `.gitignore` is an allowlist. Keep shaders inside `.js` files; do not force-add files; extend the allowlist only for a reviewed new file type.
- Everything stays local. No CDN, no model or asset downloads at runtime, nothing uploaded. Reconstruction, scoring and rendering happen on the coach's machine.
- Do not add anatomical bone meshes in this task. A separate, licence-checked asset set will follow; leave a clear hook (a "skeleton layer" with an empty default) for it.

## 6. Acceptance

- On a session with two cameras, the X-ray view opens by default, the skeleton follows the body in both videos, and the per-camera pixel distance is shown (on the reference session about 1.6 px front and 4.6 px side).
- A metric moved 2 to 3 % across a range edge by tracking noise reads "at the edge, within measurement error", not "outside".
- The attractor panel shows status per proxy, and the total uses only validated proxies.
- After coach approval, one button renders the player video and another writes the full report; neither runs without approval.
- All existing and new tests pass. Report what you could not verify.

---

# Follow-up prompt: the anatomical bone layer

Paste this into the Motion Studio session after the X-ray view above has landed.

---

Add an anatomical bone layer to the X-ray view, filling the empty "skeleton layer" hook.

1. **Source and licence.** Use BodyParts3D 4.0 from DBCLS (`partof_BP3D_4.0_obj_99.zip`, https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html). The licence page (updated 2025-02-27) says CC BY 4.0, with the credit "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International". The 2013 OBJ headers still name CC BY-SA 2.1 Japan. Before this ships to anyone outside the club, the owner asks DBCLS to confirm in writing which applies; until then keep the layer behind a setting that is off by default, and record the answer in the repository. Do not use SKEL, OSSO, SMPL or the stock OpenSim bone meshes: their terms do not allow commercial use.
2. **Do not download at runtime.** Build the bone asset once, offline, with the reference script `build_bones.py` in the sandbox repository (`.claude/skills/motion-and-3d-toolkit/examples/pitch-score-3d/`). It keeps the bones only, simplifies them to about 150,000 triangles, finds joint centres in the model (femoral and humeral heads, knee, ankle, elbow, wrist, neck base, head centre), groups the bones into 17 rigid segments and stores each segment in its own rest frame. Ship the result as a data file under the app's assets, extending the `.gitignore` allowlist for exactly that file, with the credit next to it.
3. **Moving the bones.** Port the bone part of `template_xray.html`: per frame, build each segment's frame from the tracked joints the same way the rest frames were built (thigh from hip to knee with the hip line as reference, shank from knee to ankle with the foot, foot from ankle to toe, arms from the elbow-plane normal with the shoulder line as fallback when the arm is straight, pelvis, thorax, head and shoulder girdle from the hips, shoulders and neck). Scale each limb along its axis to the tracked length and across by the session's median limb ratio. Blend the lumbar vertebrae halfway between pelvis and thorax, and the cervical vertebrae halfway between thorax and head. Keep all of this in the frontend; marker coordinates never change.
4. **Look and honesty.** Bones in the X-ray shader with a stronger core than the body; the body glow fainter when bones are on; segments whose joints were not seen in that frame turn amber. Put the credit line in the view and in the report. Label the layer: "Template skeleton of one adult, moved with the tracked joints and scaled to the tracked limb lengths. It shows where bones typically sit, not this athlete's bones, and it is not a medical image."
5. **Tests.** A node test that rebuilds a segment frame from three points and checks it is orthonormal and right-handed; a test that a straight arm falls back to the shoulder line; a check that the bone file loads and has 17 segments; the render-twice determinism check with bones on.
