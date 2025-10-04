/**
 * Design System Colors
 * Based on style-guide.md specifications
 */

export const colors = {
  // Primary Colors
  primary: {
    main: '#1B4F72',
    hover: '#2E6B9E',
    disabled: '#5499C7',
  },

  // Clinical Green
  success: {
    main: '#239B56',
    hover: '#2ECC71',
    light: '#82E5AA',
  },

  // Medical Red
  error: {
    main: '#CB4335',
    hover: '#E74C3C',
    light: '#F1948A',
  },

  // Healthcare Orange
  warning: {
    main: '#DC7633',
    hover: '#F39C12',
    light: '#F8C471',
  },

  // Text Colors
  text: {
    primary: '#212529',
    secondary: '#495057',
    tertiary: '#6C757D',
    disabled: '#ADB5BD',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#E9ECEF',
    border: '#DEE2E6',
  },

  // Semantic Colors
  semantic: {
    critical: '#FF6B6B',
    healthy: '#4ECDC4',
    info: '#45B7D1',
    medication: '#96CEB4',
  },
} as const;

export type Colors = typeof colors;
