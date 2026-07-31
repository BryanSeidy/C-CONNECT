'use client';

import React from 'react';
import { Check } from 'lucide-react';
import styles from './OnboardingStepper.module.css';

export interface OnboardingStep {
  label: string;
  done: boolean;
}

interface OnboardingStepperProps {
  title: string;
  subtitle: string;
  steps: OnboardingStep[];
}

/**
 * Stepper de progression d'onboarding — horizontal, mobile-first, sans emoji.
 * Le premier pas "non fait" est mis en évidence comme étape courante.
 * Utilisé pour transformer une simple checklist en parcours gamifié :
 * la barre de progression + le pourcentage donnent une sensation de jeu
 * (proche de patterns SaaS "profile completion"), sans sacrifier le
 * sérieux attendu d'une plateforme B2B.
 */
export function OnboardingStepper({ title, subtitle, steps }: OnboardingStepperProps) {
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const currentIndex = steps.findIndex((s) => !s.done);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <span className={styles.pctBadge}>{pct}%</span>
      </div>

      <div className={styles.track} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.trackFill} style={{ width: `${pct}%` }} />
      </div>

      <ol className={styles.steps}>
        {steps.map((step, i) => {
          const isCurrent = i === currentIndex;
          const state = step.done ? 'done' : isCurrent ? 'current' : 'upcoming';
          return (
            <li key={step.label} className={styles.step} data-state={state}>
              <span className={styles.dot} aria-hidden="true">
                {step.done ? <Check size={14} strokeWidth={3} /> : <span className={styles.dotInner} />}
              </span>
              <span className={styles.stepLabel}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default OnboardingStepper;
