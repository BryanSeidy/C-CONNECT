'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AuthForm } from '@/components/AuthForm';
import { getSafeRedirect } from '@/lib/routing';
import styles from '@/components/AuthForm.module.css';

function LoginContent() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = getSafeRedirect(params.get('redirect'));
  const registered = params.get('registered') === 'true';
  const emailVerification = params.get('email_verification');
  const socialError = params.get('social_error');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Déjà connecté (token + user) — renvoyer vers la destination sans
  // réafficher le formulaire. isAuthenticated exige désormais un Bearer.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setIsRedirecting(true);
      router.replace(redirect);
    }
  }, [isLoading, isAuthenticated, redirect, router]);

  const alternateHref =
    redirect === '/dashboard'
      ? '/register'
      : `/register?redirect=${encodeURIComponent(redirect)}`;

  const successMessage = registered
    ? 'Compte créé avec succès. Connectez-vous pour continuer.'
    : emailVerification === 'success'
      ? 'Email vérifié avec succès. Vous pouvez vous connecter.'
      : undefined;

  if (isLoading || isRedirecting || isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.card} style={{ textAlign: 'center' }}>
          <Loader2 size={28} className={styles.spinner} aria-hidden="true" style={{ margin: '0 auto 1rem' }} />
          <p>Redirection…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthForm
        type="login"
        title="Bon retour !"
        subtitle="Connectez-vous pour accéder à votre espace C-Connect."
        submitText="Se connecter"
        alternateHref={alternateHref}
        successMessage={successMessage}
        onSubmit={async (email, password) => {
          // login() pose le token en mémoire AVANT de résoudre — le premier
          // fetch dashboard aura donc le header Authorization.
          await login(email, password);
          setIsRedirecting(true);
          router.replace(redirect);
        }}
      />
      {emailVerification === 'invalid' && (
        <p style={{ textAlign: 'center', color: '#dc2626', fontSize: '0.875rem', marginTop: '-1rem' }}>
          Ce lien de vérification est invalide ou a expiré.
        </p>
      )}
      {socialError && (
        <p role="alert" style={{ textAlign: 'center', color: '#dc2626', fontSize: '0.875rem', marginTop: '-1rem' }}>
          {socialError}
        </p>
      )}
      <p style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <Link href="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--primary-color)' }}>
          Mot de passe oublié ?
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
