# BerthCare Design Tokens

## Overview

Design tokens are the visual design atoms of the BerthCare design system. They store visual design attributes and ensure consistency across all platforms and implementations. These tokens are specifically optimized for healthcare applications, prioritizing accessibility, medical compliance, and user safety.

## Token Categories

### Colors
### Spacing
### Typography
### Shadows
### Border Radius
### Motion
### Z-Index

---

## Color Tokens

### Primary Colors

```json
{
  "color": {
    "primary": {
      "50": "#E8F4F8",
      "100": "#D1E9F1",
      "200": "#A3D3E3",
      "300": "#75BDD5",
      "400": "#47A7C7",
      "500": "#1B4F72",
      "600": "#2E6B9E",
      "700": "#1B4F72",
      "800": "#154A6B",
      "900": "#0F3A56"
    }
  }
}
```

**Usage Guidelines:**
- `primary-500`: Primary buttons, active navigation, key interactive elements
- `primary-600`: Hover states for primary actions
- `primary-700`: Pressed states, focus rings
- `primary-100-300`: Light backgrounds, subtle highlights
- `primary-800-900`: Dark mode variants, high emphasis text

### Secondary Colors

```json
{
  "color": {
    "success": {
      "50": "#E8F8F0",
      "100": "#D1F1E1",
      "200": "#A3E3C3",
      "300": "#75D5A5",
      "400": "#47C787",
      "500": "#239B56",
      "600": "#2ECC71",
      "700": "#229954",
      "800": "#1B7A43",
      "900": "#145C32"
    },
    "warning": {
      "50": "#FEF7E6",
      "100": "#FDEFCD",
      "200": "#FBDF9B",
      "300": "#F9CF69",
      "400": "#F7BF37",
      "500": "#DC7633",
      "600": "#F39C12",
      "700": "#D68910",
      "800": "#B7760F",
      "900": "#98630E"
    },
    "error": {
      "50": "#FDF2F2",
      "100": "#FCE4E4",
      "200": "#FBBCBC",
      "300": "#F98080",
      "400": "#F85757",
      "500": "#CB4335",
      "600": "#E74C3C",
      "700": "#DC322F",
      "800": "#C53030",
      "900": "#9B1C1C"
    }
  }
}
```

### Neutral Colors

```json
{
  "color": {
    "neutral": {
      "0": "#FFFFFF",
      "50": "#F8F9FA",
      "100": "#F1F3F4",
      "200": "#E9ECEF",
      "300": "#DEE2E6",
      "400": "#CED4DA",
      "500": "#ADB5BD",
      "600": "#6C757D",
      "700": "#495057",
      "800": "#343A40",
      "900": "#212529",
      "1000": "#000000"
    }
  }
}
```

### Healthcare Semantic Colors

```json
{
  "color": {
    "medical": {
      "critical": "#FF6B6B",
      "normal": "#4ECDC4",
      "information": "#45B7D1",
      "medication": "#96CEB4",
      "vitals-high": "#FF8A80",
      "vitals-normal": "#81C784",
      "vitals-low": "#FFB74D",
      "wound-care": "#F8BBD9",
      "therapy": "#B39DDB"
    }
  }
}
```

**Accessibility Notes:**
All color combinations maintain WCAG AA contrast ratios:
- Text on background: 4.5:1 minimum
- Large text: 3.0:1 minimum
- Interactive elements: 4.5:1 minimum

---

## Spacing Tokens

### Base Unit: 8px Grid System

```json
{
  "spacing": {
    "0": "0px",
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "2xl": "40px",
    "3xl": "48px",
    "4xl": "64px",
    "5xl": "80px",
    "6xl": "96px"
  }
}
```

### Component Spacing

```json
{
  "spacing": {
    "component": {
      "padding-xs": "4px",
      "padding-sm": "8px",
      "padding-md": "16px",
      "padding-lg": "24px",
      "margin-xs": "4px",
      "margin-sm": "8px",
      "margin-md": "16px",
      "margin-lg": "24px",
      "margin-xl": "32px"
    }
  }
}
```

### Touch Targets

```json
{
  "spacing": {
    "touch": {
      "minimum": "44px",
      "comfortable": "48px",
      "large": "56px",
      "extra-large": "64px"
    }
  }
}
```

**Healthcare Considerations:**
- Minimum touch targets accommodate use with medical gloves
- Comfortable spacing reduces error rates in time-critical situations
- Large targets for primary actions in emergency scenarios

---

## Typography Tokens

### Font Families

```json
{
  "font": {
    "family": {
      "primary": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      "monospace": "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace"
    }
  }
}
```

### Font Sizes

```json
{
  "font": {
    "size": {
      "xs": "12px",
      "sm": "14px",
      "base": "16px",
      "lg": "18px",
      "xl": "20px",
      "2xl": "24px",
      "3xl": "28px",
      "4xl": "32px",
      "5xl": "36px",
      "6xl": "48px"
    }
  }
}
```

