'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/orders';
import { Order, Product } from '@/types';
import { matchingService } from '@/services/matching';
import { getRegionLabel } from '@/lib/regions';
import { ClipboardList, Handshake, MapPin, ShieldCheck, Plus, Wallet } from 'lucide-react';

interface RecommendedProduct extends Product {
  score?: number;
}

const ESCROW_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente de paiement',
  escrow_locked: 'Bloqué (Séquestre)',
  en_preparation: 'En préparation',
  expedie: 'Expédié',
  en_transit: 'En transit',
  livre: 'Livré',
  complete: 'Fonds Disponibles',
  annule: 'Annulée',
  dispute: 'Litige',
};

const ESCROW_STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
  pending: 'warning',
  escrow_locked: 'info',
  en_preparation: 'info',
  expedie: 'info',
  en_transit: 'info',
  livre: 'success',
  complete: 'success',
  annule: 'error',
  dispute: 'error',
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderService.getOrders();
        setOrders(res.data || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchRecs = async () => {
      if (!user?.country) {
        setLoadingRecs(false);
        return;
      }
      try {
        const res = await matchingService.getRecommendations({
          country: user.country,
          limit: 3
        });
        setRecommendations(res.data.products || []);
      } catch {
        setRecommendations([]);
      } finally {
        setLoadingRecs(false);
      }
    };
    if (user) {
      fetchRecs();
    }
  }, [user]);

  // Blocked Escrow Funds: Paid by buyer but not yet released to seller
  const blockedFunds = orders
    .filter(o => ['escrow_locked', 'en_preparation', 'expedie', 'en_transit', 'livre'].includes(o.escrowStatus))
    .reduce((sum, o) => sum + o.montantTotal, 0);

  // Available Cleared Funds: Released to seller
  const availableFunds = orders
    .filter(o => o.escrowStatus === 'complete')
    .reduce((sum, o) => sum + o.montantVendeur, 0);

  // Total sales revenue: Completed transactions
  const totalRevenue = orders
    .filter(o => o.escrowStatus === 'complete')
    .reduce((sum, o) => sum + o.montantTotal, 0);

  const activeOrders = orders.filter(o =>
    ['pending', 'escrow_locked', 'en_preparation', 'expedie', 'en_transit', 'livre'].includes(o.escrowStatus)
  );
  const pendingOrders = orders.filter(o => o.escrowStatus === 'pending');
  const recentOrders = orders.slice(0, 5);

  const isSeller = user?.role === 'seller';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Greetings */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0, letterSpacing: '-0.02em' }}>
          {isSeller ? 'Espace Vendeur Coopératif' : 'Espace Client B2B'} — {user?.fullName || user?.email}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {isSeller 
            ? 'Gérez vos stocks, suivez vos versements sécurisés et ajoutez vos récoltes.'
            : 'Explorez le catalogue national et gérez vos commandes en cours.'}
        </p>
      </div>

      {isSeller ? (
        /* ================= SELLER COOPERATIVE OVERHAUL ================= */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
          {/* Action Card 1: Add Product */}
          <Link href="/dashboard/products/add" style={{ textDecoration: 'none' }}>
            <Card style={{ 
              height: '100%', 
              cursor: 'pointer', 
              transition: 'transform 0.2s, box-shadow 0.2s', 
              border: '2px dashed var(--border-color)' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            >
              <CardContent style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1.25rem', textAlign: 'center' }}>
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(10, 46, 54, 0.05)', color: 'var(--primary-color)' }}>
                  <Plus size={40} aria-hidden="true" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)', margin: '0 0 0.5rem 0' }}>
                    Ajouter un Produit
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    Mettez en vente vos récoltes, produits transformés ou artisanat sur le marché.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Action Card 2: Wallet & Escrow Ledger */}
          <Card>
            <CardContent style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34, 197, 94, 0.08)', color: '#16a34a' }}>
                  <Wallet size={28} aria-hidden="true" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                  Mes Ventes et Mon Argent
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Available Funds */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Fonds Disponibles (Libérés)
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
                    {loading ? '...' : `${availableFunds.toLocaleString('fr-FR')} FCFA`}
                  </div>
                </div>

                {/* Blocked Escrow Funds */}
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Fonds Bloqués en Séquestre
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ca8a04', marginTop: '0.25rem' }}>
                    {loading ? '...' : `${blockedFunds.toLocaleString('fr-FR')} FCFA`}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.5rem 0 0 0', lineHeight: 1.4 }}>
                    Sécurisés dans le séquestre. Libérés dès réception de la marchandise par l'acheteur.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ================= BUYER KPI CARDS ================= */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Chiffre d'affaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                {loading ? '...' : `${totalRevenue.toLocaleString('fr-FR')} FCFA`}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Commandes terminées
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Commandes Actives</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                {loading ? '...' : activeOrders.length}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {pendingOrders.length} en attente de validation
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Total Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                {loading ? '...' : orders.length}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                <Link href="/dashboard/orders" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>
                  Voir toutes →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section Recommandations de Proximité B2B (Matching Recommender) */}
      {!isSeller && user?.country && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Handshake size={20} aria-hidden="true" /> Recommandations de Proximité B2B (Cameroun)
          </h3>
          {loadingRecs ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Recherche de partenaires proches...</p>
          ) : recommendations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>Aucune recommandation dans votre région pour le moment.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {recommendations.map((prod) => {
                const vendorName = prod.producer?.companyName || prod.producer?.fullName || 'Producteur local';
                const score = prod.score;
                return (
                  <Card key={prod.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                    <CardHeader style={{ padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>
                          Score Match : {score}%
                        </span>
                        <Badge variant="info">
                          <MapPin size={12} aria-hidden="true" /> {getRegionLabel(prod.country)}
                        </Badge>
                      </div>
                      <CardTitle style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                        {prod.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent style={{ padding: '0 1.25rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Par <strong>{vendorName}</strong> {prod.producer?.isVerified && <ShieldCheck size={14} aria-label="Vendeur vérifié" />}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '0.5rem 0 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {prod.description || 'Pas de description.'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {prod.price.toLocaleString()} FCFA
                        </span>
                        <Link href={`/marketplace/product/${prod.id}`}>
                          <Button variant="outline" size="sm">Consulter</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent Orders Table */}
      <Card>
        <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <CardTitle>
            {isSeller ? 'Commandes Clients Récentes' : 'Mes Commandes Récentes'}
          </CardTitle>
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">Voir tout</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Chargement...
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <ClipboardList size={34} aria-hidden="true" style={{ marginBottom: '0.5rem' }} />
              <p>Aucune commande pour le moment.</p>
              {!isSeller && (
                <Link href="/marketplace">
                  <Button variant="primary" size="sm" style={{ marginTop: '1rem' }}>
                    Explorer la marketplace
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Qté</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => {
                  const firstItem = order.items?.[0];
                  const extraCount = (order.items?.length ?? 0) - 1;
                  return (
                    <TableRow key={order.id}>
                      <TableCell style={{ fontWeight: 600 }}>#{order.id.toString().substring(0, 8)}</TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 500 }}>
                          {firstItem?.product?.name || 'Produit'}
                          {extraCount > 0 ? ` +${extraCount} autre(s)` : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={12} aria-hidden="true" /> {getRegionLabel(firstItem?.product?.country || '')}
                        </div>
                      </TableCell>
                      <TableCell>{firstItem?.quantity ?? '—'}</TableCell>
                      <TableCell style={{ fontWeight: 600 }}>{order.montantTotal.toLocaleString('fr-FR')} FCFA</TableCell>
                      <TableCell>
                        <Badge variant={ESCROW_STATUS_VARIANTS[order.escrowStatus] || 'info'}>
                          {ESCROW_STATUS_LABELS[order.escrowStatus] || order.escrowStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
