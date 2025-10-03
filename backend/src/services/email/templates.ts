/**
 * Email Templates
 * HTML email templates for various notification types
 */

import {
  VisitReportEmailData,
  PasswordResetEmailData,
  WelcomeEmailData,
  WeeklySummaryEmailData,
} from './types';

/**
 * Base email template with BerthCare branding
 */
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BerthCare</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #0066cc;
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #0066cc;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      background-color: #0052a3;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin: 20px 0;
    }
    .warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e9ecef;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚢 BerthCare</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} BerthCare. All rights reserved.</p>
      <p>Maritime Nursing Care Documentation System</p>
      <p>If you have questions, contact us at support@berthcare.com</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Visit Report Email Template
 */
export function visitReportTemplate(data: VisitReportEmailData): { subject: string; html: string; text: string } {
  const content = `
    <h2>Visit Report: ${data.client_name}</h2>
    <p>A care visit has been completed. Here are the details:</p>
    
    <div class="info-box">
      <table>
        <tr>
          <th>Client:</th>
          <td>${data.client_name}</td>
        </tr>
        <tr>
          <th>Nurse:</th>
          <td>${data.nurse_name}</td>
        </tr>
        <tr>
          <th>Date:</th>
          <td>${data.visit_date}</td>
        </tr>
        <tr>
          <th>Visit Type:</th>
          <td>${data.visit_type}</td>
        </tr>
        <tr>
          <th>Duration:</th>
          <td>${data.duration}</td>
        </tr>
      </table>
    </div>

    <h3>Care Activities</h3>
    <ul>
      ${data.care_activities.map(activity => `<li>${activity}</li>`).join('')}
    </ul>

    ${data.medications && data.medications.length > 0 ? `
      <h3>Medications Administered</h3>
      <ul>
        ${data.medications.map(med => `<li>${med}</li>`).join('')}
      </ul>
    ` : ''}

    ${data.vital_signs ? `
      <h3>Vital Signs</h3>
      <table>
        ${Object.entries(data.vital_signs).map(([key, value]) => `
          <tr>
            <th>${key}:</th>
            <td>${value}</td>
          </tr>
        `).join('')}
      </table>
    ` : ''}

    <h3>Notes</h3>
    <p>${data.notes}</p>

    <p style="margin-top: 30px;">
      <a href="${process.env.APP_URL}/visits/${data.visit_id}" class="button">View Full Report</a>
    </p>
  `;

  const text = `
Visit Report: ${data.client_name}

Client: ${data.client_name}
Nurse: ${data.nurse_name}
Date: ${data.visit_date}
Visit Type: ${data.visit_type}
Duration: ${data.duration}

Care Activities:
${data.care_activities.map(a => `- ${a}`).join('\n')}

${data.medications ? `Medications:\n${data.medications.map(m => `- ${m}`).join('\n')}\n` : ''}

Notes: ${data.notes}

View full report: ${process.env.APP_URL}/visits/${data.visit_id}
  `.trim();

  return {
    subject: `Visit Report: ${data.client_name} - ${data.visit_date}`,
    html: baseTemplate(content),
    text,
  };
}

/**
 * Password Reset Email Template
 */
