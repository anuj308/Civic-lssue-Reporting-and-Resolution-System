import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  Chip,
  Avatar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppDispatch, RootState } from '../../store/store';
import { fetchMyIssues, fetchNearbyIssues } from '../../store/slices/issueSlice';
import { getCurrentLocation } from '../../store/slices/locationSlice';
import { theme, spacing } from '../../utils/theme';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { myIssues, nearbyIssues, isLoading } = useSelector((state: RootState) => state.issues);
  const { currentLocation } = useSelector((state: RootState) => state.location);
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get current location
      await dispatch(getCurrentLocation()).unwrap();
      
      // Fetch user's issues
      dispatch(fetchMyIssues({ limit: 5 }));
      
      // Fetch nearby issues if location is available
      if (currentLocation) {
        dispatch(fetchNearbyIssues({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius: 5, // 5km radius
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'acknowledged':
        return theme.colors.primary;
      case 'in_progress':
        return '#FF9800';
      case 'resolved':
        return theme.colors.success;
      case 'closed':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return theme.colors.error;
      case 'high':
        return theme.colors.warning;
      case 'medium':
        return theme.colors.primary;
      case 'low':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const recentIssues = myIssues.slice(0, 3);
  const communityIssues = nearbyIssues.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar.Text
              size={48}
              label={user?.name?.charAt(0) || 'U'}
              style={styles.avatar}
            />
            <View style={styles.greeting}>
              <Text variant="bodyMedium" style={styles.welcomeText}>
                Welcome back,
              </Text>
              <Text variant="titleLarge" style={styles.userName}>
                {user?.name || 'User'}
              </Text>
            </View>
          </View>
          
          <Button
            mode="text"
            icon="bell"
            onPress={() => navigation.navigate('Notifications' as never)}
            style={styles.notificationButton}
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {myIssues.length}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                My Issues
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {myIssues.filter(issue => issue.status === 'resolved').length}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Resolved
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {nearbyIssues.length}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Nearby
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Quick Actions
            </Text>
            
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                icon="camera"
                onPress={() => navigation.navigate('Report' as never)}
                style={styles.actionButton}
                labelStyle={styles.actionButtonLabel}
              >
                Report Issue
              </Button>
              
              <Button
                mode="outlined"
                icon="map"
                onPress={() => navigation.navigate('Map' as never)}
                style={styles.actionButton}
                labelStyle={styles.actionButtonLabel}
              >
                View Map
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Issues */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                My Recent Issues
              </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Issues' as never)}
                labelStyle={styles.seeAllText}
              >
                See All
              </Button>
            </View>

            {recentIssues.length > 0 ? (
              recentIssues.map((issue) => (
                <Card
                  key={issue.id}
                  style={styles.issueCard}
                  onPress={() => navigation.navigate('IssueDetail', { issueId: issue.id } as never)}
                >
                  <Card.Content style={styles.issueContent}>
                    <View style={styles.issueHeader}>
                      <Text variant="titleSmall" style={styles.issueTitle} numberOfLines={1}>
                        {issue.title}
                      </Text>
                      <Chip
                        mode="outlined"
                        textStyle={{ fontSize: 10 }}
                        style={[styles.statusChip, { borderColor: getStatusColor(issue.status) }]}
                      >
                        {issue.status}
                      </Chip>
                    </View>
                    
                    <Text variant="bodySmall" style={styles.issueDescription} numberOfLines={2}>
                      {issue.description}
                    </Text>
                    
                    <View style={styles.issueFooter}>
                      <View style={styles.issueLocation}>
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={12}
                          color={theme.colors.onSurfaceVariant}
                        />
                        <Text variant="bodySmall" style={styles.locationText} numberOfLines={1}>
                          {issue.location.address}
                        </Text>
                      </View>
                      
                      <Chip
                        mode="flat"
                        textStyle={{ fontSize: 10 }}
                        style={[styles.priorityChip, { backgroundColor: getPriorityColor(issue.priority) + '20' }]}
                      >
                        {issue.priority}
                      </Chip>
                    </View>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No issues reported yet
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('Report' as never)}
                  style={styles.emptyAction}
                >
                  Report Your First Issue
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Community Issues */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Community Issues Nearby
            </Text>

            {communityIssues.length > 0 ? (
              communityIssues.map((issue) => (
                <Card
                  key={issue.id}
                  style={styles.issueCard}
                  onPress={() => navigation.navigate('IssueDetail', { issueId: issue.id } as never)}
                >
                  <Card.Content style={styles.issueContent}>
                    <View style={styles.issueHeader}>
                      <Text variant="titleSmall" style={styles.issueTitle} numberOfLines={1}>
                        {issue.title}
                      </Text>
                      <Chip
                        mode="outlined"
                        textStyle={{ fontSize: 10 }}
                        style={[styles.statusChip, { borderColor: getStatusColor(issue.status) }]}
                      >
                        {issue.status}
                      </Chip>
                    </View>
                    
                    <Text variant="bodySmall" style={styles.issueDescription} numberOfLines={2}>
                      {issue.description}
                    </Text>
                    
                    <View style={styles.issueFooter}>
                      <View style={styles.issueLocation}>
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={12}
                          color={theme.colors.onSurfaceVariant}
                        />
                        <Text variant="bodySmall" style={styles.locationText} numberOfLines={1}>
                          {issue.location.address}
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No community issues found nearby
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Report' as never)}
        label="Report Issue"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: spacing.md,
  },
  greeting: {},
  welcomeText: {
    color: theme.colors.onSurfaceVariant,
  },
  userName: {
    color: theme.colors.onBackground,
    fontWeight: '600',
  },
  notificationButton: {},
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statNumber: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  actionsCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.onSurface,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderRadius: 12,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAllText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  issueCard: {
    backgroundColor: theme.colors.surfaceVariant,
    marginBottom: spacing.sm,
  },
  issueContent: {
    paddingVertical: spacing.md,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  issueTitle: {
    flex: 1,
    color: theme.colors.onSurface,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  statusChip: {
    height: 24,
  },
  issueDescription: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    color: theme.colors.onSurfaceVariant,
    marginLeft: spacing.xs,
    flex: 1,
  },
  priorityChip: {
    height: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyAction: {
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: theme.colors.primary,
  },
});

export default HomeScreen;
