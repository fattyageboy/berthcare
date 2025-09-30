# BerthCare Component Library

## Overview

The BerthCare component library provides a comprehensive set of reusable UI components specifically designed for healthcare applications. Each component prioritizes accessibility, usability in medical environments, and compliance with healthcare standards.

## Design Principles

### Healthcare-Specific Requirements
- **Glove Compatibility:** All touch targets minimum 44px for use with medical gloves
- **High Contrast:** WCAG AA compliant color contrasts for various lighting conditions
- **Error Prevention:** Built-in validation and confirmation patterns
- **Quick Access:** Optimized for efficiency in time-critical healthcare scenarios

### Accessibility Standards
- **WCAG 2.1 AA Compliance:** All components meet accessibility guidelines
- **Screen Reader Support:** Proper ARIA labels and semantic markup
- **Keyboard Navigation:** Full keyboard accessibility for all interactive elements
- **Voice Control:** Integration points for voice input and navigation

## Component Categories

### 1. Core Components
- [Buttons](#buttons) - Primary, secondary, and specialized action buttons
- [Form Elements](#form-elements) - Inputs, selects, checkboxes optimized for medical data
- [Cards](#cards) - Patient cards, visit summaries, information containers
- [Navigation](#navigation) - Tab bars, headers, breadcrumbs

### 2. Healthcare-Specific Components
- [Vital Signs Input](#vital-signs-input) - Specialized inputs for medical measurements
- [Patient Header](#patient-header) - Consistent patient identification across screens
- [Visit Timeline](#visit-timeline) - Care activity tracking and history
- [Medication List](#medication-list) - Drug information display and interaction

### 3. Data Components
- [Data Tables](#data-tables) - Medical records, visit logs, patient lists
- [Charts & Graphs](#charts--graphs) - Vital signs trends, care metrics
- [Status Indicators](#status-indicators) - Health status, urgency levels, sync status
- [Progress Indicators](#progress-indicators) - Visit completion, upload status

### 4. Communication Components
- [Notification System](#notification-system) - Alerts, confirmations, status updates
- [Messaging Interface](#messaging-interface) - Team communication, family updates
- [Emergency Contacts](#emergency-contacts) - Quick access to critical contacts
- [Help & Support](#help--support) - Contextual assistance and documentation

## Component Specifications

## Buttons

### Primary Button
Healthcare providers need clear, confident action buttons that work reliably in stressful situations.

**Usage:** Main call-to-action, visit completion, emergency actions
**Specifications:**
- Minimum size: 44px height (iOS) / 48px height (Android)
- Padding: 16px horizontal, 12px vertical (mobile)
- Border radius: 8px
- Font: 16px, Semi-Bold
- Background: `#1B4F72` (Primary Blue)
- Text: `#FFFFFF`
- Touch target: Extends 4px beyond visual bounds

**States:**
```css
/* Default */
background: #1B4F72;
color: #FFFFFF;
box-shadow: 0px 2px 4px rgba(27, 79, 114, 0.2);

/* Hover (desktop) */
background: #2E6B9E;
transform: translateY(-1px);

/* Active/Pressed */
background: #154A6B;
transform: translateY(0px);
box-shadow: 0px 1px 2px rgba(27, 79, 114, 0.3);

/* Disabled */
background: #ADB5BD;
color: #6C757D;
box-shadow: none;
```

**Variants:**
- **Large:** 56px height for primary actions (Start Visit, Submit)
- **Small:** 36px height for secondary actions in compact spaces
- **Full Width:** Spans container width for mobile forms
- **Icon + Text:** 24px icon with 8px spacing to text

### Secondary Button
**Usage:** Cancel actions, alternative choices, back navigation

**Specifications:**
- Same dimensions as primary button
- Background: `#FFFFFF`
- Border: 2px solid `#1B4F72`
- Text: `#1B4F72`

### Danger Button
**Usage:** Emergency actions, critical alerts, destructive actions

**Specifications:**
- Background: `#CB4335` (Medical Red)
- Text: `#FFFFFF`
- Requires confirmation dialog for destructive actions

### Text Button
**Usage:** Tertiary actions, navigation links, help text

**Specifications:**
- Background: Transparent
- Text: `#1B4F72`, underline on hover
- Minimum touch target: 44px × 44px
- Padding: 8px minimum

## Form Elements

### Text Input
Healthcare data entry requires precision and error prevention.

**Usage:** Patient information, notes, measurements
**Specifications:**
- Height: 44px minimum (accommodates large text size settings)
- Padding: 12px horizontal, 12px vertical
- Border: 1px solid `#DEE2E6`
- Border radius: 6px
- Font: 16px (prevents zoom on iOS)
- Background: `#FFFFFF`

**States:**
```css
/* Default */
border: 1px solid #DEE2E6;
background: #FFFFFF;

/* Focus */
border: 2px solid #1B4F72;
box-shadow: 0px 0px 0px 3px rgba(27, 79, 114, 0.1);
outline: none;

/* Error */
border: 2px solid #CB4335;
background: #FFF5F5;

/* Success */
border: 1px solid #239B56;
background: #F0FFF4;

/* Disabled */
background: #F8F9FA;
color: #6C757D;
cursor: not-allowed;
```

**Variants:**
- **Large:** For critical data entry (vital signs)
- **Numeric:** Number keyboard on mobile, validation for numeric ranges
- **Multi-line:** Text area for notes and observations
- **Voice Enabled:** Microphone icon, voice-to-text integration

### Select Dropdown
**Usage:** Predefined options, medication lists, care categories

**Specifications:**
- Same dimensions as text input
- Chevron down icon (16px) positioned right with 12px margin
- Touch target extends full width and height
- Option list: Maximum 6 visible items before scrolling

**Mobile Considerations:**
- Native select on mobile for better UX
- Custom select on desktop for consistency
- Search functionality for long lists (>10 items)

### Checkbox
**Usage:** Care activity completion, consent forms, preferences

**Specifications:**
- Size: 20px × 20px visual, 44px × 44px touch target
- Border: 2px solid `#495057`
- Check icon: White checkmark on primary blue background
- Label spacing: 12px from checkbox

### Radio Button
**Usage:** Exclusive choices, pain scales, assessment options

**Specifications:**
- Size: 20px diameter visual, 44px touch target
- Border: 2px solid `#495057`
- Selected: Filled circle with primary blue
- Group spacing: 16px between options

## Cards

### Patient Card
The patient card is a critical component used throughout the application.

**Usage:** Patient lists, visit schedules, care team directories
**Specifications:**
- Minimum height: 88px (allows for patient photo + 2 lines of text)
- Padding: 16px
- Border radius: 12px
- Background: `#FFFFFF`
- Shadow: 0px 2px 8px rgba(0, 0, 0, 0.08)
- Border: 1px solid `#E9ECEF`

**Layout Structure:**
```
[Avatar] [Name, Age]           [Status Icon]
         [Condition/Notes]     [Quick Actions]
```

**Content Guidelines:**
- **Avatar:** 48px × 48px, fallback to initials
- **Name:** 18px, Semi-Bold, truncate at 20 characters
- **Age/Info:** 14px, Regular, muted color
- **Status:** Color-coded indicator (red/yellow/green)
- **Quick Actions:** 32px icons, 44px touch targets

### Visit Summary Card
**Usage:** Visit history, care activity summaries

**Specifications:**
- Collapsible design for space efficiency
- Header shows key information (date, duration, provider)
- Expandable content shows detailed activities
- Photo thumbnails when available
- Status indicators for completion/urgency

### Information Card
**Usage:** Care instructions, medication information, alerts

**Specifications:**
- Icon-based categorization (info, warning, success, error)
- Clear hierarchy with title, description, action items
- Color-coded backgrounds for different message types
- Dismissible for non-critical information

## Navigation

### Bottom Tab Navigation (Mobile Primary)
**Usage:** Main navigation for mobile app

**Specifications:**
- Height: 60px + safe area insets
- Background: `#FFFFFF`
- Border top: 1px solid `#E9ECEF`
- 4-5 primary tabs maximum
- Icon size: 24px
- Label: 12px, Medium weight

**Tab States:**
```css
/* Active */
icon-color: #1B4F72;
label-color: #1B4F72;
font-weight: 600;

/* Inactive */
icon-color: #6C757D;
label-color: #6C757D;
font-weight: 400;
```

**Badge Support:**
- Red notification badges for urgent items
- Number badges for counts (messages, pending visits)
- Maximum 99+ display for large numbers

### Header Navigation
**Usage:** Screen-level navigation, contextual actions

**Specifications:**
- Height: 56px (mobile) / 64px (tablet/desktop)
- Background: `#1B4F72`
- Status bar consideration: Extends into safe area on iOS
- Back button: 24px arrow icon, 44px touch target
- Title: 18px, Semi-Bold, white text, center-aligned
- Actions: Maximum 2 icons, 24px size, 44px touch targets

### Breadcrumb Navigation
**Usage:** Deep navigation paths, complex workflows

**Specifications:**
- Font: 14px, Regular
- Separator: Chevron right (8px)
- Current page: Semi-Bold, primary color
- Previous pages: Regular weight, with hover states
- Mobile: Show only current + 1 previous level

## Healthcare-Specific Components

## Vital Signs Input

### Blood Pressure Input
**Usage:** Systolic and diastolic blood pressure entry

**Specifications:**
- Dual number inputs: [Systolic] / [Diastolic]
- Input width: 80px each
- Separator: Forward slash (/)
- Unit label: "mmHg" positioned right
- Validation: Systolic 80-250, Diastolic 40-150
- Color coding: Normal (green), High (yellow), Critical (red)

```html
<div class="bp-input-group">
  <input type="number" placeholder="120" min="80" max="250" />
  <span class="separator">/</span>
  <input type="number" placeholder="80" min="40" max="150" />
  <span class="unit">mmHg</span>
  <span class="status-indicator normal"></span>
</div>
```

### Temperature Input
**Usage:** Body temperature with unit conversion

**Specifications:**
- Number input with unit toggle (°F/°C)
- Validation ranges: 95-110°F or 35-43°C
- Color coding for fever detection
- Voice input friendly ("ninety-eight point six")

### Pain Scale Input
**Usage:** Patient pain assessment (0-10 scale)

**Specifications:**
- Visual scale with emoji indicators
- Large touch targets (48px) for each number
- Color gradient from green (0) to red (10)
- Descriptive labels: None, Mild, Moderate, Severe

```
😊   😐   😐   😟   😟   😣   😣   😰   😰   😫   😫
0    1    2    3    4    5    6    7    8    9    10
None      Mild      Moderate      Severe
```

## Status Indicators

### Health Status Indicator
**Usage:** Patient condition status, vital sign ranges

**Specifications:**
- Circle indicator: 12px diameter
- Colors: Green (normal), Yellow (attention), Red (critical)
- Pulse animation for critical status
- Tooltip on hover with explanation

```css
.status-normal { background: #239B56; }
.status-attention { background: #DC7633; animation: pulse 2s infinite; }
.status-critical { background: #CB4335; animation: pulse 1s infinite; }
```

### Sync Status Indicator
**Usage:** Data synchronization status, offline mode

**Specifications:**
- Position: Top right of screen, consistent placement
- States: Online (green dot), Syncing (animated), Offline (gray), Error (red)
- Click to show detailed sync information
- Automatic status updates

### Visit Progress Indicator
**Usage:** Documentation completion tracking

**Specifications:**
- Progress bar or step indicator
- Current step highlighted
- Completed steps with checkmarks
- Remaining steps in muted color
- Percentage complete for complex forms

## Component Accessibility Guidelines

### Screen Reader Support
- All components include proper ARIA labels
- Interactive elements have accessible names
- State changes announced to screen readers
- Heading hierarchy properly structured

### Keyboard Navigation
- Tab order follows visual flow
- Enter/Space activate buttons and selections
- Arrow keys navigate option groups
- Escape key closes modals and dropdowns

### Voice Control
- Voice-friendly naming conventions
- "Button", "Link", "Input" suffixes where helpful
- Consistent vocabulary across similar components
- Voice activation phrases documented

### Motor Accessibility
- Minimum touch targets: 44px × 44px
- Adequate spacing between interactive elements
- Alternative input methods (voice, head tracking)
- Timeout extensions for complex forms

## Implementation Guidelines

### React/React Native Implementation
```jsx
// Example: Primary Button Component
const PrimaryButton = ({
  children,
  onPress,
  disabled = false,
  loading = false,
  size = 'default',
  fullWidth = false
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.primaryButton,
        size === 'large' && styles.large,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading
      }}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};
```

### CSS/Styled Components
```css
/* Base component styles */
.primary-button {
  background-color: var(--primary-blue);
  color: var(--white);
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  min-height: 44px;
  transition: all 0.15s ease-in-out;
}

.primary-button:hover:not(:disabled) {
  background-color: var(--primary-blue-hover);
  transform: translateY(-1px);
}

.primary-button:disabled {
  background-color: var(--neutral-300);
  color: var(--neutral-500);
  cursor: not-allowed;
}
```

### Testing Guidelines
- **Unit Tests:** Component rendering, prop handling, state management
- **Integration Tests:** Form validation, navigation flows, data submission
- **Accessibility Tests:** Screen reader compatibility, keyboard navigation
- **Visual Tests:** Cross-browser consistency, responsive behavior
- **Performance Tests:** Rendering speed, memory usage, battery impact

---

*This component library ensures consistent, accessible, and healthcare-appropriate user interfaces across all BerthCare platforms.*