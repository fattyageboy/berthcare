/**
 * Design System Spacing
 * Based on 8px grid system from style-guide.md
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export type Spacing = typeof spacing;
