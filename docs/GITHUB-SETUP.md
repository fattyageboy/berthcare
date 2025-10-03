# GitHub Repository Setup Instructions

This document provides step-by-step instructions for creating the remote GitHub repository and configuring branch protections for the BerthCare project.

## Prerequisites

- GitHub account with appropriate organization permissions
- Git configured locally with your credentials
- Local repository initialized (completed)

## Step 1: Create GitHub Repository

### Option A: Using GitHub CLI (Recommended)

```bash
# Login to GitHub (if not already authenticated)
gh auth login

# Create the repository in your organization
gh repo create berthcare/berthcare --public --description "Offline-first mobile application for home care documentation" --source=. --remote=origin --push

# Or for a private repository
gh repo create berthcare/berthcare --private --description "Offline-first mobile application for home care documentation" --source=. --remote=origin --push
```

### Option B: Using GitHub Web Interface

1. Navigate to https://github.com/organizations/berthcare/repositories/new
2. Repository name: `berthcare`
3. Description: `Offline-first mobile application for home care documentation`
4. Visibility: Choose Public or Private
5. Do NOT initialize with README, .gitignore, or license (already created locally)
6. Click "Create repository"

Then push your local repository:

```bash
# Add the remote repository
git remote add origin https://github.com/berthcare/berthcare.git

# Push the initial commit
git push -u origin main
```

## Step 2: Configure Branch Protection Rules

After creating the repository, configure branch protection for `main` and `develop` branches.

### Protecting the Main Branch

1. Navigate to: `Settings` > `Branches` > `Branch protection rules` > `Add rule`

2. **Branch name pattern**: `main`

3. **Required Settings**:
   - [ ] Require a pull request before merging
     - [ ] Require approvals: **2**
     - [ ] Dismiss stale pull request approvals when new commits are pushed
     - [ ] Require review from Code Owners
   - [ ] Require status checks to pass before merging
     - [ ] Require branches to be up to date before merging
     - Add status checks (after CI/CD is configured):
       - `test-backend`
       - `test-frontend`
       - `lint`
       - `security-scan`
   - [ ] Require conversation resolution before merging
   - [ ] Require signed commits
   - [ ] Require linear history
   - [ ] Include administrators (enforce rules for admins too)
   - [ ] Restrict who can push to matching branches
     - Add teams: `@berthcare/release-managers`
   - [ ] Allow force pushes: **Disabled**
   - [ ] Allow deletions: **Disabled**

4. Click **Create** or **Save changes**

### Protecting the Develop Branch

1. Add another branch protection rule
2. **Branch name pattern**: `develop`
3. **Required Settings**:
   - [ ] Require a pull request before merging
     - [ ] Require approvals: **2**
     - [ ] Dismiss stale pull request approvals when new commits are pushed
     - [ ] Require review from Code Owners
   - [ ] Require status checks to pass before merging
     - [ ] Require branches to be up to date before merging
   - [ ] Require conversation resolution before merging
   - [ ] Require signed commits
   - [ ] Include administrators
   - [ ] Allow force pushes: **Disabled**
   - [ ] Allow deletions: **Disabled**

4. Click **Create** or **Save changes**

## Step 3: Enable Signed Commits

### For Individual Contributors

1. **Generate a GPG key** (if not already done):
```bash
gpg --full-generate-key
# Choose RSA and RSA, 4096 bits, no expiration
```

2. **List your GPG keys**:
```bash
gpg --list-secret-keys --keyid-format=long
```

3. **Copy your GPG key ID** and export it:
```bash
gpg --armor --export YOUR_KEY_ID
```

4. **Add GPG key to GitHub**:
   - Navigate to: `Settings` > `SSH and GPG keys` > `New GPG key`
   - Paste your GPG key

