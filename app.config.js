import 'dotenv/config';

export default {
  expo: {
    // Load base configuration from app.json
    ...require('./app.json').expo,
    // Override with environment variables
    extra: {
      // Environment variables accessible via Constants.expoConfig.extra
      API_URL: process.env.API_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      APP_URL: process.env.APP_URL,
    }
  }
};
