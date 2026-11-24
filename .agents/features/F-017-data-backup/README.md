---
id: F-017
title: "Data backup, import & reset"
status: shipped
origin: backfill
files:
  - app/settings/data.tsx
  - src/utils/export.ts
  - src/utils/validation.ts
  - src/utils/archive.ts
  - src/components/ui/ExportModal.tsx
  - src/components/forms/ImportModal.tsx
depends_on: [F-001, F-006]
verified: "1e373b4 2026-11-24"
---

# F-017: Data backup, import & reset

## What it does
Settings → Data exports a full JSON backup (entries, a subset of settings, unlocked badges, sports config, XP, level, XP history, quests) through the share sheet, restores one picked with the document picker (validated with zod, sports config merged), and resets all data. Home workouts can also be pasted as JSON from the add-entry form.

## Code map
- `app/settings/data.tsx`: export / import / reset UI.
- `src/utils/export.ts`: `FullBackup` (version 2), `generateFullBackup`, `exportFullBackup`, `parseBackup`; also `generateWeeklyExport` / `exportToJSON` (not used by any screen).
- `src/utils/validation.ts`: `BackupSchema`, `validateBackup` (used by `appStore.restoreFromBackup`).
- `src/utils/archive.ts` + `appStore.getArchiveAnalysis` / `performArchive`: archive entries older than 365 days, keeping at least 100 (not exposed in any screen).
- `src/components/ui/ExportModal.tsx`, `src/components/forms/ImportModal.tsx`.
- Tests: none.

## How to run & test
- Run: Settings → Data.
- Test: no automated tests. Round-trip: export, reset, import, compare the Ploppy level and entry count.

## Limits
- The backup keeps only `weeklyGoal`, `hiddenTabs`, camera preferences and units from settings; theme, reminders, safety contacts, AI and personal settings are not restored.
- Manual only: no scheduled or cloud backup.
- No CSV export.

## Gotchas
### Backup settings subset
- **Problem**: A new setting is not backed up unless added to `generateFullBackup` and `SettingsSchema`.
- **Rule**: When adding a setting worth keeping, add it to both.

## Why
- Manual file backup fits local-first storage: see D-1.

## Assumptions
None known.

## Risks
- Users who never export lose everything with the device (see F-001).

## Open issues & backlog
- [ ] Include all user settings (except secrets) in the backup (issue)
- [ ] Expose archiving in the UI or remove the unused code (issue)
- [ ] Automatic periodic backup to a user-chosen folder (idea; F-020 can upload the full backup to WebDAV)
- [ ] CSV export (idea)

## Log
- 2026-11-24: backfilled
- 2026-11-24: F-020 reuses `generateFullBackup` for its optional WebDAV backup upload
