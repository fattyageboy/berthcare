# Auth0 Development Tenant Configuration for Berthcare

This directory contains the complete Auth0 configuration for the Berthcare development environment, including tenant settings, roles, permissions, MFA configuration, and test users.

## Overview

The Berthcare application uses Auth0 as its authentication and authorization provider, implementing:

- **Role-Based Access Control (RBAC)** with 6 distinct roles
- **Multi-Factor Authentication (MFA)** with SMS and TOTP support
- **JWT-based authentication** with 1-hour access tokens and 30-day refresh tokens
- **Device binding** and session management
- **Comprehensive permissions** mapped to API scopes

## Directory Structure

```
infrastructure/auth0/
├── README.md                      # This file
├── tenant.yaml                    # Core tenant configuration
├── clients.yaml                   # Application definitions (Web, Mobile, Backend)
├── resource-servers.yaml          # API definition with scopes/permissions
├── roles.yaml                     # Role definitions and permission mappings
├── database-connections.yaml      # Database connection settings
├── rules.yaml                     # Auth0 Rules for custom authentication logic
├── guardian.yaml                  # MFA configuration
├── test-users.yaml               # Test user credentials (DEV ONLY)
├── deploy-config.json            # Auth0 Deploy CLI configuration
├── setup.sh                      # Automated setup script
└── verify-auth0.sh               # Configuration verification script
```

## Prerequisites

Before setting up the Auth0 tenant, ensure you have:

1. **Auth0 Account**
   - Sign up at https://auth0.com
   - Create a new tenant (e.g., `berthcare-dev`)

2. **Required Tools**
   - Node.js 16+ and npm
   - Auth0 Deploy CLI: `npm install -g auth0-deploy-cli`
   - jq (for verification): `brew install jq`
   - curl (usually pre-installed)

3. **Auth0 Management API Application**
   - Create a Machine-to-Machine application in Auth0 Dashboard
   - Authorize it for the Auth0 Management API
   - Grant all scopes (for development)
   - Note the Domain, Client ID, and Client Secret

## Quick Start

### Step 1: Set Environment Variables

```bash
export AUTH0_DOMAIN="your-tenant.us.auth0.com"
export AUTH0_CLIENT_ID="your_m2m_client_id"
export AUTH0_CLIENT_SECRET="your_m2m_client_secret"
```

### Step 2: Run Setup Script

```bash
cd infrastructure/auth0
bash setup.sh
```

This script will:
- Validate prerequisites
- Back up existing configuration
- Deploy tenant settings, clients, API, roles, and rules
- Guide you through MFA setup
- Provide next steps

### Step 3: Create Test Users

Test users must be created manually or via the Management API. Use the credentials from `test-users.yaml`:

**Standard Test Users:**
- `nurse.test@berthcare.dev` / `DevNurse2025!Test`
- `psw.test@berthcare.dev` / `DevPSW2025!Test`
- `coordinator.test@berthcare.dev` / `DevCoord2025!Test`
- `supervisor.test@berthcare.dev` / `DevSuper2025!Test`
- `admin.test@berthcare.dev` / `DevAdmin2025!Test`
- `family.test@berthcare.dev` / `DevFamily2025!Test`

**MFA-Enabled Test Users:**
- `nurse.mfa@berthcare.dev` / `DevNurseMFA2025!Test`
- `admin.mfa@berthcare.dev` / `DevAdminMFA2025!Test`

#### Manual User Creation Steps:

1. Go to Auth0 Dashboard > User Management > Users
2. Click "Create User"
3. Enter email and password from `test-users.yaml`
4. Set connection to "Username-Password-Authentication"
5. After creation, go to user's "Roles" tab and assign appropriate role
6. Optionally, add metadata from `test-users.yaml` in the "Metadata" tab

### Step 4: Configure MFA (Optional for Development)

1. Go to Auth0 Dashboard > Security > Multi-factor Auth
2. Enable SMS:
   - Requires Twilio account (SID, Auth Token, Phone Number)
   - Configure in Auth0 Dashboard under SMS settings
