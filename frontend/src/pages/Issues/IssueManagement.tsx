import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Toolbar,
  Tooltip,
  Alert,
  Snackbar,
  Grid,
  Paper,
  Divider,
  Rating,
  useTheme,
} from "@mui/material";
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Assignment,
  Search,
  FilterList,
  Download,
  Upload,
  LocationOn,
  AttachFile,
  Comment,
  History,
  PriorityHigh,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  Info,
  Refresh,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import {
  fetchIssues,
  updateIssue,
  assignIssue,
  bulkUpdateIssues,
  selectIssues,
  selectIssuesLoading,
  selectIssuesError,
  selectIssuesPagination,
  selectIssuesCategories,
  selectLoadMoreMode,
  setLoadMoreMode,
} from "../../store/slices/issueSlice";
import { setBreadcrumbs, setPageTitle } from "../../store/slices/uiSlice";

interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  status:
    | "pending"
    | "acknowledged"
    | "in_progress"
    | "resolved"
    | "closed"
    | "rejected";
  location: {
    address: string;
    coordinates: [number, number];
  };
  reportedBy: {
    _id: string;
    name: string;
    email?: string;
  };
  assignedDepartment?: {
    _id: string;
    name: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
  };
  timeline: {
    reported: string;
    acknowledged?: string;
    started?: string;
    resolved?: string;
  };
  media: {
    images: string[];
    videos?: string[];
  };
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
    };
    message: string;
    timestamp: string;
    isOfficial: boolean;
  }>;
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  commentsCount?: number;
  upvotes?: number;
}

