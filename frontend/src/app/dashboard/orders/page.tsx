'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ExternalLink, FileText, FlagTriangleRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/orders';
import { Order } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { EscrowTimeline } from '@/components/EscrowTimeline';
import styles from './Orders.module.css';

type EscrowStatus = Order['escrowStatus'];

const NEXT_STATUS: Partial<Record<EscrowStatus, { next: EscrowStatus; label: string; primary: boolean }>> = {
  pending: { next: 'escrow_locked', label: 'Verrouiller en séquestre', primary: true },
  escrow_locked: { next: 'en_preparation', label: 'Marquer en préparation', primary: true },
  en_preparation: { next: 'expedie', label: 'Marquer expédié', primary: true },
  expedie: { next: 'en_transit', label: 'Marquer en transit', primary: false },
  en_transit: { next: 'livre', label: 'Confirmer livraison', primary: true },
  livre: { next: 'complete', label: 'Libérer les fonds', primary: true },
};

const BADGE_VARIANTS: Partial<Record<EscrowStatus, 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold'>> = {
  pending: 'warning',
  escrow_locked: 'gold',
  en_preparation: 'info',
  expedie: 'info',
  en_transit: 'info',
  livre: 'success',
  complete: 'success',
  annule: 'error',
  dispute: 'error',
};

const BADGE_LABELS: Record<string, string> = {
  pending: 'En attente', escrow_locked: 'Séquestre', en_preparation: 'Préparation',
  expedie: 'Expédié', en_transit: 'En transit', livre: 'Livré',
  complete: 'Terminé', annule: 'Annulé', dispute: 'Litige',
};

function fmt(n: number) { return n.toLocaleString('fr-FR'); }
function orderTitle(o: Order) {
  const name = o.items?.[0]?.product?.name ?? 'Commande';
  const extra = (o.items?.length ?? 0) - 1;
  return extra > 0 ? `${name} ${extra}` : name;
}

type FilterKey = 'all' | 'active' | 'complete' | 'dispute';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'En cours' },
  { key: 'complete', label: 'Terminées' },
  { key: 'dispute', label: 'Litiges' },
];

function filterOrders(orders: Order[], f: FilterKey) {
  if (f === 'active') return orders.filter(o => !['complete', 'annule', 'dispute'].includes(o.escrowStatus));
  if (f === 'complete') return orders.filter(o => o.escrowStatus === 'complete');
  if (f === 'dispute') return orders.filter(o => o.escrowStatus === 'dispute');
  return orders;
}

