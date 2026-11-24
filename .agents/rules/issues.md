---
trigger: model_decision
description: Active backlogs, project issues, and upcoming features checklist.
---

# Backlog & Project Issues: Spix (FitTrack)

This document tracks cross-cutting development issues and milestone planning. Items that belong to one feature live in that feature's README (`.agents/features/F-<nnn>-*/README.md`, section "Open issues & backlog") and are referenced here by ID.

---

## 1. Active Issues & Backlog

### Stage 1: Engineering hygiene
- [ ] **Test setup**: No test framework or tests exist. Add one (e.g. Jest + `jest-expo`) and start with pure logic: `src/utils/date.ts`, `calculateXpForEntry`, `src/services/runTracker.ts`, `src/utils/validation.ts`.
- [ ] **Lint and type check in CI**: No ESLint/Prettier config and no CI job that runs `tsc --noEmit` on pull requests; the only workflow is the manual release. `tsc` currently fails to start (see A-17), and `eslint-plugin-react-hooks` would have caught A-03.
- [ ] **Remove dead code**: `.bak` files are committed (`app/newonboarding.tsx.bak`, `app/progress.tsx.bak`, `assets/*.png.bak`), and `src/components/rep-counter/` duplicates `src/repCounter/components/` but nothing imports it.
- [ ] **Refresh `.github/copilot-instructions.md`** or point it at `.agents/` (see `gotchas.md`, "Outdated agent instructions").

### Audit findings (2026-11-24)
Full-code audit, ranked by severity. IDs `A-nn` are stable; tick an item when its fix merges. "Confirmed" means reproduced (script, lint or tsc); the rest are from reading the code. Feature-level duplicates of items already in a feature README are marked "(known)".

#### Critical: data loss, crashes, safety
- [ ] **A-01 Restore silently strips entry fields** (F-017). `validateBackup` (`src/utils/validation.ts`) uses Zod objects, which drop unknown keys. When a backup passes validation, `restoreFromBackup` (`src/stores/appStore.ts:523`) keeps only the schema fields: run `route`, `gpxFilePath`, `avgPaceSecPerKm`, `elevationGainM`, `calories`, `xpGained`, `plan`, `aiCoachMessages`, `notes`, and measure `bodyFatPercent` are lost. Confirmed with a script. The schema also omits the `custom` entry type, so any backup with a custom-sport entry fails validation and is restored unvalidated, which makes the behaviour depend on the data. Fix: `.passthrough()`/`z.looseObject` or full schemas, add `custom`, and refuse (not fall back) on real failures.
- [ ] **A-02 Restore wipes current settings** (F-017). `handleRestore` (`app/settings/data.tsx:375`) passes only weekly goal, hidden tabs, camera flags and units, and `restoreFromBackup` spreads them over `defaultSettings`. Restoring therefore resets safety contacts, profile (weight, height, gender), AI toggles/model/tone, theme, Health Connect sync mode, notification settings and onboarding state to defaults, even on the same phone. Broader than "backup missing settings" (known): fix both export and restore, and merge over current settings rather than defaults.
- [ ] **A-03 Run screen crashes when location permission is denied** (F-008). `RunTracker.tsx:557` calls `useEffect` after the early `if (permissionDenied) return` at line 526, so the hook count changes and React throws. Confirmed by `eslint-plugin-react-hooks`. Same rule broken in `app/run/ai/index.tsx` (six `useCallback`s after the `if (!aiFeaturesEnabled) return` at line 117); crashes if AI is toggled while that screen stays mounted.
- [ ] **A-04 GPS and safety checks stop when the screen is off** (F-008, F-009). Tracking uses foreground `watchPositionAsync` (`src/services/runTracker.ts:130`) and JS `setInterval`s, with no background location task or foreground service, although `ACCESS_BACKGROUND_LOCATION` and `FOREGROUND_SERVICE_LOCATION` are declared in `app.json`. With the phone locked in a pocket, Android throttles or stops updates: distance is undercounted, the timer only catches up on return, and safety check-ins and auto-alerts do not fire. Together with "run lost if the app is killed" (known) this is the main run reliability gap. Fix: `Location.startLocationUpdatesAsync` with a TaskManager task and foreground-service notification, and persist the live run.
- [ ] **A-05 Safety alerts can report success without sending** (F-009). In `src/services/safetyAlert.ts`, WhatsApp contacts (`sendWhatsApp`, line 170) only open the composer, but are counted as `success`; an unconscious runner cannot press Send. The Android `SEND_SMS` permission is requested at alert time (`ensureAndroidSmsPermissionGranted`), when nobody can answer the dialog. If there is no GPS fix yet, no alert is sent at all (`RunTracker.tsx:350`) instead of one without location. The message always names the runner "Utilisateur" (line 32). Fix: for auto-alerts use direct SMS only, require the permission when contacts are saved, send without location, and use a configurable name.
- [ ] **A-06 "Clear all data" leaves data behind** (F-017). `resetAllData` clears only `entries`, `settings` and badges. XP, level, quests and XP history (`gamificationStore`), custom sports, the stored language, cached AI summaries in MMKV, the Pollinations key and the social session remain.

