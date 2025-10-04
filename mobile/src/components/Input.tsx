import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors, typography, spacing } from '../theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  required = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = !!errorText;

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.inputFocused,
    hasError && styles.inputError,
    disabled && styles.inputDisabled,
  ].filter(Boolean);

  const inputId = testID || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && (
            <Text style={styles.required} accessibilityLabel="required">
              {' '}
              *
            </Text>
          )}
        </Text>
      )}

      <View style={inputContainerStyle}>
        <TextInput
          {...textInputProps}
          style={[styles.input, disabled && styles.inputTextDisabled]}
          editable={!disabled}
          onFocus={e => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          placeholderTextColor={colors.text.disabled}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint || helperText}
          accessibilityState={{ disabled }}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          testID={inputId}
        />
      </View>

      {helperText && !hasError && (
        <Text style={styles.helperText} nativeID={helperId} accessibilityRole="text">
          {helperText}
        </Text>
      )}

      {hasError && (
        <Text
          style={styles.errorText}
          nativeID={errorId}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {errorText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.mobile.label.fontSize,
    lineHeight: typography.mobile.label.lineHeight,
    fontWeight: typography.mobile.label.fontWeight,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error.main,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: 6,
    backgroundColor: colors.background.primary,
    minHeight: 44, // iOS minimum touch target
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  inputError: {
    borderWidth: 2,
    borderColor: colors.error.main,
  },
  inputDisabled: {
    backgroundColor: colors.background.tertiary,
    borderColor: colors.background.border,
  },
  input: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.mobile.body.fontSize,
    lineHeight: typography.mobile.body.lineHeight,
    fontWeight: typography.mobile.body.fontWeight,
    color: colors.text.primary,
  },
  inputTextDisabled: {
    color: colors.text.disabled,
  },
  helperText: {
    fontSize: typography.mobile.bodySmall.fontSize,
    lineHeight: typography.mobile.bodySmall.lineHeight,
    fontWeight: typography.mobile.bodySmall.fontWeight,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.mobile.bodySmall.fontSize,
    lineHeight: typography.mobile.bodySmall.lineHeight,
    fontWeight: typography.mobile.bodySmall.fontWeight,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
});
