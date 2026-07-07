'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import { useDatabaseMode } from '@/context/DatabaseModeContext';
import styles from './OfflineBanner.module.css';

/**
 * OfflineBanner
 *
 * Banniere globale non-intrusive affichee quand le backend detecte
 * que la base de donnees primaire (Neon PostgreSQL) est inaccessible
 * et que l'application tourne sur le fallback SQLite local.
 *
 * Comportement :
 *   - Montee depuis le bas avec animation CSS douce
 *   - Disparait automatiquement 3s apres le retour en mode 'online'
 *   - N'interfere pas avec la navigation ni les interactions
 *   - Icones Lucide uniquement — aucun emoji
 */
export function OfflineBanner() {
  const { mode, lastChecked } = useDatabaseMode();
  const [visible,     setVisible]     = useState(false);
  const [recovering,  setRecovering]  = useState(false);
  const recoveryTimer                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode === 'offline') {
      setVisible(true);
      setRecovering(false);
      if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
    }

    if (mode === 'online' && visible) {
      setRecovering(true);
      recoveryTimer.current = setTimeout(() => {
        setVisible(false);
        setRecovering(false);
      }, 3000);
    }

    return () => {
      if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
    };
  }, [mode, visible]);

  if (!visible && mode !== 'offline') return null;

  return (
    <div
      className={`${styles.banner} ${visible ? styles.enter : styles.exit} ${recovering ? styles.recovering : ''}`}
      role="status"
      aria-live="polite"
      aria-label={recovering ? 'Connexion retablie' : 'Mode resilient actif'}
    >
      <div className={styles.inner}>
        <div className={styles.iconWrap} aria-hidden="true">
          {recovering ? (
            <RefreshCw size={16} className={styles.spinIcon} />
          ) : (
            <WifiOff size={16} />
          )}
        </div>

        <div className={styles.content}>
          {recovering ? (
            <>
              <span className={styles.titleRecovering}>
                <Wifi size={13} aria-hidden="true" />
                Connexion retablie — Synchronisation en cours
              </span>
              <span className={styles.sub}>
                Vos modifications locales sont en cours de transfert vers le serveur.
              </span>
            </>
          ) : (
            <>
              <span className={styles.title}>
                <ShieldAlert size={13} aria-hidden="true" />
                Mode resilient active
              </span>
              <span className={styles.sub}>
                Vos donnees et modifications sont enregistrees localement en securite
                et seront synchronisees automatiquement des le retour du reseau.
              </span>
            </>
          )}
        </div>

        {lastChecked && (
          <span className={styles.timestamp} aria-label="Derniere verification">
            {lastChecked.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
