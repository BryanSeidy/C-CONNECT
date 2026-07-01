 import Link from 'next/link';
 import { usePathname } from 'next/navigation';
import {
  BarChart3, Building2, CalendarClock, ClipboardList,
  HandCoins, Home, LogOut, Package, Settings,
  ShieldAlert, ShieldCheck, Truck, UserCog,
} from 'lucide-react';
 import { useAuth } from '@/hooks/useAuth';
 import styles from './Sidebar.module.css';
 
// ── Nav config par rôle ──────────────────────────────────────────────────────

const BUYER_LINKS = [
  { href: '/dashboard',            label: 'Vue générale',    Icon: Home },
  { href: '/dashboard/rfqs',       label: 'Mes RFQs',        Icon: ClipboardList },
  { href: '/dashboard/orders',     label: 'Commandes',       Icon: Truck },
  { href: '/dashboard/recurring',  label: 'Récurrentes',     Icon: CalendarClock },
  { href: '/dashboard/disputes',   label: 'Litiges',         Icon: ShieldAlert },
  { href: '/dashboard/company',    label: 'Mon entreprise',  Icon: Building2 },
];

const SELLER_LINKS = [
  { href: '/dashboard',            label: 'Vue générale',    Icon: Home },
  { href: '/dashboard/products',   label: 'Mes produits',    Icon: Package },
  { href: '/dashboard/orders',     label: 'Commandes',       Icon: Truck },
  { href: '/dashboard/rfqs',       label: 'Appels d\'offres', Icon: ClipboardList },
  { href: '/dashboard/negotiations',label: 'Négociations',   Icon: HandCoins },
  { href: '/dashboard/disputes',   label: 'Litiges',         Icon: ShieldAlert },
  { href: '/dashboard/company',    label: 'Mon entreprise',  Icon: Building2 },
];

const ADMIN_LINKS = [
  { href: '/dashboard',            label: 'Vue générale',    Icon: Home },
  { href: '/dashboard/admin/companies', label: 'Entreprises KYB', Icon: ShieldCheck },
  { href: '/dashboard/admin/disputes',  label: 'Arbitrages',      Icon: ShieldAlert },
  { href: '/dashboard/admin/stats',     label: 'Statistiques',    Icon: BarChart3 },
  { href: '/dashboard/admin/users',     label: 'Utilisateurs',    Icon: UserCog },
];

const BOTTOM_LINKS = [
  { href: '/profile',              label: 'Paramètres',      Icon: Settings },
];

// ── Component ────────────────────────────────────────────────────────────────

 export const Sidebar = () => {
   const pathname = usePathname();
  const { user, logout } = useAuth();
 
  const links = user?.role === 'admin'
    ? ADMIN_LINKS
    : user?.role === 'seller'
      ? SELLER_LINKS
      : BUYER_LINKS;
 
  const initials = (user?.fullName ?? user?.email ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
 
   return (
    <aside className={styles.sidebar} aria-label="Navigation principale">

       <nav className={styles.nav}>
        <p className={styles.sectionLabel}>Menu</p>
         <ul className={styles.list}>
          {links.map(({ href, label, Icon }) => {
            const exact  = href === '/dashboard';
            const active = exact ? pathname === href : pathname.startsWith(href);
             return (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.link} ${active ? styles.active : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={17} className={styles.icon} aria-hidden="true" />
                  {label}
                  {user?.role === 'admin' && label === 'Arbitrages' && (
                    <span className={styles.rolePill} style={{background:'rgba(192,57,43,0.2)',color:'#E57373'}}>!</span>
                  )}
                 </Link>
               </li>
             );
           })}
         </ul>

        <div className={styles.divider} aria-hidden="true" />

        <ul className={styles.list}>
          {BOTTOM_LINKS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.link} ${active ? styles.active : ''}`}
                >
                  <Icon size={17} className={styles.icon} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={logout}
              className={styles.link}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}
            >
              <LogOut size={17} className={styles.icon} aria-hidden="true" />
              Déconnexion
            </button>
          </li>
        </ul>
       </nav>
 
      {/* User footer */}
      <footer className={styles.footer}>
         <div className={styles.userCard}>
          <div className={styles.avatar} aria-hidden="true">{initials}</div>
           <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.fullName ?? user?.email}</span>
            <span className={styles.userRole}>{user?.role}</span>
           </div>
          {user?.role && (
            <span className={`${styles.rolePill} ${user.role === 'admin' ? styles.rolePillAdmin : ''}`}>
              {user.role}
            </span>
          )}
         </div>
      </footer>
     </aside>
   );
 };
