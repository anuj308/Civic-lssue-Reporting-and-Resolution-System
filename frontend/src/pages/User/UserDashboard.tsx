import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Paper,
  Divider,
  Button,
  Fab,
  useTheme,
  Alert,
  Skeleton,
  IconButton,
} from "@mui/material";
import {
  Add,
  ReportProblem,
  CheckCircle,
  Schedule,
  LocationOn,
  TrendingUp,
  Refresh,
  Visibility,
  ThumbUp,
  Comment,
  PlayCircle,
  Map as MapIcon,
  Leaderboard as LeaderboardIcon,
  Event as EventIcon,
  EmojiEvents as EmojiEventsIcon,
  Star as StarIcon,
  LocationCity as LocationCityIcon,
  TrendingDown,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Navigate } from "react-router-dom";
import { AppDispatch } from "../../store/store";
import {
  fetchMyIssues,
  selectIssues,
  selectIssuesLoading,
  selectIssuesError,
} from "../../store/slices/issueSlice";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { setBreadcrumbs, setPageTitle } from "../../store/slices/uiSlice";

interface IssueCardProps {
  issue: any;
  onViewDetails: (issueId: string) => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, onViewDetails }) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "acknowledged":
        return "info";
      case "in_progress":
        return "primary";
      case "resolved":
        return "success";
      case "closed":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "acknowledged":
        return "Acknowledged";
      case "in_progress":
        return "In Progress";
      case "resolved":
        return "Resolved";
      case "closed":
        return "Closed";
      default:
        return status;
    }
  };

  return (
    <Card
      sx={{ mb: 2, cursor: "pointer" }}
      onClick={() => onViewDetails(issue._id)}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, mr: 2 }}>
            {issue.title}
          </Typography>
          <Chip
            label={getStatusLabel(issue.status)}
            color={getStatusColor(issue.status) as any}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {issue.description?.length > 100
            ? `${issue.description.substring(0, 100)}...`
            : issue.description}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {issue.location?.address || "Location not specified"}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Reported {new Date(issue.createdAt).toLocaleDateString()}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {issue.upvotesCount > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <ThumbUp fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {issue.upvotesCount}
                </Typography>
              </Box>
            )}

            {issue.commentsCount > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Comment fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {issue.commentsCount}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

interface UserProfileCardProps {
  user: {
    name?: string;
    points?: number;
    badges?: string[];
  } | null;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent sx={{ textAlign: "center" }}>
      <Avatar
        sx={{
          width: 80,
          height: 80,
          margin: "0 auto 16px",
          bgcolor: "primary.main",
        }}
      >
        {user?.name?.charAt(0) || "U"}
      </Avatar>
      <Typography variant="h5" component="div">
        {user?.name || "User"}
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          my: 2,
        }}
      >
        <EmojiEventsIcon color="warning" sx={{ mr: 1 }} />
        <Typography variant="h6" color="text.secondary">
          {(user?.points || 0).toLocaleString()} Reward Points
        </Typography>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Badges Earned
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {user?.badges && user.badges.length > 0 ? (
          user.badges.map((badge) => (
            <Chip
              key={badge}
              icon={<StarIcon />}
              label={badge}
              color="primary"
              variant="outlined"
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No badges earned yet.
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

const MunicipalityRankingCard = () => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <LeaderboardIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div">
          Municipality Performance
        </Typography>
      </Box>
      <List dense>
        {[
          { city: "Mumbai", score: 9.8, trend: "up" },
          { city: "Delhi", score: 9.5, trend: "up" },
          { city: "Bengaluru", score: 9.2, trend: "down" },
          { city: "Chennai", score: 8.9, trend: "up" },
          { city: "Pune", score: 8.5, trend: "down" },
        ].map((item, index) => (
          <ListItem
            key={item.city}
            secondaryAction={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color:
                    item.trend === "up"
                      ? "success.main"
                      : "error.main",
                }}
              >
                <Typography variant="body2" sx={{ mr: 0.5 }}>
                  {item.score.toFixed(1)}
                </Typography>
                {item.trend === "up" ? (
                  <TrendingUp fontSize="small" />
                ) : (
                  <TrendingDown fontSize="small" />
                )}
              </Box>
            }
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: "secondary.light" }}>
                <Typography variant="h6">{index + 1}</Typography>
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={item.city} />
          </ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
);

const RegionalMapCard = () => (
  <Card sx={{ height: 400, display: "flex", flexDirection: "column" }}>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <MapIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Regional Issue Map</Typography>
      </Box>
    </CardContent>
    <Paper
      variant="outlined"
      sx={{
        flexGrow: 1,
        m: 2,
        mt: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.200",
        color: "text.secondary",
        backgroundImage:
          "url(/path-to-your-map-placeholder-image.png)", // Optional: add a static map image
        backgroundSize: "cover",
      }}
    >
      <Typography variant="h5">[ Interactive Map Component Goes Here ]</Typography>
    </Paper>
  </Card>
);

const CommunityEventsSection = () => (
  <Card>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <EventIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Upcoming Community Events</Typography>
      </Box>
      <Grid container spacing={2}>
        {[
          {
            title: "Waste Segregation Workshop",
            type: "Offline",
            date: "October 12, 2025",
            location: "Community Hall, Sector 15",
          },
          {
            title: "Webinar: Know Your Civic Rights",
            type: "Online",
            date: "October 18, 2025",
            location: "Zoom",
          },
          {
            title: "Tree Plantation Drive",
            type: "Offline",
            date: "October 22, 2025",
            location: "Green Valley Park",
          },
        ].map((event) => (
          <Grid item xs={12} sm={6} md={4} key={event.title}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle1" component="div" gutterBottom>
                  {event.title}
                </Typography>
                <Chip
                  icon={<LocationCityIcon />}
                  label={event.type}
                  size="small"
                  color={event.type === "Online" ? "info" : "success"}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {event.date}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.location}
                </Typography>
                <Button size="small" sx={{ mt: 1 }}>
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </CardContent>
  </Card>
);

const UserDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const issues = useSelector(selectIssues);
  const loading = useSelector(selectIssuesLoading);
  const error = useSelector(selectIssuesError);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    dispatch(setPageTitle("My Dashboard"));
    dispatch(setBreadcrumbs([{ label: "Dashboard", path: "/dashboard" }]));

    // Fetch user's issues
    loadUserIssues();
  }, [dispatch]);

  useEffect(() => {
    // Calculate stats from issues
    if (issues) {
      setStats({
        total: issues.length,
        pending: issues.filter((issue: any) => issue.status === "pending")
          .length,
        inProgress: issues.filter(
          (issue: any) =>
            issue.status === "in_progress" || issue.status === "acknowledged"
        ).length,
        resolved: issues.filter((issue: any) => issue.status === "resolved")
          .length,
      });
    }
  }, [issues, currentUser]);

  const loadUserIssues = () => {
    dispatch(
      fetchMyIssues({
        limit: 10,
        fields: 'id,title,description,category,status,location,timeline,createdAt',
      })
    );
  };

  const handleReportIssue = () => {
    navigate("/report-issue");
  };

  const handleViewIssue = (issueId: string) => {
    navigate(`/issue/${issueId}`);
  };

  const handleViewAllIssues = () => {
    navigate("/my-issues");
  };

  const handleExploreReels = () => {
    navigate("/reels");
  };

  const handleRefresh = () => {
    loadUserIssues();
  };

  const userIssues = issues || [];
  const recentIssues = userIssues.slice(0, 3);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={handleRefresh}
          startIcon={<Refresh />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, position: "relative" }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome back, {currentUser?.name || "User"}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your reported issues and community updates.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* --- MAIN CONTENT --- */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography
                            color="text.secondary"
                            gutterBottom
                            variant="body2"
                          >
                            Total Issues
                          </Typography>
                          {loading ? (
                            <Skeleton width={40} height={32} />
                          ) : (
                            <Typography
                              variant="h4"
                              component="div"
                              fontWeight="bold"
                            >
                              {stats.total}
                            </Typography>
                          )}
                        </Box>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <ReportProblem />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography
                            color="text.secondary"
                            gutterBottom
                            variant="body2"
                          >
                            Pending
                          </Typography>
                          {loading ? (
                            <Skeleton width={40} height={32} />
                          ) : (
                            <Typography
                              variant="h4"
                              component="div"
                              fontWeight="bold"
                            >
                              {stats.pending}
                            </Typography>
                          )}
                        </Box>
                        <Avatar sx={{ bgcolor: "warning.main" }}>
                          <Schedule />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography
                            color="text.secondary"
                            gutterBottom
                            variant="body2"
                          >
                            In Progress
                          </Typography>
                          {loading ? (
                            <Skeleton width={40} height={32} />
                          ) : (
                            <Typography
                              variant="h4"
                              component="div"
                              fontWeight="bold"
                            >
                              {stats.inProgress}
                            </Typography>
                          )}
                        </Box>
                        <Avatar sx={{ bgcolor: "info.main" }}>
                          <TrendingUp />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography
                            color="text.secondary"
                            gutterBottom
                            variant="body2"
                          >
                            Resolved
                          </Typography>
                          {loading ? (
                            <Skeleton width={40} height={32} />
                          ) : (
                            <Typography
                              variant="h4"
                              component="div"
                              fontWeight="bold"
                            >
                              {stats.resolved}
                            </Typography>
                          )}
                        </Box>
                        <Avatar sx={{ bgcolor: "success.main" }}>
                          <CheckCircle />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Recent Issues */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Recent Issues
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleRefresh}
                      disabled={loading}
                    >
                      <Refresh />
                    </IconButton>
                  </Box>

                  {loading ? (
                    <Box>
                      {[1, 2, 3].map((i) => (
                        <Box key={i} sx={{ mb: 2 }}>
                          <Skeleton
                            variant="rectangular"
                            height={100}
                            sx={{ mb: 1 }}
                          />
                          <Skeleton width="60%" />
                        </Box>
                      ))}
                    </Box>
                  ) : recentIssues.length > 0 ? (
                    <Box>
                      {recentIssues.map((issue: any) => (
                        <IssueCard
                          key={issue._id}
                          issue={issue}
                          onViewDetails={handleViewIssue}
                        />
                      ))}
                      {userIssues.length > 3 && (
                        <Button
                          variant="text"
                          onClick={handleViewAllIssues}
                          sx={{ mt: 1 }}
                          fullWidth
                        >
                          View All Issues ({userIssues.length})
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <ReportProblem
                        sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                      />
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        gutterBottom
                      >
                        No issues reported yet
                      </Typography>
                      <Button variant="contained" onClick={handleReportIssue}>
                        Report Your First Issue
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
              {/* Community Events */}
            <Grid item xs={12}>
              <CommunityEventsSection />
            </Grid>
            {/* Regional Map */}
            <Grid item xs={12}>
              <RegionalMapCard />
            </Grid>

           
          </Grid>
        </Grid>

        {/* --- SIDEBAR --- */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* User Profile */}
            <Grid item xs={12}>
              <UserProfileCard user={currentUser} />
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<PlayCircle />}
                      onClick={handleExploreReels}
                      size="large"
                      fullWidth
                      sx={{
                        bgcolor: "primary.main",
                        "&:hover": { bgcolor: "primary.dark" },
                        fontWeight: "bold",
                        py: 1.5,
                      }}
                    >
                      🎬 Explore Issue Reels
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleReportIssue}
                      size="large"
                      fullWidth
                    >
                      Report New Issue
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={handleViewAllIssues}
                      size="large"
                      fullWidth
                    >
                      View All My Issues
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Municipality Ranking */}
            <Grid item xs={12}>
              <MunicipalityRankingCard />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="report issue"
        onClick={handleReportIssue}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default UserDashboard;
