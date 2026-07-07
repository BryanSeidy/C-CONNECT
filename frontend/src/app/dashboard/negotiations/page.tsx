'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { negotiationService } from '@/services/negotiations';
import { useAuth } from '@/hooks/useAuth';
import { getRegionLabel } from '@/lib/regions';
import { Handshake, MapPin, MessageSquare } from 'lucide-react';

export default function DashboardNegotiations() {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Counter-offer states
  const [activeCounterId, setActiveCounterId] = useState<number | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [counterMessage, setCounterMessage] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<number | null>(null);

  const fetchNegotiations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await negotiationService.getNegotiations();
      setNegotiations(res?.data || []);
    } catch (err: any) {
      setError(err?.message || 'Impossible de récupérer les négociations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNegotiations();
  }, [fetchNegotiations]);

  const handleAction = async (id: number, status: 'ACCEPTED' | 'DECLINED') => {
    setSubmittingAction(id);
    try {
      await negotiationService.updateNegotiationStatus(id, status);
      await fetchNegotiations();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du traitement.');
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleCounterSubmit = async (id: number) => {
    if (counterPrice <= 0) {
      setError('Veuillez spécifier un tarif valide.');
      return;
    }
    setSubmittingAction(id);
    try {
      await negotiationService.updateNegotiationStatus(
        id,
        'COUNTERED',
        counterPrice,
        counterMessage || `Contre-proposition formulée à ${counterPrice} FCFA`
      );
      setActiveCounterId(null);
      setCounterPrice(0);
      setCounterMessage('');
      await fetchNegotiations();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la contre-proposition.');
    } finally {
      setSubmittingAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge variant="success">Accepté (Commande générée)</Badge>;
      case 'DECLINED':
        return <Badge variant="error">Décliné</Badge>;
      case 'COUNTERED':
        return <Badge variant="warning">Contre-proposition en attente</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="info">En attente de réponse</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
          Espace Négociations & Devis B2B
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Suivez les offres de tarifs personnalisés et de volumes négociés sur vos produits.
        </p>
      </div>

      <Card>
        <CardContent style={{ padding: '1.5rem' }}>
          {error && (
            <p style={{ color: 'var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
              {error}
            </p>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chargement...</div>
          ) : negotiations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Handshake size={44} aria-hidden="true" style={{ marginBottom: '1rem' }} />
              <p style={{ margin: 0 }}>Aucune négociation ou demande de devis en cours.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>{user?.role === 'seller' ? 'Acheteur' : 'Vendeur'}</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Prix Proposé (U)</TableHead>
                  <TableHead>Total Négocié</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {negotiations.map((neg) => {
                  const otherParty = user?.role === 'seller' ? neg.buyer : neg.seller;
                  const finalUnitPrice = neg.status === 'COUNTERED' ? (neg.counterPrice ?? neg.proposedPrice) : neg.proposedPrice;
                  const originalTotal = neg.product.price * neg.quantity;
                  const negotiatedTotal = finalUnitPrice * neg.quantity;
                  const savings = originalTotal - negotiatedTotal;

                  return (
                    <React.Fragment key={neg.id}>
                      <TableRow style={{ verticalAlign: 'middle' }}>
                        <TableCell style={{ fontWeight: 600 }}>#{neg.id.toString().padStart(4, '0')}</TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 500 }}>{neg.product.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Catégorie : {neg.product.category}</div>
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 500 }}>{otherParty?.companyName || otherParty?.fullName || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} aria-hidden="true" /> {getRegionLabel(otherParty?.country)}</div>
                        </TableCell>
                        <TableCell>{neg.quantity} unités</TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 600 }}>{finalUnitPrice.toLocaleString()} FCFA</div>
                          {neg.status === 'COUNTERED' && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              {neg.proposedPrice.toLocaleString()} FCFA
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{negotiatedTotal.toLocaleString()} FCFA</div>
                          {savings > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 500 }}>
                              Économie : -{savings.toLocaleString()} FCFA
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(neg.status)}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {/* Seller Actions for PENDING */}
                            {user?.role === 'seller' && neg.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleAction(neg.id, 'ACCEPTED')}
                                  isLoading={submittingAction === neg.id}
                                >
                                  Accepter
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActiveCounterId(activeCounterId === neg.id ? null : neg.id);
                                    setCounterPrice(neg.proposedPrice);
                                    setCounterMessage('');
                                  }}
                                >
                                  Contre-proposer
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  style={{ color: 'var(--error)' }}
                                  onClick={() => handleAction(neg.id, 'DECLINED')}
                                  isLoading={submittingAction === neg.id}
                                >
                                  Décliner
                                </Button>
                              </>
                            )}

                            {/* Buyer Actions for COUNTERED */}
                            {user?.role === 'buyer' && neg.status === 'COUNTERED' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleAction(neg.id, 'ACCEPTED')}
                                  isLoading={submittingAction === neg.id}
                                >
                                  Accepter le contre-tarif
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  style={{ color: 'var(--error)' }}
                                  onClick={() => handleAction(neg.id, 'DECLINED')}
                                  isLoading={submittingAction === neg.id}
                                >
                                  Décliner
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Comment / Message Row */}
                      {neg.message && (
                        <TableRow style={{ backgroundColor: '#F8FAFC' }}>
                          <TableCell colSpan={8} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 1.5rem' }}>
                            <MessageSquare size={14} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} /> <strong>Message de {neg.buyerId === user?.id ? 'vous' : 'l\'acheteur'} :</strong> "{neg.message}"
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Counter Proposal Form (Seller only) */}
                      {activeCounterId === neg.id && (
                        <TableRow style={{ backgroundColor: '#FFFDF5' }}>
                          <TableCell colSpan={8} style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '600px' }}>
                              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#D97706' }}>
                                Formuler une contre-proposition
                              </h4>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                    Nouveau Prix Unitaire (FCFA)
                                  </label>
                                  <input
                                    type="number"
                                    value={counterPrice}
                                    onChange={(e) => setCounterPrice(Number(e.target.value))}
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                    Message d'accompagnement
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Expliquez ce tarif (ex: qualité supérieure, frais logistiques...)"
                                    value={counterMessage}
                                    onChange={(e) => setCounterMessage(e.target.value)}
                                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <Button size="sm" variant="outline" onClick={() => setActiveCounterId(null)}>
                                  Annuler
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleCounterSubmit(neg.id)}
                                  isLoading={submittingAction === neg.id}
                                >
                                  Envoyer la contre-proposition
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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
