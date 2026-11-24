---
id: F-008
title: "Run tracking (GPS, AI plan)"
status: shipped
origin: backfill
files:
  - app/run/
  - src/components/run/RunTracker.tsx
  - src/components/run/RunSummary.tsx
  - src/components/run/CountdownBanner.tsx
  - src/components/run/runTrackerHelpers.tsx
  - src/components/run/runTrackerStyles.ts
  - src/components/run/runTrackerTokens.ts
  - src/stores/runStore.ts
  - src/services/runTracker.ts
  - src/services/maplibre.ts
  - src/services/gpxExport.ts
  - src/services/pollination/runCoach.ts
  - src/utils/geoUtils.ts
depends_on: [F-001, F-009, F-011]
verified: "1e373b4 2026-11-24"
---

# F-008: Run tracking (GPS, AI plan)

## What it does
Tracks a run with GPS (foreground and background location): live distance (Haversine), elapsed time, current and average pace, elevation gain and estimated calories, with a MapLibre map when available. Two modes: **simple** starts tracking directly; **AI** runs a three-step setup (free-text goal → multiple-choice questions → generated plan with segments, target pace and coaching points) via Pollinations before starting. At the end, a summary saves a `run` entry with the simplified route, a GPX file, pace, elevation, calories and (AI mode) the plan and an AI debrief.

## Code map
- `app/run/simple/index.tsx`, `app/run/ai/index.tsx` (plan generation with `generateTextAnalysis`), `app/run/_layout.tsx`.
- `src/components/run/RunTracker.tsx`: live tracking UI, safety check and fall detection wiring (F-009).
- `src/components/run/RunSummary.tsx`: end summary, GPX save, AI debrief, `addRun`.
- `src/stores/runStore.ts`: in-memory run state (`mode`, `status`, `plan`, `coords`, pace, coaching state).
- `src/services/runTracker.ts`: `haversineDistance`, pace helpers, `calculateElevationGain`, `calculateRunCalories`, `calculateRunXP`, `startTracking` / `stopTracking`.
- `src/services/pollination/runCoach.ts`: `shouldTriggerCoaching`, `generateCoachingMessage`, `executeCoaching`.
- `src/utils/geoUtils.ts`: `simplifyRouteRdp` (route simplification). `src/services/maplibre.ts`: lazy MapLibre loader.
- Tests: none.

## How to run & test
- Run: open the rep counter's activity picker (`src/repCounter/components/ExerciseSelector.tsx`) and pick the run card (`/run/simple`, or `/run/ai` when AI features are on); needs location permission and a real device for GPS.
- Test: no automated tests. AI mode needs a connected Pollinations account (F-011).

## Limits
- Run state is not persisted: if the app is killed mid-run, the run is lost (no session recovery like F-007).
- Distance and pace come only from GPS points; no step-sensor fallback indoors.

## Gotchas
### Coaching settings are untyped and never set
- **Problem**: Run screens read `settings.runSettings` (`coachingEnabled`, `pollinationsModel`, intervals) through a type cast; `runSettings` is not in `UserSettings` and no screen writes it. `executeCoaching` is never called during a run, and the AI debrief in `RunSummary` is gated on `coachingEnabled`.
- **Rule**: Treat mid-run coaching as not wired. Add a typed setting before relying on it.
### Summary XP
- **Problem**: `xpGained` uses `calculateRunXP`, not the XP actually awarded. See F-006.

## Why
- [TODO: not recorded]

## Assumptions
None known.

## Risks
- Background location drains battery; [TODO: not recorded how this was measured].

## Open issues & backlog
- [ ] Persist the live run so it survives an app kill (issue)
- [ ] Wire mid-run AI coaching: typed `runSettings`, a settings UI, and a call to `executeCoaching` (issue)
- [ ] Voice announcements per km / split times (idea)
- [ ] Import GPX from other apps (idea)

## Log
- 2026-11-24: backfilled
