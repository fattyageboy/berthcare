# Twilio Setup Guide

**Philosophy:** "Simplicity is the ultimate sophistication"

This guide walks through setting up Twilio accounts, purchasing Canadian phone numbers, and configuring webhooks for BerthCare's communication services.

## Overview

BerthCare uses Twilio for two critical communication features:
1. **Voice Alerts:** Urgent care coordination calls from nurses to coordinators
2. **Family Portal:** Daily SMS updates to family members

## Prerequisites

- Twilio account with billing enabled
- Access to AWS Secrets Manager (for credential storage)
- Backend API deployed (for webhook URLs)

## Step 1: Create Twilio Account

### 1.1 Sign Up

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up with your business email
3. Verify your email address
4. Complete phone verification

### 1.2 Upgrade to Paid Account

**Important:** Trial accounts have limitations that won't work for production.

1. Navigate to **Console → Billing**
2. Click **Upgrade Account**
3. Add payment method (credit card)
4. Set up billing alerts:
   - Alert at $100 usage
   - Alert at $500 usage
   - Hard limit at $1000 (adjust based on expected usage)

### 1.3 Enable Required Services

1. Navigate to **Console → Products**
2. Enable:
   - **Programmable Voice** (for care coordination calls)
   - **Programmable SMS** (for family portal)

## Step 2: Purchase Canadian Phone Numbers

### 2.1 Voice Call Number

1. Navigate to **Console → Phone Numbers → Buy a Number**
2. Set filters:
   - **Country:** Canada
   - **Capabilities:** Voice
   - **Type:** Local (preferred) or Toll-Free
   - **Location:** Ontario or your primary service area
3. Search and select a number
4. Click **Buy** (typically $1-2/month)
5. **Save the number** in E.164 format: `+1XXXXXXXXXX`

**Recommended:** Choose a local number in your service area for better trust and recognition.

### 2.2 SMS Number

1. Navigate to **Console → Phone Numbers → Buy a Number**
2. Set filters:
   - **Country:** Canada
   - **Capabilities:** SMS
   - **Type:** Local (required for SMS in Canada)
   - **Location:** Ontario or your primary service area
3. Search and select a number
4. Click **Buy** (typically $1-2/month)
5. **Save the number** in E.164 format: `+1XXXXXXXXXX`

**Note:** You can use the same number for both voice and SMS if it has both capabilities.

### 2.3 Verify Number Capabilities

1. Navigate to **Console → Phone Numbers → Manage → Active Numbers**
2. Click on each purchased number
3. Verify capabilities:
   - Voice number: ✓ Voice, ✓ Fax (optional)
   - SMS number: ✓ SMS, ✓ MMS (optional)

## Step 3: Configure Subaccounts (Optional but Recommended)

Subaccounts provide isolation between staging and production environments.

### 3.1 Create Staging Subaccount

1. Navigate to **Console → Account → Subaccounts**
2. Click **Create new Subaccount**
3. Enter details:
   - **Friendly Name:** BerthCare Staging
   - **Status:** Active
4. Click **Create**
5. **Save the Subaccount SID** (starts with `AC`)

### 3.2 Create Production Subaccount

1. Repeat the process:
   - **Friendly Name:** BerthCare Production
   - **Status:** Active
2. **Save the Subaccount SID**

### 3.3 Assign Phone Numbers to Subaccounts

1. Navigate to **Console → Phone Numbers → Manage → Active Numbers**
2. For each number:
   - Click the number
   - Scroll to **Subaccount**
   - Select the appropriate subaccount
   - Click **Save**

## Step 4: Retrieve API Credentials

### 4.1 Account SID and Auth Token

1. Navigate to **Console → Dashboard**
2. Find **Account Info** section
3. Copy:
   - **Account SID** (starts with `AC`, 34 characters)
   - **Auth Token** (32 characters, click "show" to reveal)

**Security:** Never commit these to version control!

### 4.2 Subaccount Credentials (if using subaccounts)

1. Navigate to **Console → Account → Subaccounts**
2. Click on each subaccount
3. Copy the **Subaccount SID** and **Auth Token**

## Step 5: Store Credentials in AWS Secrets Manager

### 5.1 Using Terraform (Recommended)

1. Create a `terraform.tfvars` file in `terraform/environments/staging/`:

