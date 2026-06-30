'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { rfqService } from '@/services/rfqs';
import { Rfq, RfqBid } from '@/types';
import { getRegionLabel, REGION_OPTIONS } from '@/lib/regions';
import { CheckCircle2, ClipboardList, Plus, ShieldCheck, X, XCircle } from 'lucide-react';

const RFQ_STATUS_LABELS: Record<Rfq['statut'], string> = {
  active: 'Ouverte aux offres',
  en_negociation: 'En négociation',
  satisfaite: 'Satisfaite',
  expiree: 'Expirée',
  annulee: 'Annulée',
};

const UNIT_OPTIONS = ['kg', 'tonnes', 'sacs', 'caisses', 'litres', 'unites'];

function emptyForm() {
  return {
    titre: '',
    description: '',
    quantite: '',
    unite: 'kg',
    budgetMax: '',
    regionLivraison: '',
    villeLivraison: '',
    delaiLivraison: '',
    vendeurVerifieRequis: false,
    cooperativeUniquement: false,
    femmesEntrepreneuresPrefere: false,
  };
}

export default function DashboardRfqs() {
  const { user } = useAuth();
  const isBuyer = user?.role === 'buyer';

  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [bidForms, setBidForms] = useState<Record<string, { prix: string; quantite: string; message: string }>>({});
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isBuyer) {
        const res = await rfqService.getMyRfqs();
        setRfqs(res.data);
      } else {
        const res = await rfqService.getActiveRfqs();
        setRfqs(res.data.items);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de charger les demandes de devis.');
      setRfqs([]);
    } finally {
      setLoading(false);
    }
  }, [isBuyer]);

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.description || !form.quantite) return;

    setSubmitting(true);
    setError(null);
    try {
      await rfqService.createRfq({
        titre: form.titre,
        description: form.description,
        quantite: parseFloat(form.quantite),
        unite: form.unite,
        budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : undefined,
        regionLivraison: form.regionLivraison || undefined,
        villeLivraison: form.villeLivraison || undefined,
        delaiLivraison: form.delaiLivraison || undefined,
        vendeurVerifieRequis: form.vendeurVerifieRequis,
        cooperativeUniquement: form.cooperativeUniquement,
        femmesEntrepreneuresPrefere: form.femmesEntrepreneuresPrefere,
      });
      setForm(emptyForm());
      setShowForm(false);
      await fetchRfqs();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de publier la demande.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitBid = async (rfqId: string) => {
    const draft = bidForms[rfqId];
    if (!draft?.prix || !draft?.quantite) return;

    setActionId(rfqId);
    try {
      await rfqService.submitBid(rfqId, {
        prixUnitairePropose: parseFloat(draft.prix),
        quantiteDisponible: parseFloat(draft.quantite),
        message: draft.message || undefined,
      });
      setBidForms((prev) => ({ ...prev, [rfqId]: { prix: '', quantite: '', message: '' } }));
      await fetchRfqs();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de soumettre votre offre.');
    } finally {
      setActionId(null);
    }
  };

  const handleBidDecision = async (rfqId: string, bid: RfqBid, decision: 'accept' | 'reject') => {
    setActionId(String(bid.id));
    try {
      if (decision === 'accept') {
        await rfqService.acceptBid(rfqId, bid.id);
      } else {
        await rfqService.rejectBid(rfqId, bid.id);
      }
      await fetchRfqs();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Action impossible.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>
            Demandes de Devis (RFQ)
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: 560 }}>
            {isBuyer
              ? "Publiez vos besoins d'approvisionnement et recevez des offres de fournisseurs vérifiés."
              : 'Parcourez les demandes actives des acheteurs professionnels et proposez votre meilleure offre.'}
          </p>
        </div>
        {isBuyer && (
          <Button variant="primary" onClick={() => setShowForm((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {showForm ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {showForm ? 'Annuler' : 'Publier une demande'}
          </Button>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(211,47,47,0.08)', color: 'var(--error)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {isBuyer && showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle demande de devis</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRfq} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Titre de la demande"
                placeholder="Ex. 500 kg d'oignons avant vendredi"
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                required
              />
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Description du besoin
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                  placeholder="Précisez la qualité attendue, la fréquence, les conditions de livraison..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <Input
                  label="Quantité"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={form.quantite}
                  onChange={(e) => setForm((f) => ({ ...f, quantite: e.target.value }))}
                  required
                />
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                    Unité
                  </label>
                  <select
                    value={form.unite}
                    onChange={(e) => setForm((f) => ({ ...f, unite: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Budget maximum / unité (XAF)"
                  type="number"
                  min={0}
                  value={form.budgetMax}
                  onChange={(e) => setForm((f) => ({ ...f, budgetMax: e.target.value }))}
                />
                <Input
                  label="Date limite de livraison"
                  type="date"
                  value={form.delaiLivraison}
                  onChange={(e) => setForm((f) => ({ ...f, delaiLivraison: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                    Région de livraison
                  </label>
                  <select
                    value={form.regionLivraison}
                    onChange={(e) => setForm((f) => ({ ...f, regionLivraison: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                  >
                    <option value="">Toutes régions</option>
                    {REGION_OPTIONS.map((r) => (
                      <option key={r.code} value={r.label}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Ville de livraison"
                  value={form.villeLivraison}
                  onChange={(e) => setForm((f) => ({ ...f, villeLivraison: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={form.vendeurVerifieRequis}
                    onChange={(e) => setForm((f) => ({ ...f, vendeurVerifieRequis: e.target.checked }))}
                  />
                  Fournisseur vérifié requis
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={form.cooperativeUniquement}
                    onChange={(e) => setForm((f) => ({ ...f, cooperativeUniquement: e.target.checked }))}
                  />
                  Coopératives uniquement
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={form.femmesEntrepreneuresPrefere}
                    onChange={(e) => setForm((f) => ({ ...f, femmesEntrepreneuresPrefere: e.target.checked }))}
                  />
                  Préférence entreprises dirigées par des femmes
                </label>
              </div>

              <Button type="submit" variant="primary" isLoading={submitting} style={{ alignSelf: 'flex-start' }}>
                Publier la demande
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Chargement des demandes...</p>
      ) : rfqs.length === 0 ? (
        <Card>
          <CardContent style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <ClipboardList size={32} aria-hidden="true" style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              {isBuyer ? "Vous n'avez publié aucune demande de devis." : 'Aucune demande active pour le moment.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rfqs.map((rfq) => (
            <Card key={rfq.id}>
              <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 650, color: 'var(--primary-color)', margin: '0 0 0.3rem 0' }}>
                      {rfq.titre}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, maxWidth: 600 }}>{rfq.description}</p>
                  </div>
                  <Badge variant={rfq.statut === 'active' ? 'success' : rfq.statut === 'annulee' ? 'error' : 'info'}>
                    {RFQ_STATUS_LABELS[rfq.statut]}
                  </Badge>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <span><strong style={{ color: 'var(--text-main)' }}>{rfq.quantite}</strong> {rfq.unite}</span>
                  {rfq.budgetMax && <span>Budget max : <strong style={{ color: 'var(--text-main)' }}>{rfq.budgetMax.toLocaleString('fr-FR')} XAF</strong>/unité</span>}
                  {rfq.regionLivraison && <span>{rfq.regionLivraison}</span>}
                  {rfq.delaiLivraison && <span>Avant le {new Date(rfq.delaiLivraison).toLocaleDateString('fr-FR')}</span>}
                  <span>{rfq.nombreOffres} offre(s)</span>
                </div>

                {rfq.vendeurVerifieRequis && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                    <ShieldCheck size={13} aria-hidden="true" /> Fournisseur vérifié exigé
                  </span>
                )}

                {isBuyer && rfq.bids && rfq.bids.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Offres reçues</h4>
                    {rfq.bids.map((bid) => (
                      <div
                        key={bid.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-app)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            {bid.seller?.user?.companyName || bid.seller?.businessName || 'Fournisseur'}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {bid.prixUnitairePropose.toLocaleString('fr-FR')} XAF/unité · {bid.quantiteDisponible} {rfq.unite} disponibles
                          </div>
                          {bid.message && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{bid.message}</div>}
                        </div>
                        {bid.statut === 'en_attente' ? (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <Button
                              size="sm"
                              variant="primary"
                              isLoading={actionId === String(bid.id)}
                              onClick={() => handleBidDecision(String(rfq.id), bid, 'accept')}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <CheckCircle2 size={14} aria-hidden="true" /> Accepter
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              isLoading={actionId === String(bid.id)}
                              onClick={() => handleBidDecision(String(rfq.id), bid, 'reject')}
                              style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <XCircle size={14} aria-hidden="true" /> Refuser
                            </Button>
                          </div>
                        ) : (
                          <Badge variant={bid.statut === 'acceptee' ? 'success' : 'default'}>
                            {bid.statut === 'acceptee' ? 'Acceptée' : bid.statut === 'refusee' ? 'Refusée' : bid.statut}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!isBuyer && rfq.statut === 'active' && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <Input
                      label="Votre prix / unité (XAF)"
                      type="number"
                      style={{ width: 160 }}
                      value={bidForms[String(rfq.id)]?.prix || ''}
                      onChange={(e) =>
                        setBidForms((prev) => ({
                          ...prev,
                          [String(rfq.id)]: {
                            prix: e.target.value,
                            quantite: prev[String(rfq.id)]?.quantite || '',
                            message: prev[String(rfq.id)]?.message || '',
                          },
                        }))
                      }
                    />
                    <Input
                      label="Quantité disponible"
                      type="number"
                      style={{ width: 160 }}
                      value={bidForms[String(rfq.id)]?.quantite || ''}
                      onChange={(e) =>
                        setBidForms((prev) => ({
                          ...prev,
                          [String(rfq.id)]: {
                            quantite: e.target.value,
                            prix: prev[String(rfq.id)]?.prix || '',
                            message: prev[String(rfq.id)]?.message || '',
                          },
                        }))
                      }
                    />
                    <Button
                      variant="primary"
                      isLoading={actionId === String(rfq.id)}
                      onClick={() => handleSubmitBid(String(rfq.id))}
                    >
                      Proposer une offre
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
