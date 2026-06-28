'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { Order } from '@/types';
import { orderService } from '@/services/orders';
import { EscrowTimeline } from '@/components/EscrowTimeline';

export default function DashboardOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await orderService.getOrders();
      setOrders(res?.data || []);
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger les commandes');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id: number, escrowStatus: Order['escrowStatus']) => {
    setProcessingId(id);
    try {
      await orderService.updateEscrowStatus(id, escrowStatus);
      await fetchOrders();
    } catch (err: any) {
      setError(err?.message || 'Mise a jour impossible');
    } finally {
      setProcessingId(null);
    }
  };

  const badgeVariant = (status: Order['escrowStatus']) => {
    if (status === 'released') return 'success';
    if (status === 'escrow_locked') return 'warning';
    if (status === 'pending') return 'info';
    return 'secondary';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
          Suivi des Commandes
        </h2>
        <div style={{ flex: 1 }}></div>
        <Button variant="outline" size="sm">Filtrer</Button>
        <ExportCsvButton
          data={orders.map((order) => ({
            number: `#${order.id.toString().padStart(4, '0')}`,
            product: order.product?.name || 'N/A',
            quantity: order.quantity,
            price: order.amount,
            status: order.escrowStatus
          }))}
        />
      </div>

      <Card>
        <CardContent style={{ padding: '1.5rem' }}>
          {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Prix Total (FCFA)</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>Aucune commande disponible.</TableCell>
                </TableRow>
              )}
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell style={{ fontWeight: 600 }}>#{order.id.toString().padStart(4, '0')}</TableCell>
                  <TableCell>{order.product?.name || 'Produit'}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.amount.toLocaleString('fr-FR')} FCFA</TableCell>
                  <TableCell>
                    <EscrowTimeline escrowStatus={order.escrowStatus} />
                  </TableCell>
                  <TableCell>
                    {order.escrowStatus === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--primary-color)', padding: '4px 8px' }}
                        isLoading={processingId === order.id}
                        onClick={() => updateStatus(order.id, 'escrow_locked')}
                      >
                        Verrouiller les fonds
                      </Button>
                    )}
                    {order.escrowStatus === 'escrow_locked' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--primary-color)', padding: '4px 8px' }}
                        isLoading={processingId === order.id}
                        onClick={() => updateStatus(order.id, 'shipped')}
                      >
                        Marquer expédié
                      </Button>
                    )}
                    {order.escrowStatus === 'shipped' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--primary-color)', padding: '4px 8px' }}
                        isLoading={processingId === order.id}
                        onClick={() => updateStatus(order.id, 'received')}
                      >
                        Marquer reçu
                      </Button>
                    )}
                    {order.escrowStatus === 'received' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--primary-color)', padding: '4px 8px' }}
                        isLoading={processingId === order.id}
                        onClick={() => updateStatus(order.id, 'released')}
                      >
                        Libérer les fonds
                      </Button>
                    )}
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
