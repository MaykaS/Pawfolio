# Roadmap

## Current Stage

Pawfolio has moved past prototype energy and into product hardening.

The roadmap now needs to protect what already works:

- strengthen trust
- improve real-life usability
- widen scope only where the product has earned it

## Phase 1: Product Foundation

Delivered:

- dog onboarding and profile editing
- Today, Diary, Care, Calendar, PawPal, and Profile surfaces
- routine tasks with structured times and flexible schedules
- reminders with recurrence, lead times, and completion history
- shared care/calendar records
- photo-backed diary
- local-first persistence

## Phase 2: Trust Foundation

Delivered:

- Google sign-in through Supabase
- private cloud snapshot backup
- signed-in auto-sync
- restore from latest cloud backup
- restore-first onboarding
- photo backup and restore
- health document backup and restore
- phone push subscription save
- trust-center style Profile account surface

## Phase 3: Real Care Coordination

Current:

- Google Calendar connect and one-way sync
- searchable health documents linked to care
- Care Summary with primary vet, meds, and at-a-glance status
- per-occurrence medication completion behavior
- historical vaccine dose behavior after completion
- PawPal as a calmer care coordinator instead of a same-day alert list

Success standard for this phase:

- care history feels dependable
- Calendar behavior feels predictable
- health documents are fast to find
- PawPal feels useful without becoming noisy

## Near-Term Focus

### 1. Calendar confidence

- validate create, update, and delete sync behavior
- keep sync feedback concrete
- keep time zone behavior elegant and predictable

### 2. Care detail seriousness

- keep strengthening medication, vaccine, and vet detail views
- make next steps and historical state feel clearer
- keep care records useful over time, not just on entry day

### 3. Health document polish

- tighten doc editing, linking, and retrieval flows
- keep the docs experience calm on mobile
- preserve the “find the paperwork fast” product value

### 4. PawPal usefulness refinement

- keep PawPal anchored as a care coordinator
- improve precision of follow-through suggestions
- make sure it earns its place through useful actions, not chatter

### 5. Product polish and maintainability

- continue shrinking `App.tsx`
- keep high-risk flows test-backed
- reduce ambiguous or hidden system behavior

## Parked For Later

- basic phone back/native-feel controls
- richer routing/deep-link behavior

These are worthwhile, but they are not the highest-leverage product move right now.

## Later Phases

### Phase 4: Multi-Pet And Shared Care

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
