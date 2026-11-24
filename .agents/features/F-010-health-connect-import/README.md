---
id: F-010
title: "Health Connect import"
status: shipped
origin: backfill
files:
  - app/health-connect.tsx
  - app/_health-connect.styles.ts
  - src/services/healthConnect/
  - src/services/healthConnectStartup.ts
  - src/components/sheets/HealthConnectSettingsSheet.tsx
  - src/components/ui/HealthConnectPromptModal.tsx
  - scripts/patch-health-connect.js
depends_on: [F-001]
verified: "1e373b4 2026-11-24"
---

# F-010: Health Connect import (Android)

## What it does
Reads exercise sessions, weight and body fat from Android Health Connect and imports them as Spix entries. Each Health Connect exercise type maps to home, run, Beat Saber or skip (defaults in `DEFAULT_EXERCISE_MAPPINGS`, adjustable). Already-imported sessions are hidden using `healthConnectId`. Sync mode: **manual** (default, import from the Health Connect screen), **notify** (on app start, show a prompt when new workouts exist) or **auto** (import new workouts on app start).

## Code map
- `src/services/healthConnect/index.ts`: lazy-loaded module; `checkHealthConnectAvailability`, `initializeHealthConnect`, `requestHealthConnectPermissions`, `getRecentWorkouts` (7 days default), `getRecentWeights` / `getRecentBodyFat` (30 days), `DEFAULT_EXERCISE_MAPPINGS`, `getDefaultSpixType`.
- `src/services/healthConnectStartup.ts`: `checkHealthConnectOnStartup` (sync modes), `setHealthConnectModalCallback`.
- `app/health-connect.tsx`: import screen (`WorkoutImportCard`, `WeightImportCard`, `HealthConnectSettingsSheet`).
- `scripts/patch-health-connect.js`, `scripts/android-patches/`: MainActivity intent filter and permissions rationale activity.
- Tests: none.

## How to run & test
- Run: Settings or Today prompt → Health Connect (Android with Health Connect installed).
- Test: no automated tests.

## Limits
- Android only. Heart rate, steps and calories permissions are declared in `app.json`, but the service doesn't read heart rate into imported entries (no BPM fields are filled).
- Look-back window is 7 days for workouts and 30 for weight.
- No export to Health Connect (read only).

## Gotchas
### Auto-import uses the UTC date
- **Problem**: Auto-import computes the entry date with `new Date(startTime).toISOString().split('T')[0]`, which is the UTC date, so a late-evening workout can land on the next or previous day.
- **Rule**: Use a local-date helper from `src/utils/date.ts`.

## Why
### D-6: Lazy-load the Health Connect module
- **Chose**: Load `react-native-health-connect` lazily behind an availability check.
- **Rejected**: Top-level import: crashes on iOS where the module doesn't exist.
- **Source**: `.github/copilot-instructions.md`, "Health Connect Integration".

## Assumptions
None known.

## Risks
None known.

## Open issues & backlog
- [ ] Fix UTC date in auto-import (issue)
- [ ] Write Spix workouts back to Health Connect (idea)
- [ ] Apple Health on iOS (idea)

## Log
- 2026-11-24: backfilled