3. Enable One-Time Password (TOTP)
   - No additional configuration required
4. Configure MFA policies:
   - Set to "Adaptive" or "Always" for development testing

### Step 5: Verify Configuration

```bash
bash verify-auth0.sh
```

This will check:
- Resource Server (API) configuration
- Applications (Web, Mobile, Backend)
- Roles and permissions
- Test users
- MFA settings

## Configuration Details

### Roles and Permissions

The system implements 6 distinct roles aligned with the architecture specification:

#### 1. Nurse
- **Purpose**: Registered nurses providing direct patient care
- **Permissions**:
  - Read/write assigned visits
  - Read care plans
  - Upload/view visit photos
  - Team messaging
  - Read client information

#### 2. PSW (Personal Support Worker)
- **Purpose**: Personal support workers providing care assistance
- **Permissions**: Same as Nurse role
  - Read/write assigned visits
  - Read care plans
  - Upload/view visit photos
  - Team messaging
  - Read client information

#### 3. Coordinator
- **Purpose**: Care coordinators managing teams and care plans
- **Permissions**:
  - Full visit management (read/write/delete)
  - Care plan management (read/write/delete)
  - Client management (read/write)
  - User management (read/write)
  - Photo management (upload/read/delete)
  - Analytics access
  - Organization administration

#### 4. Supervisor
- **Purpose**: Supervisors with full administrative access
- **Permissions**:
  - All Coordinator permissions
  - User deletion
  - Audit log access
  - System administration

#### 5. Admin
- **Purpose**: System administrators with full system access
- **Permissions**:
  - All Supervisor permissions
  - Full system configuration
  - Complete data access

#### 6. Family Member
- **Purpose**: Family members viewing client information
- **Permissions**:
  - Read family-accessible information
  - Read visit history
  - Read care plan summary
  - Team messaging (read/write)

### JWT Token Configuration

**Access Tokens:**
- Lifetime: 1 hour (3600 seconds)
- Algorithm: RS256
- Contains: User roles, metadata, device information
- Namespace: `https://berthcare.ca`

**Refresh Tokens:**
- Lifetime: 30 days (2,592,000 seconds)
- Idle timeout: 15 days (1,296,000 seconds)
- Rotation: Enabled (rotating refresh tokens)
- Automatic expiration on use

**Custom Claims:**
The following custom claims are added to tokens via Rules:
- `https://berthcare.ca/roles`: User roles array
- `https://berthcare.ca/app_metadata`: Application metadata
- `https://berthcare.ca/user_metadata`: User metadata
- `https://berthcare.ca/device`: Device information

### MFA Configuration

**Supported Factors:**
1. **SMS**: One-time code via text message
   - Requires Twilio configuration
   - Template: "Your Berthcare verification code is: {{code}}"

2. **TOTP**: Time-based one-time password
   - Compatible with Google Authenticator, Authy, etc.
   - 30-second time window

**MFA Enforcement:**
- Admin and Supervisor roles: MFA enforced via Rules
- Other roles: Optional MFA enrollment
- Skip duration: 24 hours before re-prompting
- Confidence-based triggering available

### Database Connection

**Connection Name**: Username-Password-Authentication

**Password Policy:**
- Policy: "Good" (medium strength)
- Minimum length: 10 characters
- Password history: 5 previous passwords
- No personal information allowed
- Dictionary check enabled

**Security Features:**
- Brute force protection: Enabled
- Email verification: Required
- MFA support: Enabled

## API Scopes Reference

The Berthcare API (`https://api.dev.berthcare.ca`) exposes the following scopes:

### Visit Management
- `read:visits` - Read visit information
- `write:visits` - Create and update visits
- `delete:visits` - Delete visits

### Care Plan Management
- `read:care_plans` - Read care plan information
- `write:care_plans` - Create and update care plans
- `delete:care_plans` - Delete care plans

### Client Management
- `read:clients` - Read client information
- `write:clients` - Create and update client information
- `delete:clients` - Delete client records

