---
id: F-006
title: "Gamification (XP, quests, streaks, badges)"
status: shipped
origin: backfill
files:
  - src/stores/gamificationStore.ts
  - src/utils/badges.ts
  - app/gamification.tsx
  - src/constants/values.ts
  - src/utils/date.ts
depends_on: [F-001]
verified: "1e373b4 2026-11-24"
---

# F-006: Gamification (XP, quests, streaks, badges)

## What it does
Turns sport entries into motivation. Each sport entry earns XP (home 50, +10 over 30 min, +15 over 100 reps; run 30 + 5/km, +10 over 45 min; Beat Saber 15 + 1 per 5 min; custom 25, +10 over 30 min, +3/km; meals and measures 0). XP for level N→N+1 is N×100, and the level maps to a rank (novice … master). Each week generates three quests (exercises, workouts, duration) plus a distance quest every other week, chosen from fixed pools by week number; completing one awards its reward XP. Deleting or editing an entry removes or adjusts its XP. A streak counts consecutive active days, and nine badges unlock from workout counts, streaks and run distance. The Ploppy tab shows level, XP ring, quests and the XP history.

## Code map
- `src/stores/gamificationStore.ts`: persisted store. Key symbols: `calculateXpForEntry`, `processEntryAdded` / `processEntryDeleted` / `processEntryUpdated`, `syncQuestsWithEntries`, `generateWeeklyQuests`, `checkAndRefreshQuests`, `recalculateFromEntries`, `getRank`.
- `src/constants/values.ts`: `XP_PER_WORKOUT`, `XP_MULTIPLIER_PER_LEVEL`, `MAX_GAMIFICATION_HISTORY_ENTRIES` (50).
- `src/utils/badges.ts`: `BADGE_DEFINITIONS`, `checkBadges`; unlocked IDs stored in `appStore.unlockedBadges` (`recheckBadges`).
- `src/utils/date.ts`: `calculateStreak`.
- `app/gamification.tsx`: Ploppy tab (`XPRing`, `QuestCard`, `StatCard`).
- Tests: none.

## How to run & test
- Run: log a workout, then open the Ploppy tab.
- Test: no automated tests. `recalculateGamification` in `appStore` rebuilds XP from all entries.

## Limits
- Quests are not personalized to the user's level or goal; the pools are fixed.
- XP history keeps only the last 50 events.

## Gotchas
### Run summary XP differs from awarded XP
- **Problem**: The run summary (F-008) shows `calculateRunXP` (distance×10 + minutes×0.5) and stores it as `xpGained`, but the XP actually added is `calculateXpForEntry` (30 + 5/km + bonus).
- **Rule**: Use `calculateXpForEntry` anywhere XP is shown; fixing this is in the backlog.
### Quest text is translated at generation time
- **Problem**: Quest descriptions are stored translated; `translateQuestDescription` re-translates by key when the language changes.
- **Rule**: Keep quest i18n keys in the form `gamification.quests.<type>.<target>`.

## Why
- [TODO: not recorded] (the file header says the store was "completely redone for reliability", but not what it replaced or why)

## Assumptions
- See A-1 in `system_spec.md`.

## Risks
None known.

## Open issues & backlog
- [ ] Make run summary XP match awarded XP (issue)
- [ ] `.github/copilot-instructions.md` still documents a removed `questCalculator.ts` (issue; see `rules/gotchas.md`)
- [ ] More badges (e.g. for custom sports, rep counter, meals) (idea)

## Log
- 2026-11-24: backfilled
