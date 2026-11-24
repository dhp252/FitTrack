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
  - src/services/network/httpClient.ts
  - src/components/ui/PloppyOnboardingModal.tsx
  - src/components/sheets/PloppySettingsSheet.tsx
depends_on: []
verified: "1e373b4 2026-11-24"
---

# F-011: AI assistant (Ploppy / Pollinations)

## What it does
"Ploppy" is the app's AI persona. The user connects their own Pollinations account through an OAuth-style redirect (`spix://pollination-callback`), and the API key is kept in the device's secure store. Settings → AI has a master switch (`aiFeaturesEnabled`, off by default), per-feature switches (weekly progress summary, workout analysis, meal analysis via `ploppyEnabled`), a model picker (Pollinations models, default `openai`), a tone (technical / neutral / warm) and an opt-in to share personal info. Other features call the shared text-analysis service: F-004 (workout analysis), F-005 (weekly summary), F-008 (run plan and debrief), F-012 (meal photo).

## Code map
- `src/services/pollination/index.ts`: `startPollinationAuth`, `extractApiKeyFromUrl`, `save/get/removePollinationApiKey` (expo-secure-store), `getPollinationAccountInfo` (balance), `analyzeMealImage`.
- `src/services/pollination/textAnalysis.ts`: `POLLINATION_MODELS`, `generateTextAnalysis({ systemPrompt, userPrompt, model })`.
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
### "Share personal info" is not enforced everywhere
- **Problem**: The AI run plan (`app/run/ai/index.tsx`) sends the user's body weight in its prompt without checking `settings.sharePersonalWithAI`.
- **Rule**: Every prompt that includes personal settings (weight, height, age, gender) must check `sharePersonalWithAI` first.

## Why
- Opt-in network feature: see D-1 in `rules/decisions.md`.
- Pollinations as the provider, and a user-owned key: [TODO: not recorded]

## Assumptions
None known.

## Risks
- Workout and meal data leave the device when AI is on; the user is told in the Ploppy onboarding modal [TODO: check the wording covers this].

## Open issues & backlog
- [ ] Check `sharePersonalWithAI` before sending personal data in every prompt (issue)
- [ ] Move prompts into one module with i18n-aware templates (idea)
- [ ] A conversational "ask Ploppy" chat over the user's history (idea)

## Log
- 2026-11-24: backfilled
