# PM Audit

## Audit Date

- 2026-04-27

## Why This Audit Exists

Pawfolio has enough feature depth that the next job is not adding more surface area. The product now needs to prove that it is dependable, clear, and emotionally strong in daily use. This audit evaluates the app by user journey, not by feature count.

## Repo Health Snapshot

- `npm run lint` passes
- `npm test -- --run` passes
- `npm run build` passes
- Existing product shape is mobile-first, local-first, and already credible for one dog / one owner daily use

## Product Read

### What already feels strong

- The app has a warm visual identity without losing clarity.
- Today, Care, Calendar, Diary, and Profile already feel like real sections with different jobs.
- Care and Calendar sharing is a meaningful differentiator, especially for medication, vaccine, and vet workflows.
- Diary adds emotional value instead of feeling tacked on.
- PawPal now has a clearer role as a companion feed instead of a duplicate alert list.

### What still creates product risk

- Closed-app push is still only partially trustworthy.
- Cloud backup exists, but cross-device restore confidence still needs validation.
- The Profile account area needs to keep explaining local working copy vs cloud backup vs phone push in plain language.
- The codebase, especially the main app shell, is large enough that regression risk will keep rising without refactoring.

## Journey Audit

### Onboarding and first profile setup

**Strong**
- Setup is friendly and approachable.
- The profile feels personal quickly because photo, avatar, tags, and personality notes are all nearby.

**Confusing**
- The user does not yet get a strong first-run explanation that the phone/browser is the main working copy until cloud backup is connected.

**Trust breaks**
- A new user may not immediately understand how much is local-first vs account-backed.

**Simplify or defer**
- Keep the setup compact.
- Add clearer first-run backup/account framing later instead of more setup fields now.

### Profile editing

**Strong**
- Central profile sheet keeps editing consistent.
- Summary cards that open edit make the profile feel alive on mobile.

**Confusing**
- Account, cloud, and push concepts still need careful wording so they feel like product states, not developer states.

**Trust breaks**
- If account language is vague, users may not know whether changes are only local or already backed up.

### Daily routine usage

**Strong**
- Structured times and chronological sorting make Today feel operationally solid.
- Local-date reset fixed an important mobile trust issue.

**Confusing**
- Some users may still need more obvious feedback about what "done" means across days versus one-time completion today.

**Trust breaks**
- Reminder trust still matters more than task list trust: if notifications feel partial, routine confidence suffers too.

### Missed-task experience and same-day nudges

**Strong**
- Today now acts as a short urgent inbox.
- Missed-task nudges fit the product better than generic alarms.

**Confusing**
- Users still need to learn the grace-period model implicitly.

**Trust breaks**
- If a missed-task nudge arrives inconsistently, the user will not know whether to trust it.

### Care creation and editing

**Strong**
- Structured medication fields are a strong step toward a serious care product.
- Vaccine, medication, and vet workflows are better than generic note-taking now.

**Confusing**
- Care is moving toward "serious record" territory, but some fields still feel lighter than the trust level users will expect long-term.

**Trust breaks**
- The app still needs deeper care history states before it fully feels like long-term health management.

### Shared care/calendar sync

**Strong**
- One shared record model reduces duplicate entry and makes the product feel coherent.

**Confusing**
- The user may not always realize which surfaces are editing the same underlying item.

**Trust breaks**
- Sync must remain exact. Any mismatch between Care and Calendar will hurt confidence quickly.

### Diary and photos

**Strong**
- Multi-photo memories, detail views, and IndexedDB-backed storage make Diary feel real and warm.

**Confusing**
- Backup/restore expectations for photos should stay explicit until restore is fully validated end to end.

**Trust breaks**
- Photos are emotionally high-value. Any uncertainty around restore makes users nervous fast.

### Reminders and timing

**Strong**
- Lead-time chips and reminder grouping are easy to scan.
- Done/skipped occurrence history is the right model for a real reminder system.

**Confusing**
- The app now has local near-term reminders plus partial backend push. That needs clear wording so users know what works now.

**Trust breaks**
- Closed-app timing still needs hard proof before Pawfolio can claim reminder reliability with full confidence.

### Sign-in, upload, auto-sync, restore

**Strong**
- Sign-in and private backup are real now.
- Auto-sync reduces the risk of stale cloud state after edits.

**Confusing**
- Users still need a simpler mental model:
  - this phone is the working copy
  - cloud keeps a private backup
  - restore brings the latest backup back here

**Trust breaks**
- Until second-device restore is validated, backup is promising but not fully proven.

### Phone push setup

**Strong**
- The app can now save a phone for push and show real push/account diagnostics.

**Confusing**
- "Phone push works" needs to stay honest about the difference between local near-term alerts and true closed-app scheduled delivery.

**Trust breaks**
- This is still the highest trust risk in the product.

### PWA install/open/reopen/offline shell

**Strong**
- The app feels believable as an installable Android PWA.
- Recent service-worker and update work reduced the stale-build frustration.

**Confusing**
- Installed-app auth and push behavior still require more real-device validation.

**Trust breaks**
- If installed app state, updates, or login feel inconsistent, the whole "real app" story weakens.

## What We Should Simplify Or Defer

- Avoid adding more integrations before push and restore are more trustworthy.
- Avoid broadening PawPal too quickly until account/push confidence is steadier.
- Avoid normalized multi-table cloud work before snapshot backup and restore feel product-credible.

## Prioritized Backlog For The Next 2-3 Passes

### Pass 1: Trust hardening

1. Finish closed-app push sender reliability
2. Validate second-device/browser restore end to end
3. Improve account, backup, and push language in Profile and diagnostics
4. Tighten restore success, empty, and failure states

### Pass 2: Product confidence and PM QA

1. Run full manual Android + browser journey validation
2. Record friction and confusing copy per surface
3. Fix the highest-trust UX gaps before adding more features

### Pass 3: Product depth

1. Deepen PawPal memory and one-tap actions
2. Add richer care seriousness: follow-up states, medication history depth, vaccine metadata
3. Start refactoring the oversized app shell into clearer product boundaries

## North Star

Pawfolio should feel like a calm, dependable companion app for real dog care:

- dependable enough for schedules and health organization
- warm enough to love opening every day
- fast enough to use without friction
- smart enough to feel helpful without becoming noisy
