#!/bin/bash

# Auth0 Configuration Verification Script
# Verifies that Auth0 tenant is properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Berthcare Auth0 Configuration Verification           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for jq (JSON processor)
if ! command -v jq &> /dev/null; then
    echo -e "${RED}✗ jq not found. Install it with: brew install jq${NC}"
    exit 1
fi

# Check environment variables
check_environment() {
    echo -e "${BLUE}[1/7] Checking Environment Variables${NC}"

    if [ -z "$AUTH0_DOMAIN" ] || [ -z "$AUTH0_CLIENT_ID" ] || [ -z "$AUTH0_CLIENT_SECRET" ]; then
        echo -e "${RED}✗ Missing required environment variables${NC}"
        echo "Please set: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET"
        exit 1
    fi

    echo -e "${GREEN}✓ Environment variables configured${NC}"
    echo "  Domain: ${AUTH0_DOMAIN}"
    echo ""
}

# Get Management API Access Token
get_access_token() {
    echo -e "${BLUE}[2/7] Getting Management API Access Token${NC}"

    RESPONSE=$(curl -s --request POST \
        --url "https://${AUTH0_DOMAIN}/oauth/token" \
        --header 'content-type: application/json' \
        --data "{\"client_id\":\"${AUTH0_CLIENT_ID}\",\"client_secret\":\"${AUTH0_CLIENT_SECRET}\",\"audience\":\"https://${AUTH0_DOMAIN}/api/v2/\",\"grant_type\":\"client_credentials\"}")

    ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')

    if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}✗ Failed to get access token${NC}"
        echo "Response: $RESPONSE"
        exit 1
    fi

    echo -e "${GREEN}✓ Access token obtained${NC}"
    echo ""
}

# Verify Resource Server (API)
verify_resource_server() {
    echo -e "${BLUE}[3/7] Verifying Resource Server (API)${NC}"

    APIS=$(curl -s --request GET \
        --url "https://${AUTH0_DOMAIN}/api/v2/resource-servers" \
        --header "authorization: Bearer ${ACCESS_TOKEN}")

    API_EXISTS=$(echo "$APIS" | jq -r '.[] | select(.identifier=="https://api.dev.berthcare.ca") | .name')

    if [ -z "$API_EXISTS" ]; then
        echo -e "${YELLOW}⚠ API 'Berthcare API (Development)' not found${NC}"
    else
        echo -e "${GREEN}✓ API found: ${API_EXISTS}${NC}"

        # Count scopes
        SCOPE_COUNT=$(echo "$APIS" | jq -r '.[] | select(.identifier=="https://api.dev.berthcare.ca") | .scopes | length')
        echo "  Scopes configured: ${SCOPE_COUNT}"
    fi
    echo ""
}

# Verify Clients (Applications)
verify_clients() {
    echo -e "${BLUE}[4/7] Verifying Applications${NC}"

    CLIENTS=$(curl -s --request GET \
        --url "https://${AUTH0_DOMAIN}/api/v2/clients" \
        --header "authorization: Bearer ${ACCESS_TOKEN}")

    WEB_APP=$(echo "$CLIENTS" | jq -r '.[] | select(.name=="Berthcare Web App (Development)") | .name')
    MOBILE_APP=$(echo "$CLIENTS" | jq -r '.[] | select(.name=="Berthcare Mobile App (Development)") | .name')
    BACKEND_APP=$(echo "$CLIENTS" | jq -r '.[] | select(.name=="Berthcare Backend API (Development)") | .name')

    if [ -z "$WEB_APP" ]; then
        echo -e "${YELLOW}⚠ Web App not found${NC}"
    else
        echo -e "${GREEN}✓ Web App configured${NC}"
    fi

    if [ -z "$MOBILE_APP" ]; then
        echo -e "${YELLOW}⚠ Mobile App not found${NC}"
    else
        echo -e "${GREEN}✓ Mobile App configured${NC}"
    fi

    if [ -z "$BACKEND_APP" ]; then
        echo -e "${YELLOW}⚠ Backend API not found${NC}"
    else
        echo -e "${GREEN}✓ Backend API configured${NC}"
    fi
    echo ""
}

