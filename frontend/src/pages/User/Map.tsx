import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Paper,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Map as MapIcon,
  LocationOn,
  Close,
  FilterList,
  MyLocation,
  Refresh,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';

import { selectUser } from '../../store/slices/authSlice';
import { 
  selectIssues, 
  selectIssuesLoading, 
  selectIssuesError, 
  fetchIssues, 
  Issue 
} from '../../store/slices/issueSlice';
import { setBreadcrumbs } from '../../store/slices/uiSlice';

const containerStyle = {
  width: '100%',
  height: '600px',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060, // Default to New York City
};

const Map: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const issues = useSelector(selectIssues);
  const isLoading = useSelector(selectIssuesLoading);
  const error = useSelector(selectIssuesError);

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
  });

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    dispatch(setBreadcrumbs([
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Issue Map', path: '/map' },
    ]));
  }, [dispatch]);

  useEffect(() => {
    // Fetch issues when component mounts or filters change
    dispatch(fetchIssues({
      reportedBy: user?.id,
      ...filters,
    }));
  }, [dispatch, user?.id, filters]);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const handleMarkerClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setDrawerOpen(true);
  };

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
    }
  };

  const handleRefresh = () => {
    dispatch(fetchIssues({
      reportedBy: user?.id,
      ...filters,
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'acknowledged': return '#2196f3';
      case 'in_progress': return '#9c27b0';
      case 'resolved': return '#4caf50';
      default: return '#757575';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'urgent': return '#d32f2f';
      default: return '#757575';
    }
  };

  const filteredIssues = issues?.filter((issue: Issue) => {
    if (!issue.location?.coordinates) return false;
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.category && issue.category !== filters.category) return false;
    if (filters.priority && issue.priority !== filters.priority) return false;
    return true;
  }) || [];

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Issue Map
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and explore issues reported in your area
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
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <FilterList />
            <Typography variant="h6">Filters</Typography>

            <Box display="flex" gap={2} flexWrap="wrap">
              <Box>
                <Typography variant="caption" display="block" gutterBottom>
                  Status
                </Typography>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    minWidth: '120px',
                  }}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </Box>

              <Box>
                <Typography variant="caption" display="block" gutterBottom>
                  Category
                </Typography>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    minWidth: '120px',
                  }}
                >
                  <option value="">All Categories</option>
                  <option value="pothole">Pothole</option>
                  <option value="streetlight">Streetlight</option>
                  <option value="garbage">Garbage</option>
                  <option value="water">Water</option>
                  <option value="electricity">Electricity</option>
                  <option value="other">Other</option>
                </select>
              </Box>

              <Box>
                <Typography variant="caption" display="block" gutterBottom>
                  Priority
                </Typography>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    minWidth: '120px',
                  }}
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={13}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {/* User Location Marker */}
            {userLocation && (
              <Marker
                position={userLocation}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="8" fill="#2196f3" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="3" fill="white"/>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(24, 24),
                }}
                title="Your Location"
              />
            )}

            {/* Issue Markers */}
            {filteredIssues.map((issue: Issue) => (
              <Marker
                key={issue._id}
                position={{
                  lat: issue.location.coordinates[1],
                  lng: issue.location.coordinates[0],
                }}
                onClick={() => handleMarkerClick(issue)}
                icon={{
                  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 2C11.6 2 8 5.6 8 10c0 8 8 18 8 18s8-10 8-18c0-4.4-3.6-8-8-8z" fill="${getStatusColor(issue.status)}"/>
                      <circle cx="16" cy="10" r="4" fill="white"/>
                      <text x="16" y="13" text-anchor="middle" fill="${getStatusColor(issue.status)}" font-size="8" font-weight="bold">${issue.priority.charAt(0).toUpperCase()}</text>
                    </svg>
                  `)}`,
                  scaledSize: new google.maps.Size(32, 32),
                }}
              />
            ))}

            {/* Info Window for selected issue */}
            {selectedIssue && (
              <InfoWindow
                position={{
                  lat: selectedIssue.location.coordinates[1],
                  lng: selectedIssue.location.coordinates[0],
                }}
                onCloseClick={() => setSelectedIssue(null)}
              >
                <Box sx={{ p: 1, maxWidth: 250 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedIssue.title}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedIssue.description.substring(0, 100)}...
                  </Typography>
                  <Box display="flex" gap={1} mb={1}>
                    <Chip
                      label={selectedIssue.status.replace('_', ' ')}
                      size="small"
                      sx={{ backgroundColor: getStatusColor(selectedIssue.status), color: 'white' }}
                    />
                    <Chip
                      label={selectedIssue.priority}
                      size="small"
                      sx={{ backgroundColor: getPriorityColor(selectedIssue.priority), color: 'white' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Reported by {selectedIssue.reportedBy.name}
                  </Typography>
                </Box>
              </InfoWindow>
            )}
          </GoogleMap>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {filteredIssues.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Issues
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {filteredIssues.filter((issue: Issue) => issue.status === 'pending').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {filteredIssues.filter((issue: Issue) => issue.status === 'in_progress').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Progress
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {filteredIssues.filter((issue: Issue) => issue.status === 'resolved').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resolved
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Issue Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Issue Details</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          {selectedIssue && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedIssue.title}
              </Typography>

              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={selectedIssue.status.replace('_', ' ')}
                  size="small"
                  sx={{ backgroundColor: getStatusColor(selectedIssue.status), color: 'white' }}
                />
                <Chip
                  label={selectedIssue.priority}
                  size="small"
                  sx={{ backgroundColor: getPriorityColor(selectedIssue.priority), color: 'white' }}
                />
                <Chip
                  label={selectedIssue.category}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Typography variant="body2" paragraph>
                {selectedIssue.description}
              </Typography>

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2">
                  {selectedIssue.location.address || 'Location coordinates available'}
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Reported by {selectedIssue.reportedBy.name}
              </Typography>

              {/* Issue Images */}
              {selectedIssue.media?.images && selectedIssue.media.images.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Images
                  </Typography>
                  <Grid container spacing={1}>
                    {selectedIssue.media.images.map((imageUrl, index) => (
                      <Grid item xs={6} key={index}>
                        <Paper
                          sx={{
                            height: 80,
                            backgroundImage: `url(${imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: 1,
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Map;