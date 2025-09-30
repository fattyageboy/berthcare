# Platform Adaptations and Responsive Design Specifications

## Overview

BerthCare is designed with a mobile-first approach but adapts seamlessly across all platforms while maintaining platform-specific conventions and optimal user experiences. Our responsive design ensures healthcare providers can access critical information and complete tasks efficiently regardless of their device.

## Platform Strategy

### Primary Platform: Mobile (iOS & Android)
- **Usage Context:** Point-of-care documentation during patient visits
- **Key Features:** Offline-first architecture, voice input, camera integration
- **Design Priority:** One-handed operation, glove-friendly interactions

### Secondary Platform: Web (Desktop & Tablet)
- **Usage Context:** Administrative tasks, family portal, supervisory functions
- **Key Features:** Multi-window workflows, detailed reporting, team management
- **Design Priority:** Information density, keyboard shortcuts, multi-tasking

### Platform-Specific Considerations
- **iOS:** Human Interface Guidelines, SF Symbols, Safe Area handling
- **Android:** Material Design principles, Android navigation patterns
- **Web:** Progressive enhancement, cross-browser compatibility

---

## Responsive Breakpoints

### Mobile-First Breakpoint Strategy

```css
/* Mobile First (Base) */
/* 320px - 575px */
.container {
  padding: 16px;
  max-width: 100%;
}

/* Small devices (landscape phones) */
@media (min-width: 576px) {
  .container {
    padding: 20px;
    max-width: 540px;
  }
}

/* Medium devices (tablets) */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    max-width: 720px;
  }
}

/* Large devices (desktops) */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
    max-width: 960px;
  }
}

/* Extra large devices */
@media (min-width: 1200px) {
  .container {
    padding: 40px;
    max-width: 1140px;
  }
}
```

### Healthcare-Specific Breakpoints

```css
/* Healthcare device considerations */
@media (max-width: 320px) {
  /* Older smartphones, small devices */
  .touch-target {
    min-height: 48px; /* Larger for smaller screens */
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  /* Medical tablets, bedside devices */
  .layout-clinical {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
}

@media (min-width: 1024px) {
  /* Desktop workstations, administrative interfaces */
  .layout-dashboard {
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-template-areas: "sidebar main";
  }
}
```

---

## iOS Platform Adaptations

### Design System Integration

**Typography:**
```css
.text-ios {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* iOS Dynamic Type Support */
.text-body {
  font: -apple-system-body;
  font-size: 17px; /* iOS default body size */
}

.text-headline {
  font: -apple-system-headline;
  font-size: 28px;
  font-weight: 600;
}
```

**Navigation Patterns:**
```css
/* iOS Navigation Bar */
.navbar-ios {
  height: 44px;
  background: #1B4F72;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.navbar-ios .title {
  font-size: 17px;
  font-weight: 600;
  color: white;
  text-align: center;
}

.navbar-ios .back-button {
  font-size: 17px;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* iOS Tab Bar */
.tabbar-ios {
  height: 83px; /* 49px + 34px safe area */
  background: white;
  border-top: 0.5px solid #E5E5EA;
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-ios .tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tabbar-ios .tab-icon {
  width: 24px;
  height: 24px;
}

.tabbar-ios .tab-label {
  font-size: 10px;
  font-weight: 500;
}
```

**Safe Area Handling:**
```css
/* iPhone notch and home indicator support */
.screen-ios {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.modal-ios {
  margin-top: max(20px, env(safe-area-inset-top));
  border-radius: 13px 13px 0 0;
}
```

**iOS-Specific Interactions:**
```css
/* iOS button styles */
.button-ios {
  border-radius: 8px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.41px;
  transition: opacity 0.2s ease;
}

.button-ios:active {
  opacity: 0.6;
}

/* iOS form elements */
.input-ios {
  height: 44px;
  padding: 12px 16px;
  font-size: 17px;
  border: 1px solid #C7C7CC;
  border-radius: 8px;
  background: white;
}

.input-ios:focus {
  border-color: #1B4F72;
  box-shadow: 0 0 0 1px #1B4F72;
}
```

### iOS Healthcare Optimizations

