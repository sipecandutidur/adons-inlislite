/**
 * API Service Layer
 * Centralized service for all API calls with consistent error handling
 */

import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';

/**
 * Type Definitions
 */
interface StockOpnameSession {
  id: number;
  picName: string;
  rooms: string[];
  classNumbers: string[];
  statusBuku: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  items?: StockOpnameItem[];
}

interface StockOpnameItem {
  id: number;
  sessionId: number;
  barcode: string;
  title: string;
  author?: string;
  callNumber?: string;
  year?: string;
  typeProcurement?: string;
  source?: string;
  location?: string;
  statusBuku?: string;
  hasWarning: boolean;
  warningTypes?: string[];
  forcedAdd: boolean;
  scannedAt: string;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  data?: {
    sessionId: number;
    picName: string;
    scannedAt: string;
    sessionStatus: string;
    title?: string;
  };
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Catalog API Service
 */
export const catalogService = {
  /**
   * Get catalog by barcode
   */
  async getByBarcode(barcode: string) {
    return apiFetch(API_ENDPOINTS.catalog.getByBarcode(barcode));
  },
};

/**
 * Location API Service
 */
export const locationService = {
  /**
   * Get all locations
   */
  async getAll() {
    return apiFetch<string[]>(API_ENDPOINTS.location.getAll);
  },
};

/**
 * Status Buku API Service
 */
export const statusBukuService = {
  /**
   * Get all status buku
   */
  async getAll() {
    return apiFetch<string[]>(API_ENDPOINTS.statusBuku.getAll);
  },
};

/**
 * Member API Service
 */
export const memberService = {
  /**
   * Get member by member number
   */
  async getByNo(queryNo: string) {
    return apiFetch(API_ENDPOINTS.member.getByNo(queryNo));
  },
};

/**
 * Stock Opname API Service
 */
export const stockOpnameService = {
  /**
   * Create a new stock opname session
   */
  async createSession(data: {
    picName: string;
    rooms: string[];
    classNumbers: string[];
    statusBuku: string[];
  }) {
    return apiFetch<StockOpnameSession>(API_ENDPOINTS.stockOpname.sessions, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get session by ID
   */
  async getSession(sessionId: number) {
    return apiFetch<StockOpnameSession>(API_ENDPOINTS.stockOpname.getSession(sessionId));
  },

  /**
   * Update session
   */
  async updateSession(
    sessionId: number,
    data: {
      picName: string;
      rooms: string[];
      classNumbers: string[];
      statusBuku: string[];
    }
  ) {
    return apiFetch<StockOpnameSession>(API_ENDPOINTS.stockOpname.updateSession(sessionId), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Add item to session
   */
  async addItem(
    sessionId: number,
    data: {
      barcode: string;
      title: string;
      author?: string;
      callNumber?: string;
      year?: string;
      typeProcurement?: string;
      source?: string;
      location?: string;
      statusBuku?: string;
      hasWarning?: boolean;
      warningTypes?: string[];
      forcedAdd?: boolean;
    }
  ) {
    return apiFetch<StockOpnameItem>(API_ENDPOINTS.stockOpname.addItem(sessionId), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Check for duplicate barcode
   */
  async checkDuplicate(barcode: string) {
    return apiFetch<DuplicateCheckResult>(API_ENDPOINTS.stockOpname.checkDuplicate(barcode));
  },
};

/**
 * Rent Computer API Service
 */
export const rentComputerService = {
  /**
   * Create new rental
   */
  async create(data: {
    memberNo: string;
    memberName: string;
    pcNumber: number;
    duration?: number;
  }) {
    return apiFetch(API_ENDPOINTS.rentComputer.create, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get active rentals
   */
  async getActive() {
    return apiFetch(API_ENDPOINTS.rentComputer.getActive);
  },

  /**
   * Get rental history
   */
  async getHistory() {
    return apiFetch(API_ENDPOINTS.rentComputer.getHistory);
  },

  /**
   * Complete rental
   */
  async complete(rentalId: number) {
    return apiFetch(API_ENDPOINTS.rentComputer.complete(rentalId), {
      method: 'POST',
    });
  },

  /**
   * Extend rental duration
   */
  async extend(rentalId: number, additionalMinutes: number) {
    return apiFetch(API_ENDPOINTS.rentComputer.extend(rentalId), {
      method: 'POST',
      body: JSON.stringify({ additionalMinutes }),
    });
  },
};

/**
 * Broken Book API Service
 */
export const brokenBookService = {
  /**
   * Get all broken books with optional filters
   */
  async getAll(params?: {
    search?: string;
    damageType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.damageType) queryParams.append('damageType', params.damageType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = queryParams.toString()
      ? `${API_ENDPOINTS.brokenBook.getAll}?${queryParams.toString()}`
      : API_ENDPOINTS.brokenBook.getAll;

    return apiFetch(endpoint);
  },

  /**
   * Create broken book report
   */
  async create(data: {
    barcode: string;
    title: string;
    author?: string;
    callNumber?: string;
    damageType: string;
    damageDescription: string;
    reporterName: string;
    notes?: string;
  }) {
    return apiFetch(API_ENDPOINTS.brokenBook.create, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        reportedBy: data.reporterName
      }),
    });
  },

  /**
   * Update broken book status
   */
  async update(
    id: number,
    data: {
      status?: string;
      actionTaken?: string;
      notes?: string;
    }
  ) {
    return apiFetch(API_ENDPOINTS.brokenBook.update(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Check for duplicate barcode
   */
  async checkDuplicate(barcode: string) {
    return apiFetch(API_ENDPOINTS.brokenBook.checkDuplicate(barcode));
  },
};

/**
 * Export all services as a single object
 */
export const apiService = {
  catalog: catalogService,
  location: locationService,
  statusBuku: statusBukuService,
  member: memberService,
  stockOpname: stockOpnameService,
  rentComputer: rentComputerService,
  brokenBook: brokenBookService,
};

export default apiService;
