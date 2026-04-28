# Architecture Notes

## Architectural Direction

Pawfolio is built as a mobile-first web app with local-first behavior, an installable PWA shell, and a private signed-in cloud backup layer.

That is the right architecture for the current stage because it keeps iteration fast while still supporting real trust features:

- backup
- restore
- Google sign-in
- Google Calendar sync
- push foundations

## Stack

- Vite
- React
- TypeScript
- Supabase Auth
- Supabase Postgres snapshot storage
- IndexedDB for photos
- service worker / PWA shell
- Vercel deployment

## Product Mental Model

Pawfolio currently uses a simple, explicit state model:

- this phone/browser is the working copy
- cloud is the private backup layer
- restore pulls the latest backup back onto the current device

This is intentionally not yet a fully normalized multi-device sync architecture.

## Current Data Shape

Primary product entities:

- profile
- routine tasks
- diary entries
- care records
- care events
- reminders
- reminder completion history
- local preferences
- integration settings
- cloud sync metadata
- photo records

Photos live in IndexedDB locally and are now included in cloud snapshot backup/restore.

## Cloud Model

Current cloud persistence is snapshot-based.

Supabase stores:

- latest Pawfolio state JSON
- photo records
- push subscriptions
- integration accounts
- calendar event links
- reminder delivery ledger entries

This is a pragmatic intermediate architecture. It gives the app real trust without forcing a full normalized rewrite too early.

## Notification Model

Pawfolio now has layered reminder delivery:

- in-app attention and grouped reminders
- local near-term notification scheduling
- signed-in device push subscription save
- backend scheduled reminder sender
- delivery ledger for idempotency

That layered design is intentional. It lets the product stay useful even while the backend reminder path continues to harden.

## Calendar Model

Google Calendar is currently one-way:

- Pawfolio -> Google Calendar

The product does not attempt bidirectional calendar editing yet.

Per-reminder scheduling now resolves time zone in this order:

1. reminder-level override
2. current device/default time zone

That keeps travel cases possible without making time zone a heavy global setting.

## Trust Layer Structure

Recent cleanup moved trust/account logic out of the main app shell and into focused modules:

- cloud account state
- push state
- reminder scheduling logic
- trust display helpers
- extracted reminder and trust-detail sheets

This is the right direction. The main app shell is still larger than ideal, but the trust surface now reads much more like a deliberately owned subsystem.

## Future Architecture Direction

Likely later evolution:

1. normalized cloud tables beyond snapshots
2. multi-pet support
3. shared caregiver access
4. optional native shell via Expo / React Native
5. optional richer agentic PawPal paths

The key rule is to earn each layer in order. Pawfolio does not need a more complex architecture before the current trust model is fully proven in use.
