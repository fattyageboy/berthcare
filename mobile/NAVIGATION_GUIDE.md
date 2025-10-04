# BerthCare Navigation Quick Start Guide

## Running the App

```bash
# Install dependencies (if not already done)
cd mobile
npm install

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Navigation Overview

The app uses a hybrid navigation structure:
- **Stack Navigator**: Main navigation container
- **Bottom Tabs**: Primary navigation for authenticated users
- **Modal Screens**: Visit documentation workflow

## Adding a New Screen

### 1. Create the Screen Component

```typescript
// mobile/src/screens/MyNewScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { colors, typography, spacing } from '../theme';
import { Header } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'MyNewScreen'>;

const MyNewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { myParam } = route.params;

  return (
    <View style={styles.container}>
      <Header 
        title="My New Screen" 
        showBackButton 
        onBackPress={() => navigation.goBack()} 
      />
      <Text>Parameter: {myParam}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
});

export default MyNewScreen;
```

### 2. Add Type Definition

```typescript
// mobile/src/navigation/types.ts
export type RootStackParamList = {
  // ... existing screens
  MyNewScreen: { myParam: string }; // Add this line
};
```

### 3. Register in Navigator

```typescript
// mobile/src/navigation/AppNavigator.tsx
import MyNewScreen from '../screens/MyNewScreen';

// Inside the authenticated stack group:
<Stack.Screen 
  name="MyNewScreen" 
  component={MyNewScreen}
/>
```

### 4. Export from Index

```typescript
// mobile/src/screens/index.ts
export { default as MyNewScreen } from './MyNewScreen';
```

## Navigation Examples

### Navigate to a Screen

```typescript
// Without parameters
navigation.navigate('Schedule');

// With parameters
navigation.navigate('PatientProfile', { patientId: '123' });

// Navigate to nested tab
navigation.navigate('MainTabs', { screen: 'Home' });
```

### Go Back

```typescript
// Go back one screen
navigation.goBack();

// Go back to specific screen
navigation.navigate('Schedule');
```

### Replace Current Screen

```typescript
// Replace instead of push (no back button)
navigation.replace('Home');
```

### Reset Navigation Stack

```typescript
import { CommonActions } from '@react-navigation/native';

navigation.dispatch(
  CommonActions.reset({
    index: 0,
    routes: [{ name: 'MainTabs' }],
  })
);
```

## Using Navigation Hooks

### useNavigation Hook

```typescript
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MyComponent = () => {
  const navigation = useNavigation<NavigationProp>();
  
  return (
    <Button onPress={() => navigation.navigate('Schedule')}>
      Go to Schedule
    </Button>
  );
};
```

### useRoute Hook

```typescript
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';

type RouteProps = RouteProp<RootStackParamList, 'PatientProfile'>;

const MyComponent = () => {
  const route = useRoute<RouteProps>();
  const { patientId } = route.params;
  
  return <Text>Patient ID: {patientId}</Text>;
};
```

## Deep Linking

### Test Deep Links (Development)

```bash
# iOS Simulator
xcrun simctl openurl booted "berthcare://patient/123"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "berthcare://patient/123"
```

### Add New Deep Link Route

```typescript
// mobile/src/navigation/linking.ts
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['berthcare://', 'https://app.berthcare.ca'],
  config: {
    screens: {
      // ... existing routes
      MyNewScreen: 'my-route/:myParam', // Add this
    },
  },
};
```

## Common Patterns

### Modal Screen with Back Button

```typescript
<Header 
  title="Screen Title" 
  showBackButton 
  onBackPress={() => navigation.goBack()} 
/>
```

### Screen with Right Action

```typescript
<Header 
  title="Screen Title"
  rightAction={{
    icon: <Text>✓</Text>,
    onPress: handleSave,
    accessibilityLabel: 'Save',
  }}
/>
```

### Conditional Navigation

```typescript
const handleNext = () => {
  if (isValid) {
    navigation.navigate('Review', { visitId });
  } else {
    Alert.alert('Error', 'Please fill all required fields');
  }
};
```

### Navigation with Confirmation

```typescript
const handleSubmit = () => {
  Alert.alert(
    'Confirm',
    'Are you sure?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          // Submit logic
          navigation.navigate('Schedule');
        },
      },
    ]
  );
};
```

## Troubleshooting

### Screen Not Showing
1. Check if screen is registered in AppNavigator
2. Verify type definition in RootStackParamList
3. Ensure screen is exported from screens/index.ts

### Type Errors
1. Make sure navigation types match param list
2. Use correct screen name (case-sensitive)
3. Provide all required parameters

### Deep Links Not Working
1. Verify URL scheme in linking.ts
2. Check native configuration (iOS Info.plist, Android AndroidManifest.xml)
3. Test with correct URL format

### Back Button Not Working
1. Ensure Header has showBackButton prop
2. Verify onBackPress calls navigation.goBack()
3. Check if screen is in correct navigator

## Best Practices

1. **Always use TypeScript types** for navigation props
2. **Use Header component** for consistent navigation UI
3. **Handle back button** on all modal screens
4. **Validate parameters** before navigation
5. **Show loading states** during async navigation
6. **Test deep links** in development
7. **Use meaningful screen names** that match their purpose
8. **Keep navigation logic** in screen components, not in child components

## Resources

- [React Navigation Docs](https://reactnavigation.org/)
- [Navigation README](./src/navigation/README.md)
- [Architecture Document](../project-documentation/architecture-output.md)
- [Design System](../design-documentation/design-system/style-guide.md)
