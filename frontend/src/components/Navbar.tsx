'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/#comment-ca-marche', label: 'Fonctionnement' },
  { href: '/about', label: 'À propos' },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  // Sur les pages dashboard, la navbar est masquée (le layout dashboard a sa propre topbar)
  if (isDashboard) return null;

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        {/* Brand */}
        <Link href="/" className={styles.brand} aria-label="C-Connect — Accueil">
          <div className={styles.logoMark} aria-hidden="true">C</div>
          <span className={styles.brandName}>C-Connect</span>
        </Link>

        {/* Nav links */}
        <nav className={styles.navLinks} aria-label="Navigation principale">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.link} ${pathname === href ? styles.active : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className={styles.authGroup}>
          {user ? (
            <>
              <Link href="/dashboard" className={styles.dashBtn}>
                Mon espace
              </Link>
              <button type="button" onClick={logout} className={styles.ghostBtn}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.ghostBtn}>Connexion</Link>
              <Link href="/register" className={styles.primaryBtn}>S&apos;inscrire</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
