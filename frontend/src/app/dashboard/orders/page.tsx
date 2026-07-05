'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { Order } from '@/types';
import { orderService } from '@/services/orders';
import { EscrowTimeline } from '@/components/EscrowTimeline';
import { FileText, FlagTriangleRight } from 'lucide-react';

const NEXT_STATUS: Record<string, { next: Order['escrowStatus']; label: string } | undefined> = {
  pending: { next: 'escrow_locked', label: 'Verrouiller les fonds en séquestre' },
  escrow_locked: { next: 'en_preparation', label: 'Marquer en préparation' },
  en_preparation: { next: 'expedie', label: 'Marquer expédié' },
  expedie: { next: 'en_transit', label: 'Marquer en transit' },
  en_transit: { next: 'livre', label: 'Marquer livré' },
  livre: { next: 'complete', label: 'Confirmer réception et libérer les fonds' },
};

function orderTitle(order: Order): string {
  const first = order.items?.[0]?.product?.name;
  if (!first) return 'Commande';
  const extra = (order.items?.length ?? 0) - 1;
  return extra > 0 ? `${first} +${extra} autre(s)` : first;
}

export default function DashboardOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getOrders();
      setOrders(res.data || []);
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

  const advanceStatus = async (id: number | string, escrowStatus: Order['escrowStatus']) => {
    setProcessingId(id);
    try {
      await orderService.updateEscrowStatus(id, escrowStatus);
      await fetchOrders();
    } catch (err: any) {
      setError(err?.message || 'Mise à jour impossible');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
          Suivi des Commandes
        </h2>
        <div style={{ flex: 1 }}></div>
        <ExportCsvButton
          data={orders.map((order) => ({
            number: `#${order.id.toString().padStart(4, '0')}`,
            produit: orderTitle(order),
            montant: order.montantTotal,
            statut: order.escrowStatus,
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
                <TableHead>Montant (FCFA)</TableHead>
                <TableHead>Statut du séquestre</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>Aucune commande disponible.</TableCell>
                </TableRow>
              )}
              {orders.map((order) => {
                const action = NEXT_STATUS[order.escrowStatus];
                const isTerminal = ['complete', 'annule', 'dispute'].includes(order.escrowStatus);

                return (
                  <TableRow key={order.id}>
                    <TableCell style={{ fontWeight: 600 }}>#{order.id.toString().padStart(4, '0')}</TableCell>
                    <TableCell>{orderTitle(order)}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{order.montantTotal.toLocaleString('fr-FR')} FCFA</TableCell>
                    <TableCell style={{ minWidth: 360 }}>
                      <EscrowTimeline escrowStatus={order.escrowStatus} />
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <a
                          href={orderService.getDocumentUrl(order.id, 'purchase_order')}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Bon de commande"
                          style={{ color: 'var(--primary-color)' }}
                        >
                          <FileText size={16} aria-hidden="true" />
                        </a>
                        <a
                          href={orderService.getDocumentUrl(order.id, 'invoice')}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Facture"
                          style={{ color: 'var(--primary-color)' }}
                        >
                          <FileText size={16} aria-hidden="true" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                        {action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ color: 'var(--primary-color)', padding: '4px 8px' }}
                            isLoading={processingId === order.id}
                            onClick={() => advanceStatus(order.id, action.next)}
                          >
                            {action.label}
                          </Button>
                        )}
                        {!isTerminal && (
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ color: 'var(--error)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => window.location.assign(`/dashboard/disputes?order=${order.id}`)}
                          >
                            <FlagTriangleRight size={14} aria-hidden="true" />
                            Signaler un problème
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
