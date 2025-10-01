# Auth0 Development Tenant - Quick Reference

## Tenant Information
- **Domain**: `berthcare-dev.us.auth0.com` (update after creation)
- **Environment**: Development
- **API Identifier**: `https://api.dev.berthcare.ca`
- **Dashboard**: https://manage.auth0.com

---

## Quick Start

```bash
# 1. Set environment variables
export AUTH0_DOMAIN="your-tenant.us.auth0.com"
export AUTH0_CLIENT_ID="your_m2m_client_id"
export AUTH0_CLIENT_SECRET="your_m2m_client_secret"

# 2. Deploy configuration
cd infrastructure/auth0
bash setup.sh

# 3. Verify deployment
bash verify-auth0.sh
```

---

## Test User Quick Login

| Role | Email | Password |
|------|-------|----------|
| **Nurse** | nurse.test@berthcare.dev | DevNurse2025!Test |
| **PSW** | psw.test@berthcare.dev | DevPSW2025!Test |
| **Coordinator** | coordinator.test@berthcare.dev | DevCoord2025!Test |
| **Supervisor** | supervisor.test@berthcare.dev | DevSuper2025!Test |
| **Admin** | admin.test@berthcare.dev | DevAdmin2025!Test |
| **Family** | family.test@berthcare.dev | DevFamily2025!Test |

**MFA-Enabled Users:**
- nurse.mfa@berthcare.dev / DevNurseMFA2025!Test
- admin.mfa@berthcare.dev / DevAdminMFA2025!Test

---

## Role Permissions Summary

### Nurse / PSW
- Read/write assigned visits
- Read care plans
- Upload photos
- Team messaging

### Coordinator
- All Nurse permissions
- Create/edit care plans
- Manage users
- Analytics access
- Delete visits/photos

### Supervisor
- All Coordinator permissions
- Delete users/clients
- Audit log access
- System admin

### Admin
- All Supervisor permissions
- Full system configuration
- Complete data access

### Family Member
- Read family info
- View visit history
- Read care plans (simplified)
- Team messaging (read/write)

---

## API Scopes

**Visit**: read:visits, write:visits, delete:visits
**Care Plans**: read:care_plans, write:care_plans, delete:care_plans
**Clients**: read:clients, write:clients, delete:clients
**Users**: read:users, write:users, delete:users
**Photos**: upload:photos, read:photos, delete:photos
**Analytics**: read:analytics, read:audit_logs
**Messages**: read:messages, write:messages
**Family**: read:family_info
**Admin**: admin:system, admin:organization

---

## Token Configuration

**Access Token:**
- Lifetime: 1 hour
- Algorithm: RS256
- Includes: roles, metadata, device info
- Namespace: `https://berthcare.ca`

**Refresh Token:**
- Lifetime: 30 days
- Idle timeout: 15 days
- Rotation: Enabled

---

## Applications

**Web App (SPA)**
- Type: Single Page Application
- Auth: PKCE
- Callbacks: dev.berthcare.ca, localhost:3000, localhost:5173

**Mobile App (Native)**
- Type: Native
- Auth: PKCE
- Callback: berthcare://callback

**Backend API (M2M)**
- Type: Machine-to-Machine
- Auth: Client Credentials
- Purpose: Server-to-server communication

---

## MFA Configuration

**Supported Factors:**
- SMS (requires Twilio)
- TOTP (Google Authenticator, Authy)

**MFA Enforcement:**
- Admin role: Always required
- Supervisor role: Always required
- Other roles: Optional

---

## Common Commands

```bash
# Export current config
a0deploy export -c deploy-config.json -f yaml -o backup

# Import config
a0deploy import -c deploy-config.json -i .

# Get access token (Management API)
curl -X POST https://${AUTH0_DOMAIN}/oauth/token \
  -H 'content-type: application/json' \
  -d '{
    "client_id":"'${AUTH0_CLIENT_ID}'",
    "client_secret":"'${AUTH0_CLIENT_SECRET}'",
    "audience":"https://'${AUTH0_DOMAIN}'/api/v2/",
    "grant_type":"client_credentials"
  }'

# List users
curl https://${AUTH0_DOMAIN}/api/v2/users \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# List roles
curl https://${AUTH0_DOMAIN}/api/v2/roles \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

---

## Troubleshooting

**Login fails:**
1. Check user exists in Dashboard
2. Verify email is verified
3. Check password meets policy
4. Review Auth0 logs

**Role not in token:**
1. Verify user has role assigned
2. Check "Add Roles" rule is enabled
3. Verify rule order is correct
4. Check token at jwt.io

**MFA not prompting:**
1. Check MFA is enabled in Dashboard
2. Verify user has requires_mfa in app_metadata
3. Check MFA enforcement rule is enabled
4. Test with MFA-enabled test user

**Permission denied:**
1. Verify user has correct role
2. Check role has required permission
3. Verify API identifier in token audience
4. Check backend middleware is working

---

## Important URLs

- **Auth0 Dashboard**: https://manage.auth0.com
- **JWT Debugger**: https://jwt.io
- **Auth0 Docs**: https://auth0.com/docs
- **Deploy CLI**: https://github.com/auth0/auth0-deploy-cli

---

## Files

- **README.md**: Full documentation
- **TEST_CREDENTIALS.md**: All test user credentials
- **setup.sh**: Automated deployment
- **verify-auth0.sh**: Configuration verification
- **E4_COMPLETION_REPORT.md**: Task completion details

---

## Security Reminders

- Test credentials are for DEV ONLY
- Never commit secrets to git
- Rotate M2M credentials regularly
- Delete test users before production
- Monitor Auth0 logs for suspicious activity

---

**Last Updated**: 2025-09-30
**Environment**: Development
