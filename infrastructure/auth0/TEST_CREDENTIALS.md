# Test User Credentials - Development Environment

**CONFIDENTIAL - DEVELOPMENT USE ONLY**

This document contains test user credentials for the Berthcare Auth0 development tenant. These credentials are for development and testing purposes only and must NEVER be used in production.

## Security Notice

- These credentials are for the development environment only
- All passwords follow the pattern: `Dev[Role]2025!Test`
- These accounts should be deleted before production deployment
- Passwords should be changed if this document is ever publicly exposed

## Standard Test Users

### Nurse Account
- **Email**: `nurse.test@berthcare.dev`
- **Password**: `DevNurse2025!Test`
- **Role**: Nurse
- **Purpose**: Test nurse workflows, visit management, photo uploads
- **Permissions**: Read/write visits, read care plans, photo upload, messaging

**User Details:**
- Name: Sarah Johnson
- Employee ID: EMP-N-001
- Phone: +1-555-0101
- Department: Nursing

---

### PSW Account
- **Email**: `psw.test@berthcare.dev`
- **Password**: `DevPSW2025!Test`
- **Role**: PSW
- **Purpose**: Test PSW workflows, visit completion, basic care tasks
- **Permissions**: Read/write visits, read care plans, photo upload, messaging

**User Details:**
- Name: Michael Chen
- Employee ID: EMP-P-001
- Phone: +1-555-0102
- Department: Personal Support

---

### Coordinator Account
- **Email**: `coordinator.test@berthcare.dev`
- **Password**: `DevCoord2025!Test`
- **Role**: Coordinator
- **Purpose**: Test care coordination, team management, care plan creation
- **Permissions**: Full visit and care plan management, user management, analytics

**User Details:**
- Name: Emma Martinez
- Employee ID: EMP-C-001
- Phone: +1-555-0103
- Department: Care Coordination

---

### Supervisor Account
- **Email**: `supervisor.test@berthcare.dev`
- **Password**: `DevSuper2025!Test`
- **Role**: Supervisor
- **Purpose**: Test supervisory functions, audit logs, user role management
- **Permissions**: Full administrative access, audit logs, system configuration

**User Details:**
- Name: James Williams
- Employee ID: EMP-S-001
- Phone: +1-555-0104
- Department: Operations

---

### Admin Account
- **Email**: `admin.test@berthcare.dev`
- **Password**: `DevAdmin2025!Test`
- **Role**: Admin
- **Purpose**: Test system administration, full configuration access
- **Permissions**: Complete system access, all permissions

**User Details:**
- Name: Admin User
- Employee ID: EMP-A-001
- Phone: +1-555-0105
- Department: IT Administration

---

### Family Member Account
- **Email**: `family.test@berthcare.dev`
- **Password**: `DevFamily2025!Test`
- **Role**: Family Member
- **Purpose**: Test family portal, limited read-only access
- **Permissions**: Read family info, visit history, care plan summary, messaging

**User Details:**
- Name: Robert Thompson
- Relationship: Son
- Client ID: client_001
- Primary Contact: Yes

---

## MFA-Enabled Test Users

### Nurse with MFA
- **Email**: `nurse.mfa@berthcare.dev`
- **Password**: `DevNurseMFA2025!Test`
- **Role**: Nurse
- **Purpose**: Test MFA enrollment and authentication flows
- **MFA**: Required (SMS or TOTP)

**User Details:**
- Name: Jennifer Davis
- Employee ID: EMP-N-002
- Phone: +1-555-0201
- Department: Nursing

**MFA Setup:**
- On first login, user will be prompted to enroll in MFA
- Choose SMS (requires valid phone) or TOTP (use Google Authenticator)
- Backup codes will be provided

---

### Admin with MFA
- **Email**: `admin.mfa@berthcare.dev`
- **Password**: `DevAdminMFA2025!Test`
- **Role**: Admin
- **Purpose**: Test privileged account MFA enforcement
- **MFA**: Required (SMS or TOTP)

**User Details:**
- Name: System Administrator
- Employee ID: EMP-A-002
- Phone: +1-555-0202
- Department: IT Administration

**Note**: Admin and Supervisor roles automatically enforce MFA via Auth0 Rules

---

## Quick Login Reference

| Role | Email | Password | MFA |
|------|-------|----------|-----|
| Nurse | nurse.test@berthcare.dev | DevNurse2025!Test | No |
| PSW | psw.test@berthcare.dev | DevPSW2025!Test | No |
| Coordinator | coordinator.test@berthcare.dev | DevCoord2025!Test | No |
| Supervisor | supervisor.test@berthcare.dev | DevSuper2025!Test | No |
| Admin | admin.test@berthcare.dev | DevAdmin2025!Test | No |
| Family | family.test@berthcare.dev | DevFamily2025!Test | No |
| Nurse (MFA) | nurse.mfa@berthcare.dev | DevNurseMFA2025!Test | Yes |
| Admin (MFA) | admin.mfa@berthcare.dev | DevAdminMFA2025!Test | Yes |

