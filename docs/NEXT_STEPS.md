# Next Steps

## Current Prototype Status

Prototype 0.1 is built as a mobile-style local web app.

Implemented:

- Onboarding and dog profile setup
- Breed suggestions
- Profile photo upload
- Stylized avatar studio
- Today routine with editable task times
- Daily routine completion tracked per date
- Compact task notes
- Custom daily tasks
- Diary entries with optional photos
- Care records with type tabs and type-specific fields
- Care next due dates for vaccines, medications, and follow-up care
- Shared medication, vaccine, and vet visit items across Care and Calendar
- Calendar reminders with recurrence labels, calculated next occurrences, month navigation, future-only upcoming items, and clickable day details
- Unified green health styling for vaccine and vet calendar items
- In-app notification center with upcoming reminders and browser permission check
- Profile screen with full data export/import and editable personality tags
- Photo compression and safer local saves
- localStorage persistence

## Immediate Next Improvements

1. Polish the new care forms with better validation and friendlier empty states.
2. Add full care history views and charts for weight and medication consistency.
3. Plan real push notifications now that recurrence and local backups exist.
4. Continue installed PWA testing from Android Chrome:
   - Launches in standalone mode
   - Saves localStorage data
   - Reopens with saved dog data
   - Loads the app shell after the first visit
5. Research Supabase Auth/Postgres for private cloud sync.

## Prototype Content To Keep Improving

The user should continue entering their own dog information instead of relying on fake data.

## Decisions To Make Soon

- Whether the next data layer should be local browser storage plus export/import, or a small backend database
- Whether GitHub repository should be public or private
- When to add Supabase Auth/Postgres with Row Level Security for private user data

## Not In The First Prototype

These are important, but should come after the initial prototype:

- User login
- Multiple pets
- Shared caregiver access
- Real push notifications
- Email notifications
- Calendar sync
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
