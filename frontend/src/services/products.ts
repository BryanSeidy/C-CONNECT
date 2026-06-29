import { ApiEnvelope, PaginatedResult, Product, RawProduct } from '@/types';
import { apiClient } from './api';

export interface ProductFilters {
  country?: string;
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductMutationPayload {
  name: string;
  description: string;
  price: number;
  country: string;
  category: string;
  stock: number;
  imageUrl?: string | null;
}

// ============================================================================
// Product Normalizer — converts backend snake_case to frontend camelCase
// ============================================================================

export function normalizeProduct(raw: RawProduct): Product {
  const seller = raw.seller;
  const user = seller?.user;
  
  let fullName = 'Producteur local';
  if (user && (user.prenom || user.nom)) {
    fullName = `${user.prenom} ${user.nom}`.trim();
  } else if (seller?.business_name) {
    fullName = seller.business_name;
  }

  return {
    id: raw.id,
    name: raw.nom || '',
    description: raw.description ?? null,
    imageUrl: raw.image_url ?? null,
    price: typeof raw.prix === 'string' ? parseFloat(raw.prix) : raw.prix,
    country: raw.region || '',
    category: raw.category?.nom || '',
    stock: raw.stock || 0,
    isActive: raw.statut === 'active',
    producerId: raw.seller_id,
    producer: {
      id: seller?.id || raw.seller_id,
      fullName: fullName,
      companyName: seller?.business_name || null,
      country: seller?.region || raw.region || '',
      isVerified: seller?.verification_status === 'verified',
    },
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function normalizeProducts(raws: RawProduct[]): Product[] {
  return raws.map(normalizeProduct);
}

// ============================================================================
// Product Service Layer
// ============================================================================

export const productService = {
  getProducts: async (params?: ProductFilters): Promise<ApiEnvelope<PaginatedResult<Product>>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<PaginatedResult<RawProduct>>>('/products', { params });
    return {
      ...res,
      data: {
        items: normalizeProducts(res.data.items || []),
        meta: res.data.meta,
      },
    };
  },

  getProductById: async (id: number | string): Promise<ApiEnvelope<Product>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<RawProduct>>(`/products/${id}`);
    return {
      ...res,
      data: normalizeProduct(res.data),
    };
  },

  getMyProducts: async (): Promise<ApiEnvelope<Product[]>> => {
    const res = await apiClient.get<unknown, ApiEnvelope<RawProduct[]>>('/products/me');
    return {
      ...res,
      data: normalizeProducts(res.data || []),
    };
  },

  createProduct: async (productData: ProductMutationPayload): Promise<ApiEnvelope<Product>> => {
    const res = await apiClient.post<unknown, ApiEnvelope<RawProduct>>('/products', productData);
    return {
      ...res,
      data: normalizeProduct(res.data),
    };
  },

  updateProduct: async (id: number | string, updateData: Partial<ProductMutationPayload>): Promise<ApiEnvelope<Product>> => {
    const res = await apiClient.put<unknown, ApiEnvelope<RawProduct>>(`/products/${id}`, updateData);
    return {
      ...res,
      data: normalizeProduct(res.data),
    };
  },

  deleteProduct: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
