import { ApiEnvelope, Review } from '@/types';
import { apiClient } from './api';

export const reviewService = {
  getProductReviews: async (productId: number | string): Promise<ApiEnvelope<Review[]>> => {
    const res = await apiClient.get<ApiEnvelope<Review[]>>(`/products/${productId}/reviews`);
    return res.data;
  },

  submitProductReview: async (
    productId: number | string,
    rating: number,
    comment?: string
  ): Promise<ApiEnvelope<Review>> => {
    const res = await apiClient.post<ApiEnvelope<Review>>(`/products/${productId}/reviews`, { rating, comment });
    return res.data;
  },
};
