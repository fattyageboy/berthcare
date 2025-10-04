# Component Specifications Quick Reference

## Button

### Dimensions
- **Height**: 48px minimum (Android), 44px (iOS)
- **Padding**: 16px vertical, 24px horizontal
- **Border Radius**: 8px
- **Font**: 14px, Medium weight

### Variants

#### Primary
```
Background: #1B4F72 (Primary Blue)
Text: #FFFFFF (White)
Hover: #2E6B9E
Disabled: #ADB5BD background, #6C757D text
```

#### Secondary
```
Background: #FFFFFF (White)
Border: 2px solid #1B4F72
Text: #1B4F72
Hover: #F8F9FA background
Disabled: #ADB5BD border, #ADB5BD text
```

#### Text
```
Background: Transparent
Text: #1B4F72, underlined
Padding: 8px vertical, 16px horizontal
Disabled: #ADB5BD text
```

---

## Input

### Dimensions
- **Height**: 44px minimum
- **Padding**: 16px vertical, 16px horizontal
- **Border Radius**: 6px
- **Font**: 14px, Regular weight

### States

#### Default
```
Border: 1px solid #DEE2E6
Background: #FFFFFF
Text: #212529
```

#### Focused
```
Border: 2px solid #1B4F72
Background: #FFFFFF
Text: #212529
```

#### Error
```
Border: 2px solid #CB4335
Background: #FFFFFF
Text: #212529
Error Text: #CB4335, 12px
```

#### Disabled
```
Border: 1px solid #DEE2E6
Background: #E9ECEF
Text: #ADB5BD
```

### Label
```
Font: 14px, Medium weight
Color: #495057
Margin Bottom: 4px
Required Indicator: * in #CB4335
```

### Helper Text
```
Font: 12px, Regular weight
Color: #6C757D
Margin Top: 4px
```

---

## Card

### Dimensions
- **Padding**: 16px (mobile), 24px (desktop)
- **Border Radius**: 12px
- **Border**: 1px solid #E9ECEF

### Shadow
```
iOS:
  shadowColor: #000
  shadowOffset: { width: 0, height: 2 }
  shadowOpacity: 0.1
  shadowRadius: 8

Android:
  elevation: 2
```

### Colors
```
Background: #FFFFFF
Border: #E9ECEF
```

### Interactive State
```
activeOpacity: 0.8 (when onPress provided)
```

---

## Header

### Dimensions
- **Height**: 56px (mobile), 64px (desktop)
- **Safe Area**: Platform-specific (iOS notch, Android status bar)
- **Icon Buttons**: 44px × 44px touch targets

### Colors
```
Background: #1B4F72 (Primary Blue)
Title: #FFFFFF, 18px, Semi-Bold
Icons: #FFFFFF, 24px
```

### Layout
```
Left Section: 44px width (back button or spacer)
Center Section: Flex 1 (title, centered)
Right Section: 44px width (action or spacer)
Padding: 8px horizontal
```

---

## Accessibility Requirements

### Touch Targets
- **Minimum**: 44px × 44px (iOS)
- **Preferred**: 48px × 48px (Android)
- **Spacing**: 8px minimum between targets

### Contrast Ratios (WCAG AA)
- **Normal Text**: 4.5:1 minimum
- **Large Text**: 3.0:1 minimum
- **Interactive Elements**: 4.5:1 minimum

### Screen Reader Support
- All interactive elements have `accessibilityRole`
- All components have `accessibilityLabel`
- Error states use `accessibilityLiveRegion="polite"`
- Loading states announce via `accessibilityState={{ busy: true }}`

### Color Independence
- Status never conveyed by color alone
- Icons + text labels for all states
- Error states: red border + error icon + error text
- Success states: green border + checkmark + success text

---

## Design Token Usage

### Colors
```typescript
import { colors } from '@/theme';

colors.primary.main        // #1B4F72
colors.success.main        // #239B56
colors.error.main          // #CB4335
colors.warning.main        // #DC7633
colors.text.primary        // #212529
colors.text.secondary      // #495057
colors.text.tertiary       // #6C757D
colors.text.disabled       // #ADB5BD
colors.background.primary  // #FFFFFF
colors.background.secondary // #F8F9FA
colors.background.tertiary // #E9ECEF
colors.background.border   // #DEE2E6
```

