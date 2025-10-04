import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { colors, spacing } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'none' | 'button';
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  testID,
}) => {
  const containerStyle = [styles.card, style].filter(Boolean);

  // If onPress is provided, make it interactive
  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // Otherwise, render as a static container
  return (
    <View
      style={containerStyle}
      accessibilityRole={accessibilityRole || 'none'}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    padding: spacing.md,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 2,
  },
});
