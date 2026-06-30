import { ApiEnvelope, PaginatedResult, RawRfq, RawRfqBid, Rfq, RfqBid } from '@/types';
import { apiClient } from './api';

function toNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
}

function normalizeBid(raw: RawRfqBid): RfqBid {
  return {
    id: raw.id,
    rfqId: raw.rfq_id,
    sellerId: raw.seller_id,
    prixUnitairePropose: toNumber(raw.prix_unitaire_propose),
    quantiteDisponible: toNumber(raw.quantite_disponible),
    dateLivraisonProposee: raw.date_livraison_proposee ?? null,
    message: raw.message ?? null,
    conditions: raw.conditions ?? null,
    statut: raw.statut,
    seller: raw.seller
      ? { id: raw.seller.id, businessName: raw.seller.business_name ?? null, user: raw.seller.user }
      : null,
    createdAt: raw.created_at,
  };
}

function normalizeRfq(raw: RawRfq): Rfq {
  return {
    id: raw.id,
    buyerId: raw.buyer_id,
    categoryId: raw.category_id ?? null,
    titre: raw.titre,
    description: raw.description,
    quantite: toNumber(raw.quantite),
    unite: raw.unite,
    budgetMax: raw.budget_max != null ? toNumber(raw.budget_max) : null,
    regionLivraison: raw.region_livraison ?? null,
    villeLivraison: raw.ville_livraison ?? null,
    delaiLivraison: raw.delai_livraison ?? null,
    expireLe: raw.expire_le ?? null,
    vendeurVerifieRequis: raw.vendeur_verifie_requis,
    cooperativeUniquement: raw.cooperative_uniquement,
    femmesEntrepreneuresPrefere: raw.femmes_entrepreneures_prefere,
    statut: raw.statut,
    nombreOffres: raw.nombre_offres,
    buyer: raw.buyer ?? null,
    category: raw.category ?? null,
    bids: (raw.bids ?? []).map(normalizeBid),
    createdAt: raw.created_at,
  };
}

export interface RfqFilters {
  region?: string;
  category?: string;
}

export interface RfqPayload {
  titre: string;
  description: string;
  categoryId?: string;
  quantite: number;
  unite: string;
  budgetMax?: number;
  regionLivraison?: string;
  villeLivraison?: string;
  delaiLivraison?: string;
  expireLe?: string;
  vendeurVerifieRequis?: boolean;
  cooperativeUniquement?: boolean;
  femmesEntrepreneuresPrefere?: boolean;
}

export interface BidPayload {
  prixUnitairePropose: number;
  quantiteDisponible: number;
  dateLivraisonProposee?: string;
  message?: string;
  conditions?: string;
}

export const rfqService = {
  getActiveRfqs: async (filters: RfqFilters = {}): Promise<ApiEnvelope<PaginatedResult<Rfq>>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<{ items: RawRfq[]; meta: PaginatedResult<Rfq>['meta'] }>>(
      '/rfqs',
      { params: { region: filters.region, category: filters.category } }
    );
    return { ...res, data: { items: res.data.items.map(normalizeRfq), meta: res.data.meta } };
  },

  getMyRfqs: async (): Promise<ApiEnvelope<Rfq[]>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<RawRfq[]>>('/rfqs/mine/list');
    return { ...res, data: (res.data ?? []).map(normalizeRfq) };
  },

  getRfqById: async (id: number | string): Promise<ApiEnvelope<Rfq>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<RawRfq>>(`/rfqs/${id}`);
    return { ...res, data: normalizeRfq(res.data) };
  },

  createRfq: async (payload: RfqPayload): Promise<ApiEnvelope<Rfq>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawRfq>>('/rfqs', {
      titre: payload.titre,
      description: payload.description,
      category_id: payload.categoryId,
      quantite: payload.quantite,
      unite: payload.unite,
      budget_max: payload.budgetMax,
      region_livraison: payload.regionLivraison,
      ville_livraison: payload.villeLivraison,
      delai_livraison: payload.delaiLivraison,
      expire_le: payload.expireLe,
      vendeur_verifie_requis: payload.vendeurVerifieRequis ?? false,
      cooperative_uniquement: payload.cooperativeUniquement ?? false,
      femmes_entrepreneures_prefere: payload.femmesEntrepreneuresPrefere ?? false,
    });
    return { ...res, data: normalizeRfq(res.data) };
  },

  cancelRfq: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/rfqs/${id}`);
  },

  submitBid: async (rfqId: number | string, payload: BidPayload): Promise<ApiEnvelope<RfqBid>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawRfqBid>>(`/rfqs/${rfqId}/bids`, {
      prix_unitaire_propose: payload.prixUnitairePropose,
      quantite_disponible: payload.quantiteDisponible,
      date_livraison_proposee: payload.dateLivraisonProposee,
      message: payload.message,
      conditions: payload.conditions,
    });
    return { ...res, data: normalizeBid(res.data) };
  },

  acceptBid: async (rfqId: number | string, bidId: number | string): Promise<ApiEnvelope<RfqBid>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawRfqBid>>(`/rfqs/${rfqId}/bids/${bidId}/accept`);
    return { ...res, data: normalizeBid(res.data) };
  },

  rejectBid: async (rfqId: number | string, bidId: number | string): Promise<ApiEnvelope<RfqBid>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawRfqBid>>(`/rfqs/${rfqId}/bids/${bidId}/reject`);
    return { ...res, data: normalizeBid(res.data) };
  },
};

export { normalizeRfq, normalizeBid };
