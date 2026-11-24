---
id: F-018
title: "Onboarding"
status: shipped
origin: backfill
files:
  - app/onboarding.tsx
  - assets/onboarding.jpg
depends_on: []
verified: "1e373b4 2026-11-24"
---

# F-018: Onboarding

## What it does
First-launch flow with five steps (goal, level, weekly frequency, social, gamification). It stores `fitnessGoal` (lose weight, build muscle, improve cardio, stay healthy), `fitnessLevel` (beginner, intermediate, advanced) and `weeklyGoal`, then sets `onboardingCompleted`. Developer mode can replay it.

## Code map
- `app/onboarding.tsx`: the flow (`PROGRESS_STEPS = 5`).
- `app/_layout.tsx`: hides the tab bar on `/onboarding`.
- `app/settings/developer.tsx`: "replay onboarding".
- Tests: none.

## How to run & test
- Run: fresh install, or Settings → Developer (tap About 10 times to unlock) → onboarding.
- Test: no automated tests.

## Limits
- `fitnessGoal` is stored but nothing reads it; `fitnessLevel` is only shown again in Settings → Personal. Neither shapes quests, generated workouts or AI prompts.

## Gotchas
### Old onboarding file
- **Problem**: `app/newonboarding.tsx.bak` is an unused older version committed to the repo.
- **Rule**: Edit `app/onboarding.tsx` only.

## Why
- [TODO: not recorded]

## Assumptions
None known.

## Risks
None known.

## Open issues & backlog
- [ ] Use goal and level to tailor quests and generated workouts (idea)

## Log
- 2026-11-24: backfilled
