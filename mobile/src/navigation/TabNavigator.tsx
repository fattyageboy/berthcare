import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { colors, typography } from '../theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Icon components defined outside to avoid re-creation on each render
const ScheduleIcon = ({ color }: { color: string }) => (
  <Text style={[styles.icon, { color }]}>📅</Text>
);

const HomeIcon = ({ color }: { color: string }) => (
  <Text style={[styles.icon, { color }]}>🏠</Text>
);

/**
 * Bottom Tab Navigator
 * Implements the main navigation tabs for the authenticated app
 */
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.background.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: typography.mobile.bodySmall.fontSize,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ScheduleIcon,
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: HomeIcon,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
});

export default TabNavigator;
