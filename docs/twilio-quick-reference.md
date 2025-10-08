# Twilio Quick Reference Guide

**Philosophy:** "Simplicity is the ultimate sophistication"

Quick reference for BerthCare Twilio configuration and common operations.

---

## Quick Setup (5 Minutes)

### Automated Setup

```bash
# Run the setup script
./scripts/setup-twilio.sh staging

# Follow the prompts to enter:
# - Twilio Account SID
# - Twilio Auth Token
# - Voice phone number
# - SMS phone number
```

### Manual Setup

```bash
# 1. Copy terraform.tfvars.example
cd terraform/environments/staging
cp terraform.tfvars.example terraform.tfvars

# 2. Edit terraform.tfvars with your Twilio credentials

# 3. Apply Terraform
terraform init
terraform plan
terraform apply
```

---

## Twilio Console Quick Links

- **Dashboard:** https://console.twilio.com/
- **Phone Numbers:** https://console.twilio.com/phone-numbers
- **Buy Numbers:** https://console.twilio.com/phone-numbers/search
- **Logs:** https://console.twilio.com/monitor/logs
- **Webhooks:** https://console.twilio.com/monitor/logs/webhooks
- **Billing:** https://console.twilio.com/billing
- **API Keys:** https://console.twilio.com/project/api-keys

---

## Phone Number Formats

### E.164 Format (Required)

```
+1XXXXXXXXXX  ✓ Correct (Canadian number)
+14165551234  ✓ Example
1-416-555-1234  ✗ Wrong (use E.164)
(416) 555-1234  ✗ Wrong (use E.164)
```

### Validation Regex

```regex
^\+1[0-9]{10}$
```

---

## AWS Secrets Manager

### Secret Names

```
staging/twilio/account          # Account SID and Auth Token
staging/twilio/phone-numbers    # Voice and SMS numbers
staging/twilio/webhooks         # Webhook URLs and auth token
```

### Retrieve Secrets (AWS CLI)

```bash
# Get account credentials
aws secretsmanager get-secret-value \
  --secret-id staging/twilio/account \
  --region ca-central-1 \
  --query SecretString \
  --output text | jq .

# Get phone numbers
aws secretsmanager get-secret-value \
  --secret-id staging/twilio/phone-numbers \
  --region ca-central-1 \
  --query SecretString \
  --output text | jq .

# Get webhook config
aws secretsmanager get-secret-value \
  --secret-id staging/twilio/webhooks \
  --region ca-central-1 \
  --query SecretString \
  --output text | jq .
```

### Update Secrets

```bash
# Update auth token (after rotation)
aws secretsmanager update-secret \
  --secret-id staging/twilio/account \
  --secret-string '{"account_sid":"ACxxxx","auth_token":"NEW_TOKEN"}' \
  --region ca-central-1
```

---

## Webhook URLs

### Staging

```
Voice Webhook:    https://api-staging.berthcare.ca/v1/voice/webhook
Voice Status:     https://api-staging.berthcare.ca/v1/voice/status
SMS Webhook:      https://api-staging.berthcare.ca/v1/sms/webhook
SMS Status:       https://api-staging.berthcare.ca/v1/sms/status
```

### Production

```
Voice Webhook:    https://api.berthcare.ca/v1/voice/webhook
Voice Status:     https://api.berthcare.ca/v1/voice/status
SMS Webhook:      https://api.berthcare.ca/v1/sms/webhook
SMS Status:       https://api.berthcare.ca/v1/sms/status
```

---

## Testing

### Test Voice Call (cURL)

```bash
curl -X POST https://api-staging.berthcare.ca/v1/test/voice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+14165551234",
    "message": "This is a test call from BerthCare"
  }'
```

### Test SMS (cURL)

```bash
curl -X POST https://api-staging.berthcare.ca/v1/test/sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+14165551234",
    "message": "This is a test SMS from BerthCare"
  }'
```

### Test with Twilio CLI

```bash
# Install Twilio CLI
npm install -g twilio-cli

# Login
twilio login

# Send test SMS
twilio api:core:messages:create \
  --from "+1YOURNUMBER" \
  --to "+14165551234" \
  --body "Test message"

# Make test call
twilio api:core:calls:create \
  --from "+1YOURNUMBER" \
  --to "+14165551234" \
  --url "http://demo.twilio.com/docs/voice.xml"
```

---

## Common Operations

### Rotate Auth Token

