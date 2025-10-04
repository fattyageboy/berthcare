# Navigation Implementation

## Overview

The BerthCare mobile app uses React Navigation v7 with a hybrid navigation structure combining stack and bottom tab navigators. This implementation follows the architecture specifications and design system guidelines.

## Navigation Structure

```
AppNavigator (Stack)
├── Login Screen (Unauthenticated)
└── MainTabs (Bottom Tabs) (Authenticated)
    ├── Schedule Screen
    └── Home Screen
├── PatientProfile Screen (Modal)
├── VisitDocumentation Screen (Modal)
└── Review Screen (Modal)
```

## Key Features

### 1. Authentication-Based Navigation
- Unauthenticated users see only the Login screen
- Authenticated users access the MainTabs and all modal screens
- Navigation state is controlled by Redux auth state

### 2. Bottom Tab Navigation
- **Schedule Tab**: Displays daily visit schedule
- **Home Tab**: Dashboard with overview and quick actions
- Tabs use emoji icons (can be replaced with vector icons)
- Active/inactive states follow design system colors

### 3. Stack Navigation
- Modal-style screens for detailed workflows
- Smooth slide animations for screen transitions
- Back button support on all modal screens
- Proper header implementation with navigation controls

### 4. Deep Linking
Deep linking is configured to support URL-based navigation:

**Supported URLs:**
- `berthcare://login` - Login screen
- `berthcare://app/schedule` - Schedule tab
- `berthcare://app/home` - Home tab
- `berthcare://patient/:patientId` - Patient profile
- `berthcare://visit/:visitId/document` - Visit documentation
- `berthcare://visit/:visitId/review` - Review screen

**Web URLs:**
- `https://app.berthcare.ca/*` - All routes supported

## Screen Implementations

### Login Screen
- Entry point for unauthenticated users
- Handles authentication flow
- Redirects to MainTabs on successful login

### Schedule Screen
- Lists daily visits with client information
- Tappable cards navigate to VisitDocumentation
- Displays visit time, type, and address
- Integrates with visit store for real data

### Home Screen
- Dashboard with visit statistics
- Quick action buttons for common tasks
- Navigation to Schedule and PatientProfile
- Overview of completed/pending visits

### PatientProfile Screen
- Displays patient demographics and medical information
- Shows allergies, medications, and care plans
- Accessed via deep link or navigation
- Back button returns to previous screen

### VisitDocumentation Screen
- Form for documenting visit details
- Vital signs input
- Activity checklist (to be implemented)
- Photo capture (to be implemented)
- Continues to Review screen

### Review Screen
- Summary of visit documentation
- Edit and Submit actions
- Confirmation dialog before submission
- Returns to Schedule on successful submit

## Type Safety

All navigation is fully typed using TypeScript:

```typescript
// Stack navigator types
type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  PatientProfile: { patientId: string };
  VisitDocumentation: { visitId: string };
  Review: { visitId: string };
};

// Tab navigator types
type MainTabParamList = {
  Schedule: undefined;
  Home: undefined;
};
```

## Navigation Hooks

Screens can use React Navigation hooks for navigation:

```typescript
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MyComponent = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // Navigate to patient profile
  navigation.navigate('PatientProfile', { patientId: '123' });
  
  // Go back
  navigation.goBack();
};
```

## Design System Integration

### Colors
- Active tab: `colors.primary.main` (#1B4F72)
- Inactive tab: `colors.text.tertiary` (#6C757D)
- Background: `colors.background.primary` (#FFFFFF)
- Border: `colors.background.border` (#DEE2E6)

### Typography
- Tab labels: `typography.mobile.bodySmall` (12px)
- Header titles: `typography.mobile.h4` (18px)

### Spacing
- Tab bar height: 60px
- Tab bar padding: 8px top/bottom
- Header height: 56px

## Future Enhancements

1. **Vector Icons**: Replace emoji icons with react-native-vector-icons
2. **Badges**: Add notification badges to tabs
3. **Gestures**: Implement swipe gestures for tab switching
4. **Animations**: Enhanced screen transition animations
5. **Offline Indicator**: Show connectivity status in header
6. **Push Notifications**: Deep link handling from notifications

## Testing

Navigation can be tested using React Navigation testing utilities:

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { render } from '@testing-library/react-native';

const renderWithNavigation = (component) => {
  return render(
    <NavigationContainer>
      {component}
    </NavigationContainer>
  );
};
```

## References

- Architecture: `project-documentation/architecture-output.md` (line 68)
- Design System: `design-documentation/design-system/style-guide.md` (line 209-216)
- React Navigation Docs: https://reactnavigation.org/
