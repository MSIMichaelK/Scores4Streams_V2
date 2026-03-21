#!/bin/bash
set -euo pipefail

input=$(cat)
command=$(echo "$input" | python3 -c \
  "import sys,json; print(json.load(sys.stdin).get('command',''))" 2>/dev/null || echo "")

if [[ "$command" != *"git commit"* ]]; then
  exit 0
fi

MODE=$(cat .claude/workflow-mode 2>/dev/null || echo "worktree")
ERRORS=()
branch=$(git branch --show-current 2>/dev/null || echo "")

# -- Chore branch exception ----------------------------------------------------
is_chore=false
if [[ "$branch" == chore/* ]] || [[ "$branch" == chore-* ]]; then
  is_chore=true
fi

# -- Check 1: not committing to main (worktree mode only) ----------------------
if [ "$MODE" = "worktree" ] && [ "$branch" = "main" ]; then
  ERRORS+=("On main branch — feature work must be in a worktree")
  ERRORS+=("  -> Create one with: claude -w issue-N-slug")
fi

# -- Check 2: not behind origin/main -------------------------------------------
if [ "$branch" != "main" ]; then
  git fetch origin main --quiet 2>/dev/null || true
  behind=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo 0)
  if [ "$behind" -gt 0 ]; then
    ERRORS+=("Branch is $behind commit(s) behind origin/main")
    ERRORS+=("  -> Run: git rebase origin/main")
  fi
fi

# -- Check 3: changelog fragment exists -----------------------------------------
fragments_any=$(find .changelog -name "*.md" -not -name "README.md" \
  2>/dev/null | wc -l | tr -d ' ')
if [ "$fragments_any" -eq 0 ]; then
  ERRORS+=("No changelog fragment found in .changelog/")
  if [ "$is_chore" = true ]; then
    ERRORS+=("  -> Write .changelog/0-chore-<slug>.md before committing")
  else
    ERRORS+=("  -> Write .changelog/<issue>-<slug>.md before committing")
  fi
fi

# -- Check 4 + 5: fragment matches issue, issue exists and is open ---------------
if [ "$is_chore" = false ]; then
  issue_num=$(echo "$branch" | grep -oE '[0-9]+' | head -1 || echo "")

  if [ -n "$issue_num" ]; then
    if [ "$fragments_any" -gt 0 ] && [ "$MODE" = "worktree" ]; then
      matching=$(find .changelog -name "${issue_num}-*.md" 2>/dev/null | wc -l | tr -d ' ')
      if [ "$matching" -eq 0 ]; then
        existing=$(find .changelog -name "*.md" -not -name "README.md" \
          2>/dev/null | xargs -I{} basename {} | tr '\n' ' ')
        ERRORS+=("No fragment matching issue #${issue_num} for branch '$branch'")
        ERRORS+=("  -> Expected: .changelog/${issue_num}-<slug>.md")
        ERRORS+=("  -> Found: ${existing:-none}")
      fi
    fi

    issue_state=$(gh issue view "$issue_num" --json state \
      --jq '.state' 2>/dev/null || echo "NOT_FOUND")
    if [ "$issue_state" = "NOT_FOUND" ]; then
      ERRORS+=("GitHub issue #${issue_num} not found")
      ERRORS+=("  -> Create it first: gh issue create")
    elif [ "$issue_state" = "CLOSED" ]; then
      ERRORS+=("GitHub issue #${issue_num} is already closed")
      ERRORS+=("  -> Reopen it or create a new issue for this work")
    fi
  fi
fi

# -- Result ---------------------------------------------------------------------
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""; echo "COMMIT BLOCKED"; echo "=============="
  for err in "${ERRORS[@]}"; do echo "  x $err"; done
  echo ""; exit 2
fi

exit 0
