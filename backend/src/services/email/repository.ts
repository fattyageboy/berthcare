/**
 * Email Repository
 * Database operations for email logs and bounce tracking
 */

import { Pool } from 'pg';
import { EmailLog, EmailStatus, EmailType } from './types';

export class EmailRepository {
  constructor(private pool: Pool) {}

  /**
   * Create email log entry
   */
  async createEmailLog(log: {
    recipient_email: string;
    recipient_name?: string;
    subject: string;
    type: EmailType;
    status: EmailStatus;
    message_id?: string;
    metadata?: Record<string, any>;
  }): Promise<EmailLog> {
    const query = `
      INSERT INTO email_logs (
        recipient_email, recipient_name, subject, type, status, message_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      log.recipient_email,
      log.recipient_name || null,
      log.subject,
      log.type,
      log.status,
      log.message_id || null,
      log.metadata ? JSON.stringify(log.metadata) : null,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update email log status
   */
  async updateEmailStatus(
    messageId: string,
    status: EmailStatus,
    errorMessage?: string
  ): Promise<void> {
    const query = `
      UPDATE email_logs
      SET status = $1,
          sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END,
          bounced_at = CASE WHEN $1 = 'bounced' THEN NOW() ELSE bounced_at END,
          complained_at = CASE WHEN $1 = 'complained' THEN NOW() ELSE complained_at END,
          error_message = $2,
          updated_at = NOW()
      WHERE message_id = $3
    `;

    await this.pool.query(query, [status, errorMessage || null, messageId]);
  }

  /**
   * Get email logs for a recipient
   */
  async getEmailLogsByRecipient(
    email: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<EmailLog[]> {
    const query = `
      SELECT * FROM email_logs
      WHERE recipient_email = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [email, limit, offset]);
    return result.rows;
  }

  /**
   * Get email logs by type
   */
  async getEmailLogsByType(
    type: EmailType,
    limit: number = 50,
    offset: number = 0
  ): Promise<EmailLog[]> {
    const query = `
      SELECT * FROM email_logs
      WHERE type = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [type, limit, offset]);
    return result.rows;
  }

  /**
   * Check if email is suppressed (bounced)
   */
  async isEmailSuppressed(email: string): Promise<boolean> {
    const query = `
      SELECT is_suppressed FROM email_bounces
      WHERE email = $1
    `;

    const result = await this.pool.query(query, [email]);
    return result.rows.length > 0 && result.rows[0].is_suppressed;
  }

  /**
   * Record email bounce
   */
  async recordBounce(
    email: string,
    bounceType: string,
    bounceSubtype?: string,
    diagnosticCode?: string
  ): Promise<void> {
    const query = `
      INSERT INTO email_bounces (
        email, bounce_type, bounce_subtype, diagnostic_code, bounce_count, is_suppressed
      )
      VALUES ($1, $2, $3, $4, 1, $5)
      ON CONFLICT (email)
      DO UPDATE SET
        bounce_type = EXCLUDED.bounce_type,
        bounce_subtype = EXCLUDED.bounce_subtype,
        diagnostic_code = EXCLUDED.diagnostic_code,
        bounce_count = email_bounces.bounce_count + 1,
        is_suppressed = CASE 
          WHEN EXCLUDED.bounce_type = 'Permanent' THEN true
          WHEN email_bounces.bounce_count >= 3 THEN true
          ELSE email_bounces.is_suppressed
        END,
        last_bounced_at = NOW(),
        updated_at = NOW()
    `;

    const isPermanent = bounceType === 'Permanent';
    const values = [email, bounceType, bounceSubtype || null, diagnosticCode || null, isPermanent];

    await this.pool.query(query, values);
  }

  /**
   * Record email complaint
   */
  async recordComplaint(email: string): Promise<void> {
    const query = `
      INSERT INTO email_bounces (
        email, bounce_type, bounce_subtype, bounce_count, is_suppressed
      )
      VALUES ($1, 'Complaint', 'spam', 1, true)
      ON CONFLICT (email)
      DO UPDATE SET
        bounce_type = 'Complaint',
        bounce_subtype = 'spam',
        is_suppressed = true,
        bounce_count = email_bounces.bounce_count + 1,
        last_bounced_at = NOW(),
        updated_at = NOW()
    `;

    await this.pool.query(query, [email]);
  }

  /**
   * Get bounce statistics
   */
  async getBounceStats(): Promise<{
    total_bounces: number;
    permanent_bounces: number;
    transient_bounces: number;
    suppressed_emails: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total_bounces,
        COUNT(*) FILTER (WHERE bounce_type = 'Permanent') as permanent_bounces,
        COUNT(*) FILTER (WHERE bounce_type = 'Transient') as transient_bounces,
        COUNT(*) FILTER (WHERE is_suppressed = true) as suppressed_emails
      FROM email_bounces
    `;

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  /**
   * Delete old email logs (cleanup)
   */
  async deleteOldEmailLogs(daysOld: number = 90): Promise<number> {
    const query = `
      DELETE FROM email_logs
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      AND status IN ('sent', 'bounced', 'complained')
    `;

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  /**
   * Get email delivery statistics
   */
  async getDeliveryStats(startDate?: Date, endDate?: Date): Promise<{
    total_sent: number;
    successful: number;
    failed: number;
    bounced: number;
    complained: number;
    success_rate: number;
  }> {
    let query = `
      SELECT
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status = 'sent') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
        COUNT(*) FILTER (WHERE status = 'complained') as complained
      FROM email_logs
      WHERE 1=1
    `;

    const values: any[] = [];
    if (startDate) {
      values.push(startDate);
      query += ` AND created_at >= $${values.length}`;
    }
    if (endDate) {
      values.push(endDate);
      query += ` AND created_at <= $${values.length}`;
    }

    const result = await this.pool.query(query, values);
    const stats = result.rows[0];

    const successRate = stats.total_sent > 0
      ? Math.round((stats.successful / stats.total_sent) * 100)
      : 0;

    return {
      ...stats,
      success_rate: successRate,
    };
  }
}
