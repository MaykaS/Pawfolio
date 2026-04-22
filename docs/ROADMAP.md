# Roadmap

## Phase 0: Product Organization

Goal: Keep the project clear before building.

- Create README and planning docs
- Define MVP scope
- Decide prototype approach
- Track future ideas without overloading version one

## Phase 1: Mobile-Style Web Prototype

Goal: Build a clickable, polished prototype that feels like a mobile app and saves user input locally.

Included:

- Dog profile onboarding
- Breed picker
- Dog photo upload
- Stylized dog avatar studio
- Today screen
- Daily tasks with checkbox completion, structured editable times, chronological sorting, and compact notes
- Custom daily tasks with structured editable times
- Diary timeline
- Diary entries with clickable details and up to 6 photos per memory
- Care screen
- User-entered care records with type tabs and next due dates
- Friendly care empty states and validation by record type
- Weight trend and medication consistency summaries
- Calendar/reminders screen
- User-entered reminders with recurrence labels and alert lead times
- Month navigation, future-only upcoming items, and clickable day details
- Profile screen
- Health record export
- Full local backup export/import, including IndexedDB photos
- Notification and integration settings scaffold
- Local rule-based Routine Coach suggestions
- Cute animated UI moments
- Mobile-first layout with bottom navigation
- Local browser persistence
- Local-network phone testing

Success criteria:

- The flow is easy to understand
- The app feels cute and companion-like
- Serious care information still feels organized
- The user can enter real dog information and see it persist in the browser
- The prototype makes clear what should move to real account-based data later

## Phase 2: Real App Foundation

Goal: Turn the prototype into a working app with saved data.

Included:

- PWA install support or equivalent mobile testing packaging
- Full local export/import while data remains local-first
- Type-specific care forms for vaccines, medications, vet visits, and weight trends
- Daily routine rollover so task completion is tracked per day
- Local notification preferences and smart reminder lead times
- Google Calendar payload mapping before OAuth
- Routine Coach settings and local insight helpers
- User account model
- Pet profile storage
- Diary entry storage
- Reminder storage
- Care record storage
- Local image upload handling
- Notification-ready reminder, alert lead, and calculated recurrence model

Success criteria:

- Data persists
- The app can support one user and one dog reliably
- Data structures are ready for multiple pets and shared users later

## Phase 3: Notifications and Calendar

Goal: Make the app useful as a real organizer.

Included:

- Google Calendar OAuth and event sync
- Push notification subscriptions and backend push sending
- Email reminders through server-side email delivery
- Reminder scheduling with calculated recurrence
- Appointment and task states
- Calendar export fallback for Apple/Outlook users

Success criteria:

- Users can trust the app to remind them about pet care
- Reminder data can later connect to mobile notifications and external calendars

## Phase 3.5: Private Cloud Sync

Goal: Let each user keep private pet data across devices.

Likely approach:

- Supabase Auth with Google sign-in first
- Supabase Postgres tables for pets, care, reminders, diary, routine history, preferences, integrations, and agent insights
- Row Level Security so each authenticated user only reads and writes their own data
- Local export/import remains available as a safety path
- Upload local Pawfolio data into an account after sign-in

Success criteria:

- A new user sees only their own Pawfolio data
- Local prototype data can be uploaded into an account
- The data model can later support multiple pets and shared caregivers

## Phase 4: Mobile App

Goal: Move from web prototype/foundation to Android-first mobile app.

Likely approach:

- React Native with Expo
- Shared product concepts from the web prototype
- Native push notifications
- Native photo picker
- Optional GPS walk tracking

Success criteria:

- Android app can be installed and tested
- Core dog profile, diary, care, and reminders work on mobile

## Phase 5: Expansion

Goal: Support richer pet-life organization.

Possible features:

- Multiple pets per user
- Shared pet access for caregivers
- Permission roles such as owner, caregiver, viewer
- Medical record uploads
- Weight charts and health trends
- GPS walk history
- Genetic/DNA result tracking
- Breed-specific health and care insights
- LLM-backed Routine Coach after privacy and cloud sync are stable
- Other pet types beyond dogs
