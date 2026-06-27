'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Footer } from '@/components/Footer';
import { productService } from '@/services/products';
import { PaginationMeta, Product } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './Marketplace.module.css';
import { REGION_OPTIONS } from '@/lib/regions';

const CATEGORIES = ['Agroalimentaire', 'Transformation', 'Élevage', 'Pêche', 'Textile', 'Industrie'];
const DEFAULT_META: PaginationMeta = { total: 0, page: 1, pageSize: 12, totalPages: 1 };
const PAGE_SIZE = 12;

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META);
  const debouncedSearch = useDebounce(search, 400);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await productService.getProducts({
        country: country || undefined,
        category: category || undefined,
        q: debouncedSearch.trim() || undefined,
        page,
        pageSize: PAGE_SIZE
      });
      setProducts(res?.data?.items || []);
      setMeta(res?.data?.meta || DEFAULT_META);
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger les produits');
      setProducts([]);
      setMeta(DEFAULT_META);
    } finally {
      setLoading(false);
    }
  }, [country, category, debouncedSearch, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [country, category, debouncedSearch]);

  const skeletonItems = useMemo(() => Array.from({ length: 6 }, (_, idx) => idx), []);
  const hasPreviousPage = page > 1;
  const hasNextPage = page < meta.totalPages;

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Marketplace National</h1>
            <p className={styles.subtitle}>
              Découvrez les meilleurs produits agricoles et industriels des 10 régions du Cameroun
            </p>
          </div>

          <div className={styles.filters}>
            <div className={styles.searchBar}>
              <Input
                placeholder="Rechercher un produit..."
                style={{ width: '300px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button variant="primary" onClick={fetchProducts} isLoading={loading}>
                Actualiser
              </Button>
            </div>
            <div className={styles.selectGroup}>
              <select
                className={styles.select}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Toutes les régions</option>
                {REGION_OPTIONS.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Toutes catégories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* États */}
        {loading && (
          <div className={styles.grid}>
            {skeletonItems.map((item) => (
              <div key={item} className={styles.skeletonCard}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonLineLg} />
                <div className={styles.skeletonLineMd} />
                <div className={styles.skeletonLineSm} />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className={styles.errorBox}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
            <p style={{ color: '#dc2626', marginBottom: '0.5rem' }}>{error}</p>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Vérifiez votre connexion ou réessayez dans quelques secondes.
            </p>
            <Button variant="outline" onClick={fetchProducts}>
              Réessayer
            </Button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>Aucun produit trouvé</p>
            <p style={{ marginTop: '0.5rem' }}>Essayez de modifier vos filtres de recherche.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className={styles.resultsInfo}>
              <span>{meta.total} produit(s) trouvé(s)</span>
              <span>
                Page {meta.page} / {meta.totalPages}
              </span>
            </div>
            <div className={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className={styles.pagination}>
              <Button variant="outline" onClick={() => setPage((p) => p - 1)} disabled={!hasPreviousPage}>
                Précédent
              </Button>
              <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!hasNextPage}>
                Suivant
              </Button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
