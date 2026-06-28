'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/orders';
import { Order } from '@/types';
import { matchingService } from '@/services/matching';
import { getRegionLabel } from '@/lib/regions';
import { ClipboardList, Handshake, MapPin, ShieldCheck } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
  COMPLETED: 'Terminé',
};

const STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'error' | 'info'> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'error',
  COMPLETED: 'info',
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res: any = await orderService.getOrders();
        setOrders(res?.data || []);
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
        const res: any = await matchingService.getRecommendations({
          country: user.country,
          limit: 3
        });
        setRecommendations(res?.data?.products || []);
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


  const totalRevenue = orders
    .filter(o => o.status === 'COMPLETED' || o.status === 'CONFIRMED')
    .reduce((sum, o) => sum + o.total, 0);

  const activeOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED');
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const recentOrders = orders.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Salutation */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>
          Bonjour, {user?.fullName || user?.email}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Voici un aperçu de votre activité sur C-Connect.
        </p>
      </div>

      {/* KPI Cards */}
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
              Commandes confirmées + terminées
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
              {pendingOrders.length} en attente de confirmation
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

      {/* Section Recommandations de Proximité B2B (Matching Recommender) */}
      {user?.role === 'buyer' && (
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
          <CardTitle>Commandes Récentes</CardTitle>
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
              <Link href="/marketplace">
                <Button variant="primary" size="sm" style={{ marginTop: '1rem' }}>
                  Explorer la marketplace
                </Button>
              </Link>
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
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell style={{ fontWeight: 600 }}>#{order.id.toString().padStart(4, '0')}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{order.product?.name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.product?.country}</div>
                    </TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{order.total.toLocaleString('fr-FR')} FCFA</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[order.status] || 'info'}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
