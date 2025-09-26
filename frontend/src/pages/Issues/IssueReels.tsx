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
  TextField,
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
  Send,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "../../store/store";
import {
  fetchIssues,
  fetchNearbyIssues,
  voteOnIssue,
  removeVoteFromIssue,
  addIssueComment,
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
import { showToast } from '../../utils/toast';
import { getAccessToken } from '../../services/api';

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
      if (seen.has(issue._id)) {
        return false;
      }
      seen.add(issue._id);
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
    radius: 100000, // Default 100km
    locationEnabled: false,
    userLocation: null as { lat: number; lng: number } | null,
    scope: 'nearby' as 'nearby' | 'city' | 'state' | 'nationwide'
  });
  const [hasMoreIssues, setHasMoreIssues] = useState(true);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedIssueForComments, setSelectedIssueForComments] = useState<Issue | null>(null);
  const [commentsVisible, setCommentsVisible] = useState<string | null>(null);
  const [reelComments, setReelComments] = useState<{[key: string]: any[]}>({});
  const [loadingComments, setLoadingComments] = useState<{[key: string]: boolean}>({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [locationSliderOpen, setLocationSliderOpen] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

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
          if (!loadMore) setInitialLoadComplete(true);
          return;
        }
      }

      // Add category filter
      if (filters.category) {
        queryParams.category = filters.category;
      }

      // Set load more mode
      dispatch(setLoadMoreMode(loadMore));

      const result = await dispatch(fetchIssues(queryParams)).unwrap();
      
      // Check if there are more issues to load
      const newIssuesCount = result.issues?.length || 0;
      const hasMore = newIssuesCount === 10; // If we got a full page, there might be more
      
      if (loadMore && newIssuesCount === 0) {
        // No more issues available, show toast and don't modify the list
        setHasMoreIssues(false);
        showToast.info("No more reels available");
        return;
      }
      
      setHasMoreIssues(hasMore);
      
      if (!loadMore) setInitialLoadComplete(true);

      console.log(`Loaded ${newIssuesCount} issues, hasMore: ${hasMore}, total: ${loadMore ? uniqueIssues.length + newIssuesCount : newIssuesCount}`);
    } catch (err) {
      console.error('Failed to load issues:', err);
      setHasMoreIssues(false); // Stop loading on error
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

  // Auto-load more issues when reaching the last reel
  useEffect(() => {
    if (currentIndex === uniqueIssues.length - 1 && hasMoreIssues && !loading) {
      console.log('Reached last reel, loading more issues...');
      loadIssues(true);
    }
  }, [currentIndex, uniqueIssues.length, hasMoreIssues, loading]);;

  // Handle voting
  const handleVote = async (issueId: string, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) {
      // Redirect to login for non-authenticated users
      navigate('/login');
      return;
    }

    try {
      const issue = uniqueIssues.find(i => i._id === issueId);
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

  // Handle comment input toggle
  const handleCommentClick = async (issueId: string) => {
    if (commentsVisible === issueId) {
      // Close comments
      setCommentsVisible(null);
      setNewComment('');
    } else {
      // Open comments and load them
      setCommentsVisible(issueId);
      setNewComment('');
      await loadCommentsForIssue(issueId);
    }
  };

  // Load comments for a specific issue
  const loadCommentsForIssue = async (issueId: string) => {
    if (reelComments[issueId]) return; // Already loaded

    setLoadingComments(prev => ({ ...prev, [issueId]: true }));
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/issues/${issueId}/comments?page=1&limit=5`, {
        headers: {
          'Authorization': getAccessToken() ? `Bearer ${getAccessToken()}` : '',
        },
      });
      const data = await response.json();
      if (data.success) {
        setReelComments(prev => ({ ...prev, [issueId]: data.data.comments || [] }));
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [issueId]: false }));
    }
  };

  // Handle adding comment
  const handleAddComment = async (issueId: string) => {
    if (!currentUser || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await dispatch(addIssueComment({ 
        issueId, 
        content: newComment.trim(), 
        isInternal: false 
      })).unwrap();
      
      // Add the new comment to the local state
      const newCommentObj = {
        id: Date.now().toString(), // Temporary ID
        user: {
          _id: currentUser.id,
          name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        },
        message: newComment.trim(),
        timestamp: new Date().toISOString(),
        isOfficial: false
      };
      
      setReelComments(prev => ({
        ...prev,
        [issueId]: [...(prev[issueId] || []), newCommentObj].slice(-5) // Keep only last 5
      }));
      
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle comment input key press
  const handleCommentKeyPress = (e: React.KeyboardEvent, issueId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(issueId);
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

  // Close comments when navigating to different reel
  useEffect(() => {
    setCommentsVisible(null);
    setNewComment('');
  }, [currentIndex]);

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

  if (!initialLoadComplete) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'black'
        }}
      >
        <CircularProgress size={80} sx={{ color: 'primary.main', mb: 3 }} />
        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
          Loading Issue Reels
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Discovering community issues near you...
        </Typography>
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
      onClick={() => {
        // Close comments when clicking outside
        if (commentsVisible) {
          setCommentsVisible(null);
          setNewComment('');
        }
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

      {/* Location Filter Button and Slider - Absolute positioned */}
      {!mapView && (
        <Box
          sx={{
            position: 'absolute',
            top: 70,
            right: 16,
            zIndex: 11,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}
        >
          {/* Location Button */}
          <Button
            size="small"
            variant={filters.locationEnabled ? "contained" : "outlined"}
            onClick={() => {
              if (!filters.locationEnabled) {
                getCurrentLocation();
              }
              setLocationSliderOpen(!locationSliderOpen);
            }}
            sx={{
              minWidth: 'auto',
              px: 1,
              py: 0.5,
              fontSize: '0.7rem',
              bgcolor: filters.locationEnabled ? 'primary.main' : 'rgba(0,0,0,0.7)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              '&:hover': {
                bgcolor: filters.locationEnabled ? 'primary.dark' : 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.5)',
              },
              borderRadius: 1
            }}
          >
            📍 {filters.locationEnabled ? `${filters.radius / 1000}km` : 'Location'}
          </Button>

          {/* Location Slider */}
          {locationSliderOpen && (
            <Box
              sx={{
                position: 'absolute',
                top: 35,
                right: 0,
                bgcolor: 'rgba(0,0,0,0.9)',
                borderRadius: 1,
                p: 2,
                minWidth: 200,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                zIndex: 12
              }}
            >
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                Location Radius: {filters.radius / 1000}km
              </Typography>
              <Slider
                value={filters.radius / 1000}
                onChange={(_, value) => {
                  const newRadius = (value as number) * 1000;
                  setFilters(prev => ({ ...prev, radius: newRadius }));
                }}
                min={1}
                max={4000}
                step={10}
                marks={[
                  { value: 1, label: '1km' },
                  { value: 100, label: '100km' },
                  { value: 1000, label: '1000km' },
                  { value: 4000, label: '4000km' }
                ]}
                sx={{
                  color: 'primary.main',
                  '& .MuiSlider-markLabel': {
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.7rem'
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button
                  size="small"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, locationEnabled: false, userLocation: null }));
                    setLocationSliderOpen(false);
                    // Reload issues without location filter
                    dispatch(setLoadMoreMode(false));
                    loadIssues(false);
                  }}
                  sx={{ color: 'white', fontSize: '0.7rem' }}
                >
                  Disable
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    setLocationSliderOpen(false);
                    // Reload issues with new radius
                    dispatch(setLoadMoreMode(false));
                    loadIssues(false);
                  }}
                  sx={{ fontSize: '0.7rem' }}
                >
                  Apply
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

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
                key={issue._id}
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
                          videoRefs.current.set(issue._id, el);
                          console.log('Video ref set for issue:', issue._id, el);
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
                        console.log('Video onPlay triggered for issue:', issue._id);
                        setPlayingVideos(prev => new Set(prev).add(issue._id));
                      }}
                      onPause={() => {
                        console.log('Video onPause triggered for issue:', issue._id);
                        setPlayingVideos(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(issue._id);
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
                        onClick={() => toggleVideoPlayback(issue._id)}
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                          width: 60,
                          height: 60,
                          zIndex: 21
                        }}
                      >
                        {playingVideos.has(issue._id) ? <Pause sx={{ fontSize: 30 }} /> : <PlayArrow sx={{ fontSize: 30 }} />}
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
                        onClick={() => handleVote(issue._id, 'upvote')}
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
                        onClick={() => handleCommentClick(issue._id)}
                        sx={{
                          color: commentsVisible === issue._id ? 'primary.main' : 'white',
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

                {/* Comments Display Box */}
                {commentsVisible === issue._id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 120,
                      left: 16,
                      right: 16,
                      bgcolor: 'rgba(0,0,0,0.9)',
                      borderRadius: 2,
                      p: 2,
                      zIndex: 25,
                      backdropFilter: 'blur(10px)',
                      maxHeight: '300px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Comments List */}
                    <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                      {loadingComments[issue._id] ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <CircularProgress size={20} sx={{ color: 'white' }} />
                        </Box>
                      ) : reelComments[issue._id]?.length > 0 ? (
                        reelComments[issue._id].map((comment, index) => (
                          <Box key={comment.id || index} sx={{ mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold', mr: 1 }}>
                                {comment.user?.name || 'Anonymous'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                {new Date(comment.timestamp).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'white', lineHeight: 1.3 }}>
                              {comment.message}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', py: 2 }}>
                          No comments yet. Be the first to comment!
                        </Typography>
                      )}
                    </Box>

                    {/* Comment Input */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => handleCommentKeyPress(e, issue._id)}
                        disabled={submittingComment}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(255,255,255,0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255,255,255,0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'primary.main',
                            },
                          },
                          '& .MuiOutlinedInput-input': {
                            '&::placeholder': {
                              color: 'rgba(255,255,255,0.7)',
                              opacity: 1,
                            },
                          },
                        }}
                        inputProps={{
                          style: { color: 'white' }
                        }}
                      />
                      <IconButton
                        onClick={() => handleAddComment(issue._id)}
                        disabled={!newComment.trim() || submittingComment || !currentUser}
                        sx={{
                          color: 'primary.main',
                          bgcolor: 'rgba(255,255,255,0.1)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                          '&:disabled': { color: 'rgba(255,255,255,0.3)' }
                        }}
                      >
                        {submittingComment ? <CircularProgress size={20} /> : <Send />}
                      </IconButton>
                    </Box>

                    {/* View All Comments Link */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedIssueForComments(issue);
                          setCommentsModalOpen(true);
                          setCommentsVisible(null);
                          setNewComment('');
                        }}
                        sx={{
                          color: 'primary.main',
                          fontSize: '0.7rem',
                          minWidth: 'auto',
                          p: 0.5,
                          textTransform: 'none'
                        }}
                      >
                        View all comments ({issue.commentsCount || 0})
                      </Button>
                    </Box>
                  </Box>
                )}

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
            {Array.from({ length: Math.min(uniqueIssues.length, 20) }, (_, index) => (
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
          issueId={selectedIssueForComments._id}
          issueTitle={selectedIssueForComments.title}
          totalComments={selectedIssueForComments.commentsCount || 0}
        />
      )}
    </Box>
  );
};

export default IssueReels;