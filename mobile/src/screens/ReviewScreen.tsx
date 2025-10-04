/* eslint-disable no-console */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { colors, typography, spacing } from '../theme';
import { Header, Card, Button } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

const ReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { visitId } = route.params;

  // Mock data - will be replaced with actual data from store
  const visitData = {
    clientName: 'John Smith',
    date: 'January 15, 2024',
    time: '09:00 - 10:00',
    vitalSigns: {
      bloodPressure: '120/80',
      heartRate: '72',
    },
    activities: ['Personal hygiene', 'Medication administration'],
    notes: 'Client in good spirits, no concerns noted.',
  };

  const handleSubmit = () => {
    Alert.alert('Submit Visit', 'Are you sure you want to submit this visit documentation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: () => {
          // Submit logic will be implemented
          console.log('Submitting visit:', visitId);
          navigation.navigate('MainTabs', { screen: 'Schedule' });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Review & Submit" showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Visit Information</Text>
          <Text style={styles.clientName}>{visitData.clientName}</Text>
          <Text style={styles.infoText}>{visitData.date}</Text>
          <Text style={styles.infoText}>{visitData.time}</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Vital Signs</Text>
          <View style={styles.vitalRow}>
            <Text style={styles.label}>Blood Pressure:</Text>
            <Text style={styles.value}>{visitData.vitalSigns.bloodPressure}</Text>
          </View>
          <View style={styles.vitalRow}>
            <Text style={styles.label}>Heart Rate:</Text>
            <Text style={styles.value}>{visitData.vitalSigns.heartRate} bpm</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Activities Completed</Text>
          {visitData.activities.map((activity, index) => (
            <Text key={index} style={styles.activityText}>
              ✓ {activity}
            </Text>
          ))}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{visitData.notes}</Text>
        </Card>

        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <Button variant="secondary" onPress={() => navigation.goBack()}>
              Edit
            </Button>
          </View>
          <View style={styles.button}>
            <Button onPress={handleSubmit}>Submit Visit</Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.mobile.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  clientName: {
    ...typography.mobile.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.mobile.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  vitalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.mobile.label,
    color: colors.text.secondary,
  },
  value: {
    ...typography.mobile.body,
    color: colors.text.primary,
  },
  activityText: {
    ...typography.mobile.body,
    color: colors.success.main,
    marginBottom: spacing.xs,
  },
  notesText: {
    ...typography.mobile.body,
    color: colors.text.secondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  button: {
    flex: 1,
  },
});

export default ReviewScreen;
