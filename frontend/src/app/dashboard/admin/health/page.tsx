'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Database, HardDrive, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { adminService, SystemHealth, SystemCheck } from '@/services/admin';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { extractApiError } from '@/lib/errors';
import styles from '../Admin.module.css';

const STATUS_META: Record<SystemCheck['status'], { label: string; color: string }> = {
  ok:              { label: 'Opérationnel',    color: 'var(--success, #16a34a)' },
  down:            { label: 'Indisponible',    color: 'var(--error, #dc2626)' },
  degraded:        { label: 'Dégradé',         color: 'var(--warning, #d97706)' },
  warning:         { label: 'À surveiller',    color: 'var(--warning, #d97706)' },
  not_configured:  { label: 'Non configuré',   color: 'var(--text-muted)' },
  unknown:         { label: 'Inconnu',         color: 'var(--text-muted)' },
};

function StatusDot({ status }: { status: SystemCheck['status'] }) {
  return (
    <span
      style={{
        display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
        background: STATUS_META[status].color, flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

function CheckCard({ icon, label, check, detail }: { icon: React.ReactNode; label: string; check: SystemCheck; detail?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
    }}>
      <div style={{ color: 'var(--primary-color)', marginTop: '0.15rem' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <StatusDot status={check.status} />
          {STATUS_META[check.status].label}
          {detail && <span>· {detail}</span>}
        </div>
        {check.message && (
          <div style={{ fontSize: '0.75rem', color: 'var(--error, #dc2626)', marginTop: '0.35rem' }}>{check.message}</div>
        )}
      </div>
    </div>
  );
}

export default function AdminHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHealth(await adminService.getHealth());
    } catch (err) {
      setError(extractApiError(err, 'Impossible de charger l\u2019état du système.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {health && `Dernière vérification : ${new Date(health.checkedAt).toLocaleString('fr-FR')}`}
        </span>
        <Button variant="outline" size="sm" onClick={fetchHealth} isLoading={loading}>
          <RefreshCw size={14} aria-hidden="true" /> Actualiser
        </Button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {health && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <CheckCard icon={<Database size={18} aria-hidden="true" />} label="Base de données" check={health.checks.database}
            detail={health.checks.database.latencyMs !== undefined ? `${health.checks.database.latencyMs} ms` : undefined} />
          <CheckCard icon={<Zap size={18} aria-hidden="true" />} label="Cache" check={health.checks.cache} />
          <CheckCard icon={<Sparkles size={18} aria-hidden="true" />} label="Assistant IA" check={health.checks.ai} />
          <CheckCard icon={<HardDrive size={18} aria-hidden="true" />} label="Stockage disque" check={health.checks.storage}
            detail={health.checks.storage.freePercent !== undefined ? `${health.checks.storage.freePercent}% libre` : undefined} />
        </div>
      )}

      <section className={styles.panel} style={{ marginTop: '1.5rem' }}>
        <div className={styles.panelHead}>
          <h2>Dernières erreurs applicatives</h2>
          {health && <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{health.recentErrors.length} entrée(s)</span>}
        </div>

        {loading ? (
          <p className={styles.loading}>Chargement…</p>
        ) : !health || health.recentErrors.length === 0 ? (
          <EmptyState icon={Activity} message="Aucune erreur récente dans le journal applicatif." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {health.recentErrors.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-sm)',
                background: entry.level === 'ERROR' || entry.level === 'CRITICAL' ? 'rgba(220,38,38,0.06)' : 'rgba(217,119,6,0.08)',
                fontSize: '0.8125rem',
              }}>
                <span style={{
                  fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase',
                  color: entry.level === 'ERROR' || entry.level === 'CRITICAL' ? 'var(--error, #dc2626)' : 'var(--warning, #d97706)',
                  flexShrink: 0, minWidth: 64,
                }}>
                  {entry.level}
                </span>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{entry.date}</span>
                <span style={{ color: 'var(--text-main)', wordBreak: 'break-word' }}>{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
