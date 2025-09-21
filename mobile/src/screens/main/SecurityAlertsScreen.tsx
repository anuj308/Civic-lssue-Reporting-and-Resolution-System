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
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { sessionApi } from '../../services/api';

interface SecurityAlert {
  id: string;
  type: 'new_device' | 'suspicious_location' | 'failed_login' | 'location_change' | 'unusual_activity';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  status: 'unread' | 'read' | 'acknowledged' | 'resolved';
  location?: string;
  deviceInfo?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export default function SecurityAlertsScreen() {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [filter, setFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await sessionApi.getSecurityAlerts({
        limit: 50,
        status: filter === 'all' ? undefined : filter,
      });
      setAlerts(response.data.data.alerts);
    } catch (error: any) {
      console.error('Error loading security alerts:', error);
      Alert.alert('Error', 'Failed to load security alerts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      setActionLoading(true);
      await sessionApi.updateAlertStatus(alertId, 'read');
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'read' } : alert
      ));
    } catch (error: any) {
      console.error('Error marking alert as read:', error);
      Alert.alert('Error', 'Failed to update alert status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      setActionLoading(true);
      await sessionApi.updateAlertStatus(alertId, 'acknowledged');
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
      ));
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
      Alert.alert('Error', 'Failed to acknowledge alert');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      setActionLoading(true);
      await sessionApi.updateAlertStatus(alertId, 'resolved');
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      ));
    } catch (error: any) {
      console.error('Error resolving alert:', error);
      Alert.alert('Error', 'Failed to resolve alert');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadAlerts = filteredAlerts.filter(alert => alert.status === 'unread');
    if (unreadAlerts.length === 0) {
      Alert.alert('Info', 'No unread alerts to mark');
      return;
    }

    Alert.alert(
      'Mark All as Read',
      `Mark ${unreadAlerts.length} alert(s) as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: async () => {
            try {
              setActionLoading(true);
              await Promise.all(
                unreadAlerts.map(alert => sessionApi.updateAlertStatus(alert.id, 'read'))
              );
              setAlerts(prev => prev.map(alert => 
                alert.status === 'unread' && filteredAlerts.includes(alert) 
                  ? { ...alert, status: 'read' } 
                  : alert
              ));
              Alert.alert('Success', 'All alerts marked as read');
            } catch (error: any) {
              console.error('Error marking alerts as read:', error);
              Alert.alert('Error', 'Failed to mark alerts as read');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const toggleMenu = (alertId: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [alertId]: !prev[alertId]
    }));
  };

  const closeMenu = (alertId: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [alertId]: false
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return theme.colors.error;
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.info;
      default: return theme.colors.outline;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'new_device': return 'cellphone';
      case 'suspicious_location': return 'map-marker-alert';
      case 'failed_login': return 'login-variant';
      case 'location_change': return 'map-marker-path';
      case 'unusual_activity': return 'alert-circle';
      default: return 'security';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return theme.colors.primary;
      case 'read': return theme.colors.onSurfaceVariant;
      case 'acknowledged': return theme.colors.warning;
      case 'resolved': return theme.colors.success;
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
    } else if (diffInMinutes < 10080) { // 7 days
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  const unreadCount = alerts.filter(alert => alert.status === 'unread').length;
  const acknowledgedCount = alerts.filter(alert => alert.status === 'acknowledged').length;
  const resolvedCount = alerts.filter(alert => alert.status === 'resolved').length;

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
            <Text variant="headlineSmall" style={styles.headerTitle}>Security Alerts</Text>
            <View style={{ width: 48 }} />
          </View>
        </Surface>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading security alerts...</Text>
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
          <Text variant="headlineSmall" style={styles.headerTitle}>Security Alerts</Text>
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
                <Icon name="alert" size={24} color={theme.colors.primary} />
                <Text style={styles.summaryNumber}>{alerts.length}</Text>
                <Text style={styles.summaryLabel}>Total Alerts</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryItem}>
                <Icon name="email-alert" size={24} color={theme.colors.error} />
                <Text style={styles.summaryNumber}>{unreadCount}</Text>
                <Text style={styles.summaryLabel}>Unread</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryItem}>
                <Icon name="check-circle" size={24} color={theme.colors.success} />
                <Text style={styles.summaryNumber}>{resolvedCount}</Text>
                <Text style={styles.summaryLabel}>Resolved</Text>
              </View>
            </View>
            
            {unreadCount > 0 && (
              <Button
                mode="contained"
                icon="email-check"
                onPress={handleMarkAllAsRead}
                style={styles.markAllButton}
                loading={actionLoading}
                disabled={actionLoading}
              >
                Mark All as Read
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Filter Tabs */}
        <Card style={styles.filterCard}>
          <Card.Content>
            <SegmentedButtons
              value={filter}
              onValueChange={setFilter}
              buttons={[
                { value: 'all', label: 'All' },
                { value: 'unread', label: `Unread (${unreadCount})` },
                { value: 'acknowledged', label: `Pending (${acknowledgedCount})` },
                { value: 'resolved', label: `Resolved (${resolvedCount})` },
              ]}
            />
          </Card.Content>
        </Card>

        {/* Alerts List */}
        {filteredAlerts.length > 0 ? (
          <Card style={styles.alertsCard}>
            <Card.Content>
              {filteredAlerts.map((alert, index) => (
                <View key={alert.id}>
                  <List.Item
                    title={alert.title}
                    description={
                      <View>
                        <Text style={styles.alertDescription}>{alert.description}</Text>
                        <View style={styles.alertMeta}>
                          <Text style={styles.alertTime}>{formatDate(alert.timestamp)}</Text>
                          {alert.location && (
                            <Text style={styles.alertLocation}>• {alert.location}</Text>
                          )}
                        </View>
                      </View>
                    }
                    left={() => (
                      <View style={styles.alertIcon}>
                        <Icon 
                          name={getAlertIcon(alert.type)} 
                          size={24} 
                          color={getSeverityColor(alert.severity)} 
                        />
                        {alert.status === 'unread' && (
                          <Badge size={8} style={styles.unreadBadge} />
                        )}
                      </View>
                    )}
                    right={() => (
                      <View style={styles.alertRight}>
                        <Chip
                          mode="flat"
                          style={[
                            styles.severityChip, 
                            { backgroundColor: getSeverityColor(alert.severity) + '20' }
                          ]}
                          textStyle={[
                            styles.severityText, 
                            { color: getSeverityColor(alert.severity) }
                          ]}
                        >
                          {alert.severity}
                        </Chip>
                        <Chip
                          mode="flat"
                          style={[
                            styles.statusChip, 
                            { backgroundColor: getStatusColor(alert.status) + '20' }
                          ]}
                          textStyle={[
                            styles.statusText, 
                            { color: getStatusColor(alert.status) }
                          ]}
                        >
                          {alert.status}
                        </Chip>
                        <Menu
                          visible={menuVisible[alert.id] || false}
                          onDismiss={() => closeMenu(alert.id)}
                          anchor={
                            <IconButton
                              icon="dots-vertical"
                              size={20}
                              onPress={() => toggleMenu(alert.id)}
                            />
                          }
                        >
                          <Menu.Item
                            leadingIcon="information"
                            onPress={() => {
                              closeMenu(alert.id);
                              setSelectedAlert(alert);
                              setShowDetailsDialog(true);
                            }}
                            title="View Details"
                          />
                          {alert.status === 'unread' && (
                            <Menu.Item
                              leadingIcon="email-check"
                              onPress={() => {
                                closeMenu(alert.id);
                                handleMarkAsRead(alert.id);
                              }}
                              title="Mark as Read"
                            />
                          )}
                          {(alert.status === 'unread' || alert.status === 'read') && (
                            <Menu.Item
                              leadingIcon="check"
                              onPress={() => {
                                closeMenu(alert.id);
                                handleAcknowledge(alert.id);
                              }}
                              title="Acknowledge"
                            />
                          )}
                          {alert.status !== 'resolved' && (
                            <>
                              <Divider />
                              <Menu.Item
                                leadingIcon="check-circle"
                                onPress={() => {
                                  closeMenu(alert.id);
                                  handleResolve(alert.id);
                                }}
                                title="Resolve"
                                titleStyle={{ color: theme.colors.success }}
                              />
                            </>
                          )}
                        </Menu>
                      </View>
                    )}
                    onPress={() => {
                      setSelectedAlert(alert);
                      setShowDetailsDialog(true);
                      if (alert.status === 'unread') {
                        handleMarkAsRead(alert.id);
                      }
                    }}
                    style={[
                      styles.alertItem,
                      alert.status === 'unread' && styles.unreadAlert
                    ]}
                  />
                  {index < filteredAlerts.length - 1 && <Divider />}
                </View>
              ))}
            </Card.Content>
          </Card>
        ) : (
          /* Empty State */
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon 
                name={filter === 'all' ? 'shield-check' : 'check-all'} 
                size={64} 
                color={theme.colors.success} 
              />
              <Text style={styles.emptyTitle}>
                {filter === 'all' ? 'No Security Alerts' : `No ${filter} Alerts`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all' 
                  ? 'Your account is secure! No security alerts have been detected.'
                  : `You have no ${filter} security alerts at this time.`
                }
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Security Tips */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Security Alert Types</Text>
            
            <View style={styles.tip}>
              <Icon name="cellphone" size={20} color={theme.colors.info} />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>New Device:</Text> Login from an unrecognized device
              </Text>
            </View>
            
            <View style={styles.tip}>
              <Icon name="map-marker-alert" size={20} color={theme.colors.warning} />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Suspicious Location:</Text> Login from unusual location
              </Text>
            </View>
            
            <View style={styles.tip}>
              <Icon name="login-variant" size={20} color={theme.colors.error} />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Failed Login:</Text> Multiple unsuccessful login attempts
              </Text>
            </View>
            
            <View style={styles.tip}>
              <Icon name="alert-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Unusual Activity:</Text> Suspicious account behavior detected
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Alert Details Dialog */}
      <Portal>
        <Dialog 
          visible={showDetailsDialog} 
          onDismiss={() => setShowDetailsDialog(false)}
          style={styles.detailsDialog}
        >
          <Dialog.Title>{selectedAlert?.title}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <View style={styles.detailsContent}>
                <Text style={styles.detailsDescription}>
                  {selectedAlert?.description}
                </Text>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Type:</Text>
                  <Chip
                    mode="flat"
                    icon={getAlertIcon(selectedAlert?.type || '')}
                    style={styles.detailsChip}
                  >
                    {selectedAlert?.type?.replace('_', ' ')}
                  </Chip>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Severity:</Text>
                  <Chip
                    mode="flat"
                    style={[
                      styles.detailsChip, 
                      { backgroundColor: getSeverityColor(selectedAlert?.severity || '') + '20' }
                    ]}
                    textStyle={[
                      styles.severityText, 
                      { color: getSeverityColor(selectedAlert?.severity || '') }
                    ]}
                  >
                    {selectedAlert?.severity}
                  </Chip>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Status:</Text>
                  <Chip
                    mode="flat"
                    style={[
                      styles.detailsChip, 
                      { backgroundColor: getStatusColor(selectedAlert?.status || '') + '20' }
                    ]}
                    textStyle={[
                      styles.statusText, 
                      { color: getStatusColor(selectedAlert?.status || '') }
                    ]}
                  >
                    {selectedAlert?.status}
                  </Chip>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Time:</Text>
                  <Text style={styles.detailsValue}>
                    {selectedAlert?.timestamp && new Date(selectedAlert.timestamp).toLocaleString()}
                  </Text>
                </View>
                
                {selectedAlert?.location && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Location:</Text>
                    <Text style={styles.detailsValue}>{selectedAlert.location}</Text>
                  </View>
                )}
                
                {selectedAlert?.deviceInfo && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Device:</Text>
                    <Text style={styles.detailsValue}>{selectedAlert.deviceInfo}</Text>
                  </View>
                )}
                
                {selectedAlert?.ipAddress && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>IP Address:</Text>
                    <Text style={styles.detailsValue}>{selectedAlert.ipAddress}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowDetailsDialog(false)}>Close</Button>
            {selectedAlert && selectedAlert.status !== 'resolved' && (
              <Button
                mode="contained"
                onPress={() => {
                  setShowDetailsDialog(false);
                  handleResolve(selectedAlert.id);
                }}
                buttonColor={theme.colors.success}
              >
                Resolve
              </Button>
            )}
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
  markAllButton: {
    marginTop: 8,
  },
  filterCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  alertsCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  alertItem: {
    paddingVertical: 8,
  },
  unreadAlert: {
    backgroundColor: theme.colors.primaryContainer + '20',
  },
  alertIcon: {
    position: 'relative',
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: 6,
    backgroundColor: theme.colors.primary,
  },
  alertDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  alertLocation: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  alertRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  severityChip: {
    height: 24,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  sectionTitle: {
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
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
  tipBold: {
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  detailsDialog: {
    maxHeight: '80%',
  },
  detailsContent: {
    gap: 16,
  },
  detailsDescription: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  detailsLabel: {
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
  },
  detailsValue: {
    color: theme.colors.onSurfaceVariant,
    flex: 2,
    textAlign: 'right',
  },
  detailsChip: {
    height: 28,
  },
});