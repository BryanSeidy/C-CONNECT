import Link from 'next/link';
import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import styles from './ProductCard.module.css';
import { getRegionLabel } from '@/lib/regions';

export const ProductCard = ({ product }: { product: Product }) => {
  const ratings = product.reviews?.map((r) => r.rating) || [];
  const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1) : null;
  const vendorName = product.producer?.companyName || product.producer?.fullName || 'Producteur Cameroun';
  const isVerified = product.producer?.isVerified;

  return (
    <Card style={{ cursor: 'pointer', transition: 'all 0.3s ease', overflow: 'hidden' }}>
      <div style={{
        width: '100%',
        height: '200px',
        backgroundColor: '#F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
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
            fontSize: '1.5rem',
            letterSpacing: '1px'
          }}>
            {product.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      
      <CardContent style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-color)', margin: 0, lineHeight: 1.2 }}>
            {product.name}
          </h3>
          <Badge variant={product.stock > 0 ? "success" : "error"}>
            {product.stock > 0 ? `${product.stock} dispo` : "Rupture"}
          </Badge>
        </div>

        {/* Producteur & Badge de Vérification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: 500 }}>Par {vendorName}</span>
          {isVerified && (
            <span 
              title="Producteur vérifié par C-Connect" 
              style={{ 
                color: '#3897f0', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.85rem'
              }}
            >
              🛡️
            </span>
          )}
        </div>

        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
           <span>{product.category}</span>
           <span style={{ opacity: 0.4 }}>·</span>
           <span>📍 {getRegionLabel(product.country)}</span>
        </div>

        {/* Moyenne des Avis */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {avgRating ? (
            <>
              <span style={{ color: '#F59E0B' }}>★</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{avgRating}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({ratings.length} avis)</span>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Aucun avis</span>
          )}
        </div>

        <div style={{ margin: '0.25rem 0', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>
          {product.price.toLocaleString()} FCFA
        </div>

        <Link 
          href={`/marketplace/product/${product.id}`}
          className={styles.productLink}
        >
          Voir les détails
        </Link>
      </CardContent>
    </Card>
  );
};