const IssueManagement: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const issues = useSelector(selectIssues);
  const loading = useSelector(selectIssuesLoading);
  const error = useSelector(selectIssuesError);
  const pagination = useSelector(selectIssuesPagination);
  const categories = useSelector(selectIssuesCategories);
  const loadMoreMode = useSelector(selectLoadMoreMode);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuIssueId, setMenuIssueId] = useState<string | null>(null);

  // Assignment form
  const [assignmentData, setAssignmentData] = useState({
    assigneeId: "",
    priority: "",
    dueDate: "",
    notes: "",
  });

  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  useEffect(() => {
    console.log("🔄 IssueManagement: Component mounted, setting up page");
    dispatch(setPageTitle("Issue Management"));
    dispatch(
      setBreadcrumbs([
        { label: "Dashboard", path: "/dashboard" },
        { label: "Issues", path: "/issues" },
      ])
    );

    console.log("📡 IssueManagement: Dispatching fetchIssues with params:", {
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
      priority: priorityFilter,
      fields: 'title,description,category,status,location,timeline,reportedBy,assignedDepartment,votes,isPublic,tags,createdAt,updatedAt' // Exclude media for faster loading
    });

    dispatch(
      fetchIssues({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter,
        priority: priorityFilter,
        fields: 'title,description,category,status,location,timeline,reportedBy,assignedDepartment,votes,isPublic,tags,createdAt,updatedAt'
      })
    );
  }, [
    dispatch,
    page,
    rowsPerPage,
    searchTerm,
    categoryFilter,
    statusFilter,
    priorityFilter,
  ]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    issueId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuIssueId(issueId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuIssueId(null);
  };

  const handleViewIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleAssignIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setAssignmentData({
      assigneeId: issue.assignedTo?._id || "",
      priority: issue.priority,
      dueDate: "",
      notes: "",
    });
    setAssignDialogOpen(true);
    handleMenuClose();
  };

  const handleStatusUpdate = async (issueId: string, status: string) => {
    try {
      await dispatch(
        updateIssue({
          issueId,
          issueData: { status },
        })
      ).unwrap();
      setSnackbar({
        open: true,
        message: "Issue status updated successfully",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to update issue status",
        severity: "error",
      });
    }
    handleMenuClose();
  };

  const handleAssignmentSubmit = async () => {
    if (selectedIssue) {
      try {
        await dispatch(
          assignIssue({
            issueId: selectedIssue._id,
            assigneeId: assignmentData.assigneeId,
            priority: assignmentData.priority,
            dueDate: assignmentData.dueDate,
            notes: assignmentData.notes,
          })
        ).unwrap();
        setSnackbar({
          open: true,
          message: "Issue assigned successfully",
          severity: "success",
        });
        setAssignDialogOpen(false);
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to assign issue",
          severity: "error",
        });
      }
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      await dispatch(
        bulkUpdateIssues({
          issueIds: selectedIssues,
          updates: { status },
        })
      ).unwrap();
      setSnackbar({
        open: true,
        message: `${selectedIssues.length} issues updated successfully`,
        severity: "success",
      });
      setSelectedIssues([]);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Bulk update failed",
        severity: "error",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "acknowledged":
        return "info";
      case "in_progress":
        return "warning";
      case "resolved":
        return "success";
      case "closed":
        return "default";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Schedule />;
      case "acknowledged":
        return <Info />;
      case "in_progress":
        return <Warning />;
      case "resolved":
        return <CheckCircle />;
      case "closed":
        return <Info />;
      case "rejected":
        return <Error />;
      default:
        return <Info />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isSelected = (_id: string) => selectedIssues.indexOf(_id) !== -1;

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = issues.map((issue) => issue._id);
      setSelectedIssues(newSelected);
      return;
    }
    setSelectedIssues([]);
  };

  const handleLoadMore = () => {
    if (!loading && pagination.hasNextPage) {
      dispatch(setLoadMoreMode(true)); // Enable append mode
      dispatch(
        fetchIssues({
          page: page + 2, // Next page (since page is 0-indexed but API is 1-indexed)
          limit: rowsPerPage,
          search: searchTerm,
          category: categoryFilter,
          status: statusFilter,
          priority: priorityFilter,
          fields: 'title,description,category,status,location,timeline,reportedBy,assignedDepartment,votes,isPublic,tags,createdAt,updatedAt'
        })
      );
      setPage(page + 1); // Increment local page state
    }
  };
  console.log(issues)

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && issues.length === 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Loading issues...
          </Typography>
        </Box>
      )}

      {/* No Issues State */}
      {!loading && !error && issues.length === 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No issues found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ||
              categoryFilter.length > 0 ||
              statusFilter.length > 0 ||
              priorityFilter.length > 0
                ? "Try adjusting your filters or search terms"
                : "Issues reported by citizens will appear here"}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Issue Management
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            size="small"
            disabled={loading || issues.length === 0}
          >
            Export
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            Create Issue
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Filters</Typography>
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={() => {
                dispatch(setLoadMoreMode(false)); // Reset to replace mode for refresh
                dispatch(
                  fetchIssues({
                    page: 1, // Reset to first page on refresh
                    limit: rowsPerPage,
                    search: searchTerm,
                    category: categoryFilter,
                    status: statusFilter,
                    priority: priorityFilter,
                    fields: 'title,description,category,status,location,timeline,reportedBy,assignedDepartment,votes,isPublic,tags,createdAt,updatedAt'
                  })
                );
                setPage(0); // Reset local page state
              }}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Search issues..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
                fullWidth
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl size="small" fullWidth disabled={loading}>
                <InputLabel>Category</InputLabel>
                <Select
                  multiple
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as string[])
                  }
                  input={<OutlinedInput label="Category" />}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      <Checkbox
                        checked={categoryFilter.indexOf(category) > -1}
                      />
                      <ListItemText primary={category.replace("_", " ")} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl size="small" fullWidth disabled={loading}>
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as string[])}
                  input={<OutlinedInput label="Status" />}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {[
                    "pending",
                    "acknowledged",
                    "in_progress",
                    "resolved",
                    "closed",
                    "rejected",
                  ].map((status) => (
                    <MenuItem key={status} value={status}>
                      <Checkbox checked={statusFilter.indexOf(status) > -1} />
                      <ListItemText primary={status.replace("_", " ")} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl size="small" fullWidth disabled={loading}>
                <InputLabel>Priority</InputLabel>
                <Select
                  multiple
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value as string[])
                  }
                  input={<OutlinedInput label="Priority" />}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {["low", "medium", "high", "critical"].map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      <Checkbox
                        checked={priorityFilter.indexOf(priority) > -1}
                      />
                      <ListItemText primary={priority} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedIssues.length > 0 && (
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Typography
            sx={{ flex: "1 1 100%" }}
            variant="subtitle1"
            component="div"
          >
            {selectedIssues.length} issue(s) selected
          </Typography>
          <Tooltip title="Mark Acknowledged">
            <IconButton
              color="inherit"
              onClick={() => handleBulkStatusUpdate("acknowledged")}
              disabled={loading}
            >
              <Info />
            </IconButton>
          </Tooltip>
          <Tooltip title="Mark In Progress">
            <IconButton
              color="inherit"
              onClick={() => handleBulkStatusUpdate("in_progress")}
              disabled={loading}
            >
              <Warning />
            </IconButton>
          </Tooltip>
          <Tooltip title="Mark Resolved">
            <IconButton
              color="inherit"
              onClick={() => handleBulkStatusUpdate("resolved")}
              disabled={loading}
            >
              <CheckCircle />
            </IconButton>
          </Tooltip>
        </Toolbar>
      )}

      {/* Issues Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedIssues.length > 0 &&
                      selectedIssues.length < issues.length
                    }
                    checked={
                      issues.length > 0 &&
                      selectedIssues.length === issues.length
                    }
                    onChange={handleSelectAllClick}
                    disabled={loading}
                  />
                </TableCell>
                <TableCell>Issue</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Reported</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && issues.length === 0 ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell padding="checkbox">
                      <Checkbox disabled />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            height: 20,
                            bgcolor: "grey.300",
                            borderRadius: 1,
                          }}
                        />
                        <Box
                          sx={{
                            height: 16,
                            width: "60%",
                            bgcolor: "grey.200",
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          height: 24,
                          width: 60,
                          bgcolor: "grey.300",
                          borderRadius: 12,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          height: 24,
                          width: 80,
                          bgcolor: "grey.300",
                          borderRadius: 12,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          height: 40,
                          width: 120,
                          bgcolor: "grey.300",
                          borderRadius: 1,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          height: 20,
                          width: 100,
                          bgcolor: "grey.300",
                          borderRadius: 1,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          height: 20,
                          width: 80,
                          bgcolor: "grey.300",
                          borderRadius: 1,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton disabled>
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : issues.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: "center", py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      No issues found matching your criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                issues.map((issue) => {
                  const isItemSelected = isSelected(issue._id);

                  return (
                    <TableRow
                      key={issue._id}
                      hover
                      selected={isItemSelected}
                      onClick={() => handleIssueSelect(issue._id)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isItemSelected} disabled={loading} />
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            fontWeight="medium"
                            noWrap
                          >
                            {issue.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {issue.category}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            {issue.media.images.length > 0 && (
                              <AttachFile fontSize="small" color="action" />
                            )}
                            {issue.comments.length > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <Comment fontSize="small" color="action" />
                                <Typography variant="caption">
                                  {issue.comments.length}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={issue.priority}
                          color={getPriorityColor(issue.priority) as any}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={issue.status.replace("_", " ")}
                          color={getStatusColor(issue.status) as any}
                          size="small"
                          icon={getStatusIcon(issue.status)}
                        />
                      </TableCell>

                      <TableCell>
                        {issue.assignedTo ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: "0.75rem",
                              }}
                            >
                              {issue.assignedTo.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {issue.assignedTo.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {issue.assignedDepartment?.name || "Department"}
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <LocationOn fontSize="small" color="action" />
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 150 }}
                          >
                            {issue.location.address}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {formatDate(issue.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {issue.reportedBy.name}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, issue._id);
                          }}
                          disabled={loading}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={pagination.total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />

        {/* Load More Button */}
        {pagination.hasNextPage && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleLoadMore}
              disabled={loading}
              size="large"
            >
              {loading ? 'Loading...' : 'Load More Issues'}
            </Button>
          </Box>
        )}
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const issue = issues.find((i) => i._id === menuIssueId);
            if (issue) handleViewIssue(issue);
          }}
        >
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            const issue = issues.find((i) => i._id === menuIssueId);
            if (issue) handleAssignIssue(issue);
          }}
        >
          <Assignment sx={{ mr: 1 }} />
          Assign
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleStatusUpdate(menuIssueId!, "acknowledged")}
        >
          <Info sx={{ mr: 1 }} />
          Mark Acknowledged
        </MenuItem>
        <MenuItem
          onClick={() => handleStatusUpdate(menuIssueId!, "in_progress")}
        >
          <Warning sx={{ mr: 1 }} />
          Mark In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate(menuIssueId!, "resolved")}>
          <CheckCircle sx={{ mr: 1 }} />
          Mark Resolved
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate(menuIssueId!, "closed")}>
          <Info sx={{ mr: 1 }} />
          Mark Closed
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate(menuIssueId!, "rejected")}>
          <Error sx={{ mr: 1 }} />
          Mark Rejected
        </MenuItem>
      </Menu>

      {/* View Issue Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Issue Details</DialogTitle>
        <DialogContent>
          {selectedIssue && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedIssue.title}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedIssue.description}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Issue Information
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Category:
                        </Typography>
                        <Typography variant="body2">
                          {selectedIssue.category}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Priority:
                        </Typography>
                        <Chip
                          label={selectedIssue.priority}
                          color={
                            getPriorityColor(selectedIssue.priority) as any
                          }
                          size="small"
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Status:
                        </Typography>
                        <Chip
                          label={selectedIssue.status.replace("_", " ")}
                          color={getStatusColor(selectedIssue.status) as any}
                          size="small"
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Reported:
                        </Typography>
                        <Typography variant="body2">
                          {formatDateTime(selectedIssue.createdAt)}
                        </Typography>
                      </Box>
                      {selectedIssue.resolvedAt && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Resolved:
                          </Typography>
                          <Typography variant="body2">
                            {formatDateTime(selectedIssue.resolvedAt)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Location
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOn color="primary" />
                      <Typography variant="body2">
                        {selectedIssue.location.address}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {selectedIssue.rating && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        Citizen Feedback
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 1,
                        }}
                      >
                        <Rating value={selectedIssue.rating} readOnly />
                        <Typography variant="body2">
                          {selectedIssue.rating}/5 stars
                        </Typography>
                      </Box>
                      {selectedIssue.feedback && (
                        <Typography variant="body2" color="text.secondary">
                          "{selectedIssue.feedback}"
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Issue</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={assignmentData.assigneeId}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    assigneeId: e.target.value,
                  })
                }
                label="Assign To"
              >
                <MenuItem value="staff1">John Smith - Public Works</MenuItem>
                <MenuItem value="staff2">Jane Doe - Health Department</MenuItem>
                <MenuItem value="staff3">
                  Mike Johnson - Transportation
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={assignmentData.priority}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    priority: e.target.value,
                  })
                }
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Due Date"
              type="date"
              value={assignmentData.dueDate}
              onChange={(e) =>
                setAssignmentData({
                  ...assignmentData,
                  dueDate: e.target.value,
                })
              }
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              label="Assignment Notes"
              multiline
              rows={3}
              value={assignmentData.notes}
              onChange={(e) =>
                setAssignmentData({ ...assignmentData, notes: e.target.value })
              }
              fullWidth
              placeholder="Add any specific instructions or notes for the assignee..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignmentSubmit}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IssueManagement;
