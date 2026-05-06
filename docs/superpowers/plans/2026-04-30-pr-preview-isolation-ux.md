# PR Preview Isolation & Comment UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent PR preview deployments from corrupting the production site, and enhance PR preview comments with timestamps, commit context, build history, and links in the PR description.

**Architecture:** Both `deploy.yml` and `pr-preview.yml` push to the `gh-pages` branch. A shared concurrency group prevents race conditions. The existing sticky comment is replaced with a richer comment that carries build history via hidden HTML markers, and preview URLs are injected into the PR description for mobile discoverability.

**Tech Stack:** GitHub Actions YAML, `marocchino/sticky-pull-request-comment@v2`, `JamesIves/github-pages-deploy-action@v4`, `gh` CLI, bash

**Note:** These are CI workflow changes — no unit tests exist for workflow YAML. Testing is manual via a test PR pushed to GitHub.

---

## File Structure

| File                               | Responsibility                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `.github/workflows/deploy.yml`     | Production deployment — update concurrency group name                                                        |
| `.github/workflows/pr-preview.yml` | PR preview deployment — add job-level concurrency, clean-exclude, enhanced comment, PR description injection |

---

### Task 1: Build Isolation — Shared Concurrency Group

**Files:**

- Modify: `.github/workflows/deploy.yml:10-12`
- Modify: `.github/workflows/pr-preview.yml:9-11` (workflow-level, keep as-is)
- Modify: `.github/workflows/pr-preview.yml:35-39` (add job-level concurrency)
- Modify: `.github/workflows/pr-preview.yml:107-114` (add clean-exclude)

**Context:** Currently `deploy.yml` uses concurrency group `deploy-production` and `pr-preview.yml` uses `pr-preview-{N}`. These are separate groups, so a PR preview and production deploy can push to `gh-pages` simultaneously, causing race conditions. The fix has two parts:

1. A **shared job-level concurrency group** on the deploy step ensures only one push to `gh-pages` at a time.
2. The **workflow-level per-PR concurrency** in `pr-preview.yml` stays, so new pushes to the same PR still cancel stale preview builds.

- [ ] **Step 1: Update `deploy.yml` concurrency group**

In `.github/workflows/deploy.yml`, change the concurrency group name from `deploy-production` to `gh-pages-deploy`:

```yaml
concurrency:
  group: gh-pages-deploy
  cancel-in-progress: false # never cancel an in-flight deploy
```

This replaces lines 10-12. The `cancel-in-progress: false` stays — production deploys must never be cancelled.

- [ ] **Step 2: Add job-level concurrency to `deploy-preview` in `pr-preview.yml`**

The workflow-level concurrency in `pr-preview.yml` (lines 9-11) stays unchanged — it handles per-PR cancellation of stale builds. Add a **job-level** concurrency block to the `deploy-preview` job so the gh-pages push queues behind production deploys:

```yaml
deploy-preview:
  name: Build and deploy preview
  needs: detect-changes
  if: needs.detect-changes.outputs.build == 'true'
  runs-on: ubuntu-latest
  concurrency:
    group: gh-pages-deploy
    cancel-in-progress: false
  steps:
```

The `concurrency` block is inserted between `runs-on` and `steps` (after line 39, before line 40 in the current file).

- [ ] **Step 3: Add `clean-exclude` to the JamesIves deploy action**

In `.github/workflows/pr-preview.yml`, update the "Deploy preview to gh-pages" step to protect other PR preview folders from accidental deletion:

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
    commit-message: 'deploy: PR #${{ steps.version.outputs.pr_number }} preview (${{ steps.version.outputs.version }})'
```

The `clean-exclude` is a belt-and-suspenders safeguard. `target-folder` already scopes `clean` to the PR subdirectory, but the exclude explicitly protects other PR folders.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml .github/workflows/pr-preview.yml
git commit -m "fix(ci): shared concurrency group to prevent gh-pages race (#237)"
```