# Verify Roles
verify_roles() {
    echo -e "${BLUE}[5/7] Verifying Roles${NC}"

    ROLES=$(curl -s --request GET \
        --url "https://${AUTH0_DOMAIN}/api/v2/roles" \
        --header "authorization: Bearer ${ACCESS_TOKEN}")

    EXPECTED_ROLES=("Nurse" "PSW" "Coordinator" "Supervisor" "Admin" "Family Member")

    for role in "${EXPECTED_ROLES[@]}"; do
        ROLE_EXISTS=$(echo "$ROLES" | jq -r ".[] | select(.name==\"${role}\") | .name")
        if [ -z "$ROLE_EXISTS" ]; then
            echo -e "${YELLOW}⚠ Role '${role}' not found${NC}"
        else
            # Get permission count
            ROLE_ID=$(echo "$ROLES" | jq -r ".[] | select(.name==\"${role}\") | .id")
            PERMS=$(curl -s --request GET \
                --url "https://${AUTH0_DOMAIN}/api/v2/roles/${ROLE_ID}/permissions" \
                --header "authorization: Bearer ${ACCESS_TOKEN}")
            PERM_COUNT=$(echo "$PERMS" | jq '. | length')
            echo -e "${GREEN}✓ Role '${role}' (${PERM_COUNT} permissions)${NC}"
        fi
    done
    echo ""
}

# Verify Users
verify_users() {
    echo -e "${BLUE}[6/7] Verifying Test Users${NC}"

    USERS=$(curl -s --request GET \
        --url "https://${AUTH0_DOMAIN}/api/v2/users?per_page=50" \
        --header "authorization: Bearer ${ACCESS_TOKEN}")

    TOTAL_USERS=$(echo "$USERS" | jq '. | length')
    echo "Total users: ${TOTAL_USERS}"

    # Check for test users
    TEST_EMAILS=("nurse.test@berthcare.dev" "psw.test@berthcare.dev" "coordinator.test@berthcare.dev" "supervisor.test@berthcare.dev" "admin.test@berthcare.dev" "family.test@berthcare.dev")

    for email in "${TEST_EMAILS[@]}"; do
        USER_EXISTS=$(echo "$USERS" | jq -r ".[] | select(.email==\"${email}\") | .email")
        if [ -z "$USER_EXISTS" ]; then
            echo -e "${YELLOW}⚠ Test user '${email}' not found${NC}"
        else
            # Get user roles
            USER_ID=$(echo "$USERS" | jq -r ".[] | select(.email==\"${email}\") | .user_id")
            USER_ROLES=$(curl -s --request GET \
                --url "https://${AUTH0_DOMAIN}/api/v2/users/${USER_ID}/roles" \
                --header "authorization: Bearer ${ACCESS_TOKEN}")
            ROLE_NAMES=$(echo "$USER_ROLES" | jq -r '.[].name' | tr '\n' ', ' | sed 's/,$//')

            if [ -z "$ROLE_NAMES" ]; then
                echo -e "${YELLOW}✓ User '${email}' (no roles assigned)${NC}"
            else
                echo -e "${GREEN}✓ User '${email}' (${ROLE_NAMES})${NC}"
            fi
        fi
    done
    echo ""
}

# Verify MFA Configuration
verify_mfa() {
    echo -e "${BLUE}[7/7] Verifying MFA Configuration${NC}"

    # Get Guardian (MFA) configuration
    GUARDIAN=$(curl -s --request GET \
        --url "https://${AUTH0_DOMAIN}/api/v2/guardian/factors" \
        --header "authorization: Bearer ${ACCESS_TOKEN}")

    SMS_ENABLED=$(echo "$GUARDIAN" | jq -r '.[] | select(.name=="sms") | .enabled')
    OTP_ENABLED=$(echo "$GUARDIAN" | jq -r '.[] | select(.name=="otp") | .enabled')

    if [ "$SMS_ENABLED" = "true" ]; then
        echo -e "${GREEN}✓ SMS MFA enabled${NC}"
    else
        echo -e "${YELLOW}⚠ SMS MFA not enabled${NC}"
    fi

    if [ "$OTP_ENABLED" = "true" ]; then
        echo -e "${GREEN}✓ TOTP (Authenticator App) MFA enabled${NC}"
    else
        echo -e "${YELLOW}⚠ TOTP MFA not enabled${NC}"
    fi
    echo ""
}

# Summary
display_summary() {
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Verification Complete                                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Auth0 Dashboard: https://manage.auth0.com/dashboard/us/${AUTH0_DOMAIN%%.*}"
    echo ""
    echo "Manual Verification Steps:"
    echo "1. Test login with a test user:"
    echo "   - Go to: https://manage.auth0.com/dashboard/us/${AUTH0_DOMAIN%%.*}/users"
    echo "   - Click on a user and select 'Try Connection'"
    echo ""
    echo "2. Test MFA enrollment:"
    echo "   - Log in as admin.mfa@berthcare.dev or nurse.mfa@berthcare.dev"
    echo "   - Complete MFA enrollment flow"
    echo ""
    echo "3. Verify role permissions:"
    echo "   - Go to: https://manage.auth0.com/dashboard/us/${AUTH0_DOMAIN%%.*}/roles"
    echo "   - Check each role has correct permissions"
    echo ""
}

# Main execution
main() {
    check_environment
    get_access_token
    verify_resource_server
    verify_clients
    verify_roles
    verify_users
    verify_mfa
    display_summary
}

# Run main function
main
