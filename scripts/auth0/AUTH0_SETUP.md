# Auth0 Development Tenant Configuration Guide

## Overview

This guide provides step-by-step instructions for configuring the Auth0 development tenant for the Berthcare application. This setup includes role-based access control (RBAC), multi-factor authentication (MFA), and test user provisioning.

## Prerequisites

- Auth0 account (sign up at https://auth0.com if you don't have one)
- Auth0 CLI installed (optional, but recommended for automation)
- Node.js and npm installed (for running setup scripts)

## Auth0 Tenant Setup

### Step 1: Create Auth0 Tenant

1. Log in to your Auth0 Dashboard: https://manage.auth0.com/
2. Create a new tenant or use an existing development tenant
3. **Recommended tenant name**: `berthcare-dev` or `your-company-berthcare-dev`
4. Select region closest to your development team
5. Environment tag: **Development**

### Step 2: Create Application

1. Navigate to **Applications** > **Applications** in the Auth0 dashboard
2. Click **Create Application**
3. Application details:
   - **Name**: `Berthcare Mobile App (Dev)`
   - **Type**: Native (for React Native mobile app)
4. Click **Create**
5. Configure application settings:

#### Settings Tab:
```
Application Name: Berthcare Mobile App (Dev)
Application Type: Native
Token Endpoint Authentication Method: None (for public clients)

Allowed Callback URLs:
  http://localhost:3000/auth/callback
  berthcare://auth/callback
  exp://localhost:19000/--/auth/callback

Allowed Logout URLs:
  http://localhost:3000/auth/logout
  berthcare://auth/logout
  exp://localhost:19000/--/auth/logout

Allowed Web Origins:
  http://localhost:3000
  http://localhost:19006

Allowed Origins (CORS):
  http://localhost:3000
  http://localhost:19006
  http://localhost:19000
```

6. Scroll down to **Advanced Settings**:
   - Grant Types: Enable all relevant types
     - Authorization Code
     - Refresh Token
     - Password (for testing only)
   - JWT Expiration: 3600 seconds (1 hour)
   - Refresh Token Rotation: Enabled
   - Refresh Token Expiration: 2592000 seconds (30 days)
   - Absolute Refresh Token Lifetime: Enabled

7. Click **Save Changes**

### Step 3: Create API

1. Navigate to **Applications** > **APIs**
2. Click **Create API**
3. API details:
   - **Name**: `Berthcare API (Dev)`
   - **Identifier**: `https://api.berthcare.local`
   - **Signing Algorithm**: RS256

4. Click **Create**

5. Configure API settings:
   - **Token Expiration**: 3600 seconds (1 hour)
   - **Allow Offline Access**: Enabled (for refresh tokens)
   - **Enable RBAC**: Enabled
   - **Add Permissions in the Access Token**: Enabled

6. Click **Save**

### Step 4: Configure Roles

Navigate to **User Management** > **Roles** and create the following roles:

#### 1. Nurse Role
```
Name: nurse
Description: Registered Nurse with access to assigned client visits and care plans
```

#### 2. PSW Role (Personal Support Worker)
```
Name: psw
Description: Personal Support Worker with access to assigned client visits
```

#### 3. Coordinator Role
```
Name: coordinator
Description: Care Coordinator with team management and care plan creation access
```

#### 4. Supervisor Role
```
Name: supervisor
Description: Supervisor with full administrative access and system configuration
```

#### 5. Admin Role
```
Name: admin
Description: System Administrator with complete system access and user management
```

#### 6. Family Member Role
```
Name: family_member
Description: Family member with read-only access to specific client information
```

### Step 5: Configure Permissions

Navigate to your **Berthcare API (Dev)** > **Permissions** tab and add:

#### Visit Management Permissions:
```
read:visits - Read visit information
write:visits - Create and update visits
delete:visits - Delete visits
read:visit_notes - Read visit notes
write:visit_notes - Create and update visit notes
```

#### Care Plan Permissions:
```
read:care_plans - Read care plans
write:care_plans - Create and update care plans
delete:care_plans - Delete care plans
```

#### User Management Permissions:
```
read:users - Read user information
write:users - Create and update users
delete:users - Delete users
manage:roles - Assign and manage user roles
```

#### Client Management Permissions:
```
read:clients - Read client information
write:clients - Create and update clients
delete:clients - Delete clients
```

#### Photo/Document Permissions:
```
upload:photos - Upload visit photos
read:photos - View photos
delete:photos - Delete photos
upload:documents - Upload documents
read:documents - View documents
```

#### Reporting Permissions:
```
read:reports - View reports
generate:reports - Generate reports
read:analytics - View analytics dashboards
```

#### System Permissions:
```
read:audit_logs - View audit logs
write:system_config - Modify system configuration
read:system_status - View system status
```

### Step 6: Assign Permissions to Roles

#### Nurse Role Permissions:
```
read:visits
write:visits
read:visit_notes
write:visit_notes
read:care_plans
upload:photos
read:photos
read:clients
```

#### PSW Role Permissions:
```
read:visits
write:visits
read:visit_notes
write:visit_notes
read:care_plans
upload:photos
read:photos
read:clients
```

#### Coordinator Role Permissions:
```
read:visits
write:visits
delete:visits
read:visit_notes
write:visit_notes
read:care_plans
write:care_plans
delete:care_plans
read:users
write:users
read:clients
write:clients
upload:photos
read:photos
delete:photos
upload:documents
read:documents
read:reports
generate:reports
read:analytics
```

#### Supervisor Role Permissions:
```
All permissions from Coordinator, plus:
delete:users
manage:roles
delete:clients
delete:photos
delete:documents
read:audit_logs
write:system_config
read:system_status
```

#### Admin Role Permissions:
```
All available permissions (full access)
```

#### Family Member Role Permissions:
```
read:visits (limited to assigned clients)
read:care_plans (limited to assigned clients)
read:clients (limited to assigned clients)
```

### Step 7: Configure Multi-Factor Authentication (MFA)

1. Navigate to **Security** > **Multi-factor Auth**
2. Enable the following MFA factors:

#### SMS Factor:
- Click **SMS** toggle to enable
- Configure Twilio settings:
  - Use your Twilio credentials or Auth0's default SMS provider
  - Customize SMS template: "Your Berthcare verification code is {code}"

#### One-Time Password (TOTP) Factor:
- Click **One-Time Password** toggle to enable
- Configure TOTP settings:
  - OTP expiration: 180 seconds (3 minutes)
  - Allow users to enroll multiple authenticators

#### Recovery Codes:
- Enable recovery code generation
- Users should save these securely for account recovery

3. Configure MFA Policy:
   - Navigate to **Security** > **Multi-factor Auth** > **Policies**
   - For development: Select "Optional" or "Always" based on testing needs
   - For production: Select "Always" to require MFA for all users
   - Configure step-up authentication if needed for sensitive operations

4. Customize MFA enrollment flow:
   - Navigate to **Universal Login** > **MFA Widget**
   - Customize branding and messages as needed

### Step 8: Configure Actions (Rules/Hooks)

Navigate to **Actions** > **Flows** to configure custom behaviors:

#### Login Flow - Add User Metadata to Tokens:
1. Click **Custom** > **Build Custom**
2. Name: `Add User Metadata to Tokens`
3. Add the following code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://api.berthcare.local';

  // Add user roles
  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  }

  // Add user metadata
  if (event.user.user_metadata) {
    api.idToken.setCustomClaim(`${namespace}/user_metadata`, event.user.user_metadata);
  }

  // Add app metadata (includes organization, assigned clients, etc.)
  if (event.user.app_metadata) {
    api.accessToken.setCustomClaim(`${namespace}/app_metadata`, event.user.app_metadata);
  }

  // Add permissions
  if (event.authorization.permissions) {
    api.accessToken.setCustomClaim(`${namespace}/permissions`, event.authorization.permissions);
  }
};
```

4. Click **Deploy**
5. Add this Action to the **Login** flow

#### Pre-Registration Action - Validate Email Domain:
1. Create a new Action: `Validate User Registration`
2. Add validation logic if needed (e.g., email domain restrictions)
3. Deploy and add to **Pre User Registration** flow

### Step 9: Create Database Connection

1. Navigate to **Authentication** > **Database**
2. Use the default **Username-Password-Authentication** connection or create a new one:
   - Name: `Berthcare-Users-Dev`
   - Enable **Requires Username**
   - Disable **Signup** for production (admin-managed user creation)
   - Enable **Username** and **Email** for login

3. Configure password policy:
   - Password Strength: **Fair** (minimum for development, use **Excellent** for production)
   - Password History: 5 passwords
   - Password Dictionary: Enabled
   - Password Complexity:
     - Minimum length: 12 characters
     - At least 1 lowercase letter
     - At least 1 uppercase letter
     - At least 1 number
     - At least 1 special character

4. Configure Connection Settings:
   - Disable Social Connections for development
   - Enable only Database connection for controlled testing

### Step 10: Update Environment Variables

Update your `.env` file with the Auth0 credentials:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=<your_application_client_id>
AUTH0_CLIENT_SECRET=<your_application_client_secret>
AUTH0_AUDIENCE=https://api.berthcare.local
AUTH0_CALLBACK_URL=http://localhost:3000/auth/callback
AUTH0_LOGOUT_URL=http://localhost:3000/auth/logout
```

