import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Surface,
  Text,
  Card,
  List,
  Switch,
  Divider,
  Badge,
  IconButton,
  Button,
  Chip,
  ActivityIndicator,
  Portal,
  Dialog,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { sessionApi } from '../../services/api';

const { width } = Dimensions.get('window');

interface SecurityOverview {
  activeSessions: number;
  recentLoginCount: number;
  uniqueLocations: number;
  uniqueDevices: number;
  highRiskLogins: number;
  pendingAlerts: number;
}

interface SessionData {
  id: string;
  device: string;
  location: string;
  loginTime: string;
  status: string;
  riskLevel: 'low' | 'medium' | 'high';
  isCurrent?: boolean;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'info' | 'low' | 'medium' | 'high';
  title: string;
  description: string;
  createdAt: string;
  userAction: 'pending' | 'acknowledged' | 'dismissed';
}

interface SecuritySettings {
  enableLocationAlerts: boolean;
  enableNewDeviceAlerts: boolean;
  sessionTimeout: number;
  requireStrongAuth: boolean;
}

export default function SecurityScreen() {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [securityOverview, setSecurityOverview] = useState<SecurityOverview | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionData[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<SecurityAlert[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    enableLocationAlerts: true,
    enableNewDeviceAlerts: true,
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    requireStrongAuth: false,
  });
  
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [showSuspiciousDialog, setShowSuspiciousDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [suspiciousReason, setSuspiciousReason] = useState('');
  const [suspiciousDescription, setSuspiciousDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [overviewResponse, alertsResponse] = await Promise.all([
        sessionApi.getSecurityOverview(),
        sessionApi.getSecurityAlerts({ limit: 5, unreadOnly: true }),
      ]);

      setSecurityOverview(overviewResponse.data.data.overview);
      setRecentSessions(overviewResponse.data.data.recentSessions);
      setRecentAlerts(alertsResponse.data.data.alerts);
    } catch (error: any) {
      console.error('Error loading security data:', error);
      Alert.alert('Error', 'Failed to load security information');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  };

  const handleRevokeAllSessions = async () => {
    try {
      setActionLoading(true);
      await sessionApi.revokeAllSessions();
      setShowRevokeAllDialog(false);
      Alert.alert('Success', 'All other sessions have been revoked');
      await loadSecurityData();
    } catch (error: any) {
      console.error('Error revoking sessions:', error);
      Alert.alert('Error', 'Failed to revoke sessions');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setActionLoading(true);
      await sessionApi.revokeSession(sessionId);
      Alert.alert('Success', 'Session revoked successfully');
      await loadSecurityData();
    } catch (error: any) {
      console.error('Error revoking session:', error);
      Alert.alert('Error', 'Failed to revoke session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportSuspicious = async () => {
    if (!selectedSession || !suspiciousReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for reporting');
      return;
    }

    try {
      setActionLoading(true);
      await sessionApi.reportSuspiciousActivity({
        sessionId: selectedSession.id,
        reason: suspiciousReason,
        description: suspiciousDescription,
      });
      setShowSuspiciousDialog(false);
      setSuspiciousReason('');
      setSuspiciousDescription('');
      setSelectedSession(null);
      Alert.alert('Success', 'Suspicious activity reported');
      await loadSecurityData();
    } catch (error: any) {
      console.error('Error reporting suspicious activity:', error);
      Alert.alert('Error', 'Failed to report suspicious activity');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSecuritySetting = async (key: keyof SecuritySettings, value: boolean | number) => {
    try {
      const newSettings = { ...securitySettings, [key]: value };
      setSecuritySettings(newSettings);
      await sessionApi.updateSecuritySettings(newSettings);
    } catch (error: any) {
      console.error('Error updating security setting:', error);
      Alert.alert('Error', 'Failed to update security setting');
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.outline;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.info;
      case 'info': return theme.colors.primary;
      default: return theme.colors.outline;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
            <Text variant="headlineSmall" style={styles.headerTitle}>Security</Text>
            <View style={{ width: 48 }} />
          </View>
        </Surface>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading security information...</Text>
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
          <Text variant="headlineSmall" style={styles.headerTitle}>Security</Text>
          <IconButton
            icon="refresh"
            size={24}
            onPress={onRefresh}
            disabled={refreshing}
          />
        </View>
      </Surface>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Security Overview */}
        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Security Overview</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Icon name="devices" size={24} color={theme.colors.primary} />
                <Text style={styles.statNumber}>{securityOverview?.activeSessions || 0}</Text>
                <Text style={styles.statLabel}>Active Sessions</Text>
              </View>
              
              <View style={styles.statItem}>
                <Icon name="map-marker" size={24} color={theme.colors.info} />
                <Text style={styles.statNumber}>{securityOverview?.uniqueLocations || 0}</Text>
                <Text style={styles.statLabel}>Locations</Text>
              </View>
              
              <View style={styles.statItem}>
                <Icon name="alert" size={24} color={theme.colors.warning} />
                <Text style={styles.statNumber}>{securityOverview?.pendingAlerts || 0}</Text>
                <Text style={styles.statLabel}>Alerts</Text>
              </View>
              
              <View style={styles.statItem}>
                <Icon name="shield-alert" size={24} color={theme.colors.error} />
                <Text style={styles.statNumber}>{securityOverview?.highRiskLogins || 0}</Text>
                <Text style={styles.statLabel}>High Risk</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                icon="devices"
                onPress={() => navigation.navigate('DeviceManagement')}
                style={styles.actionButton}
              >
                Manage Devices
              </Button>
              
              <Button
                mode="outlined"
                icon="shield-alert"
                onPress={() => navigation.navigate('SecurityAlerts')}
                style={styles.actionButton}
              >
                View Alerts
              </Button>
            </View>
            
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                icon="cog"
                onPress={() => navigation.navigate('SecuritySettings')}
                style={styles.actionButton}
              >
                Settings
              </Button>
              
              <Button
                mode="contained"
                icon="logout-variant"
                onPress={() => setShowRevokeAllDialog(true)}
                style={styles.actionButton}
                buttonColor={theme.colors.error}
              >
                Sign Out All
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Sessions */}
        <Card style={styles.sessionsCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Recent Sessions</Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('DeviceManagement')}
                compact
              >
                View All
              </Button>
            </View>
            
            {recentSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="devices" size={48} color={theme.colors.outline} />
                <Text style={styles.emptyText}>No recent sessions</Text>
              </View>
            ) : (
              recentSessions.map((session, index) => (
                <View key={session.id}>
                  <List.Item
                    title={session.device}
                    description={`${session.location} • ${formatDate(session.loginTime)}`}
                    left={(props) => (
                      <View style={styles.sessionIcon}>
                        <Icon 
                          name={session.isCurrent ? "cellphone" : "laptop"} 
                          size={24} 
                          color={theme.colors.primary} 
                        />
                        {session.isCurrent && (
                          <Badge size={8} style={styles.currentBadge} />
                        )}
                      </View>
                    )}
                    right={() => (
                      <View style={styles.sessionRight}>
                        <Chip
                          mode="flat"
                          style={[styles.riskChip, { backgroundColor: getRiskColor(session.riskLevel) + '20' }]}
                          textStyle={[styles.riskText, { color: getRiskColor(session.riskLevel) }]}
                        >
                          {session.riskLevel}
                        </Chip>
                        {!session.isCurrent && (
                          <IconButton
                            icon="dots-vertical"
                            size={20}
                            onPress={() => {
                              Alert.alert(
                                'Session Actions',
                                `Device: ${session.device}\nLocation: ${session.location}`,
                                [
                                  {
                                    text: 'Report Suspicious',
                                    onPress: () => {
                                      setSelectedSession(session);
                                      setShowSuspiciousDialog(true);
                                    }
                                  },
                                  {
                                    text: 'Revoke Session',
                                    style: 'destructive',
                                    onPress: () => handleRevokeSession(session.id)
                                  },
                                  { text: 'Cancel', style: 'cancel' }
                                ]
                              );
                            }}
                          />
                        )}
                      </View>
                    )}
                  />
                  {index < recentSessions.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Recent Security Alerts */}
        <Card style={styles.alertsCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Security Alerts</Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('SecurityAlerts')}
                compact
              >
                View All
              </Button>
            </View>
            
            {recentAlerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="shield-check" size={48} color={theme.colors.success} />
                <Text style={styles.emptyText}>No security alerts</Text>
                <Text style={styles.emptySubtext}>Your account is secure</Text>
              </View>
            ) : (
              recentAlerts.map((alert, index) => (
                <View key={alert.id}>
                  <List.Item
                    title={alert.title}
                    description={`${alert.description} • ${formatDate(alert.createdAt)}`}
                    left={() => (
                      <Icon
                        name="shield-alert"
                        size={24}
                        color={getSeverityColor(alert.severity)}
                      />
                    )}
                    right={() => (
                      <Chip
                        mode="flat"
                        style={[styles.severityChip, { backgroundColor: getSeverityColor(alert.severity) + '20' }]}
                        textStyle={[styles.severityText, { color: getSeverityColor(alert.severity) }]}
                      >
                        {alert.severity}
                      </Chip>
                    )}
                    onPress={() => navigation.navigate('SecurityAlert', { alertId: alert.id })}
                  />
                  {index < recentAlerts.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Security Settings Preview */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Security Settings</Text>
            
            <List.Item
              title="Location Alerts"
              description="Get notified when logging in from new locations"
              left={(props) => <List.Icon {...props} icon="map-marker-alert" />}
              right={() => (
                <Switch
                  value={securitySettings.enableLocationAlerts}
                  onValueChange={(value) => handleUpdateSecuritySetting('enableLocationAlerts', value)}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="New Device Alerts"
              description="Get notified when logging in from new devices"
              left={(props) => <List.Icon {...props} icon="devices" />}
              right={() => (
                <Switch
                  value={securitySettings.enableNewDeviceAlerts}
                  onValueChange={(value) => handleUpdateSecuritySetting('enableNewDeviceAlerts', value)}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="Advanced Settings"
              description="Session timeout, strong authentication, and more"
              left={(props) => <List.Icon {...props} icon="cog" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('SecuritySettings')}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Revoke All Sessions Dialog */}
      <Portal>
        <Dialog visible={showRevokeAllDialog} onDismiss={() => setShowRevokeAllDialog(false)}>
          <Dialog.Title>Sign Out All Devices</Dialog.Title>
          <Dialog.Content>
            <Text>This will sign you out of all other devices and sessions. You will remain signed in on this device.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRevokeAllDialog(false)}>Cancel</Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              onPress={handleRevokeAllSessions}
              loading={actionLoading}
              disabled={actionLoading}
            >
              Sign Out All
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Report Suspicious Activity Dialog */}
      <Portal>
        <Dialog visible={showSuspiciousDialog} onDismiss={() => setShowSuspiciousDialog(false)}>
          <Dialog.Title>Report Suspicious Activity</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogDescription}>
              Please describe why you think this session is suspicious:
            </Text>
            <TextInput
              mode="outlined"
              label="Reason *"
              value={suspiciousReason}
              onChangeText={setSuspiciousReason}
              style={styles.dialogInput}
              placeholder="e.g., I didn't access from this location"
            />
            <TextInput
              mode="outlined"
              label="Additional Details"
              value={suspiciousDescription}
              onChangeText={setSuspiciousDescription}
              style={styles.dialogInput}
              multiline
              numberOfLines={3}
              placeholder="Optional: Provide more details..."
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSuspiciousDialog(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleReportSuspicious}
              loading={actionLoading}
              disabled={actionLoading || !suspiciousReason.trim()}
            >
              Report
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
  overviewCard: {
    margin: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: (width - 64) / 2,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  actionsCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
  },
  sessionsCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  sessionIcon: {
    position: 'relative',
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBadge: {
    position: 'absolute',
    top: -2,
    right: 6,
    backgroundColor: theme.colors.success,
  },
  sessionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskChip: {
    height: 24,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertsCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  severityChip: {
    height: 24,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingsCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    fontSize: 14,
  },
  dialogDescription: {
    marginBottom: 16,
    color: theme.colors.onSurfaceVariant,
  },
  dialogInput: {
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
});
