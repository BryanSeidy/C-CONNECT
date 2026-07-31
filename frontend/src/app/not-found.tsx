import Link from 'next/link';
import { Compass } from 'lucide-react';
import styles from './error.module.css';

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <Compass size={40} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
      <h1 className={styles.title}>Page introuvable</h1>
      <p className={styles.message}>
        Cette page n&apos;existe pas ou plus. Vérifiez le lien, ou repartez depuis un point connu.
      </p>
      <div className={styles.actions}>
        <Link href="/" className="link-as-button">
          <span style={{
            display: 'inline-block',
            padding: '10px 20px',
            borderRadius: 8,
            background: 'var(--primary-color, #13352E)',
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Accueil
          </span>
        </Link>
        <Link href="/marketplace">
          <span style={{
            display: 'inline-block',
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid var(--border-color, #D9D2C4)',
            color: 'var(--text-main)',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Explorer le marketplace
          </span>
        </Link>
      </div>
    </div>
  );
}
