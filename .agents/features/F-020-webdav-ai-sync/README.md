---
id: F-020
title: "WebDAV sync of AI-readable stats"
status: building
origin: new
files:
  - app/settings/webdav.tsx
  - src/services/webdav/index.ts
  - src/utils/aiStatsExport.ts
  - app/_layout.tsx
  - app/settings/data.tsx
depends_on: [F-001, F-006, F-017]
verified: "1b1b0e2 2026-11-24+wip"
---

# F-020: WebDAV sync of AI-readable stats

## What it does
Settings → Data → WebDAV sync uploads the user's detailed stats to their own WebDAV server (Nextcloud, ownCloud, Synology, rclone serve, etc.) so an external AI assistant can read them and give training advice. Each sync overwrites, in the chosen remote folder:
- `spix-ai-stats.json`: profile and goal, streak, level, all-time totals, the last 12 weekly summaries, every body measurement, and every workout, meal and measurement of the last 90 days with all their fields (GPS route points and raw rep timelines are summarised, not copied).
- `spix-ai-summary.md`: the same data as a Markdown report with a short instruction block for the AI.
- `spix-backup.json` (optional toggle): the full backup from F-017, restorable from Settings → Data.

Sync runs from "Sync now", and automatically when the app opens or returns to the foreground if auto sync is on (at most every 6 hours). The screen shows the last result and the technical error detail (HTTP method, URL, status) for debugging.

## Code map
- `app/settings/webdav.tsx`: form (URL, username, password, folder), Test / Save / Sync now, toggles (enabled, auto sync, personal info, full backup), last-sync status and error detail.
- `src/services/webdav/index.ts`: password in SecureStore (`webdav_password`), Basic-auth client over `fetchWithRetry` (PROPFIND test, MKCOL per folder level, PUT), `syncToWebDav` (single in-flight run, records outcome in `settings.webdav`), `maybeAutoSyncWebDav`, `WebDavError` codes (config, auth, not_found, http, network, unavailable).
- `src/utils/aiStatsExport.ts`: pure `buildAiStatsExport` and `buildAiSummaryMarkdown`.
- `src/types/index.ts`: `WebDavSettings` in `UserSettings.webdav`.
- `src/constants/values.ts`: `WEBDAV_*` and `AI_EXPORT_*` constants (file names, folder, interval, timeout, week and day windows).
- `app/_layout.tsx`: auto sync on mount and on `AppState` "active".
- Tests: none in repo (no test framework yet, see dev.md).

## How to run & test
- Run: Settings → Data → WebDAV sync. For Nextcloud the URL is `https://<host>/remote.php/dav/files/<user>`.
- Local server for testing: `pip install wsgidav cheroot`, then run `wsgidav` with a config that maps `/dav` to a folder and enables basic auth (`simple_dc.user_mapping`).
- Test: no automated tests. Checked on 2026-11-24 with Bun scripts that mock the stores and SecureStore against a local WsgiDAV server: connection test (ok, wrong password, unreachable host, bad URL), sync into a nested folder with a space, re-sync over existing files, failed sync recorded in settings, UTF-8 password.

## Limits
- One-way push only; nothing is read back from the server.
- Basic auth only (no Digest, OAuth or client certificates). Plain `http://` URLs send the password unencrypted; Android also blocks cleartext HTTP by default in release builds.
- Not available in the FOSS flavor, which has no INTERNET permission (D-2).
- Auto sync only runs while the app is open; no background task.
- A failed auto sync also waits 6 hours before the next automatic try ("Sync now" works any time).

## Gotchas
### Password never goes into settings
- **Problem**: `settings` is persisted in MMKV and copied into backups.
- **Rule**: Keep the password in SecureStore only; `settings.webdav` holds URL, username, folder, toggles and last-sync status.

### Export reads the stores directly
- **Problem**: The F-017 restore path drops some entry fields and settings (see issues A-01/A-02).
- **Rule**: Build AI files from `useAppStore.getState()` entries, not from a restored or validated backup.

## Why
### D-8: One-way WebDAV push of AI-readable files (2026-11-24)
- **Context**: The user wants their own AI assistant to read detailed stats and give advice; in-app AI (F-011) is locked.
- **Chose**: Upload plain JSON + Markdown to a user-owned WebDAV server, app as the only source of truth.
- **Rejected**: Two-way sync (needs conflict handling and merging into the single store, not asked for); sending data to a hosted AI from the app (conflicts with D-1); only reusing the full backup JSON (internal format, not meant for an AI to read).
- **Consequences**: Data leaves the device only to a server the user configured, opt-in. Fits D-1.

## Assumptions
- WebDAV servers answer MKCOL on an existing folder with 405 (or 301), which is treated as success.

## Risks
- Health data on a server the user controls but the app can't secure; personal info is off by default.

## Open issues & backlog
- [ ] Unit tests for `aiStatsExport.ts` once a test framework exists (issue)
- [ ] Background sync with expo-background-task (idea)
- [ ] Shorter retry after a failed auto sync (idea)
- [ ] Keep dated history files on the server for long-term trends (idea)

## Log
- 2026-11-24: built (branch `claude/project-thread-1lvn9r`)
