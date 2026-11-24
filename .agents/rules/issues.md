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
- [ ] **Lint and type check in CI**: No ESLint/Prettier config and no CI job that runs `tsc --noEmit` on pull requests; the only workflow is the manual release.
- [ ] **Remove dead code**: `.bak` files are committed (`app/newonboarding.tsx.bak`, `app/progress.tsx.bak`, `assets/*.png.bak`), and `src/components/rep-counter/` duplicates `src/repCounter/components/` but nothing imports it.
- [ ] **Refresh `.github/copilot-instructions.md`** or point it at `.agents/` (see `gotchas.md`, "Outdated agent instructions").

### Stage 2: Feature planning
- [ ] [TODO: next features to be planned by the user; per-feature gaps are listed in each README and summarized in `features/INDEX.md`.]
