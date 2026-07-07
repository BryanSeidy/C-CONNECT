'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { getSafeRedirect } from '@/lib/routing';

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = getSafeRedirect(params.get('redirect'));
  const registered = params.get('registered') === 'true';
  const emailVerification = params.get('email_verification');

  const alternateHref =
    redirect === '/dashboard'
      ? '/register'
      : `/register?redirect=${encodeURIComponent(redirect)}`;

  const successMessage = registered
    ? 'Compte créé avec succès. Connectez-vous pour continuer.'
    : emailVerification === 'success'
      ? 'Email vérifié avec succès. Vous pouvez vous connecter.'
      : undefined;

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
          await login(email, password);
          router.push(redirect);
        }}
      />
      {emailVerification === 'invalid' && (
        <p style={{ textAlign: 'center', color: '#dc2626', fontSize: '0.875rem', marginTop: '-1rem' }}>
          Ce lien de vérification est invalide ou a expiré.
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
