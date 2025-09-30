# GitHub Secrets Reference Guide

Quick reference for setting up required secrets for the CI pipeline.

## Required Secrets

| Secret Name | Description | How to Obtain | Required For |
|-------------|-------------|---------------|--------------|
| `SONAR_TOKEN` | SonarQube authentication token | SonarQube Dashboard > My Account > Security > Generate Tokens | SAST analysis |
| `SONAR_HOST_URL` | SonarQube instance URL | `https://sonarcloud.io` (cloud) or your self-hosted URL | SAST analysis |
| `SNYK_TOKEN` | Snyk API authentication token | Snyk Dashboard > Settings > General > Auth Token | Dependency security scanning |

## Quick Setup Steps

### 1. Add Secrets to GitHub

```bash
# Navigate to your repository on GitHub
# Go to: Settings > Secrets and variables > Actions > New repository secret
```

### 2. SonarQube Setup

**For SonarQube Cloud:**

1. Visit: https://sonarcloud.io/
2. Login and create project
3. Generate token: My Account > Security > Generate Tokens
4. Add to GitHub:
   - Name: `SONAR_TOKEN`
   - Value: `[generated token]`
   - Name: `SONAR_HOST_URL`
   - Value: `https://sonarcloud.io`

**For Self-Hosted SonarQube:**

1. Access your SonarQube instance
2. Create project: Administration > Projects > Create Project
3. Generate token: Administration > Security > Users > [Your User] > Tokens
4. Add to GitHub:
   - Name: `SONAR_TOKEN`
   - Value: `[generated token]`
   - Name: `SONAR_HOST_URL`
   - Value: `https://your-sonarqube-instance.com`

### 3. Snyk Setup

1. Visit: https://app.snyk.io/
2. Sign up or login
3. Navigate to: Settings > General > Auth Token
4. Copy your token
5. Add to GitHub:
   - Name: `SNYK_TOKEN`
   - Value: `[your token]`

## Verification

After adding secrets, verify they are configured correctly:

```bash
# In your repository:
# Settings > Secrets and variables > Actions

# You should see:
✓ SONAR_TOKEN (updated X days ago)
✓ SONAR_HOST_URL (updated X days ago)
✓ SNYK_TOKEN (updated X days ago)
```

## Security Notes

- **Never commit secrets to repository**
- **Rotate tokens every 90 days**
- **Use minimum required permissions**
- **Audit secret access regularly**
- **Delete unused secrets immediately**

## Testing Secrets

To test if secrets are working:

1. Create a test branch
2. Push a commit
3. Open a PR to `main`
4. Watch the CI pipeline run
5. If any job fails with "secret not found" errors, review secret configuration

## Troubleshooting

| Error | Solution |
|-------|----------|
| `SONAR_TOKEN not found` | Verify secret name is exactly `SONAR_TOKEN` (case-sensitive) |
| `SONAR_HOST_URL not found` | Verify secret name is exactly `SONAR_HOST_URL` |
| `Invalid SonarQube token` | Regenerate token in SonarQube and update GitHub secret |
| `SNYK_TOKEN not found` | Verify secret name is exactly `SNYK_TOKEN` |
| `Snyk authentication failed` | Verify token is valid in Snyk dashboard |

## Token Permissions

### SonarQube Token

Required permissions:
- **Execute Analysis** (for scanning code)
- **Browse** (for quality gate checks)

### Snyk Token

Required permissions:
- **Read** (for scanning dependencies)
- **Test** (for running vulnerability checks)

## Expiration Management

| Secret | Recommended Expiration | Renewal Process |
|--------|------------------------|-----------------|
| `SONAR_TOKEN` | 90 days | Regenerate in SonarQube, update GitHub secret |
| `SNYK_TOKEN` | 90 days | Regenerate in Snyk, update GitHub secret |

## Additional Security Measures

1. **Enable Secret Scanning:** Settings > Code security and analysis > Secret scanning
2. **Enable Dependabot:** Settings > Code security and analysis > Dependabot alerts
3. **Audit Token Usage:** Regularly review which workflows use which secrets
4. **Principle of Least Privilege:** Only grant necessary permissions to tokens

---

**Note:** This guide covers secrets for CI pipeline only. For deployment secrets (AWS, database credentials, etc.), refer to the deployment documentation.
