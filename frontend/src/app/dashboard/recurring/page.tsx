'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { recurringOrderService } from '@/services/recurring';
import { RecurringOrder } from '@/types';
import { CalendarClock, Pause, Play, X } from 'lucide-react';

const FREQUENCY_LABELS: Record<RecurringOrder['frequence'], string> = {
  hebdomadaire: 'Chaque semaine',
  bimensuelle: 'Toutes les deux semaines',
  mensuelle: 'Chaque mois',
};

const STATUS_LABELS: Record<RecurringOrder['statut'], string> = {
  active: 'Active',
  en_pause: 'En pause',
  annulee: 'Annulée',
  expiree: 'Expirée',
};

export default function DashboardRecurringOrders() {
  const [orders, setOrders] = useState<RecurringOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recurringOrderService.getRecurringOrders();
      setOrders(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de charger les commandes recurrentes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const changeStatus = async (id: string, statut: 'active' | 'en_pause' | 'annulee') => {
    setActionId(id);
    try {
      await recurringOrderService.updateStatus(id, statut);
      await fetchOrders();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Action impossible.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>
          Commandes Recurrentes
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: 560 }}>
          Planifiez vos approvisionnements reguliers (hebdomadaires, bimensuels ou mensuels) sans repasser commande a chaque fois.
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(211,47,47,0.08)', color: 'var(--error)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <CalendarClock size={32} aria-hidden="true" style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Aucune commande recurrente planifiee. Depuis la fiche d&apos;un produit, choisissez l&apos;option de planification.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 650, color: 'var(--primary-color)', margin: 0 }}>
                    {order.product?.name || 'Produit'}
                  </h3>
                  <Badge variant={order.statut === 'active' ? 'success' : order.statut === 'en_pause' ? 'warning' : 'default'}>
                    {STATUS_LABELS[order.statut]}
                  </Badge>
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <span><strong style={{ color: 'var(--text-main)' }}>{order.quantite}</strong> {order.unite} - {FREQUENCY_LABELS[order.frequence]}</span>
                  {order.prochaineLivraison && (
                    <span>Prochaine livraison : {new Date(order.prochaineLivraison).toLocaleDateString('fr-FR')}</span>
                  )}
                  <span>{order.totalCommandesGenerees} commande(s) generee(s)</span>
                </div>

                {order.statut !== 'annulee' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {order.statut === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={actionId === String(order.id)}
                        onClick={() => changeStatus(String(order.id), 'en_pause')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Pause size={14} aria-hidden="true" /> Mettre en pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={actionId === String(order.id)}
                        onClick={() => changeStatus(String(order.id), 'active')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Play size={14} aria-hidden="true" /> Reactiver
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      isLoading={actionId === String(order.id)}
                      onClick={() => changeStatus(String(order.id), 'annulee')}
                      style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <X size={14} aria-hidden="true" /> Annuler
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
