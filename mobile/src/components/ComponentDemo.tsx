/* eslint-disable no-console */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { Button, Input, Card, Header } from './index';
import { colors, spacing, typography } from '../theme';

/**
 * Component Demo Screen
 * Demonstrates usage of all reusable UI components
 */
export const ComponentDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      setHasError(true);
    } else {
      setHasError(false);
      console.log('Form submitted:', inputValue);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Component Library"
        showBackButton
        onBackPress={() => console.log('Back pressed')}
        rightAction={{
          icon: <Text style={styles.iconText}>⋯</Text>,
          onPress: () => console.log('Menu pressed'),
          accessibilityLabel: 'More options',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Buttons Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Buttons</Text>
          <Button onPress={() => console.log('Primary')} fullWidth>
            Primary Button
          </Button>
          <View style={styles.spacer} />
          <Button variant="secondary" onPress={() => console.log('Secondary')} fullWidth>
            Secondary Button
          </Button>
          <View style={styles.spacer} />
          <Button variant="text" onPress={() => console.log('Text')}>
            Text Button
          </Button>
          <View style={styles.spacer} />
          <Button disabled onPress={() => {}} fullWidth>
            Disabled Button
          </Button>
        </Card>

        {/* Input Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Input Fields</Text>
          <Input
            label="Patient Name"
            placeholder="Enter patient name"
            value={inputValue}
            onChangeText={text => {
              setInputValue(text);
              setHasError(false);
            }}
            required
            helperText="Enter the patient's full legal name"
            errorText={hasError ? 'Patient name is required' : undefined}
          />
          <Input
            label="Medical Record Number"
            placeholder="MRN-12345"
            helperText="Optional field"
          />
          <Input label="Disabled Field" value="Cannot edit" disabled />
        </Card>

        {/* Cards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cards</Text>
          <Card style={styles.demoCard}>
            <Text style={styles.cardTitle}>Static Card</Text>
            <Text style={styles.cardText}>This is a static card with no interaction.</Text>
          </Card>
          <View style={styles.spacer} />
          <Card
            style={styles.demoCard}
            onPress={() => console.log('Card pressed')}
            accessibilityLabel="Interactive patient card"
            accessibilityHint="Tap to view patient details"
          >
            <Text style={styles.cardTitle}>Interactive Card</Text>
            <Text style={styles.cardText}>Tap this card to trigger an action.</Text>
          </Card>
        </View>

        {/* Submit Button */}
        <Button onPress={handleSubmit} fullWidth>
          Submit Form
        </Button>
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
  spacer: {
    height: spacing.md,
  },
  demoCard: {
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.mobile.h4.fontSize,
    lineHeight: typography.mobile.h4.lineHeight,
    fontWeight: typography.mobile.h4.fontWeight,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  cardText: {
    fontSize: typography.mobile.body.fontSize,
    lineHeight: typography.mobile.body.lineHeight,
    fontWeight: typography.mobile.body.fontWeight,
    color: colors.text.secondary,
  },
  iconText: {
    fontSize: 24,
    color: colors.background.primary,
  },
});
