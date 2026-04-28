export interface User {
  id: number;
  email: string;
  role: 'BUYER' | 'PRODUCER' | 'ADMIN';
}

export interface Product {
  id: number;
  name: string;
  price: number;
  country: string;
  category: string;
  stock: number;
}
