'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Award, BadgeCheck, Loader2, MapPin, Package,
  Phone, ShieldCheck, ShoppingCart, Star, Truck, Users,
} from 'lucide-react';
import { productService } from '@/services/products';
import { orderService } from '@/services/orders';
import { Product } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getRegionLabel } from '@/lib/regions';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/ToastProvider';
import styles from './ProductDetail.module.css';

// ── Skeleton ─────────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className={styles.grid} aria-busy="true" aria-label="Chargement du produit">
      <div className={styles.imageSkeleton} />
      <div className={styles.infoCol}>
        <div className={styles.skLine} style={{ width: '60%', height: 12 }} />
        <div className={styles.skLine} style={{ width: '85%', height: 32, marginTop: 8 }} />
        <div className={styles.skLine} style={{ width: '40%', height: 20, marginTop: 12 }} />
        <div className={styles.skLine} style={{ width: '100%', height: 80, marginTop: 24 }} />
        <div className={styles.skLine} style={{ width: '100%', height: 48, marginTop: 32 }} />
      </div>
    </div>
  );
}

// ── Trust badges ──────────────────────────────────────────────────────────────

function TrustBadges({ product }: { product: Product }) {
  const badges = [];

  if (product.producer?.isVerified) {
    badges.push({ Icon: BadgeCheck, label: 'Vendeur vérifié', variant: 'verified' as const });
  }
  if (product.producer?.isFemaleOwned) {
    badges.push({ Icon: Award, label: 'Entreprise dirigée par une femme', variant: 'gold' as const });
  }
  if (product.producer?.isCooperative) {
    badges.push({ Icon: Users, label: 'Coopérative locale', variant: 'success' as const });
  }
  if (product.country) {
    badges.push({ Icon: MapPin, label: `Origine : ${getRegionLabel(product.country)}`, variant: 'default' as const });
  }

  if (badges.length === 0) return null;

  return (
    <div className={styles.trustRow}>
      {badges.map(({ Icon, label, variant }) => (
        <span key={label} className={`${styles.trustChip} ${styles[`trustChip_${variant}`]}`}>
          <Icon size={13} aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── Stock indicator ───────────────────────────────────────────────────────────

function StockIndicator({ stock, minimum }: { stock: number; minimum?: number }) {
  const min = minimum ?? 5;
  if (stock === 0) return <Badge variant="error">Rupture de stock</Badge>;
  if (stock <= min) return <Badge variant="warning">{stock} restant{stock > 1 ? 's' : ''} — stock bas</Badge>;
  return <Badge variant="success">{stock} unités disponibles</Badge>;
}

// ── Rating stars ──────────────────────────────────────────────────────────────

function RatingStars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className={styles.ratingRow} aria-label={`Note : ${rating} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={16}
          aria-hidden="true"
          className={i < Math.round(rating) ? styles.starFilled : styles.starEmpty}
        />
      ))}
      <span className={styles.ratingText}>
        {rating > 0 ? rating.toFixed(1) : 'Aucune note'} — {count} avis
      </span>
    </div>
  );
}

// ── Order form ────────────────────────────────────────────────────────────────

interface NegotiationContext {
  id: string;
  price: number;
  qty: number;
}

function OrderForm({ product, negotiation }: { product: Product; negotiation?: NegotiationContext | null }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [qty, setQty] = useState(negotiation?.qty ?? Math.max(1, product.stockMinimum ?? 1));
  const [showDelivery, setShowDelivery] = useState(false);
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [livraisonDemandee, setLivraisonDemandee] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const DELIVERY_FEE = 1500; // doit rester cohérent avec OrderController::FRAIS_LIVRAISON_FIXE côté backend — affichage uniquement, le montant réel est toujours recalculé serveur.

  const unitPrice = negotiation?.price ?? product.price;
  const canOrder = isAuthenticated && user?.role === 'buyer' && product.stock > 0;
  const deliveryValid = ville.trim().length > 1 && telephone.trim().length >= 8;

  const handleStartOrder = () => {
    setFormError(null);
    setShowDelivery(true);
  };

  const handleConfirmOrder = async () => {
    if (!deliveryValid) {
      setFormError('Indiquez au moins votre ville et un numéro de téléphone joignable.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await orderService.createOrder({
        productId: product.id,
        quantity: qty,
        negotiationId: negotiation?.id,
        villeLivraison: ville.trim(),
        adresseLivraison: adresse.trim() || undefined,
        telephoneLivraison: telephone.trim(),
        livraisonDemandee,
      });
      router.push(`/checkout?order=${res.data.id}`);
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setFormError(anyErr?.response?.data?.message ?? "Impossible de créer la commande pour le moment. Réessayez.");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.orderCard}>
      {negotiation && (
        <div className={styles.negotiatedBanner}>
          <ShieldCheck size={14} aria-hidden="true" />
          Prix négocié appliqué — {negotiation.price.toLocaleString('fr-FR')} XAF / {product.unite ?? 'unité'}
        </div>
      )}

      <div className={styles.priceRow}>
        <span className={styles.price}>{unitPrice.toLocaleString('fr-FR')} XAF</span>
        <span className={styles.priceUnit}>/ {product.unite ?? 'unité'}</span>
      </div>

      <StockIndicator stock={product.stock} minimum={product.stockMinimum} />

      {product.stockMinimum && product.stockMinimum > 0 && !negotiation && (
        <p className={styles.minOrder}>Commande minimum : {product.stockMinimum} {product.unite ?? 'unités'}</p>
      )}

      <div className={styles.qtyRow}>
        <label htmlFor="qty" className={styles.qtyLabel}>Quantité{negotiation ? ' (accord négocié)' : ''}</label>
        <div className={styles.qtyControl}>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => setQty(q => Math.max(product.stockMinimum ?? 1, q - 1))}
            disabled={!!negotiation || qty <= (product.stockMinimum ?? 1) || submitting}
            aria-label="Diminuer la quantité"
          >
            -
          </button>
          <input
            id="qty"
            type="number"
            className={styles.qtyInput}
            value={qty}
            min={product.stockMinimum ?? 1}
            max={product.stock}
            disabled={!!negotiation || submitting}
            onChange={e => setQty(Math.min(product.stock, Math.max(product.stockMinimum ?? 1, parseInt(e.target.value) || 1)))}
          />
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => setQty(q => Math.min(product.stock, q + 1))}
            disabled={!!negotiation || qty >= product.stock || submitting}
            aria-label="Augmenter la quantité"
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.totalRow}>
        <span>Total estimé</span>
        <strong>
          {(unitPrice * qty + (showDelivery && livraisonDemandee ? DELIVERY_FEE : 0)).toLocaleString('fr-FR')} XAF
        </strong>
      </div>
      {showDelivery && livraisonDemandee && (
        <p className={styles.deliveryFeeNote}>Inclut {DELIVERY_FEE.toLocaleString('fr-FR')} XAF de frais de livraison.</p>
      )}

      {canOrder && showDelivery && (
        <div className={styles.deliveryForm}>
          <p className={styles.deliveryTitle}>Où livrer votre commande ?</p>

          <div className={styles.deliveryField}>
            <label htmlFor="ville" className={styles.qtyLabel}>Ville *</label>
            <div className={styles.deliveryInputWrap}>
              <MapPin size={15} aria-hidden="true" className={styles.deliveryIcon} />
              <input
                id="ville"
                type="text"
                className={styles.deliveryInput}
                placeholder="Ex : Douala, Yaoundé…"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                disabled={submitting}
                autoComplete="address-level2"
              />
            </div>
          </div>

          <div className={styles.deliveryField}>
            <label htmlFor="telephone" className={styles.qtyLabel}>Téléphone de contact *</label>
            <div className={styles.deliveryInputWrap}>
              <Phone size={15} aria-hidden="true" className={styles.deliveryIcon} />
              <input
                id="telephone"
                type="tel"
                className={styles.deliveryInput}
                placeholder="6XX XX XX XX"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                disabled={submitting}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className={styles.deliveryField}>
            <label htmlFor="adresse" className={styles.qtyLabel}>Adresse précise (optionnel)</label>
            <textarea
              id="adresse"
              className={styles.deliveryTextarea}
              placeholder="Quartier, repère, numéro de porte…"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              disabled={submitting}
              rows={2}
            />
          </div>

          <div className={styles.deliveryToggleRow}>
            <label className={styles.deliveryToggleOption}>
              <input
                type="radio"
                name="delivery-mode"
                checked={livraisonDemandee}
                onChange={() => setLivraisonDemandee(true)}
                disabled={submitting}
              />
              <span>
                <Truck size={14} aria-hidden="true" /> Livraison à domicile
                <strong> (+{DELIVERY_FEE.toLocaleString('fr-FR')} XAF)</strong>
              </span>
            </label>
            <label className={styles.deliveryToggleOption}>
              <input
                type="radio"
                name="delivery-mode"
                checked={!livraisonDemandee}
                onChange={() => setLivraisonDemandee(false)}
                disabled={submitting}
              />
              <span>Je viendrai récupérer moi-même</span>
            </label>
          </div>
        </div>
      )}

      {formError && <p className={styles.formError}>{formError}</p>}

      {canOrder ? (
        !showDelivery ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={handleStartOrder}>
              <ShieldCheck size={16} aria-hidden="true" />
              Commander avec paiement sécurisé
            </Button>
            {!negotiation && (
              <Button
                variant="outline"
                size="lg"
                style={{ width: '100%' }}
                onClick={() => {
                  addItem({
                    productId: Number(product.id),
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    unite: product.unite,
                    imageUrl: product.imageUrl,
                    stock: product.stock,
                    sellerId: Number(product.producerId),
                    sellerName: product.producer?.companyName || product.producer?.fullName || 'Fournisseur',
                  }, qty);
                  showToast(`« ${product.name} » ajouté au panier.`, 'success');
                }}
              >
                <ShoppingCart size={16} aria-hidden="true" />
                Ajouter au panier
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            style={{ width: '100%' }}
            onClick={handleConfirmOrder}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={16} aria-hidden="true" className={styles.spinIcon} />
                Création de la commande…
              </>
            ) : (
              <>
                <ShieldCheck size={16} aria-hidden="true" />
                Confirmer et payer {(unitPrice * qty + (livraisonDemandee ? DELIVERY_FEE : 0)).toLocaleString('fr-FR')} XAF
              </>
            )}
          </Button>
        )
      ) : !isAuthenticated ? (
        <Link href={`/login?redirect=/marketplace/${product.slug}`}>
          <Button variant="secondary" size="lg" style={{ width: '100%' }}>
            Se connecter pour commander
          </Button>
        </Link>
      ) : product.stock === 0 ? (
        <Button variant="outline" size="lg" style={{ width: '100%' }} disabled>
          Produit indisponible
        </Button>
      ) : user?.role !== 'buyer' ? (
        <p className={styles.sellerNotice}>Connectez-vous avec un compte acheteur pour commander ce produit.</p>
      ) : null}

      <p className={styles.escrowNote}>
        <ShieldCheck size={13} aria-hidden="true" />
        Paiement retenu en séquestre jusqu&apos;à confirmation de réception
      </p>
    </div>
  );
}

// ── Barre d'action mobile (sticky) ───────────────────────────────────────────

function MobileStickyBar({ product }: { product: Product }) {
  if (product.stock === 0) return null;
  return (
    <div className={styles.mobileStickyBar}>
      <div className={styles.mobileStickyPrice}>
        <span className={styles.mobileStickyAmount}>{product.price.toLocaleString('fr-FR')} XAF</span>
        <span className={styles.mobileStickyUnit}>/ {product.unite ?? 'unité'}</span>
      </div>
      <a href="#order-panel" className={styles.mobileStickyBtn}>
        <ShieldCheck size={16} aria-hidden="true" />
        Commander
      </a>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const searchParams = useSearchParams();

  const negotiationId = searchParams.get('negotiation');
  const negotiation = negotiationId
    ? {
        id: negotiationId,
        price: parseFloat(searchParams.get('price') ?? '0'),
        qty: parseInt(searchParams.get('qty') ?? '1', 10),
      }
    : null;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setLoading(true);
    setError(null);

    productService.getProductById(slug)
      .then(res => { if (active) setProduct(res.data); })
      .catch(() => { if (active) setError('Produit introuvable ou non disponible.'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [slug]);

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Navigation">
        <Link href="/marketplace" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Retour au catalogue
        </Link>
        {product && (
          <>
            <span className={styles.sep} aria-hidden="true">/</span>
            <span>{product.category}</span>
            <span className={styles.sep} aria-hidden="true">/</span>
            <span className={styles.breadcrumbCurrent}>{product.name}</span>
          </>
        )}
      </nav>

      {loading && <ProductSkeleton />}

      {error && (
        <div className={styles.errorState}>
          <Package size={36} aria-hidden="true" />
          <p>{error}</p>
          <Link href="/marketplace">
            <Button variant="primary">Retour au catalogue</Button>
          </Link>
        </div>
      )}

      {product && !loading && (
        <>
          <div className={styles.grid}>
            {/* Image */}
            <div className={styles.imageCol}>
              <div className={styles.imageWrap}>
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className={styles.image}
                  />
                ) : (
                  <div className={styles.imagePlaceholder} aria-hidden="true">
                    <Package size={48} />
                  </div>
                )}
              </div>

              {/* Trust signals sous l'image */}
              <div className={styles.trustPanel}>
                <div className={styles.trustItem}>
                  <ShieldCheck size={16} aria-hidden="true" />
                  <div>
                    <span className={styles.trustItemTitle}>Paiement sécurisé</span>
                    <span className={styles.trustItemSub}>Séquestre C-Connect</span>
                  </div>
                </div>
                <div className={styles.trustItem}>
                  <Truck size={16} aria-hidden="true" />
                  <div>
                    <span className={styles.trustItemTitle}>Livraison confirmée</span>
                    <span className={styles.trustItemSub}>Tracking intégré</span>
                  </div>
                </div>
                <div className={styles.trustItem}>
                  <BadgeCheck size={16} aria-hidden="true" />
                  <div>
                    <span className={styles.trustItemTitle}>Vendeur vérifié</span>
                    <span className={styles.trustItemSub}>KYC validé</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className={styles.infoCol}>
              <div className={styles.categoryTag}>{product.category}</div>

              <h1 className={styles.productName}>{product.name}</h1>

              <RatingStars
                rating={product.qualityRating ?? 0}
                count={product.reviewsCount ?? 0}
              />

              <TrustBadges product={product} />

              {product.description && (
                <p className={styles.description}>{product.description}</p>
              )}

              {/* Fiche technique */}
              <div className={styles.specsGrid}>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Région d&apos;origine</span>
                  <span className={styles.specValue}>{getRegionLabel(product.country) || '—'}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Unité de vente</span>
                  <span className={styles.specValue}>{product.unite ?? 'kg'}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Stock disponible</span>
                  <span className={styles.specValue}>{product.stock} {product.unite ?? 'unités'}</span>
                </div>
                {product.stockMinimum != null && product.stockMinimum > 0 && (
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Minimum de commande</span>
                    <span className={styles.specValue}>{product.stockMinimum} {product.unite ?? 'unités'}</span>
                  </div>
                )}
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Ventes réalisées</span>
                  <span className={styles.specValue}>{product.salesCount ?? 0}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Producteur</span>
                  <span className={styles.specValue}>{product.producer?.companyName ?? product.producer?.fullName ?? '—'}</span>
                </div>
              </div>
            </div>

            {/* Colonne commande */}
            <div className={styles.sideCol} id="order-panel">
              <OrderForm product={product} negotiation={negotiation} />
            </div>
          </div>

          <MobileStickyBar product={product} />

          {/* Vendeur */}
          <section className={styles.sellerSection}>
            <h2 className={styles.sectionTitle}>Le producteur</h2>
            <div className={styles.sellerCard}>
              <div className={styles.sellerAvatar} aria-hidden="true">
                {(product.producer?.companyName ?? product.producer?.fullName ?? 'P').charAt(0).toUpperCase()}
              </div>
              <div className={styles.sellerInfo}>
                <strong>{product.producer?.companyName ?? product.producer?.fullName ?? 'Producteur local'}</strong>
                <span>{getRegionLabel(product.producer?.country ?? product.country ?? '')}</span>
                {product.producer?.isVerified && (
                  <span className={styles.verifiedLine}>
                    <BadgeCheck size={14} aria-hidden="true" />
                    Entreprise vérifiée C-Connect
                  </span>
                )}
              </div>
              {product.producer?.isCooperative && (
                <Badge variant="gold" style={{ alignSelf: 'flex-start' }}>Coopérative</Badge>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
