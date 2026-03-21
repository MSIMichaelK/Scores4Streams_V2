# Findings — Scores4Streams V2

> Permanent operational gotcha register. Things that fail in non-obvious ways.
> Never deleted. Append-only. Read before making changes in the affected area.

---

## F-001: isPitch must be true for all ball-in-play events

**Discovered:** 2026-03-09 | **Project area:** Scoring engine

**What happens:** If `isPitch` is false for outs, hits, errors, HBP, FC, or sac fly, pitch counts are ~30% too low. The pitch count is derived from events where `isPitch: true`.

**Rule:** Every ball-in-play event type (out, hit, error, hbp, fc, sac_fly) must set `isPitch: true`. Regression tests in `gameReplayDrillers.test.js` verify pitch counts against real GameChanger data.

**Context:** AB-003. Nearly re-broken in a later session that didn't read as-built.md.

---

## F-002: Worktree branch divergence

**Discovered:** 2026-03-13 | **Project area:** Workflow

**What happens:** Worktrees in this project have caused branch divergence, stale deploys, and lost changes. Issues #41 and #46 document the incidents.

**Rule:** Work directly on main. Do NOT create worktrees unless explicitly asked for parallel work. If a worktree exists from a previous session, merge or delete it first.

**Context:** Project-specific — this is why workflow-mode is `main`, not `worktree`.

---

## F-003: Test data pitch counts are correct — don't "fix" them

**Discovered:** 2026-03-10 | **Project area:** Test suites

**What happens:** A session tried to change strikeout counts in the Drillers test from 7 to 6, assuming the test was wrong. The count was correct — 7 strikeouts verified against real GameChanger data.

**Rule:** Never change test expectations without verifying against the source data. The game replay tests use real games — their numbers are authoritative.

**Context:** Drillers vs Chiefs test (`gameReplayDrillers.test.js`).