Replace the values with your actual Auth0 tenant information found in:
- **Applications** > **Berthcare Mobile App (Dev)** > **Settings** (for Client ID and Secret)
- Your tenant domain is shown in the top-right of the Auth0 dashboard

## Automated Setup

For automated configuration using the Auth0 Management API, run:

```bash
# Install dependencies
npm install --prefix scripts/auth0

# Set Auth0 Management API credentials
export AUTH0_DOMAIN=your-tenant.us.auth0.com
export AUTH0_CLIENT_ID=your_management_api_client_id
export AUTH0_CLIENT_SECRET=your_management_api_client_secret

# Run setup script
node scripts/auth0/setup-auth0-tenant.js
```

## Security Considerations

### Development Environment:
- Use separate Auth0 tenant for development/staging
- Enable detailed logging for debugging
- MFA can be optional for easier testing
- Use test phone numbers and email addresses

### Production Environment:
- Use dedicated production tenant
- Enable MFA as **Always** required
- Implement rate limiting on authentication endpoints
- Configure anomaly detection
- Enable bot detection
- Set up monitoring and alerts
- Regular security audits

## Testing the Configuration

See `AUTH0_TESTING.md` for comprehensive testing procedures.

## Troubleshooting

### Common Issues:

1. **Callback URL Mismatch**:
   - Verify callback URLs match exactly in Auth0 and your application
   - Check for trailing slashes and protocol (http vs https)

2. **CORS Errors**:
   - Ensure your application origin is listed in Allowed Origins (CORS)
   - Check that Web Origins are configured

3. **Token Not Including Roles/Permissions**:
   - Verify RBAC is enabled on the API
   - Check that "Add Permissions in the Access Token" is enabled
   - Ensure the Action for adding metadata is deployed and active

4. **MFA Not Triggering**:
   - Check MFA policy settings
   - Verify factors are enabled
   - Check user's MFA enrollment status

## Support Resources

- Auth0 Documentation: https://auth0.com/docs
- Auth0 Community: https://community.auth0.com
- Auth0 Support: https://support.auth0.com

## Next Steps

After completing this setup:
1. Review test user credentials in `TEST_USERS.md`
2. Follow testing procedures in `AUTH0_TESTING.md`
3. Integrate Auth0 SDK in your application
4. Test authentication flow end-to-end
5. Verify role-based access control
6. Test MFA enrollment and authentication
