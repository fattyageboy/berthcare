# GitHub Branch Protection Setup

## Quick Setup Checklist

Follow these steps to enable branch protection for the `main` branch:

### Step 1: Navigate to Branch Protection Settings

1. Go to: https://github.com/fattyageboy/BerthCare/settings/branches
2. Click "Add branch protection rule" (or edit existing rule)
3. Enter branch name pattern: `main`

### Step 2: Configure Protection Rules

#### Pull Request Requirements

- ✅ **Require a pull request before merging**
  - Required number of approvals before merging: `1`
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners
  - ✅ Require approval of the most recent reviewable push

#### Status Checks

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Add required status checks** (search and select):
    - `Code Quality (Lint & Format)`
    - `TypeScript Type Check`
    - `Unit Tests`
    - `Dependency Audit`
    - `Build Verification`
    - `CI Summary`

#### Conversation Resolution

- ✅ **Require conversation resolution before merging**

#### Signed Commits

- ✅ **Require signed commits**

#### Additional Settings

- ✅ **Require linear history** (optional, prevents merge commits)
- ✅ **Include administrators** (enforce rules for admins too)
- ✅ **Restrict who can push to matching branches** (optional)
- ✅ **Allow force pushes**: ❌ Disabled
- ✅ **Allow deletions**: ❌ Disabled

### Step 3: Save Changes

- Click "Create" (or "Save changes" if editing)
- Verify the rule appears in the branch protection list

## Verification

After setup, verify the protection is working:

1. **Create a test branch**:

   ```bash
   git checkout -b test/branch-protection
   git push origin test/branch-protection
   ```

2. **Create a pull request** to `main`

3. **Verify checks run automatically**:
   - All CI jobs should trigger
   - PR should show "Required" status checks
   - Merge button should be disabled until checks pass

4. **Verify review requirement**:
   - PR should require 1 approval
   - Code owners should be automatically requested

5. **Clean up**:
   ```bash
   git checkout main
   git branch -D test/branch-protection
   git push origin --delete test/branch-protection
   ```

## Status Check Names

If status checks don't appear in the dropdown, you need to trigger them first:

1. Create a PR to `main` (can be a draft)
2. Wait for CI to run
3. Go back to branch protection settings
4. The status check names will now appear in the search

## Troubleshooting

### Status Checks Not Appearing

- **Cause**: CI hasn't run yet on a PR to `main`
- **Solution**: Create a test PR, wait for CI, then add checks

### Can't Merge Despite Passing Checks

- **Cause**: Branch not up to date with `main`
- **Solution**: Merge `main` into your branch or rebase

### Administrators Can Bypass Rules

- **Cause**: "Include administrators" not enabled
- **Solution**: Enable "Include administrators" in branch protection

### Force Push Blocked

- **Cause**: "Allow force pushes" is disabled (correct)
- **Solution**: This is intentional for protection

## Signed Commits Setup

To enable signed commits for your account:

### Using GPG (Recommended)

```bash
# Generate GPG key
gpg --full-generate-key

# List keys
gpg --list-secret-keys --keyid-format=long

# Export public key
gpg --armor --export YOUR_KEY_ID

# Add to GitHub: Settings → SSH and GPG keys → New GPG key
```

### Using SSH (Simpler)

```bash
# Configure git to use SSH signing
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub

# Enable signing by default
git config --global commit.gpgsign true
```

### Verify Signing

```bash
# Make a signed commit
git commit -S -m "test signed commit"

# Verify signature
git log --show-signature -1
```

## Team Access Configuration

Configure team permissions for code review:

1. Go to: https://github.com/fattyageboy/BerthCare/settings/access
2. Add teams with appropriate permissions:
   - **@berthcare/tech-leads**: Admin
   - **@berthcare/mobile-team**: Write
   - **@berthcare/backend-team**: Write
   - **@berthcare/devops-team**: Write
   - **@berthcare/design-team**: Write
   - **@berthcare/security-team**: Write

## CODEOWNERS Integration

The repository has a `CODEOWNERS` file that automatically requests reviews:

- Changes to `/apps/mobile/` → @berthcare/mobile-team
- Changes to `/apps/backend/` → @berthcare/backend-team
- Changes to `/terraform/` → @berthcare/devops-team
- Changes to security files → @berthcare/security-team

This works automatically once branch protection is enabled with "Require review from Code Owners".

## Maintenance

### Regular Reviews

- Review branch protection rules quarterly
- Update required status checks as CI evolves
- Adjust approval requirements based on team size

### Updates

- Keep this document updated when rules change
- Notify team of any protection rule changes
- Document exceptions or temporary bypasses

---

**Setup Date**: October 10, 2025  
**Last Reviewed**: October 10, 2025  
**Next Review**: January 10, 2026
