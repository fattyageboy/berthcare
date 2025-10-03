# Email Service

Email notification service with Amazon SES integration for transactional and bulk emails.

## Overview

The Email Service provides:
- **Transactional Emails**: Visit reports, password resets, system notifications
- **Bulk Emails**: Weekly summaries, policy updates
- **HTML Templates**: Professional email templates with BerthCare branding
- **Bounce Handling**: Automated bounce and complaint processing
- **Delivery Tracking**: Email delivery status and statistics
- **Suppression List**: Automatic suppression of bounced/complained emails

## Architecture

### Components

1. **SES Service** (`ses.service.ts`): Amazon SES integration
2. **Email Service** (`service.ts`): Business logic and orchestration
3. **Repository** (`repository.ts`): Database operations
4. **Templates** (`templates.ts`): HTML email templates
5. **Controller** (`controller.ts`): HTTP request handlers
6. **Routes** (`routes.ts`): API endpoint definitions

### Database Schema

#### email_logs
Tracks email delivery history and status.

```sql
CREATE TABLE email_logs (
  id uuid PRIMARY KEY,
  recipient_email varchar(255) NOT NULL,
  recipient_name varchar(255),
  subject varchar(500) NOT NULL,
  type varchar(50) NOT NULL, -- 'visit_report', 'password_reset', etc.
  status varchar(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced', 'complained'
  message_id varchar(255), -- SES message ID
  error_message text,
  metadata jsonb,
  sent_at timestamp,
  bounced_at timestamp,
  complained_at timestamp,
  created_at timestamp,
  updated_at timestamp
);
```

#### email_bounces
Tracks bounced emails and suppression list.

```sql
CREATE TABLE email_bounces (
  id uuid PRIMARY KEY,
  email varchar(255) UNIQUE NOT NULL,
  bounce_type varchar(50) NOT NULL, -- 'Permanent', 'Transient', 'Undetermined'
  bounce_subtype varchar(50),
  diagnostic_code text,
  is_suppressed boolean DEFAULT false,
  bounce_count integer DEFAULT 1,
  first_bounced_at timestamp,
  last_bounced_at timestamp,
  created_at timestamp,
  updated_at timestamp
);
```

## API Endpoints

### Send Emails

#### Send Custom Email
```http
POST /api/email/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": {
    "email": "user@example.com",
    "name": "John Doe"
  },
  "subject": "Test Email",
  "html": "<h1>Hello</h1><p>This is a test email.</p>",
  "text": "Hello\n\nThis is a test email.",
  "type": "system_notification"
}
```

#### Send Visit Report
```http
POST /api/email/visit-report
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_email": "family@example.com",
  "recipient_name": "Jane Doe",
  "data": {
    "visit_id": "uuid",
    "client_name": "John Smith",
    "nurse_name": "Mary Johnson",
    "visit_date": "2025-10-03",
    "visit_type": "Personal Care",
    "duration": "2 hours",
    "notes": "Visit completed successfully",
    "care_activities": [
      "Assisted with bathing",
      "Medication administration",
      "Vital signs monitoring"
    ],
    "medications": [
      "Aspirin 81mg - Administered at 10:00 AM"
    ],
    "vital_signs": {
      "Blood Pressure": "120/80 mmHg",
      "Heart Rate": "72 bpm",
      "Temperature": "98.6°F"
    }
  }
}
```

#### Send Password Reset
```http
POST /api/email/password-reset
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_email": "user@example.com",
  "recipient_name": "John Doe",
  "data": {
    "user_name": "John Doe",
    "reset_link": "https://app.berthcare.com/reset-password?token=abc123",
    "expiry_hours": 24
  }
}
```

#### Send Welcome Email
```http
POST /api/email/welcome
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_email": "newuser@example.com",
  "recipient_name": "New User",
  "data": {
    "user_name": "New User",
    "role": "Nurse",
    "login_link": "https://app.berthcare.com/login",
    "support_email": "support@berthcare.com"
  }
}
```

#### Send Weekly Summary
```http
POST /api/email/weekly-summary
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_email": "nurse@example.com",
  "recipient_name": "Mary Johnson",
  "data": {
    "user_name": "Mary Johnson",
    "week_start": "2025-09-27",
    "week_end": "2025-10-03",
    "total_visits": 25,
    "completed_visits": 23,
    "missed_visits": 2,
    "total_hours": 50,
    "highlights": [
      "Completed all scheduled visits on time",
      "Received positive feedback from 5 families",
      "Administered medications without errors"
    ]
  }
}
```

### Email Logs and Statistics

