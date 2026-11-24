---
id: F-005
title: "Progress & stats"
status: shipped
origin: backfill
files:
  - app/progress.tsx
  - app/_progressWidgets.tsx
  - app/_progressTokens.ts
  - src/components/ui/BadgeDisplay.tsx
  - src/components/ui/BadgeWithProgress.tsx
  - src/components/ui/MonthCard.tsx
depends_on: [F-001, F-006, F-011]
verified: "1e373b4 2026-11-24"
---

# F-005: Progress & stats

## What it does
The Progress tab: weekly goal arc, workout bar chart, monthly calendar with check marks, top exercises, weight trend, badges (with a badge detail modal) and, when AI features and "AI progress summary" are on, a Ploppy weekly summary generated from the user's recent entries.

## Code map
- `app/progress.tsx`: screen and AI weekly summary (`generateTextAnalysis` with `settings.aiModel`, `settings.aiTone`).
- `app/_progressWidgets.tsx`: `StatsSection`, `TopExCard`, `WorkoutBarChart` and other widgets; `app/_progressTokens.ts`: local color tokens.
- `src/components/ui/BadgeDisplay.tsx`, `BadgeWithProgress.tsx`, `MonthCard.tsx`.
- Tests: none.

## How to run & test
- Run: Progress tab.
- Test: no automated tests.

## Limits
- Uses its own color tokens (`_progressTokens.ts`), so theme presets may not apply fully (see `rules/gotchas.md`).

## Gotchas
None known.

## Why
- [TODO: not recorded]

## Assumptions
None known.

## Risks
- The AI summary sends recent workout data to Pollinations; it only runs when the user has turned AI on (D-1).

## Open issues & backlog
- [ ] Personal records per exercise and per run distance (idea)
- [ ] `app/progress.tsx.bak` is committed and unused (issue; tracked in `rules/issues.md`)

## Log
- 2026-11-24: backfilled
