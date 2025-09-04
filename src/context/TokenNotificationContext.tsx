import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { pushNotificationService } from '../services/pushNotificationService';

interface TokenNotificationContextType {
  pushToken: string | null;
  deviceId: string | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  scheduleNotification: (title: string, body: string, data?: any) => Promise<string>;
  scheduleDelayedNotification: (title: string, body: string, delaySeconds: number, data?: any) => Promise<string>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  getBadgeCount: () => Promise<number>;
  setBadgeCount: (count: number) => Promise<void>;
}

const TokenNotificationContext = createContext<TokenNotificationContextType | undefined>(undefined);

interface TokenNotificationProviderProps {
  children: ReactNode;
}

export const TokenNotificationProvider: React.FC<TokenNotificationProviderProps> = ({ children }) => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await pushNotificationService.initialize();
      
      // Get the current state
      setPushToken(pushNotificationService.getPushToken());
      setDeviceId(pushNotificationService.getDeviceId());
      setIsRegistered(pushNotificationService.isPushRegistered());
      
      console.log('Push notification context initialized');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error initializing push notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleNotification = async (title: string, body: string, data?: any): Promise<string> => {
    try {
      return await pushNotificationService.scheduleLocalNotification({
        title,
        body,
        data,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  const scheduleDelayedNotification = async (
    title: string,
    body: string,
    delaySeconds: number,
    data?: any
  ): Promise<string> => {
    try {
      return await pushNotificationService.scheduleDelayedNotification(
        {
          title,
          body,
          data,
        },
        delaySeconds
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  const cancelNotification = async (notificationId: string): Promise<void> => {
    try {
      await pushNotificationService.cancelNotification(notificationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  const cancelAllNotifications = async (): Promise<void> => {
    try {
      await pushNotificationService.cancelAllNotifications();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  const getBadgeCount = async (): Promise<number> => {
    try {
      return await pushNotificationService.getBadgeCount();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return 0;
    }
  };

  const setBadgeCount = async (count: number): Promise<void> => {
    try {
      await pushNotificationService.setBadgeCount(count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  const value: TokenNotificationContextType = {
    pushToken,
    deviceId,
    isRegistered,
    isLoading,
    error,
    scheduleNotification,
    scheduleDelayedNotification,
    cancelNotification,
    cancelAllNotifications,
    getBadgeCount,
    setBadgeCount,
  };

  return (
    <TokenNotificationContext.Provider value={value}>
      {children}
    </TokenNotificationContext.Provider>
  );
};

export const useTokenNotification = (): TokenNotificationContextType => {
  const context = useContext(TokenNotificationContext);
  if (context === undefined) {
    throw new Error('useTokenNotification must be used within a TokenNotificationProvider');
  }
  return context;
};
