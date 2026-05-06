'use client';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  
  return (
    <AuthForm 
      type="login"
      title="Bon retour !"
      subtitle="Connectez-vous pour accéder à votre espace."
      submitText="Se Connecter"
      onSubmit={async (email, password) => {
        await login(email, password);
        window.location.href = '/dashboard';
      }}
    />
  );
}
