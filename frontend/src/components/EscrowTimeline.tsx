import { EscrowStatus, Order } from '@/types';
import { LucideArrowRight, LucideCheckCircle, LucideClock, LucideCircle, LucidePackage } from 'lucide-react';
import styles from './EscrowTimeline.module.css';

/**
 * Visual timeline component for an order's escrow lifecycle.
 * Mirrors the Laravel escrow_status enum (pending → escrow_locked → shipped → received → released).
 * Uses Lucide icons and ARIA attributes for accessibility.
 */
export const EscrowTimeline = ({ escrowStatus }: { escrowStatus: EscrowStatus }) => {
  const steps: { label: string; value: EscrowStatus; Icon: React.ComponentType<any> }[] = [
    { label: 'Fonds Verrouillés', value: 'escrow_locked', Icon: LucideLock },
    { label: 'Expédié', value: 'shipped', Icon: LucidePackage },
    { label: 'Réceptionné', value: 'received', Icon: LucideCheckCircle },
    { label: 'Fonds Libérés', value: 'released', Icon: LucideArrowRight },
  ];

  // Determine which steps are completed based on current status order
  const statusOrder: EscrowStatus[] = ['pending', 'escrow_locked', 'shipped', 'received', 'released'];
  const currentIndex = statusOrder.indexOf(escrowStatus);

  return (
    <div className={styles.timeline} role="list" aria-label="Statut d'entiercement">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent   = idx === currentIndex;
        const stepClass   = isCompleted ? styles.completed : isCurrent ? styles.current : styles.pending;
        return (
          <div key={step.value} className={stepClass} role="listitem" aria-current={isCurrent ? 'step' : undefined}>
            <step.Icon className={styles.icon} aria-hidden="true" />
            <span className={styles.label}>{step.label}</span>
            {idx < steps.length - 1 && <div className={styles.connector} aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
};

// Simple lock icon component using Lucide's generic "Circle" with a padlock shape via CSS.
function LucideLock(props: any) {
  return <LucideCircle {...props} className={`${props.className} ${styles.lockIcon}`} />;
}
