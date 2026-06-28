import { ApiEnvelope, PaginatedResult, Product } from '@/types';
import { apiClient } from './api';

export interface ProductFilters {
  country?: string;
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductMutationPayload {
  name: string;
  description: string;
  price: number;
  country: string;
  category: string;
  stock: number;
  imageUrl?: string | null;
}

export const productService = {
  getProducts: async (params?: ProductFilters): Promise<ApiEnvelope<PaginatedResult<Product>>> => {
    return apiClient.get('/products', { params });
  },

  getProductById: async (id: number | string): Promise<ApiEnvelope<Product>> => {
    return apiClient.get(`/products/${id}`);
  },

  getMyProducts: async (): Promise<ApiEnvelope<Product[]>> => {
    return apiClient.get('/products/me');
  },

  createProduct: async (productData: ProductMutationPayload): Promise<ApiEnvelope<Product>> => {
    return apiClient.post('/products', productData);
  },

  updateProduct: async (id: number | string, updateData: Partial<ProductMutationPayload>): Promise<ApiEnvelope<Product>> => {
    return apiClient.put(`/products/${id}`, updateData);
  },

  deleteProduct: async (id: number | string): Promise<void> => {
    return apiClient.delete(`/products/${id}`);
  },
};
