---
name: estimated-motion-validation
description: Decides whether an estimated motion measurement (pose-tracked joint angles, a triangulated 3D skeleton, a video-derived release time or speed) can be trusted for a stated purpose, and writes the validation honestly - agreement with a reference (bias, limits of agreement, ICC), pre-registered equivalence bounds (TOST), timing error, comparison with a no-model control, error sensitivity, and what to call the result. Use this whenever the user wants to validate, benchmark or compare a markerless, pose-estimation or multi-camera motion pipeline against motion capture or another system, asks whether a number from video can be believed, reports ICC or MAE for a skeleton, or is about to label something "measured" - even if they never say "validation". Includes a tested stdlib Python script.
---

# Validating estimated motion

A pipeline that turns video into joint angles, events and speeds produces an **estimate**. This skill says how to find out what that estimate is good for, and how to report it without overclaiming. The statistics are standard and the script is tested against published values. The lessons come from small public repos read on 2026-11-15 (see `references/what-the-repos-reported.md`); their numbers are their own, from READMEs, and were not reproduced.

## 1. Name the purpose before computing anything

"Is it accurate?" has no answer. Write the claim: *"the estimated peak hip-shoulder separation is within ±5° of the lab system for a coach comparing a pitcher with themselves"* is testable. *"Good enough for coaching"* is not. Different purposes need different evidence:

| Purpose | What must hold | Evidence |
|---|---|---|
| Compare a player with themselves over weeks | repeatable, low noise | within-system repeatability, same camera set-up |
| Compare players | small bias, same across people | agreement against a reference, bias across body sizes |
| Show timing (foot plant, release) | frame-accurate events | timing error in frames and seconds, per event |
| Quote a speed or a joint load | calibrated, traceable | usually **not available from video**: say so |

## 2. The reference decides what you may claim

- A **reference system** (marker-based mocap, force plates, a radar for ball speed) lets you say "agrees with X". Without one you can only show repeatability and plausibility, and the result must say *estimated*.
- **Check the comparison is not circular.** If the same model computes the load from both the reference and the video, agreement partly reflects the model (one kick study flagged this).
- **Synthetic data proves the algorithm, not the hardware.** A pipeline validated only on rendered images has not met motion blur, wrong tracked person, or phone auto-exposure (a synthetic four-camera study says so itself: "there is no hardware behind this").
- Never validate on the data you tuned on. Hold out whole people, not frames of the same pitch.

## 3. The numbers, and what each answers (`scripts/motion_validate.py`)

```bash
python3 scripts/motion_validate.py --selftest                      # checks Shrout-Fleiss ICCs, t distribution, TOST, lag
python3 scripts/motion_validate.py agree  pairs.csv                # bias, MAE, RMSE, 95% limits of agreement, r, ICC(3,1), ICC(2,1)
python3 scripts/motion_validate.py equiv  pairs.csv --bound 5      # paired TOST with a 90% CI
python3 scripts/motion_validate.py lag    series.csv --max-lag 10  # timing offset in samples
python3 scripts/motion_validate.py skill  pairs.csv --control mean # skill versus a no-model control, bootstrap CI
```

CSV header: `subject,ref,est`, one row per paired value (for example one peak angle per pitch). Pure standard library.

- **Bias and limits of agreement (Bland-Altman):** the systematic error and the spread a single measurement can show. Report in the unit of the measure, in degrees or frames, not as a percentage of range.
- **ICC:** consistency of the ranking, not closeness of the values. A system with a constant 10° offset has a high ICC(3,1) and a poor ICC(2,1). Report the form you used (the script gives both); the "poor, moderate, good, excellent" bands (0.5, 0.75, 0.9) are a convention, not a law.
- **Pearson r:** shows association only. Never use it alone as agreement.
- **Equivalence (TOST):** a non-significant difference test does not show equivalence. Choose the bound **before looking at the data** and justify it (smallest difference that would change a coaching decision). One markerless-versus-marker script in the survey ships bounds its own comments call "arbitrary at this stage": that is the mistake to avoid. Equivalence at α = 0.05 is the same as the 90% CI lying inside the bound.
- **Timing:** estimate the lag that best aligns est to ref and report it in samples and milliseconds. Positive means the estimate is late. One video frame at 30 fps is 33 ms, which can matter for release (see sensitivity).
- **Skill against a no-model control:** compare with the dumbest predictor (the mean, or "no change from the previous frame"). If the model is not clearly better, say so. A pitch-dynamics study reported a fitted model scoring far *worse* than a frozen control (-29.6 against -5.6) and stated it.

## 4. Sensitivity: which errors matter most

Compute how much a plausible input error moves the output you care about, before blaming the algorithm. A baseball reconstruction study reported (its figures): about 15 km/h of speed change per 5 cm of wrist-to-ball distance, and 6 to 10 km/h per video frame at release. That tells you a video-only release speed is not a number to print, whatever the pose model is.

## 5. Live use: causal smoothing only

A filter that looks at future frames (centred smoothing) flatters offline scores and is impossible live. For feedback shown while a coach watches, evaluate with a causal filter and report that score. One study found a delay-augmented model's gain mostly came from centred smoothing reading the future.

## 6. Writing it up

- State the claim, the reference, the sample (people, pitches, cameras, lighting), the unit, and the bound with its reason.
- Give bias, limits of agreement, ICC with its form and a confidence interval, the timing lag, the control comparison and the sensitivity, in a table.
- Use **"estimated"** unless a reference supports the specific quantity. Say what the number may be used for and what it may not.
- Show failures: which pitches, camera angles or phases are worst. Averages hide a bad release-frame.
- A validation covers one pipeline version and one set-up. Re-run it when the model, cameras or calibration change; keep the script and the CSVs with the report.

## What was not verified

The repos' own numbers (read from READMEs and a paper, never reproduced), whether their code runs, and any result on your data. The script is verified against the Shrout and Fleiss (1979) ICC table, a t-distribution value, a TOST decision and a recovered 3-sample lag, nothing else; ICC confidence intervals are not computed.

## Related

- For the read-out numbers and the labelling rules in the pitching app itself, use its own `pitch-readout` and `reconstruction-accuracy` skills where present.
- For turning a result into a graphic that a coach can read, see `deterministic-frame-rendering` and `web-design-review-loop`.

## Ship checklist

- [ ] The claim names a purpose, a reference and a bound, chosen before the data.
- [ ] Held out whole people; no tuning on the test set.
- [ ] Comparison is not circular; synthetic-only evidence is labelled as such.
- [ ] Bias, limits of agreement, ICC (with form), timing and control comparison reported with the sample.
- [ ] Sensitivity computed for the quantity that will be printed.
- [ ] The word "measured" is used only where a reference supports it.