export function passwordResetTemplate(data: PasswordResetEmailData): { subject: string; html: string; text: string } {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${data.user_name},</p>
    <p>We received a request to reset your password for your BerthCare account.</p>
    
    <p style="text-align: center;">
      <a href="${data.reset_link}" class="button">Reset Password</a>
    </p>

    <div class="warning-box">
      <p><strong>Important:</strong></p>
      <ul>
        <li>This link will expire in ${data.expiry_hours} hours</li>
        <li>If you didn't request this reset, please ignore this email</li>
        <li>Never share this link with anyone</li>
      </ul>
    </div>

    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${data.reset_link}</p>
  `;

  const text = `
Password Reset Request

Hello ${data.user_name},

We received a request to reset your password for your BerthCare account.

Reset your password: ${data.reset_link}

This link will expire in ${data.expiry_hours} hours.

If you didn't request this reset, please ignore this email.

Never share this link with anyone.
  `.trim();

  return {
    subject: 'Reset Your BerthCare Password',
    html: baseTemplate(content),
    text,
  };
}

/**
 * Welcome Email Template
 */
export function welcomeTemplate(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const content = `
    <h2>Welcome to BerthCare! 🎉</h2>
    <p>Hello ${data.user_name},</p>
    <p>Welcome to BerthCare, the maritime nursing care documentation system. Your account has been created with the role of <strong>${data.role}</strong>.</p>
    
    <div class="info-box">
      <h3>Getting Started</h3>
      <ul>
        <li>Log in to your account using the button below</li>
        <li>Complete your profile information</li>
        <li>Familiarize yourself with the dashboard</li>
        <li>Review the user guide and training materials</li>
      </ul>
    </div>

    <p style="text-align: center;">
      <a href="${data.login_link}" class="button">Log In to BerthCare</a>
    </p>

    <h3>Need Help?</h3>
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:${data.support_email}">${data.support_email}</a>.</p>

    <p>We're excited to have you on board!</p>
  `;

  const text = `
Welcome to BerthCare!

Hello ${data.user_name},

Welcome to BerthCare, the maritime nursing care documentation system. Your account has been created with the role of ${data.role}.

Getting Started:
- Log in to your account: ${data.login_link}
- Complete your profile information
- Familiarize yourself with the dashboard
- Review the user guide and training materials

Need Help?
Contact our support team at ${data.support_email}

We're excited to have you on board!
  `.trim();

  return {
    subject: 'Welcome to BerthCare!',
    html: baseTemplate(content),
    text,
  };
}

/**
 * Weekly Summary Email Template
 */
export function weeklySummaryTemplate(data: WeeklySummaryEmailData): { subject: string; html: string; text: string } {
  const completionRate = data.total_visits > 0 
    ? Math.round((data.completed_visits / data.total_visits) * 100) 
    : 0;

  const content = `
    <h2>Your Weekly Summary</h2>
    <p>Hello ${data.user_name},</p>
    <p>Here's a summary of your activities from ${data.week_start} to ${data.week_end}.</p>
    
    <div class="info-box">
      <h3>Visit Statistics</h3>
      <table>
        <tr>
          <th>Total Visits:</th>
          <td>${data.total_visits}</td>
        </tr>
        <tr>
          <th>Completed:</th>
          <td>${data.completed_visits}</td>
        </tr>
        <tr>
          <th>Missed:</th>
          <td>${data.missed_visits}</td>
        </tr>
        <tr>
          <th>Completion Rate:</th>
          <td>${completionRate}%</td>
        </tr>
        <tr>
          <th>Total Hours:</th>
          <td>${data.total_hours}</td>
        </tr>
      </table>
    </div>

    ${data.highlights.length > 0 ? `
      <h3>Highlights</h3>
      <ul>
        ${data.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
      </ul>
    ` : ''}

    <p style="text-align: center; margin-top: 30px;">
      <a href="${process.env.APP_URL}/dashboard" class="button">View Dashboard</a>
    </p>

    <p>Keep up the great work!</p>
  `;

  const text = `
Your Weekly Summary

Hello ${data.user_name},

Here's a summary of your activities from ${data.week_start} to ${data.week_end}.

Visit Statistics:
- Total Visits: ${data.total_visits}
- Completed: ${data.completed_visits}
- Missed: ${data.missed_visits}
- Completion Rate: ${completionRate}%
- Total Hours: ${data.total_hours}

${data.highlights.length > 0 ? `Highlights:\n${data.highlights.map(h => `- ${h}`).join('\n')}\n` : ''}

View Dashboard: ${process.env.APP_URL}/dashboard

Keep up the great work!
  `.trim();

  return {
    subject: `Your Weekly Summary: ${data.week_start} - ${data.week_end}`,
    html: baseTemplate(content),
    text,
  };
}