```hcl
# Twilio Configuration - Staging
twilio_account_sid  = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
twilio_auth_token   = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
twilio_voice_number = "+1XXXXXXXXXX"
twilio_sms_number   = "+1XXXXXXXXXX"

# Webhook URLs (update after backend deployment)
voice_webhook_url         = "https://api-staging.berthcare.ca/v1/voice/webhook"
voice_status_callback_url = "https://api-staging.berthcare.ca/v1/voice/status"
sms_webhook_url           = "https://api-staging.berthcare.ca/v1/sms/webhook"
sms_status_callback_url   = "https://api-staging.berthcare.ca/v1/sms/status"

# Generate a random webhook auth token
webhook_auth_token = "generate_random_32_char_string"
```

2. Apply Terraform:

```bash
cd terraform/environments/staging
terraform init
terraform plan
terraform apply
```

### 5.2 Manual Setup (Alternative)

If not using Terraform, manually create secrets:

```bash
# Set AWS region
export AWS_REGION=ca-central-1

# Create Twilio account secret
aws secretsmanager create-secret \
  --name staging/twilio/account \
  --description "Twilio account credentials for staging" \
  --secret-string '{
    "account_sid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "auth_token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }' \
  --region ca-central-1

# Create phone numbers secret
aws secretsmanager create-secret \
  --name staging/twilio/phone-numbers \
  --description "Twilio phone numbers for staging" \
  --secret-string '{
    "voice_number": "+1XXXXXXXXXX",
    "sms_number": "+1XXXXXXXXXX"
  }' \
  --region ca-central-1

# Create webhooks secret
aws secretsmanager create-secret \
  --name staging/twilio/webhooks \
  --description "Twilio webhook configuration for staging" \
  --secret-string '{
    "voice_webhook_url": "https://api-staging.berthcare.ca/v1/voice/webhook",
    "voice_status_callback": "https://api-staging.berthcare.ca/v1/voice/status",
    "sms_webhook_url": "https://api-staging.berthcare.ca/v1/sms/webhook",
    "sms_status_callback": "https://api-staging.berthcare.ca/v1/sms/status",
    "webhook_auth_token": "your_random_32_char_token"
  }' \
  --region ca-central-1
```

## Step 6: Configure Webhooks in Twilio

**Note:** Complete this step after deploying the backend API.

### 6.1 Voice Webhooks

1. Navigate to **Console → Phone Numbers → Manage → Active Numbers**
2. Click on your **voice number**
3. Scroll to **Voice & Fax** section
4. Configure:
   - **A Call Comes In:** Webhook
   - **URL:** `https://api-staging.berthcare.ca/v1/voice/webhook`
   - **HTTP Method:** POST
   - **Status Callback URL:** `https://api-staging.berthcare.ca/v1/voice/status`
5. Click **Save**

### 6.2 SMS Webhooks

1. Click on your **SMS number**
2. Scroll to **Messaging** section
3. Configure:
   - **A Message Comes In:** Webhook
   - **URL:** `https://api-staging.berthcare.ca/v1/sms/webhook`
   - **HTTP Method:** POST
   - **Status Callback URL:** `https://api-staging.berthcare.ca/v1/sms/status`
4. Click **Save**

## Step 7: Test Configuration

### 7.1 Test Voice Call

```bash
# Using curl to test voice endpoint
curl -X POST https://api-staging.berthcare.ca/v1/test/voice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+1YOURNUMBER",
    "message": "This is a test call from BerthCare"
  }'
```

Expected result: You should receive a phone call with the test message.

### 7.2 Test SMS

```bash
# Using curl to test SMS endpoint
curl -X POST https://api-staging.berthcare.ca/v1/test/sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+1YOURNUMBER",
    "message": "This is a test SMS from BerthCare"
  }'
```

Expected result: You should receive an SMS with the test message.

### 7.3 Verify Webhook Delivery

1. Navigate to **Console → Monitor → Logs → Webhooks**
2. Check recent webhook deliveries
3. Verify:
   - Status: 200 OK
   - Response time: < 1 second
   - No errors

## Step 8: Configure Monitoring

### 8.1 Twilio Alerts

1. Navigate to **Console → Monitor → Alerts**
2. Create alerts for:
   - **High Error Rate:** > 5% failed calls/SMS
   - **High Usage:** > 1000 calls/SMS per day
   - **Low Balance:** < $50 remaining

