# Branch Protection Rules Setup Guide

This guide provides step-by-step instructions for configuring branch protection rules to enforce CI checks before merging to `main`.

## Overview

Branch protection rules prevent force pushes, require pull request reviews, and ensure all CI checks pass before merging. This maintains code quality and prevents breaking changes from reaching the main branch.

---

## Quick Setup Checklist

- [ ] Navigate to repository Settings > Branches
- [ ] Create branch protection rule for `main`
- [ ] Enable pull request requirements
- [ ] Configure required status checks
- [ ] Enable conversation resolution
- [ ] Set up merge restrictions
- [ ] Test with a sample PR

---

## Detailed Setup Instructions

### Step 1: Access Branch Protection Settings

1. Navigate to your GitHub repository
2. Click **Settings** (requires admin access)
3. In the left sidebar, click **Branches**
4. Under "Branch protection rules", click **Add rule**

### Step 2: Configure Branch Name Pattern

In the "Branch name pattern" field, enter:
```
main
```

**Note:** You can also protect other branches like `develop`, `staging`, etc. by creating additional rules.

---

## Required Settings Configuration

### Section 1: Require a pull request before merging

**Enable:** ✅ Require a pull request before merging

**Sub-settings:**

1. **Require approvals**
   - ✅ Enable
   - Set to: `1` (minimum recommended)
   - Increase to 2+ for critical applications or larger teams

2. **Dismiss stale pull request approvals when new commits are pushed**
   - ✅ Enable
   - Ensures reviewers see latest changes before merge

3. **Require review from Code Owners**
   - ✅ Enable (if you have a CODEOWNERS file)
   - Ensures domain experts review relevant changes
   - **Note:** BerthCare already has a CODEOWNERS file configured

4. **Restrict who can dismiss pull request reviews**
   - ⬜ Optional
   - Only enable if you want to limit who can dismiss reviews
   - Recommended for production repositories with strict governance

5. **Allow specified actors to bypass required pull requests**
   - ⬜ Leave disabled
   - Only enable in exceptional circumstances (e.g., emergency hotfixes)

---

### Section 2: Require status checks to pass before merging

**Enable:** ✅ Require status checks to pass before merging

**Sub-settings:**

1. **Require branches to be up to date before merging**
   - ✅ Enable
   - Ensures PR includes latest changes from main
   - Prevents integration issues

2. **Status checks that are required**

   Search for and select these checks (they will appear after the first CI run):

   ```
   ✅ Code Quality (Lint & Type Check)
   ✅ Unit Tests
   ✅ SAST (SonarQube)
   ✅ Dependency Audit (npm)
   ✅ Dependency Security (Snyk)
   ✅ CI Summary
   ```

   **Important Notes:**
   - Status check names must match exactly as defined in workflow
   - Checks will only appear in the list after running at least once
   - See "Initial Setup Testing" section below

---

### Section 3: Require conversation resolution before merging

**Enable:** ✅ Require conversation resolution before merging

**Purpose:** Ensures all review comments are addressed before merge

---

### Section 4: Require signed commits

**Enable:** ⬜ Optional (Recommended for enhanced security)

**Purpose:**
- Verifies commits are cryptographically signed
- Proves commit authenticity
- Recommended for compliance requirements

**Setup Required:**
- Developers must configure GPG keys
- See: https://docs.github.com/en/authentication/managing-commit-signature-verification

---

### Section 5: Require linear history

**Enable:** ✅ Require linear history

**Purpose:**
- Prevents merge commits
- Enforces rebase or squash merging
- Creates cleaner, more readable git history

**Allowed Merge Types:**
- Squash merging (recommended)
- Rebase merging

**Blocked:**
- Merge commits

---

### Section 6: Require deployments to succeed before merging

**Enable:** ⬜ Leave disabled (for CI-only setup)

**Note:** Enable this when you add deployment workflows in future phases

---

### Section 7: Lock branch

**Enable:** ⬜ Leave disabled

