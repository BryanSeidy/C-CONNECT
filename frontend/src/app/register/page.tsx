'use client';

import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { getSafeRedirect } from '@/lib/routing';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const redirect = getSafeRedirect(params?.get('redirect') ?? null);
  const requestedRole = params?.get('role') === 'seller' ? 'seller' : 'buyer';
  const loginUrl = redirect === '/dashboard'
    ? '/login?registered=true'
    : `/login?registered=true&redirect=${encodeURIComponent(redirect)}`;
  const alternateHref = useMemo(() => (
    redirect === '/dashboard' ? '/login' : `/login?redirect=${encodeURIComponent(redirect)}`
  ), [redirect]);

  return (
    <AuthForm
      type="register"
      title="Rejoindre le réseau"
      subtitle="Accélérez votre croissance sur le marché Camerounais."
      submitText="Créer mon compte"
      alternateHref={alternateHref}
      initialRole={requestedRole}
      onSubmit={async (email, password, fullName, role) => {
        await register(email, password, fullName, role);
        router.push(loginUrl);
      }}
    />
  );
}
