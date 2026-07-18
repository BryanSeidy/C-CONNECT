import { apiClient } from './api';

export interface DeliveryRequestDetail {
  id: number;
  statut: string;
  ville_livraison: string;
  adresse_livraison: string | null;
  telephone_livraison: string;
  frais_livraison: string;
  order?: { id: number; montant_total: string } | null;
}

export const deliveryService = {
  /** GET /api/livraison/reponse/{token} — public, pas de compte livreur */
  getByToken: async (token: string): Promise<DeliveryRequestDetail> => {
    const res = await apiClient.get<unknown, { data: DeliveryRequestDetail }>(`/livraison/reponse/${token}`);
    return res.data;
  },

  /** POST /api/livraison/reponse/{token} — public */
  respond: async (token: string, action: 'accepter' | 'refuser'): Promise<DeliveryRequestDetail> => {
    const res = await apiClient.post<unknown, { data: DeliveryRequestDetail }>(`/livraison/reponse/${token}`, { action });
    return res.data;
  },
};

export interface DeliveryPartner {
  id: number;
  nom: string;
  telephone: string;
  email: string | null;
  region: string;
  actif: boolean;
  livraisons_en_cours: number;
}

export const deliveryPartnerAdminService = {
  /** GET /api/admin/delivery-partners */
  list: async (): Promise<DeliveryPartner[]> => {
    const res = await apiClient.get<unknown, { data: DeliveryPartner[] }>('/admin/delivery-partners');
    return res.data;
  },

  /** POST /api/admin/delivery-partners */
  create: async (payload: { nom: string; telephone: string; email?: string; region: string }): Promise<DeliveryPartner> => {
    const res = await apiClient.post<unknown, { data: DeliveryPartner }>('/admin/delivery-partners', payload);
    return res.data;
  },

  /** PATCH /api/admin/delivery-partners/{id} */
  update: async (id: number, payload: Partial<{ nom: string; telephone: string; email: string; region: string; actif: boolean }>): Promise<DeliveryPartner> => {
    const res = await apiClient.patch<unknown, { data: DeliveryPartner }>(`/admin/delivery-partners/${id}`, payload);
    return res.data;
  },
};
