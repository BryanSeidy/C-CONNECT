'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2, ChevronRight, Loader2,
  Phone, RefreshCw, ShieldCheck, Smartphone,
} from 'lucide-react';
import { apiClient } from '@/services/api';
import styles from './PaymentPanel.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentMethod = 'mtn_momo' | 'orange_money';
type PaymentStep   = 'select' | 'phone' | 'pending_pin' | 'success' | 'error';

interface PaymentPanelProps {
  orderId: string;
  amountXaf: number;
  onSuccess?: (transactionRef: string) => void;
}

interface InitiateResponse {
  success: boolean;
  data: {
    transaction_reference: string;
    pay_token?: string;
    amount: number;
    currency: string;
    payment_method: string;
    mode?: 'omapi' | 'simulation';
    status?: string;
    instructions: string;
    order_id: string;
    poll_url?: string;
  };
}

interface StatusResponse {
  success: boolean;
  data: {
    status: 'pending' | 'successful' | 'failed' | string;
    order_status: string;
    transaction_reference: string | null;
    pay_token?: string | null;
    message?: string;
  };
}

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Badges opérateur — texte-dans-forme aux couleurs de marque publiques
 * (jaune MTN, orange Orange), pattern standard des pages de paiement pour
 * indiquer un moyen de paiement sans reproduire un logo vectoriel officiel.
 * À remplacer par les vrais assets de marque dès qu'obtenus (voir
 * docs/payment-integration-orange-mtn.md §3).
 */
function MtnMomoBadge() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="17" fill="#FFCC00" />
      <text x="17" y="21" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#1A1A1A" fontFamily="Arial, sans-serif">
        MTN
      </text>
    </svg>
  );
}

function OrangeMoneyBadge() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <rect x="0" y="0" width="34" height="34" rx="9" fill="#FF6600" />
      <text x="17" y="20" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        orange
      </text>
      <text x="17" y="27" textAnchor="middle" fontSize="5.5" fontWeight="600" fill="#fff" fontFamily="Arial, sans-serif" opacity="0.9">
        money
      </text>
    </svg>
  );
}

