---
id: F-013
title: "Barcode scanner (OpenFoodFacts)"
status: shipped
origin: backfill
files:
  - app/barcode-scanner.tsx
  - src/services/openfoodfacts/index.ts
depends_on: []
verified: "1e373b4 2026-11-24"
---

# F-013: Barcode scanner (OpenFoodFacts, Labs)

## What it does
When enabled in Labs, a shortcut on Today opens a camera barcode scanner (EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39). The scanned code is looked up on OpenFoodFacts and the product is shown with Nutri-Score, NOVA group, Eco-Score and nutrient levels.

## Code map
- `app/barcode-scanner.tsx`: Vision Camera `useCodeScanner` and product display.
- `src/services/openfoodfacts/index.ts`: `getProductByBarcode`, color and label helpers (`getNutriscoreColor`, `getNovaColor`, `getEcoScoreColor`, ...).
- Tests: none.

## How to run & test
- Run: Settings → Labs → enable OpenFoodFacts, then Today → barcode shortcut.
- Test: no automated tests.

## Limits
- Lookup only: the product is not saved as a meal entry and no nutrition is logged.
- Needs network.

## Gotchas
None known.

## Why
- [TODO: not recorded]

## Assumptions
None known.

## Risks
None known.

## Open issues & backlog
- [ ] "Add to meal" from a scanned product, with calories and macros (idea; needs F-001 meal fields)

## Log
- 2026-11-24: backfilled