**Purpose:** Makes branch read-only (use only for archived branches)

---

### Section 8: Do not allow bypassing the above settings

**Enable:** ✅ Do not allow bypassing the above settings

**Sub-settings:**

1. **Include administrators**
   - ✅ Enable
   - Applies rules to repository administrators
   - Ensures consistent code quality for all contributors

---

### Section 9: Rules applied to everyone including administrators

**Enable:** ✅ Restrict who can push to matching branches

**Configuration:**
- Leave empty to allow all contributors to open PRs
- Restrictions only apply to direct pushes (PRs are still allowed)

**Purpose:** Prevents direct pushes to main branch

---

### Section 10: Allow force pushes

**Enable:** ⬜ Leave disabled

**Purpose:** Prevents rewriting history on protected branch

---

### Section 11: Allow deletions

**Enable:** ⬜ Leave disabled

**Purpose:** Prevents accidental deletion of main branch

---

## Save Configuration

1. Review all settings
2. Click **Create** (or **Save changes** if editing existing rule)
3. Confirm the rule is active in the branch protection rules list

---

## Initial Setup Testing

Since status checks only appear after running at least once, follow these steps:

### Step 1: Create a Test Branch

```bash
# Create and checkout test branch
git checkout -b test/ci-setup

# Make a small change (e.g., update README)
echo "# CI Pipeline Configured" >> README.md

# Commit and push
git add README.md
git commit -m "test: Verify CI pipeline setup"
git push origin test/ci-setup
```

### Step 2: Create Test Pull Request

1. Go to GitHub repository
2. Click **Pull requests** tab
3. Click **New pull request**
4. Select `test/ci-setup` → `main`
5. Click **Create pull request**

### Step 3: Observe CI Pipeline

1. Navigate to the **Checks** tab in the PR
2. Watch all 6 jobs execute:
   - Code Quality (Lint & Type Check)
   - Unit Tests
   - SAST (SonarQube)
   - Dependency Audit (npm)
   - Dependency Security (Snyk)
   - CI Summary

3. Wait for all checks to complete

### Step 4: Configure Required Status Checks

1. Go back to **Settings** > **Branches**
2. Click **Edit** on the `main` branch protection rule
3. Scroll to "Require status checks to pass before merging"
4. In the search box, you should now see all 6 CI jobs
5. Select all 6 checks
6. Click **Save changes**

### Step 5: Verify Configuration

1. Return to the test PR
2. Try to merge without approvals (should be blocked)
3. If any CI check fails, merge button should be disabled
4. Add required approvals
5. Merge button should be enabled only when:
   - All CI checks pass
   - Required approvals received
   - Conversations resolved
   - Branch is up to date

### Step 6: Clean Up Test PR

```bash
# Merge or close the test PR
# Delete the test branch
git branch -d test/ci-setup
git push origin --delete test/ci-setup
```

---

## Recommended Merge Button Settings

Configure repository-wide merge settings:

1. Go to **Settings** > **General**
2. Scroll to "Pull Requests" section
3. Configure merge button options:

   **Allow merge commits:**
   - ⬜ Disable (prevents messy merge commits)

   **Allow squash merging:**
   - ✅ Enable (recommended)
   - Default to: "Pull request title"
   - Creates clean, single commit per PR

   **Allow rebase merging:**
   - ✅ Enable (optional, for linear history fans)

4. **Automatically delete head branches**
   - ✅ Enable
   - Cleans up merged PR branches automatically

---

## Verification Checklist

After setup, verify the following:

- [ ] Cannot push directly to `main` branch
- [ ] Must create PR to merge changes
- [ ] PR requires at least 1 approval
- [ ] All 6 CI checks must pass
- [ ] Branch must be up to date with main
- [ ] Conversations must be resolved
- [ ] Merge button is disabled until all requirements met
- [ ] Test PR successfully validates all rules

---

## Branch Protection for Additional Branches

Consider protecting these branches as well:

