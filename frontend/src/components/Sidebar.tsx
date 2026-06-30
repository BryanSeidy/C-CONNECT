'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Truck, UserRound, HandCoins, ClipboardList, CalendarClock, ShieldAlert, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import styles from './Sidebar.module.css';

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { href: '/dashboard', label: 'Vue Générale', Icon: Home },
    { href: '/dashboard/products', label: 'Mes Produits', Icon: Package },
    { href: '/dashboard/orders', label: 'Commandes', Icon: Truck },
    { href: '/dashboard/rfqs', label: 'Demandes de Devis', Icon: ClipboardList },
    { href: '/dashboard/recurring', label: 'Commandes Récurrentes', Icon: CalendarClock },
    { href: '/dashboard/negotiations', label: 'Négociations & Devis', Icon: HandCoins },
    { href: '/dashboard/disputes', label: 'Litiges', Icon: ShieldAlert },
    { href: '/dashboard/company', label: 'Profil Entreprise', Icon: Building2 },
  ] as const;


  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <p className={styles.category}>Menu Principal</p>
        <ul className={styles.list}>
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link href={link.href} className={`${styles.link} ${isActive ? styles.active : ''}`}>
                  <link.Icon className={styles.icon} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.avatar} style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserRound size={36} aria-hidden="true" />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.fullName || user?.email || 'Utilisateur'}</span>
            <span className={styles.userRole}>{user?.role || 'membre'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
