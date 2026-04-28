'use client';

import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  return (
    <div className="flex justify-center pt-16">
      <AuthForm
        title="Inscription"
        submitText="Créer mon compte"
        withRole
        onSubmit={async (email, password, role) => {
          await register(email, password, role);
          router.push('/login');
        }}
      />
    </div>
  );
}
