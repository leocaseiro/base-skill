# PR Preview: Build Isolation & Comment UX

Closes #237 (Build conflicts), #236 (PR Build comment improvements).

## Problem

Two related issues with the PR preview pipeline:

1. **Build conflicts (#237):** PR preview deployments and production deployments
   both push to the `gh-pages` branch but use separate concurrency groups
   (`pr-preview-{N}` vs `deploy-production`). When they race, a PR preview
   force-push can carry stale root-level files, corrupting the production site.
   Observed symptom: `[object Object]` rendered on the live site at
   `/base-skill/en` after a PR changed a data structure — before the PR was
   merged.

2. **PR comment UX (#236):** The sticky PR comment is hard to use on mobile
   (GitHub collapses non-recent comments), shows only a bare commit SHA with no
   context, and has no build timestamp. There is no way to tell when a preview
   was last built or what code it contains without clicking through to the
   commit.

## Design

### 1. Build Isolation

**Shared concurrency group.** Both `deploy.yml` and `pr-preview.yml` adopt the
same concurrency group so they never push to `gh-pages` simultaneously:

```yaml
concurrency:
  group: gh-pages-deploy
  cancel-in-progress: false
```

`cancel-in-progress: false` ensures both production and preview deploys queue
rather than cancel each other.

**Root protection in PR preview.** Add `clean-exclude` to the JamesIves action
in `pr-preview.yml` as a belt-and-suspenders safeguard. While `target-folder`
already scopes `clean` to the PR subdirectory, the exclude prevents accidental
deletion of other PR folders:

```yaml
- name: Deploy preview to gh-pages
  uses: JamesIves/github-pages-deploy-action@v4
  with:
    branch: gh-pages
    folder: preview-staging
    target-folder: pr/${{ steps.version.outputs.pr_number }}
    clean: true
    clean-exclude: |
      pr/**
      !pr/${{ steps.version.outputs.pr_number }}/**
```

### 2. Enhanced Sticky Comment

The sticky comment is rebuilt on every push with richer metadata and a build
history section.

**New workflow steps (after deploy):**

1. **Compute metadata:** Capture build timestamp in AEST
   (`TZ=Australia/Sydney date`), short commit SHA, and commit subject line.
2. **Fetch existing comment:** Use `gh api` to find the sticky comment by its
   `<!-- pr-preview -->` HTML marker. Extract the `<details>` build-history
   table rows (if any).
3. **Build new comment body:** Promote the previous "latest" entry into the
   history table, then render the new latest build at the top.
4. **Post comment:** Use `marocchino/sticky-pull-request-comment` with the
   assembled body.

**Comment template:**

```markdown
## Preview deployed

| Target    | URL                                                  |
| --------- | ---------------------------------------------------- |
| App       | https://leocaseiro.github.io/base-skill/pr/{N}/app/  |
| Storybook | https://leocaseiro.github.io/base-skill/pr/{N}/docs/ |

**Version:** `0.20.1-pr.{N}`
**Commit:** `abc1234` — Fix card game chip rendering
**Built:** 2026-04-30 13:15 AEST

<details>
<summary>Build history (2 previous)</summary>

| Built                 | Commit                              | Version         |
| --------------------- | ----------------------------------- | --------------- |
| 2026-04-29 18:02 AEST | `def5678` — Refactor data structure | `0.20.1-pr.{N}` |
| 2026-04-29 14:30 AEST | `789abcd` — Initial implementation  | `0.20.0-pr.{N}` |

</details>
```

### 3. Preview Links in PR Description

After posting the sticky comment, inject preview URLs and a direct link to the
build-details comment into the PR description body.

**Mechanism:**

1. Fetch the sticky comment's ID from the `gh api` response.
2. Read the current PR body via `gh pr view`.
3. If `<!-- preview-urls -->` markers exist, replace that section. Otherwise,
   append to the end.
4. Update the PR body via `gh pr edit`.

**Injected section:**

```html
<!-- preview-urls -->
--- **Preview:**
[App](https://leocaseiro.github.io/base-skill/pr/{N}/app/) ·
[Storybook](https://leocaseiro.github.io/base-skill/pr/{N}/docs/) ·
[Build details
↓](https://github.com/leocaseiro/base-skill/pull/{N}#issuecomment-{ID})
<!-- /preview-urls -->
```

The "Build details" anchor links directly to the sticky comment, which works on
mobile even when GitHub collapses intermediate comments — tapping the link
scrolls to and expands the comment.

## Files Changed

| File                               | Change                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `.github/workflows/pr-preview.yml` | Shared concurrency group, `clean-exclude`, new steps for comment metadata + PR description update |
| `.github/workflows/deploy.yml`     | Update concurrency group to `gh-pages-deploy`                                                     |

## Testing

- Open a test PR, verify the sticky comment renders with timestamp (AEST),
  commit message, and version.
- Push a second commit to the same PR, verify the build history section appears
  with the previous build entry.
- Verify the PR description contains preview links and "Build details" anchor.
- On mobile, verify the "Build details" link in the PR description scrolls to
  the sticky comment.
- Verify a production deploy (`deploy.yml` via `workflow_dispatch`) and a
  concurrent PR preview queue correctly (do not race).
