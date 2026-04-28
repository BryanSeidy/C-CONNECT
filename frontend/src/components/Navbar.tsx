'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-xl text-green-700">
        CEMAC Connect
      </Link>
      <div className="flex gap-4 items-center">
        <Link href="/marketplace">Marketplace</Link>
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <button className="text-red-600" onClick={logout}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Connexion</Link>
            <Link href="/register">Inscription</Link>
          </>
        )}
      </div>
    </nav>
  );
};
