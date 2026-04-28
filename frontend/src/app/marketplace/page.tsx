'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/services/api';
import { Product } from '@/types';

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.get('/products').then((res) => setProducts(res.data.data));
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Marketplace</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
