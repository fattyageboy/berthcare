#!/bin/bash

# BerthCare - Twilio Secrets Manager Setup Script
# This script stores Twilio credentials in AWS Secrets Manager

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="ca-central-1"

echo "=========================================="
echo "BerthCare - Twilio Secrets Setup"
echo "=========================================="
echo ""

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local is_secret="${3:-false}"
    
    if [ "$is_secret" = "true" ]; then
        read -s -p "$prompt: " value
        echo ""
    else
        read -p "$prompt: " value
    fi
    
    eval "$var_name='$value'"
}

# Function to create secret
create_secret() {
    local env="$1"
    local account_sid="$2"
    local auth_token="$3"
    local phone_number="$4"
    local voice_url="$5"
    local sms_url="$6"
    
    local secret_name="berthcare/${env}/twilio"
    
    echo -e "${YELLOW}Creating secret: ${secret_name}${NC}"
    
    # Create secret JSON
    local secret_json=$(cat <<EOF
{
  "account_sid": "${account_sid}",
  "auth_token": "${auth_token}",
  "phone_number": "${phone_number}",
  "voice_url": "${voice_url}",
  "sms_url": "${sms_url}"
}
EOF
)
    
    # Check if secret already exists
    if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$AWS_REGION" &>/dev/null; then
        echo -e "${YELLOW}Secret already exists. Updating...${NC}"
        aws secretsmanager update-secret \
            --secret-id "$secret_name" \
            --secret-string "$secret_json" \
            --region "$AWS_REGION" \
            --output json > /dev/null
        echo -e "${GREEN}✓ Secret updated successfully${NC}"
    else
        echo -e "${YELLOW}Creating new secret...${NC}"
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --description "Twilio credentials for BerthCare ${env} environment" \
            --secret-string "$secret_json" \
            --region "$AWS_REGION" \
            --output json > /dev/null
        
        # Add tags
        aws secretsmanager tag-resource \
            --secret-id "$secret_name" \
            --tags Key=Environment,Value="${env}" Key=Service,Value=twilio \
            --region "$AWS_REGION" \
            --output json > /dev/null
        
        echo -e "${GREEN}✓ Secret created successfully${NC}"
    fi
    
    echo ""
}

# Function to verify secret
verify_secret() {
    local env="$1"
    local secret_name="berthcare/${env}/twilio"
    
    echo -e "${YELLOW}Verifying secret: ${secret_name}${NC}"
    
    local secret_value=$(aws secretsmanager get-secret-value \
        --secret-id "$secret_name" \
        --region "$AWS_REGION" \
        --query SecretString \
        --output text)
    
    if [ -n "$secret_value" ]; then
        echo -e "${GREEN}✓ Secret retrieved successfully${NC}"
        echo ""
        echo "Secret contents:"
        echo "$secret_value" | jq .
        echo ""
    else
        echo -e "${RED}✗ Failed to retrieve secret${NC}"
        exit 1
    fi
}

# Main menu
echo "Select environment to configure:"
echo "1) Staging"
echo "2) Production"
echo "3) Both"
echo ""
read -p "Enter choice [1-3]: " env_choice

case $env_choice in
    1)
        environments=("staging")
        ;;
    2)
        environments=("production")
        ;;
    3)
        environments=("staging" "production")
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""

# Process each environment
for env in "${environments[@]}"; do
    echo "=========================================="
    echo "Configuring ${env} environment"
    echo "=========================================="
    echo ""
    
    # Determine API URL based on environment
    if [ "$env" = "staging" ]; then
        api_domain="api-staging.berthcare.ca"
    else
        api_domain="api.berthcare.ca"
    fi
    
    # Prompt for Twilio credentials
    echo "Enter Twilio credentials for ${env}:"
    echo ""
    
    prompt_input "Twilio Account SID (starts with AC)" "account_sid"
    prompt_input "Twilio Auth Token" "auth_token" "true"
    prompt_input "Twilio Phone Number (E.164 format: +1234567890)" "phone_number"
    
    # Set webhook URLs
    voice_url="https://${api_domain}/v1/twilio/voice"
    sms_url="https://${api_domain}/v1/twilio/sms"
    
    echo ""
    echo "Webhook URLs:"
    echo "  Voice: ${voice_url}"
    echo "  SMS: ${sms_url}"
    echo ""
    
    # Confirm before creating
    read -p "Create/update secret for ${env}? [y/N]: " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        create_secret "$env" "$account_sid" "$auth_token" "$phone_number" "$voice_url" "$sms_url"
        
        # Verify
        read -p "Verify secret? [y/N]: " verify_confirm
        if [[ $verify_confirm =~ ^[Yy]$ ]]; then
            verify_secret "$env"
        fi
    else
        echo -e "${YELLOW}Skipped ${env}${NC}"
        echo ""
    fi
done

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update phone number webhook URLs in Twilio Console"
echo "2. Update IAM permissions for ECS task role"
echo "3. Update backend .env files with secret ARNs"
echo "4. Test voice call and SMS"
echo ""
echo "Documentation: docs/E7-twilio-setup.md"
echo ""
