import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { env } from '../env';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
  deviceId: string;
  platform: string;
  appVersion?: string;
  deviceModel?: string;
  osVersion?: string;
  userEmail?: string;
  userId?: string;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: string;
  badge?: number;
  channelId?: string;
}

class PushNotificationService {
  private pushToken: string | null = null;
  private deviceId: string | null = null;
  private isRegistered = false;

  async initialize(): Promise<void> {
    try {
      console.log('Initializing push notification service...');
      
      // Check if device is physical
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return;
      }

      // Skip push notifications in development build if Firebase is not configured
      if (__DEV__) {
        console.log('Skipping push notifications in development mode');
        return;
      }

      // Get device ID
      this.deviceId = Device.osInternalBuildId || Device.modelId || 'unknown';
      console.log('Device ID:', this.deviceId);

      // Register for push notifications
      await this.registerForPushNotifications();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      console.log('Push notification service initialized successfully');
    } catch (error) {
      console.error('Error initializing push notification service:', error);
    }
  }

  private async registerForPushNotifications(): Promise<void> {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission denied');
        return;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'b7ca9d2c-a3cb-446d-8e6e-6a81b8c4f742', // Replace with your project ID
      });

      this.pushToken = token.data;
      this.isRegistered = true;

      console.log('Push token obtained:', this.pushToken);

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(env.NOTIFICATION_CHANNEL_ID, {
          name: env.NOTIFICATION_CHANNEL_NAME,
          description: env.NOTIFICATION_CHANNEL_DESCRIPTION,
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [...env.VIBRATION_PATTERN],
          lightColor: env.PRIMARY_COLOR,
          sound: env.NOTIFICATION_SOUND,
        });
      }

      // Send token to backend
      await this.sendTokenToBackend();

    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  private async sendTokenToBackend(): Promise<void> {
    if (!this.pushToken || !this.deviceId) {
      console.warn('Cannot send token to backend: missing token or device ID');
      return;
    }

    try {
      const pushToken: PushToken = {
        token: this.pushToken,
        type: 'expo',
        deviceId: this.deviceId,
        platform: Platform.OS,
        appVersion: '1.0.0', // You can get this from app.json or package.json
        deviceModel: Device.modelName || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
      };

      // Send to Supabase Edge Function
      const response = await fetch(`${env.API_URL}/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(pushToken),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Push token sent to backend successfully:', result);
      } else {
        console.warn('Failed to send push token to backend:', result);
      }
    } catch (error) {
      console.error('Error sending token to backend:', error);
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      // If you're using Supabase Auth, get the session token
      // This is a placeholder - you'll need to implement based on your auth setup
      const sessionToken = await this.getSessionToken();
      if (sessionToken) {
        return {
          'Authorization': `Bearer ${sessionToken}`,
        };
      }
    } catch (error) {
      console.log('No auth token available:', error);
    }
    return {};
  }

  private async getSessionToken(): Promise<string | null> {
    // Implement your auth token retrieval here
    // This could be from AsyncStorage, SecureStore, or your auth context
    // For now, return null to allow anonymous device registration
    return null;
  }

  private setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
      // You can handle foreground notifications here
    });

    // Handle notification tapped/opened
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response received:', response);
      this.handleNotificationResponse(response);
    });
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { notification } = response;
    const data = notification.request.content.data;

    console.log('Handling notification response:', data);

    // Handle deep linking based on notification data
    if (data?.url && typeof data.url === 'string') {
      // Navigate to specific URL in WebView
      this.navigateToUrl(data.url);
    } else if (data?.action && typeof data.action === 'string') {
      // Handle specific actions
      this.handleNotificationAction(data.action, data);
    }
  }

  private navigateToUrl(url: string): void {
    // This would typically communicate with the WebView to navigate
    // For now, we'll just log it
    console.log('Navigate to URL:', url);
  }

  private handleNotificationAction(action: string, data: any): void {
    console.log('Handle notification action:', action, data);
    // Handle different notification actions
    switch (action) {
      case 'OPEN_APP':
        // App is already open, just bring to foreground
        break;
      case 'VIEW_MESSAGE':
        // Navigate to specific message
        break;
      case 'VIEW_SCHEDULE':
        // Navigate to schedule
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }

  async scheduleLocalNotification(notificationData: NotificationData): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: notificationData.sound || env.NOTIFICATION_SOUND,
          badge: notificationData.badge,
        },
        trigger: null, // Show immediately
      });

      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  async scheduleDelayedNotification(
    notificationData: NotificationData,
    delaySeconds: number
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: notificationData.sound || env.NOTIFICATION_SOUND,
          badge: notificationData.badge,
        },
        trigger: {
          seconds: delaySeconds,
        } as Notifications.TimeIntervalTriggerInput,
      });

      console.log('Delayed notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling delayed notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
      throw error;
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      throw error;
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log('Badge count set to:', count);
    } catch (error) {
      console.error('Error setting badge count:', error);
      throw error;
    }
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }

  isPushRegistered(): boolean {
    return this.isRegistered;
  }

  async updateUserInfo(userInfo: {
    userId?: string;
    userEmail?: string;
    userToken?: string;
  }): Promise<void> {
    try {
      console.log('Updating user info for device:', userInfo);
      
      if (!this.pushToken || !this.deviceId) {
        console.warn('Cannot update user info: missing token or device ID');
        return;
      }

      const pushToken: PushToken = {
        token: this.pushToken,
        type: 'expo',
        deviceId: this.deviceId,
        platform: Platform.OS,
        appVersion: '1.0.0',
        deviceModel: Device.modelName || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
        userId: userInfo.userId,
        userEmail: userInfo.userEmail,
      };

      // Send updated device info to Supabase Edge Function
      const response = await fetch(`${env.API_URL}/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(pushToken),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('User info updated successfully:', result);
      } else {
        console.warn('Failed to update user info:', result);
      }
    } catch (error) {
      console.error('Error updating user info:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
