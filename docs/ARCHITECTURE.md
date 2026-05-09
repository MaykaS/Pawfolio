# Architecture Notes

## Architectural Direction

Pawfolio is a mobile-first web app with local-first behavior, an installable PWA shell, and a private signed-in cloud backup layer.

That remains the right architecture for the current stage because it keeps iteration fast while still supporting real trust features:

- backup
- restore
- Google sign-in
- Google Calendar sync
- push foundations
- document storage

## Stack

- Vite
- React
- TypeScript
- Supabase Auth
- Supabase Postgres snapshot storage
- IndexedDB for photos
- IndexedDB for health documents
- service worker / PWA shell
- Vercel deployment

## Product Mental Model

Pawfolio keeps a simple, explicit state model:

- this phone or browser is the working copy
- cloud is the private backup layer
- restore pulls the latest backup back onto the current device

This is intentionally not yet a fully normalized multi-device sync architecture.

## Current UX Structure

The main surfaces have distinct jobs:

- **Today** for same-day urgency and routine completion
- **Diary** for memories
- **Care** for the source of record
- **Calendar** for chronology and reminder management
- **PawPal** for follow-through and planning
- **Profile** for identity, integrations, and trust

The top Profile row is intentionally lightweight:

- Memories
- Wellness
- Days together

Wellness is a derived care/routine signal, not a medical score. In the shipped UI it renders as a calm label only, without supporting copy under the stat.

## Current Data Shape

Primary product entities:

- profile
- routine tasks
- diary entries
- care records
- care events
- health document metadata
- reminders
- reminder completion history
- local preferences
- integration settings
- cloud sync metadata
- photo records
- health document records

Photos and health documents live in IndexedDB locally and are included in cloud snapshot backup and restore.

Routine tasks are schedule-aware rather than implicitly daily. A task can be:

- every day
- every other day
- every N days from a chosen start date
- specific weekdays

Done state stays tied to each occurrence date through `taskHistory`.

## Care and Calendar Model

Medications, vaccines, and vet visits remain shared care/calendar entities.

Important current behavior:

- Care is the source of record
- shared care records generate reminder-facing calendar behavior
- Calendar Upcoming is true chronology, not just unresolved items
- recurring medication completion is tracked per occurrence through reminder history
- recurring monthly medication plans stay active after one occurrence is marked done
- vaccine completion creates the new dose while older doses remain visible as completed history

Documents are first-class and searchable, but they are not treated as mandatory completeness for every care record by default.

## Cloud Model

Current cloud persistence is snapshot-based.

Supabase stores:

- latest Pawfolio state JSON
- photo records
- health document records
- snapshot-level notification channel flags for cron filtering
- push subscriptions
- integration accounts
- calendar event links
- reminder delivery ledger entries

This is a pragmatic intermediate architecture. It gives the app real trust without forcing a full normalized rewrite too early.

## Notification Model

Pawfolio uses layered reminder delivery:

- in-app attention and grouped reminders
- local near-term notification scheduling
- signed-in device push subscription save
- backend scheduled reminder sender
- delivery ledger for idempotency

That layered design is intentional. The saved device can alert locally, and scheduled reminders can also come through the cloud delivery path without pretending one mechanism does everything.

Missed routine-task nudges are intentionally conservative: one reminder exactly one hour after the scheduled time, once only for that task occurrence.

## Companion Model

Pawfolio keeps two distinct helper surfaces:

- **Today needs attention** for same-day urgency
- **PawPal** for longer-running follow-through and planning

Today is intentionally short-lived and operational. PawPal is calmer and stateful: it remembers unresolved threads, supports snooze/resolved states, and always shows a digest plus one next-useful prompt.

Current PawPal coverage is deliberately local and rule-based. It focuses on care coordination, planning gaps, and follow-through rather than chat behavior.

## Calendar Model

Google Calendar is currently one-way:

- Pawfolio -> Google Calendar

The product does not attempt bidirectional calendar editing yet.

Timed reminder sync creates normal 30-minute calendar events by default, while all-day reminders stay all-day.

Per-reminder scheduling resolves time zone in this order:

1. reminder-level override
2. current device/default time zone

That keeps travel cases possible without making time zone a heavy global setting.

## Trust Layer Structure

Recent trust cleanup moved account and trust logic out of the main app shell and into focused modules:

- cloud account state
- push state
- reminder scheduling logic
- trust display helpers
- extracted reminder and trust-detail sheets

Restore outcomes are explicit:

- restored successfully
- no backup found
- restore failed

## Future Architecture Direction

Likely later evolution:

1. normalized cloud tables beyond snapshots
2. multi-pet support
3. shared caregiver access
4. optional native shell via Expo / React Native
5. optional richer agentic PawPal paths
6. better phone back/native-feel controls after the current UX hardening priorities

The key rule is to earn each layer in order. Pawfolio does not need a more complex architecture before the current trust model is fully proven in use.
