# Architecture Notes

## Recommended Starting Approach

Start with a mobile-first web prototype, then evolve into a real app foundation.

Recommended stack for the prototype:

- Vite, React, and TypeScript for the mobile-style web app
- Component-based screens that can later inform a React Native/Expo app
- Local browser storage first
- Real persistence after the interaction model feels right

## Why Not Native Android First

Native Android can come later, but it is not the best first move while the product flow is still forming.

A web prototype lets us:

- Move faster on visual design and app flow
- Iterate on the emotional tone
- Test the information architecture
- Avoid locking into mobile implementation details too early

## Future Mobile Direction

The likely mobile path is Expo/React Native because it can support:

- Android and iOS from one codebase
- Push notifications
- Camera/photo picker
- Location permissions for GPS walks
- Native app packaging

## Data Model Direction

The first version should look like one user and one dog, with browser-local persistence. The model should be ready for expansion.

Current localStorage prototype data includes:

- Dog profile with name, breed, birthday, weight, personality, photo, and avatar settings
- Daily tasks with title, completion state, saved time, and optional note
- Diary entries with title, body, date, and optional photo
- Care records with type, title, record date, optional next due date, and note
- Calendar reminders with title, type, date, time, note, and recurrence label

Older localStorage records are normalized on load so prototype changes do not break existing local data.

Likely future entities:

- User
- Pet
- PetMember or PetAccess
- DiaryEntry
- DiaryPhoto
- CareTask
- Reminder
- Appointment
- Medication
- Vaccine
- WeightRecord
- VetVisit
- HealthCondition
- GeneticRecord

## Sharing Model Later

Eventually, one pet should be accessible by multiple users.

Examples:

- Parent and partner both care for the same dog
- A sitter gets limited access
- A family member can add notes or complete tasks

Likely roles:

- Owner
- Caregiver
- Viewer

## Notification Direction

The app should eventually support:

- Push notifications for mobile
- Email notifications
- Calendar integration

Reminder records should be designed with:

- Title
- Type
- Due date/time
- Repeat rule
- Completion status
- Pet association
- Optional assigned user later

## GPS Walk Direction

Walks should start as manual tracking.

Future GPS tracking requires:

- User permission
- Clear privacy messaging
- Manual fallback
- Start/stop walk sessions
- Route summary and duration

## Genetic Tracking Direction

Genetic tracking should be future-facing, not part of the first prototype.

Possible later fields:

- DNA provider
- Breed mix
- Uploaded report
- Genetic health risks
- Breed-specific notes
- Recommended monitoring items
