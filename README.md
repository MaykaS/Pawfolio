# Pawfolio

Pawfolio is a mobile-first dog care app built for the real life of one dog: routines, reminders, care history, health documents, diary memories, and a private backup path that feels trustworthy instead of flimsy.

It is intentionally warm and companion-like, but it is built to hold serious care information without turning into a cold admin tool.

## What Pawfolio Is

Pawfolio is now a working product, not just a concept demo. It currently supports:

- dog profile onboarding and editing
- daily routine tracking with structured times and custom schedules
- diary entries with multi-photo memories
- care records for medication, vaccines, vet visits, and weight
- searchable health documents linked to care records
- reminders with recurrence, lead times, and completion history
- one-way Google Calendar sync
- local-first working state with signed-in private backup and restore
- installable Android PWA usage
- PawPal, a local care-coordinator layer for follow-through and planning

## Product Position

Pawfolio currently optimizes for:

- one dog
- one owner
- one dependable working copy on the current phone or browser
- one clear private cloud backup path

That constraint is deliberate. The product is far enough along that trust, clarity, and real daily usability matter more than broad surface area.

## Current Product Shape

The main surfaces now have distinct jobs:

- **Today**: same-day routines, urgent items, and quick operational clarity
- **Diary**: memories, photos, and meaningful moments
- **Care**: the source of record for health and care history
- **Calendar**: true upcoming chronology plus reminder management
- **PawPal**: calmer follow-through and care coordination
- **Profile**: dog identity, integrations, trust, and account actions

Inside Care, the current structure is:

- Summary
- Meds
- Vaccines
- Vet visits
- Weight
- Docs

There is no standalone Proof section. Documents live in Docs, in care detail, and as attached support where relevant.

## Current Status

The current app state is strong:

- the main dog-care workflow is coherent
- local-first persistence is stable
- signed-in cloud backup and restore are in place
- photos and health documents are included in backup and restore
- restore is available directly from onboarding
- Google Calendar can connect and sync from the signed-in account
- timed Google Calendar reminders sync as normal 30-minute calendar events
- per-reminder time zone handling exists, with device-default behavior and manual override
- the Profile area now behaves more like a trust center than a random settings pile
- the top Profile snapshot now uses:
  - Memories
  - Wellness
  - Days together
- Wellness is a calm status label, not a miniature dashboard
- normal app open lands on Today instead of redirecting to Profile
- Today and PawPal now have distinct jobs: Today handles same-day urgency, while PawPal handles calmer follow-through
- Calendar Upcoming now reflects the true next chronological items instead of only unresolved ones
- recurring monthly medication completion now behaves per occurrence instead of collapsing the whole plan
- vaccine completion now keeps older doses visible as calm history instead of leaving them overdue
- Care Summary is now a compact overview centered on:
  - Primary vet
  - Current meds
  - At a glance

Email reminders remain intentionally on hold. The backend plumbing still exists, but the app does not present email as a ready user-facing path.

## Core Product Rules

- The current phone or browser is the working copy.
- Cloud is the private backup layer.
- Restore pulls the latest backup back onto the current device.
- Google Calendar is the active outbound integration.
- Care is the source of record.
- Health documents are first-class and searchable, but not assumed to be required for every record.
- PawPal is a care coordinator, not a same-day alert list and not a chat bot.
- Email stays deferred until it is worth the operational complexity.
- Scheduled notifications are layered: this saved phone can alert locally, and some reminders are also delivered from the cloud backup path.
- Missed routine-task nudges are intentionally conservative: one hour late, once only for that task occurrence.

## Tech Stack

- Vite
- React
- TypeScript
- Supabase Auth plus Postgres snapshot backup
- IndexedDB for photos and health documents
- PWA install support for Android
- Vercel deployment

## Local Development

Install and run:

```bash
npm install
npm run dev
```

Run for phone testing on the same network:

```bash
npm run dev -- --host 0.0.0.0
```

## Deployment Notes

Pawfolio is meant to be used over HTTPS for real install and service-worker behavior.

Vercel settings:

- Framework: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

## Environment and Backend Setup

Reference files:

- `.env.example`
- `supabase/schema.sql`
- `supabase/cron.sql`

Key setup areas:

- Supabase URL, anon key, and service role key
- VAPID keys for phone push
- Google OAuth client id and secret for Calendar integration
- optional deferred email envs kept out of the active product path

If you update the notification delivery schema, rerun `supabase/schema.sql` so snapshot channel flags and indexes stay aligned with production cron behavior.

## Repository Guide

- [Product Brief](docs/PRODUCT_BRIEF.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture Notes](docs/ARCHITECTURE.md)
- [Decision Log](docs/DECISIONS.md)
- [Next Steps](docs/NEXT_STEPS.md)
- [PM Audit](docs/PM_AUDIT.md)
- [Friend Beta Launch](docs/FRIEND_BETA_LAUNCH.md)
- [Privacy Policy Draft](docs/PRIVACY_POLICY_DRAFT.md)
