# BerthCare Accessibility Guidelines

## Overview

BerthCare is designed to be accessible to all healthcare providers and family members, regardless of ability. Our accessibility guidelines ensure compliance with WCAG 2.1 AA standards while addressing the unique needs of healthcare environments where users may have temporary or permanent disabilities, work in challenging conditions, or need to multitask during critical patient care.

## Healthcare Accessibility Context

### Unique Challenges in Healthcare Settings
- **Glove Usage:** Healthcare providers often wear gloves, affecting touch sensitivity
- **Environmental Conditions:** Bright sunlight, dim lighting, noisy environments
- **Multitasking:** Users may be managing medical equipment while using the app
- **Time Pressure:** Critical situations require quick, error-free interactions
- **Diverse User Base:** Wide age range and varying technology comfort levels

### Regulatory Requirements
- **WCAG 2.1 AA Compliance:** All digital interfaces meet accessibility standards
- **Section 508 Compliance:** Government healthcare systems requirements
- **Canadian Accessibility Standards:** Provincial healthcare accessibility laws
- **HIPAA Compliance:** Accessibility features must maintain patient privacy

## Accessibility Standards by Category

## Visual Accessibility

### Color and Contrast
**WCAG 2.1 AA Requirements:**
- Normal text: 4.5:1 contrast ratio minimum
- Large text (18pt+ or 14pt+ bold): 3.0:1 contrast ratio minimum
- Interactive elements: 4.5:1 contrast ratio minimum

**BerthCare Implementation:**
```css
/* Primary text on white background */
color: #212529; /* Contrast ratio: 16.7:1 */

/* Secondary text on white background */
color: #495057; /* Contrast ratio: 9.5:1 */

/* Primary button */
background: #1B4F72; /* Contrast ratio: 6.2:1 with white text */

/* Error text */
color: #CB4335; /* Contrast ratio: 5.1:1 on white background */

/* Success text */
color: #239B56; /* Contrast ratio: 4.8:1 on white background */
```

### Color Independence
**Requirement:** Information cannot be conveyed by color alone

**Implementation:**
- Status indicators use color + icons + text labels
- Form validation uses color + icons + descriptive text
- Charts include patterns/textures in addition to colors
- Navigation uses icons + text labels, not just color highlighting

**Examples:**
```html
<!-- Good: Multiple indicators -->
<div class="status-critical">
  <span class="icon-warning" aria-hidden="true">⚠️</span>
  <span class="status-text">Critical - Immediate Attention Required</span>
</div>

<!-- Bad: Color only -->
<div class="status-critical-red">
  Critical
</div>
```

### Font Size and Scaling
**Requirements:**
- Support up to 200% zoom without horizontal scrolling
- Minimum 16px font size for body text
- Scalable fonts that work with system accessibility settings

**Implementation:**
- Base font size: 16px (mobile), 16px (desktop)
- Relative units (rem, em) for all text sizing
- Responsive typography scales appropriately
- Touch targets maintain 44px minimum at all zoom levels

### High Contrast Mode Support
**Requirements:**
- Works with system high contrast settings
- Custom high contrast mode available in app

**Implementation:**
```css
@media (prefers-contrast: high) {
  .button-primary {
    background: #000000;
    color: #FFFFFF;
    border: 2px solid #FFFFFF;
  }

  .card {
    background: #FFFFFF;
    border: 2px solid #000000;
  }
}

/* Custom high contrast theme */
.theme-high-contrast {
  --color-text: #000000;
  --color-background: #FFFFFF;
  --color-border: #000000;
  --color-link: #0000FF;
  --color-error: #CC0000;
}
```

## Motor Accessibility

### Touch Targets
**WCAG 2.1 AA Requirements:**
- Minimum 44px × 44px touch targets
- 8px minimum spacing between targets

**Healthcare Enhancement:**
- **Glove-Friendly:** All targets 44px minimum, 48px preferred
- **One-Handed Operation:** Important functions accessible with thumb reach
- **Pressure Sensitivity:** Works with light touches (important for elderly users)