#### High: wrong data, privacy, AI reliability
- [ ] **A-07 AI failures are invisible** (F-011). Every AI call logs errors only under `__DEV__` (`app/progress.tsx`, `app/workout/[id].tsx`, `app/run/ai/index.tsx:177/221`, `RunSummary.tsx`), and the AI run planner silently shows a hard-coded fallback plan as if the AI had made it. `isPollinationConnected` only checks that a key is stored, while the key is created with `expiry: 30` days and a 50-pollen budget (`getPollinationAuthUrl`), so after expiry or budget exhaustion AI "just stops". The auth URL also asks for `models: 'claude-fast'` while text features default to `openai`; check whether Pollinations restricts the key to the listed models. Input for the AI debug view the user asked for: surface HTTP status, error body, model and key expiry.
- [ ] **A-08 Failed requests are cached** (F-011, F-012). `getOrSetMemoryCache` caches whatever the loader returns. `uploadImageToTmpFiles` returns `{ success: false }` instead of throwing, so an upload failure is replayed for 10 minutes; the meal parse fallback (score 50, "Impossible d'analyser...") is cached for 2 minutes. Retrying looks broken.
- [ ] **A-09 AI POSTs are retried on timeout** (F-011). `fetchWithRetry` retries chat completions on timeouts and 5xx; a slow but successful request is billed twice. 20 s is short for image analysis, so timeouts are likely.
- [ ] **A-10 Personal data sent to AI without consent** (F-011, known): the AI run plan prompt includes body weight regardless of `sharePersonalWithAI`; that flag is not read anywhere else either.
- [ ] **A-11 Meal photos uploaded to a public host** (F-012, known): `tmpfiles.org` URL is public for up to an hour. Send the image inline as a base64 data URL instead.
- [ ] **A-12 Health Connect auto-import** (F-010). `healthConnectStartup.ts` does not pass `customCreatedAt`, so auto-imported workouts get `createdAt = now` and are auto-shared to the social feed as new workouts. A run with no distance in Health Connect is saved as a made-up 5 km (line 103). Dates use UTC (line 89, known). The import screen formats dates with the French locale for every language (`app/health-connect.tsx:225`).
- [ ] **A-13 Gamification drift** (F-006). Quests are refreshed only when the Ploppy tab mounts (`app/gamification.tsx:239`), so with the tab hidden or unopened, last week's quests keep collecting this week's workouts and award XP again. Quest XP is never removed when the entry that completed it is deleted, so delete/re-add farms XP. XP removal looks up gains in `history`, which is capped at 50 (`MAX_GAMIFICATION_HISTORY_ENTRIES`): editing an older workout adds new XP without removing the old, deleting one removes nothing. `recalculateFromEntries` (developer "recalculate", archive) drops all quest XP. Week IDs use `getYear` with `getWeek`, which collides around New Year. Run summary XP differs from awarded XP (known). Fix: derive XP and quests from entries instead of an event log.
- [ ] **A-14 Quest totals miss Monday workouts west of UTC** (F-006). `calculateQuestTotals` parses `YYYY-MM-DD` with `new Date()`, which is UTC midnight, so in the Americas a Monday entry is evaluated as Sunday of the previous week.
- [ ] **A-15 Run distance and elevation inflated** (F-008). After resume, `lastPointRef` is not cleared, so the straight line from the pause point is added. There is no stationary/jitter filter beyond 25 m accuracy, so standing still accrues distance. Elevation gain sums raw GPS altitude noise.
- [ ] **A-16 Run can be saved twice** (F-008). `handleSave` (`RunSummary.tsx:207`) awaits GPX writing before `addRun` with no in-flight guard; a double tap creates two runs and double XP.

#### Medium: performance, maintainability, policy
- [ ] **A-17 Type check cannot run.** `tsconfig.json` sets `ignoreDeprecations: "6.0"` but the project pins TypeScript 5.9, so `tsc` exits at once with TS5103. With that line removed there are 48 type errors, most from `src/services/supabase/database.types.ts` being out of date (typed queries resolve to `never`), plus notification triggers, Health Connect and the feed mapper.
- [ ] **A-18 All data in one JSON blob.** Every entry (including full per-second GPS routes with accuracy and speed) lives in one persisted Zustand key; each change re-serializes everything to MMKV. Cost grows with history. Store routes in files (GPX already exists) or a separate key.
- [ ] **A-19 No crash or error log on device.** `ErrorBoundary` and `logger` write to the console only, and the logger is silent in release builds, so a user has nothing to inspect or share. Input for the debug view.
- [ ] **A-20 No store migrations.** None of the persisted stores set `version`/`migrate`, and the default shallow merge replaces `settings` wholesale, so new nested defaults are missing for upgraded users (code guards some, e.g. `settings.safety ?? ...`).
- [ ] **A-21 Play policy risk.** `ACCESS_BACKGROUND_LOCATION` is declared but unused (Play requires justification and a prominent disclosure), and `SEND_SMS` is a restricted permission that needs a Play declaration.
- [ ] **A-22 Social feed relies on server RLS.** `getSocialFeed` selects from `social_feed_events` with no friends filter; privacy depends on RLS policies that are not in the repo. Verify on the server.
- [ ] **A-23 Meal analysis is French-only** (F-012). The system prompt asks for French titles and suggestions whatever the app language.

#### Low
- [ ] **A-24** AI weekly summary is cached per week (`app/progress.tsx:494`), so it goes stale as more workouts are logged; the week key comes from `toISOString()` (UTC).
- [ ] **A-25** AI summary/analysis caches are written to MMKV under new keys forever and never pruned.
- [ ] **A-26** `handleFullBackup` `useCallback` deps omit `sportsConfig` (`app/settings/data.tsx:340`).

### Stage 2: Feature planning
- [ ] [TODO: next features to be planned by the user; per-feature gaps are listed in each README and summarized in `features/INDEX.md`.]
