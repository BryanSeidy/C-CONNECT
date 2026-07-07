'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Loader2, Menu, Search } from 'lucide-react';
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const pageLabel = PAGE_LABELS[pathname] ?? 'Dashboard';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
            <strong>{pageLabel}</strong>
          </div>

          <div className={styles.topbarRight}>
            <button type="button" className={styles.iconBtn} aria-label="Recherche">
              <Search size={18} aria-hidden="true" />
            </button>
            <button type="button" className={styles.iconBtn} aria-label="Notifications">
              <Bell size={18} aria-hidden="true" />
              <span className={styles.notifDot} aria-hidden="true" />
            </button>
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

          {children}
        </main>
      </div>
    </div>
  );
}
