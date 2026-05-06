import Link from 'next/link';
import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import styles from './ProductCard.module.css';

export const ProductCard = ({ product }: { product: Product }) => (
  <Card style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}>
    <div style={{
      width: '100%',
      height: '200px',
      backgroundColor: '#F1F5F9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)'
    }}>
      <span style={{ fontSize: '0.875rem' }}>Image {product.name}</span>
    </div>
    
    <CardContent style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-color)', margin: 0, lineHeight: 1.2 }}>
          {product.name}
        </h3>
        <Badge variant={product.stock > 0 ? "success" : "error"}>
          {product.stock > 0 ? `${product.stock} dispo` : "Rupture"}
        </Badge>
      </div>

      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
         {product.category}
      </div>

      <div style={{ margin: '0.5rem 0', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>
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
