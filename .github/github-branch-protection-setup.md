# GitHub Branch Protection Setup Guide

## Overview

This guide walks through setting up branch protection rules for the `main` branch to enforce CI checks before merging, as required by task E2.

## Step-by-Step Instructions

### 1. Navigate to Branch Protection Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Branches** in the left sidebar
4. Under "Branch protection rules", click **Add rule**

### 2. Configure Branch Name Pattern

- **Branch name pattern**: `main`

### 3. Enable Required Settings

Check the following boxes:

#### Require a pull request before merging
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: Set to `1` (minimum)
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ **Require review from Code Owners** (if using CODEOWNERS file)

#### Require status checks to pass before merging
- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - **Status checks that are required**: Add the following checks:
    - `Lint & Format Check`
    - `TypeScript Type Check`
    - `Unit Tests (Jest)`
    - `Security Scan (SAST)`
    - `Dependency Audit`
    - `All CI Checks Passed`

#### Additional Protection Rules (Recommended)
- ✅ **Require conversation resolution before merging**
- ✅ **Require signed commits** (for enhanced security)
- ✅ **Require linear history** (prevents merge commits)
- ✅ **Include administrators** (applies rules to admins too)

#### Rules Applied to Everyone (Optional)
- ✅ **Restrict who can push to matching branches**
  - Add specific teams/users who can push directly (typically none for main)

### 4. Save Changes

Click **Create** or **Save changes** at the bottom of the page.

## Verification

After setting up branch protection:

1. Create a test branch: `git checkout -b test/branch-protection`
2. Make a small change and commit
3. Push the branch: `git push origin test/branch-protection`
4. Create a pull request to `main`
5. Verify that:
   - CI checks run automatically
   - You cannot merge until all checks pass
   - You cannot merge without required approvals

## Status Check Names

The CI pipeline creates the following status checks:

| Job Name | Status Check Name |
|----------|------------------|
| Lint & Format Check | `lint-and-format` |
| TypeScript Type Check | `type-check` |
| Unit Tests (Jest) | `unit-tests` |
| Security Scan (SAST) | `security-sast` |
| Dependency Audit | `dependency-audit` |
| All CI Checks Passed | `all-checks-complete` |

**Note**: Status check names appear in GitHub after the first CI run. You may need to:
1. Create a test PR first
2. Wait for CI to run
3. Then add the status checks to branch protection

## Troubleshooting

### Status Checks Not Appearing

If status checks don't appear in the branch protection settings:

1. Ensure the CI workflow has run at least once
2. Check that the workflow file is in `.github/workflows/ci.yml`
3. Verify the workflow is enabled in Actions settings
4. Create a test PR to trigger the workflow

### Cannot Merge Despite Passing Checks

1. Verify all required status checks are passing (green checkmarks)
2. Ensure you have the required number of approvals
3. Check that the branch is up to date with `main`
4. Verify you have permission to merge

### Administrators Bypassing Rules

If you want rules to apply to administrators:
1. Edit the branch protection rule
2. Check **Include administrators**
3. Save changes

## CODEOWNERS Integration

The repository includes a `CODEOWNERS` file. To enforce code owner reviews:

1. Ensure `CODEOWNERS` file exists in repository root
2. In branch protection settings, enable:
   - **Require review from Code Owners**
3. Code owners will be automatically requested for review on PRs

## Signed Commits (Optional but Recommended)

To require signed commits:

1. Enable **Require signed commits** in branch protection
2. Team members must configure GPG signing:
   ```bash
   # Generate GPG key
   gpg --full-generate-key
   
   # List keys
   gpg --list-secret-keys --keyid-format=long
   
   # Configure Git
   git config --global user.signingkey YOUR_KEY_ID
   git config --global commit.gpgsign true
   
   # Add GPG key to GitHub
   # Copy public key: gpg --armor --export YOUR_KEY_ID
   # Add to GitHub Settings > SSH and GPG keys
   ```

## Updating Branch Protection Rules

To modify rules later:

1. Go to Settings > Branches
2. Click **Edit** next to the `main` branch rule
3. Make changes
4. Click **Save changes**

## Emergency Bypass (Use Sparingly)

In emergencies, administrators can temporarily disable branch protection:

1. Go to Settings > Branches
2. Click **Edit** next to the rule
3. Uncheck **Include administrators**
4. Merge the urgent change
5. **Immediately re-enable** the protection

**Warning**: Document all bypasses and review the changes afterward.

## References

- GitHub Branch Protection Docs: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- CODEOWNERS Syntax: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
- Signed Commits: https://docs.github.com/en/authentication/managing-commit-signature-verification