### User Management
- `read:users` - Read user information
- `write:users` - Create and update users
- `delete:users` - Delete users

### Photo Management
- `upload:photos` - Upload visit photos
- `read:photos` - View visit photos
- `delete:photos` - Delete visit photos

### Analytics and Reporting
- `read:analytics` - Access analytics and reports
- `read:audit_logs` - Access audit logs

### Messaging
- `read:messages` - Read messages
- `write:messages` - Send messages

### Family Portal
- `read:family_info` - Read family member accessible information

### System Administration
- `admin:system` - Full system administration access
- `admin:organization` - Organization administration access

## Authentication Rules

The system implements 5 custom Auth0 Rules (executed in order):

### 1. Add User Roles to Access Token (Order: 1)
- Adds user roles to both ID token and access token
- Includes app_metadata and user_metadata
- Namespace: `https://berthcare.ca`

### 2. Enforce MFA for Privileged Roles (Order: 2)
- Enforces MFA for Admin and Supervisor roles
- Checks `app_metadata.requires_mfa` flag
- Disables "Remember Browser" for privileged users

### 3. Add Device Information to Token (Order: 3)
- Captures device ID, name, and type
- Logs IP address and user agent
- Used for device binding and security

### 4. Email Domain Validation (Order: 4, Disabled)
- Validates email domains for production
- Disabled in development environment
- Allows: berthcare.dev, berthcare.ca, gmail.com, test.com