### Develop Branch (if using Gitflow)

```
Branch name pattern: develop
Settings: Same as main, but allow more flexibility
```

### Release Branches

```
Branch name pattern: release/*
Settings: Similar to main, strict controls
```

### Staging Branch

```
Branch name pattern: staging
Settings: Moderate restrictions
```

---

## Troubleshooting

### Issue: Status checks not appearing in list

**Solutions:**
1. Run CI pipeline at least once by creating a test PR
2. Ensure workflow file is committed to default branch
3. Verify workflow runs appear in Actions tab
4. Wait 5-10 minutes for GitHub to register the checks

### Issue: Cannot select required status checks

**Solutions:**
1. Ensure checks have completed at least once
2. Verify exact job names in workflow file match
3. Check that workflow triggers on `pull_request` to `main`

### Issue: PR shows "Required status checks not found"

**Solutions:**
1. Verify secrets are configured (SONAR_TOKEN, SNYK_TOKEN, etc.)
2. Check workflow file syntax for errors
3. Review Actions tab for workflow errors
4. Ensure workflow file is in `.github/workflows/` directory

### Issue: Cannot merge even though all checks pass

**Possible causes:**
1. Branch is not up to date - click "Update branch"
2. Conversations are not resolved - resolve all comments
3. Required approvals not met - request review
4. Administrator bypass is disabled - get proper approvals

### Issue: Emergency hotfix needed but branch is protected

**Emergency Process:**
1. Create hotfix PR as normal
2. Get expedited review from code owners
3. Ensure all CI checks pass (cannot bypass)
4. Merge with approvals

**Do not:**
- Disable branch protection rules
- Force push to main
- Bypass status checks

---

## Monitoring and Maintenance

### Weekly Review

- Review PR merge times and bottlenecks
- Check if any checks frequently fail
- Gather feedback from team on process

### Monthly Review

- Audit branch protection settings
- Review administrator access
- Update required checks if workflow changes
- Review merge patterns and git history quality

### Quarterly Review

- Evaluate if approval requirements are appropriate
- Review CODEOWNERS assignments
- Update documentation based on team feedback

---

## Team Communication

Share this information with your team:

### For Contributors

```markdown
## PR Requirements

Before your PR can be merged to `main`:

1. ✅ All CI checks must pass:
   - Linting and type checks
   - Unit tests with coverage
   - Security scans (SonarQube, Snyk)
   - Dependency audits

2. ✅ At least 1 approval from reviewer
3. ✅ All conversations resolved
4. ✅ Branch up to date with main
5. ✅ Code Owner approval (if applicable)

## Tips for Faster Merges

- Run `npm run test:all` locally before pushing
- Keep PRs small and focused
- Address reviewer feedback promptly
- Resolve merge conflicts quickly
```

---

## Advanced Configuration

### Custom Status Check Names

If you modify job names in the workflow, update required checks:

1. Edit `.github/workflows/ci.yml`
2. Change job names in the workflow
3. Push changes to main
4. Run CI pipeline once
5. Update branch protection rules with new check names

### Conditional Required Checks

GitHub doesn't support conditional required checks natively. Alternatives:

1. Use workflow `if` conditions to skip jobs based on file changes
2. Create separate workflows for different change types
3. Use path filters in workflow triggers

---

## Security Considerations

### Secrets Protection

Branch protection works with secrets:
- Secrets are never exposed in PR from forks
- Forks cannot access repository secrets
- External contributors' PRs require maintainer approval to run CI

### Fork PR Handling

```yaml
# In workflow file, add pull_request_target for forks
on:
  pull_request:  # For repository PRs
  pull_request_target:  # For fork PRs (use with caution)
```

**Warning:** `pull_request_target` can be dangerous. Only use if you understand the security implications.

---

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Code Review Guidelines](https://google.github.io/eng-practices/review/)

---

**Last Updated:** 2025-09-30
**Maintained by:** DevOps Team
