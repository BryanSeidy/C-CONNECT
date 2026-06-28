import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Gauge, HandCoins, Leaf, ShieldCheck, Signal } from 'lucide-react';
import { Footer } from '@/components/Footer';
import styles from './Home.module.css';

const featuredProducts = [
  {
    name: 'Poivre Blanc de Penja',
    region: 'Littoral, appellation Penja',
    price: '18 500 XAF',
    color: 'linear-gradient(135deg, #111827, #9ca3af)',
  },
  {
    name: 'Sac en Cuir Artisanal de Maroua',
    region: 'Extrême-Nord, atelier Maroua',
    price: '42 000 XAF',
    color: 'linear-gradient(135deg, #7c2d12, #f59e0b)',
  },
  {
    name: 'Café Arabica du Muanenguba',
    region: 'Sud-Ouest, Mont Muanenguba',
    price: '12 900 XAF',
    color: 'linear-gradient(135deg, #3f2416, #16a34a)',
  },
];

const mechanics = [
  {
    title: 'Séquestre Transférable Mobile Money (Escrow)',
    description: 'Les fonds sont sécurisés pendant la transaction, puis libérés au vendeur après confirmation afin de protéger chaque partie.',
    Icon: ShieldCheck,
  },
  {
    title: 'Indicateurs d’Impact Éthique & Féminin',
    description: 'Les acheteurs identifient rapidement les producteurs locaux, les entreprises vérifiées et les initiatives à fort impact social.',
    Icon: Leaf,
  },
  {
    title: 'Optimisation Performance Low-Data (WebP/Caching)',
    description: 'La marketplace reste rapide, légère et exploitable sur réseaux contraints grâce à une expérience pensée pour le terrain.',
    Icon: Signal,
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <BadgeCheck size={16} aria-hidden="true" />
              Infrastructure B2B Made in Cameroon
            </span>
            <h1 className={styles.title}>
              Le commerce camerounais, <span className={styles.gradientText}>vérifié et fluide</span>.
            </h1>
            <p className={styles.subtitle}>
              C-CONNECT relie acheteurs professionnels, producteurs certifiés et artisans premium dans une marketplace nationale conçue pour la confiance, la liquidité et la croissance locale.
            </p>
            <div className={styles.actions}>
              <Link href="/marketplace" className={styles.primaryCta}>
                Explorer la Marketplace
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/register?role=seller" className={styles.secondaryCta}>
                Devenir Vendeur
              </Link>
            </div>
            <div className={styles.trustStrip} aria-label="Indicateurs de plateforme">
              <div className={styles.trustItem}>
                <span className={styles.trustValue}>10</span>
                <span className={styles.trustLabel}>régions commerciales couvertes</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustValue}>B2B</span>
                <span className={styles.trustLabel}>transactions structurées et traçables</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustValue}>Low-data</span>
                <span className={styles.trustLabel}>expérience rapide sur réseaux contraints</span>
              </div>
            </div>
          </div>

          <aside className={styles.showcase} aria-label="Aperçu marketplace C-CONNECT">
            <div className={styles.showcaseHeader}>
              <span>Marketplace vérifiée</span>
              <span className={styles.pulse} aria-hidden="true" />
            </div>
            <div className={styles.productGrid}>
              {featuredProducts.map((product, index) => (
                <article className={styles.productCard} key={product.name} style={{ animationDelay: `${index * 90}ms` }}>
                  <div className={styles.productThumb} aria-hidden="true">
                    <div className={styles.productThumbInner} style={{ '--item-color': product.color } as CSSProperties} />
                  </div>
                  <div>
                    <h2 className={styles.productName}>{product.name}</h2>
                    <p className={styles.productMeta}>{product.region}</p>
                  </div>
                  <strong className={styles.productPrice}>{product.price}</strong>
                </article>
              ))}
            </div>
            <div className={styles.skeletonRail} aria-hidden="true">
              <span className={styles.skeleton} />
              <span className={styles.skeleton} />
              <span className={styles.skeleton} />
            </div>
          </aside>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Une plateforme pensée pour vendre, sécuriser et mesurer l’impact.</h2>
            <p>
              Chaque mécanique produit renforce la conversion, réduit le risque opérationnel et rend le commerce local plus lisible pour les acheteurs professionnels.
            </p>
          </div>
          <div className={styles.mechanicsGrid}>
            {mechanics.map(({ title, description, Icon }) => (
              <article className={styles.mechanicCard} key={title}>
                <span className={styles.iconBox}>
                  <Icon size={22} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Des opérations conçues pour la performance terrain.</h2>
            <p>
              C-CONNECT réunit catalogue, négociation, paiement sécurisé et suivi vendeur dans un parcours unique, rapide à adopter et prêt pour le passage à l’échelle.
            </p>
          </div>
          <div className={styles.mechanicsGrid}>
            <article className={styles.mechanicCard}>
              <span className={styles.iconBox}><HandCoins size={22} aria-hidden="true" /></span>
              <h3>Liquidité transactionnelle</h3>
              <p>Des flux d’achat mieux encadrés, de la découverte au paiement, pour réduire les frictions entre régions.</p>
            </article>
            <article className={styles.mechanicCard}>
              <span className={styles.iconBox}><Gauge size={22} aria-hidden="true" /></span>
              <h3>Pilotage vendeur</h3>
              <p>Les vendeurs suivent leurs offres, commandes et signaux de performance depuis un espace centralisé.</p>
            </article>
            <article className={styles.mechanicCard}>
              <span className={styles.iconBox}><BadgeCheck size={22} aria-hidden="true" /></span>
              <h3>Confiance vérifiable</h3>
              <p>La mise en avant des profils vérifiés soutient une marketplace plus fiable et plus attractive.</p>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