**Implementation:**
```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  margin: 4px; /* Ensures 8px spacing */
  padding: 12px;
}

.touch-target-large {
  min-height: 56px;
  min-width: 56px;
  margin: 6px; /* Ensures 12px spacing */
}

/* Primary actions get larger targets */
.button-primary {
  min-height: 48px;
  padding: 16px 24px;
}
```

### Keyboard Navigation
**Requirements:**
- Full keyboard accessibility
- Logical tab order
- Visible focus indicators

**Healthcare Considerations:**
- **Voice Control Compatible:** Works with Dragon NaturallySpeaking and similar
- **Switch Control:** Compatible with assistive switching devices
- **Keyboard Shortcuts:** Power user shortcuts for common tasks

**Implementation:**
```css
/* Visible focus indicators */
.focusable:focus {
  outline: 3px solid #1B4F72;
  outline-offset: 2px;
  box-shadow: 0 0 0 1px #FFFFFF;
}

/* Skip navigation for screen readers */
.skip-nav {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #1B4F72;
  color: #FFFFFF;
  padding: 8px;
  text-decoration: none;
  z-index: 1000;
}

.skip-nav:focus {
  top: 6px;
}
```

**Keyboard Shortcuts:**
- `Tab` / `Shift+Tab`: Navigate between elements
- `Enter` / `Space`: Activate buttons and links
- `Escape`: Close modals, cancel actions
- `Arrow Keys`: Navigate within component groups
- `Home` / `End`: Jump to first/last item in lists
- `Ctrl+S`: Save current form (where applicable)

### Gesture Alternatives
**Requirements:**
- All swipe gestures have button alternatives
- Complex gestures have simple alternatives
- Drag-and-drop has keyboard alternatives

**Implementation:**
```html
<!-- Swipe to delete with button alternative -->
<div class="patient-card">
  <div class="card-content">
    <!-- Patient information -->
  </div>
  <div class="card-actions">
    <button class="button-icon" aria-label="More options">
      <span class="icon-more" aria-hidden="true">⋯</span>
    </button>
  </div>
</div>
```

## Cognitive Accessibility

### Clear Language and Instructions
**Requirements:**
- Plain language for all user-facing text
- Medical terminology explained when necessary
- Clear error messages with resolution steps

**Healthcare Implementation:**
- **Jargon-Free Interface:** Technical terms explained in context
- **Progressive Disclosure:** Complex information revealed gradually
- **Consistent Terminology:** Same words for same concepts throughout app

**Examples:**
```html
<!-- Good: Clear, plain language -->
<label for="blood-pressure">
  Blood Pressure
  <span class="help-text">Enter as top number / bottom number (e.g., 120/80)</span>
</label>

<!-- Good: Error with solution -->
<div class="error-message" role="alert">
  <strong>Blood pressure reading seems high</strong>
  Please double-check the numbers and note if patient needs immediate care.
</div>
```

### Consistent Navigation
**Requirements:**
- Same navigation patterns throughout app
- Predictable page layouts
- Breadcrumb navigation for complex flows

**Implementation:**
- **Fixed Navigation:** Bottom tab bar always in same position
- **Consistent Icons:** Same icon always means same thing
- **Predictable Layouts:** Patient cards always have same information order

### Error Prevention
**Requirements:**
- Validation before form submission
- Confirmation for destructive actions
- Recovery from errors

**Healthcare Enhancement:**
- **Medical Validation:** Check for reasonable vital sign ranges
- **Double-Confirmation:** Critical actions require two-step confirmation
- **Auto-Save:** Prevent data loss during interruptions

```html
<!-- Validation with helpful guidance -->
<input
  type="number"
  id="temperature"
  min="95"
  max="110"
  step="0.1"
  aria-describedby="temp-help temp-error"
>
<div id="temp-help" class="help-text">
  Normal range: 97.0°F - 99.5°F
</div>
<div id="temp-error" class="error-text" role="alert" hidden>
  Temperature seems unusually high. Please verify reading.
</div>
```

### Timeout Extensions
**Requirements:**
- Session timeouts have warnings
- Users can extend timeouts
- Critical processes don't timeout

