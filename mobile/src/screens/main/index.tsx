// Main screens barrel export
export { default as MapScreen } from './MapScreen';
export { default as ProfileScreen } from './ProfileScreen';
export { default as IssueDetailScreen } from './IssueDetailScreen';
export { default as ReportIssueScreen } from './ReportIssueScreen';
export { default as IssuesScreen } from './IssuesScreen';

// Security screens
export { default as SecurityScreen } from './SecurityScreen';
export { default as DeviceManagementScreen } from './DeviceManagementScreen';
export { default as SecurityAlertsScreen } from './SecurityAlertsScreen';
export { default as SecuritySettingsScreen } from './SecuritySettingsScreen';

// Simple placeholder screens for missing components
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/index';

const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        This screen is under development
      </Text>
    </View>
  </SafeAreaView>
);

export const CameraScreen = () => <PlaceholderScreen title="Camera" />;
export const NotificationsScreen = () => <PlaceholderScreen title="Notifications" />;
export const SettingsScreen = () => <PlaceholderScreen title="Settings" />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
});