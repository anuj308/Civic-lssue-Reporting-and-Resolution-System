import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
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
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store/store';
import {
  fetchIssues,
  updateIssue,
  assignIssue,
  bulkUpdateIssues,
  selectIssues,
  selectIssuesLoading,
  selectIssuesError,
  selectIssuesPagination,
} from '../../store/slices/issueSlice';
import {
  setBreadcrumbs,
  setPageTitle,
} from '../../store/slices/uiSlice';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  reportedBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    department: string;
  };
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    type: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdBy: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  rating?: number;
  feedback?: string;
}

const IssueManagement: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const issues = useSelector(selectIssues);
  const loading = useSelector(selectIssuesLoading);
  const error = useSelector(selectIssuesError);
  const pagination = useSelector(selectIssuesPagination);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
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
    assigneeId: '',
    priority: '',
    dueDate: '',
    notes: '',
  });
  
  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    dispatch(setPageTitle('Issue Management'));
    dispatch(setBreadcrumbs([
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Issues', path: '/issues' }
    ]));
    
    dispatch(fetchIssues({
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
      priority: priorityFilter,
    }));
  }, [dispatch, page, rowsPerPage, searchTerm, categoryFilter, statusFilter, priorityFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, issueId: string) => {
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
      assigneeId: issue.assignedTo?.id || '',
      priority: issue.priority,
      dueDate: '',
      notes: '',
    });
    setAssignDialogOpen(true);
    handleMenuClose();
  };

  const handleStatusUpdate = async (issueId: string, status: string) => {
    try {
      await dispatch(updateIssue({
        id: issueId,
        status,
      })).unwrap();
      setSnackbar({
        open: true,
        message: 'Issue status updated successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update issue status',
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const handleAssignmentSubmit = async () => {
    if (selectedIssue) {
      try {
        await dispatch(assignIssue({
          issueId: selectedIssue.id,
          ...assignmentData,
        })).unwrap();
        setSnackbar({
          open: true,
          message: 'Issue assigned successfully',
          severity: 'success',
        });
        setAssignDialogOpen(false);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to assign issue',
          severity: 'error',
        });
      }
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      await dispatch(bulkUpdateIssues({
        issueIds: selectedIssues,
        updates: { status },
      })).unwrap();
      setSnackbar({
        open: true,
        message: `${selectedIssues.length} issues updated successfully`,
        severity: 'success',
      });
      setSelectedIssues([]);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Bulk update failed',
        severity: 'error',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'assigned': return 'info';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'assigned': return <Assignment />;
      case 'in_progress': return <Warning />;
      case 'resolved': return <CheckCircle />;
      case 'closed': return <Info />;
      default: return <Info />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isSelected = (id: string) => selectedIssues.indexOf(id) !== -1;

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = issues.map((issue) => issue.id);
      setSelectedIssues(newSelected);
      return;
    }
    setSelectedIssues([]);
  };

  const handleIssueSelect = (id: string) => {
    const selectedIndex = selectedIssues.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIssues, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIssues.slice(1));
    } else if (selectedIndex === selectedIssues.length - 1) {
      newSelected = newSelected.concat(selectedIssues.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIssues.slice(0, selectedIndex),
        selectedIssues.slice(selectedIndex + 1),
      );
    }

    setSelectedIssues(newSelected);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Issue Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            size="small"
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
          >
            Create Issue
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Search issues..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  multiple
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as string[])}
                  input={<OutlinedInput label="Category" />}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {['Infrastructure', 'Environment', 'Safety', 'Transportation', 'Health'].map((category) => (
                    <MenuItem key={category} value={category}>
                      <Checkbox checked={categoryFilter.indexOf(category) > -1} />
                      <ListItemText primary={category} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as string[])}
                  input={<OutlinedInput label="Status" />}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {['pending', 'assigned', 'in_progress', 'resolved', 'closed'].map((status) => (
                    <MenuItem key={status} value={status}>
                      <Checkbox checked={statusFilter.indexOf(status) > -1} />
                      <ListItemText primary={status} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  multiple
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as string[])}
                  input={<OutlinedInput label="Priority" />}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      <Checkbox checked={priorityFilter.indexOf(priority) > -1} />
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
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Typography sx={{ flex: '1 1 100%' }} variant="subtitle1" component="div">
            {selectedIssues.length} issue(s) selected
          </Typography>
          <Tooltip title="Mark In Progress">
            <IconButton
              color="inherit"
              onClick={() => handleBulkStatusUpdate('in_progress')}
            >
              <Warning />
            </IconButton>
          </Tooltip>
          <Tooltip title="Mark Resolved">
            <IconButton
              color="inherit"
              onClick={() => handleBulkStatusUpdate('resolved')}
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
                    indeterminate={selectedIssues.length > 0 && selectedIssues.length < issues.length}
                    checked={issues.length > 0 && selectedIssues.length === issues.length}
                    onChange={handleSelectAllClick}
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
              {issues.map((issue) => {
                const isItemSelected = isSelected(issue.id);
                
                return (
                  <TableRow
                    key={issue.id}
                    hover
                    selected={isItemSelected}
                    onClick={() => handleIssueSelect(issue.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={isItemSelected} />
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium" noWrap>
                          {issue.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {issue.category}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          {issue.attachments.length > 0 && (
                            <AttachFile fontSize="small" color="action" />
                          )}
                          {issue.comments.length > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                        icon={issue.priority === 'urgent' ? <PriorityHigh /> : undefined}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={issue.status.replace('_', ' ')}
                        color={getStatusColor(issue.status) as any}
                        size="small"
                        icon={getStatusIcon(issue.status)}
                      />
                    </TableCell>
                    
                    <TableCell>
                      {issue.assignedTo ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {issue.assignedTo.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {issue.assignedTo.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {issue.assignedTo.department}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
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
                          handleMenuOpen(e, issue.id);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
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
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const issue = issues.find(i => i.id === menuIssueId);
            if (issue) handleViewIssue(issue);
          }}
        >
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            const issue = issues.find(i => i.id === menuIssueId);
            if (issue) handleAssignIssue(issue);
          }}
        >
          <Assignment sx={{ mr: 1 }} />
          Assign
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleStatusUpdate(menuIssueId!, 'in_progress')}>
          <Warning sx={{ mr: 1 }} />
          Mark In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate(menuIssueId!, 'resolved')}>
          <CheckCircle sx={{ mr: 1 }} />
          Mark Resolved
        </MenuItem>
      </Menu>

      {/* View Issue Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Issue Details
        </DialogTitle>
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
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Issue Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Category:</Typography>
                        <Typography variant="body2">{selectedIssue.category}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Priority:</Typography>
                        <Chip
                          label={selectedIssue.priority}
                          color={getPriorityColor(selectedIssue.priority) as any}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Status:</Typography>
                        <Chip
                          label={selectedIssue.status.replace('_', ' ')}
                          color={getStatusColor(selectedIssue.status) as any}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Reported:</Typography>
                        <Typography variant="body2">{formatDateTime(selectedIssue.createdAt)}</Typography>
                      </Box>
                      {selectedIssue.resolvedAt && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Resolved:</Typography>
                          <Typography variant="body2">{formatDateTime(selectedIssue.resolvedAt)}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Location
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Citizen Feedback
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
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
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Issue
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={assignmentData.assigneeId}
                onChange={(e) => setAssignmentData({ ...assignmentData, assigneeId: e.target.value })}
                label="Assign To"
              >
                <MenuItem value="staff1">John Smith - Public Works</MenuItem>
                <MenuItem value="staff2">Jane Doe - Health Department</MenuItem>
                <MenuItem value="staff3">Mike Johnson - Transportation</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={assignmentData.priority}
                onChange={(e) => setAssignmentData({ ...assignmentData, priority: e.target.value })}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Due Date"
              type="date"
              value={assignmentData.dueDate}
              onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
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
              onChange={(e) => setAssignmentData({ ...assignmentData, notes: e.target.value })}
              fullWidth
              placeholder="Add any specific instructions or notes for the assignee..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>
            Cancel
          </Button>
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IssueManagement;
