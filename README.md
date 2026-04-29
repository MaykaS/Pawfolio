# Pawfolio

Pawfolio is a mobile-first dog care app for the real life of one dog: routines, reminders, care history, diary memories, and a private backup path that feels trustworthy instead of flimsy.

It is intentionally warm, companion-like, and photo-friendly, but it is built to hold serious pet-care information without turning into a sterile admin tool.

## What Pawfolio Is

Today Pawfolio is a working product, not just a concept demo. It supports:

- dog profile onboarding and editing
- daily routine tracking with structured times
- diary entries with multi-photo memories
- care records for medication, vaccines, vet visits, and weight
- reminders with recurrence, lead times, and completion history
- one-way Google Calendar sync
- local-first working state with signed-in private backup and restore
- installable Android PWA usage
- PawPal, a local companion layer for lightweight care guidance

## Product Position

Pawfolio currently optimizes for:

- one dog
- one owner
- one dependable working copy on the current phone/browser
- one clear private cloud backup path

That constraint is deliberate. The app is far enough along that trust, clarity, and real daily usability matter more than adding broad surface area.

## Current Status

The current app state is strong:

- the main dog-care workflow is coherent
- local-first persistence is stable
- signed-in cloud backup and restore are in place
- photos are included in backup/restore
- restore is available directly from onboarding
- Google Calendar can connect and sync from the signed-in account
- timed Google Calendar reminders sync as normal 30-minute calendar events
- per-reminder time zone handling now exists, with device-default behavior and manual override when needed
- the Profile area now behaves more like a trust center than a random settings pile
- restore now reports a clearer success/empty/failure result instead of hiding behind timestamps alone

Email reminders are intentionally on hold in the product. The backend plumbing remains in code, but the app does not pretend email is a ready user-facing path while sender-domain setup is out of scope.

## Core Product Rules

- The current phone/browser is the working copy.
- Cloud is the private backup layer.
- Restore pulls the latest backup back onto the current device.
- Google Calendar is the active outbound integration.
- Email stays deferred until it is worth the operational complexity.
- Scheduled notifications are layered: this saved phone can alert locally, and some scheduled reminders are also delivered from the cloud backup path.
- Missed routine-task nudges are intentionally conservative: one hour late, once only for that task occurrence.

## Tech Stack

- Vite
- React
- TypeScript
- Supabase Auth + Postgres snapshot backup
- IndexedDB for photo storage
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

- Supabase URL, anon/publishable key, and service role key
- VAPID keys for phone push
- Google OAuth client id and secret for Calendar integration
- optional deferred email envs, kept out of the active product path

If you update the notification delivery schema, rerun `supabase/schema.sql` so snapshot channel flags and indexes stay aligned with production cron behavior.

## Repository Guide

- [Product Brief](docs/PRODUCT_BRIEF.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture Notes](docs/ARCHITECTURE.md)
- [Decision Log](docs/DECISIONS.md)
- [Next Steps](docs/NEXT_STEPS.md)
- [PM Audit](docs/PM_AUDIT.md)
