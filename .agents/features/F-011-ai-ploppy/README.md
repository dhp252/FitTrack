---
id: F-011
title: "AI assistant (Ploppy / Pollinations)"
status: shipped
origin: backfill
files:
  - app/settings/ai.tsx
  - app/settings/labs.tsx
  - app/settings/personal.tsx
  - app/pollination-callback.tsx
  - src/services/pollination/index.ts
  - src/services/pollination/textAnalysis.ts
  - src/services/pollination/aiDebugLog.ts
  - src/components/ai/AiTextReader.tsx
  - src/components/ai/AiDebugModal.tsx
  - src/components/ai/AiDebugPanel.tsx
  - src/services/network/httpClient.ts
  - src/components/ui/PloppyOnboardingModal.tsx
  - src/components/sheets/PloppySettingsSheet.tsx
depends_on: []
verified: "claude/project-thread-a3ssle 2026-11-24"
---

# F-011: AI assistant (Ploppy / Pollinations)

## What it does
"Ploppy" is the app's AI persona. The user connects their own Pollinations account through an OAuth-style redirect (`spix://pollination-callback`), and the API key is kept in the device's secure store. Settings → AI has a master switch (`aiFeaturesEnabled`, off by default), the Pollinations connect/disconnect button, per-feature switches (weekly progress summary, workout analysis, meal photo score via `ploppyEnabled`), a model picker (Pollinations models, default `openai`), a tone (technical / neutral / warm) and an **AI debug mode** (`aiDebugEnabled`). The opt-in to share personal info lives in `app/settings/personal.tsx`.

Every AI answer card (workout analysis, weekly summary, run debrief, run plan, meal score) shows its text in large print and has a **Full screen** button (or tap the text) that opens `AiTextReader`, a full-screen, selectable, copyable view.

With debug mode on, every Pollinations call is recorded in an in-memory log (`aiDebugLog.ts`, newest 30 calls, cleared on restart): feature, model, endpoint, HTTP status, duration, cache hit, exact request body, raw response, error, and notes on what the app did with the answer (e.g. "invalid JSON, built-in plan shown"). API keys are redacted before storage. Each AI card then shows an `AiDebugPanel` (last call status + error, tap for details); Settings → AI → "Open AI debug log" shows all calls. HTTP 401/403/402/429/5xx get a plain-language hint (expired key, out of pollen, rate limit, server down). Other features call the shared text-analysis service: F-004 (workout analysis), F-005 (weekly summary), F-008 (run plan and debrief), F-012 (meal photo).

## Code map
- `src/services/pollination/index.ts`: `startPollinationAuth`, `extractApiKeyFromUrl`, `save/get/removePollinationApiKey` (expo-secure-store), `getPollinationAccountInfo` (balance), `analyzeMealImage`.
- `src/services/pollination/textAnalysis.ts`: `POLLINATION_MODELS`, `generateTextAnalysis({ feature, systemPrompt, userPrompt, model })`; `feature` is an `AiFeatureId` used by the debug log.
- `src/services/pollination/aiDebugLog.ts`: `useAiDebugStore`, `beginAiDebugCall` / `completeAiDebugCall` (no-ops unless `settings.aiDebugEnabled`), `noteAiDebug(feature, note)`, `logAiDebugFailure`, `redactSecrets`, `hintForHttpStatus`, `formatAiDebugEntry` (copy text).
- `src/components/ai/`: `AiTextReader` + `AiExpandButton` (full-screen large-print reader), `AiDebugModal` (log viewer, optionally filtered by feature), `AiDebugPanel` (inline status, renders nothing when debug is off).
- `src/services/network/httpClient.ts`: `fetchWithRetry`, in-memory cache.
- `app/pollination-callback.tsx`: deep-link landing that stores the key.
- `app/settings/ai.tsx`, `app/settings/labs.tsx`, `app/settings/personal.tsx` (`sharePersonalWithAI`, height, weight, age, gender).
- `src/components/ui/PloppyOnboardingModal.tsx`, `src/components/sheets/PloppySettingsSheet.tsx`.
- Tests: none.

## How to run & test
- Run: Settings → AI → connect Pollinations, then turn on the master switch.
- Test: no automated tests. Needs a Pollinations account with balance.

## Limits
- Requires network and a Pollinations account; no on-device model.
- Prompts are partly hardcoded in French (e.g. the run plan prompt in `app/run/ai/index.tsx`), with the reply language passed separately.

## Gotchas
### Every AI call needs a feature id
- **Problem**: The debug log groups calls by `AiFeatureId`. A new caller without its own id would be mixed into another feature's panel.
- **Rule**: Add a new id to `AiFeatureId` and its label under `ai.debug.features` in all four locales.

### Never log the key
- **Problem**: The Pollinations key is a bearer token. Debug output can be copied into bug reports.
- **Rule**: Pass the key in `secrets` to `beginAiDebugCall` / `completeAiDebugCall`; never put request headers in the log.

### "Share personal info" is not enforced everywhere
- **Problem**: The AI run plan (`app/run/ai/index.tsx`) sends the user's body weight in its prompt without checking `settings.sharePersonalWithAI`.
- **Rule**: Every prompt that includes personal settings (weight, height, age, gender) must check `sharePersonalWithAI` first.

## Why
### D-8: Debug log in memory only, behind a setting
- **Chose**: Record AI calls only when Settings → AI → debug mode is on, keep the last 30 in a zustand store that is never persisted, redact keys.
- **Rejected**: Always-on persisted log (prompts include workout data and could leak through backups); dev-only `console.warn` (invisible in release builds, which is where the user hits the failures).
- **Source**: 2026-11-24 thread "Enlarge AI screens and add debug view".

- Opt-in network feature: see D-1 in `rules/decisions.md`.
- Pollinations as the provider, and a user-owned key: [TODO: not recorded]

## Assumptions
None known.

## Risks
- Workout and meal data leave the device when AI is on; the user is told in the Ploppy onboarding modal [TODO: check the wording covers this].

## Open issues & backlog
- [ ] A meal-photo parse fallback (score 50) is cached for 2 minutes like a real answer, so retrying the same photo returns it again (issue)
- [ ] `fetchWithRetry` retries AI POSTs after a timeout, which can bill a request twice (issue)
- [ ] Show the Pollinations balance and key expiry on Settings → AI (`getPollinationAccountInfo` exists, only the developer screen uses it) (idea)
- [ ] Check `sharePersonalWithAI` before sending personal data in every prompt (issue)
- [ ] Move prompts into one module with i18n-aware templates (idea)
- [ ] A conversational "ask Ploppy" chat over the user's history (idea)

## Log
- 2026-11-24: backfilled
- 2026-11-24: Settings → AI restored from the upstream "AI disabled" lock (it forced every AI switch off on open), with master switch and meal toggle; AI debug mode and log added; AI answers made larger with a full-screen reader; run planner now says when it shows the built-in fallback plan and no longer ignores a tap on Send when Pollinations is not connected.
