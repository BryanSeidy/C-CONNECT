'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { disputeService } from '@/services/disputes';
import { Dispute } from '@/types';
import { AlertTriangle, Plus, ShieldAlert, X } from 'lucide-react';

const REASON_LABELS: Record<Dispute['raison'], string> = {
  marchandise_non_recue: 'Marchandise non reçue',
  qualite_non_conforme: 'Qualité non conforme',
  quantite_incorrecte: 'Quantité incorrecte',
  produit_endommage: 'Produit endommagé',
  retard_livraison: 'Retard de livraison',
  autre: 'Autre',
};

const STATUS_LABELS: Record<Dispute['statut'], string> = {
  ouvert: 'Ouvert',
  en_instruction: 'En instruction',
  resolu_rembourse: 'Résolu — remboursé',
  resolu_libere: 'Résolu — fonds libérés',
  clos: 'Clos',
};

function DisputesContent() {
  const searchParams = useSearchParams();
  const preselectedOrder = searchParams.get('order');

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(Boolean(preselectedOrder));
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    orderId: preselectedOrder || '',
    raison: 'marchandise_non_recue' as Dispute['raison'],
    description: '',
  });

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await disputeService.getDisputes();
      setDisputes(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de charger les litiges.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.description) return;

    setSubmitting(true);
    setError(null);
    try {
      await disputeService.fileDispute({
        orderId: form.orderId,
        raison: form.raison,
        description: form.description,
      });
      setForm({ orderId: '', raison: 'marchandise_non_recue', description: '' });
      setShowForm(false);
      await fetchDisputes();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible d'ouvrir le litige.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>
            Centre de Litiges
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: 560 }}>
            Tant qu&apos;un litige est ouvert, les fonds restent bloqués en séquestre. Une équipe C-Connect examine chaque dossier.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {showForm ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          {showForm ? 'Annuler' : 'Signaler un problème'}
        </Button>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(211,47,47,0.08)', color: 'var(--error)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Ouvrir un litige</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Numéro de commande
                </label>
                <input
                  type="text"
                  value={form.orderId}
                  onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
                  required
                  placeholder="ID de la commande concernée"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Motif
                </label>
                <select
                  value={form.raison}
                  onChange={(e) => setForm((f) => ({ ...f, raison: e.target.value as Dispute['raison'] }))}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                >
                  {Object.entries(REASON_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Description détaillée
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Décrivez précisément le problème rencontré..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <Button type="submit" variant="primary" isLoading={submitting} style={{ alignSelf: 'flex-start' }}>
                Soumettre le litige
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
      ) : disputes.length === 0 ? (
        <Card>
          <CardContent style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <ShieldAlert size={32} aria-hidden="true" style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Aucun litige ouvert. C&apos;est bon signe.</p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardContent style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} aria-hidden="true" style={{ color: 'var(--warning)', marginTop: '0.1rem' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      Commande #{String(dispute.orderId).toString().padStart(4, '0')} — {REASON_LABELS[dispute.raison]}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0 0', maxWidth: 520 }}>{dispute.description}</p>
                  </div>
                </div>
                <Badge variant={dispute.statut === 'ouvert' ? 'warning' : dispute.statut.startsWith('resolu') ? 'success' : 'info'}>
                  {STATUS_LABELS[dispute.statut]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardDisputes() {
  return (
    <React.Suspense fallback={<p style={{ color: 'var(--text-muted)' }}>Chargement...</p>}>
      <DisputesContent />
    </React.Suspense>
  );
}
