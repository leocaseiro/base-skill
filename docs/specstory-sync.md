# SpecStory History Sync

`yarn specstory` (a.k.a. `scripts/specstory-sync.sh`) consolidates every
`.specstory/history/*.md` file from every branch and every linked worktree
into a single PR against `master`, so the GitHub repo always holds the full
SpecStory archive.

## What it does

1. Fetches `origin/master`.
2. Picks the next free branch name in the form
   `chore/specstory-sync-YYYY-MM-DD_N`.
3. Creates a fresh worktree at `worktrees/specstory-sync-YYYY-MM-DD_N/`
   from `origin/master` (your current worktree is **not** the source).
4. Pass 1 — for every branch under `refs/heads/*` and
   `refs/remotes/origin/*`, reads `.specstory/history/*.md` straight from
   the git object database via `git ls-tree` + `git show` (no checkout).
5. Pass 2 — for every linked worktree, copies any `.specstory/history/*.md`
   off disk so uncommitted history files are captured too.
6. Commits the union, pushes the branch, and opens a PR via `gh`.
7. Removes the temporary worktree (the remote branch stays for the PR).

### Collision policy

When the same filename exists in multiple sources with different content,
the **longest content wins**. SpecStory writes history files
append-only per session, so longest == most complete.

## Safety guarantees

The script is read-only against your existing worktrees. It never:

- runs `git stash`, `git checkout`, `git reset`, or `git add` outside its
  own temporary worktree;
- mutates the index or working tree of any other worktree;
- deletes branches it didn't just create.

This means staged, unstaged, untracked, mid-rebase, and mid-merge state in
every other worktree is preserved exactly as-is. Uncommitted history files
**do** get included in the PR (their working-tree contents are copied), but
the source files themselves are not moved or modified.

## Usage

```bash
# Full run: branch + commit + push + PR
yarn specstory

# Commit locally on the new branch but skip push and PR
yarn specstory --no-pr

# Leave the temporary worktree on disk for inspection
yarn specstory --keep-worktree

# Help
yarn specstory --help
```

You can run `yarn specstory` from any worktree — it auto-locates the
primary checkout and creates the temporary worktree under the primary
`worktrees/` directory.

## Requirements

- A clean-enough environment: `gh` authenticated against the repo (only
  needed for the default mode that opens a PR).
- Network access for `git fetch origin master` and `git push`.

## When to run it

There is no automation. Run `yarn specstory` whenever you want to
checkpoint the SpecStory archive into `master` — typically before pruning
old branches or worktrees, or on a cadence (weekly is plenty).

If nothing has changed since the last sync, the script exits cleanly,
removes the empty worktree, deletes the empty branch, and opens no PR.
