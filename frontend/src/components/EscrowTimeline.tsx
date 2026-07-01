'use client';

import React from 'react';
import { CheckCircle2, Circle, LucideIcon, Package, ShieldCheck, Truck } from 'lucide-react';
import { EscrowStatus } from '@/types';
import styles from './EscrowTimeline.module.css';

type Step = {
  value: EscrowStatus;
  label: string;
  Icon: LucideIcon;
};

const STEPS: Step[] = [
  { value: 'escrow_locked', label: 'Séquestre', Icon: ShieldCheck },
  { value: 'en_preparation', label: 'Préparation', Icon: Package },
  { value: 'expedie', label: 'Expédié', Icon: Truck },
  { value: 'livre', label: 'Livré', Icon: CheckCircle2 },
];

const STATUS_ORDER: EscrowStatus[] = [
  'pending', 'escrow_locked', 'en_preparation',
  'expedie', 'en_transit', 'livre', 'complete',
];

export const EscrowTimeline = ({ escrowStatus }: { escrowStatus: EscrowStatus }) => {
  if (escrowStatus === 'annule') {
    return <span className={`${styles.pill} ${styles.cancelled}`}>Annulé</span>;
  }
  if (escrowStatus === 'dispute') {
    return <span className={`${styles.pill} ${styles.dispute}`}>Litige — fonds bloqués</span>;
  }

  const currentIndex = STATUS_ORDER.indexOf(escrowStatus);

  return (
    <div className={styles.track} role="list" aria-label="Progression de la commande">
      {STEPS.map((step, i) => {
        const stepIndex = STATUS_ORDER.indexOf(step.value);
        const done = stepIndex < currentIndex;
        const current = step.value === escrowStatus ||
          (escrowStatus === 'en_transit' && step.value === 'expedie') ||
          (escrowStatus === 'complete' && step.value === 'livre');

        const Icon = done || current ? step.Icon : Circle;
        const cls = done ? styles.done : current ? styles.current : styles.pending;

        return (
          <React.Fragment key={step.value}>
            <div className={`${styles.step} ${cls}`} role="listitem">
              <div className={styles.dot}>
                <Icon size={12} aria-hidden="true" />
              </div>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`${styles.line} ${done ? styles.lineDone : ''}`} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
