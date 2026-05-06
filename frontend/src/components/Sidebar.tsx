'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FcHome, FcPackage, FcInTransit, FcBusinessman } from 'react-icons/fc';
import styles from './Sidebar.module.css';

export const Sidebar = () => {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Vue Générale', Icon: FcHome },
    { href: '/dashboard/products', label: 'Mes Produits', Icon: FcPackage },
    { href: '/dashboard/orders', label: 'Commandes', Icon: FcInTransit },
  ];

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
            <FcBusinessman size={36} />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Géraldine</span>
            <span className={styles.userRole}>Vendeur / Acheteur</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
