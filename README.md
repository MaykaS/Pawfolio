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
- Daily task checklist with editable saved times
- Daily routine completion tracked per date
- Compact task notes that open only when needed
- Custom daily tasks with editable times
- Diary entries with optional photos
- Adaptive photo compression with browser IndexedDB photo storage to avoid localStorage limits
- Shared medication, vaccine, and vet visit items across Care and Calendar
- Care records with type filtering, type-specific fields, next due dates, and weight trend
- Care history panels with weight trend and medication consistency summaries
- Calendar reminders with recurrence labels and calculated next occurrences
- Medication frequency text can infer daily, weekly, monthly, or yearly reminders when it is clear
- Calendar month navigation with clickable day details
- In-app notification center with upcoming reminders and service-worker test notifications for installed PWA checks
- Integration settings for Google Calendar, email, phone push, and cloud sync planning
- Local rule-based Routine Coach suggestions
- Full Pawfolio data export/import for localStorage safety
- Browser-local persistence

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

See:

- [Product Brief](docs/PRODUCT_BRIEF.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture Notes](docs/ARCHITECTURE.md)
- [Decision Log](docs/DECISIONS.md)
