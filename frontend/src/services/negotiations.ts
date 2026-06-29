import { apiClient } from './api';

export const negotiationService = {
  getNegotiations: async () => {
    return apiClient.get('/negotiations');
  },

  createNegotiation: async (negotiationData: {
    productId: number | string;
    quantity: number;
    proposedPrice: number;
    message?: string;
  }) => {
    return apiClient.post('/negotiations', {
      product_id: negotiationData.productId,
      quantity: negotiationData.quantity,
      proposed_price: negotiationData.proposedPrice,
      message: negotiationData.message
    });
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
