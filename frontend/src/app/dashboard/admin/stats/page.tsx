'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Wallet, Truck, ShieldCheck, AlertTriangle } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { adminService } from '@/services/admin';
import type { AdminStats as AdminStatsData } from '@/services/admin';
import { companyService } from '@/services/companies';
import { disputeService } from '@/services/disputes';
import { extractApiError } from '@/lib/errors';
import { DonutChartCard, DistributionDatum } from '@/components/dashboard/DonutChartCard';
import { BarChartCard, SeriesDatum } from '@/components/dashboard/BarChartCard';
import styles from '../Admin.module.css';

const VERIFICATION_LABELS: Record<string, string> = {
  verifie: 'Vérifiée',
  en_attente: 'En attente',
  rejete: 'Rejetée',
  non_verifie: 'Non vérifiée',
};

const TYPE_LABELS: Record<string, string> = {
  cooperative: 'Coopérative',
  producteur: 'Producteur',
  fabricant: 'Fabricant',
  restaurant: 'Restaurant',
  hotel: 'Hôtel',
  supermarche: 'Supermarché',
  grossiste: 'Grossiste',
  distributeur: 'Distributeur',
  ong: 'ONG',
  institution: 'Institution',
  pme: 'PME',
  autre: 'Autre',
};

const RAISON_LABELS: Record<string, string> = {
  marchandise_non_recue: 'Non reçue',
  qualite_non_conforme: 'Qualité',
  quantite_incorrecte: 'Quantité',
  produit_endommage: 'Endommagé',
  retard_livraison: 'Retard',
  autre: 'Autre',
};

function countBy<T>(items: T[], keyFn: (item: T) => string, labels: Record<string, string>): DistributionDatum[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const raw = keyFn(item);
    const label = labels[raw] ?? raw;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export default function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [companyTypeData, setCompanyTypeData] = useState<DistributionDatum[]>([]);
  const [verificationData, setVerificationData] = useState<DistributionDatum[]>([]);
  const [disputeReasonData, setDisputeReasonData] = useState<SeriesDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err) {
      setError(extractApiError(err, 'Impossible de charger les statistiques.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      const [companiesRes, disputesRes] = await Promise.allSettled([
        companyService.getCompanies({ pageSize: 50 }),
        disputeService.getDisputes(),
      ]);

      if (companiesRes.status === 'fulfilled') {
        const companies = companiesRes.value.data.items;
        setCompanyTypeData(countBy(companies, (c) => c.typeEntreprise, TYPE_LABELS));
        setVerificationData(countBy(companies, (c) => c.statutVerification, VERIFICATION_LABELS));
      }

      if (disputesRes.status === 'fulfilled') {
        setDisputeReasonData(countBy(disputesRes.value.data, (d) => d.raison, RAISON_LABELS));
      }
    } finally {
      setChartsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCharts();
  }, [fetchStats, fetchCharts]);

  return (
    <div className={styles.page}>
      {error && <div className={styles.error}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KpiCard
          label="Commandes totales"
          value={stats?.totalOrders ?? '—'}
          icon={<Truck size={20} aria-hidden="true" />}
          variant="default"
          loading={loading}
        />
        <KpiCard
          label="Entreprises vérifiées"
          value={stats?.totalCompanies ?? '—'}
          icon={<ShieldCheck size={20} aria-hidden="true" />}
          variant="gold"
          loading={loading}
        />
        <KpiCard
          label="Utilisateurs inscrits"
          value={stats?.totalUsers ?? '—'}
          icon={<Wallet size={20} aria-hidden="true" />}
          variant="success"
          loading={loading}
        />
        <KpiCard
          label="Litiges ouverts"
          value={stats?.disputesOpen ?? '—'}
          icon={<AlertTriangle size={20} aria-hidden="true" />}
          variant={stats && stats.disputesOpen > 0 ? 'warning' : 'default'}
          loading={loading}
        />
      </div>

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        border: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Commission plateforme cumulée (commandes clôturées) :
        </span>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color)', marginTop: '0.25rem' }}>
          {loading ? '—' : `${stats?.commissionTotal.toLocaleString('fr-FR')} FCFA`}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <DonutChartCard
          title="Entreprises par statut de vérification"
          data={verificationData}
          loading={chartsLoading}
        />
        <DonutChartCard
          title="Entreprises par type"
          data={companyTypeData}
          loading={chartsLoading}
        />
        <BarChartCard
          title="Litiges par motif"
          data={disputeReasonData}
          loading={chartsLoading}
          color="#B45309"
          emptyLabel="Aucun litige enregistré."
        />
      </div>
    </div>
  );
}
