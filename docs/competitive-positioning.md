# Competitive Positioning Hypotheses

> Written: 2026-03-21 | Status: UNVALIDATED
> These are hypotheses about how to position S4S vs competitors. Need market testing.

---

## Competitive Landscape (Corrected)

| Product | Scoring | Overlay | Streaming | Stats | Market |
|---------|---------|---------|-----------|-------|--------|
| **GameChanger** | Easy, parent-friendly app | On their recorded video only (not OBS) | Text "GameStream" only (no live video) | Good, per-team-per-season | US dominant, 500K+ downloads |
| **iScore** | Deepest (500+ stats, spray charts) | None — partners with SidelineHD | None native | Best in class | Niche: serious scorers. Dominant in AU softball |
| **SidelineHD** | sidelineSCORE or imports from iScore/GC | Yes — driven by scoring data | Yes — to YouTube/Facebook | Via scoring partner | Streaming-first. Uses Mevo + other cameras (not proprietary hardware) |
| **S4S** | Web-based, Simple + Advanced + Coach Pitch | Standalone browser URL for OBS | Via OBS (any platform) | Per-game from events, growing | Pre-launch. AU softball first. |

---

## Positioning Hypotheses

### H1: "Works With What You Already Use"

Don't force teams to switch. S4S works alongside iScore (#84) and GameChanger (#77). Keep your scorer — add our overlay and engagement layer.

**Rationale:** Biggest adoption barrier is "we already use GC/iScore." SidelineHD proved the complement-don't-replace model works.

**Message:** "Keep scoring in iScore. Add S4S for streaming, overlays, and fan engagement."

**Test with:** AU softball clubs already using iScore.

**Risk:** If iScore changes their data feed or competes on overlays, we lose the integration advantage.

### H2: "Global-First, Not US-First"

Built for the world, not just the US. Geography-aware seasons, date formats, rule sets. Works with AU associations (RevSport), understands southern hemisphere.

**Rationale:** Every other app was built in/for the US and awkwardly adapted. GC's "Fall Ball" and MM/DD/YYYY are meaningless in Australia. Building for AU first means internationalisation is in the DNA.

**Message:** "Finally a scoring platform that knows your season is October to March."

**Test with:** AU softball associations frustrated with US-centric tools.

**Risk:** AU market is small. Global-first is a feature, not a market. Need to prove AU adoption before claiming global positioning.

### H3: "Scoring to Streaming in 60 Seconds"

The fastest path from "I'm at the field" to "everyone can watch." No app install, no signup, no hardware lock-in.

**Rationale:** Guest scoring (#85) + quick setup (#86) + PWA (#132) + public scoreboard (#55) = lowest friction. SidelineHD needs camera setup. GC needs account + app install. We need a browser.

**Message:** "Share live scores with the other parents in 60 seconds."

**Test with:** Parent volunteers at casual games.

**Risk:** "No install" is a feature, not a reason to switch from an app they already have installed. Only works for new users, not switching users.

### H4: "Your Kid's Baseball Career, Tracked"

S4S is the home for your player's career — stats, milestones, highlights, and stories across every team and season. Not just a scoring app, but a player development platform.

**Rationale:** Player identity across teams (#58) + career stats (#60) + milestones (#123) + AI stories (#69) is something no competitor does well. GC stats are per-team-per-season. iScore is per-device. Neither tracks a player across their whole journey.

**Message:** "One profile for Jake across club, state, and national teams."

**Test with:** Parents of competitive travel ball players on 2-3 teams.

**Risk:** Needs many games of data before career tracking is valuable. Chicken-and-egg: need adoption to get data, need data to demonstrate value.

---

## Positioning by Persona

| Persona | Lead Message | Competing With |
|---------|-------------|----------------|
| **Parent Volunteer** | "Score a game in 60 seconds — no app, no signup" | GameChanger (app install + signup required) |
| **Dedicated Scorer** | "Works with iScore. Better overlays. Better sharing." | iScore alone (no overlay), SidelineHD (hardware) |
| **Coach** | "Player stats, game stories, scouting reports — automatic" | Spreadsheets, manual stat tracking |
| **Team Admin** | "Free team management. Pay when you want league features." | TeamSnap (paid), spreadsheets |
| **Friends & Family** | "Follow Jake's game live from anywhere" | GameChanger GameStream (text only) |
| **League Admin** | "The platform your clubs already use — now with league management" | SportsEngine (expensive), spreadsheets |
| **Streaming Operator** | "Professional overlays. Any camera. Any platform." | SidelineHD (camera-specific ecosystem) |

---

## Go-to-Market Hypotheses

### Phase 1: Prove It Works (Current → 5 clubs)
- Target: 3-5 AU softball clubs the user has direct access to
- Offer: free scoring + overlay for a season
- Goal: validate scoring UX, overlay quality, and basic engagement
- Measure: games scored, overlay usage, qualitative feedback

### Phase 2: AU Softball Niche (5 → 50 clubs)
- Target: AU softball associations (via RevSport integration + word of mouth)
- Offer: free scoring + team features, iScore integration for existing scorers
- Message: H2 (global-first) + H1 (works with iScore)
- Goal: validate league-level demand and willingness-to-pay
- Measure: club adoption rate, association interest, feature requests

### Phase 3: Expand Features (50 → 500 clubs)
- Add: AI features, advanced stats, family premium
- Start: monetization testing (team premium, family premium)
- Message: H4 (career tracking) + H3 (60-second scoring)
- Goal: find product-market fit and pricing
- Measure: conversion to paid, retention, NPS

### Phase 4: New Markets
- US travel ball (complement GC), NZ softball, UK baseball
- Cricket exploration (#97)
- Tournament streaming services (H3 from monetization)

---

## What We Don't Know Yet

1. Will AU clubs actually switch from or complement iScore?
2. Is the overlay quality good enough for serious streamers?
3. Do parent volunteers find S4S easier than GC?
4. Will anyone pay for family premium features?
5. Can we integrate with iScoreCast reliably?
6. Is there league-level budget for our product?
7. Does the "no install" advantage matter in practice?

These are the questions the first 5 clubs will answer.
