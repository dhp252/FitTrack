---
id: F-001
title: "Entry logging"
status: shipped
origin: backfill
files:
  - src/stores/appStore.ts
  - src/types/index.ts
  - src/components/forms/
  - src/components/sheets/AddEntryBottomSheet.tsx
  - src/stores/editorStore.ts
  - src/utils/validation.ts
  - src/storage/
depends_on: [F-002, F-006]
verified: "1e373b4 2026-11-24"
---

# F-001: Entry logging

## What it does
Lets the user log six kinds of entries: home workout (free-text exercises, optional abs block, total reps, duration), run (distance, duration, heart rate; avg speed computed), Beat Saber (duration, heart rate), custom sport (fields from its sport config), meal (name, free-text description) and body measurement (weight, body fat, waist, arm, hips). Entries can be dated in the past. Home workouts can also be pasted as JSON. Every add, edit or delete updates XP, quests, badges and, when signed in to social, weekly stats, challenge progress and the friends feed.

## Code map
- `src/types/index.ts`: `Entry` union and each entry interface.
- `src/stores/appStore.ts`: persisted store. Key symbols: `addHomeWorkout`, `addRun`, `addBeatSaber`, `addCustomSport`, `addMeal`, `addMeasure` (each takes `customDate?`, `customCreatedAt?`), `updateEntry`, `deleteEntry`, `scheduleSocialSync`, `scheduleAutoWorkoutShare`.
- `src/components/sheets/AddEntryBottomSheet.tsx` → `src/components/forms/AddEntryForm.tsx`: sport picker, category screen, per-type forms (`SportForms.tsx`, `WorkoutForm.tsx`), `DateTimeSelector.tsx`, `ImportModal.tsx` (JSON paste for home workouts).
- `src/stores/editorStore.ts`: the entry currently being edited.
- `src/storage/mmkv.ts`: MMKV storage with AsyncStorage fallback, used by `persist`.
- `src/utils/validation.ts`: zod `EntrySchema`.
- Entry point: the add (+) button on Today and Workout tabs opens `AddEntryBottomSheet`.
- Tests: none.

## How to run & test
- Run: `bunx expo run:android`, then tap + on the Today or Workout tab.
- Test: no automated tests. Manually add each type, edit and delete one, and check the Ploppy tab XP changes.

## Limits
- Meals have no calories or macros (`MealEntry` holds name, description and optional AI score only).
- Units setting (`kg`/`lbs`, `km`/`miles`) exists in settings; [TODO: check whether all forms and displays convert units].
- No edit history or undo after delete.

## Gotchas
### Side effects live in the store actions
- **Problem**: XP, quests, badges and social sync are triggered inside the `add*`/`updateEntry`/`deleteEntry` actions. Setting `entries` any other way skips them.
- **Rule**: Always go through the actions (see `rules/gotchas.md`).
### Imported entries and the social feed
- **Problem**: Passing `customCreatedAt` skips auto-share to the friends feed; entries created more than 5 minutes ago are never shared.
- **Rule**: Pass `customDate`/`customCreatedAt` for anything imported.

## Why
- Local-only storage: see D-1 in `rules/decisions.md`.
- MMKV with AsyncStorage fallback: [TODO: not recorded]
- Free-text exercises instead of a structured exercise model: [TODO: not recorded]

## Assumptions
- See A-1 in `system_spec.md` (weeks start Monday).

## Risks
- All data is in one persisted store on the device; losing the app data loses everything unless the user made a backup (F-017).

## Open issues & backlog
- [ ] Structured exercises (name, sets, reps, weight) for strength tracking and per-exercise progress (idea)
- [ ] Calories / macros on meals (idea; see F-013 for barcode data)

## Log
- 2026-11-24: backfilled
