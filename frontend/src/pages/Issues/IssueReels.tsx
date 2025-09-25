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
  clearError,
  setLoadMoreMode
} from "../../store/slices/issueSlice";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { setPageTitle, setBreadcrumbs } from "../../store/slices/uiSlice";
import { IssueListItem } from "../../store/slices/issueSlice";
import MapComponent from "../../components/Map/Map";
import CommentsModal from "../../components/CommentsModal";

interface Issue extends IssueListItem {
  media?: {
    images: string[];
    videos: string[];
    audio?: string;
  };
  upvotesCount?: number;
  downvotesCount?: number;
  commentsCount?: number;
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

  // Deduplicate issues by ID to prevent duplicate keys warning
  const uniqueIssues = React.useMemo(() => {
    const seen = new Set();
    return issues.filter(issue => {
      if (seen.has(issue.id)) {
        return false;
      }
      seen.add(issue.id);
      return true;
    });
  }, [issues]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [mapView, setMapView] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    radius: 1000, // Default 1km
    locationEnabled: false,
    userLocation: null as { lat: number; lng: number } | null,
    scope: 'nearby' as 'nearby' | 'city' | 'state' | 'nationwide'
  });
  const [hasMoreIssues, setHasMoreIssues] = useState(true);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedIssueForComments, setSelectedIssueForComments] = useState<Issue | null>(null);

  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(setPageTitle("Issue Reels"));
    dispatch(
      setBreadcrumbs([])
    );

    // Clear any existing errors
    dispatch(clearError());

    // Load initial issues
    loadIssues();
  }, [dispatch]);

  const loadIssues = useCallback(async (loadMore: boolean = false) => {
    try {
      let queryParams: any = {
        page: loadMore ? Math.floor(uniqueIssues.length / 10) + 1 : 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
        fields: 'id,title,description,category,priority,status,statusDisplay,location,timeline,reportedBy,voteScore,upvotesCount,downvotesCount,commentsCount,userVote,daysSinceReported,tags,isPublic,createdAt,media' // Include media for reels display
      };

      // Add location-based filtering if enabled
      if (filters.locationEnabled && filters.userLocation) {
        if (filters.scope === 'nearby') {
          // Use nearby issues API
          await dispatch(fetchNearbyIssues({
            latitude: filters.userLocation.lat,
            longitude: filters.userLocation.lng,
            radius: filters.radius,
            page: loadMore ? Math.floor(uniqueIssues.length / 10) + 1 : 1,
            limit: 10,
            fields: queryParams.fields
          })).unwrap();
          return;
        }
      }

      // Add category filter
      if (filters.category) {
        queryParams.category = filters.category;
      }

      // Set load more mode
      dispatch(setLoadMoreMode(loadMore));

      await dispatch(fetchIssues(queryParams)).unwrap();

      // Check if there are more issues to load
      const totalLoaded = loadMore ? uniqueIssues.length + 10 : 10;
      setHasMoreIssues(totalLoaded < 1000); // Assume max 1000 issues for now
    } catch (err) {
      console.error('Failed to load issues:', err);
    }
  }, [dispatch, filters, uniqueIssues.length]);

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
    console.log('Toggle video playback called for issue:', issueId);
    const video = videoRefs.current.get(issueId);
    console.log('Video element:', video);
    if (!video) {
      console.log('No video element found for issue:', issueId);
      return;
    }

    if (playingVideos.has(issueId)) {
      console.log('Pausing video');
      video.pause();
      setPlayingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(issueId);
        return newSet;
      });
    } else {
      console.log('Playing video');
      video.play().catch(err => {
        console.error('Error playing video:', err);
      });
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

  // Scroll to specific reel
  const scrollToReel = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentIndex < uniqueIssues.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Handle voting
  const handleVote = async (issueId: string, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) {
      // Redirect to login for non-authenticated users
      navigate('/login');
      return;
    }

    try {
      const issue = uniqueIssues.find(i => i.id === issueId);
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

  const handleLoadMore = () => {
    loadIssues(true);
  };

  // Handle filter application
  const handleApplyFilters = () => {
    setFilterOpen(false);
    setHasMoreIssues(true);
    dispatch(setLoadMoreMode(false)); // Reset load more mode for fresh load
    loadIssues(false);
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
  }, [currentIndex, uniqueIssues.length]);

  // Auto-play visible video
  useEffect(() => {
    const currentIssue = uniqueIssues[currentIndex];
    if (currentIssue && currentIssue.media?.videos && currentIssue.media.videos.length > 0) {
      const video = videoRefs.current.get(currentIssue.id);
      if (video && !playingVideos.has(currentIssue.id)) {
        video.play().catch(() => {
          // Auto-play failed, user interaction required
        });
      }
    }

    // Pause other videos
    uniqueIssues.forEach((issue, index) => {
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
  }, [currentIndex, uniqueIssues, playingVideos]);

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

  if (loading && uniqueIssues.length === 0) {
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
        width: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        bgcolor: mapView ? 'white' : 'black',
        display: 'flex',
        justifyContent: 'center',
        margin: 0,
        padding: 0
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
          bgcolor: mapView ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '600px',
          mx: 'auto'
        }}
      >
        <Typography variant="h6" sx={{ color: mapView ? 'black' : 'white', fontWeight: 'bold' }}>
          {mapView ? 'Issue Map' : 'Issue Reels'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => setMapView(!mapView)}
            sx={{ color: mapView ? 'primary.main' : 'white' }}
          >
            <MyLocation />
          </IconButton>
          <IconButton
            onClick={() => setFilterOpen(true)}
            sx={{ color: mapView ? 'black' : 'white' }}
          >
            <FilterList />
          </IconButton>
        </Box>
      </Box>

      {mapView ? (
        /* Map View */
        <Box sx={{ height: '100%', pt: 8 }}>
          <MapComponent
            issues={uniqueIssues}
            onIssueClick={(issue) => navigate(`/issues/${issue.id}`)}
            userLocation={filters.userLocation}
            showUserLocation={filters.locationEnabled}
            height="calc(100vh - 64px)"
          />
        </Box>
      ) : (
        /* Reels View */
        <>
          {/* Reels Container */}
          <Box
            sx={{
              height: '100%',
              width: '100%',
              maxWidth: '600px', // Increased width for web viewing
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              mx: 'auto' // Center horizontally
            }}
          >
            {uniqueIssues.map((issue, index) => (
              <Box
                key={issue.id}
                sx={{
                  flex: 1,
                  display: index === currentIndex ? 'flex' : 'none',
                  flexDirection: 'column',
                  position: 'relative',
                  bgcolor: 'black',
                  width: '100%'
                }}
              >
                {/* Media Content */}
                <Box sx={{ flex: 1, position: 'relative' }}>
                  {issue.media?.videos && issue.media.videos.length > 0 ? (
                    <video
                      ref={el => {
                        if (el) {
                          videoRefs.current.set(issue.id, el);
                          console.log('Video ref set for issue:', issue.id, el);
                        }
                      }}
                      src={issue.media.videos[0]}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      loop
                      playsInline
                      onPlay={() => {
                        console.log('Video onPlay triggered for issue:', issue.id);
                        setPlayingVideos(prev => new Set(prev).add(issue.id));
                      }}
                      onPause={() => {
                        console.log('Video onPause triggered for issue:', issue.id);
                        setPlayingVideos(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(issue.id);
                          return newSet;
                        });
                      }}
                    />
                  ) : issue.media?.images && issue.media.images.length > 0 ? (
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

                  {/* Video Controls - Center positioned */}
                  {issue.media?.videos && issue.media.videos.length > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20
                      }}
                    >
                      <IconButton
                        onClick={() => toggleVideoPlayback(issue.id)}
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                          width: 60,
                          height: 60,
                          zIndex: 21
                        }}
                      >
                        {playingVideos.has(issue.id) ? <Pause sx={{ fontSize: 30 }} /> : <PlayArrow sx={{ fontSize: 30 }} />}
                      </IconButton>
                    </Box>
                  )}

                  {/* Action Buttons - Right side */}
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 16,
                      bottom: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      alignItems: 'center',
                      zIndex: 20
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <IconButton
                        onClick={() => handleVote(issue.id, 'upvote')}
                        sx={{
                          color: issue.userVote === 'upvote' ? 'red' : 'white',
                          bgcolor: 'rgba(0,0,0,0.5)',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                          width: 50,
                          height: 50,
                          zIndex: 21
                        }}
                        disabled={!currentUser}
                      >
                        {issue.userVote === 'upvote' ? <Favorite /> : <FavoriteBorder />}
                      </IconButton>
                      <Typography variant="caption" sx={{ color: 'white', mt: 0.5, fontSize: '0.7rem' }}>
                        {issue.upvotesCount || issue.voteScore || 0}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <IconButton
                        onClick={() => {
                          setSelectedIssueForComments(issue);
                          setCommentsModalOpen(true);
                        }}
                        sx={{
                          color: 'white',
                          bgcolor: 'rgba(0,0,0,0.5)',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                          width: 50,
                          height: 50,
                          zIndex: 21
                        }}
                      >
                        <Comment />
                      </IconButton>
                      <Typography variant="caption" sx={{ color: 'white', mt: 0.5, fontSize: '0.7rem' }}>
                        {issue.commentsCount || 0}
                      </Typography>
                    </Box>

                    <IconButton
                      onClick={() => handleShare(issue)}
                      sx={{
                        color: 'white',
                        bgcolor: 'rgba(0,0,0,0.5)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                        width: 50,
                        height: 50,
                        zIndex: 21
                      }}
                    >
                      <Share />
                    </IconButton>
                  </Box>
                </Box>

                {/* Issue Info Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                    p: 2,
                    color: 'white',
                    minHeight: '120px'
                  }}
                >
                  {/* User Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ mr: 1.5, bgcolor: 'primary.main', width: 32, height: 32 }}>
                      {issue.reportedBy?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                        {issue.reportedBy?.name || 'Anonymous'}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, lineHeight: 1.2 }}>
                        {issue.daysSinceReported} days ago • {issue.location.city || 'Unknown location'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Issue Details */}
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5, lineHeight: 1.3 }}>
                    {issue.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, opacity: 0.9, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {issue.description}
                  </Typography>

                  {/* Category and Status */}
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                    <Chip
                      label={categoryDisplayNames[issue.category] || issue.category}
                      size="small"
                      sx={{ bgcolor: 'primary.main', color: 'white', fontSize: '0.7rem', height: 24 }}
                    />
                    <Chip
                      label={issue.statusDisplay}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: 'white', color: 'white', fontSize: '0.7rem', height: 24 }}
                    />
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
                left: '50%',
                transform: 'translate(-50%, -50%) translateX(-320px)', // Position to the left of the wider reel
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                zIndex: 15
              }}
            >
              ↑
            </Fab>
          )}

          {currentIndex < uniqueIssues.length - 1 && (
            <Fab
              onClick={() => scrollToReel('next')}
              sx={{
                position: 'absolute',
                top: '50%',
                right: '50%',
                transform: 'translate(50%, -50%) translateX(320px)', // Position to the right of the wider reel
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                zIndex: 15
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
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              maxWidth: '580px',
              width: '90%'
            }}
          >
            {uniqueIssues.slice(0, 10).map((_, index) => (
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
        </>
      )}

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
            onClick={handleApplyFilters}
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
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '580px',
            width: '90%',
            zIndex: 10
          }}
        >
          {error}
        </Alert>
      )}

      {/* Load More Button - REMOVED */}

      {/* Comments Modal */}
      {selectedIssueForComments && (
        <CommentsModal
          open={commentsModalOpen}
          onClose={() => {
            setCommentsModalOpen(false);
            setSelectedIssueForComments(null);
          }}
          issueId={selectedIssueForComments.id}
          issueTitle={selectedIssueForComments.title}
          totalComments={selectedIssueForComments.commentsCount || 0}
        />
      )}
    </Box>
  );
};

export default IssueReels;