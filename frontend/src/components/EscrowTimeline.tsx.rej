import { EscrowStatus } from '@/types';
import { CheckCircle2, Circle, Package, ShieldCheck, Truck } from 'lucide-react';
import styles from './EscrowTimeline.module.css';

/**
 * Visual timeline component for an order's escrow lifecycle.
 * Mirrors the Laravel B2B escrow_status enum:
 * pending → escrow_locked → en_preparation → expedie → en_transit → livre → complete.
 * 'annule' and 'dispute' are terminal/exception states shown separately.
 */
const STEPS: { label: string; value: EscrowStatus; Icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'Séquestre verrouillé', value: 'escrow_locked', Icon: ShieldCheck },
  { label: 'En préparation', value: 'en_preparation', Icon: Package },
  { label: 'Expédié', value: 'expedie', Icon: Truck },
  { label: 'Livré', value: 'livre', Icon: CheckCircle2 },
  { label: 'Fonds libérés', value: 'complete', Icon: CheckCircle2 },
];

const STATUS_ORDER: EscrowStatus[] = [
  'pending',
  'escrow_locked',
  'en_preparation',
  'expedie',
  'en_transit',
  'livre',
  'complete',
];

export const EscrowTimeline = ({ escrowStatus }: { escrowStatus: EscrowStatus }) => {
  if (escrowStatus === 'annule') {
    return <div className={styles.exceptionBadge} data-tone="cancelled">Commande annulée</div>;
  }

  if (escrowStatus === 'dispute') {
    return <div className={styles.exceptionBadge} data-tone="dispute">Litige en cours — fonds bloqués</div>;
  }

  const currentIndex = STATUS_ORDER.indexOf(escrowStatus);

  return (
    <div className={styles.timeline} role="list" aria-label="Statut d'entiercement">
      {STEPS.map((step, idx) => {
        const stepIndex = STATUS_ORDER.indexOf(step.value);
        const isCompleted = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const stepClass = isCompleted ? styles.completed : isCurrent ? styles.current : styles.pending;
        const Icon = isCompleted || isCurrent ? step.Icon : Circle;
        return (
          <div key={step.value} className={stepClass} role="listitem" aria-current={isCurrent ? 'step' : undefined}>
            <Icon className={styles.icon} aria-hidden="true" />
            <span className={styles.label}>{step.label}</span>
            {idx < STEPS.length - 1 && <div className={styles.connector} aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
};