5. **Configure Git to sign commits**:
```bash
git config --global user.signingkey YOUR_KEY_ID
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

### Organizational Setup

For team-wide enforcement, ensure all team members:
1. Have GPG keys configured
2. Have added their GPG keys to their GitHub accounts
3. Have configured Git to sign commits by default

Reference: https://docs.github.com/en/authentication/managing-commit-signature-verification

## Step 4: Configure Repository Settings

### General Settings

Navigate to: `Settings` > `General`

1. **Features**:
   - [ ] Issues enabled
   - [ ] Projects enabled
   - [ ] Preserve this repository
   - [ ] Discussions (optional)
   - [ ] Sponsorships (optional)

2. **Pull Requests**:
   - [ ] Allow squash merging (recommended)
   - [ ] Allow merge commits
   - [ ] Allow rebase merging
   - [ ] Automatically delete head branches

### Security Settings

Navigate to: `Settings` > `Security & analysis`

1. **Dependency graph**: Enable
2. **Dependabot alerts**: Enable
3. **Dependabot security updates**: Enable
4. **Secret scanning**: Enable (if available)
5. **Code scanning**: Configure GitHub Advanced Security

### Collaborators and Teams

Navigate to: `Settings` > `Collaborators and teams`

Add teams with appropriate permissions:
- `@berthcare/core-team` - Admin
- `@berthcare/mobile-team` - Write
- `@berthcare/backend-team` - Write
- `@berthcare/web-team` - Write
- `@berthcare/devops-team` - Maintain
- `@berthcare/security-team` - Admin
- `@berthcare/qa-team` - Write
- `@berthcare/design-team` - Triage
- `@berthcare/documentation-team` - Write

## Step 5: Set Up GitHub Actions Secrets

Navigate to: `Settings` > `Secrets and variables` > `Actions`

Add the following secrets (will be needed for CI/CD):

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
DOCKER_USERNAME
DOCKER_PASSWORD
SENTRY_AUTH_TOKEN
NEW_RELIC_API_KEY
SLACK_WEBHOOK_URL
```

## Step 6: Configure Webhooks (Optional)

Navigate to: `Settings` > `Webhooks`

Add webhooks for:
- Slack notifications
- Jira integration
- Custom deployment triggers

## Step 7: Create Initial Issues and Projects

### Create Development Board

1. Navigate to `Projects` > `New project`
2. Choose "Board" template
3. Create columns: `Backlog`, `To Do`, `In Progress`, `In Review`, `Done`
4. Link to repository

### Create Initial Issues

Create issues for immediate next steps:
- Set up CI/CD pipeline with GitHub Actions
- Configure development environment
- Set up staging and production AWS environments
- Implement backend service scaffolding
- Implement mobile app scaffolding

## Verification Checklist

After completing the setup, verify:

- [ ] Repository is created and accessible to team
- [ ] Initial commit is pushed to `main` branch
- [ ] Branch protection is enabled on `main` with 2 required reviewers
- [ ] Branch protection is enabled on `develop` with 2 required reviewers
- [ ] Signed commits are required and enforced
- [ ] Status checks are configured (will be populated after CI/CD setup)
- [ ] CODEOWNERS file is recognized by GitHub
- [ ] Dependabot is enabled
- [ ] Teams have appropriate access levels
- [ ] Secrets are configured for CI/CD

## Next Steps

1. **Create the `develop` branch**:
```bash
git checkout -b develop
git push -u origin develop
```

2. **Set `develop` as the default branch** (optional):
   - Navigate to: `Settings` > `Branches`
   - Change default branch to `develop`

3. **Begin feature development**:
```bash
git checkout develop
git checkout -b feature/setup-ci-cd
# Make changes
git add .
git commit -s -m "feat: configure GitHub Actions CI/CD pipeline"
git push origin feature/setup-ci-cd
# Create pull request on GitHub
```

## Troubleshooting

### Common Issues

**Issue**: Unable to push due to signed commit requirement
- **Solution**: Configure GPG signing as described in Step 3

**Issue**: Branch protection rules not enforced
- **Solution**: Verify "Include administrators" is checked if testing with admin account

**Issue**: Status checks failing
- **Solution**: Ensure GitHub Actions workflows are configured before requiring status checks

**Issue**: CODEOWNERS not working
- **Solution**: Verify file is at repository root and team names match GitHub teams exactly

## Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Signed Commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
- [CODEOWNERS Syntax](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For questions about GitHub setup:
- Contact DevOps team: @berthcare/devops-team
- Create an issue in the repository
- Reference this documentation in team onboarding