**Healthcare Implementation:**
- **Visit Documentation:** No timeout during active patient visits
- **Warning System:** 5-minute warning before timeout
- **Emergency Override:** Critical alerts never timeout

## Auditory Accessibility

### Screen Reader Support
**Requirements:**
- All content accessible via screen reader
- Proper heading structure
- Descriptive link text
- Form labels and instructions

**Implementation:**
```html
<!-- Proper heading hierarchy -->
<h1>Patient Dashboard</h1>
<h2>Today's Visits</h2>
<h3>Margaret Thompson, 78</h3>

<!-- Descriptive link text -->
<a href="/patient/123/visit/456">
  View visit details for Margaret Thompson, March 15, 2024
</a>

<!-- Form labels and descriptions -->
<label for="medication-name">
  Medication Name
  <span class="required" aria-label="required">*</span>
</label>
<input
  type="text"
  id="medication-name"
  aria-describedby="med-help"
  required
>
<div id="med-help" class="help-text">
  Enter the generic or brand name of the medication
</div>
```

### ARIA Implementation
**Critical ARIA Patterns:**

```html
<!-- Loading states -->
<button aria-busy="true" aria-describedby="loading-text">
  Submit Visit
</button>
<div id="loading-text" class="sr-only">
  Uploading visit data, please wait...
</div>

<!-- Live regions for status updates -->
<div
  id="status-region"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
></div>

<!-- Modal dialogs -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Visit Submission</h2>
  <p id="modal-description">
    This will submit your visit documentation and cannot be undone.
  </p>
</div>

<!-- Data tables -->
<table role="table" aria-label="Patient Vital Signs History">
  <caption>Blood pressure readings from past 30 days</caption>
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">Systolic</th>
      <th scope="col">Diastolic</th>
      <th scope="col">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>March 15, 2024</td>
      <td>138</td>
      <td>82</td>
      <td>Patient reported feeling normal</td>
    </tr>
  </tbody>
</table>
```

### Alternative Audio Cues
**Requirements:**
- Visual alerts have audio alternatives
- Optional audio feedback for actions

**Healthcare Implementation:**
- **Emergency Alerts:** Critical notifications include audio alerts
- **Completion Sounds:** Subtle audio confirmation for completed tasks
- **Voice Guidance:** Optional voice prompts for complex procedures

## Voice and Speech Accessibility

### Voice Input Support
**Requirements:**
- Voice-to-text functionality
- Voice navigation capabilities
- Speech recognition optimization

**Healthcare Implementation:**
- **Medical Vocabulary:** Trained on healthcare terminology
- **Noise Cancellation:** Works in noisy hospital/home environments
- **Hands-Free Operation:** Complete voice control for infection control

```html
<!-- Voice input interface -->
<div class="voice-input-container">
  <button
    class="voice-input-trigger"
    aria-label="Start voice input"
    data-voice-target="visit-notes"
  >
    <span class="icon-microphone" aria-hidden="true">🎤</span>
    <span class="button-text">Voice Input</span>
  </button>
  <div class="voice-status" aria-live="polite" aria-atomic="true">
    <!-- Dynamic status updates -->
  </div>
</div>

<textarea
  id="visit-notes"
  aria-label="Visit notes"
  aria-describedby="voice-help"
></textarea>

<div id="voice-help" class="help-text">
  Click the microphone button or say "Start dictation" to begin voice input
</div>
```

### Speech Output
**Requirements:**
- Screen reader compatibility
- Optional audio feedback
- Customizable speech rates

**Implementation:**
- **Critical Information:** Important alerts read aloud automatically
- **Status Updates:** Sync status, completion confirmations spoken
- **User Control:** Users can adjust or disable speech output

## Platform-Specific Accessibility

### iOS Accessibility
**VoiceOver Support:**
```swift
// VoiceOver labels and hints
button.accessibilityLabel = "Submit Visit Documentation"
button.accessibilityHint = "Saves all visit data and marks visit as complete"
button.accessibilityTraits = .button

// Custom rotor support for medical data
let vitalsRotor = UIAccessibilityCustomRotor(name: "Vital Signs") { predicate in
    // Implementation for navigating between vital sign fields
}

// Dynamic type support
label.font = UIFont.preferredFont(forTextStyle: .body)
label.adjustsFontForContentSizeCategory = true
```

