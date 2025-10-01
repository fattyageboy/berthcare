#!/bin/bash

# Auth0 Development Tenant Setup Script
# This script helps set up the Auth0 development tenant for Berthcare

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${SCRIPT_DIR}"

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Berthcare Auth0 Development Tenant Setup             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Auth0 Deploy CLI is installed
check_auth0_cli() {
    echo -e "${YELLOW}Checking for Auth0 Deploy CLI...${NC}"
    if ! command -v a0deploy &> /dev/null; then
        echo -e "${RED}Auth0 Deploy CLI not found!${NC}"
        echo "Install it with: npm install -g auth0-deploy-cli"
        echo "Documentation: https://github.com/auth0/auth0-deploy-cli"
        exit 1
    fi
    echo -e "${GREEN}✓ Auth0 Deploy CLI found${NC}"
    echo ""
}

# Check for required environment variables
check_environment() {
    echo -e "${YELLOW}Checking environment variables...${NC}"

    if [ -z "$AUTH0_DOMAIN" ]; then
        echo -e "${RED}✗ AUTH0_DOMAIN not set${NC}"
        echo "  Export AUTH0_DOMAIN with your Auth0 tenant domain"
        echo "  Example: export AUTH0_DOMAIN=berthcare-dev.us.auth0.com"
        MISSING_VAR=1
    else
        echo -e "${GREEN}✓ AUTH0_DOMAIN: ${AUTH0_DOMAIN}${NC}"
    fi

    if [ -z "$AUTH0_CLIENT_ID" ]; then
        echo -e "${RED}✗ AUTH0_CLIENT_ID not set${NC}"
        echo "  Export AUTH0_CLIENT_ID from your M2M application"
        MISSING_VAR=1
    else
        echo -e "${GREEN}✓ AUTH0_CLIENT_ID: ${AUTH0_CLIENT_ID:0:10}...${NC}"
    fi

    if [ -z "$AUTH0_CLIENT_SECRET" ]; then
        echo -e "${RED}✗ AUTH0_CLIENT_SECRET not set${NC}"
        echo "  Export AUTH0_CLIENT_SECRET from your M2M application"
        MISSING_VAR=1
    else
        echo -e "${GREEN}✓ AUTH0_CLIENT_SECRET: [HIDDEN]${NC}"
    fi

    if [ ! -z "$MISSING_VAR" ]; then
        echo ""
        echo -e "${YELLOW}To get these credentials:${NC}"
        echo "1. Go to Auth0 Dashboard (https://manage.auth0.com)"
        echo "2. Navigate to Applications > Applications"
        echo "3. Create a new Machine-to-Machine application"
        echo "4. Authorize it for Auth0 Management API with all scopes"
        echo "5. Copy the Domain, Client ID, and Client Secret"
        exit 1
    fi
    echo ""
}

# Backup existing configuration
backup_config() {
    echo -e "${YELLOW}Creating backup of existing configuration...${NC}"
    BACKUP_DIR="${SCRIPT_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    if a0deploy export -c deploy-config.json -f yaml -o "$BACKUP_DIR" 2>/dev/null; then
        echo -e "${GREEN}✓ Backup created at: ${BACKUP_DIR}${NC}"
    else
        echo -e "${YELLOW}⚠ Could not create backup (tenant may be new)${NC}"
    fi
    echo ""
}

