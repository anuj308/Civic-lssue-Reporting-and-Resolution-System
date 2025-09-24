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
  Paper,
  useTheme,
} from "@mui/material";
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  PersonAdd,
  Search,
  FilterList,
  Download,
  Upload,
  Block,
  CheckCircle,
  Email,
  Phone,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUsers,
  selectUsers,
  selectUsersLoading,
  selectUsersError,
  selectUsersPagination,
} from "../../store/slices/userSlice";
import { setBreadcrumbs, setPageTitle } from "../../store/slices/uiSlice";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "staff" | "citizen";
  status: "active" | "inactive" | "suspended";
  departmentId?: string;
  department?: {
    id: string;
    name: string;
  };
  createdAt: string;
  lastLoginAt?: string;
  issuesReported?: number;
  issuesResolved?: number;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: "admin" | "staff" | "citizen";
  departmentId: string;
  password?: string;
}

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const users = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const pagination = useSelector(selectUsersPagination);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    role: "citizen",
    departmentId: "",
    password: "",
  });

  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  useEffect(() => {
    dispatch(setPageTitle("User Management"));
    dispatch(
      setBreadcrumbs([
        { label: "Dashboard", path: "/dashboard" },
        { label: "Users", path: "/users" },
      ])
    );

    dispatch(
      fetchUsers({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
      })
    );
  }, [dispatch, page, rowsPerPage, searchTerm, roleFilter, statusFilter]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    userId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUserId(null);
  };

  const handleCreateUser = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "citizen",
      departmentId: "",
      password: "",
    });
    setCreateDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      departmentId: user.departmentId || "",
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleFormSubmit = async () => {
    try {
      if (editDialogOpen && selectedUser) {
        await dispatch(
          updateUser({
            id: selectedUser.id,
            ...formData,
          })
        ).unwrap();
        setSnackbar({
          open: true,
          message: "User updated successfully",
          severity: "success",
        });
        setEditDialogOpen(false);
      } else {
        await dispatch(createUser(formData)).unwrap();
        setSnackbar({
          open: true,
          message: "User created successfully",
          severity: "success",
        });
        setCreateDialogOpen(false);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Operation failed. Please try again.",
        severity: "error",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        await dispatch(deleteUser(selectedUser.id)).unwrap();
        setSnackbar({
          open: true,
          message: "User deleted successfully",
          severity: "success",
        });
        setDeleteDialogOpen(false);
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to delete user",
          severity: "error",
        });
      }
    }
  };

  const handleBulkStatusUpdate = async (
    status: "active" | "inactive" | "suspended"
  ) => {
    try {
      await dispatch(
        bulkUpdateUsers({
          userIds: selectedUsers,
          updates: { status },
        })
      ).unwrap();
      setSnackbar({
        open: true,
        message: `${selectedUsers.length} users updated successfully`,
        severity: "success",
      });
      setSelectedUsers([]);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Bulk update failed",
        severity: "error",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "error";
      case "staff":
        return "primary";
      case "citizen":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "default";
      case "suspended":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isSelected = (id: string) => selectedUsers.indexOf(id) !== -1;

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = users.map((user) => user.id);
      setSelectedUsers(newSelected);
      return;
    }
    setSelectedUsers([]);
  };

  const handleUserSelect = (id: string) => {
    const selectedIndex = selectedUsers.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedUsers, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedUsers.slice(1));
    } else if (selectedIndex === selectedUsers.length - 1) {
      newSelected = newSelected.concat(selectedUsers.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedUsers.slice(0, selectedIndex),
        selectedUsers.slice(selectedIndex + 1)
      );
    }

    setSelectedUsers(newSelected);
  };

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
        <Typography variant="h4" fontWeight="bold">
          User Management
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<Upload />} size="small">
            Import
          </Button>
          <Button variant="outlined" startIcon={<Download />} size="small">
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              placeholder="Search users..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{ minWidth: 300 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select
                multiple
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as string[])}
                input={<OutlinedInput label="Role" />}
                renderValue={(selected) => selected.join(", ")}
              >
                {["admin", "staff", "citizen"].map((role) => (
                  <MenuItem key={role} value={role}>
                    <Checkbox checked={roleFilter.indexOf(role) > -1} />
                    <ListItemText primary={role} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                multiple
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as string[])}
                input={<OutlinedInput label="Status" />}
                renderValue={(selected) => selected.join(", ")}
              >
                {["active", "inactive", "suspended"].map((status) => (
                  <MenuItem key={status} value={status}>
                    <Checkbox checked={statusFilter.indexOf(status) > -1} />
                    <ListItemText primary={status} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedUsers.length > 0 && (
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
            {selectedUsers.length} user(s) selected
          </Typography>
          <Tooltip title="Activate">
            <IconButton
              color="inherit"
              onClick={() => handleBulkStatusUpdate("active")}
            >
              <CheckCircle />
            </IconButton>
          </Tooltip>
          <Tooltip title="Suspend">
            <IconButton
              color="inherit"
              onClick={() => handleBulkStatusUpdate("suspended")}
            >
              <Block />
            </IconButton>
          </Tooltip>
        </Toolbar>
      )}

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedUsers.length > 0 &&
                      selectedUsers.length < users.length
                    }
                    checked={
                      users.length > 0 && selectedUsers.length === users.length
                    }
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Issues</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const isItemSelected = isSelected(user.id);

                return (
                  <TableRow
                    key={user.id}
                    hover
                    selected={isItemSelected}
                    onClick={() => handleUserSelect(user.id)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={isItemSelected} />
                    </TableCell>

                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                          {user.phone && (
                            <Typography variant="body2" color="text.secondary">
                              {user.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>{user.department?.name || "-"}</TableCell>

                    <TableCell>
                      <Chip
                        label={user.status}
                        color={getStatusColor(user.status) as any}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      {user.lastLoginAt
                        ? formatDate(user.lastLoginAt)
                        : "Never"}
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip
                          label={`${user.issuesReported || 0} reported`}
                          size="small"
                          variant="outlined"
                        />
                        {user.role === "staff" && (
                          <Chip
                            label={`${user.issuesResolved || 0} resolved`}
                            size="small"
                            variant="outlined"
                            color="success"
                          />
                        )}
                      </Box>
                    </TableCell>

                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, user.id);
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
            const user = users.find((u) => u.id === menuUserId);
            if (user) handleEditUser(user);
          }}
        >
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem>
          <Email sx={{ mr: 1 }} />
          Send Email
        </MenuItem>
        <MenuItem
          onClick={() => {
            const user = users.find((u) => u.id === menuUserId);
            if (user) handleDeleteUser(user);
          }}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create/Edit User Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editDialogOpen ? "Edit User" : "Create New User"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
            />

            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              fullWidth
              required
            />

            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as any })
                }
                label="Role"
              >
                <MenuItem value="citizen">Citizen</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            {(formData.role === "staff" || formData.role === "admin") && (
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.departmentId}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentId: e.target.value })
                  }
                  label="Department"
                >
                  <MenuItem value="dept1">Public Works</MenuItem>
                  <MenuItem value="dept2">Health Department</MenuItem>
                  <MenuItem value="dept3">Transportation</MenuItem>
                  <MenuItem value="dept4">Parks & Recreation</MenuItem>
                </Select>
              </FormControl>
            )}

            {createDialogOpen && (
              <TextField
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                fullWidth
                required
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              setEditDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleFormSubmit}>
            {editDialogOpen ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{selectedUser?.name}"? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
          >
            Delete
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

export default UserManagement;
