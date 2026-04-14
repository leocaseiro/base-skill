#!/usr/bin/env bash
set -euo pipefail

# check-no-master-push.test.sh — Tests for check-no-master-push.sh
# Run from repo root:    bash scripts/check-no-master-push.test.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GUARD_SCRIPT="$SCRIPT_DIR/check-no-master-push.sh"

if command -v tput &>/dev/null && tput colors &>/dev/null && [[ "$(tput colors)" -ge 8 ]]; then
  GREEN="$(tput setaf 2)"
  RED="$(tput setaf 1)"
  RESET="$(tput sgr0)"
else
  GREEN=""
  RED=""
  RESET=""
fi

TMPDIR_TESTS="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_TESTS"' EXIT

pass=0
fail=0

# run_test <description> <fixture_content> <expected_exit_code>
run_test() {
  local description="$1"
  local fixture_content="$2"
  local expected_exit="$3"

  local fixture_dir
  fixture_dir="$TMPDIR_TESTS/$(date +%s%N)_$RANDOM"
  mkdir -p "$fixture_dir/.github/workflows"
  printf '%s' "$fixture_content" >"$fixture_dir/.github/workflows/test.yml"

  local exit_code=0
  (cd "$fixture_dir" && bash "$GUARD_SCRIPT" >/dev/null 2>&1) || exit_code=$?

  if [[ "$exit_code" == "$expected_exit" ]]; then
    echo "${GREEN}PASS${RESET} — $description"
    pass=$((pass + 1))
  else
    echo "${RED}FAIL${RESET} — $description (expected exit $expected_exit, got $exit_code)"
    fail=$((fail + 1))
  fi
}

run_test \
  "detects direct push to master" \
  'jobs:
  deploy:
    steps:
      - run: git push origin master --follow-tags' \
  1

run_test \
  "detects direct push to master with HEAD:master refspec" \
  'jobs:
  deploy:
    steps:
      - run: git push origin HEAD:master' \
  1

run_test \
  "allows push to a release branch" \
  'jobs:
  deploy:
    steps:
      - run: git push origin "release/v1.2.3"' \
  0

run_test \
  "allows push of tags only" \
  'jobs:
  deploy:
    steps:
      - run: git push origin "v1.2.3"' \
  0

run_test \
  "allows no git push commands at all" \
  'jobs:
  deploy:
    steps:
      - run: yarn build' \
  0

run_test \
  "ignores the word master in comments that are not push commands" \
  'jobs:
  deploy:
    steps:
      # pushes to a release branch, never master
      - run: git push origin release/v1.2.3' \
  0

echo ""
echo "Total: $((pass + fail)) — ${GREEN}$pass passed${RESET}, ${RED}$fail failed${RESET}"
if [[ $fail -gt 0 ]]; then
  exit 1
fi