#### Get Email Logs
```http
GET /api/email/logs?email=user@example.com&limit=50&offset=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "recipient_email": "user@example.com",
      "recipient_name": "John Doe",
      "subject": "Visit Report: John Smith - 2025-10-03",
      "type": "visit_report",
      "status": "sent",
      "message_id": "ses-message-id",
      "sent_at": "2025-10-03T10:00:00Z",
      "created_at": "2025-10-03T09:59:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 10
  }
}
```

#### Get Bounce Statistics
```http
GET /api/email/stats/bounces
Authorization: Bearer <token>
```

**Response:**
```json
{
  "stats": {
    "total_bounces": 15,
    "permanent_bounces": 10,
    "transient_bounces": 5,
    "suppressed_emails": 10
  }
}
```

#### Get Delivery Statistics
```http
GET /api/email/stats/delivery?start_date=2025-09-01&end_date=2025-10-03
Authorization: Bearer <token>
```

**Response:**
```json
{
  "stats": {
    "total_sent": 1000,
    "successful": 950,
    "failed": 30,
    "bounced": 15,
    "complained": 5,
    "success_rate": 95
  }
}
```

#### Check if Email is Suppressed
```http
GET /api/email/suppressed/user@example.com
Authorization: Bearer <token>
```

**Response:**
```json
{
  "email": "user@example.com",
  "is_suppressed": false
}
```

### SES Webhook

#### Handle SES Bounce/Complaint Notifications
```http
POST /api/email/webhook/ses
Content-Type: application/json

{
  "notificationType": "Bounce",
  "bounce": {
    "bounceType": "Permanent",
    "bounceSubType": "General",
    "bouncedRecipients": [
      {
        "emailAddress": "bounced@example.com",
        "status": "5.1.1",
        "diagnosticCode": "smtp; 550 5.1.1 user unknown"
      }
    ],
    "timestamp": "2025-10-03T10:00:00.000Z"
  },
  "mail": {
    "messageId": "ses-message-id",
    "timestamp": "2025-10-03T09:59:00.000Z",
    "source": "noreply@berthcare.com",
    "destination": ["bounced@example.com"]
  }
}
```

## Email Types

### Visit Report
Sent to family members after visit completion.

**Template Features:**
- Visit details (client, nurse, date, type, duration)
- Care activities performed
- Medications administered
- Vital signs recorded
- Visit notes
- Link to full report

### Password Reset
Sent when user requests password reset.

**Template Features:**
- Personalized greeting
- Reset link button
- Expiry time warning
- Security reminders
- Plain text fallback link

### Welcome Email
Sent to new users upon account creation.

**Template Features:**
- Welcome message
- Role information
- Getting started checklist
- Login link
- Support contact information

### Weekly Summary
Sent weekly to caregivers with activity summary.

**Template Features:**
- Visit statistics
- Completion rate
- Total hours worked
- Highlights and achievements
- Dashboard link

## Amazon SES Setup

### 1. Create AWS Account and Configure SES

1. Sign up for AWS account
2. Navigate to Amazon SES console
3. Verify sender email address or domain
4. Request production access (if needed)
5. Create IAM user with SES permissions

### 2. Create IAM User

Create IAM user with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:GetSendQuota",
        "ses:GetSendStatistics"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Verify Email Addresses

**Development (Sandbox Mode):**
- Verify both sender and recipient emails
- Limited to 200 emails per day
- Can only send to verified addresses

**Production:**
- Request production access
- Verify sender domain
- Can send to any email address
- Higher sending limits

### 4. Configure Environment Variables

```bash
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=your-access-key-id
AWS_SES_SECRET_ACCESS_KEY=your-secret-access-key
AWS_SES_FROM_EMAIL=noreply@berthcare.com
AWS_SES_FROM_NAME=BerthCare
APP_URL=https://app.berthcare.com
```

### 5. Set Up SNS for Bounce/Complaint Notifications

1. Create SNS topic for bounces
2. Create SNS topic for complaints
3. Subscribe HTTP endpoint to topics
4. Configure SES to publish to SNS topics
5. Verify webhook endpoint

## Usage Examples

### Send Visit Report

```typescript
import { EmailService } from './services/email';

const emailService = new EmailService(pool);

await emailService.sendVisitReport(
  'family@example.com',
  'Jane Doe',
  {
    visit_id: 'visit-uuid',
    client_name: 'John Smith',
    nurse_name: 'Mary Johnson',
    visit_date: '2025-10-03',
    visit_type: 'Personal Care',
    duration: '2 hours',
    notes: 'Visit completed successfully',
    care_activities: [
      'Assisted with bathing',
      'Medication administration'
    ],
    medications: ['Aspirin 81mg'],
    vital_signs: {
      'Blood Pressure': '120/80 mmHg',
      'Heart Rate': '72 bpm'
    }
  }
);
```

