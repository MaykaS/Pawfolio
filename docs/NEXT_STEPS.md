# Next Steps

## Immediate Priorities

### 1. Finish care proof confidence

- validate health document flows end to end:
  - upload
  - search
  - open
  - download
  - restore
- keep proof clearly tied to the right care record
- make sure certificates and visit summaries are fast to find under real-life pressure

### 2. Finish Google Calendar confidence

- validate create, update, and delete flows end to end
- confirm sync feedback is always clear
- keep time zone handling calm and predictable
- tighten any remaining "connected but did it actually sync?" ambiguity

### 3. Keep hardening backup and restore trust

- keep re-testing fresh-browser and recovery flows
- validate photo restore on realistic second-device/browser paths
- validate health document restore on realistic second-device/browser paths
- keep restore success, empty, and failure outcomes unmistakable as the product surface evolves

### 4. Continue codebase cleanup where it reduces risk

- keep decomposing `App.tsx`
- preserve the trust layer as a clear subsystem
- add tests around high-risk product flows, not vanity coverage

### 5. Keep notification and calendar confidence calm

- keep the scheduled notification story aligned with what the product actually does
- keep Google Calendar sync feeling like a normal external planning surface
- avoid hidden or implied state when the app can show a concrete result instead

### 6. Deepen care seriousness

- stronger medication and follow-up detail
- clearer health-history and proof states
- more confidence that records are useful over time, not just on entry day

## Secondary Priorities

### 7. Refine PawPal carefully

- keep PawPal anchored as a care coordinator
- improve memory of unresolved proof and follow-up gaps
- sharpen one-tap actions that move records toward completeness
- keep PawPal feeling useful, not chatty

### 8. Prepare the next cloud layer

- decide when snapshot backup has earned a move toward more normalized cloud structures
- do not widen architecture before the current trust model is fully comfortable

## Explicitly Deferred

- email reminders
- multi-pet
- shared caregivers
- LLM-backed PawPal
- native mobile rewrite

These remain real future options, but they are not the best use of attention right now.
