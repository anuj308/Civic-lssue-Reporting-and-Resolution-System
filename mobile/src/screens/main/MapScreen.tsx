import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Surface,
  Text,
  Chip,
  IconButton,
  Button,
  Searchbar,
  Portal,
  Modal,
  Card,
  Avatar,
  SegmentedButtons,
  FAB,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, Callout, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/store';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface Issue {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: string;
  author: string;
  upvotes: number;
  comments: number;
}

interface IssueCluster {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  issues: Issue[];
  count: number;
}

export default function MapScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const [region, setRegion] = useState<Region>({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  
  const mapRef = useRef<MapView>(null);

  const mockIssues: Issue[] = [
    {
      id: '1',
      title: 'Broken Street Light',
      category: 'Infrastructure',
      priority: 'high',
      status: 'in_progress',
      location: { latitude: 40.7580, longitude: -73.9855, address: '123 Main St' },
      createdAt: '2024-01-15T10:30:00Z',
      author: 'John Doe',
      upvotes: 24,
      comments: 8,
    },
    {
      id: '2',
      title: 'Pothole on Broadway',
      category: 'Infrastructure',
      priority: 'medium',
      status: 'pending',
      location: { latitude: 40.7614, longitude: -73.9776, address: '456 Broadway' },
      createdAt: '2024-01-14T15:20:00Z',
      author: 'Jane Smith',
      upvotes: 18,
      comments: 5,
    },
    {
      id: '3',
      title: 'Illegal Dumping',
      category: 'Environment',
      priority: 'high',
      status: 'pending',
      location: { latitude: 40.7505, longitude: -73.9934, address: '789 Park Ave' },
      createdAt: '2024-01-13T09:45:00Z',
      author: 'Mike Johnson',
      upvotes: 31,
      comments: 12,
    },
    {
      id: '4',
      title: 'Traffic Light Malfunction',
      category: 'Traffic',
      priority: 'critical',
      status: 'in_progress',
      location: { latitude: 40.7589, longitude: -73.9851, address: '321 5th Ave' },
      createdAt: '2024-01-12T14:30:00Z',
      author: 'Sarah Wilson',
      upvotes: 45,
      comments: 15,
    },
    {
      id: '5',
      title: 'Playground Equipment Broken',
      category: 'Parks',
      priority: 'medium',
      status: 'resolved',
      location: { latitude: 40.7829, longitude: -73.9654, address: '654 Central Park' },
      createdAt: '2024-01-10T11:15:00Z',
      author: 'Lisa Brown',
      upvotes: 22,
      comments: 7,
    },
  ];

  const categories = [
    { label: 'All', value: 'all' },
    { label: 'Infrastructure', value: 'Infrastructure' },
    { label: 'Environment', value: 'Environment' },
    { label: 'Traffic', value: 'Traffic' },
    { label: 'Parks', value: 'Parks' },
    { label: 'Safety', value: 'Safety' },
  ];

  const statuses = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
  ];

  useEffect(() => {
    loadIssues();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (issues.length > 0) {
      const filteredIssues = getFilteredIssues();
      generateClusters(filteredIssues);
    }
  }, [issues, filterCategory, filterStatus]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        setShowUserLocation(true);
        
        // Center map on user location
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const loadIssues = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIssues(mockIssues);
    } catch (error) {
      console.error('Error loading issues:', error);
      Alert.alert('Error', 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredIssues = () => {
    return issues.filter(issue => {
      const categoryMatch = filterCategory === 'all' || issue.category === filterCategory;
      const statusMatch = filterStatus === 'all' || issue.status === filterStatus;
      const searchMatch = searchQuery === '' || 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.location.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      return categoryMatch && statusMatch && searchMatch;
    });
  };

  const generateClusters = (filteredIssues: Issue[]) => {
    // Simple clustering algorithm based on distance
    const clusters: IssueCluster[] = [];
    const processedIssues = new Set<string>();
    const clusterDistance = 0.001; // ~100 meters

    filteredIssues.forEach(issue => {
      if (processedIssues.has(issue.id)) return;

      const nearbyIssues = filteredIssues.filter(otherIssue => {
        if (processedIssues.has(otherIssue.id) || issue.id === otherIssue.id) return false;
        
        const distance = Math.sqrt(
          Math.pow(issue.location.latitude - otherIssue.location.latitude, 2) +
          Math.pow(issue.location.longitude - otherIssue.location.longitude, 2)
        );
        
        return distance < clusterDistance;
      });

      const clusterIssues = [issue, ...nearbyIssues];
      clusterIssues.forEach(clusterIssue => processedIssues.add(clusterIssue.id));

      if (clusterIssues.length > 1) {
        // Create cluster
        const centerLat = clusterIssues.reduce((sum, i) => sum + i.location.latitude, 0) / clusterIssues.length;
        const centerLng = clusterIssues.reduce((sum, i) => sum + i.location.longitude, 0) / clusterIssues.length;
        
        clusters.push({
          id: `cluster_${issue.id}`,
          coordinate: { latitude: centerLat, longitude: centerLng },
          issues: clusterIssues,
          count: clusterIssues.length,
        });
      } else {
        // Single issue
        clusters.push({
          id: issue.id,
          coordinate: { latitude: issue.location.latitude, longitude: issue.location.longitude },
          issues: [issue],
          count: 1,
        });
      }
    });

    setClusters(clusters);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'infrastructure': return 'road-variant';
      case 'environment': return 'leaf';
      case 'safety': return 'shield-check';
      case 'traffic': return 'traffic-light';
      case 'utilities': return 'power-plug';
      case 'parks': return 'tree';
      case 'waste': return 'delete';
      case 'housing': return 'home';
      case 'health': return 'medical-bag';
      case 'education': return 'school';
      case 'transport': return 'bus';
      default: return 'alert-circle';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      case 'critical': return '#9C27B0';
      default: return theme.colors.outline;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'in_progress': return theme.colors.primary;
      case 'resolved': return theme.colors.success;
      case 'rejected': return theme.colors.error;
      default: return theme.colors.outline;
    }
  };

  const handleMarkerPress = (cluster: IssueCluster) => {
    if (cluster.count === 1) {
      setSelectedIssue(cluster.issues[0]);
    } else {
      // Zoom to cluster
      const region = {
        latitude: cluster.coordinate.latitude,
        longitude: cluster.coordinate.longitude,
        latitudeDelta: LATITUDE_DELTA / 4,
        longitudeDelta: LONGITUDE_DELTA / 4,
      };
      mapRef.current?.animateToRegion(region, 1000);
    }
  };

  const handleIssuePress = (issue: Issue) => {
    setSelectedIssue(null);
    navigation.navigate('IssueDetail', { issueId: issue.id });
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      const region = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: LATITUDE_DELTA / 2,
        longitudeDelta: LONGITUDE_DELTA / 2,
      };
      mapRef.current?.animateToRegion(region, 1000);
    } else {
      requestLocationPermission();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <IconButton
              icon="menu"
              size={24}
              onPress={() => {
                // TODO: Implement drawer or menu functionality
                console.log('Menu pressed');
              }}
            />
            <Text variant="headlineSmall" style={styles.headerTitle}>Issues Map</Text>
          </View>
          <View style={styles.headerRight}>
            <IconButton
              icon="filter-variant"
              size={24}
              onPress={() => setShowFilters(true)}
            />
            <IconButton
              icon="crosshairs-gps"
              size={24}
              onPress={centerOnUserLocation}
            />
          </View>
        </View>
        
        {/* Search Bar */}
        <Searchbar
          placeholder="Search issues or locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </Surface>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          mapType={mapType}
          showsUserLocation={showUserLocation}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
        >
          {clusters.map((cluster) => (
            <Marker
              key={cluster.id}
              coordinate={cluster.coordinate}
              onPress={() => handleMarkerPress(cluster)}
            >
              <View style={[
                styles.markerContainer,
                cluster.count > 1 ? styles.clusterMarker : styles.singleMarker,
                { borderColor: cluster.count > 1 ? theme.colors.primary : getPriorityColor(cluster.issues[0].priority) }
              ]}>
                {cluster.count > 1 ? (
                  <Text style={styles.clusterText}>{cluster.count}</Text>
                ) : (
                  <Icon
                    name={getCategoryIcon(cluster.issues[0].category)}
                    size={16}
                    color={getPriorityColor(cluster.issues[0].priority)}
                  />
                )}
              </View>
            </Marker>
          ))}
        </MapView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading issues...</Text>
          </View>
        )}
      </View>

      {/* Issue Detail Modal */}
      <Portal>
        <Modal
          visible={selectedIssue !== null}
          onDismiss={() => setSelectedIssue(null)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedIssue && (
            <Card style={styles.issueCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.issueHeader}>
                  <View style={styles.categoryRow}>
                    <Icon
                      name={getCategoryIcon(selectedIssue.category)}
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.categoryText}>{selectedIssue.category}</Text>
                  </View>
                  <View style={styles.statusChips}>
                    <Chip
                      mode="flat"
                      style={[styles.statusChip, { backgroundColor: getStatusColor(selectedIssue.status) + '20' }]}
                      textStyle={[styles.chipText, { color: getStatusColor(selectedIssue.status) }]}
                    >
                      {selectedIssue.status.replace('_', ' ').toUpperCase()}
                    </Chip>
                    <Chip
                      mode="flat"
                      style={[styles.priorityChip, { backgroundColor: getPriorityColor(selectedIssue.priority) + '20' }]}
                      textStyle={[styles.chipText, { color: getPriorityColor(selectedIssue.priority) }]}
                    >
                      {selectedIssue.priority.toUpperCase()}
                    </Chip>
                  </View>
                </View>
                
                <Text style={styles.issueTitle}>{selectedIssue.title}</Text>
                
                <View style={styles.locationRow}>
                  <Icon name="map-marker" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.locationText}>{selectedIssue.location.address}</Text>
                </View>
                
                <View style={styles.issueFooter}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Icon name="thumb-up-outline" size={14} color={theme.colors.onSurfaceVariant} />
                      <Text style={styles.statText}>{selectedIssue.upvotes}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Icon name="comment-outline" size={14} color={theme.colors.onSurfaceVariant} />
                      <Text style={styles.statText}>{selectedIssue.comments}</Text>
                    </View>
                  </View>
                  <Text style={styles.dateText}>{formatDate(selectedIssue.createdAt)}</Text>
                </View>
              </Card.Content>
              
              <Card.Actions>
                <Button onPress={() => setSelectedIssue(null)}>Close</Button>
                <Button
                  mode="contained"
                  onPress={() => handleIssuePress(selectedIssue)}
                >
                  View Details
                </Button>
              </Card.Actions>
            </Card>
          )}
        </Modal>
      </Portal>

      {/* Filters Modal */}
      <Portal>
        <Modal
          visible={showFilters}
          onDismiss={() => setShowFilters(false)}
          contentContainerStyle={styles.filtersModal}
        >
          <Surface style={styles.filtersContent}>
            <View style={styles.filtersHeader}>
              <Text variant="headlineSmall">Filters</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowFilters(false)}
              />
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Map Type</Text>
              <SegmentedButtons
                value={mapType}
                onValueChange={(value) => setMapType(value as any)}
                buttons={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'satellite', label: 'Satellite' },
                  { value: 'hybrid', label: 'Hybrid' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Category</Text>
              <View style={styles.filterChips}>
                {categories.map((category) => (
                  <Chip
                    key={category.value}
                    mode={filterCategory === category.value ? 'flat' : 'outlined'}
                    selected={filterCategory === category.value}
                    onPress={() => setFilterCategory(category.value)}
                    style={styles.filterChip}
                  >
                    {category.label}
                  </Chip>
                ))}
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Status</Text>
              <View style={styles.filterChips}>
                {statuses.map((status) => (
                  <Chip
                    key={status.value}
                    mode={filterStatus === status.value ? 'flat' : 'outlined'}
                    selected={filterStatus === status.value}
                    onPress={() => setFilterStatus(status.value)}
                    style={styles.filterChip}
                  >
                    {status.label}
                  </Chip>
                ))}
              </View>
            </View>
            
            <View style={styles.filtersActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setFilterCategory('all');
                  setFilterStatus('all');
                  setSearchQuery('');
                }}
                style={styles.clearButton}
              >
                Clear All
              </Button>
              <Button
                mode="contained"
                onPress={() => setShowFilters(false)}
                style={styles.applyButton}
              >
                Apply Filters
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('ReportIssue')}
      />
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
    paddingBottom: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    elevation: 0,
  },
  searchInput: {
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.onSurfaceVariant,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    backgroundColor: theme.colors.surface,
  },
  singleMarker: {
    borderColor: theme.colors.primary,
  },
  clusterMarker: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  clusterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.onPrimaryContainer,
  },
  modalContainer: {
    padding: 20,
  },
  issueCard: {
    backgroundColor: theme.colors.surface,
  },
  cardContent: {
    padding: 16,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryText: {
    marginLeft: 6,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statusChips: {
    flexDirection: 'row',
    gap: 6,
  },
  statusChip: {
    height: 24,
  },
  priorityChip: {
    height: 24,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    marginLeft: 4,
    color: theme.colors.onSurfaceVariant,
    flex: 1,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  dateText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  filtersModal: {
    margin: 20,
  },
  filtersContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    maxHeight: height * 0.8,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  filterSection: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surface,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    height: 32,
  },
  filtersActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 12,
    gap: 12,
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: theme.colors.primary,
  },
});
