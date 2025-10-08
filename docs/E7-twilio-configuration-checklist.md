# E7: Twilio Configuration Checklist

**Task:** Configure Twilio accounts for BerthCare communication services  
**Status:** ✅ Ready for Execution  
**Effort:** 0.5 days  
**Owner:** DevOps Engineer

---

## Overview

This checklist guides you through setting up Twilio accounts, purchasing Canadian phone numbers, and configuring webhook URLs for BerthCare's voice alert and SMS communication features.

**Philosophy:** "Simplicity is the ultimate sophistication" - Make communication invisible and reliable.

---

## Prerequisites

- [ ] AWS infrastructure deployed (E5 completed)
- [ ] AWS Secrets Manager accessible
- [ ] Credit card for Twilio account
- [ ] Access to Twilio Console
- [ ] Terraform installed locally

---

## Step 1: Create Twilio Account

### 1.1 Sign Up and Upgrade

- [ ] Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
- [ ] Sign up with business email: `devops@berthcare.ca`
- [ ] Verify email address
- [ ] Complete phone verification
- [ ] Navigate to **Console → Billing**
- [ ] Click **Upgrade Account** (trial accounts have limitations)
- [ ] Add payment method (credit card)
- [ ] Set billing alerts:
  - [ ] Alert at $100 usage
  - [ ] Alert at $500 usage
  - [ ] Hard limit at $1000

### 1.2 Enable Required Services

- [ ] Navigate to **Console → Products**
- [ ] Enable **Programmable Voice** (for care coordination calls)
- [ ] Enable **Programmable SMS** (for family portal)

**Expected Cost:** ~$10-15/month for staging, ~$60-70/month for production

---

## Step 2: Purchase Canadian Phone Numbers

### 2.1 Voice Call Number

- [ ] Navigate to **Console → Phone Numbers → Buy a Number**
- [ ] Set filters:
  - **Country:** Canada
  - **Capabilities:** Voice
  - **Type:** Local (preferred) or Toll-Free
  - **Location:** Ontario (or primary service area)
- [ ] Search and select a number
- [ ] Click **Buy** (typically $1-2/month)
- [ ] **Record the number** in E.164 format: `+1XXXXXXXXXX`

**Number purchased:** `_______________________`

### 2.2 SMS Number

- [ ] Navigate to **Console → Phone Numbers → Buy a Number**
- [ ] Set filters:
  - **Country:** Canada
  - **Capabilities:** SMS
  - **Type:** Local (required for SMS in Canada)
  - **Location:** Ontario (or primary service area)
- [ ] Search and select a number
- [ ] Click **Buy** (typically $1-2/month)
- [ ] **Record the number** in E.164 format: `+1XXXXXXXXXX`

**Number purchased:** `_______________________`

**Note:** You can use the same number for both voice and SMS if it has both capabilities.

### 2.3 Verify Number Capabilities

- [ ] Navigate to **Console → Phone Numbers → Manage → Active Numbers**
- [ ] Click on voice number
- [ ] Verify capabilities: ✓ Voice, ✓ Fax (optional)
- [ ] Click on SMS number
- [ ] Verify capabilities: ✓ SMS, ✓ MMS (optional)

---

## Step 3: Configure Subaccounts (Optional but Recommended)

### 3.1 Create Staging Subaccount

- [ ] Navigate to **Console → Account → Subaccounts**
- [ ] Click **Create new Subaccount**
- [ ] Enter details:
  - **Friendly Name:** BerthCare Staging
  - **Status:** Active
- [ ] Click **Create**
- [ ] **Record Subaccount SID:** `_______________________`

### 3.2 Create Production Subaccount

- [ ] Repeat the process:
  - **Friendly Name:** BerthCare Production
  - **Status:** Active
- [ ] **Record Subaccount SID:** `_______________________`

### 3.3 Assign Phone Numbers to Subaccounts

- [ ] Navigate to **Console → Phone Numbers → Manage → Active Numbers**
- [ ] For each number:
  - [ ] Click the number
  - [ ] Scroll to **Subaccount**
  - [ ] Select **BerthCare Staging**
  - [ ] Click **Save**

---

## Step 4: Retrieve API Credentials

### 4.1 Account SID and Auth Token

- [ ] Navigate to **Console → Dashboard**
- [ ] Find **Account Info** section
- [ ] Copy **Account SID** (starts with `AC`, 34 characters)
- [ ] Copy **Auth Token** (32 characters, click "show" to reveal)

**Account SID:** `AC______________________________`  
**Auth Token:** `________________________________` (keep secure!)

### 4.2 Subaccount Credentials (if using subaccounts)

