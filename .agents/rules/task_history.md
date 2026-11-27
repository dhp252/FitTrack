---
trigger: model_decision
description: High-level list of completed sessions and upcoming planned features
---

## Completed Sessions Summary
- 2026-11-24:
  - Agent docs scaffolding: Created `.agents/rules/` (dev, codebase_structure, system_spec, gotchas, issues, task_history, task_history_archive, general_prd, decisions, features) and `.agents/AGENTS.md` from the meta-rules-scaffolding and meta-feature-docs templates, filled from the code at commit `1e373b4` (v11.7.0), `package.json`, `app.json`, the READMEs, the CI workflow and `.github/copilot-instructions.md`. Backfilled 19 feature docs in `.agents/features/` (F-001 to F-019) by reading each feature's screens, stores and services; their "Why" sections are mostly `[TODO: not recorded]` because the repo has no design docs and the reasons can't be taken from code alone. No app code changed and nothing was run or tested.
- 2026-11-24:
  - AI screens and debug view (F-011, F-012): restored Settings → AI (upstream commit `01dfe68` had replaced it with a locked screen that forced every AI flag off), added an in-memory AI debug log behind `aiDebugEnabled` with redacted request/response/error per call, inline debug panels on every AI card, larger AI text and a full-screen reader. Run planner shows a notice when the built-in fallback plan is used. `bunx tsc --noEmit` fails on `ignoreDeprecations: "6.0"` with the pinned TypeScript 5.9; checked with a temporary config overriding it to `"5.0"`: no new errors versus `main` (the existing Supabase typing errors remain). Not run on a device.

---

## Planned / Next Steps

The following features are queued for implementation:
- [ ] Plan new features with the user (see gaps listed in `features/INDEX.md` and each feature README).
