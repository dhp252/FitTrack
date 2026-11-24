---
id: F-007
title: "Rep counter"
status: shipped
origin: backfill
files:
  - app/repCounter/index.tsx
  - src/repCounter/
  - src/utils/poseDetection.ts
  - src/components/ui/PoseCameraView.tsx
  - src/components/ui/SessionRecoveryModal.tsx
  - src/services/sessionRecovery.ts
  - src/services/audio/sessionEndSound.ts
  - app/settings/pose-debug.tsx
  - app/settings/preferences.tsx
  - plugins/withMediaPipeModel.js
  - scripts/android-patches/pose_landmarker_lite.task
depends_on: [F-001]
verified: "1e373b4 2026-11-24"
---

# F-007: Rep counter

## What it does
A guided session that counts reps for push-ups, pull-ups, sit-ups, squats and jumping jacks, and times planks and elliptical sessions. Detection uses the camera with on-device MediaPipe pose landmarks, or the accelerometer ("sensors only") with a per-exercise threshold and cooldown. Elliptical uses a two-phase calibration (still, then pedaling). It plays rep, new-record and "keep going" sounds, tracks the personal best per exercise, autosaves the running session so it can be recovered after a crash, and saves the result as a home workout with a rep timeline.

## Code map
- `app/repCounter/index.tsx`: orchestrator; renders `ExerciseSelector`, `PositionScreen`, `EllipticalCalibration`, `CountingScreen`, `DoneScreen`, `ExitModal` from `src/repCounter/components/`.
- `src/repCounter/hooks/useRepCounter.ts`: all session logic (`useRepCounter`): steps, accelerometer listener, timers, sounds, personal best, save via `addHomeWorkout`.
- `src/utils/poseDetection.ts`: landmark smoothing, angle calculation, per-exercise rep state machines with hysteresis, plank and elliptical detection.
- `src/components/ui/PoseCameraView.tsx`: Vision Camera + pose frame processor.
- `src/services/sessionRecovery.ts` + `SessionRecoveryModal.tsx`: autosave and resume.
- `src/repCounter/constants.ts`: `EXERCISES` config and `RC` color tokens.
- `app/settings/pose-debug.tsx` (developer), `app/settings/preferences.tsx` (camera vs sensor, skip sensor selection, keep-going interval, hide progress ring).
- `plugins/withMediaPipeModel.js`: copies `pose_landmarker_lite.task` into Android assets at prebuild.
- Tests: none.

## How to run & test
- Run: Today → rep counter (needs a dev build on a real device; the camera frame processor doesn't run in Expo Go).
- Test: no automated tests. Settings → Developer → Pose debug shows landmarks and angles.

## Limits
- Camera mode needs the phone placed so the whole body is visible; elliptical needs calibration each session.
- No weights or sets: a session is one exercise.

## Gotchas
### Unused duplicate components
- **Problem**: `src/components/rep-counter/` is an older copy of `src/repCounter/components/` and nothing imports it.
- **Rule**: Edit `src/repCounter/` only.
### Hardcoded color tokens
- **Problem**: `RC` in `src/repCounter/constants.ts` ignores the user's theme.
- **Rule**: See `rules/gotchas.md`.

## Why
### D-4: On-device pose detection, with an accelerometer alternative
- **Chose**: Camera frames are analyzed in real time on the device; no image is recorded or sent. A sensors-only mode counts reps without the camera.
- **Rejected**: [TODO: not recorded]
- **Source**: `README_EN.md`, "Secure Camera" and "Accelerometer Alternative".
### D-5: EMA smoothing and range-of-motion checks in pose detection (v2)
- **Chose**: Landmark smoothing alpha 0.38→0.55 to reduce lag; angle stabilization as a plain EMA; visibility threshold 0.5→0.45; visibility-weighted angles; minimum range of motion per exercise so half reps don't count; strict per-exercise hysteresis to avoid double counts.
- **Rejected**: `MAX_ANGLE_DELTA_PER_FRAME` clamp: double filtering on top of the EMA.
- **Source**: changelog comment at the top of `src/utils/poseDetection.ts`.

## Assumptions
- Angle thresholds per exercise are "based on biomechanics literature" (unverified; source not cited in the code).

## Risks
- The lite pose model trades accuracy for speed (commit `f22cbf2` "Revert lite model" and later commits show it was switched back and forth). [TODO: which model ships now and why]

## Open issues & backlog
- [ ] Delete `src/components/rep-counter/` (issue; tracked in `rules/issues.md`)
- [ ] Multi-exercise circuits, e.g. run a generated workout (F-014) through the counter (idea)
- [ ] Form feedback beyond counting (idea)

## Log
- 2026-11-24: backfilled
