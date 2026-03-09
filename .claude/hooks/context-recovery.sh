#!/usr/bin/env bash
# SessionStart hook — fires at every session start (including after compaction).
# Prints mandatory context recovery checklist to Claude's context window.

cat <<'BANNER'
╔══════════════════════════════════════════════════════════════╗
║          SCORES4STREAMS V2 — CONTEXT RECOVERY               ║
║                                                              ║
║  You MUST read all 5 sources below before doing any work.    ║
║  Post a proof checklist with one specific fact from each.    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. Read ARCHITECTURE.md        — system map, data flows     ║
║  2. Read MEMORY.md              — schema, files, bugs        ║
║  3. Read docs/as-built.md       — AB-001 through AB-011      ║
║  4. Read CHANGELOG.md           — releases, current version  ║
║  5. Run: gh issue list --state open --limit 50               ║
║                                                              ║
║  PROOF FORMAT (post this before starting work):              ║
║  [x] ARCHITECTURE.md — <cite one fact>                       ║
║  [x] MEMORY.md — <cite one fact>                             ║
║  [x] as-built.md — <cite one fact>                           ║
║  [x] CHANGELOG.md — <cite one fact>                          ║
║  [x] gh issues — <cite count or top issue>                   ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  PAST FAILURES (why this exists):                            ║
║  - isPitch was false for outs/hits → 30% pitch undercount   ║
║  - HBP force-advance cleared non-forced runners              ║
║  - Walk handler was FIXED (AB-004) — uses force-chain now   ║
║  - Scoring mode split was re-planned by a session that       ║
║    didn't know it was already done                           ║
╠══════════════════════════════════════════════════════════════╣
║  DEV COMMANDS:                                               ║
║  export PATH="/opt/homebrew/bin:/usr/bin:$PATH"              ║
║  npm run dev | npm run build | npm test                      ║
╚══════════════════════════════════════════════════════════════╝
BANNER

# List active worktrees so Claude knows about parallel sessions
echo ""
echo "Active worktrees:"
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null && git worktree list 2>/dev/null || echo "  (not in a git repo or git not available)"
echo ""
