# Roadmap — Path to Testable MVP

> Written: 2026-03-21 | Status: ACTIVE
> Target testers: 3 experienced scorers (Michael + 2 friends: GC user, GC+iScore user)
> Test window: AU winter ball season (Apr-Sep 2026)

---

## Test Profile

| Factor | Detail |
|--------|--------|
| **Testers** | 3 experienced scorers (GC and iScore users) |
| **Phase 1** | Replay games from video/scorebook |
| **Phase 2** | Live adult winter ball games |
| **Overlay** | Michael tests independently (OBS) |
| **Benchmark** | GC and iScore workflow — must be as good or better, never worse |
| **Success** | Full game scored, stats correct, overlay in sync, shareable link works |
| **Failure** | Can't score a full game, major workflow regression vs GC/iScore, data loss |

---

## v2.3 — Fix & Polish (Pre-Test)

Get the house in order before testers touch it.

| # | Issue | Category |
|---|-------|----------|
| 47 | Stale worktree dirs cause phantom test failures | Housekeeping |
| 48 | Jest config picks up Playwright E2E specs | Housekeeping |
| 39 | Settings page: raw team ID, no roles, failed roster | Bug |
| 43 | Fielder circles overlap base click targets | Bug |
| 51 | SettingsPage version hardcoded to 2.0.0 | Bug |
| 44 | datetime-local input unreliable | Bug |
| 34 | UI/UX scoring screen tweaks | Polish |

**Estimate:** These are all bug fixes and housekeeping. No new features.

---

## v3.0 — Testable MVP

New features needed for scorer testing.

| # | Issue | Why |
|---|-------|-----|
| 55 | Public scoreboard viewer | Share with someone not at the field |
| 75 | Game data export (CSV minimum) | Compare output against GC/iScore |
| 36 | Opposition roster system | iScore friend expects both lineups |
| 132 | PWA setup (service worker, manifest) | Add to home screen, basic offline |
| 136 | Keyboard shortcuts (B/S/O/F) | Tablet scorer experience |
| 117 | Post-game scoring corrections | Testers will find mistakes after game ends |

**Prerequisite:** v2.3 must be complete first.

---

## v3.1+ — Post-Test Iteration

Cannot plan until we have tester feedback. Likely candidates based on tester profiles:

- Scoring flow improvements (based on friction observed during testing)
- Missing play types or workflow gaps vs GC/iScore
- Overlay improvements
- Stats accuracy fixes
- iScore data feed integration (#84) if the iScore friend wants to test the complement model

---

## What's Explicitly Out of MVP

| Category | Issues | Rationale |
|----------|--------|-----------|
| Onboarding | #85, #86, #87, #88 | Testers are experienced, don't need onboarding |
| iScore integration | #84 | Test direct scoring first |
| AI features | #69, #89, #90, #91, #92, #93 | Post-validation |
| Player identity | #58, #61, #62, #71 | Post-validation |
| League hierarchy | #59, #78 | Post-validation |
| Notifications | #76, #98-#107 | Post-validation |
| Apple Watch | #94, #95, #96 | Post-validation |
| Gamification | #123-#130 | Post-validation |
| Communication | #98-#107 | Post-validation |
| Scheduling | #150-#152 | Post-validation |
| Coach pitch | #120 | Adult winter ball doesn't need it |
| Internationalisation | #138 | Important but not blocking for AU testers |

---

## Dependency Order (v3.0)

```
v2.3 (all bugs fixed)
  │
  ├── #132 PWA setup (independent)
  ├── #136 Keyboard shortcuts (independent)
  ├── #36 Opposition roster (independent)
  │
  ├── #55 Public scoreboard (independent)
  │
  ├── #75 Data export (needs statsEngine — already exists)
  │
  └── #117 Post-game corrections (needs undo system understanding)
```

All v3.0 items are independent of each other — can be built in parallel.

---

## Validation Questions for Testers

After each test game, ask:

1. What couldn't you score? (missing play types or workflow gaps)
2. What took too many taps? (flow friction)
3. What confused you? (UI/UX issues)
4. Did the stats match what you'd expect from GC/iScore?
5. Did the overlay stay in sync?
6. Would you use this for a real game? What's missing?
7. What did you like better than GC/iScore?