---

### Task 2: Enhanced Sticky Comment with Build History

**Files:**

- Modify: `.github/workflows/pr-preview.yml:116-131` (replace the comment step)

**Context:** The current comment step (lines 116-131) posts a simple message with version and commit SHA. Replace it with three steps: compute metadata, build the comment body with history, and post.

The comment carries hidden HTML markers (`<!-- latest-sha:... -->`, etc.) that encode the current build's metadata. On the next push, the workflow reads these markers from the existing comment, moves them into a build-history table, and posts an updated comment with the new build at the top.

- [ ] **Step 1: Add "Compute build metadata" step**

Insert this step after the "Deploy preview to gh-pages" step, replacing the old "Comment PR with preview URLs" step. Remove lines 116-131 (the old comment step) and add these three new steps in their place:

```yaml
- name: Compute build metadata
  id: meta
  run: |
    set -euo pipefail
    echo "short_sha=$(echo "${{ github.event.pull_request.head.sha }}" | cut -c1-7)" >> "$GITHUB_OUTPUT"
    echo "commit_subject=$(git log -1 --format='%s' HEAD)" >> "$GITHUB_OUTPUT"
    echo "build_date=$(TZ=Australia/Sydney date '+%Y-%m-%d %H:%M %Z')" >> "$GITHUB_OUTPUT"
```

This captures:

- `short_sha`: first 7 chars of the head commit SHA
- `commit_subject`: the commit message's first line
- `build_date`: timestamp in AEST/AEDT (Australia/Sydney handles daylight saving)

- [ ] **Step 2: Add "Build preview comment with history" step**

```yaml
- name: Build preview comment with history
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    PR_NUMBER: ${{ steps.version.outputs.pr_number }}
    VERSION: ${{ steps.version.outputs.version }}
    SHORT_SHA: ${{ steps.meta.outputs.short_sha }}
    COMMIT_SUBJECT: ${{ steps.meta.outputs.commit_subject }}
    BUILD_DATE: ${{ steps.meta.outputs.build_date }}
  run: |
    set -euo pipefail

    APP_URL="https://leocaseiro.github.io/base-skill/pr/${PR_NUMBER}/app/"
    DOCS_URL="https://leocaseiro.github.io/base-skill/pr/${PR_NUMBER}/docs/"

    # Fetch existing sticky comment body (if any).
    # marocchino/sticky-pull-request-comment wraps the message with
    # <!-- pr-preview --> markers — search for that.
    COMMENT_BODY=$(gh api "repos/${{ github.repository }}/issues/${PR_NUMBER}/comments" \
      --jq '[.[] | select(.body | contains("<!-- pr-preview -->"))] | last | .body // empty' 2>/dev/null || echo "")

    # Extract previous build metadata from hidden markers
    HISTORY_ROWS=""
    if [ -n "$COMMENT_BODY" ]; then
      PREV_SHA=$(echo "$COMMENT_BODY" | sed -n 's/.*<!-- latest-sha:\(.*\) -->.*/\1/p' | head -1)
      PREV_VERSION=$(echo "$COMMENT_BODY" | sed -n 's/.*<!-- latest-version:\(.*\) -->.*/\1/p' | head -1)
      PREV_DATE=$(echo "$COMMENT_BODY" | sed -n 's/.*<!-- latest-date:\(.*\) -->.*/\1/p' | head -1)
      PREV_SUBJECT=$(echo "$COMMENT_BODY" | sed -n 's/.*<!-- latest-subject:\(.*\) -->.*/\1/p' | head -1)

      if [ -n "$PREV_SHA" ]; then
        NEW_ROW="| ${PREV_DATE} | \`${PREV_SHA}\` — ${PREV_SUBJECT} | \`${PREV_VERSION}\` |"
      fi

      # Extract existing history table rows (between markers)
      EXISTING_ROWS=$(echo "$COMMENT_BODY" | sed -n '/<!-- history-start -->/,/<!-- history-end -->/p' \
        | grep '^| ' | grep -v '^| Built' | grep -v '^| -' || true)

      if [ -n "${NEW_ROW:-}" ] && [ -n "$EXISTING_ROWS" ]; then
        HISTORY_ROWS="${NEW_ROW}
    ${EXISTING_ROWS}"
      elif [ -n "${NEW_ROW:-}" ]; then
        HISTORY_ROWS="$NEW_ROW"
      elif [ -n "$EXISTING_ROWS" ]; then
        HISTORY_ROWS="$EXISTING_ROWS"
      fi
    fi

    # Write the comment body to a file
    {
      cat <<EOF
    ## Preview deployed

    | Target    | URL |
    | --------- | --- |
    | App       | ${APP_URL} |
    | Storybook | ${DOCS_URL} |

    **Version:** \`${VERSION}\`
    **Commit:** \`${SHORT_SHA}\` — ${COMMIT_SUBJECT}
    **Built:** ${BUILD_DATE}

    <!-- latest-sha:${SHORT_SHA} -->
    <!-- latest-version:${VERSION} -->
    <!-- latest-date:${BUILD_DATE} -->
    <!-- latest-subject:${COMMIT_SUBJECT} -->
    EOF

      if [ -n "$HISTORY_ROWS" ]; then
        HISTORY_COUNT=$(echo "$HISTORY_ROWS" | wc -l | tr -d ' ')
        cat <<EOF

    <details>
    <summary>Build history (${HISTORY_COUNT} previous)</summary>

    | Built | Commit | Version |
    | ----- | ------ | ------- |
    <!-- history-start -->
    ${HISTORY_ROWS}
    <!-- history-end -->

    </details>
    EOF
      fi
    } > /tmp/pr-comment.md
```

