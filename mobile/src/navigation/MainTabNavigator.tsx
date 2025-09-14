import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Import the actual screens we've created
import MapScreen from '../screens/main/MapScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import IssueDetailScreen from '../screens/main/IssueDetailScreen';

// Import from main index with proper component adapters
import { IssuesScreen, ReportIssueScreen } from '../screens/main';

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
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

// Create wrapper components that handle navigation props properly
const IssuesScreenWrapper = () => <IssuesScreen />;
const ReportIssueScreenWrapper = () => <ReportIssueScreen />;

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
        component={IssuesScreenWrapper}
        options={{ tabBarLabel: 'My Issues' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen 
        name="Report" 
        component={ReportIssueScreenWrapper}
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
        component={ReportIssueScreenWrapper}
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
    </Stack.Navigator>
  );
};

export default MainTabNavigator;
