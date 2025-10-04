import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, typography, spacing } from '../theme';
import { Header, Button, Card } from '../components';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  // Mock data - will be replaced with actual data from store
  const stats = {
    todayVisits: 5,
    completedVisits: 2,
    pendingVisits: 3,
  };

  return (
    <View style={styles.container}>
      <Header title="BerthCare" testID="home-header" />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back!</Text>

        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Today's Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.todayVisits}</Text>
              <Text style={styles.statLabel}>Total Visits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.successText]}>{stats.completedVisits}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.warningText]}>{stats.pendingVisits}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </Card>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButton}>
            <Button onPress={() => navigation.navigate('Schedule')}>View Schedule</Button>
          </View>
          <View style={styles.actionButton}>
            <Button
              variant="secondary"
              onPress={() => navigation.navigate('PatientProfile', { patientId: '1' })}
            >
              View Patient Profile
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    ...typography.mobile.h1,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  statsCard: {
    marginBottom: spacing.xl,
  },
  statsTitle: {
    ...typography.mobile.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.mobile.h1,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.mobile.bodySmall,
    color: colors.text.secondary,
  },
  successText: {
    color: colors.success.main,
  },
  warningText: {
    color: colors.warning.main,
  },
  quickActions: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.mobile.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
});

export default HomeScreen;
