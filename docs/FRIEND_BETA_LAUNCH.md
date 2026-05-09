# Friend Beta Launch

## Purpose

This checklist is the production launch path for Pawfolio's first friend beta.

The beta assumption is:

- fewer than 20 users
- private accounts only
- no shared caregiver access
- free-tier conscious infrastructure

## Launch Principle

Use a fresh production stack.

Do not put friends on the same Supabase/Vercel environment that has existing personal or development data.

## Production Setup

### 1. Create a new Supabase project

- Create a new Supabase project for production, for example `pawfolio-prod`.
- Save:
  - project URL
  - anon key
  - service role key
- Run [schema.sql](/C:/Users/mayas/OneDrive/Desktop/Projects/Pawfolio/supabase/schema.sql) in the SQL editor.
- Keep [cron.sql](/C:/Users/mayas/OneDrive/Desktop/Projects/Pawfolio/supabase/cron.sql) ready for scheduled reminder delivery.

Verify:

- all tables exist
- row level security is enabled
- policies are present
- the new project contains no old user data

### 2. Create a new Vercel production project

- Create a new Vercel project connected to this repo.
- Use the existing build settings from [vercel.json](/C:/Users/mayas/OneDrive/Desktop/Projects/Pawfolio/vercel.json):
  - build command: `npm run build`
  - output directory: `dist`
- Add production environment variables from [.env.example](/C:/Users/mayas/OneDrive/Desktop/Projects/Pawfolio/.env.example)

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `VITE_VAPID_PUBLIC_KEY`
- `VAPID_SUBJECT`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `CRON_SECRET`

Important:

- `VITE_*` values are public client configuration
- `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET`, `VAPID_PRIVATE_KEY`, and `CRON_SECRET` must remain server-only

Verify:

- production deploy succeeds
- app loads without missing-env trust issues
- Google sign-in UI is visible when configured

### 3. Configure Google sign-in and Calendar

- Configure Google as a provider in Supabase Auth.
- Configure the Google OAuth client for the production domain.
- Add the production origin and redirect URL expected by Supabase.
- Enable Google Calendar API.
- Make sure OAuth consent includes the Calendar scope used by Pawfolio.

Beta note:

- if the Google app stays in testing mode, manually add friend emails as test users before sharing the link

Verify:

- Google sign-in works on production
- Calendar connect succeeds for a non-owner account
- calendar events only appear in the signed-in user's Google Calendar

### 4. Configure push

- Generate VAPID keys.
- Set:
  - `VITE_VAPID_PUBLIC_KEY`
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `VAPID_SUBJECT`

Verify:

- a signed-in user can save their device for push
- permission prompts work
- reminders only reach the correct saved device

### 5. Configure reminder cron

- Generate a strong random `CRON_SECRET`
- add it to Vercel env vars
- wire scheduled delivery using [cron.sql](/C:/Users/mayas/OneDrive/Desktop/Projects/Pawfolio/supabase/cron.sql) if needed

Verify:

- the cron endpoint rejects unauthorized requests
- scheduled reminder delivery works without cross-user leakage

## Privacy Verification

Run this before inviting anyone.

### A/B account isolation test

1. Sign in as Account A on production.
2. Create obvious data, such as dog name `Alpha`.
3. Upload a cloud backup.
4. Sign out.
5. Open a separate browser or private window.
6. Sign in as Account B.
7. Confirm B cannot see or restore A's backup.
8. Create B data, such as dog name `Bravo`.
9. Upload a cloud backup.
10. Return to A and confirm A still restores only `Alpha`.

### Same-device switching test

1. Sign in as Account A on one device/browser.
2. Sign out.
3. Sign in as Account B on the same device/browser.
4. Confirm local data is not silently replaced.
5. Confirm restore only happens when B explicitly chooses it.

If a user ever reports seeing the wrong data, pause the beta immediately.

## Beta Operations

### Message to send with the invite

Use something close to this:

> Pawfolio is in a small friend beta. Please sign in with your own Google account. Your backup should stay private to your account. If anything ever looks wrong, stop and message me before continuing.

### Support channel

Choose exactly one support path before launch:

- direct email
- one group chat
- one small feedback form

### Trust surfaces now in product

The app now includes:

- clearer private-account ownership copy
- explicit restore wording
- searchable health documents linked to care records
- a privacy and beta info sheet
- a delete-cloud-backup action for the signed-in user

## Before Sending The Link

Do not invite friends until all of these are true:

- fresh production backend exists
- Google sign-in works
- A/B privacy test passes
- same-device switching test passes
- push and calendar stay account-bound
- cron is protected
- support path is ready
