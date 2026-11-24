---
id: F-015
title: "Social hub"
status: shipped
origin: backfill
files:
  - app/social.tsx
  - app/auth.tsx
  - app/profile.tsx
  - app/settings/social.tsx
  - src/components/social/
  - src/stores/socialStore.ts
  - src/services/supabase/
  - src/utils/socialChallenges.ts
depends_on: [F-001, F-006, F-016]
verified: "1e373b4 2026-11-24"
---

# F-015: Social hub (beta, opt-in)

## What it does
An optional social layer on Supabase. The user signs up with email, password and username, and can then: see a weekly global leaderboard (optionally padded with server-defined bot players) and a friends leaderboard; search users and send, accept or remove friend requests; block users; send encouragements; create, join, leave or delete challenges (goal: workouts, distance, duration or XP over a number of days) with progress synced from local entries; and see a feed of friends' shared workouts with likes. New sport entries are auto-shared to the feed and weekly stats pushed after each change. Profile visibility and friend-request acceptance are configurable, and "Delete account" removes the account and all its data through an Edge Function.

## Code map
- `app/social.tsx` → `src/components/social/SocialHubScreen.tsx`: tabs Home / Friends / Challenges / Leaderboard (`src/components/social/hub/*`), sheets for add friend, create challenge, challenge details, share workout.
- `src/components/social/SocialStatusScreen.tsx`: shown when social is off or unavailable.
- `app/auth.tsx` (sign in / up), `app/profile.tsx` (edit profile), `app/settings/social.tsx` (privacy, delete).
- `src/stores/socialStore.ts`: persisted auth/profile state, leaderboards, friends, encouragements, realtime subscriptions, push token registration.
- `src/services/supabase/client.ts` (`isSocialAvailable`), `social.ts` (all queries, RPCs `get_friends_leaderboard` and `search_users`, Edge Function `delete-account`), `database.types.ts`, `helpers.ts`.
- `src/utils/socialChallenges.ts`: entry contribution per challenge goal.
- Sync from entries: `scheduleSocialSync` and `scheduleAutoWorkoutShare` in `src/stores/appStore.ts`.
- Tests: none.

## How to run & test
- Run: needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`, and the Supabase project (schema in the git-ignored `/supabase` folder).
- Test: no automated tests.

## Limits
- Beta (per `README_EN.md`). Tables used: profiles, profile_private, friendships, encouragements, blocked_users, weekly_leaderboard, social_challenges, social_challenge_participants, social_feed_events, social_feed_reactions, social_feature_flags, social_leaderboard_bots.
- Push notifications only in the standard flavor (D-2).

## Gotchas
### Schema is not in the repo
- **Problem**: The database schema, RLS policies and Edge Functions live in the git-ignored `/supabase` folder.
- **Rule**: Treat `database.types.ts` as the contract and ask the maintainer before changing tables, RPCs or functions.
### Auto-share timing
- **Problem**: Only entries created in the last 5 minutes without `customCreatedAt` are auto-shared (see F-001).

## Why
- Optional Supabase backend: see D-3 in `rules/decisions.md`.
- Leaderboard bots and feature flags table: [TODO: not recorded]

## Assumptions
None known.

## Risks
- `social.ts` is 1,800+ lines in one module; changes are easy to get wrong without tests.

## Open issues & backlog
- [ ] Split `src/services/supabase/social.ts` by area (friends, leaderboard, challenges, feed) (idea)
- [ ] Comments on feed items (idea)

## Log
- 2026-11-24: backfilled
