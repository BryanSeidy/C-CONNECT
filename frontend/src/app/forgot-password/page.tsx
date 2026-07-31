'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Mail } from 'lucide-react';
import { authService } from '@/services/auth';
import styles from '@/components/AuthForm.module.css';

function extractMessage(error: unknown): string {
  const anyErr = error as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message ?? "Impossible d'envoyer le lien pour le moment. Réessayez plus tard.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logoLink} aria-label="C-Connect — Accueil">
            <Image src="/brand/icon-color.png" alt="" width={48} height={48} className={styles.logo} />
          </Link>
          <h1 className={styles.title}>Mot de passe oublié</h1>
          <p className={styles.subtitle}>
            Indiquez votre adresse email, nous vous enverrons un lien de réinitialisation.
          </p>
        </div>

        {sent && (
          <div role="status" className={styles.alertSuccess}>
            Si un compte existe avec cet email, un lien de réinitialisation vient d&apos;être envoyé. Vérifiez votre boîte de réception (et les spams).
          </div>
        )}

        {error && (
          <div role="alert" className={styles.alertError}>
            {error}
          </div>
        )}

        {!sent && (
          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="email" className={styles.label}>Adresse email</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="vous@entreprise.cm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.submit} disabled={loading} aria-busy={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
                  Envoi en cours…
                </>
              ) : 'Envoyer le lien'}
            </button>
          </form>
        )}

        <p className={styles.altLink}>
          <Link href="/login" className={styles.link}>Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