```bash
# 1. Generate new token in Twilio Console
# Console → Settings → API Keys → Create new token

# 2. Update AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id staging/twilio/account \
  --secret-string '{"account_sid":"ACxxxx","auth_token":"NEW_TOKEN"}' \
  --region ca-central-1

# 3. Restart backend services
kubectl rollout restart deployment/backend -n staging
```

### Check Usage and Costs

```bash
# View usage in Twilio Console
# Console → Monitor → Usage

# Or use Twilio CLI
twilio api:core:usage:records:list --limit 10
```

### View Call/SMS Logs

```bash
# Twilio Console
# Console → Monitor → Logs → Calls
# Console → Monitor → Logs → Messages

# Or use Twilio CLI
twilio api:core:calls:list --limit 10
twilio api:core:messages:list --limit 10
```

---

## Troubleshooting

### Calls Not Connecting

```bash
# Check Twilio error logs
twilio api:core:calls:list --limit 10

# Check webhook logs
# Console → Monitor → Logs → Webhooks

# Verify phone number format
echo "+14165551234" | grep -E '^\+1[0-9]{10}$'

# Test webhook URL
curl -I https://api-staging.berthcare.ca/v1/voice/webhook
```

### SMS Not Delivering

```bash
# Check message status
twilio api:core:messages:list --limit 10

# Check for carrier filtering
# Console → Monitor → Logs → Messages → Click message → View details

# Verify SMS capability
twilio api:core:incoming-phone-numbers:list
```

### Webhook Timeouts

```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/backend-staging --follow

# Check webhook response time
# Console → Monitor → Logs → Webhooks → Response Time

# Test webhook locally
curl -X POST https://api-staging.berthcare.ca/v1/voice/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=CAxxxx&From=+14165551234&To=+14165555678"
```

---

## Cost Monitoring

### Current Rates (Canada)

```
Voice Calls:  $0.013/minute
SMS:          $0.0075/message
Phone Number: $1-2/month
```

### Set Up Billing Alerts

```bash
# In Twilio Console
# Console → Billing → Alerts

# Create alerts:
# - Usage > $100
# - Usage > $500
# - Balance < $50
```

### View Current Costs

```bash
# Twilio Console
# Console → Billing → Usage

# Or use API
twilio api:core:usage:records:list \
  --category calls \
  --start-date 2025-10-01 \
  --end-date 2025-10-31
```

---

## Security Checklist

- [ ] Auth token stored in AWS Secrets Manager (not in code)
- [ ] Webhook auth token is 32+ characters
- [ ] Webhook signature validation enabled
- [ ] CloudWatch alarms configured for unauthorized access
- [ ] Auth token rotation scheduled (every 90 days)
- [ ] IAM policies follow least privilege principle
- [ ] Twilio subaccounts used for environment isolation

---

## Emergency Procedures

### Compromised Credentials

```bash
# 1. Immediately rotate auth token in Twilio Console
# Console → Settings → API Keys → Regenerate

# 2. Update AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id staging/twilio/account \
  --secret-string '{"account_sid":"ACxxxx","auth_token":"NEW_TOKEN"}' \
  --region ca-central-1

# 3. Restart all backend services
kubectl rollout restart deployment/backend -n staging

# 4. Review Twilio logs for suspicious activity
# Console → Monitor → Logs → Calls/Messages

# 5. Check AWS CloudTrail for unauthorized secret access
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=staging/twilio/account
```

### Service Outage

```bash
# 1. Check Twilio status
# https://status.twilio.com

# 2. Check backend API health
curl https://api-staging.berthcare.ca/health

# 3. Check CloudWatch metrics
# AWS Console → CloudWatch → Dashboards → BerthCare-Staging

# 4. Review error logs
aws logs tail /aws/lambda/backend-staging --follow --filter-pattern "ERROR"
```

---

## Resources

- **Full Setup Guide:** [docs/twilio-setup.md](./twilio-setup.md)
- **Checklist:** [docs/E7-twilio-configuration-checklist.md](./E7-twilio-configuration-checklist.md)
- **Twilio Docs:** https://www.twilio.com/docs
- **Twilio Support:** https://support.twilio.com
- **Twilio Status:** https://status.twilio.com

---

## Support Contacts

- **Twilio Support:** https://support.twilio.com
- **BerthCare DevOps:** devops@berthcare.ca
- **On-Call Engineer:** See PagerDuty rotation

---

**Last Updated:** October 7, 2025  
**Maintained By:** DevOps Team
