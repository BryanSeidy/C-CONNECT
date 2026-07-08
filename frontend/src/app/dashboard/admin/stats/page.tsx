'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Wallet, Truck, ShieldCheck, AlertTriangle } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { adminService } from '@/services/admin';
import type { AdminStats as AdminStatsData } from '@/services/admin';
import { extractApiError } from '@/lib/errors';
import styles from '../Admin.module.css';

export default function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
    </div>
  );
}
