import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

export interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const isDisabled = disabled || loading;

  const variantKey = variant === 'text' ? 'textVariant' : variant;

  const containerStyle = [
    styles.base,
    styles[variantKey],
    isDisabled && styles[`${variantKey}Disabled`],
    fullWidth && styles.fullWidth,
  ].filter(Boolean);

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    isDisabled && styles[`${variant}TextDisabled`],
  ].filter(Boolean);

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.background.primary : colors.primary.main}
          accessibilityLabel="Loading"
        />
      ) : (
        <Text style={textStyle}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48, // Android minimum (iOS 44px is smaller)
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: typography.mobile.label.fontSize,
    lineHeight: typography.mobile.label.lineHeight,
    fontWeight: typography.mobile.label.fontWeight,
  },

  // Primary variant
  primary: {
    backgroundColor: colors.primary.main,
  },
  primaryText: {
    color: colors.background.primary,
  },
  primaryDisabled: {
    backgroundColor: colors.text.disabled,
  },
  primaryTextDisabled: {
    color: colors.text.tertiary,
  },

  // Secondary variant
  secondary: {
    backgroundColor: colors.background.primary,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  secondaryText: {
    color: colors.primary.main,
  },
  secondaryDisabled: {
    borderColor: colors.text.disabled,
  },
  secondaryTextDisabled: {
    color: colors.text.disabled,
  },

  // Text variant
  textVariant: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  textText: {
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },
  textVariantDisabled: {
    backgroundColor: 'transparent',
  },
  textTextDisabled: {
    color: colors.text.disabled,
  },
});
