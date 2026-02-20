/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Get API base URL from environment variable
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Validate that the environment variable is set
if (!apiBaseUrl) {
  console.error(
    '❌ VITE_API_BASE_URL is not defined in environment variables. ' +
    'Please create a .env file with VITE_API_BASE_URL=http://localhost:3000/api'
  );
}

// Export the API base URL (with fallback for safety)
export const API_BASE_URL = apiBaseUrl || 'http://localhost:3000/api';

// Export API endpoints configuration
export const API_ENDPOINTS = {
  // Catalog endpoints
  catalog: {
    getByBarcode: (barcode: string) => `/catalogs/${barcode}`,
  },
  
  // Location endpoints
  location: {
    getAll: '/locations',
  },
  
  // Status Buku endpoints
  statusBuku: {
    getAll: '/status-buku',
  },
  
  // Member endpoints
  member: {
    getByNo: (queryNo: string) => `/members/${queryNo}`,
  },
  
  // Stock Opname endpoints
  stockOpname: {
    sessions: '/stock-opname/sessions',
    getSession: (sessionId: number) => `/stock-opname/sessions/${sessionId}`,
    updateSession: (sessionId: number) => `/stock-opname/sessions/${sessionId}`,
    addItem: (sessionId: number) => `/stock-opname/sessions/${sessionId}/items`,
    checkDuplicate: (barcode: string) => `/stock-opname/check-duplicate/${barcode}`,
  },
  
  // Rent Computer endpoints
  rentComputer: {
    create: '/rent-computer',
    getActive: '/rent-computer/active',
    getHistory: '/rent-computer/history',
    complete: (rentalId: number) => `/rent-computer/${rentalId}/complete`,
    extend: (rentalId: number) => `/rent-computer/${rentalId}/extend`,
  },
  
  // Broken Book endpoints
  brokenBook: {
    getAll: '/broken-books',
    create: '/broken-books',
    update: (id: number) => `/broken-books/${id}`,
    checkDuplicate: (barcode: string) => `/broken-books/check-duplicate/${barcode}`,
  },
} as const;

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    baseUrl: API_BASE_URL,
    environment: import.meta.env.MODE,
  });
}
