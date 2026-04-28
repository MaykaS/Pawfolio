# Roadmap

## Current Stage

Pawfolio has moved past “prototype with ideas” and into “product with a credible trust model.”

The current roadmap should protect that progress:

- strengthen what already works
- validate it in realistic use
- widen scope only where the product has earned it

## Phase 1: Product Foundation

Delivered:

- dog onboarding and profile editing
- Today, Diary, Care, Calendar, and Profile surfaces
- routine tasks with structured times
- reminders with recurrence and lead times
- shared care/calendar records
- photo-backed diary
- PawPal companion layer
- local-first persistence

## Phase 2: Trust Foundation

Delivered:

- Google sign-in through Supabase
- private cloud snapshot backup
- signed-in auto-sync
- restore from latest cloud backup
- restore-first onboarding
- photo backup/restore
- phone push subscription save
- trust-center style Profile account surface

## Phase 3: Active Integrations

Current:

- Google Calendar connect and one-way sync
- backend reminder delivery foundations
- deferred email plumbing kept out of the active product path

Success standard for this phase:

- calendar sync is dependable
- reminder timing stays consistent
- account and backup states feel understandable without technical knowledge

## Near-Term Focus

### 1. Calendar confidence

- validate create, update, and delete sync behavior
- improve failure messages and sync feedback
- keep time zone behavior elegant and predictable

### 2. Cross-device confidence

- keep validating upload, restore, and fresh-device recovery
- verify photo restore in realistic browser/device flows
- tighten restore success, empty, and failure messaging

### 3. Product polish

- continue shrinking `App.tsx`
- keep trust code explicit and test-backed
- reduce ambiguous or hidden system behavior

### 4. Care seriousness

- richer care metadata where it adds real value
- clearer follow-up and history states
- stronger “real life admin” feeling without making the app heavy

## Later Phases

### Phase 4: Multi-User And Multi-Pet

- multiple pets
- shared caregiver access
- permission roles

### Phase 5: Deeper Intelligence

- richer PawPal memory
- recap-style summaries
- optional LLM help after privacy and cloud architecture are steadier

### Phase 6: Native Mobile

- likely Expo / React Native path
- native push
- native photo and permission flows

## Roadmap Rule

Pawfolio should keep becoming:

- more dependable before more broad
- more polished before more ambitious
- more helpful without becoming noisy
