import { apiClient } from './api';

export const matchingService = {
  getRecommendations: async (params?: { country?: string; category?: string; limit?: number }) => {
    return apiClient.get('/matching', { params });
  }
};
