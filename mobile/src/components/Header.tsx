import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { colors, typography, spacing } from '../theme';

export interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
    accessibilityLabel: string;
    accessibilityHint?: string;
  };
  // Accessibility props
  accessibilityLabel?: string;
  testID?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightAction,
  accessibilityLabel,
  testID,
}) => {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.content}>
        {/* Left side - Back button or spacer */}
        <View style={styles.leftSection}>
          {showBackButton && onBackPress ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onBackPress}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              accessibilityHint="Navigate to previous screen"
              testID={`${testID}-back-button`}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>

        {/* Center - Title */}
        <View style={styles.centerSection}>
          <Text
            style={styles.title}
            numberOfLines={1}
            accessibilityRole="header"
            accessibilityLabel={accessibilityLabel || title}
          >
            {title}
          </Text>
        </View>

        {/* Right side - Action button or spacer */}
        <View style={styles.rightSection}>
          {rightAction ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={rightAction.onPress}
              accessibilityRole="button"
              accessibilityLabel={rightAction.accessibilityLabel}
              accessibilityHint={rightAction.accessibilityHint}
              testID={`${testID}-right-action`}
            >
              {rightAction.icon}
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary.main,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  leftSection: {
    width: 44,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  rightSection: {
    width: 44,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.background.primary,
    fontWeight: typography.mobile.h3.fontWeight,
  },
  title: {
    fontSize: typography.mobile.h4.fontSize,
    lineHeight: typography.mobile.h4.lineHeight,
    fontWeight: typography.mobile.h4.fontWeight,
    color: colors.background.primary,
  },
});