export default function DashboardOrders() {
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeFilter, setFilter] = useState<FilterKey>('all');
  const [expandedId, setExpanded] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getOrders();
      setOrders(res.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const advance = async (id: string, next: EscrowStatus) => {
    setProcessingId(id);
    try {
      await orderService.updateEscrowStatus(id, next);
      await fetchOrders();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Mise à jour impossible.');
    } finally {
      setProcessingId(null);
    }
  };

  // KPIs
  const active = orders.filter(o => !['complete', 'annule', 'dispute'].includes(o.escrowStatus));
  const inEscrow = orders.filter(o => ['escrow_locked', 'en_preparation', 'expedie', 'en_transit', 'livre'].includes(o.escrowStatus)).reduce((s, o) => s + (isSeller ? o.montantVendeur : o.montantTotal), 0);
  const done = orders.filter(o => o.escrowStatus === 'complete');
  const disputes = orders.filter(o => o.escrowStatus === 'dispute');

  const displayed = filterOrders(orders, activeFilter);

  return (
    <div className={styles.page}>
      {/* KPIs */}
      <div className={styles.kpiRow}>
        <KpiCard label="En cours" value={active.length} variant="default" loading={loading} sub={`sur ${orders.length} total`} />
        <KpiCard label={isSeller ? 'Revenus en séquestre' : 'Fonds en séquestre'} value={`${fmt(inEscrow)} XAF`} variant="gold" loading={loading} />
        <KpiCard label="Terminées" value={done.length} variant="success" loading={loading} />
        <KpiCard label="Litiges" value={disputes.length} variant={disputes.length > 0 ? 'warning' : 'muted'} loading={loading} />
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Filters */}
      <div className={styles.filterBar}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            className={`${styles.filterBtn} ${activeFilter === f.key ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className={styles.filterCount}>
              {filterOrders(orders, f.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.emptyState}>Chargement…</div>
        ) : displayed.length === 0 ? (
          <div className={styles.emptyState}>Aucune commande dans cette catégorie.</div>
        ) : displayed.map(order => {
          const sid = String(order.id);
          const isExp = expandedId === sid;
          const action = NEXT_STATUS[order.escrowStatus];
          const isProc = processingId === sid;
          const terminal = ['complete', 'annule', 'dispute'].includes(order.escrowStatus);

          return (
            <div key={order.id} className={`${styles.orderCard} ${isExp ? styles.expanded : ''}`}>
              {/* Row header */}
              <div
                className={styles.orderHeader}
                onClick={() => setExpanded(isExp ? null : sid)}
                role="button"
                tabIndex={0}
                aria-expanded={isExp}
                onKeyDown={e => e.key === 'Enter' && setExpanded(isExp ? null : sid)}
              >
                <div className={styles.orderInfo}>
                  <span className={styles.orderRef}>#{sid.substring(0, 8).toUpperCase()}</span>
                  <span className={styles.orderTitle}>{orderTitle(order)}</span>
                  {order.villeLivraison && (
                    <span className={styles.orderSub}>{order.villeLivraison}</span>
                  )}
                </div>

                <div className={styles.orderMiddle}>
                  <EscrowTimeline escrowStatus={order.escrowStatus} />
                </div>

                <div className={styles.orderRight}>
                  <span className={styles.orderAmt}>{fmt(isSeller ? order.montantVendeur : order.montantTotal)} XAF</span>
                  <Badge variant={BADGE_VARIANTS[order.escrowStatus] ?? 'default'}>
                    {BADGE_LABELS[order.escrowStatus]}
                  </Badge>
                  <ArrowRight size={14} className={`${styles.chevron} ${isExp ? styles.chevronOpen : ''}`} aria-hidden="true" />
                </div>
              </div>

              {/* Expanded detail */}
              {isExp && (
                <div className={styles.orderDetail}>
                  {/* Commission breakdown pour les vendeurs */}
                  {isSeller && order.escrowStatus !== 'pending' && (
                    <div className={styles.financeRow}>
                      <div className={styles.financeItem}>
                        <span>Montant brut</span>
                        <strong>{fmt(order.montantTotal)} XAF</strong>
                      </div>
                      <div className={styles.financeItem}>
                        <span>Commission C-Connect (10%)</span>
                        <strong>- {fmt(order.commissionPlateforme)} XAF</strong>
                      </div>
                      <div className={`${styles.financeItem} ${styles.financeTotalRow}`}>
                        <span>Votre revenu net</span>
                        <strong>{fmt(order.montantVendeur)} XAF</strong>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  <div className={styles.docRow}>
                    <span className={styles.docLabel}>Documents :</span>
                    {(['purchase_order', 'invoice', 'delivery_note'] as const).map(type => {
                      const labels = { purchase_order: 'Bon de commande', invoice: 'Facture', delivery_note: 'Bon de livraison' };
                      return (
                        <a
                          key={type}
                          href={orderService.getDocumentUrl(order.id, type)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.docLink}
                          title={labels[type]}
                        >
                          <FileText size={14} aria-hidden="true" />
                          {labels[type]}
                          <ExternalLink size={11} aria-hidden="true" />
                        </a>
                      );
                    })}
                  </div>

                  {/* Actions lifecycle */}
                  <div className={styles.actionRow}>
                    {action && (
                      <Button
                        variant={action.primary ? 'primary' : 'outline'}
                        size="sm"
                        isLoading={isProc}
                        onClick={() => advance(sid, action.next)}
                      >
                        {action.label}
                      </Button>
                    )}
                    {!terminal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.assign(`/dashboard/disputes?order=${order.id}`)}
                        style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <FlagTriangleRight size={14} aria-hidden="true" />
                        Signaler un problème
                      </Button>
                    )}
                    {order.escrowStatus === 'pending' && !isSeller && (
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={isProc}
                        onClick={async () => {
                          setProcessingId(sid);
                          try { await orderService.cancelOrder(order.id); await fetchOrders(); }
                          catch { setError('Annulation impossible.'); }
                          finally { setProcessingId(null); }
                        }}
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Annuler la commande
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
