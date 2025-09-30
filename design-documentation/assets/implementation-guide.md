# BerthCare Design System Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing the BerthCare design system across mobile and web platforms. It includes code examples, development handoff specifications, and quality assurance guidelines.

## Development Handoff Specifications

### Design Token Implementation

#### CSS Custom Properties
```css
:root {
  /* Colors */
  --primary-blue: #1B4F72;
  --primary-blue-hover: #2E6B9E;
  --primary-blue-light: #5499C7;

  --clinical-green: #239B56;
  --clinical-green-hover: #2ECC71;
  --clinical-green-light: #82E5AA;

  --medical-red: #CB4335;
  --medical-red-hover: #E74C3C;
  --medical-red-light: #F1948A;

  --healthcare-orange: #DC7633;
  --healthcare-orange-hover: #F39C12;
  --healthcare-orange-light: #F8C471;

  /* Text Colors */
  --text-primary: #212529;
  --text-secondary: #495057;
  --text-muted: #6C757D;
  --text-disabled: #ADB5BD;

  /* Background Colors */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F9FA;
  --bg-subtle: #E9ECEF;
  --bg-border: #DEE2E6;

  /* Semantic Colors */
  --semantic-critical: #FF6B6B;
  --semantic-normal: #4ECDC4;
  --semantic-info: #45B7D1;
  --semantic-medication: #96CEB4;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  --spacing-xxxl: 64px;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Mobile Typography */
  --font-size-h1-mobile: 28px;
  --line-height-h1-mobile: 34px;
  --font-size-h2-mobile: 24px;
  --line-height-h2-mobile: 30px;
  --font-size-h3-mobile: 20px;
  --line-height-h3-mobile: 26px;
  --font-size-body-mobile: 14px;
  --line-height-body-mobile: 20px;
  --font-size-body-large-mobile: 16px;
  --line-height-body-large-mobile: 24px;

  /* Desktop Typography */
  --font-size-h1-desktop: 32px;
  --line-height-h1-desktop: 40px;
  --font-size-h2-desktop: 28px;
  --line-height-h2-desktop: 36px;
  --font-size-h3-desktop: 24px;
  --line-height-h3-desktop: 32px;
  --font-size-body-desktop: 16px;
  --line-height-body-desktop: 24px;
  --font-size-body-large-desktop: 18px;
  --line-height-body-large-desktop: 28px;

  /* Border Radius */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  /* Shadows */
  --shadow-sm: 0px 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0px 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0px 4px 16px rgba(0, 0, 0, 0.15);

  /* Animation */
  --animation-fast: 150ms;
  --animation-standard: 250ms;
  --animation-slow: 400ms;
  --animation-extra-slow: 600ms;

  --easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
  --easing-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
  --easing-sharp: cubic-bezier(0.4, 0.0, 0.6, 1);
}

/* Dark Mode Variables (if applicable) */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #e0e0e0;
    /* Adjust other colors for dark mode */
  }
}
```

#### React Native StyleSheet
```javascript
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export const colors = {
  primary: {
    blue: '#1B4F72',
    blueHover: '#2E6B9E',
    blueLight: '#5499C7',
  },
  clinical: {
    green: '#239B56',
    greenHover: '#2ECC71',
    greenLight: '#82E5AA',
  },
  medical: {
    red: '#CB4335',
    redHover: '#E74C3C',
    redLight: '#F1948A',
  },
  healthcare: {
    orange: '#DC7633',
    orangeHover: '#F39C12',
    orangeLight: '#F8C471',
  },
  text: {
    primary: '#212529',
    secondary: '#495057',
    muted: '#6C757D',
    disabled: '#ADB5BD',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    subtle: '#E9ECEF',
    border: '#DEE2E6',
  },
  semantic: {
    critical: '#FF6B6B',
    normal: '#4ECDC4',
    info: '#45B7D1',
    medication: '#96CEB4',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const typography = {
  fontFamily: 'System',
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  sizes: {
    h1: isTablet ? 32 : 28,
    h2: isTablet ? 28 : 24,
    h3: isTablet ? 24 : 20,
    h4: isTablet ? 20 : 18,
    bodyLarge: isTablet ? 18 : 16,
    body: isTablet ? 16 : 14,
    bodySmall: isTablet ? 14 : 12,
    label: isTablet ? 16 : 14,
  },
  lineHeights: {
    h1: isTablet ? 40 : 34,
    h2: isTablet ? 36 : 30,
    h3: isTablet ? 32 : 26,
    h4: isTablet ? 28 : 24,
    bodyLarge: isTablet ? 28 : 24,
    body: isTablet ? 24 : 20,
    bodySmall: isTablet ? 20 : 18,
    label: isTablet ? 24 : 20,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
};
```

