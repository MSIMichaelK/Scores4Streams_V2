#!/bin/bash
set -euo pipefail

input=$(cat)
command=$(echo "$input" | python3 -c \
  "import sys,json; print(json.load(sys.stdin).get('command',''))" 2>/dev/null || echo "")

if [[ "$command" != *"git tag"* ]]; then exit 0; fi

ERRORS=()
branch=$(git branch --show-current 2>/dev/null || echo "")

# -- Must be on main --------------------------------------------------------------
if [ "$branch" != "main" ]; then
  ERRORS+=("Releases must be tagged from main (currently on '$branch')")
fi

# -- No unassembled fragments -----------------------------------------------------
fragments=$(find .changelog -name "*.md" -not -name "README.md" \
  2>/dev/null | wc -l | tr -d ' ')
if [ "$fragments" -gt 0 ]; then
  fragment_list=$(find .changelog -name "*.md" -not -name "README.md" \
    2>/dev/null | xargs -I{} basename {} | tr '\n' ' ')
  ERRORS+=("Unassembled fragments remain: $fragment_list")
  ERRORS+=("  -> Assemble into CHANGELOG.md and delete fragments before tagging")
fi

# -- Extract tag version ----------------------------------------------------------
tag_version=$(echo "$command" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "")

if [ -n "$tag_version" ]; then
  # CHANGELOG must contain this version
  if ! grep -q "\[$tag_version\]" CHANGELOG.md 2>/dev/null; then
    ERRORS+=("CHANGELOG.md has no entry for $tag_version")
  fi

  # Check all version files listed in .claude/version-files
  if [ -f ".claude/version-files" ]; then
    while IFS= read -r vfile || [ -n "$vfile" ]; do
      [ -z "$vfile" ] && continue
      [ "${vfile:0:1}" = "#" ] && continue
      if [ -f "$vfile" ]; then
        file_ver=$(grep -oE '[0-9]+\.[0-9]+\.[0-9]+' "$vfile" 2>/dev/null | head -1 || echo "")
        if [ -n "$file_ver" ] && [ "$file_ver" != "${tag_version#v}" ] && \
           [ "v$file_ver" != "$tag_version" ]; then
          ERRORS+=("$vfile version ($file_ver) does not match tag ($tag_version)")
        fi
      else
        ERRORS+=("Version file not found: $vfile")
      fi
    done < ".claude/version-files"
  fi

  # Check user-docs if active
  if [ -f ".claude/release-artifacts" ]; then
    user_docs=$(grep "^user-docs:" .claude/release-artifacts | \
      grep -v "false" | cut -d: -f2- | tr -d ' ' || echo "")
    if [ -n "$user_docs" ]; then
      doc_file=$(echo "$user_docs" | cut -d: -f1)
      if [ -f "$doc_file" ]; then
        changed=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -c "$doc_file" || echo 0)
        if [ "$changed" -eq 0 ]; then
          ERRORS+=("User docs ($doc_file) not updated — required release artifact")
          ERRORS+=("  -> Update before tagging, or set user-docs: false if not applicable")
        fi
      fi
    fi
  fi
fi

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""; echo "RELEASE BLOCKED"; echo "==============="
  for err in "${ERRORS[@]}"; do echo "  x $err"; done
  echo ""; exit 2
fi

exit 0
