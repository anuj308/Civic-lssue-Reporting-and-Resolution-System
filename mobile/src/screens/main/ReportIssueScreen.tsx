import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Surface,
  Portal,
  Modal,
  List,
  Chip,
  IconButton,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { RootState, useAppDispatch } from '../../store/store';
import { createIssue } from '../../store/slices/issueSlice';
import { theme } from '../../theme/index';

interface IssueFormData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  address: string;
  landmark?: string;
  pincode: string;
}

const CATEGORIES = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'streetlight', label: 'Street Light' },
  { value: 'garbage', label: 'Garbage Management' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'sewerage', label: 'Sewerage' },
  { value: 'traffic', label: 'Traffic Issues' },
  { value: 'park_maintenance', label: 'Park Maintenance' },
  { value: 'road_maintenance', label: 'Road Maintenance' },
  { value: 'electrical', label: 'Electrical Issues' },
  { value: 'construction', label: 'Construction Issues' },
  { value: 'noise_pollution', label: 'Noise Pollution' },
  { value: 'air_pollution', label: 'Air Pollution' },
  { value: 'water_pollution', label: 'Water Pollution' },
  { value: 'stray_animals', label: 'Stray Animals' },
  { value: 'illegal_parking', label: 'Illegal Parking' },
  { value: 'illegal_construction', label: 'Illegal Construction' },
  { value: 'public_transport', label: 'Public Transport' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#4CAF50' },
  { value: 'medium', label: 'Medium', color: '#FF9800' },
  { value: 'high', label: 'High', color: '#FF5722' },
  { value: 'critical', label: 'Critical', color: '#F44336' },
];

const ReportIssueScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isSubmitting, error } = useSelector((state: RootState) => state.issues);
  
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IssueFormData>({
    defaultValues: {
      priority: 'medium',
      category: '',
      title: '',
      description: '',
      address: '',
      landmark: '',
      pincode: '',
    },
  });

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');

  const requestLocationPermission = async () => {
    try {
      setIsGettingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to report issues accurately. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const fullAddress = `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
        setValue('address', fullAddress);
        setValue('pincode', address.postalCode || '');
      }

      setSnackbarMessage('Location detected successfully!');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your current location. Please enter the address manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permission is required to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Unable to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        setImages(prev => [...prev, result.assets[0].uri].slice(0, 5));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Unable to take photo. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: IssueFormData) => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services or enter your location manually.');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Images Required', 'Please add at least one image to help identify the issue.');
      return;
    }

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      if (data.subcategory) formData.append('subcategory', data.subcategory);
      formData.append('priority', data.priority);
      
      // Add location data
      formData.append('location[address]', data.address);
      formData.append('location[city]', 'Ranchi'); // Default city
      formData.append('location[state]', 'Jharkhand'); // Default state
      formData.append('location[pincode]', data.pincode);
      if (data.landmark) formData.append('location[landmark]', data.landmark);
      formData.append('location[coordinates][latitude]', location.latitude.toString());
      formData.append('location[coordinates][longitude]', location.longitude.toString());
      
      // Add images
      images.forEach((imageUri, index) => {
        formData.append('media[images]', {
          uri: imageUri,
          type: 'image/jpeg',
          name: `issue_image_${index}.jpg`,
        } as any);
      });

      console.log('🔥 Submitting issue:', data);
      await dispatch(createIssue(formData)).unwrap();
      
      Alert.alert(
        'Success!',
        'Your issue has been reported successfully. You can track its progress in the "My Issues" tab.',
        [
          {
            text: 'OK',
            onPress: () => {
              reset();
              setImages([]);
              setLocation(null);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error submitting issue:', error);
      Alert.alert('Error', error.message || 'Failed to submit issue. Please try again.');
    }
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(cat => cat.value === value)?.label || value;
  };

  const getPriorityInfo = (value: string) => {
    return PRIORITIES.find(p => p.value === value) || PRIORITIES[1];
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.sectionTitle}>
                Report New Issue
              </Text>
              <Text variant="bodyMedium" style={styles.sectionSubtitle}>
                Help improve your community by reporting civic issues
              </Text>
            </Card.Content>
          </Card>

          {/* Issue Details */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Issue Details
              </Text>

              <Controller
                control={control}
                name="title"
                rules={{
                  required: 'Title is required',
                  minLength: { value: 5, message: 'Title must be at least 5 characters' },
                  maxLength: { value: 200, message: 'Title cannot exceed 200 characters' },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Issue Title *"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={!!errors.title}
                    style={styles.input}
                    placeholder="Brief description of the issue"
                  />
                )}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title.message}</Text>
              )}

              <Controller
                control={control}
                name="description"
                rules={{
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' },
                  maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Detailed Description *"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={!!errors.description}
                    style={styles.input}
                    multiline
                    numberOfLines={4}
                    placeholder="Provide detailed information about the issue..."
                  />
                )}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description.message}</Text>
              )}

              {/* Category Selection */}
              <Surface style={styles.selectionContainer}>
                <Text style={styles.selectionLabel}>Category *</Text>
                <Button
                  mode="outlined"
                  onPress={() => setCategoryModalVisible(true)}
                  style={styles.selectionButton}
                  contentStyle={styles.selectionButtonContent}
                >
                  {selectedCategory ? getCategoryLabel(selectedCategory) : 'Select Category'}
                </Button>
                {errors.category && (
                  <Text style={styles.errorText}>{errors.category.message}</Text>
                )}
              </Surface>

              {/* Priority Selection */}
              <Surface style={styles.selectionContainer}>
                <Text style={styles.selectionLabel}>Priority</Text>
                <Button
                  mode="outlined"
                  onPress={() => setPriorityModalVisible(true)}
                  style={styles.selectionButton}
                  contentStyle={styles.selectionButtonContent}
                >
                  <View style={styles.priorityContainer}>
                    <View
                      style={[
                        styles.priorityIndicator,
                        { backgroundColor: getPriorityInfo(selectedPriority).color },
                      ]}
                    />
                    <Text>{getPriorityInfo(selectedPriority).label}</Text>
                  </View>
                </Button>
              </Surface>
            </Card.Content>
          </Card>

          {/* Location */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Location
                </Text>
                <Button
                  mode="outlined"
                  onPress={requestLocationPermission}
                  loading={isGettingLocation}
                  disabled={isGettingLocation}
                  compact
                  icon="crosshairs-gps"
                >
                  {location ? 'Update' : 'Get Location'}
                </Button>
              </View>

              <Controller
                control={control}
                name="address"
                rules={{
                  required: 'Address is required',
                  minLength: { value: 5, message: 'Address must be at least 5 characters' },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Address *"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={!!errors.address}
                    style={styles.input}
                    multiline
                    placeholder="Enter full address"
                  />
                )}
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address.message}</Text>
              )}

              <View style={styles.row}>
                <Controller
                  control={control}
                  name="landmark"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Landmark (Optional)"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      style={[styles.input, styles.halfWidth]}
                      placeholder="Nearby landmark"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="pincode"
                  rules={{
                    required: 'Pincode is required',
                    pattern: { value: /^\d{6}$/, message: 'Enter valid 6-digit pincode' },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Pincode *"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={!!errors.pincode}
                      style={[styles.input, styles.halfWidth]}
                      keyboardType="numeric"
                      maxLength={6}
                      placeholder="000000"
                    />
                  )}
                />
              </View>
              {errors.pincode && (
                <Text style={styles.errorText}>{errors.pincode.message}</Text>
              )}

              {location && (
                <Surface style={styles.locationInfo}>
                  <Text style={styles.locationText}>
                    📍 Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                </Surface>
              )}
            </Card.Content>
          </Card>

          {/* Photos */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Photos
              </Text>
              <Text variant="bodySmall" style={styles.cardSubtitle}>
                Add photos to help identify and resolve the issue faster
              </Text>

              <View style={styles.photoContainer}>
                <Button
                  mode="outlined"
                  onPress={takePhoto}
                  style={styles.photoButton}
                  icon="camera"
                >
                  Take Photo
                </Button>
                <Button
                  mode="outlined"
                  onPress={pickImage}
                  style={styles.photoButton}
                  icon="image"
                >
                  Choose Photo
                </Button>
              </View>

              {images.length > 0 && (
                <View style={styles.imagesGrid}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Surface style={styles.imageContainer}>
                        {/* Note: Replace with actual Image component in real implementation */}
                        <Text style={styles.imagePlaceholder}>Image {index + 1}</Text>
                        <IconButton
                          icon="close"
                          size={20}
                          onPress={() => removeImage(index)}
                          style={styles.removeImageButton}
                        />
                      </Surface>
                    </View>
                  ))}
                </View>
              )}

              {images.length === 0 && (
                <Surface style={styles.noImagesContainer}>
                  <Text style={styles.noImagesText}>No photos added yet</Text>
                </Surface>
              )}
            </Card.Content>
          </Card>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {isSubmitting ? 'Submitting...' : 'Report Issue'}
            </Button>
          </View>
        </ScrollView>

        {/* Category Modal */}
        <Portal>
          <Modal
            visible={categoryModalVisible}
            onDismiss={() => setCategoryModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              Select Category
            </Text>
            <ScrollView style={styles.modalScrollView}>
              {CATEGORIES.map((category) => (
                <List.Item
                  key={category.value}
                  title={category.label}
                  onPress={() => {
                    setValue('category', category.value);
                    setCategoryModalVisible(false);
                  }}
                  left={(props) => <List.Icon {...props} icon="tag" />}
                  style={selectedCategory === category.value ? styles.selectedItem : undefined}
                />
              ))}
            </ScrollView>
          </Modal>
        </Portal>

        {/* Priority Modal */}
        <Portal>
          <Modal
            visible={priorityModalVisible}
            onDismiss={() => setPriorityModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              Select Priority
            </Text>
            {PRIORITIES.map((priority) => (
              <List.Item
                key={priority.value}
                title={priority.label}
                onPress={() => {
                  setValue('priority', priority.value as any);
                  setPriorityModalVisible(false);
                }}
                left={() => (
                  <View
                    style={[
                      styles.priorityIndicator,
                      { backgroundColor: priority.color },
                    ]}
                  />
                )}
                style={selectedPriority === priority.value ? styles.selectedItem : undefined}
              />
            ))}
          </Modal>
        </Portal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: theme.colors.onSurfaceVariant,
  },
  cardTitle: {
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  cardSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  selectionContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  selectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  selectionButton: {
    backgroundColor: theme.colors.surface,
  },
  selectionButtonContent: {
    paddingVertical: 8,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  locationInfo: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryContainer,
    marginTop: 8,
  },
  locationText: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 12,
  },
  photoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  imageItem: {
    width: '30%',
    margin: '1.5%',
  },
  imageContainer: {
    aspectRatio: 1,
    borderRadius: 8,
    padding: 8,
    position: 'relative',
    backgroundColor: theme.colors.surfaceVariant,
  },
  imagePlaceholder: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error,
  },
  noImagesContainer: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  noImagesText: {
    color: theme.colors.onSurfaceVariant,
  },
  submitContainer: {
    padding: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  selectedItem: {
    backgroundColor: theme.colors.primaryContainer,
  },
});

export default ReportIssueScreen;