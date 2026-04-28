'use client';

import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  return (
    <div className="flex justify-center pt-16">
      <AuthForm
        title="Connexion"
        submitText="Se connecter"
        onSubmit={async (email, password) => {
          await login(email, password);
          router.push('/dashboard');
        }}
      />
    </div>
  );
}
