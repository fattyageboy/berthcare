/**
 * Design System Theme
 * Centralized export for all design tokens
 */

import { colors as colorsImport } from './colors';
import { typography as typographyImport, fontWeights as fontWeightsImport } from './typography';
import { spacing as spacingImport } from './spacing';

export { colors } from './colors';
export type { Colors } from './colors';

export { typography, fontWeights } from './typography';
export type { Typography, FontWeights } from './typography';

export { spacing } from './spacing';
export type { Spacing } from './spacing';

// Combined theme object for convenience
export const theme = {
  colors: colorsImport,
  typography: typographyImport,
  fontWeights: fontWeightsImport,
  spacing: spacingImport,
} as const;

export type Theme = typeof theme;
