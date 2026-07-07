'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { productService } from '@/services/products';
import { Product } from '@/types';
import { getRegionLabel } from '@/lib/regions';
import { Button } from '@/components/ui/Button';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setError('Identifiant produit invalide.');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    productService
      .getProductById(productId)
      .then((res: any) => {
        if (!active) return;
        setProduct(res?.data ?? null);
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || 'Impossible de charger ce produit.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  if (loading) {
    return <section style={{ maxWidth: '960px', margin: '3rem auto', padding: '0 2rem' }}>Chargement du produit...</section>;
  }

  if (!product) {
    return (
      <section style={{ maxWidth: '960px', margin: '3rem auto', padding: '0 2rem' }}>
        <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error || 'Produit introuvable.'}</p>
        <Link href="/marketplace">Retour à la marketplace</Link>
      </section>
    );
  }

  return (
    <section className="glass-panel" style={{ maxWidth: '960px', margin: '3rem auto', padding: '2rem', display: 'grid', gap: '1rem' }}>
      <Link href="/marketplace" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>← Retour à la marketplace</Link>
      <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', margin: 0 }}>{product.name}</h1>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{product.description || 'Aucune description détaillée disponible.'}</p>
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
        <div><dt style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Prix</dt><dd style={{ margin: 0, fontWeight: 700 }}>{product.price} XAF</dd></div>
        <div><dt style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Région</dt><dd style={{ margin: 0, fontWeight: 700 }}>{getRegionLabel(product.country)}</dd></div>
        <div><dt style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Catégorie</dt><dd style={{ margin: 0, fontWeight: 700 }}>{product.category}</dd></div>
        <div><dt style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Stock</dt><dd style={{ margin: 0, fontWeight: 700 }}>{product.stock}</dd></div>
      </dl>
      <Link href={`/marketplace/product/${product.id}`} style={{ textDecoration: 'none', width: 'fit-content' }}>
        <Button variant="primary">Voir la fiche transactionnelle</Button>
      </Link>
    </section>
  );
}
