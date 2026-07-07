import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Handshake,
  MessageSquare,
  PackageCheck,
  Scale,
  ShieldCheck,
  Signal,
  Smartphone,
  Sprout,
  Truck,
  Wallet,
  Wheat,
  XCircle,
} from 'lucide-react';
import { Footer } from '@/components/Footer';
import { EscrowTracker } from '@/components/landing/EscrowTracker';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { FaqAccordion } from '@/components/landing/FaqAccordion';
import styles from './Home.module.css';

const heroChips = [
  { Icon: ShieldCheck, label: 'Paiement protégé par séquestre' },
  { Icon: BadgeCheck, label: 'Entreprises vérifiées' },
  { Icon: Sprout, label: 'Fabriqué au Cameroun' },
];

const trustItems = [
  { value: '100%', label: 'des paiements passent par un séquestre C-Connect' },
  { value: 'KYC', label: 'obligatoire pour chaque entreprise avant publication' },
  { value: '10', label: 'régions du Cameroun couvertes par le réseau' },
  { value: '< 24h', label: 'délai de réponse du support aux litiges' },
];

const painPoints = [
  'Fournisseurs introuvables ou impossibles à vérifier',
  'Argent envoyé avant toute garantie de livraison',
  'Aucune facture, aucune trace pour la comptabilité',
  'Négociations par téléphone, sans suivi ni historique',
];

const solutions = [
  'Un catalogue de fournisseurs vérifiés, filtrable par région et certification',
  'Des fonds bloqués en séquestre jusqu’à confirmation de réception',
  'Une facture professionnelle générée automatiquement à chaque commande',
  'Demandes, négociations et commandes suivies dans un espace unique',
];

const steps = [
  {
    title: 'Publier une demande ou parcourir le catalogue',
    description: 'L’acheteur décrit son besoin — produit, quantité, région — ou consulte directement les profils vérifiés.',
    Icon: ClipboardList,
  },
  {
    title: 'Négocier et confirmer la commande',
    description: 'Prix, quantité et délai sont discutés dans l’espace de négociation, puis validés par les deux parties.',
    Icon: Handshake,
  },
  {
    title: 'Paiement sécurisé en séquestre',
    description: 'L’acheteur règle la commande. C-Connect retient les fonds jusqu’à ce que la livraison soit confirmée.',
    Icon: Wallet,
  },
  {
    title: 'Réception et libération des fonds',
    description: 'L’acheteur confirme la réception ; les fonds sont versés au fournisseur et la facture est archivée.',
    Icon: PackageCheck,
  },
];

const features = [
  { title: 'Vérification KYC des entreprises', description: 'Chaque vendeur est contrôlé avant de pouvoir publier un catalogue.', Icon: ShieldCheck },
  { title: 'Paiement en séquestre', description: 'Mobile Money ou virement professionnel, retenu jusqu’à confirmation.', Icon: Wallet },
  { title: 'Facturation automatique', description: 'Un document professionnel généré pour chaque commande conclue.', Icon: FileText },
  { title: 'Traçabilité régionale', description: 'Origine, région et certification visibles sur chaque profil fournisseur.', Icon: Building2 },
  { title: 'Négociation intégrée', description: 'Échangez sur les prix et délais sans quitter la plateforme.', Icon: MessageSquare },
  { title: 'Pensé pour le terrain', description: 'Interface légère, optimisée pour les réseaux mobiles instables.', Icon: Signal },
];

const buyerBenefits = [
  'Sourcing fiable, sans déplacement ni intermédiaire informel',
  'Commandes récurrentes gérées depuis un seul tableau de bord',
  'Facture et historique disponibles pour chaque achat',
  'Risque de paiement réduit grâce au séquestre',
];

const producerBenefits = [
  'Visibilité directe auprès d’acheteurs professionnels',
  'Paiement garanti après chaque vente confirmée',
  'Un profil vérifié qui valorise qualité et origine',
  'Une expérience simple, pensée pour mobile et Mobile Money',
];

const escrowPillars = [
  { title: 'Vérification', description: 'Aucune entreprise ne publie sans contrôle préalable de son identité et de son activité.', Icon: BadgeCheck },
  { title: 'Séquestre', description: 'Les fonds transitent par C-Connect — jamais directement entre acheteur et vendeur.', Icon: ShieldCheck },
  { title: 'Médiation', description: 'En cas de désaccord, une équipe arbitre avant toute libération ou remboursement.', Icon: Scale },
];

