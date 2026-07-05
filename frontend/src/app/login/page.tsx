'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { getSafeRedirect } from '@/lib/routing';

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = getSafeRedirect(params.get('redirect'));
  const registered = params.get('registered') === 'true';

  const alternateHref =
    redirect === '/dashboard'
      ? '/auth/register'
      : `/auth/register?redirect=${encodeURIComponent(redirect)}`;

  return (
    <AuthForm
      type="login"
      title="Bon retour !"
      subtitle="Connectez-vous pour accéder à votre espace C-Connect."
      submitText="Se connecter"
      alternateHref={alternateHref}
      successMessage={
        registered
          ? 'Compte créé avec succès. Connectez-vous pour continuer.'
          : undefined
      }
      onSubmit={async (email, password) => {
        await login(email, password);
        router.push(redirect);
      }}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
