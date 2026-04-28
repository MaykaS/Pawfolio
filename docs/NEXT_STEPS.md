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
- Supabase Google sign-in, private snapshot table schema, local-to-account upload, and signed-in auto-sync to cloud snapshots
- Cloud restore back onto the current phone/browser from the latest snapshot
- Phone push subscription save for the current signed-in device
- Near-term local reminder notifications while the app is active/backgrounded with notification permission granted
- Live phone-push/account status and diagnostics in Profile
- Scheduled push sender scaffold for backend/cloud delivery
- Floating PawPal companion with care gaps, missed routine nudges, breed/season tips, optional collapsed Climate care context, unified Today attention, dismissals, and one-tap actions
- Profile screen with full state/photo backup export/import and editable personality tags
- Adaptive photo compression, IndexedDB photo storage, diary galleries, and safer local saves
- Cute dog-face PWA app icon
- localStorage persistence

## Immediate Next Improvements

1. Finish the trust layer:
   - Replace/repair the backend service-role key path used by the server sender
   - Verify the `api/send-due-push.ts` flow against real signed-in user data
   - Move beyond Hobby-plan daily scheduling so precise reminder timing is possible
2. Validate cloud confidence:
   - Test sign-in, upload/auto-sync, and restore on a second device/browser
   - Improve restore empty, success, and failure messaging if anything feels uncertain
3. Keep polishing the account surface:
   - Better backup health language
   - Clearer “this phone / cloud / push” state summaries
   - Continue using product-language status instead of technical labels
4. Deepen PawPal usefulness:
   - Let more suggestions prefill care or reminder forms
   - Add more breed profiles and seasonal care signals
   - Add a monthly PawPal recap for care/routine patterns
5. Add more structured care depth:
   - Medication start/end dates and missed-dose notes
   - Vaccine manufacturer/lot fields
   - Vet visit attachments or invoices
6. Split the private cloud snapshot into normalized cloud tables.
7. Connect Google Calendar OAuth and real event sync.
8. Add backend email reminders, likely through Vercel functions and Resend.
9. Decide when PawPal should move from local rules to optional LLM help.

## Prototype Content To Keep Improving

The user should continue entering their own dog information instead of relying on fake data.
The product should continue feeling warm and companion-like without losing clarity or trust in care-critical flows.

## Decisions To Make Soon

- Whether the first LLM feature should be natural-language entry parsing, PawPal recaps, or a dedicated Ask Pawfolio chat
- Exact timing for the normalized cloud-sync milestone beyond snapshot backup
- Whether GitHub repository should be public or private
- Whether cloud sync should stay single-owner first or include shared caregiver access in the first database design

## Still Partial / Not Yet Complete

These are important, but are not yet fully complete in the current build:

- Closed-app scheduled push notifications with reliable backend delivery
- Full normalized multi-device cloud sync
- Shared caregiver access
- Google Calendar real sync
- Email reminder sending
- Multiple pets
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
