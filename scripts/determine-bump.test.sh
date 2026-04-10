#!/usr/bin/env bash
set -euo pipefail

# determine-bump.test.sh — Shell test suite for determine-bump.sh
# Run from repo root:    bash scripts/determine-bump.test.sh
# Run from scripts dir:  bash determine-bump.test.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUMP_SCRIPT="$SCRIPT_DIR/determine-bump.sh"

# Colour support (optional).
if command -v tput &>/dev/null && tput colors &>/dev/null && [[ "$(tput colors)" -ge 8 ]]; then
  GREEN="$(tput setaf 2)"
  RED="$(tput setaf 1)"
  RESET="$(tput sgr0)"
  BOLD="$(tput bold)"
else
  GREEN=""
  RED=""
  RESET=""
  BOLD=""
fi

# Temp directory for fixture files; cleaned up on exit.
TMPDIR_TESTS="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_TESTS"' EXIT

pass=0
fail=0
# Note: use "|| true" with arithmetic expressions that may evaluate to 0,
# because (( expr )) exits 1 when the result is 0, which triggers set -e.

run_test() {
  local description="$1"
  local fixture_content="$2"
  local expected="$3"

  local fixture_file
  fixture_file="$(mktemp "$TMPDIR_TESTS/fixture.XXXXXX")"
  printf '%s' "$fixture_content" >"$fixture_file"

  local actual
  actual="$(PR_COMMITS_FILE="$fixture_file" bash "$BUMP_SCRIPT" 999)"

  if [[ "$actual" == "$expected" ]]; then
    echo "${GREEN}PASS${RESET} — $description"
    pass=$((pass + 1))
  else
    echo "${RED}FAIL${RESET} — $description"
    echo "       expected: ${BOLD}$expected${RESET}"
    echo "       actual:   ${BOLD}$actual${RESET}"
    fail=$((fail + 1))
  fi
}

# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

# 1. Single feat → minor
run_test "single feat commit → minor" \
  "feat: add pause mode" \
  "minor"

# 2. Single fix → patch
run_test "single fix commit → patch" \
  "fix: handle null" \
  "patch"

# 3. style → patch (style is NOT skip)
run_test "style commit → patch (not skip)" \
  "style: reformat" \
  "patch"

# 4. Single docs → skip
run_test "single docs commit → skip" \
  "docs: update readme" \
  "skip"

# 5. All chore/ci/test → skip
run_test "all chore/ci/test commits → skip" \
  "chore: x
---
ci: y
---
test: z" \
  "skip"

# 6. docs + fix → patch (fix beats docs)
run_test "docs + fix → patch" \
  "docs: x
---
fix: y" \
  "patch"

# 7. fix + feat → minor (feat beats fix)
run_test "fix + feat → minor" \
  "fix: x
---
feat: y" \
  "minor"

# 8. feat! → major
run_test "feat! breaking header → major" \
  "feat!: breaking api" \
  "major"

# 9. fix with BREAKING CHANGE in body → major
run_test "fix with BREAKING CHANGE body → major" \
  "fix: handle null
BREAKING CHANGE: token format changed" \
  "major"

# 10. No conventional prefix → patch (safe default)
run_test "non-conventional commit → patch" \
  "random text here" \
  "patch"

# 11. Scoped fix → patch
run_test "scoped fix(auth) → patch" \
  "fix(auth): handle null" \
  "patch"

# 12. Scoped feat → minor
run_test "scoped feat(ui) → minor" \
  "feat(ui): add modal" \
  "minor"

# 13. Uppercase FEAT: → patch (case-sensitive, must NOT match minor)
run_test "uppercase FEAT: → patch (case-sensitive)" \
  "FEAT: broken" \
  "patch"

# 14. Empty commit file → patch (defensive default)
run_test "empty commit file → patch" \
  "" \
  "patch"

# 15. feat(a) + chore(b) → minor (feat beats chore)
run_test "feat(a) + chore(b) → minor" \
  "feat(a): x
---
chore(b): y" \
  "minor"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
total=$((pass + fail))
if [[ $fail -eq 0 ]]; then
  echo "${GREEN}${BOLD}All $total tests passed.${RESET}"
  exit 0
else
  echo "${RED}${BOLD}$fail of $total tests FAILED.${RESET}"
  exit 1
fi
