'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import inputStyles from '@/components/ui/Input.module.css';
import { REGION_OPTIONS } from '@/lib/regions';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(user?.fullName || '');
    setCompanyName(user?.companyName || '');
    setCountry(user?.country || '');
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await authService.updateProfile({ fullName, companyName, country });
      await refreshProfile();
      setMessage('Profil mis a jour avec succes.');
    } catch (err: any) {
      setError(err?.message || 'Impossible de mettre a jour le profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section style={{ maxWidth: 700, background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      <h1 style={{ marginTop: 0 }}>Mon profil professionnel</h1>
      <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input label="Email" value={user?.email || ''} disabled />
        <Input label="Role" value={user?.role || ''} disabled />
        <Input label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Entreprise" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        
        <div className={inputStyles.wrapper}>
          <label className={inputStyles.label}>Région</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputStyles.input}
          >
            <option value="">Sélectionnez votre région</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label} ({r.code})
              </option>
            ))}
          </select>
        </div>

        {message && <p style={{ margin: 0, color: 'var(--success)' }}>{message}</p>}
        {error && <p style={{ margin: 0, color: 'var(--error)' }}>{error}</p>}

        <div>
          <Button type="submit" isLoading={saving}>Enregistrer</Button>
        </div>
      </form>
    </section>
  );
}
