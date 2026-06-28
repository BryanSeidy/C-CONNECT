'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

type AuthRole = 'buyer' | 'seller';

interface AuthFormProps {
  type: 'login' | 'register';
  title: string;
  subtitle: string;
  submitText: string;
  onSubmit: (email: string, password: string, fullName: string, role: AuthRole) => Promise<void>;
  alternateHref?: string;
  successMessage?: string;
}

type FieldErrors = Partial<Record<'email' | 'password' | 'fullName', string>>;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.';
}

function validateAuthForm(type: AuthFormProps['type'], email: string, password: string, fullName: string): FieldErrors {
  const errors: FieldErrors = {};
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    errors.email = 'Adresse email requise.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Adresse email invalide.';
  }

  if (!password) {
    errors.password = 'Mot de passe requis.';
  } else if (password.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères.';
  }

  if (type === 'register' && fullName.trim().length < 2) {
    errors.fullName = 'Nom complet requis.';
  }

  return errors;
}

export const AuthForm = ({ type, title, subtitle, submitText, onSubmit, alternateHref, successMessage }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const fallbackAlternateHref = type === 'login' ? '/register' : '/login';
  const resolvedAlternateHref = alternateHref ?? fallbackAlternateHref;

  const canSubmit = !loading && email.trim().length > 0 && password.length >= 6 && (type === 'login' || fullName.trim().length >= 2);

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - 72px)', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <form
        className="glass-panel"
        noValidate
        aria-describedby={error ? 'auth-error' : successMessage ? 'auth-success' : undefined}
        style={{ width: '100%', maxWidth: '440px', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--bg-card)' }}
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const validationErrors = validateAuthForm(type, email, password, fullName);
          setFieldErrors(validationErrors);

          if (Object.keys(validationErrors).length > 0) return;

          setLoading(true);
          try {
            await onSubmit(email.trim().toLowerCase(), password, fullName.trim(), role);
          } catch (err: unknown) {
            setError(getErrorMessage(err));
          } finally {
            setLoading(false);
          }
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color)', margin: '0 0 0.5rem 0' }}>{title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: 0 }}>{subtitle}</p>
        </div>

        {successMessage && (
          <div id="auth-success" role="status" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34, 197, 94, 0.09)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#15803d', fontSize: '0.875rem', fontWeight: 600 }}>
            {successMessage}
          </div>
        )}

        {error && (
          <div id="auth-error" role="alert" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', fontSize: '0.875rem', fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}

        {type === 'register' && (
          <Input type="text" label="Nom complet" placeholder="Jean Dupont" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" error={fieldErrors.fullName} />
        )}

        <Input type="email" label="Adresse Email" placeholder="exemple@c-connect.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" error={fieldErrors.email} />

        <Input type="password" label="Mot de passe" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={type === 'login' ? 'current-password' : 'new-password'} error={fieldErrors.password} />

        {type === 'register' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="auth-role" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Rôle sur la plateforme</label>
            <select id="auth-role" value={role} onChange={(e) => setRole(e.target.value as AuthRole)} style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-primary)', fontSize: '1rem', color: 'var(--text-main)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', outline: 'none', cursor: 'pointer' }}>
              <option value="buyer">Acheteur (B2B)</option>
              <option value="seller">Producteur / Vendeur</option>
            </select>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading} disabled={!canSubmit} style={{ marginTop: '1rem' }}>
          {submitText}
        </Button>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          {type === 'login' ? (
            <span style={{ color: 'var(--text-muted)' }}>Pas encore de compte ? <Link href={resolvedAlternateHref} style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>S&apos;inscrire</Link></span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Déjà un compte ? <Link href={resolvedAlternateHref} style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link></span>
          )}
        </div>
      </form>
    </div>
  );
};
