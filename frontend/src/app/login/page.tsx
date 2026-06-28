'use client';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { getSafeRedirect } from '@/lib/routing';

export default function LoginPage() {
  const { login } = useAuth();
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const redirect = getSafeRedirect(params?.get('redirect') ?? null);
  const alternateHref = useMemo(() => (
    redirect === '/dashboard' ? '/register' : `/register?redirect=${encodeURIComponent(redirect)}`
  ), [redirect]);
  const successMessage = params?.get('registered') === 'true'
    ? 'Compte créé avec succès. Connectez-vous pour continuer.'
    : undefined;

  return (
    <AuthForm
      type="login"
      title="Bon retour !"
      subtitle="Connectez-vous pour accéder à votre espace."
      submitText="Se Connecter"
      alternateHref={alternateHref}
      successMessage={successMessage}
      onSubmit={async (email, password) => {
        await login(email, password);
        window.location.href = redirect;
      }}
    />
  );
}
