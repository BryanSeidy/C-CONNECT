'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { negotiationService } from '@/services/negotiations';
import { useAuth } from '@/hooks/useAuth';
import { getRegionLabel } from '@/lib/regions';
import { extractApiError } from '@/lib/errors';
import { Negotiation } from '@/types';
import { Handshake, MapPin, MessageSquare } from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export default function DashboardNegotiations() {
  return (
    <RoleGuard allowedRoles={['buyer', 'seller']}>
      <DashboardNegotiationsContent />
    </RoleGuard>
  );
}

function DashboardNegotiationsContent() {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Counter-offer states
  const [activeCounterId, setActiveCounterId] = useState<number | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [counterMessage, setCounterMessage] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<number | null>(null);
  const { showToast } = useToast();
  const confirmDialog = useConfirm();

  const fetchNegotiations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await negotiationService.getNegotiations();
      setNegotiations(data);
    } catch (err) {
      setError(extractApiError(err, 'Impossible de récupérer les négociations.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNegotiations();
  }, [fetchNegotiations]);

  const handleAction = async (id: number, status: 'ACCEPTED' | 'DECLINED') => {
    if (status === 'DECLINED') {
      const ok = await confirmDialog({
        title: 'Décliner cette négociation ?',
        message: 'L\'autre partie sera notifiée du refus. Vous ne pourrez plus revenir sur cette décision pour cette offre.',
        confirmLabel: 'Décliner',
        cancelLabel: 'Revenir en arrière',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setSubmittingAction(id);
    try {
      await negotiationService.updateNegotiationStatus(id, status);
      await fetchNegotiations();
      showToast(status === 'ACCEPTED' ? 'Négociation acceptée.' : 'Négociation déclinée.', status === 'ACCEPTED' ? 'success' : 'info');
    } catch (err) {
      const msg = extractApiError(err, 'Erreur lors du traitement.');
      setError(msg);
      showToast(msg, 'error');
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
    } catch (err) {
      setError(extractApiError(err, 'Erreur lors de la contre-proposition.'));
    } finally {
      setSubmittingAction(null);
    }
  };

  const getStatusBadge = (status: string, orderId?: number | null) => {
    switch (status) {
      case 'ACCEPTED':
        return orderId
          ? <Badge variant="success">Accepté — commande passée</Badge>
          : <Badge variant="success">Accepté</Badge>;
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
            <EmptyState icon={Handshake} message="Aucune négociation ou demande de devis en cours." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {negotiations.map((neg) => {
                const otherParty = user?.role === 'seller' ? neg.buyer : neg.seller;
                const finalUnitPrice = neg.status === 'COUNTERED' ? (neg.counterPrice ?? neg.proposedPrice) : neg.proposedPrice;
                const originalTotal = neg.product.price * neg.quantity;
                const negotiatedTotal = finalUnitPrice * neg.quantity;
                const savings = originalTotal - negotiatedTotal;

                return (
                  <div
                    key={neg.id}
                    style={{
                      border: '1px solid var(--border-subtle, var(--border-color))',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    {/* En-tête : produit + statut */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{neg.product.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          #{neg.id.toString().padStart(4, '0')} — {neg.product.category}
                        </div>
                      </div>
                      {getStatusBadge(neg.status, neg.orderId)}
                    </div>

                    {/* Partie adverse */}
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                        {otherParty?.companyName || otherParty?.fullName || '—'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <MapPin size={12} aria-hidden="true" /> {getRegionLabel(otherParty?.country)}
                      </span>
                    </div>

                    {/* Quantité / prix / total — grille responsive */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', padding: '0.75rem 0', borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quantité</div>
                        <div style={{ fontWeight: 600 }}>{neg.quantity} unités</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prix unitaire</div>
                        <div style={{ fontWeight: 600 }}>{finalUnitPrice.toLocaleString()} FCFA</div>
                        {neg.status === 'COUNTERED' && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {neg.proposedPrice.toLocaleString()} FCFA
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total négocié</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{negotiatedTotal.toLocaleString()} FCFA</div>
                        {savings > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 500 }}>
                            -{savings.toLocaleString()} FCFA
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    {neg.message && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                        <MessageSquare size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
                        <strong>{neg.buyerId === user?.id ? 'Vous' : "L'acheteur"} :</strong> &quot;{neg.message}&quot;
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {user?.role === 'seller' && neg.status === 'PENDING' && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => handleAction(neg.id, 'ACCEPTED')} isLoading={submittingAction === neg.id}>
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
                          <Button variant="ghost" size="sm" style={{ color: 'var(--error)' }} onClick={() => handleAction(neg.id, 'DECLINED')} isLoading={submittingAction === neg.id}>
                            Décliner
                          </Button>
                        </>
                      )}

                      {user?.role === 'buyer' && neg.status === 'COUNTERED' && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => handleAction(neg.id, 'ACCEPTED')} isLoading={submittingAction === neg.id}>
                            Accepter le contre-tarif
                          </Button>
                          <Button variant="ghost" size="sm" style={{ color: 'var(--error)' }} onClick={() => handleAction(neg.id, 'DECLINED')} isLoading={submittingAction === neg.id}>
                            Décliner
                          </Button>
                        </>
                      )}

                      {user?.role === 'buyer' && neg.status === 'ACCEPTED' && (
                        neg.orderId ? (
                          <Link href={`/checkout?order=${neg.orderId}`} style={{ width: '100%' }}>
                            <Button variant="ghost" size="sm" style={{ width: '100%' }}>
                              Commande déjà passée — voir le paiement
                            </Button>
                          </Link>
                        ) : neg.product.slug ? (
                          <Link
                            href={`/marketplace/${neg.product.slug}?negotiation=${neg.id}&qty=${neg.quantity}&price=${neg.counterPrice ?? neg.proposedPrice}`}
                            style={{ width: '100%' }}
                          >
                            <Button variant="primary" size="sm" style={{ width: '100%' }}>
                              Passer commande au prix négocié
                            </Button>
                          </Link>
                        ) : null
                      )}
                    </div>

                    {/* Formulaire de contre-proposition */}
                    {activeCounterId === neg.id && (
                      <div style={{ background: '#FFFDF5', border: '1px solid #FDE68A', borderRadius: 'var(--radius-sm)', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#D97706' }}>
                          Formuler une contre-proposition
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                              Nouveau prix unitaire (FCFA)
                            </label>
                            <input
                              type="number"
                              value={counterPrice}
                              onChange={(e) => setCounterPrice(Number(e.target.value))}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '1rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                              Message d&apos;accompagnement
                            </label>
                            <input
                              type="text"
                              placeholder="Expliquez ce tarif (ex : qualité supérieure, frais logistiques…)"
                              value={counterMessage}
                              onChange={(e) => setCounterMessage(e.target.value)}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '1rem' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Button size="sm" variant="outline" onClick={() => setActiveCounterId(null)}>
                            Annuler
                          </Button>
                          <Button size="sm" variant="primary" onClick={() => handleCounterSubmit(neg.id)} isLoading={submittingAction === neg.id}>
                            Envoyer la contre-proposition
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