```css
/* Large text accessibility */
@media (prefers-reduced-motion: reduce) {
  .animation-ios {
    animation: none;
    transition: none;
  }
}

/* iOS haptic feedback triggers */
.haptic-light:active {
  /* Trigger light haptic feedback in JavaScript */
}

.haptic-medium:active {
  /* Trigger medium haptic feedback in JavaScript */
}
```

---

## Android Platform Adaptations

### Material Design Integration

**Typography:**
```css
.text-android {
  font-family: Roboto, -apple-system, BlinkMacSystemFont, sans-serif;
}

.text-android h1 {
  font-size: 24px;
  font-weight: 400;
  line-height: 32px;
}

.text-android .body1 {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0.15px;
}

.text-android .body2 {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.25px;
}
```

**Material Design Components:**
```css
/* Android App Bar */
.appbar-android {
  height: 56px;
  background: #1B4F72;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.14);
}

.appbar-android .title {
  font-size: 20px;
  font-weight: 500;
  color: white;
  margin-left: 16px;
}

/* Material Button */
.button-android {
  height: 36px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.75px;
  text-transform: uppercase;
  transition: all 0.2s ease;
}

.button-android.elevated {
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.14);
}

.button-android:hover {
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.14);
}

/* Material Card */
.card-android {
  border-radius: 4px;
  background: white;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.12);
  padding: 16px;
}

.card-android.elevated {
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.14);
}
```

**Android Navigation Patterns:**
```css
/* Bottom Navigation */
.bottom-nav-android {
  height: 56px;
  background: white;
  display: flex;
  box-shadow: 0px -1px 3px rgba(0, 0, 0, 0.12);
}

.bottom-nav-android .nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: color 0.2s ease;
}

.bottom-nav-android .nav-icon {
  width: 24px;
  height: 24px;
}

.bottom-nav-android .nav-label {
  font-size: 12px;
  font-weight: 500;
}
```

**Android-Specific Interactions:**
```css
/* Ripple effect */
.ripple-android {
  position: relative;
  overflow: hidden;
}

.ripple-android::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 70%);
  transform: scale(0);
  transition: transform 0.6s ease;
  pointer-events: none;
}

.ripple-android:active::before {
  transform: scale(1);
}
```

---

## Web Platform Adaptations

### Progressive Enhancement Strategy

**Base Mobile Experience:**
```css
/* Mobile-first base styles */
.layout-base {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 16px;
}

.sidebar {
  display: none; /* Hidden on mobile */
}
```

**Enhanced Desktop Experience:**
```css
/* Desktop enhancements */
@media (min-width: 1024px) {
  .layout-desktop {
    display: grid;
    grid-template-columns: 280px 1fr;
    grid-template-areas: "sidebar main";
    gap: 0;
  }

  .sidebar {
    display: block;
    grid-area: sidebar;
    background: #F8F9FA;
    border-right: 1px solid #E9ECEF;
    padding: 24px;
  }

  .main-content {
    grid-area: main;
    padding: 32px;
    max-width: 1200px;
  }
}
```

### Web-Specific Features

**Keyboard Navigation:**
```css
/* Focus management */
.focus-trap {
  position: relative;
}

.focus-visible {
  outline: 2px solid #1B4F72;
  outline-offset: 2px;
}

/* Skip navigation */
.skip-nav {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #1B4F72;
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-nav:focus {
  top: 6px;
}
```

**Print Styles:**
```css
@media print {
  .no-print {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }

  body {
    font-size: 12pt;
    line-height: 1.4;
  }

  .patient-card {
    break-inside: avoid;
    margin-bottom: 20pt;
  }

  .visit-summary {
    page-break-after: always;
  }
}
```

**Browser Compatibility:**
```css
/* Flexbox fallbacks */
.flex-container {
  display: flex;
  display: -webkit-flex;
  display: -ms-flexbox;
}

/* Grid fallbacks */
@supports not (display: grid) {
  .grid-container {
    display: flex;
    flex-wrap: wrap;
  }

  .grid-item {
    flex: 1 1 300px;
  }
}

/* CSS Custom Properties fallbacks */
:root {
  --primary-color: #1B4F72;
}

.primary-button {
  background-color: var(--primary-color, #1B4F72);
}
```

---

## Component Responsive Behavior

### Navigation Components

