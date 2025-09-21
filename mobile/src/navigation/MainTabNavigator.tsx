import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Import the actual screens we've created
import MapScreen from '../screens/main/MapScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import IssueDetailScreen from '../screens/main/IssueDetailScreen';
import ReportIssueScreen from '../screens/main/ReportIssueScreen';
import IssuesScreen from '../screens/main/IssuesScreen';
import SecurityScreen from '../screens/main/SecurityScreen';
import DeviceManagementScreen from '../screens/main/DeviceManagementScreen';
import SecurityAlertsScreen from '../screens/main/SecurityAlertsScreen';
import SecuritySettingsScreen from '../screens/main/SecuritySettingsScreen';

export type MainTabParamList = {
  Issues: undefined;
  Report: undefined;
  Map: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  ReportIssue: undefined;
  IssueDetail: { issueId: string };
  Security: undefined;
  DeviceManagement: undefined;
  SecurityAlerts: undefined;
  SecurityAlert: { alertId: string };
  SecuritySettings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

const MainTabs = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Issues') {
            iconName = focused ? 'format-list-bulleted' : 'format-list-bulleted';
          } else if (route.name === 'Report') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          } else {
            iconName = 'circle';
          }

          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Issues" 
        component={IssuesScreen}
        options={{ tabBarLabel: 'My Issues' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen 
        name="Report" 
        component={ReportIssueScreen}
        options={{ 
          tabBarLabel: 'Report',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ReportIssue');
          },
        })}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const MainTabNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="ReportIssue" 
        component={ReportIssueScreen}
        options={{
          headerShown: true,
          title: 'Report Issue',
        }}
      />
      <Stack.Screen 
        name="IssueDetail" 
        component={IssueDetailScreen}
        options={{
          headerShown: true,
          title: 'Issue Details',
        }}
      />
      <Stack.Screen 
        name="Security" 
        component={SecurityScreen}
        options={{
          headerShown: false,
          title: 'Security',
        }}
      />
      <Stack.Screen 
        name="DeviceManagement" 
        component={DeviceManagementScreen}
        options={{
          headerShown: false,
          title: 'Device Management',
        }}
      />
      <Stack.Screen 
        name="SecurityAlerts" 
        component={SecurityAlertsScreen}
        options={{
          headerShown: false,
          title: 'Security Alerts',
        }}
      />
      <Stack.Screen 
        name="SecuritySettings" 
        component={SecuritySettingsScreen}
        options={{
          headerShown: false,
          title: 'Security Settings',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainTabNavigator;