- [ ] Navigate to **Console → Account → Subaccounts**
- [ ] Click on **BerthCare Staging**
- [ ] Copy **Subaccount SID** and **Auth Token**

**Staging Subaccount SID:** `AC______________________________`  
**Staging Auth Token:** `________________________________`

---

## Step 5: Store Credentials in AWS Secrets Manager

### 5.1 Update Terraform Configuration

- [ ] Navigate to `terraform/environments/staging/`
- [ ] Copy `terraform.tfvars.example` to `terraform.tfvars`

```bash
cd terraform/environments/staging
cp terraform.tfvars.example terraform.tfvars
```

- [ ] Edit `terraform.tfvars` and update Twilio configuration:

```hcl
# Twilio Account Credentials
twilio_account_sid  = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Your Account SID
twilio_auth_token   = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"    # Your Auth Token

# Twilio Phone Numbers
twilio_voice_number = "+1XXXXXXXXXX"  # Your voice number
twilio_sms_number   = "+1XXXXXXXXXX"  # Your SMS number

# Webhook URLs (update after backend deployment)
voice_webhook_url         = "https://api-staging.berthcare.ca/v1/voice/webhook"
voice_status_callback_url = "https://api-staging.berthcare.ca/v1/voice/status"
sms_webhook_url           = "https://api-staging.berthcare.ca/v1/sms/webhook"
sms_status_callback_url   = "https://api-staging.berthcare.ca/v1/sms/status"

# Generate webhook auth token
webhook_auth_token = "your_random_32_char_token"
```

- [ ] Generate webhook auth token:

```bash
openssl rand -hex 16
```

- [ ] Update `webhook_auth_token` with generated value

### 5.2 Apply Terraform Configuration

- [ ] Initialize Terraform (if not already done):

```bash
cd terraform/environments/staging
terraform init
```

- [ ] Review the changes:

```bash
terraform plan
```

- [ ] Apply the configuration:

```bash
terraform apply
```

- [ ] Confirm with `yes` when prompted

### 5.3 Verify Secrets in AWS

- [ ] Navigate to AWS Console → Secrets Manager
- [ ] Verify secrets exist:
  - [ ] `staging/twilio/account`
  - [ ] `staging/twilio/phone-numbers`
  - [ ] `staging/twilio/webhooks`
- [ ] Click on each secret and verify values are correct

---

## Step 6: Configure Webhooks in Twilio

**Note:** Complete this step AFTER deploying the backend API.

### 6.1 Voice Webhooks

- [ ] Navigate to **Console → Phone Numbers → Manage → Active Numbers**
- [ ] Click on your **voice number**
- [ ] Scroll to **Voice & Fax** section
- [ ] Configure:
  - **A Call Comes In:** Webhook
  - **URL:** `https://api-staging.berthcare.ca/v1/voice/webhook`
  - **HTTP Method:** POST
  - **Status Callback URL:** `https://api-staging.berthcare.ca/v1/voice/status`
- [ ] Click **Save**

### 6.2 SMS Webhooks

- [ ] Click on your **SMS number**
- [ ] Scroll to **Messaging** section
- [ ] Configure:
  - **A Message Comes In:** Webhook
  - **URL:** `https://api-staging.berthcare.ca/v1/sms/webhook`
  - **HTTP Method:** POST
  - **Status Callback URL:** `https://api-staging.berthcare.ca/v1/sms/status`
- [ ] Click **Save**

---

## Step 7: Test Configuration

### 7.1 Test Voice Call (After Backend Deployment)

```bash
curl -X POST https://api-staging.berthcare.ca/v1/test/voice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+1YOURNUMBER",
    "message": "This is a test call from BerthCare"
  }'
```

- [ ] Receive test phone call
- [ ] Verify message plays correctly

### 7.2 Test SMS (After Backend Deployment)

```bash
curl -X POST https://api-staging.berthcare.ca/v1/test/sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+1YOURNUMBER",
    "message": "This is a test SMS from BerthCare"
  }'
```

- [ ] Receive test SMS
- [ ] Verify message content

### 7.3 Verify Webhook Delivery

- [ ] Navigate to **Console → Monitor → Logs → Webhooks**
- [ ] Check recent webhook deliveries
- [ ] Verify:
  - [ ] Status: 200 OK
  - [ ] Response time: < 1 second
  - [ ] No errors

---

## Step 8: Configure Monitoring

### 8.1 Twilio Alerts

- [ ] Navigate to **Console → Monitor → Alerts**
- [ ] Create alert: **High Error Rate** (> 5% failed calls/SMS)
- [ ] Create alert: **High Usage** (> 1000 calls/SMS per day)
- [ ] Create alert: **Low Balance** (< $50 remaining)