const testimonials = [
  {
    quote: 'Nous recevons désormais des commandes régulières sans avoir à relancer nos acheteurs sur le paiement.',
    name: 'Coopérative agricole',
    role: 'Région de l’Ouest',
  },
  {
    quote: 'Le séquestre nous permet de payer en confiance, même avec un nouveau fournisseur.',
    name: 'Responsable achats',
    role: 'Réseau de supermarchés',
  },
  {
    quote: 'Chaque commande arrive avec une facture. Notre comptabilité n’a jamais été aussi simple.',
    name: 'Restauratrice',
    role: 'Douala',
  },
];

const faqItems = [
  {
    question: 'Comment mes fonds sont-ils protégés ?',
    answer: 'À la commande, votre paiement est retenu par C-Connect dans un compte de séquestre. Il n’est versé au fournisseur qu’après votre confirmation de réception, ou remboursé en cas de litige résolu en votre faveur.',
  },
  {
    question: 'Qui peut vendre sur C-Connect ?',
    answer: 'Producteurs, coopératives, fabricants locaux, PME agro-industrielles et entreprises dirigées par des femmes peuvent rejoindre la plateforme après une vérification d’identité et d’activité (KYC).',
  },
  {
    question: 'Quels moyens de paiement sont acceptés ?',
    answer: 'Le Mobile Money et le virement professionnel sont pris en charge, afin de s’adapter aussi bien aux acheteurs institutionnels qu’aux producteurs sur le terrain.',
  },
  {
    question: 'Que se passe-t-il en cas de désaccord sur une commande ?',
    answer: 'Les fonds restent bloqués en séquestre. Une équipe C-Connect examine les éléments fournis par les deux parties avant de décider d’une libération, d’un remboursement ou d’un arrangement partiel.',
  },
  {
    question: 'La plateforme fonctionne-t-elle avec une connexion limitée ?',
    answer: 'Oui. L’interface est optimisée pour les réseaux mobiles instables, avec des temps de chargement réduits et un usage de données minimal.',
  },
  {
    question: 'Comment rejoindre C-Connect en tant que fournisseur ?',
    answer: 'Créez un compte, soumettez vos documents d’identité et d’activité, puis publiez votre catalogue dès validation de votre profil — généralement sous 48 heures.',
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <main>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <Wheat size={14} aria-hidden="true" />
              Plateforme B2B de sourcing — Cameroun
            </span>
            <h1 className={styles.title}>
              L’approvisionnement professionnel, <span className={styles.gradientText}>sécurisé jusqu’au paiement</span>.
            </h1>
            <p className={styles.subtitle}>
              C-Connect relie restaurants, hôtels, grossistes et institutions aux producteurs, coopératives
              et fabricants camerounais vérifiés — avec des fonds protégés en séquestre à chaque commande.
            </p>
            <div className={styles.actions}>
              <Link href="/auth/register?role=buyer" className={styles.primaryCta}>
                Demander une démonstration
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/auth/register?role=seller" className={styles.secondaryCta}>
                Devenir fournisseur vérifié
              </Link>
            </div>
            <ul className={styles.chipRow} aria-label="Garanties de la plateforme">
              {heroChips.map(({ Icon, label }) => (
                <li className={styles.chip} key={label}>
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.docCardBack}>
              <div className={styles.docHeader}>
                <ShieldCheck size={15} />
                <span>Paiement en séquestre</span>
              </div>
              <EscrowTracker compact />
            </div>
            <div className={styles.docCardFront}>
              <div className={styles.docHeaderRow}>
                <span className={styles.docTag}>Bon de commande</span>
                <span className={styles.docRef}>BC-1042</span>
              </div>
              <p className={styles.docProduct}>Poivre blanc de Penja</p>
              <p className={styles.docMeta}>Littoral · Coopérative vérifiée</p>
              <div className={styles.docDivider} />
              <div className={styles.docRow}>
                <span>Quantité</span>
                <strong>450 kg</strong>
              </div>
              <div className={styles.docRow}>
                <span>Montant</span>
                <strong>8 325 000 XAF</strong>
              </div>
              <div className={styles.docFooter}>
                <CheckCircle2 size={14} aria-hidden="true" />
                Fournisseur vérifié KYC
              </div>
            </div>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className={styles.trustBar} aria-label="Indicateurs de confiance">
          <div className={styles.trustGrid}>
            {trustItems.map((item) => (
              <div className={styles.trustItem} key={item.label}>
                <span className={styles.trustValue}>{item.value}</span>
                <span className={styles.trustLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PROBLEM / SOLUTION */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Le problème</span>
            <h2>L’approvisionnement local reste informel — et risqué pour les deux parties.</h2>
            <p>Sans vérification ni garantie, chaque commande repose sur la confiance personnelle plutôt que sur un cadre fiable.</p>
          </div>
          <div className={styles.compareGrid}>
            <div className={styles.compareCard} data-tone="before">
              <h3>Sans cadre structuré</h3>
              <ul>
                {painPoints.map((point) => (
                  <li key={point}>
                    <XCircle size={16} aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.compareCard} data-tone="after">
              <h3>Avec C-Connect</h3>
              <ul>
                {solutions.map((point) => (
                  <li key={point}>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="comment-ca-marche" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Le mécanisme</span>
            <h2>Quatre étapes, du besoin au paiement libéré.</h2>
            <p>Chaque commande suit le même parcours sécurisé, que l’acheteur soit une institution ou un restaurant indépendant.</p>
          </div>
          <ol className={styles.stepsGrid}>
            {steps.map(({ title, description, Icon }, index) => (
              <li className={styles.stepCard} key={title}>
                <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.iconBox}>
                  <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* PRODUCT PREVIEW */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>La plateforme</span>
            <h2>Un espace de travail, pas une simple vitrine.</h2>
            <p>Acheteurs et fournisseurs suivent leurs commandes, paiements et factures depuis un tableau de bord pensé pour leur usage.</p>
          </div>
          <ProductPreview />
        </section>

        {/* CORE FEATURES */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Les fondations</span>
            <h2>Ce qui rend chaque transaction fiable.</h2>
          </div>
          <div className={styles.featuresGrid}>
            {features.map(({ title, description, Icon }) => (
              <article className={styles.featureCard} key={title}>
                <span className={styles.iconBox}>
                  <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* DUAL AUDIENCE BENEFITS */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Pour qui</span>
            <h2>Conçu pour deux réalités, un seul cadre de confiance.</h2>
          </div>
          <div className={styles.audienceGrid}>
            <div className={styles.audienceCard}>
              <span className={styles.audienceTag}><Building2 size={16} aria-hidden="true" /> Entreprises acheteuses</span>
              <p className={styles.audienceLede}>Restaurants, hôtels, grossistes, distributeurs, institutions.</p>
              <ul>
                {buyerBenefits.map((item) => (
                  <li key={item}><CheckCircle2 size={15} aria-hidden="true" />{item}</li>
                ))}
              </ul>
            </div>
            <div className={styles.audienceCard} data-variant="dark">
              <span className={styles.audienceTag}><Sprout size={16} aria-hidden="true" /> Producteurs & coopératives</span>
              <p className={styles.audienceLede}>Fermes, coopératives, fabricants locaux, entreprises dirigées par des femmes.</p>
              <ul>
                {producerBenefits.map((item) => (
                  <li key={item}><CheckCircle2 size={15} aria-hidden="true" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ESCROW DEEP DIVE */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.escrowLayout}>
            <div>
              <span className={styles.sectionLabel}>La sécurité, en détail</span>
              <h2 className={styles.escrowTitle}>La confiance n’est pas une promesse — c’est un mécanisme.</h2>
              <div className={styles.pillarList}>
                {escrowPillars.map(({ title, description, Icon }) => (
                  <div className={styles.pillar} key={title}>
                    <span className={styles.iconBox}>
                      <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.escrowCard}>
              <div className={styles.docHeader}>
                <ShieldCheck size={16} aria-hidden="true" />
                <span>Suivi du paiement — BC-1042</span>
              </div>
              <EscrowTracker />
              <div className={styles.escrowAmount}>
                <span>Montant retenu</span>
                <strong>8 325 000 XAF</strong>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Premiers retours du programme pilote</span>
            <h2>Ce que disent les premiers acheteurs et fournisseurs.</h2>
          </div>
          <div className={styles.testimonialGrid}>
            {testimonials.map((item) => (
              <figure className={styles.testimonialCard} key={item.name + item.role}>
                <blockquote>“{item.quote}”</blockquote>
                <figcaption>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className={`${styles.section} ${styles.sectionNarrow}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Questions fréquentes</span>
            <h2>Avant de vous lancer.</h2>
          </div>
          <FaqAccordion items={faqItems} />
        </section>

        {/* FINAL CTA */}
        <section className={styles.finalCta}>
          <div className={styles.finalCtaCard}>
            <Building2 size={22} aria-hidden="true" />
            <h3>Vous achetez pour votre entreprise</h3>
            <p>Sourcing vérifié, paiement protégé, facturation automatique.</p>
            <Link href="/auth/register?role=buyer" className={styles.finalCtaButton}>
              Demander une démonstration
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.finalCtaCard} data-variant="dark">
            <Truck size={22} aria-hidden="true" />
            <h3>Vous produisez ou fabriquez au Cameroun</h3>
            <p>Accédez à des acheteurs professionnels et soyez payé sans risque.</p>
            <Link href="/auth/register?role=seller" className={styles.finalCtaButton} data-variant="light">
              Rejoindre C-Connect
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
