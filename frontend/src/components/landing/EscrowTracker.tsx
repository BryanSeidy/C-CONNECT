import { Check } from 'lucide-react';
import styles from './EscrowTracker.module.css';

export type EscrowStep = {
  label: string;
  state: 'done' | 'active' | 'pending';
};

const defaultSteps: EscrowStep[] = [
  { label: 'Commande confirmée', state: 'done' },
  { label: 'Paiement reçu en séquestre', state: 'done' },
  { label: 'Marchandise expédiée', state: 'active' },
  { label: 'Réception confirmée — fonds libérés', state: 'pending' },
];

export function EscrowTracker({
  steps = defaultSteps,
  compact = false,
}: {
  steps?: EscrowStep[];
  compact?: boolean;
}) {
  return (
    <ol className={`${styles.tracker} ${compact ? styles.compact : ''}`}>
      {steps.map((step, index) => (
        <li className={styles.step} key={step.label} data-state={step.state}>
          <span className={styles.marker} aria-hidden="true">
            {step.state === 'done' ? <Check size={compact ? 11 : 13} strokeWidth={3} /> : null}
          </span>
          <span className={styles.label}>{step.label}</span>
          {index < steps.length - 1 ? <span className={styles.connector} aria-hidden="true" /> : null}
        </li>
      ))}
    </ol>
  );
}
