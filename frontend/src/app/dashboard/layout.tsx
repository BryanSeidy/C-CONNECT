'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import styles from './Layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const title = user?.role === 'seller' ? 'Dashboard Vendeur' : 'Dashboard Client';

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <div className={styles.dashboardHeader}>
          <h1 className={styles.pageTitle}>{title}</h1>
        </div>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
