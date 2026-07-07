'use client';

import React, { useState } from 'react';
import { MailWarning, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth';
import styles from './VerifyEmailBanner.module.css';

export function VerifyEmailBanner() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await authService.resendVerificationEmail();
      setSent(true);
    } catch {
      // Silencieux : on ne bloque pas l'utilisateur pour un renvoi raté, il peut réessayer.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.banner} role="status">
      <MailWarning size={18} aria-hidden="true" className={styles.icon} />
      <span className={styles.text}>
        {sent
          ? "Email de vérification renvoyé. Vérifiez votre boîte de réception."
          : "Votre adresse email n'est pas encore vérifiée."}
      </span>
      {!sent && (
        <button type="button" className={styles.action} onClick={handleResend} disabled={sending}>
          {sending ? <Loader2 size={14} className={styles.spin} aria-hidden="true" /> : 'Renvoyer le lien'}
        </button>
      )}
      <button type="button" className={styles.dismiss} onClick={() => setDismissed(true)} aria-label="Fermer">
        ×
      </button>
    </div>
  );
}
