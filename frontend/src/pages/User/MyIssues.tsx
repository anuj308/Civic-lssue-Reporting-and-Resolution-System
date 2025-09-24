import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  Search,
  FilterList,
  Refresh,
  LocationOn,
  ThumbUp,
  Comment,
  Visibility,
  Add,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "../../store/store";
import {
  fetchMyIssues,
  selectIssues,
  selectIssuesLoading,
  selectIssuesError,
  selectIssuesPagination,
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "success";
      case "medium":
        return "warning";
      case "high":
        return "error";
      case "critical":
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low":
        return "Low";
      case "medium":
        return "Medium";
      case "high":
        return "High";
      case "critical":
        return "Critical";
      default:
        return priority;
    }
  };

  return (
    <Card
      sx={{ mb: 2, cursor: "pointer", "&:hover": { boxShadow: 3 } }}
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
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label={getStatusLabel(issue.status)}
              color={getStatusColor(issue.status) as any}
              size="small"
            />
            {issue.priority && (
              <Chip
                label={getPriorityLabel(issue.priority)}
                color={getPriorityColor(issue.priority) as any}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {issue.description?.length > 150
            ? `${issue.description.substring(0, 150)}...`
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
            {issue.upvotes > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <ThumbUp fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {issue.upvotes}
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

const MyIssues: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const currentUser = useSelector(selectCurrentUser);
  const issues = useSelector(selectIssues);
  const loading = useSelector(selectIssuesLoading);
  const error = useSelector(selectIssuesError);
  const pagination = useSelector(selectIssuesPagination);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(setPageTitle("My Issues"));
    dispatch(
      setBreadcrumbs([
        { label: "Dashboard", path: "/dashboard" },
        { label: "My Issues", path: "/my-issues" },
      ])
    );

    loadIssues();
  }, [dispatch, currentPage, statusFilter, priorityFilter]);

  const loadIssues = () => {
    const params: any = {
      page: currentPage,
      limit: 10,
      sort: "-createdAt",
    };

    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    if (searchTerm) params.search = searchTerm;

    dispatch(fetchMyIssues(params));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadIssues();
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  const handleViewIssue = (issueId: string) => {
    navigate(`/issues/${issueId}`);
  };

  const handleReportIssue = () => {
    navigate("/report-issue");
  };

  const handleRefresh = () => {
    loadIssues();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPriorityFilter("");
    setCurrentPage(1);
    loadIssues();
  };

  const userIssues = issues || [];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            My Issues
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all issues you've reported
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleReportIssue}
        >
          Report Issue
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="">All Priority</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  disabled={loading}
                >
                  Clear
                </Button>
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Issues List */}
      <Box sx={{ mb: 3 }}>
        {loading ? (
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} sx={{ mb: 2 }}>
                <CardContent>
                  <Skeleton
                    variant="text"
                    height={28}
                    width="60%"
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    height={20}
                    width="100%"
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    height={20}
                    width="40%"
                    sx={{ mb: 1 }}
                  />
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Skeleton variant="text" height={16} width="30%" />
                    <Skeleton variant="text" height={16} width="20%" />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : userIssues.length > 0 ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {userIssues.length} issue
              {userIssues.length !== 1 ? "s" : ""}
            </Typography>

            {userIssues.map((issue: any) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                onViewDetails={handleViewIssue}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No issues found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || statusFilter || priorityFilter
                ? "Try adjusting your search or filters"
                : "You haven't reported any issues yet"}
            </Typography>
            <Button variant="contained" onClick={handleReportIssue}>
              Report Your First Issue
            </Button>
          </Box>
        )}
      </Box>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
};

export default MyIssues;
