/**
 * Storage Service
 * Local storage using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  // ===== ACTIVE PROFILE =====
  async saveActiveProfile(profile: any): Promise<void> {
    await AsyncStorage.setItem('active_profile', JSON.stringify(profile));
  }

  async getActiveProfile(): Promise<any | null> {
    const value = await AsyncStorage.getItem('active_profile');
    return value ? JSON.parse(value) : null;
  }

  async clearActiveProfile(): Promise<void> {
    await AsyncStorage.removeItem('active_profile');
  }

  // ===== OFFLINE LOANS =====
  async saveOfflineLoans(loans: any[]): Promise<void> {
    await AsyncStorage.setItem('offline_loans', JSON.stringify(loans));
    await AsyncStorage.setItem('offline_loans_timestamp', Date.now().toString());
  }

  async getOfflineLoans(): Promise<any[]> {
    const value = await AsyncStorage.getItem('offline_loans');
    return value ? JSON.parse(value) : [];
  }

  async getOfflineLoansTimestamp(): Promise<number> {
    const value = await AsyncStorage.getItem('offline_loans_timestamp');
    return value ? parseInt(value) : 0;
  }

  // ===== CATALOG CACHE =====
  async saveCatalogCache(catalogId: string, data: any): Promise<void> {
    await AsyncStorage.setItem(`catalog_${catalogId}`, JSON.stringify(data));
    await AsyncStorage.setItem(`catalog_${catalogId}_timestamp`, Date.now().toString());
  }

  async getCatalogCache(catalogId: string): Promise<any | null> {
    const value = await AsyncStorage.getItem(`catalog_${catalogId}`);
    return value ? JSON.parse(value) : null;
  }

  async isCatalogCacheValid(catalogId: string, maxAgeMs: number = 3600000): Promise<boolean> {
    const timestampStr = await AsyncStorage.getItem(`catalog_${catalogId}_timestamp`);
    if (!timestampStr) return false;
    const timestamp = parseInt(timestampStr);
    return Date.now() - timestamp < maxAgeMs;
  }

  // ===== NEWS CACHE =====
  async saveNewsCache(news: any[]): Promise<void> {
    await AsyncStorage.setItem('news_cache', JSON.stringify(news));
    await AsyncStorage.setItem('news_cache_timestamp', Date.now().toString());
  }

  async getNewsCache(): Promise<any[]> {
    const value = await AsyncStorage.getItem('news_cache');
    return value ? JSON.parse(value) : [];
  }

  async isNewsCacheValid(maxAgeMs: number = 1800000): Promise<boolean> {
    const timestampStr = await AsyncStorage.getItem('news_cache_timestamp');
    if (!timestampStr) return false;
    const timestamp = parseInt(timestampStr);
    return Date.now() - timestamp < maxAgeMs;
  }

  // ===== USER PREFERENCES =====
  async savePreference(key: string, value: any): Promise<void> {
    await AsyncStorage.setItem(`pref_${key}`, JSON.stringify(value));
  }

  async getPreference(key: string, defaultValue?: any): Promise<any> {
    const value = await AsyncStorage.getItem(`pref_${key}`);
    if (value) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return defaultValue;
  }

  // ===== SEARCH HISTORY =====
  async saveSearchHistory(history: string[]): Promise<void> {
    await AsyncStorage.setItem('search_history', JSON.stringify(history));
  }

  async getSearchHistory(): Promise<string[]> {
    const value = await AsyncStorage.getItem('search_history');
    return value ? JSON.parse(value) : [];
  }

  async addToSearchHistory(query: string, maxItems: number = 10): Promise<void> {
    const history = await this.getSearchHistory();
    const filtered = history.filter(item => item !== query);
    filtered.unshift(query);
    await this.saveSearchHistory(filtered.slice(0, maxItems));
  }

  async clearSearchHistory(): Promise<void> {
    await AsyncStorage.removeItem('search_history');
  }

  // ===== UTILITY METHODS =====
  async hasKey(key: string): Promise<boolean> {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  }

  async delete(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async getAllKeys(): Promise<string[]> {
    return await AsyncStorage.getAllKeys();
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
  }

  // Clear only cache, keep preferences
  async clearCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key =>
      key.startsWith('catalog_') ||
      key.startsWith('news_') ||
      key === 'offline_loans' ||
      key === 'offline_loans_timestamp'
    );
    await AsyncStorage.multiRemove(cacheKeys);
  }
}

export default new StorageService();
