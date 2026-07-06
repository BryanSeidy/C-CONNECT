'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  /** Rôles autorisés à voir le contenu */
  allowedRoles: UserRole[];
  /** Fallback affiché pendant le chargement */
  fallback?: React.ReactNode;
  /** Composant affiché si l'accès est refusé (par défaut : redirection) */
  denied?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * RoleGuard — protège un sous-arbre React selon le rôle de l'utilisateur.
 *
 * Usage dans un layout ou une page :
 *   <RoleGuard allowedRoles={['admin']}>
 *     <AdminPanel />
 *   </RoleGuard>
 */
export function RoleGuard({ allowedRoles, fallback, denied, children }: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return fallback ? <>{fallback}</> : <LoadingShell />;
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
    return null;
  }

  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    return denied ? <>{denied}</> : <AccessDenied />;
  }

  return <>{children}</>;
}

function LoadingShell() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      color: 'var(--text-muted)',
      fontSize: '0.875rem',
    }}>
      Chargement en cours…
    </div>
  );
}

function AccessDenied() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '0.75rem',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'var(--error-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--error)',
        fontSize: '1.25rem',
        fontWeight: 700,
      }}>
        403
      </div>
      <h2 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.125rem' }}>
        Accès non autorisé
      </h2>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 360 }}>
        Vous ne disposez pas des droits nécessaires pour accéder à cette section.
      </p>
    </div>
  );
}
