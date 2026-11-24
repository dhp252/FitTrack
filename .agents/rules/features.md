---
trigger: always_on
description: How to find and read feature docs in .agents/features/ before working on a feature's code.
---

# Feature Docs: Spix (FitTrack)

Each feature has a folder in `.agents/features/`. Its README holds everything about the feature: what it does, code map, how to run and test it, limits, gotchas, why it was built this way, assumptions, risks and open items.

- Before changing code, check `.agents/features/INDEX.md`. If the task names a feature, or a file you'll change matches a README's `files:` list (`grep -l "<path or folder>" .agents/features/*/README.md`), read that README first, then the files in its Code map.
- Before proposing a design or an alternative, read the feature's Why section. Don't re-propose a rejected option without saying what has changed.
- Open a feature's design docs only when you need the full reasoning behind a decision.
- `verified:` is the main-repo commit the README was last checked against. If `git log <hash>..HEAD -- <files>` lists commits, or the value ends in `+wip`, check those changes against the README before relying on it.
- Change feature docs through `meta-feature-docs` (usually at the end of a session, via `meta-persist-session-learnings`), not ad hoc.
