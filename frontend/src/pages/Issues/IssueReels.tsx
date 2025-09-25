import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Fab,
  useTheme,
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Stack,
} from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  LocationOn,
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  FilterList,
  MyLocation,
  Public,
  Lock,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "../../store/store";
import {
  fetchIssues,
  fetchNearbyIssues,
  voteOnIssue,
  removeVoteFromIssue,
  selectIssues,
  selectIssuesLoading,
  selectIssuesError,
  clearError
} from "../../store/slices/issueSlice";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { setBreadcrumbs, setPageTitle } from "../../store/slices/uiSlice";

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  statusDisplay: string;
  location: {
    address: string;
    city: string;
    state?: string;
    pincode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  media: {
    images: string[];
    videos: string[];
    audio?: string;
  };
  timeline: {
    reported: string;
    acknowledged?: string;
    started?: string;
    resolved?: string;
  };
  reportedBy: {
    name: string;
  } | null;
  voteScore: number;
  userVote: 'upvote' | 'downvote' | null;
  daysSinceReported: number;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
}

const IssueReels: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const currentUser = useSelector(selectCurrentUser);
  const issues = useSelector(selectIssues);
  const loading = useSelector(selectIssuesLoading);
  const error = useSelector(selectIssuesError);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    radius: 1000, // Default 1km
    locationEnabled: false,
    userLocation: null as { lat: number; lng: number } | null,
    scope: 'nearby' as 'nearby' | 'city' | 'state' | 'nationwide'
  });

  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(setPageTitle("Issue Reels"));
    dispatch(
      setBreadcrumbs([
        { label: "Dashboard", path: "/dashboard" },
        { label: "Issue Reels", path: "/reels" },
      ])
    );

    // Clear any existing errors
    dispatch(clearError());

    // Load initial issues
    loadIssues();
  }, [dispatch]);

  const loadIssues = useCallback(async () => {
    try {
      let queryParams: any = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        order: 'desc'
      };

      // Add location-based filtering if enabled
      if (filters.locationEnabled && filters.userLocation) {
        if (filters.scope === 'nearby') {
          // Use nearby issues API
          await dispatch(fetchNearbyIssues({
            latitude: filters.userLocation.lat,
            longitude: filters.userLocation.lng,
            radius: filters.radius,
            page: 1,
            limit: 20
          })).unwrap();
          return;
        }
      }

      // Add category filter
      if (filters.category) {
        queryParams.category = filters.category;
      }

      await dispatch(fetchIssues(queryParams)).unwrap();
    } catch (err) {
      console.error('Failed to load issues:', err);
    }
  }, [dispatch, filters]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFilters(prev => ({
          ...prev,
          userLocation: { lat: latitude, lng: longitude },
          locationEnabled: true
        }));
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location. Please try again.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  // Handle video play/pause
  const toggleVideoPlayback = (issueId: string) => {
    const video = videoRefs.current.get(issueId);
    if (!video) return;

    if (playingVideos.has(issueId)) {
      video.pause();
      setPlayingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(issueId);
        return newSet;
      });
    } else {
      video.play();
      setPlayingVideos(prev => new Set(prev).add(issueId));
    }
  };

  // Handle video mute/unmute
  const toggleVideoMute = (issueId: string) => {
    const video = videoRefs.current.get(issueId);
    if (!video) return;

    video.muted = !video.muted;
    setMutedVideos(prev => {
      const newSet = new Set(prev);
      if (video.muted) {
        newSet.add(issueId);
      } else {
        newSet.delete(issueId);
      }
      return newSet;
    });
  };

  // Handle voting
  const handleVote = async (issueId: string, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) {
      // Redirect to login for non-authenticated users
      navigate('/login');
      return;
    }

    try {
      const issue = issues.find(i => i.id === issueId);
      if (!issue) return;

      if (issue.userVote === voteType) {
        // Remove vote
        await dispatch(removeVoteFromIssue(issueId)).unwrap();
      } else {
        // Add/change vote
        await dispatch(voteOnIssue({ issueId, voteType })).unwrap();
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  // Handle sharing
  const handleShare = async (issue: Issue) => {
    const shareData = {
      title: issue.title,
      text: `Check out this civic issue: ${issue.title}`,
      url: `${window.location.origin}/issues/${issue.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.url);
      // You could show a toast here
    }
  };

  // Handle scroll to next/previous reel
  const scrollToReel = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentIndex < issues.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        scrollToReel('next');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToReel('prev');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, issues.length]);

  // Auto-play visible video
  useEffect(() => {
    const currentIssue = issues[currentIndex];
    if (currentIssue && currentIssue.media.videos.length > 0) {
      const video = videoRefs.current.get(currentIssue.id);
      if (video && !playingVideos.has(currentIssue.id)) {
        video.play().catch(() => {
          // Auto-play failed, user interaction required
        });
      }
    }

    // Pause other videos
    issues.forEach((issue, index) => {
      if (index !== currentIndex) {
        const video = videoRefs.current.get(issue.id);
        if (video && playingVideos.has(issue.id)) {
          video.pause();
          setPlayingVideos(prev => {
            const newSet = new Set(prev);
            newSet.delete(issue.id);
            return newSet;
          });
        }
      }
    });
  }, [currentIndex, issues, playingVideos]);

  const categories = [
    "pothole",
    "streetlight",
    "garbage",
    "water_supply",
    "sewerage",
    "traffic",
    "park_maintenance",
    "road_maintenance",
    "electrical",
    "construction",
    "noise_pollution",
    "air_pollution",
    "water_pollution",
    "stray_animals",
    "illegal_parking",
    "illegal_construction",
    "public_transport",
    "healthcare",
    "education",
    "other",
  ];

  const categoryDisplayNames: Record<string, string> = {
    pothole: "Pothole",
    streetlight: "Street Light",
    garbage: "Garbage Management",
    water_supply: "Water Supply",
    sewerage: "Sewerage",
    traffic: "Traffic Issues",
    park_maintenance: "Park Maintenance",
    road_maintenance: "Road Maintenance",
    electrical: "Electrical Issues",
    construction: "Construction Issues",
    noise_pollution: "Noise Pollution",
    air_pollution: "Air Pollution",
    water_pollution: "Water Pollution",
    stray_animals: "Stray Animals",
    illegal_parking: "Illegal Parking",
    illegal_construction: "Illegal Construction",
    public_transport: "Public Transport",
    healthcare: "Healthcare",
    education: "Education",
    other: "Other",
  };

  if (loading && issues.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'black'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          bgcolor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Issue Reels
        </Typography>
        <IconButton
          onClick={() => setFilterOpen(true)}
          sx={{ color: 'white' }}
        >
          <FilterList />
        </IconButton>
      </Box>

      {/* Reels Container */}
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {issues.map((issue, index) => (
          <Box
            key={issue.id}
            sx={{
              flex: 1,
              display: index === currentIndex ? 'flex' : 'none',
              flexDirection: 'column',
              position: 'relative',
              bgcolor: 'black'
            }}
          >
            {/* Media Content */}
            <Box sx={{ flex: 1, position: 'relative' }}>
              {issue.media.videos.length > 0 ? (
                <video
                  ref={el => {
                    if (el) videoRefs.current.set(issue.id, el);
                  }}
                  src={issue.media.videos[0]}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  loop
                  playsInline
                  onPlay={() => setPlayingVideos(prev => new Set(prev).add(issue.id))}
                  onPause={() => setPlayingVideos(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(issue.id);
                    return newSet;
                  })}
                />
              ) : issue.media.images.length > 0 ? (
                <Box
                  component="img"
                  src={issue.media.images[0]}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: 'grey.900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    No Media
                  </Typography>
                </Box>
              )}

              {/* Video Controls */}
              {issue.media.videos.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 120,
                    right: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  <IconButton
                    onClick={() => toggleVideoPlayback(issue.id)}
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                    }}
                  >
                    {playingVideos.has(issue.id) ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <IconButton
                    onClick={() => toggleVideoMute(issue.id)}
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                    }}
                  >
                    {mutedVideos.has(issue.id) ? <VolumeOff /> : <VolumeUp />}
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Issue Info Overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                p: 3,
                color: 'white'
              }}
            >
              {/* User Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {issue.reportedBy?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {issue.reportedBy?.name || 'Anonymous'}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {issue.daysSinceReported} days ago • {issue.location.city || 'Unknown location'}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  {issue.isPublic ? (
                    <Public sx={{ fontSize: 16, opacity: 0.7 }} />
                  ) : (
                    <Lock sx={{ fontSize: 16, opacity: 0.7 }} />
                  )}
                </Box>
              </Box>

              {/* Issue Details */}
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                {issue.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                {issue.description.length > 150
                  ? `${issue.description.substring(0, 150)}...`
                  : issue.description
                }
              </Typography>

              {/* Category and Status */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={categoryDisplayNames[issue.category] || issue.category}
                  size="small"
                  sx={{ bgcolor: 'primary.main', color: 'white' }}
                />
                <Chip
                  label={issue.statusDisplay}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'white', color: 'white' }}
                />
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    onClick={() => handleVote(issue.id, 'upvote')}
                    sx={{ color: issue.userVote === 'upvote' ? 'red' : 'white' }}
                    disabled={!currentUser}
                  >
                    {issue.userVote === 'upvote' ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {issue.voteScore}
                  </Typography>
                </Box>

                <IconButton
                  onClick={() => navigate(`/issues/${issue.id}`)}
                  sx={{ color: 'white' }}
                >
                  <Comment />
                </IconButton>

                <IconButton
                  onClick={() => handleShare(issue)}
                  sx={{ color: 'white' }}
                >
                  <Share />
                </IconButton>

                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                  <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="caption">
                    {issue.location.city || 'Location'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <Fab
          onClick={() => scrollToReel('prev')}
          sx={{
            position: 'absolute',
            top: '50%',
            left: 16,
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
          }}
        >
          ↑
        </Fab>
      )}

      {currentIndex < issues.length - 1 && (
        <Fab
          onClick={() => scrollToReel('next')}
          sx={{
            position: 'absolute',
            top: '50%',
            right: 16,
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
          }}
        >
          ↓
        </Fab>
      )}

      {/* Progress Indicators */}
      <Box
        sx={{
          position: 'absolute',
          top: 80,
          left: 16,
          right: 16,
          display: 'flex',
          gap: 1
        }}
      >
        {issues.slice(0, 10).map((_, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              height: 2,
              bgcolor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.3)',
              borderRadius: 1
            }}
          />
        ))}
      </Box>

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Issues</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Location Toggle */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Location-based filtering
              </Typography>
              <Button
                startIcon={<MyLocation />}
                onClick={getCurrentLocation}
                variant={filters.locationEnabled ? "contained" : "outlined"}
                fullWidth
              >
                {filters.locationEnabled ? "Location enabled" : "Enable location filtering"}
              </Button>
            </Box>

            {/* Scope Selection */}
            {filters.locationEnabled && (
              <FormControl fullWidth>
                <InputLabel>Scope</InputLabel>
                <Select
                  value={filters.scope}
                  label="Scope"
                  onChange={(e) => setFilters(prev => ({ ...prev, scope: e.target.value as any }))}
                >
                  <MenuItem value="nearby">Nearby ({filters.radius}m)</MenuItem>
                  <MenuItem value="city">Same City</MenuItem>
                  <MenuItem value="state">Same State</MenuItem>
                  <MenuItem value="nationwide">Nationwide</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Radius Slider */}
            {filters.locationEnabled && filters.scope === 'nearby' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Radius: {filters.radius}m
                </Typography>
                <Slider
                  value={filters.radius}
                  onChange={(_, value) => setFilters(prev => ({ ...prev, radius: value as number }))}
                  min={100}
                  max={10000}
                  step={100}
                  marks={[
                    { value: 100, label: '100m' },
                    { value: 1000, label: '1km' },
                    { value: 5000, label: '5km' },
                    { value: 10000, label: '10km' }
                  ]}
                />
              </Box>
            )}

            {/* Category Filter */}
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {categoryDisplayNames[category] || category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setFilterOpen(false);
              loadIssues();
            }}
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 10
          }}
        >
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && issues.length > 0 && (
        <CircularProgress
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 10
          }}
        />
      )}
    </Box>
  );
};

export default IssueReels;