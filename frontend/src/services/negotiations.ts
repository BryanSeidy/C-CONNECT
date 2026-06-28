import { apiClient } from './api';

export const negotiationService = {
  getNegotiations: async () => {
    return apiClient.get('/negotiations');
  },

  createNegotiation: async (negotiationData: {
    productId: number;
    quantity: number;
    proposedPrice: number;
    message?: string;
  }) => {
    return apiClient.post('/negotiations', negotiationData);
  },

  updateNegotiationStatus: async (
    id: number | string,
    status: 'ACCEPTED' | 'DECLINED' | 'COUNTERED',
    counterPrice?: number,
    message?: string
  ) => {
    return apiClient.patch(`/negotiations/${id}`, { status, counterPrice, message });
  }
};
