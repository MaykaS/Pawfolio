# Roadmap

## Phase 0: Product Organization

Goal: Keep the project clear before building.

- Create README and planning docs
- Define MVP scope
- Decide prototype approach
- Track future ideas without overloading version one

## Phase 1: Mobile-Style Web Prototype

Goal: Build a clickable, polished prototype that feels like a mobile app.

Included:

- Dog profile onboarding
- Breed picker
- Today screen
- Diary timeline
- Care screen
- Calendar/reminders screen
- Profile screen
- Cute animated UI moments
- Mobile-first layout with bottom navigation

Success criteria:

- The flow is easy to understand
- The app feels cute and companion-like
- Serious care information still feels organized
- The prototype makes clear what should become real data later

## Phase 2: Real App Foundation

Goal: Turn the prototype into a working app with saved data.

Included:

- User account model
- Pet profile storage
- Diary entry storage
- Reminder storage
- Care record storage
- Local image upload handling
- Basic notification-ready reminder model

Success criteria:

- Data persists
- The app can support one user and one dog reliably
- Data structures are ready for multiple pets and shared users later

## Phase 3: Notifications and Calendar

Goal: Make the app useful as a real organizer.

Included:

- Push notification planning
- Email reminder planning
- Reminder scheduling
- Appointment and task states
- Calendar export or integration research

Success criteria:

- Users can trust the app to remind them about pet care
- Reminder data can later connect to mobile notifications and external calendars

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
- Other pet types beyond dogs
