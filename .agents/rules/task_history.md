---
trigger: model_decision
description: High-level list of completed sessions and upcoming planned features
---

## Completed Sessions Summary
- 2026-11-24:
  - Agent docs scaffolding: Created `.agents/rules/` (dev, codebase_structure, system_spec, gotchas, issues, task_history, task_history_archive, general_prd, decisions, features) and `.agents/AGENTS.md` from the meta-rules-scaffolding and meta-feature-docs templates, filled from the code at commit `1e373b4` (v11.7.0), `package.json`, `app.json`, the READMEs, the CI workflow and `.github/copilot-instructions.md`. Backfilled 19 feature docs in `.agents/features/` (F-001 to F-019) by reading each feature's screens, stores and services; their "Why" sections are mostly `[TODO: not recorded]` because the repo has no design docs and the reasons can't be taken from code alone. No app code changed and nothing was run or tested.
  - WebDAV sync for AI advice (F-020): new Settings → Data → WebDAV sync screen that uploads `spix-ai-stats.json`, `spix-ai-summary.md` and optionally `spix-backup.json` to the user's WebDAV server, manually or on app open (every 6 h at most). Password in SecureStore. Tested against a local WsgiDAV server with Bun scripts; `tsc` shows no new errors (48 pre-existing ones, and `tsconfig.json` `ignoreDeprecations: "6.0"` fails on TypeScript 5.9).

---

## Planned / Next Steps

The following features are queued for implementation:
- [ ] Plan new features with the user (see gaps listed in `features/INDEX.md` and each feature README).
