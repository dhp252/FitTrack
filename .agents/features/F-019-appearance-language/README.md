---
id: F-019
title: "Appearance & language"
status: shipped
origin: backfill
files:
  - app/settings/appearance.tsx
  - app/settings/language.tsx
  - app/settings/index.tsx
  - app/settings/_layout.tsx
  - src/constants/theme.ts
  - src/i18n/
  - src/components/ui/TabBar.tsx
depends_on: []
verified: "1e373b4 2026-11-24"
---

# F-019: Appearance & language

## What it does
Theme presets (default, ocean, sunset, forest, midnight) and a fully custom palette, a solid or glass navbar (`fullOpacityNavbar`), and hiding the Workout, Ploppy (gamification) and Tools tabs. The language screen switches between English, French, German and Italian; on first launch the device language is detected and saved.

## Code map
- `app/settings/appearance.tsx`: presets, custom colors, navbar, hidden tabs.
- `src/constants/theme.ts`: `Colors`, `ScreenPalettes`, `Spacing`, `FontSize`, `THEME_PRESET_COLORS`, `DEFAULT_THEME_CUSTOM_COLORS`.
- `app/settings/language.tsx`, `src/i18n/index.ts` (detection, persistence via storage key `language`), `src/i18n/locales/{en,fr,de,it}.json`.
- `app/settings/index.tsx` and `_layout.tsx`: settings hub.
- Tests: none.

## How to run & test
- Run: Settings → Appearance / Language.
- Test: no automated tests.

## Limits
- The app is dark-only (`userInterfaceStyle: dark`); no light theme.
- Screens with their own color tokens (rep counter, progress, run tracker) don't follow the preset (see `rules/gotchas.md`).
- Some strings are still hardcoded in French (default sport names in F-002, generator exercises in F-014, AI prompts in F-011).

## Gotchas
### Four locale files must stay in sync
- **Problem**: Each locale file has the same ~2,470 lines; a key missing in one language shows the raw key.
- **Rule**: Add every new key to all four files.

## Why
- [TODO: not recorded]

## Assumptions
None known.

## Risks
None known.

## Open issues & backlog
- [ ] Light theme (idea)
- [ ] Script to check locale files have the same keys (idea)

## Log
- 2026-11-24: backfilled
