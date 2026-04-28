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

## 2026-04-23: Use Local Dates For Daily Reset

Decision: Routine history keys use the phone/browser's local calendar date instead of UTC date strings.

Reason: A mobile user should not see yesterday's completed checklist after local midnight because their time zone differs from UTC.

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

## 2026-04-23: Keep Missed Routine Nudges In-App Until Push Exists

Decision: Missed routine nudges appear in PawPal and Today attention after a task's scheduled time plus a grace period, but do not send closed-app phone push yet.

Reason: Useful local attention items can ship now, while trustworthy phone push needs auth, device subscriptions, and a backend sender.

## 2026-04-23: Track Reminder Completion Per Occurrence

Decision: Reminders can be marked done or skipped by local date, and recurring reminders move to the next active occurrence once the current occurrence is handled.

Reason: Pawfolio needs to know what actually happened, not only what was scheduled. This makes medication, vaccine, vet, and walk reminders feel more like a real care workflow.

## 2026-04-23: Collapse Climate Care Settings

Decision: Profile shows Climate care as a compact row that expands into region chips and broad-location controls only when tapped.

Reason: Optional location context is helpful for PawPal, but it should not take over the Profile screen when the user is not actively editing it.

## 2026-04-22: Keep Auth And Database As The Next Cloud Milestone

Decision: Pawfolio remains local-first for this pass, and the planned cloud path is Supabase Auth with Google sign-in plus Postgres Row Level Security.

Reason: The app needs private per-user data before syncing across devices. RLS with a `user_id` ownership model lets a new user see only their own data and gives Pawfolio a path toward shared caregiver access later.

## 2026-04-23: Start Cloud Sync With A Private Snapshot

Decision: The first Supabase migration uploads the current local Pawfolio state into one private `pawfolio_snapshots` row before normalizing every entity into separate cloud tables.

Reason: This gives users a safe account backup and preserves existing phone data quickly, while still allowing a more relational schema for multi-pet and shared caregiver features later.

## 2026-04-23: Use PWA Web Push With Backend Scheduling

Decision: Real phone notifications use browser Push subscriptions saved to Supabase and a Vercel cron/API sender using VAPID keys.

Reason: Closed-app phone notifications cannot be scheduled reliably from frontend JavaScript alone. A backend sender is the trustworthy path for due reminders and missed-care nudges.

## 2026-04-23: Use Supabase Publishable Key For Client Auth

Decision: The browser client uses Supabase's publishable key for Google sign-in and client-side auth flows, while backend-only paths continue to require a server secret.

Reason: The legacy JWT-style anon key caused OAuth callback/API-key problems during the Google sign-in flow. The publishable key matches Supabase's current client-auth direction and is the safer long-term default for browser auth.

## 2026-04-23: Auto-Sync Signed-In Local State To Cloud Snapshot

Decision: When a user is signed in, Pawfolio automatically uploads the latest local state to the user's private `pawfolio_snapshots` row after edits, instead of relying only on a manual upload button.

Reason: Reminder delivery and cloud backup are too fragile if the user must remember to manually upload after every change. Auto-sync makes the private snapshot useful as a real foundation for cloud restore and backend reminder delivery.

## 2026-04-23: Use Local Reminder Scheduling As The Short-Term Delivery Layer

Decision: Pawfolio schedules near-term notifications locally in the client for reminders due within about the next hour, in addition to the longer-term backend push path.

Reason: The current backend push path still depends on infrastructure that is not fully production-ready. Local scheduling gives the prototype a real reminder experience now, while closed-app precise push remains a separate backend milestone.

## 2026-04-23: Show Live Phone Push Status Instead Of "Planned"

Decision: The Profile surface should show live phone-push state such as `Active now`, `Off`, `Needs setup`, or `Blocked`, plus a diagnostics sheet, instead of a vague `Planned` label.

Reason: The app now has working sign-in, device subscription save, and near-term local reminder delivery. User-facing status should reflect what is actually active on the current phone while still being honest that full closed-app backend delivery is still being hardened.

## 2026-04-27: Let Profile Summary Cards Open The Central Edit Sheet

Decision: Read-only profile summary surfaces such as Personality notes should be tappable and open the existing profile edit sheet, rather than staying static or introducing separate inline editors.

Reason: On mobile, important profile information should feel directly editable from where it is displayed. Keeping one central edit sheet preserves consistency, validation, and trust while still making the profile feel alive.

## 2026-04-22: Use A Dog-Face PWA Icon

Decision: The installed PWA icon should be a cute dog face in Pawfolio colors rather than a generic mark.

Reason: The home-screen icon is part of the app's emotional first impression, especially while Pawfolio is being tested as an installable Android PWA.

## 2026-04-22: Make Pawfolio Coach Local And Actionable First

Decision: Pawfolio Coach expands beyond a simple insight line into local rule-based suggestions with care gaps, routine patterns, breed/season tips, optional broad location context, dismissals, and one-tap actions.

Reason: This gives Pawfolio an agentic feel without sending pet-care data to a model or requiring auth. LLM help can come later after privacy, account sync, and user consent are clear.

## 2026-04-22: Move Coach Into PawPal

Decision: The local coach experience should live in PawPal, while Today shows only the highest-priority shared attention items.

Reason: The companion/AI layer should feel like its own friendly helper instead of another alert card. Shared dismissals keep Done/dismiss behavior consistent across PawPal and Today.

## 2026-04-27: Split Today And PawPal Into Different Product Jobs

Decision: Today should act as a short urgent operational inbox, while PawPal should act as the broader agentic companion feed.

Reason: When both surfaces show the same items, the product feels repetitive instead of helpful. Separating urgency from coaching makes the app easier to trust and gives PawPal room to become genuinely intelligent over time.

## 2026-04-22: Keep PawPal Floating Instead Of Crowding Navigation

Decision: PawPal opens from a floating companion button above the bottom nav instead of occupying a sixth tab.

Reason: Five bottom-nav tabs fit the phone UI better. PawPal still feels special and accessible without making the main app sections cramped.

## 2026-04-22: Structure Medication Dose And Frequency

Decision: Medication records keep readable `dose` and `frequency` text, but new input uses structured amount/unit and preset frequency fields.

Reason: Pawfolio needs app-readable medication schedules for recurrence and reminders. Keeping the old labels preserves existing records and keeps care history easy to scan.
