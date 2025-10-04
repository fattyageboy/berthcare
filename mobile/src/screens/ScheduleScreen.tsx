import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation';
import { colors, typography, spacing } from '../theme';
import { Header, Card } from '../components';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Schedule'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ScheduleScreen: React.FC<Props> = ({ navigation }) => {
  // Mock data - will be replaced with actual data from store
  const visits = [
    {
      id: '1',
      clientName: 'John Smith',
      time: '09:00 - 10:00',
      address: '123 Main St',
      type: 'Personal Care',
    },
    {
      id: '2',
      clientName: 'Mary Johnson',
      time: '10:30 - 11:30',
      address: '456 Oak Ave',
      type: 'Medication',
    },
  ];

  const renderVisitCard = ({ item }: { item: (typeof visits)[0] }) => (
    <Card
      style={styles.visitCard}
      onPress={() => navigation.navigate('VisitDocumentation', { visitId: item.id })}
    >
      <Text style={styles.clientName}>{item.clientName}</Text>
      <Text style={styles.visitTime}>{item.time}</Text>
      <Text style={styles.visitType}>{item.type}</Text>
      <Text style={styles.address}>{item.address}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="Schedule" />
      <FlatList
        data={visits}
        renderItem={renderVisitCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  listContent: {
    padding: spacing.md,
  },
  visitCard: {
    marginBottom: spacing.md,
  },
  clientName: {
    ...typography.mobile.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  visitTime: {
    ...typography.mobile.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  visitType: {
    ...typography.mobile.label,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  address: {
    ...typography.mobile.bodySmall,
    color: colors.text.tertiary,
  },
});

export default ScheduleScreen;
