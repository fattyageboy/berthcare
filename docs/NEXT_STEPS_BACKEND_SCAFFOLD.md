# Task B1: Backend Scaffold - Completion Instructions

## Current Status

✅ **Completed:**
- Feature branch `feat/backend-scaffold` created and checked out
- Initial commit created with infrastructure and CI/CD files
- 24 files committed including:
  - GitHub Actions CI/CD pipeline
  - Docker Compose development environment
  - Auth0 infrastructure configuration
  - Database seed files
  - Development Makefile
  - Environment variable template

⚠️ **Pending GitHub Repository Setup:**
- Remote GitHub repository not yet configured
- Branch not yet pushed to remote
- Draft PR not yet created

## Prerequisites

Before proceeding, you need to set up the GitHub repository. Follow the instructions in `GITHUB-SETUP.md`.

### Quick Setup (Using GitHub CLI)

If you have the `gh` CLI installed and want to use it:

```bash
# Login to GitHub
gh auth login

# Create the repository (adjust organization name as needed)
gh repo create berthcare/berthcare \
  --public \
  --description "Offline-first mobile application for home care documentation" \
  --source=. \
  --remote=origin \
  --push
```

### Manual Setup (Using GitHub Web Interface)

1. **Create GitHub Repository:**
   - Navigate to: https://github.com/organizations/berthcare/repositories/new
   - Repository name: `berthcare` (or your preferred name)
   - Description: `Offline-first mobile application for home care documentation`
   - Visibility: Choose Public or Private
   - Do NOT initialize with README, .gitignore, or license
   - Click "Create repository"

2. **Add Remote and Push:**
   ```bash
   # Add the remote repository (adjust URL to match your repository)
   git remote add origin https://github.com/YOUR_ORG/berthcare.git

   # Push main branch first
   git checkout main
   git push -u origin main

   # Push feature branch
   git checkout feat/backend-scaffold
   git push -u origin feat/backend-scaffold
   ```

## Step-by-Step Completion Instructions

### Step 1: Verify Your Current Branch

```bash
# Confirm you're on the feature branch
git branch --show-current
# Should output: feat/backend-scaffold

# View commit history
git log --oneline -3
# Should show:
# 7f8e2c5 feat: add backend infrastructure and CI/CD configuration
# 65c93f4 chore: initialize BerthCare project repository
```

### Step 2: Configure Git Remote (if not already done)

```bash
# Check if remote is configured
git remote -v

# If no remote is configured, add it (replace with your actual repository URL)
git remote add origin https://github.com/YOUR_ORG/berthcare.git

# Verify remote was added
git remote -v
```

### Step 3: Push Main Branch (First Time)

```bash
# Switch to main branch
git checkout main

# Push main branch to establish it on remote
git push -u origin main

# Verify push succeeded
git status
```

### Step 4: Push Feature Branch

```bash
# Switch back to feature branch
git checkout feat/backend-scaffold

# Push feature branch to remote (this will trigger CI)
git push -u origin feat/backend-scaffold

# Verify push succeeded
git status
```

### Step 5: Create Draft Pull Request

#### Option A: Using GitHub CLI (Recommended)

```bash
# Create draft PR with comprehensive description
gh pr create \
  --title "feat: Backend infrastructure and CI/CD setup" \
  --draft \
  --body "$(cat PR_DESCRIPTION_BACKEND_SCAFFOLD.md)"
```

#### Option B: Using GitHub Web Interface

1. **Navigate to your repository on GitHub**
2. **Click "Pull requests" tab**
3. **Click "New pull request"**
4. **Select branches:**
   - Base: `main`
   - Compare: `feat/backend-scaffold`
5. **Click "Create pull request"**
6. **Set as draft:** Check "Create draft pull request"
7. **Add title:** `feat: Backend infrastructure and CI/CD setup`
8. **Add description:** Copy content from `PR_DESCRIPTION_BACKEND_SCAFFOLD.md`
9. **Click "Create draft pull request"**

### Step 6: Verify CI Pipeline Execution

1. **Navigate to the Pull Request** you just created
2. **Scroll to the bottom** to see CI checks status
3. **Click "Details"** on any check to view execution logs
4. **Expected Checks:**
   - Code Quality (Lint & Type Check)
   - Unit Tests
   - SAST (SonarQube)
   - Dependency Audit (npm)
   - Dependency Security (Snyk)
   - CI Summary

**Note:** Some checks may fail initially if GitHub Secrets are not configured yet. This is expected.

### Step 7: Configure GitHub Secrets (If Not Already Done)

Required secrets for CI pipeline (see `.github/SECRETS-REFERENCE.md`):

