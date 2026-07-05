import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Footer } from '@/components/Footer';
import { ShieldCheck, Crosshair, Users, Zap, BadgeCheck, Globe2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{ 
        padding: '6rem 2rem', 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, var(--primary-color) 0%, #185E6A 100%)',
        color: 'white'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            fontWeight: 900, 
            marginBottom: '1.5rem', 
            letterSpacing: '-0.02em',
            color: '#FFD700', // Gold vibrant
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            display: 'inline-block'
          }}>
            Bâtir le futur B2B du Cameroun
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '700px', margin: '0 auto' }}>
            C-CONNECT est la première marketplace B2B nationale dédiée à la transformation numérique du commerce entre les 10 régions du pays.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div style={{ maxWidth: '1100px', margin: '-4rem auto 4rem', padding: '0 2rem' }}>
        <Card glass style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
          <CardContent style={{ padding: '4rem', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            
            {/* Our Story */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '1.5rem' }}>Notre Histoire</h2>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-main)', marginBottom: '1rem' }}>
                  Fondée par une équipe de passionnés de technologie et d'agrobusiness, <strong>C-CONNECT</strong> est née d'un constat simple : l'asymétrie d'information freine le développement économique du Cameroun.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-main)' }}>
                  Nous avons créé un écosystème où un producteur de Garoua peut vendre ses récoltes à un industriel de Douala en toute confiance, sans intermédiaires opaques et avec une sécurité de paiement totale.
                </p>
              </div>
              <div style={{ 
                background: 'rgba(10,46,54,0.03)', 
                borderRadius: '24px', 
                padding: '2rem',
                border: '1px solid var(--border-color)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary-color)' }}>10</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Régions</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary-color)' }}>24/7</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Disponibilité</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary-color)' }}>100%</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sécurisé</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary-color)' }}>0</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fraude</div>
                </div>
              </div>
            </div>

            {/* Mission & Vision */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div style={{ padding: '2.5rem', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Crosshair size={24} style={{ color: 'var(--secondary-color)' }} />
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Notre Mission</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Digitaliser les chaînes de valeur nationales pour permettre à chaque entreprise camerounaise, quelle que soit sa taille, d'accéder au marché national.
                </p>
              </div>
              <div style={{ padding: '2.5rem', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(10,46,54,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Globe2 size={24} style={{ color: 'var(--primary-color)' }} />
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Notre Vision</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Devenir le hub central du commerce B2B au Cameroun, stimulant l'innovation industrielle et l'autosuffisance économique par la technologie.
                </p>
              </div>
            </div>

            {/* Core Values */}
            <div>
              <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '2.5rem', textAlign: 'center' }}>Nos Valeurs Fondamentales</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {[
                  { icon: <ShieldCheck size={24} />, title: 'Confiance', desc: 'Sécurité garantie via Escrow' },
                  { icon: <Zap size={24} />, title: 'Agilité', desc: 'Transactions rapides et fluides' },
                  { icon: <Users size={24} />, title: 'Impact', desc: 'Soutien aux producteurs locaux' },
                  { icon: <BadgeCheck size={24} />, title: 'Excellence', desc: 'Service client et support technique' },
                ].map((v, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '1.5rem', color: 'var(--secondary-color)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>{v.icon}</div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{v.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
              Conçu et développé par l’équipe C-CONNECT.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
