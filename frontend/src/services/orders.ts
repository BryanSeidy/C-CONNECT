import { apiClient } from './api';

export const orderService = {
  getOrders: async () => {
    return apiClient.get('/orders');
  },

  createOrder: async (orderData: { productId: number | string; quantity: number }) => {
    return apiClient.post('/orders', orderData);
  },

  updateOrderStatus: async (id: number | string, status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    return apiClient.patch(`/orders/${id}/status`, { status });
  }
};

export const paymentService = {
  createPayment: async (paymentData: { orderId: number | string; method: string }) => {
    return apiClient.post('/payments', paymentData);
  },
  
  getPayments: async () => {
    return apiClient.get('/payments');
  },

  updatePaymentStatus: async (id: number | string, status: 'PENDING' | 'PAID' | 'RELEASED' | 'REFUNDED') => {
    return apiClient.patch(`/payments/${id}`, { status });
  }
};

export const escrowService = {
  getEscrow: async (paymentId: number | string) => {
    return apiClient.get(`/escrow/${paymentId}`);
  },

  releaseEscrow: async (paymentId: number | string) => {
    return apiClient.patch(`/escrow/release/${paymentId}`);
  }
};
