'use client';

import React, { useState } from 'react';
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
    amount: number;
    currency: string;
    payment_method: string;
    instructions: string;
    order_id: string;
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
      <div
        className={styles.methodLogo}
        style={{ background: isMtn ? 'rgba(252,211,77,0.1)' : 'rgba(251,146,60,0.1)' }}
        aria-hidden="true"
      >
        <Smartphone
          size={22}
          strokeWidth={1.75}
          style={{ color: isMtn ? '#B45309' : '#C2410C' }}
        />
      </div>

      <div className={styles.methodInfo}>
        <span
          className={styles.methodName}
          style={{ color: isMtn ? '#78350F' : '#7C2D12' }}
        >
          {isMtn ? 'MTN Mobile Money' : 'Orange Money'}
        </span>
        <span className={styles.methodSub}>
          {isMtn ? 'Reseau MTN — +237 6[5-9]X' : 'Reseau Orange — +237 6[9-6]X'}
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

    try {
      const res = await apiClient.post<unknown, InitiateResponse>(
        '/payments/mobile-money/initiate',
        {
          order_id:       orderId,
          phone:          normalized,
          payment_method: method,
        }
      );

      setTxRef(res.data.transaction_reference);

      // Simulation : dans la vraie implementation, on attend le webhook
      // Ici on simule un delai de traitement
      await new Promise(resolve => setTimeout(resolve, 8000));

      setStep('success');
      onSuccess?.(res.data.transaction_reference);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Erreur lors de l\'initiation du paiement.';
      setErrorMsg(msg);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('select');
    setMethod(null);
    setPhone('');
    setPhoneError(null);
    setErrorMsg(null);
    setTxRef(null);
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
              disabled={loading || phone.length < 8}
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
          <div className={styles.pendingIcon} aria-hidden="true">
            <Loader2 size={28} className={styles.spinner} />
          </div>
          <h3 className={styles.pendingTitle}>En attente de confirmation</h3>
          <p className={styles.pendingMsg}>
            Veuillez valider le message de debit sur votre telephone en tapant votre code PIN.
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
