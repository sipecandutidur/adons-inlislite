/**
 * API Configuration
 * Centralized API endpoints configuration
 */

import ENV from './env.config';

const API_BASE_URL = ENV.API_BASE_URL;

export const API_ENDPOINTS = {
  // Mobile Auth
  auth: {
    login: `${API_BASE_URL}/mobile/auth/login`,
    register: `${API_BASE_URL}/mobile/auth/register`,
    refresh: `${API_BASE_URL}/mobile/auth/refresh`,
    logout: `${API_BASE_URL}/mobile/auth/logout`,
  },

  // Profile & Family Accounts
  profile: {
    me: `${API_BASE_URL}/mobile/profile/me`,
    update: `${API_BASE_URL}/mobile/profile/me`,
    linkedMembers: `${API_BASE_URL}/mobile/profile/linked-members`,
    addMember: `${API_BASE_URL}/mobile/profile/linked-members`,
    removeMember: (id: number) => `${API_BASE_URL}/mobile/profile/linked-members/${id}`,
  },

  // Catalog
  catalog: {
    search: `${API_BASE_URL}/mobile/catalog/search`,
    getById: (id: number) => `${API_BASE_URL}/mobile/catalog/${id}`,
    categories: `${API_BASE_URL}/mobile/catalog/categories`,
    collections: `${API_BASE_URL}/collections`, // Added based on user request
  },

  // Loans
  loans: {
    active: `${API_BASE_URL}/mobile/loans/active`,
    history: `${API_BASE_URL}/mobile/loans/history`,
    stats: `${API_BASE_URL}/mobile/loans/stats`,
    renew: (loanId: number) => `${API_BASE_URL}/mobile/loans/${loanId}/renew`,
  },

  // News
  news: {
    getAll: `${API_BASE_URL}/mobile/news`,
    getById: (id: number) => `${API_BASE_URL}/mobile/news/${id}`,
  },
};

export const COVER_BASE_URL = 'http://192.168.35.8:8123/inlislite3/uploaded_files/sampul_koleksi/original/Monograf/';

export { API_BASE_URL };
