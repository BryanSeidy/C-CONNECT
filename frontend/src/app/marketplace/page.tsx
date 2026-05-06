import React from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Footer } from '@/components/Footer';
import styles from './Marketplace.module.css';

// Mock data based on api-contract.md
const mockProducts = [
  { id: 10, name: "Maïs jaune", description: "Sac 50kg, grain sec", price: 12000, country: "CM", category: "Agroalimentaire", stock: 50 },
  { id: 11, name: "Huile de Palme", description: "Bidon de 20L, non raffinée", price: 18000, country: "GA", category: "Transformation", stock: 15 },
  { id: 12, name: "Cacao Fèves (Grade A)", description: "Sacs de 100kg, certifié Bio", price: 150000, country: "GQ", category: "Agroalimentaire", stock: 200 },
  { id: 13, name: "Farine de Manioc", description: "Sac 25kg", price: 8500, country: "CM", category: "Transformation", stock: 300 }
];

export default function MarketplacePage() {
  return (
    <>
      <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Marketplace Régional</h1>
          <p className={styles.subtitle}>Découvrez les meilleurs produits agricoles et industriels de la CEMAC</p>
        </div>
        
        <div className={styles.filters}>
          <div className={styles.searchBar}>
            <Input 
              placeholder="Rechercher un produit..." 
              style={{ width: '300px' }}
            />
            <Button variant="primary">Rechercher</Button>
          </div>
          <div className={styles.selectGroup}>
            <select className={styles.select}>
              <option value="">Tous les pays</option>
              <option value="CM">Cameroun</option>
              <option value="GA">Gabon</option>
              <option value="GQ">Guinée Équatoriale</option>
            </select>
            <select className={styles.select}>
              <option value="">Toutes catégories</option>
              <option value="AGRO">Agroalimentaire</option>
              <option value="TRANS">Transformation</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {mockProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      </div>
      <Footer />
    </>
  );
}