**How it works:**

1. Fetches the existing sticky comment (identified by `<!-- pr-preview -->` markers injected by the action).
2. Extracts previous build metadata from hidden HTML comments (`<!-- latest-sha:... -->`).
3. Extracts existing history rows from between `<!-- history-start -->` and `<!-- history-end -->` markers.
4. Promotes the previous "latest" build into the history table.
5. Writes the new comment body (with the current build at top and history in a collapsible `<details>` section) to `/tmp/pr-comment.md`.

- [ ] **Step 3: Add the sticky comment step using the file**

```yaml
- name: Comment PR with preview URLs
  uses: marocchino/sticky-pull-request-comment@v2
  with:
    header: pr-preview
    path: /tmp/pr-comment.md
```

This replaces the old step. Instead of an inline `message:`, it reads from `path:`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/pr-preview.yml
git commit -m "feat(ci): enhanced PR preview comment with build history (#236)"
```

---

### Task 3: Preview Links in PR Description

**Files:**

- Modify: `.github/workflows/pr-preview.yml` (add step after the comment step)

**Context:** After posting the sticky comment, inject a preview-links section into the PR description. This gives mobile users a persistent, always-visible link to the App, Storybook, and the build-details comment (which GitHub may collapse on mobile). The section is identified by `<!-- preview-urls -->` / `<!-- /preview-urls -->` markers and is replaced on each build.

- [ ] **Step 1: Add "Update PR description with preview links" step**

Add this as the final step in the `deploy-preview` job, after the sticky comment step:

```yaml
- name: Update PR description with preview links
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    PR_NUMBER: ${{ steps.version.outputs.pr_number }}
  run: |
    set -euo pipefail

    # Find the sticky comment ID for the anchor link
    COMMENT_ID=$(gh api "repos/${{ github.repository }}/issues/${PR_NUMBER}/comments" \
      --jq '[.[] | select(.body | contains("<!-- pr-preview -->"))] | last | .id')

    APP_URL="https://leocaseiro.github.io/base-skill/pr/${PR_NUMBER}/app/"
    DOCS_URL="https://leocaseiro.github.io/base-skill/pr/${PR_NUMBER}/docs/"
    COMMENT_URL="https://github.com/${{ github.repository }}/pull/${PR_NUMBER}#issuecomment-${COMMENT_ID}"

    # Build the preview section
    cat > /tmp/preview-section.txt <<EOF
    <!-- preview-urls -->
    ---
    **Preview:** [App](${APP_URL}) · [Storybook](${DOCS_URL}) · [Build details ↓](${COMMENT_URL})
    <!-- /preview-urls -->
    EOF

    # Read current PR body (default to empty if null)
    gh pr view "$PR_NUMBER" --json body --jq '.body // ""' > /tmp/pr-body.txt

    # Replace existing preview section, or append if not present
    if grep -q '<!-- preview-urls -->' /tmp/pr-body.txt; then
      awk '
        /<!-- preview-urls -->/ { skip=1; while ((getline line < "/tmp/preview-section.txt") > 0) print line; next }
        /<!-- \/preview-urls -->/ { skip=0; next }
        !skip { print }
      ' /tmp/pr-body.txt > /tmp/new-body.txt
    else
      cp /tmp/pr-body.txt /tmp/new-body.txt
      echo "" >> /tmp/new-body.txt
      cat /tmp/preview-section.txt >> /tmp/new-body.txt
    fi

    gh pr edit "$PR_NUMBER" --body-file /tmp/new-body.txt
