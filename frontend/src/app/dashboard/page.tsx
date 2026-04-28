'use client';

import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-6">
      <Sidebar />
      <section className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-4">Bienvenue {user?.email ?? 'invité'}.</p>
        <p>Role: {user?.role ?? 'N/A'}</p>
      </section>
    </div>
  );
}
