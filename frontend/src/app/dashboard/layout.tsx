'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
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
  const { user } = useAuth();
  const pathname = usePathname();
  const pageLabel = PAGE_LABELS[pathname] ?? 'Dashboard';

  return (
    <div className={styles.shell}>
      <Sidebar />

      <div className={styles.mainWrapper}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
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

          {children}
        </main>
      </div>
    </div>
  );
}
