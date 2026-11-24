---
id: F-012
title: "AI meal analysis"
status: shipped
origin: backfill
files:
  - app/enhanced-meal.tsx
  - app/_enhanced-meal.styles.ts
  - src/constants/enhancedMeal.ts
  - src/services/imageUpload/index.ts
  - src/services/pollination/index.ts
depends_on: [F-001, F-011]
verified: "1e373b4 2026-11-24"
---

# F-012: AI meal analysis (Labs)

## What it does
An alternative meal page enabled from Labs. The user takes or picks a photo of a meal; the image is uploaded to tmpfiles.org (deleted within an hour) and its URL sent to Pollinations, which returns a score from 0 to 100 and suggestions. The meal is saved as a `meal` entry with `score` and `suggestions`.

## Code map
- `app/enhanced-meal.tsx`: page (camera / library picker, analysis, `addMeal`); styles in `app/_enhanced-meal.styles.ts`.
- `src/services/imageUpload/index.ts`: `uploadImageToTmpFiles`, `uploadBase64Image`.
- `src/services/pollination/index.ts`: `analyzeMealImage` (cached by image URL).
- `src/constants/enhancedMeal.ts`: score colors and gradients.
- Tests: none.

## How to run & test
- Run: Settings → Labs → enable the enhanced meal page; Settings → AI → enable AI and "AI meal photo score" (needs F-011 connected).
- Test: no automated tests.

## Limits
- No calorie or macro estimate is stored (only score and suggestions).
- Without AI connected, the page links back to Labs.

## Gotchas
### Photos go to a public temporary host
- **Problem**: Meal photos are uploaded to tmpfiles.org, a public third-party host, before analysis. That conflicts with the app's privacy promise unless the user is told clearly.
- **Rule**: Keep this behind explicit opt-in; prefer sending the image inline (base64) to the AI provider if Pollinations supports it.

## Why
### D-7: Temporary public upload for meal images
- **Chose**: Upload to tmpfiles.org, where files are deleted after at most one hour, and pass the URL to the model.
- **Rejected**: [TODO: not recorded]
- **Source**: header comment of `src/services/imageUpload/index.ts`.

## Assumptions
- tmpfiles.org keeps deleting files within an hour (unverified).

## Risks
- Third-party host availability and privacy (see Gotchas).

## Open issues & backlog
- [ ] Estimate calories / macros from the photo and store them (idea)
- [ ] Avoid the public upload step (issue)

## Log
- 2026-11-24: backfilled
- 2026-11-24: larger description/suggestions text and a full-screen reader; upload and parse failures recorded in the AI debug log (F-011); the error alert includes the real error when debug mode is on. Enable it from Settings → AI → "AI meal photo score".
