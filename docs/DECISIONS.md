# Decision Log

## 2026-04-21: Start With Dogs

Decision: The first version focuses on dogs.

Reason: Dogs provide a clear first product surface and make breed selection, walks, medications, vaccines, and vet tracking concrete.

## 2026-04-21: Start With One Pet

Decision: The first user experience supports one dog.

Reason: This keeps the first prototype focused. The data model should still leave room for multiple pets later.

## 2026-04-21: Cute Companion, Serious Organization

Decision: The app should look cute, animated, and approachable while supporting real care organization.

Reason: The emotional appeal matters, but the app must still be trusted for schedules, medications, vaccines, and health history.

## 2026-04-21: Build Mobile-Style Web Prototype First

Decision: Start with a clickable mobile-style web prototype before native Android.

Reason: The app needs product and design iteration before committing to native mobile complexity. A web prototype can later inform a React Native/Expo implementation.

## 2026-04-21: Plan For Expo/React Native Later

Decision: The likely mobile path is Expo/React Native.

Reason: Expo can support Android, iOS, push notifications, photo picker, and GPS permissions while keeping one shared mobile codebase.

## 2026-04-22: Use Pawfolio As The Project Name

Decision: The prototype and docs use Pawfolio as the working app name.

Reason: The name fits the pet profile, care, memories, and health-history direction better than the earlier generic placeholder.

## 2026-04-22: Keep Prototype Local-First

Decision: Version 0.1 stores user-entered data in browser localStorage only.

Reason: This keeps iteration fast while the product flow, care model, and mobile-style UI are still being shaped.

## 2026-04-22: Add Saved Times And Compact Notes To Daily Tasks

Decision: Daily tasks store editable structured times, sort chronologically, and show notes only as a compact preview until opened.

Reason: The Today screen should stay clean and match the mobile routine-list inspiration while still supporting real notes.

## 2026-04-22: Use Canonical Task Times

Decision: Routine task times are stored as `HH:MM` strings and entered with a native time input. Older friendly strings are parsed and normalized where possible.

Reason: Sorting by free-text time is unreliable. Structured input lets custom tasks appear in the correct daily order without making users type exact formatting.

## 2026-04-22: Dismiss Sheets From Backdrop Or Keyboard

Decision: Shared app sheets close from the close button, Escape key, or tapping/clicking outside the sheet content.

Reason: Diary details and edit sheets should behave like a real mobile app modal while still preventing accidental closes from taps inside the sheet.

## 2026-04-22: Track Care Next Due Dates

Decision: Care records can store an optional next due date, used for more accurate OK, Due soon, and Overdue statuses.

Reason: Vaccines, medications, and vet follow-ups need future dates to be trustworthy care records.

## 2026-04-22: Store Reminder Recurrence

Decision: Calendar reminders store a recurrence label such as daily, weekly, monthly, or yearly.

Reason: Repeated medicine, grooming, and vet care are core pet-care workflows, even before real notifications exist.

## 2026-04-22: Infer Clear Medication Recurrence

Decision: Medication frequency text can infer daily, weekly, monthly, or yearly calendar recurrence when the wording is clear.

Reason: Users should not have to enter the same medication schedule twice, but Pawfolio should avoid guessing when frequency text is ambiguous.

## 2026-04-22: Ship Android App Feel As A PWA First

Decision: Pawfolio should become an installable Android PWA before starting a native Expo app.

Reason: A PWA gives the current prototype a home-screen icon and standalone app feel quickly, while avoiding a premature rebuild before the product workflow is stable.

## 2026-04-22: Use Vercel For HTTPS PWA Testing

Decision: Use Vercel as the first hosted target for Pawfolio's installable PWA.

Reason: Android Chrome needs HTTPS for the proper install and service-worker experience, and Vercel fits the existing Vite static build.

## 2026-04-22: Share Care And Calendar Items

Decision: Medications, vaccines, and vet visits use one shared care-calendar item that appears in both Care and Calendar.

Reason: Pet care should not require entering the same medicine, vaccine, or visit in multiple places.

## 2026-04-22: Compress Photos Before Saving Locally

