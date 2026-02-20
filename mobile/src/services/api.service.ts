/**
 * API Service
 * Centralized API service with authentication and error handling
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api.config';
import secureStorage from './secureStorage.service';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      // TODO: Implement token refresh logic
      await secureStorage.clearAuthData();
    }
    return Promise.reject(error);
  }
);

// Generic API call wrapper
async function apiCall<T>(
  method: 'get' | 'post' | 'patch' | 'delete',
  url: string,
  data?: any
): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const response = await apiClient[method](url, data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Network error',
      };
    }
    return {
      success: false,
      message: 'An unexpected error occurred',
    };
  }
}

/**
 * API Service
 */
class ApiService {
  // ===== AUTH =====
  auth = {
    login: async (phone: string, password: string) => {
      return apiCall<{ token: string; refreshToken: string; user: any }>(
        'post',
        API_ENDPOINTS.auth.login,
        { phone, password }
      );
    },

    register: async (data: {
      phone: string;
      email?: string;
      password: string;
      fullName: string;
      memberId?: string;
    }) => {
      return apiCall<{ token: string; user: any }>(
        'post',
        API_ENDPOINTS.auth.register,
        data
      );
    },

    logout: async () => {
      return apiCall('post', API_ENDPOINTS.auth.logout);
    },
  };

  // ===== PROFILE =====
  profile = {
    getMe: async () => {
      return apiCall<any>('get', API_ENDPOINTS.profile.me);
    },

    update: async (data: any) => {
      return apiCall('patch', API_ENDPOINTS.profile.update, data);
    },

    getLinkedMembers: async () => {
      return apiCall<any[]>('get', API_ENDPOINTS.profile.linkedMembers);
    },

    addMember: async (memberId: string, relationship: string) => {
      return apiCall('post', API_ENDPOINTS.profile.addMember, {
        memberId,
        relationship,
      });
    },

    removeMember: async (id: number) => {
      return apiCall('delete', API_ENDPOINTS.profile.removeMember(id));
    },
  };

  // ===== CATALOG =====
  catalog = {
    search: async (query: string, page: number = 1, limit: number = 12) => {
      return apiCall<any>(
        'get',
        `${API_ENDPOINTS.catalog.search}?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      );
    },

    getById: async (id: number) => {
      return apiCall<any>('get', API_ENDPOINTS.catalog.getById(id));
    },

    getCollections: async () => {
      console.log('Fetching collections from:', API_ENDPOINTS.catalog.collections);
      // Use direct axios call to debug potential instance issues
      try {
        const response = await axios.get(API_ENDPOINTS.catalog.collections);
        console.log('Collections response status:', response.status);
        console.log('Collections data length:', response.data?.length);
        return response.data;
      } catch (error) {
        console.error('Error fetching collections direct:', error);
        throw error;
      }
    },
  };

  // ===== LOANS =====
  loans = {
    getActive: async (memberId: string) => {
      return apiCall<any[]>(
        'get',
        `${API_ENDPOINTS.loans.active}?memberId=${memberId}`
      );
    },

    getHistory: async (memberId: string, limit: number = 50) => {
      return apiCall<any[]>(
        'get',
        `${API_ENDPOINTS.loans.history}?memberId=${memberId}&limit=${limit}`
      );
    },

    getStats: async (memberId: string) => {
      return apiCall<any>(
        'get',
        `${API_ENDPOINTS.loans.stats}?memberId=${memberId}`
      );
    },

    renew: async (loanId: number, memberId: string) => {
      return apiCall<any>('post', API_ENDPOINTS.loans.renew(loanId), {
        memberId,
      });
    },
  };

  // ===== NEWS =====
  news = {
    getAll: async () => {
      return apiCall<any[]>('get', API_ENDPOINTS.news.getAll);
    },

    getById: async (id: number) => {
      return apiCall<any>('get', API_ENDPOINTS.news.getById(id));
    },
  };
}

export default new ApiService();
