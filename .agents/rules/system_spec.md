---
trigger: always_on
description: Core technical stack, local development/deployment environments, and key system design notes.
---

# System Specification: Spix (FitTrack)

This document defines the core programming stack, local/production environment settings, and structural design notes for the Spix app.

---

## 1. Stacks & Technology

*   **Programming Language**: TypeScript ~5.9 (`strict: true`), React 19.2
*   **App Framework**: React Native 0.83.2 + Expo SDK 55 (`expo` ^55.0.15), Expo Router ~55 (file-based routing, typed routes), Hermes
*   **State & Storage**: Zustand 5 with `persist` middleware over `react-native-mmkv` 4 (AsyncStorage fallback)
*   **UI**: `react-native-reanimated` 4, `react-native-gesture-handler`, `@lodev09/react-native-true-sheet` (bottom sheets), `expo-blur` / `expo-linear-gradient` (glassmorphism), `lucide-react-native`, `react-native-gifted-charts`, `react-native-svg`, `@legendapp/list`, Syne font
*   **Device features**: `react-native-vision-camera` + `react-native-mediapipe-posedetection` (pose / barcode), `expo-sensors` (accelerometer), `expo-location` (GPS, background), `@maplibre/maplibre-react-native` (maps), `react-native-health-connect` (Android), `expo-notifications`, `expo-audio`, `expo-haptics`, native SMS module (config plugin)
*   **Backend (optional)**: Supabase (`@supabase/supabase-js` 2) for auth and social; one Edge Function used by the app (`delete-account`)
*   **External APIs**: Pollinations (LLM text and image analysis, user-connected API key), OpenFoodFacts (barcode lookup), tmpfiles.org (temporary image hosting for meal analysis)
*   **Validation**: zod 4 (backup and entry schemas)
*   **i18n**: i18next + react-i18next, locales en / fr / de / it, device locale detection via `expo-localization`
*   **Testing Suite**: [TODO: none set up]
*   **Linter & Formatter**: [TODO: none configured in the repo]

---

## 2. Development & Deployment Environments

### Local Development Environment
*   **Operating System**: [TODO: maintainer's OS]
*   **IDE**: [TODO: not recorded]
*   **Package / Dependency Manager**: Bun (`bun.lock`; use `bunx`, not `npx`)
*   **Run**: `bunx expo start` (dev server), `bunx expo run:android` / `bunx expo run:ios` (dev builds). Native folders `/android` and `/ios` are generated (git-ignored).
*   **Secrets needed for full builds**: `google-services.json` (standard flavor), `.env` with Supabase keys for social (both git-ignored).

### Deployment / Execution Environment
*   **Target Runtime**: Android (primary: minSdk 26, compile/target SDK 36); iOS config exists (`com.spix.app`) [TODO: confirm whether iOS is shipped]; web target is configured but [TODO: confirm whether supported].
*   **Build flavors**: `standard` (`com.spix.app`, Google Play / GitHub, FCM push) and `foss` (`com.spix.app.foss`, F-Droid, no Google services or push). See D-2 in `decisions.md`.
*   **Deployment Packaging**: signed APKs built by `.github/workflows/android-release.yml` (manual dispatch, runs `scripts/ci-build.js`) and published as a GitHub release; F-Droid builds from source using `scripts/fdroid-prebuild.sh`.
*   **Store metadata**: `fastlane/metadata/android/`.

---

## 3. Design Notes

*   **Offline / local-first**: all user data (entries, settings, gamification) is stored on device; network features are opt-in (see D-1).
*   **Single entry log**: every logged activity is an `Entry` in `appStore.entries` (union of `home`, `run`, `beatsaber`, `meal`, `measure`, `custom`), keyed by `date` (YYYY-MM-DD) and `createdAt` (ISO). Stats, streaks, quests, badges and social stats are all derived from this list.
*   **Assumptions**:
    *   A-1: Weeks start on Monday (`date-fns` `weekStartsOn: 1`) for weekly goals, quests and leaderboards. (confirmed in code)
