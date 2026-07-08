import { ApiEnvelope, Negotiation, RawNegotiation } from '@/types';
import { apiClient } from './api';

function toNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
}

function normalizeNegotiation(raw: RawNegotiation): Negotiation {
  return {
    id: raw.id,
    productId: raw.product_id,
    buyerId: raw.buyer_id,
    sellerId: raw.seller_id,
    quantity: toNumber(raw.quantity),
    proposedPrice: toNumber(raw.proposed_price),
    counterPrice: raw.counter_price != null ? toNumber(raw.counter_price) : null,
    message: raw.message ?? null,
    status: raw.status,
    product: {
      id: raw.product?.id ?? raw.product_id,
      name: raw.product?.nom ?? '',
      category: raw.product?.category?.nom ?? '',
      price: toNumber(raw.product?.prix),
    },
    buyer: raw.buyer ?? null,
    // Backend nests the seller's user under seller.user (seller_id points at
    // a seller_profiles row) — flatten it so the UI can treat neg.seller like
    // neg.buyer (both user-like, with companyName/fullName/country).
    seller: raw.seller?.user ?? null,
    createdAt: raw.created_at,
  };
}

export const negotiationService = {
  getNegotiations: async (): Promise<Negotiation[]> => {
    const res = await apiClient.get<ApiEnvelope<RawNegotiation[]>>('/negotiations');
    return (res.data.data ?? []).map(normalizeNegotiation);
  },

  createNegotiation: async (negotiationData: {
    productId: number | string;
    quantity: number;
    proposedPrice: number;
    message?: string;
  }): Promise<Negotiation> => {
    const res = await apiClient.post<ApiEnvelope<RawNegotiation>>('/negotiations', {
      product_id: negotiationData.productId,
      quantity: negotiationData.quantity,
      proposed_price: negotiationData.proposedPrice,
      message: negotiationData.message,
    });
    return normalizeNegotiation(res.data.data);
  },

  updateNegotiationStatus: async (
    id: number | string,
    status: 'ACCEPTED' | 'DECLINED' | 'COUNTERED',
    counterPrice?: number,
    message?: string
  ): Promise<Negotiation> => {
    const res = await apiClient.patch<ApiEnvelope<RawNegotiation>>(`/negotiations/${id}`, {
      status,
      counterPrice,
      message,
    });
    return normalizeNegotiation(res.data.data);
  },
};
