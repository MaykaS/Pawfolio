# Next Steps

## Current Prototype Status

Prototype 0.1 is built as a mobile-style local web app.

Implemented:

- Onboarding and dog profile setup
- Breed suggestions
- Profile photo upload
- Stylized avatar studio
- Today routine with structured editable task times sorted chronologically
- Daily routine completion tracked per date
- Compact task notes
- Custom daily tasks
- Diary entries with clickable detail views and up to 6 photos per memory
- Care records with type tabs and type-specific fields
- Care form validation, friendly empty states, and care history panels
- Care next due dates for vaccines, medications, and follow-up care
- Shared medication, vaccine, and vet visit items across Care and Calendar
- Calendar reminders with recurrence labels, calculated next occurrences, smart alert lead times, month navigation, future-only upcoming items, and clickable day details
- Smart medication recurrence inference from clear frequency text
- Unified green health styling for vaccine and vet calendar items
- In-app notification center with Due now, Soon, and Upcoming groups plus service-worker test notifications for installed PWA checks
- Integration settings for Google Calendar, email reminders, phone push, and cloud sync planning
- Local Routine Coach suggestions
- Profile screen with full state/photo backup export/import and editable personality tags
- Adaptive photo compression, IndexedDB photo storage, diary galleries, and safer local saves
- Cute dog-face PWA app icon
- localStorage persistence

## Immediate Next Improvements

1. Continue installed PWA testing from Android Chrome:
   - Launches in standalone mode
   - Shows the new dog-face home-screen icon
   - Saves localStorage and IndexedDB photo data
   - Reopens with saved dog data
   - Loads the app shell after the first visit
2. Connect Supabase Auth/Postgres with Google sign-in and RLS.
3. Add an "Upload local Pawfolio to account" migration after Supabase is ready.
4. Connect Google Calendar OAuth and real event sync.
5. Add backend email reminders, likely through Vercel functions and Resend.
6. Add real PWA push subscriptions and backend push sending.
7. Decide when Routine Coach should move from rule-based local suggestions to an LLM-backed assistant.

## Prototype Content To Keep Improving

The user should continue entering their own dog information instead of relying on fake data.

## Decisions To Make Soon

- Exact timing for the Supabase Auth/Postgres milestone
- Whether GitHub repository should be public or private
- Whether cloud sync should stay single-owner first or include shared caregiver access in the first database design

## Not In The First Prototype

These are important, but should come after the initial prototype:

- User login
- Multiple pets
- Shared caregiver access
- Real push notifications
- Email notifications
- Calendar sync
- GPS walk tracking
- DNA/genetic report imports
- Native Android build

## First Prototype Success Checklist

- The app feels cute and companion-like.
- The care information feels organized and trustworthy.
- A user can understand the daily workflow quickly.
- The diary feels like a real place to keep pet memories.
- The user can enter their own dog information and see it saved locally.
- The user can test the prototype on their phone.
- The future roadmap is visible but does not overwhelm version one.
