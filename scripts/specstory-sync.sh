#!/usr/bin/env bash
# Sync .specstory/history/*.md from every branch (local + origin) and every
# linked worktree into a fresh chore/specstory-sync-<DATE>_<N> branch off
# origin/master, then open a PR against master.
#
# Read-only against your existing worktrees: never stashes, checks out, or
# stages anything anywhere outside the temporary worktree it creates itself.
# Uncommitted, staged, untracked, and mid-rebase state in any worktree is
# preserved exactly as-is.
#
# Collision policy: longest file content wins. SpecStory history files are
# append-only per session, so longest == most complete.
#
# Usage:
#   scripts/specstory-sync.sh                 # full run: branch + commit + push + PR
#   scripts/specstory-sync.sh --no-pr         # commit locally; skip push/PR
#   scripts/specstory-sync.sh --keep-worktree # leave temp worktree on disk
#   scripts/specstory-sync.sh --help

set -euo pipefail

NO_PR=false
KEEP_WORKTREE=false

usage() {
  cat <<'EOF'
Usage: specstory-sync.sh [--no-pr] [--keep-worktree] [-h|--help]

  Unions .specstory/history/*.md from every branch (local + origin/*) and
  every linked worktree into a new chore/specstory-sync-<DATE>_<N> branch
  off origin/master, commits, pushes, and opens a PR against master.

  --no-pr           Commit locally; do not push or open a PR.
  --keep-worktree   Leave the temporary worktree on disk for inspection.
  -h, --help        Show this help.

Safe to run while other worktrees have uncommitted, staged, or mid-rebase
state — the script only ever reads from them.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-pr) NO_PR=true ;;
    --keep-worktree) KEEP_WORKTREE=true ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      usage
      exit 1
      ;;
  esac
  shift
done

# Locate primary checkout (so relative `worktrees/...` lands in the right place).
repo_root=$(git rev-parse --show-toplevel)
common_dir=$(git rev-parse --git-common-dir)
[[ "$common_dir" = /* ]] || common_dir=$(cd "$repo_root/$common_dir" && pwd -P)
primary_root=$(dirname "$common_dir")

cd "$primary_root"

# Make sure we have an up-to-date origin/master to branch from.
echo "→ fetching origin (quiet)"
git fetch origin master --quiet || {
  echo "warning: git fetch origin master failed; using local refs as-is" >&2
}

today=$(date +%Y-%m-%d)
branch_prefix="chore/specstory-sync-${today}"

existing_refs=$(git for-each-ref --format='%(refname:short)' \
  "refs/heads/${branch_prefix}_*" \
  "refs/remotes/origin/${branch_prefix}_*" 2>/dev/null || true)

n=1
while printf '%s\n' "$existing_refs" | grep -qE "^(origin/)?${branch_prefix}_${n}\$"; do
  n=$((n + 1))
done
new_branch="${branch_prefix}_${n}"
new_worktree="worktrees/specstory-sync-${today}_${n}"

# Capture the branch list BEFORE creating the new worktree, so pass 1 doesn't
# scan the (initially empty) new branch.
mapfile -t branches < <(
  git for-each-ref --format='%(refname)' refs/heads refs/remotes/origin \
    | grep -v '/HEAD$' || true
)

tmp=$(mktemp -d)

cleanup() {
  local code=$?
  if [[ "$KEEP_WORKTREE" = true ]]; then
    echo "→ keeping worktree at $new_worktree (per --keep-worktree)"
  else
    cd "$primary_root" 2>/dev/null || true
    git worktree remove --force "$new_worktree" >/dev/null 2>&1 || true
  fi
  rm -rf "$tmp" 2>/dev/null || true
  exit "$code"
}
trap cleanup EXIT

echo "→ creating worktree $new_worktree on $new_branch (from origin/master)"
git worktree add "$new_worktree" -b "$new_branch" origin/master >/dev/null

dest_rel="$new_worktree/.specstory/history"
mkdir -p "$dest_rel"
dest=$(cd "$dest_rel" && pwd -P)
new_wt_abs=$(cd "$new_worktree" && pwd -P)

# Adopt $source as $target if (a) target missing, or (b) source is strictly
# longer than current target. Append-only history → longest == most complete.
adopt_if_longer() {
  local target=$1 source=$2
  if [[ ! -f "$target" ]]; then
    cp "$source" "$target"
    return
  fi
  local cur new
  cur=$(wc -c <"$target" | tr -d ' ')
  new=$(wc -c <"$source" | tr -d ' ')
  if ((new > cur)); then
    cp "$source" "$target"
  fi
}

# --- Pass 1: every branch (local heads + origin remote-tracking) ---
# Emit `<size>\t<sha>\t<basename>` rows from every ref via one `git ls-tree`
# per ref (no per-file forks), then keep the largest blob per filename.
branch_count=${#branches[@]}
{
  for ref in "${branches[@]}"; do
    git ls-tree -r --long "$ref" -- .specstory/history 2>/dev/null || true
  done
} | awk -F'\t' '
  {
    # ls-tree --long: "<mode> blob <sha> <size>\t<path>"
    split($1, hdr, " ");
    if (hdr[2] != "blob") next;
    sha = hdr[3]; size = hdr[4] + 0;
    path = $2;
    n = split(path, parts, "/"); fname = parts[n];
    if (!(fname in best) || size > best[fname]) {
      best[fname] = size; sha_of[fname] = sha;
    }
  }
  END {
    for (f in sha_of) print sha_of[f] "\t" f;
  }
' >"$tmp/winners.tsv"

blob_count=$(wc -l <"$tmp/winners.tsv" | tr -d ' ')

# Materialize the winning blobs. ~hundreds of files → loop is fine.
while IFS=$'\t' read -r sha fname; do
  [[ -z "$sha" || -z "$fname" ]] && continue
  git cat-file blob "$sha" >"$dest/$fname"
done <"$tmp/winners.tsv"
echo "→ pass 1: scanned $branch_count branches, picked $blob_count winning history blobs"

# --- Pass 2: every linked worktree's filesystem (catches uncommitted) ---
wt_count=0
wt_files=0
while IFS= read -r wt_path; do
  [[ -z "$wt_path" ]] && continue
  wt_abs=$(cd "$wt_path" 2>/dev/null && pwd -P) || continue
  [[ "$wt_abs" = "$new_wt_abs" ]] && continue
  hist_dir="$wt_abs/.specstory/history"
  [[ -d "$hist_dir" ]] || continue
  wt_count=$((wt_count + 1))
  shopt -s nullglob
  for f in "$hist_dir"/*.md; do
    fname=$(basename "$f")
    adopt_if_longer "$dest/$fname" "$f"
    wt_files=$((wt_files + 1))
  done
  shopt -u nullglob
done < <(git worktree list --porcelain | awk '/^worktree /{ $1=""; sub(/^ /,""); print }')
echo "→ pass 2: scanned $wt_count worktrees, considered $wt_files history files"

# --- Stage & commit ---
cd "$primary_root/$new_worktree"
git add .specstory/history

if git diff --cached --quiet; then
  echo "✓ nothing new to sync — every history file already at origin/master"
  cd "$primary_root"
  git worktree remove --force "$new_worktree" >/dev/null 2>&1 || true
  git branch -D "$new_branch" >/dev/null 2>&1 || true
  KEEP_WORKTREE=true # prevent trap from re-running remove
  exit 0
fi

added=$(git diff --cached --name-only | wc -l | tr -d ' ')
git commit -m "chore(specstory): sync history from all branches and worktrees

Aggregates .specstory/history/*.md from every local + origin branch and every
linked worktree into a single PR. Longest-content wins on filename collisions.

Files added/updated: $added" >/dev/null

if [[ "$NO_PR" = true ]]; then
  echo "✓ committed locally on $new_branch ($added files). --no-pr set; not pushing."
  exit 0
fi

echo "→ pushing $new_branch to origin"
git push -u origin "$new_branch" >/dev/null

if ! command -v gh >/dev/null 2>&1; then
  echo "warning: gh CLI not found. Branch pushed; open PR manually." >&2
  exit 0
fi

echo "→ opening PR via gh"
gh pr create --base master --head "$new_branch" \
  --title "chore(specstory): sync history ${today}_${n}" \
  --body "$(
    cat <<EOF
Aggregates \`.specstory/history/*.md\` from every branch (local + \`origin/*\`)
and every linked worktree into one branch.

- Sources: $branch_count branches + $wt_count worktrees scanned
- Files added/updated: $added
- Collision policy: longest-content wins (history files are append-only)

Generated by \`scripts/specstory-sync.sh\` (\`yarn specstory\`).
EOF
  )"

echo "✓ PR opened for $new_branch"
