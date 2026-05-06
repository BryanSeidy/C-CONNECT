'use client';

import { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface AuthFormProps {
  type: 'login' | 'register';
  title: string;
  subtitle: string;
  submitText: string;
  withRole?: boolean;
  onSubmit: (email: string, password: string, role: string) => Promise<void>;
}

export const AuthForm = ({ type, title, subtitle, submitText, withRole, onSubmit }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('BUYER');
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - 72px)', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <form
        className="glass-panel"
        style={{ width: '100%', maxWidth: '440px', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--bg-card)' }}
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await onSubmit(email, password, role);
            // Redirection logic usually handled by parent
          } catch (err) {
            console.error(err);
          } finally {
            setLoading(false);
          }
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color)', margin: '0 0 0.5rem 0' }}>{title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: 0 }}>{subtitle}</p>
        </div>

        <Input 
          type="email" 
          label="Adresse Email" 
          placeholder="exemple@cemac.com" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        
        <Input 
          type="password" 
          label="Mot de passe" 
          placeholder="••••••••" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />

        {withRole && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Rôle sur la plateforme</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', fontFamily: 'var(--font-primary)', fontSize: '1rem',
                color: 'var(--text-main)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)', outline: 'none'
              }}
            >
              <option value="BUYER">Acheteur (B2B)</option>
              <option value="PRODUCER">Producteur / Vendeur</option>
            </select>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading} style={{ marginTop: '1rem' }}>
          {submitText}
        </Button>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          {type === 'login' ? (
            <span style={{ color: 'var(--text-muted)' }}>Pas encore de compte ? <a href="/register" style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>S'inscrire</a></span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Déjà un compte ? <a href="/login" style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>Se connecter</a></span>
          )}
        </div>
      </form>
    </div>
  );
};