**Switch Control Support:**
- All interactive elements have appropriate accessibility traits
- Complex gestures provide switch-accessible alternatives
- Scanning order optimized for medical workflows

### Android Accessibility
**TalkBack Support:**
```kotlin
// Content descriptions and hints
button.contentDescription = "Submit Visit Documentation"
button.setAccessibilityDelegate(object : AccessibilityDelegate() {
    override fun onInitializeAccessibilityNodeInfo(
        host: View,
        info: AccessibilityNodeInfo
    ) {
        super.onInitializeAccessibilityNodeInfo(host, info)
        info.addAction(
            AccessibilityNodeInfo.AccessibilityAction(
                AccessibilityNodeInfo.ACTION_CLICK,
                "Submit visit and mark as complete"
            )
        )
    }
})

// Live region announcements
announceForAccessibility("Visit documentation saved successfully")
```

### Web Accessibility
**WCAG 2.1 AA Implementation:**
```html
<!-- Semantic HTML structure -->
<main role="main" aria-labelledby="page-title">
  <h1 id="page-title">Visit Documentation</h1>

  <form aria-label="Patient visit form" novalidate>
    <fieldset>
      <legend>Vital Signs</legend>
      <!-- Form fields -->
    </fieldset>
  </form>
</main>

<!-- Focus management -->
<script>
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  const firstFocusable = modal.querySelector('button, input, select, textarea');

  modal.setAttribute('aria-hidden', 'false');
  firstFocusable.focus();

  // Trap focus within modal
  trapFocus(modal);
}
</script>
```

## Testing and Validation

### Automated Testing Tools
- **axe-core:** Automated accessibility testing
- **WAVE:** Web accessibility evaluation
- **Lighthouse:** Performance and accessibility audits
- **Color Oracle:** Color blindness simulation

### Manual Testing Process

**Screen Reader Testing:**
1. Navigate entire app using only screen reader
2. Verify all content is announced correctly
3. Test form completion and submission
4. Validate error handling and recovery

**Keyboard Testing:**
1. Navigate using only keyboard
2. Verify tab order is logical
3. Test all interactive elements
4. Validate focus management in modals

**Mobile Accessibility Testing:**
1. Test with VoiceOver (iOS) and TalkBack (Android)
2. Verify switch control functionality
3. Test with external keyboard
4. Validate voice control integration

**Real User Testing:**
- Healthcare providers with disabilities
- Users of various assistive technologies
- Different age groups and tech comfort levels
- Testing in actual healthcare environments

### Accessibility Checklist

**Pre-Launch Checklist:**
- [ ] All images have descriptive alt text
- [ ] Forms have proper labels and instructions
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible and consistent
- [ ] Keyboard navigation is complete and logical
- [ ] Screen reader testing completed successfully
- [ ] Error messages are descriptive and helpful
- [ ] Timeout warnings and extensions implemented
- [ ] Voice input tested with medical terminology
- [ ] High contrast mode support verified

**Ongoing Monitoring:**
- Monthly automated accessibility scans
- Quarterly user testing with disabled healthcare providers
- Annual comprehensive accessibility audit
- Continuous monitoring of user feedback and support tickets

## Accessibility Documentation for Developers

### Implementation Standards
```typescript
// Type definitions for accessibility props
interface AccessibilityProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityActions?: Array<{
    name: string;
    label: string;
  }>;
}

// Standard accessibility component
const AccessibleButton: React.FC<ButtonProps & AccessibilityProps> = ({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled,
  ...props
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};
```

### Code Review Guidelines
- All interactive elements must have accessibility labels
- Forms must include proper validation and error handling
- Color cannot be the only way to convey information
- Focus management must be implemented for modals and dynamic content
- Live regions must be used for dynamic status updates

---

*These accessibility guidelines ensure that BerthCare serves all healthcare providers and family members effectively, regardless of their abilities or the challenging conditions they may be working in.*