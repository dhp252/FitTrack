---
trigger: always_on
---

# Developer Rules: Spix (FitTrack)

This document contains instructions for coding standards, workflows, testing, and git commands. Do not edit unless instructed by the human developer.

---

## 1. Coding & Design Patterns

- Prefer composition over inheritance.
- Follow SOLID, DRY, KISS, YAGNI, and SLAP principles.
- Avoid dynamic/silent fallbacks for required values (e.g. `obj.key ?? default` or `|| 0` on a field that must exist). Read required values directly so the program fails loudly if one is missing. Optional entry fields declared with `?` in `src/types/index.ts` are the exception.
- Avoid silent error catching (`catch {}` or a catch that only logs and continues). Propagate errors so issues are resolved immediately, unless the code path is an optional network/AI feature that must not break the offline app (see `gotchas.md`).
- Avoid hardcoding default fallback values for core parameters; declare them in `src/constants/values.ts` (numbers, limits, XP rules), `src/constants/safety.ts`, or `defaultSettings` in `src/stores/appStore.ts`.
- Reuse existing helper modules instead of re-implementing them inline: `src/utils/date.ts` (dates, weeks, streaks), `src/constants/values.ts` (`isSportEntryType`, `SPORT_ENTRY_TYPES`), `src/utils/logger.ts` (loggers), `src/services/network/httpClient.ts` (`fetchWithRetry`), `src/stores/selectors.ts` (memoized store hooks).
- **Styling**: colors, spacing, font sizes and radii come from `src/constants/theme.ts` (`Colors`, `Spacing`, `FontSize`, `BorderRadius`). Use `StyleSheet.create()`, not inline style objects. Card surfaces use `<GlassCard>` from `src/components/ui`.
- **Icons**: `lucide-react-native`.
- **Text**: every user-facing string goes through i18next (`t('...')`). Add each new key to all four locale files: `src/i18n/locales/{en,fr,de,it}.json`.
- **Entry changes that affect gamification** go through the `appStore` actions (`add*`, `updateEntry`, `deleteEntry`), which already sync XP, quests, badges and social stats. Do not write to `entries` directly.
- **Flavor-specific code** checks `BuildConfig` / `getEffectiveBuildFlavor()` from `src/config/buildConfig.ts`, never the package name.
- New UI components go in `src/components/ui/` (generic) or a feature folder under `src/components/`, exported from that folder's `index.ts`, with a TypeScript props interface above the component.

---

## 2. Git & `.agents/` Management

- The `.agents/` folder is a plain folder tracked by the main repository (it is not a submodule and not in `.gitignore`). Commit rules and feature docs with ordinary `git add .agents/...`.
- `.gitignore` excludes `/docs`, `/supabase`, `/releases`, `scripts/release.js`, `scripts/newrelease.js` and `TODO.md`: those exist only on the maintainer's machine. Don't reference them as if they were in the repo.
- Release commits use `chore(release): bump to X.Y.Z` and bump `package.json` version, `app.json` `expo.version`, `ios.buildNumber` and `android.versionCode` together.

---

## 3. Testing Standards

- Do not run tests before making changes to the codebase.
- [TODO: the repo has no test framework, test folder or test script yet. Choose one (e.g. Jest with `jest-expo`) before this rule can be enforced.]
- Once a test setup exists: any new module or utility gets unit tests next to it or in the chosen tests folder, and pure logic (`src/utils/`, `src/services/runTracker.ts`, XP rules in `gamificationStore.ts`) uses parametrized tests (`test.each`) with 5 or more cases for edge-case coverage.
- Until then, at least run the TypeScript check before pushing: `bunx tsc --noEmit`.
