# Next Steps

## Current Prototype Status

Prototype 0.1 is built as a mobile-style local web app.

Implemented:

- Onboarding and dog profile setup
- Breed suggestions
- Profile photo upload
- Stylized avatar studio
- Today routine with structured editable task times sorted chronologically
- Daily routine completion tracked by local phone date, so checks reset each day
- Compact task notes
- Custom daily tasks
- Diary entries with clickable detail views and up to 6 photos per memory
- Care records with type tabs, type-specific fields, and structured medication dose/frequency controls
- Care form validation, friendly empty states, and care history panels
- Care next due dates for vaccines, medications, and follow-up care
- Shared medication, vaccine, and vet visit items across Care and Calendar
- Calendar reminders with recurrence labels, calculated next occurrences, compact smart alert lead chips, month navigation, future-only upcoming items, and clickable day details
- Reminder done/skipped history for one-off and recurring reminder occurrences
- Structured medication recurrence from preset daily, weekly, monthly, yearly, or as-needed choices, with simple legacy text normalization
- Unified green health styling for vaccine and vet calendar items
- In-app notification center with Due now, Soon, and Upcoming groups plus service-worker test notifications for installed PWA checks
- Integration settings for Google Calendar, email reminders, phone push, and cloud sync planning
- Supabase-ready Google sign-in, local-to-account upload, private snapshot table schema, push subscription API, and scheduled push sender scaffold
- Floating PawPal companion with care gaps, missed routine nudges, breed/season tips, optional collapsed Climate care context, unified Today attention, dismissals, and one-tap actions
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
2. Polish PawPal suggestion actions:
   - Let more suggestions prefill care or reminder forms
   - Add more breed profiles and seasonal care signals
   - Add a monthly PawPal recap for care/routine patterns
3. Finish cloud/push setup in the dashboards:
   - Create the Supabase project and run `supabase/schema.sql`
   - Enable Google OAuth in Supabase
   - Add the `.env.example` values in Vercel
   - Generate VAPID keys for Web Push
   - Confirm Vercel Cron frequency allowed by the active plan; Hobby supports daily cron only, so precise same-day push timing needs Vercel Pro or Supabase scheduled functions
4. Add more structured care details:
   - Medication start/end dates and missed-dose notes
   - Vaccine manufacturer/lot fields
   - Vet visit attachments or invoices
5. Decide when PawPal should move from local rules to optional LLM help.
6. Split the private cloud snapshot into normalized cloud tables.
7. Connect Google Calendar OAuth and real event sync.
8. Add backend email reminders, likely through Vercel functions and Resend.

## Prototype Content To Keep Improving

The user should continue entering their own dog information instead of relying on fake data.

## Decisions To Make Soon

- Whether the first LLM feature should be natural-language entry parsing, PawPal recaps, or a dedicated Ask Pawfolio chat
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
