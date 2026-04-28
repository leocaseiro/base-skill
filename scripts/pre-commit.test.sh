#!/usr/bin/env bash
set -euo pipefail

# pre-commit.test.sh — Integration tests for .husky/pre-commit.
#
# Verifies the hook honors detect-buckets.mjs --staged so that a commit
# touching only docs/markdown does not trigger unit tests or typecheck.
#
# Run from repo root:    bash scripts/pre-commit.test.sh

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK_SRC="$REPO_ROOT/.husky/pre-commit"
DETECTOR_SRC="$REPO_ROOT/scripts/detect-buckets.mjs"

if [[ ! -f "$HOOK_SRC" ]]; then
  echo "missing hook: $HOOK_SRC" >&2
  exit 2
fi
if [[ ! -f "$DETECTOR_SRC" ]]; then
  echo "missing detector: $DETECTOR_SRC" >&2
  exit 2
fi

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

# Shim yarn + npx so the hook's downstream commands are observed, not executed.
BIN="$TMPDIR_TESTS/bin"
mkdir -p "$BIN"
LOG="$TMPDIR_TESTS/calls.log"
cat >"$BIN/yarn" <<EOF
#!/usr/bin/env bash
printf 'yarn %s\n' "\$*" >>"$LOG"
exit 0
EOF
cat >"$BIN/npx" <<EOF
#!/usr/bin/env bash
printf 'npx %s\n' "\$*" >>"$LOG"
exit 0
EOF
chmod +x "$BIN/yarn" "$BIN/npx"

# Build a minimal fixture repo: hook + detector + symlinked node_modules
# (picomatch is required by detect-buckets.mjs).
FIXTURE="$TMPDIR_TESTS/repo"
mkdir -p "$FIXTURE/.husky" "$FIXTURE/scripts"
cp "$HOOK_SRC" "$FIXTURE/.husky/pre-commit"
cp "$DETECTOR_SRC" "$FIXTURE/scripts/detect-buckets.mjs"
ln -s "$REPO_ROOT/node_modules" "$FIXTURE/node_modules"
cp "$REPO_ROOT/package.json" "$FIXTURE/package.json"

(
  cd "$FIXTURE"
  git init -q
  git config user.email test@example.com
  git config user.name test
  git add .
  git commit -qm init
)

run_hook() {
  : >"$LOG"
  (
    cd "$FIXTURE"
    PATH="$BIN:$PATH" bash .husky/pre-commit >/dev/null 2>&1
  )
}

reset_repo() {
  git -C "$FIXTURE" reset -q --hard HEAD
  git -C "$FIXTURE" clean -qfd
}

pass=0
fail=0

assert_no_match() {
  local pattern="$1" description="$2"
  if grep -qE "$pattern" "$LOG"; then
    echo "${RED}FAIL${RESET} — $description"
    echo "  log:"
    sed 's/^/    /' "$LOG"
    fail=$((fail + 1))
    return 1
  fi
  return 0
}

assert_match() {
  local pattern="$1" description="$2"
  if ! grep -qE "$pattern" "$LOG"; then
    echo "${RED}FAIL${RESET} — $description"
    echo "  log:"
    sed 's/^/    /' "$LOG"
    fail=$((fail + 1))
    return 1
  fi
  return 0
}

# --- Test 1: markdown-only stage skips unit tests AND typecheck ---
echo "# notes" >"$FIXTURE/NOTES.md"
git -C "$FIXTURE" add NOTES.md
run_hook
ok=1
assert_no_match '^yarn test( |$)' \
  "markdown-only stage must NOT invoke yarn test (issue #224)" || ok=0
assert_no_match '^yarn typecheck( |$)' \
  "markdown-only stage must NOT invoke yarn typecheck" || ok=0
assert_match '^npx lint-staged' \
  "markdown-only stage still runs lint-staged" || ok=0
if [[ "$ok" == "1" ]]; then
  echo "${GREEN}PASS${RESET} — markdown-only stage skips unit + typecheck"
  pass=$((pass + 1))
fi
reset_repo

# --- Test 2: TypeScript stage triggers typecheck (and never blanket yarn test) ---
mkdir -p "$FIXTURE/src"
echo "export const x: number = 1;" >"$FIXTURE/src/foo.ts"
git -C "$FIXTURE" add src/foo.ts
run_hook
ok=1
assert_match '^yarn typecheck( |$)' \
  "TypeScript stage triggers yarn typecheck" || ok=0
assert_no_match '^yarn test( |$)' \
  "TypeScript stage must not invoke blanket yarn test" || ok=0
assert_match '^npx lint-staged' \
  "TypeScript stage runs lint-staged" || ok=0
if [[ "$ok" == "1" ]]; then
  echo "${GREEN}PASS${RESET} — TypeScript stage triggers typecheck only"
  pass=$((pass + 1))
fi
reset_repo

# --- Test 3: SKIP_PREPUSH=1 bypasses everything ---
mkdir -p "$FIXTURE/src"
echo "export const y: number = 2;" >"$FIXTURE/src/bar.ts"
git -C "$FIXTURE" add src/bar.ts
: >"$LOG"
(
  cd "$FIXTURE"
  PATH="$BIN:$PATH" SKIP_PREPUSH=1 bash .husky/pre-commit >/dev/null 2>&1
)
ok=1
assert_no_match '^yarn ' \
  "SKIP_PREPUSH=1 bypasses yarn invocations" || ok=0
assert_no_match '^npx ' \
  "SKIP_PREPUSH=1 bypasses npx invocations" || ok=0
if [[ "$ok" == "1" ]]; then
  echo "${GREEN}PASS${RESET} — SKIP_PREPUSH=1 bypasses every check"
  pass=$((pass + 1))
fi
reset_repo

echo ""
echo "Total: $((pass + fail)) — ${GREEN}$pass passed${RESET}, ${RED}$fail failed${RESET}"
if [[ $fail -gt 0 ]]; then
  exit 1
fi
