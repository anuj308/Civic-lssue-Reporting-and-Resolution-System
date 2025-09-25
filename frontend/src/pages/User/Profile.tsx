import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Security,
  Notifications,
  History,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";

import { selectUser, updateUser } from "../../store/slices/authSlice";
import { setBreadcrumbs } from "../../store/slices/uiSlice";
import { userApi } from "../../services/api";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  dateOfBirth?: string;
  profileImage?: string;
}

interface UserStats {
  totalIssues: number;
  resolvedIssues: number;
  upvotesReceived: number;
  contributionLevel: string;
  badgesEarned: string[];
}

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    dateOfBirth: "",
    profileImage: "",
  });
  const [userStats, setUserStats] = useState<UserStats>({
    totalIssues: 0,
    resolvedIssues: 0,
    upvotesReceived: 0,
    contributionLevel: 'Bronze',
    badgesEarned: [],
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    dispatch(
      setBreadcrumbs([
        { label: "Dashboard", path: "/dashboard" },
        { label: "Profile", path: "/profile" },
      ])
    );

    loadUserProfile();
    loadUserStats();
  }, [dispatch]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userApi.getProfile();
      const userData = response;

      // Split the name into first and last name for the form
      const nameParts = userData.name ? userData.name.split(' ') : ['', ''];
      setProfileData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(' ') || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
        },
        dateOfBirth: userData.dateOfBirth || "",
        profileImage: userData.profileImage || "",
      });
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      setStatsLoading(true);
      const response = await userApi.getStats();
      setUserStats(response);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      // Keep default stats on error
    } finally {
      setStatsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    setSuccess("");
    // Reload the original data from API
    loadUserProfile();
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      if (
        !profileData.firstName.trim() ||
        !profileData.lastName.trim() ||
        !profileData.email.trim()
      ) {
        throw new Error("First name, last name, and email are required");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Prepare the data to send to the API
      const updateData = {
        name: profileData.firstName && profileData.lastName
          ? `${profileData.firstName.trim()} ${profileData.lastName.trim()}`
          : user?.name,
        phone: profileData.phone || undefined,
        address: profileData.address,
        dateOfBirth: profileData.dateOfBirth || undefined,
      };

      // Call the real update profile API
      await userApi.updateProfile(updateData);

      // Update the Redux store with the new user data
      dispatch(
        updateUser({
          ...user,
          ...updateData,
        })
      );

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call the real change password API
      await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccess("Password changed successfully!");
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      // Reset password visibility states
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  // Password visibility toggle handlers
  const handleToggleCurrentPassword = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const handleToggleNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('avatar', file);

      // Upload avatar to server
      const response = await userApi.uploadAvatar(formData);

      // Update profile data with new avatar URL
      setProfileData(prev => ({
        ...prev,
        profileImage: response.profileImage || response.avatar,
      }));

      // Update Redux store
      dispatch(updateUser({
        profileImage: response.profileImage || response.avatar,
      }));

      setSuccess('Avatar updated successfully!');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profileData.firstName) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            My Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your account information and preferences
          </Typography>
        </Box>

        {!isEditing && (
          <Button variant="contained" startIcon={<Edit />} onClick={handleEdit}>
            Edit Profile
          </Button>
        )}
      </Box>

      {/* Success/Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Picture and Basic Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Box position="relative" display="inline-block" mb={2}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: "auto",
                    mb: 2,
                    fontSize: "3rem",
                    bgcolor: "primary.main",
                  }}
                  src={profileData.profileImage}
                >
                  {profileData.firstName.charAt(0)}
                  {profileData.lastName.charAt(0)}
                </Avatar>

                {isEditing && (
                  <IconButton
                    sx={{
                      position: "absolute",
                      bottom: 16,
                      right: 16,
                      bgcolor: "primary.main",
                      color: "white",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    }}
                    component="label"
                  >
                    <input
                      hidden
                      accept="image/*"
                      type="file"
                      onChange={handleImageUpload}
                    />
                    <PhotoCamera />
                  </IconButton>
                )}
              </Box>

              <Typography variant="h6" gutterBottom>
                {profileData.firstName} {profileData.lastName}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.role?.replace("_", " ").toUpperCase() || "CITIZEN"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Member since{" "}
                {user?.createdAt
                  ? format(new Date(user.createdAt), "MMMM yyyy")
                  : "Unknown"}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="center" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<Security />}
                  onClick={() => setPasswordDialogOpen(true)}
                  size="small"
                >
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        dateOfBirth: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Address
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={profileData.address?.street}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        address: { ...prev.address!, street: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={profileData.address?.city}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        address: { ...prev.address!, city: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="State"
                    value={profileData.address?.state}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        address: { ...prev.address!, state: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    value={profileData.address?.zipCode}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        address: { ...prev.address!, zipCode: e.target.value },
                      }))
                    }
                    disabled={!isEditing}
                  />
                </Grid>
              </Grid>

              {isEditing && (
                <Box display="flex" gap={2} mt={3}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={20} /> : "Save Changes"}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Statistics
              </Typography>

              {statsLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="h4" color="primary.main">
                        {userStats.totalIssues}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Issues Reported
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="h4" color="success.main">
                        {userStats.resolvedIssues}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Issues Resolved
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="h4" color="warning.main">
                        {userStats.upvotesReceived}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upvotes Received
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="h4" color="info.main">
                        {userStats.contributionLevel}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Contribution Level
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Badges Section */}
              {userStats.badgesEarned.length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Badges Earned
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {userStats.badgesEarned.map((badge, index) => (
                      <Paper
                        key={index}
                        sx={{
                          px: 2,
                          py: 1,
                          bgcolor: "primary.light",
                          color: "primary.contrastText",
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body2">{badge}</Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => {
          setPasswordDialogOpen(false);
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          setShowCurrentPassword(false);
          setShowNewPassword(false);
          setShowConfirmPassword(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type={showCurrentPassword ? "text" : "password"}
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle current password visibility"
                    onClick={handleToggleCurrentPassword}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            type={showNewPassword ? "text" : "password"}
            label="New Password"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle new password visibility"
                    onClick={handleToggleNewPassword}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={handleToggleConfirmPassword}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Change Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
