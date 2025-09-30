# BerthCare Style Guide

## Color System

### Primary Colors
Healthcare providers need colors that are professional, calming, and maintain high contrast for accessibility.

**Primary Blue**
- `#1B4F72` - Primary actions, navigation, branding
- `#2E6B9E` - Hover states, secondary actions
- `#5499C7` - Disabled states, light backgrounds
- Usage: Primary CTAs, navigation headers, key interactive elements

**Clinical Green**
- `#239B56` - Success states, completed tasks, positive indicators
- `#2ECC71` - Hover states for success actions
- `#82E5AA` - Light success backgrounds, subtle confirmations
- Usage: Task completion, form validation success, health status positive

### Secondary Colors

**Medical Red**
- `#CB4335` - Error states, urgent alerts, required fields
- `#E74C3C` - Hover states for critical actions
- `#F1948A` - Light error backgrounds, form validation errors
- Usage: Error messages, urgent notifications, required field indicators

**Healthcare Orange**
- `#DC7633` - Warning states, attention needed, moderate priority
- `#F39C12` - Hover states for warning actions
- `#F8C471` - Light warning backgrounds, informational alerts
- Usage: Warnings, incomplete tasks, moderate priority notifications

### Neutral Palette

**Text Colors**
- `#212529` - Primary text, headers, high-emphasis content
- `#495057` - Secondary text, subheaders, medium-emphasis
- `#6C757D` - Helper text, captions, low-emphasis content
- `#ADB5BD` - Disabled text, placeholders

**Background Colors**
- `#FFFFFF` - Primary backgrounds, cards, modals
- `#F8F9FA` - Secondary backgrounds, page backgrounds
- `#E9ECEF` - Subtle separations, disabled states
- `#DEE2E6` - Borders, dividers, form field borders

**Semantic Colors**
These colors have specific healthcare meanings and should be used consistently:

- `#FF6B6B` - Critical/Emergency (blood pressure high, urgent alerts)
- `#4ECDC4` - Normal/Healthy (vital signs normal, completed care tasks)
- `#45B7D1` - Information (general notifications, tips)
- `#96CEB4` - Medication/Treatment (pill reminders, treatment schedules)

### Accessibility Notes
All color combinations maintain WCAG AA contrast ratios:
- Text on white: 4.5:1 minimum
- Large text on white: 3:1 minimum
- Interactive elements: 4.5:1 minimum

## Typography System

### Font Stack
**Primary Font:** SF Pro (iOS), Roboto (Android), -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui

**Rationale:** System fonts ensure optimal readability, performance, and platform consistency while supporting multiple languages and accessibility features.

### Font Weights
- **300 (Light):** Large headers, minimal emphasis
- **400 (Regular):** Body text, standard content
- **500 (Medium):** Subheaders, emphasis within text
- **600 (Semi-Bold):** Section headers, important labels
- **700 (Bold):** Page headers, critical information

### Type Scale

**Mobile (320px - 768px)**
- `h1`: 28px/34px, Semi-Bold - Page titles, main headers
- `h2`: 24px/30px, Semi-Bold - Section headers
- `h3`: 20px/26px, Medium - Subsection headers
- `h4`: 18px/24px, Medium - Component headers
- `body-large`: 16px/24px, Regular - Important body text
- `body`: 14px/20px, Regular - Standard body text
- `body-small`: 12px/18px, Regular - Helper text, captions
- `label`: 14px/20px, Medium - Form labels, button text

**Desktop (769px+)**
- `h1`: 32px/40px, Semi-Bold - Page titles
- `h2`: 28px/36px, Semi-Bold - Section headers
- `h3`: 24px/32px, Medium - Subsection headers
- `h4`: 20px/28px, Medium - Component headers
- `body-large`: 18px/28px, Regular - Important body text
- `body`: 16px/24px, Regular - Standard body text
- `body-small`: 14px/20px, Regular - Helper text
- `label`: 16px/24px, Medium - Form labels, button text

### Typography Guidelines
- **Line Height:** 1.4-1.6x font size for optimal readability
- **Letter Spacing:** Default system spacing, no custom tracking
- **Text Alignment:** Left-aligned for readability, center only for short headings
- **Text Wrapping:** Optimal line length 45-75 characters

## Spacing & Layout System

### Base Unit
**8px Grid System** - All spacing values are multiples of 8px for consistent visual rhythm and developer efficiency.

### Spacing Scale
- `xs`: 4px - Tight spacing within components
- `sm`: 8px - Standard component padding, small gaps
- `md`: 16px - Standard margins, card padding
- `lg`: 24px - Section spacing, large component gaps
- `xl`: 32px - Page margins, major section separation
- `xxl`: 48px - Page-level spacing, hero sections
- `xxxl`: 64px - Maximum spacing for large screens

### Grid System

**Mobile (320px - 768px)**
- 4-column grid
- 16px margins
- 16px gutters
- Minimum touch target: 44px (iOS) / 48px (Android)

**Tablet (769px - 1024px)**
- 8-column grid
- 24px margins
- 20px gutters

**Desktop (1025px+)**
- 12-column grid
- 32px margins
- 24px gutters
- Maximum content width: 1200px

