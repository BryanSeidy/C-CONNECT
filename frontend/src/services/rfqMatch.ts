import { apiClient } from './api';

export interface RfqMatch {
  rfqId: number;
  score: number;
  reason: string;
}

interface RfqMatchResponse {
  success: boolean;
  data?: { matches: RfqMatch[] };
}

export const rfqMatchService = {
  /**
   * Classement IA des RFQ ouvertes les plus pertinentes pour le catalogue
   * du vendeur connecté. Retourne toujours un tableau (vide si l'IA n'est
   * pas configurée, si le vendeur n'a pas de produits actifs, ou en cas
   * d'erreur) — jamais bloquant pour l'affichage de la liste RFQ normale.
   */
  getMatchesForSeller: async (): Promise<RfqMatch[]> => {
    try {
      const res = await apiClient.get<unknown, RfqMatchResponse>('/rfqs/matches/for-seller');
      return res.success && res.data ? res.data.matches : [];
    } catch {
      return [];
    }
  },
};
