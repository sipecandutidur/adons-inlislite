/**
 * Environment Configuration
 * Safe access to environment variables
 */

const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.35.8:3000/api',
  STORAGE_ENCRYPTION_KEY: process.env.EXPO_PUBLIC_STORAGE_ENCRYPTION_KEY || 'library-app-secret-key-2026',
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Library Mobile App',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
};

export default ENV;
