---
id: F-004
title: "Workout history & detail"
status: shipped
origin: backfill
files:
  - app/workout/
  - src/components/ui/EntryDetailModal.tsx
  - src/services/gpxExport.ts
depends_on: [F-001, F-011]
verified: "1e373b4 2026-11-24"
---

# F-004: Workout history & detail

## What it does
The Workout tab lists every entry, newest first, with filter chips by type, and opens a detail page per entry. The detail page shows the entry's data with charts (rep timeline for rep-counter sessions, run stats and route), lets the user edit or delete it, share a GPS run's GPX file, and (when AI features and "AI workout analysis" are on) asks Ploppy for a short analysis of the session.

## Code map
- `app/workout/index.tsx`: history list (`FILTER_DEFINITIONS`, `EntryCard`, `AddEntryBottomSheet`).
- `app/workout/[id].tsx`: detail page (`RepChart`, `LineChart`, AI analysis via `generateTextAnalysis`), helpers in `_workout-detail-helpers.tsx`, styles in `_workout-detail.styles.ts`.
- `src/components/ui/EntryDetailModal.tsx`: modal variant of the entry detail.
- `src/services/gpxExport.ts`: `generateGPX`, `saveGPXFile`, `shareGPXFile`.
- Tests: none.

## How to run & test
- Run: Workout tab → tap an entry.
- Test: no automated tests. AI analysis needs a connected Pollinations account (F-011).

## Limits
- [TODO: check whether the list paginates or virtualizes for thousands of entries; `MAX_ENTRIES_BEFORE_ARCHIVE_WARNING` is 5000.]

## Gotchas
None known.

## Why
- [TODO: not recorded]

## Assumptions
None known.

## Risks
None known.

## Open issues & backlog
- [ ] Search entries by text (idea)

## Log
- 2026-11-24: backfilled
