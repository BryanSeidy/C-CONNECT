'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { productService } from '@/services/products';
import { Product } from '@/types';
import { getRegionLabel } from '@/lib/regions';

export default function DashboardProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getMyProducts();
      setProducts(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger le catalogue');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const removeProduct = async (id: number | string) => {
    setProcessingId(id);
    try {
      await productService.deleteProduct(id);
      await loadProducts();
    } catch (err: any) {
      setError(err?.message || 'Suppression impossible');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
          Gestion de mon Catalogue
        </h2>
        <Link href="/dashboard/products/add">
          <Button variant="primary">+ Ajouter un Produit</Button>
        </Link>
      </div>

      <Card>
        <CardContent style={{ padding: '1.5rem' }}>
          {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Région</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix (FCFA)</TableHead>
                <TableHead>Stock disponible</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>Aucun produit dans votre catalogue.</TableCell>
                </TableRow>
              )}
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell style={{ fontWeight: 600 }}>{product.name}</TableCell>
                  <TableCell>{getRegionLabel(product.country)}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.price.toLocaleString('fr-FR')}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? 'success' : 'error'}>
                      {product.isActive ? 'Actif' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: 'var(--error)', padding: '4px 8px' }}
                      isLoading={processingId === product.id}
                      onClick={() => removeProduct(product.id)}
                    >
                      Retirer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
