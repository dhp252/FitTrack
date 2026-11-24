---
id: F-002
title: "Custom sports"
status: shipped
origin: backfill
files:
  - app/settings/sports.tsx
  - src/stores/appStore.ts
  - src/types/index.ts
depends_on: []
verified: "1e373b4 2026-11-24"
---

# F-002: Custom sports

## What it does
Manages the list of sports offered when logging a workout. Three default sports (Musculation/home, Course/run, Beat Saber) can be hidden but not deleted. The user can create custom sports with a name, emoji, Lucide icon, color and a chosen set of tracking fields (duration, distance, avg/max BPM, cardiac load, calories, exercises text, total reps). Custom sport sessions are stored as `custom` entries with a `sportId`.

## Code map
- `app/settings/sports.tsx`: Settings → Sports screen (`SportCard`, `AddSportSheet`).
- `src/stores/appStore.ts`: `sportsConfig`, `defaultSportsConfig`, `addSportConfig`, `updateSportConfig`, `deleteSportConfig`, `toggleSportVisibility`, `getVisibleSports`.
- `src/types/index.ts`: `SportConfig`, `SportTrackingField`, `CustomSportEntry`.
- `src/stores/selectors.ts`: `useSportsConfig`.
- Tests: none.

## How to run & test
- Run: Settings → Sports; add a sport, then log it from the + sheet.
- Test: no automated tests.

## Limits
- Custom sport XP is a fixed rule (25 base, +10 over 30 min, +3 per km) regardless of the sport (`calculateXpForEntry`).
- Default sport names are stored in French in the store (`'Musculation'`, `'Course'`); [TODO: check whether the UI translates them].

## Gotchas
### Deleting a sport with existing entries
- **Problem**: `custom` entries reference `sportId`; [TODO: check what history shows when that sport config is deleted].
- **Rule**: Check entries for the `sportId` before deleting, or hide instead.

## Why
- [TODO: not recorded]

## Assumptions
None known.

## Risks
None known.

## Open issues & backlog
- [ ] Per-sport XP rules or custom quests (idea)

## Log
- 2026-11-24: backfilled
