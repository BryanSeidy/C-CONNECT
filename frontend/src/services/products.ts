import { apiClient } from './api';

export const productService = {
  getProducts: async (params?: { country?: string; category?: string }) => {
    return apiClient.get('/products', { params });
  },

  getProductById: async (id: number | string) => {
    return apiClient.get(`/products/${id}`);
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
