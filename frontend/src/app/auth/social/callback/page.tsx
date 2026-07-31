'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { setMemoryToken } from '@/services/api';
import styles from '@/components/AuthForm.module.css';

export default function SocialAuthCallbackPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Le backend redirige ici avec #token=... (fragment d'URL : jamais envoyé
    // au serveur, donc jamais logué contrairement à une query string).
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const token = new URLSearchParams(hash).get('token');

    if (!token) {
      setFailed(true);
      return;
    }

    setMemoryToken(token);
    // Nettoie le fragment de l'URL visible (le token ne doit pas rester
    // dans l'historique du navigateur plus longtemps que nécessaire).
    window.history.replaceState(null, '', '/auth/social/callback');

    refreshProfile().finally(() => {
      router.replace('/dashboard');
    });
  }, [refreshProfile, router]);

  useEffect(() => {
    if (failed) {
      router.replace('/login?social_error=' + encodeURIComponent("Connexion Google incomplète. Réessayez."));
    }
  }, [failed, router]);

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ textAlign: 'center' }}>
        <Loader2 size={28} className={styles.spinner} aria-hidden="true" style={{ margin: '0 auto 1rem' }} />
        <p>Connexion en cours…</p>
      </div>
    </div>
  );
}
