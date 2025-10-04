/**
 * Main app navigation structure
 * Implements stack navigator with bottom tabs and deep linking
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { RootStackParamList } from './types';
import { linking } from './linking';

// Navigators
import TabNavigator from './TabNavigator';

// Screens
import LoginScreen from '../screens/LoginScreen';
import PatientProfileScreen from '../screens/PatientProfileScreen';
import VisitDocumentationScreen from '../screens/VisitDocumentationScreen';
import ReviewScreen from '../screens/ReviewScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen name="PatientProfile" component={PatientProfileScreen} />
            <Stack.Screen name="VisitDocumentation" component={VisitDocumentationScreen} />
            <Stack.Screen name="Review" component={ReviewScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