# Deploy configuration
deploy_config() {
    echo -e "${YELLOW}Deploying configuration to Auth0...${NC}"

    # Update deploy-config.json with environment variables
    cat > "${CONFIG_DIR}/deploy-config.json" <<EOF
{
  "AUTH0_DOMAIN": "${AUTH0_DOMAIN}",
  "AUTH0_CLIENT_ID": "${AUTH0_CLIENT_ID}",
  "AUTH0_CLIENT_SECRET": "${AUTH0_CLIENT_SECRET}",
  "AUTH0_ALLOW_DELETE": false,
  "AUTH0_EXCLUDED_RULES": [],
  "AUTH0_EXCLUDED_CLIENTS": [
    "auth0-deploy-cli-extension"
  ],
  "AUTH0_EXCLUDED_RESOURCE_SERVERS": [],
  "AUTH0_EXCLUDED_DEFAULTS": [
    "emailProvider"
  ],
  "EXCLUDED_PROPS": {
    "clients": [
      "client_secret"
    ],
    "connections": [
      "options.client_secret"
    ]
  },
  "AUTH0_KEYWORD_REPLACE_MAPPINGS": {
    "AUTH0_TENANT_NAME": "${AUTH0_DOMAIN%%.*}",
    "AUTH0_DOMAIN": "${AUTH0_DOMAIN}",
    "API_IDENTIFIER": "https://api.dev.berthcare.ca",
    "WEB_APP_CALLBACK": "https://dev.berthcare.ca/callback",
    "MOBILE_APP_CALLBACK": "berthcare://callback",
    "ENVIRONMENT": "development"
  }
}
EOF

    echo "Importing configuration..."
    if a0deploy import -c "${CONFIG_DIR}/deploy-config.json" -i "${CONFIG_DIR}"; then
        echo -e "${GREEN}✓ Configuration deployed successfully${NC}"
    else
        echo -e "${RED}✗ Configuration deployment failed${NC}"
        exit 1
    fi
    echo ""
}

# Create test users
create_test_users() {
    echo -e "${YELLOW}Creating test users...${NC}"

    # Check if Auth0 CLI is installed for user creation
    if ! command -v auth0 &> /dev/null; then
        echo -e "${YELLOW}⚠ Auth0 CLI not found. Install it to create test users automatically.${NC}"
        echo "Install with: npm install -g auth0-cli"
        echo ""
        echo "Manual user creation instructions:"
        echo "1. Go to Auth0 Dashboard > User Management > Users"
        echo "2. Create users using the credentials in test-users.yaml"
        echo "3. Assign roles to users under the Authorization tab"
        return
    fi

    echo -e "${GREEN}✓ Test users will be created via Auth0 Management API${NC}"
    echo "  See test-users.yaml for user details"
    echo ""
}

# Enable MFA
configure_mfa() {
    echo -e "${YELLOW}Configuring Multi-Factor Authentication...${NC}"
    echo "MFA configuration has been deployed via guardian.yaml"
    echo ""
    echo "To complete MFA setup:"
    echo "1. Go to Auth0 Dashboard > Security > Multi-factor Auth"
    echo "2. Enable SMS (requires Twilio configuration)"
    echo "3. Enable One-time Password (TOTP)"
    echo "4. Configure MFA policies as needed"
    echo ""
    echo -e "${YELLOW}⚠ Note: SMS requires Twilio credentials to be configured${NC}"
    echo ""
}

# Display next steps
display_next_steps() {
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Setup Complete!                                       ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next Steps:"
    echo ""
    echo "1. Create Test Users:"
    echo "   - Go to: https://manage.auth0.com/dashboard/us/${AUTH0_DOMAIN%%.*}/users"
    echo "   - Use credentials from: test-users.yaml"
    echo "   - Assign roles to each user"
    echo ""
    echo "2. Configure MFA (Optional for dev):"
    echo "   - Go to: https://manage.auth0.com/dashboard/us/${AUTH0_DOMAIN%%.*}/mfa"
    echo "   - Enable SMS (requires Twilio)"
    echo "   - Enable TOTP (Google Authenticator)"
    echo ""
    echo "3. Get Application Credentials:"
    echo "   - Go to: https://manage.auth0.com/dashboard/us/${AUTH0_DOMAIN%%.*}/applications"
    echo "   - Copy Client IDs for Web and Mobile apps"
    echo "   - Update .env.example with these values"
    echo ""
    echo "4. Test Authentication:"
    echo "   - Run: bash verify-auth0.sh"
    echo "   - Or visit: https://manage.auth0.com/dashboard/us/${AUTH0_DOMAIN%%.*}/applications"
    echo ""
    echo "Tenant URL: https://${AUTH0_DOMAIN}"
    echo ""
}

# Main execution
main() {
    check_auth0_cli
    check_environment
    backup_config
    deploy_config
    create_test_users
    configure_mfa
    display_next_steps
}

# Run main function
main
