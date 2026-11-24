---
id: F-014
title: "Workout generator"
status: shipped
origin: backfill
files:
  - app/tools.tsx
  - src/utils/workoutGenerator.ts
depends_on: [F-001]
verified: "1e373b4 2026-11-24"
---

# F-014: Workout generator

## What it does
The Tools tab (hidden by default, shown from Labs) generates a home session from a duration (10, 20 or 30 min), a focus area (upper body, abs, legs, full body) and an intensity (easy, medium, hard), picking exercises from a built-in list, with an optional abs block. The session can be saved as a home workout.

## Code map
- `src/utils/workoutGenerator.ts`: exercise base per focus, `generateWorkout`, `formatWorkoutAsText`, labels.
- `app/tools.tsx`: Tools screen, saves via `addHomeWorkout`.
- Tests: none.

## How to run & test
- Run: Settings → Labs → enable the Tools screen, then the Tools tab.
- Test: no automated tests; `generateWorkout` is pure and easy to unit test.

## Limits
- "V1 simple" per the file header: a fixed exercise list, no equipment options, no progression and no timer or guided playback.
- Exercise names are hardcoded in French in `exercisesByFocus` (e.g. "Pompes classiques"), so other languages see French names.

## Gotchas
None known.

## Why
- [TODO: not recorded]

## Assumptions
None known.

## Risks
None known.

## Open issues & backlog
- [ ] Translate generated exercise names (issue)
- [ ] Guided playback with timers or the rep counter (idea; see F-007)
- [ ] Equipment and level-aware generation, possibly AI-generated (idea; see F-011)

## Log
- 2026-11-24: backfilled
