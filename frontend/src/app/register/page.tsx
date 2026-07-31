'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { getSafeRedirect } from '@/lib/routing';

function RegisterContent() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = getSafeRedirect(params.get('redirect'));
  const requestedRole = params.get('role') === 'seller' ? 'seller' : 'buyer';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirect);
    }
  }, [isLoading, isAuthenticated, redirect, router]);

  const loginUrl = redirect === '/dashboard'
    ? '/login?registered=true'
    : `/login?registered=true&redirect=${encodeURIComponent(redirect)}`;

  const alternateHref =
    redirect === '/dashboard'
      ? '/login'
      : `/login?redirect=${encodeURIComponent(redirect)}`;

  const copy = requestedRole === 'seller'
    ? {
        title: 'Vendez à des acheteurs professionnels',
        subtitle: 'Publiez votre catalogue et soyez payé en toute sécurité, dès la première commande.',
      }
    : {
        title: 'Trouvez vos fournisseurs vérifiés',
        subtitle: 'Sourcing fiable, paiement protégé en séquestre, facture automatique à chaque commande.',
      };

  return (
    <AuthForm
      type="register"
      title={copy.title}
      subtitle={copy.subtitle}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
