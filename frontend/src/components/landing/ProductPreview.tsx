'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Clock3, FileText, MapPin, PackageCheck } from 'lucide-react';
import styles from './ProductPreview.module.css';

const buyerRequests = [
  { ref: 'BC-1042', name: 'Poivre blanc de Penja', qty: '450 kg', status: 'Paiement en séquestre', tone: 'pending' as const },
  { ref: 'BC-1039', name: 'Café Arabica du Muanenguba', qty: '120 kg', status: 'Négociation en cours', tone: 'progress' as const },
  { ref: 'BC-1031', name: 'Sac en cuir artisanal', qty: '60 unités', status: 'Livré · fonds libérés', tone: 'done' as const },
];

const supplierOrders = [
  { ref: 'CMD-884', buyer: 'Chaîne d’hôtels, Douala', qty: '300 kg', status: 'À expédier', tone: 'progress' as const },
  { ref: 'CMD-879', buyer: 'Grossiste alimentaire, Yaoundé', qty: '1 200 kg', status: 'En séquestre', tone: 'pending' as const },
  { ref: 'CMD-861', buyer: 'Restaurant, Douala', qty: '80 kg', status: 'Payé · clos', tone: 'done' as const },
];

function StatusDot({ tone }: { tone: 'pending' | 'progress' | 'done' }) {
  if (tone === 'done') return <CheckCircle2 size={14} className={styles.toneDone} aria-hidden="true" />;
  if (tone === 'pending') return <Clock3 size={14} className={styles.tonePending} aria-hidden="true" />;
  return <Circle size={14} className={styles.toneProgress} aria-hidden="true" />;
}

export function ProductPreview() {
  const [tab, setTab] = useState<'buyer' | 'supplier'>('buyer');

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs} role="tablist" aria-label="Aperçu de la plateforme">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'buyer'}
          className={`${styles.tab} ${tab === 'buyer' ? styles.tabActive : ''}`}
          onClick={() => setTab('buyer')}
        >
          Espace acheteur
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'supplier'}
          className={`${styles.tab} ${tab === 'supplier' ? styles.tabActive : ''}`}
          onClick={() => setTab('supplier')}
        >
          Espace fournisseur
        </button>
      </div>

      <div className={styles.panel}>
        {tab === 'buyer' ? (
          <div className={styles.grid}>
            <div className={styles.listCard}>
              <header className={styles.listHeader}>
                <span>Mes demandes d’achat</span>
                <span className={styles.badgeMuted}>3 actives</span>
              </header>
              <ul className={styles.rows}>
                {buyerRequests.map((row) => (
                  <li className={styles.row} key={row.ref}>
                    <div className={styles.rowMain}>
                      <span className={styles.rowRef}>{row.ref}</span>
                      <span className={styles.rowName}>{row.name}</span>
                      <span className={styles.rowQty}>{row.qty}</span>
                    </div>
                    <span className={styles.rowStatus} data-tone={row.tone}>
                      <StatusDot tone={row.tone} />
                      {row.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.sideCard}>
              <header className={styles.sideHeader}>
                <FileText size={15} aria-hidden="true" />
                Facture BC-1042
              </header>
              <dl className={styles.sideList}>
                <div><dt>Fournisseur</dt><dd>Coopérative agricole · Littoral</dd></div>
                <div><dt>Montant</dt><dd>8 325 000 XAF</dd></div>
                <div><dt>Statut séquestre</dt><dd>Fonds réservés</dd></div>
              </dl>
              <button type="button" className={styles.sideAction}>Confirmer la réception</button>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            <div className={styles.listCard}>
              <header className={styles.listHeader}>
                <span>Commandes reçues</span>
                <span className={styles.badgeMuted}>2 à traiter</span>
              </header>
              <ul className={styles.rows}>
                {supplierOrders.map((row) => (
                  <li className={styles.row} key={row.ref}>
                    <div className={styles.rowMain}>
                      <span className={styles.rowRef}>{row.ref}</span>
                      <span className={styles.rowName}>{row.buyer}</span>
                      <span className={styles.rowQty}>{row.qty}</span>
                    </div>
                    <span className={styles.rowStatus} data-tone={row.tone}>
                      <StatusDot tone={row.tone} />
                      {row.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.sideCard}>
              <header className={styles.sideHeader}>
                <PackageCheck size={15} aria-hidden="true" />
                Profil vérifié
              </header>
              <dl className={styles.sideList}>
                <div><dt>Statut KYC</dt><dd>Approuvé</dd></div>
                <div>
                  <dt><MapPin size={12} aria-hidden="true" style={{ display: 'inline', marginRight: 4 }} />Région</dt>
                  <dd>Ouest · Coopérative</dd>
                </div>
                <div><dt>Solde en attente</dt><dd>1 800 000 XAF</dd></div>
              </dl>
              <button type="button" className={styles.sideAction}>Voir mes paiements</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
