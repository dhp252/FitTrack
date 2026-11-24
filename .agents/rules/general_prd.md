---
trigger: model_decision
description: Product Requirements Document (PRD) outlining requirements, success metrics, and validation schemas.
---

# Product Requirements Document (PRD): Spix (FitTrack)

This document defines the product requirements, goals, success metrics, and system scope for the Spix app.

---

## 1. Product Overview

### Executive Summary
Spix is a privacy-first, offline-first fitness tracking app for Android (React Native / Expo). It logs workouts (home strength, runs, Beat Saber, custom sports), meals and body measurements, and keeps users motivated with XP, levels, weekly quests, streaks and badges. Advanced features include a camera or accelerometer rep counter, GPS run tracking with a safety check, Health Connect import, optional AI analysis (Pollinations) and optional social features (Supabase). All data stays on the device unless the user opts in to a network feature. Source: `README_EN.md`.

### Target Users
- **Individual trainee**: logs home workouts, runs and meals on their own phone and wants motivation without giving up their data.
- **Social user (opt-in)**: compares weekly stats with friends, sends encouragements, joins challenges.
- [TODO: confirm target users; the README says the app started as a personal project and is in beta.]

---

## 2. Key Objectives & Success Metrics

### Success Metrics
1. [TODO: not recorded]

---

## 3. Functional Requirements

### Tracking
- **F-001: Entry logging**:
  - *Description*: Log home workouts, runs, Beat Saber sessions, custom sports, meals and body measurements, on today or a past date.
  - *Implementation*: `appStore` actions plus forms in a bottom sheet. Details: `.agents/features/F-001-entry-logging/README.md`
- **F-002: Custom sports**:
  - *Description*: Create, hide and configure sports with chosen tracking fields.
  - *Implementation*: `sportsConfig` in `appStore`, `app/settings/sports.tsx`. Details: `.agents/features/F-002-custom-sports/README.md`
- **F-003: Today dashboard**:
  - *Description*: Home tab with weekly goal progress, week calendar, recent workouts and quick actions.
  - *Implementation*: `app/index.tsx`. Details: `.agents/features/F-003-today-dashboard/README.md`
- **F-004: Workout history & detail**:
  - *Description*: Filterable log of all entries and a detail page per entry with charts, GPX share and optional AI analysis.
  - *Implementation*: `app/workout/`. Details: `.agents/features/F-004-workout-history/README.md`
- **F-005: Progress & stats**:
  - *Description*: Charts of activity and weight over time, badges and an optional AI weekly summary.
  - *Implementation*: `app/progress.tsx`. Details: `.agents/features/F-005-progress-stats/README.md`

### Motivation
- **F-006: Gamification**:
  - *Description*: XP per workout, levels and ranks, three or four weekly quests, streaks and badges, shown on the Ploppy tab.
  - *Implementation*: `gamificationStore`, `utils/badges.ts`, `app/gamification.tsx`. Details: `.agents/features/F-006-gamification/README.md`

### Guided sessions
- **F-007: Rep counter**:
  - *Description*: Counts reps (push-ups, pull-ups, sit-ups, squats, jumping jacks), times planks and elliptical sessions using on-device pose detection or the accelerometer.
  - *Implementation*: `src/repCounter/`, MediaPipe pose model. Details: `.agents/features/F-007-rep-counter/README.md`
- **F-008: Run tracking**:
  - *Description*: GPS run tracking with live pace, map and summary; an AI mode builds a run plan first.
  - *Implementation*: `app/run/`, `runStore`, `services/runTracker.ts`. Details: `.agents/features/F-008-run-tracking/README.md`
- **F-009: Run safety check**:
  - *Description*: Periodic "are you OK?" checks and fall detection during runs, with automatic SMS/WhatsApp alerts to emergency contacts.
  - *Implementation*: `safetyStore`, `services/fallDetection.ts`, `services/safetyAlert.ts`. Details: `.agents/features/F-009-run-safety-check/README.md`
- **F-014: Workout generator**:
  - *Description*: Generates a home session from duration, focus area and intensity.
  - *Implementation*: `utils/workoutGenerator.ts`, `app/tools.tsx`. Details: `.agents/features/F-014-workout-generator/README.md`

### Integrations
- **F-010: Health Connect import**:
  - *Description*: Imports workouts, weight and body fat from Android Health Connect, manually or on startup.
  - *Implementation*: `services/healthConnect/`, `app/health-connect.tsx`. Details: `.agents/features/F-010-health-connect-import/README.md`
- **F-011: AI assistant (Ploppy / Pollinations)**:
  - *Description*: Connects the user's Pollinations account and controls which AI features are on.
  - *Implementation*: `services/pollination/`, `app/settings/ai.tsx`. Details: `.agents/features/F-011-ai-ploppy/README.md`
- **F-012: AI meal analysis**:
  - *Description*: Photographs a meal and gets a 0–100 score and suggestions (Labs).
  - *Implementation*: `app/enhanced-meal.tsx`. Details: `.agents/features/F-012-ai-meal-analysis/README.md`
- **F-013: Barcode scanner**:
  - *Description*: Scans a food barcode and shows OpenFoodFacts product info (Labs).
  - *Implementation*: `app/barcode-scanner.tsx`. Details: `.agents/features/F-013-barcode-scanner/README.md`

### Social
- **F-015: Social hub**:
  - *Description*: Opt-in account, friends, leaderboards, encouragements, challenges and a workout feed.
  - *Implementation*: Supabase via `services/supabase/social.ts`. Details: `.agents/features/F-015-social-hub/README.md`

### App
- **F-016: Reminders & notifications**:
  - *Description*: Streak, meal and weight reminders, plus social notifications.
  - *Implementation*: `services/notifications/`. Details: `.agents/features/F-016-reminders-notifications/README.md`
- **F-017: Data backup & export**:
  - *Description*: Full JSON backup and restore, JSON workout import, reset all data.
  - *Implementation*: `app/settings/data.tsx`, `utils/export.ts`. Details: `.agents/features/F-017-data-backup/README.md`
- **F-018: Onboarding**:
  - *Description*: First-launch flow for goal, level and weekly target.
  - *Implementation*: `app/onboarding.tsx`. Details: `.agents/features/F-018-onboarding/README.md`
- **F-019: Appearance & language**:
  - *Description*: Theme presets and custom palette, navbar style, hidden tabs, and language (en/fr/de/it).
  - *Implementation*: `app/settings/appearance.tsx`, `src/i18n/`. Details: `.agents/features/F-019-appearance-language/README.md`

---

## 4. Data Requirements & Schemas

### On-device data
- **Entries** (`appStore.entries`, `Entry` union in `src/types/index.ts`): `id` (nanoid), `type` (`home` | `run` | `beatsaber` | `meal` | `measure` | `custom`), `createdAt` (ISO), `date` (YYYY-MM-DD), optional `healthConnectId`, plus type-specific fields.
- **Settings** (`UserSettings`), **sports** (`SportConfig[]`), **unlocked badges** (`BadgeId[]`), **gamification** (xp, level, history, quests).

### Output Data
- **Full backup** (`FullBackup` in `src/utils/export.ts`): JSON with `version`, `app` (entries, settings, badges, sports) and `gamification`; validated with zod (`BackupSchema`) on restore.
- **GPX file** for GPS runs (`src/services/gpxExport.ts`).
