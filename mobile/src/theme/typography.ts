/**
 * Design System Typography
 * Based on style-guide.md specifications
 */

export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

export const typography = {
  // Mobile Typography (320px - 768px)
  mobile: {
    h1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: fontWeights.semiBold,
    },
    h2: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: fontWeights.semiBold,
    },
    h3: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: fontWeights.medium,
    },
    h4: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: fontWeights.medium,
    },
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: fontWeights.regular,
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: fontWeights.regular,
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: fontWeights.regular,
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: fontWeights.medium,
    },
  },

  // Desktop Typography (769px+)
  desktop: {
    h1: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: fontWeights.semiBold,
    },
    h2: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: fontWeights.semiBold,
    },
    h3: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: fontWeights.medium,
    },
    h4: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: fontWeights.medium,
    },
    bodyLarge: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: fontWeights.regular,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: fontWeights.regular,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: fontWeights.regular,
    },
    label: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: fontWeights.medium,
    },
  },
} as const;

export type Typography = typeof typography;
export type FontWeights = typeof fontWeights;
