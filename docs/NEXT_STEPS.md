# Next Steps

## Current Prototype Status

Prototype 0.1 is built as a mobile-style local web app.

Implemented:

- Onboarding and dog profile setup
- Breed suggestions
- Profile photo upload
- Stylized avatar studio
- Today routine with editable task times
- Compact task notes
- Custom daily tasks
- Diary entries with optional photos
- Care records with type tabs
- Care next due dates for vaccines, medications, and follow-up care
- Calendar reminders with recurrence labels
- Profile screen with health record export
- localStorage persistence

## Immediate Next Improvements

1. Deploy the PWA to Vercel and install it from Android Chrome.
2. Test the installed home-screen app:
   - Launches in standalone mode
   - Saves localStorage data
   - Reopens with saved dog data
   - Loads the app shell after the first visit
3. Improve care forms by type:
   - Vaccines: next due date and vaccine notes
   - Medication: dose, frequency, refill/next dose
   - Vet visit: clinic, vet, follow-up date
   - Weight: numeric weight and trend display
4. Make recurring reminders calculate the next upcoming occurrence automatically.
5. Add full data export/import for localStorage safety.
6. Add a daily rollover/reset model so completed routine tasks are tracked per day.

## Prototype Content To Keep Improving

The user should continue entering their own dog information instead of relying on fake data.

## Decisions To Make Soon

- Whether the next data layer should be local browser storage plus export/import, or a small backend database
- Whether GitHub repository should be public or private
- Whether to add PWA install support before backend/auth
- Whether care reminders should be generated from care records automatically

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
