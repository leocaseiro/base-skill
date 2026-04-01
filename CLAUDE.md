# Claude Code Rules for BaseSkill

## Git Workflow

**Never commit directly to `master`.** All changes must be made on a branch via a git worktree.

### Worktree Setup

Always use a git worktree inside `./worktrees/` (relative to project root):

```bash
# Create a worktree for a feature branch
git worktree add ./worktrees/<branch-name> -b <branch-name>

# Install dependencies (each worktree has its own node_modules for isolation)
cd ./worktrees/<branch-name> && yarn install

# Remove when done (after merging)
git worktree remove ./worktrees/<branch-name>
```

Name branches after the milestone or feature, e.g. `milestone-3-app-shell`, `feat/profile-picker`.

### Rules

- `master` is protected — no direct commits, no direct file edits
- Every task starts with `git worktree add ./worktrees/<name>` from the project root
- PRs merge into `master`; worktrees are removed after merge
