#!/usr/bin/env bash
set -euo pipefail

# determine-bump.sh — Determine the semver bump type for a PR based on its commits.
# Usage: determine-bump.sh <PR_NUMBER>
# In test mode, set PR_COMMITS_FILE to a file containing commits separated by "---" lines.

if [[ $# -lt 1 ]]; then
  echo "Usage: $(basename "$0") <PR_NUMBER>" >&2
  exit 1
fi

PR_NUMBER="$1"

# Read commits into an array. Each element is one full commit text (headline + body).
commits=()

if [[ -n "${PR_COMMITS_FILE:-}" ]]; then
  # Test mode: read from file. Commits separated by lines containing exactly "---".
  current=""
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "---" ]]; then
      commits+=("$current")
      current=""
    else
      if [[ -n "$current" ]]; then
        current="$current"$'\n'"$line"
      else
        current="$line"
      fi
    fi
  done <"$PR_COMMITS_FILE"
  # Capture any trailing commit not followed by ---
  if [[ -n "$current" ]]; then
    commits+=("$current")
  fi
else
  # Live mode: fetch commits from the PR via gh CLI.
  raw=""
  if ! raw=$(gh pr view "$PR_NUMBER" --json commits --jq '.commits[] | (.messageHeadline + "\n" + .messageBody + "\n---")' 2>&1); then
    echo "Error fetching PR $PR_NUMBER: $raw" >&2
    exit 1
  fi
  current=""
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "---" ]]; then
      commits+=("$current")
      current=""
    else
      if [[ -n "$current" ]]; then
        current="$current"$'\n'"$line"
      else
        current="$line"
      fi
    fi
  done <<<"$raw"
  if [[ -n "$current" ]]; then
    commits+=("$current")
  fi
fi

# If no commits were found, default to patch.
if [[ ${#commits[@]} -eq 0 ]]; then
  echo "patch"
  exit 0
fi

# Track which bump levels were triggered.
has_major=0
has_minor=0
has_patch=0
has_skip=0
has_unclassified=0

# Regex patterns (case-sensitive, POSIX ERE via grep -E).
PATTERN_BREAKING_BODY="BREAKING CHANGE"
PATTERN_BREAKING_HEADER="^[a-z]+(\([^)]+\))?!:"
PATTERN_FEAT="^feat(\([^)]+\))?:"
PATTERN_PATCH="^(fix|perf|refactor|style)(\([^)]+\))?:"
PATTERN_SKIP="^(docs|ci|chore|test|build)(\([^)]+\))?:"

for commit in "${commits[@]}"; do
  # Extract the headline (first line).
  headline="${commit%%$'\n'*}"
  # The body is everything after the first line.
  body="${commit#*$'\n'}"
  # If there was no newline, body == commit (same as headline); treat body as empty.
  if [[ "$body" == "$commit" ]]; then
    body=""
  fi

  # Rule 1: BREAKING CHANGE in body OR ! in header.
  if echo "$body" | grep -qF "$PATTERN_BREAKING_BODY" \
    || echo "$headline" | grep -qE "$PATTERN_BREAKING_HEADER"; then
    has_major=1
    continue
  fi

  # Rule 2: feat header.
  if echo "$headline" | grep -qE "$PATTERN_FEAT"; then
    has_minor=1
    continue
  fi

  # Rule 3: fix/perf/refactor/style header.
  if echo "$headline" | grep -qE "$PATTERN_PATCH"; then
    has_patch=1
    continue
  fi

  # Rule 4: docs/ci/chore/test/build header.
  if echo "$headline" | grep -qE "$PATTERN_SKIP"; then
    has_skip=1
    continue
  fi

  # Rule 5: unclassifiable.
  has_unclassified=1
done

# Apply priority: major > minor > patch > skip.
# skip only applies if ALL commits matched the skip pattern (no minor/patch/major/unclassified).
if [[ $has_major -eq 1 ]]; then
  echo "major"
elif [[ $has_minor -eq 1 ]]; then
  echo "minor"
elif [[ $has_patch -eq 1 ]]; then
  echo "patch"
elif [[ $has_skip -eq 1 && $has_unclassified -eq 0 ]]; then
  echo "skip"
else
  echo "patch"
fi
