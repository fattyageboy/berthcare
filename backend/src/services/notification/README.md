# Notification Service

Push notification service with Firebase Cloud Messaging (FCM) integration for iOS, Android, and Web platforms.

## Overview

The Notification Service provides:
- **Push Notifications**: Real-time notifications via Firebase Cloud Messaging
- **Device Token Management**: Register and manage FCM device tokens
- **Notification History**: Track sent notifications and delivery status
- **User Preferences**: Customizable notification settings per user
- **Multi-Platform Support**: iOS, Android, and Web push notifications

## Architecture

### Components

1. **FCM Service** (`fcm.service.ts`): Firebase Cloud Messaging integration
2. **Notification Service** (`service.ts`): Business logic and orchestration
3. **Repository** (`repository.ts`): Database operations
4. **Controller** (`controller.ts`): HTTP request handlers
5. **Routes** (`routes.ts`): API endpoint definitions

### Database Schema

#### push_notification_tokens
Stores FCM device tokens for push notification delivery.

```sql
CREATE TABLE push_notification_tokens (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  device_id varchar(255) NOT NULL,
  fcm_token text NOT NULL,
  platform varchar(20) NOT NULL, -- 'ios', 'android', 'web'
  app_version varchar(50),
  is_active boolean DEFAULT true,
  last_used_at timestamp,
  created_at timestamp,
  updated_at timestamp
);
```

#### notifications
Tracks notification history and delivery status.

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  type varchar(50) NOT NULL, -- 'visit_reminder', 'team_alert', etc.
  title varchar(255) NOT NULL,
  body text NOT NULL,
  data jsonb,
  priority varchar(20) DEFAULT 'normal', -- 'high', 'normal', 'low'
  status varchar(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'read'
  sent_at timestamp,
  read_at timestamp,
  error_message text,
  created_at timestamp,
  updated_at timestamp
);
```

#### notification_preferences
User notification preferences and settings.

```sql
CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES users,
  visit_reminders_enabled boolean DEFAULT true,
  team_alerts_enabled boolean DEFAULT true,
  sync_updates_enabled boolean DEFAULT true,
  family_updates_enabled boolean DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamp,
  updated_at timestamp
);
```

## API Endpoints

### Device Token Management

#### Register Device Token
```http
POST /api/notifications/tokens
Authorization: Bearer <token>
Content-Type: application/json

{
  "device_id": "unique-device-identifier",
  "fcm_token": "firebase-cloud-messaging-token",
  "platform": "ios",
  "app_version": "1.0.0"
}
```

**Response:**
```json
{
  "message": "Device token registered successfully",
  "token": {
    "id": "uuid",
    "device_id": "unique-device-identifier",
    "platform": "ios",
    "is_active": true
  }
}
```

#### Deactivate Device Token
```http
DELETE /api/notifications/tokens/:id
Authorization: Bearer <token>
```

### Send Notifications

#### Send Notification
```http
POST /api/notifications/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "uuid",
  "type": "visit_reminder",
  "title": "Visit Reminder",
  "body": "Your visit starts in 30 minutes",
  "data": {
    "visit_id": "uuid",
    "client_name": "John Doe"
  },
  "priority": "high"
}
```

**Response:**
```json
{
  "message": "Notification sent successfully",
  "result": {
    "success": true,
    "notification_id": "uuid",
    "tokens_sent": 2,
    "tokens_failed": 0
  }
}
```

### Notification History

#### Get Notifications
```http
GET /api/notifications?limit=50&offset=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "visit_reminder",
      "title": "Visit Reminder",
      "body": "Your visit starts in 30 minutes",
      "data": {...},
      "priority": "high",
      "status": "sent",
      "sent_at": "2025-10-03T10:00:00Z",
      "read_at": null,
      "created_at": "2025-10-03T09:59:00Z"
    }
  ],
  "unread_count": 5,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 10
  }
}
```

#### Mark as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer <token>
```

### Preferences

#### Get Preferences
```http
GET /api/notifications/preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "preferences": {
    "id": "uuid",
    "user_id": "uuid",
    "visit_reminders_enabled": true,
    "team_alerts_enabled": true,
    "sync_updates_enabled": true,
    "family_updates_enabled": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00"
  }
}
```

#### Update Preferences
```http
PUT /api/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "visit_reminders_enabled": true,
  "team_alerts_enabled": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00"
}
```

## Notification Types

### Visit Reminders
Sent 30 minutes before scheduled visit start time.

```typescript
{
  type: 'visit_reminder',
  title: 'Visit Reminder',
  body: 'Your visit with [Client Name] starts in 30 minutes',
  data: {
    visit_id: 'uuid',
    client_id: 'uuid',
    client_name: 'John Doe',
    scheduled_start: '2025-10-03T10:30:00Z'
  }
}
```

### Team Alerts
Urgent notifications requiring immediate attention.

```typescript
{
  type: 'team_alert',
  title: 'Urgent: Team Alert',
  body: 'Emergency situation requires immediate response',
  priority: 'high',
  data: {
    alert_type: 'emergency',
    location: 'Vessel XYZ'
  }
}
```

### Sync Updates
Data synchronization status notifications.

