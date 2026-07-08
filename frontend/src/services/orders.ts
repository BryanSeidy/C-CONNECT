import { ApiEnvelope, Order, OrderItem, RawOrder, RawOrderItem } from '@/types';
import { apiClient } from './api';

// ============================================================================
// Order normalizer — converts backend snake_case to frontend camelCase
// ============================================================================

function toNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
}

function normalizeOrderItem(raw: RawOrderItem): OrderItem {
  return {
    id: raw.id,
    orderId: raw.order_id,
    productId: raw.product_id,
    quantity: raw.quantite,
    unitPrice: toNumber(raw.prix_unitaire),
    subtotal: toNumber(raw.sous_total),
    product: raw.product ?? null,
  };
}

export function normalizeOrder(raw: RawOrder): Order {
  return {
    id: raw.id,
    buyerId: raw.buyer_id,
    sellerId: raw.seller_id,
    montantTotal: toNumber(raw.montant_total),
    commissionPlateforme: toNumber(raw.commission_plateforme),
    montantVendeur: toNumber(raw.montant_vendeur),
    escrowStatus: raw.escrow_status,
    villeLivraison: raw.ville_livraison ?? null,
    adresseLivraison: raw.adresse_livraison ?? null,
    telephoneLivraison: raw.telephone_livraison ?? null,
    items: (raw.items ?? []).map(normalizeOrderItem),
    buyer: raw.buyer ?? null,
    seller: raw.seller ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
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

  createOrder: async (orderData: {
    productId: number | string;
    quantity: number;
    villeLivraison?: string;
    adresseLivraison?: string;
    telephoneLivraison?: string;
  }): Promise<ApiEnvelope<Order>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawOrder>>('/orders', {
      product_id: orderData.productId,
      quantity: orderData.quantity,
      ville_livraison: orderData.villeLivraison,
      adresse_livraison: orderData.adresseLivraison,
      telephone_livraison: orderData.telephoneLivraison,
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

  getDocumentUrl: (orderId: number | string, type: 'purchase_order' | 'invoice' | 'delivery_note'): string => {
    const base = (apiClient.defaults.baseURL ?? '').replace(/\/$/, '');
    return `${base}/orders/${orderId}/documents/${type}`;
  },
};

// ============================================================================
// Payment Service
// ============================================================================

// ============================================================================
// Payment Service — Mobile Money (MTN MoMo / Orange Money)
// ============================================================================

export interface MobileMoneyInitiatePayload {
  orderId: string | number;
  phone: string;            // format +237XXXXXXXXX
  paymentMethod: 'mtn_momo' | 'orange_money';
}

export interface MobileMoneyInitiateData {
  transactionReference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  instructions: string;
  orderId: string;
}

interface RawInitiateData {
  transaction_reference: string;
  amount: number;
  currency: string;
  payment_method: string;
  instructions: string;
  order_id: string;
}

export const paymentService = {
  /**
   * Initie une demande de paiement Mobile Money.
   * Retourne les instructions PIN a afficher a l'utilisateur.
   */
  initiateMobileMoney: async (
    payload: MobileMoneyInitiatePayload
  ): Promise<ApiEnvelope<MobileMoneyInitiateData>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawInitiateData>>(
      '/payments/mobile-money/initiate',
      {
        order_id:       payload.orderId,
        phone:          payload.phone,
        payment_method: payload.paymentMethod,
      }
    );
    return {
      ...res,
      data: {
        transactionReference: res.data.transaction_reference,
        amount:               res.data.amount,
        currency:             res.data.currency,
        paymentMethod:        res.data.payment_method,
        instructions:         res.data.instructions,
        orderId:              res.data.order_id,
      },
    };
  },

  /**
   * Historique de paiements pour le buyer/seller courant.
   *
   * Il n'existe pas de route `/payments` dédiée côté backend, et il n'en faut
   * pas : chaque commande porte déjà son statut d'escrow et ses montants
   * (voir `Order.escrowStatus`/`montantTotal`). Cette fonction dérive donc
   * l'historique de paiement à partir de `GET /orders`, déjà fonctionnel,
   * plutôt que d'appeler un endpoint qui n'existe pas.
   */
  getPaymentHistory: async (): Promise<Array<Pick<Order, 'id' | 'montantTotal' | 'escrowStatus' | 'createdAt'>>> => {
    const res = await orderService.getOrders();
    return res.data.map((o) => ({
      id: o.id,
      montantTotal: o.montantTotal,
      escrowStatus: o.escrowStatus,
      createdAt: o.createdAt,
    }));
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
