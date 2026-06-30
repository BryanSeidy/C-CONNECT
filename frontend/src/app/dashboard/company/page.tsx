'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { companyService } from '@/services/companies';
import { Company } from '@/types';
import { REGION_OPTIONS } from '@/lib/regions';
import { Building2, ShieldCheck } from 'lucide-react';

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'cooperative', label: 'Coopérative' },
  { value: 'producteur', label: 'Producteur' },
  { value: 'fabricant', label: 'Fabricant' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hôtel' },
  { value: 'supermarche', label: 'Supermarché' },
  { value: 'grossiste', label: 'Grossiste' },
  { value: 'distributeur', label: 'Distributeur' },
  { value: 'ong', label: 'ONG' },
  { value: 'institution', label: 'Institution publique' },
  { value: 'pme', label: 'PME' },
  { value: 'autre', label: 'Autre' },
];

function emptyForm() {
  return {
    nom: '',
    typeEntreprise: 'pme',
    region: '',
    ville: '',
    quartier: '',
    telephone: '',
    emailProfessionnel: '',
    rccm: '',
    niu: '',
    description: '',
  };
}

export default function DashboardCompany() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const fetchCompany = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    try {
      const res = await companyService.getCompanyBySlugOrId(String(user.companyId));
      setCompany(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de charger le profil d'entreprise.");
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom) return;

    setSaving(true);
    setError(null);
    try {
      const res = company
        ? await companyService.updateCompany(company.id, form)
        : await companyService.createCompany(form as any);
      setCompany(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de sauvegarder le profil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 720 }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>
          Profil Entreprise
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Vos informations légales et professionnelles renforcent la confiance des acheteurs et fournisseurs.
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(211,47,47,0.08)', color: 'var(--error)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {company && (
        <Card>
          <CardContent style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Building2 size={28} aria-hidden="true" style={{ color: 'var(--primary-color)' }} />
              <div>
                <div style={{ fontWeight: 650, color: 'var(--text-main)' }}>{company.nom}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Score de confiance : <strong style={{ color: 'var(--primary-color)' }}>{company.trustScore}/100</strong>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {company.badges?.map((badge) => (
                <Badge key={badge.code} variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ShieldCheck size={12} aria-hidden="true" /> {badge.label}
                </Badge>
              ))}
              {(!company.badges || company.badges.length === 0) && (
                <Badge variant="default">Vérification en cours</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{company ? "Modifier les informations" : "Créer le profil d'entreprise"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Nom de l'entreprise"
              value={form.nom || company?.nom || ''}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Type d&apos;entreprise
                </label>
                <select
                  value={form.typeEntreprise || company?.typeEntreprise || 'pme'}
                  onChange={(e) => setForm((f) => ({ ...f, typeEntreprise: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Région
                </label>
                <select
                  value={form.region || company?.region || ''}
                  onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                >
                  <option value="">Sélectionner</option>
                  {REGION_OPTIONS.map((r) => (
                    <option key={r.code} value={r.label}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Input
                label="Ville"
                value={form.ville || company?.ville || ''}
                onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))}
              />
              <Input
                label="Quartier"
                value={form.quartier || company?.quartier || ''}
                onChange={(e) => setForm((f) => ({ ...f, quartier: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Input
                label="Téléphone"
                value={form.telephone || company?.telephone || ''}
                onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              />
              <Input
                label="Email professionnel"
                type="email"
                value={form.emailProfessionnel || company?.emailProfessionnel || ''}
                onChange={(e) => setForm((f) => ({ ...f, emailProfessionnel: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Input
                label="RCCM"
                placeholder="Registre du Commerce"
                value={form.rccm || company?.rccm || ''}
                onChange={(e) => setForm((f) => ({ ...f, rccm: e.target.value }))}
              />
              <Input
                label="NIU"
                placeholder="Numéro d'Identifiant Unique"
                value={form.niu || company?.niu || ''}
                onChange={(e) => setForm((f) => ({ ...f, niu: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Présentation de l&apos;entreprise
              </label>
              <textarea
                value={form.description || company?.description || ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Décrivez votre activité, vos produits, vos certifications..."
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

            <Button type="submit" variant="primary" isLoading={saving} style={{ alignSelf: 'flex-start' }}>
              {company ? 'Enregistrer les modifications' : 'Créer le profil'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
