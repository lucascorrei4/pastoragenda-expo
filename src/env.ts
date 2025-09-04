import Constants from 'expo-constants';

// Load environment variables
const getEnvVar = (key: string, fallback: string): string => {
  return Constants.expoConfig?.extra?.[key] || process.env[key] || fallback;
};

export const env = {
  APP_URL: getEnvVar('APP_URL', "https://pastoragenda.com"),
  API_URL: getEnvVar('API_URL', "https://qllicbvfcggtveuzvbqu.supabase.co/functions/v1"),
  SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY', ""),
  BACKGROUND_COLOR: "#111827cc",
  PRIMARY_COLOR: "#4a90e2",
  SECONDARY_COLOR: "#7b68ee",
  SUCCESS_COLOR: "#4caf50",
  ERROR_COLOR: "#f44336",
  WARNING_COLOR: "#ff9800",
  TEXT_COLOR: "#333333",
  TEXT_SECONDARY: "#666666",
  BORDER_COLOR: "#e0e0e0",
  CARD_BACKGROUND: "#f8f9fa",
  NOTIFICATION_CHANNEL_ID: "pastor_agenda_notifications",
  NOTIFICATION_CHANNEL_NAME: "Pastor Agenda Notifications",
  NOTIFICATION_CHANNEL_DESCRIPTION: "Notifications for Pastor Agenda app",
  // File system paths
  DOCUMENTS_DIR: "PastorAgenda",
  DOWNLOADS_DIR: "Downloads",
  CACHE_DIR: "Cache",
  // Media settings
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_AUDIO_SIZE: 50 * 1024 * 1024, // 50MB
  // Notification settings
  NOTIFICATION_SOUND: "default",
  VIBRATION_PATTERN: [0, 250, 250, 250],
} as const;

export type Env = typeof env;
