#!/usr/bin/env bash
# List linked worktrees whose HEAD is already contained in master, then optionally remove them.
# Default: dry-run only. Use -w to run `git worktree remove`.
#
# Safety: worktrees with uncommitted changes or unpushed commits are flagged
# and require individual y/N confirmation. Fully merged worktrees (clean tree,
# all commits on the remote) are removed without per-worktree prompts.
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
  -w    Remove worktrees. Fully merged (clean + pushed) are removed automatically.
        Worktrees with local-only work require individual y/N confirmation.
        Set PRUNE_WORKTREES_YES=1 to skip all confirmations (dangerous).
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

# --- Classify each worktree as SAFE or HAS LOCAL WORK ---

declare -a wt_warnings

classify_worktree() {
  local path="$1" head="$2" branch="$3"
  local warnings=""

  # Check for uncommitted changes (staged, unstaged, untracked)
  local dirty
  dirty=$(git -C "$path" status --porcelain 2>/dev/null | head -1)
  if [[ -n "$dirty" ]]; then
    warnings="${warnings}uncommitted changes, "
  fi

  # Check for commits not on the merge target
  local branch_name="${branch#refs/heads/}"
  local ahead
  ahead=$(git -C "$here" rev-list --count "$merge_target".."$head" 2>/dev/null || echo 0)
  if [[ "$ahead" -gt 0 ]]; then
    warnings="${warnings}${ahead} unpushed commit(s), "
  fi

  # Check if branch has no remote tracking branch
  if [[ -n "$branch_name" ]]; then
    local remote_ref
    remote_ref=$(git -C "$here" config "branch.${branch_name}.remote" 2>/dev/null || true)
    if [[ -z "$remote_ref" ]]; then
      warnings="${warnings}no remote tracking branch, "
    fi
  fi

  # Trim trailing ", "
  warnings="${warnings%, }"
  echo "$warnings"
}

for i in "${!merged_paths[@]}"; do
  wt_warnings+=("$(classify_worktree "${merged_paths[$i]}" "${merged_heads[$i]}" "${merged_branches[$i]}")")
done

# --- Display table ---

mode="dry-run"
if [[ "$WRITE" == true ]]; then
  mode="remove"
fi

declare -a sorted_indices

print_merged_table() {
  declare -a lines=()
  local i path head branch modified date_fmt branch_display warning status

  for i in "${!merged_paths[@]}"; do
    path="${merged_paths[$i]}"
    head="${merged_heads[$i]}"
    branch="${merged_branches[$i]}"
    warning="${wt_warnings[$i]}"
    modified=$(stat -f "%m" "$path" 2>/dev/null || stat -c "%Y" "$path" 2>/dev/null || echo 0)
    date_fmt=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$path" 2>/dev/null \
      || date -d "@$modified" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "?")
    if [[ -n "$branch" ]]; then
      branch_display="${branch#refs/heads/}"
    else
      branch_display="detached@${head:0:7}"
    fi
    if [[ -n "$warning" ]]; then
      status="⚠ ${warning}"
    else
      status="✓ clean"
    fi
    lines+=("${modified}"$'\t'"${date_fmt}"$'\t'"${branch_display}"$'\t'"${status}"$'\t'"${path}"$'\t'"${i}")
  done

  local sorted
  sorted=$(printf '%s\n' "${lines[@]}" | LC_ALL=C sort -t $'\t' -k1,1nr)

  echo "($mode) Linked worktrees whose HEAD is an ancestor of $merge_target (newest mtime first):"
  echo
  echo "$sorted" | awk -F'\t' '
    BEGIN {
      printf "%-14s  %-30s  %-30s  %s\n", "MODIFIED", "BRANCH", "STATUS", "PATH"
      printf "%-14s  %-30s  %-30s  %s\n", "──────────────", "──────────────────────────────", "──────────────────────────────", "────────────────────────────────"
    }
    NF >= 5 { printf "%-14s  %-30s  %-30s  %s\n", $2, $3, $4, $5 }
  '

  sorted_indices=()
  while IFS=$'\t' read -r _epoch _df _bd _st _pth idx; do
    [[ -z "$idx" ]] && continue
    sorted_indices+=("$idx")
  done <<< "$sorted"
}

print_merged_table

if [[ "$WRITE" != true ]]; then
  echo
  echo "Re-run with -w to remove these worktrees."
  echo "Worktrees marked ⚠ have local-only work and will require individual confirmation."
  exit 0
fi

# --- Remove worktrees ---

declare -a remove_errors=()
removed=0
skipped=0

for idx in "${sorted_indices[@]}"; do
  path="${merged_paths[$idx]}"
  warning="${wt_warnings[$idx]}"
  branch="${merged_branches[$idx]}"
  branch_display="${branch:+${branch#refs/heads/}}"
  branch_display="${branch_display:-detached}"

  if [[ -n "$warning" ]]; then
    # Worktree has local work — require per-worktree confirmation
    if [[ "${PRUNE_WORKTREES_YES:-}" == "1" ]]; then
      echo "Removing (forced): $path [$branch_display] — $warning"
    else
      echo
      echo "⚠  $path"
      echo "   Branch: $branch_display"
      echo "   Warning: $warning"
      printf "   Remove this worktree? [y/N] "
      read -r answer
      if [[ "$answer" != [yY] && "$answer" != [yY][eE][sS] ]]; then
        echo "   Skipped."
        ((skipped++))
        continue
      fi
    fi
  else
    echo "Removing: $path [$branch_display] (clean)"
  fi

  if ! err=$(git -C "$here" worktree remove "$path" 2>&1); then
    remove_errors+=("$path"$'\n'"$err")
  else
    ((removed++))
  fi
done

echo
echo "Removed $removed worktree(s), skipped $skipped."

if [[ ${#remove_errors[@]} -gt 0 ]]; then
  echo >&2
  echo "Removal failed for ${#remove_errors[@]} worktree(s):" >&2
  for e in "${remove_errors[@]}"; do
    echo "---" >&2
    echo "$e" >&2
  done
  echo >&2
  echo "Fix the issues above (e.g. commit, stash, or git worktree remove --force), then re-run with -w." >&2
  exit 1
fi

echo "Optional: delete merged local branches with git branch -d <name>"
