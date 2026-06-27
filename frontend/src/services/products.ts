import { apiClient } from './api';
import { PaginatedResult, Product } from '@/types';

export const productService = {
  getProducts: async (params?: {
    country?: string;
    category?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }) => {
    return apiClient.get<PaginatedResult<Product>>('/products', { params });
  },

  getProductById: async (id: number | string) => {
    return apiClient.get(`/products/${id}`);
  },

  getMyProducts: async () => {
    return apiClient.get<Product[]>('/products/me');
  },

  createProduct: async (productData: any) => {
    return apiClient.post('/products', productData);
  },

  updateProduct: async (id: number | string, updateData: any) => {
    return apiClient.put(`/products/${id}`, updateData);
  },

  deleteProduct: async (id: number | string) => {
    return apiClient.delete(`/products/${id}`);
  }
};
