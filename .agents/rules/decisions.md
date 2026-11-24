---
trigger: model_decision
description: Decisions that span several features, with the options considered and why. Feature-specific decisions live in each feature's README.
---

# Cross-Feature Decisions: Spix (FitTrack)

Decisions that affect more than one feature. A decision owned by one feature lives in that feature's README (Why section). D-IDs are shared with the feature READMEs.

---

### D-1: Local-first, offline app with opt-in network features ([TODO: date not recorded])
- **Context**: Health and fitness data is personal; the app's stated philosophy is "your data belongs to you".
- **Chose**: All data stored on the device; the app works without internet. Network features (social, AI, barcode lookup) are opt-in, and there is no data selling and no ad trackers.
- **Rejected**: [TODO: not recorded]
- **Consequences**: Every feature must work offline or degrade gracefully; network features sit behind toggles (Labs, AI settings, social opt-in). Affects F-011, F-012, F-013, F-015 and the storage layer used by all features.
- **Status**: active
- **Source**: `README_EN.md`, section "Privacy & Clean App Philosophy".

### D-2: Two build flavors, standard and FOSS ([TODO: date not recorded])
- **Context**: The app ships on F-Droid, which doesn't accept Google services or trackers, as well as a standard build with Firebase/FCM push.
- **Chose**: One codebase with a `standard` flavor (`com.spix.app`, FCM push, Google services) and a `foss` flavor (`com.spix.app.foss`, no push, no Google services), selected by `EXPO_PUBLIC_BUILD_FLAVOR`, then `app.json` `extra.buildFlavor`, then the package name (`src/config/buildConfig.ts`). Developer mode can simulate FOSS in a standard build.
- **Rejected**: [TODO: not recorded]
- **Consequences**: Push-dependent behavior (F-015 social notifications, F-016 reminders) must check the flavor; native modules must be lazy-loaded. Release builds both APKs (`scripts/ci-build.js`); F-Droid builds via `scripts/fdroid-prebuild.sh`.
- **Status**: active
- **Source**: `.github/copilot-instructions.md`, section "Build Flavors: Standard vs FOSS"; commits `44fca65` "Fixes and updates for FOSS" and `914c3c2` "Removed INTERNET for FOSS".

### D-3: Optional Supabase backend for social only ([TODO: date not recorded])
- **Context**: Social features need a server, which conflicts with a fully local app.
- **Chose**: Social is opt-in and in beta, backed by Supabase; the client is only created when `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set (`isSocialAvailable()`), and a single "Delete Account" removes the account and its data.
- **Rejected**: [TODO: not recorded]
- **Consequences**: Only F-015 talks to Supabase; entry logging (F-001) pushes weekly stats and feed events to it only when the user is signed in and social is enabled.
- **Status**: active
- **Source**: `README_EN.md` ("Social (Optional)", "Total Deletion"); `.github/copilot-instructions.md` ("Supabase (optional social backend)").
