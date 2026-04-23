# Pawfolio

A mobile-first pet care companion that combines a cute daily app experience with serious organization for a dog's life, health, memories, and routines.

## Product Direction

The first version focuses on one dog and one owner. The app should feel warm, animated, and approachable while still being reliable enough for real pet care organization.

Core themes:

- Daily companion experience for the pet's routine
- Photo-first diary for memories and adventures
- Care organization for meals, walks, medications, vaccines, appointments, and notes
- Health history that can become deeper over time
- A foundation that can later support multiple pets and shared access between caregivers

## MVP Scope

The first prototype should include:

- Dog onboarding and profile creation
- Breed picker with searchable dog breeds
- Profile fields for name, birthday, weight, breed, photo, and personality notes
- Today screen with daily checklist items
- Diary timeline with photos, captions, and journal text
- Care screen for health, medications, vaccines, vet visits, and weight history
- Calendar/reminders screen for appointments and tasks
- Mobile-style navigation and animated, friendly UI states

## Long-Term Vision

Future versions may include:

- Multiple pets per user
- Shared pet access for multiple caregivers
- Push notifications and email reminders
- Calendar integrations
- GPS walk tracking with user permission
- Medical document storage
- Genetic/DNA result tracking and breed-specific insights
- Android and iOS apps through a mobile app framework

## Current Status

Prototype 0.1 is a local-first Vite, React, and TypeScript mobile-style web app.

Current prototype behavior:

- User-created dog profile
- Profile photo upload
- Stylized dog avatar builder
- Daily task checklist with structured saved times, sorted chronologically
- Daily routine completion tracked by the phone's local calendar date so the checklist resets day to day
- Compact task notes that open only when needed
- Custom daily tasks with editable structured times
- Diary entries with clickable detail views and up to 6 photos per memory
- Adaptive photo compression with browser IndexedDB photo storage to avoid localStorage limits
- Shared medication, vaccine, and vet visit items across Care and Calendar
- Care records with type filtering, type-specific fields, structured medication dose/frequency controls, next due dates, and weight trend
- Care history panels with weight trend and medication consistency summaries
- Calendar reminders with recurrence labels and calculated next occurrences
- Reminder completion history so one-off reminders can be marked done/skipped and recurring reminders advance to the next occurrence
- Medication dose and frequency are saved in structured fields, with legacy text normalized when it is clear
- Calendar month navigation with clickable day details
- Smart reminder timing defaults with compact per-reminder alert lead chips, including at time, 15 min, 30 min, 1 hour, same day, and 1 day
- In-app notification center with Due now, Soon, and Upcoming reminder groups plus service-worker test notifications for installed PWA checks
- Integration settings for Google Calendar, email, phone push, and cloud sync planning
- Floating PawPal companion with local rule-based care gaps, missed routine nudges, breed/season tips, optional collapsed Climate care context, unified Today attention, dismissible suggestions, and one-tap actions
- Full Pawfolio data export/import for localStorage and IndexedDB photo safety
- Supabase-ready Google sign-in, private cloud snapshot upload, and PWA push subscription scaffolding
- Cuter dog-face PWA app icon for home-screen installs
- Browser-local persistence

Current data/auth note:

- Pawfolio can now show a Google sign-in path when Supabase env vars are configured.
- Until Supabase is configured, data is private to the browser/app profile where it was created.
- The cloud direction is Supabase Auth with Google sign-in and Postgres Row Level Security so each user only sees their own pet data.
- `Upload local Pawfolio` means copying the data already on this phone/browser into the signed-in private account.

Cloud/push setup files:

- `.env.example` lists the needed Vercel variables.
- `supabase/schema.sql` creates the private snapshot and push subscription tables with RLS.
- `api/push-subscriptions.ts` stores a signed-in user's phone subscription.
- `api/send-due-push.ts` is the scheduled push sender for due reminders.

Run locally:

```bash
npm install
npm run dev
```

Run for phone testing on the same network:

```bash
npm run dev -- --host 0.0.0.0
```

Then open the network URL shown by Vite on your phone.

## Install On Android

Pawfolio is set up as an installable PWA. For the real app-like install flow, use an HTTPS deployment such as Vercel.

Deploy/build settings:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Android install flow:

1. Open the Vercel HTTPS URL in Chrome on Android.
2. Open the Chrome menu.
3. Tap `Add to Home screen` or `Install app`.
4. Launch Pawfolio from the new home-screen icon.

Notes:

- Data is still local-first and stored in that phone browser/app profile.
- The local network dev URL is useful for testing, but HTTPS is needed for the proper install/offline PWA experience.
- Real closed-app phone push reminders are a later backend milestone. They need auth/device subscriptions and a server push sender; the current app prepares reminder timing and in-app/PawPal attention without pretending to schedule phone push while closed.

See:

- [Product Brief](docs/PRODUCT_BRIEF.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture Notes](docs/ARCHITECTURE.md)
- [Decision Log](docs/DECISIONS.md)
