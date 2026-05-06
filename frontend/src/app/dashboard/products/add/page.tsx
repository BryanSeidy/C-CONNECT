'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function AddProductPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API Call based on ProductService
    setTimeout(() => {
      setLoading(false);
      window.location.href = '/dashboard/products';
    }, 800);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem' }}>Ajouter un nouveau produit</h2>
      
      <Card>
        <CardContent style={{ padding: '2rem' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onSubmit={handleSubmit}>
            <Input label="Nom du Produit" placeholder="Ex: Maïs Jaune" required />
            <Input label="Prix Unitaire (FCFA)" type="number" placeholder="Ex: 12000" required />
            <Input label="Catégorie" placeholder="Ex: Agroalimentaire" required />
            <Input label="Stock Initial" type="number" placeholder="Ex: 50" required />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Description (Détails, conditionnement)</label>
              <textarea 
                required
                style={{
                  width: '100%', padding: '10px 14px', fontFamily: 'var(--font-primary)', fontSize: '1rem',
                  color: 'var(--text-main)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)', outline: 'none', minHeight: '100px'
                }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => window.history.back()}>Annuler</Button>
              <Button type="submit" variant="primary" isLoading={loading}>Enregistrer au catalogue</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
