import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Surface,
  Text,
  Avatar,
  Button,
  Card,
  List,
  Switch,
  Divider,
  Badge,
  IconButton,
  Portal,
  Dialog,
  TextInput,
  ProgressBar,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { logout, deleteAccount } from '../../store/slices/authSlice';
import { updateUser } from '../../store/slices/authSlice';
import { userApi } from '../../services/api';

const { width } = Dimensions.get('window');

interface UserStats {
  totalIssues: number;
  resolvedIssues: number;
  upvotesReceived: number;
  contributionLevel: string;
  badgesEarned: string[];
  joinDate: string;
}

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  statusUpdates: boolean;
  nearbyIssues: boolean;
  weeklyDigest: boolean;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [userStats, setUserStats] = useState<UserStats>({
    totalIssues: 0,
    resolvedIssues: 0,
    upvotesReceived: 0,
    contributionLevel: 'Bronze',
    badgesEarned: [],
    joinDate: '',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    statusUpdates: true,
    nearbyIssues: false,
    weeklyDigest: true,
  });

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const mockStats: UserStats = {
    totalIssues: 12,
    resolvedIssues: 8,
    upvotesReceived: 156,
    contributionLevel: 'Silver',
    badgesEarned: ['First Reporter', 'Problem Solver', 'Community Helper'],
    joinDate: '2024-01-15T00:00:00Z',
  };

  useEffect(() => {
    loadUserStats();
    loadNotificationSettings();
    if (user) {
      // Split the name into first and last name for the form
      const nameParts = user.name ? user.name.split(' ') : ['', ''];
      setEditForm({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      // Call the real user stats API
      const response = await userApi.getProfile();
      const userData = response.data.data;
      
      // Call the user stats API
      const statsResponse = await userApi.getStats();
      const statsData = statsResponse.data.data;
      
      setUserStats({
        totalIssues: statsData.totalIssues,
        resolvedIssues: statsData.resolvedIssues,
        upvotesReceived: statsData.upvotesReceived,
        contributionLevel: statsData.contributionLevel,
        badgesEarned: statsData.badgesEarned,
        joinDate: userData.createdAt,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Fallback to mock data if API fails
      setUserStats(mockStats);
      Alert.alert('Error', 'Failed to load user statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      // Load from storage or API
      // For now, use default values
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      // Prepare the data to send to the API
      const updateData = {
        name: editForm.firstName && editForm.lastName 
          ? `${editForm.firstName.trim()} ${editForm.lastName.trim()}` 
          : user?.name,
        phone: editForm.phone || undefined,
      };
      
      // Call the real update profile API
      await userApi.updateProfile(updateData);
      
      // Update the Redux store with the new user data
      dispatch(updateUser({
        name: updateData.name,
        phone: updateData.phone,
      }));
      
      setShowEditDialog(false);
      Alert.alert('Success', 'Profile updated successfully');
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAvatar = async () => {
    Alert.alert(
      'Change Avatar',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      // Upload avatar to server
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      // Upload avatar to server
    }
  };

  const handleUpdateNotificationSetting = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      setNotifications(prev => ({ ...prev, [key]: value }));
      // Save to API or storage
    } catch (error) {
      console.error('Error updating notification setting:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      setShowLogoutDialog(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      
      // Call the delete account API
      await dispatch(deleteAccount()).unwrap();
      
      setShowDeleteDialog(false);
      
      // Show success message
      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted. You will now be signed out.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to welcome screen (user is already logged out by deleteAccount thunk)
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', error || 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getContributionColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      default: return theme.colors.outline;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getContributionProgress = () => {
    const levels = { bronze: 0, silver: 25, gold: 50, platinum: 100 };
    const currentLevel = userStats.contributionLevel.toLowerCase() as keyof typeof levels;
    return levels[currentLevel] / 100;
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAuthenticatedContainer}>
          <Icon name="account-circle" size={80} color={theme.colors.outline} />
          <Text style={styles.notAuthenticatedTitle}>Not Signed In</Text>
          <Text style={styles.notAuthenticatedSubtitle}>
            Please sign in to view your profile
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={styles.signInButton}
          >
            Sign In
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="menu"
              size={24}
              onPress={() => {
                // TODO: Implement drawer or menu functionality
                console.log('Menu pressed');
              }}
            />
            <Text variant="headlineSmall" style={styles.headerTitle}>Profile</Text>
            <IconButton
              icon="cog"
              size={24}
              onPress={() => {/* Open settings */}}
            />
          </View>
        </Surface>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={handleChangeAvatar}>
                <Avatar.Image
                  size={100}
                  source={
                    avatarUri
                      ? { uri: avatarUri }
                      : user.profileImage
                      ? { uri: user.profileImage }
                      : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random` }
                  }
                />
                <View style={styles.avatarEdit}>
                  <Icon name="camera" size={16} color={theme.colors.onPrimary} />
                </View>
              </TouchableOpacity>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.name || 'User'}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.contributionBadge}>
                  <Icon
                    name="medal"
                    size={16}
                    color={getContributionColor(userStats.contributionLevel)}
                  />
                  <Text style={[styles.contributionLevel, { color: getContributionColor(userStats.contributionLevel) }]}>
                    {userStats.contributionLevel} Contributor
                  </Text>
                </View>
              </View>
            </View>

            <Button
              mode="outlined"
              icon="pencil"
              onPress={() => setShowEditDialog(true)}
              style={styles.editButton}
            >
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="flag" size={24} color={theme.colors.primary} />
              <Text style={styles.statNumber}>{userStats.totalIssues}</Text>
              <Text style={styles.statLabel}>Issues Reported</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="check-circle" size={24} color={theme.colors.success} />
              <Text style={styles.statNumber}>{userStats.resolvedIssues}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="thumb-up" size={24} color={theme.colors.warning} />
              <Text style={styles.statNumber}>{userStats.upvotesReceived}</Text>
              <Text style={styles.statLabel}>Upvotes</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Contribution Progress */}
        <Card style={styles.progressCard}>
          <Card.Content>
            <Text style={styles.progressTitle}>Contribution Progress</Text>
            <Text style={styles.progressSubtitle}>
              Keep reporting and engaging to reach the next level!
            </Text>
            <ProgressBar
              progress={getContributionProgress()}
              color={getContributionColor(userStats.contributionLevel)}
              style={styles.progressBar}
            />
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Bronze</Text>
              <Text style={styles.progressLabel}>Silver</Text>
              <Text style={styles.progressLabel}>Gold</Text>
              <Text style={styles.progressLabel}>Platinum</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Badges */}
        {userStats.badgesEarned.length > 0 && (
          <Card style={styles.badgesCard}>
            <Card.Content>
              <Text style={styles.badgesTitle}>Badges Earned</Text>
              <View style={styles.badgesContainer}>
                {userStats.badgesEarned.map((badge, index) => (
                  <Chip
                    key={index}
                    icon="trophy"
                    mode="flat"
                    style={styles.badge}
                    textStyle={styles.badgeText}
                  >
                    {badge}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Account Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>Account Information</Text>
            <List.Item
              title="Phone Number"
              description={user.phone || 'Not provided'}
              left={props => <List.Icon {...props} icon="phone" />}
            />
            <Divider />
            <List.Item
              title="Member Since"
              description={formatDate(userStats.joinDate || user.createdAt || new Date().toISOString())}
              left={props => <List.Icon {...props} icon="calendar" />}
            />
            <Divider />
            <List.Item
              title="Verification Status"
              description="Verified"
              left={props => <List.Icon {...props} icon="check-circle" />}
              right={props => <Badge {...props} style={styles.verifiedBadge}>Verified</Badge>}
            />
          </Card.Content>
        </Card>

        {/* Security Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text style={styles.settingsTitle}>Security & Privacy</Text>
            
            <List.Item
              title="Security Dashboard"
              description="Manage devices, sessions, and security alerts"
              left={props => <List.Icon {...props} icon="shield-check" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Security')}
            />
            <Divider />
            
            <List.Item
              title="Device Management"
              description="View and manage your active sessions"
              left={props => <List.Icon {...props} icon="devices" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('DeviceManagement')}
            />
            <Divider />
            
            <List.Item
              title="Security Alerts"
              description="View and manage security notifications"
              left={props => <List.Icon {...props} icon="alert-circle" />}
              right={() => (
                <View style={styles.alertsRight}>
                  <Badge size={18} style={styles.alertsBadge}>3</Badge>
                  <List.Icon icon="chevron-right" />
                </View>
              )}
              onPress={() => navigation.navigate('SecurityAlerts')}
            />
            <Divider />
            
            <List.Item
              title="Security Settings"
              description="Configure security preferences and notifications"
              left={props => <List.Icon {...props} icon="cog" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('SecuritySettings')}
            />
          </Card.Content>
        </Card>

        {/* Notification Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text style={styles.settingsTitle}>Notification Settings</Text>
            
            <List.Item
              title="Push Notifications"
              description="Receive push notifications on your device"
              left={props => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notifications.pushNotifications}
                  onValueChange={(value) => handleUpdateNotificationSetting('pushNotifications', value)}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="Email Notifications"
              description="Receive notifications via email"
              left={props => <List.Icon {...props} icon="email" />}
              right={() => (
                <Switch
                  value={notifications.emailNotifications}
                  onValueChange={(value) => handleUpdateNotificationSetting('emailNotifications', value)}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="Status Updates"
              description="Get notified when your issues are updated"
              left={props => <List.Icon {...props} icon="update" />}
              right={() => (
                <Switch
                  value={notifications.statusUpdates}
                  onValueChange={(value) => handleUpdateNotificationSetting('statusUpdates', value)}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="Nearby Issues"
              description="Get alerts about issues in your area"
              left={props => <List.Icon {...props} icon="map-marker" />}
              right={() => (
                <Switch
                  value={notifications.nearbyIssues}
                  onValueChange={(value) => handleUpdateNotificationSetting('nearbyIssues', value)}
                />
              )}
            />
            <Divider />
            
            <List.Item
              title="Weekly Digest"
              description="Receive a weekly summary of community activity"
              left={props => <List.Icon {...props} icon="email-newsletter" />}
              right={() => (
                <Switch
                  value={notifications.weeklyDigest}
                  onValueChange={(value) => handleUpdateNotificationSetting('weeklyDigest', value)}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Account Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text style={styles.actionsTitle}>Account Actions</Text>
            
            <List.Item
              title="Export Data"
              description="Download a copy of your data"
              left={props => <List.Icon {...props} icon="download" />}
              onPress={() => {/* Handle export */}}
            />
            <Divider />
            
            <List.Item
              title="Privacy Policy"
              description="View our privacy policy"
              left={props => <List.Icon {...props} icon="shield-account" />}
              onPress={() => {/* Open privacy policy */}}
            />
            <Divider />
            
            <List.Item
              title="Terms of Service"
              description="View our terms of service"
              left={props => <List.Icon {...props} icon="file-document" />}
              onPress={() => {/* Open terms */}}
            />
            <Divider />
            
            <List.Item
              title="Sign Out"
              description="Sign out of your account"
              left={props => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
              titleStyle={{ color: theme.colors.error }}
              onPress={() => setShowLogoutDialog(true)}
            />
            <Divider />
            
            <List.Item
              title="Delete Account"
              description="Permanently delete your account"
              left={props => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
              titleStyle={{ color: theme.colors.error }}
              onPress={() => setShowDeleteDialog(true)}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="First Name"
              value={editForm.firstName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, firstName: text }))}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Last Name"
              value={editForm.lastName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, lastName: text }))}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Phone Number"
              value={editForm.phone}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              loading={loading}
              disabled={loading}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
          <Dialog.Title>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to sign out?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleLogout}>
              Sign Out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Account Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.deleteWarning}>
              This action cannot be undone. All your data, including reported issues, 
              comments, and account information will be permanently deleted.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              onPress={handleDeleteAccount}
              loading={loading}
              disabled={loading}
            >
              Delete Account
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notAuthenticatedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  notAuthenticatedSubtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  signInButton: {
    marginTop: 16,
  },
  header: {
    backgroundColor: theme.colors.surface,
    elevation: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  profileCard: {
    margin: 16,
    marginBottom: 12,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  userEmail: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  contributionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contributionLevel: {
    fontWeight: '600',
  },
  editButton: {
    width: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
  },
  progressCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  progressSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  badgesCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  badgesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: theme.colors.primaryContainer,
  },
  badgeText: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 12,
  },
  infoCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: theme.colors.success,
  },
  settingsCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  actionsCard: {
    margin: 16,
    marginTop: 4,
    marginBottom: 32,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
  deleteWarning: {
    color: theme.colors.error,
    lineHeight: 20,
  },
  alertsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertsBadge: {
    backgroundColor: theme.colors.error,
  },
});