---

## Testing Scenarios

### Scenario 1: Basic Authentication
1. Use `nurse.test@berthcare.dev` to test basic login
2. Verify token contains role: `Nurse`
3. Test access to assigned visits

### Scenario 2: Role-Based Access Control
1. Log in as `nurse.test@berthcare.dev`
2. Attempt to access admin functions (should fail)
3. Log in as `admin.test@berthcare.dev`
4. Verify admin access granted

### Scenario 3: MFA Enrollment
1. Log in as `nurse.mfa@berthcare.dev`
2. Complete MFA enrollment (SMS or TOTP)
3. Save backup codes
4. Log out and log in again
5. Verify MFA prompt appears

### Scenario 4: MFA Enforcement
1. Log in as `admin.test@berthcare.dev`
2. Verify MFA is enforced even without prior enrollment
3. Complete MFA setup
4. Verify cannot skip MFA

### Scenario 5: Family Portal Access
1. Log in as `family.test@berthcare.dev`
2. Verify limited read-only access
3. Test viewing visit history
4. Confirm cannot edit care plans

### Scenario 6: Token Refresh
1. Log in with any account
2. Wait for access token to expire (1 hour)
3. Use refresh token to get new access token
4. Verify new token is valid

---

## Auth0 Management API Credentials

For automated testing and configuration management:

**Application**: Berthcare Auth0 Management (M2M)
**Type**: Machine-to-Machine

These credentials are stored in environment variables:
- `AUTH0_DOMAIN`: Your tenant domain (e.g., berthcare-dev.us.auth0.com)
- `AUTH0_CLIENT_ID`: M2M application client ID
- `AUTH0_CLIENT_SECRET`: M2M application client secret

**Never commit these to version control!**

---

## Application Client IDs

After setup, note these Client IDs for application configuration:

**Web Application**:
- Name: Berthcare Web App (Development)
- Client ID: `[Get from Auth0 Dashboard]`
- Type: Single Page Application (SPA)
- Auth Method: PKCE

**Mobile Application**:
- Name: Berthcare Mobile App (Development)
- Client ID: `[Get from Auth0 Dashboard]`
- Type: Native
- Auth Method: PKCE

**Backend API**:
- Name: Berthcare Backend API (Development)
- Client ID: `[Get from Auth0 Dashboard]`
- Client Secret: `[Get from Auth0 Dashboard]`
- Type: Machine-to-Machine
- Auth Method: Client Credentials

---

## Password Reset

If you need to reset a test user password:

1. Go to Auth0 Dashboard > User Management > Users
2. Find the user by email
3. Click on the user
4. Click "Actions" > "Change Password"
5. Enter new password (must meet password policy)

Or use the Management API:

```bash
curl -X PATCH "https://${AUTH0_DOMAIN}/api/v2/users/${USER_ID}" \
  -H "Authorization: Bearer ${MGMT_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"password": "NewPassword123!"}'
```

---

## Security Reminders

1. **These are test credentials** - Do not use in production
2. **Rotate regularly** - Change passwords every 90 days
3. **Monitor usage** - Review Auth0 logs for suspicious activity
4. **Limit sharing** - Only share with authorized team members
5. **Delete before production** - Remove all test users before going live

---

## Creating Additional Test Users

To create more test users:

1. **Via Auth0 Dashboard**:
   - User Management > Users > Create User
   - Follow the same naming pattern (*.berthcare.dev)
   - Assign appropriate role
   - Add metadata as needed

2. **Via Management API**:
   ```bash
   curl -X POST "https://${AUTH0_DOMAIN}/api/v2/users" \
     -H "Authorization: Bearer ${MGMT_API_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "newuser.test@berthcare.dev",
       "password": "SecurePassword123!",
       "connection": "Username-Password-Authentication",
       "email_verified": true
     }'
   ```

3. **Document credentials** in this file following the same format

---

## Credential Storage

Store credentials securely:

- **Development**: Use environment variables or `.env.local` (gitignored)
- **CI/CD**: Use secrets management (GitHub Secrets, etc.)
- **Team Sharing**: Use secure password manager (1Password, LastPass)
- **Never**: Commit to version control, share via email/Slack

---

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Environment**: Development Only
**Tenant**: berthcare-dev.us.auth0.com

**CONFIDENTIAL - DO NOT SHARE OUTSIDE DEVELOPMENT TEAM**
