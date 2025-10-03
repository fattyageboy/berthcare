/**
 * Email Templates Unit Tests
 * Tests for email template rendering
 */

import {
  visitReportTemplate,
  passwordResetTemplate,
  welcomeTemplate,
  weeklySummaryTemplate,
} from '../../../src/services/email/templates';

describe('Email Templates', () => {
  describe('visitReportTemplate', () => {
    const mockData = {
      visit_id: 'visit-123',
      client_name: 'John Smith',
      nurse_name: 'Mary Johnson',
      visit_date: 'October 3, 2025',
      visit_type: 'Personal Care',
      duration: '2 hours',
      notes: 'Visit completed successfully',
      care_activities: ['Assisted with bathing', 'Medication administration'],
      medications: ['Aspirin 81mg'],
      vital_signs: {
        'Blood Pressure': '120/80 mmHg',
        'Heart Rate': '72 bpm',
      },
    };

    it('should generate visit report email', () => {
      const result = visitReportTemplate(mockData);

      expect(result.subject).toContain('Visit Report');
      expect(result.subject).toContain('John Smith');
      expect(result.html).toContain('John Smith');
      expect(result.html).toContain('Mary Johnson');
      expect(result.html).toContain('Personal Care');
      expect(result.text).toContain('John Smith');
    });

    it('should include care activities', () => {
      const result = visitReportTemplate(mockData);

      expect(result.html).toContain('Assisted with bathing');
      expect(result.html).toContain('Medication administration');
    });

    it('should include medications if provided', () => {
      const result = visitReportTemplate(mockData);

      expect(result.html).toContain('Medications Administered');
      expect(result.html).toContain('Aspirin 81mg');
    });

    it('should include vital signs if provided', () => {
      const result = visitReportTemplate(mockData);

      expect(result.html).toContain('Vital Signs');
      expect(result.html).toContain('120/80 mmHg');
      expect(result.html).toContain('72 bpm');
    });

    it('should omit medications section if not provided', () => {
      const dataWithoutMeds = { ...mockData, medications: undefined };
      const result = visitReportTemplate(dataWithoutMeds);

      expect(result.html).not.toContain('Medications Administered');
    });

    it('should omit vital signs section if not provided', () => {
      const dataWithoutVitals = { ...mockData, vital_signs: undefined };
      const result = visitReportTemplate(dataWithoutVitals);

      expect(result.html).not.toContain('Vital Signs');
    });

    it('should include plain text version', () => {
      const result = visitReportTemplate(mockData);

      expect(result.text).toContain('Visit Report');
      expect(result.text).toContain('Client: John Smith');
      expect(result.text).toContain('Nurse: Mary Johnson');
    });
  });

  describe('passwordResetTemplate', () => {
    const mockData = {
      user_name: 'John Doe',
      reset_link: 'https://app.berthcare.com/reset?token=abc123',
      expiry_hours: 24,
    };

    it('should generate password reset email', () => {
      const result = passwordResetTemplate(mockData);

      expect(result.subject).toBe('Reset Your BerthCare Password');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain(mockData.reset_link);
      expect(result.html).toContain('24 hours');
    });

    it('should include security warnings', () => {
      const result = passwordResetTemplate(mockData);

      expect(result.html).toContain('Important');
      expect(result.html).toContain('expire');
      expect(result.html).toContain("didn't request");
    });

    it('should include plain text version', () => {
      const result = passwordResetTemplate(mockData);

      expect(result.text).toContain('Password Reset Request');
      expect(result.text).toContain(mockData.reset_link);
      expect(result.text).toContain('24 hours');
    });

    it('should handle different expiry times', () => {
      const data = { ...mockData, expiry_hours: 48 };
      const result = passwordResetTemplate(data);

      expect(result.html).toContain('48 hours');
    });
  });

  describe('welcomeTemplate', () => {
    const mockData = {
      user_name: 'New User',
      role: 'Registered Nurse',
      login_link: 'https://app.berthcare.com/login',
      support_email: 'support@berthcare.com',
    };

    it('should generate welcome email', () => {
      const result = welcomeTemplate(mockData);

      expect(result.subject).toBe('Welcome to BerthCare!');
      expect(result.html).toContain('New User');
      expect(result.html).toContain('Registered Nurse');
      expect(result.html).toContain(mockData.login_link);
    });

    it('should include getting started checklist', () => {
      const result = welcomeTemplate(mockData);

      expect(result.html).toContain('Getting Started');
      expect(result.html).toContain('Log in to your account');
      expect(result.html).toContain('Complete your profile');
    });

    it('should include support contact', () => {
      const result = welcomeTemplate(mockData);

      expect(result.html).toContain('support@berthcare.com');
      expect(result.html).toContain('Need Help');
    });

    it('should include plain text version', () => {
      const result = welcomeTemplate(mockData);

      expect(result.text).toContain('Welcome to BerthCare');
      expect(result.text).toContain('New User');
      expect(result.text).toContain('Registered Nurse');
    });
  });

  describe('weeklySummaryTemplate', () => {
    const mockData = {
      user_name: 'Mary Johnson',
      week_start: 'September 27, 2025',
      week_end: 'October 3, 2025',
      total_visits: 25,
      completed_visits: 23,
      missed_visits: 2,
      total_hours: 50,
      highlights: ['Completed all visits on time', 'Received positive feedback'],
    };

    it('should generate weekly summary email', () => {
      const result = weeklySummaryTemplate(mockData);

      expect(result.subject).toContain('Your Weekly Summary');
      expect(result.subject).toContain('September 27, 2025');
      expect(result.html).toContain('Mary Johnson');
      expect(result.html).toContain('25');
      expect(result.html).toContain('23');
    });

    it('should calculate completion rate', () => {
      const result = weeklySummaryTemplate(mockData);

      expect(result.html).toContain('92%'); // 23/25 = 92%
    });

    it('should handle 100% completion rate', () => {
      const data = {
        ...mockData,
        total_visits: 20,
        completed_visits: 20,
        missed_visits: 0,
      };
      const result = weeklySummaryTemplate(data);

      expect(result.html).toContain('100%');
    });

    it('should handle zero visits', () => {
      const data = {
        ...mockData,
        total_visits: 0,
        completed_visits: 0,
        missed_visits: 0,
      };
      const result = weeklySummaryTemplate(data);

      expect(result.html).toContain('0%');
    });

    it('should include highlights if provided', () => {
      const result = weeklySummaryTemplate(mockData);

      expect(result.html).toContain('Highlights');
      expect(result.html).toContain('Completed all visits on time');
      expect(result.html).toContain('Received positive feedback');
    });

    it('should omit highlights section if empty', () => {
      const dataWithoutHighlights = { ...mockData, highlights: [] };
      const result = weeklySummaryTemplate(dataWithoutHighlights);

      expect(result.html).not.toContain('Highlights');
    });

    it('should include plain text version', () => {
      const result = weeklySummaryTemplate(mockData);

      expect(result.text).toContain('Your Weekly Summary');
      expect(result.text).toContain('Total Visits: 25');
      expect(result.text).toContain('Completed: 23');
    });
  });

  describe('Template Common Features', () => {
    it('should include BerthCare branding in all templates', () => {
      const visitReport = visitReportTemplate({
        visit_id: 'v1',
        client_name: 'Client',
        nurse_name: 'Nurse',
        visit_date: 'Date',
        visit_type: 'Type',
        duration: '1h',
        notes: 'Notes',
        care_activities: [],
      });

      expect(visitReport.html).toContain('BerthCare');
      expect(visitReport.html).toContain('🚢');
    });

    it('should include footer in all templates', () => {
      const passwordReset = passwordResetTemplate({
        user_name: 'User',
        reset_link: 'https://example.com',
        expiry_hours: 24,
      });

      expect(passwordReset.html).toContain('© 2025 BerthCare');
      expect(passwordReset.html).toContain('Maritime Nursing Care');
    });

    it('should be responsive (mobile-friendly)', () => {
      const welcome = welcomeTemplate({
        user_name: 'User',
        role: 'Nurse',
        login_link: 'https://example.com',
        support_email: 'support@example.com',
      });

      expect(welcome.html).toContain('max-width: 600px');
      expect(welcome.html).toContain('viewport');
    });
  });
});
