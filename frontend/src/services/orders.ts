import { ApiEnvelope, Order, PaginatedResult, RawOrder } from '@/types';
import { apiClient } from './api';

// ============================================================================
// Order normalizer — converts backend snake_case to frontend camelCase
// ============================================================================

function normalizeOrder(raw: RawOrder): Order {
  return {
    id:                   raw.id,
    buyerId:              raw.buyer_id,
    sellerId:             raw.seller_id,
    productId:            raw.product_id ?? null,
    quantity:             raw.quantity ?? 1,
    amount:               typeof raw.amount === 'string' ? parseFloat(raw.amount) : raw.amount,
    escrowStatus:         raw.escrow_status,
    transactionReference: raw.transaction_reference ?? null,
    product:              raw.product ?? null,
    buyer:                raw.buyer ?? null,
    seller:               raw.seller ?? null,
    createdAt:            raw.created_at,
    updatedAt:            raw.updated_at,
  };
}

function normalizeOrders(raws: RawOrder[]): Order[] {
  return raws.map(normalizeOrder);
}

// ============================================================================
// Order Service
// ============================================================================

export const orderService = {
  getOrders: async (): Promise<ApiEnvelope<Order[]>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<RawOrder[]>>('/orders');
    return {
      ...res,
      data: normalizeOrders(Array.isArray(res.data) ? res.data : []),
    };
  },

  getOrderById: async (id: number | string): Promise<ApiEnvelope<Order>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<RawOrder>>(`/orders/${id}`);
    return { ...res, data: normalizeOrder(res.data) };
  },

  createOrder: async (orderData: { productId: number | string; quantity: number }): Promise<ApiEnvelope<Order>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawOrder>>('/orders', {
      product_id: orderData.productId,
      quantity:   orderData.quantity,
    });
    return { ...res, data: normalizeOrder(res.data) };
  },

  releaseFunds: async (orderId: number | string): Promise<ApiEnvelope<Order>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<{ order: RawOrder }>>(`/orders/${orderId}/release-funds`);
    return { ...res, data: normalizeOrder(res.data.order) };
  },

  updateEscrowStatus: async (
    id: number | string,
    escrowStatus: Order['escrowStatus']
  ): Promise<ApiEnvelope<Order>> => {
    const res = await apiClient.put<unknown, ApiEnvelope<RawOrder>>(`/orders/${id}`, {
      escrow_status: escrowStatus,
    });
    return { ...res, data: normalizeOrder(res.data) };
  },

  cancelOrder: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
  },
};

// ============================================================================
// Payment Service
// ============================================================================

export const paymentService = {
  createPayment: async (paymentData: { orderId: number | string; method: string }) => {
    return apiClient.post('/payments', paymentData);
  },

  getPayments: async () => {
    return apiClient.get('/payments');
  },
};

// ============================================================================
// Escrow Service
// ============================================================================

export const escrowService = {
  releaseEscrow: async (orderId: number | string): Promise<ApiEnvelope<Order>> => {
    return orderService.releaseFunds(orderId);
  },
};
