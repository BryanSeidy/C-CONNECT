'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/#comment-ca-marche', label: 'Fonctionnement' },
  { href: '/about', label: 'À propos' },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Sur les pages dashboard, la navbar est masquée (le layout dashboard a sa propre topbar)
  if (isDashboard) return null;

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        {/* Brand */}
        <Link href="/" className={styles.brand} aria-label="C-Connect — Accueil">
          <Image
            src="/brand/icon-color.png"
            alt=""
            width={34}
            height={34}
            className={styles.logoMark}
            priority
          />
          <span className={styles.brandName}>C-Connect</span>
        </Link>

        {/* Nav links — desktop */}
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

        {/* Auth — desktop */}
        <div className={styles.authGroup}>
          <Link href="/cart" className={styles.cartLink} aria-label={`Panier${itemCount > 0 ? ` (${itemCount} article${itemCount > 1 ? 's' : ''})` : ''}`}>
            <ShoppingCart size={20} aria-hidden="true" />
            {itemCount > 0 && <span className={styles.cartBadge}>{itemCount > 99 ? '99+' : itemCount}</span>}
          </Link>
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

        {/* Mobile menu toggle */}
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className={styles.mobilePanel}>
          <nav className={styles.mobileLinks} aria-label="Navigation mobile">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.mobileLink} ${pathname === href ? styles.active : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className={styles.mobileAuth}>
            <Link href="/cart" className={styles.mobileCartLink}>
              <ShoppingCart size={18} aria-hidden="true" />
              Panier{itemCount > 0 ? ` (${itemCount})` : ''}
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className={styles.dashBtn}>Mon espace</Link>
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
      )}
    </header>
  );
};
