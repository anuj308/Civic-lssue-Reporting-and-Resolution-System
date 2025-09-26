import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  Event,
  Group,
  MyLocation,
  Refresh,
  Info,
} from '@mui/icons-material';
import EventCard from '../../components/Community/EventCard';
import EventDetailsModal from '../../components/Community/EventDetailsModal';
import {
  getNearbyEvents,
  getUpcomingEvents,
  searchEvents,
  getEventsByCategory,
  CommunityEvent,
  getEventStats,
  getUserLocation,
} from '../../utils/communityEvents';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const CommunityEvents: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as const });

  const userLocation = useMemo(() => getUserLocation(), []);
  const eventStats = useMemo(() => getEventStats(), []);

  // Get events based on active tab
  const events = useMemo(() => {
    let baseEvents: CommunityEvent[];

    switch (activeTab) {
      case 0: // Nearby Events
        baseEvents = getNearbyEvents(25); // Within 25km
        break;
      case 1: // Upcoming Events
        baseEvents = getUpcomingEvents();
        break;
      case 2: // All Events
        baseEvents = getNearbyEvents(100); // Within 100km
        break;
      default:
        baseEvents = getNearbyEvents(25);
    }

    // Apply search filter
    if (searchTerm) {
      baseEvents = searchEvents(searchTerm).filter(event =>
        baseEvents.some(baseEvent => baseEvent.id === event.id)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      baseEvents = baseEvents.filter(event => event.category === selectedCategory);
    }

    return baseEvents;
  }, [activeTab, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(getNearbyEvents(100).map(event => event.category))];
    return uniqueCategories.sort();
  }, []);

  const handleEventClick = (event: CommunityEvent) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleRegister = async (eventId: string) => {
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state (in real app, this would come from API response)
      setSelectedEvent(prev => prev ? { ...prev, isRegistered: true, registeredCount: prev.registeredCount + 1 } : null);

      setSnackbar({
        open: true,
        message: 'Successfully registered for the event!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to register for the event. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const tabLabels = [
    `Nearby Events (${getNearbyEvents(25).length})`,
    `Upcoming Events (${getUpcomingEvents().length})`,
    `All Events (${getNearbyEvents(100).length})`
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          <Event sx={{ mr: 2, verticalAlign: 'middle' }} />
          Community Events Near Me
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={2}>
          Discover and participate in community initiatives around {userLocation.city}, {userLocation.state}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Join awareness campaigns, cleaning drives, health camps, and educational programs in your area
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Event sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {eventStats.totalEvents}
              </Typography>
              <Typography variant="body2">
                Total Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Group sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {eventStats.registeredUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                People Engaged
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MyLocation sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {eventStats.upcomingEvents}
              </Typography>
              <Typography variant="body2">
                Upcoming Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Info sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {eventStats.utilizationRate}%
              </Typography>
              <Typography variant="body2">
                Avg. Participation
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Location Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
        Showing events near <strong>{userLocation.city}, {userLocation.state}</strong>.
        Events are filtered within 25km for nearby tab, 100km for all events.
      </Alert>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant={isMobile ? 'scrollable' : 'standard'}>
          {tabLabels.map((label, index) => (
            <Tab key={index} label={label} />
          ))}
        </Tabs>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filter Events
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search events, organizers, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                disabled={!searchTerm && !selectedCategory}
                startIcon={<Refresh />}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Showing {events.length} events
          {activeTab === 0 && ' within 25km'}
          {activeTab === 2 && ' within 100km'}
        </Typography>
        <Box display="flex" gap={1}>
          {selectedCategory && (
            <Chip
              label={`Category: ${selectedCategory}`}
              onDelete={() => setSelectedCategory('')}
              color="primary"
              variant="outlined"
            />
          )}
          {searchTerm && (
            <Chip
              label={`Search: "${searchTerm}"`}
              onDelete={() => setSearchTerm('')}
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Event Cards */}
      <TabPanel value={activeTab} index={activeTab}>
        {events.length > 0 ? (
          <Grid container spacing={3}>
            {events.map((event) => (
              <Grid item xs={12} lg={6} xl={4} key={event.id}>
                <EventCard
                  event={event}
                  onClick={handleEventClick}
                  onRegister={handleRegister}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box textAlign="center" py={8}>
            <Event sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No events found
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              {searchTerm || selectedCategory
                ? 'Try adjusting your search terms or filters'
                : 'No events available in your area at the moment'
              }
            </Typography>
            {(searchTerm || selectedCategory) && (
              <Button
                variant="outlined"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        )}
      </TabPanel>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        open={modalOpen}
        onClose={handleCloseModal}
        onRegister={handleRegister}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CommunityEvents;