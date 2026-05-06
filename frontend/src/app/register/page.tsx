'use client';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  
  return (
    <AuthForm 
      type="register"
      title="Rejoindre le réseau"
      subtitle="Accélérez votre croissance sur le marché CEMAC."
      submitText="Créer mon compte"
      withRole={true}
      onSubmit={async (email, password, role) => {
        await register(email, password, role);
        window.location.href = '/login';
      }}
    />
  );
}
