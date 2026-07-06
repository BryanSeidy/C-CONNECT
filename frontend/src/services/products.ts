import { ApiEnvelope, PaginatedResult, Product, RawProduct } from '@/types';
import { apiClient } from './api';

export interface ProductFilters {
  country?: string;
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  verified?: boolean;
}

export interface ProductMutationPayload {
  name: string;
  description: string;
  price: number;
  country: string;
  category: string;
  stock: number;
  stockMinimum?: number;
  unite?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}

// ── Normalizer ────────────────────────────────────────────────────────────────

export function normalizeProduct(raw: RawProduct): Product {
  const seller = raw.seller;
  const user = seller?.user;

  const producerName =
    seller?.business_name
    ?? (user?.prenom || user?.nom ? `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() : null)
    ?? 'Producteur local';

  return {
    id: raw.id,
    name: raw.nom ?? '',
    slug: raw.slug ?? String(raw.id),
    description: raw.description ?? null,
    imageUrl: raw.image_url ?? raw.image_principale ?? null,
    price: typeof raw.prix === 'string' ? parseFloat(raw.prix) : (raw.prix ?? 0),
    country: raw.region ?? '',
    category: raw.category?.nom ?? '',
    categoryId: raw.category_id ?? null,
    stock: raw.stock ?? 0,
    stockReserve: raw.stock_reserve ?? 0,
    stockMinimum: raw.stock_minimum ?? 0,
    unite: raw.unite ?? 'kg',
    isActive: raw.statut === 'active',
    qualityRating: typeof raw.quality_rating === 'string' ? parseFloat(raw.quality_rating) : (raw.quality_rating ?? 0),
    reviewsCount: raw.reviews_count ?? 0,
    salesCount: raw.sales_count ?? 0,
    producerId: raw.seller_id,
    producer: {
      id: seller?.id ?? raw.seller_id,
      fullName: producerName,
      companyName: seller?.business_name ?? null,
      country: seller?.region ?? raw.region ?? '',
      isVerified: seller?.verification_status === 'verified',
      isFemaleOwned: seller?.is_female_owned ?? false,
      isCooperative: seller?.is_cooperative ?? false,
    },
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function normalizeProducts(raws:
  RawProduct[]): Product[] {
  return raws.map(normalizeProduct);
}

// ── Service ───────────────────────────────────────────────────────────────────

export const productService = {
  /** GET /api/catalogue/products — public, no auth */
  getProducts: async (params?: ProductFilters): Promise<ApiEnvelope<PaginatedResult<Product>>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<PaginatedResult<RawProduct>>>(
      '/catalogue/products',
      { params }
    );
    return {
      ...res,
      data: {
        items: normalizeProducts(res.data?.items ?? []),
        meta: res.data.meta,
      },
    };
  },

  /** GET /api/catalogue/products/:id — public */
  getProductById: async (id: number | string): Promise<ApiEnvelope<Product>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<RawProduct>>(`/catalogue/products/${id}`);
    return {
      ...res, data: normalizeProduct(res.data), };
  },

  /** GET /api/products/me — auth required, seller only */
  getMyProducts: async (): Promise<ApiEnvelope<Product[]>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<RawProduct[]>>('/products/me');
    return { ...res, data: normalizeProducts(res.data ?? []) };
  },

  /** POST /api/products — auth required */
  createProduct: async (payload: ProductMutationPayload): Promise<ApiEnvelope<Product>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawProduct>>('/products', payload);
    return { ...res, data: normalizeProduct(res.data) };
  },

  /** PUT /api/products/:id — auth required */
  updateProduct: async (
    id: number | string,
    payload: Partial<ProductMutationPayload>
  ): Promise<ApiEnvelope<Product>> => {
    const res = await apiClient.put<unknown, ApiEnvelope<RawProduct>>(`/products/${id}`, payload);
    return { ...res, data: normalizeProduct(res.data) };
  },

  /** DELETE /api/products/:id — auth required */
  deleteProduct: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
