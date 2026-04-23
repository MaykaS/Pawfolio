# Architecture Notes

## Recommended Starting Approach

Start with a mobile-first web prototype, then evolve into a real app foundation.

Recommended stack for the prototype:

- Vite, React, and TypeScript for the mobile-style web app
- Component-based screens that can later inform a React Native/Expo app
- Local browser storage first
- PWA install support for Android home-screen testing and Web Push subscriptions
- Vercel HTTPS hosting for installable phone builds
- Supabase Auth/Postgres persistence after the interaction model feels right

## Why Not Native Android First

Native Android can come later, but it is not the best first move while the product flow is still forming.

A web prototype lets us:

- Move faster on visual design and app flow
- Iterate on the emotional tone
- Test the information architecture
- Avoid locking into mobile implementation details too early

## Future Mobile Direction

The current phone-app path is staged:

1. Installable PWA first, using the current Vite app and Vercel HTTPS hosting.
2. Expo/React Native later, once the core care workflow and product shape are more stable.

Expo/React Native remains the likely native mobile path because it can support:

- Android and iOS from one codebase
- Push notifications
- Camera/photo picker
- Location permissions for GPS walks
- Native app packaging

## Data Model Direction

The first version should look like one user and one dog, with browser-local persistence. The model should be ready for expansion.

Current localStorage prototype data includes:

- Dog profile with name, breed, birthday, weight, personality, editable tags, photo, and avatar settings
- Daily tasks with title, canonical `HH:MM` saved time, optional note, chronological sorting, and local-date completion history
- Diary entries with title, body, date, legacy single-photo support, and up to 6 IndexedDB-backed photos
- Care records with type, title, record date, type-specific fields, optional next due date, and note
- Shared care-calendar events for medications, vaccines, and vet visits
- Medication records keep backward-compatible `dose` and `frequency` labels while also storing structured `doseAmount`, `doseUnit`, `frequencyType`, and `frequencyInterval`
- Calendar-only reminders with title, type, date, time, note, recurrence label, calculated next occurrence, and notification lead time
- Reminder completion history keyed by local date and reminder id, so one-off reminders can be marked done/skipped and recurring reminders can advance after an occurrence is handled
- Medication schedule helpers that map structured daily, weekly, monthly, or yearly frequency to shared calendar recurrence, while still normalizing simple legacy text
- Calendar helper views for future-only upcoming items, visible-month events, and selected-day event details
- Care helper views for type-specific validation, empty states, weight trends, medication consistency, and follow-up histories
- In-app notification center for future reminders, Due now/Soon/Upcoming groups, compact alert lead labels, and browser notification permission testing
- Local notification preferences and integration settings for in-app reminders, future phone push, email reminders, Google Calendar, and cloud sync
- Google Calendar payload scaffolding for reminders and shared care events, without frontend secrets or OAuth tokens
- PawPal companion settings, dismissals, care-gap/routine suggestions, same-day missed routine nudges, breed/season signals, optional collapsed Climate care context, unified Today attention, and one-tap suggestion actions
- Full local export/import payload for backup and restore, including referenced IndexedDB photo records

Older localStorage records are normalized on load so prototype changes do not break existing local data.

Routine task times are stored as canonical `HH:MM` strings for new edits, while older labels such as `8:00 PM` are parsed and normalized when possible. The Today routine sorts by parsed time, with unparseable/Anytime tasks last. Routine completion keys use the device's local calendar date so phone users do not carry yesterday's completed checks into today because of UTC drift.

Profile and diary photo uploads are adaptively compressed and stored in browser IndexedDB. localStorage keeps only small photo references, so repeated diary photos do not quickly exhaust the app's local state quota. Backup export now needs to include both the JSON state and referenced IndexedDB photo records. Save failures are caught and shown in-app instead of crashing the prototype.

Future cloud persistence should use Supabase Auth plus Postgres Row Level Security. Google sign-in is the preferred first login path. Each user-owned row should include a `user_id`, with policies limiting access to the authenticated user's own data.