### 8.2 CloudWatch Integration

The Terraform configuration automatically creates CloudWatch alarms for:
- Unauthorized secret access attempts
- High Twilio API error rates
- Webhook failures

## Cost Estimation

### Staging Environment (Testing)
- **Phone Numbers:** $2-4/month (2 numbers)
- **Voice Calls:** $0.013/min × 100 test calls × 2 min = $2.60/month
- **SMS:** $0.0075/SMS × 500 test messages = $3.75/month
- **Total:** ~$10-15/month

### Production Environment (Estimated)
- **Phone Numbers:** $2-4/month
- **Voice Calls:** $0.013/min × 500 calls × 3 min = $19.50/month
- **SMS:** $0.0075/SMS × 5000 messages = $37.50/month
- **Total:** ~$60-70/month

**Note:** Costs vary based on usage. Monitor closely in first month.

## Security Best Practices

### 1. Credential Rotation

Rotate Twilio Auth Tokens every 90 days:

```bash
# Generate new auth token in Twilio Console
# Update AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id staging/twilio/account \
  --secret-string '{
    "account_sid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "auth_token": "NEW_TOKEN_HERE"
  }' \
  --region ca-central-1

# Restart backend services to pick up new token
```

### 2. Webhook Authentication

Always validate webhook requests using Twilio's signature validation:

```typescript
import { validateRequest } from 'twilio';

// In your webhook handler
const isValid = validateRequest(
  authToken,
  twilioSignature,
  url,
  params
);

if (!isValid) {
  return res.status(403).json({ error: 'Invalid signature' });
}
```

### 3. IP Whitelisting (Optional)

For additional security, whitelist Twilio's IP ranges:

1. Navigate to **Console → Account → Security**
2. Enable **IP Access Control Lists**
3. Add your backend API IPs

### 4. Monitor for Anomalies

Set up alerts for:
- Unusual call/SMS volume
- Calls to unexpected numbers
- High error rates
- Unauthorized access attempts

## Troubleshooting

### Issue: Calls Not Connecting

**Symptoms:** Calls fail immediately or don't ring

**Solutions:**
1. Verify phone number format (E.164: +1XXXXXXXXXX)
2. Check Twilio account balance
3. Verify webhook URL is accessible (test with curl)
4. Check Twilio error logs in Console → Monitor → Logs

### Issue: SMS Not Delivering

**Symptoms:** SMS shows as "sent" but not received

**Solutions:**
1. Verify recipient number is not on DND list
2. Check for carrier filtering (some carriers block automated SMS)
3. Verify SMS number has SMS capability
4. Check message content for spam triggers

### Issue: Webhook Timeouts

**Symptoms:** Twilio logs show webhook timeouts

**Solutions:**
1. Optimize webhook handler (should respond in < 1 second)
2. Use async processing for long-running tasks
3. Increase backend API timeout settings
4. Check backend API logs for errors

### Issue: High Costs

**Symptoms:** Unexpected high Twilio charges

**Solutions:**
1. Review usage in Console → Monitor → Usage
2. Check for retry loops (failed calls retrying infinitely)
3. Verify rate limiting is working
4. Look for spam/abuse (unauthorized API usage)

## Next Steps

After completing Twilio setup:

1. ✅ **Update Backend Configuration:** Add Twilio credentials to backend environment
2. ✅ **Implement Voice Alert Service:** Follow Phase T in task plan
3. ✅ **Implement Family SMS Service:** Follow Phase F in task plan
4. ✅ **Test End-to-End:** Complete integration testing
5. ✅ **Document Operational Procedures:** Update runbooks

## References

- [Twilio Voice API Documentation](https://www.twilio.com/docs/voice)
- [Twilio SMS API Documentation](https://www.twilio.com/docs/sms)
- [Twilio Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
- [BerthCare Architecture Blueprint](../project-documentation/architecture-output.md)
- [Task Plan - Phase T](../project-documentation/task-plan.md#phase-t--twilio-integration-voice--sms)

## Support

For Twilio-specific issues:
- **Twilio Support:** [https://support.twilio.com](https://support.twilio.com)
- **Twilio Status:** [https://status.twilio.com](https://status.twilio.com)

For BerthCare infrastructure issues:
- Check CloudWatch logs and metrics
- Review Terraform state
- Contact DevOps team
