import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Divider,
  Stack,
} from "@mui/material";
import {
  LocationOn,
  FilterList,
  MyLocation,
  Refresh,
  Close,
  ZoomIn,
  Add,
  Visibility,
  ThumbUp,
  AccessTime,
  Category,
  PriorityHigh,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  GoogleMap,
  useLoadScript,
  Marker,
} from "@react-google-maps/api";

import { selectUser, selectIsAuthenticated, selectAuthLoading } from "../../store/slices/authSlice";
import {
  selectMapIssues,
  selectMapIssuesLoading,
  selectIssuesError,
  fetchMapIssues,
  Issue,
} from "../../store/slices/issueSlice";
import { setBreadcrumbs } from "../../store/slices/uiSlice";
import {
  transformIssueForMap,
  createIssueClusters,
  IssueCluster,
  MapIssue,
  getPriorityColor,
  getStatusColor,
  formatDate,
  createMarkerIcon,
} from "../../utils/mapUtils";

const containerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.006, // Default to New York City
};

const Map: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mapIssues = useSelector(selectMapIssues);
  const isLoading = useSelector(selectMapIssuesLoading);
  const error = useSelector(selectIssuesError);

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
  });
  const [selectedCluster, setSelectedCluster] = useState<IssueCluster | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    dispatch(
      setBreadcrumbs([
        { label: "Dashboard", path: "/dashboard" },
        { label: "Issue Map", path: "/map" },
      ])
    );
  }, [dispatch]);

  // Fetch map issues on component mount and when filters change
  useEffect(() => {
    console.log('🔄 Map: Fetching map issues with filters:', filters);
    dispatch(fetchMapIssues(filters));
  }, [dispatch, filters.status, filters.category, filters.priority]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Transform issues and create clusters
  const { mapIssuesData, clusters } = useMemo(() => {
    console.log('🔄 Processing map issues:', mapIssues.length);
    
    if (mapIssues.length === 0) {
      console.log('⚠️ No map issues to process');
      return { mapIssuesData: [], clusters: [] };
    }
    
    const mapIssuesData = mapIssues.map(transformIssueForMap);
    console.log('🔧 Transformed issues:', mapIssuesData.length);
    
    // Apply filters
    const filteredIssues = mapIssuesData.filter(issue => {
      if (filters.status && issue.status !== filters.status) return false;
      if (filters.category && issue.category !== filters.category) return false;
      if (filters.priority && issue.priority !== filters.priority) return false;
      return true;
    });

    console.log('📊 Filtered issues for clustering:', filteredIssues.length);
    
    const clusters = createIssueClusters(filteredIssues);
    console.log('🎯 Created clusters:', clusters.length);
    
    // Log first few clusters for debugging
    clusters.slice(0, 3).forEach((cluster, index) => {
      console.log(`Cluster ${index}:`, {
        id: cluster.id,
        coordinate: cluster.coordinate,
        count: cluster.count,
        issues: cluster.issues.map(i => ({ id: i.id, title: i.title, status: i.status }))
      });
    });
    
    return { mapIssuesData: filteredIssues, clusters };
  }, [mapIssues, filters]);

  const handleMarkerClick = (cluster: IssueCluster) => {
    console.log('🗺️ Marker clicked:', cluster);
    
    if (cluster.count === 1) {
      // Single issue - navigate to detail page
      navigate(`/issue/${cluster.issues[0].id}`);
    } else {
      // Multiple issues - show cluster dialog
      setSelectedCluster(cluster);
    }
  };

  const handleIssueClick = (issue: MapIssue) => {
    setSelectedCluster(null);
    navigate(`/issue/${issue.id}`);
  };

  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      setMapCenter(userLocation);
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(15);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Map: Refreshing issues');
    dispatch(fetchMapIssues(filters));
  };

  const handleFilterChange = (field: string) => (event: SelectChangeEvent<string>) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleZoomToCluster = (cluster: IssueCluster) => {
    if (mapRef.current) {
      mapRef.current.panTo(cluster.coordinate);
      mapRef.current.setZoom(16);
      setSelectedCluster(null);
    }
  };

  if (loadError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading Google Maps. Please check your API key configuration.
        </Alert>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Civic Issues Map
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and explore public issues reported across the city
          </Typography>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<MyLocation />}
            onClick={handleCenterOnUser}
            disabled={!userLocation}
          >
            My Location
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/report-issue')}
          >
            Report Issue
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filter Issues
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={handleFilterChange('status')}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="acknowledged">Acknowledged</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    label="Category"
                    onChange={handleFilterChange('category')}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="pothole">Pothole</MenuItem>
                    <MenuItem value="streetlight">Streetlight</MenuItem>
                    <MenuItem value="garbage">Garbage</MenuItem>
                    <MenuItem value="water_supply">Water Supply</MenuItem>
                    <MenuItem value="sewerage">Sewerage</MenuItem>
                    <MenuItem value="traffic">Traffic</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority}
                    label="Priority"
                    onChange={handleFilterChange('priority')}
                  >
                    <MenuItem value="">All Priorities</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box display="flex" justifyContent="center" mb={2}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 1 }}>
            Loading issues...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Map */}
      <Card sx={{ position: 'relative' }}>
        <CardContent sx={{ p: 0 }}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={13}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            }}
          >
            {/* User Location Marker */}
            {userLocation && (
              <Marker
                position={userLocation}
                icon={{
                  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="8" fill="#2196f3" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="3" fill="white"/>
                    </svg>
                  `)}`,
                  scaledSize: new google.maps.Size(24, 24),
                }}
                title="Your Location"
              />
            )}

            {/* Issue/Cluster Markers */}
            {clusters.map((cluster) => (
              <Marker
                key={cluster.id}
                position={cluster.coordinate}
                onClick={() => handleMarkerClick(cluster)}
                icon={{
                  url: createMarkerIcon(cluster),
                  scaledSize: new google.maps.Size(
                    cluster.count > 1 ? 40 : 32,
                    cluster.count > 1 ? 40 : 32
                  ),
                }}
                title={cluster.count === 1 ? cluster.issues[0].title : `${cluster.count} issues`}
              />
            ))}
          </GoogleMap>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="primary">
              {mapIssuesData.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Issues
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="warning.main">
              {mapIssuesData.filter(issue => issue.status === "pending").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="info.main">
              {mapIssuesData.filter(issue => issue.status === "in_progress").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Progress
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="success.main">
              {mapIssuesData.filter(issue => issue.status === "resolved").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resolved
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Cluster Details Dialog */}
      <Dialog
        open={selectedCluster !== null}
        onClose={() => setSelectedCluster(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Issues at this location ({selectedCluster?.count})
            </Typography>
            <IconButton onClick={() => setSelectedCluster(null)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedCluster?.issues.map((issue, index) => (
              <React.Fragment key={issue.id}>
                <ListItem
                  button
                  onClick={() => handleIssueClick(issue)}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getStatusColor(issue.status) }}>
                      {issue.priority.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {issue.title}
                        </Typography>
                        <Stack direction="row" spacing={1} mt={1}>
                          <Chip
                            size="small"
                            label={issue.category}
                            icon={<Category />}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={issue.status.replace('_', ' ').toUpperCase()}
                            sx={{
                              bgcolor: getStatusColor(issue.status) + '20',
                              color: getStatusColor(issue.status),
                            }}
                          />
                          <Chip
                            size="small"
                            label={issue.priority.toUpperCase()}
                            icon={<PriorityHigh />}
                            sx={{
                              bgcolor: getPriorityColor(issue.priority) + '20',
                              color: getPriorityColor(issue.priority),
                            }}
                          />
                        </Stack>
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="body2" color="text.secondary">
                          <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          {issue.location.address}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            <AccessTime fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {formatDate(issue.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <ThumbUp fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {issue.voteScore || 0} votes
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            By: {issue.author}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <Box>
                    <IconButton>
                      <Visibility />
                    </IconButton>
                  </Box>
                </ListItem>
                {index < (selectedCluster?.issues.length || 0) - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCluster(null)}>
            Close
          </Button>
          {selectedCluster && (
            <Button
              startIcon={<ZoomIn />}
              onClick={() => handleZoomToCluster(selectedCluster)}
              variant="contained"
            >
              Zoom to Area
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Map;
