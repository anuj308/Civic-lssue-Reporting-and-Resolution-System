import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Surface,
  Text,
  Card,
  List,
  Divider,
  IconButton,
  Switch,
  Button,
  ActivityIndicator,
  Portal,
  Dialog,
  RadioButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { sessionApi } from '../../services/api';

interface SecuritySettings {
  emailAlerts: boolean;
  pushNotifications: boolean;
  newDeviceAlerts: boolean;
  locationAlerts: boolean;
  failedLoginAlerts: boolean;
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
  weeklySecurityReport: boolean;
}

export default function SecuritySettingsScreen() {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings>({
    emailAlerts: true,
    pushNotifications: true,
    newDeviceAlerts: true,
    locationAlerts: true,
    failedLoginAlerts: true,
    twoFactorEnabled: false,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
    weeklySecurityReport: false,
  });
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await sessionApi.getSecuritySettings();
      const serverSettings = response.data.data.settings;
      setSettings(serverSettings);
    } catch (error: any) {
      console.error('Error loading security settings:', error);
      Alert.alert('Error', 'Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof SecuritySettings, value: any) => {
    const oldValue = settings[key];
    const newSettings = { ...settings, [key]: value };
    
    // Optimistic update
    setSettings(newSettings);
    
    try {
      setSaving(true);
      await sessionApi.updateSecuritySettings({ [key]: value });
    } catch (error: any) {
      console.error('Error updating security setting:', error);
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: oldValue }));
      Alert.alert('Error', 'Failed to update security setting');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof SecuritySettings) => {
    const currentValue = settings[key] as boolean;
    
    // Special handling for critical security features
    if (key === 'twoFactorEnabled' && !currentValue) {
      setShowTwoFactorDialog(true);
      return;
    }
    
    updateSetting(key, !currentValue);
  };

  const handleEnableTwoFactor = () => {
    setShowTwoFactorDialog(false);
    Alert.alert(
      'Two-Factor Authentication',
      'This feature will be available in a future update. For now, we recommend using strong passwords and monitoring your active sessions.',
      [{ text: 'OK' }]
    );
  };

  const handleExportSecurityData = () => {
    Alert.alert(
      'Export Security Data',
      'This will export your security activity including login history, active sessions, and security alerts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              const response = await sessionApi.exportSecurityData();
              Alert.alert('Success', 'Security data exported successfully. Check your email for the download link.');
            } catch (error: any) {
              console.error('Error exporting security data:', error);
              Alert.alert('Error', 'Failed to export security data');
            }
          }
        }
      ]
    );
  };

  const timeoutOptions = [
    { label: '15 minutes', value: 15 * 60 * 1000, displayValue: 15 },
    { label: '30 minutes', value: 30 * 60 * 1000, displayValue: 30 },
    { label: '1 hour', value: 60 * 60 * 1000, displayValue: 60 },
    { label: '2 hours', value: 2 * 60 * 60 * 1000, displayValue: 120 },
    { label: '4 hours', value: 4 * 60 * 60 * 1000, displayValue: 240 },
    { label: '8 hours', value: 8 * 60 * 60 * 1000, displayValue: 480 },
    { label: '7 days', value: 7 * 24 * 60 * 60 * 1000, displayValue: 7 * 24 * 60 },
  ];

  const getTimeoutLabel = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (60 * 1000));
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
            <Text variant="headlineSmall" style={styles.headerTitle}>Security Settings</Text>
            <View style={{ width: 48 }} />
          </View>
        </Surface>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>Security Settings</Text>
          <View style={{ width: 48 }} />
        </View>
      </Surface>

      <ScrollView style={styles.scrollView}>
        {/* Notifications */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Notifications</Text>
            
            <List.Item
              title="Email Alerts"
              description="Receive security alerts via email"
              left={() => <Icon name="email-alert" size={24} color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={settings.emailAlerts}
                  onValueChange={() => handleToggle('emailAlerts')}
                  disabled={saving}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="Push Notifications"
              description="Receive security alerts on your device"
              left={() => <Icon name="bell-alert" size={24} color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={settings.pushNotifications}
                  onValueChange={() => handleToggle('pushNotifications')}
                  disabled={saving}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="Login Notifications"
              description="Get notified when you sign in"
              left={() => <Icon name="login" size={24} color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={settings.loginNotifications}
                  onValueChange={() => handleToggle('loginNotifications')}
                  disabled={saving}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="Weekly Security Report"
              description="Receive weekly security summary"
              left={() => <Icon name="chart-line" size={24} color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={settings.weeklySecurityReport}
                  onValueChange={() => handleToggle('weeklySecurityReport')}
                  disabled={saving}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Alert Types */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Alert Types</Text>
            
            <List.Item
              title="New Device Alerts"
              description="Alert when signing in from new device"
              left={() => <Icon name="cellphone" size={24} color={theme.colors.warning} />}
              right={() => (
                <Switch
                  value={settings.newDeviceAlerts}
                  onValueChange={() => handleToggle('newDeviceAlerts')}
                  disabled={saving}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="Location Alerts"
              description="Alert when signing in from unusual location"
              left={() => <Icon name="map-marker-alert" size={24} color={theme.colors.warning} />}
              right={() => (
                <Switch
                  value={settings.locationAlerts}
                  onValueChange={() => handleToggle('locationAlerts')}
                  disabled={saving}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="Failed Login Alerts"
              description="Alert on multiple failed login attempts"
              left={() => <Icon name="account-cancel" size={24} color={theme.colors.error} />}
              right={() => (
                <Switch
                  value={settings.failedLoginAlerts}
                  onValueChange={() => handleToggle('failedLoginAlerts')}
                  disabled={saving}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="Suspicious Activity Alerts"
              description="Alert on unusual account behavior"
              left={() => <Icon name="shield-alert" size={24} color={theme.colors.error} />}
              right={() => (
                <Switch
                  value={settings.suspiciousActivityAlerts}
                  onValueChange={() => handleToggle('suspiciousActivityAlerts')}
                  disabled={saving}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Session & Authentication */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Session & Authentication</Text>
            
            <List.Item
              title="Two-Factor Authentication"
              description={settings.twoFactorEnabled ? "Enabled for extra security" : "Add an extra layer of security"}
              left={() => (
                <Icon 
                  name={settings.twoFactorEnabled ? "shield-check" : "shield-outline"} 
                  size={24} 
                  color={settings.twoFactorEnabled ? theme.colors.success : theme.colors.info} 
                />
              )}
              right={() => (
                <Switch
                  value={settings.twoFactorEnabled}
                  onValueChange={() => handleToggle('twoFactorEnabled')}
                  disabled={saving}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Data & Privacy */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Data & Privacy</Text>
            
            <List.Item
              title="Export Security Data"
              description="Download your security activity data"
              left={() => <Icon name="download" size={24} color={theme.colors.primary} />}
              right={() => <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />}
              onPress={handleExportSecurityData}
            />
            <Divider />
            
            <List.Item
              title="Clear Security Alerts"
              description="Remove all resolved security alerts"
              left={() => <Icon name="delete-sweep" size={24} color={theme.colors.warning} />}
              right={() => <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />}
              onPress={() => {
                Alert.alert(
                  'Clear Security Alerts',
                  'This will permanently remove all resolved security alerts. This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await sessionApi.clearSecurityAlerts();
                          Alert.alert('Success', 'Security alerts cleared');
                        } catch (error: any) {
                          console.error('Error clearing alerts:', error);
                          Alert.alert('Error', 'Failed to clear security alerts');
                        }
                      }
                    }
                  ]
                );
              }}
            />
          </Card.Content>
        </Card>

        {/* Security Tips */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Security Recommendations</Text>
            
            <View style={styles.tip}>
              <Icon name="shield-check" size={20} color={theme.colors.success} />
              <Text style={styles.tipText}>
                Keep all security alerts enabled for maximum protection
              </Text>
            </View>
            
            <View style={styles.tip}>
              <Icon name="clock-alert" size={20} color={theme.colors.warning} />
              <Text style={styles.tipText}>
                Use shorter session timeouts on shared or public devices
              </Text>
            </View>
            
            <View style={styles.tip}>
              <Icon name="email-check" size={20} color={theme.colors.info} />
              <Text style={styles.tipText}>
                Monitor your email for security notifications regularly
              </Text>
            </View>
            
            <View style={styles.tip}>
              <Icon name="devices" size={20} color={theme.colors.primary} />
              <Text style={styles.tipText}>
                Review your active sessions weekly and sign out unused devices
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Two-Factor Authentication Dialog */}
      <Portal>
        <Dialog visible={showTwoFactorDialog} onDismiss={() => setShowTwoFactorDialog(false)}>
          <Dialog.Title>Two-Factor Authentication</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogDescription}>
              Two-factor authentication adds an extra layer of security to your account by requiring a second form of verification when signing in.
            </Text>
            <Text style={styles.dialogNote}>
              This feature is coming soon! In the meantime, we recommend:
            </Text>
            <View style={styles.recommendationList}>
              <Text style={styles.recommendation}>• Use a strong, unique password</Text>
              <Text style={styles.recommendation}>• Monitor your active sessions regularly</Text>
              <Text style={styles.recommendation}>• Enable all security alerts</Text>
              <Text style={styles.recommendation}>• Sign out from unused devices</Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTwoFactorDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleEnableTwoFactor}>
              Got it
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    elevation: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: theme.colors.onSurfaceVariant,
  },
  settingsCard: {
    margin: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  tipsCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 32,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  dialogDescription: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  dialogNote: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  recommendationList: {
    marginLeft: 8,
  },
  recommendation: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioLabel: {
    marginLeft: 8,
    color: theme.colors.onSurface,
  },
});