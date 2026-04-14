#!/usr/bin/env bash
set -euo pipefail

# check-no-master-push.sh — Fails if any .github/workflows/*.yml file pushes
# directly to master. Master is protected by a ruleset that requires changes
# to land via pull request; direct pushes from CI will be rejected, so we
# catch them here instead of letting deploys fail silently.

WORKFLOW_DIR=".github/workflows"

if [[ ! -d "$WORKFLOW_DIR" ]]; then
  echo "No $WORKFLOW_DIR directory; nothing to check."
  exit 0
fi

offenders=$(grep -rnE \
  'git[[:space:]]+push[^#]*(origin[[:space:]]+[^[:space:]]*[[:space:]]*:?master\b|origin[[:space:]]+master\b|HEAD:master\b)' \
  "$WORKFLOW_DIR" || true)

if [[ -n "$offenders" ]]; then
  echo "ERROR: Workflow files push directly to master:" >&2
  echo "" >&2
  echo "$offenders" >&2
  echo "" >&2
  echo "Master is protected — direct pushes will be rejected." >&2
  echo "Use a PR-based flow instead:" >&2
  echo "  git checkout -b release/v\${NEW_VERSION}" >&2
  echo "  git push origin release/v\${NEW_VERSION}" >&2
  echo "  gh pr create --base master --head release/v\${NEW_VERSION} ..." >&2
  exit 1
fi

echo "OK: No direct master pushes in $WORKFLOW_DIR."
