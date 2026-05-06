import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/Footer';
import { FcLock, FcGlobe, FcBarChart } from 'react-icons/fc';

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 72px)' }}>
      {/* Hero Section */}
      <section style={{ 
        padding: '6rem 2rem', 
        textAlign: 'center', 
        backgroundColor: 'var(--bg-card)', 
        borderBottom: '1px solid var(--border-color)',
        backgroundImage: 'linear-gradient(135deg, rgba(245, 247, 250, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Badge>La Référence B2B d'Afrique Centrale</Badge>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--primary-color)', lineHeight: 1.1, margin: '1.5rem 0' }}>
            Propulsez vos échanges <br/> dans l'espace CEMAC
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Trouvez des producteurs certifiés, négociez en toute sécurité grâce à l'Escrow, et développez votre activité B2B transfrontalière comme jamais auparavant.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">Rejoindre le réseau</Button>
            </Link>
            <Link href="/marketplace" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="lg">Explorer les offres</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section style={{ padding: '5rem 2rem', backgroundColor: 'var(--bg-app)', flex: 1 }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Feature 1 */}
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 1.5rem auto' }}><FcLock /></div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>Paiement Séquestre (Escrow)</h3>
              <p style={{ color: 'var(--text-muted)' }}>La sécurité au cœur de notre modèle. L'argent est bloqué par la plateforme jusqu'à la réception et confirmation de la marchandise.</p>
            </div>
            {/* Feature 2 */}
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 1.5rem auto' }}><FcGlobe /></div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>Matching Intelligent</h3>
              <p style={{ color: 'var(--text-muted)' }}>Découvrez instantanément les fournisseurs les plus pertinents pour votre chaîne logistique via notre moteur de recommandation B2B.</p>
            </div>
            {/* Feature 3 */}
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 1.5rem auto' }}><FcBarChart /></div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>Dashboard Centralisé</h3>
              <p style={{ color: 'var(--text-muted)' }}>Gérez vos commandes, ajoutez vos produits et consultez vos KPI financiers dans une interface claire et professionnelle.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Inline Badge helper for Hero unit since it requires ui component
const Badge = ({ children }: { children: React.ReactNode }) => (
  <span style={{ 
    display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '50px', 
    backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--secondary-color)', 
    fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' 
  }}>
    {children}
  </span>
);
