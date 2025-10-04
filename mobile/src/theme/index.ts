/**
 * Design System Theme
 * Centralized export for all design tokens
 */

export { colors } from './colors';
export type { Colors } from './colors';

export { typography, fontWeights } from './typography';
export type { Typography, FontWeights } from './typography';

export { spacing } from './spacing';
export type { Spacing } from './spacing';

// Combined theme object for convenience
export const theme = {
  colors: require('./colors').colors,
  typography: require('./typography').typography,
  fontWeights: require('./typography').fontWeights,
  spacing: require('./spacing').spacing,
} as const;

export type Theme = typeof theme;
