# Monetization Hypotheses

> Written: 2026-03-21 | Status: UNVALIDATED
> These are hypotheses, not plans. All need testing with real users before committing.

---

## H1: Free Core, Paid Engagement Layer

**Free forever:**
- All scoring (simple, advanced, coach pitch)
- Overlay (single template)
- Basic stats (per-game)
- Team roster management
- Public scoreboard link

**Paid (team subscription):**
- Multiple overlay templates + customization (#53)
- Cross-game/season stats + leaderboards (#60, #126)
- AI features: game stories, highlights, coaching intelligence (#69, #70, #92)
- Stat export (PDF/CSV/Excel) (#75)
- Push notifications (#76)
- Discord/platform integration (#99, #107)
- Historical stat import (#128)
- Season awards (#130)

**Why this might work:** Scoring is the hook — must be free. Engagement features (stats, stories, sharing) are where people see value to pay. Follows the GameChanger model: free scoring, paid video/advanced stats.

**Why this might fail:** Teams used to GC's free tier won't pay for features GC gives away. Paid features need to be genuinely better than what's free elsewhere.

**Test question:** Would a club treasurer pay $5-10/month for season stats + AI game stories + overlay customization?

---

## H2: Free for Teams, Paid for Leagues/Associations

**Free forever (team level):**
- Everything a single team needs: scoring, overlay, stats, rosters, notifications

**Paid (league/association level):**
- League hierarchy + standings (#59)
- Cross-team leaderboards (#126)
- Tournament mode (#78)
- Umpire assignment (#142)
- Bulk scheduling (#150)
- RevSport / external integration (#83)
- Configurable league rules (#119)
- Multi-team admin dashboard
- Result submission + compliance reporting

**Why this might work:** Leagues/associations already pay for platforms (SportsEngine, ArbiterSports, Exposure Events). They have budgets. Individual teams/parents don't. Free teams drives adoption bottom-up; leagues pay for management on top.

**Why this might fail:** League admin adoption requires feature parity with existing tools. Long sales cycle. Associations are conservative.

**Test question:** Would an AU softball association pay $10-20/team/season for league management that includes live scoring/overlays? 20 teams = $200-400/season.

---

## H3: Free Product, Paid Services

**Free forever:** The entire product — all features, all personas

**Revenue from services:**
- Tournament streaming packages: camera + overlay setup — $500-2000/event
- Integration/customisation for associations — $1000-5000/engagement
- Sponsored overlays: local businesses pay for logo on overlay — $50-200/season
- Data/API access: aggregated anonymised stats for scouting/equipment companies

**Why this might work:** The product is the moat — free drives maximum adoption. Revenue from high-value services. Streaming packages are an existing market (SidelineHD charges for this).

**Why this might fail:** Services don't scale. Trading time for money. Tournament streaming is seasonal and geographically constrained.

**Test question:** Would a tournament director pay $500 for turnkey streaming with live overlays for a 20-team weekend tournament?

---

## H4: Freemium with Premium Family Features

**Free:** Scoring, overlay, basic stats, team management

**Premium (individual/family — $3-5/month):**
- Player profile + career stats (#68)
- AI game stories about your player (#69)
- Personal highlight notifications (#104)
- Achievement badges + milestone tracking (#123, #124)
- Shareable stat cards (#127)
- Video clip tagging when available (#73)

**Why this might work:** Parents will pay for their kid's career to be tracked and celebrated. Low price point, high volume.

**Why this might fail:** Parents have GC for free. Premium features need to be meaningfully better. Small market per team (2-5 paying parents per team).

**Test question:** Would a parent pay $3/month for "Jake hit a double! Here's his season stats card" pushed to their phone?

---

## Recommended Combination: H1 + H2 + H4

```
FREE FOREVER:
├── All scoring modes
├── Single overlay template
├── Per-game stats
├── Team roster
├── Public scoreboard
└── Basic notifications

TEAM PREMIUM ($10-15/month or $80-100/season):
├── Multiple overlay templates + customization
├── Season stats + leaderboards
├── AI game stories + highlights
├── Stat export (PDF/CSV)
├── Discord + platform integrations
├── Historical stat import
└── Season awards

FAMILY PREMIUM ($3-5/month):
├── Player career profile
├── Personal highlight notifications
├── Achievement badges + milestones
├── Shareable stat cards
└── AI stories about your player

LEAGUE/ASSOCIATION (per-team-per-season pricing):
├── League hierarchy + standings
├── Tournament mode
├── Umpire management
├── Bulk scheduling
├── External integrations (RevSport)
├── Compliance reporting
└── Custom branding
```

---

## Validation Plan

| Hypothesis | How to Test | When |
|-----------|-------------|------|
| H1 (paid engagement) | Offer free scoring to 5 clubs, survey willingness-to-pay for stats/AI | After MVP with 5+ clubs using it |
| H2 (paid leagues) | Pitch to 1-2 AU softball associations | After single-club product is solid |
| H3 (paid services) | Offer tournament streaming at 1-2 events | Anytime — doesn't require product maturity |
| H4 (family premium) | Add "coming soon" premium badge to player stats, measure interest clicks | After player profiles exist |
