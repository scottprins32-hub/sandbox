# What the repos reported

Read on 2026-11-15 from READMEs and, for one, its technical paper, through web fetches. Nothing was run or reproduced. Treat every number as the author's own. Last-commit dates were not visible.

| Repo | What it did | Numbers it reported | Lesson used in this skill |
|---|---|---|---|
| `choigod1023/pitching-real2sim-lab` | OpenSim arm model from OpenBiomechanics C3D pitches; ball tracking from 8 cameras | one athlete, five fastballs: modelled 113 km/h against 128 to 131 recorded; about 15 km/h per 5 cm wrist-to-ball distance; 6 to 10 km/h per video release frame | sensitivity before accuracy; candid negative results. Check the data licence: derived data CC BY-NC-SA, OBP data excludes employees of professional organisations |
| `ka-acy/sindy-pitching` | MediaPipe pose on 140 MLB broadcast clips, fitted with sparse dynamics | operative model core R2 -29.56 against a frozen control at -5.57; pitch-type balanced accuracy 0.55 against 0.49 baseline (p = 0.19) | score against a no-model control; causal smoothing for live use. No licence visible |
| `convderover/broadcast-kick-biomechanics` | single-camera broadcast video against optical mocap, football kicks | 2D error 7.6 to 12.9% of player height; knee flexion ICC 0.64, and 0.80 after a lab-learned correction; fusing views raised hip-extension agreement 0.40 to 0.78; load index ICC about 0.09 | ICC as the headline with fitness-for-use caveats; circularity when both sides share a model; more views help. Preprint, single author |
| `CGainsWorks/cv-multicam-3d-reconstruction` | four-camera calibration and reconstruction on rendered images | calibration residual 0.151 px; sparse median 0.356 mm to CAD; pose translation 3.8 mm | synthetic data validates the algorithm only; compare residual against error to known geometry; one seed, one rig, no error bars |
| `m-a-robinson/markerless-equivalence` | equivalence test of a markerless system against marker-based gait capture | none readable | equivalence bounds must be justified; the script's comments call them arbitrary |
| `Nick-D-Hanson/pitching-biomechanics-lab` | empty repository | none | nothing to learn |
