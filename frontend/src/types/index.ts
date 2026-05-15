export interface User {
  id: number;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
}

export interface Product {
  id: number;
  name: string;
  price: number;
  country: string;
  category: string;
  stock: number;
}
