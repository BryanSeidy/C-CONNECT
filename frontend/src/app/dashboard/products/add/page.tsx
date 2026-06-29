'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { productService, ProductMutationPayload } from '@/services/products';
import { REGION_OPTIONS } from '@/lib/regions';

const productSchema = z.object({
  name: z.string().min(2, 'Le nom du produit doit contenir au moins 2 caractères.'),
  price: z.coerce.number({ invalid_type_error: 'Le prix doit être un nombre.' }).min(1, 'Le prix doit être supérieur à 0.'),
  category: z.string().min(2, 'La catégorie est requise.'),
  imageUrl: z.string().url('L\'URL de l\'image n\'est pas valide.').or(z.literal('')).nullable().optional(),
  country: z.string().min(2, 'Veuillez sélectionner une région de production.'),
  stock: z.coerce.number({ invalid_type_error: 'Le stock doit être un nombre entier.' }).int().min(0, 'Le stock ne peut pas être négatif.'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères.'),
});

type FormFieldErrors = Partial<Record<keyof ProductMutationPayload, string>>;

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
  
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = {
      name: name.trim(),
      price: price === '' ? undefined : Number(price),
      category: category.trim(),
      imageUrl: imageUrl.trim() || null,
      country,
      stock: stock === '' ? undefined : Number(stock),
      description: description.trim(),
    };

    const result = productSchema.safeParse(formData);

    if (!result.success) {
      const errors: FormFieldErrors = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof ProductMutationPayload;
        if (path) {
          errors[path] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await productService.createProduct({
        name: result.data.name,
        price: result.data.price,
        category: result.data.category,
        stock: result.data.stock,
        country: result.data.country,
        imageUrl: result.data.imageUrl,
        description: result.data.description,
      });
      router.push('/dashboard/products');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de créer le produit. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
        Ajouter un nouveau produit
      </h2>
      
      <Card>
        <CardContent style={{ padding: '2.5rem' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onSubmit={handleSubmit}>
            
            {/* Nom du produit */}
            <div>
              <Input 
                label="Nom du Produit" 
                placeholder="Ex: Poivre Blanc de Penja" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                error={fieldErrors.name}
              />
            </div>

            {/* Prix */}
            <div>
              <Input 
                label="Prix Unitaire (FCFA)" 
                type="number" 
                placeholder="Ex: 12000" 
                required 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                error={fieldErrors.price}
              />
            </div>

            {/* Categorie */}
            <div>
              <Input 
                label="Catégorie" 
                placeholder="Ex: Agroalimentaire" 
                required 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                error={fieldErrors.category}
              />
            </div>

            {/* Image URL */}
            <div>
              <Input 
                label="URL de l'image du produit (Optionnel)" 
                placeholder="Ex: https://images.unsplash.com/..." 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                error={fieldErrors.imageUrl}
              />
            </div>

            {/* Cameroon 10 Regions Graphical Grid Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Région de Production (Cameroun) <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                gap: '0.75rem', 
                marginTop: '0.25rem' 
              }}>
                {REGION_OPTIONS.map((region) => {
                  const isSelected = country === region.code;
                  return (
                    <button
                      key={region.code}
                      type="button"
                      onClick={() => setCountry(region.code)}
                      style={{
                        padding: '12px 10px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? 'rgba(10, 46, 54, 0.06)' : 'var(--bg-card)',
                        color: isSelected ? 'var(--primary-color)' : 'var(--text-main)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease-in-out',
                        outline: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                          e.currentTarget.style.borderColor = 'var(--text-muted)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }
                      }}
                    >
                      {region.label}
                    </button>
                  );
                })}
              </div>
              
              {fieldErrors.country && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', fontWeight: 'bold', color: '#991b1b' }}>
                  {fieldErrors.country}
                </p>
              )}
            </div>

            {/* Stock */}
            <div>
              <Input 
                label="Stock Disponible" 
                type="number" 
                placeholder="Ex: 50" 
                required 
                value={stock} 
                onChange={(e) => setStock(e.target.value)} 
                error={fieldErrors.stock}
              />
            </div>
            
            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Description (Détails du produit, conditionnement) <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <textarea 
                required
                placeholder="Décrivez les spécifications de votre produit (ex: poivre séché sous soleil, trié à la main)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%', 
                  padding: '10px 14px', 
                  fontFamily: 'var(--font-primary)', 
                  fontSize: '1rem',
                  color: 'var(--text-main)', 
                  backgroundColor: 'var(--bg-card)', 
                  border: fieldErrors.description ? '1.5px solid #dc2626' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)', 
                  outline: 'none', 
                  minHeight: '120px',
                  resize: 'vertical'
                }} 
              />
              {fieldErrors.description && (
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', color: '#991b1b' }}>
                  {fieldErrors.description}
                </p>
              )}
            </div>

            {error && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', fontSize: '0.875rem', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" isLoading={loading}>
                Enregistrer au catalogue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
