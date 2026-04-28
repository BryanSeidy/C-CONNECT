'use client';

import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <section className="bg-white p-6 rounded-xl shadow max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Mon profil</h1>
      <p><strong>Email:</strong> {user?.email ?? 'Non connecté'}</p>
      <p><strong>Rôle:</strong> {user?.role ?? 'N/A'}</p>
    </section>
  );
}
