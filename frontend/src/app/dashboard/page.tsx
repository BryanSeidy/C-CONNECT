'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock, ClipboardList, FileText, Package, ShieldAlert, ShieldCheck, Truck, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/orders';
import { rfqService } from '@/services/rfqs';
import { recurringOrderService } from '@/services/recurring';
import { Order, Rfq, RecurringOrder } from '@/types';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { EscrowTimeline } from '@/components/EscrowTimeline';
import styles from './DashboardOverview.module.css';

const ESCROW_LABELS: Record<string, string> = {
  pending: 'En attente', escrow_locked: 'Séquestre', en_preparation: 'Préparation',
  expedie: 'Expédié', en_transit: 'En transit', livre: 'Livré',
  complete: 'Terminé', annule: 'Annulé', dispute: 'Litige',
};

const ESCROW_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold'> = {
  pending: 'warning', escrow_locked: 'gold', en_preparation: 'info',
  expedie: 'info', en_transit: 'info', livre: 'success',
  complete: 'success', annule: 'error', dispute: 'error',
};

function fmt(n: number) { return n.toLocaleString('fr-FR'); }

// ── Buyer Dashboard ──────────────────────────────────────────────────────────

function BuyerDashboard({ orders, rfqs, recurring, loading }: {
  orders: Order[];
  rfqs: Rfq[];
  recurring: RecurringOrder[];
  loading: boolean;
}) {
  const active = orders.filter(o => !['complete', 'annule', 'dispute'].includes(o.escrowStatus));
  const inEscrow = orders
    .filter(o => ['escrow_locked', 'en_preparation', 'expedie', 'en_transit', 'livre'].includes(o.escrowStatus))
    .reduce((s, o) => s + o.montantTotal, 0);
  const totalSpent = orders
    .filter(o => o.escrowStatus === 'complete')
    .reduce((s, o) => s + o.montantTotal, 0);
  const openRfqs = rfqs.filter(r => r.statut === 'active').length;
  const activeRecurring = recurring.filter(r => r.statut === 'active').length;

  return (
    <div className={styles.page}>
      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <KpiCard label="Dépenses totales" value={`${fmt(totalSpent)} XAF`} icon={<Wallet size={20} />} variant="default" loading={loading} sub="Commandes terminées" />
        <KpiCard label="En séquestre" value={`${fmt(inEscrow)} XAF`} icon={<ShieldCheck size={20} />} variant="gold" loading={loading} sub="Fonds protégés en cours" />
        <KpiCard label="Commandes actives" value={active.length} icon={<Truck size={20} />} variant="success" loading={loading} sub={`sur ${orders.length} total`} />
        <KpiCard label="RFQs ouvertes" value={openRfqs} icon={<ClipboardList size={20} />} variant="default" loading={loading} sub={`${rfqs.length} publiées`} />
      </div>

      <div className={styles.grid2}>
        {/* Suivi Escrow — commandes actives */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Suivi des commandes</h2>
            <Link href="/dashboard/orders" className={styles.link}>Voir tout <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.panelBody}>
            {loading ? (
              <p className={styles.empty}>Chargement…</p>
            ) : active.length === 0 ? (
              <div className={styles.emptyState}>
                <Truck size={32} aria-hidden="true" />
                <p>Aucune commande en cours.</p>
                <Link href="/marketplace" className={styles.ctaLink}>Explorer la marketplace →</Link>
              </div>
            ) : active.slice(0, 4).map(order => {
              const item = order.items?.[0];
              return (
                <div key={order.id} className={styles.orderRow}>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderRef}>#{String(order.id).substring(0, 8)}</span>
                    <span className={styles.orderName}>{item?.product?.name ?? 'Commande'}</span>
                    <span className={styles.orderAmt}>{fmt(order.montantTotal)} XAF</span>
                  </div>
                  <div className={styles.orderTrack}>
                    <EscrowTimeline escrowStatus={order.escrowStatus} />
                  </div>
                  <Badge variant={ESCROW_VARIANTS[order.escrowStatus] ?? 'default'}>
                    {ESCROW_LABELS[order.escrowStatus]}
                  </Badge>
                </div>
              );
            })}
          </div>
        </section>

        {/* Colonne droite */}
        <div className={styles.rightCol}>
          {/* RFQs récentes */}
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Mes demandes de devis</h2>
              <Link href="/dashboard/rfqs" className={styles.link}>Gérer <ArrowRight size={14} /></Link>
            </div>
            <div className={styles.panelBody}>
              {rfqs.length === 0 ? (
                <div className={styles.emptyState}>
                  <ClipboardList size={26} aria-hidden="true" />
                  <p>Aucune RFQ publiée.</p>
                </div>
              ) : rfqs.slice(0, 3).map(rfq => (
                <div key={rfq.id} className={styles.rfqRow}>
                  <div className={styles.rfqLeft}>
                    <span className={styles.rfqTitle}>{rfq.titre}</span>
                    <span className={styles.rfqMeta}>{rfq.quantite} {rfq.unite} · {rfq.nombreOffres} offre(s)</span>
                  </div>
                  <Badge variant={rfq.statut === 'active' ? 'success' : rfq.statut === 'annulee' ? 'error' : 'info'}>
                    {rfq.statut}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          {/* Commandes récurrentes */}
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Approvisionnements planifiés</h2>
              <Link href="/dashboard/recurring" className={styles.link}>Gérer <ArrowRight size={14} /></Link>
            </div>
            <div className={styles.panelBody}>
              {activeRecurring === 0 ? (
                <div className={styles.emptyState}>
                  <CalendarClock size={26} aria-hidden="true" />
                  <p>Aucune commande récurrente.</p>
                </div>
              ) : recurring.filter(r => r.statut === 'active').slice(0, 3).map(r => (
                <div key={r.id} className={styles.rfqRow}>
                  <div className={styles.rfqLeft}>
                    <span className={styles.rfqTitle}>{r.product?.name ?? 'Produit'}</span>
                    <span className={styles.rfqMeta}>{r.quantite} {r.unite} · {r.frequence}</span>
                  </div>
                  {r.prochaineLivraison && (
                    <span className={styles.rfqMeta}>
                      {new Date(r.prochaineLivraison).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Quick actions */}
      <div className={styles.quickActions}>
        {[
          { href: '/dashboard/rfqs', label: 'Publier une demande', Icon: ClipboardList, desc: 'RFQ · Sourcing B2B' },
          { href: '/marketplace', label: 'Explorer le catalogue', Icon: Package, desc: 'Produits vérifiés' },
          { href: '/dashboard/recurring', label: 'Planifier un achat', Icon: CalendarClock, desc: 'Commandes récurrentes' },
          { href: '/dashboard/disputes', label: 'Signaler un problème', Icon: ShieldAlert, desc: 'Centre de litiges' },
        ].map(({ href, label, Icon, desc }) => (
          <Link key={href} href={href} className={styles.qaCard}>
            <div className={styles.qaIcon}><Icon size={20} aria-hidden="true" /></div>
            <div>
              <div className={styles.qaLabel}>{label}</div>
              <div className={styles.qaSub}>{desc}</div>
            </div>
            <ArrowRight size={16} className={styles.qaArrow} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Seller Dashboard ─────────────────────────────────────────────────────────

function SellerDashboard({ orders, rfqs, loading }: {
  orders: Order[];
  rfqs: Rfq[];
  loading: boolean;
}) {
  const available = orders
    .filter(o => o.escrowStatus === 'complete')
    .reduce((s, o) => s + o.montantVendeur, 0);
  const inEscrow = orders
    .filter(o => ['escrow_locked', 'en_preparation', 'expedie', 'en_transit', 'livre'].includes(o.escrowStatus))
    .reduce((s, o) => s + o.montantVendeur, 0);
  const activeOrders = orders.filter(o => !['complete', 'annule'].includes(o.escrowStatus));
  const openBids = rfqs.filter(r => r.statut === 'active').length;

  return (
    <div className={styles.page}>
      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <KpiCard label="Fonds disponibles" value={`${fmt(available)} XAF`} icon={<Wallet size={20} />} variant="success" loading={loading} sub="Séquestre libéré" />
        <KpiCard label="En séquestre" value={`${fmt(inEscrow)} XAF`} icon={<ShieldCheck size={20} />} variant="gold" loading={loading} sub="En attente de réception" />
        <KpiCard label="Commandes actives" value={activeOrders.length} icon={<Truck size={20} />} variant="default" loading={loading} />
        <KpiCard label="Appels d'offres" value={openBids} icon={<ClipboardList size={20} />} variant="default" loading={loading} sub="Ouverts à soumission" />
      </div>

      <div className={styles.grid2}>
        {/* Commandes à traiter */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Commandes reçues</h2>
            <Link href="/dashboard/orders" className={styles.link}>Voir tout <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.panelBody}>
            {loading ? <p className={styles.empty}>Chargement…</p>
              : activeOrders.length === 0 ? (
                <div className={styles.emptyState}>
                  <Truck size={32} aria-hidden="true" />
                  <p>Aucune commande active.</p>
                </div>
              ) : activeOrders.slice(0, 5).map(order => {
                const item = order.items?.[0];
                return (
                  <div key={order.id} className={styles.orderRow}>
                    <div className={styles.orderMeta}>
                      <span className={styles.orderRef}>#{String(order.id).substring(0, 8)}</span>
                      <span className={styles.orderName}>{item?.product?.name ?? 'Commande'}</span>
                      <span className={styles.orderAmt}>{fmt(order.montantVendeur)} XAF</span>
                    </div>
                    <Badge variant={ESCROW_VARIANTS[order.escrowStatus] ?? 'default'}>
                      {ESCROW_LABELS[order.escrowStatus]}
                    </Badge>
                  </div>
                );
              })}
          </div>
        </section>

        <div className={styles.rightCol}>
          {/* Appels d'offres */}
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Appels d&apos;offres ouverts</h2>
              <Link href="/dashboard/rfqs" className={styles.link}>Soumissionner <ArrowRight size={14} /></Link>
            </div>
            <div className={styles.panelBody}>
              {rfqs.filter(r => r.statut === 'active').length === 0 ? (
                <div className={styles.emptyState}>
                  <ClipboardList size={26} aria-hidden="true" />
                  <p>Aucun appel d&apos;offres actif.</p>
                </div>
              ) : rfqs.filter(r => r.statut === 'active').slice(0, 4).map(rfq => (
                <div key={rfq.id} className={styles.rfqRow}>
                  <div className={styles.rfqLeft}>
                    <span className={styles.rfqTitle}>{rfq.titre}</span>
                    <span className={styles.rfqMeta}>{rfq.quantite} {rfq.unite}{rfq.budgetMax ? ` · Max ${fmt(rfq.budgetMax)} XAF` : ''}</span>
                  </div>
                  <Badge variant="gold">Nouveau</Badge>
                </div>
              ))}
            </div>
          </section>

          {/* Actions rapides vendeur */}
          <div className={styles.quickActions} style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[
              { href: '/dashboard/products/add', label: 'Ajouter produit', Icon: Package },
              { href: '/dashboard/orders', label: 'Mes commandes', Icon: Truck },
              { href: '/dashboard/negotiations', label: 'Négociations', Icon: FileText },
              { href: '/dashboard/disputes', label: 'Litiges', Icon: ShieldAlert },
            ].map(({ href, label, Icon }) => (
              <Link key={href} href={href} className={styles.qaCard} style={{ fontSize: '0.8125rem' }}>
                <div className={styles.qaIcon}><Icon size={16} aria-hidden="true" /></div>
                <span className={styles.qaLabel}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────

function AdminDashboard({ orders, loading }: { orders: Order[]; loading: boolean }) {
  const totalVolume = orders.reduce((s, o) => s + o.montantTotal, 0);
  const commission = orders.filter(o => o.escrowStatus === 'complete').reduce((s, o) => s + o.commissionPlateforme, 0);
  const disputes = orders.filter(o => o.escrowStatus === 'dispute').length;

  return (
    <div className={styles.page}>
      <div className={styles.kpiGrid}>
        <KpiCard label="Volume transactions" value={`${fmt(totalVolume)} XAF`} icon={<Wallet size={20} />} variant="default" loading={loading} />
        <KpiCard label="Commissions collectées" value={`${fmt(commission)} XAF`} icon={<ShieldCheck size={20} />} variant="gold" loading={loading} sub="10% par transaction" />
        <KpiCard label="Total commandes" value={orders.length} icon={<Truck size={20} />} variant="success" loading={loading} />
        <KpiCard label="Litiges ouverts" value={disputes} icon={<ShieldAlert size={20} />} variant={disputes > 0 ? 'warning' : 'muted'} loading={loading} />
      </div>

      <div className={styles.quickActions}>
        {[
          { href: '/dashboard/admin/companies', label: 'Validation KYB', Icon: ShieldCheck, desc: 'Entreprises en attente' },
          { href: '/dashboard/admin/disputes', label: 'Arbitrages', Icon: ShieldAlert, desc: 'Litiges à résoudre' },
          { href: '/dashboard/admin/stats', label: 'Statistiques', Icon: ClipboardList, desc: 'Indicateurs plateforme' },
          { href: '/dashboard/admin/users', label: 'Utilisateurs', Icon: Package, desc: 'Gestion des comptes' },
        ].map(({ href, label, Icon, desc }) => (
          <Link key={href} href={href} className={styles.qaCard}>
            <div className={styles.qaIcon}><Icon size={20} aria-hidden="true" /></div>
            <div>
              <div className={styles.qaLabel}>{label}</div>
              <div className={styles.qaSub}>{desc}</div>
            </div>
            <ArrowRight size={16} className={styles.qaArrow} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Root page ────────────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [recurring, setRecurring] = useState<RecurringOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ordRes, rfqRes, recRes] = await Promise.allSettled([
        orderService.getOrders(),
        rfqService.getMyRfqs(),
        recurringOrderService.getRecurringOrders(),
      ]);
      if (ordRes.status === 'fulfilled') setOrders(ordRes.value.data ?? []);
      if (rfqRes.status === 'fulfilled') setRfqs(rfqRes.value.data ?? []);
      if (recRes.status === 'fulfilled') setRecurring(recRes.value.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (user?.role === 'admin') return <AdminDashboard orders={orders} loading={loading} />;
  if (user?.role === 'seller') return <SellerDashboard orders={orders} rfqs={rfqs} loading={loading} />;
  return <BuyerDashboard orders={orders} rfqs={rfqs} recurring={recurring} loading={loading} />;
}
