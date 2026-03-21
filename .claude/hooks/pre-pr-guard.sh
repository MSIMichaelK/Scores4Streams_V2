#!/bin/bash
set -euo pipefail

input=$(cat)
command=$(echo "$input" | python3 -c \
  "import sys,json; print(json.load(sys.stdin).get('command',''))" 2>/dev/null || echo "")

if [[ "$command" != *"gh pr create"* ]]; then exit 0; fi

MODE=$(cat .claude/workflow-mode 2>/dev/null || echo "worktree")
ERRORS=()
branch=$(git branch --show-current 2>/dev/null || echo "")

if [ "$MODE" = "worktree" ] && [ "$branch" = "main" ]; then
  ERRORS+=("Cannot create PR from main — PRs must come from a worktree branch")
fi

# Chore branches skip issue-matching checks
is_chore=false
if [[ "$branch" == chore/* ]] || [[ "$branch" == chore-* ]]; then
  is_chore=true
fi

if [ "$is_chore" = false ]; then
  issue_num=$(echo "$branch" | grep -oE '[0-9]+' | head -1 || echo "")
  if [ -n "$issue_num" ]; then
    fragment=$(find .changelog -name "${issue_num}-*.md" 2>/dev/null | head -1)
    if [ -z "$fragment" ]; then
      ERRORS+=("No changelog fragment for issue #${issue_num}")
      ERRORS+=("  -> Write .changelog/${issue_num}-<slug>.md before creating PR")
    elif [ ! -s "$fragment" ]; then
      ERRORS+=("Changelog fragment '$fragment' is empty")
    fi
  fi
else
  # Chore branches still need a fragment, just not issue-matched
  fragments_any=$(find .changelog -name "*.md" -not -name "README.md" \
    2>/dev/null | wc -l | tr -d ' ')
  if [ "$fragments_any" -eq 0 ]; then
    ERRORS+=("No changelog fragment found — write .changelog/0-chore-<slug>.md")
  fi
fi

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""; echo "PR CREATION BLOCKED"; echo "==================="
  for err in "${ERRORS[@]}"; do echo "  x $err"; done
  echo ""; exit 2
fi

exit 0
