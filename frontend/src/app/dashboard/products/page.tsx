'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Package, Plus, TrendingDown, TrendingUp,
} from 'lucide-react';
import { productService, ProductMutationPayload } from '@/services/products';
import { Product } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { InlineEdit } from '@/components/ui/InlineEdit';
import { getRegionLabel, REGION_OPTIONS } from '@/lib/regions';
import styles from './Products.module.css';

const UNIT_OPTIONS = [
  { value: 'kg',     label: 'kg' },
  { value: 'tonnes', label: 'tonnes' },
  { value: 'litres', label: 'litres' },
  { value: 'sacs',   label: 'sacs' },
  { value: 'caisses',label: 'caisses' },
  { value: 'unites', label: 'unités' },
];

function fmt(n: number) { return n.toLocaleString('fr-FR'); }

export default function DashboardProducts() {
  const [products,     setProducts]     = useState<Product[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const mountedRef                      = useRef(true);

  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getMyProducts();
      if (mountedRef.current) setProducts(res.data ?? []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Impossible de charger le catalogue.';
      if (mountedRef.current) setError(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Inline field updaters ────────────────────────────────────────────────

  const patchField = useCallback(async (
    id: string | number,
    field: keyof ProductMutationPayload,
    value: string | number | boolean,
  ): Promise<void> => {
    await productService.updateProduct(id, { [field]: value } as Partial<ProductMutationPayload>);
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated: Product = { ...p };
        if (field === 'price') updated.price = Number(value);
        if (field === 'stock') updated.stock = Number(value);
        if (field === 'name')  updated.name  = String(value);
        if (field === 'unite') updated.unite = String(value);
        if (field === 'isActive') updated.isActive = Boolean(value);
        return updated;
      })
    );
  }, []);

  const remove = useCallback(async (id: string | number) => {
    if (!confirm('Supprimer définitivement ce produit ?')) return;
    setProcessingId(id);
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Suppression impossible.';
      setError(msg);
    } finally {
      setProcessingId(null);
    }
  }, []);

  // ── KPIs ─────────────────────────────────────────────────────────────────

  const active   = products.filter(p => p.isActive);
  const lowStock = products.filter(p => p.stock <= (p.stockMinimum ?? 5) && p.isActive && p.stock > 0);
  const outStock = products.filter(p => p.stock === 0);

  return (
    <div className={styles.page}>
      {/* KPIs */}
      <div className={styles.kpiRow}>
        <KpiCard label="Produits actifs"    value={active.length}   icon={<Package size={20}/>}       variant="success" loading={loading} />
        <KpiCard label="Stock bas"          value={lowStock.length} icon={<TrendingDown size={20}/>}  variant="warning" loading={loading} sub="A reapprovisionner" />
        <KpiCard label="En rupture"         value={outStock.length} icon={<AlertTriangle size={20}/>} variant={outStock.length > 0 ? 'warning' : 'muted'} loading={loading} />
        <KpiCard label="Total catalogue"    value={products.length} icon={<TrendingUp size={20}/>}    variant="default" loading={loading} />
      </div>

      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Mon catalogue</h2>
        <p className={styles.sectionHint}>
          Cliquez directement sur un champ pour le modifier en place.
        </p>
        <Link href="/dashboard/products/add">
          <Button variant="primary" size="md">
            <Plus size={16} aria-hidden="true" /> Ajouter un produit
          </Button>
        </Link>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={16} aria-hidden="true" /> {error}
        </div>
      )}

      {lowStock.length > 0 && (
        <div className={styles.alertBanner}>
          <AlertTriangle size={16} aria-hidden="true" />
          <strong>{lowStock.length} produit(s)</strong> avec un stock bas.
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrap}>
        <div className={styles.thead}>
          <span>Produit</span>
          <span>Catégorie</span>
          <span>Région</span>
          <span className={styles.right}>Prix (XAF)</span>
          <span className={styles.right}>Stock</span>
          <span>Unité</span>
          <span>Statut</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Chargement...</div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={36} aria-hidden="true" />
            <p>Aucun produit dans votre catalogue.</p>
            <Link href="/dashboard/products/add">
              <Button variant="primary" size="sm">Ajouter mon premier produit</Button>
            </Link>
          </div>
        ) : products.map(product => {
          const stockVariant = product.stock === 0
            ? 'error'
            : product.stock <= (product.stockMinimum ?? 5) ? 'warning' : 'success';

          return (
            <div key={product.id} className={styles.trow}>

              {/* Nom du produit — inline edit */}
              <div className={styles.productCell}>
                {product.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={product.imageUrl} alt="" className={styles.productImg} aria-hidden="true" />
                ) : (
                  <div className={styles.productImgPlaceholder} aria-hidden="true">
                    {product.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <InlineEdit
                    value={product.name}
                    type="text"
                    compact
                    ariaLabel={`Nom du produit ${product.name}`}
                    validate={v => String(v).length < 2 ? 'Minimum 2 caracteres.' : null}
                    onSave={v => patchField(product.id, 'name', v)}
                    className={styles.productNameEditable}
                  />
                  {product.description && (
                    <span className={styles.productDesc}>
                      {product.description.substring(0, 48)}{product.description.length > 48 ? '...' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Categorie */}
              <span className={styles.cell}>{product.category}</span>

              {/* Région */}
              <span className={styles.cell}>{getRegionLabel(product.country)}</span>

              {/* Prix — inline edit */}
              <div className={`${styles.cell} ${styles.right}`}>
                <InlineEdit
                  value={product.price}
                  type="number"
                  min={1}
                  compact
                  ariaLabel="Prix unitaire"
                  displayFormatter={v => `${fmt(Number(v))}`}
                  validate={v => Number(v) < 1 ? 'Le prix doit etre > 0.' : null}
                  onSave={v => patchField(product.id, 'price', v)}
                />
              </div>

              {/* Stock — inline edit */}
              <div className={`${styles.cell} ${styles.right}`}>
                <InlineEdit
                  value={product.stock}
                  type="number"
                  min={0}
                  compact
                  ariaLabel="Stock disponible"
                  displayFormatter={v => {
                    const n = Number(v);
                    return n === 0 ? 'Rupture' : String(n);
                  }}
                  validate={v => Number(v) < 0 ? 'Le stock ne peut pas etre negatif.' : null}
                  onSave={v => patchField(product.id, 'stock', v)}
                />
                <Badge variant={stockVariant} style={{ marginLeft: 4 }}>
                  {product.stock === 0 ? 'Rupture' : product.stock <= (product.stockMinimum ?? 5) ? 'Bas' : 'OK'}
                </Badge>
              </div>

              {/* Unite — inline select */}
              <div className={styles.cell}>
                <InlineEdit
                  value={product.unite ?? 'kg'}
                  type="select"
                  options={UNIT_OPTIONS}
                  compact
                  ariaLabel="Unite de vente"
                  onSave={v => patchField(product.id, 'unite', v)}
                />
              </div>

              {/* Statut — toggle */}
              <div className={styles.cell}>
                <InlineEdit
                  value={product.isActive}
                  type="toggle"
                  ariaLabel={`Activer / desactiver ${product.name}`}
                  onSave={v => patchField(product.id, 'isActive', v)}
                />
                <span className={styles.toggleLabel}>
                  {product.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className={styles.actionBtn}
                  title="Page d'edition complete"
                >
                  <Package size={14} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  disabled={processingId === product.id}
                  onClick={() => remove(product.id)}
                  aria-label={`Supprimer ${product.name}`}
                  title="Supprimer"
                >
                  &times;
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
