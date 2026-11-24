---
id: F-016
title: "Reminders & notifications"
status: shipped
origin: backfill
files:
  - app/settings/notifications.tsx
  - app/settings/_notifications.styles.ts
  - src/services/notifications/index.ts
  - src/config/buildConfig.ts
depends_on: []
verified: "1e373b4 2026-11-24"
---

# F-016: Reminders & notifications

## What it does
Local scheduled reminders: a daily streak reminder at a chosen time, up to four meal reminders per day, and a weight reminder (daily, weekly on a weekday, or monthly on a day of the month). It also shows social notifications (encouragement received, friend request, friend accepted) on dedicated Android channels, and in the standard flavor registers an Expo push token for social pushes.

## Code map
- `src/services/notifications/index.ts`: lazy `expo-notifications` import, Android channels (`default`, `encouragements`, `friends`), `registerForPushNotifications` (skipped when `BuildConfig.pushNotificationsEnabled` is false), `scheduleStreakReminder`, `scheduleMealReminder` / `cancelMealReminder`, `scheduleWeightReminderDaily` / `Weekly` / ..., `show*Notification`.
- `app/settings/notifications.tsx`: reminder settings UI.
- Settings fields: `streakReminder*`, `mealReminders`, `weightReminder*` in `UserSettings`.
- Tests: none.

## How to run & test
- Run: Settings → Notifications.
- Test: no automated tests; check scheduled reminders on a device.

## Limits
- The streak reminder is a plain daily trigger, so it fires even when the user already worked out that day.
- No workout-plan reminders (e.g. "run day").

## Gotchas
### FOSS builds have no push
- **Problem**: The FOSS flavor has no FCM; push registration returns early (D-2).
- **Rule**: Local notifications must not depend on a push token.

## Why
- Flavor split: see D-2 in `rules/decisions.md`.

## Assumptions
None known.

## Risks
None known.

## Open issues & backlog
- [ ] Skip or reschedule the streak reminder when today already has a workout (issue)

## Log
- 2026-11-24: backfilled