### Layout Principles
- **Mobile-First:** Design for mobile, enhance for larger screens
- **Single Column:** Mobile layouts use single column for clarity
- **Progressive Enhancement:** Add columns and complexity for larger screens
- **Safe Areas:** Account for device-specific safe areas (notches, rounded corners)

## Component Specifications

### Buttons

**Primary Button**
- Background: `#1B4F72`
- Text: `#FFFFFF`, 14px/16px, Medium
- Padding: 12px 24px (mobile), 16px 32px (desktop)
- Border Radius: 8px
- Minimum Height: 44px (iOS), 48px (Android)
- Hover: `#2E6B9E`
- Pressed: `#154A6B`
- Disabled: `#ADB5BD` background, `#6C757D` text

**Secondary Button**
- Background: `#FFFFFF`
- Border: 2px solid `#1B4F72`
- Text: `#1B4F72`, 14px/16px, Medium
- Same dimensions and states as primary
- Hover: `#F8F9FA` background

**Text Button**
- Background: Transparent
- Text: `#1B4F72`, 14px/16px, Medium
- Padding: 8px 16px
- Underline on hover

### Form Elements

**Input Fields**
- Border: 1px solid `#DEE2E6`
- Background: `#FFFFFF`
- Padding: 12px 16px
- Border Radius: 6px
- Height: 44px minimum
- Focus: 2px solid `#1B4F72`, remove outline
- Error: 2px solid `#CB4335`
- Success: 2px solid `#239B56`

**Labels**
- Text: `#495057`, 14px/20px, Medium
- Margin bottom: 4px
- Required indicator: `*` in `#CB4335`

**Helper Text**
- Text: `#6C757D`, 12px/18px, Regular
- Margin top: 4px
- Error text: `#CB4335`

### Cards

**Standard Card**
- Background: `#FFFFFF`
- Border Radius: 12px
- Shadow: 0px 2px 8px rgba(0, 0, 0, 0.1)
- Padding: 16px (mobile), 24px (desktop)
- Border: 1px solid `#E9ECEF`

**Patient Card**
- Same as standard card
- Header: Patient name, age, condition indicators
- Status indicator: Color-coded dot for urgency level
- Quick actions: Call, message, navigate

### Navigation

**Bottom Navigation (Mobile)**
- Height: 60px + safe area
- Background: `#FFFFFF`
- Border top: 1px solid `#E9ECEF`
- Active state: `#1B4F72` icon and text
- Inactive state: `#6C757D` icon and text
- Badge support for notifications

**Header Navigation**
- Height: 56px (mobile), 64px (desktop)
- Background: `#1B4F72`
- Title: `#FFFFFF`, 18px/24px, Semi-Bold
- Back button: White arrow icon, 24px
- Actions: White icons, 24px minimum touch target

## Motion & Animation System

### Timing Functions
- **Standard Easing:** cubic-bezier(0.4, 0.0, 0.2, 1)
- **Decelerate:** cubic-bezier(0.0, 0.0, 0.2, 1) - Entering elements
- **Accelerate:** cubic-bezier(0.4, 0.0, 1, 1) - Exiting elements
- **Sharp:** cubic-bezier(0.4, 0.0, 0.6, 1) - Attention-grabbing

### Duration Scale
- **Fast:** 150ms - Micro-interactions, hover states
- **Standard:** 250ms - Component transitions, page elements
- **Slow:** 400ms - Page transitions, complex animations
- **Extra Slow:** 600ms - Loading states, major layout changes

### Animation Principles
- **Purposeful:** Every animation serves a functional purpose
- **Respectful:** Honor user's motion preferences (prefers-reduced-motion)
- **Consistent:** Use same timing and easing for similar interactions
- **Performance-First:** Use transform and opacity for smooth 60fps animations

### Common Animations
- **Fade In:** opacity 0 to 1, 250ms standard easing
- **Slide Up:** translateY(20px) to 0, 250ms decelerate
- **Scale In:** scale(0.95) to 1, 250ms decelerate
- **Loading Spinner:** continuous rotation, 1.5s linear

## Healthcare-Specific Guidelines

### Medical Data Display
- **Vital Signs:** Large, clear numbers with units
- **Medication Lists:** Structured tables with clear dosage information
- **Care Instructions:** Numbered or bulleted lists, scannable format
- **Emergency Information:** Red highlighting, prominent placement

### Status Indicators
- **Normal:** Green circle or checkmark
- **Attention Needed:** Orange warning triangle
- **Critical:** Red exclamation or alert icon
- **Completed:** Green checkmark
- **Pending:** Gray circle or clock icon

### Data Entry Patterns
- **Quick Entry:** Pre-populated fields, dropdown selections
- **Voice Input:** Microphone icon, clear recording states
- **Photo Capture:** Camera integration, image preview
- **Signature:** Touch-friendly signature pad, clear/retry options

### Offline Indicators
- **Connected:** Green dot or wifi icon
- **Syncing:** Animated sync icon
- **Offline:** Gray or orange cloud icon with slash
- **Sync Failed:** Red warning with retry option

---

*This style guide ensures consistent, accessible, and healthcare-appropriate design across all BerthCare interfaces.*