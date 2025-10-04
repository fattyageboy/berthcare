# Design System Theme

This module contains all design tokens from the style guide, organized into colors, typography, and spacing constants.

## Usage

### Import Individual Tokens

```typescript
import { colors, typography, spacing } from '@/theme';

// Use colors
const buttonStyle = {
  backgroundColor: colors.primary.main,
  color: colors.text.primary,
};

// Use typography
const headingStyle = {
  ...typography.mobile.h1,
};

// Use spacing
const containerStyle = {
  padding: spacing.md,
  marginBottom: spacing.lg,
};
```

### Import Complete Theme

```typescript
import { theme } from '@/theme';

const styles = {
  container: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.mobile.h1,
    color: theme.colors.text.primary,
  },
};
```

## Structure

- **colors.ts** - All color tokens including primary, semantic, text, and background colors
- **typography.ts** - Font weights and typography scales for mobile and desktop
- **spacing.ts** - 8px grid-based spacing scale
- **index.ts** - Centralized exports and combined theme object

## Design Tokens

### Colors
- Primary (blue) - Actions, navigation, branding
- Success (green) - Completed tasks, positive indicators
- Error (red) - Error states, urgent alerts
- Warning (orange) - Warnings, attention needed
- Text - Primary, secondary, tertiary, disabled
- Background - Primary, secondary, tertiary, borders
- Semantic - Critical, healthy, info, medication

### Typography
- Mobile scale (320px - 768px)
- Desktop scale (769px+)
- Font weights: light, regular, medium, semiBold, bold

### Spacing
Based on 8px grid: xs(4), sm(8), md(16), lg(24), xl(32), xxl(48), xxxl(64)

## Accessibility

All color combinations maintain WCAG AA contrast ratios:
- Text on white: 4.5:1 minimum
- Large text on white: 3:1 minimum
- Interactive elements: 4.5:1 minimum
