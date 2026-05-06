'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import styles from './Navbar.module.css';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className={`glass-panel ${styles.navbar}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <div className={styles.logoMark}>C</div>
          <span className={styles.brandName}>CEMAC Connect</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.link}>Accueil</Link>
          <Link href="/marketplace" className={styles.link}>Marketplace</Link>
          <Link href="/about" className={styles.link}>À Propos</Link>
          {user ? (
            <>
              <Link href="/dashboard" className={styles.link}>Dashboard</Link>
              <button className={`${styles.link} ${styles.danger}`} onClick={logout}>
                Déconnexion
              </button>
            </>
          ) : (
            <div className={styles.authGroup}>
              <Link href="/login" className={styles.loginBtn}>Connexion</Link>
              <Link href="/register" className={styles.registerBtn}>S'inscrire</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