### Font Weights

```json
{
  "font": {
    "weight": {
      "light": "300",
      "regular": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    }
  }
}
```

### Line Heights

```json
{
  "font": {
    "lineHeight": {
      "tight": "1.2",
      "snug": "1.4",
      "normal": "1.5",
      "relaxed": "1.6",
      "loose": "1.8"
    }
  }
}
```

### Typography Scale (Mobile)

```json
{
  "typography": {
    "mobile": {
      "h1": {
        "fontSize": "28px",
        "lineHeight": "34px",
        "fontWeight": "600",
        "letterSpacing": "-0.02em"
      },
      "h2": {
        "fontSize": "24px",
        "lineHeight": "30px",
        "fontWeight": "600",
        "letterSpacing": "-0.01em"
      },
      "h3": {
        "fontSize": "20px",
        "lineHeight": "26px",
        "fontWeight": "500"
      },
      "h4": {
        "fontSize": "18px",
        "lineHeight": "24px",
        "fontWeight": "500"
      },
      "body-large": {
        "fontSize": "16px",
        "lineHeight": "24px",
        "fontWeight": "400"
      },
      "body": {
        "fontSize": "14px",
        "lineHeight": "20px",
        "fontWeight": "400"
      },
      "body-small": {
        "fontSize": "12px",
        "lineHeight": "18px",
        "fontWeight": "400"
      },
      "label": {
        "fontSize": "14px",
        "lineHeight": "20px",
        "fontWeight": "500"
      },
      "caption": {
        "fontSize": "12px",
        "lineHeight": "16px",
        "fontWeight": "400"
      }
    }
  }
}
```

### Typography Scale (Desktop)

```json
{
  "typography": {
    "desktop": {
      "h1": {
        "fontSize": "32px",
        "lineHeight": "40px",
        "fontWeight": "600",
        "letterSpacing": "-0.02em"
      },
      "h2": {
        "fontSize": "28px",
        "lineHeight": "36px",
        "fontWeight": "600",
        "letterSpacing": "-0.01em"
      },
      "h3": {
        "fontSize": "24px",
        "lineHeight": "32px",
        "fontWeight": "500"
      },
      "h4": {
        "fontSize": "20px",
        "lineHeight": "28px",
        "fontWeight": "500"
      },
      "body-large": {
        "fontSize": "18px",
        "lineHeight": "28px",
        "fontWeight": "400"
      },
      "body": {
        "fontSize": "16px",
        "lineHeight": "24px",
        "fontWeight": "400"
      },
      "body-small": {
        "fontSize": "14px",
        "lineHeight": "20px",
        "fontWeight": "400"
      },
      "label": {
        "fontSize": "16px",
        "lineHeight": "24px",
        "fontWeight": "500"
      }
    }
  }
}
```

---

## Shadow Tokens

### Elevation System

```json
{
  "shadow": {
    "none": "none",
    "xs": "0px 1px 2px rgba(0, 0, 0, 0.05)",
    "sm": "0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)",
    "base": "0px 4px 6px rgba(0, 0, 0, 0.07), 0px 2px 4px rgba(0, 0, 0, 0.06)",
    "md": "0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)",
    "lg": "0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)",
    "xl": "0px 25px 50px rgba(0, 0, 0, 0.25)"
  }
}
```

### Component Shadows

```json
{
  "shadow": {
    "component": {
      "card": "0px 2px 8px rgba(0, 0, 0, 0.08)",
      "button": "0px 2px 4px rgba(27, 79, 114, 0.2)",
      "modal": "0px 20px 25px rgba(0, 0, 0, 0.15)",
      "dropdown": "0px 10px 15px rgba(0, 0, 0, 0.1)",
      "floating": "0px 8px 16px rgba(0, 0, 0, 0.15)"
    }
  }
}
```

---

## Border Radius Tokens

```json
{
  "borderRadius": {
    "none": "0px",
    "xs": "2px",
    "sm": "4px",
    "base": "6px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "2xl": "20px",
    "3xl": "24px",
    "full": "9999px"
  }
}
```

### Component Border Radius

```json
{
  "borderRadius": {
    "component": {
      "button": "8px",
      "input": "6px",
      "card": "12px",
      "modal": "16px",
      "avatar": "9999px",
      "badge": "9999px"
    }
  }
}
```

---

## Motion Tokens

### Timing Functions

```json
{
  "motion": {
    "easing": {
      "linear": "cubic-bezier(0, 0, 1, 1)",
      "ease": "cubic-bezier(0.25, 0.1, 0.25, 1)",
      "ease-in": "cubic-bezier(0.42, 0, 1, 1)",
      "ease-out": "cubic-bezier(0, 0, 0.58, 1)",
      "ease-in-out": "cubic-bezier(0.42, 0, 0.58, 1)",
      "standard": "cubic-bezier(0.4, 0.0, 0.2, 1)",
      "decelerate": "cubic-bezier(0.0, 0.0, 0.2, 1)",
      "accelerate": "cubic-bezier(0.4, 0.0, 1, 1)",
      "sharp": "cubic-bezier(0.4, 0.0, 0.6, 1)"
    }
  }
}
```

