/**
 * Auth Store
 * Global authentication state management using Zustand
 */

import { create } from 'zustand';
import apiService from '../services/api.service';
import secureStorage from '../services/secureStorage.service';
import storageService from '../services/storage.service';

interface LinkedMember {
  id: number;
  memberId: string;
  memberName: string;
  relationship: string;
  isPrimary: boolean;
}

interface User {
  id: number;
  phone: string;
  email?: string;
  fullName: string;
  accountType: 'individual' | 'family';
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  linkedMembers: LinkedMember[];
  activeProfile: LinkedMember | null;

  // Actions
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  loadLinkedMembers: () => Promise<void>;
  setActiveProfile: (member: LinkedMember) => void;
  addLinkedMember: (memberId: string, relationship: string) => Promise<boolean>;
  removeLinkedMember: (id: number) => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: true,
  user: null,
  linkedMembers: [],
  activeProfile: null,

  // Login
  login: async (phone: string, password: string, rememberMe = false) => {
    try {
      const result = await apiService.auth.login(phone, password);

      if (result.success && result.data) {
        // Save tokens
        await secureStorage.saveAuthToken(result.data.token);
        if (result.data.refreshToken) {
          await secureStorage.saveRefreshToken(result.data.refreshToken);
        }

        // Save credentials if remember me
        if (rememberMe) {
          await secureStorage.saveCredentials(phone, password);
        }

        // Set user
        set({ isAuthenticated: true, user: result.data.user });

        // Load linked members
        await get().loadLinkedMembers();

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  // Register
  register: async (data: any) => {
    try {
      const result = await apiService.auth.register(data);

      if (result.success && result.data) {
        // Save token
        await secureStorage.saveAuthToken(result.data.token);

        // Set user
        set({ isAuthenticated: true, user: result.data.user });

        // Load linked members
        await get().loadLinkedMembers();

        return true;
      }

      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  },

  // Logout
  logout: async () => {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth data
      await secureStorage.clearAuthData();
      await storageService.clearActiveProfile();

      // Reset state
      set({
        isAuthenticated: false,
        user: null,
        linkedMembers: [],
        activeProfile: null,
      });
    }
  },

  // Load user profile
  loadUser: async () => {
    try {
      const result = await apiService.profile.getMe();

      if (result.success && result.data) {
        set({ user: result.data, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  },

  // Load linked members
  loadLinkedMembers: async () => {
    try {
      const result = await apiService.profile.getLinkedMembers();

      if (result.success && result.data) {
        set({ linkedMembers: result.data });

        // Set primary member as active profile if not set
        const { activeProfile } = get();
        if (!activeProfile && result.data.length > 0) {
          const primary = result.data.find((m: LinkedMember) => m.isPrimary);
          const profile = primary || result.data[0];
          get().setActiveProfile(profile);
        }
      }
    } catch (error) {
      console.error('Load linked members error:', error);
    }
  },

  // Set active profile
  setActiveProfile: async (member: LinkedMember) => {
    set({ activeProfile: member });
    await storageService.saveActiveProfile(member);
  },

  // Add linked member
  addLinkedMember: async (memberId: string, relationship: string) => {
    try {
      const result = await apiService.profile.addMember(memberId, relationship);

      if (result.success) {
        await get().loadLinkedMembers();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Add linked member error:', error);
      return false;
    }
  },

  // Remove linked member
  removeLinkedMember: async (id: number) => {
    try {
      const result = await apiService.profile.removeMember(id);

      if (result.success) {
        await get().loadLinkedMembers();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Remove linked member error:', error);
      return false;
    }
  },

  // Check authentication status
  checkAuth: async () => {
    try {
      set({ isLoading: true });

      const token = await secureStorage.getAuthToken();

      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return false;
      }

      // Load user and linked members
      await get().loadUser();
      await get().loadLinkedMembers();

      // Restore active profile from storage
      const savedProfile = await storageService.getActiveProfile();
      if (savedProfile) {
        set({ activeProfile: savedProfile });
      }

      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Check auth error:', error);
      set({ isAuthenticated: false, isLoading: false });
      return false;
    }
  },
}));
