import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const IssuesScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">My Issues</Text>
    <Text>Issues list will be implemented here</Text>
  </View>
);

const ReportIssueScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Report Issue</Text>
    <Text>Issue reporting form will be implemented here</Text>
  </View>
);

const MapScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Map View</Text>
    <Text>Interactive map will be implemented here</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Profile</Text>
    <Text>User profile will be implemented here</Text>
  </View>
);

const IssueDetailScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Issue Details</Text>
    <Text>Issue details will be implemented here</Text>
  </View>
);

const CameraScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Camera</Text>
    <Text>Camera interface will be implemented here</Text>
  </View>
);

const NotificationsScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Notifications</Text>
    <Text>Notifications list will be implemented here</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Settings</Text>
    <Text>App settings will be implemented here</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
});

export {
  IssuesScreen,
  ReportIssueScreen,
  MapScreen,
  ProfileScreen,
  IssueDetailScreen,
  CameraScreen,
  NotificationsScreen,
  SettingsScreen,
};
