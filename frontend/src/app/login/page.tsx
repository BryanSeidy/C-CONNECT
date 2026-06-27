'use client';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { login } = useAuth();
  const [redirect, setRedirect] = useState('/dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('redirect');
    if (next) setRedirect(next);
  }, []);

  return (
    <AuthForm
      type="login"
      title="Bon retour !"
      subtitle="Connectez-vous pour accéder à votre espace."
      submitText="Se Connecter"
      onSubmit={async (email, password) => {
        await login(email, password);
        window.location.href = redirect;
      }}
    />
  );
}