**Mobile Navigation (< 768px):**
```css
.navigation-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: white;
  border-top: 1px solid #E9ECEF;
  display: flex;
  z-index: 1000;
}

.nav-item-mobile {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #6C757D;
}

.nav-item-mobile.active {
  color: #1B4F72;
}
```

**Desktop Navigation (≥ 768px):**
```css
@media (min-width: 768px) {
  .navigation-mobile {
    position: static;
    height: auto;
    border-top: none;
    background: transparent;
    justify-content: flex-start;
    gap: 32px;
    padding: 0 24px;
  }

  .nav-item-mobile {
    flex: none;
    flex-direction: row;
    gap: 8px;
  }
}
```

### Form Components

**Mobile Forms:**
```css
.form-mobile {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group-mobile {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-mobile {
  height: 44px;
  padding: 12px 16px;
  font-size: 16px; /* Prevents zoom on iOS */
  border: 1px solid #DEE2E6;
  border-radius: 6px;
}

.button-group-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.button-mobile {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}
```

**Desktop Forms:**
```css
@media (min-width: 768px) {
  .form-desktop {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px 32px;
    max-width: 800px;
  }

  .form-group-full {
    grid-column: 1 / -1;
  }

  .button-group-desktop {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    margin-top: 32px;
  }

  .button-desktop {
    height: 40px;
    padding: 0 32px;
    font-size: 14px;
  }
}
```

### Data Display Components

**Patient Card Responsive Behavior:**
```css
/* Mobile: Single column */
.patient-list-mobile {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.patient-card-mobile {
  padding: 16px;
  border-radius: 12px;
  background: white;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.08);
}

/* Tablet: Two columns */
@media (min-width: 768px) {
  .patient-list-tablet {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

/* Desktop: Three columns + sidebar */
@media (min-width: 1024px) {
  .patient-list-desktop {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .patient-card-desktop {
    padding: 20px;
  }
}
```

---

## Performance Optimization

### Mobile Performance

**Image Optimization:**
```css
/* Responsive images */
.responsive-image {
  width: 100%;
  height: auto;
  max-width: 100%;
}

/* Lazy loading */
.lazy-image {
  loading: lazy;
  decoding: async;
}

/* WebP support with fallback */
.modern-image {
  background-image: url('image.webp');
}

.no-webp .modern-image {
  background-image: url('image.jpg');
}
```

**CSS Performance:**
```css
/* Hardware acceleration for animations */
.animated-element {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* Efficient transitions */
.smooth-transition {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Minimize reflows */
.efficient-layout {
  transform: translateX(100px);
  /* Instead of changing left/right properties */
}
```

### Loading States

**Progressive Loading:**
```css
/* Skeleton loading */
.skeleton {
  background: linear-gradient(
    90deg,
    #F0F0F0 25%,
    #E0E0E0 50%,
    #F0F0F0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Fade in content */
.fade-in {
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
```

---

## Testing Strategy

### Cross-Platform Testing

**Device Testing Matrix:**
- **iOS:** iPhone SE, iPhone 12, iPhone 14 Pro Max, iPad, iPad Pro
- **Android:** Pixel 5, Samsung Galaxy S22, OnePlus 9, Tablet
- **Desktop:** Chrome, Firefox, Safari, Edge (Windows/Mac)

**Testing Scenarios:**
1. **Responsive Breakpoints:** Test all major breakpoint transitions
2. **Touch vs. Mouse:** Verify interaction patterns work on each platform
3. **Orientation Changes:** Portrait/landscape behavior
4. **Accessibility:** Screen readers, keyboard navigation, voice control
5. **Performance:** Loading times, animation smoothness, memory usage

### Automated Testing

```javascript
// Cypress responsive testing
describe('Responsive Design', () => {
  const viewports = [
    { width: 375, height: 667 }, // iPhone
    { width: 768, height: 1024 }, // iPad
    { width: 1440, height: 900 }  // Desktop
  ];

  viewports.forEach(viewport => {
    it(`should work at ${viewport.width}x${viewport.height}`, () => {
      cy.viewport(viewport.width, viewport.height);
      cy.visit('/dashboard');
      cy.get('.main-navigation').should('be.visible');
      cy.get('.patient-list').should('exist');
    });
  });
});
```

---

*These platform adaptations ensure BerthCare provides optimal user experiences across all devices while maintaining consistency in core functionality and branding.*