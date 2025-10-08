#!/bin/bash

# =============================================================================
# BerthCare Twilio Setup Script
# =============================================================================
# Philosophy: "Simplicity is the ultimate sophistication"
# 
# This script helps automate Twilio account configuration and credential storage
# in AWS Secrets Manager for BerthCare communication services.
#
# Usage:
#   ./scripts/setup-twilio.sh staging
#   ./scripts/setup-twilio.sh production
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Terraform installed
#   - Twilio account created with credentials
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# =============================================================================
# Validation Functions
# =============================================================================

validate_environment() {
    local env=$1
    if [[ "$env" != "staging" && "$env" != "production" ]]; then
        print_error "Invalid environment: $env"
        echo "Usage: $0 [staging|production]"
        exit 1
    fi
}

validate_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS CLI configured"
}

validate_terraform() {
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform not found. Please install it first."
        exit 1
    fi
    
    print_success "Terraform installed"
}

validate_twilio_account_sid() {
    local sid=$1
    if [[ ! "$sid" =~ ^AC[a-f0-9]{32}$ ]]; then
        print_error "Invalid Twilio Account SID format. Must start with 'AC' and be 34 characters."
        return 1
    fi
    return 0
}

validate_twilio_auth_token() {
    local token=$1
    if [[ ${#token} -ne 32 ]]; then
        print_error "Invalid Twilio Auth Token format. Must be 32 characters."
        return 1
    fi
    return 0
}

validate_phone_number() {
    local number=$1
    if [[ ! "$number" =~ ^\+1[0-9]{10}$ ]]; then
        print_error "Invalid phone number format. Must be E.164 format: +1XXXXXXXXXX"
        return 1
    fi
    return 0
}

# =============================================================================
# Input Collection Functions
# =============================================================================

collect_twilio_credentials() {
    print_header "Twilio Account Credentials"
    
    echo "Enter your Twilio Account SID (starts with AC):"
    read -r TWILIO_ACCOUNT_SID
    
    while ! validate_twilio_account_sid "$TWILIO_ACCOUNT_SID"; do
        echo "Please enter a valid Twilio Account SID:"
        read -r TWILIO_ACCOUNT_SID
    done
    
    echo "Enter your Twilio Auth Token (32 characters):"
    read -rs TWILIO_AUTH_TOKEN
    echo
    
    while ! validate_twilio_auth_token "$TWILIO_AUTH_TOKEN"; do
        echo "Please enter a valid Twilio Auth Token:"
        read -rs TWILIO_AUTH_TOKEN
        echo
    done
    
    print_success "Twilio credentials validated"
}

collect_phone_numbers() {
    print_header "Twilio Phone Numbers"
    
    echo "Enter your Twilio voice phone number (E.164 format: +1XXXXXXXXXX):"
    read -r TWILIO_VOICE_NUMBER
    
    while ! validate_phone_number "$TWILIO_VOICE_NUMBER"; do
        echo "Please enter a valid phone number:"
        read -r TWILIO_VOICE_NUMBER
    done
    
    echo "Enter your Twilio SMS phone number (E.164 format: +1XXXXXXXXXX):"
    echo "(Press Enter to use the same number as voice)"
    read -r TWILIO_SMS_NUMBER
    
    if [[ -z "$TWILIO_SMS_NUMBER" ]]; then
        TWILIO_SMS_NUMBER="$TWILIO_VOICE_NUMBER"
        print_info "Using same number for SMS: $TWILIO_SMS_NUMBER"
    else
        while ! validate_phone_number "$TWILIO_SMS_NUMBER"; do
            echo "Please enter a valid phone number:"
            read -r TWILIO_SMS_NUMBER
        done
    fi
    
    print_success "Phone numbers validated"
}

collect_webhook_config() {
    print_header "Webhook Configuration"
    
    local env=$1
    local default_domain="api-${env}.berthcare.ca"
    
    echo "Enter your API domain (default: $default_domain):"
    read -r API_DOMAIN
    
    if [[ -z "$API_DOMAIN" ]]; then
        API_DOMAIN="$default_domain"
    fi
    
    VOICE_WEBHOOK_URL="https://${API_DOMAIN}/v1/voice/webhook"
    VOICE_STATUS_CALLBACK_URL="https://${API_DOMAIN}/v1/voice/status"
    SMS_WEBHOOK_URL="https://${API_DOMAIN}/v1/sms/webhook"
    SMS_STATUS_CALLBACK_URL="https://${API_DOMAIN}/v1/sms/status"
    
    print_info "Voice webhook: $VOICE_WEBHOOK_URL"
    print_info "SMS webhook: $SMS_WEBHOOK_URL"
    
    echo "Generate webhook auth token? (Y/n):"
    read -r GENERATE_TOKEN
    
    if [[ "$GENERATE_TOKEN" =~ ^[Nn]$ ]]; then
        echo "Enter webhook auth token (32 characters):"
        read -rs WEBHOOK_AUTH_TOKEN
        echo
    else
        WEBHOOK_AUTH_TOKEN=$(openssl rand -hex 16)
        print_success "Generated webhook auth token"
    fi
}

# =============================================================================
# AWS Secrets Manager Functions
# =============================================================================

store_secrets_in_aws() {
    local env=$1
    local region="ca-central-1"
    
    print_header "Storing Secrets in AWS Secrets Manager"
    
    # Store Twilio account credentials
    print_info "Creating secret: ${env}/twilio/account"
    
    aws secretsmanager create-secret \
        --name "${env}/twilio/account" \
        --description "Twilio account credentials for ${env} environment" \
        --secret-string "{\"account_sid\":\"${TWILIO_ACCOUNT_SID}\",\"auth_token\":\"${TWILIO_AUTH_TOKEN}\"}" \
        --region "$region" \
        --tags Key=Environment,Value="${env}" Key=Project,Value=BerthCare Key=ManagedBy,Value=Script \
        2>/dev/null || \
    aws secretsmanager update-secret \
        --secret-id "${env}/twilio/account" \
        --secret-string "{\"account_sid\":\"${TWILIO_ACCOUNT_SID}\",\"auth_token\":\"${TWILIO_AUTH_TOKEN}\"}" \
        --region "$region" \
        2>/dev/null
    
    print_success "Stored Twilio account credentials"
    
    # Store phone numbers
    print_info "Creating secret: ${env}/twilio/phone-numbers"
    
    aws secretsmanager create-secret \
        --name "${env}/twilio/phone-numbers" \
        --description "Twilio phone numbers for ${env} environment" \
        --secret-string "{\"voice_number\":\"${TWILIO_VOICE_NUMBER}\",\"sms_number\":\"${TWILIO_SMS_NUMBER}\"}" \
        --region "$region" \
        --tags Key=Environment,Value="${env}" Key=Project,Value=BerthCare Key=ManagedBy,Value=Script \
        2>/dev/null || \
    aws secretsmanager update-secret \
        --secret-id "${env}/twilio/phone-numbers" \
        --secret-string "{\"voice_number\":\"${TWILIO_VOICE_NUMBER}\",\"sms_number\":\"${TWILIO_SMS_NUMBER}\"}" \
        --region "$region" \
        2>/dev/null
    
    print_success "Stored Twilio phone numbers"
    
    # Store webhook configuration
    print_info "Creating secret: ${env}/twilio/webhooks"
    
    aws secretsmanager create-secret \
        --name "${env}/twilio/webhooks" \
        --description "Twilio webhook configuration for ${env} environment" \
        --secret-string "{\"voice_webhook_url\":\"${VOICE_WEBHOOK_URL}\",\"voice_status_callback\":\"${VOICE_STATUS_CALLBACK_URL}\",\"sms_webhook_url\":\"${SMS_WEBHOOK_URL}\",\"sms_status_callback\":\"${SMS_STATUS_CALLBACK_URL}\",\"webhook_auth_token\":\"${WEBHOOK_AUTH_TOKEN}\"}" \
        --region "$region" \
        --tags Key=Environment,Value="${env}" Key=Project,Value=BerthCare Key=ManagedBy,Value=Script \
        2>/dev/null || \
    aws secretsmanager update-secret \
        --secret-id "${env}/twilio/webhooks" \
        --secret-string "{\"voice_webhook_url\":\"${VOICE_WEBHOOK_URL}\",\"voice_status_callback\":\"${VOICE_STATUS_CALLBACK_URL}\",\"sms_webhook_url\":\"${SMS_WEBHOOK_URL}\",\"sms_status_callback\":\"${SMS_STATUS_CALLBACK_URL}\",\"webhook_auth_token\":\"${WEBHOOK_AUTH_TOKEN}\"}" \
        --region "$region" \
        2>/dev/null
    
    print_success "Stored Twilio webhook configuration"
}

# =============================================================================
# Terraform Functions
# =============================================================================

update_terraform_tfvars() {
    local env=$1
    local tfvars_file="$PROJECT_ROOT/terraform/environments/${env}/terraform.tfvars"
    
    print_header "Updating Terraform Configuration"
    
    if [[ ! -f "$tfvars_file" ]]; then
        print_warning "terraform.tfvars not found. Creating from example..."
        cp "${tfvars_file}.example" "$tfvars_file"
    fi
    
    # Update Twilio configuration in terraform.tfvars
    print_info "Updating $tfvars_file"
    
    # Note: This is a simple approach. For production, consider using a proper config management tool.
    cat >> "$tfvars_file" <<EOF

# Twilio Configuration (added by setup-twilio.sh)
twilio_account_sid  = "${TWILIO_ACCOUNT_SID}"
twilio_auth_token   = "${TWILIO_AUTH_TOKEN}"
twilio_voice_number = "${TWILIO_VOICE_NUMBER}"
twilio_sms_number   = "${TWILIO_SMS_NUMBER}"

voice_webhook_url         = "${VOICE_WEBHOOK_URL}"
voice_status_callback_url = "${VOICE_STATUS_CALLBACK_URL}"
sms_webhook_url           = "${SMS_WEBHOOK_URL}"
sms_status_callback_url   = "${SMS_STATUS_CALLBACK_URL}"
webhook_auth_token        = "${WEBHOOK_AUTH_TOKEN}"
EOF
    
    print_success "Updated terraform.tfvars"
    print_warning "Remember to add terraform.tfvars to .gitignore!"
}

# =============================================================================
# Verification Functions
# =============================================================================

verify_secrets() {
    local env=$1
    local region="ca-central-1"
    
    print_header "Verifying Secrets in AWS"
    
    local secrets=(
        "${env}/twilio/account"
        "${env}/twilio/phone-numbers"
        "${env}/twilio/webhooks"
    )
    
    for secret in "${secrets[@]}"; do
        if aws secretsmanager describe-secret --secret-id "$secret" --region "$region" &> /dev/null; then
            print_success "Secret exists: $secret"
        else
            print_error "Secret not found: $secret"
        fi
    done
}

# =============================================================================
# Summary Functions
# =============================================================================

print_summary() {
    local env=$1
    
    print_header "Setup Summary"
    
    echo "Environment: $env"
    echo "AWS Region: ca-central-1"
    echo ""
    echo "Twilio Configuration:"
    echo "  Account SID: ${TWILIO_ACCOUNT_SID:0:10}..."
    echo "  Voice Number: $TWILIO_VOICE_NUMBER"
    echo "  SMS Number: $TWILIO_SMS_NUMBER"
    echo ""
    echo "Webhook URLs:"
    echo "  Voice: $VOICE_WEBHOOK_URL"
    echo "  SMS: $SMS_WEBHOOK_URL"
    echo ""
    echo "AWS Secrets Manager:"
    echo "  ✓ ${env}/twilio/account"
    echo "  ✓ ${env}/twilio/phone-numbers"
    echo "  ✓ ${env}/twilio/webhooks"
    echo ""
    
    print_success "Twilio setup completed successfully!"
    
    print_header "Next Steps"
    echo "1. Configure webhooks in Twilio Console:"
    echo "   - Voice: $VOICE_WEBHOOK_URL"
    echo "   - SMS: $SMS_WEBHOOK_URL"
    echo ""
    echo "2. Deploy backend API to activate webhooks"
    echo ""
    echo "3. Test voice and SMS functionality"
    echo ""
    echo "4. Update documentation in docs/architecture.md"
    echo ""
    echo "For detailed instructions, see: docs/E7-twilio-configuration-checklist.md"
}

# =============================================================================
# Main Script
# =============================================================================

main() {
    local env=${1:-}
    
    print_header "BerthCare Twilio Setup"
    
    # Validate inputs
    if [[ -z "$env" ]]; then
        print_error "Environment not specified"
        echo "Usage: $0 [staging|production]"
        exit 1
    fi
    
    validate_environment "$env"
    validate_aws_cli
    validate_terraform
    
    # Collect configuration
    collect_twilio_credentials
    collect_phone_numbers
    collect_webhook_config "$env"
    
    # Store in AWS
    store_secrets_in_aws "$env"
    
    # Update Terraform
    echo ""
    echo "Update Terraform configuration? (Y/n):"
    read -r UPDATE_TERRAFORM
    
    if [[ ! "$UPDATE_TERRAFORM" =~ ^[Nn]$ ]]; then
        update_terraform_tfvars "$env"
    fi
    
    # Verify
    verify_secrets "$env"
    
    # Summary
    print_summary "$env"
}

# Run main function
main "$@"
