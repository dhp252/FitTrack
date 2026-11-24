---
id: F-003
title: "Today dashboard"
status: shipped
origin: backfill
files:
  - app/index.tsx
  - app/_layout.tsx
  - src/components/ui/WorkoutCard.tsx
  - src/components/ui/HealthConnectPromptModal.tsx
  - src/stores/selectors.ts
depends_on: [F-001, F-006, F-010]
verified: "1e373b4 2026-11-24"
---

# F-003: Today dashboard

## What it does
The first tab ("Today"). Shows progress toward the weekly workout goal, the current week's days with activity marks, streak, and recent workouts, with shortcuts to add an entry, open the rep counter, the workout history and (when enabled in Labs) the barcode scanner. On launch it can show the Health Connect prompt when new workouts are found (sync mode "notify").

## Code map
- `app/index.tsx`: Today screen.
- `app/_layout.tsx`: root layout, custom animated tab bar (`TAB_CONFIG`), Health Connect startup check wiring.
- `src/stores/selectors.ts`: memoized streak / week counts / recent entries.
- `src/components/ui/WorkoutCard.tsx`, `HealthConnectPromptModal.tsx`.
- Tests: none.

## How to run & test
- Run: launch the app; Today is the default tab.
- Test: no automated tests.

## Limits
- Weekly goal counts sport entries only (`isSportEntryType`), not meals or measures.

## Gotchas
None known.

## Why
- [TODO: not recorded]

## Assumptions
- See A-1 in `system_spec.md`.

## Risks
None known.

## Open issues & backlog
None known.

## Log
- 2026-11-24: backfilled
