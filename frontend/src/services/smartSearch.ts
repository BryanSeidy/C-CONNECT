import { apiClient } from './api';

export interface SmartSearchFilters {
  category: string | null;
  region: string | null;
  sort: 'price_asc' | 'price_desc' | null;
  keywords: string | null;
  summary: string | null;
}

interface SmartSearchResponse {
  success: boolean;
  data?: SmartSearchFilters;
  message?: string;
}

export const smartSearchService = {
  /**
   * Traduit une requête en langage naturel en filtres marketplace structurés.
   * Retourne `null` si la fonctionnalité IA est indisponible (clé absente,
   * erreur, throttle) — l'appelant doit alors retomber sur une recherche
   * texte classique avec la requête brute, jamais bloquer l'utilisateur.
   */
  parse: async (query: string): Promise<SmartSearchFilters | null> => {
    try {
      const res = await apiClient.post<unknown, SmartSearchResponse>('/catalogue/search/smart', { query });
      return res.success && res.data ? res.data : null;
    } catch {
      return null;
    }
  },
};
