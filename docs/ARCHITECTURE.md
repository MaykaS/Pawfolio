# Architecture Notes

## Recommended Starting Approach

Start with a mobile-first web prototype, then evolve into a real app foundation.

Recommended stack for the prototype:

- Vite, React, and TypeScript for the mobile-style web app
- Component-based screens that can later inform a React Native/Expo app
- Local browser storage first
- PWA install support for Android home-screen testing
- Vercel HTTPS hosting for installable phone builds
- Real persistence after the interaction model feels right

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
- Daily tasks with title, saved time, optional note, and date-based completion history
- Diary entries with title, body, date, and compressed optional photo
- Care records with type, title, record date, type-specific fields, optional next due date, and note
- Shared care-calendar events for medications, vaccines, and vet visits
- Calendar-only reminders with title, type, date, time, note, recurrence label, and calculated next occurrence
- Calendar helper views for future-only upcoming items, visible-month events, and selected-day event details
- In-app notification center for future reminders and browser notification permission testing
- Full local export/import payload for backup and restore

Older localStorage records are normalized on load so prototype changes do not break existing local data.

Profile and diary photo uploads are compressed before localStorage writes. Save failures are caught and shown in-app instead of crashing the prototype.

Future cloud persistence should use Supabase Auth plus Postgres Row Level Security. Each user-owned row should include a `user_id`, with policies limiting access to the authenticated user's own data.

Likely future entities:

- User
- Pet
- PetMember or PetAccess
- DiaryEntry
- DiaryPhoto
- CareTask
- Reminder
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

The current prototype has an in-app notification center. It shows future reminders, exposes browser notification permission status, and can trigger a test notification where the browser supports it.

It does not yet schedule real background push reminders. The app should eventually support:

- Push notifications for mobile
- Email notifications
- Calendar integration

Reminder records should be designed with:

- Title
- Type
- Due date/time
- Repeat rule
- Calculated next occurrence for recurring reminders
- Completion status
- Pet association
- Optional assigned user later

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
