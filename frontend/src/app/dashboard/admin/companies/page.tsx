'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { companyService } from '@/services/companies';
import { Company } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { extractApiError } from '@/lib/errors';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import styles from '../Admin.module.css';

const STATUS_MAP: Record<string, { label: string; variant: 'success'|'error'|'warning'|'default' }> = {
  verifie:      { label: 'Vérifié',       variant: 'success' },
  rejete:       { label: 'Rejeté',        variant: 'error' },
  en_attente:   { label: 'En attente',    variant: 'warning' },
  non_verifie:  { label: 'Non vérifié',   variant: 'default' },
};

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string|null>(null);
  const [actingId,  setActingId]  = useState<number | string | null>(null);
  const { showToast } = useToast();
  const confirmDialog = useConfirm();

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await companyService.getCompanies({});
      setCompanies(res.data.items);
    } catch (err) {
      setError(extractApiError(err, 'Impossible de charger les entreprises.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDecision = async (id: number | string, statut: 'verifie' | 'rejete', companyName?: string) => {
    if (statut === 'rejete') {
      const ok = await confirmDialog({
        title: 'Rejeter cette entreprise ?',
        message: companyName
          ? `« ${companyName} » ne pourra pas publier de catalogue tant que son statut KYB n'est pas revu.`
          : 'Cette entreprise ne pourra pas publier de catalogue tant que son statut KYB n\'est pas revu.',
        confirmLabel: 'Rejeter',
        cancelLabel: 'Annuler',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setActingId(id);
    setError(null);
    try {
      const res = await companyService.updateVerificationStatus(id, statut);
      setCompanies((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      showToast(statut === 'verifie' ? 'Entreprise vérifiée.' : 'Entreprise rejetée.', statut === 'verifie' ? 'success' : 'info');
    } catch (err) {
      const msg = extractApiError(err, 'Impossible de mettre à jour le statut KYB.');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.count}>{companies.length} entreprise(s)</span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.loading}>Chargement…</p>
      ) : companies.length === 0 ? (
        <EmptyState icon={CheckCircle2} message="Aucune entreprise à examiner pour le moment." />
      ) : (
        <div className={styles.table}>
          <div className={styles.thead}>
            <span>Entreprise</span><span>Type</span><span>Région</span>
            <span>Score confiance</span><span>Statut KYB</span><span>Actions</span>
          </div>
          {companies.map(c => (
            <div key={c.id} className={styles.trow}>
              <div className={styles.cell}>
                <span className={styles.cellMain}>{c.nom}</span>
                {c.rccm && <span className={styles.cellSub}>RCCM: {c.rccm}</span>}
              </div>
              <span className={styles.cell}>{c.typeEntreprise}</span>
              <span className={styles.cell}>{c.region ?? '—'}</span>
              <div className={styles.cell}>
                <div className={styles.scoreBar}>
                  <div className={styles.scoreFill} style={{width:`${c.trustScore}%`}}/>
                </div>
                <span className={styles.scoreNum}>{c.trustScore}/100</span>
              </div>
              <span className={styles.cell}>
                <Badge variant={STATUS_MAP[c.statutVerification]?.variant ?? 'default'}>
                  {STATUS_MAP[c.statutVerification]?.label ?? c.statutVerification}
                </Badge>
              </span>
              <div className={styles.cell} style={{display:'flex',gap:'0.4rem'}}>
                <button
                  className={`${styles.actionBtn} ${styles.approve}`}
                  title="Approuver"
                  disabled={actingId === c.id || c.statutVerification === 'verifie'}
                  onClick={() => handleDecision(c.id, 'verifie', c.nom)}
                >
                  <CheckCircle2 size={15} aria-hidden="true"/> Approuver
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.reject}`}
                  title="Rejeter"
                  disabled={actingId === c.id || c.statutVerification === 'rejete'}
                  onClick={() => handleDecision(c.id, 'rejete', c.nom)}
                >
                  <XCircle size={15} aria-hidden="true"/> Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
