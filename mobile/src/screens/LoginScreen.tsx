// Login screen - authentication
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

const LoginScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BerthCare</Text>
      <Text style={styles.subtitle}>Please log in to continue</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  title: {
    ...typography.mobile.h1,
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.mobile.body,
    color: colors.text.secondary,
  },
});

export default LoginScreen;
