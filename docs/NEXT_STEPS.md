# Next Steps

## Immediate Priorities

### 1. Finish Google Calendar confidence

- validate create, update, and delete flows end to end
- confirm sync feedback is always clear
- keep time zone handling calm and predictable
- tighten any remaining “connected but did it actually sync?” ambiguity

### 2. Keep hardening backup and restore trust

- keep re-testing fresh-browser and recovery flows
- validate photo restore on realistic second-device/browser paths
- keep restore success, empty, and failure outcomes unmistakable as the product surface evolves

### 3. Continue codebase cleanup where it reduces risk

- keep decomposing `App.tsx`
- preserve the trust layer as a clear subsystem
- add tests around high-risk product flows, not vanity coverage

### 4. Keep notification and calendar confidence calm

- keep the scheduled notification story aligned with what the product actually does
- keep Google Calendar sync feeling like a normal external planning surface
- avoid hidden or implied state when the app can show a concrete result instead

### 5. Deepen care seriousness

- stronger medication and follow-up detail
- clearer health-history states
- more confidence that records are useful over time, not just on entry day

## Secondary Priorities

### 6. Refine PawPal carefully

- improve memory of recent patterns
- sharpen one-tap actions
- keep PawPal feeling useful, not chatty

### 7. Prepare the next cloud layer

- decide when snapshot backup has earned a move toward more normalized cloud structures
- do not widen architecture before the current trust model is fully comfortable

## Explicitly Deferred

- email reminders
- multi-pet
- shared caregivers
- LLM-backed PawPal
- native mobile rewrite

These remain real future options, but they are not the best use of attention right now.
