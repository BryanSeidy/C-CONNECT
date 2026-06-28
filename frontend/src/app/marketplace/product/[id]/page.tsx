'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Product } from '@/types';
import { productService } from '@/services/products';
import { orderService, paymentService } from '@/services/orders';
import { reviewService } from '@/services/reviews';
import { negotiationService } from '@/services/negotiations';
import { useAuth } from '@/hooks/useAuth';
import { getRegionLabel } from '@/lib/regions';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Negotiation modal state
  const [isNegModalOpen, setIsNegModalOpen] = useState(false);
  const [negQuantity, setNegQuantity] = useState(1);
  const [negPrice, setNegPrice] = useState(0);
  const [negMessage, setNegMessage] = useState('');
  const [isSubmittingNeg, setIsSubmittingNeg] = useState(false);
  const [negError, setNegError] = useState<string | null>(null);
  const [negSuccess, setNegSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (!productId) {
      setError('Identifiant produit invalide.');
      setLoading(false);
      return;
    }

    // Load Product
    productService
      .getProductById(productId)
      .then((res: any) => {
        if (!active) return;
        const prod = res?.data || null;
        setProduct(prod);
        if (prod) {
          setNegPrice(prod.price);
          setNegQuantity(Math.min(10, prod.stock));
        }
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || 'Impossible de charger ce produit');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    // Load Reviews
    reviewService
      .getProductReviews(productId)
      .then((res: any) => {
        if (!active) return;
        setReviews(res?.data || []);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [productId]);

  const total = useMemo(() => {
    if (!product) return 0;
    return quantity * product.price;
  }, [product, quantity]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const submitOrder = async () => {
    if (!product) return;

    if (!user) {
      router.push(`/login?redirect=/marketplace/product/${product.id}`);
      return;
    }

    setIsOrdering(true);
    setError(null);
    setSuccess(null);
    try {
      const orderRes: any = await orderService.createOrder({ productId: product.id, quantity });
      await paymentService.createPayment({ orderId: orderRes?.data?.id, method: 'BANK_TRANSFER' });
      setSuccess('Commande et paiement escrow initialisés avec succès.');
    } catch (err: any) {
      setError(err?.message || 'La commande a échoué, veuillez réessayer.');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;
    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      const res: any = await reviewService.submitProductReview(product.id, reviewRating, reviewComment);
      setReviews((prev) => [res.data, ...prev]);
      setReviewComment('');
      setReviewRating(5);
    } catch (err: any) {
      setReviewError(err.message || "Erreur lors de la soumission de l'avis");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleNegSubmit = async () => {
    if (!product || !user) return;
    setIsSubmittingNeg(true);
    setNegError(null);
    setNegSuccess(null);
    try {
      await negotiationService.createNegotiation({
        productId: product.id,
        quantity: negQuantity,
        proposedPrice: negPrice,
        message: negMessage || `Proposition de négociation pour ${negQuantity} unités à ${negPrice} FCFA/unité.`
      });
      setNegSuccess("Votre offre de négociation a été transmise avec succès au producteur. Suivez-la dans l'espace Négociations.");
      setTimeout(() => {
        setIsNegModalOpen(false);
        setNegSuccess(null);
      }, 3500);
    } catch (err: any) {
      setNegError(err.message || "Impossible d'initier la négociation");
    } finally {
      setIsSubmittingNeg(false);
    }
  };

  if (loading) {
    return <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 2rem' }}>Chargement du produit...</div>;
  }

  if (!product) {
    return (
      <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 2rem' }}>
        <p style={{ color: 'var(--error)' }}>{error || 'Produit introuvable'}</p>
        <Link href="/marketplace">Retour à la marketplace</Link>
      </div>
    );
  }

  const vendor = product.producer?.companyName || product.producer?.fullName || 'Vendeur Cameroun';
  const isVerified = product.producer?.isVerified;

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
            color: 'var(--text-muted)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                backgroundImage: 'linear-gradient(135deg, #0A2E36 0%, #175F6D 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '3rem',
                letterSpacing: '2px'
              }}>
                {product.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Description</h2>
            <p style={{ color: 'var(--text-main)', lineHeight: '1.8' }}>
              {product.description || 'Aucune description détaillée n a été fournie pour ce produit.'}
            </p>
          </div>

          {/* Section Évaluations & Avis */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              Évaluations & Avis Clients ({reviews.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun avis pour ce produit.</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} style={{ borderBottom: '1px solid #EDF2F7', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {rev.buyer?.companyName || rev.buyer?.fullName || 'Acheteur Anonyme'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('fr-FR') : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', color: '#F59E0B', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < rev.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    {rev.comment && <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.5 }}>{rev.comment}</p>}
                  </div>
                ))
              )}
            </div>

            {/* Formulaire d'avis */}
            {user?.role === 'buyer' ? (
              <form onSubmit={handleReviewSubmit} style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 0, marginBottom: '1rem', color: 'var(--text-main)' }}>
                  Laisser une évaluation
                </h3>
                {reviewError && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{reviewError}</p>}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Note</label>
                    <select 
                      value={reviewRating} 
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                      <option value={3}>⭐⭐⭐ (3/5)</option>
                      <option value={2}>⭐⭐ (2/5)</option>
                      <option value={1}>⭐ (1/5)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="comment" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Commentaire</label>
                    <textarea 
                      id="comment"
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Partagez votre avis sur la qualité, la logistique, la communication..."
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    isLoading={isSubmittingReview}
                  >
                    Soumettre l'avis
                  </Button>
                </div>
              </form>
            ) : user ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                Seuls les comptes acheteurs peuvent soumettre des avis.
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Link href={`/login?redirect=/marketplace/product/${product.id}`} style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}>
                  Connectez-vous
                </Link> pour laisser une évaluation.
              </p>
            )}
          </div>

        </div>

        {/* Right Side: Order Action Card */}
        <Card style={{ position: 'sticky', top: '100px' }}>
          <CardContent style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', lineHeight: 1.1 }}>{product.name}</h1>
              </div>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                <span>Vendu par</span> 
                <span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{vendor}</span>
                {isVerified && (
                  <span 
                    title="Producteur vérifié par C-Connect" 
                    style={{ 
                      backgroundColor: 'rgba(56, 151, 240, 0.1)', 
                      color: '#3897f0', 
                      fontSize: '0.75rem', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    🛡️ Producteur Vérifié
                  </span>
                )}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Badge variant="info">Région: {getRegionLabel(product.country)}</Badge>
                <Badge variant="default">{product.category}</Badge>
              </div>

              {/* Moyenne Avis */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                 {avgRating ? (
                   <>
                     <span style={{ color: '#F59E0B' }}>★</span>
                     <strong>{avgRating}</strong>
                     <span style={{ color: 'var(--text-muted)' }}>({reviews.length} avis)</span>
                   </>
                 ) : (
                   <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun avis client</span>
                 )}
              </div>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="quantity" style={{ fontWeight: 600 }}>Quantité</label>
              <input
                id="quantity"
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Total estimé: <strong>{total.toLocaleString()} FCFA</strong>
              </p>
            </div>

            {error && <p style={{ margin: 0, color: 'var(--error)' }}>{error}</p>}
            {success && <p style={{ margin: 0, color: 'var(--success)' }}>{success}</p>}

            {/* Actions: Achat Immédiat & Négociation B2B */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={submitOrder}
                isLoading={isOrdering}
                disabled={product.stock <= 0}
              >
                Achat Immédiat (Escrow)
              </Button>
              {(!user || user.role === 'buyer') && (
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    if (!user) {
                      router.push(`/login?redirect=/marketplace/product/${product.id}`);
                      return;
                    }
                    setNegPrice(product.price);
                    setNegQuantity(Math.min(10, product.stock));
                    setNegMessage('');
                    setIsNegModalOpen(true);
                  }}
                  disabled={product.stock <= 0}
                >
                  🤝 Négocier le Prix / Devis
                </Button>
              )}
            </div>
            
            <p style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', margin: 0 }}>
              Paiement sécurisé via C-Connect Escrow
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Modal de Négociation */}
      {isNegModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            width: '90%',
            maxWidth: '500px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              background: 'var(--primary-color)',
              color: 'white',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                🤝 Offre de Négociation / Devis
              </h3>
              <button 
                onClick={() => setIsNegModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  opacity: 0.8
                }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Négociez directement le tarif de gros et le volume souhaité avec le producteur <strong>{vendor}</strong>.
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Produit</label>
                <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{product.name} (Prix standard : {product.price.toLocaleString()} FCFA)</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="neg-quantity" style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Quantité</label>
                  <input 
                    id="neg-quantity"
                    type="number"
                    min={1}
                    max={product.stock}
                    value={negQuantity}
                    onChange={(e) => setNegQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disponible : {product.stock}</span>
                </div>

                <div>
                  <label htmlFor="neg-price" style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Prix proposé (FCFA/U)</label>
                  <input 
                    id="neg-price"
                    type="number"
                    min={1}
                    value={negPrice}
                    onChange={(e) => setNegPrice(Math.max(1, Number(e.target.value) || 0))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="neg-message" style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Message pour le vendeur</label>
                <textarea 
                  id="neg-message"
                  rows={3}
                  value={negMessage}
                  onChange={(e) => setNegMessage(e.target.value)}
                  placeholder="Expliquez votre besoin de volume ou proposez un partenariat..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Tarif standard estimé :</span>
                  <span style={{ textDecoration: 'line-through' }}>{(product.price * negQuantity).toLocaleString()} FCFA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--primary-color)' }}>
                  <span>Votre offre totale :</span>
                  <span>{(negPrice * negQuantity).toLocaleString()} FCFA</span>
                </div>
              </div>

              {negError && <p style={{ margin: 0, color: 'var(--error)', fontSize: '0.875rem' }}>{negError}</p>}
              {negSuccess && <p style={{ margin: 0, color: 'var(--success)', fontSize: '0.875rem' }}>{negSuccess}</p>}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button 
                  variant="outline" 
                  onClick={() => setIsNegModalOpen(false)}
                  disabled={isSubmittingNeg}
                >
                  Annuler
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleNegSubmit}
                  isLoading={isSubmittingNeg}
                >
                  Soumettre l'offre B2B
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