function MethodCard({
  method,
  selected,
  onSelect,
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
}) {
  const isMtn = method === 'mtn_momo';

  return (
    <button
      type="button"
      className={`${styles.methodCard} ${selected ? styles.methodSelected : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
      style={selected ? { borderColor: isMtn ? '#FCD34D' : '#FB923C' } : undefined}
    >
      <div className={styles.methodLogo} aria-hidden="true">
        {isMtn ? <MtnMomoBadge /> : <OrangeMoneyBadge />}
      </div>

      <div className={styles.methodInfo}>
        <span
          className={styles.methodName}
          style={{ color: isMtn ? '#78350F' : '#7C2D12' }}
        >
          {isMtn ? 'MTN Mobile Money' : 'Orange Money'}
        </span>
        <span className={styles.methodSub}>
          {isMtn ? 'Reseau MTN — 67X / 650-654 / 680-684' : 'Reseau Orange — 69X / 655-659 / 685-689'}
        </span>
      </div>

      <div className={`${styles.methodCheck} ${selected ? styles.methodCheckActive : ''}`} aria-hidden="true">
        {selected && <CheckCircle2 size={16} />}
      </div>
    </button>
  );
}

// ── Status Tracker ────────────────────────────────────────────────────────────

type TrackStep = { label: string; done: boolean; active: boolean };

function StatusTracker({ step }: { step: PaymentStep }) {
  const steps: TrackStep[] = [
    { label: 'Methode choisie',     done: step !== 'select', active: step === 'select' },
    { label: 'Numero confirme',     done: ['pending_pin','success'].includes(step), active: step === 'phone' },
    { label: 'Validation PIN',      done: step === 'success', active: step === 'pending_pin' },
    { label: 'Sequestre active',    done: false, active: step === 'success' },
  ];

  return (
    <div className={styles.tracker} role="list" aria-label="Progression du paiement">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div
            className={`${styles.trackerStep} ${s.done ? styles.trackerDone : ''} ${s.active ? styles.trackerActive : ''}`}
            role="listitem"
          >
            <div className={styles.trackerDot} aria-hidden="true">
              {s.done ? <CheckCircle2 size={13} /> : <span>{i + 1}</span>}
            </div>
            <span className={styles.trackerLabel}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`${styles.trackerLine} ${s.done ? styles.trackerLineDone : ''}`} aria-hidden="true" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PaymentPanel({ orderId, amountXaf, onSuccess }: PaymentPanelProps) {
  const [step,         setStep]         = useState<PaymentStep>('select');
  const [method,       setMethod]       = useState<PaymentMethod | null>(null);
  const [phone,        setPhone]        = useState('');
  const [phoneError,   setPhoneError]   = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [txRef,        setTxRef]        = useState<string | null>(null);
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);
  const [pollHint,     setPollHint]     = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartedAt = useRef<number>(0);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const validatePhone = (value: string): boolean => {
    const normalized = value.startsWith('+237') ? value : `+237${value.replace(/^0+/, '')}`;
    return /^\+237[0-9]{9}$/.test(normalized);
  };

  const normalizePhone = (value: string): string => {
    const digits = value.replace(/[^\d]/g, '');
    if (digits.startsWith('237')) return `+${digits}`;
    if (digits.startsWith('0'))   return `+237${digits.slice(1)}`;
    return `+237${digits}`;
  };

  const handleMethodSelect = (m: PaymentMethod) => {
    setMethod(m);
    setStep('phone');
  };

  const pollOrangeStatus = (reference: string) => {
    stopPolling();
    pollStartedAt.current = Date.now();
    setPollHint('En attente de la confirmation Orange Money…');

    const tick = async () => {
      if (Date.now() - pollStartedAt.current > POLL_TIMEOUT_MS) {
        stopPolling();
        setErrorMsg('Delai depasse. Si vous avez valide le PIN, actualisez le statut de la commande.');
        setStep('error');
        setLoading(false);
        return;
      }

      try {
        const statusRes = await apiClient.get<unknown, StatusResponse>(
          `/payments/mobile-money/status?order_id=${encodeURIComponent(orderId)}`
        );

        const status = statusRes.data.status;

        if (status === 'successful') {
          stopPolling();
          setTxRef(statusRes.data.transaction_reference ?? reference);
          setStep('success');
          setLoading(false);
          onSuccess?.(statusRes.data.transaction_reference ?? reference);
          return;
        }

        if (status === 'failed') {
          stopPolling();
          setErrorMsg('Le paiement Orange Money a ete refuse ou a echoue.');
          setStep('error');
          setLoading(false);
          return;
        }

        setPollHint(statusRes.data.message ?? 'Validez le PIN sur votre telephone…');
      } catch {
        setPollHint('Verification en cours…');
      }
    };

    void tick();
    pollTimerRef.current = setInterval(() => { void tick(); }, POLL_INTERVAL_MS);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    const normalized = normalizePhone(phone);

    if (!validatePhone(normalized)) {
      setPhoneError('Entrez un numero camerounais valide (ex: 6XXXXXXXX).');
      return;
    }

    if (!method) return;

    setLoading(true);
    setStep('pending_pin');
    setPollHint(null);

    try {
      const initRes = await apiClient.post<unknown, InitiateResponse>(
        '/payments/mobile-money/initiate',
        {
          order_id:       orderId,
          phone:          normalized,
          payment_method: method,
        }
      );

      setTxRef(initRes.data.transaction_reference);

      // Orange OMAPI réel : polling /mp/paymentstatus via le backend
      if (method === 'orange_money' && initRes.data.mode === 'omapi') {
        pollOrangeStatus(initRes.data.transaction_reference);
        return;
      }

      // MTN / Orange simulation : confirme via l'endpoint de simulation
      await apiClient.post('/payments/mobile-money', {
        order_id: orderId,
        phone: normalized,
        provider: method === 'mtn_momo' ? 'MTN' : 'Orange',
      });

      setStep('success');
      onSuccess?.(initRes.data.transaction_reference);
      setLoading(false);
    } catch (err: unknown) {
      stopPolling();
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Erreur lors de l\'initiation du paiement.';
      setErrorMsg(msg);
      setStep('error');
      setLoading(false);
    }
  };

  const reset = () => {
    stopPolling();
    setStep('select');
    setMethod(null);
    setPhone('');
    setPhoneError(null);
    setErrorMsg(null);
    setTxRef(null);
    setPollHint(null);
    setLoading(false);
  };

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <ShieldCheck size={18} aria-hidden="true" className={styles.headerIcon} />
        <div>
          <h2 className={styles.title}>Activer le Sequestre</h2>
          <p className={styles.titleSub}>Paiement securise — fonds retenus jusqu&apos;a reception</p>
        </div>
      </div>

      {/* Amount */}
      <div className={styles.amountRow}>
        <span className={styles.amountLabel}>Montant a regler</span>
        <span className={styles.amount}>{amountXaf.toLocaleString('fr-FR')} FCFA</span>
      </div>

      {/* Tracker */}
      <StatusTracker step={step} />

      {/* Step: select method */}
      {step === 'select' && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Choisissez votre operateur</p>
          <div className={styles.methods}>
            <MethodCard method="mtn_momo"     selected={method === 'mtn_momo'}     onSelect={() => handleMethodSelect('mtn_momo')} />
            <MethodCard method="orange_money" selected={method === 'orange_money'} onSelect={() => handleMethodSelect('orange_money')} />
          </div>
        </div>
      )}

      {/* Step: phone entry */}
      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className={styles.section} noValidate>
          <p className={styles.sectionLabel}>
            Votre numero {method === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}
          </p>

          <div className={styles.phoneRow}>
            <div className={styles.countryCode} aria-label="Code pays Cameroun">
              <Phone size={14} aria-hidden="true" />
              +237
            </div>
            <input
              type="tel"
              inputMode="numeric"
              className={`${styles.phoneInput} ${phoneError ? styles.phoneInputError : ''}`}
              placeholder="6XXXXXXXX"
              value={phone}
              onChange={e => {
                setPhone(e.target.value.replace(/[^\d]/g, ''));
                setPhoneError(null);
              }}
              maxLength={9}
              aria-label="Numero de telephone"
              aria-invalid={Boolean(phoneError)}
              aria-describedby={phoneError ? 'phone-error' : undefined}
              autoFocus
              required
            />
          </div>

          {phoneError && (
            <span id="phone-error" className={styles.fieldError} role="alert">
              {phoneError}
            </span>
          )}

          <div className={styles.btnRow}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setStep('select')}
            >
              Retour
            </button>
            <button
              type="submit"
              className={styles.ctaBtn}
              disabled={loading || phone.length < 9}
            >
              {loading ? (
                <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
              ) : (
                <ChevronRight size={16} aria-hidden="true" />
              )}
              Activer le Sequestre ({amountXaf.toLocaleString('fr-FR')} FCFA)
            </button>
          </div>
        </form>
      )}

      {/* Step: pending PIN */}
      {step === 'pending_pin' && (
        <div className={styles.pendingState}>
          <div className={`${styles.pendingIcon} ${styles.phonePulse}`} aria-hidden="true">
            <Smartphone size={26} strokeWidth={1.75} />
          </div>
          <h3 className={styles.pendingTitle}>En attente de confirmation</h3>
          <p className={styles.pendingMsg}>
            {pollHint
              ?? 'Veuillez valider le message de debit sur votre telephone en tapant votre code PIN.'}
          </p>
          <div className={styles.pendingHint}>
            <span className={styles.pendingHintLabel}>Reference transaction</span>
            <code className={styles.pendingRef}>{txRef ?? '...'}</code>
          </div>
        </div>
      )}

      {/* Step: success */}
      {step === 'success' && (
        <div className={`${styles.pendingState} ${styles.successState}`}>
          <div className={`${styles.pendingIcon} ${styles.successIcon}`} aria-hidden="true">
            <CheckCircle2 size={28} />
          </div>
          <h3 className={styles.pendingTitle}>Sequestre active</h3>
          <p className={styles.pendingMsg}>
            Vos fonds sont securises. Le fournisseur va maintenant preparer et expedier votre commande.
            Les fonds seront liberes apres votre confirmation de reception.
          </p>
          <code className={styles.pendingRef}>{txRef}</code>
        </div>
      )}

      {/* Step: error */}
      {step === 'error' && (
        <div className={`${styles.pendingState} ${styles.errorState}`}>
          <p className={styles.errorMsg}>{errorMsg}</p>
          <button type="button" className={styles.backBtn} onClick={reset}>
            <RefreshCw size={14} aria-hidden="true" />
            Reessayer
          </button>
        </div>
      )}
    </div>
  );
}