### 5. Log Successful Authentication (Order: 5)
- Logs authentication events
- Updates last_login and last_ip in app_metadata
- Non-blocking (doesn't fail auth on error)

## Testing Authentication

### Test Login Flow

1. **Navigate to Auth0 Universal Login:**
   ```
   https://your-tenant.us.auth0.com/authorize?
     response_type=code&
     client_id=YOUR_WEB_APP_CLIENT_ID&
     redirect_uri=http://localhost:3000/callback&
     scope=openid profile email&
     audience=https://api.dev.berthcare.ca
   ```

2. **Log in with test credentials:**
   - Email: `nurse.test@berthcare.dev`
   - Password: `DevNurse2025!Test`

3. **Verify token contains roles:**
   ```bash
   # Decode the access token at https://jwt.io
   # Check for https://berthcare.ca/roles claim
   ```

### Test MFA Flow

1. **Log in with MFA-enabled user:**
   - Email: `admin.mfa@berthcare.dev`
   - Password: `DevAdminMFA2025!Test`

2. **Complete MFA enrollment:**
   - Choose SMS or TOTP
   - For SMS: Enter phone number
   - For TOTP: Scan QR code with authenticator app

3. **Verify MFA prompt on subsequent logins**

### Test Role-Based Access

Use the Management API to verify role permissions:

```bash
# Get user's access token
ACCESS_TOKEN="user_access_token_here"

# Test accessing API with role-based permissions
curl -X GET https://api.dev.berthcare.ca/api/v1/visits \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

## Updating Configuration

To update the Auth0 configuration:

1. **Modify configuration files** (e.g., `roles.yaml`, `clients.yaml`)

2. **Export current config for backup:**
   ```bash
   a0deploy export -c deploy-config.json -f yaml -o backups/$(date +%Y%m%d)
   ```

3. **Deploy updated configuration:**
   ```bash
   a0deploy import -c deploy-config.json -i .
   ```

4. **Verify changes:**
   ```bash
   bash verify-auth0.sh
   ```

## Environment-Specific Configuration

### Development Environment
- Tenant: `berthcare-dev.us.auth0.com`
- API: `https://api.dev.berthcare.ca`
- Web: `https://dev.berthcare.ca`
- Relaxed security for testing
- Test user access enabled

### Staging Environment (Future)
- Tenant: `berthcare-staging.us.auth0.com`
- API: `https://api.staging.berthcare.ca`
- Web: `https://staging.berthcare.ca`
- Production-like security
- Limited test users

### Production Environment (Future)
- Tenant: `berthcare.us.auth0.com`
- API: `https://api.berthcare.ca`
- Web: `https://app.berthcare.ca`
- Full security enforcement
- No test users

## Security Best Practices

### Development Environment
- ✅ Use separate tenant from production
- ✅ Different client credentials per environment
- ✅ Test users clearly marked (*.dev email domain)
- ✅ MFA optional for easier testing
- ✅ Verbose logging enabled

### Credential Management
- ❌ Never commit secrets to version control
- ✅ Use environment variables for credentials
- ✅ Rotate M2M application secrets regularly
- ✅ Limit M2M API scopes to required permissions
- ✅ Use different credentials per environment

### Token Security
- ✅ Short-lived access tokens (1 hour)
- ✅ Rotating refresh tokens
- ✅ Device binding enabled
- ✅ Automatic token expiration
- ✅ Secure token storage (httpOnly cookies)

## Troubleshooting

### Common Issues

**Issue: "Invalid Client" error**
- Verify CLIENT_ID matches the application in Auth0 Dashboard
- Check that callback URLs are correctly configured
- Ensure application is enabled

**Issue: "Access Denied" error**
- Verify user has correct role assigned
- Check role has required permissions
- Ensure API identifier matches in token audience

**Issue: MFA not prompting**
- Verify MFA is enabled in Auth0 Dashboard
- Check user has `requires_mfa` in app_metadata
- Ensure MFA rules are enabled and in correct order

**Issue: Roles not in token**
- Verify "Add User Roles to Access Token" rule is enabled
- Check rule order (should be first)
- Ensure user has role assigned in Auth0

**Issue: Token expired**
- Access tokens expire after 1 hour
- Use refresh token to get new access token
- Implement token refresh logic in application

### Getting Help

1. **Check Auth0 Logs:**
   - Dashboard > Monitoring > Logs
   - Filter by event type and user

2. **Test with Auth0 Debugger:**
   - Use Auth0's "Try Connection" feature
   - Check token contents at https://jwt.io

3. **Verify with Management API:**
   - Use `verify-auth0.sh` script
   - Check specific configurations via API

4. **Auth0 Documentation:**
   - https://auth0.com/docs
   - https://community.auth0.com

## Integration with Berthcare Backend

The backend application should use the Auth0 SDK to validate tokens:

```javascript
// Example: Express.js middleware
const { auth } = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
  audience: 'https://api.dev.berthcare.ca',
  issuerBaseURL: 'https://your-tenant.us.auth0.com/',
  tokenSigningAlg: 'RS256'
});

app.use('/api', checkJwt);
```

Add role-based authorization middleware:

```javascript
const checkRole = (roles) => {
  return (req, res, next) => {
    const userRoles = req.auth['https://berthcare.ca/roles'] || [];
    if (roles.some(role => userRoles.includes(role))) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};

// Usage
app.get('/api/admin/users', checkJwt, checkRole(['Admin', 'Supervisor']), (req, res) => {
  // Handle request
});
```

## Maintenance

### Regular Tasks

**Monthly:**
- Review user access and roles
- Check for unused applications
- Audit MFA enrollment rates
- Review authentication logs

**Quarterly:**
- Rotate M2M application credentials
- Update test user passwords
- Review and update rules
- Check for Auth0 security advisories

**As Needed:**
- Update roles and permissions
- Add/remove test users
- Modify MFA policies
- Update application callbacks

## Resources

- **Auth0 Dashboard**: https://manage.auth0.com
- **Auth0 Documentation**: https://auth0.com/docs
- **Auth0 Deploy CLI**: https://github.com/auth0/auth0-deploy-cli
- **JWT Debugger**: https://jwt.io
- **Architecture Documentation**: `/project-documentation/architecture-output.md` (lines 711-753)

## Support

For issues or questions:
1. Check this README and troubleshooting section
2. Review Auth0 logs in the dashboard
3. Consult architecture documentation
4. Contact the development team

---

**Last Updated**: 2025-09-30
**Environment**: Development
**Auth0 Tenant**: berthcare-dev.us.auth0.com