### Send Password Reset

```typescript
await emailService.sendPasswordReset(
  'user@example.com',
  'John Doe',
  {
    user_name: 'John Doe',
    reset_link: 'https://app.berthcare.com/reset?token=abc123',
    expiry_hours: 24
  }
);
```

### Check Email Suppression

```typescript
const isSuppressed = await emailService.isEmailSuppressed('user@example.com');
if (isSuppressed) {
  console.log('Email is suppressed, cannot send');
}
```

## Features

### Bounce Handling
- **Permanent Bounces**: Automatically suppress email
- **Transient Bounces**: Track and suppress after 3 bounces
- **Diagnostic Codes**: Store technical bounce information
- **Bounce Statistics**: Monitor bounce rates

### Complaint Handling
- **Spam Complaints**: Automatically suppress email
- **Complaint Tracking**: Log all complaints
- **Suppression List**: Prevent future sends to complained addresses

### Email Templates
- **Responsive Design**: Mobile-friendly templates
- **BerthCare Branding**: Consistent brand identity
- **HTML + Plain Text**: Fallback for email clients
- **Dynamic Content**: Personalized with user data

### Delivery Tracking
- **Status Monitoring**: Track pending, sent, failed, bounced, complained
- **Message IDs**: SES message ID for tracking
- **Delivery Statistics**: Success rates and metrics
- **Email Logs**: Complete history of sent emails

## Testing

### Manual Testing
See `test-examples.http` for API testing examples.

### SES Sandbox Testing
Use SES mailbox simulator addresses:
- `success@simulator.amazonses.com` - Successful delivery
- `bounce@simulator.amazonses.com` - Bounce
- `complaint@simulator.amazonses.com` - Complaint
- `suppressionlist@simulator.amazonses.com` - Suppression list

### Local Development
For local development without SES:
1. Set `AWS_SES_ACCESS_KEY_ID` to empty
2. Emails will be logged but not sent
3. Use email preview tools for template testing

## Security Considerations

1. **Credentials**: Store AWS credentials securely in environment variables
2. **Email Verification**: Verify sender domain to prevent spoofing
3. **Rate Limiting**: Implement rate limiting on email endpoints
4. **Input Validation**: Validate all email addresses and content
5. **Suppression List**: Respect bounce and complaint suppressions
6. **HTTPS Only**: Use HTTPS for webhook endpoints
7. **Authentication**: Require authentication for all endpoints

## Performance

### Optimizations
1. **Batch Sending**: Send multiple emails in batches (future)
2. **Async Processing**: Queue emails for background processing (future)
3. **Template Caching**: Cache compiled templates
4. **Database Indexes**: Optimized for common queries

### SES Limits
- **Sandbox**: 200 emails/day, 1 email/second
- **Production**: Request limit increases as needed
- **Message Size**: 10 MB maximum (including attachments)

## Monitoring

### Metrics to Track
- Email delivery success rate
- Bounce rate (should be < 5%)
- Complaint rate (should be < 0.1%)
- Average delivery time
- Template rendering errors

### Alerts
- High bounce rate
- High complaint rate
- SES quota approaching
- Failed webhook deliveries

## Troubleshooting

### Emails Not Sending

1. **Check SES Configuration**
   ```bash
   echo $AWS_SES_ACCESS_KEY_ID
   echo $AWS_SES_SECRET_ACCESS_KEY
   ```

2. **Verify Email Address**
   - In sandbox mode, verify recipient email
   - Check SES verified identities

3. **Check Logs**
   ```bash
   grep "SES" logs/app.log
   ```

4. **Test SES Connection**
   ```bash
   aws ses verify-email-identity --email-address test@example.com
   ```

### Bounces

- **Permanent**: Email address doesn't exist - automatically suppressed
- **Transient**: Temporary issue (mailbox full) - retry later
- **Check bounce logs**: Review diagnostic codes

### Common Issues

- **Sandbox Limitations**: Request production access
- **Unverified Sender**: Verify sender email/domain
- **Rate Limits**: Implement queuing and throttling
- **Template Errors**: Test templates with sample data

## References

- [Amazon SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES Email Sending](https://docs.aws.amazon.com/ses/latest/dg/send-email.html)
- [SES Bounce Handling](https://docs.aws.amazon.com/ses/latest/dg/notification-contents.html)
- [Architecture Document](../../project-documentation/architecture-output.md)
