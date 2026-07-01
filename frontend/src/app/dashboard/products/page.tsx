'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Package, Pencil, Plus, Trash2,
  TrendingDown, TrendingUp,
} from 'lucide-react';
import { productService } from '@/services/products';
import { Product } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { getRegionLabel } from '@/lib/regions';
import styles from './Products.module.css';

export default function DashboardProducts() {
  const [products,     setProducts]     = useState<Product[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getMyProducts();
      setProducts(res.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger le catalogue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const removeProduct = async (id: string | number) => {
    if (!confirm('Supprimer ce produit du catalogue ?')) return;
    setProcessingId(id);
    try {
      await productService.deleteProduct(id);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Suppression impossible.');
    } finally {
      setProcessingId(null);
    }
  };

  const active   = products.filter(p => p.isActive);
  const lowStock = products.filter(p => p.stock <= 5 && p.isActive);
  const outStock = products.filter(p => p.stock === 0);

  return (
    <div className={styles.page}>
      {/* KPIs */}
      <div className={styles.kpiRow}>
        <KpiCard label="Produits actifs"    value={active.length}   icon={<Package size={20}/>}      variant="success" loading={loading} />
        <KpiCard label="Stock bas (≤ 5)"    value={lowStock.length} icon={<TrendingDown size={20}/>} variant="warning" loading={loading} sub="À réapprovisionner" />
        <KpiCard label="En rupture"         value={outStock.length} icon={<AlertTriangle size={20}/>} variant={outStock.length > 0 ? 'warning' : 'muted'} loading={loading} />
        <KpiCard label="Total catalogue"    value={products.length} icon={<TrendingUp size={20}/>}   variant="default" loading={loading} />
      </div>

      {/* Header actions */}
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Mon catalogue</h2>
        <Link href="/dashboard/products/add">
          <Button variant="primary" size="md">
            <Plus size={16} aria-hidden="true" /> Ajouter un produit
          </Button>
        </Link>
      </div>

      {error && <div className={styles.errorBanner}><AlertTriangle size={16}/> {error}</div>}

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className={styles.alertBanner}>
          <AlertTriangle size={16} aria-hidden="true" />
          <strong>{lowStock.length} produit(s)</strong> avec un stock bas — pensez à réapprovisionner avant d&apos;accepter de nouvelles commandes.
        </div>
      )}

      {/* Products table */}
      <div className={styles.tableWrap}>
        <div className={styles.thead}>
          <span>Produit</span>
          <span>Catégorie</span>
          <span>Région</span>
          <span className={styles.right}>Prix / unité</span>
          <span className={styles.right}>Stock</span>
          <span>Statut</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Chargement…</div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={36} aria-hidden="true" />
            <p>Vous n&apos;avez pas encore de produit.</p>
            <Link href="/dashboard/products/add">
              <Button variant="primary" size="sm">Ajouter mon premier produit</Button>
            </Link>
          </div>
        ) : products.map(product => {
          const stockStatus = product.stock === 0
            ? 'error'
            : product.stock <= 5 ? 'warning' : 'success';
          const stockLabel = product.stock === 0
            ? 'Rupture'
            : product.stock <= 5 ? `${product.stock} restants` : `${product.stock}`;

          return (
            <div key={product.id} className={styles.trow}>
              {/* Produit */}
              <div className={styles.productCell}>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className={styles.productImg}
                  />
                ) : (
                  <div className={styles.productImgPlaceholder} aria-hidden="true">
                    <Package size={16} />
                  </div>
                )}
                <div>
                  <span className={styles.productName}>{product.name}</span>
                  {product.description && (
                    <span className={styles.productDesc}>
                      {product.description.substring(0, 55)}{product.description.length > 55 ? '…' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Catégorie */}
              <span className={styles.cell}>{product.category}</span>

              {/* Région */}
              <span className={styles.cell}>{getRegionLabel(product.country)}</span>

              {/* Prix */}
              <span className={`${styles.cell} ${styles.right} ${styles.price}`}>
                {product.price.toLocaleString('fr-FR')} XAF
              </span>

              {/* Stock */}
              <div className={`${styles.cell} ${styles.right}`}>
                <Badge variant={stockStatus}>{stockLabel}</Badge>
              </div>

              {/* Statut */}
              <span className={styles.cell}>
                <Badge variant={product.isActive ? 'success' : 'default'}>
                  {product.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </span>

              {/* Actions */}
              <div className={styles.actions}>
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className={styles.actionBtn}
                  title="Modifier"
                >
                  <Pencil size={15} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  title="Supprimer"
                  disabled={processingId === product.id}
                  onClick={() => removeProduct(product.id)}
                  aria-label={`Supprimer ${product.name}`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
