import Link from 'next/link';
import styles from './Footer.module.css';

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <h3 className={styles.brandTitle}>CEMAC Connect</h3>
            <p className={styles.brandDesc}>
              La plateforme B2B de confiance propulsant les échanges agricoles et industriels dans l'espace CEMAC.
            </p>
          </div>
          
          <div className={styles.linksCol}>
            <h4 className={styles.linksTitle}>Navigation</h4>
            <ul className={styles.list}>
              <li><Link href="/" className={styles.link}>Accueil</Link></li>
              <li><Link href="/marketplace" className={styles.link}>Marketplace</Link></li>
              <li><Link href="/about" className={styles.link}>À Propos</Link></li>
            </ul>
          </div>

          <div className={styles.linksCol}>
            <h4 className={styles.linksTitle}>Légal & Aide</h4>
            <ul className={styles.list}>
              <li><Link href="/about" className={styles.link}>Mentions Légales</Link></li>
              <li><Link href="/about" className={styles.link}>Conditions d'Escrow</Link></li>
              <li><a href="mailto:contact@cemac-connect.com" className={styles.link}>Support B2B</a></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.bottom}>
          <p>&copy; {new Date().getFullYear()} CEMAC Connect. Projet de Licence Technologique B2B.</p>
        </div>
      </div>
    </footer>
  );
};
