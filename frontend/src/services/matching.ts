import { productService, ProductFilters } from './products';
import { ApiEnvelope, PaginatedResult, Product } from '@/types';

/**
 * "Matching" recommendations for the marketplace/product pages.
 *
 * There is no dedicated `/matching` route on the backend (nor a matching
 * engine) — earlier this called a non-existent endpoint and was never wired
 * into any screen. Rather than ship dead code or a permanently-broken call,
 * this reimplements it on top of the real, already-working catalogue
 * endpoint: same-category / same-region product listing, which is exactly
 * what "recommended for you" means at MVP scope. Swap the implementation
 * for a real recommendation endpoint later without touching call sites.
 */
export const matchingService = {
  getRecommendations: async (params?: {
    country?: string;
    category?: string;
    limit?: number;
    excludeProductId?: number | string;
  }): Promise<Product[]> => {
    const filters: ProductFilters = {
      country: params?.country,
      category: params?.category,
      pageSize: params?.limit ?? 8,
      availableOnly: true,
    };
    const res: ApiEnvelope<PaginatedResult<Product>> = await productService.getProducts(filters);
    const items = res.data?.items ?? [];
    return params?.excludeProductId != null
      ? items.filter((p) => String(p.id) !== String(params.excludeProductId))
      : items;
  },
};
