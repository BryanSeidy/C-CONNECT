import { apiClient } from './api';

export const reviewService = {
  getProductReviews: async (productId: number | string) => {
    return apiClient.get(`/products/${productId}/reviews`);
  },

  submitProductReview: async (productId: number | string, rating: number, comment?: string) => {
    return apiClient.post(`/products/${productId}/reviews`, { rating, comment });
  }
};
