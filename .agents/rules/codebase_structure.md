---
trigger: always_on
description: Project directory layout, module boundaries, and configuration rules.
---

# Codebase Structure & Architecture: Spix (FitTrack)

This document specifies the directory hierarchy, module boundaries, and configuration rules for the Spix app (repo `dhp252/FitTrack`, npm name `spix-app`).

---

## 1. Directory Layout & Roles

### Screens (Expo Router, file-based routes)
*   `app/` — One file per route. `_layout.tsx` holds the root stack and the custom bottom tab bar (`TAB_CONFIG`: Today, Workout, Ploppy, Social, Progress, Tools, Settings).
    *   `index.tsx` — Today dashboard.
    *   `workout/` — History list (`index.tsx`) and entry detail (`[id].tsx`).
    *   `run/` — Run tracking: `simple/` (plain GPS run) and `ai/` (AI-planned run).
    *   `repCounter/` — Rep counter screen (orchestrator only; logic lives in `src/repCounter/`).
    *   `settings/` — Settings hub and sub-screens (ai, appearance, data, developer, labs, language, legal, notifications, personal, pose-debug, preferences, safety, social, sports).
    *   `gamification.tsx`, `progress.tsx`, `social.tsx`, `tools.tsx`, `health-connect.tsx`, `enhanced-meal.tsx`, `barcode-scanner.tsx`, `onboarding.tsx`, `auth.tsx`, `profile.tsx`, `pollination-callback.tsx`, `privacy-policy.tsx`, `terms-of-service.tsx`.
    *   Files starting with `_` (e.g. `_progressWidgets.tsx`, `_health-connect.styles.ts`) are screen-local helpers, not routes.

### Source
*   `src/` — Core code (path alias `@/*` → `src/*`, see `tsconfig.json`):
    *   `types/` — Shared domain types (`Entry` union, `UserSettings`, `SportConfig`, badges).
    *   `stores/` — Zustand stores: `appStore` (entries, settings, sports, badges; persisted), `gamificationStore` (XP, levels, quests; persisted), `socialStore` (auth, friends, leaderboards; persisted), `runStore` and `safetyStore` (live run session; in memory), `editorStore` (entry being edited), `selectors.ts` (memoized hooks).
    *   `storage/` — MMKV storage adapter with AsyncStorage fallback, used by persisted stores.
    *   `services/` — Side-effecting integrations: `healthConnect/`, `notifications/`, `supabase/` (social backend), `pollination/` (AI), `openfoodfacts/`, `imageUpload/`, `network/httpClient.ts`, `runTracker.ts` (GPS), `fallDetection.ts`, `safetyAlert.ts` (SMS/WhatsApp), `sessionRecovery.ts`, `gpxExport.ts`, `maplibre.ts`, `audio/`.
    *   `repCounter/` — Rep counter feature module: `hooks/useRepCounter.ts`, screen components, constants and types.
    *   `components/` — `ui/` (generic), `forms/` (entry forms), `sheets/` (bottom sheets), `run/` (run tracker UI), `social/` (social hub), `rep-counter/` (older copy, see `issues.md`).
    *   `utils/` — Pure helpers: dates, badges, export/backup, validation (zod), archive, pose detection, workout generator, social challenges, geo.
    *   `constants/` — `theme.ts` (colors, spacing, theme presets), `values.ts` (limits, XP rules, storage keys), `safety.ts`, `enhancedMeal.ts`.
    *   `config/buildConfig.ts` — Standard vs FOSS build flavor detection.
    *   `i18n/` — i18next setup and locales (en, fr, de, it).

### Native, Build & Release
*   `plugins/` — Expo config plugins: `withMediaPipeModel.js` (copies the pose model into Android assets), `withSpixSmsManager.js` (native SMS sender for safety alerts).
*   `scripts/` — `ci-build.js` (CI release build for both flavors), `fdroid-prebuild.sh` (F-Droid reproducible FOSS build), `patch-health-connect.js`, `android-patches/` (MainActivity patch, permissions rationale activity, `pose_landmarker_lite.task` model).
*   `fastlane/metadata/` — Store listing text and screenshots.
*   `.github/workflows/android-release.yml` — Manual release workflow (standard / foss / both) that builds signed APKs and creates a GitHub release.
*   `assets/` — Icons, splash, sounds (`rep.mp3`, `finished.mp3`, `keepgoing.mp3`, ...).

### Agent docs
*   `.agents/rules/` — These rules files. `.agents/features/` — One folder per feature (see `rules/features.md`).
*   `.github/copilot-instructions.md` — Older agent instructions. Partly outdated (see `gotchas.md`); `.agents/` wins where they differ.

---

## 2. Module Boundaries

*   **Screens stay thin where a module exists**: the rep counter screen only wires `useRepCounter` to components; run logic lives in `src/services/runTracker.ts` and `src/stores/runStore.ts`.
*   **Services don't import screens.** Stores may call services; services may read stores via `getState()` only where already established (e.g. social sync).
*   **Optional integrations are lazy-loaded** (Health Connect, MapLibre, expo-notifications) so iOS and FOSS builds don't crash on missing native modules. Keep that pattern for new native dependencies.
*   **Shared helpers**: don't duplicate date, XP, or entry-type logic in screens. Put it in `src/utils/` or `src/constants/values.ts`.

---

## 3. Configuration & Extension Rules

*   **User settings** live in `UserSettings` (`src/types/index.ts`) with defaults in `defaultSettings` (`src/stores/appStore.ts`). New settings get a typed field there; don't read untyped fields through casts (the `runSettings` cast in run screens is a known exception, see F-008).
*   **App constants** (limits, XP, storage keys) go in `src/constants/values.ts`, grouped by feature section.
*   **Environment variables**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (social, optional), `EXPO_PUBLIC_BUILD_FLAVOR` (`standard` | `foss`).
*   **Adding an entry type**: type in `src/types/index.ts` → `add*` action in `appStore` → XP rule in `calculateXpForEntry` (`gamificationStore.ts`) → zod schema in `src/utils/validation.ts` → form in `src/components/forms/` → picker in `AddEntryBottomSheet`.
