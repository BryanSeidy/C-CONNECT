'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, ShieldCheck,
  Sprout, Users, AlertTriangle, PackageSearch,
} from 'lucide-react';
import { companyService } from '@/services/companies';
import { productService } from '@/services/products';
import { Company, PaginationMeta, Product } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/ProductCard';
import { Footer } from '@/components/Footer';
import { getRegionLabel } from '@/lib/regions';
import { useAuth } from '@/hooks/useAuth';
import styles from './CompanyProfile.module.css';

const TYPE_LABELS: Record<string, string> = {
  cooperative: 'Coopérative',
  producteur: 'Producteur',
  fabricant: 'Fabricant',
  restaurant: 'Restaurant',
  hotel: 'Hôtel',
  supermarche: 'Supermarché',
  grossiste: 'Grossiste',
  distributeur: 'Distributeur',
  ong: 'ONG',
  institution: 'Institution publique',
  pme: 'PME',
  autre: 'Entreprise',
};

const DEFAULT_META: PaginationMeta = { total: 0, page: 1, pageSize: 12, totalPages: 1 };
const PAGE_SIZE = 12;

function ProfileSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.heroSkeleton} />
      <div className={styles.grid}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={styles.cardSkeleton} />
        ))}
      </div>
    </div>
  );
}

export default function CompanyProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { user } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await companyService.getCompanyBySlugOrId(slug);
      setCompany(res.data);
    } catch {
      setError("Ce profil d'entreprise est introuvable ou n'existe plus.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  useEffect(() => {
    if (!company) return;
    let cancelled = false;
    setProductsLoading(true);
    productService
      .getProducts({ companyId: company.id, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setProducts(res?.data?.items || []);
        setMeta(res?.data?.meta || DEFAULT_META);
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setMeta(DEFAULT_META);
        }
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [company, page]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !company) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <AlertTriangle size={32} color="#dc2626" aria-hidden="true" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error ?? "Profil introuvable."}</p>
          <Link href="/marketplace">
            <Button variant="outline">Retour au marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasPreviousPage = page > 1;
  const hasNextPage = page < meta.totalPages;

  return (
    <>
      <div className={styles.container}>
        <Link href="/marketplace" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" /> Retour au marketplace
        </Link>

        <div className={styles.hero}>
          <div className={styles.heroTop}>
            <div className={styles.logo}>
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logoUrl} alt={`Logo ${company.nom}`} />
              ) : (
                <Building2 size={32} aria-hidden="true" />
              )}
            </div>
            <div className={styles.heroInfo}>
              <h1 className={styles.name}>{company.nom}</h1>
              <p className={styles.type}>{TYPE_LABELS[company.typeEntreprise] ?? 'Entreprise'}</p>
              <div className={styles.metaRow}>
                {(company.ville || company.region) && (
                  <span className={styles.metaItem}>
                    <MapPin size={14} aria-hidden="true" />
                    {[company.ville, company.region ? getRegionLabel(company.region) : null].filter(Boolean).join(', ')}
                  </span>
                )}
                {company.telephone && (
                  <span className={styles.metaItem}>
                    <Phone size={14} aria-hidden="true" /> {company.telephone}
                  </span>
                )}
                {company.emailProfessionnel && (
                  <span className={styles.metaItem}>
                    <Mail size={14} aria-hidden="true" /> {company.emailProfessionnel}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.trustScore}>
              <span className={styles.trustScoreValue}>{company.trustScore}</span>
              <div className={styles.trustScoreBar} role="progressbar" aria-valuenow={company.trustScore} aria-valuemin={0} aria-valuemax={100} aria-label="Score de confiance">
                <div className={styles.trustScoreFill} style={{ width: `${Math.max(0, Math.min(100, company.trustScore))}%` }} />
              </div>
              <span className={styles.trustScoreLabel}>Score de confiance / 100</span>
            </div>
          </div>

          <div className={styles.badgeRow}>
            {company.badges && company.badges.length > 0 ? (
              company.badges.map((badge) => (
                <Badge key={badge.code} variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={13} aria-hidden="true" /> {badge.label}
                </Badge>
              ))
            ) : (
              <Badge variant="default">Vérification en cours</Badge>
            )}
            {company.badgeCooperativeVerifiee && (
              <Badge variant="info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={13} aria-hidden="true" /> Coopérative
              </Badge>
            )}
            {company.badgeFemmesEntrepreneures && (
              <Badge variant="gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sprout size={13} aria-hidden="true" /> Entreprise féminine
              </Badge>
            )}
          </div>

          {(company.rccm || company.niu) && (
            <div className={styles.legalRow}>
              {company.rccm && <span>RCCM : {company.rccm}</span>}
              {company.niu && <span>NIU : {company.niu}</span>}
            </div>
          )}

          {company.description && <p className={styles.description}>{company.description}</p>}
        </div>

        <div className={styles.catalogHeader}>
          <div>
            <h2 className={styles.catalogTitle}>Catalogue</h2>
            {!productsLoading && <span className={styles.catalogCount}>{meta.total} produit(s)</span>}
          </div>
          {(!user || user.role === 'buyer') && (
            <Link
              href={user ? '/dashboard/rfqs' : `/login?redirect=${encodeURIComponent('/dashboard/rfqs')}`}
              className={styles.rfqCta}
            >
              Vous ne trouvez pas ce qu&apos;il vous faut ? Publiez une demande de devis
            </Link>
          )}
        </div>

        {productsLoading && (
          <div className={styles.grid}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={styles.cardSkeleton} />
            ))}
          </div>
        )}

        {!productsLoading && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <PackageSearch size={40} aria-hidden="true" style={{ marginBottom: '1rem' }} />
            <p>Cette entreprise n&apos;a pas encore publié de produits.</p>
          </div>
        )}

        {!productsLoading && products.length > 0 && (
          <>
            <div className={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {meta.totalPages > 1 && (
              <div className={styles.pagination}>
                <Button variant="outline" onClick={() => setPage((p) => p - 1)} disabled={!hasPreviousPage}>
                  Précédent
                </Button>
                <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!hasNextPage}>
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
