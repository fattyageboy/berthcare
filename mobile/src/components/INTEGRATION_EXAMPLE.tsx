/* eslint-disable no-console, @typescript-eslint/no-unused-vars */
/**
 * Integration Example
 *
 * This file demonstrates how to integrate the component library
 * into a real screen with form validation and state management.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Alert } from 'react-native';
import { Button, Input, Card, Header } from './index';
import { colors, spacing, typography } from '../theme';

interface PatientFormData {
  name: string;
  mrn: string;
  bloodPressure: string;
  temperature: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  mrn?: string;
  bloodPressure?: string;
  temperature?: string;
}

export const PatientFormExample: React.FC = () => {
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    mrn: '',
    bloodPressure: '',
    temperature: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Patient name is required';
    }

    // Validate MRN
    if (!formData.mrn.trim()) {
      newErrors.mrn = 'Medical record number is required';
    }

    // Validate blood pressure format
    if (formData.bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(formData.bloodPressure)) {
      newErrors.bloodPressure = 'Enter as systolic/diastolic (e.g., 120/80)';
    }

    // Validate temperature range
    if (formData.temperature) {
      const temp = parseFloat(formData.temperature);
      if (isNaN(temp) || temp < 95 || temp > 110) {
        newErrors.temperature = 'Temperature must be between 95°F and 110°F';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));

      Alert.alert('Success', 'Patient information saved successfully', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save patient information');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mrn: '',
      bloodPressure: '',
      temperature: '',
      notes: '',
    });
    setErrors({});
  };

  const updateField = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Patient Information"
        showBackButton
        onBackPress={() => console.log('Navigate back')}
        rightAction={{
          icon: <Text style={styles.helpIcon}>?</Text>,
          onPress: () => Alert.alert('Help', 'Fill in patient information'),
          accessibilityLabel: 'Help',
          accessibilityHint: 'Get help with this form',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Patient Demographics Card */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Demographics</Text>

          <Input
            label="Patient Name"
            placeholder="Enter full legal name"
            value={formData.name}
            onChangeText={value => updateField('name', value)}
            required
            errorText={errors.name}
            accessibilityLabel="Patient name input"
            testID="patient-name-input"
          />

          <Input
            label="Medical Record Number"
            placeholder="MRN-12345"
            value={formData.mrn}
            onChangeText={value => updateField('mrn', value)}
            required
            helperText="Enter the patient's MRN from their chart"
            errorText={errors.mrn}
            accessibilityLabel="Medical record number input"
            testID="mrn-input"
          />
        </Card>

        {/* Vital Signs Card */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Vital Signs</Text>

          <Input
            label="Blood Pressure"
            placeholder="120/80"
            value={formData.bloodPressure}
            onChangeText={value => updateField('bloodPressure', value)}
            keyboardType="numeric"
            helperText="Enter as systolic/diastolic (e.g., 120/80)"
            errorText={errors.bloodPressure}
            accessibilityLabel="Blood pressure input"
            testID="blood-pressure-input"
          />

          <Input
            label="Temperature"
            placeholder="98.6"
            value={formData.temperature}
            onChangeText={value => updateField('temperature', value)}
            keyboardType="decimal-pad"
            helperText="Normal range: 97.0°F - 99.5°F"
            errorText={errors.temperature}
            accessibilityLabel="Temperature input"
            testID="temperature-input"
          />
        </Card>

        {/* Notes Card */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>

          <Input
            label="Clinical Notes"
            placeholder="Enter any additional observations..."
            value={formData.notes}
            onChangeText={value => updateField('notes', value)}
            multiline
            numberOfLines={4}
            helperText="Optional field for additional observations"
            accessibilityLabel="Clinical notes input"
            testID="notes-input"
          />
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <Button
            variant="secondary"
            onPress={resetForm}
            disabled={isSubmitting}
            accessibilityLabel="Clear form"
            accessibilityHint="Reset all fields to empty"
            testID="clear-button"
          >
            Clear
          </Button>

          <Button
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            accessibilityLabel="Submit patient information"
            accessibilityHint="Save patient information to the system"
            testID="submit-button"
          >
            {isSubmitting ? 'Saving...' : 'Submit'}
          </Button>
        </View>

        {/* Info Card */}
        <Card
          style={styles.infoCard}
          onPress={() => Alert.alert('Info', 'All fields marked with * are required')}
          accessibilityLabel="Form information"
          accessibilityHint="Tap for more information about this form"
        >
          <Text style={styles.infoText}>
            ℹ️ All fields marked with * are required. Tap for more info.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.mobile.h3.fontSize,
    lineHeight: typography.mobile.h3.lineHeight,
    fontWeight: typography.mobile.h3.fontWeight,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.semantic.info + '20', // 20% opacity
    borderColor: colors.semantic.info,
  },
  infoText: {
    fontSize: typography.mobile.body.fontSize,
    lineHeight: typography.mobile.body.lineHeight,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  helpIcon: {
    fontSize: 24,
    color: colors.background.primary,
    fontWeight: typography.mobile.h3.fontWeight,
  },
});

// Export for use in navigation or testing
export default PatientFormExample;