### Component Implementation Examples

#### Primary Button Component (React Native)
```jsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/tokens';

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  size = 'default', // 'small', 'default', 'large'
  fullWidth = false,
  icon = null,
  ...props
}) => {
  const getButtonStyle = () => {
    let baseStyle = [styles.button];

    if (size === 'small') baseStyle.push(styles.buttonSmall);
    if (size === 'large') baseStyle.push(styles.buttonLarge);
    if (fullWidth) baseStyle.push(styles.buttonFullWidth);
    if (disabled || loading) baseStyle.push(styles.buttonDisabled);

    return baseStyle;
  };

  const getTextStyle = () => {
    let baseStyle = [styles.buttonText];

    if (size === 'small') baseStyle.push(styles.buttonTextSmall);
    if (size === 'large') baseStyle.push(styles.buttonTextLarge);
    if (disabled || loading) baseStyle.push(styles.buttonTextDisabled);

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading
      }}
      accessibilityLabel={title}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.background.primary}
        />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary.blue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4, // 12px
    borderRadius: borderRadius.md,
    minHeight: 44, // iOS minimum touch target
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...shadows.sm,
  },
  buttonSmall: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  buttonLarge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: colors.text.disabled,
    ...shadows.sm, // Remove shadow for disabled state
  },
  buttonText: {
    color: colors.background.primary,
    fontSize: typography.sizes.body,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
  },
  buttonTextSmall: {
    fontSize: typography.sizes.bodySmall,
  },
  buttonTextLarge: {
    fontSize: typography.sizes.bodyLarge,
  },
  buttonTextDisabled: {
    color: colors.text.muted,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
});

export default PrimaryButton;
```

#### Input Field Component (React Native)
```jsx
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../styles/tokens';

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  error = null,
  success = false,
  required = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete = 'off',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedLabel, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedLabel, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const getInputStyle = () => {
    let baseStyle = [styles.input];

    if (isFocused) baseStyle.push(styles.inputFocused);
    if (error) baseStyle.push(styles.inputError);
    if (success) baseStyle.push(styles.inputSuccess);
    if (multiline) baseStyle.push(styles.inputMultiline);

    return baseStyle;
  };

  const getLabelStyle = () => {
    return [
      styles.label,
      {
        top: animatedLabel.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 4],
        }),
        fontSize: animatedLabel.interpolate({
          inputRange: [0, 1],
          outputRange: [typography.sizes.body, typography.sizes.bodySmall],
        }),
        color: error ? colors.medical.red :
               success ? colors.clinical.green :
               isFocused ? colors.primary.blue : colors.text.secondary,
      },
    ];
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Animated.Text style={getLabelStyle()}>
          {label}{required && <Text style={styles.required}> *</Text>}
        </Animated.Text>
        <TextInput
          style={getInputStyle()}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? '' : placeholder}
          placeholderTextColor={colors.text.muted}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType="none" // Disable autofill suggestions
          accessibilityLabel={label}
          accessibilityHint={error ? error : undefined}
          {...props}
        />
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {success && !error && (
        <Text style={styles.successText}>✓ Valid</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  inputContainer: {
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: spacing.md,
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeights.medium,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  required: {
    color: colors.medical.red,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: borderRadius.md,
    paddingTop: spacing.lg + 4, // 20px to accommodate floating label
    paddingBottom: spacing.sm + 4, // 12px
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily,
    color: colors.text.primary,
    minHeight: 44, // Accessibility minimum
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: colors.primary.blue,
  },
  inputError: {
    borderWidth: 2,
    borderColor: colors.medical.red,
    backgroundColor: colors.medical.redLight + '20', // 20% opacity
  },
  inputSuccess: {
    borderColor: colors.clinical.green,
    backgroundColor: colors.clinical.greenLight + '20',
  },
  inputMultiline: {
    minHeight: 88, // Double height for multiline
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: typography.sizes.bodySmall,
    color: colors.medical.red,
    marginTop: spacing.xs,
    marginLeft: spacing.md,
    fontFamily: typography.fontFamily,
  },
  successText: {
    fontSize: typography.sizes.bodySmall,
    color: colors.clinical.green,
    marginTop: spacing.xs,
    marginLeft: spacing.md,
    fontFamily: typography.fontFamily,
  },
});

export default InputField;
```

