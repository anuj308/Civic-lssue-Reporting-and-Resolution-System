import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Surface,
  Text,
  Card,
  List,
  Divider,
  Badge,
  IconButton,
  Button,
  Chip,
  ActivityIndicator,
  Portal,
  Dialog,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { sessionApi } from '../../services/api';

interface Session {
  id: string;
  device: string;
  location: string;
  loginTime: string;
  status: 'active' | 'expired' | 'revoked';
  riskLevel: 'low' | 'medium' | 'high';
  isCurrent: boolean;
  lastActivity?: string;
  ipAddress?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
}

export default function DeviceManagementScreen() {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionApi.getMySessions();
      setSessions(response.data.data.sessions);
    } catch (error: any) {
      console.error('Error loading sessions:', error);
      Alert.alert('Error', 'Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setActionLoading(true);
      await sessionApi.revokeSession(sessionId);
      setShowRevokeDialog(false);
      setSelectedSession(null);
      Alert.alert('Success', 'Session revoked successfully');
      await loadSessions();
    } catch (error: any) {
      console.error('Error revoking session:', error);
      Alert.alert('Error', 'Failed to revoke session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      setActionLoading(true);
      await sessionApi.revokeAllSessions();
      setShowRevokeAllDialog(false);
      Alert.alert('Success', 'All other sessions have been revoked');
      await loadSessions();
    } catch (error: any) {
      console.error('Error revoking all sessions:', error);
      Alert.alert('Error', 'Failed to revoke sessions');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportSuspicious = (session: Session) => {
    Alert.alert(
      'Report Suspicious Activity',
      `Are you sure you want to report this session as suspicious?\n\nDevice: ${session.device}\nLocation: ${session.location}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionApi.reportSuspiciousActivity({
                sessionId: session.id,
                reason: 'User reported suspicious activity from device management',
                description: `Suspicious activity reported for ${session.device} from ${session.location}`,
              });
              Alert.alert('Success', 'Suspicious activity reported');
              await loadSessions();
            } catch (error: any) {
              console.error('Error reporting suspicious activity:', error);
              Alert.alert('Error', 'Failed to report suspicious activity');
            }
          }
        }
      ]
    );
  };

  const toggleMenu = (sessionId: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const closeMenu = (sessionId: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [sessionId]: false
    }));
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.outline;
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return 'cellphone';
      case 'tablet': return 'tablet';
      case 'desktop': return 'desktop-classic';
      case 'web': return 'web';
      default: return 'devices';
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
    } else if (diffInMinutes < 10080) { // 7 days
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const currentSession = activeSessions.find(s => s.isCurrent);
  const otherSessions = activeSessions.filter(s => !s.isCurrent);

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
            <Text variant="headlineSmall" style={styles.headerTitle}>Device Management</Text>
            <View style={{ width: 48 }} />
          </View>
        </Surface>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
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
          <Text variant="headlineSmall" style={styles.headerTitle}>Device Management</Text>
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
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryItem}>
                <Icon name="devices" size={24} color={theme.colors.primary} />
                <Text style={styles.summaryNumber}>{activeSessions.length}</Text>
                <Text style={styles.summaryLabel}>Active Sessions</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryItem}>
                <Icon name="shield-check" size={24} color={theme.colors.success} />
                <Text style={styles.summaryNumber}>
                  {activeSessions.filter(s => s.riskLevel === 'low').length}
                </Text>
                <Text style={styles.summaryLabel}>Secure Sessions</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryItem}>
                <Icon name="alert" size={24} color={theme.colors.warning} />
                <Text style={styles.summaryNumber}>
                  {activeSessions.filter(s => s.riskLevel === 'medium' || s.riskLevel === 'high').length}
                </Text>
                <Text style={styles.summaryLabel}>Risk Sessions</Text>
              </View>
            </View>
            
            {otherSessions.length > 0 && (
              <Button
                mode="contained"
                icon="logout-variant"
                onPress={() => setShowRevokeAllDialog(true)}
                style={styles.revokeAllButton}
                buttonColor={theme.colors.error}
              >
                Sign Out All Other Devices
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Current Session */}
        {currentSession && (
          <Card style={styles.sessionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Current Session</Text>
              <List.Item
                title={currentSession.device}
                description={`${currentSession.location} • Last active: ${formatDate(currentSession.lastActivity || currentSession.loginTime)}`}
                left={() => (
                  <View style={styles.sessionIcon}>
                    <Icon 
                      name={getDeviceIcon(currentSession.deviceType)} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                    <Badge size={8} style={styles.currentBadge} />
                  </View>
                )}
                right={() => (
                  <View style={styles.sessionRight}>
                    <Chip
                      mode="flat"
                      icon="check-circle"
                      style={[styles.currentChip]}
                      textStyle={styles.currentText}
                    >
                      Current
                    </Chip>
                    <Chip
                      mode="flat"
                      style={[styles.riskChip, { backgroundColor: getRiskColor(currentSession.riskLevel) + '20' }]}
                      textStyle={[styles.riskText, { color: getRiskColor(currentSession.riskLevel) }]}
                    >
                      {currentSession.riskLevel}
                    </Chip>
                  </View>
                )}
              />
              
              {/* Current Session Details */}
              <View style={styles.sessionDetails}>
                <Text style={styles.detailLabel}>Device Info:</Text>
                <Text style={styles.detailValue}>{currentSession.os} • {currentSession.browser}</Text>
                <Text style={styles.detailLabel}>IP Address:</Text>
                <Text style={styles.detailValue}>{currentSession.ipAddress || 'Hidden'}</Text>
                <Text style={styles.detailLabel}>Login Time:</Text>
                <Text style={styles.detailValue}>{new Date(currentSession.loginTime).toLocaleString()}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Other Sessions */}
        {otherSessions.length > 0 && (
          <Card style={styles.sessionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Other Sessions</Text>
              {otherSessions.map((session, index) => (
                <View key={session.id}>
                  <List.Item
                    title={session.device}
                    description={`${session.location} • ${formatDate(session.loginTime)}`}
                    left={() => (
                      <Icon 
                        name={getDeviceIcon(session.deviceType)} 
                        size={24} 
                        color={theme.colors.onSurfaceVariant} 
                      />
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
                        <Menu
                          visible={menuVisible[session.id] || false}
                          onDismiss={() => closeMenu(session.id)}
                          anchor={
                            <IconButton
                              icon="dots-vertical"
                              size={20}
                              onPress={() => toggleMenu(session.id)}
                            />
                          }
                        >
                          <Menu.Item
                            leadingIcon="information"
                            onPress={() => {
                              closeMenu(session.id);
                              Alert.alert(
                                'Session Details',
                                `Device: ${session.device}\nLocation: ${session.location}\nOS: ${session.os}\nBrowser: ${session.browser}\nIP: ${session.ipAddress || 'Hidden'}\nLogin: ${new Date(session.loginTime).toLocaleString()}\nLast Active: ${session.lastActivity ? new Date(session.lastActivity).toLocaleString() : 'Unknown'}`
                              );
                            }}
                            title="View Details"
                          />
                          <Menu.Item
                            leadingIcon="alert"
                            onPress={() => {
                              closeMenu(session.id);
                              handleReportSuspicious(session);
                            }}
                            title="Report Suspicious"
                          />
                          <Divider />
                          <Menu.Item
                            leadingIcon="logout-variant"
                            onPress={() => {
                              closeMenu(session.id);
                              setSelectedSession(session);
                              setShowRevokeDialog(true);
                            }}
                            title="Sign Out"
                            titleStyle={{ color: theme.colors.error }}
                          />
                        </Menu>
                      </View>
                    )}
                  />
                  {index < otherSessions.length - 1 && <Divider />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Empty State */}
        {otherSessions.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="shield-check" size={64} color={theme.colors.success} />
              <Text style={styles.emptyTitle}>No Other Sessions</Text>
              <Text style={styles.emptySubtitle}>
                You're only signed in on this device. Your account is secure!
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Security Tips */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Security Tips</Text>
            
            <View style={styles.tip}>
              <Icon name="shield-check" size={20} color={theme.colors.success} />
              <Text style={styles.tipText}>
                Regularly review your active sessions and sign out unused devices
              </Text>
            </View>
            
            <View style={styles.tip}>
              <Icon name="alert" size={20} color={theme.colors.warning} />
              <Text style={styles.tipText}>
                Report any sessions you don't recognize immediately
              </Text>
            </View>
            
            <View style={styles.tip}>
              <Icon name="wifi-off" size={20} color={theme.colors.info} />
              <Text style={styles.tipText}>
                Avoid using public WiFi for accessing sensitive information
              </Text>
            </View>
            
            <View style={styles.tip}>
              <Icon name="lock" size={20} color={theme.colors.primary} />
              <Text style={styles.tipText}>
                Enable two-factor authentication for additional security
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Revoke All Sessions Dialog */}
      <Portal>
        <Dialog visible={showRevokeAllDialog} onDismiss={() => setShowRevokeAllDialog(false)}>
          <Dialog.Title>Sign Out All Other Devices</Dialog.Title>
          <Dialog.Content>
            <Text>
              This will sign you out of all {otherSessions.length} other device{otherSessions.length !== 1 ? 's' : ''}. 
              You will remain signed in on this device.
            </Text>
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

      {/* Revoke Single Session Dialog */}
      <Portal>
        <Dialog visible={showRevokeDialog} onDismiss={() => setShowRevokeDialog(false)}>
          <Dialog.Title>Sign Out Device</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to sign out of this device?
              {selectedSession && (
                <Text style={styles.dialogDetails}>
                  {'\n\n'}Device: {selectedSession.device}
                  {'\n'}Location: {selectedSession.location}
                </Text>
              )}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRevokeDialog(false)}>Cancel</Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              onPress={() => selectedSession && handleRevokeSession(selectedSession.id)}
              loading={actionLoading}
              disabled={actionLoading}
            >
              Sign Out
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
  summaryCard: {
    margin: 16,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.outline,
    marginHorizontal: 16,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 4,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  revokeAllButton: {
    marginTop: 8,
  },
  sessionCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: theme.colors.onSurface,
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
  currentChip: {
    backgroundColor: theme.colors.successContainer,
    height: 24,
  },
  currentText: {
    color: theme.colors.onSuccessContainer,
    fontSize: 12,
    fontWeight: '600',
  },
  riskChip: {
    height: 24,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  emptyCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
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
  dialogDetails: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});