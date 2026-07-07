'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { disputeService } from '@/services/disputes';
import { Dispute } from '@/types';
import { Badge } from '@/components/ui/Badge';
import styles from '../Admin.module.css';

const RAISON_LABELS: Record<string, string> = {
  marchandise_non_recue: 'Marchandise non reçue',
  qualite_non_conforme:  'Qualité non conforme',
  quantite_incorrecte:   'Quantité incorrecte',
  produit_endommage:     'Produit endommagé',
  retard_livraison:      'Retard de livraison',
  autre:                 'Autre',
};

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [busyId, setBusyId] = useState<string | number | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await disputeService.getDisputes();
      setDisputes(res.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const resolve = async (id: string | number, decision: 'rembourser' | 'liberer' | 'demander_informations') => {
    const notes = {
      rembourser: 'Remboursement accordé par administrateur.',
      liberer: 'Fonds libérés par administrateur.',
      demander_informations: "Informations complémentaires demandées à l'acheteur et au vendeur.",
    }[decision];

    setBusyId(id);
    try {
      await disputeService.resolveDispute(id, decision, notes);
      await fetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.count}>{disputes.filter(d=>d.statut==='ouvert').length} litige(s) ouvert(s)</span>
      </div>

      {loading ? <p className={styles.loading}>Chargement…</p> : (
        <div className={styles.table}>
          <div className={styles.thead}>
            <span>Commande</span><span>Parties</span><span>Motif</span><span>Statut</span><span>Description</span><span>Actions</span>
          </div>
          {disputes.map(d => {
            const order = d.order;
            const buyerName = order?.buyer?.companyName || order?.buyer?.fullName || '—';
            const sellerName = order?.seller?.companyName || order?.seller?.fullName || '—';
            const isBusy = busyId === d.id;

            return (
              <div key={d.id} className={styles.trow}>
                <div className={styles.cell}>
                  <span className={styles.cellMain} style={{fontFamily:'monospace',fontSize:'0.8rem'}}>
                    #{String(d.orderId).substring(0,8)}
                  </span>
                  {order && <span className={styles.cellSub}>{fmt(order.montantTotal)} XAF</span>}
                </div>
                <div className={styles.cell}>
                  <span className={styles.cellMain} style={{fontSize:'0.8rem'}}>{buyerName}</span>
                  <span className={styles.cellSub}>vs {sellerName}</span>
                </div>
                <span className={styles.cell}>{RAISON_LABELS[d.raison] ?? d.raison}</span>
                <span className={styles.cell}>
                  <Badge variant={d.statut==='ouvert'?'warning':d.statut.startsWith('resolu')?'success':'default'}>
                    {d.statut.replace('_',' ')}
                  </Badge>
                </span>
                <span className={styles.cell} style={{fontSize:'0.8125rem',color:'var(--text-muted)',maxWidth:240}}>
                  {d.description.substring(0,80)}{d.description.length>80?'…':''}
                </span>
                {d.statut === 'ouvert' || d.statut === 'en_instruction' ? (
                  <div className={styles.cell} style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                    <button className={`${styles.actionBtn} ${styles.approve}`} disabled={isBusy} onClick={()=>resolve(d.id,'liberer')}>
                      <CheckCircle2 size={14} aria-hidden="true"/> Libérer fonds
                    </button>
                    <button className={`${styles.actionBtn} ${styles.reject}`} disabled={isBusy} onClick={()=>resolve(d.id,'rembourser')}>
                      <XCircle size={14} aria-hidden="true"/> Rembourser
                    </button>
                    <button className={styles.actionBtn} disabled={isBusy} onClick={()=>resolve(d.id,'demander_informations')} style={{background:'var(--info-bg)', color:'var(--info)'}}>
                      <HelpCircle size={14} aria-hidden="true"/> Demander infos
                    </button>
                  </div>
                ) : <span className={styles.cell}>{d.notesResolution ?? '—'}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
