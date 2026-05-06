import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import styles from './Layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <div className={styles.dashboardHeader}>
          <h1 className={styles.pageTitle}>Dashboard Entreprise</h1>
        </div>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
