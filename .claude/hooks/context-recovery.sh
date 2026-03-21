#!/usr/bin/env bash
# SessionStart hook — fires at every session start (including after compaction).
# Reads Tier 2 file list from .claude/context-files and prints mandatory checklist.

TRIGGER="${SESSION_TRIGGER:-startup}"
MODE=$(cat .claude/workflow-mode 2>/dev/null || echo "main")
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"

cat <<'BANNER'
+==============================================================+
|          SCORES4STREAMS V2 — CONTEXT RECOVERY                 |
|                                                               |
|  You MUST read all sources below before doing any work.       |
|  Post a proof checklist with one specific fact from each.     |
+==============================================================+
BANNER

echo ""
echo "Trigger: $TRIGGER | Mode: $MODE"
echo ""

# -- Tier 2: read context-files list -------------------------------------------
if [ -f "$PROJECT_DIR/.claude/context-files" ]; then
  echo "Read ALL of the following before doing any work:"
  echo ""
  while IFS= read -r line || [ -n "$line" ]; do
    [ -z "$line" ] && continue
    [ "${line:0:1}" = "#" ] && continue
    if [ "$line" = "gh-issues" ]; then
      echo "  - gh issue list --state open --limit 50"
    else
      echo "  - $line"
    fi
  done < "$PROJECT_DIR/.claude/context-files"
else
  echo "Read ALL of the following before doing any work:"
  echo ""
  echo "  - ARCHITECTURE.md        — system map, data flows"
  echo "  - MEMORY.md              — schema, files, bugs"
  echo "  - docs/as-built.md       — AB-001 through AB-011"
  echo "  - CHANGELOG.md           — releases, current version"
  echo "  - gh issue list --state open --limit 50"
fi

echo ""
echo "Post Tier 2 proof checklist with one fact from each file."
echo ""

# -- Past failures (why this exists) --------------------------------------------
cat <<'FAILURES'
------------------------------------------------------------
PAST FAILURES (why this exists):
  - isPitch was false for outs/hits -> 30% pitch undercount
  - HBP force-advance cleared non-forced runners
  - Walk handler was FIXED (AB-004) — uses force-chain now
  - Scoring mode split was re-planned by a session that
    didn't know it was already done
  - Worktree divergence (#41, #46) — work on main unless
    explicitly asked for parallel work
------------------------------------------------------------
FAILURES

# -- Dev commands ---------------------------------------------------------------
cat <<'DEVCMDS'
DEV COMMANDS:
  export PATH="/opt/homebrew/bin:/usr/bin:$PATH"
  npm run dev | npm run build | npm test
------------------------------------------------------------
DEVCMDS

# -- Branch status --------------------------------------------------------------
echo ""
echo "Current branch:"
cd "$PROJECT_DIR" 2>/dev/null && git branch --show-current 2>/dev/null || echo "  (not in a git repo)"
echo ""
echo "Active branches with unpushed work:"
cd "$PROJECT_DIR" 2>/dev/null && git branch -v 2>/dev/null | head -10 || true
echo ""

# -- Tier 3 hint from branch name ----------------------------------------------
branch=$(cd "$PROJECT_DIR" 2>/dev/null && git branch --show-current 2>/dev/null || echo "")
if [ -d "$PROJECT_DIR/.claude/skills" ] && [ -n "$branch" ] && [ "$branch" != "main" ]; then
  branch_words=$(echo "$branch" | tr '-' '\n' | tr '_' '\n')
  for skill in "$PROJECT_DIR"/.claude/skills/*.md; do
    [ -f "$skill" ] || continue
    for word in $branch_words; do
      [ ${#word} -lt 4 ] && continue
      if grep -qi "$word" "$skill" 2>/dev/null; then
        echo "Suggested Tier 3 skill for this branch: $skill"
        break 2
      fi
    done
  done
  echo ""
fi

# -- Active worktrees -----------------------------------------------------------
echo "Active worktrees:"
cd "$PROJECT_DIR" 2>/dev/null && git worktree list 2>/dev/null || echo "  (not in a git repo or git not available)"
echo ""

if [ "$TRIGGER" = "compact" ]; then
  echo "WARNING: Context was compacted. CLAUDE.md was re-injected automatically."
  echo "    Still re-read all Tier 2 files listed above."
  echo "    Re-load Tier 3 skill for whatever task was in progress."
  echo ""
fi

exit 0
