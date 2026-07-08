'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './error.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Observability hook: replace with a real logging service (Sentry, etc.)
    // when one is wired up. Kept minimal here to avoid leaking details to users.
    console.error('[C-Connect] Unhandled route error:', error);
  }, [error]);

  return (
    <div className={styles.wrapper}>
      <AlertTriangle className={styles.icon} size={40} aria-hidden="true" />
      <h2 className={styles.title}>Une erreur est survenue</h2>
      <p className={styles.message}>
        Quelque chose s&apos;est mal passé de notre côté. Vous pouvez réessayer,
        et si le problème persiste, revenez un peu plus tard.
      </p>
      <div className={styles.actions}>
        <Button variant="primary" onClick={() => reset()}>
          Réessayer
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  );
}
