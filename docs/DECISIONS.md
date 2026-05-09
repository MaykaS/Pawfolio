# Decision Log

## 2026-04-21: Start With Dogs

Decision: The first version supports dogs only.

Reason: Dogs give the product a concrete first workflow for routine, care, reminders, and health tracking.

## 2026-04-21: Start With One Dog

Decision: The first product experience centers on one dog and one owner.

Reason: This keeps the experience focused and understandable while still leaving room for multi-pet and caregiver access later.

## 2026-04-21: Build Mobile-First Web Before Native

Decision: Start as a mobile-first web app and installable PWA before moving to native mobile.

Reason: Product flow, trust, and interaction design needed to mature before a native rewrite would be worth it.

## 2026-04-22: Keep The Product Local-First

Decision: The working product stays local-first even after sign-in and cloud backup were added.

Reason: Local-first behavior keeps the app fast and legible while the trust layer hardens.

## 2026-04-22: Share Care And Calendar Records

Decision: Medications, vaccines, and vet visits should appear across both Care and Calendar from one underlying record.

Reason: Duplicate entry would make the product feel flimsy very quickly.

## 2026-04-22: Use Structured Times And Recurrence

Decision: Routine tasks and reminders use structured time values and recurrence instead of loose text.

Reason: Real scheduling trust depends on app-readable time and occurrence logic.

## 2026-04-22: Store Photos Safely

Decision: Photos are compressed, stored locally in IndexedDB, and included in export/import and cloud snapshot backup.

Reason: Photos are emotionally important, and the app cannot feel trustworthy if memories are easy to lose.

## 2026-04-22: Use Google Calendar As The First External Calendar

Decision: Google Calendar is the first supported external calendar integration.

Reason: It fits the Google sign-in path and solves the “show my reminders outside the app” job without overbuilding.

## 2026-04-22: Keep PawPal Local First

Decision: PawPal begins as a local rule-based companion before any model-backed behavior.

Reason: The app can feel intelligent without sending pet-care data to a model before privacy and sync choices are mature.

## 2026-04-23: Add Snapshot Backup Before Normalized Sync

Decision: Start cloud persistence with one private user snapshot row rather than normalized per-entity sync.

Reason: Snapshot backup delivers trust faster and with less migration risk at this stage.

## 2026-04-23: Auto-Sync Signed-In Changes

Decision: Signed-in local changes should auto-sync to the latest cloud snapshot.

Reason: Backup is not trustworthy if users must remember to upload after every edit.

## 2026-04-23: Add A Delivery Ledger

Decision: Reminder channel sends are recorded in `notification_deliveries`.

Reason: A scheduler without idempotency is not reliable enough for a trust-sensitive product.

## 2026-04-23: Layer Reminder Delivery

Decision: Pawfolio uses in-app, local near-term, and backend scheduled reminder layers instead of pretending one mechanism does everything.

Reason: Layering keeps the product useful while the backend path continues to mature.

## 2026-04-27: Treat The Current Device As The Working Copy

Decision: The product explicitly treats the current phone/browser as the working copy and cloud as backup.

Reason: Users need a simple mental model before the product is a full cross-device cloud app.

## 2026-04-28: Put Email Reminders On Hold

Decision: Email reminder plumbing remains in code, but the product surface treats email as intentionally deferred.

Reason: Sender-domain setup adds real operational complexity and is not worth presenting as active before the core trust path is stronger.

## 2026-04-28: Make Restore Available Before Profile Creation

Decision: Restore from cloud should be available during onboarding before a new pet profile is created.

Reason: Recovery should not require a fake placeholder profile.

## 2026-04-28: Turn Profile Into A Trust Center

Decision: The account area separates summary, actions, and deeper trust details instead of stacking every state in one crowded card.

Reason: Trust information must be scannable on mobile.

## 2026-04-28: Use Per-Reminder Time Zones

Decision: Time zone is modeled per reminder, with the device time zone as the default.

Reason: Users expect time zone to belong to the event they are scheduling, not to a bulky global trust setting.

## 2026-04-28: Make Timed Calendar Reminders Real Events

Decision: Timed Google Calendar reminders should sync as normal 30-minute events by default instead of zero-length markers.

Reason: Calendar reminders need to behave like real blocks in Google Calendar, not ambiguous point-in-time placeholders.

## 2026-04-28: Make Restore Results Explicit

Decision: Restore should surface a clear restored / empty / failed result instead of relying mostly on timestamps and generic status text.

Reason: Backup trust is weaker when users have to infer success instead of seeing what actually came back onto the device.

## 2026-05-09: Treat Documents As First-Class, Not Mandatory

Decision: Health documents are first-class, searchable support for care records, but they are not required completeness for every care record by default.

Reason: The product needs trust and paperwork retrieval without making every record feel incomplete or scolding.

## 2026-05-09: Keep Care Summary Compact

Decision: Care Summary should stay focused on primary vet, current meds, and at-a-glance status instead of becoming a mini dashboard.

Reason: The user needs a calm overview, not another dense surface competing with Docs and detail views.

## 2026-05-09: Make Recurring Care Completion Occurrence-Based

Decision: Recurring medication completion should apply to the current occurrence, while vaccine completion should preserve older doses as completed history.

Reason: Real care flows need history and continuity, not records that disappear or remain incorrectly overdue.

## 2026-05-09: Park Native-Feel Back Controls For Later

Decision: Better phone back/native-feel controls are worth doing, but they are parked for a later UX pass.

Reason: They matter, but they are not currently a higher-leverage product move than trust, care clarity, and calendar confidence.