## Responsive Design Implementation

### Breakpoint System
```css
/* CSS Media Queries */
:root {
  --breakpoint-mobile: 320px;
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;
  --breakpoint-large: 1200px;
}

/* Mobile-first approach */
.container {
  padding: var(--spacing-md);
  max-width: 100%;
}

/* Tablet adjustments */
@media screen and (min-width: 768px) {
  .container {
    padding: var(--spacing-lg);
    max-width: 1024px;
    margin: 0 auto;
  }
}

/* Desktop adjustments */
@media screen and (min-width: 1024px) {
  .container {
    padding: var(--spacing-xl);
    max-width: 1200px;
  }
}
```

### React Native Responsive Helpers
```javascript
import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

export const deviceType = {
  isPhone: width < 768,
  isTablet: width >= 768 && width < 1024,
  isDesktop: width >= 1024,
};

export const scale = (size) => {
  const newSize = size * PixelRatio.get();
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const verticalScale = (size) => {
  return height / 812 * size; // Based on iPhone X height
};

export const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Usage in components
const responsiveStyles = StyleSheet.create({
  text: {
    fontSize: deviceType.isTablet ? 18 : 16,
    lineHeight: deviceType.isTablet ? 26 : 22,
  },
  container: {
    padding: deviceType.isTablet ? spacing.lg : spacing.md,
  },
});
```

## Accessibility Implementation

### Screen Reader Support
```jsx
// React Native accessibility props
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Save patient information"
  accessibilityHint="Saves the current form data"
  accessibilityState={{
    disabled: isDisabled,
    busy: isLoading
  }}
>
  <Text>Save</Text>
</TouchableOpacity>

// Web accessibility attributes
<button
  aria-label="Save patient information"
  aria-describedby="save-help-text"
  aria-disabled={isDisabled}
  aria-busy={isLoading}
>
  Save
</button>
<div id="save-help-text" className="sr-only">
  Saves the current form data to the patient record
</div>
```

### Focus Management
```css
/* Visible focus indicators */
.focusable:focus {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}

/* Skip to content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-blue);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 6px;
}

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Performance Optimization

### Image Optimization
```javascript
// React Native optimized image loading
import FastImage from 'react-native-fast-image';

const OptimizedImage = ({ source, ...props }) => (
  <FastImage
    source={{
      uri: source,
      priority: FastImage.priority.normal,
      cache: FastImage.cacheControl.immutable,
    }}
    resizeMode={FastImage.resizeMode.cover}
    {...props}
  />
);
```

### Animation Performance
```javascript
// Use transform and opacity for 60fps animations
const animateButton = useRef(new Animated.Value(1)).current;

const handlePressIn = () => {
  Animated.spring(animateButton, {
    toValue: 0.95,
    useNativeDriver: true, // Critical for performance
  }).start();
};

const handlePressOut = () => {
  Animated.spring(animateButton, {
    toValue: 1,
    useNativeDriver: true,
  }).start();
};

// Animated style
const animatedStyle = {
  transform: [
    {
      scale: animateButton,
    },
  ],
};
```

## Quality Assurance Checklist

### Design System Compliance
- [ ] All colors use design tokens
- [ ] Typography follows scale and weights
- [ ] Spacing uses 8px grid system
- [ ] Touch targets minimum 44px
- [ ] Border radius consistent with system
- [ ] Shadows match specifications

### Accessibility Validation
- [ ] Color contrast ratios meet WCAG AA
- [ ] All interactive elements have labels
- [ ] Focus indicators visible and consistent
- [ ] Screen reader navigation logical
- [ ] Voice control commands work
- [ ] Keyboard navigation complete

### Cross-Platform Testing
- [ ] iOS rendering matches designs
- [ ] Android rendering matches designs
- [ ] Web responsive behavior correct
- [ ] Dark mode compatibility (if applicable)
- [ ] Right-to-left language support
- [ ] Performance meets targets

### Healthcare-Specific Validation
- [ ] Medical terminology accurate
- [ ] Clinical workflows supported
- [ ] Emergency scenarios accessible
- [ ] Glove usage compatibility
- [ ] Various lighting conditions tested
- [ ] Offline functionality verified

---

*This implementation guide ensures consistent, accessible, and performant implementation of the BerthCare design system across all platforms and development teams.*