The app now has Supabase-ready auth, private snapshot upload, and push subscription scaffolding. It stays local-only until the Supabase URL/anon key, service role key, VAPID keys, and Google OAuth setup are configured in Vercel/Supabase.

The first cloud migration uses `pawfolio_snapshots`: after Google sign-in, `Upload local Pawfolio` copies the current local state JSON into the user's private row. This protects existing phone data before later splitting records into fully normalized cloud tables.

Likely future entities:

- User
- Pet
- PetMember or PetAccess
- DiaryEntry
- DiaryPhoto
- CareRecord
- CareEvent
- Reminder
- RoutineTask
- RoutineHistory
- NotificationPreference
- IntegrationAccount
- AgentInsight
- Appointment
- Medication
- Vaccine
- WeightRecord
- VetVisit
- HealthCondition
- GeneticRecord

## Sharing Model Later

Eventually, one pet should be accessible by multiple users.

Examples:

- Parent and partner both care for the same dog
- A sitter gets limited access
- A family member can add notes or complete tasks

Likely roles:

- Owner
- Caregiver
- Viewer

## Notification Direction

The current prototype has an in-app notification center. It shows future reminders, exposes browser notification permission status, and can trigger a service-worker-backed test notification where the installed PWA/browser supports it.

The app now includes backend-ready PWA push pieces: browser subscription capture, a private `push_subscriptions` table, a service-worker push handler, and a Vercel cron endpoint that can send due reminder pushes from uploaded cloud snapshots. It requires Supabase/VAPID env vars before it can send real phone notifications. On Vercel Hobby, cron is limited to daily runs, so precise reminder timing needs Vercel Pro or a Supabase scheduled-function path.

The app should eventually support:

- Push notifications for mobile
- Email notifications through a backend sender such as Resend
- Google Calendar sync through per-user OAuth
- Calendar export fallback such as `.ics`

Reminder records should be designed with:

- Title
- Type
- Due date/time
- Repeat rule
- Calculated next occurrence for recurring reminders
- Alert lead time such as at time, 15 minutes before, 30 minutes before, 1 hour before, same-day morning, or 1 day before
- Completion status
- Pet association
- Optional assigned user later

Real push should be handled by Supabase-backed auth/device subscriptions plus PWA Push API and a backend push sender, or by Expo push in the native app phase. Email and Google Calendar sync must happen through server-side code so secrets are not exposed in the browser.

## Agentic Direction

The first agentic feature is PawPal.

Current version:

- Runs locally with simple rules
- Reviews routine completion, medication detail quality, upcoming reminders, care gaps, diary/care backup needs, breed, season, and optional broad care region
- Opens from a floating PawPal companion button above the five-tab bottom nav and also feeds urgent items into Today needs attention
- Detects same-day missed routine tasks after their scheduled time, using local date/time and a grace period
- Supports dismissible suggestions and one-tap actions such as adding a tick check task, opening a care record, opening reminder creation, or exporting a backup
- Uses shared dismissals so a done/dismissed suggestion disappears from PawPal and Today
- Is controlled by opt-in settings for PawPal, seasonal tips, and optional location/manual region context

Later version:

- Can use a cloud/LLM assistant only after privacy, auth, and sync decisions are stable
- Should explain what data it used
- Should default to compact summaries instead of sending raw journals/photos unless the user explicitly chooses otherwise
- Should never replace medical advice or urgent care judgment

## GPS Walk Direction

Walks should start as manual tracking.

Future GPS tracking requires:

- User permission
- Clear privacy messaging
- Manual fallback
- Start/stop walk sessions
- Route summary and duration

## Genetic Tracking Direction

Genetic tracking should be future-facing, not part of the first prototype.

Possible later fields:

- DNA provider
- Breed mix
- Uploaded report
- Genetic health risks
- Breed-specific notes
- Recommended monitoring items
