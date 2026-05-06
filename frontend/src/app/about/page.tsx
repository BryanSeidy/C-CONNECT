import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Footer } from '@/components/Footer';

export default function AboutPage() {
  return (
    <>
      <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem', minHeight: 'calc(100vh - 400px)' }}>
      <h1 style={{ fontSize: '3rem', color: 'var(--primary-color)', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 800 }}>À Propos de CEMAC Connect</h1>
      
      <Card glass>
        <CardContent style={{ padding: '3rem', fontSize: '1.125rem', lineHeight: 1.8, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p>
            <strong>CEMAC Connect</strong> a été fondée dans l'objectif de briser les barrières commerciales entre les producteurs et exportateurs de l'espace CEMAC (Cameroun, Gabon, Guinée Équatoriale, Tchad, RCA, Congo).
          </p>
          <p>
            Nous sommes convaincus que le tissu économique B2B local regorge d'un potentiel inexploité. En connectant de manière transparente et sécurisée la demande des entreprises avec l'offre des acteurs ruraux et industriels de la région, nous facilitons les transactions à l'échelle transfrontalière.
          </p>
          <div style={{ background: 'var(--primary-color)', color: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', margin: '1rem 0' }}>
            <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>Notre Mission</h3>
            <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Digitaliser l'agriculture et la transformation dans la CEMAC en offrant un écosystème de paiement garanti (Escrow) et de marché sécurisé pour tous.</p>
          </div>
          <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
            Projet Universitaire de Licence Technologique - Coded with ❤️ by the C-CONNECT team.
          </p>
        </CardContent>
      </Card>
      </div>
      
      <Footer />
    </>
  );
}
