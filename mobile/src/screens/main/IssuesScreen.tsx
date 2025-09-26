import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Surface,
  Chip,
  Button,
  IconButton,
  Badge,
  Portal,
  Modal,
  List,
  Searchbar,
  FAB,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootState, useAppDispatch } from '../../store/store';
import { fetchMyIssues, clearError } from '../../store/slices/issueSlice';
import { theme } from '../../theme/index';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  statusDisplay: string;
  location: {
    address: string;
    city: string;
    pincode: string;
  };
  media: {
    images: string[];
  };
  daysSinceReported: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS = {
  pending: '#FF9800',
  acknowledged: '#2196F3',
  in_progress: '#9C27B0',
  resolved: '#4CAF50',
  closed: '#757575',
  rejected: '#F44336',
};

const PRIORITY_COLORS = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#FF5722',
  critical: '#F44336',
};

const STATUS_COLORS_RGBA = {
  pending: 'rgba(255, 152, 0, 0.2)',
  acknowledged: 'rgba(33, 150, 243, 0.2)',
  in_progress: 'rgba(156, 39, 176, 0.2)',
  resolved: 'rgba(76, 175, 80, 0.2)',
  closed: 'rgba(117, 117, 117, 0.2)',
  rejected: 'rgba(244, 67, 54, 0.2)',
};

const PRIORITY_COLORS_RGBA = {
  low: 'rgba(76, 175, 80, 0.2)',
  medium: 'rgba(255, 152, 0, 0.2)',
  high: 'rgba(255, 87, 34, 0.2)',
  critical: 'rgba(244, 67, 54, 0.2)',
};

const STATUS_COLORS_RGBA_30 = {
  pending: 'rgba(255, 152, 0, 0.3)',
  acknowledged: 'rgba(33, 150, 243, 0.3)',
  in_progress: 'rgba(156, 39, 176, 0.3)',
  resolved: 'rgba(76, 175, 80, 0.3)',
  closed: 'rgba(117, 117, 117, 0.3)',
  rejected: 'rgba(244, 67, 54, 0.3)',
};

const PRIORITY_COLORS_RGBA_30 = {
  low: 'rgba(76, 175, 80, 0.3)',
  medium: 'rgba(255, 152, 0, 0.3)',
  high: 'rgba(255, 87, 34, 0.3)',
  critical: 'rgba(244, 67, 54, 0.3)',
};

const CATEGORY_LABELS = {
  pothole: 'Pothole',
  streetlight: 'Street Light',
  garbage: 'Garbage',
  water_supply: 'Water Supply',
  sewerage: 'Sewerage',
  traffic: 'Traffic',
  park_maintenance: 'Park',
  road_maintenance: 'Road',
  electrical: 'Electrical',
  construction: 'Construction',
  noise_pollution: 'Noise',
  air_pollution: 'Air Pollution',
  water_pollution: 'Water Pollution',
  stray_animals: 'Stray Animals',
  illegal_parking: 'Illegal Parking',
  illegal_construction: 'Illegal Construction',
  public_transport: 'Transport',
  healthcare: 'Healthcare',
  education: 'Education',
  other: 'Other',
};

const IssuesScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { myIssues, isLoading, error, pagination } = useSelector((state: RootState) => state.issues);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const filteredIssues = myIssues.filter((issue: Issue) => {
    const matchesSearch = 
      (issue.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.location?.address || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(issue.status || '');
    const matchesPriority = selectedPriority.length === 0 || selectedPriority.includes(issue.priority || '');
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Fetch issues when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadIssues();
    }, [])
  );

  // Show error snackbar when error occurs
  useEffect(() => {
    if (error) {
      setSnackbarVisible(true);
    }
  }, [error]);

  const loadIssues = async () => {
    try {
      console.log('🔍 Loading user issues...');
      await dispatch(fetchMyIssues({ page: 1, limit: 20, fields: 'id,title,description,category,status,location,timeline,createdAt,media' })).unwrap();
      console.log('✅ Issues loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading issues:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIssues();
    setRefreshing(false);
  };

  const handleIssuePress = (issue: Issue) => {
    navigation.navigate('IssueDetail' as never, { issueId: issue.id } as never);
  };

  const handleStatusFilterToggle = (status: string) => {
    setSelectedStatus(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handlePriorityFilterToggle = (priority: string) => {
    setSelectedPriority(prev => 
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const clearFilters = () => {
    setSelectedStatus([]);
    setSelectedPriority([]);
    setSearchQuery('');
    setFilterModalVisible(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'clock-outline';
      case 'acknowledged': return 'check-circle-outline';
      case 'in_progress': return 'cog-outline';
      case 'resolved': return 'check-all';
      case 'closed': return 'lock-outline';
      case 'rejected': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return 'arrow-down';
      case 'medium': return 'minus';
      case 'high': return 'arrow-up';
      case 'critical': return 'alert';
      default: return 'minus';
    }
  };

  const renderIssueCard = ({ item: issue }: { item: Issue }) => (
    <Card style={styles.issueCard} onPress={() => handleIssuePress(issue)}>
      <Card.Content>
        {/* Header */}
        <View style={styles.issueHeader}>
          <View style={styles.issueHeaderLeft}>
            <Text variant="titleMedium" style={styles.issueTitle} numberOfLines={2}>
              {issue.title || 'Untitled Issue'}
            </Text>
            <Text variant="bodySmall" style={styles.issueDate}>
              {issue.daysSinceReported === 0 
                ? 'Today' 
                : `${issue.daysSinceReported || 0} days ago`
              }
            </Text>
          </View>
          <View style={styles.issueHeaderRight}>
            <Chip
              icon={getStatusIcon(issue.status)}
              style={[
                styles.statusChip,
                { backgroundColor: STATUS_COLORS_RGBA[issue.status] || 'rgba(102, 102, 102, 0.2)' }
              ]}
              textStyle={{ color: STATUS_COLORS[issue.status] || '#666666', fontSize: 12 }}
              compact
            >
              {issue.statusDisplay || issue.status || 'Unknown'}
            </Chip>
          </View>
        </View>

        {/* Description */}
        <Text variant="bodyMedium" style={styles.issueDescription} numberOfLines={3}>
          {issue.description || 'No description available'}
        </Text>

        {/* Tags */}
        <View style={styles.issueTagsContainer}>
          <Chip
            style={styles.categoryChip}
            textStyle={styles.categoryChipText}
            compact
          >
            {CATEGORY_LABELS[issue.category as keyof typeof CATEGORY_LABELS] || issue.category || 'Other'}
          </Chip>
          
          <Chip
            icon={getPriorityIcon(issue.priority)}
            style={[
              styles.priorityChip,
              { backgroundColor: PRIORITY_COLORS_RGBA[issue.priority] || 'rgba(102, 102, 102, 0.2)' }
            ]}
            textStyle={{ color: PRIORITY_COLORS[issue.priority] || '#666666', fontSize: 11 }}
            compact
          >
            {(issue.priority || 'unknown').toUpperCase()}
          </Chip>

          {issue.media?.images?.length > 0 && (
            <Chip
              icon="image"
              style={styles.mediaChip}
              textStyle={styles.mediaChipText}
              compact
            >
              {issue.media.images.length}
            </Chip>
          )}
        </View>

        {/* Location */}
        <Text variant="bodySmall" style={styles.issueLocation} numberOfLines={1}>
          📍 {issue.location?.address || 'Location not available'}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Surface style={styles.emptyCard}>
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          No Issues Yet
        </Text>
        <Text variant="bodyMedium" style={styles.emptyDescription}>
          You haven't reported any issues yet. Tap the + button to report your first civic issue.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('ReportIssue' as never)}
          style={styles.emptyButton}
          icon="plus"
        >
          Report First Issue
        </Button>
      </Surface>
    </View>
  );

  const filterModalContent = () => (
    <View style={styles.filterModalContent}>
      <Text variant="titleLarge" style={styles.filterTitle}>Filter Issues</Text>
      
      {/* Status Filter */}
      <Text variant="titleMedium" style={styles.filterSectionTitle}>Status</Text>
      <View style={styles.filterChipsContainer}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <Chip
            key={status}
            selected={selectedStatus.includes(status)}
            onPress={() => handleStatusFilterToggle(status)}
            style={[
              styles.filterChip,
              selectedStatus.includes(status) && { backgroundColor: STATUS_COLORS_RGBA_30[status] || 'rgba(102, 102, 102, 0.3)' }
            ]}
            textStyle={selectedStatus.includes(status) ? { color: STATUS_COLORS[status] || '#666666' } : undefined}
          >
            {(status || '').replace('_', ' ').toUpperCase()}
          </Chip>
        ))}
      </View>

      {/* Priority Filter */}
      <Text variant="titleMedium" style={styles.filterSectionTitle}>Priority</Text>
      <View style={styles.filterChipsContainer}>
        {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
          <Chip
            key={priority}
            selected={selectedPriority.includes(priority)}
            onPress={() => handlePriorityFilterToggle(priority)}
            style={[
              styles.filterChip,
              selectedPriority.includes(priority) && { backgroundColor: PRIORITY_COLORS_RGBA_30[priority] || 'rgba(102, 102, 102, 0.3)' }
            ]}
            textStyle={selectedPriority.includes(priority) ? { color: PRIORITY_COLORS[priority] || '#666666' } : undefined}
          >
            {(priority || '').toUpperCase()}
          </Chip>
        ))}
      </View>

      {/* Filter Actions */}
      <View style={styles.filterActions}>
        <Button mode="outlined" onPress={clearFilters}>
          Clear All
        </Button>
        <Button mode="contained" onPress={() => setFilterModalVisible(false)}>
          Apply Filters
        </Button>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              My Issues
            </Text>
            {filteredIssues.length > 0 && (
              <Badge style={styles.issueCountBadge}>
                {filteredIssues.length}
              </Badge>
            )}
          </View>
          <IconButton
            icon="filter-variant"
            size={24}
            onPress={() => setFilterModalVisible(true)}
            style={styles.filterButton}
          />
        </View>

        {/* Search Bar */}
        <Searchbar
          placeholder="Search issues..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />

        {/* Active Filters */}
        {(selectedStatus.length > 0 || selectedPriority.length > 0) && (
          <View style={styles.activeFiltersContainer}>
            <Text variant="bodySmall" style={styles.activeFiltersLabel}>
              Active filters:
            </Text>
            <View style={styles.activeFiltersChips}>
              {selectedStatus.map(status => (
                <Chip
                  key={`status-${status}`}
                  onClose={() => handleStatusFilterToggle(status)}
                  style={styles.activeFilterChip}
                  textStyle={styles.activeFilterChipText}
                  compact
                >
                  {status.replace('_', ' ')}
                </Chip>
              ))}
              {selectedPriority.map(priority => (
                <Chip
                  key={`priority-${priority}`}
                  onClose={() => handlePriorityFilterToggle(priority)}
                  style={styles.activeFilterChip}
                  textStyle={styles.activeFilterChipText}
                  compact
                >
                  {priority}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </Surface>

      {/* Issues List */}
      {filteredIssues.length === 0 && !isLoading ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredIssues}
          renderItem={renderIssueCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('ReportIssue' as never)}
        label="Report Issue"
      />

      {/* Filter Modal */}
      <Portal>
        <Modal
          visible={filterModalVisible}
          onDismiss={() => setFilterModalVisible(false)}
          contentContainerStyle={styles.filterModal}
        >
          {filterModalContent()}
        </Modal>
      </Portal>

      {/* Error Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => {
          setSnackbarVisible(false);
          dispatch(clearError());
        }}
        duration={4000}
        action={{
          label: 'Retry',
          onPress: loadIssues,
        }}
      >
        {error || 'Failed to load issues'}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  issueCountBadge: {
    marginLeft: 8,
    backgroundColor: theme.colors.primary,
  },
  filterButton: {
    margin: 0,
  },
  searchBar: {
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  searchInput: {
    fontSize: 14,
  },
  activeFiltersContainer: {
    marginBottom: 8,
  },
  activeFiltersLabel: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  activeFiltersChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activeFilterChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: theme.colors.primaryContainer,
  },
  activeFilterChipText: {
    fontSize: 11,
    color: theme.colors.onPrimaryContainer,
  },
  listContainer: {
    padding: 16,
  },
  issueCard: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  issueHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  issueHeaderRight: {
    alignItems: 'flex-end',
  },
  issueTitle: {
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  issueDate: {
    color: theme.colors.onSurfaceVariant,
  },
  statusChip: {
    paddingHorizontal: 8,
  },
  issueDescription: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 12,
  },
  issueTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: theme.colors.secondaryContainer,
  },
  categoryChipText: {
    fontSize: 11,
    color: theme.colors.onSecondaryContainer,
  },
  priorityChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  mediaChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: theme.colors.tertiaryContainer,
  },
  mediaChipText: {
    fontSize: 11,
    color: theme.colors.onTertiaryContainer,
  },
  issueLocation: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  emptyTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  filterModal: {
    backgroundColor: theme.colors.surface,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  filterModalContent: {
    padding: 20,
  },
  filterTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.onSurface,
  },
  filterSectionTitle: {
    marginBottom: 12,
    marginTop: 16,
    color: theme.colors.onSurface,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
});

export default IssuesScreen;