import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { colors, typography, spacing } from '../theme';
import { Header, Card } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientProfile'>;

const PatientProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId } = route.params;

  // Mock data - will be replaced with actual data from store
  const patient = {
    id: patientId,
    name: 'John Smith',
    age: 78,
    address: '123 Main St, Calgary, AB',
    diagnosis: 'Type 2 Diabetes, Hypertension',
    allergies: ['Penicillin', 'Sulfa drugs'],
    medications: [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
    ],
  };

  return (
    <View style={styles.container}>
      <Header title="Patient Profile" showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.infoText}>Age: {patient.age}</Text>
          <Text style={styles.infoText}>{patient.address}</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <Text style={styles.label}>Diagnosis:</Text>
          <Text style={styles.infoText}>{patient.diagnosis}</Text>

          <Text style={[styles.label, styles.spacedLabel]}>Allergies:</Text>
          {patient.allergies.map((allergy, index) => (
            <Text key={index} style={styles.allergyText}>
              • {allergy}
            </Text>
          ))}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>
          {patient.medications.map((med, index) => (
            <View key={index} style={styles.medicationItem}>
              <Text style={styles.medicationName}>{med.name}</Text>
              <Text style={styles.infoText}>
                {med.dosage} - {med.frequency}
              </Text>
            </View>
          ))}
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
  patientName: {
    ...typography.mobile.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.mobile.label,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  spacedLabel: {
    marginTop: spacing.md,
  },
  infoText: {
    ...typography.mobile.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  allergyText: {
    ...typography.mobile.body,
    color: colors.error.main,
    marginBottom: spacing.xs,
  },
  medicationItem: {
    marginBottom: spacing.md,
  },
  medicationName: {
    ...typography.mobile.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
});

export default PatientProfileScreen;
