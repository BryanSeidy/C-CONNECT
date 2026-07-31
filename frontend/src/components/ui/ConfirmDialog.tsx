'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' (rouge, action irréversible) ou 'default' (neutre). */
  tone?: 'danger' | 'default';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const handle = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className={styles.overlay} role="presentation" onClick={() => handle(false)}>
          <div
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.iconWrap} data-tone={state.options.tone ?? 'default'}>
              <AlertTriangle size={22} aria-hidden="true" />
            </div>
            <h2 id="confirm-dialog-title" className={styles.title}>{state.options.title}</h2>
            <p id="confirm-dialog-message" className={styles.message}>{state.options.message}</p>
            <div className={styles.actions}>
              <Button variant="outline" onClick={() => handle(false)}>
                {state.options.cancelLabel ?? 'Annuler'}
              </Button>
              <Button
                variant={state.options.tone === 'danger' ? 'danger' : 'primary'}
                onClick={() => handle(true)}
              >
                {state.options.confirmLabel ?? 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

/**
 * Remplace window.confirm par une modale brandée, cohérente avec le design
 * system. Usage : `const confirm = useConfirm(); const ok = await confirm({...})`.
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm doit être utilisé à l\'intérieur de <ConfirmDialogProvider>');
  }
  return ctx;
}
