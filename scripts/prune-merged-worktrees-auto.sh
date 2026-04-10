#!/usr/bin/env bash
# Fetch the default remote branch, then remove linked worktrees whose HEAD is already
# contained in that remote-tracking ref (same as prune-merged-worktrees.sh -w).
#
# Environment (optional):
#   PRUNE_WORKTREES_REMOTE   default: origin
#   PRUNE_WORKTREES_BRANCH   default: master
#
# On fetch failure, prints a warning and exits 0 (safe for git hooks).

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REMOTE="${PRUNE_WORKTREES_REMOTE:-origin}"
BRANCH="${PRUNE_WORKTREES_BRANCH:-master}"

if ! here=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "error: not inside a git repository" >&2
  exit 1
fi
here=$(cd "$here" && pwd -P)

gd=$(git -C "$here" rev-parse --git-common-dir)
if [[ "$gd" != /* ]]; then
  gd=$(cd "$here/$gd" && pwd -P)
else
  gd=$(cd "$gd" && pwd -P)
fi
main_root=$(dirname "$gd")

if ! git -C "$main_root" fetch "$REMOTE" "$BRANCH"; then
  echo "prune-merged-worktrees-auto: fetch ${REMOTE} ${BRANCH} failed; skipping prune" >&2
  exit 0
fi

exec "$SCRIPT_DIR/prune-merged-worktrees.sh" -w -t "${REMOTE}/${BRANCH}"