Decision: Profile and diary photo uploads are compressed before saving to localStorage, and save failures show an in-app warning.

Reason: Full-size phone photos can exceed browser storage limits and crash the local-first prototype.

## 2026-04-22: Plan Supabase For Personalized Cloud Data Later

Decision: The planned future cloud path is Supabase Auth with Postgres Row Level Security.

Reason: Pawfolio needs per-user private data where each user sees only their own pet records, and Supabase can start on a free tier while supporting a relational care model.

## 2026-04-22: Use One Health Color For Vet And Vaccine Calendar Items

Decision: Vet visits and vaccines keep separate record types, but share the same green health styling in Calendar views.

Reason: Both represent health-care milestones, and a single health color makes the calendar easier to scan without weakening the underlying data model.

## 2026-04-22: Start Notifications As An In-App Center

Decision: The notification button opens an in-app notification center before real background push scheduling is added.

Reason: Upcoming reminders are useful immediately, but trustworthy push reminders need recurrence handling, data safety, and either PWA push infrastructure or native Expo push support.

## 2026-04-22: Track Routine Completion By Date

Decision: Daily routine completion is stored in a date-keyed history instead of permanently on each task.

Reason: A daily checklist should reset naturally each day while keeping the task definitions, notes, and times stable.

## 2026-04-22: Add Full Local Backup Before Cloud Sync

Decision: Pawfolio supports exporting and importing the full local state and referenced IndexedDB photos before adding account-based cloud storage.

Reason: localStorage and IndexedDB are convenient for the prototype, but users need a way to protect their profile, photos, care records, reminders, diary, and routine history.

## 2026-04-22: Scaffold Integrations Before Wiring Secrets

Decision: Pawfolio should show notification and integration preferences for Google Calendar, email reminders, phone push, and cloud sync before connecting real external services.

Reason: These features need backend secrets, OAuth, or push infrastructure. Scaffolding the settings now keeps the UX honest while avoiding fake reminders or exposed credentials.

## 2026-04-22: Use Google Calendar As The First Direct Calendar Sync

Decision: Google Calendar is the primary direct calendar integration path, with `.ics` export as a later fallback for Apple and Outlook users.

Reason: Google sign-in is also the preferred Supabase Auth direction, so Google Calendar is the cleanest first account-based integration.

## 2026-04-22: Start Routine Coach As Local Rules

Decision: Routine Coach starts as an opt-in, local, rule-based helper instead of an LLM-backed assistant.

Reason: The feature should feel useful immediately, but anything agentic that reads pet-care data needs clear privacy boundaries before using cloud or model services.

## 2026-04-22: Add Smart Reminder Lead Times

Decision: Reminders store an alert lead time. Medication, food, and walk reminders default to alerting at the scheduled time. Vet, vaccine, grooming, and other reminders default to one hour before.

Reason: Different pet-care reminders need different urgency. Users should be able to override the default without Pawfolio pretending that real closed-app push scheduling exists before backend push infrastructure.

## 2026-04-22: Keep Auth And Database As The Next Cloud Milestone

Decision: Pawfolio remains local-first for this pass, and the planned cloud path is Supabase Auth with Google sign-in plus Postgres Row Level Security.

Reason: The app needs private per-user data before syncing across devices. RLS with a `user_id` ownership model lets a new user see only their own data and gives Pawfolio a path toward shared caregiver access later.

## 2026-04-22: Use A Dog-Face PWA Icon

Decision: The installed PWA icon should be a cute dog face in Pawfolio colors rather than a generic mark.

Reason: The home-screen icon is part of the app's emotional first impression, especially while Pawfolio is being tested as an installable Android PWA.

## 2026-04-22: Make Pawfolio Coach Local And Actionable First

Decision: Pawfolio Coach expands beyond a simple insight line into local rule-based suggestions with care gaps, routine patterns, breed/season tips, optional broad location context, dismissals, and one-tap actions.

Reason: This gives Pawfolio an agentic feel without sending pet-care data to a model or requiring auth. LLM help can come later after privacy, account sync, and user consent are clear.
