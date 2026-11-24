---
trigger: model_decision
description: High-level list of completed sessions and upcoming planned features
---

## Completed Sessions Summary
- 2026-11-24:
  - Agent docs scaffolding: Created `.agents/rules/` (dev, codebase_structure, system_spec, gotchas, issues, task_history, task_history_archive, general_prd, decisions, features) and `.agents/AGENTS.md` from the meta-rules-scaffolding and meta-feature-docs templates, filled from the code at commit `1e373b4` (v11.7.0), `package.json`, `app.json`, the READMEs, the CI workflow and `.github/copilot-instructions.md`. Backfilled 19 feature docs in `.agents/features/` (F-001 to F-019) by reading each feature's screens, stores and services; their "Why" sections are mostly `[TODO: not recorded]` because the repo has no design docs and the reasons can't be taken from code alone. No app code changed and nothing was run or tested.

---

## Planned / Next Steps

The following features are queued for implementation:
- [ ] Plan new features with the user (see gaps listed in `features/INDEX.md` and each feature README).
