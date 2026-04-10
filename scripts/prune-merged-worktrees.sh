#!/usr/bin/env bash
# List linked worktrees whose HEAD is already contained in master, then optionally remove them.
# Default: dry-run only. Use -w to run `git worktree remove`.
#
# "Merged" means: git merge-base --is-ancestor <worktree-HEAD> master
# (your local master; run `git fetch origin master` first if you care about remote state).
#
# Usage:
#   ./scripts/prune-merged-worktrees.sh              # dry run vs master
#   ./scripts/prune-merged-worktrees.sh -w           # remove vs master
#   ./scripts/prune-merged-worktrees.sh -t origin/master  # compare to ref

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: prune-merged-worktrees.sh [-w] [-t <ref>] [-h]

  Dry run by default: prints linked worktrees whose HEAD is an ancestor of <ref>.

  -t    Merge target ref (default: master). Example: origin/master after fetch.
  -w    Remove those worktrees (git worktree remove <path>).
  -h    Show this help.

Must be run from inside the repository (any worktree). Does not remove the primary
checkout or delete local branches.
EOF
}

WRITE=false
MERGE_TARGET=master
while getopts "wht:" opt; do
  case "$opt" in
    w) WRITE=true ;;
    t) MERGE_TARGET=$OPTARG ;;
    h)
      usage
      exit 0
      ;;
    *)
      usage
      exit 1
      ;;
  esac
done
shift $((OPTIND - 1)) || true
if [[ $# -gt 0 ]]; then
  usage
  exit 1
fi

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

merge_target=$MERGE_TARGET
if ! git -C "$here" rev-parse --verify "$merge_target" >/dev/null 2>&1; then
  echo "error: no local ref '$merge_target' (create it, fetch, or pass -t)" >&2
  exit 1
fi

declare -a merged_paths
declare -a merged_heads
declare -a merged_branches

declare -a sorted_remove_paths

wt_path=""
wt_head=""
wt_branch=""
end_record() {
  if [[ -z "$wt_path" || -z "$wt_head" ]]; then
    wt_path=""
    wt_head=""
    wt_branch=""
    return
  fi
  local norm
  norm=$(cd "$wt_path" && pwd -P)
  if [[ "$norm" == "$main_root" ]]; then
    wt_path=""
    wt_head=""
    wt_branch=""
    return
  fi
  if git -C "$here" merge-base --is-ancestor "$wt_head" "$merge_target" 2>/dev/null; then
    merged_paths+=("$wt_path")
    merged_heads+=("$wt_head")
    merged_branches+=("${wt_branch:-}")
  fi
  wt_path=""
  wt_head=""
  wt_branch=""
}

while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ -z "$line" ]]; then
    end_record
    continue
  fi
  case "$line" in
    worktree\ *)
      wt_path="${line#worktree }"
      wt_head=""
      wt_branch=""
      ;;
    HEAD\ *) wt_head="${line#HEAD }" ;;
    branch\ *) wt_branch="${line#branch }" ;;
  esac
done < <(git -C "$here" worktree list --porcelain)
end_record

if [[ ${#merged_paths[@]} -eq 0 ]]; then
  echo "No linked worktrees have HEAD contained in '$merge_target'."
  exit 0
fi

mode="dry-run"
if [[ "$WRITE" == true ]]; then
  mode="remove"
fi

print_merged_table_and_sort_paths() {
  declare -a lines=()
  local i path head branch modified date_fmt branch_display

  for i in "${!merged_paths[@]}"; do
    path="${merged_paths[$i]}"
    head="${merged_heads[$i]}"
    branch="${merged_branches[$i]}"
    modified=$(stat -f "%m" "$path" 2>/dev/null || stat -c "%Y" "$path" 2>/dev/null || echo 0)
    date_fmt=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$path" 2>/dev/null \
      || date -d "@$modified" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "?")
    if [[ -n "$branch" ]]; then
      branch_display="${branch#refs/heads/}"
    else
      branch_display="detached@${head:0:7}"
    fi
    lines+=("${modified}"$'\t'"${date_fmt}"$'\t'"${branch_display}"$'\t'"${path}")
  done

  local sorted
  sorted=$(printf '%s\n' "${lines[@]}" | LC_ALL=C sort -t $'\t' -k1,1nr)

  echo "($mode) Linked worktrees whose HEAD is an ancestor of $merge_target (newest mtime first):"
  echo "$sorted" | awk -F'\t' '
    BEGIN {
      printf "%-14s  %-30s  %s\n", "MODIFIED", "BRANCH", "PATH"
      printf "%-14s  %-30s  %s\n", "──────────────", "──────────────────────────────", "────────────────────────────────"
    }
    NF >= 4 { printf "%-14s  %-30s  %s\n", $2, $3, $4 }
  '

  sorted_remove_paths=()
  while IFS=$'\t' read -r _epoch _df _bd pth; do
    [[ -z "$pth" ]] && continue
    sorted_remove_paths+=("$pth")
  done <<< "$sorted"
}

print_merged_table_and_sort_paths

if [[ "$WRITE" != true ]]; then
  echo
  echo "Re-run with -w to remove these worktrees."
  exit 0
fi

for p in "${sorted_remove_paths[@]}"; do
  echo "Removing: $p"
  git -C "$here" worktree remove "$p"
done

echo "Done. Optional: delete merged local branches with git branch -d <name>"