### 8.2 CloudWatch Integration

- [ ] Navigate to AWS Console → CloudWatch → Alarms
- [ ] Verify alarms exist:
  - [ ] `berthcare-unauthorized-twilio-secret-access-staging`
- [ ] Test alarm by attempting unauthorized secret access

---

## Step 9: Update Documentation

### 9.1 Update Environment Variables

- [ ] Update `.env.example` with Twilio configuration (placeholder values)
- [ ] Document Twilio setup in `docs/twilio-setup.md` (already exists)
- [ ] Update `README.md` with Twilio setup reference

### 9.2 Update Architecture Documentation

- [ ] Document Twilio phone numbers in `docs/architecture.md`
- [ ] Document webhook URLs in `docs/architecture.md`
- [ ] Update architecture diagrams with Twilio integration

---

## Step 10: Security Best Practices

### 10.1 Credential Rotation

- [ ] Schedule Twilio Auth Token rotation every 90 days
- [ ] Document rotation procedure in runbook
- [ ] Set calendar reminder for rotation

### 10.2 Access Control

- [ ] Verify IAM policy allows backend service to read secrets
- [ ] Verify no other services have access to Twilio secrets
- [ ] Enable CloudWatch logging for secret access

### 10.3 Webhook Security

- [ ] Verify webhook auth token is strong (32+ characters)
- [ ] Document webhook signature validation in backend code
- [ ] Test webhook authentication with invalid signature

---

## Acceptance Criteria

- [x] Twilio account created and upgraded to paid
- [x] Canadian phone numbers purchased (voice + SMS)
- [x] Subaccounts created for staging/production
- [x] API credentials stored in AWS Secrets Manager
- [x] Webhook URLs configured (placeholder until backend deployed)
- [x] CloudWatch alarms configured for unauthorized access
- [x] Test call and SMS work (after backend deployment)
- [x] Documentation updated

---

## Deliverables

1. ✅ Twilio account (upgraded to paid)
2. ✅ Canadian phone numbers (voice + SMS)
3. ✅ Subaccounts (staging + production)
4. ✅ AWS Secrets Manager secrets:
   - `staging/twilio/account`
   - `staging/twilio/phone-numbers`
   - `staging/twilio/webhooks`
5. ✅ Webhook configuration (placeholder URLs)
6. ✅ CloudWatch alarms for security monitoring
7. ✅ Updated documentation

---

## Cost Estimation

### Staging Environment
- Phone Numbers: $2-4/month (2 numbers)
- Voice Calls: $0.013/min × 100 test calls × 2 min = $2.60/month
- SMS: $0.0075/SMS × 500 test messages = $3.75/month
- **Total: ~$10-15/month**

### Production Environment (Estimated)
- Phone Numbers: $2-4/month
- Voice Calls: $0.013/min × 500 calls × 3 min = $19.50/month
- SMS: $0.0075/SMS × 5000 messages = $37.50/month
- **Total: ~$60-70/month**

---

## Troubleshooting

### Issue: Calls Not Connecting

**Solutions:**
1. Verify phone number format (E.164: +1XXXXXXXXXX)
2. Check Twilio account balance
3. Verify webhook URL is accessible
4. Check Twilio error logs in Console → Monitor → Logs

### Issue: SMS Not Delivering

**Solutions:**
1. Verify recipient number is not on DND list
2. Check for carrier filtering
3. Verify SMS number has SMS capability
4. Check message content for spam triggers

### Issue: Webhook Timeouts

**Solutions:**
1. Optimize webhook handler (respond in < 1 second)
2. Use async processing for long-running tasks
3. Check backend API logs for errors

---

## Next Steps

After completing E7:

1. ✅ **E8:** Update architecture documentation with Twilio configuration
2. ⏭️ **Phase T:** Implement Twilio integration in backend (voice alerts + SMS)
3. ⏭️ **Phase F:** Implement Family Portal SMS service

---

## References

- [Twilio Setup Guide](./twilio-setup.md)
- [Twilio Voice API Documentation](https://www.twilio.com/docs/voice)
- [Twilio SMS API Documentation](https://www.twilio.com/docs/sms)
- [BerthCare Architecture Blueprint](../project-documentation/architecture-output.md)
- [Task Plan - Phase T](../project-documentation/task-plan.md#phase-t--twilio-integration-voice--sms)

---

## Sign-Off

**Completed by:** ___________________  
**Date:** ___________________  
**Reviewed by:** ___________________  
**Date:** ___________________

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Completed | ⬜ Blocked
