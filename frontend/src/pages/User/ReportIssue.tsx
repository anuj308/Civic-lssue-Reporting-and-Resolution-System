import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  useTheme,
  Divider,
} from '@mui/material';
import {
  LocationOn,
  PhotoCamera,
  Delete,
  MyLocation,
  Send,
  ArrowBack,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '../../store/store';
import { createIssue } from '../../store/slices/issueSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  setBreadcrumbs,
  setPageTitle,
} from '../../store/slices/uiSlice';

interface IssueFormData {
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  images: File[];
}

const ReportIssue: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = useSelector(selectCurrentUser);

  const [formData, setFormData] = useState<IssueFormData>({
    title: '',
    description: '',
    category: '',
    location: {
      address: '',
      coordinates: [0, 0],
    },
    images: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    dispatch(setPageTitle('Report Issue'));
    dispatch(setBreadcrumbs([
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Report Issue', path: '/report-issue' }
    ]));
  }, [dispatch]);

  const categories = [
    'pothole',
    'streetlight',
    'garbage',
    'traffic',
    'water',
    'sewage',
    'electricity',
    'road',
    'sidewalk',
    'parking',
    'noise',
    'other',
  ];

  const handleInputChange = (field: keyof IssueFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      const validImages = newImages.filter(file => {
        // Check file type
        if (!file.type.startsWith('image/')) {
          setError('Please select only image files');
          return false;
        }
        // Check file size (max 5MB per image)
        if (file.size > 5 * 1024 * 1024) {
          setError('Image size should not exceed 5MB');
          return false;
        }
        return true;
      });

      if (validImages.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...validImages].slice(0, 5), // Max 5 images
        }));
        setError('');
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        // Update form data
        handleLocationChange('coordinates', [longitude, latitude]);

        // Try to get address from coordinates (you might want to use a geocoding service)
        try {
          // For now, just set coordinates as address
          handleLocationChange('address', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } catch (err) {
          console.error('Error getting address:', err);
        }

        setLoading(false);
      },
      (error) => {
        setError('Unable to get your location. Please enter address manually.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.category) {
      setError('Category is required');
      return false;
    }
    if (!formData.location.address.trim()) {
      setError('Location address is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Add basic fields
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('location[address]', formData.location.address);
      submitData.append('location[coordinates][0]', formData.location.coordinates[0].toString());
      submitData.append('location[coordinates][1]', formData.location.coordinates[1].toString());

      // Add images
      formData.images.forEach((image, index) => {
        submitData.append('images', image);
      });

      await dispatch(createIssue(submitData)).unwrap();

      setSuccess(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to report issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (success) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" color="success.main" gutterBottom>
              Issue Reported Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your issue has been submitted and will be reviewed by our team.
              You can track its progress in your dashboard.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Report an Issue
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Help improve your community by reporting civic issues
          </Typography>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Issue Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Issue Title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                      placeholder="Brief description of the issue"
                      inputProps={{ maxLength: 200 }}
                      helperText={`${formData.title.length}/200 characters`}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                      multiline
                      rows={4}
                      placeholder="Provide detailed information about the issue"
                      inputProps={{ maxLength: 1000 }}
                      helperText={`${formData.description.length}/1000 characters`}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category"
                        onChange={(e) => handleInputChange('category', e.target.value)}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Location */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Location
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={formData.location.address}
                      onChange={(e) => handleLocationChange('address', e.target.value)}
                      required
                      placeholder="Enter the address where the issue is located"
                      InputProps={{
                        endAdornment: (
                          <IconButton onClick={getCurrentLocation} disabled={loading}>
                            <MyLocation />
                          </IconButton>
                        ),
                      }}
                    />
                  </Grid>

                  {currentLocation && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Current location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Images */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Photos (Optional)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add up to 5 photos to help illustrate the issue
                </Typography>

                {/* Image Upload Button */}
                <Box sx={{ mb: 2 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={formData.images.length >= 5}
                  >
                    Add Photos ({formData.images.length}/5)
                  </Button>
                </Box>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {formData.images.map((image, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <Paper
                          sx={{
                            width: 100,
                            height: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </Paper>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'background.paper',
                            boxShadow: 1,
                            '&:hover': { bgcolor: 'grey.100' },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                disabled={loading}
                size="large"
              >
                {loading ? 'Reporting...' : 'Report Issue'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ReportIssue;