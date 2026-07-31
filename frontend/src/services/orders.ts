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
    negotiationId?: number | string;
    villeLivraison?: string;
    adresseLivraison?: string;
    telephoneLivraison?: string;
    livraisonDemandee?: boolean;
  }): Promise<ApiEnvelope<Order>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawOrder>>('/orders', {
      product_id: orderData.productId,
      quantity: orderData.quantity,
      negotiation_id: orderData.negotiationId,
      ville_livraison: orderData.villeLivraison,
      adresse_livraison: orderData.adresseLivraison,
      telephone_livraison: orderData.telephoneLivraison,
      livraison_demandee: orderData.livraisonDemandee,
    });
    return { ...res, data: normalizeOrder(res.data) };
  },

  /**
   * Crée une commande à partir de plusieurs articles du panier — tous doivent
   * appartenir au même vendeur (le backend rejette sinon avec un message
   * explicite). Le panier frontend groupe déjà par vendeur avant d'appeler
   * ceci une fois par groupe.
   */
  createOrderFromCart: async (cartData: {
    items: Array<{ productId: number | string; quantity: number; negotiationId?: number | string }>;
    villeLivraison?: string;
    adresseLivraison?: string;
    telephoneLivraison?: string;
    livraisonDemandee?: boolean;
  }): Promise<ApiEnvelope<Order>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawOrder>>('/orders', {
      items: cartData.items.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
        negotiation_id: i.negotiationId,
      })),
      ville_livraison: cartData.villeLivraison,
      adresse_livraison: cartData.adresseLivraison,
      telephone_livraison: cartData.telephoneLivraison,
      livraison_demandee: cartData.livraisonDemandee,
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

  /**
   * Récupère un lien signé temporaire (10 min) vers un document commercial,
   * puis l'ouvre dans un nouvel onglet. Une simple URL statique ne
   * fonctionnait plus depuis le passage à l'authentification Bearer pure :
   * une navigation <a href target="_blank"> ne transmet jamais le header
   * Authorization, donc la route protégée renvoyait toujours 401.
   */
  openDocument: async (orderId: number | string, type: 'purchase_order' | 'invoice' | 'delivery_note'): Promise<void> => {
    const res = await apiClient.get<unknown, { success: boolean; data: { url: string } }>(
      `/orders/${orderId}/documents/${type}/signed-link`
    );
    window.open(res.data.url, '_blank', 'noopener,noreferrer');
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
