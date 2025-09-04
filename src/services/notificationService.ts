import { env } from '../env';

export interface SendNotificationData {
  title: string;
  body: string;
  data?: any;
  userId?: string;
  userEmail?: string;
  deviceId?: string;
  platform?: 'ios' | 'android' | 'web';
  sound?: string;
  badge?: number;
  channelId?: string;
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
  deviceCount?: number;
  error?: string;
  details?: any;
}

class NotificationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.API_URL;
  }

  async sendNotification(notificationData: SendNotificationData): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(notificationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message,
          deviceCount: result.deviceCount,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to send notification',
          details: result.details,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendToUser(userId: string, title: string, body: string, data?: any): Promise<NotificationResponse> {
    return this.sendNotification({
      title,
      body,
      data,
      userId,
    });
  }

  async sendToEmail(userEmail: string, title: string, body: string, data?: any): Promise<NotificationResponse> {
    return this.sendNotification({
      title,
      body,
      data,
      userEmail,
    });
  }

  async sendToDevice(deviceId: string, title: string, body: string, data?: any): Promise<NotificationResponse> {
    return this.sendNotification({
      title,
      body,
      data,
      deviceId,
    });
  }

  async sendToPlatform(platform: 'ios' | 'android' | 'web', title: string, body: string, data?: any): Promise<NotificationResponse> {
    return this.sendNotification({
      title,
      body,
      data,
      platform,
    });
  }

  async sendToAll(title: string, body: string, data?: any): Promise<NotificationResponse> {
    return this.sendNotification({
      title,
      body,
      data,
    });
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
    return null;
  }
}

export const notificationService = new NotificationService();
