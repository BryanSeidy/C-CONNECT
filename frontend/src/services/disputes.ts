import { ApiEnvelope, Dispute, RawDispute } from '@/types';
import { apiClient } from './api';

function normalizeDispute(raw: RawDispute): Dispute {
  return {
    id: raw.id,
    orderId: raw.order_id,
    initiateurId: raw.initiateur_id,
    raison: raw.raison,
    description: raw.description,
    preuvesUrls: raw.preuves_urls ?? null,
    statut: raw.statut,
    notesResolution: raw.notes_resolution ?? null,
    createdAt: raw.created_at,
  };
}

export interface DisputePayload {
  orderId: number | string;
  raison: string;
  description: string;
  preuvesUrls?: string[];
}

export const disputeService = {
  getDisputes: async (): Promise<ApiEnvelope<Dispute[]>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<RawDispute[]>>('/disputes');
    return { ...res, data: (res.data ?? []).map(normalizeDispute) };
  },

  fileDispute: async (payload: DisputePayload): Promise<ApiEnvelope<Dispute>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawDispute>>('/disputes', {
      order_id: payload.orderId,
      raison: payload.raison,
      description: payload.description,
      preuves_urls: payload.preuvesUrls,
    });
    return { ...res, data: normalizeDispute(res.data) };
  },

  resolveDispute: async (
    id: number | string,
    decision: 'rembourser' | 'liberer' | 'demander_informations',
    notesResolution: string
  ): Promise<ApiEnvelope<Dispute>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawDispute>>(`/disputes/${id}/resolve`, {
      decision,
      notes_resolution: notesResolution,
    });
    return { ...res, data: normalizeDispute(res.data) };
  },
};

export { normalizeDispute };
