'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Product } from '@/types';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    api.get(`/products/${params.id}`).then((res) => setProduct(res.data.data));
  }, [params.id]);

  if (!product) return <p>Chargement...</p>;

  return (
    <section className="bg-white p-6 rounded-xl shadow space-y-3">
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p>Prix: {product.price} XAF</p>
      <p>Pays: {product.country}</p>
      <p>Catégorie: {product.category}</p>
      <p>Stock: {product.stock}</p>
    </section>
  );
}
