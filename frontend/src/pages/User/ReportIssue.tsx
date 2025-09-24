import React, { useState, useRef, useEffect } from "react";
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
} from "@mui/material";
import {
  LocationOn,
  PhotoCamera,
  Delete,
  MyLocation,
  Send,
  ArrowBack,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "../../store/store";
import { createIssue, clearValidationErrors, selectIssuesValidationErrors } from "../../store/slices/issueSlice";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { setBreadcrumbs, setPageTitle } from "../../store/slices/uiSlice";

interface IssueFormData {
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    city: string;
    pincode: string;
    coordinates: [number, number]; // [longitude, latitude] as expected by backend
    landmark?: string;
  };
  images: File[];
}

const ReportIssue: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = useSelector(selectCurrentUser);
  const validationErrors = useSelector(selectIssuesValidationErrors);

  const [formData, setFormData] = useState<IssueFormData>({
    title: "",
    description: "",
    category: "",
    location: {
      address: "",
      city: "",
      pincode: "",
      coordinates: [0, 0], // [longitude, latitude]
      landmark: "",
    },
    images: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    dispatch(setPageTitle("Report Issue"));
    dispatch(
      setBreadcrumbs([
        { label: "Dashboard", path: "/dashboard" },
        { label: "Report Issue", path: "/report-issue" },
      ])
    );
    
    // Clear any existing validation errors when component mounts
    dispatch(clearValidationErrors());
  }, [dispatch]);

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

  // User-friendly category display names
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

  const handleInputChange = (field: keyof IssueFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors && validationErrors[field]) {
      dispatch(clearValidationErrors());
    }
  };

  const handleLocationChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));

    // Clear validation error for location fields when user starts typing
    if (validationErrors && validationErrors[`location.${field}`]) {
      dispatch(clearValidationErrors());
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      const validImages = newImages.filter((file) => {
        // Check file type
        if (!file.type.startsWith("image/")) {
          setError("Please select only image files");
          return false;
        }
        // Check file size (max 5MB per image)
        if (file.size > 5 * 1024 * 1024) {
          setError("Image size should not exceed 5MB");
          return false;
        }
        return true;
      });

      if (validImages.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...validImages].slice(0, 5), // Max 5 images
        }));
        setError("");
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        // Update form data - coordinates as [longitude, latitude] array
        handleLocationChange("coordinates", [longitude, latitude]);

        // Don't auto-fill address with coordinates - let user enter manually
        // handleLocationChange("address", `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

        setLoading(false);
      },
      (error) => {
        setError("Unable to get your location. Please enter address manually.");
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
      setError("Title is required");
      return false;
    }
    if (formData.title.trim().length < 5 || formData.title.trim().length > 200) {
      setError("Title must be between 5 and 200 characters");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (formData.description.trim().length < 10 || formData.description.trim().length > 1000) {
      setError("Description must be between 10 and 1000 characters");
      return false;
    }
    if (!formData.category) {
      setError("Category is required");
      return false;
    }
    if (!formData.location.address.trim()) {
      setError("Address is required");
      return false;
    }
    if (formData.location.address.trim().length < 5 || formData.location.address.trim().length > 300) {
      setError("Address must be between 5 and 300 characters");
      return false;
    }
    // City is optional
    if (formData.location.city.trim() && formData.location.city.trim().length < 2) {
      setError("City must be at least 2 characters if provided");
      return false;
    }
    if (!formData.location.pincode.trim()) {
      setError("Pincode is required");
      return false;
    }
    if (!/^\d{6}$/.test(formData.location.pincode)) {
      setError("Please provide a valid 6-digit pincode");
      return false;
    }
    if (formData.location.coordinates[1] < -90 || formData.location.coordinates[1] > 90) {
      setError("Invalid latitude coordinates");
      return false;
    }
    if (formData.location.coordinates[0] < -180 || formData.location.coordinates[0] > 180) {
      setError("Invalid longitude coordinates");
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
    setError("");

    try {
      // Convert images to base64 data URLs like mobile app
      const imagePromises = formData.images.map(async (image) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to convert image'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(image);
        });
      });

      const base64Images = await Promise.all(imagePromises);

      // Prepare data in the exact format expected by backend (matching mobile app)
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: 'medium', // Default priority
        location: {
          address: formData.location.address.trim(),
          city: formData.location.city.trim() || 'Ranchi', // Default city if empty
          pincode: formData.location.pincode.trim(),
          landmark: formData.location.landmark?.trim() || '',
          coordinates: {
            latitude: formData.location.coordinates[1], // latitude is at index 1
            longitude: formData.location.coordinates[0]  // longitude is at index 0
          }
        },
        media: {
          images: base64Images, // Send as base64 data URLs
          videos: [],
          audio: null
        },
        tags: [],
        isPublic: true
      };

      console.log('Submitting issue data:', submitData);

      await dispatch(createIssue(submitData)).unwrap();

      // Clear any previous validation errors on success
      dispatch(clearValidationErrors());

      setSuccess(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || "Failed to report issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  if (success) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h5" color="success.main" gutterBottom>
              Issue Reported Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your issue has been submitted and will be reviewed by our team.
              You can track its progress in your dashboard.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
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

      {/* Error Alert - Only show general errors, not validation errors */}
      {error && !validationErrors && (
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
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      required
                      placeholder="Brief description of the issue"
                      inputProps={{ maxLength: 200 }}
                      helperText={
                        validationErrors?.title ||
                        `${formData.title.length}/200 characters`
                      }
                      error={!!validationErrors?.title}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      required
                      multiline
                      rows={4}
                      placeholder="Provide detailed information about the issue"
                      inputProps={{ maxLength: 1000 }}
                      helperText={
                        validationErrors?.description ||
                        `${formData.description.length}/1000 characters`
                      }
                      error={!!validationErrors?.description}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!validationErrors?.category}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category"
                        onChange={(e) =>
                          handleInputChange("category", e.target.value)
                        }
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {categoryDisplayNames[category] || category}
                          </MenuItem>
                        ))}
                      </Select>
                      {validationErrors?.category && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                          {validationErrors.category}
                        </Typography>
                      )}
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
                      onChange={(e) =>
                        handleLocationChange("address", e.target.value)
                      }
                      required
                      placeholder="Enter the address where the issue is located"
                      error={!!(validationErrors?.['location.address'] || validationErrors?.address)}
                      helperText={validationErrors?.['location.address'] || validationErrors?.address}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        fullWidth
                        label="GPS Coordinates"
                        value={
                          formData.location.coordinates[0] !== 0 || formData.location.coordinates[1] !== 0
                            ? `${formData.location.coordinates[1].toFixed(6)}, ${formData.location.coordinates[0].toFixed(6)}`
                            : ''
                        }
                        placeholder="Click GPS button to get coordinates"
                        InputProps={{
                          readOnly: true,
                        }}
                        helperText="Latitude, Longitude (automatically filled when GPS is used)"
                      />
                      <IconButton
                        onClick={getCurrentLocation}
                        disabled={loading}
                        sx={{ 
                          bgcolor: 'primary.main', 
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' },
                          '&:disabled': { bgcolor: 'grey.300' }
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : <MyLocation />}
                      </IconButton>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="City (Optional)"
                      value={formData.location.city}
                      onChange={(e) =>
                        handleLocationChange("city", e.target.value)
                      }
                      placeholder="Enter city name"
                      error={!!validationErrors?.['location.city']}
                      helperText={validationErrors?.['location.city']}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Pincode"
                      value={formData.location.pincode}
                      onChange={(e) =>
                        handleLocationChange("pincode", e.target.value)
                      }
                      required
                      placeholder="Enter 6-digit pincode"
                      inputProps={{ maxLength: 6, pattern: "[0-9]*" }}
                      error={!!validationErrors?.['location.pincode']}
                      helperText={validationErrors?.['location.pincode']}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Landmark (Optional)"
                      value={formData.location.landmark || ""}
                      onChange={(e) =>
                        handleLocationChange("landmark", e.target.value)
                      }
                      placeholder="Nearby landmark for better identification"
                      error={!!validationErrors?.['location.landmark']}
                      helperText={validationErrors?.['location.landmark']}
                    />
                  </Grid>
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
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
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
                    style={{ display: "none" }}
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
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {formData.images.map((image, index) => (
                      <Box key={index} sx={{ position: "relative" }}>
                        <Paper
                          sx={{
                            width: 100,
                            height: 100,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </Paper>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            bgcolor: "background.paper",
                            boxShadow: 1,
                            "&:hover": { bgcolor: "grey.100" },
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
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
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
                {loading ? "Reporting..." : "Report Issue"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ReportIssue;
