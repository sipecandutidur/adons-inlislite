/**
 * Secure Storage Service
 * Encrypted storage for sensitive data using Expo SecureStore
 */

import * as SecureStore from 'expo-secure-store';

class SecureStorageService {
  // ===== AUTH TOKENS =====
  async saveAuthToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('auth_token', token);
  }

  async getAuthToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('auth_token');
  }

  async deleteAuthToken(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token');
  }

  // ===== REFRESH TOKEN =====
  async saveRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('refresh_token', token);
  }

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('refresh_token');
  }

  async deleteRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync('refresh_token');
  }

  // ===== USER CREDENTIALS (Remember Me) =====
  async saveCredentials(phone: string, password: string): Promise<void> {
    const credentials = JSON.stringify({ phone, password });
    await SecureStore.setItemAsync('saved_credentials', credentials);
  }

  async getCredentials(): Promise<{ phone: string; password: string } | null> {
    const value = await SecureStore.getItemAsync('saved_credentials');
    return value ? JSON.parse(value) : null;
  }

  async deleteCredentials(): Promise<void> {
    await SecureStore.deleteItemAsync('saved_credentials');
  }

  // ===== BIOMETRIC ENABLED =====
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync('biometric_enabled', enabled.toString());
  }

  async isBiometricEnabled(): Promise<boolean> {
    const value = await SecureStore.getItemAsync('biometric_enabled');
    return value === 'true';
  }

  // ===== CLEAR ALL AUTH DATA =====
  async clearAuthData(): Promise<void> {
    await this.deleteAuthToken();
    await this.deleteRefreshToken();
    // Keep credentials if user wants to be remembered
  }

  // ===== CLEAR ALL SECURE DATA =====
  async clearAll(): Promise<void> {
    await this.deleteAuthToken();
    await this.deleteRefreshToken();
    await this.deleteCredentials();
    await SecureStore.deleteItemAsync('biometric_enabled');
  }
}

export default new SecureStorageService();
