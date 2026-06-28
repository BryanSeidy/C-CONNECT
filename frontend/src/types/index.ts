export interface User {
  id: number;
  email: string;
  fullName?: string | null;
  companyName?: string | null;
  country?: string | null;
  role: 'buyer' | 'seller' | 'admin';
  isVerified?: boolean;
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

export interface Order {
  id: number;
  buyerId: number;
  sellerId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  product?: Pick<Product, 'id' | 'name' | 'country' | 'category' | 'stock'>;
  payment?: Payment | null;
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

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
