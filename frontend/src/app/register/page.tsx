'use client';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [redirect, setRedirect] = useState('/dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('redirect');
    if (next) setRedirect(next);
  }, []);

  return (
    <AuthForm
      type="register"
      title="Rejoindre le réseau"
      subtitle="Accélérez votre croissance sur le marché Camerounais."
      submitText="Créer mon compte"
      onSubmit={async (email, password, fullName, role) => {
        await register(email, password, fullName, role);
        router.push('/login?registered=true');
      }}
    />
  );
}