### Typography
```typescript
import { typography } from '@/theme';

typography.mobile.h1       // 28px/34px, Semi-Bold
typography.mobile.h2       // 24px/30px, Semi-Bold
typography.mobile.h3       // 20px/26px, Medium
typography.mobile.h4       // 18px/24px, Medium
typography.mobile.bodyLarge // 16px/24px, Regular
typography.mobile.body     // 14px/20px, Regular
typography.mobile.bodySmall // 12px/18px, Regular
typography.mobile.label    // 14px/20px, Medium
```

### Spacing
```typescript
import { spacing } from '@/theme';

spacing.xs    // 4px
spacing.sm    // 8px
spacing.md    // 16px
spacing.lg    // 24px
spacing.xl    // 32px
spacing.xxl   // 48px
spacing.xxxl  // 64px
```

---

## Component Composition Examples

### Form Layout
```tsx
<Card>
  <Input
    label="Patient Name"
    value={name}
    onChangeText={setName}
    required
  />
  <Input
    label="Blood Pressure"
    value={bp}
    onChangeText={setBp}
    helperText="Enter as systolic/diastolic"
  />
  <Button onPress={handleSubmit} fullWidth>
    Submit
  </Button>
</Card>
```

### Screen Layout
```tsx
<View style={{ flex: 1 }}>
  <Header
    title="Patient Details"
    showBackButton
    onBackPress={goBack}
  />
  <ScrollView>
    <Card onPress={() => navigate('Visit')}>
      <Text>Visit Information</Text>
    </Card>
    <Card onPress={() => navigate('Medications')}>
      <Text>Medications</Text>
    </Card>
  </ScrollView>
</View>
```

### Action Group
```tsx
<View style={{ flexDirection: 'row', gap: 16 }}>
  <Button
    variant="secondary"
    onPress={handleCancel}
    style={{ flex: 1 }}
  >
    Cancel
  </Button>
  <Button
    onPress={handleSave}
    style={{ flex: 1 }}
  >
    Save
  </Button>
</View>
```

---

## Testing Checklist

### Visual Testing
- [ ] Component renders with correct dimensions
- [ ] Colors match design tokens exactly
- [ ] Typography scales correctly
- [ ] Spacing follows 8px grid
- [ ] Shadows/elevation visible on both platforms

### Interaction Testing
- [ ] Touch targets are 44px minimum
- [ ] Hover states work (web/desktop)
- [ ] Press feedback is visible
- [ ] Disabled state prevents interaction
- [ ] Loading state shows spinner

### Accessibility Testing
- [ ] Screen reader announces component correctly
- [ ] Focus indicators are visible
- [ ] Error messages are announced
- [ ] Required fields are indicated
- [ ] Color contrast meets WCAG AA

### Platform Testing
- [ ] iOS safe area handled correctly
- [ ] Android elevation renders properly
- [ ] Status bar color appropriate
- [ ] Keyboard behavior correct
- [ ] Orientation changes handled

---

## Performance Considerations

### Optimization Tips
- Use `React.memo()` for components that receive stable props
- Avoid inline styles in render methods
- Use `useCallback` for event handlers passed to children
- Implement `shouldComponentUpdate` for complex cards
- Lazy load heavy components with `React.lazy()`

### Bundle Size
- All components use React Native core (no external deps)
- Total component library: ~15KB minified
- Tree-shakeable via barrel exports
- No runtime dependencies beyond React Native

---

## Migration Guide

### From Custom Components
```tsx
// Before
<TouchableOpacity style={customButtonStyle} onPress={handlePress}>
  <Text style={customTextStyle}>Submit</Text>
</TouchableOpacity>

// After
<Button onPress={handlePress}>Submit</Button>
```

### From Third-Party Libraries
```tsx
// Before (react-native-elements)
<Button title="Submit" onPress={handlePress} />

// After
<Button onPress={handlePress}>Submit</Button>
```

### Adding Custom Styles
```tsx
// Extend with custom styles
<Card style={{ marginBottom: 24, padding: 32 }}>
  <Text>Custom styled card</Text>
</Card>

// Compose with other components
<Card>
  <Input label="Name" />
  <Button fullWidth>Submit</Button>
</Card>
```