```typescript
{
  type: 'sync_update',
  title: 'Sync Complete',
  body: 'Your data has been synchronized successfully',
  data: {
    sync_id: 'uuid',
    items_synced: 5
  }
}
```

### Family Updates
Visit completion notifications for family members.

```typescript
{
  type: 'family_update',
  title: 'Visit Completed',
  body: 'Care visit for [Client Name] has been completed',
  data: {
    visit_id: 'uuid',
    client_name: 'John Doe',
    completed_at: '2025-10-03T11:00:00Z'
  }
}
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Cloud Messaging

### 2. Generate Service Account Key

1. Go to Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Add to environment variable as single-line JSON:

```bash
FCM_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...",...}'
```

### 3. Configure Mobile Apps

#### iOS Setup
1. Add iOS app in Firebase Console
2. Download `GoogleService-Info.plist`
3. Add to Xcode project
4. Enable Push Notifications capability
5. Configure APNs certificates

#### Android Setup
1. Add Android app in Firebase Console
2. Download `google-services.json`
3. Add to Android project
4. Add FCM dependencies to `build.gradle`

## Usage Examples

### Mobile App Integration

#### iOS (Swift)
```swift
import FirebaseMessaging

// Get FCM token
Messaging.messaging().token { token, error in
    if let token = token {
        // Register with backend
        registerDeviceToken(token: token, platform: "ios")
    }
}
```

#### Android (Kotlin)
```kotlin
import com.google.firebase.messaging.FirebaseMessaging

// Get FCM token
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val token = task.result
        // Register with backend
        registerDeviceToken(token, "android")
    }
}
```

### Backend Integration

```typescript
import { NotificationService } from './services/notification';

const notificationService = new NotificationService(pool);

// Send notification
await notificationService.sendNotification({
  user_id: 'user-uuid',
  type: 'visit_reminder',
  title: 'Visit Reminder',
  body: 'Your visit starts in 30 minutes',
  data: {
    visit_id: 'visit-uuid',
    client_name: 'John Doe'
  },
  priority: 'high'
});
```

## Features

### Quiet Hours
Users can set quiet hours during which non-urgent notifications are suppressed.

- Team alerts (high priority) bypass quiet hours
- Other notifications are held until quiet hours end

### Token Management
- Automatic token refresh on app updates
- Invalid token detection and cleanup
- Multi-device support per user

### Delivery Tracking
- Track notification delivery status
- Retry failed deliveries
- Monitor delivery metrics

### Preferences
- Per-notification-type enable/disable
- Quiet hours configuration
- Platform-specific settings

## Error Handling

### Invalid Tokens
When FCM returns invalid token errors, tokens are automatically deactivated:

```typescript
// Automatically handled by FCMService
if (error.code === 'messaging/invalid-registration-token') {
  await repository.deactivateTokenByFCM(fcmToken);
}
```

### Failed Deliveries
Failed notifications are logged with error messages:

```typescript
{
  status: 'failed',
  error_message: 'Invalid or unregistered token'
}
```

## Testing

See `test-examples.http` for API testing examples.

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

## Security Considerations

1. **Token Security**: FCM tokens are sensitive and should be transmitted over HTTPS
2. **Authentication**: All endpoints require valid JWT authentication
3. **Authorization**: Users can only manage their own tokens and preferences
4. **Rate Limiting**: Implement rate limiting to prevent notification spam
5. **Data Privacy**: Notification data should not contain sensitive information

## Performance

### Batch Sending
Multiple tokens are sent in batches for efficiency:

```typescript
// Sends to all user devices in one batch
await fcmService.sendToMultipleTokens(tokens, title, body, data);
```

### Database Indexes
Optimized indexes for common queries:
- `user_id` for user lookups
- `device_id + user_id` for unique device identification
- `is_active` for filtering active tokens
- `created_at` for notification history

## Monitoring

### Metrics to Track
- Notification delivery success rate
- Invalid token rate
- Average delivery time
- User engagement (read rate)

### Cleanup
Automatically clean up old read notifications:

```typescript
// Delete notifications older than 90 days
await notificationService.cleanupOldNotifications(90);
```

## Troubleshooting

### Notifications Not Received

1. **Check FCM Configuration**
   ```bash
   # Verify FCM_SERVICE_ACCOUNT_KEY is set
   echo $FCM_SERVICE_ACCOUNT_KEY
   ```

2. **Verify Token Registration**
   ```sql
   SELECT * FROM push_notification_tokens WHERE user_id = 'uuid';
   ```

3. **Check Notification Status**
   ```sql
   SELECT * FROM notifications WHERE user_id = 'uuid' ORDER BY created_at DESC;
   ```

4. **Review Logs**
   ```bash
   # Check for FCM errors
   grep "FCM" logs/app.log
   ```

### Common Issues

- **Invalid Token**: Token expired or app uninstalled - automatically deactivated
- **Quiet Hours**: Notification blocked by user preferences
- **FCM Not Configured**: Missing or invalid service account key
- **Platform Mismatch**: Token platform doesn't match device

## References

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [FCM HTTP v1 API](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
- [iOS Push Notifications](https://developer.apple.com/documentation/usernotifications)
- [Android FCM Integration](https://firebase.google.com/docs/cloud-messaging/android/client)
