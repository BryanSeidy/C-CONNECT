import { ApiEnvelope, RawRecurringOrder, RecurringOrder } from '@/types';
import { apiClient } from './api';

function toNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
}

function normalizeRecurringOrder(raw: RawRecurringOrder): RecurringOrder {
  return {
    id: raw.id,
    buyerId: raw.buyer_id,
    sellerId: raw.seller_id,
    productId: raw.product_id,
    quantite: toNumber(raw.quantite),
    unite: raw.unite,
    frequence: raw.frequence,
    prochaineLivraison: raw.prochaine_livraison ?? null,
    dateFin: raw.date_fin ?? null,
    prixNegocie: raw.prix_negocie != null ? toNumber(raw.prix_negocie) : null,
    notes: raw.notes ?? null,
    statut: raw.statut,
    totalCommandesGenerees: raw.total_commandes_generees,
    product: raw.product
      ? {
          id: raw.product.id,
          name: raw.product.nom || raw.product.name || '',
          price: raw.product.prix != null ? toNumber(raw.product.prix) : raw.product.price,
          imageUrl: raw.product.image_url ?? null,
        }
      : undefined,
    buyer: raw.buyer ?? null,
    seller: raw.seller ?? null,
    createdAt: raw.created_at,
  };
}

export interface RecurringOrderPayload {
  productId: number | string;
  quantite: number;
  frequence: 'hebdomadaire' | 'bimensuelle' | 'mensuelle';
  jourSemaine?: number;
  jourMois?: number;
  dateFin?: string;
  notes?: string;
}

export const recurringOrderService = {
  getRecurringOrders: async (): Promise<ApiEnvelope<RecurringOrder[]>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<RawRecurringOrder[]>>('/recurring-orders');
    return { ...res, data: (res.data ?? []).map(normalizeRecurringOrder) };
  },

  createRecurringOrder: async (payload: RecurringOrderPayload): Promise<ApiEnvelope<RecurringOrder>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawRecurringOrder>>('/recurring-orders', {
      product_id: payload.productId,
      quantite: payload.quantite,
      frequence: payload.frequence,
      jour_semaine: payload.jourSemaine,
      jour_mois: payload.jourMois,
      date_fin: payload.dateFin,
      notes: payload.notes,
    });
    return { ...res, data: normalizeRecurringOrder(res.data) };
  },

  updateStatus: async (
    id: number | string,
    statut: 'active' | 'en_pause' | 'annulee'
  ): Promise<ApiEnvelope<RecurringOrder>> => {
    const res = await apiClient.patch<unknown, ApiEnvelope<RawRecurringOrder>>(`/recurring-orders/${id}/status`, {
      statut,
    });
    return { ...res, data: normalizeRecurringOrder(res.data) };
  },
};

export { normalizeRecurringOrder };
