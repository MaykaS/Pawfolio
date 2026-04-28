# Next Steps

## Current Product Stage

Pawfolio is no longer just a cute local prototype. It now has:

- a real one-dog daily workflow
- profile, diary, care, calendar, and companion surfaces with distinct jobs
- signed-in private backup and restore
- phone push subscription save and near-term local reminder delivery
- a clearer split between urgent Today attention and broader PawPal coaching

The next job is not feature accumulation. It is trust, validation, and product hardening.

## Priority Order

### 1. Finish the trust layer

This is the highest-value work because it determines whether Pawfolio feels dependable in daily care use.

- Repair and validate the backend sender path used by `api/send-due-push.ts`
- Move beyond coarse daily scheduling so closed-app reminders can become truly credible
- Verify due-now, lead-time, and missed-care reminder behavior with the app closed
- Keep refining the account surface so the user understands:
  - what lives on this phone
  - what is backed up privately
  - what this phone is saved for
  - what push status really means

### 2. Validate cloud restore confidence

- Test sign-in, upload/auto-sync, and restore on a second browser/device
- Improve restore messaging for:
  - no backup yet
  - restore in progress
  - restore success
  - restore failure
- Confirm what restore currently includes and call out any photo or device-specific limitations honestly

### 3. Run repeated PM-style product QA

- Re-test the core journeys end to end:
  - onboarding and profile setup
  - routine use across days
  - care creation and shared calendar sync
  - diary with photos
  - reminders and completion
  - sign-in, upload, restore
  - phone push setup
  - installed PWA open/reopen behavior
- Turn observed friction into the next implementation queue instead of reacting to isolated issues

### 4. Deepen PawPal after trust work is steadier

- Strengthen pattern memory and suggestion outcomes
- Add sharper one-tap prefills into care and reminder flows
- Add monthly recap / recent pattern summary
- Keep PawPal as a companion feed, not a second alert list
- Prepare structured memory for later optional LLM help without depending on LLMs yet

### 5. Make care feel more serious over time

- Medication start/end dates and missed-dose notes
- Vaccine manufacturer / lot fields
- Vet attachments or visit documents
- Stronger follow-up states and clearer history views

### 6. Refactor before the app grows further

- Split the oversized app shell into clearer screens, hooks, and helper boundaries
- Isolate cloud/push/account logic from the main app surface
- Reduce regression risk before large integration work such as full calendar sync or normalized cloud tables

## Later Product Layers

After trust, validation, and app-structure work are stronger:

1. Google Calendar real sync
2. Normalized cloud tables beyond the snapshot backup layer
3. Backend email reminders
4. Optional LLM-powered PawPal summaries, recaps, or natural-language help

## What Is Still Partial

- Fully reliable closed-app scheduled phone push
- Cross-device cloud confidence validated in the real world
- Normalized multi-device cloud sync
- Google Calendar real sync
- Email reminder sending
- Shared caregiver access
- Multiple pets

## Product Rule Going Forward

Pawfolio should keep getting:

- more dependable before more complex
- more legible before more clever
- more companion-like without becoming noisy
