import Link from 'next/link';
import { Product } from '@/types';

export const ProductCard = ({ product }: { product: Product }) => (
  <div className="bg-white shadow rounded-xl p-4 border">
    <h3 className="text-lg font-semibold">{product.name}</h3>
    <p className="text-sm text-gray-500">{product.country} • {product.category}</p>
    <p className="mt-2 font-bold text-green-700">{product.price} XAF</p>
    <p className="text-sm">Stock: {product.stock}</p>
    <Link className="inline-block mt-3 text-blue-600" href={`/marketplace/${product.id}`}>
      Voir le produit
    </Link>
  </div>
);
