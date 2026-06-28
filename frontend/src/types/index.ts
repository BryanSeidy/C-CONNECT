// ============================================================================
// C-Connect — Central TypeScript Interface Registry
// All interfaces mirror the backend snake_case PostgreSQL schema
// ============================================================================

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: number;
  email: string;
  name?: string | null;
  fullName?: string | null;
  companyName?: string | null;
  country?: string | null;
  role: UserRole;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerProfile {
  id: number;
  userId: number;
  businessName?: string | null;
  businessSector?: string | null;
  businessRegion?: string | null;
  nationalIdRef?: string | null;
  bankAccountType?: string | null;
  isOnboardingComplete: boolean;
  verificationScore?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GamificationStat {
  id: number;
  userId: number;
  points: number;
  level: number;
  ordersCompleted: number;
  reviewsGiven: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string | null;
  productId: number;
  buyerId: number;
  buyer?: Pick<User, 'id' | 'fullName' | 'companyName'>;
  createdAt?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  country: string;
  category: string;
  stock: number;
  isActive: boolean;
  producerId: number;
  producer?: Pick<User, 'id' | 'fullName' | 'companyName' | 'country' | 'isVerified'>;
  reviews?: Review[];
  createdAt?: string;
  updatedAt?: string;
}

export type EscrowStatus =
  | 'pending'
  | 'escrow_locked'
  | 'shipped'
  | 'received'
  | 'released'
  | 'disputed';

export interface Order {
  id: number;
  buyerId: number;
  sellerId: number;
  productId?: number | null;
  quantity: number;
  amount: number;
  escrowStatus: EscrowStatus;
  transactionReference?: string | null;
  product?: Pick<Product, 'id' | 'name' | 'country' | 'category' | 'stock'> | null;
  buyer?: Pick<User, 'id' | 'fullName' | 'email'> | null;
  seller?: Pick<User, 'id' | 'fullName' | 'companyName'> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  method: string;
  status: 'PENDING' | 'PAID' | 'RELEASED' | 'REFUNDED';
  escrow?: Escrow | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Escrow {
  id: number;
  paymentId: number;
  status: 'HOLDING' | 'RELEASED';
  releasedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// API Envelope — standard response wrapper from Laravel
// ============================================================================

export interface ApiEnvelope<T> {
  success?: boolean;
  data: T;
  message?: string;
}

export type ApiResponse<T> = ApiEnvelope<T>;

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

// ============================================================================
// Raw API shapes — snake_case keys returned by the backend before camelCase
// mapping. Used only in service layer normalizers, not in UI components.
// ============================================================================

export interface RawOrder {
  id: number;
  buyer_id: number;
  seller_id: number;
  product_id?: number | null;
  quantity: number;
  amount: string | number;
  escrow_status: EscrowStatus;
  transaction_reference?: string | null;
  product?: Pick<Product, 'id' | 'name' | 'country' | 'category' | 'stock'> | null;
  buyer?: Pick<User, 'id' | 'fullName' | 'email'> | null;
  seller?: Pick<User, 'id' | 'fullName' | 'companyName'> | null;
  created_at?: string;
  updated_at?: string;
}
