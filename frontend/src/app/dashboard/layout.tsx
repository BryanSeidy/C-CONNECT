'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Loader2, Menu, Search, ShieldOff } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { VerifyEmailBanner } from '@/components/VerifyEmailBanner';
import { useAuth } from '@/hooks/useAuth';
import styles from './Layout.module.css';

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':              'Vue générale',
  '/dashboard/rfqs':         'Demandes de devis',
  '/dashboard/orders':       'Commandes',
  '/dashboard/recurring':    'Commandes récurrentes',
  '/dashboard/disputes':     'Litiges',
  '/dashboard/company':      'Profil entreprise',
  '/dashboard/products':     'Mes produits',
  '/dashboard/products/add': 'Ajouter un produit',
  '/dashboard/negotiations': 'Négociations',
  '/dashboard/admin/companies': 'Validation KYB',
  '/dashboard/admin/disputes':  'Arbitrages',
  '/dashboard/admin/stats':     'Statistiques',
  '/dashboard/admin/users':     'Utilisateurs',
};

const ROLE_LABELS: Record<string, string> = {
  buyer:  'Acheteur B2B',
  seller: 'Fournisseur',
  admin:  'Administrateur',
};

function ForbiddenNotice() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '0.75rem',
      padding: '4rem 1.5rem',
    }}>
      <ShieldOff size={40} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
      <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--primary-color)' }}>
        Accès réservé aux administrateurs
      </h2>
      <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: 400 }}>
        Cette section est réservée à l&apos;équipe C-Connect. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez le support.
      </p>
      <Link
        href="/dashboard"
        style={{ marginTop: '0.5rem', color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}
      >
        Retour à mon tableau de bord
      </Link>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const pageLabel = PAGE_LABELS[pathname] ?? 'Dashboard';

  // Pages réellement imbriquées (2 niveaux sous /dashboard) : on affiche le
  // niveau intermédiaire dans le fil d'Ariane, cliquable quand une page
  // existe pour ce niveau. 'admin' n'a pas de page propre — libellé simple.
  const parentCrumb: { label: string; href?: string } | null = (() => {
    if (pathname === '/dashboard/products/add') {
      return { label: PAGE_LABELS['/dashboard/products'], href: '/dashboard/products' };
    }
    if (pathname.startsWith('/dashboard/admin/') && pathname !== '/dashboard/admin') {
      return { label: 'Administration' };
    }
    return null;
  })();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Garde d'authentification côté client — seule source de vérité fiable :
  // le cookie de session Sanctum est httpOnly et ne prouve rien depuis
  // l'edge (voir la suppression de middleware.ts). On attend la résolution
  // de /auth/me (isLoading) avant de trancher, pour éviter un redirect
  // prématuré au premier rendu.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const isAdminRoute = pathname.startsWith('/dashboard/admin');
  const isForbidden = isAuthenticated && isAdminRoute && user?.role !== 'admin';

  if (isLoading) {
    return (
      <div className={styles.authLoading}>
        <Loader2 size={28} className={styles.authLoadingSpinner} aria-hidden="true" />
        <p>Chargement de votre espace…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Le useEffect ci-dessus déclenche déjà la redirection ; on n'affiche
    // rien pour éviter un flash de contenu protégé.
    return null;
  }

  return (
    <div className={styles.shell}>
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className={styles.mainWrapper}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <span>C-Connect</span>
            <span aria-hidden="true">›</span>
            {parentCrumb && (
              <>
                {parentCrumb.href ? (
                  <Link href={parentCrumb.href} className={styles.breadcrumbLink}>
                    {parentCrumb.label}
                  </Link>
                ) : (
                  <span>{parentCrumb.label}</span>
                )}
                <span aria-hidden="true">›</span>
              </>
            )}
            <strong>{pageLabel}</strong>
          </div>

          <div className={styles.topbarRight}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Rechercher un produit"
              onClick={() => router.push('/marketplace')}
            >
              <Search size={18} aria-hidden="true" />
            </button>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Notifications"
                aria-expanded={notifOpen}
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Bell size={18} aria-hidden="true" />
              </button>
              {notifOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 0.5rem)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle, #E2E8F0)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    padding: '1rem',
                    width: '260px',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    zIndex: 20,
                  }}
                >
                  Aucune notification pour le moment.
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className={styles.content} id="main-content">
          {/* Page header dynamique */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>{pageLabel}</h1>
              {user && (
                <p className={styles.pageSubtitle}>
                  {ROLE_LABELS[user.role] ?? user.role} — {user.fullName ?? user.email}
                </p>
              )}
            </div>
          </div>

          {user && !user.email_verified_at && <VerifyEmailBanner />}

          {isForbidden ? <ForbiddenNotice /> : children}
        </main>
      </div>
    </div>
  );
}
