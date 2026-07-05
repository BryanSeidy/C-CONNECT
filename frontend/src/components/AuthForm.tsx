'use client';

import Link from 'next/link';
import { Eye, EyeOff, Loader2, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import styles from './AuthForm.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthRole = 'buyer' | 'seller';

interface AuthFormProps {
  type: 'login' | 'register';
  title: string;
  subtitle: string;
  submitText: string;
  onSubmit: (email: string, password: string, fullName: string, role: AuthRole) => Promise<void>;
  alternateHref?: string;
  successMessage?: string;
  initialRole?: AuthRole;
}

type FieldKey = 'email' | 'password' | 'fullName';
type FieldErrors = Partial<Record<FieldKey, string>>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide.'),
  password: z.string().min(6, 'Au moins 6 caractères.'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nom complet requis (min. 2 caractères).'),
  email: z.string().email('Adresse email invalide.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
});

function parseErrors(error: unknown): FieldErrors {
  if (!(error instanceof z.ZodError)) return {};
  return error.errors.reduce<FieldErrors>((acc, e) => {
    const key = e.path[0] as FieldKey;
    if (key && !acc[key]) acc[key] = e.message;
    return acc;
  }, {});
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue. Veuillez réessayer.';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AuthForm = ({
  type,
  title,
  subtitle,
  submitText,
  onSubmit,
  alternateHref,
  successMessage,
  initialRole = 'buyer',
}: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<AuthRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const fallbackHref = type === 'login' ? '/register' : '/login';
  const resolvedAltHref = alternateHref ?? fallbackHref;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    // Validation client
    const schema = type === 'login' ? loginSchema : registerSchema;
    const parsed = schema.safeParse({ email: email.trim(), password, fullName: fullName.trim() });

    if (!parsed.success) {
      setFieldErrors(parseErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email.trim().toLowerCase(), password, fullName.trim(), role);
    } catch (err: unknown) {
      setGlobalError(extractMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* En-tête */}
        <div className={styles.header}>
          <div className={styles.logo}>C</div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        {/* Message de succès */}
        {successMessage && (
          <div role="status" className={styles.alertSuccess}>
            {successMessage}
          </div>
        )}

        {/* Message d'erreur global */}
        {globalError && (
          <div role="alert" className={styles.alertError}>
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>

          {/* Nom complet (register uniquement) */}
          {type === 'register' && (
            <FieldGroup
              id="fullName"
              label="Nom complet"
              error={fieldErrors.fullName}
            >
              <div className={`${styles.inputWrap} ${fieldErrors.fullName ? styles.hasError : ''}`}>
                <UserIcon size={16} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="fullName"
                  type="text"
                  className={styles.input}
                  placeholder="Jean Mbarga"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'err-fullName' : undefined}
                />
              </div>
            </FieldGroup>
          )}

          {/* Email */}
          <FieldGroup id="email" label="Adresse email" error={fieldErrors.email}>
            <div className={`${styles.inputWrap} ${fieldErrors.email ? styles.hasError : ''}`}>
              <Mail size={16} className={styles.inputIcon} aria-hidden="true" />
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="vous@entreprise.cm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'err-email' : undefined}
              />
            </div>
          </FieldGroup>

          {/* Mot de passe */}
          <FieldGroup id="password" label="Mot de passe" error={fieldErrors.password}>
            <div className={`${styles.inputWrap} ${fieldErrors.password ? styles.hasError : ''}`}>
              <Lock size={16} className={styles.inputIcon} aria-hidden="true" />
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className={`${styles.input} ${styles.inputPadRight}`}
                placeholder={type === 'register' ? 'Min. 8 caractères' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={type === 'login' ? 'current-password' : 'new-password'}
                required
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'err-password' : undefined}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                tabIndex={0}
              >
                {showPwd
                  ? <EyeOff size={16} aria-hidden="true" />
                  : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </FieldGroup>

          {/* Rôle (register uniquement) */}
          {type === 'register' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="role" className={styles.label}>
                Rôle sur la plateforme
              </label>
              <div className={styles.roleGrid}>
                {(['buyer', 'seller'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`${styles.roleBtn} ${role === r ? styles.roleBtnActive : ''}`}
                    onClick={() => setRole(r)}
                    aria-pressed={role === r}
                  >
                    <span className={styles.roleBtnTitle}>
                      {r === 'buyer' ? 'Acheteur B2B' : 'Fournisseur'}
                    </span>
                    <span className={styles.roleBtnSub}>
                      {r === 'buyer'
                        ? 'Restaurants, hôtels, grossistes...'
                        : 'Producteurs, coopératives...'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={styles.submit}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
                Chargement…
              </>
            ) : submitText}
          </button>
        </form>

        {/* Lien alternatif */}
        <p className={styles.altLink}>
          {type === 'login'
            ? <>Pas encore de compte ?&nbsp;<Link href={resolvedAltHref} className={styles.link}>S&apos;inscrire</Link></>
            : <>Déjà un compte ?&nbsp;<Link href={resolvedAltHref} className={styles.link}>Se connecter</Link></>}
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helper sub-component
// ---------------------------------------------------------------------------

function FieldGroup({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      {children}
      {error && (
        <span id={`err-${id}`} className={styles.fieldError} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
