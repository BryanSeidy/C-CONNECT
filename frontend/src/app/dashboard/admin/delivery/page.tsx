'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Truck, Plus, Power } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { REGION_OPTIONS } from '@/lib/regions';
import { deliveryPartnerAdminService, DeliveryPartner } from '@/services/delivery';
import styles from '../Admin.module.css';

export default function AdminDeliveryPage() {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState(REGION_OPTIONS[0]?.code ?? '');

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await deliveryPartnerAdminService.list();
      setPartners(data);
    } catch {
      setError('Impossible de charger les livreurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim() || !region) return;
    setSubmitting(true);
    setError(null);
    try {
      await deliveryPartnerAdminService.create({
        nom: nom.trim(),
        telephone: telephone.trim(),
        email: email.trim() || undefined,
        region,
      });
      setNom(''); setTelephone(''); setEmail('');
      setShowForm(false);
      await fetchPartners();
    } catch {
      setError("Impossible d'enregistrer ce livreur. Vérifiez les champs.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (partner: DeliveryPartner) => {
    try {
      await deliveryPartnerAdminService.update(partner.id, { actif: !partner.actif });
      await fetchPartners();
    } catch {
      setError("Impossible de mettre à jour ce livreur.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.count}>{partners.length} livreur(s) sous-traitant(s)</span>
        <Button variant="primary" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} aria-hidden="true" /> Ajouter un livreur
        </Button>
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
        Un livreur actif dans la région de livraison est contacté automatiquement par email dès qu&apos;un
        acheteur valide une commande avec livraison à domicile. Pas d&apos;envoi SMS pour l&apos;instant — le
        numéro de téléphone reste affiché ici pour un contact manuel si besoin.
      </p>

      {error && <div className={styles.error}>{error}</div>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem',
            padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
          }}
        >
          <input placeholder="Nom du livreur" value={nom} onChange={(e) => setNom(e.target.value)} required
            style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} />
          <input placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} required
            style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} />
          <input placeholder="Email (pour la notification)" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} />
          <select value={region} onChange={(e) => setRegion(e.target.value)}
            style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            {REGION_OPTIONS.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
          </select>
          <Button type="submit" variant="primary" isLoading={submitting} style={{ gridColumn: '1 / -1' }}>
            Enregistrer le livreur
          </Button>
        </form>
      )}

      {loading ? (
        <p className={styles.loading}>Chargement…</p>
      ) : partners.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Aucun livreur enregistré pour l&apos;instant.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {partners.map((p) => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
              padding: '0.85rem 1.1rem', border: '1px solid var(--border-subtle, var(--border-color))', borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Truck size={18} aria-hidden="true" style={{ color: 'var(--primary-color)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.nom}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {p.telephone} · {p.region} · {p.livraisons_en_cours} livraison(s) en cours
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Badge variant={p.actif ? 'success' : 'default'}>{p.actif ? 'Actif' : 'Inactif'}</Badge>
                <Button variant="outline" size="sm" onClick={() => toggleActive(p)}>
                  <Power size={13} aria-hidden="true" /> {p.actif ? 'Désactiver' : 'Activer'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
