import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Avatar,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Close,
  LocationOn,
  Event,
  AccessTime,
  Group,
  Business,
  Phone,
  Email,
  Language,
  CheckCircle,
  Star,
  NatureOutlined,
  School,
  LocalHospital,
  Public,
  People,
  Schedule,
  Info,
} from '@mui/icons-material';
import { CommunityEvent } from '../../utils/communityEvents';

interface EventDetailsModalProps {
  event: CommunityEvent | null;
  open: boolean;
  onClose: () => void;
  onRegister?: (eventId: string) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  open,
  onClose,
  onRegister,
}) => {
  if (!event) return null;

  const getCategoryIcon = (category: CommunityEvent['category']) => {
    switch (category) {
      case 'awareness':
        return <Public color="primary" />;
      case 'cleaning':
        return <NatureOutlined color="success" />;
      case 'education':
        return <School color="info" />;
      case 'health':
        return <LocalHospital color="error" />;
      case 'environment':
        return <NatureOutlined color="success" />;
      case 'social':
        return <People color="warning" />;
      default:
        return <Event color="action" />;
    }
  };

  const getCategoryColor = (category: CommunityEvent['category']) => {
    switch (category) {
      case 'awareness':
        return 'primary';
      case 'cleaning':
        return 'success';
      case 'education':
        return 'info';
      case 'health':
        return 'error';
      case 'environment':
        return 'success';
      case 'social':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getOrganizerIcon = (type: CommunityEvent['organizer']['type']) => {
    switch (type) {
      case 'government':
        return <Business color="primary" />;
      case 'ngo':
        return <People color="success" />;
      case 'community':
        return <Group color="info" />;
      case 'private':
        return <Business color="warning" />;
      default:
        return <Business color="action" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysUntilEvent = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Past Event';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return formatDate(dateString);
  };

  const registrationProgress = (event.registeredCount / event.capacity) * 100;
  const spotsLeft = event.capacity - event.registeredCount;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: `${getCategoryColor(event.category)}.main`,
                width: 56,
                height: 56,
              }}
            >
              {getCategoryIcon(event.category)}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {event.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {event.category.charAt(0).toUpperCase() + event.category.slice(1)} • {event.type}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="large">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Event Images */}
          {event.images && event.images.length > 0 && (
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  overflowX: 'auto',
                  pb: 1,
                }}
              >
                {event.images.map((image, index) => (
                  <Box
                    key={index}
                    component="img"
                    src={image}
                    alt={`${event.title} ${index + 1}`}
                    sx={{
                      width: 200,
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </Box>
            </Grid>
          )}

          {/* Basic Information */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Event Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Event color="action" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Date:</strong> {formatDate(event.date)}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AccessTime color="action" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Time:</strong> {formatTime(event.time)} ({event.duration})
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOn color="action" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Location:</strong> {event.location.address}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocationOn color="action" fontSize="small" />
                      <Typography variant="body2">
                        <strong>City:</strong> {event.location.city}, {event.location.state}
                      </Typography>
                    </Box>
                    {event.distance && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <LocationOn color="action" fontSize="small" />
                        <Typography variant="body2">
                          <strong>Distance:</strong> {event.distance.toFixed(1)} km from your location
                        </Typography>
                      </Box>
                    )}
                    <Box display="flex" alignItems="center" gap={1}>
                      <Schedule color="action" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Status:</strong> {getDaysUntilEvent(event.date)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Organizer Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {getOrganizerIcon(event.organizer.type)}
                  <span style={{ marginLeft: 8 }}>Organizer</span>
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {event.organizer.name}
                </Typography>
                <Chip
                  label={event.organizer.type.charAt(0).toUpperCase() + event.organizer.type.slice(1)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />

                {/* Contact Information */}
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Contact Information
                  </Typography>
                  {event.contactInfo.phone && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body2">{event.contactInfo.phone}</Typography>
                    </Box>
                  )}
                  {event.contactInfo.email && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2">{event.contactInfo.email}</Typography>
                    </Box>
                  )}
                  {event.contactInfo.website && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Language fontSize="small" color="action" />
                      <Typography variant="body2">{event.contactInfo.website}</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Registration Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Group sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Registration
                </Typography>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Registration Progress</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {event.registeredCount}/{event.capacity} ({Math.round(registrationProgress)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={registrationProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: registrationProgress > 80 ? 'error.main' : registrationProgress > 60 ? 'warning.main' : 'success.main',
                      },
                    }}
                  />
                </Box>

                {spotsLeft > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {spotsLeft} spots remaining
                  </Alert>
                )}

                {spotsLeft === 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Event is fully booked
                  </Alert>
                )}

                {event.isRegistered && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <CheckCircle sx={{ mr: 1, fontSize: 16 }} />
                    You are registered for this event
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                  About This Event
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {event.description}
                </Typography>

                {/* Tags */}
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  {event.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Requirements and Benefits */}
          <Grid item xs={12} md={6}>
            {event.requirements && event.requirements.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Requirements
                  </Typography>
                  <List dense>
                    {event.requirements.map((requirement, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Star color="action" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={requirement} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            {event.benefits && event.benefits.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Benefits
                  </Typography>
                  <List dense>
                    {event.benefits.map((benefit, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={benefit} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {!event.isRegistered && event.registeredCount < event.capacity && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => onRegister?.(event.id)}
          >
            Register for Event
          </Button>
        )}
        {event.isRegistered && (
          <Button variant="outlined" color="success" disabled>
            <CheckCircle sx={{ mr: 1 }} />
            Already Registered
          </Button>
        )}
        {event.registeredCount >= event.capacity && !event.isRegistered && (
          <Button variant="outlined" disabled>
            Event Full
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailsModal;