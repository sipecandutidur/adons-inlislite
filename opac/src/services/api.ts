import axios from 'axios';

// Define Interfaces
export interface CatalogGroup {
    Catalog_id: number;
    Title: string;
    Author: string;
    Publisher: string;
    PublishYear: string;
    CoverURL?: string;
    CallNumber?: string;
    TotalItems: number;
    AvailableItems: number;
}

export interface PopularCollection {
    Catalog_id: number;
    Title: string;
    Author: string;
    Publisher: string;
    PublishYear: string;
    CoverURL?: string;
    CallNumber?: string;
    LoanCount: number;
}

export interface CollectionItem {
    NomorBarcode: string;
    CallNumber: string;
    Title: string;
    Author: string;
    Edition: string;
    Publisher: string;
    PhysicalDescription: string;
    ISBN: string;
    LocationName: string;
    StatusName: string;
    RuleName: string;
    SourceName: string;
    PartnerName: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    pagination?: Pagination;
}

// Create Axios Instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// API Methods
export const collectionService = {
    // Get Collections (with search/pagination)
    getCollections: async (page: number = 1, limit: number = 12, search: string = '') => {
        const response = await api.get<ApiResponse<CatalogGroup[]>>('/collections', {
            params: { page, limit, search }
        });
        return response.data;
    },

    // Get Popular Collections
    getPopular: async () => {
        const response = await api.get<{success: boolean, data: PopularCollection[]}>('/collections/popular');
        return response.data;
    },

    // Get Collection Items (Detail)
    getItems: async (catalogId: number) => {
        const response = await api.get<{success: boolean, data: CollectionItem[]}>(`/collections/${catalogId}/items`);
        return response.data;
    }
};

export default api;
