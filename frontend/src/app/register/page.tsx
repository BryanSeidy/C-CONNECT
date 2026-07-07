'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { getSafeRedirect } from '@/lib/routing';

function RegisterContent() {
  const { register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = getSafeRedirect(params.get('redirect'));
  const requestedRole = params.get('role') === 'seller' ? 'seller' : 'buyer';

  const loginUrl = redirect === '/dashboard'
    ? '/login?registered=true'
    : `/login?registered=true&redirect=${encodeURIComponent(redirect)}`;

  const alternateHref =
    redirect === '/dashboard'
      ? '/login'
      : `/login?redirect=${encodeURIComponent(redirect)}`;

  return (
    <AuthForm
      type="register"
      title="Rejoindre le réseau"
      subtitle="Connectez producteurs et acheteurs professionnels au Cameroun."
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
