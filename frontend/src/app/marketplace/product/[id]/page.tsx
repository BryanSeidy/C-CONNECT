import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  // Mock data for the view
  const product = {
    id: params.id,
    name: "Maïs jaune (Qualité Supérieure)",
    description: "Sacs de 50kg, grain sec idéal pour l'alimentation humaine et animale. Cultivé dans le centre du pays avec certification locale.",
    price: 12000,
    country: "CM",
    category: "Agroalimentaire",
    stock: 50,
    vendor: "AgroTech Gabon",
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 2rem' }}>
      <Link href="/marketplace" style={{ display: 'inline-block', marginBottom: '1.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>
        ← Retour au marketplace
      </Link>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) 1fr', gap: '3rem', alignItems: 'start' }}>
        
        {/* Left Side: Image placeholder and details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ 
            width: '100%', 
            aspectRatio: '1/1', 
            backgroundColor: '#E2E8F0', 
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            [Image du produit]
          </div>
          
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Description</h2>
            <p style={{ color: 'var(--text-main)', lineHeight: '1.8' }}>
              {product.description}
            </p>
          </div>
        </div>

        {/* Right Side: Order Action Card */}
        <Card style={{ position: 'sticky', top: '100px' }}>
          <CardContent style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', lineHeight: 1.1 }}>{product.name}</h1>
              </div>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Vendu par <span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{product.vendor}</span></p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Badge variant="info">Pays: {product.country}</Badge>
              <Badge variant="default">{product.category}</Badge>
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary-color)', margin: '1rem 0' }}>
              {product.price.toLocaleString()} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 500 }}>FCFA / Unité</span>
            </div>

            <div style={{ background: '#F5F7FA', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
               <p style={{ margin: 0, fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Stock disponible:</span>
                  <span style={{ color: 'var(--success)' }}>{product.stock} Unités</span>
               </p>
            </div>

            <Button variant="primary" size="lg" fullWidth style={{ marginTop: '1rem' }}>
              Commander maintenant (Escrow)
            </Button>
            
            <p style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', margin: 0 }}>
              Paiement sécurisé via CEMAC Connect Escrow
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
