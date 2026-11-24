---
id: F-009
title: "Run safety check & fall detection"
status: shipped
origin: backfill
files:
  - app/settings/safety.tsx
  - src/stores/safetyStore.ts
  - src/components/run/SafetyCheckConfig.tsx
  - src/components/run/SafetyCheckOverlay.tsx
  - src/services/fallDetection.ts
  - src/services/safetyAlert.ts
  - src/utils/safety.ts
  - src/constants/safety.ts
  - plugins/withSpixSmsManager.js
depends_on: [F-008]
verified: "1e373b4 2026-11-24"
---

# F-009: Run safety check & fall detection

## What it does
During a run, the user can turn on periodic safety checks (every 15–120 min, default 30). When a check fires, the user has a countdown to confirm they're OK; with no answer (default 60 s) or a help request, the app sends an alert with the last known position to the emergency contacts saved in Settings → Safety, by SMS (direct native send on Android when permitted, otherwise the SMS app) or WhatsApp. Optional fall detection uses the accelerometer (impact over 2.5 g then 1.5 s of stillness) to start the same flow. An "all clear" message can follow.

## Code map
- `app/settings/safety.tsx`: emergency contacts and defaults (`settings.safety`).
- `src/components/run/SafetyCheckConfig.tsx` (pre-run setup), `SafetyCheckOverlay.tsx` (check / countdown UI); wiring in `src/components/run/RunTracker.tsx`.
- `src/stores/safetyStore.ts`: in-memory check state machine (`idle` → `countdown` → `pending` / `fall_detected` → `auto_alerting` → `alert_sent` / `dismissed`).
- `src/services/fallDetection.ts`: `FALL_DETECTION` thresholds, `startFallDetection`.
- `src/services/safetyAlert.ts`: `sendSafetyAlert`, `sendAllClearSafetyAlert`, SMS permission checks.
- `plugins/withSpixSmsManager.js`: native `SpixSmsSender` module for direct SMS.
- `src/constants/safety.ts`: phone regex (international format), interval and delay options.
- Tests: none.

## How to run & test
- Run: Settings → Safety to add a contact, then enable the check before a run.
- Test: no automated tests. Test alerts only with your own phone number as the contact.

## Limits
- Only active during a tracked run, not during other workouts.
- WhatsApp sending opens WhatsApp; delivery can't be confirmed. SMS delivery depends on carrier and permission.
- Fall detection thresholds are fixed, not calibrated per user.

## Gotchas
### SEND_SMS permission and store policy
- **Problem**: The app declares `android.permission.SEND_SMS`, which Google Play restricts to approved use cases.
- **Rule**: Keep the SMS-app fallback working when the permission is missing. [TODO: record how this was handled for Play review]

## Why
- [TODO: not recorded]

## Assumptions
None known.

## Risks
- A false negative (no alert when needed) is the worst failure; there are no automated tests for the state machine or fall detection.

## Open issues & backlog
- [ ] Unit tests for `safetyStore` transitions and `fallDetection` thresholds (issue)
- [ ] Live location sharing link during a run (idea)

## Log
- 2026-11-24: backfilled
