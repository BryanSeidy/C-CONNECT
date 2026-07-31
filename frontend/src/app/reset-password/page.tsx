'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { authService } from '@/services/auth';
import styles from '@/components/AuthForm.module.css';

function extractMessage(error: unknown): string {
  const anyErr = error as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message ?? 'Une erreur est survenue. Réessayez.';
}

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const missingLink = !token || !email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, token, password, passwordConfirmation });
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
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
          <h1 className={styles.title}>Réinitialiser le mot de passe</h1>
          <p className={styles.subtitle}>Choisissez un nouveau mot de passe pour {email || 'votre compte'}.</p>
        </div>

        {missingLink && (
          <div role="alert" className={styles.alertError}>
            Ce lien est invalide ou incomplet. Demandez un nouveau lien de réinitialisation.
          </div>
        )}

        {done && (
          <div role="status" className={styles.alertSuccess}>
            Mot de passe réinitialisé avec succès. Redirection vers la connexion…
          </div>
        )}

        {error && (
          <div role="alert" className={styles.alertError}>
            {error}
          </div>
        )}

        {!missingLink && !done && (
          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="password" className={styles.label}>Nouveau mot de passe</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputPadRight}`}
                  placeholder="Min. 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPwd ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="passwordConfirmation" className={styles.label}>Confirmer le mot de passe</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="passwordConfirmation"
                  type={showPwd ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Retapez le mot de passe"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.submit} disabled={loading} aria-busy={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
                  Réinitialisation…
                </>
              ) : 'Réinitialiser le mot de passe'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
