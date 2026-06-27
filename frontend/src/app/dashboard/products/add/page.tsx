'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { productService } from '@/services/products';
import inputStyles from '@/components/ui/Input.module.css';
import { REGION_OPTIONS } from '@/lib/regions';

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [country, setCountry] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await productService.createProduct({
        name,
        price: Number(price),
        category,
        stock: Number(stock),
        country,
        imageUrl: imageUrl || undefined,
        description
      });
      router.push('/dashboard/products');
    } catch (err: any) {
      setError(err?.message || 'Impossible de creer le produit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem' }}>Ajouter un nouveau produit</h2>
      
      <Card>
        <CardContent style={{ padding: '2rem' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onSubmit={handleSubmit}>
            <Input label="Nom du Produit" placeholder="Ex: Mais Jaune" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Prix Unitaire (FCFA)" type="number" placeholder="Ex: 12000" required value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input label="Categorie" placeholder="Ex: Agroalimentaire" required value={category} onChange={(e) => setCategory(e.target.value)} />
            <Input label="URL de l'image (Optionnel)" placeholder="Ex: https://images.unsplash.com/photo-..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <div className={inputStyles.wrapper}>
              <label className={inputStyles.label}>Région de Production</label>
              <select
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputStyles.input}
              >
                <option value="">Sélectionnez la région</option>
                {REGION_OPTIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label} ({r.code})
                  </option>
                ))}
              </select>
            </div>
            <Input label="Stock Initial" type="number" placeholder="Ex: 50" required value={stock} onChange={(e) => setStock(e.target.value)} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Description (Détails, conditionnement)</label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', fontFamily: 'var(--font-primary)', fontSize: '1rem',
                  color: 'var(--text-main)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)', outline: 'none', minHeight: '100px'
                }} 
              />
            </div>

            {error && <p style={{ margin: 0, color: 'var(--error)' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
              <Button type="submit" variant="primary" isLoading={loading}>Enregistrer au catalogue</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