1. **Navigate to:** Repository Settings > Secrets and variables > Actions
2. **Add the following secrets:**
   - `SONAR_TOKEN` - SonarQube authentication token
   - `SONAR_HOST_URL` - SonarQube server URL
   - `SNYK_TOKEN` - Snyk authentication token

3. **Re-run failed checks** after adding secrets

### Step 8: Link to GitHub Issue (Optional)

If you have a GitHub issue for this task:

```bash
# Using GitHub CLI
gh pr edit --add-project "BerthCare Development"

# Or edit the PR description to add:
# Closes #<issue-number>
```

### Step 9: Verify Task Completion

Confirm the following:

- ✅ Branch `feat/backend-scaffold` created from `main`
- ✅ Branch pushed to remote repository
- ✅ Draft PR created with comprehensive checklist
- ✅ CI pipeline triggered and executing (or completed)
- ✅ PR linked to issue (if applicable)

## Expected Output

After completing all steps, you should have:

1. **Branch Status:**
   ```
   Branch: feat/backend-scaffold
   Commits ahead of main: 1
   Remote tracking: origin/feat/backend-scaffold
   ```

2. **Pull Request:**
   - Status: Draft
   - Title: feat: Backend infrastructure and CI/CD setup
   - Checks: Running or Completed
   - Description: Comprehensive checklist included

3. **CI Pipeline:**
   - All jobs triggered
   - Status visible in PR
   - Artifacts available after completion

## Troubleshooting

### Issue: Remote repository not found

**Solution:**
```bash
# Verify remote URL is correct
git remote -v

# Update remote URL if needed
git remote set-url origin https://github.com/YOUR_ORG/berthcare.git
```

### Issue: Push rejected due to authentication

**Solution:**
```bash
# Configure Git credentials
git config --global credential.helper cache

# Or use SSH instead of HTTPS
git remote set-url origin git@github.com:YOUR_ORG/berthcare.git
```

### Issue: CI checks failing

**Expected for initial setup:**
- SonarQube and Snyk checks will fail until secrets are configured
- This is normal and can be resolved by adding the required secrets

**Unexpected failures:**
- Check workflow logs in GitHub Actions tab
- Verify workflow file syntax in `.github/workflows/ci.yml`
- Ensure Node.js and npm are properly configured in CI environment

### Issue: Cannot create PR (no differences)

**Solution:**
```bash
# Ensure you're on the correct branch
git checkout feat/backend-scaffold

# Verify commits exist
git log --oneline main..feat/backend-scaffold

# If no commits, ensure changes were committed
git status
```

### Issue: `gh` CLI not available

**Solution:**
Install GitHub CLI:
- macOS: `brew install gh`
- Linux: See https://github.com/cli/cli#installation
- Windows: See https://github.com/cli/cli#installation

Or use the GitHub web interface method described above.

## Next Tasks After Completion

After this task is complete and the PR is created:

1. **Configure GitHub Secrets** for CI/CD pipeline
2. **Request code review** from team members
3. **Address any CI failures** (after secrets are configured)
4. **Begin Task B2:** Backend API scaffolding
5. **Begin Task B3:** Database migration setup

## Reference Documentation

- `GITHUB-SETUP.md` - Complete GitHub repository setup guide
- `PR_DESCRIPTION_BACKEND_SCAFFOLD.md` - Full PR description template
- `.github/CI-SETUP.md` - CI/CD pipeline documentation
- `.github/SECRETS-REFERENCE.md` - Required secrets documentation
- `LOCAL_DEVELOPMENT.md` - Local development setup guide

## Summary

**Task B1 Status:**
- Estimated Effort: 0.1 day
- Current Progress: 80% (branch created, commit made, needs push and PR)
- Remaining Work: Push branch, create PR, verify CI
- Dependencies: GitHub repository must be set up first

**Commands to Execute:**

```bash
# 1. Ensure you're on the feature branch
git checkout feat/backend-scaffold

# 2. Push to remote (replace URL with your repository)
git remote add origin https://github.com/YOUR_ORG/berthcare.git
git push -u origin main
git push -u origin feat/backend-scaffold

# 3. Create draft PR (using gh CLI)
gh pr create --title "feat: Backend infrastructure and CI/CD setup" --draft --body "$(cat PR_DESCRIPTION_BACKEND_SCAFFOLD.md)"

# 4. Get PR URL
gh pr view --web
```

---

**Need Help?**
- Review `GITHUB-SETUP.md` for repository setup
- Check `.github/CI-SETUP.md` for CI/CD troubleshooting
- Consult team documentation or create an issue

---

Generated with [Claude Code](https://claude.com/claude-code)