```

**How it works:**

1. Finds the sticky comment's ID via `gh api` so the "Build details" link can anchor directly to it.
2. Reads the current PR body.
3. If `<!-- preview-urls -->` markers already exist, replaces that section using `awk`.
4. If not, appends the section to the end of the body.
5. Updates the PR description via `gh pr edit --body-file`.

The injected section renders as a horizontal rule followed by a single line with App, Storybook, and Build details links. On mobile, this is always visible at the top of the PR without scrolling through collapsed comments.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/pr-preview.yml
git commit -m "feat(ci): inject preview links into PR description (#236)"
```

---

### Task 4: Integration Test

**Context:** Workflow changes can only be tested by running them on GitHub. Open a test PR and verify all three features.

- [ ] **Step 1: Push the branch and open a test PR**

```bash
git push -u origin pr-preview-improvements
gh pr create --title "fix(ci): PR preview isolation and comment UX (#237, #236)" --body "$(cat <<'EOF'
## Summary

- Shared `gh-pages-deploy` concurrency group prevents PR preview and production deploys from racing on the `gh-pages` branch (fixes #237)
- Enhanced sticky comment with build timestamp (AEST), commit message, and collapsible build history (fixes #236)
- Preview links injected into PR description for mobile discoverability

## Test plan

- [ ] Verify sticky comment has timestamp (AEST), commit SHA + message, and version
- [ ] Push a second commit — verify build history section appears with the previous build
- [ ] Verify PR description contains preview links and "Build details" anchor
- [ ] On mobile, verify "Build details" link scrolls to the sticky comment
- [ ] Trigger `deploy.yml` via `workflow_dispatch` while a PR preview is queued — verify they don't race

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Verify first build**

After the PR Preview workflow completes:

1. Check the sticky comment renders with: version, short SHA + commit subject, timestamp in AEST/AEDT
2. Check the PR description has the `Preview:` line with App, Storybook, and Build details links
3. Click "Build details ↓" link — verify it scrolls to the sticky comment

- [ ] **Step 3: Push a second commit and verify build history**

Push any small change (e.g., a comment in the workflow file). After the second build:

1. Check the sticky comment shows the NEW build at top
2. Check the `<details>` section shows "Build history (1 previous)" with the first build's info
3. Verify the PR description links are updated (the comment ID anchor stays correct)

- [ ] **Step 4: Verify on mobile**

Open the PR on a phone:

1. The PR description's "Preview" line is visible without scrolling
2. Tapping "Build details ↓" scrolls to and expands the sticky comment
