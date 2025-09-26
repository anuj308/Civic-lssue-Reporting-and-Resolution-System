import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  LocationOn,
  Event,
  AccessTime,
  Group,
  Star,
  Info,
  CheckCircle,
  Schedule,
  Business,
  People,
  NatureOutlined,
  School,
  LocalHospital,
  Public,
} from '@mui/icons-material';
import { CommunityEvent } from '../../utils/communityEvents';

interface EventCardProps {
  event: CommunityEvent;
  onClick: (event: CommunityEvent) => void;
  onRegister?: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick, onRegister }) => {
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

  const getPriorityColor = (priority: CommunityEvent['priority']) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
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
      weekday: 'short',
      day: 'numeric',
      month: 'short',
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
    if (diffDays < 0) return 'Past';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return formatDate(dateString);
  };

  const registrationProgress = (event.registeredCount / event.capacity) * 100;

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
          borderColor: 'primary.main',
        },
        border: event.priority === 'high' ? '2px solid' : '1px solid',
        borderColor: event.priority === 'high' ? 'error.main' : 'divider',
        position: 'relative',
        overflow: 'visible',
      }}
      onClick={() => onClick(event)}
    >
      {/* Priority Badge */}
      {event.priority === 'high' && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: 16,
            bgcolor: 'error.main',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            zIndex: 1,
          }}
        >
          HIGH PRIORITY
        </Box>
      )}

      {/* Event Image or Default */}
      <Box sx={{ position: 'relative', height: 140, bgcolor: 'grey.100' }}>
        {event.images && event.images.length > 0 ? (
          <CardMedia
            component="img"
            height="140"
            image={event.images[0]}
            alt={event.title}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${getCategoryColor(event.category)}.light`,
            }}
          >
            {getCategoryIcon(event.category)}
          </Box>
        )}

        {/* Registration Status */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: event.isRegistered ? 'success.main' : 'rgba(255,255,255,0.9)',
            color: event.isRegistered ? 'white' : 'text.primary',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {event.isRegistered ? (
            <>
              <CheckCircle fontSize="small" />
              Registered
            </>
          ) : (
            <>
              <Schedule fontSize="small" />
              Available
            </>
          )}
        </Box>
      </Box>

      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={1}>
          {/* Title and Category */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
              <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2, mr: 1 }}>
                {event.title}
              </Typography>
              <Chip
                label={event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                size="small"
                color={getCategoryColor(event.category) as any}
                variant="outlined"
              />
            </Box>
          </Grid>

          {/* Date and Time */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Event color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {getDaysUntilEvent(event.date)} • {formatTime(event.time)}
              </Typography>
            </Box>
          </Grid>

          {/* Location */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LocationOn color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {event.location.city}, {event.location.state}
                {event.distance && (
                  <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                    ({event.distance.toFixed(1)} km away)
                  </Typography>
                )}
              </Typography>
            </Box>
          </Grid>

          {/* Organizer */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              {getOrganizerIcon(event.organizer.type)}
              <Typography variant="body2" color="text.secondary">
                {event.organizer.name}
              </Typography>
            </Box>
          </Grid>

          {/* Registration Progress */}
          <Grid item xs={12}>
            <Box mb={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Registration ({event.registeredCount}/{event.capacity})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(registrationProgress)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={registrationProgress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: registrationProgress > 80 ? 'error.main' : registrationProgress > 60 ? 'warning.main' : 'success.main',
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Tags */}
          <Grid item xs={12}>
            <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
              {event.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              ))}
              {event.tags.length > 3 && (
                <Chip
                  label={`+${event.tags.length - 3} more`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(event);
                }}
                startIcon={<Info />}
              >
                Details
              </Button>
              {!event.isRegistered && (
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegister?.(event.id);
                  }}
                  disabled={event.registeredCount >= event.capacity}
                  color={event.registeredCount >= event.capacity ? 'inherit' : 'primary'}
                >
                  {event.registeredCount >= event.capacity ? 'Full' : 'Register'}
                </Button>
              )}
              {event.isRegistered && (
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  color="success"
                  startIcon={<CheckCircle />}
                  disabled
                >
                  Registered
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EventCard;