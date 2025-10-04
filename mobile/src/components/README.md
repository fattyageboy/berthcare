# BerthCare Component Library

Reusable UI components built according to the design system specifications in `design-documentation/design-system/style-guide.md` (lines 145-223).

## Components

### Button

A versatile button component with three variants and full accessibility support.

**Props:**
- `children` (string, required) - Button text
- `onPress` (function, required) - Press handler
- `variant` ('primary' | 'secondary' | 'text') - Button style variant (default: 'primary')
- `disabled` (boolean) - Disable button interaction
- `loading` (boolean) - Show loading spinner
- `fullWidth` (boolean) - Expand to full container width
- `accessibilityLabel` (string) - Custom accessibility label
- `accessibilityHint` (string) - Accessibility hint for screen readers
- `testID` (string) - Test identifier

**Variants:**
- **Primary**: Solid background, white text - for main actions
- **Secondary**: White background, bordered - for secondary actions
- **Text**: Transparent background, underlined text - for tertiary actions

**Accessibility:**
- Minimum 48px touch target (Android standard)
- WCAG AA contrast ratios maintained
- Screen reader support with role="button"
- Loading state announced to assistive technologies
- Disabled state properly communicated

**Usage:**
```tsx
import { Button } from '@/components';

// Primary button
<Button onPress={handleSubmit} fullWidth>
  Submit Visit
</Button>

// Secondary button
<Button variant="secondary" onPress={handleCancel}>
  Cancel
</Button>

// Loading state
<Button loading onPress={handleSave}>
  Saving...
</Button>

// Disabled state
<Button disabled onPress={() => {}}>
  Not Available
</Button>
```

---

### Input

A text input component with label, helper text, error states, and full accessibility support.

**Props:**
- `label` (string) - Input label text
- `helperText` (string) - Helper text below input
- `errorText` (string) - Error message (shows in red, hides helperText)
- `required` (boolean) - Show required asterisk
- `disabled` (boolean) - Disable input
- `accessibilityLabel` (string) - Custom accessibility label
- `accessibilityHint` (string) - Accessibility hint
- `testID` (string) - Test identifier
- All standard React Native `TextInput` props

**States:**
- **Default**: Gray border
- **Focused**: Blue border (2px)
- **Error**: Red border (2px) with error message
- **Disabled**: Gray background, disabled text color

**Accessibility:**
- Minimum 44px touch target (iOS standard)
- Proper label association
- Error messages announced as alerts
- Helper text linked via accessibilityDescribedBy
- Required fields indicated visually and for screen readers

**Usage:**
```tsx
import { Input } from '@/components';

// Basic input
<Input
  label="Patient Name"
  placeholder="Enter full name"
  value={name}
  onChangeText={setName}
/>

// Required field with helper text
<Input
  label="Blood Pressure"
  placeholder="120/80"
  value={bloodPressure}
  onChangeText={setBloodPressure}
  required
  helperText="Enter as systolic/diastolic"
/>

// Error state
<Input
  label="Temperature"
  value={temperature}
  onChangeText={setTemperature}
  errorText="Temperature must be between 95°F and 110°F"
/>

// Disabled input
<Input
  label="Medical Record Number"
  value={mrn}
  disabled
/>
```

---

### Card

A container component with elevation/shadow and optional press interaction.

**Props:**
- `children` (ReactNode, required) - Card content
- `onPress` (function) - Makes card interactive when provided
- `style` (ViewStyle) - Additional styles
- `accessibilityLabel` (string) - Accessibility label
- `accessibilityHint` (string) - Accessibility hint
- `accessibilityRole` ('none' | 'button') - Override default role
- `testID` (string) - Test identifier

**Features:**
- 12px border radius
- Subtle shadow (iOS) and elevation (Android)
- 16px padding (mobile)
- White background with light border
- Interactive variant with TouchableOpacity when onPress provided

**Accessibility:**
- Automatically sets role="button" when interactive
- Touch feedback with activeOpacity
- Proper accessibility labels for screen readers

**Usage:**
```tsx
import { Card } from '@/components';

// Static card
<Card>
  <Text>Patient Information</Text>
  <Text>John Doe, Age 65</Text>
</Card>

// Interactive card
<Card
  onPress={() => navigateToPatient(patient.id)}
  accessibilityLabel={`Patient card for ${patient.name}`}
  accessibilityHint="Tap to view patient details"
>
  <Text>{patient.name}</Text>
  <Text>{patient.condition}</Text>
</Card>

// Custom styling
<Card style={{ marginBottom: 16, padding: 24 }}>
  <Text>Custom styled card</Text>
</Card>
```

---

### Header

A navigation header component with title, back button, and optional right action.

**Props:**
- `title` (string, required) - Header title text
- `showBackButton` (boolean) - Show back arrow button
- `onBackPress` (function) - Back button press handler
- `rightAction` (object) - Right side action button configuration
  - `icon` (ReactNode) - Icon component
  - `onPress` (function) - Press handler
  - `accessibilityLabel` (string) - Accessibility label
  - `accessibilityHint` (string) - Accessibility hint
- `accessibilityLabel` (string) - Custom title accessibility label
- `testID` (string) - Test identifier

**Features:**
- 56px height (mobile)
- Primary blue background
- White text and icons
- Safe area handling for iOS notch/status bar
- 44px minimum touch targets for all buttons
- Centered title with balanced left/right sections

**Accessibility:**
- Header role for title
- Button roles for interactive elements
- Descriptive labels for navigation actions
- Proper touch target sizes

**Usage:**
```tsx
import { Header } from '@/components';

// Simple header
<Header title="Patient Dashboard" />

// With back button
<Header
  title="Visit Details"
  showBackButton
  onBackPress={() => navigation.goBack()}
/>

// With right action
<Header
  title="Edit Profile"
  showBackButton
  onBackPress={() => navigation.goBack()}
  rightAction={{
    icon: <SaveIcon />,
    onPress: handleSave,
    accessibilityLabel: "Save changes",
    accessibilityHint: "Save profile updates"
  }}
/>
```

---

## Design System Compliance

All components implement specifications from `design-documentation/design-system/style-guide.md`:

### Colors
- Primary actions: `#1B4F72`
- Success states: `#239B56`
- Error states: `#CB4335`
- Text colors: Primary `#212529`, Secondary `#495057`, Tertiary `#6C757D`
- Backgrounds: White `#FFFFFF`, Secondary `#F8F9FA`, Borders `#DEE2E6`

### Typography
- Mobile scale (14-28px)
- Font weights: Regular (400), Medium (500), Semi-Bold (600)
- Line heights: 1.4-1.6x font size

### Spacing
- 8px grid system
- Component padding: 16px (mobile)
- Touch targets: 44px minimum (iOS), 48px minimum (Android)

### Accessibility
- WCAG 2.1 AA contrast ratios (4.5:1 minimum)
- Proper ARIA roles and labels
- Screen reader support
- Keyboard navigation ready
- Touch target compliance

## Testing

Use the `ComponentDemo.tsx` file to see all components in action:

```tsx
import { ComponentDemo } from '@/components/ComponentDemo';

// In your navigation or App.tsx
<ComponentDemo />
```

## Architecture Reference

Components follow accessibility guidelines from `design-documentation/accessibility/README.md`:
- Color independence (icons + text, not color alone)
- Proper focus indicators
- Screen reader announcements
- Touch target sizing for glove usage
- High contrast mode support
