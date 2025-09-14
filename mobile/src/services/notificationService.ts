import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  data?: Record<string, any>;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize the notification service and request permissions
   */
  async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications');
      return null;
    }

    try {
      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Failed to get push token for push notification!');
      }

      // Get the push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;

      this.expoPushToken = token;
      console.log('Expo Push Token:', token);

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  /**
   * Get the current Expo push token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Send a local notification immediately
   */
  async sendLocalNotification(notification: NotificationData): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a notification for a specific time
   */
  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: notification.scheduledTime,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners() {
    // Listener for notifications received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Handle notification received while app is running
    });

    // Listener for notification interactions (user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      if (data.type === 'issue_update') {
        // Navigate to issue detail screen
        // You can implement navigation logic here
      } else if (data.type === 'new_issue_nearby') {
        // Navigate to map screen
        // You can implement navigation logic here
      }
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  /**
   * Remove notification listeners
   */
  removeNotificationListeners(listeners: {
    notificationListener: Notifications.Subscription;
    responseListener: Notifications.Subscription;
  }) {
    Notifications.removeNotificationSubscription(listeners.notificationListener);
    Notifications.removeNotificationSubscription(listeners.responseListener);
  }

  /**
   * Send notification for issue status update
   */
  async notifyIssueStatusUpdate(issueId: string, issueTitle: string, newStatus: string): Promise<void> {
    const statusMessages = {
      in_progress: 'Your issue is now being worked on',
      resolved: 'Your issue has been resolved',
      rejected: 'Your issue has been rejected',
    };

    const message = statusMessages[newStatus as keyof typeof statusMessages] || 'Your issue status has been updated';

    await this.sendLocalNotification({
      title: 'Issue Update',
      body: `${issueTitle}: ${message}`,
      data: {
        type: 'issue_update',
        issueId,
        status: newStatus,
      },
    });
  }

  /**
   * Send notification for new nearby issue
   */
  async notifyNearbyIssue(issueTitle: string, distance: string, category: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'New Issue Nearby',
      body: `${issueTitle} (${distance} away)`,
      data: {
        type: 'new_issue_nearby',
        category,
      },
    });
  }

  /**
   * Send weekly digest notification
   */
  async scheduleWeeklyDigest(): Promise<void> {
    // Cancel existing weekly digest
    const scheduled = await this.getScheduledNotifications();
    const existingDigest = scheduled.find(n => n.content.data?.type === 'weekly_digest');
    if (existingDigest) {
      await this.cancelNotification(existingDigest.identifier);
    }

    // Schedule next weekly digest (every Sunday at 9 AM)
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    nextSunday.setHours(9, 0, 0, 0);

    await this.scheduleNotification({
      id: 'weekly_digest',
      title: 'Weekly Community Update',
      body: 'Check out this week\'s community activity and resolved issues',
      scheduledTime: nextSunday,
      data: {
        type: 'weekly_digest',
      },
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types and service class
export default NotificationService;