### Duration Scale

```json
{
  "motion": {
    "duration": {
      "instant": "0ms",
      "fast": "150ms",
      "base": "250ms",
      "slow": "400ms",
      "slower": "600ms",
      "slowest": "1000ms"
    }
  }
}
```

### Animation Presets

```json
{
  "motion": {
    "preset": {
      "fade-in": {
        "duration": "250ms",
        "easing": "ease-out",
        "properties": ["opacity"]
      },
      "slide-up": {
        "duration": "250ms",
        "easing": "decelerate",
        "properties": ["transform"]
      },
      "scale-in": {
        "duration": "200ms",
        "easing": "decelerate",
        "properties": ["transform", "opacity"]
      },
      "button-press": {
        "duration": "150ms",
        "easing": "sharp",
        "properties": ["transform"]
      }
    }
  }
}
```

---

## Z-Index Tokens

```json
{
  "zIndex": {
    "base": "0",
    "dropdown": "1000",
    "sticky": "1020",
    "fixed": "1030",
    "modal-backdrop": "1040",
    "modal": "1050",
    "popover": "1060",
    "tooltip": "1070",
    "notification": "1080",
    "emergency": "9999"
  }
}
```

---

## Breakpoint Tokens

```json
{
  "breakpoint": {
    "xs": "320px",
    "sm": "576px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px",
    "2xl": "1536px"
  }
}
```

---

## Healthcare-Specific Tokens

### Medical Data Ranges

```json
{
  "medical": {
    "vitals": {
      "bloodPressure": {
        "systolic": {
          "low": "90",
          "normal": "120",
          "high": "140",
          "critical": "180"
        },
        "diastolic": {
          "low": "60",
          "normal": "80",
          "high": "90",
          "critical": "120"
        }
      },
      "temperature": {
        "low": "95",
        "normal": "98.6",
        "fever": "100.4",
        "high": "103"
      },
      "heartRate": {
        "low": "60",
        "normal": "80",
        "high": "100",
        "critical": "120"
      }
    }
  }
}
```

### Status Colors

```json
{
  "medical": {
    "status": {
      "stable": "#4ECDC4",
      "monitoring": "#FFB74D",
      "concern": "#FF8A65",
      "critical": "#FF6B6B",
      "improved": "#81C784",
      "declined": "#E57373"
    }
  }
}
```

---

## Usage Examples

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-primary-500: #1B4F72;
  --color-primary-600: #2E6B9E;
  --color-success-500: #239B56;
  --color-error-500: #CB4335;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  /* Typography */
  --font-size-body: 16px;
  --font-weight-medium: 500;
  --line-height-normal: 1.5;

  /* Shadows */
  --shadow-card: 0px 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-button: 0px 2px 4px rgba(27, 79, 114, 0.2);

  /* Border Radius */
  --border-radius-md: 8px;
  --border-radius-lg: 12px;

  /* Motion */
  --motion-duration-base: 250ms;
  --motion-easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

### React Native StyleSheet

```javascript
const tokens = {
  colors: {
    primary500: '#1B4F72',
    primary600: '#2E6B9E',
    success500: '#239B56',
    error500: '#CB4335',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
  },
  typography: {
    bodySize: 16,
    bodyLineHeight: 24,
    mediumWeight: '500',
  },
  borderRadius: {
    md: 8,
    lg: 12,
  },
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: tokens.colors.primary500,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
  },
});
```

### Styled Components

```javascript
const theme = {
  colors: {
    primary: {
      500: '#1B4F72',
      600: '#2E6B9E',
    },
    success: {
      500: '#239B56',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
};

const PrimaryButton = styled.button`
  background-color: ${props => props.theme.colors.primary[500]};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};

  &:hover {
    background-color: ${props => props.theme.colors.primary[600]};
  }
`;
```

---

## Token Naming Conventions

### Structure
`{category}-{property}-{variant}-{state}`

**Examples:**
- `color-primary-500` (category-property-variant)
- `spacing-component-padding-md` (category-subcategory-property-variant)
- `typography-mobile-h1-fontSize` (category-context-element-property)

### Guidelines
1. **Semantic over descriptive:** Use `color-error-500` instead of `color-red-500`
2. **Consistent hierarchy:** Follow the same structure across all token types
3. **Platform prefixes when needed:** `typography-mobile-h1` vs `typography-desktop-h1`
4. **State suffixes for interactions:** `color-primary-500-hover`

---

*These design tokens ensure consistent, accessible, and maintainable design implementation across all BerthCare platforms and applications.*