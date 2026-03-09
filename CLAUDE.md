# Scores4Streams V2 — Session Rules

> This file is auto-loaded at session start. A SessionStart hook enforces context recovery.

## Mandatory Context Recovery

**Before doing ANY work**, read these files and commands in order. No exceptions — not even for "quick fixes."

1. **`ARCHITECTURE.md`** — system diagram, file structure, data flows
2. **`MEMORY.md`** — Firebase config, Firestore schema, key files, known bugs
3. **`docs/as-built.md`** — design decisions (AB-001 through AB-011). Read ALL of them.
4. **`CHANGELOG.md`** — what has been released, current version
5. **`gh issue list --state open --limit 50`** — current priorities and open work

### Proof Checklist

After reading, post a checklist citing ONE specific fact from each file to prove you read it:

```
[x] ARCHITECTURE.md — dual-write: aggregate to games/{id}, events to games/{id}/events
[x] MEMORY.md — Firebase project: scores4streams-v2, region us-central1
[x] as-built.md — AB-004: walk handler has pre-existing force-advance bug, HBP is fixed
[x] CHANGELOG.md — current version: 0.5.0
[x] gh issues — N open issues
```

### Why This Is Non-Negotiable

Context gets lost across sessions and compactions. Real incidents from this project:
- **isPitch regression:** Pitch count was ~30% too low because outs/hits weren't counting as pitches. Fixed in AB-003 but nearly re-broken in a later session.
- **HBP force-advance bug:** First implementation cleared non-forced runners. Fixed, but the walk handler STILL has the same bug (AB-004).
- **Duplicate work:** Scoring mode split was partially re-planned in a session that didn't know it was already done.
- **Test data contradictions:** A session tried to change strikeout counts without reading the Drillers test — the count was correct (7, not 6).

## Critical Facts (Pre-Digested)

These are the facts most likely to cause regressions if forgotten:

### Scoring Engine
- **isPitch: true** for ALL ball-in-play events: out, hit, error, hbp, fc, sac_fly (AB-003)
- **Force-advance (HBP):** Only runners in continuous chain from 1st are forced (AB-004)
- **Force-advance (walk):** BUGGY — uses simplified logic, not yet fixed (AB-004)
- **Error = single-equivalent advancement** + manual adjustments (AB-005)
- **DP = 2x out** — overcounts 1 pitch per DP (AB-006)
- **FC always records an out** — FC-without-out can't be modeled (AB-007)
- **Sac fly only scores from 3rd** — manual adjust for tag-ups from 2nd (AB-009)

### Data Model
- **Dual-write pattern:** aggregate state + event subcollection, never merge them (AB-001)
- **Pending event queue:** recordEvent BEFORE state changes, commitEvents AFTER (AB-002)
- **Soft-delete undo:** `undone: true` flag, preserves audit trail (AB-011)
- **scoringMode:** `"simple"` (default) or `"advanced"` on game doc (AB-008)

### Modes
- **Simple mode:** Ball/Strike/Foul/Out + Hits + toggles + score +/- + undo/redo
- **Advanced mode:** All of Simple + E/HBP/FC/SAC (future: player tracking, scorebook)
- New Advanced-mode-only features MUST be gated behind `scoringMode === "advanced"`

## Development Commands

```bash
export PATH="/opt/homebrew/bin:/usr/bin:$PATH"   # Required before npm commands
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
npm test             # Run Jest tests (4 suites, 32 tests)
```

## Common Mistakes to Avoid

1. **Don't skip context recovery** — even for "one quick change." That's how regressions happen.
2. **Don't change isPitch without updating test expectations** — pitch counts are verified against real GameChanger data.
3. **Don't add complexity to Simple mode** — its value is being lean. Gate new features behind Advanced mode.
4. **Don't merge aggregate state and events** — they serve different consumers (overlay vs stats).
5. **Don't call recordEvent after state changes** — countBefore will be wrong. Always call BEFORE.
6. **Don't assume walk force-advance is correct** — it has a known bug (AB-004). Test any changes.
7. **Don't model edge cases in actions** — use manual adjustments (toggles, score +/-) for uncommon plays. See AB-005, AB-007, AB-009.
8. **Don't forget to bump version in MEMORY.md and CHANGELOG.md** when releasing.
9. **Don't push directly to main from a worktree** — create a PR via `gh pr create`.
10. **Keep responses short** — this project hits the 32K output token limit. Break up large changes across multiple responses.

## Worktree Workflow

All feature work happens in worktrees, never directly on `main`.

- **Create:** `claude -w issue-N-slug` (named) or click "+ New session" in Desktop
- **Active worktrees** live at `.claude/worktrees/` (gitignored)
- **Each worktree** gets its own branch and version bump
- **Merge** via `gh pr create` to `main`
- **See** `.claude/worktree-prompt-template.md` for how to start a new session

## Documentation Map

| Document | Purpose | When to Read |
|----------|---------|-------------|
| `CLAUDE.md` | Session rules, enforcement, common mistakes | Every session start (this file) |
| `ARCHITECTURE.md` | System map, data flow, file structure | Understanding what exists |
| `MEMORY.md` | Quick lookup: schema, files, bugs, versions | Need a specific name or value |
| `docs/as-built.md` | Design decisions, what was tried/rejected | Before changing scoring logic or data model |
| `CHANGELOG.md` | Release history | Before version bumping |
| `src/Doco/Requirements.md` | Original requirements spec | Planned features and roadmap |
| `src/Doco/Data Model.md` | Planned statistics models | Building stats computation layer |
