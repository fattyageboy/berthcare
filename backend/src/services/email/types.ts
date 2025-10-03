/**
 * Email Service Types
 * Type definitions for email notifications and SES integration
 */

export type EmailType =
  | 'visit_report'
  | 'password_reset'
  | 'welcome'
  | 'visit_reminder'
  | 'weekly_summary'
  | 'policy_update'
  | 'system_notification';

export type EmailStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'complained';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

export interface SendEmailRequest {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  attachments?: EmailAttachment[];
  replyTo?: string;
  type: EmailType;
  metadata?: Record<string, unknown>;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  type: EmailType;
  status: EmailStatus;
  message_id?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  sent_at?: Date;
  bounced_at?: Date;
  complained_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface VisitReportEmailData {
  visit_id: string;
  client_name: string;
  nurse_name: string;
  visit_date: string;
  visit_type: string;
  duration: string;
  notes: string;
  care_activities: string[];
  medications?: string[];
  vital_signs?: Record<string, string>;
}

export interface PasswordResetEmailData {
  user_name: string;
  reset_link: string;
  expiry_hours: number;
}

export interface WelcomeEmailData {
  user_name: string;
  role: string;
  login_link: string;
  support_email: string;
}

export interface WeeklySummaryEmailData {
  user_name: string;
  week_start: string;
  week_end: string;
  total_visits: number;
  completed_visits: number;
  missed_visits: number;
  total_hours: number;
  highlights: string[];
}

export interface SESBounceNotification {
  notificationType: 'Bounce';
  bounce: {
    bounceType: 'Permanent' | 'Transient' | 'Undetermined';
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      status?: string;
      diagnosticCode?: string;
    }>;
    timestamp: string;
  };
  mail: {
    messageId: string;
    timestamp: string;
    source: string;
    destination: string[];
  };
}

export interface SESComplaintNotification {
  notificationType: 'Complaint';
  complaint: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    complaintFeedbackType?: string;
  };
  mail: {
    messageId: string;
    timestamp: string;
    source: string;
    destination: string[];
  };
}

export interface EmailSendResult {
  success: boolean;
  message_id?: string;
  error?: string;
}
