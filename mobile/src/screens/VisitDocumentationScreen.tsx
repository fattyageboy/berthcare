/* eslint-disable no-console */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { colors, typography, spacing } from '../theme';
import { Header, Card, Input, Button } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'VisitDocumentation'>;

const VisitDocumentationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { visitId } = route.params;
  const [notes, setNotes] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');

  const handleSave = () => {
    // Save documentation logic will be implemented
    console.log('Saving documentation for visit:', visitId);
    navigation.navigate('Review', { visitId });
  };

  return (
    <View style={styles.container}>
      <Header title="Visit Documentation" showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Vital Signs</Text>
          <Input
            label="Blood Pressure"
            placeholder="120/80"
            value={bloodPressure}
            onChangeText={setBloodPressure}
            keyboardType="numeric"
          />
          <Input
            label="Heart Rate"
            placeholder="72"
            value={heartRate}
            onChangeText={setHeartRate}
            keyboardType="numeric"
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Activities Completed</Text>
          <Text style={styles.placeholder}>Activity checklist will be implemented</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Input
            label="Observations"
            placeholder="Enter visit notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.placeholder}>Photo capture will be implemented</Text>
        </Card>

        <View style={styles.saveButton}>
          <Button onPress={handleSave}>Continue to Review</Button>
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
  placeholder: {
    ...typography.mobile.body,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});

export default VisitDocumentationScreen;
